import 'server-only';
import { supabase } from './supabase';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// Lade globale E-Mail-Signatur
async function loadGlobalSignature(): Promise<{ enabled: boolean; html_signature: string; text_signature: string } | null> {
  try {
    const { data: signatureData } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'global_email_signature')
      .eq('setting_type', 'email_config')
      .single();

    if (signatureData) {
      return JSON.parse(signatureData.setting_value);
    }
  } catch (error) {
    console.error('Error loading global signature:', error);
  }
  return null;
}

// Füge globale Signatur zu E-Mail hinzu
async function appendGlobalSignature(content: string, isHtml: boolean = true): Promise<string> {
  const signature = await loadGlobalSignature();
  
  if (!signature || !signature.enabled) {
    return content;
  }

  if (isHtml) {
    // HTML-Signatur vor dem schließenden </body> Tag einfügen
    if (content.includes('</body>')) {
      return content.replace('</body>', `${signature.html_signature}</body>`);
    } else {
      // Falls kein </body> Tag, am Ende hinzufügen
      return content + signature.html_signature;
    }
  } else {
    // Text-Signatur für Plain-Text E-Mails
    return content + signature.text_signature;
  }
}

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

// Lade SMTP-Einstellungen (unterstützt Umgebungsvariablen, 'smtp_config' und Fallback 'smtp')
export async function loadSMTPSettings(): Promise<SMTPSettings | null> {
  try {
    console.log('[SMTP] Lade SMTP-Einstellungen...');
    
    // 1) Primär: Umgebungsvariablen (für Coolify/Hetzner)
    if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
      console.log('[SMTP] Umgebungsvariablen-Konfiguration gefunden:', {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT || '587',
        user: process.env.EMAIL_SERVER_USER.substring(0, 3) + '***'
      });
      return {
        smtp_host: process.env.EMAIL_SERVER_HOST,
        smtp_port: process.env.EMAIL_SERVER_PORT || '587',
        smtp_secure: process.env.EMAIL_SERVER_PORT === '465' ? 'true' : 'false',
        smtp_username: process.env.EMAIL_SERVER_USER,
        smtp_password: process.env.EMAIL_SERVER_PASSWORD,
        smtp_from_email: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
        smtp_from_name: 'Brennholzkönig'
      };
    }
    
    console.log('[SMTP] Keine vollständigen Umgebungsvariablen gefunden, verwende Supabase-Fallback');
    
    // 2) Fallback: JSON-Konfiguration unter setting_type = 'smtp_config'
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

    // 3) Fallback: Key-Value-Konfiguration unter setting_type = 'smtp'
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
    console.error('[SMTP] Fehler beim Laden der SMTP-Einstellungen:', error);
    
    // Letzter Fallback: Hardcoded Werte für Notfall
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SMTP] Verwende Notfall-Konfiguration für Produktion');
      return {
        smtp_host: 'w0208da5.kasserver.com',
        smtp_port: '587',
        smtp_secure: 'false',
        smtp_username: 'info@brennholz-koenig.de',
        smtp_password: 'infokoenig',
        smtp_from_email: 'info@brennholz-koenig.de',
        smtp_from_name: 'Brennholzkönig'
      };
    }
    
    return null;
  }
}

// Neue Funktion: Garantierte SMTP-Einstellungen
export async function getGuaranteedSMTPSettings(): Promise<SMTPSettings> {
  try {
    const settings = await loadSMTPSettings();
    if (settings) {
      return settings;
    }
  } catch (error) {
    console.error('[SMTP] Fehler beim Laden der SMTP-Einstellungen:', error);
  }
  
  // Garantierter Fallback
  console.warn('[SMTP] Verwende garantierte Fallback-Konfiguration');
  return {
    smtp_host: 'w0208da5.kasserver.com',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_username: 'info@brennholz-koenig.de',
    smtp_password: 'infokoenig',
    smtp_from_email: 'info@brennholz-koenig.de',
    smtp_from_name: 'Brennholzkönig'
  };
}

