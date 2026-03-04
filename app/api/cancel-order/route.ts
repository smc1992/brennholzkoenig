import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { triggerCustomerOrderCancellation, triggerAdminOrderCancellation } from '@/lib/emailTriggerEngine';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Bestell-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Supabase client is already imported

    // Bestellung laden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
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

    // Datum-Formatierung für Trigger-Engine
    const currentDate = new Date();

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // E-Mails über Trigger-Engine senden
    const emailResults = [];

    // Admin-E-Mail aus Admin-Konfiguration laden (Fallback auf ENV)
    let adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'info@brennholz-koenig.de';
    try {
      const { data: adminSettingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'admin_config')
        .single();
      if (adminSettingsData?.setting_value) {
        const adminSettings = JSON.parse(adminSettingsData.setting_value);
        if (adminSettings?.notification_email) {
          adminEmail = adminSettings.notification_email;
        }
      }
    } catch (e) {
      console.warn('[Cancel Order] Konnte Admin-Konfiguration nicht laden, nutze Fallback');
    }

    // Cancellation-Daten für Trigger-Engine vorbereiten
    // Stelle sicher, dass Beträge als number übergeben werden (wie im Admin-Flow)
    const cancellationData = {
      order_number: order.order_number,
      order_id: order.id,
      order_date: formatDate(new Date(order.created_at)),
      cancellation_date: formatDate(currentDate),
      // total_amount aus DB kann string/decimal sein → explizit in number konvertieren
      total_amount: typeof order.total_amount === 'number' 
        ? order.total_amount 
        : parseFloat(order.total_amount),
      customer: {
        name: customer?.first_name ? `${customer.first_name} ${customer.last_name}` : 'Kunde',
        email: customer?.email || ''
      },
      // Einzelpreise ebenfalls als number sicherstellen
      products: order.order_items.map((item: any) => ({
        name: item.product_name || 'Unbekanntes Produkt',
        quantity: item.quantity,
        price: typeof item.unit_price === 'number' 
          ? item.unit_price 
          : parseFloat(item.unit_price)
      })),
      admin_email: adminEmail
    };

    // Kunden-E-Mail senden
    if (customer?.email) {
      try {
        const customerResult = await triggerCustomerOrderCancellation(cancellationData);
        emailResults.push({ success: customerResult, type: 'customer' });
      } catch (error) {
        console.error('Fehler beim Senden der Kunden-E-Mail:', error);
        emailResults.push({ success: false, type: 'customer', error: 'Kunden-E-Mail konnte nicht gesendet werden' });
      }
    }

    // Admin-E-Mail senden
    try {
      const adminResult = await triggerAdminOrderCancellation(cancellationData);
      emailResults.push({ success: adminResult, type: 'admin' });
    } catch (error) {
      console.error('Fehler beim Senden der Admin-E-Mail:', error);
      emailResults.push({ success: false, type: 'admin', error: 'Admin-E-Mail konnte nicht gesendet werden' });
    }

    // Prüfen ob E-Mails erfolgreich gesendet wurden
    const failedEmails = emailResults.filter((result: any) => !result.success);
    
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