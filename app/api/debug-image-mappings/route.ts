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
    console.warn('Supabase environment variables not configured for debug-image-mappings route');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('image_mappings')
      .select('*')
      .limit(10);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      mappings: data,
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('Error fetching image mappings:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch image mappings',
      details: (error as Error).message 
    }, { status: 500 });
  }
}