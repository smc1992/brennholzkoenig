import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, testSMTPConnection } from '@/lib/emailService';

// Erzwinge Node.js Runtime und dynamische Ausführung (wichtig für Nodemailer)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = false;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, testEmail, subject, html, text } = body;

    // Unterstütze beide Formate: { testEmail } und { to, subject, html, text }
    const recipientEmail = to || testEmail;
    
    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Test-E-Mail-Adresse ist erforderlich' },
        { status: 400 }
      );
    }

    // Teste zuerst die SMTP-Verbindung
    const connectionTest = await testSMTPConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { success: false, error: `SMTP-Verbindung fehlgeschlagen: ${connectionTest.error}` },
        { status: 500 }
      );
    }

    // Verwende die vom Frontend gesendeten Inhalte oder Fallback-Werte
    const emailSubject = subject || 'SMTP-Test von Brennholzkönig Admin Dashboard';
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
    const emailText = text || `Dies ist eine Test-E-Mail von Ihrem Brennholzkönig Admin Dashboard.\n\nWenn Sie diese E-Mail erhalten, funktioniert Ihre SMTP-Konfiguration korrekt.\n\nGesendet am: ${new Date().toLocaleString('de-DE')}`;

    // Sende Test-E-Mail
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Test-E-Mail erfolgreich gesendet',
        messageId: emailResult.messageId
      });
    } else {
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fehler beim SMTP-Test:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler beim SMTP-Test' },
      { status: 500 }
    );
  }
}