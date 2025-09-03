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
    console.warn('Supabase environment variables not configured for debug-schema route');
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

    console.log('Schema Debug API called');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      errors: {},
      analysis: {
        missing_tables: [],
        schema_issues: [],
        recommendations: []
      }
    };
    
    // Liste der zu prüfenden Tabellen
    const tablesToCheck = [
      'products',
      'orders', 
      'customers',
      'order_items',
      'admin_users',
      'image_mappings',
      'pricing_tiers'
    ];
    
    // Prüfe jede Tabelle
    for (const tableName of tablesToCheck) {
      try {
        console.log(`Checking table: ${tableName}`);
        
        // Versuche Tabelle zu lesen (nur count)
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results.errors[tableName] = {
            message: error.message,
            code: error.code,
            details: error.details
          };
          
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            results.analysis.missing_tables.push(tableName);
          }
        } else {
          results.tables[tableName] = {
            exists: true,
            count: count || 0,
            status: 'accessible'
          };
          
          // Für wichtige Tabellen: Hole ein Beispiel-Record um Schema zu analysieren
          if (['products', 'orders', 'customers'].includes(tableName) && count && count > 0) {
            try {
              const { data: sampleData } = await supabase
                .from(tableName)
                .select('*')
                .limit(1)
                .single();
              
              if (sampleData) {
                results.tables[tableName].sample_fields = Object.keys(sampleData);
                results.tables[tableName].sample_data = sampleData;
              }
            } catch (sampleError) {
              results.tables[tableName].sample_error = 'Could not fetch sample data';
            }
          }
        }
      } catch (generalError: any) {
        results.errors[tableName] = {
          message: generalError.message || 'Unknown error',
          type: 'general_error'
        };
      }
    }
    
    // Analysiere Frontend-Formulare
    const frontendAnalysis = {
      checkout_form_fields: [
        'email',
        'first_name', 
        'last_name',
        'phone',
        'street',
        'house_number',
        'postal_code',
        'city',
        'delivery_notes',
        'payment_method',
        'total_amount',
        'items'
      ],
      customer_profile_fields: [
        'email',
        'first_name',
        'last_name', 
        'phone',
        'street',
        'house_number',
        'postal_code',
        'city',
        'date_of_birth',
        'newsletter_subscription'
      ]
    };
    
    results.frontend_analysis = frontendAnalysis;
    
    // Schema-Empfehlungen basierend auf gefundenen Problemen
    if (results.analysis.missing_tables.includes('customers')) {
      results.analysis.recommendations.push({
        type: 'create_table',
        table: 'customers',
        sql: `
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,
  date_of_birth DATE,
  newsletter_subscription BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON customers
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Users can update own data" ON customers
  FOR UPDATE USING (auth.email() = email);
        `
      });
    }
    
    if (results.analysis.missing_tables.includes('orders')) {
      results.analysis.recommendations.push({
        type: 'create_table',
        table: 'orders',
        sql: `
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  delivery_notes TEXT,
  payment_method TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
        `
      });
    }
    
    if (results.analysis.missing_tables.includes('order_items')) {
      results.analysis.recommendations.push({
        type: 'create_table',
        table: 'order_items',
        sql: `
CREATE TABLE order_items (
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
        `
      });
    }
    
    // Prüfe ob Frontend-Backend Mapping stimmt
    if (results.tables.customers && results.tables.customers.sample_fields) {
      const customerFields = results.tables.customers.sample_fields;
      const missingCustomerFields = frontendAnalysis.customer_profile_fields.filter(
        field => !customerFields.includes(field)
      );
      
      if (missingCustomerFields.length > 0) {
        results.analysis.schema_issues.push({
          table: 'customers',
          issue: 'missing_frontend_fields',
          missing_fields: missingCustomerFields,
          recommendation: 'Add missing columns to customers table'
        });
      }
    }
    
    if (results.tables.orders && results.tables.orders.sample_fields) {
      const orderFields = results.tables.orders.sample_fields;
      const missingOrderFields = frontendAnalysis.checkout_form_fields.filter(
        field => !orderFields.includes(field) && field !== 'items'
      );
      
      if (missingOrderFields.length > 0) {
        results.analysis.schema_issues.push({
          table: 'orders',
          issue: 'missing_frontend_fields', 
          missing_fields: missingOrderFields,
          recommendation: 'Add missing columns to orders table'
        });
      }
    }
    
    return Response.json({
      success: true,
      ...results
    });
    
  } catch (error) {
    console.error('Schema Debug API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Schema-Analyse fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }, 
      { status: 500 }
    );
  }
}

// POST-Route zum Erstellen fehlender Tabellen
export async function POST(request: NextRequest) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabase = getSupabaseClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabase) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const body = await request.json();
    
    if (body.action === 'create_missing_tables') {
      const results = [];
      
      // Erstelle customers Tabelle
      try {
        const { error: customersError } = await supabase.rpc('exec_sql', {
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
              date_of_birth DATE,
              newsletter_subscription BOOLEAN DEFAULT false,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        });
        
        results.push({
          table: 'customers',
          success: !customersError,
          error: customersError?.message
        });
      } catch (error: any) {
        results.push({
          table: 'customers',
          success: false,
          error: error.message
        });
      }
      
      return Response.json({
        success: true,
        results
      });
    }
    
    return Response.json({
      success: false,
      error: 'Unbekannte Aktion'
    });
    
  } catch (error) {
    return Response.json(
      { 
        success: false, 
        error: 'POST-Fehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }, 
      { status: 500 }
    );
  }
}