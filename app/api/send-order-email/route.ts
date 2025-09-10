import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { orderData, customerEmail, customerName, templateType = 'order_confirmation' } = await request.json();

    // Lade E-Mail-Template aus den Einstellungen
    const { data: templateData, error: templateError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_type', 'email_template')
      .like('setting_value', `%"type":"${templateType}"%`)
      .eq('setting_value->>is_active', 'true')
      .single();

    let emailTemplate;
    if (templateError || !templateData) {
      console.log('Kein Template gefunden, verwende Standard-Template');
      // Fallback: Standard-Template
      emailTemplate = {
        subject: '🔥 Bestellbestätigung Brennholzkönig - Bestellung #{orderId}',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background-color: #C04020; padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔥 Brennholzkönig</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Premium Brennholz aus der Region</p>
            </div>
            <div style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px;">Hallo {customerName},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                vielen Dank für Ihre Bestellung! Wir haben Ihre Bestellung erhalten und bearbeiten sie umgehend.
              </p>
              <div style="background-color: #fef3c7; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">📋 Bestelldetails:</h3>
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Bestellnummer:</strong> {orderId}<br>
                  <strong>Bestelldatum:</strong> {orderDate}<br>
                  <strong>Gesamtbetrag:</strong> €{totalAmount}
                </p>
              </div>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1f2937; margin: 0 0 10px 0;">Bestellte Artikel:</h4>
                {orderItems}
              </div>
              <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h4 style="color: #065f46; margin: 0 0 10px 0;">So geht es weiter:</h4>
                <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                  <li>Wir melden uns innerhalb von 24 Stunden bei Ihnen</li>
                  <li>Gemeinsam vereinbaren wir einen passenden Liefertermin</li>
                  <li>Lieferung direkt zu Ihnen nach Hause</li>
                  <li>Bezahlung bequem bei Lieferung</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
                <p style="color: #1f2937; font-weight: bold;">📞 +49 176 71085234 | ✉️ info@brennholz-koenig.de</p>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.7;">
                Freundliche Grüße,<br>
                Ihr Brennholzkönig-Team<br>
                <strong>Thorsten Vey - Brennholzhandel</strong>
              </p>
            </div>
          </div>
        `
      };
    } else {
      emailTemplate = JSON.parse(templateData.setting_value);
    }

    // Ersetze Platzhalter im Template
    let emailSubject = emailTemplate.subject
      .replace(/{customerName}/g, customerName)
      .replace(/{orderId}/g, orderData.orderNumber)
      .replace(/{orderDate}/g, new Date().toLocaleDateString('de-DE'))
      .replace(/{totalAmount}/g, orderData.totalAmount?.toFixed(2) || '0.00');

    // Erstelle Artikel-Liste für E-Mail
    const orderItemsHtml = orderData.items?.map((item: any) => 
      `<div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong><br>
        Menge: ${item.quantity} ${item.unit || 'Stück'} × €${parseFloat(item.price).toFixed(2)} = €${(item.quantity * parseFloat(item.price)).toFixed(2)}
      </div>`
    ).join('') || '<p>Artikel-Details werden nachgereicht</p>';

    let emailContent = emailTemplate.content
      .replace(/{customerName}/g, customerName)
      .replace(/{orderId}/g, orderData.orderNumber)
      .replace(/{orderDate}/g, new Date().toLocaleDateString('de-DE'))
      .replace(/{totalAmount}/g, orderData.totalAmount?.toFixed(2) || '0.00')
      .replace(/{orderItems}/g, orderItemsHtml)
      .replace(/{deliveryAddress}/g, orderData.deliveryAddress || 'Adresse wird nachgereicht');

    // Lade SMTP-Einstellungen
    const { data: smtpData, error: smtpError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_type', 'smtp_settings')
      .eq('setting_key', 'main')
      .single();

    if (smtpError || !smtpData) {
      console.error('SMTP-Einstellungen nicht gefunden:', smtpError);
      return NextResponse.json({ 
        success: false, 
        error: 'SMTP-Einstellungen nicht konfiguriert' 
      }, { status: 500 });
    }

    const smtpSettings = JSON.parse(smtpData.setting_value);

    // Sende E-Mail über Edge Function
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: customerEmail,
        subject: emailSubject,
        html: emailContent,
        smtp_settings: smtpSettings,
        type: templateType
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResult.success) {
      console.error('E-Mail-Versand fehlgeschlagen:', emailResult.error);
      return NextResponse.json({ 
        success: false, 
        error: emailResult.error || 'E-Mail-Versand fehlgeschlagen' 
      }, { status: 500 });
    }

    // Protokolliere E-Mail-Versand
    try {
      await supabase
        .from('app_settings')
        .insert({
          setting_type: 'email_log',
          setting_key: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          setting_value: JSON.stringify({
            to: customerEmail,
            subject: emailSubject,
            template_type: templateType,
            order_id: orderData.orderNumber,
            sent_at: new Date().toISOString(),
            status: 'sent'
          }),
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Fehler beim Protokollieren:', logError);
      // Nicht kritisch, E-Mail wurde trotzdem gesendet
    }

    return NextResponse.json({ 
      success: true, 
      message: 'E-Mail erfolgreich gesendet',
      template_used: emailTemplate.name || 'Standard-Template'
    });

  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Interner Server-Fehler beim E-Mail-Versand' 
    }, { status: 500 });
  }
}