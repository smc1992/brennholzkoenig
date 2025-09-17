import { supabase } from './supabase';
import { sendEmail } from './emailService';

interface TemplateData {
  customer_name?: string;
  customer_email?: string;
  order_number?: string;
  order_total?: string;
  order_date?: string;
  delivery_address?: string;
  tracking_number?: string;
  product_list?: string;
  company_name?: string;
  support_email?: string;
  [key: string]: any;
}

interface EmailTemplate {
  id: number;
  setting_name: string;
  setting_value: string;
  template: {
    subject: string;
    html_content: string;
    text_content: string;
    type: string;
    active: boolean;
  };
}

// Lade aktive E-Mail-Templates aus der Datenbank
export async function loadEmailTemplate(type: string): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template')
      .single();

    if (error || !data) {
      console.warn(`Kein Template für Typ '${type}' gefunden:`, error);
      return null;
    }

    const templates = Array.isArray(data) ? data : [data];
    const template = templates.find(t => {
      try {
        const parsed = JSON.parse(t.setting_value);
        return parsed.type === type && parsed.active;
      } catch (e) {
        console.error('Fehler beim Parsen des Templates:', e);
        return false;
      }
    });

    if (!template) {
      console.warn(`Kein aktives Template für Typ '${type}' gefunden`);
      return null;
    }

    return {
      ...template,
      template: JSON.parse(template.setting_value)
    };
  } catch (error) {
    console.error('Fehler beim Laden des E-Mail-Templates:', error);
    return null;
  }
}

// Ersetze Platzhalter in Template-Inhalt
export function replacePlaceholders(content: string, data: TemplateData): string {
  let result = content;
  
  // Entferne HTML-Platzhalter-Spans falls vorhanden (aus Visual Editor)
  result = result.replace(/<span[^>]*class="[^"]*bg-blue-100[^"]*"[^>]*>([^<]+)<\/span>/g, '$1');
  
  // Standard-Platzhalter ersetzen
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, String(value || ''));
  });
  
  // Spezielle Formatierungen
  result = result.replace(/{{order_total}}/g, data.order_total ? `${data.order_total}` : '0,00 €');
  result = result.replace(/{{order_date}}/g, data.order_date || new Date().toLocaleDateString('de-DE'));
  
  // Fallback für nicht ersetzte Platzhalter (leere Strings)
  result = result.replace(/{{[^}]+}}/g, '');
  
  return result;
}

// Sende E-Mail basierend auf Template
export async function sendTemplateEmail(
  templateType: string,
  recipientEmail: string,
  templateData: TemplateData,
  options: {
    ccAdmin?: boolean;
    adminEmail?: string;
  } = {}
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log(`[EmailTemplate] Lade Template für Typ: ${templateType}`);
    
    // Template laden
    const template = await loadEmailTemplate(templateType);
    if (!template) {
      return {
        success: false,
        error: `Kein aktives Template für Typ '${templateType}' gefunden`
      };
    }

    console.log(`[EmailTemplate] Template gefunden: ${template.setting_name}`);

    // Standard-Daten hinzufügen
    const completeData: TemplateData = {
      company_name: 'Brennholzkönig',
      support_email: 'info@brennholz-koenig.de',
      ...templateData
    };

    // Platzhalter ersetzen
    const subject = replacePlaceholders(template.template.subject, completeData);
    const htmlContent = replacePlaceholders(template.template.html_content, completeData);
    const textContent = replacePlaceholders(template.template.text_content, completeData);

    console.log(`[EmailTemplate] Sende E-Mail an: ${recipientEmail}`);
    console.log(`[EmailTemplate] Betreff: ${subject}`);

    // E-Mail an Kunden senden
    const result = await sendEmail({
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    // Optional: E-Mail an Admin weiterleiten
    if (options.ccAdmin && options.adminEmail && result.success) {
      console.log(`[EmailTemplate] Sende Kopie an Admin: ${options.adminEmail}`);
      
      const adminSubject = `[Admin-Kopie] ${subject}`;
      const adminHtml = `
        <div style="background-color: #f0f0f0; padding: 10px; margin-bottom: 20px; border-left: 4px solid #C04020;">
          <strong>Admin-Benachrichtigung:</strong> Diese E-Mail wurde automatisch an den Kunden gesendet.<br>
          <strong>Kunde:</strong> ${completeData.customer_name} (${recipientEmail})<br>
          <strong>Template:</strong> ${template.setting_name}
        </div>
        ${htmlContent}
      `;
      
      await sendEmail({
        to: options.adminEmail,
        subject: adminSubject,
        html: adminHtml,
        text: `[Admin-Kopie] ${textContent}`
      });
    }

    // E-Mail-Log erstellen
    await logEmailSent({
      type: templateType,
      to: recipientEmail,
      subject: subject,
      status: result.success ? 'sent' : 'failed',
      template_id: template.id,
      message_id: result.messageId,
      error: result.error
    });

    return result;
  } catch (error) {
    console.error('[EmailTemplate] Fehler beim Senden der Template-E-Mail:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// Protokolliere gesendete E-Mails
export async function logEmailSent(logData: {
  type: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  template_id?: number;
  message_id?: string;
  error?: string;
}) {
  try {
    await supabase
      .from('app_settings')
      .insert({
        setting_type: 'email_log',
        setting_name: `${logData.type}_${Date.now()}`,
        setting_value: JSON.stringify({
          ...logData,
          sent_at: new Date().toISOString()
        }),
        description: `E-Mail Log: ${logData.type} an ${logData.to}`
      });
  } catch (error) {
    console.error('Fehler beim Protokollieren der E-Mail:', error);
  }
}

// Hilfsfunktion: Formatiere Produktliste für E-Mail
export function formatProductList(products: any[]): string {
  if (!products || products.length === 0) {
    return '<p>Keine Produkte gefunden.</p>';
  }

  const listItems = products.map(product => {
    const name = product.name || product.title || 'Unbekanntes Produkt';
    const quantity = product.quantity || 1;
    const price = product.price ? `${product.price} €` : '';
    
    return `<li>${name} ${quantity > 1 ? `(${quantity}x)` : ''} ${price}</li>`;
  }).join('');

  return `<ul style="margin: 10px 0; padding-left: 20px;">${listItems}</ul>`;
}

// Hilfsfunktion: Formatiere Adresse für E-Mail
export function formatAddress(address: any): string {
  if (!address) return 'Keine Adresse angegeben';
  
  const parts = [
    address.name || address.firstName && address.lastName ? `${address.firstName} ${address.lastName}` : '',
    address.street || address.address,
    address.zipCode && address.city ? `${address.zipCode} ${address.city}` : address.city,
    address.country
  ].filter(Boolean);
  
  return parts.join('<br>');
}