import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Environment Check gestartet')

    // Supabase Client erstellen
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`)
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // SMTP-Konfiguration aus der Datenbank laden
    const { data: smtpConfig, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .single()

    // E-Mail-Templates prüfen
    const { data: emailTemplates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')

    // Environment-Informationen sammeln
    const environmentInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      FORCE_REAL_EMAIL: process.env.FORCE_REAL_EMAIL,
      usedKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON_KEY',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host'),
      origin: request.headers.get('origin')
    }

    // SMTP-Konfiguration (ohne Passwort)
    const smtpInfo = smtpConfig ? {
      smtp_host: smtpConfig.smtp_host,
      smtp_port: smtpConfig.smtp_port,
      smtp_secure: smtpConfig.smtp_secure,
      smtp_username: smtpConfig.smtp_username,
      smtp_from_email: smtpConfig.smtp_from_email,
      smtp_from_name: smtpConfig.smtp_from_name,
      smtp_password_length: smtpConfig.smtp_password?.length || 0,
      created_at: smtpConfig.created_at,
      updated_at: smtpConfig.updated_at
    } : null

    // E-Mail-Templates Info
    const templatesInfo = emailTemplates ? emailTemplates.map(template => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      has_html_content: !!template.html_content,
      has_text_content: !!template.text_content,
      html_content_length: template.html_content?.length || 0,
      text_content_length: template.text_content?.length || 0,
      created_at: template.created_at,
      updated_at: template.updated_at
    })) : []

    // Produktionsmodus-Logik testen
    const isDevelopment = process.env.NODE_ENV === 'development'
    const forceRealEmail = process.env.FORCE_REAL_EMAIL === 'true'
    const shouldSimulate = isDevelopment && !forceRealEmail

    const modeInfo = {
      isDevelopment,
      forceRealEmail,
      shouldSimulate,
      willSendRealEmails: !shouldSimulate
    }

    console.log('🔍 Environment Debug Info:', {
      environment: environmentInfo,
      smtp: smtpInfo,
      mode: modeInfo,
      templatesCount: templatesInfo.length
    })

    return NextResponse.json({
      success: true,
      environment: environmentInfo,
      smtp: {
        config: smtpInfo,
        error: smtpError?.message || null,
        hasConfig: !!smtpConfig
      },
      emailTemplates: {
        templates: templatesInfo,
        error: templateError?.message || null,
        count: templatesInfo.length
      },
      emailMode: modeInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('🚨 Debug Environment Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}