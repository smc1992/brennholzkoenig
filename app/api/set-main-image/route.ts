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
    console.warn('Supabase environment variables not configured for app-api-set-main-image-route route');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { productId, imageId } = await request.json();
    
    if (!productId || !imageId) {
      return Response.json({ 
        error: 'Product ID und Image ID sind erforderlich' 
      }, { status: 400 });
    }
    
    // Prüfe, ob das Bild zu diesem Produkt gehört
    const { data: targetImage, error: imageError } = await supabase
      .from('image_mappings')
      .select('id, seo_slug, product_id')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single();
    
    if (imageError || !targetImage) {
      return Response.json({ 
        error: 'Bild nicht gefunden oder gehört nicht zu diesem Produkt' 
      }, { status: 404 });
    }
    
    // Beginne Transaktion: Alle anderen Bilder als nicht-Hauptbild markieren
    const { error: resetError } = await supabase
      .from('image_mappings')
      .update({ is_main_image: false })
      .eq('product_id', productId);
    
    if (resetError) {
      console.error('Error resetting main images:', resetError);
      return Response.json({ 
        error: 'Fehler beim Zurücksetzen der Hauptbilder' 
      }, { status: 500 });
    }
    
    // Setze das neue Hauptbild
    const { error: setMainError } = await supabase
      .from('image_mappings')
      .update({ is_main_image: true })
      .eq('id', imageId);
    
    if (setMainError) {
      console.error('Error setting main image:', setMainError);
      return Response.json({ 
        error: 'Fehler beim Setzen des Hauptbildes' 
      }, { status: 500 });
    }
    
    // Aktualisiere die products-Tabelle mit der neuen Hauptbild-URL
    const newMainImageUrl = `/images/${targetImage.seo_slug}`;
    const { error: updateProductError } = await supabase
      .from('products')
      .update({ 
        image_url: newMainImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);
    
    if (updateProductError) {
      console.error('Error updating product main image:', updateProductError);
      // Warnung loggen, aber nicht fehlschlagen lassen
    }
    
    console.log(`Main image set for product ${productId}: ${newMainImageUrl}`);
    
    return Response.json({
      success: true,
      data: {
        productId,
        imageId,
        newMainImageUrl,
        seoSlug: targetImage.seo_slug
      }
    });
    
  } catch (error) {
    console.error('Set main image API error:', error);
    return Response.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 });
  }
}

// OPTIONS für CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}