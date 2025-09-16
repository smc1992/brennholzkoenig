import { supabase } from './supabase';

interface SMTPSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
}

// Hilfsfunktion: prüft, ob erforderliche SMTP-Felder vorhanden sind
function isComplete(settings: Record<string, string>): boolean {
  const requiredSettings = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_from_email'];
  return requiredSettings.every((key) => !!settings[key]);
}

// Hilfsfunktion: sichere Bool-Interpretation
function toBoolString(value: any): string {
  if (typeof value === 'string') return value === 'true' ? 'true' : 'false';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return 'false';
}

// Lade SMTP-Einstellungen aus der Datenbank (unterstützt sowohl 'smtp_config' als auch Fallback 'smtp')
export async function loadSMTPSettings(): Promise<SMTPSettings | null> {
  try {
    // 1) Primär: JSON-Konfiguration unter setting_type = 'smtp_config'
    const { data: jsonRows, error: jsonError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'smtp_config');

    if (jsonError) {
      console.error('Fehler beim Laden der SMTP-Einstellungen (smtp_config):', jsonError);
    }

    console.log('[SMTP] smtp_config Abfrage-Ergebnis:', jsonRows);

    if (jsonRows && jsonRows.length > 0) {
      const jsonRow = jsonRows[0]; // Nehme den ersten Eintrag
      console.log('[SMTP] Gefundener smtp_config Eintrag:', jsonRow);
      
      if (jsonRow.setting_value) {
        let parsed: any;
        try {
          parsed = JSON.parse(jsonRow.setting_value);
          console.log('[SMTP] Geparste smtp_config:', parsed);
        } catch (e) {
          console.error('Ungültiges JSON in smtp_config:', e);
        }

        if (parsed) {
          // Normalisieren zu SMTPSettings
          const normalized: Record<string, string> = {
            smtp_host: parsed.smtp_host || '',
            smtp_port: String(parsed.smtp_port ?? ''),
            smtp_username: parsed.smtp_username || '',
            smtp_password: parsed.smtp_password || '',
            smtp_from_email: parsed.from_email || '',
            smtp_from_name: parsed.from_name || 'Brennholz König',
            // secure: true für Port 465, sonst false; für 587/STARTTLS -> secure=false
            smtp_secure: (() => {
              const port = parseInt(String(parsed.smtp_port ?? '0'), 10);
              if (port === 465) return 'true';
              return toBoolString(parsed.smtp_secure ?? false);
            })()
          };

          console.log('[SMTP] Normalisierte smtp_config:', normalized);

          if (isComplete(normalized)) {
             console.log('[SMTP] Verwende Einstellungen aus setting_type = "smtp_config"');
             return normalized as unknown as SMTPSettings;
          } else {
            console.warn('[SMTP] smtp_config vorhanden, aber unvollständig. Fallback auf setting_type = "smtp"...');
            console.warn('[SMTP] Fehlende Felder:', Object.keys(normalized).filter(key => !normalized[key]));
          }
        }
      }
    } else {
      console.warn('[SMTP] Keine Einträge in setting_type = "smtp_config" gefunden, versuche Fallback auf smtp...');
    }

    // 2) Fallback: Key-Value-Konfiguration unter setting_type = 'smtp'
    const { data: kvData, error: kvError } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'smtp');

    if (kvError) {
      console.error('Fehler beim Laden der SMTP-Einstellungen (smtp):', kvError);
      return null;
    }

    console.log('[SMTP] smtp Key-Value Abfrage-Ergebnis:', kvData);

    if (!kvData || kvData.length === 0) {
      console.warn('Keine SMTP-Einstellungen in der Datenbank gefunden (setting_type = "smtp")');
      return null;
    }

    const kv: Record<string, string> = {};
    kvData.forEach((item: any) => {
      kv[item.setting_key] = item.setting_value;
    });

    console.log('[SMTP] Key-Value Einstellungen:', kv);

    // Standard für smtp_secure ableiten, falls nicht gesetzt
    if (typeof kv.smtp_secure === 'undefined' || kv.smtp_secure === '') {
      const port = parseInt(kv.smtp_port || '0', 10);
      kv.smtp_secure = port === 465 ? 'true' : 'false';
    } else {
      kv.smtp_secure = toBoolString(kv.smtp_secure);
    }

    // Default-From-Name
    if (!kv.smtp_from_name) kv.smtp_from_name = 'Brennholz König';

    if (isComplete(kv)) {
      console.log('[SMTP] Verwende Einstellungen aus setting_type = "smtp"');
      return kv as unknown as SMTPSettings;
    }

    console.error('[SMTP] Unvollständige Einträge in setting_type = "smtp" gefunden. Keine gültige Konfiguration verfügbar.');
    console.error('[SMTP] Fehlende Felder:', Object.keys(kv).filter(key => !kv[key]));
    return null;
  } catch (error) {
    console.error('Fehler beim Laden der SMTP-Einstellungen:', error);
    return null;
  }
}

// Erstelle Nodemailer-Transporter basierend auf Datenbankeinstellungen
export async function createEmailTransporter() {
  const settings = await loadSMTPSettings();

  if (!settings) {
    throw new Error('SMTP-Einstellungen konnten nicht geladen werden');
  }

  console.log('[SMTP] Verwende finale Einstellungen für Transporter:', {
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_secure,
    username: settings.smtp_username.substring(0, 3) + '***',
    fromEmail: settings.smtp_from_email
  });

  // Alternative Lösung: eval-basierter require für Server-Side
  let nodemailer;
  try {
    // Versuche ES-Module Import
    const nodemailerModule = await import('nodemailer');
    nodemailer = nodemailerModule.default || nodemailerModule;
  } catch (error) {
    // Fallback zu CommonJS require
    nodemailer = eval('require')('nodemailer');
  }

  if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
    throw new Error('Nodemailer konnte nicht korrekt geladen werden');
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port),
    secure: settings.smtp_secure === 'true', // true für 465, false für andere Ports
    auth: {
      user: settings.smtp_username,
      pass: settings.smtp_password,
    },
  });

  return { transporter, settings };
}

// Sende E-Mail mit dynamischen SMTP-Einstellungen
export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  try {
    const { transporter, settings } = await createEmailTransporter();

    const mailOptions = {
      from: `${settings.smtp_from_name || 'Brennholz König'} <${settings.smtp_from_email}>`,
      to,
      subject,
      text,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('E-Mail erfolgreich gesendet:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return { success: false, error: (error as any).message };
  }
}

// Test SMTP-Verbindung
export async function testSMTPConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { transporter } = await createEmailTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('SMTP-Verbindungstest fehlgeschlagen:', error);
    return { success: false, error: (error as any).message };
  }
}