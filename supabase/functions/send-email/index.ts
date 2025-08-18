import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, type = 'general' } = await req.json()

    // SMTP-Konfiguration aus Umgebungsvariablen
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASS = Deno.env.get('SMTP_PASS')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER
    const FROM_NAME = Deno.env.get('FROM_NAME') || 'Brennholzkönig'

    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error('SMTP-Konfiguration fehlt. Bitte konfigurieren Sie SMTP im Admin-Dashboard.')
    }

    // SMTP-Client konfigurieren
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_PORT === 465,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    })

    // E-Mail senden
    await client.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: subject,
      content: text,
      html: html,
    })

    await client.close()

    // Analytics Event für E-Mail-Versand
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // E-Mail-Event protokollieren
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'email_sent',
        event_data: {
          type: type,
          to: to,
          subject: subject,
          status: 'sent',
          timestamp: new Date().toISOString()
        },
        user_id: null,
        session_id: null
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'E-Mail erfolgreich gesendet',
        emailId: `email_${Date.now()}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('E-Mail-Fehler:', error)
    
    // Fehler-Event protokollieren
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'email_failed',
          event_data: {
            error: error.message,
            timestamp: new Date().toISOString()
          },
          user_id: null,
          session_id: null
        })
    } catch {}
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Fehler beim E-Mail-Versand'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})