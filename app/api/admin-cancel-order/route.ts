import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { triggerCustomerOrderCancellation, triggerAdminOrderCancellation } from '@/lib/emailTriggerEngine';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Get order details for email
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          id, first_name, last_name, email, phone,
          street, house_number, postal_code, city
        ),
        order_items (
          id, product_name, product_category, quantity, unit_price, total_price
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      );
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderData.id);

    if (updateError) {
      console.error('Fehler beim Aktualisieren des Bestellstatus:', updateError);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Bestellstatus' },
        { status: 500 }
      );
    }

    // Prepare cancellation data
    const cancellationData = {
      order_number: orderData.order_number,
      order_id: orderData.id,
      order_date: new Date(orderData.created_at).toLocaleDateString('de-DE'),
      cancellation_date: new Date().toLocaleDateString('de-DE'),
      cancellation_reason: 'Stornierung durch Administrator',
      total_amount: parseFloat(orderData.total_amount),
      customer: {
        name: `${orderData.customers?.first_name} ${orderData.customers?.last_name}`,
        email: orderData.customers?.email || ''
      },
      products: orderData.order_items?.map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.unit_price)
      })) || [],
      admin_email: 'admin@brennholz-koenig.de'
    };

    // Send both customer and admin cancellation notifications
    const customerResult = await triggerCustomerOrderCancellation(cancellationData);
    const adminResult = await triggerAdminOrderCancellation(cancellationData);

    return NextResponse.json({
      success: true,
      message: 'Stornierungsbenachrichtigungen erfolgreich versendet',
      results: {
        customer: customerResult,
        admin: adminResult
      }
    });

  } catch (error) {
    console.error('Error in admin-cancel-order API:', error);
    return NextResponse.json(
      { error: 'Fehler beim Versenden der Stornierungsbenachrichtigungen' },
      { status: 500 }
    );
  }
}