import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client mit Anon Key (für öffentliche Storage-Zugriffe)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
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
    
    // MIME-Type basierend auf Dateiendung bestimmen
    const extension = filename.split('.').pop()?.toLowerCase();
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
    
    // Response mit optimalen Cache-Headern
    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
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