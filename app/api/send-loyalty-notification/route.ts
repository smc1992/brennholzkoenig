import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, content, type } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: 'Fehlende Parameter: to, subject, content sind erforderlich' },
        { status: 400 }
      );
    }

    // E-Mail-Transporter konfigurieren
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // E-Mail-Optionen
    const mailOptions = {
      from: {
        name: 'Brennholzkönig Treueprogramm',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@brennholzkoenig.de'
      },
      to: to,
      subject: subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // HTML-Tags für Textversion entfernen
      headers: {
        'X-Mailer': 'Brennholzkönig Loyalty System',
        'X-Priority': type === 'urgent' ? '1' : '3',
      }
    };

    // E-Mail senden
    const info = await transporter.sendMail(mailOptions);

    console.log('Loyalty-Benachrichtigung gesendet:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
      type: type || 'loyalty'
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Benachrichtigung erfolgreich gesendet'
    });

  } catch (error) {
    console.error('Fehler beim Senden der Loyalty-Benachrichtigung:', error);
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Senden der Benachrichtigung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}