// Erstelle Nodemailer-Transporter basierend auf Datenbankeinstellungen
export async function createEmailTransporter() {
  const settings = await getGuaranteedSMTPSettings();

  if (!settings) {
    throw new Error('SMTP-Einstellungen konnten nicht geladen werden');
  }

  console.log('[SMTP] Verwende SMTP-Einstellungen:', {
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_secure,
    username: settings.smtp_username.substring(0, 3) + '***',
    fromEmail: settings.smtp_from_email
  });

  // Einfache nodemailer Import-Logik
  let nodemailer;
  try {
    // Direkte ES-Module Import
    nodemailer = await import('nodemailer');
    // Verwende default export falls vorhanden
    if (nodemailer.default) {
      nodemailer = nodemailer.default;
    }
    console.log('[SMTP] Nodemailer erfolgreich geladen');
  } catch (error) {
    console.error('[SMTP] Nodemailer Import fehlgeschlagen:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    throw new Error('Nodemailer konnte nicht geladen werden: ' + errorMessage);
  }

  if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
    throw new Error('Nodemailer createTransport Funktion nicht verfügbar');
  }

  // Multi-Port-Fallback für Hetzner - optimiert für schnelleres Scheitern
  const portConfigs = [
    {
      port: parseInt(settings.smtp_port),
      secure: settings.smtp_secure === 'true',
      name: `Port ${settings.smtp_port} (Konfiguriert)`
    },
    {
      port: 587,
      secure: false,
      name: 'Port 587 (STARTTLS)'
    }
  ];

  for (const config of portConfigs) {
    try {
      console.log(`[SMTP] Versuche Verbindung mit ${config.name}`);
      
      const transportConfig = {
        host: settings.smtp_host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: settings.smtp_username,
          pass: settings.smtp_password,
        },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000
      };

      const transporter = nodemailer.createTransport(transportConfig);
      
      // Teste Verbindung
      await transporter.verify();
      
      console.log(`[SMTP] Erfolgreich verbunden mit ${config.name}`);
      return { transporter, settings };
      
    } catch (error) {
      console.warn(`[SMTP] ${config.name} fehlgeschlagen:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  throw new Error('Alle SMTP-Port-Konfigurationen fehlgeschlagen');
}

// Sende E-Mail mit dynamischen SMTP-Einstellungen und globaler Signatur
// Test-Modus für E-Mail-Versand (simuliert ohne tatsächlichen Versand)
export async function sendEmailTest({
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
    console.log(`[SMTP-TEST] Simuliere E-Mail-Versand an ${to}`);
    
    // Globale Signatur zu HTML und Text hinzufügen
    let finalHtml = html;
    let finalText = text;

    if (html) {
      finalHtml = await appendGlobalSignature(html, true);
      console.log('[SMTP-TEST] Globale HTML-Signatur hinzugefügt');
    }

    if (text) {
      finalText = await appendGlobalSignature(text, false);
      console.log('[SMTP-TEST] Globale Text-Signatur hinzugefügt');
    }

    const mailOptions = {
      from: `Brennholzkönig <test@brennholz-koenig.de>`,
      to,
      subject,
      text: finalText,
      html: finalHtml
    };

    console.log('[SMTP-TEST] E-Mail-Optionen (simuliert):', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: finalHtml?.length || 0,
      textLength: finalText?.length || 0
    });

    // Simuliere erfolgreichen Versand
    const mockMessageId = `test-${Date.now()}@brennholz-koenig.de`;
    
    console.log('[SMTP-TEST] E-Mail erfolgreich simuliert. Mock Message ID:', mockMessageId);
    return { 
      success: true, 
      messageId: mockMessageId,
      testMode: true
    };
    
  } catch (error) {
    console.error('[SMTP-TEST] Fehler bei E-Mail-Simulation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return { 
      success: false, 
      error: errorMessage,
      testMode: true
    };
  }
}

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
    console.log(`[SMTP] Starte E-Mail-Versand an ${to}`);
    
    const { transporter, settings } = await createEmailTransporter();

    // Globale Signatur zu HTML und Text hinzufügen
    let finalHtml = html;
    let finalText = text;

    if (html) {
      finalHtml = await appendGlobalSignature(html, true);
      console.log('[SMTP] Globale HTML-Signatur hinzugefügt');
    }

    if (text) {
      finalText = await appendGlobalSignature(text, false);
      console.log('[SMTP] Globale Text-Signatur hinzugefügt');
    }

    const mailOptions = {
      from: `${settings.smtp_from_name || 'Brennholzkönig'} <${settings.smtp_from_email}>`,
      to,
      subject,
      text: finalText,
      html: finalHtml
    };

    console.log('[SMTP] Sende E-Mail mit Optionen:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    // Direkter E-Mail-Versand ohne Timeout-Wrapper
    const result = await transporter.sendMail(mailOptions);
    
    console.log('[SMTP] E-Mail erfolgreich gesendet. Message ID:', result.messageId);
    return { 
      success: true, 
      messageId: result.messageId 
    };
    
  } catch (error) {
    console.error('[SMTP] Fehler beim E-Mail-Versand:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return { 
      success: false, 
      error: errorMessage 
    };
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