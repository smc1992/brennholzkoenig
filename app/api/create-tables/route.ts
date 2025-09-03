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
    console.warn('Supabase environment variables not configured for create-tables route');
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

    const body = await request.json();
    const results: any[] = [];
    
    if (body.action === 'create_customers_table') {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS customers (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              first_name TEXT,
              last_name TEXT,
              phone TEXT,
              street TEXT,
              house_number TEXT,
              postal_code TEXT,
              city TEXT,
              company TEXT,
              date_of_birth DATE,
              newsletter_subscription BOOLEAN DEFAULT false,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Users can read own data" ON customers
              FOR SELECT USING (auth.email() = email);
            
            CREATE POLICY IF NOT EXISTS "Users can update own data" ON customers
              FOR UPDATE USING (auth.email() = email);
              
            CREATE POLICY IF NOT EXISTS "Users can insert own data" ON customers
              FOR INSERT WITH CHECK (auth.email() = email);
              
            CREATE POLICY IF NOT EXISTS "Anonymous users can create customers" ON customers
              FOR INSERT WITH CHECK (true);
          `
        });
        
        results.push({
          table: 'customers',
          success: !error,
          error: error?.message,
          message: 'customers Tabelle erstellt'
        });
      } catch (error: any) {
        results.push({
          table: 'customers',
          success: false,
          error: error.message
        });
      }
    }
    
    if (body.action === 'create_orders_table') {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS orders (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              order_number TEXT UNIQUE NOT NULL,
              customer_id UUID REFERENCES customers(id),
              status TEXT DEFAULT 'pending',
              payment_method TEXT NOT NULL,
              
              -- Lieferadresse
              delivery_first_name TEXT NOT NULL,
              delivery_last_name TEXT NOT NULL,
              delivery_email TEXT NOT NULL,
              delivery_phone TEXT,
              delivery_street TEXT NOT NULL,
              delivery_house_number TEXT NOT NULL,
              delivery_postal_code TEXT NOT NULL,
              delivery_city TEXT NOT NULL,
              delivery_notes TEXT,
              preferred_delivery_month TEXT,
              preferred_delivery_year TEXT,
              
              -- Rechnungsadresse
              billing_same_as_delivery BOOLEAN DEFAULT true,
              billing_company TEXT,
              billing_first_name TEXT,
              billing_last_name TEXT,
              billing_street TEXT,
              billing_house_number TEXT,
              billing_postal_code TEXT,
              billing_city TEXT,
              
              -- Preise
              subtotal_amount DECIMAL(10,2) NOT NULL,
              delivery_price DECIMAL(10,2) NOT NULL,
              total_amount DECIMAL(10,2) NOT NULL,
              delivery_method TEXT,
              delivery_type TEXT,
              
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Users can read own orders" ON orders
              FOR SELECT USING (delivery_email = auth.email());
          `
        });
        
        results.push({
          table: 'orders',
          success: !error,
          error: error?.message,
          message: 'orders Tabelle erstellt'
        });
      } catch (error: any) {
        results.push({
          table: 'orders',
          success: false,
          error: error.message
        });
      }
    }
    
    if (body.action === 'create_order_items_table') {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS order_items (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
              product_id INTEGER REFERENCES products(id),
              product_name TEXT NOT NULL,
              quantity INTEGER NOT NULL,
              unit_price DECIMAL(10,2) NOT NULL,
              total_price DECIMAL(10,2) NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Users can read own order items" ON order_items
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM orders 
                  WHERE orders.id = order_items.order_id 
                  AND orders.delivery_email = auth.email()
                )
              );
          `
        });
        
        results.push({
          table: 'order_items',
          success: !error,
          error: error?.message,
          message: 'order_items Tabelle erstellt'
        });
      } catch (error: any) {
        results.push({
          table: 'order_items',
          success: false,
          error: error.message
        });
      }
    }
    
    if (body.action === 'create_all_tables') {
      // Erstelle alle Tabellen in der richtigen Reihenfolge
      const tables = ['customers', 'orders', 'order_items'];
      
      for (const table of tables) {
        const createResult = await fetch(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: `create_${table}_table` })
        });
        
        const result = await createResult.json();
        results.push(...result.results);
      }
    }
    
    return Response.json({
      success: true,
      results,
      message: `${results.length} Tabellen-Operationen durchgeführt`
    });
    
  } catch (error) {
    console.error('Create Tables API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Fehler beim Erstellen der Tabellen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }, 
      { status: 500 }
    );
  }
}

// GET-Route für Tabellen-Status
export async function GET() {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const tables = ['customers', 'orders', 'order_items'];
    const status: any = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        status[table] = {
          exists: !error,
          count: count || 0,
          error: error?.message
        };
      } catch (err: any) {
        status[table] = {
          exists: false,
          error: err.message
        };
      }
    }
    
    return Response.json({
      success: true,
      tables: status,
      frontend_fields: {
        checkout_form: [
          'firstName', 'lastName', 'email', 'phone',
          'street', 'houseNumber', 'postalCode', 'city',
          'deliveryNotes', 'paymentMethod', 'company'
        ],
        order_data: [
          'order_number', 'customer_id', 'status', 'payment_method',
          'delivery_first_name', 'delivery_last_name', 'delivery_email',
          'delivery_phone', 'delivery_street', 'delivery_house_number',
          'delivery_postal_code', 'delivery_city', 'delivery_notes',
          'billing_same_as_delivery', 'billing_company', 'billing_first_name',
          'billing_last_name', 'billing_street', 'billing_house_number',
          'billing_postal_code', 'billing_city', 'subtotal', 'shipping_cost',
          'total_amount', 'delivery_method'
        ],
        order_items: [
          'order_id', 'product_id', 'product_name', 'quantity',
          'unit_price', 'total_price'
        ]
      }
    });
    
  } catch (error) {
    return Response.json(
      { 
        success: false, 
        error: 'Status-Check fehlgeschlagen'
      }, 
      { status: 500 }
    );
  }
}