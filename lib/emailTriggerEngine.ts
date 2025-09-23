import { supabase } from './supabase';
import { sendTemplateEmail } from './emailTemplateEngine';

interface TemplateData {
  [key: string]: any;
}

interface TriggerConfig {
  order_confirmation: boolean;
  shipping_notification: boolean;
  newsletter: boolean;
  low_stock: boolean;
  out_of_stock: boolean;
}

interface OrderData {
  id: string;
  number: string;
  total: number;
  date: string;
  customer: {
    name: string;
    email: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  delivery_address?: string;
}

interface ShippingData {
  order_number: string;
  tracking_number: string;
  carrier: string;
  customer: {
    name: string;
    email: string;
  };
}

interface StockData {
  product_name: string;
  current_stock: number;
  minimum_stock: number;
  admin_email: string;
}

interface OutOfStockData {
  product_name: string;
  minimum_stock: number;
  out_of_stock_date: string;
  last_sale_date: string;
  sales_last_30_days: number;
  avg_daily_sales: number;
  recommended_reorder: number;
  admin_email: string;
  admin_inventory_url: string;
  reorder_url: string;
}

/**
 * Lädt aktive E-Mail-Templates mit Triggern aus der Datenbank
 */
export async function getActiveTemplatesWithTriggers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (error) {
      console.error('Fehler beim Laden der Templates:', error);
      return [];
    }

    return data?.map((template: any) => {
      const parsedTemplate = JSON.parse(template.setting_value);
      return {
        ...template,
        template: parsedTemplate,
        // Template ist aktiv wenn sowohl das Template als auch die Trigger aktiv sind
        isActive: parsedTemplate.active === true
      };
    }).filter((t: any) => t.isActive) || [];
  } catch (error) {
    console.error('Fehler beim Parsen der Templates:', error);
    return [];
  }
}

/**
 * Trigger für Bestellbestätigungen
 */
