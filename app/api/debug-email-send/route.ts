import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, testSMTPConnection } from '@/lib/emailService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug E-Mail-Versand gestartet')

    const body = await request.json()
    const { testEmail = 'info@brennholz-koenig.de' } = body

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

    // Debug-Informationen sammeln
    const debugInfo = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      testEmail,
      shouldSimulate
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
          from: 'Brennholzkönig Debug System'
        }
      })
    }

    // Produktionsmodus: Echten Versand testen
    console.log('🚀 PRODUKTIONSMODUS: Teste echten E-Mail-Versand')

    // SMTP-Verbindung testen
    console.log('🔍 Teste SMTP-Verbindung...')
    try {
      const connectionTest = await testSMTPConnection()
      if (!connectionTest.success) {
        console.error('❌ SMTP-Verbindung fehlgeschlagen:', connectionTest.error)
        return NextResponse.json({
          success: false,
          error: 'SMTP-Verbindung fehlgeschlagen',
          details: connectionTest.error,
          debugInfo
        }, { status: 500 })
      }
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

    // Test-E-Mail über einheitliches System senden
    const emailContent = {
      to: testEmail,
      subject: 'Debug Test E-Mail - Brennholzkönig',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://brennholz-koenig.de/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300" 
                 alt="Brennholzkönig Logo" 
                 style="max-width: 200px; height: auto;">
          </div>
          
          <h2 style="color: #C04020;">🔍 Debug Test E-Mail</h2>
          <p>Dies ist eine Debug-Test-E-Mail von <strong>Brennholzkönig</strong>.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #C04020;">
            <h3 style="color: #C04020; margin-top: 0;">Debug-Informationen:</h3>
            <p><strong>Modus:</strong> Produktionsmodus (echte E-Mail)</p>
            <p><strong>NODE_ENV:</strong> ${process.env.NODE_ENV}</p>
            <p><strong>Zeitstempel:</strong> ${new Date().toLocaleString('de-DE')}</p>
            <p><strong>E-Mail-System:</strong> Einheitliches Admin-System</p>
          </div>
          
          <p>Wenn Sie diese E-Mail erhalten, funktioniert der E-Mail-Versand korrekt!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>Diese E-Mail wurde automatisch vom Brennholzkönig Debug-System generiert.</p>
          </div>
        </div>
      `,
      text: `Debug Test E-Mail - Brennholzkönig

Dies ist eine Debug-Test-E-Mail.

Debug-Informationen:
- Modus: Produktionsmodus
- NODE_ENV: ${process.env.NODE_ENV}
- Zeitstempel: ${new Date().toLocaleString('de-DE')}
- E-Mail-System: Einheitliches Admin-System

Wenn Sie diese E-Mail erhalten, funktioniert der E-Mail-Versand korrekt!

---
Diese E-Mail wurde automatisch vom Brennholzkönig Debug-System generiert.`
    }

    console.log('📧 Sende Debug-Test-E-Mail an:', testEmail)
    
    try {
      const result = await sendEmail(emailContent)
      
      if (result.success) {
        console.log('✅ Debug-Test-E-Mail erfolgreich gesendet:', result.messageId)

        return NextResponse.json({
          success: true,
          mode: 'production',
          message: 'Debug-Test-E-Mail erfolgreich gesendet',
          messageId: result.messageId,
          debugInfo,
          emailDetails: {
            to: testEmail,
            subject: emailContent.subject,
            from: 'Brennholzkönig Admin-System'
          }
        })
      } else {
        throw new Error(result.error || 'Unbekannter E-Mail-Versand-Fehler')
      }

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