import 'server-only';
import { supabase } from './supabase';
import { sendEmail, sendEmailTest } from './emailService';
import { createClient } from '@supabase/supabase-js';

// Admin Supabase-Client mit Service Role Key für Template-Operationen
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

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
    console.log(`[loadEmailTemplate] Suche Template für Typ: ${type}`);
    const normalizedType = normalizeType(type);
    
    console.log('[loadEmailTemplate] Verwende normalen Client mit angepasster RLS-Policy');
    
    // Lade alle E-Mail-Templates mit normalem Client
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (error || !data) {
      console.warn(`Kein Template für Typ '${type}' gefunden:`, error);
      return null;
    }

    console.log(`[loadEmailTemplate] Gefundene Templates:`, data.length);
    console.log(`[loadEmailTemplate] Templates:`, data?.map((t: any) => ({ key: t.setting_key, value: t.setting_value?.substring(0, 100) })));
    
    // Finde das passende Template
    let template = data.find((t: any) => {
      try {
        const parsed = JSON.parse(t.setting_value);
        const parsedType = normalizeType(parsed.type || parsed.template_type || t.setting_key);
        const isActive = parsed.active === true || parsed.is_active === true;
        console.log(`[loadEmailTemplate] Prüfe Template '${t.setting_key}': type=${parsedType}, active=${isActive}`);
        return isActive && (parsedType === normalizedType);
      } catch (e) {
        console.error('Fehler beim Parsen des Templates:', e);
        return false;
      }
    });

    if (!template) {
      console.warn(`Kein aktives Template für Typ '${type}' gefunden – versuche Fallback über Trigger-Key`);
      // Fallback: Suche nach aktivem Template, das den Trigger-Key gesetzt hat
      const fallback = data.find((t: any) => {
        try {
          const parsed = JSON.parse(t.setting_value);
          const isActive = parsed.active === true || parsed.is_active === true;
          const triggers = parsed.triggers || {};
          return isActive && (triggers[type] === true || triggers[normalizedType] === true);
        } catch (e) {
          return false;
        }
      });

      if (!fallback) {
        // Debug: Zeige alle verfügbaren Template-Typen
        const availableTypes = data.map((t: any) => {
          try {
            const parsed = JSON.parse(t.setting_value);
            const parsedType = normalizeType(parsed.type || parsed.template_type || t.setting_key);
            const isActive = parsed.active === true || parsed.is_active === true;
            const hasTrigger = !!parsed.triggers && (parsed.triggers[type] === true || parsed.triggers[normalizedType] === true);
            return `${t.setting_key} (type: ${parsedType}, active: ${isActive}, trigger[${normalizedType}]=${hasTrigger})`;
          } catch (e) {
            return `${t.setting_key} (parse error)`;
          }
        });
        console.log(`[loadEmailTemplate] Verfügbare Templates:`, availableTypes);
        return null;
      }

      console.log(`[loadEmailTemplate] Fallback-Template gefunden über Trigger-Key: ${fallback.setting_key}`);
      template = fallback;
    }

    console.log(`[loadEmailTemplate] Template gefunden: ${template.setting_key}`);
    return {
      ...template,
      template: JSON.parse(template.setting_value)
    };
  } catch (error) {
    console.error('Fehler beim Laden des E-Mail-Templates:', error);
    return null;
  }
}

// Mappe deutschsprachige Typnamen auf interne Schlüssel
function normalizeType(type: string): string {
  if (!type) return type;
  const map: Record<string, string> = {
    'Versandbenachrichtigung': 'shipping_notification',
    'Bestellbestätigung': 'order_confirmation',
    'Kundenstornierung': 'customer_order_cancellation',
    'Admin-Stornierung': 'admin_order_cancellation',
    'Adminstornierung': 'admin_order_cancellation'
  };
  return map[type] || type;
}

// Firmen-Informationen für E-Mail-Templates
const COMPANY_INFO = {
  name: 'Thorsten Vey',
  business: 'Brennholzhandel',
  address: 'Frankfurter Straße 3',
  postal_code: '36419',
  city: 'Buttlar',
  country: 'Deutschland',
  phone: '+49 176 71085234',
  email: 'info@brennholz-koenig.de',
  website: 'www.brennholzkoenig.de',
  logo_url: 'https://brennholz-koenig.de/images/Brennholzkönig%20transparent.webp?v=4&t=1695730300',
  business_hours: {
    weekdays: 'Montag - Freitag: 8:00 - 18:00 Uhr',
    saturday: 'Samstag: 9:00 - 16:00 Uhr',
    sunday: 'Sonntag: Nach Vereinbarung'
  }
};

