import { createClient } from '@supabase/supabase-js';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AbandonedCartEmailRequest {
  customer: Customer;
  cart_items: CartItem[];
  cart_total: number;
  cart_url: string;
}

interface EmailResponse {
  success: boolean;
  error?: string;
  message_id?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customer, cart_items, cart_total, cart_url }: AbandonedCartEmailRequest = await req.json();

    if (!customer?.email || !cart_items?.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' } as EmailResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate cart items HTML
    const cartItemsHtml = cart_items.map((item: CartItem) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">` : ''}
          <strong>${item.name}</strong>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}x
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
          €${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ihr Warenkorb wartet auf Sie</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: #2d5016; margin-bottom: 20px; text-align: center;">
            Ihr Warenkorb wartet auf Sie! 🛒
          </h1>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hallo ${customer.first_name},
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Sie haben einige großartige Brennholz-Produkte in Ihrem Warenkorb gelassen. 
            Verpassen Sie nicht diese hochwertigen Produkte!
          </p>
        </div>

        <div style="background: white; border: 1px solid #ddd; border-radius: 10px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #2d5016; margin-bottom: 20px;">Ihre Artikel:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 15px; text-align: left; border-bottom: 2px solid #2d5016;">Artikel</th>
                <th style="padding: 15px; text-align: center; border-bottom: 2px solid #2d5016;">Menge</th>
                <th style="padding: 15px; text-align: right; border-bottom: 2px solid #2d5016;">Preis</th>
              </tr>
            </thead>
            <tbody>
              ${cartItemsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f8f9fa;">
                <td colspan="2" style="padding: 20px; font-weight: bold; border-top: 2px solid #2d5016;">
                  Gesamtsumme:
                </td>
                <td style="padding: 20px; font-weight: bold; font-size: 18px; color: #2d5016; text-align: right; border-top: 2px solid #2d5016;">
                  €${cart_total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${cart_url}" 
             style="display: inline-block; background: #2d5016; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Jetzt bestellen und 10% sparen! 🔥
          </a>
          <p style="margin-top: 15px; font-size: 14px; color: #666;">
            Verwenden Sie den Code: COMEBACK10 (gültig für 24 Stunden)
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <h3 style="color: #2d5016; margin-bottom: 15px;">Warum unser Brennholz?</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">✅ Kammergetrocknetes Premium-Holz</li>
            <li style="margin-bottom: 10px;">✅ Nachhaltiger Anbau aus regionalen Wäldern</li>
            <li style="margin-bottom: 10px;">✅ Schnelle Lieferung direkt vor Ihre Haustür</li>
            <li style="margin-bottom: 10px;">✅ 100% Zufriedenheitsgarantie</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Falls Sie Fragen haben, antworten Sie einfach auf diese E-Mail oder kontaktieren Sie uns unter 
            <a href="mailto:info@brennholz-shop.de" style="color: #2d5016;">info@brennholz-shop.de</a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} Brennholz Shop. Alle Rechte vorbehalten.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email via Supabase function
    const { data, error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: customer.email,
        subject: `${customer.first_name}, Ihr Warenkorb wartet auf Sie! 🔥 (10% Rabatt)`,
        html: emailHtml,
        from: 'noreply@brennholz-shop.de'
      }
    });

    if (error) {
      console.error('Error sending abandoned cart email:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message } as EmailResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Log the email
    await supabaseClient.from('email_logs').insert({
      recipient: customer.email,
      subject: `${customer.first_name}, Ihr Warenkorb wartet auf Sie! 🔥 (10% Rabatt)`,
      type: 'abandoned_cart',
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, message_id: data?.message_id } as EmailResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    console.error('Error in abandoned cart email function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as EmailResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});