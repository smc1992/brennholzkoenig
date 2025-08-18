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
    const { to, message, settings } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Telefonnummer und Nachricht sind erforderlich' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Twilio SMS senden
    if (settings.provider === 'twilio') {
      const accountSid = settings.twilio_account_sid
      const authToken = settings.twilio_auth_token
      const fromNumber = settings.twilio_phone_number

      if (!accountSid || !authToken || !fromNumber) {
        return new Response(
          JSON.stringify({ error: 'Twilio-Konfiguration unvollständig' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
      
      const params = new URLSearchParams()
      params.append('To', to)
      params.append('From', fromNumber)
      params.append('Body', message)

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      if (response.ok) {
        const result = await response.json()
        return new Response(
          JSON.stringify({ 
            success: true, 
            messageId: result.sid,
            status: result.status 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        const error = await response.json()
        return new Response(
          JSON.stringify({ error: `Twilio Fehler: ${error.message}` }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'SMS-Provider nicht unterstützt' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('SMS Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})