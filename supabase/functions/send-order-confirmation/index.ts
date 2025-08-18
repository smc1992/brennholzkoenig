import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderData, customerEmail, customerName } = await req.json()

    // E-Mail-Template für Bestellbestätigung
    const orderConfirmationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #C04020, #A03318); color: white; padding: 30px 20px; text-align: center; }
            .logo { font-family: 'Pacifico', serif; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C04020; }
            .items-list { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .item:last-child { border-bottom: none; }
            .total { background: #C04020; color: white; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; }
            .steps { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step { margin: 10px 0; padding-left: 20px; position: relative; }
            .step::before { content: "✓"; position: absolute; left: 0; color: #28a745; font-weight: bold; }
            .contact-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #1A1A1A; color: white; padding: 30px 20px; text-align: center; }
            .footer p { margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔥 Brennholzkönig</div>
                <h1>Bestellbestätigung</h1>
                <p>Vielen Dank für Ihr Vertrauen!</p>
            </div>
            
            <div class="content">
                <p><strong>Lieber ${customerName},</strong></p>
                
                <p>herzlichen Dank für Ihre Bestellung bei Brennholzkönig! Wir haben Ihre Bestellung erhalten und werden sie schnellstmöglich bearbeiten.</p>
                
                <div class="order-details">
                    <h3 style="margin-top: 0; color: #C04020;">📦 Ihre Bestelldetails</h3>
                    
                    <p><strong>Bestellnummer:</strong> #${orderData.orderNumber || 'BK-' + Date.now()}</p>
                    <p><strong>Bestelldatum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
                    <p><strong>Bestellzeit:</strong> ${new Date().toLocaleTimeString('de-DE')}</p>
                    
                    <h4 style="color: #C04020;">🪵 Bestellte Artikel:</h4>
                    <div class="items-list">
                        ${orderData.items?.map(item => `
                            <div class="item">
                                <span><strong>${item.name}</strong><br>
                                <small>${item.quantity} ${item.unit} × €${parseFloat(item.price).toFixed(2)}</small></span>
                                <span><strong>€${(item.quantity * parseFloat(item.price)).toFixed(2)}</strong></span>
                            </div>
                        `).join('') || '<div class="item"><span>Artikel-Details werden nachgereicht</span><span>-</span></div>'}
                    </div>
                    
                    <div class="total">
                        Gesamtbetrag: €${orderData.totalAmount?.toFixed(2) || '0.00'}
                    </div>
                    
                    <p><strong>🚚 Lieferadresse:</strong><br>
                    ${orderData.deliveryAddress || 'Wird bei der Liefertermin-Vereinbarung festgelegt'}</p>
                </div>
                
                <div class="steps">
                    <h3 style="margin-top: 0; color: #C04020;">📞 So geht es weiter:</h3>
                    <div class="step">Wir melden uns <strong>innerhalb von 24 Stunden</strong> bei Ihnen telefonisch</div>
                    <div class="step">Gemeinsam vereinbaren wir einen <strong>passenden Liefertermin</strong></div>
                    <div class="step">Unser erfahrenes Team liefert Ihr <strong>Premium-Brennholz</strong> direkt zu Ihnen</div>
                    <div class="step">Bezahlung erfolgt bequem <strong>bei Lieferung</strong> (Bar oder EC-Karte)</div>
                    <div class="step">Sie erhalten eine <strong>Rechnung mit ausgewiesener MwSt.</strong></div>
                </div>
                
                <div class="contact-box">
                    <h3 style="margin-top: 0; color: #C04020;">📞 Haben Sie Fragen?</h3>
                    <p><strong>Rufen Sie uns gerne an:</strong></p>
                    <p>📱 <strong>0176-22572100</strong> (Mobil - auch WhatsApp)</p>
                    <p>☎️ <strong>0561-43071895</strong> (Festnetz)</p>
                    <p>📧 <strong>info@brennholzkoenig.de</strong></p>
                    <p><em>Montag bis Freitag: 8:00 - 18:00 Uhr<br>Samstag: 8:00 - 14:00 Uhr</em></p>
                </div>
                
                <p><strong>Warum Brennholzkönig?</strong></p>
                <ul style="color: #666;">
                    <li>✅ <strong>27 Jahre Erfahrung</strong> im Brennholzhandel</li>
                    <li>✅ <strong>70% höherer Heizwert</strong> durch optimale Trocknung</li>
                    <li>✅ <strong>Kammergetrocknet</strong> auf unter 20% Restfeuchte</li>
                    <li>✅ <strong>Saubere Lieferung</strong> direkt vor Ihre Haustür</li>
                    <li>✅ <strong>Faire Preise</strong> - keine versteckten Kosten</li>
                </ul>
                
                <p style="margin-top: 30px;">Freundliche Grüße aus der schönen Rhön,<br>
                <strong>Ihr Brennholzkönig-Team</strong><br>
                <em>Brennholzhandel Vey</em></p>
            </div>
            
            <div class="footer">
                <p><strong>🔥 Brennholzkönig - Premium Brennholz seit 1997</strong></p>
                <p>Brennholzhandel Vey | Frankfurter Straße 3, 36419 Buttlar</p>
                <p>Tel: 0561-43071895 | Mobil: 0176-22572100</p>
                <p style="margin-top: 15px; font-style: italic; color: #C04020;">
                    "Wärme, die von Herzen kommt - Brennholz, das begeistert!"
                </p>
            </div>
        </div>
    </body>
    </html>
    `

    const textVersion = `
Lieber ${customerName},

vielen Dank für Ihre Bestellung bei Brennholzkönig!

BESTELLDETAILS:
- Bestellnummer: #${orderData.orderNumber || 'BK-' + Date.now()}
- Bestelldatum: ${new Date().toLocaleDateString('de-DE')}
- Gesamtbetrag: €${orderData.totalAmount?.toFixed(2) || '0.00'}

BESTELLTE ARTIKEL:
${orderData.items?.map(item => `- ${item.name}: ${item.quantity} ${item.unit} × €${parseFloat(item.price).toFixed(2)} = €${(item.quantity * parseFloat(item.price)).toFixed(2)}`).join('\n') || '- Artikel-Details werden nachgereicht'}

SO GEHT ES WEITER:
✓ Wir melden uns innerhalb von 24 Stunden bei Ihnen
✓ Gemeinsam vereinbaren wir einen passenden Liefertermin  
✓ Lieferung direkt zu Ihnen nach Hause
✓ Bezahlung bequem bei Lieferung

KONTAKT:
Tel: 0561-43071895 | Mobil: 0176-22572100
E-Mail: info@brennholzkoenig.de

Freundliche Grüße,
Ihr Brennholzkönig-Team
Brennholzhandel Vey
    `

    // E-Mail über Edge Function senden
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        to: customerEmail,
        subject: `🔥 Bestellbestätigung Brennholzkönig - Bestellung #${orderData.orderNumber || 'BK-' + Date.now()}`,
        html: orderConfirmationHTML,
        text: textVersion,
        type: 'order_confirmation'
      })
    })

    const emailResult = await emailResponse.json()

    if (!emailResult.success) {
      throw new Error('Fehler beim E-Mail-Versand: ' + emailResult.error)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bestellbestätigung erfolgreich gesendet',
        emailId: emailResult.emailId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Bestellbestätigung-Fehler:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Fehler beim Versand der Bestellbestätigung'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})