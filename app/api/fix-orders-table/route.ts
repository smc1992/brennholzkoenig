import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Runtime-Konfiguration für Node.js Kompatibilität
export const runtime = 'nodejs';

// Verhindert Pre-rendering während des Builds
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Supabase Admin Client wird zur Laufzeit erstellt
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase environment variables not configured for app-api-fix-orders-table-route route');
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: NextRequest) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabaseAdmin) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    console.log('Fixing orders table for anonymous orders...');
    
    // Aktualisiere orders-Tabelle für anonyme Bestellungen
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Mache customer_id optional für anonyme Bestellungen
        ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;
        
        -- Lösche existierende RLS-Policies
        DROP POLICY IF EXISTS "Users can read own orders" ON orders;
        DROP POLICY IF EXISTS "Anonymous users can create orders" ON orders;
        DROP POLICY IF EXISTS "Anonymous users can read orders" ON orders;
        
        -- Erstelle neue RLS-Policy für anonyme Bestellungen
        CREATE POLICY "Anonymous users can create orders" ON orders
          FOR INSERT WITH CHECK (true);
          
        -- Erlaube anonymen Benutzern das Lesen ihrer eigenen Bestellungen über E-Mail
        CREATE POLICY "Users can read orders by email" ON orders
          FOR SELECT USING (
            delivery_email = auth.email() OR 
            auth.email() IS NULL
          );
          
        -- Erlaube authentifizierten Benutzern das Lesen ihrer eigenen Bestellungen
        CREATE POLICY "Users can read own orders" ON orders
          FOR SELECT USING (
            customer_id IN (
              SELECT id FROM customers WHERE email = auth.email()
            )
          );
          
        -- Aktualisiere auch die Spalten-Namen für Konsistenz
        ALTER TABLE orders 
          ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS delivery_type TEXT,
          ADD COLUMN IF NOT EXISTS preferred_delivery_month TEXT,
          ADD COLUMN IF NOT EXISTS preferred_delivery_year TEXT;
          
        -- Kopiere Daten falls alte Spalten existieren
        UPDATE orders 
        SET 
          subtotal_amount = COALESCE(subtotal_amount, subtotal),
          delivery_price = COALESCE(delivery_price, shipping_cost)
        WHERE subtotal_amount IS NULL OR delivery_price IS NULL;
      `
    });
    
    if (error) {
      console.error('Orders Table Fix Error:', error);
      return Response.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      message: 'Orders table updated successfully for anonymous orders',
      data
    });
    
  } catch (error: any) {
    console.error('Fix Orders Table Error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'Orders Table Fix API',
    usage: 'POST to fix orders table for anonymous orders'
  });
}