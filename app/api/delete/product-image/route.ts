import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
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