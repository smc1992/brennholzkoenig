import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { generateStorageFilename, generateImageSlug, createImageMapping } from '@/utils/seo';

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
    console.warn('Supabase environment variables not configured for app-api-upload-product-image-route route');
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productData = formData.get('productData') as string;
    
    if (!file) {
      return Response.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }
    
    // Produktdaten optional - Fallback-Werte verwenden wenn nicht vorhanden
    let product = {
      name: 'Neues Produkt',
      category: 'Brennholz',
      wood_type: 'Buche',
      size: '25cm',
      id: undefined
    };
    
    if (productData) {
      try {
        const parsedData = JSON.parse(productData);
        product = { ...product, ...parsedData };
        console.log('API: Empfangene Produktdaten:', parsedData);
        console.log('API: Finales Product-Objekt:', product);
      } catch (error) {
        console.warn('Produktdaten konnten nicht geparst werden, verwende Fallback-Werte');
      }
    } else {
      console.log('API: Keine Produktdaten empfangen, verwende Fallback-Werte');
    }
    
    // Validierung der Datei
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'Ungültiger Dateityp. Erlaubt: JPEG, PNG, WebP' 
      }, { status: 400 });
    }
    
    // Dateigröße prüfen (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return Response.json({ 
        error: 'Datei zu groß. Maximum: 5MB' 
      }, { status: 400 });
    }
    
    // Eindeutigen Storage-Dateinamen generieren
    const storageFilename = generateStorageFilename(file.name);
    
    // SEO-freundlichen Slug generieren
    const seoSlug = generateImageSlug(product, file.name);
    console.log('API: Generierter SEO-Slug:', seoSlug);
    console.log('API: Verwendet für Slug - Name:', product.name, 'Category:', product.category);
    
    // Datei zu Supabase Storage hochladen
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(storageFilename, file, {
        cacheControl: '31536000', // 1 Jahr
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return Response.json({ 
        error: 'Fehler beim Hochladen der Datei' 
      }, { status: 500 });
    }
    
    // Bestimme die nächste Bildnummer für dieses Produkt
    let imageIndex = 1;
    let isMainImage = true; // Erstes Bild ist standardmäßig Hauptbild
    
    if (product.id) {
      const { data: existingImages, error: countError } = await supabase
        .from('image_mappings')
        .select('image_index, is_main_image')
        .eq('product_id', product.id)
        .order('image_index', { ascending: false })
        .limit(1);
      
      if (!countError && existingImages && existingImages.length > 0) {
        imageIndex = (existingImages[0].image_index || 0) + 1;
        isMainImage = false; // Weitere Bilder sind nicht automatisch Hauptbilder
      }
    }
    
    // SEO-Slug mit Nummerierung generieren
    const baseSlug = generateImageSlug(product, file.name);
    const numberedSlug = imageIndex === 1 ? baseSlug : baseSlug.replace(/\.(\w+)$/, `-${imageIndex}.$1`);
    
    console.log(`API: Generierter nummerierter SEO-Slug: ${numberedSlug} (Index: ${imageIndex})`);
    
    // Image-Mapping in der Datenbank speichern
    const { data: mappingData, error: mappingError } = await supabase
      .from('image_mappings')
      .insert({
        seo_slug: numberedSlug,
        storage_filename: storageFilename,
        product_id: product.id || null,
        image_order: imageIndex,
        image_index: imageIndex,
        is_main_image: isMainImage
      })
      .select()
      .single();
    
    if (mappingError) {
      console.error('Mapping error:', mappingError);
      
      // Cleanup: Datei aus Storage löschen wenn Mapping fehlschlägt
      await supabase.storage
        .from('products')
        .remove([storageFilename]);
      
      return Response.json({ 
        error: 'Fehler beim Speichern der Bild-Zuordnung' 
      }, { status: 500 });
    }
    
    // Automatische Aktualisierung der products-Tabelle (nur für Hauptbilder)
    if (product.id && isMainImage) {
      const imageUrl = `/images/${numberedSlug}`;
      
      // Prüfe, ob das Produkt bereits ein Hauptbild hat
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', product.id)
        .single();
      
      // Aktualisiere das Hauptbild nur wenn es das erste Bild ist
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);
      
      if (updateError) {
        console.error('Product update error:', updateError);
        // Warnung loggen, aber Upload nicht fehlschlagen lassen
      } else {
        const wasEmpty = !existingProduct?.image_url || existingProduct.image_url === '';
        console.log(`Product ${product.id} main image updated to: ${imageUrl} ${wasEmpty ? '(first image)' : '(replaced existing)'}`);
      }
    } else if (product.id && !isMainImage) {
      console.log(`Product ${product.id} additional image uploaded: ${numberedSlug} (Index: ${imageIndex})`);
    } else {
      console.warn('No product.id provided - automatic image_url update skipped');
    }
    
    // Erfolgreiche Response mit allen URLs
    return Response.json({
      success: true,
      data: {
        storageFilename,
        seoSlug: numberedSlug,
        seoUrl: `/images/${numberedSlug}`,
        cdnUrl: `/api/cdn/products/${storageFilename}`,
        mappingId: mappingData.id,
        fileSize: file.size,
        fileType: file.type
      }
    });
    
  } catch (error) {
    console.error('Upload API error:', error);
    return Response.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 });
  }
}

// Unterstützte HTTP-Methoden
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