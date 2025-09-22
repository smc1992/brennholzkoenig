import { supabase } from './supabase';
import { sendEmail } from './emailService';

interface EmailTemplate {
  id?: number;
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_active: boolean;
  template_type: 'order_confirmation' | 'shipping_notification' | 'admin_notification' | 'newsletter' | 'custom';
  description?: string;
}

interface EmailVariables {
  [key: string]: string | number;
}

/**
 * Lädt ein E-Mail-Template aus der Datenbank
 */
export async function getEmailTemplate(templateKey: string): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template')
      .eq('setting_key', templateKey)
      .single();

    if (error || !data) {
      console.error('Template not found in database:', templateKey, error);
      return null;
    }

    const template = JSON.parse(data.setting_value) as EmailTemplate;
    template.id = data.id;
    
    return template;
  } catch (error) {
    console.error('Error loading email template:', error);
    return null;
  }
}

/**
 * Ersetzt Variablen in einem Text mit den gegebenen Werten
 */
function replaceVariables(text: string, variables: EmailVariables): string {
  let result = text;
  
  Object.entries(variables).forEach(([key, value]) => {
    // Unterstütze sowohl {{variable}} als auch {variable} Format
    const doubleRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const singleRegex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(doubleRegex, String(value));
    result = result.replace(singleRegex, String(value));
  });
  
  return result;
}

/**
 * Sendet eine E-Mail basierend auf einem Template
 */
export async function sendTemplateEmail(
  templateKey: string,
  to: string,
  variables: EmailVariables,
  options?: {
    cc?: string;
    bcc?: string;
    replyTo?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Template laden
    const template = await getEmailTemplate(templateKey);
    
    if (!template) {
      return {
        success: false,
        error: `Template '${templateKey}' nicht gefunden`
      };
    }
    
    if (!template.is_active) {
      return {
        success: false,
        error: `Template '${templateKey}' ist nicht aktiv`
      };
    }
    
    // Variablen ersetzen
    const subject = replaceVariables(template.subject, variables);
    const htmlContent = replaceVariables(template.html_content, variables);
    const textContent = replaceVariables(template.text_content, variables);
    
    // E-Mail senden
    const result = await sendEmail({
      to,
      subject,
      html: htmlContent,
      text: textContent
    });
    
    // Log erstellen
    await logEmailSent({
      template_key: templateKey,
      to,
      subject,
      status: result.success ? 'sent' : 'failed',
      message_id: result.messageId,
      error: result.error,
      variables
    });
    
    return result;
  } catch (error) {
    console.error('Error sending template email:', error);
    return {
      success: false,
      error: `Fehler beim Senden der E-Mail: ${(error as Error).message}`
    };
  }
}

/**
 * Protokolliert eine gesendete E-Mail
 */
async function logEmailSent(logData: {
  template_key: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  message_id?: string;
  error?: string;
  variables: EmailVariables;
}) {
  try {
    const logEntry = {
      template_key: logData.template_key,
      recipient: logData.to,
      subject: logData.subject,
      status: logData.status,
      message_id: logData.message_id,
      error_message: logData.error,
      variables: logData.variables,
      sent_at: new Date().toISOString()
    };
    
    await supabase
      .rpc('universal_smtp_upsert', {
        p_setting_type: 'email_log',
        p_setting_key: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        p_setting_value: JSON.stringify(logEntry),
        p_description: `Email log: ${logData.template_key} to ${logData.to}`
      });
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

/**
 * Sendet eine Bestellbestätigung
 */
export async function sendOrderConfirmation(
  customerEmail: string,
  orderData: {
    customer_name: string;
    order_id: string;
    order_date: string;
    total_amount: number;
    delivery_address: string;
    order_tracking_url?: string;
    order_items?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendTemplateEmail('order_confirmation', customerEmail, {
    customer_name: orderData.customer_name,
    order_id: orderData.order_id,
    order_date: orderData.order_date,
    total_amount: parseFloat(String(orderData.total_amount)).toFixed(2),
    delivery_address: orderData.delivery_address,
    order_tracking_url: orderData.order_tracking_url || `https://brennholzkoenig.de/konto/bestellungen/${orderData.order_id}`,
    order_items: orderData.order_items || 'Keine Artikel angegeben'
  });
}

/**
 * Sendet eine Versandbenachrichtigung
 */
export async function sendShippingNotification(
  customerEmail: string,
  shippingData: {
    customer_name: string;
    order_id: string;
    tracking_number: string;
    shipping_date: string;
    estimated_delivery: string;
    shipping_company: string;
    tracking_url?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendTemplateEmail('shipping_notification', customerEmail, {
    customer_name: shippingData.customer_name,
    order_id: shippingData.order_id,
    tracking_number: shippingData.tracking_number,
    shipping_date: shippingData.shipping_date,
    estimated_delivery: shippingData.estimated_delivery,
    shipping_company: shippingData.shipping_company,
    tracking_url: shippingData.tracking_url || `https://tracking.example.com/${shippingData.tracking_number}`
  });
}

/**
 * Sendet eine Admin-Benachrichtigung über eine neue Bestellung
 */
export async function sendAdminNewOrderNotification(
  adminEmail: string,
  orderData: {
    order_id: string;
    order_date: string;
    total_amount: number;
    payment_status: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    delivery_address: string;
    order_items: string;
    admin_order_url?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendTemplateEmail('admin_new_order', adminEmail, {
    order_id: orderData.order_id,
    order_date: orderData.order_date,
    total_amount: parseFloat(String(orderData.total_amount)).toFixed(2),
    payment_status: orderData.payment_status,
    customer_name: orderData.customer_name,
    customer_email: orderData.customer_email,
    customer_phone: orderData.customer_phone,
    delivery_address: orderData.delivery_address,
    order_items: orderData.order_items,
    admin_order_url: orderData.admin_order_url || `https://brennholzkoenig.de/admin?tab=orders&order=${orderData.order_id}`
  });
}

/**
 * Lädt alle E-Mail-Logs
 */
export async function getEmailLogs(limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_log')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map((item: any) => ({
      id: item.id,
      ...JSON.parse(item.setting_value),
      created_at: item.created_at
    })) || [];
  } catch (error) {
    console.error('Error loading email logs:', error);
    return [];
  }
}

/**
 * Lädt alle aktiven E-Mail-Templates
 */
export async function getActiveEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const templates = data?.map((item: any) => ({
      id: item.id,
      ...JSON.parse(item.setting_value),
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];

    return templates.filter((template: EmailTemplate) => template.is_active);
  } catch (error) {
    console.error('Error loading active email templates:', error);
    return [];
  }
}