export async function triggerOrderConfirmation(orderData: OrderData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Bestellbestätigungs-Trigger
    const orderTemplate = templates.find(t => 
      t.template.type === 'order_confirmation' && 
      t.template.triggers?.order_confirmation === true
    );

    if (!orderTemplate) {
      console.log('Kein aktives Bestellbestätigungs-Template gefunden');
      return false;
    }

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      customer_name: orderData.customer.name,
      order_number: orderData.number,
      order_total: orderData.total.toFixed(2) + ' €',
      order_date: new Date(orderData.date).toLocaleDateString('de-DE'),
      delivery_address: orderData.delivery_address || 'Nicht angegeben',
      product_list: orderData.products.map(p => 
        `${p.quantity}x ${p.name} - ${p.price.toFixed(2)} €`
      ).join('\n'),
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    // E-Mail senden
    const result = await sendTemplateEmail(
      'order_confirmation',
      orderData.customer.email,
      templateData
    );

    if (result.success) {
      console.log(`Bestellbestätigung für Bestellung ${orderData.number} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('order_confirmation', orderData.customer.email, orderData.number);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Bestellbestätigung:', error);
    return false;
  }
}

/**
 * Trigger für Versandbenachrichtigungen
 */
export async function triggerShippingNotification(shippingData: ShippingData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Versand-Trigger
    const shippingTemplate = templates.find(t => 
      t.template.type === 'shipping_notification' && 
      t.template.triggers?.shipping_notification === true
    );

    if (!shippingTemplate) {
      console.log('Kein aktives Versandbenachrichtigungs-Template gefunden');
      return false;
    }

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      customer_name: shippingData.customer.name,
      order_number: shippingData.order_number,
      tracking_number: shippingData.tracking_number,
      carrier: shippingData.carrier,
      tracking_url: `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?lang=de&idc=${shippingData.tracking_number}`,
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    // E-Mail senden
    const result = await sendTemplateEmail(
      'shipping_notification',
      shippingData.customer.email,
      templateData
    );

    if (result.success) {
      console.log(`Versandbenachrichtigung für Bestellung ${shippingData.order_number} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('shipping_notification', shippingData.customer.email, shippingData.order_number);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Versandbenachrichtigung:', error);
    return false;
  }
}

/**
 * Trigger für Lagerwarnung
 */
export async function triggerLowStockAlert(stockData: StockData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Lagerwarnung-Trigger
    const stockTemplate = templates.find(t => 
      t.template.type === 'low_stock' && 
      t.template.triggers?.low_stock === true
    );

    if (!stockTemplate) {
      console.log('Kein aktives Lagerwarnung-Template gefunden');
      return false;
    }

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      product_name: stockData.product_name,
      current_stock: stockData.current_stock.toString(),
      minimum_stock: stockData.minimum_stock.toString(),
      alert_date: new Date().toLocaleDateString('de-DE'),
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    // E-Mail an Admin senden
    const result = await sendTemplateEmail(
      'low_stock',
      stockData.admin_email,
      templateData
    );

    if (result.success) {
      console.log(`Lagerwarnung für ${stockData.product_name} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('low_stock', stockData.admin_email, stockData.product_name);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Lagerwarnung:', error);
    return false;
  }
}

/**
 * Trigger für ausverkaufte Produkte
 */
export async function triggerOutOfStockAlert(stockData: OutOfStockData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Ausverkauft-Trigger
    const outOfStockTemplate = templates.find(t => 
      t.template.type === 'out_of_stock' && 
      t.template.triggers?.out_of_stock === true
    );

    if (!outOfStockTemplate) {
      console.log('Kein aktives Ausverkauft-Template gefunden');
      return false;
    }

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      product_name: stockData.product_name,
      minimum_stock: stockData.minimum_stock.toString(),
      out_of_stock_date: stockData.out_of_stock_date,
      last_sale_date: stockData.last_sale_date,
      sales_last_30_days: stockData.sales_last_30_days.toString(),
      avg_daily_sales: stockData.avg_daily_sales.toString(),
      recommended_reorder: stockData.recommended_reorder.toString(),
      admin_inventory_url: stockData.admin_inventory_url,
      reorder_url: stockData.reorder_url,
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    // E-Mail an Admin senden
    const result = await sendTemplateEmail(
      'out_of_stock',
      stockData.admin_email,
      templateData
    );

    if (result.success) {
      console.log(`Ausverkauft-Warnung für ${stockData.product_name} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('out_of_stock', stockData.admin_email, stockData.product_name);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Ausverkauft-Warnung:', error);
    return false;
  }
}

/**
 * Newsletter-Versand an alle Abonnenten
 */
export async function triggerNewsletterSend(templateId: string, subject?: string): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde spezifisches Newsletter-Template
    const newsletterTemplate = templates.find(t => 
      t.id === templateId && 
      t.template.type === 'newsletter' && 
      t.template.triggers?.newsletter === true
    );

    if (!newsletterTemplate) {
      console.log('Newsletter-Template nicht gefunden oder nicht aktiv');
      return false;
    }

    // Hole alle Newsletter-Abonnenten (hier müsste eine entsprechende Tabelle existieren)
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, name')
      .eq('active', true);

    if (error || !subscribers || subscribers.length === 0) {
      console.log('Keine aktiven Newsletter-Abonnenten gefunden');
      return false;
    }

    let successCount = 0;
    const templateData = {
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de',
      unsubscribe_url: 'https://brennholz-koenig.de/newsletter/abmelden',
      newsletter_date: new Date().toLocaleDateString('de-DE')
    };

    // E-Mail an alle Abonnenten senden
    for (const subscriber of subscribers) {
      const personalizedData = {
        ...templateData,
        customer_name: subscriber.name || 'Liebe/r Kunde/in'
      };

      const result = await sendTemplateEmail(
        'newsletter',
        subscriber.email,
        personalizedData
      );

      if (result.success) {
        successCount++;
      }

      // Kleine Pause zwischen E-Mails um Server nicht zu überlasten
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Newsletter an ${successCount}/${subscribers.length} Abonnenten gesendet`);
    
    // Log-Eintrag erstellen
    await logEmailTrigger('newsletter', 'bulk', `${successCount} Empfänger`);

    return successCount > 0;
  } catch (error) {
    console.error('Fehler beim Newsletter-Versand:', error);
    return false;
  }
}

/**
 * Protokolliert Trigger-Ereignisse
 */
export async function logEmailTrigger(
  triggerType: string, 
  recipient: string, 
  reference: string
): Promise<void> {
  try {
    const logData = {
      status: 'sent' as const,
      subject: `Automatischer Versand: ${triggerType}`,
      to: recipient,
      sent_at: new Date().toISOString(),
      type: triggerType,
      reference: reference
    };

    await supabase
      .from('app_settings')
      .insert({
        setting_name: `email_log_${Date.now()}`,
        setting_type: 'email_log',
        setting_value: JSON.stringify(logData)
      });

  } catch (error) {
    console.error('Fehler beim Protokollieren des E-Mail-Triggers:', error);
  }
}

/**
 * Prüft und aktiviert alle verfügbaren Trigger
 */
export async function initializeEmailTriggers(): Promise<void> {
  console.log('E-Mail-Trigger-Engine initialisiert');
  console.log('Verfügbare Trigger:');
  console.log('- triggerOrderConfirmation(orderData)');
  console.log('- triggerShippingNotification(shippingData)');
  console.log('- triggerLowStockAlert(stockData)');
  console.log('- triggerNewsletterSend(templateId)');
}