import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'trabert.bioenergiehof@gmail.com';

    console.log('🔍 Debug customer_number for email:', email);
    
    // Prüfe customers Tabelle
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, customer_number')
      .eq('email', email)
      .single();

    if (customerError) {
      console.error('❌ Customer error:', customerError);
    }

    // Prüfe orders Tabelle für diese Email
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, customer_id, customer_number, delivery_email')
      .eq('delivery_email', email)
      .limit(3);

    if (ordersError) {
      console.error('❌ Orders error:', ordersError);
    }

    // Prüfe ob customer_number Spalte existiert
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'customers' 
          AND column_name = 'customer_number';
        `
      });

    return NextResponse.json({
      success: true,
      email: email,
      customer: customer,
      customer_error: customerError,
      orders: orders,
      orders_error: ordersError,
      customer_number_column_exists: tableInfo && tableInfo.length > 0,
      table_info: tableInfo,
      table_error: tableError
    });

  } catch (error: any) {
    console.error('💥 Debug customer number error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}