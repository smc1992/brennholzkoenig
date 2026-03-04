import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmation, sendAdminNewOrderNotification } from '@/lib/emailTemplateService'
import { createLegacyServerSupabase } from '@/lib/supabase-server'

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

    // Lade Order-Items bevorzugt aus der Datenbank, um konsistente Preise (unit_price) zu sichern
    const supabase = createLegacyServerSupabase()
    let emailItemsSource: Array<{ name: string; quantity: number; unit_price: number }> = []

    try {
      if (orderData?.id) {
        const { data: dbItems, error: dbError } = await supabase
          .from('order_items')
          .select('product_name, quantity, unit_price')
          .eq('order_id', orderData.id)

        if (!dbError && dbItems && Array.isArray(dbItems) && dbItems.length > 0) {
          emailItemsSource = dbItems.map((item: any) => ({
            name: item.product_name,
            quantity: item.quantity,
            unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price
          }))
        }
      }
    } catch (loadError) {
      console.warn('⚠️ Fehler beim Laden der Order-Items aus DB, nutze Payload-Fallback:', loadError)
    }

    // Fallback auf übermittelte Payload, wenn keine DB-Items verfügbar
    if (emailItemsSource.length === 0 && orderData?.items && Array.isArray(orderData.items)) {
      emailItemsSource = orderData.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price !== undefined && item.unit_price !== null
          ? (typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price)
          : (typeof item.price === 'string' ? parseFloat(item.price) : item.price)
      }))
    }

    // Bestelldaten für E-Mail-Service vorbereiten (nutzt bevorzugt DB-Items)
    const orderConfirmationData = {
      customer_name: customerData.name,
      order_id: orderData.orderNumber || orderData.id,
      order_date: new Date().toLocaleDateString('de-DE'),
      total_amount: typeof orderData.total === 'string' ? parseFloat(orderData.total) : orderData.total,
      delivery_address: `${customerData.address}\n${customerData.postalCode} ${customerData.city}`,
      order_tracking_url: `https://brennholzkoenig.de/konto/bestellungen/${orderData.id}`,
      order_items: emailItemsSource.length > 0
        ? emailItemsSource.map((item) => {
            const formattedPrice = item.unit_price !== undefined && item.unit_price !== null ? Number(item.unit_price).toFixed(2) : ''
            return `${item.quantity}x ${item.name} - ${formattedPrice}€`
          }).join('\n')
        : 'Keine Artikel angegeben'
    }

    // Admin-Benachrichtigungsdaten vorbereiten
    const adminNotificationData = {
      order_id: orderData.orderNumber || orderData.id,
      order_date: new Date().toLocaleDateString('de-DE'),
      total_amount: typeof orderData.total === 'string' ? parseFloat(orderData.total) : orderData.total,
      payment_status: 'Ausstehend',
      customer_name: customerData.name,
      customer_email: customerData.email,
      customer_phone: customerData.phone || 'Nicht angegeben',
      delivery_address: `${customerData.address}, ${customerData.postalCode} ${customerData.city}`,
      order_items: emailItemsSource.length > 0
        ? emailItemsSource.map((item) => {
            const formattedPrice = item.unit_price !== undefined && item.unit_price !== null ? Number(item.unit_price).toFixed(2) : ''
            return `${item.name} (${item.quantity}x ${formattedPrice}€)`
          }).join(', ')
        : 'Keine Artikel angegeben',
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