// Generiere professionelle E-Mail-Header mit Logo und Firmeninfo
function generateEmailHeader(): string {
  return `
    <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 4px solid #C04020;">
      <img src="${COMPANY_INFO.logo_url}" alt="${COMPANY_INFO.name} Logo" style="height: 80px; width: auto; margin-bottom: 20px;" />
      <h1 style="color: #C04020; font-size: 28px; font-weight: bold; margin: 0; font-family: 'Inter', Arial, sans-serif;">
        🔥 Brennholzkönig
      </h1>
      <p style="color: #6c757d; font-size: 16px; margin: 5px 0 0; font-family: Arial, sans-serif;">
        Thorsten Vey Brennholzhandel
      </p>
    </div>
  `;
}

// Generiere professionelle E-Mail-Footer mit vollständiger Firmenadresse
function generateEmailFooter(): string {
  return `
    <div style="background: #f8f9fa; padding: 30px 20px; margin-top: 30px; border-radius: 0 0 8px 8px; border-top: 3px solid #C04020;">
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #C04020; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">📍 Kontakt</h3>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              <strong>${COMPANY_INFO.name}</strong><br>
              ${COMPANY_INFO.business}<br>
              ${COMPANY_INFO.address}<br>
              ${COMPANY_INFO.postal_code} ${COMPANY_INFO.city}<br>
              ${COMPANY_INFO.country}
            </p>
          </div>
          <div>
            <h3 style="color: #C04020; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">📞 Erreichbarkeit</h3>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              <strong>Telefon:</strong> ${COMPANY_INFO.phone}<br>
              <strong>E-Mail:</strong> ${COMPANY_INFO.email}<br>
              <strong>Website:</strong> ${COMPANY_INFO.website}
            </p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
          <h3 style="color: #C04020; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🕒 Geschäftszeiten</h3>
          <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
            ${COMPANY_INFO.business_hours.weekdays}<br>
            ${COMPANY_INFO.business_hours.saturday}<br>
            ${COMPANY_INFO.business_hours.sunday}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            Diese E-Mail wurde automatisch vom ${COMPANY_INFO.name} System generiert.<br>
            Bei Fragen wenden Sie sich gerne an uns: ${COMPANY_INFO.email}
          </p>
        </div>
      </div>
    </div>
  `;
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
async function appendGlobalSignature(content: string): Promise<string> {
  const signature = await loadGlobalSignature();
  
  if (!signature || !signature.enabled) {
    return content;
  }

  // Prüfe ob es HTML-Content ist
  if (content.includes('<html') || content.includes('<!DOCTYPE')) {
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

// Ersetze Platzhalter in Template-Inhalt
export async function replacePlaceholders(content: string, data: TemplateData): Promise<string> {
  const initial = typeof content === 'string' ? content : '';
  let result = initial;
  
  // Entferne HTML-Platzhalter-Spans falls vorhanden (aus Visual Editor)
  result = result.replace(/<span[^>]*class="[^"]*bg-blue-100[^"]*"[^>]*>([^<]+)<\/span>/g, '$1');
  
  // Erweiterte Template-Daten mit Firmeninformationen
  const enhancedData = {
    ...data,
    company_name: COMPANY_INFO.name,
    company_business: COMPANY_INFO.business,
    company_address: `${COMPANY_INFO.address}, ${COMPANY_INFO.postal_code} ${COMPANY_INFO.city}`,
    company_phone: COMPANY_INFO.phone,
    company_email: COMPANY_INFO.email,
    company_website: COMPANY_INFO.website,
    support_email: COMPANY_INFO.email
  };
  
  // Standard-Platzhalter ersetzen
  Object.entries(enhancedData).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, String(value || ''));
  });
  
  // Spezielle Formatierungen
  // Betrag immer als Euro im DE-Format ausgeben und sowohl order_total als auch total_amount unterstützen
  const formatEuro = (val: any): string => {
    const num = typeof val === 'string' ? Number(val.replace(',', '.')) : Number(val);
    if (!isFinite(num)) return '0,00 €';
    try {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);
    } catch {
      return `${num.toFixed(2)} €`;
    }
  };

  const formattedTotal = data.order_total !== undefined ? formatEuro(data.order_total) : (
    data.total_amount !== undefined ? formatEuro(data.total_amount) : '0,00 €'
  );

  result = result.replace(/{{order_total}}/g, formattedTotal);
  result = result.replace(/{{total_amount}}/g, formattedTotal);
  result = result.replace(/{{order_date}}/g, data.order_date || new Date().toLocaleDateString('de-DE'));
  
  // Templates enthalten bereits vollständige HTML-Struktur mit Header und Footer
  // Keine automatische Generierung mehr erforderlich
  
  // WICHTIG: Keine globale Signatur hier anhängen, dies geschieht zentral beim Versand.

  // Fallback für nicht ersetzte Platzhalter (leere Strings)
  result = result.replace(/{{[^}]+}}/g, '');

  return result;
}

