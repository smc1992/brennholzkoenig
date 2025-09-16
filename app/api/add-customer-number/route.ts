import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Adding customer_number system to database...');
    
    const results = [];
    
    // 1. Add customer_number column to customers table
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_number TEXT UNIQUE;'
      });
      
      results.push({
        step: 'add_customer_number_column',
        success: !error,
        error: error?.message
      });
    } catch (error: any) {
      results.push({
        step: 'add_customer_number_column',
        success: false,
        error: error.message
      });
    }
    
    // 2. Create sequence for customer numbers
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'CREATE SEQUENCE IF NOT EXISTS customer_number_seq START 10001;'
      });
      
      results.push({
        step: 'create_sequence',
        success: !error,
        error: error?.message
      });
    } catch (error: any) {
      results.push({
        step: 'create_sequence',
        success: false,
        error: error.message
      });
    }
    
    // 3. Create function to generate customer number
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION generate_customer_number()
          RETURNS TEXT AS $$
          DECLARE
              next_number INTEGER;
              customer_number TEXT;
          BEGIN
              SELECT nextval('customer_number_seq') INTO next_number;
              customer_number := 'KD-' || LPAD(next_number::TEXT, 5, '0');
              RETURN customer_number;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      results.push({
        step: 'create_function',
        success: !error,
        error: error?.message
      });
    } catch (error: any) {
      results.push({
        step: 'create_function',
        success: false,
        error: error.message
      });
    }
    
    // 4. Update existing customers with customer numbers
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE customers 
          SET customer_number = generate_customer_number() 
          WHERE customer_number IS NULL;
        `
      });
      
      results.push({
        step: 'update_existing_customers',
        success: !error,
        error: error?.message
      });
    } catch (error: any) {
      results.push({
        step: 'update_existing_customers',
        success: false,
        error: error.message
      });
    }
    
    // 5. Add customer_number column to orders table
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_number TEXT;'
      });
      
      results.push({
        step: 'add_orders_customer_number',
        success: !error,
        error: error?.message
      });
    } catch (error: any) {
      results.push({
        step: 'add_orders_customer_number',
        success: false,
        error: error.message
      });
    }
    
    // 6. Update existing orders with customer numbers
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE orders 
          SET customer_number = (
              SELECT customer_number 
              FROM customers 
              WHERE customers.id = orders.customer_id 
                 OR customers.email = orders.delivery_email
              LIMIT 1
          )
          WHERE customer_number IS NULL;
        `
      });
      
      results.push({
        step: 'update_orders_customer_number',
        success: !error,
        error: error?.message
      });
    } catch (error: any) {
      results.push({
        step: 'update_orders_customer_number',
        success: false,
        error: error.message
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalSteps = results.length;
    
    return NextResponse.json({
      success: successCount === totalSteps,
      message: `Customer number system setup: ${successCount}/${totalSteps} steps completed`,
      results: results
    });

  } catch (error: any) {
    console.error('💥 Add customer number error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}