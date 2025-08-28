import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client mit Service Role Key für Admin-Operationen
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Fixing customer RLS policies...');
    
    // Erstelle RLS-Policy für anonyme Benutzer
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Lösche existierende Policy falls vorhanden
        DROP POLICY IF EXISTS "Anonymous users can create customers" ON customers;
        
        -- Erstelle neue Policy für anonyme Kunden-Erstellung
        CREATE POLICY "Anonymous users can create customers" ON customers
          FOR INSERT WITH CHECK (true);
          
        -- Erlaube anonymen Benutzern auch das Lesen von Kunden-Daten für Bestellabwicklung
        DROP POLICY IF EXISTS "Anonymous users can read customers for orders" ON customers;
        CREATE POLICY "Anonymous users can read customers for orders" ON customers
          FOR SELECT USING (true);
      `
    });
    
    if (error) {
      console.error('RLS Policy Error:', error);
      return Response.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      message: 'Customer RLS policies updated successfully',
      data
    });
    
  } catch (error: any) {
    console.error('Fix Customer RLS Error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'Customer RLS Fix API',
    usage: 'POST to fix RLS policies for anonymous customer creation'
  });
}