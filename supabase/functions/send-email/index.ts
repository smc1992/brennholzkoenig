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

    // Supabase Client für SMTP-Einstellungen
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // SMTP-Einstellungen aus zentraler Konfiguration laden
    async function loadSMTPSettings() {
      // 1) Primär: JSON-Konfiguration unter setting_type = 'smtp_config'
      const { data: jsonRow } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'smtp_config')
        .single()

      if (jsonRow?.setting_value) {
        try {
          const parsed = JSON.parse(jsonRow.setting_value)
          if (parsed.smtp_host && parsed.smtp_username && parsed.smtp_password) {
            return {
              host: parsed.smtp_host,
              port: parseInt(String(parsed.smtp_port || '587')),
              username: parsed.smtp_username,
              password: parsed.smtp_password,
              fromEmail: parsed.from_email || parsed.smtp_username,
              fromName: parsed.from_name || 'Brennholzkönig',
              secure: parsed.smtp_port == 465
            }
          }
        } catch (e) {
          console.error('Ungültiges JSON in smtp_config:', e)
        }
      }

      // 2) Fallback: Key-Value-Konfiguration unter setting_type = 'smtp'
      const { data: kvData } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .eq('setting_type', 'smtp')

      if (kvData?.length > 0) {
        const kv: Record<string, string> = {}
        kvData.forEach((item: any) => {
          kv[item.setting_key] = item.setting_value
        })

        if (kv.smtp_host && kv.smtp_username && kv.smtp_password) {
          const port = parseInt(kv.smtp_port || '587')
          return {
            host: kv.smtp_host,
            port: port,
            username: kv.smtp_username,
            password: kv.smtp_password,
            fromEmail: kv.smtp_from_email || kv.smtp_username,
            fromName: kv.smtp_from_name || 'Brennholzkönig',
            secure: port === 465
          }
        }
      }

      // 3) Fallback zu Umgebungsvariablen
      const envHost = Deno.env.get('SMTP_HOST')
      const envUser = Deno.env.get('SMTP_USER')
      const envPass = Deno.env.get('SMTP_PASS')
      
      if (envHost && envUser && envPass) {
        const port = parseInt(Deno.env.get('SMTP_PORT') || '587')
        return {
          host: envHost,
          port: port,
          username: envUser,
          password: envPass,
          fromEmail: Deno.env.get('FROM_EMAIL') || envUser,
          fromName: Deno.env.get('FROM_NAME') || 'Brennholzkönig',
          secure: port === 465
        }
      }

      throw new Error('Keine SMTP-Konfiguration gefunden. Bitte konfigurieren Sie SMTP im Admin-Dashboard.')
    }

    const smtpConfig = await loadSMTPSettings()

    // SMTP-Client konfigurieren
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.host,
        port: smtpConfig.port,
        tls: smtpConfig.secure,
        auth: {
          username: smtpConfig.username,
          password: smtpConfig.password,
        },
      },
    })

    // E-Mail senden
    await client.send({
      from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: to,
      subject: subject,
      content: text,
      html: html,
    })

    await client.close()

    // Analytics Event für E-Mail-Versand (Supabase Client bereits initialisiert)

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