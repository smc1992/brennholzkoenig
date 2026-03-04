import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, customerEmail, customerName, status, trackingNumber } = await req.json();

    if (!orderId || !customerEmail || !status) {
      return new Response(
        JSON.stringify({ error: 'orderId, customerEmail und status sind erforderlich' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const statusMessages = {
      'pending': 'Ihre Bestellung wird bearbeitet',
      'confirmed': 'Ihre Bestellung wurde bestätigt',
      'processing': 'Ihre Bestellung wird vorbereitet',
      'shipped': 'Ihre Bestellung wurde versandt',
      'delivered': 'Ihre Bestellung wurde zugestellt',
      'cancelled': 'Ihre Bestellung wurde storniert'
    };

    const statusMessage = statusMessages[status] || 'Bestellstatus wurde aktualisiert';
    
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Brennholz König</h1>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hallo ${customerName},</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            ${statusMessage}
          </p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">Bestelldetails:</h3>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Bestellnummer:</strong> ${orderId}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Status:</strong> ${statusMessage}</p>
            ${trackingNumber ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Sendungsverfolgung:</strong> ${trackingNumber}</p>` : ''}
          </div>
    `;

    if (status === 'shipped' && trackingNumber) {
      emailContent += `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;">
            <strong>📦 Sendungsverfolgung:</strong><br>
            Ihre Sendung können Sie mit der Nummer ${trackingNumber} verfolgen.
          </p>
        </div>
      `;
    }

    emailContent += `
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Bei Fragen stehen wir Ihnen gerne zur Verfügung.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Mit freundlichen Grüßen<br>
              Ihr Brennholz König Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Brennholz König | info@brennholz-koenig.de | www.brennholz-koenig.de
          </p>
        </div>
      </div>
    `;

    const emailData = {
      from: 'Brennholz König <info@brennholz-koenig.de>',
      to: [customerEmail],
      subject: `Bestellstatus Update - Bestellung #${orderId}`,
      html: emailContent,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API Error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bestellstatus-Benachrichtigung wurde gesendet',
        emailId: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Senden der Benachrichtigung', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});