// Sende E-Mail basierend auf Template
// Test-Version der sendTemplateEmail Funktion
export async function sendTemplateEmailTest(
  templateType: string,
  recipientEmail: string,
  templateData: TemplateData,
  options: {
    ccAdmin?: boolean;
    adminEmail?: string;
  } = {}
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log(`[EmailTemplate-TEST] Lade Template für Typ: ${templateType}`);
    
    // Template laden
    const template = await loadEmailTemplate(templateType);
    if (!template) {
      return {
        success: false,
        error: `Kein aktives Template für Typ '${templateType}' gefunden`
      };
    }

    console.log(`[EmailTemplate-TEST] Template gefunden: ${template.setting_name}`);

    // Standard-Daten hinzufügen
    const completeData: TemplateData = {
      company_name: 'Brennholzkönig',
      support_email: 'info@brennholz-koenig.de',
      ...templateData
    };

    // Platzhalter ersetzen (robuste Feld-Fallbacks aus Admin-Editor: html/text)
    const subjectSource = (template.template as any).subject || '';
    const htmlSource = (template.template as any).html_content || (template.template as any).html || '';
    const textSource = (template.template as any).text_content || (template.template as any).text || '';

    const subject = await replacePlaceholders(subjectSource, completeData);
    const htmlContent = await replacePlaceholders(htmlSource, completeData);
    const textContent = await replacePlaceholders(textSource, completeData);

    console.log(`[EmailTemplate-TEST] Simuliere E-Mail an: ${recipientEmail}`);
    console.log(`[EmailTemplate-TEST] Betreff: ${subject}`);

    // E-Mail an Kunden senden (TEST-MODUS)
    const result = await sendEmailTest({
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    // Optional: E-Mail an Admin weiterleiten (auch im Test-Modus)
    if (options.ccAdmin && options.adminEmail && result.success) {
      console.log(`[EmailTemplate-TEST] Simuliere Kopie an Admin: ${options.adminEmail}`);
      
      const adminSubject = `[Admin-Kopie] ${subject}`;
      const adminHtml = `
        <div style="background-color: #f0f0f0; padding: 10px; margin-bottom: 20px; border-left: 4px solid #C04020;">
          <strong>Admin-Benachrichtigung:</strong> Diese E-Mail wurde automatisch an den Kunden gesendet.<br>
          <strong>Kunde:</strong> ${completeData.customer_name} (${recipientEmail})<br>
          <strong>Template:</strong> ${template.setting_name}
        </div>
        ${htmlContent}
      `;
      
      await sendEmailTest({
        to: options.adminEmail,
        subject: adminSubject,
        html: adminHtml,
        text: `[Admin-Kopie] ${textContent}`
      });
    }

    // E-Mail-Log erstellen (auch im Test-Modus)
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
    console.error('[EmailTemplate-TEST] Fehler beim Simulieren der Template-E-Mail:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

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

    // Platzhalter ersetzen (robuste Feld-Fallbacks aus Admin-Editor: html/text)
    const subjectSource = (template.template as any).subject || '';
    const htmlSource = (template.template as any).html_content || (template.template as any).html || '';
    const textSource = (template.template as any).text_content || (template.template as any).text || '';

    const subject = await replacePlaceholders(subjectSource, completeData);
    const htmlContent = await replacePlaceholders(htmlSource, completeData);
    const textContent = await replacePlaceholders(textSource, completeData);

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
        setting_key: `${logData.type}_${Date.now()}`,
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