import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = false;

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { to, subject, html, text, type } = body;

    // Validierung der erforderlichen Felder
    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'E-Mail-Adresse und Betreff sind erforderlich' },
        { status: 400 }
      );
    }

    if (!html && !text) {
      return NextResponse.json(
        { success: false, error: 'HTML- oder Text-Inhalt ist erforderlich' },
        { status: 400 }
      );
    }

    console.log(`[EmailAPI] Sende E-Mail an ${to} mit Betreff: ${subject}`);

    // E-Mail über den bestehenden E-Mail-Service senden
    const result = await sendEmail({
      to,
      subject,
      html,
      text
    });

    if (result.success) {
      console.log(`[EmailAPI] E-Mail erfolgreich gesendet. Message ID: ${result.messageId}`);
      
      return NextResponse.json({
        success: true,
        message: 'E-Mail erfolgreich gesendet',
        messageId: result.messageId,
        type: type || 'general'
      });
    } else {
      console.error(`[EmailAPI] E-Mail-Versand fehlgeschlagen: ${result.error}`);
      
      return NextResponse.json(
        { success: false, error: result.error || 'E-Mail-Versand fehlgeschlagen' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[EmailAPI] Fehler beim E-Mail-Versand:', error);
    
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler beim E-Mail-Versand' },
      { status: 500 }
    );
  }
}

// GET-Endpoint für API-Dokumentation
export async function GET() {
  return NextResponse.json({
    message: 'E-Mail-Versand API',
    endpoints: {
      POST: '/api/send-email',
      description: 'Sendet E-Mails über das konfigurierte SMTP-System'
    },
    requiredFields: {
      to: 'string (required) - Empfänger-E-Mail-Adresse',
      subject: 'string (required) - E-Mail-Betreff',
      html: 'string (optional) - HTML-Inhalt der E-Mail',
      text: 'string (optional) - Text-Inhalt der E-Mail',
      type: 'string (optional) - E-Mail-Typ für Logging'
    },
    example: {
      to: 'info@brennholz-koenig.de',
      subject: 'Neue Kontaktanfrage',
      html: '<h1>Kontaktanfrage</h1><p>Nachricht...</p>',
      text: 'Kontaktanfrage\n\nNachricht...',
      type: 'contact_form'
    },
    notes: [
      'Verwendet das in den App-Einstellungen konfigurierte SMTP-System',
      'Unterstützt sowohl HTML- als auch Text-E-Mails',
      'Automatisches Logging und Fehlerbehandlung',
      'Validierung aller Eingabedaten'
    ]
  });
}