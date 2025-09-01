import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
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