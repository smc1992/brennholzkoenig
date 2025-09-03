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
    console.warn('Supabase environment variables not configured for app-api-fix-image-urls-route route');
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

    // Alle Produkte mit CDN-URLs abrufen
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .like('image_url', '%cdn.brennholz-koenig.de%');

    if (fetchError) {
      throw fetchError;
    }

    if (!products || products.length === 0) {
      return Response.json({
        success: true,
        message: 'Keine CDN-URLs gefunden, die aktualisiert werden müssen.',
        updated: 0
      });
    }

    const updates = [];
    const results = [];

    for (const product of products) {
      let newImageUrl = '';
      
      // Extrahiere Dateinamen aus CDN-URL
      const cdnMatch = product.image_url.match(/\/products\/([^\s`]+)/);
      if (cdnMatch) {
        const filename = cdnMatch[1].trim();
        
        // Prüfe ob es ein SEO-Slug ist (enthält Produktname-ähnliche Struktur)
        const isSEOSlug = filename.includes('-') && !filename.match(/^\d+-[a-z0-9]+\./i);
        
        if (isSEOSlug) {
          newImageUrl = `/images/${filename}`;
        } else {
          newImageUrl = `/api/cdn/products/${filename}`;
        }
        
        updates.push({
          id: product.id,
          name: product.name,
          oldUrl: product.image_url,
          newUrl: newImageUrl
        });
      } else {
        // Fallback: Setze auf Placeholder
        newImageUrl = '';
        updates.push({
          id: product.id,
          name: product.name,
          oldUrl: product.image_url,
          newUrl: newImageUrl,
          note: 'Auf Placeholder gesetzt (URL konnte nicht geparst werden)'
        });
      }
    }

    // Batch-Update durchführen
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: update.newUrl })
        .eq('id', update.id);

      if (updateError) {
        results.push({
          ...update,
          success: false,
          error: updateError.message
        });
      } else {
        results.push({
          ...update,
          success: true
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return Response.json({
      success: true,
      message: `${successCount} URLs erfolgreich aktualisiert, ${errorCount} Fehler`,
      updated: successCount,
      errors: errorCount,
      details: results
    });
    
  } catch (error) {
    console.error('Fix image URLs API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Fehler beim Aktualisieren der Bild-URLs',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }, 
      { status: 500 }
    );
  }
}

// GET-Route für Status-Check
export async function GET() {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { data: cdnProducts, error } = await supabase
      .from('products')
      .select('id, name, image_url')
      .like('image_url', '%cdn.brennholz-koenig.de%');

    if (error) throw error;

    return Response.json({
      success: true,
      cdnUrlsFound: cdnProducts?.length || 0,
      products: cdnProducts || []
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Fehler beim Status-Check' },
      { status: 500 }
    );
  }
}