import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, testSMTPConnection } from '@/lib/emailService';

// Node.js Runtime für nodemailer
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[SMTP-Test] Test gestartet');
    
    const body = await request.json();
    const { to, testEmail, subject, html, text } = body;

    // E-Mail-Adresse bestimmen
    const recipientEmail = to || testEmail;
    
    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Test-E-Mail-Adresse ist erforderlich' },
        { status: 400 }
      );
    }

    console.log(`[SMTP-Test] Teste Verbindung und sende E-Mail an: ${recipientEmail}`);

    // Teste SMTP-Verbindung
    const connectionTest = await testSMTPConnection();
    if (!connectionTest.success) {
      console.error('[SMTP-Test] Verbindungstest fehlgeschlagen:', connectionTest.error);
      return NextResponse.json(
        { success: false, error: `SMTP-Verbindung fehlgeschlagen: ${connectionTest.error}` },
        { status: 500 }
      );
    }

    console.log('[SMTP-Test] Verbindungstest erfolgreich, sende Test-E-Mail');

    // E-Mail-Inhalte
    const emailSubject = subject || 'SMTP-Test von Brennholzkönig';
    const emailHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C04020;">SMTP-Test erfolgreich!</h2>
        <p>Dies ist eine Test-E-Mail von Ihrem <strong>Brennholzkönig Admin Dashboard</strong>.</p>
        <p>Wenn Sie diese E-Mail erhalten, funktioniert Ihre SMTP-Konfiguration korrekt.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Gesendet am: ${new Date().toLocaleString('de-DE')}<br>
          Von: Brennholzkönig Admin Dashboard
        </p>
      </div>
    `;
    const emailText = text || `SMTP-Test von Brennholzkönig\n\nWenn Sie diese E-Mail erhalten, funktioniert Ihre SMTP-Konfiguration korrekt.\n\nGesendet am: ${new Date().toLocaleString('de-DE')}`;

    // Sende Test-E-Mail
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    if (emailResult.success) {
      console.log('[SMTP-Test] Test-E-Mail erfolgreich gesendet:', emailResult.messageId);
      return NextResponse.json({
        success: true,
        message: 'Test-E-Mail erfolgreich gesendet',
        messageId: emailResult.messageId
      });
    } else {
      console.error('[SMTP-Test] E-Mail-Versand fehlgeschlagen:', emailResult.error);
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[SMTP-Test] Unerwarteter Fehler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { success: false, error: 'SMTP-Test fehlgeschlagen: ' + errorMessage },
      { status: 500 }
    );
  }
}