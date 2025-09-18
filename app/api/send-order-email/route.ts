import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmation, sendAdminNewOrderNotification } from '@/lib/emailTemplateService'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 === E-MAIL ROUTE GESTARTET ===')
    console.log('🔥 NODE_ENV:', process.env.NODE_ENV)
    
    const { orderData, customerData } = await request.json()

    // Validierung der Eingabedaten
    if (!orderData || !customerData) {
      return NextResponse.json(
        { success: false, message: 'Fehlende Bestell- oder Kundendaten' },
        { status: 400 }
      )
    }

    // Bestelldaten für E-Mail-Service vorbereiten
    const orderConfirmationData = {
      customer_name: customerData.name,
      order_id: orderData.orderNumber || orderData.id,
      order_date: new Date().toLocaleDateString('de-DE'),
      total_amount: orderData.total,
      delivery_address: `${customerData.address}\n${customerData.postalCode} ${customerData.city}`,
      order_tracking_url: `https://brennholzkoenig.de/konto/bestellungen/${orderData.id}`
    }

    // Admin-Benachrichtigungsdaten vorbereiten
    const adminNotificationData = {
      order_id: orderData.orderNumber || orderData.id,
      order_date: new Date().toLocaleDateString('de-DE'),
      total_amount: orderData.total,
      payment_status: 'Ausstehend',
      customer_name: customerData.name,
      customer_email: customerData.email,
      customer_phone: customerData.phone || 'Nicht angegeben',
      delivery_address: `${customerData.address}, ${customerData.postalCode} ${customerData.city}`,
      order_items: orderData.items?.map((item: any) => `${item.name} (${item.quantity}x ${item.price}€)`).join(', ') || 'Keine Artikel angegeben',
      admin_order_url: `https://brennholzkoenig.de/admin?tab=orders&order=${orderData.id}`
    }

    console.log('📧 Sende Bestellbestätigung an:', customerData.email)
    console.log('📧 Sende Admin-Benachrichtigung')

    // Kunden-E-Mail senden
    const customerResult = await sendOrderConfirmation(customerData.email, orderConfirmationData)
    
    // Admin-E-Mail senden
    const adminResult = await sendAdminNewOrderNotification('info@brennholz-koenig.de', adminNotificationData)

    // Ergebnisse auswerten
    const results = {
      customer: customerResult,
      admin: adminResult
    }

    console.log('📧 E-Mail-Ergebnisse:', results)

    if (customerResult.success || adminResult.success) {
      return NextResponse.json({
        success: true,
        message: 'E-Mails erfolgreich versendet',
        results: results,
        emailDetails: {
          customer: {
            to: customerData.email,
            success: customerResult.success,
            error: customerResult.error
          },
          admin: {
            to: 'info@brennholz-koenig.de',
            success: adminResult.success,
            error: adminResult.error
          },
          orderId: orderData.id,
          total: orderData.total
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Fehler beim E-Mail-Versand',
        results: results
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error);
    
    return NextResponse.json(
      { success: false, message: 'Fehler aufgetreten', error: (error as Error).message },
      { status: 500 }
    );
  }
}