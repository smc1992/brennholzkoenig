import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    console.log('🔧 Setting up customer_number column...');
    
    const supabase = getAdminSupabaseClient();
    const results = [];
    
    // 1. Add customer_number column to customers table
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('customer_number')
        .limit(1);
      
      if (error && error.code === '42703') {
        // Column doesn't exist, add it using raw SQL
        console.log('📝 Adding customer_number column to customers table...');
        
        const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE customers ADD COLUMN customer_number TEXT;'
        });
        
        if (sqlError) {
          // Try alternative approach with direct SQL
          console.log('🔄 Trying alternative approach...');
          
          // Use the admin client to execute raw SQL
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
            },
            body: JSON.stringify({
              sql: 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_number TEXT;'
            })
          });
          
          if (!response.ok) {
            throw new Error(`SQL execution failed: ${response.statusText}`);
          }
        }
        
        results.push({
          step: 'add_customer_number_column',
          success: true,
          message: 'customer_number column added to customers table'
        });
      } else {
        results.push({
          step: 'check_customer_number_column',
          success: true,
          message: 'customer_number column already exists'
        });
      }
    } catch (error: any) {
      results.push({
        step: 'add_customer_number_column',
        success: false,
        error: error.message
      });
    }
    
    // 2. Add customer_number column to orders table
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_number')
        .limit(1);
      
      if (error && error.code === '42703') {
        console.log('📝 Adding customer_number column to orders table...');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
          },
          body: JSON.stringify({
            sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_number TEXT;'
          })
        });
        
        if (!response.ok) {
          throw new Error(`SQL execution failed: ${response.statusText}`);
        }
        
        results.push({
          step: 'add_orders_customer_number_column',
          success: true,
          message: 'customer_number column added to orders table'
        });
      } else {
        results.push({
          step: 'check_orders_customer_number_column',
          success: true,
          message: 'customer_number column already exists in orders table'
        });
      }
    } catch (error: any) {
      results.push({
        step: 'add_orders_customer_number_column',
        success: false,
        error: error.message
      });
    }
    
    // 3. Create index for performance
    try {
      console.log('📝 Creating index on customer_number...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
        },
        body: JSON.stringify({
          sql: 'CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON customers(customer_number);'
        })
      });
      
      if (response.ok) {
        results.push({
          step: 'create_customer_number_index',
          success: true,
          message: 'Index created on customer_number'
        });
      }
    } catch (error: any) {
      results.push({
        step: 'create_customer_number_index',
        success: false,
        error: error.message
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalSteps = results.length;
    
    return NextResponse.json({
      success: successCount === totalSteps,
      message: `Customer number column setup: ${successCount}/${totalSteps} steps completed`,
      results: results
    });

  } catch (error: any) {
    console.error('💥 Setup customer number column error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}