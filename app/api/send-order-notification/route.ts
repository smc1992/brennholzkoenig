import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/emailService';
import { replacePlaceholders } from '@/lib/emailTemplateEngine';

interface OrderData {
  order_number: string;
  customer_name: string;
  customer_email: string;
  order_total: string;
  order_date: string;
  delivery_address?: string;
  product_list: string;
  tracking_number?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { orderData, templateType = 'order_confirmation' }: { 
      orderData: OrderData; 
      templateType?: string; 
    } = await request.json();

    console.log('[Order Notification] Processing order:', orderData.order_number);

    // Lade aktive E-Mail-Templates für Bestellbestätigung
    const { data: templatesData, error: templatesError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (templatesError) {
      console.error('[Order Notification] Error loading templates:', templatesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Fehler beim Laden der E-Mail-Templates' 
      }, { status: 500 });
    }

    const templates = templatesData?.map((t: any) => ({
      ...t,
      template: JSON.parse(t.setting_value)
    })) || [];

    // Finde aktive Templates mit Bestellbestätigung-Trigger
    const customerTemplates = templates.filter((t: any) => 
      t.template.active && 
      t.template.triggers?.order_confirmation && 
      (t.template.target_audience === 'customer' || !t.template.target_audience)
    );

    const adminTemplates = templates.filter((t: any) => 
      t.template.active && 
      t.template.triggers?.order_confirmation && 
      t.template.target_audience === 'admin'
    );

    console.log('[Order Notification] Found templates:', {
      customer: customerTemplates.length,
      admin: adminTemplates.length
    });

    // Template-Daten für Platzhalter-Ersetzung
    const templateData = {
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      order_number: orderData.order_number,
      order_total: orderData.order_total,
      order_date: orderData.order_date,
      delivery_address: orderData.delivery_address || 'Wie angegeben',
      tracking_number: orderData.tracking_number || 'Wird nachgereicht',
      product_list: orderData.product_list,
      company_name: 'Brennholzkönig',
      support_email: 'info@brennholz-koenig.de'
    };

    const results = [];

    // Sende E-Mail an Kunden
    for (const template of customerTemplates) {
      try {
        const subject = replacePlaceholders(template.template.subject, templateData);
        const htmlContent = replacePlaceholders(template.template.html_content, templateData);
        const textContent = replacePlaceholders(
          template.template.text_content || template.template.html_content.replace(/<[^>]*>/g, ''), 
          templateData
        );

        console.log('[Order Notification] Sending customer email:', {
          template: template.setting_name,
          to: orderData.customer_email,
          subject
        });

        const result = await sendEmail({
          to: orderData.customer_email,
          subject: subject,
          html: htmlContent,
          text: textContent
        });

        results.push({
          type: 'customer',
          template: template.setting_name,
          success: result.success,
          error: result.error
        });

        // Log E-Mail-Versand
        await supabase
          .from('app_settings')
          .insert({
            setting_type: 'email_log',
            setting_key: `order_notification_${Date.now()}`,
            setting_value: JSON.stringify({
              type: 'order_confirmation_customer',
              order_number: orderData.order_number,
              to: orderData.customer_email,
              subject: subject,
              template_id: template.id,
              status: result.success ? 'sent' : 'failed',
              error: result.error,
              sent_at: new Date().toISOString()
            }),
            description: `Bestellbestätigung an Kunde: ${orderData.customer_name}`
          });

      } catch (error) {
        console.error('[Order Notification] Error sending customer email:', error);
        results.push({
          type: 'customer',
          template: template.setting_name,
          success: false,
          error: (error as Error).message
        });
      }
    }

    // Lade Admin-E-Mail-Adresse aus Einstellungen
    const { data: adminSettingsData } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'admin_config')
      .single();

    let adminEmail = 'admin@brennholz-koenig.de'; // Fallback
    if (adminSettingsData) {
      try {
        const adminSettings = JSON.parse(adminSettingsData.setting_value);
        adminEmail = adminSettings.notification_email || adminEmail;
      } catch (e) {
        console.warn('[Order Notification] Could not parse admin settings');
      }
    }

    // Sende E-Mail an Admin
    for (const template of adminTemplates) {
      try {
        const subject = replacePlaceholders(template.template.subject, templateData);
        const htmlContent = replacePlaceholders(template.template.html_content, templateData);
        const textContent = replacePlaceholders(
          template.template.text_content || template.template.html_content.replace(/<[^>]*>/g, ''), 
          templateData
        );

        // Admin-spezifische Anpassungen
        const adminSubject = `[NEUE BESTELLUNG] ${subject}`;
        const adminHtml = `
          <div style="background-color: #f0f0f0; padding: 15px; margin-bottom: 20px; border-left: 4px solid #C04020; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #C04020;">🔔 Admin-Benachrichtigung</h3>
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Neue Bestellung eingegangen:</strong> ${orderData.order_number}<br>
              <strong>Kunde:</strong> ${orderData.customer_name} (${orderData.customer_email})<br>
              <strong>Betrag:</strong> ${orderData.order_total}<br>
              <strong>Datum:</strong> ${orderData.order_date}
            </p>
          </div>
          ${htmlContent}
        `;

        console.log('[Order Notification] Sending admin email:', {
          template: template.setting_name,
          to: adminEmail,
          subject: adminSubject
        });

        const result = await sendEmail({
          to: adminEmail,
          subject: adminSubject,
          html: adminHtml,
          text: `[NEUE BESTELLUNG] ${textContent}`
        });

        results.push({
          type: 'admin',
          template: template.setting_name,
          success: result.success,
          error: result.error
        });

        // Log E-Mail-Versand
        await supabase
          .from('app_settings')
          .insert({
            setting_type: 'email_log',
            setting_key: `admin_notification_${Date.now()}`,
            setting_value: JSON.stringify({
              type: 'order_confirmation_admin',
              order_number: orderData.order_number,
              to: adminEmail,
              subject: adminSubject,
              template_id: template.id,
              status: result.success ? 'sent' : 'failed',
              error: result.error,
              sent_at: new Date().toISOString()
            }),
            description: `Admin-Benachrichtigung für Bestellung: ${orderData.order_number}`
          });

      } catch (error) {
        console.error('[Order Notification] Error sending admin email:', error);
        results.push({
          type: 'admin',
          template: template.setting_name,
          success: false,
          error: (error as Error).message
        });
      }
    }

    // Zusammenfassung
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log('[Order Notification] Summary:', {
      total: totalCount,
      success: successCount,
      failed: totalCount - successCount,
      results
    });

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount}/${totalCount} E-Mails erfolgreich versendet`,
      results,
      order_number: orderData.order_number
    });

  } catch (error) {
    console.error('[Order Notification] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unerwarteter Fehler beim Versenden der E-Mails',
      details: (error as Error).message
    }, { status: 500 });
  }
}