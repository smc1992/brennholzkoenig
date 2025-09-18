import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Template-Platzhalter ersetzen
function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`
    const value = data[key] || ''
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  })
  return result
}

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

    // Supabase Client initialisieren
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // SMTP-Einstellungen aus der app_settings Tabelle laden
    const { data: smtpSettings, error: smtpError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'smtp')

    // Fallback SMTP-Konfiguration für Entwicklung
    let smtpConfig: Record<string, string> = {
      smtp_host: 'smtp.gmail.com',
      smtp_port: '587',
      smtp_secure: 'false',
      smtp_username: 'test@gmail.com',
      smtp_password: 'test-password',
      smtp_from_email: 'noreply@brennholzkoenig.de',
      smtp_from_name: 'Brennholzkönig'
    }

    // Wenn SMTP-Einstellungen in der Datenbank vorhanden sind, diese verwenden
    if (smtpSettings && smtpSettings.length > 0) {
      const dbConfig: Record<string, string> = {}
      smtpSettings.forEach((setting: any) => {
        dbConfig[setting.setting_key] = setting.setting_value
      })
      smtpConfig = { ...smtpConfig, ...dbConfig }
    }

    // E-Mail-Template aus Admin-Bereich laden
    const { data: emailTemplates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'order_confirmation')
      .eq('is_active', true)
      .limit(1)

    let emailTemplate = null
    if (emailTemplates && emailTemplates.length > 0) {
      emailTemplate = emailTemplates[0]
    }

    // Fallback-Template falls keines in der DB vorhanden ist
    if (!emailTemplate) {
      emailTemplate = {
        subject: 'Bestellbestätigung #{order_id} - Brennholzkönig',
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bestellbestätigung - Brennholzkönig</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .order-details { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 24px; font-weight: bold;">🔥 Brennholzkönig</div>
            <p>Premium Brennholz direkt vom Produzenten</p>
        </div>
        <div class="content">
            <h2>Vielen Dank für Ihre Bestellung!</h2>
            <p>Hallo {customer_name},</p>
            <p>wir haben Ihre Bestellung erfolgreich erhalten und bestätigen hiermit den Eingang.</p>
            <div class="order-details">
                <h3>Bestelldetails</h3>
                <p><strong>Bestellnummer:</strong> #{order_id}</p>
                <p><strong>Bestelldatum:</strong> {order_date}</p>
                <p><strong>Gesamtbetrag:</strong> {total_amount}€</p>
                <p><strong>Lieferadresse:</strong><br>{delivery_address}</p>
            </div>
            <p>Ihre Bestellung wird schnellstmöglich bearbeitet. Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versendet wurde.</p>
        </div>
        <div class="footer">
            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>
            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>
        </div>
    </div>
</body>
</html>`,
        text_content: `Vielen Dank für Ihre Bestellung!

Hallo {customer_name},

wir haben Ihre Bestellung erfolgreich erhalten und bestätigen hiermit den Eingang.

Bestelldetails:
- Bestellnummer: #{order_id}
- Bestelldatum: {order_date}
- Gesamtbetrag: {total_amount}€
- Lieferadresse: {delivery_address}

Ihre Bestellung wird schnellstmöglich bearbeitet.

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`
      }
    }

    // Template-Daten vorbereiten
    const templateData = {
      customer_name: customerData.name,
      order_id: orderData.id,
      order_date: new Date().toLocaleDateString('de-DE'),
      total_amount: orderData.total,
      delivery_address: `${customerData.address}\n${customerData.postalCode} ${customerData.city}`,
      order_tracking_url: `https://brennholzkoenig.de/konto/bestellungen/${orderData.id}`
    }

    // Platzhalter im Template ersetzen
    const emailSubject = replacePlaceholders(emailTemplate.subject, templateData)
    const emailHtml = replacePlaceholders(emailTemplate.html_content, templateData)
    const emailText = emailTemplate.text_content ? replacePlaceholders(emailTemplate.text_content, templateData) : ''

    // Prüfe ob wir in der Entwicklung sind oder echte SMTP-Daten haben
    const isDevelopment = process.env.NODE_ENV === 'development'
    // Im Entwicklungsmodus simulieren wir standardmäßig, es sei denn FORCE_REAL_EMAIL=true
    const forceRealEmail = process.env.FORCE_REAL_EMAIL === 'true'
    const shouldSimulate = isDevelopment && !forceRealEmail
    
    console.log('🔍 E-Mail-Modus-Check:', {
      NODE_ENV: process.env.NODE_ENV,
      isDevelopment,
      forceRealEmail,
      shouldSimulate,
      passwordLength: smtpConfig.smtp_password?.length || 0
    })

    // Nodemailer Transporter nur erstellen wenn nötig
    let transporter = null
    if (!shouldSimulate) {
      transporter = nodemailer.createTransport({
        host: smtpConfig.smtp_host,
        port: parseInt(smtpConfig.smtp_port),
        secure: smtpConfig.smtp_secure === 'true',
        auth: {
          user: smtpConfig.smtp_username,
          pass: smtpConfig.smtp_password,
        },
      })
    }

    // Kunden-E-Mail vorbereiten
    const customerMailOptions = {
      from: `"${smtpConfig.smtp_from_name}" <${smtpConfig.smtp_from_email}>`,
      to: customerData.email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    }

    // Admin-E-Mail vorbereiten
    const adminSubject = `Neue Bestellung #{order_id} eingegangen - Brennholzkönig`.replace('{order_id}', orderData.id)
    const adminHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Neue Bestellung - Admin Benachrichtigung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .order-details { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 24px; font-weight: bold;">🔥 Brennholzkönig Admin</div>
            <p>Neue Bestellung eingegangen</p>
        </div>
        <div class="content">
            <h2>Neue Bestellung erhalten!</h2>
            <div class="order-details">
                <h3>Bestelldetails</h3>
                <p><strong>Bestellnummer:</strong> #${orderData.id}</p>
                <p><strong>Bestelldatum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
                <p><strong>Gesamtbetrag:</strong> ${orderData.total}€</p>
                <p><strong>Kunde:</strong> ${customerData.name}</p>
                <p><strong>E-Mail:</strong> ${customerData.email}</p>
                <p><strong>Lieferadresse:</strong><br>${customerData.address}<br>${customerData.postalCode} ${customerData.city}</p>
            </div>
            <p>Bitte bearbeiten Sie diese Bestellung zeitnah.</p>
        </div>
    </div>
</body>
</html>`

    const adminMailOptions = {
      from: `"${smtpConfig.smtp_from_name}" <${smtpConfig.smtp_from_email}>`,
      to: smtpConfig.smtp_from_email, // Admin-E-Mail an die From-Adresse
      subject: adminSubject,
      html: adminHtml,
      text: `Neue Bestellung eingegangen!\n\nBestellnummer: #${orderData.id}\nKunde: ${customerData.name}\nE-Mail: ${customerData.email}\nGesamtbetrag: ${orderData.total}€\nLieferadresse: ${customerData.address}, ${customerData.postalCode} ${customerData.city}`
    }

    console.log('📧 Sende E-Mails an:', {
      customer: customerData.email,
      admin: smtpConfig.smtp_from_email
    })
    console.log('📧 SMTP-Konfiguration:', {
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port,
      from: customerMailOptions.from
    })

    if (shouldSimulate) {
      // Entwicklungsmodus: E-Mails simulieren
      console.log('🔧 ENTWICKLUNGSMODUS: E-Mails werden simuliert')
      console.log('📧 Kunden-E-Mail:', {
        to: customerMailOptions.to,
        subject: customerMailOptions.subject,
        from: customerMailOptions.from
      })
      console.log('📧 Admin-E-Mail:', {
        to: adminMailOptions.to,
        subject: adminMailOptions.subject,
        from: adminMailOptions.from
      })
      console.log('✅ Beide E-Mails erfolgreich simuliert (Entwicklungsmodus)')
    } else {
      // Produktionsmodus: Echten E-Mail-Versand durchführen
      console.log('🚀 PRODUKTIONSMODUS: Sende echte E-Mails')
      if (transporter) {
        // Kunden-E-Mail senden
        await transporter.sendMail(customerMailOptions)
        console.log('✅ Kunden-E-Mail erfolgreich versendet')
        
        // Admin-E-Mail senden
        await transporter.sendMail(adminMailOptions)
        console.log('✅ Admin-E-Mail erfolgreich versendet')
      } else {
        throw new Error('Transporter nicht verfügbar')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bestellbestätigung erfolgreich versendet',
      emailDetails: {
        customer: {
          to: customerData.email,
          subject: customerMailOptions.subject
        },
        admin: {
          to: adminMailOptions.to,
          subject: adminMailOptions.subject
        },
        orderId: orderData.id,
        total: orderData.total
      }
    });
    
  } catch (error) {
    console.error('Fehler:', error);
    
    return NextResponse.json(
      { success: false, message: 'Fehler aufgetreten' },
      { status: 500 }
    );
  }
}