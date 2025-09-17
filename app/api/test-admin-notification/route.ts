import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, testMessage } = await request.json();

    if (!adminEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin-E-Mail-Adresse ist erforderlich' 
      }, { status: 400 });
    }

    const subject = '🔥 Test-Benachrichtigung - Brennholzkönig Admin';
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test-Benachrichtigung</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #C04020, #A03318); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🔥 Brennholzkönig</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Admin-Benachrichtigung Test</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #C04020;">
            <h2 style="margin: 0 0 10px 0; color: #C04020; font-size: 18px;">✅ Test erfolgreich!</h2>
            <p style="margin: 0; color: #666; font-size: 14px;">
              Diese Test-E-Mail bestätigt, dass Ihre Admin-E-Mail-Konfiguration korrekt funktioniert.
            </p>
          </div>
          
          <h3 style="color: #333; margin-bottom: 15px;">Test-Details:</h3>
          <ul style="color: #666; padding-left: 20px;">
            <li><strong>Empfänger:</strong> ${adminEmail}</li>
            <li><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</li>
            <li><strong>System:</strong> Brennholzkönig E-Mail-System</li>
            <li><strong>Status:</strong> Erfolgreich versendet</li>
          </ul>
          
          ${testMessage ? `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Test-Nachricht:</h4>
              <p style="margin: 0; color: #666; font-style: italic;">${testMessage}</p>
            </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">📋 Nächste Schritte:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Konfigurieren Sie E-Mail-Templates für Bestellbestätigungen</li>
              <li>Aktivieren Sie automatische Trigger für neue Bestellungen</li>
              <li>Testen Sie die Bestellbenachrichtigungen</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 12px;">
              Diese E-Mail wurde automatisch vom Brennholzkönig Admin-System generiert.<br>
              Bei Fragen wenden Sie sich an den System-Administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      🔥 Brennholzkönig - Admin-Benachrichtigung Test
      
      ✅ Test erfolgreich!
      
      Diese Test-E-Mail bestätigt, dass Ihre Admin-E-Mail-Konfiguration korrekt funktioniert.
      
      Test-Details:
      - Empfänger: ${adminEmail}
      - Zeitpunkt: ${new Date().toLocaleString('de-DE')}
      - System: Brennholzkönig E-Mail-System
      - Status: Erfolgreich versendet
      
      ${testMessage ? `Test-Nachricht: ${testMessage}` : ''}
      
      📋 Nächste Schritte:
      - Konfigurieren Sie E-Mail-Templates für Bestellbestätigungen
      - Aktivieren Sie automatische Trigger für neue Bestellungen
      - Testen Sie die Bestellbenachrichtigungen
      
      Diese E-Mail wurde automatisch vom Brennholzkönig Admin-System generiert.
      Bei Fragen wenden Sie sich an den System-Administrator.
    `;

    console.log('[Test Admin Notification] Sending test email to:', adminEmail);

    const result = await sendEmail({
      to: adminEmail,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    if (result.success) {
      console.log('[Test Admin Notification] Test email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Test-E-Mail erfolgreich versendet',
        messageId: result.messageId
      });
    } else {
      console.error('[Test Admin Notification] Failed to send test email:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Unbekannter Fehler beim Versenden'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Test Admin Notification] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unerwarteter Fehler beim Versenden der Test-E-Mail',
      details: (error as Error).message
    }, { status: 500 });
  }
}