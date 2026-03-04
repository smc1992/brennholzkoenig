import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Runtime-Konfiguration für Node.js Kompatibilität
export const runtime = 'nodejs';

// Verhindert Pre-rendering während des Builds
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Supabase Client wird zur Laufzeit erstellt
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not configured for CDN route');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return new Response('CDN service not configured', { status: 503 });
    }

    const filename = params.path.join('/');
    
    // Sicherheitscheck: Nur Dateien aus dem products-Bucket erlauben
    if (!filename.startsWith('products/')) {
      return new Response('Forbidden', { status: 403 });
    }
    
    let actualFilename = filename.replace('products/', '');
    
    // Prüfen, ob es sich um einen SEO-Slug handelt
    if (actualFilename.includes('-') && !actualFilename.match(/^\d+-[a-z0-9]+\./)) {
      // Versuche SEO-Slug zu Storage-Dateiname aufzulösen
      const originalSlug = actualFilename;
      const { data: mappingData } = await supabase
        .from('image_mappings')
        .select('storage_filename')
        .eq('seo_slug', originalSlug)
        .single();
      
      if (mappingData?.storage_filename) {
        actualFilename = mappingData.storage_filename;
        console.log(`CDN: SEO-Slug ${originalSlug} aufgelöst zu ${mappingData.storage_filename}`);
      }
    }
    
    // Datei aus Supabase Storage laden
    const { data, error } = await supabase.storage
      .from('products')
      .download(actualFilename);
    
    if (error || !data) {
      console.error('Storage error:', error);
      return new Response('Image not found', { status: 404 });
    }
    
    // MIME-Type basierend auf der aufgelösten Dateiendung bestimmen
    const extension = actualFilename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // Response ohne aggressive Caching für sofortige Updates
    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Vary': 'Accept-Encoding',
        // DSGVO-konforme Header
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
    
  } catch (error) {
    console.error('CDN Proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}