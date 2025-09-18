import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from_email: string;
  from_name: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[];
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

class NodemailerService {
  private transporter: nodemailer.Transporter | null = null;
  private smtpSettings: SMTPSettings | null = null;

  /**
   * Lädt SMTP-Einstellungen aus der Datenbank
   */
  private async loadSMTPSettings(): Promise<SMTPSettings> {
    try {
      // Versuche zuerst JSON-Konfiguration zu laden
      const { data: jsonConfig, error: jsonError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'smtp_config')
        .single();

      if (!jsonError && jsonConfig?.value) {
        const config = JSON.parse(jsonConfig.value);
        if (this.isValidSMTPConfig(config)) {
          return config;
        }
      }

      // Fallback: Lade einzelne SMTP-Einstellungen
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'smtp_host',
          'smtp_port', 
          'smtp_secure',
          'smtp_user',
          'smtp_pass',
          'smtp_from_email',
          'smtp_from_name'
        ]);

      if (error) {
        throw new Error(`Fehler beim Laden der SMTP-Einstellungen: ${error.message}`);
      }

      if (!settings || settings.length === 0) {
        throw new Error('Keine SMTP-Einstellungen in der Datenbank gefunden');
      }

      // Konvertiere Array zu Objekt
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      // Validiere erforderliche Felder
      const requiredFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email'];
      const missingFields = requiredFields.filter(field => !settingsObj[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Fehlende SMTP-Einstellungen: ${missingFields.join(', ')}`);
      }

      return {
        host: settingsObj.smtp_host,
        port: parseInt(settingsObj.smtp_port),
        secure: settingsObj.smtp_secure === 'true',
        auth: {
          user: settingsObj.smtp_user,
          pass: settingsObj.smtp_pass
        },
        from_email: settingsObj.smtp_from_email,
        from_name: settingsObj.smtp_from_name || 'Brennholzkönig'
      };

    } catch (error) {
      console.error('Fehler beim Laden der SMTP-Einstellungen:', error);
      throw error;
    }
  }

  /**
   * Validiert SMTP-Konfiguration
   */
  private isValidSMTPConfig(config: any): config is SMTPSettings {
    return (
      config &&
      typeof config.host === 'string' &&
      typeof config.port === 'number' &&
      typeof config.secure === 'boolean' &&
      config.auth &&
      typeof config.auth.user === 'string' &&
      typeof config.auth.pass === 'string' &&
      typeof config.from_email === 'string'
    );
  }

  /**
   * Initialisiert den Nodemailer-Transporter
   */
  private async initializeTransporter(): Promise<void> {
    if (!this.smtpSettings) {
      this.smtpSettings = await this.loadSMTPSettings();
    }

    this.transporter = nodemailer.createTransport({
      host: this.smtpSettings.host,
      port: this.smtpSettings.port,
      secure: this.smtpSettings.secure,
      auth: {
        user: this.smtpSettings.auth.user,
        pass: this.smtpSettings.auth.pass
      }
    });

    // Teste die Verbindung
    try {
      await this.transporter.verify();
      console.log('SMTP-Verbindung erfolgreich getestet');
    } catch (error) {
      console.error('SMTP-Verbindungstest fehlgeschlagen:', error);
      throw new Error('SMTP-Konfiguration ist ungültig');
    }
  }

  /**
   * Lädt E-Mail-Template aus der Datenbank
   */
  async getEmailTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error(`Fehler beim Laden des Templates "${templateName}":`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Fehler beim Laden des Templates "${templateName}":`, error);
      return null;
    }
  }

  /**
   * Ersetzt Platzhalter in Template-Inhalten
   */
  private replacePlaceholders(content: string, variables: Record<string, any>): string {
    let result = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });

    return result;
  }

  /**
   * Sendet E-Mail mit Template
   */
  async sendTemplateEmail(
    templateName: string,
    to: string,
    variables: Record<string, any> = {},
    options: {
      subject?: string;
      from?: string;
    } = {}
  ): Promise<boolean> {
    try {
      // Initialisiere Transporter falls nötig
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      // Lade Template
      const template = await this.getEmailTemplate(templateName);
      if (!template) {
        throw new Error(`E-Mail-Template "${templateName}" nicht gefunden`);
      }

      // Ersetze Platzhalter
      const subject = options.subject || this.replacePlaceholders(template.subject, variables);
      const html = this.replacePlaceholders(template.html_content, variables);
      const text = template.text_content ? this.replacePlaceholders(template.text_content, variables) : undefined;

      // Bestimme Absender
      const from = options.from || `${this.smtpSettings!.from_name} <${this.smtpSettings!.from_email}>`;

      // Sende E-Mail
      const info = await this.transporter!.sendMail({
        from,
        to,
        subject,
        html,
        text
      });

      // Protokolliere E-Mail-Versand
      await this.logEmailSent({
        to,
        subject,
        template_name: templateName,
        message_id: info.messageId,
        status: 'sent',
        variables
      });

      console.log('E-Mail erfolgreich gesendet:', info.messageId);
      return true;

    } catch (error) {
      console.error('Fehler beim E-Mail-Versand:', error);
      
      // Protokolliere Fehler
      await this.logEmailSent({
        to,
        subject: options.subject || templateName,
        template_name: templateName,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variables
      });

      return false;
    }
  }

  /**
   * Sendet einfache E-Mail ohne Template
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Initialisiere Transporter falls nötig
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      // Bestimme Absender
      const from = emailData.from || `${this.smtpSettings!.from_name} <${this.smtpSettings!.from_email}>`;

      // Sende E-Mail
      const info = await this.transporter!.sendMail({
        from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      // Protokolliere E-Mail-Versand
      await this.logEmailSent({
        to: emailData.to,
        subject: emailData.subject,
        message_id: info.messageId,
        status: 'sent'
      });

      console.log('E-Mail erfolgreich gesendet:', info.messageId);
      return true;

    } catch (error) {
      console.error('Fehler beim E-Mail-Versand:', error);
      
      // Protokolliere Fehler
      await this.logEmailSent({
        to: emailData.to,
        subject: emailData.subject,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });

      return false;
    }
  }

  /**
   * Protokolliert E-Mail-Versand in der Datenbank
   */
  private async logEmailSent(logData: {
    to: string;
    subject: string;
    template_name?: string;
    message_id?: string;
    status: 'sent' | 'failed';
    error_message?: string;
    variables?: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.from('email_logs').insert({
        recipient: logData.to,
        subject: logData.subject,
        template_name: logData.template_name,
        message_id: logData.message_id,
        status: logData.status,
        error_message: logData.error_message,
        variables: logData.variables,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Fehler beim Protokollieren des E-Mail-Versands:', error);
    }
  }

  /**
   * Testet SMTP-Verbindung
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.initializeTransporter();
      return { success: true, message: 'SMTP-Verbindung erfolgreich getestet' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      };
    }
  }
}

// Singleton-Instanz
const nodemailerService = new NodemailerService();
export { nodemailerService };
export default nodemailerService;