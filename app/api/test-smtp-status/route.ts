import { NextRequest, NextResponse } from 'next/server';
import { createEmailTransporter, getGuaranteedSMTPSettings } from '@/lib/emailService';

export async function GET(request: NextRequest) {
  try {
    console.log('[SMTP-Test] Starte SMTP-Status-Überprüfung');

    // 1. SMTP-Einstellungen laden
    const settings = await getGuaranteedSMTPSettings();
    
    // 2. Transporter erstellen und testen
    let transporterStatus = 'unknown';
    let transporterError = null;
    
    try {
      const { transporter } = await createEmailTransporter();
      await transporter.verify();
      transporterStatus = 'connected';
      console.log('[SMTP-Test] Transporter-Verbindung erfolgreich');
    } catch (error) {
      transporterStatus = 'failed';
      transporterError = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('[SMTP-Test] Transporter-Verbindung fehlgeschlagen:', error);
    }

    // 3. Nodemailer-Verfügbarkeit prüfen
    let nodemailerStatus = 'unknown';
    try {
      const nodemailer = await import('nodemailer');
      nodemailerStatus = nodemailer && typeof nodemailer.createTransport === 'function' ? 'available' : 'unavailable';
    } catch (error) {
      nodemailerStatus = 'unavailable';
    }

    return NextResponse.json({
      success: true,
      smtp_settings: {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        username: settings.smtp_username.substring(0, 3) + '***',
        from_email: settings.smtp_from_email,
        from_name: settings.smtp_from_name
      },
      transporter_status: transporterStatus,
      transporter_error: transporterError,
      nodemailer_status: nodemailerStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SMTP-Test] Fehler bei SMTP-Status-Überprüfung:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}