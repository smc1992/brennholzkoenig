import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { isValidSlug } from '@/utils/seo';

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
    console.warn('Supabase environment variables not configured for app-api-images-[slug]-route route');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const slug = params.slug;
    
    // Validierung des SEO-Slugs
    if (!isValidSlug(slug)) {
      return new Response('Invalid image slug', { status: 400 });
    }
    
    // Image-Mapping aus der Datenbank abrufen
    const { data: mapping, error: mappingError } = await supabase
      .from('image_mappings')
      .select('storage_filename, product_id')
      .eq('seo_slug', slug)
      .single();
    
    if (mappingError || !mapping) {
      console.error('Image mapping not found:', mappingError);
      return new Response('Image not found', { status: 404 });
    }
    
    // Datei aus Supabase Storage laden
    const { data: imageData, error: storageError } = await supabase.storage
      .from('products')
      .download(mapping.storage_filename);
    
    if (storageError || !imageData) {
      console.error('Storage error:', storageError);
      return new Response('Image not found in storage', { status: 404 });
    }
    
    // MIME-Type basierend auf Dateiendung bestimmen
    const extension = slug.split('.').pop()?.toLowerCase();
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
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
        'Vary': 'Accept-Encoding',
        // SEO-optimierte Header
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // CORS für CDN-Nutzung
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': '86400'
      }
    });
    
  } catch (error) {
    console.error('SEO Image API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// OPTIONS für CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}