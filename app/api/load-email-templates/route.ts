import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Lade E-Mail-Templates...')

    // Supabase Client erstellen
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`)
    }
    
    console.log('🔑 Using Supabase URL:', supabaseUrl)
    console.log('🔑 Using Anon Key:', supabaseKey.substring(0, 20) + '...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // E-Mail-Templates definieren
    const emailTemplates = [
      {
        setting_type: 'email_template',
        setting_key: 'order_confirmation',
        setting_value: JSON.stringify({
          template_key: 'order_confirmation',
          template_name: 'Bestellbestätigung',
          template_type: 'order_confirmation',
          subject: 'Ihre Bestellung bei Brennholzkönig - Bestätigung #{order_id}',
          html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bestellbestätigung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { padding: 30px; }
        .order-details { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔥 Brennholzkönig</div>
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
                <p><strong>Lieferadresse:</strong><br>
                {delivery_address}</p>
            </div>
            
            <p>Ihre Bestellung wird schnellstmöglich bearbeitet. Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versendet wurde.</p>
            
            <a href="{order_tracking_url}" class="button">Bestellung verfolgen</a>
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

Ihre Bestellung wird schnellstmöglich bearbeitet. Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versendet wurde.

Bestellung verfolgen: {order_tracking_url}

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`,
          variables: ['customer_name', 'order_id', 'order_date', 'total_amount', 'delivery_address', 'order_tracking_url'],
          is_active: true,
          description: 'Automatische Bestätigung nach Bestelleingang'
        }),
        description: 'Email template: Bestellbestätigung'
      },
      {
        setting_type: 'email_template',
        setting_key: 'admin_new_order',
        setting_value: JSON.stringify({
          template_key: 'admin_new_order',
          template_name: 'Admin: Neue Bestellung',
          template_type: 'admin_notification',
          subject: 'Neue Bestellung #{order_id} eingegangen',
          html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neue Bestellung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .order-summary { background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
        .customer-info { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔔 Neue Bestellung eingegangen</h2>
        </div>
        
        <div class="content">
            <h3>Bestelldetails</h3>
            
            <div class="order-summary">
                <p><strong>Bestellnummer:</strong> #{order_id}</p>
                <p><strong>Bestelldatum:</strong> {order_date}</p>
                <p><strong>Gesamtbetrag:</strong> {total_amount}€</p>
                <p><strong>Zahlungsstatus:</strong> {payment_status}</p>
            </div>
            
            <div class="customer-info">
                <h4>Kundeninformationen</h4>
                <p><strong>Name:</strong> {customer_name}</p>
                <p><strong>E-Mail:</strong> {customer_email}</p>
                <p><strong>Telefon:</strong> {customer_phone}</p>
                <p><strong>Lieferadresse:</strong><br>{delivery_address}</p>
            </div>
            
            <h4>Bestellte Artikel</h4>
            <div>{order_items}</div>
            
            <a href="{admin_order_url}" class="button">Bestellung im Admin bearbeiten</a>
        </div>
    </div>
</body>
</html>`,
          text_content: `Neue Bestellung eingegangen

Bestelldetails:
- Bestellnummer: #{order_id}
- Bestelldatum: {order_date}
- Gesamtbetrag: {total_amount}€
- Zahlungsstatus: {payment_status}

Kundeninformationen:
- Name: {customer_name}
- E-Mail: {customer_email}
- Telefon: {customer_phone}
- Lieferadresse: {delivery_address}

Bestellte Artikel:
{order_items}

Bestellung im Admin bearbeiten: {admin_order_url}`,
          variables: ['order_id', 'order_date', 'total_amount', 'payment_status', 'customer_name', 'customer_email', 'customer_phone', 'delivery_address', 'order_items', 'admin_order_url'],
          is_active: true,
          description: 'Admin-Benachrichtigung bei neuen Bestellungen'
        }),
        description: 'Email template: Admin: Neue Bestellung'
      },
      {
        setting_type: 'email_template',
        setting_key: 'shipping_notification',
        setting_value: JSON.stringify({
          template_key: 'shipping_notification',
          template_name: 'Versandbenachrichtigung',
          template_type: 'shipping_notification',
          subject: 'Ihre Brennholz-Bestellung #{order_id} ist unterwegs!',
          html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Versandbenachrichtigung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { padding: 30px; }
        .shipping-details { background-color: #d4edda; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚚 Brennholzkönig</div>
            <p>Ihre Bestellung ist unterwegs!</p>
        </div>
        
        <div class="content">
            <h2>Gute Nachrichten!</h2>
            <p>Hallo {customer_name},</p>
            <p>Ihre Brennholz-Bestellung wurde versendet und ist nun auf dem Weg zu Ihnen.</p>
            
            <div class="shipping-details">
                <h3>Versanddetails</h3>
                <p><strong>Bestellnummer:</strong> #{order_id}</p>
                <p><strong>Versanddatum:</strong> {shipping_date}</p>
                <p><strong>Voraussichtliche Lieferung:</strong> {delivery_date}</p>
                <p><strong>Tracking-Nummer:</strong> {tracking_number}</p>
                <p><strong>Lieferadresse:</strong><br>
                {delivery_address}</p>
            </div>
            
            <p>Bitte stellen Sie sicher, dass jemand zur Lieferzeit anwesend ist, um die Ware entgegenzunehmen.</p>
            
            <a href="{tracking_url}" class="button">Sendung verfolgen</a>
        </div>
        
        <div class="footer">
            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>
            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>
        </div>
    </div>
</body>
</html>`,
          text_content: `Gute Nachrichten!

Hallo {customer_name},

Ihre Brennholz-Bestellung wurde versendet und ist nun auf dem Weg zu Ihnen.

Versanddetails:
- Bestellnummer: #{order_id}
- Versanddatum: {shipping_date}
- Voraussichtliche Lieferung: {delivery_date}
- Tracking-Nummer: {tracking_number}
- Lieferadresse: {delivery_address}

Bitte stellen Sie sicher, dass jemand zur Lieferzeit anwesend ist, um die Ware entgegenzunehmen.

Sendung verfolgen: {tracking_url}

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`,
          variables: ['customer_name', 'order_id', 'shipping_date', 'delivery_date', 'tracking_number', 'delivery_address', 'tracking_url'],
          is_active: true,
          description: 'Benachrichtigung über Versand der Bestellung'
        }),
        description: 'Email template: Versandbenachrichtigung'
      },
      {
        setting_type: 'email_template',
        setting_key: 'newsletter',
        setting_value: JSON.stringify({
          template_key: 'newsletter',
          template_name: 'Newsletter Premium',
          template_type: 'newsletter',
          subject: 'Brennholzkönig Newsletter - {newsletter_title}',
          html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { padding: 30px; }
        .newsletter-content { line-height: 1.6; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .unsubscribe { font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔥 Brennholzkönig</div>
            <p>Premium Brennholz Newsletter</p>
        </div>
        
        <div class="content">
            <h2>{newsletter_title}</h2>
            <p>Hallo {customer_name},</p>
            
            <div class="newsletter-content">
                {newsletter_content}
            </div>
            
            <a href="{shop_url}" class="button">Jetzt bestellen</a>
            
            <div class="unsubscribe">
                <p>Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.</p>
                <p><a href="{unsubscribe_url}">Hier abmelden</a></p>
            </div>
        </div>
        
        <div class="footer">
            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>
            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>
        </div>
    </div>
</body>
</html>`,
          text_content: `{newsletter_title}

Hallo {customer_name},

{newsletter_content}

Jetzt bestellen: {shop_url}

Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.
Hier abmelden: {unsubscribe_url}

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`,
          variables: ['customer_name', 'newsletter_title', 'newsletter_content', 'shop_url', 'unsubscribe_url'],
          is_active: true,
          description: 'Newsletter für Kunden und Interessenten'
        }),
        description: 'Email template: Newsletter Premium'
      },
      {
        setting_type: 'email_template',
        setting_key: 'low_stock',
        setting_value: JSON.stringify({
          template_key: 'low_stock',
          template_name: 'Lagerbestand Warnung',
          template_type: 'low_stock',
          subject: '⚠️ Niedriger Lagerbestand: {product_name}',
          html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lagerbestand Warnung</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .warning-box { background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
        .product-info { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>⚠️ Lagerbestand Warnung</h2>
        </div>
        
        <div class="content">
            <div class="warning-box">
                <h3>Niedriger Lagerbestand erkannt!</h3>
                <p>Das folgende Produkt hat einen kritisch niedrigen Lagerbestand erreicht:</p>
            </div>
            
            <div class="product-info">
                <h4>Produktinformationen</h4>
                <p><strong>Produktname:</strong> {product_name}</p>
                <p><strong>SKU:</strong> {product_sku}</p>
                <p><strong>Aktueller Bestand:</strong> {current_stock} Einheiten</p>
                <p><strong>Mindestbestand:</strong> {minimum_stock} Einheiten</p>
                <p><strong>Warnschwelle:</strong> {warning_threshold} Einheiten</p>
            </div>
            
            <p>Bitte prüfen Sie den Lagerbestand und bestellen Sie gegebenenfalls nach.</p>
            
            <a href="{admin_product_url}" class="button">Produkt im Admin bearbeiten</a>
        </div>
    </div>
</body>
</html>`,
          text_content: `Lagerbestand Warnung

Niedriger Lagerbestand erkannt!

Das folgende Produkt hat einen kritisch niedrigen Lagerbestand erreicht:

Produktinformationen:
- Produktname: {product_name}
- SKU: {product_sku}
- Aktueller Bestand: {current_stock} Einheiten
- Mindestbestand: {minimum_stock} Einheiten
- Warnschwelle: {warning_threshold} Einheiten

Bitte prüfen Sie den Lagerbestand und bestellen Sie gegebenenfalls nach.

Produkt im Admin bearbeiten: {admin_product_url}`,
          variables: ['product_name', 'product_sku', 'current_stock', 'minimum_stock', 'warning_threshold', 'admin_product_url'],
          is_active: true,
          description: 'Warnung bei niedrigem Lagerbestand'
        }),
        description: 'Email template: Lagerbestand Warnung'
      },
      {
        setting_type: 'email_template',
        setting_key: 'welcome',
        setting_value: JSON.stringify({
          template_key: 'welcome',
          template_name: 'Willkommen Neukunde',
          template_type: 'welcome',
          subject: 'Willkommen bei Brennholzkönig! 🔥',
          html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Willkommen</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #C04020; color: white; padding: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { padding: 30px; }
        .welcome-box { background-color: #d4edda; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
        .benefits { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background-color: #1A1A1A; color: white; padding: 20px; text-align: center; }
        .button { background-color: #C04020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔥 Brennholzkönig</div>
            <p>Premium Brennholz direkt vom Produzenten</p>
        </div>
        
        <div class="content">
            <div class="welcome-box">
                <h2>Herzlich willkommen!</h2>
                <p>Hallo {customer_name},</p>
                <p>vielen Dank für Ihre Registrierung bei Brennholzkönig! Wir freuen uns, Sie als neuen Kunden begrüßen zu dürfen.</p>
            </div>
            
            <div class="benefits">
                <h3>Ihre Vorteile als Brennholzkönig-Kunde:</h3>
                <ul>
                    <li>🌲 Premium Brennholz aus nachhaltiger Forstwirtschaft</li>
                    <li>🚚 Zuverlässige Lieferung direkt vor Ihre Haustür</li>
                    <li>💰 Faire Preise ohne Zwischenhändler</li>
                    <li>🔥 Optimal getrocknetes Holz für beste Brennwerte</li>
                    <li>📞 Persönlicher Kundenservice</li>
                    <li>📧 Exklusive Angebote und Newsletter</li>
                </ul>
            </div>
            
            <p>Stöbern Sie jetzt in unserem Sortiment und entdecken Sie unser hochwertiges Brennholz!</p>
            
            <a href="{shop_url}" class="button">Jetzt einkaufen</a>
            
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung. Kontaktieren Sie uns einfach!</p>
        </div>
        
        <div class="footer">
            <p>Brennholzkönig - Ihr Partner für Premium Brennholz</p>
            <p>Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de</p>
        </div>
    </div>
</body>
</html>`,
          text_content: `Herzlich willkommen!

Hallo {customer_name},

vielen Dank für Ihre Registrierung bei Brennholzkönig! Wir freuen uns, Sie als neuen Kunden begrüßen zu dürfen.

Ihre Vorteile als Brennholzkönig-Kunde:
- Premium Brennholz aus nachhaltiger Forstwirtschaft
- Zuverlässige Lieferung direkt vor Ihre Haustür
- Faire Preise ohne Zwischenhändler
- Optimal getrocknetes Holz für beste Brennwerte
- Persönlicher Kundenservice
- Exklusive Angebote und Newsletter

Stöbern Sie jetzt in unserem Sortiment und entdecken Sie unser hochwertiges Brennholz!

Jetzt einkaufen: {shop_url}

Bei Fragen stehen wir Ihnen gerne zur Verfügung. Kontaktieren Sie uns einfach!

Brennholzkönig - Ihr Partner für Premium Brennholz
Bei Fragen erreichen Sie uns unter: info@brennholz-koenig.de`,
          variables: ['customer_name', 'shop_url'],
          is_active: true,
          description: 'Willkommens-E-Mail für neue Kunden'
        }),
        description: 'Email template: Willkommen Neukunde'
      }
    ]

    // Templates in die Datenbank einfügen
    const results = []
    for (const template of emailTemplates) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .upsert(template, { 
            onConflict: 'setting_type,setting_key',
            ignoreDuplicates: false 
          })
          .select()

        if (error) {
          console.error(`Fehler beim Einfügen von Template ${template.setting_key}:`, error)
          results.push({
            template: template.setting_key,
            success: false,
            error: error.message
          })
        } else {
          console.log(`✅ Template ${template.setting_key} erfolgreich eingefügt`)
          results.push({
            template: template.setting_key,
            success: true,
            data: data
          })
        }
      } catch (err) {
        console.error(`Fehler beim Verarbeiten von Template ${template.setting_key}:`, err)
        results.push({
          template: template.setting_key,
          success: false,
          error: (err as Error).message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: errorCount === 0,
      message: `${successCount} Templates erfolgreich geladen, ${errorCount} Fehler`,
      results: results,
      summary: {
        total: emailTemplates.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Fehler beim Laden der E-Mail-Templates:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der E-Mail-Templates',
      details: (error as Error).message
    }, { status: 500 })
  }
}