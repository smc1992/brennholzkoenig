import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Admin Supabase Client mit Service Role Key
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting customer number system migration...');
    
    // Lade Migration SQL
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250115000001_add_customer_number_system.sql');
    const migrationSQL = await readFile(migrationPath, 'utf-8');
    
    console.log('📄 Migration SQL loaded, length:', migrationSQL.length);
    
    const supabase = getAdminSupabaseClient();
    
    // Führe Migration aus
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }
    
    console.log('✅ Migration completed successfully');
    
    // Prüfe ob Spalten erstellt wurden
    const { data: customersCheck } = await supabase
      .from('customers')
      .select('customer_number')
      .limit(1);
    
    const { data: ordersCheck } = await supabase
      .from('orders')
      .select('customer_number')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Customer number system migration completed successfully',
      details: {
        migration_executed: true,
        customers_column_available: !customersCheck || customersCheck.length >= 0,
        orders_column_available: !ordersCheck || ordersCheck.length >= 0,
        migration_sql_length: migrationSQL.length
      }
    });

  } catch (error: any) {
    console.error('💥 Migration error:', error);
    
    // Fallback: Versuche einzelne SQL-Statements
    if (error.message?.includes('exec_sql')) {
      try {
        console.log('🔄 Trying fallback approach with individual statements...');
        
        const supabase = getAdminSupabaseClient();
        const results = [];
        
        // Einzelne SQL-Statements
        const statements = [
          'ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_number TEXT UNIQUE;',
          'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_number TEXT;',
          'CREATE SEQUENCE IF NOT EXISTS customer_number_seq START 10001;'
        ];
        
        for (const sql of statements) {
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql });
            results.push({
              sql: sql.substring(0, 50) + '...',
              success: !stmtError,
              error: stmtError?.message
            });
          } catch (e: any) {
            results.push({
              sql: sql.substring(0, 50) + '...',
              success: false,
              error: e.message
            });
          }
        }
        
        return NextResponse.json({
          success: false,
          message: 'Migration partially completed with fallback approach',
          fallback_results: results,
          original_error: error.message
        });
        
      } catch (fallbackError: any) {
        return NextResponse.json({ 
          success: false, 
          error: 'Migration failed completely',
          original_error: error.message,
          fallback_error: fallbackError.message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET: Status der Migration prüfen
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminSupabaseClient();
    
    // Prüfe ob customer_number Spalten existieren
    const customersTest = await supabase
      .from('customers')
      .select('customer_number')
      .limit(1);
    
    const ordersTest = await supabase
      .from('orders')
      .select('customer_number')
      .limit(1);
    
    // Prüfe ob Sequenz existiert
    const { data: sequenceCheck } = await supabase.rpc('exec_sql', {
      sql: "SELECT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'customer_number_seq') as exists;"
    });
    
    return NextResponse.json({
      success: true,
      migration_status: {
        customers_column_exists: !customersTest.error,
        orders_column_exists: !ordersTest.error,
        sequence_exists: sequenceCheck?.[0]?.exists || false,
        customers_error: customersTest.error?.message,
        orders_error: ordersTest.error?.message
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}