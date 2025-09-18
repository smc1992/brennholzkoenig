import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug E-Mail-Versand gestartet')

    const body = await request.json()
    const { testEmail = 'info@brennholz-koenig.de' } = body

    // Supabase Client erstellen
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // SMTP-Konfiguration laden
    const { data: smtpConfig, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .single()

    if (smtpError || !smtpConfig) {
      return NextResponse.json({
        success: false,
        error: 'SMTP-Konfiguration nicht gefunden',
        details: smtpError?.message
      }, { status: 500 })
    }

    // Environment-Check
    const isDevelopment = process.env.NODE_ENV === 'development'
    const forceRealEmail = process.env.FORCE_REAL_EMAIL === 'true'
    const shouldSimulate = isDevelopment && !forceRealEmail

    console.log('🔍 E-Mail-Modus-Check:', {
      NODE_ENV: process.env.NODE_ENV,
      isDevelopment,
      forceRealEmail,
      shouldSimulate,
      willSendRealEmails: !shouldSimulate
    })

    const debugInfo = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isDevelopment,
        forceRealEmail,
        shouldSimulate,
        willSendRealEmails: !shouldSimulate
      },
      smtp: {
        host: smtpConfig.smtp_host,
        port: smtpConfig.smtp_port,
        secure: smtpConfig.smtp_secure === 'true',
        username: smtpConfig.smtp_username,
        from_email: smtpConfig.smtp_from_email,
        from_name: smtpConfig.smtp_from_name,
        password_length: smtpConfig.smtp_password?.length || 0
      }
    }

    if (shouldSimulate) {
      // Entwicklungsmodus: Nur simulieren
      console.log('🔧 ENTWICKLUNGSMODUS: E-Mail wird nur simuliert')
      return NextResponse.json({
        success: true,
        mode: 'simulation',
        message: 'E-Mail wurde simuliert (Entwicklungsmodus)',
        debugInfo,
        emailDetails: {
          to: testEmail,
          subject: 'Debug Test E-Mail (Simuliert)',
          from: `"${smtpConfig.smtp_from_name}" <${smtpConfig.smtp_from_email}>`
        }
      })
    }

    // Produktionsmodus: Echten Versand testen
    console.log('🚀 PRODUKTIONSMODUS: Teste echten E-Mail-Versand')

    // Nodemailer Transporter erstellen
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: parseInt(smtpConfig.smtp_port),
      secure: smtpConfig.smtp_secure === 'true',
      auth: {
        user: smtpConfig.smtp_username,
        pass: smtpConfig.smtp_password,
      },
    })

    // Verbindung testen
    console.log('🔍 Teste SMTP-Verbindung...')
    try {
      await transporter.verify()
      console.log('✅ SMTP-Verbindung erfolgreich')
    } catch (verifyError) {
      console.error('❌ SMTP-Verbindung fehlgeschlagen:', verifyError)
      return NextResponse.json({
        success: false,
        error: 'SMTP-Verbindung fehlgeschlagen',
        details: verifyError instanceof Error ? verifyError.message : 'Unbekannter Fehler',
        debugInfo
      }, { status: 500 })
    }

    // Test-E-Mail senden
    const mailOptions = {
      from: `"${smtpConfig.smtp_from_name}" <${smtpConfig.smtp_from_email}>`,
      to: testEmail,
      subject: 'Debug Test E-Mail - Brennholzkönig',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C04020;">🔍 Debug Test E-Mail</h2>
          <p>Dies ist eine Debug-Test-E-Mail von <strong>Brennholzkönig</strong>.</p>
          <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <h3>Debug-Informationen:</h3>
            <p><strong>Modus:</strong> Produktionsmodus (echte E-Mail)</p>
            <p><strong>NODE_ENV:</strong> ${process.env.NODE_ENV}</p>
            <p><strong>Zeitstempel:</strong> ${new Date().toLocaleString('de-DE')}</p>
            <p><strong>SMTP-Host:</strong> ${smtpConfig.smtp_host}</p>
            <p><strong>SMTP-Port:</strong> ${smtpConfig.smtp_port}</p>
          </div>
          <p>Wenn Sie diese E-Mail erhalten, funktioniert der E-Mail-Versand korrekt!</p>
        </div>
      `,
      text: `Debug Test E-Mail - Brennholzkönig\n\nDies ist eine Debug-Test-E-Mail.\nModus: Produktionsmodus\nNODE_ENV: ${process.env.NODE_ENV}\nZeitstempel: ${new Date().toLocaleString('de-DE')}`
    }

    console.log('📧 Sende Debug-Test-E-Mail an:', testEmail)
    
    try {
      const result = await transporter.sendMail(mailOptions)
      console.log('✅ Debug-Test-E-Mail erfolgreich gesendet:', result.messageId)

      return NextResponse.json({
        success: true,
        mode: 'production',
        message: 'Debug-Test-E-Mail erfolgreich gesendet',
        messageId: result.messageId,
        debugInfo,
        emailDetails: {
          to: testEmail,
          subject: mailOptions.subject,
          from: mailOptions.from
        }
      })

    } catch (sendError) {
      console.error('❌ Debug-Test-E-Mail-Versand fehlgeschlagen:', sendError)
      return NextResponse.json({
        success: false,
        error: 'E-Mail-Versand fehlgeschlagen',
        details: sendError instanceof Error ? sendError.message : 'Unbekannter Fehler',
        debugInfo
      }, { status: 500 })
    }

  } catch (error) {
    console.error('🚨 Debug E-Mail-Versand Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}