import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Supabase Client mit Service Role Key
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable - cannot create invoices without admin access');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = await request.json();
    const { orderData, invoiceNumber } = body;

    console.log('📦 Creating invoice directly:', { orderData, invoiceNumber });

    // Erstelle Rechnung mit minimalen Daten
    const invoiceData = {
      invoice_number: invoiceNumber,
      order_id: orderData.id,
      customer_id: orderData.customer_id || null,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal_amount: orderData.subtotal_amount || '0.00',
      tax_amount: (parseFloat(orderData.subtotal_amount || '0') * 0.19).toFixed(2),
      total_amount: orderData.total_amount || '0.00',
      payment_terms: 'Zahlbar innerhalb von 14 Tagen.'
    };

    console.log('💾 Invoice data to insert:', invoiceData);

    const { data, error } = await adminSupabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (error) {
      console.error('❌ Invoice insert failed:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create invoice in database',
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Invoice created successfully:', data);

    return NextResponse.json({
      success: true,
      invoice: data,
      method: 'database',
      message: 'Invoice created in database'
    });

  } catch (error) {
    console.error('❌ Create invoice direct error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}