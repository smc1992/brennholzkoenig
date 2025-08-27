import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { generateStorageFilename, generateImageSlug, createImageMapping } from '@/utils/seo';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
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
    
    // Image-Mapping in der Datenbank speichern
    const imageMapping = createImageMapping(product, storageFilename, file.name);
    
    const { data: mappingData, error: mappingError } = await supabase
      .from('image_mappings')
      .insert({
        seo_slug: imageMapping.seoSlug,
        storage_filename: imageMapping.storageFilename,
        product_id: product.id || null
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
    
    // Erfolgreiche Response mit allen URLs
    return Response.json({
      success: true,
      data: {
        storageFilename,
        seoSlug: imageMapping.seoSlug,
        seoUrl: `/images/${imageMapping.seoSlug}`,
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