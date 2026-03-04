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
    console.warn('Supabase environment variables not configured for app-api-delete-product-image-route route');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function DELETE(request: NextRequest) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const seoSlug = searchParams.get('seoSlug');
    const storageFilename = searchParams.get('storageFilename');
    const mappingId = searchParams.get('mappingId');
    
    if (!seoSlug && !storageFilename && !mappingId) {
      return Response.json({ 
        error: 'Mindestens ein Parameter (seoSlug, storageFilename oder mappingId) ist erforderlich' 
      }, { status: 400 });
    }
    
    // Image-Mapping aus der Datenbank abrufen
    let query = supabase.from('image_mappings').select('*');
    
    if (mappingId) {
      query = query.eq('id', mappingId);
    } else if (seoSlug) {
      query = query.eq('seo_slug', seoSlug);
    } else if (storageFilename) {
      query = query.eq('storage_filename', storageFilename);
    }
    
    const { data: mappingData, error: fetchError } = await query.single();
    
    if (fetchError || !mappingData) {
      return Response.json({ 
        error: 'Bild-Zuordnung nicht gefunden' 
      }, { status: 404 });
    }
    
    // Datei aus Supabase Storage löschen
    const { error: storageError } = await supabase.storage
      .from('products')
      .remove([mappingData.storage_filename]);
    
    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Trotzdem fortfahren, um das Mapping zu löschen
    }
    
    // Image-Mapping aus der Datenbank löschen
    const { error: mappingError } = await supabase
      .from('image_mappings')
      .delete()
      .eq('id', mappingData.id);
    
    if (mappingError) {
      console.error('Mapping deletion error:', mappingError);
      return Response.json({ 
        error: 'Fehler beim Löschen der Bild-Zuordnung' 
      }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      data: {
        deletedMapping: mappingData,
        storageDeleted: !storageError
      }
    });
    
  } catch (error) {
    console.error('Delete API error:', error);
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}