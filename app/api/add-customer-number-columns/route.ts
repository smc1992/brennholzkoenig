import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Adding customer_number columns...');
    
    // Da wir keine direkte SQL-Ausführung haben, verwenden wir einen Workaround
    // Wir versuchen ein Update mit einem neuen Feld - das wird einen Fehler geben wenn die Spalte nicht existiert
    
    // Test ob customer_number Spalte in customers existiert
    const { error: customerError } = await supabase
      .from('customers')
      .update({ customer_number: 'TEST' })
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Fake ID
    
    // Test ob customer_number Spalte in orders existiert  
    const { error: orderError } = await supabase
      .from('orders')
      .update({ customer_number: 'TEST' })
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Fake ID
    
    const results = {
      customers_column_exists: !customerError?.message?.includes('column "customer_number" does not exist'),
      orders_column_exists: !orderError?.message?.includes('column "customer_number" does not exist'),
      customer_error: customerError?.message,
      order_error: orderError?.message
    };
    
    if (!results.customers_column_exists || !results.orders_column_exists) {
      return NextResponse.json({
        success: false,
        error: 'Kundennummer-Spalten fehlen in der Datenbank',
        message: 'Bitte führen Sie die folgenden SQL-Befehle manuell in Supabase aus:',
        sql_commands: [
          'ALTER TABLE customers ADD COLUMN customer_number TEXT UNIQUE;',
          'ALTER TABLE orders ADD COLUMN customer_number TEXT;',
          'CREATE INDEX idx_customers_customer_number ON customers(customer_number);',
          'CREATE INDEX idx_orders_customer_number ON orders(customer_number);'
        ],
        details: results,
        instructions: [
          '1. Öffnen Sie Supabase Dashboard',
          '2. Gehen Sie zu SQL Editor',
          '3. Führen Sie die SQL-Befehle aus',
          '4. Rufen Sie diese API erneut auf'
        ]
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Kundennummer-Spalten sind bereits vorhanden',
      details: results
    });
    
  } catch (error) {
    console.error('❌ Add customer number columns error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Spalten-Check fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

// GET-Route für Status
export async function GET() {
  try {
    // Test beide Spalten
    const { error: customerError } = await supabase
      .from('customers')
      .select('customer_number')
      .limit(1);
    
    const { error: orderError } = await supabase
      .from('orders')
      .select('customer_number')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      status: {
        customers_column_exists: !customerError?.message?.includes('column "customer_number" does not exist'),
        orders_column_exists: !orderError?.message?.includes('column "customer_number" does not exist'),
        customer_error: customerError?.message || null,
        order_error: orderError?.message || null
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Status-Check fehlgeschlagen'
      },
      { status: 500 }
    );
  }
}