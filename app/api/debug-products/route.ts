import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url')
      .neq('image_url', '')
      .not('image_url', 'is', null)
      .limit(10);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      products: data,
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('Debug products API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Fehler beim Laden der Produktdaten',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }, 
      { status: 500 }
    );
  }
}