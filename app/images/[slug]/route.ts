import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // Sicherheitscheck: Nur Bild-Dateien erlauben
    if (!slug.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
      return new Response('Invalid file type', { status: 400 });
    }
    
    let actualFilename = slug;
    
    // Prüfen, ob es sich um einen SEO-Slug handelt
    if (slug.includes('-') && !slug.match(/^\d+-[a-z0-9]+\./)) {
      // SEO-Slug zu Storage-Dateiname auflösen
      const { data: mappingData } = await supabase
        .from('image_mappings')
        .select('storage_filename')
        .eq('seo_slug', slug)
        .single();
      
      if (mappingData?.storage_filename) {
        actualFilename = mappingData.storage_filename;
        console.log(`Images: SEO-Slug ${slug} aufgelöst zu ${mappingData.storage_filename}`);
      } else {
        console.log(`Images: Kein Mapping für SEO-Slug ${slug} gefunden`);
        return new Response('Image not found', { status: 404 });
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
    
    // Cache-Header setzen (1 Jahr)
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': `"${actualFilename}"`,
    });
    
    return new Response(data, { headers });
    
  } catch (error) {
    console.error('Images route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}