import { NextRequest, NextResponse } from 'next/server';
import { sendTemplateEmail } from '@/lib/emailTemplateEngine';

export async function POST(request: NextRequest) {
  try {
    const { customerEmail, customerName, orderNumber, orderDate, deliveryAddress, productList } = await request.json();

    if (!customerEmail || !customerName || !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Fehlende erforderliche Daten' },
        { status: 400 }
      );
    }

    // Prepare template variables for the shipping notification template
    const templateData = {
      customer_name: customerName,
      order_number: orderNumber,
      order_date: orderDate,
      delivery_address: deliveryAddress,
      product_list: productList
    };

    // Send email using the template engine with the correct template type
    const emailResult = await sendTemplateEmail(
      'shipping_notification',  // This matches the "type" field in the template
      customerEmail,
      templateData,
      {
        ccAdmin: false  // Set to true if admin should receive a copy
      }
    );

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'E-Mail-Versand fehlgeschlagen');
    }

    console.log('✅ Lieferbenachrichtigung erfolgreich gesendet:', {
      email: customerEmail,
      orderNumber: orderNumber,
      messageId: emailResult.messageId
    });

    return NextResponse.json({
      success: true,
      message: 'Lieferbenachrichtigung erfolgreich gesendet',
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('❌ Fehler beim Senden der Lieferbenachrichtigung:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim E-Mail-Versand'
      },
      { status: 500 }
    );
  }
}