import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTemplateEmail } from '@/lib/emailTemplateService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Bestell-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Bestellung laden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob Bestellung stornierbar ist
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Bestellung kann nicht storniert werden. Nur ausstehende Bestellungen können storniert werden.' },
        { status: 400 }
      );
    }

    // Bestellung auf "cancelled" setzen
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // Kundendaten laden
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    if (customerError) {
      console.error('Fehler beim Laden der Kundendaten:', customerError);
    }

    // E-Mail-Daten vorbereiten
    const currentDate = new Date();
    const orderDate = new Date(order.created_at);
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Artikel für E-Mail formatieren
    const orderItemsText = order.order_items
      .map((item: any) => `- ${item.products?.name || 'Unbekanntes Produkt'} (${item.quantity}x ${formatCurrency(item.price)})`)
      .join('\n');

    const orderItemsHtml = order.order_items
      .map((item: any) => `<p>- ${item.products?.name || 'Unbekanntes Produkt'} (${item.quantity}x ${formatCurrency(item.price)})</p>`)
      .join('');

    // Template-Daten für Kunden-E-Mail
    const customerTemplateData = {
      customer_name: customer?.first_name ? `${customer.first_name} ${customer.last_name}` : 'Kunde',
      order_number: order.order_number,
      order_date: formatDate(orderDate),
      cancellation_date: formatDate(currentDate),
      order_total: formatCurrency(order.total_amount),
      shop_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://brennholzkoenig.de',
      support_email: process.env.SUPPORT_EMAIL || 'support@brennholzkoenig.de'
    };

    // Template-Daten für Admin-E-Mail
    const adminTemplateData = {
      order_number: order.order_number,
      order_date: formatDate(orderDate),
      cancellation_date: formatDate(currentDate),
      order_total: formatCurrency(order.total_amount),
      customer_name: customer?.first_name ? `${customer.first_name} ${customer.last_name}` : 'Unbekannt',
      customer_email: customer?.email || 'Unbekannt',
      customer_phone: customer?.phone || 'Nicht angegeben',
      order_items: orderItemsText,
      admin_order_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin?tab=orders&order=${order.id}`
    };

    // E-Mails senden
    const emailPromises = [];

    // Kunden-E-Mail senden
    if (customer?.email) {
      emailPromises.push(
        sendTemplateEmail(
          'order_cancellation',
          customer.email,
          customerTemplateData
        ).catch((error: any) => {
          console.error('Fehler beim Senden der Kunden-E-Mail:', error);
          return { success: false, error: 'Kunden-E-Mail konnte nicht gesendet werden' };
        })
      );
    }

    // Admin-E-Mail senden
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@brennholzkoenig.de';
    emailPromises.push(
      sendTemplateEmail(
        'admin_order_cancellation',
        adminEmail,
        adminTemplateData
      ).catch((error: any) => {
        console.error('Fehler beim Senden der Admin-E-Mail:', error);
        return { success: false, error: 'Admin-E-Mail konnte nicht gesendet werden' };
      })
    );

    // Warten auf alle E-Mail-Sendungen
    const emailResults = await Promise.all(emailPromises);
    
    // Prüfen ob E-Mails erfolgreich gesendet wurden
    const failedEmails = emailResults.filter((result: any) => result && !result.success);
    
    if (failedEmails.length > 0) {
      console.warn('Einige E-Mails konnten nicht gesendet werden:', failedEmails);
    }

    return NextResponse.json({
      success: true,
      message: 'Bestellung wurde erfolgreich storniert',
      emailsSent: emailResults.length - failedEmails.length,
      emailsFailed: failedEmails.length
    });

  } catch (error) {
    console.error('Fehler beim Stornieren der Bestellung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Stornieren der Bestellung' },
      { status: 500 }
    );
  }
}