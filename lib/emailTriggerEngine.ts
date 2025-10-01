import { supabase } from './supabase';
import { sendTemplateEmail, sendTemplateEmailTest } from './emailTemplateEngine';

interface TemplateData {
  [key: string]: any;
}

interface TriggerConfig {
  order_confirmation: boolean;
  shipping_notification: boolean;
  customer_order_cancellation: boolean;
  admin_order_cancellation: boolean;
  newsletter: boolean;
  low_stock: boolean;
  out_of_stock: boolean;
  loyalty_points_earned: boolean;
  loyalty_points_redeemed: boolean;
  loyalty_tier_upgrade: boolean;
  loyalty_points_expiring: boolean;
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

interface CancellationData {
  order_number: string;
  order_id: string;
  order_date: string;
  cancellation_date: string;
  cancellation_reason?: string;
  total_amount: number;
  customer: {
    name: string;
    email: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  admin_email?: string;
}

interface LoyaltyPointsEarnedData {
  customer: {
    name: string;
    email: string;
    customer_number: string;
  };
  points_earned: number;
  order_number?: string;
  order_total?: number;
  current_points_balance: number;
  tier_name: string;
  points_to_next_tier?: number;
  next_tier_name?: string;
}

interface LoyaltyPointsRedeemedData {
  customer: {
    name: string;
    email: string;
    customer_number: string;
  };
  points_redeemed: number;
  discount_amount: number;
  order_number?: string;
  remaining_points_balance: number;
  tier_name: string;
}

interface LoyaltyTierUpgradeData {
  customer: {
    name: string;
    email: string;
    customer_number: string;
  };
  old_tier_name: string;
  new_tier_name: string;
  new_tier_benefits: string[];
  current_points_balance: number;
  points_to_next_tier?: number;
  next_tier_name?: string;
}

interface LoyaltyPointsExpiringData {
  customer: {
    name: string;
    email: string;
    customer_number: string;
  };
  expiring_points: number;
  expiration_date: string;
  current_points_balance: number;
  tier_name: string;
  days_until_expiration: number;
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
      let parsedTemplate: any = {};
      try {
        parsedTemplate = JSON.parse(template.setting_value);
      } catch (e) {
        console.error('Fehler beim Parsen des Templates:', template.setting_key, e);
      }

      // Unterstütze beide Schemen: active/is_active und type/template_type
      const isActive = parsedTemplate?.active === true || parsedTemplate?.is_active === true;
      const normalizedType = parsedTemplate?.type || parsedTemplate?.template_type || template.setting_key;

      return {
        ...template,
        template: {
          ...parsedTemplate,
          type: normalizedType,
          active: isActive,
        },
        isActive
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
      order_id: orderData.number,
      order_number: orderData.number,
      total_amount: orderData.total.toFixed(2),
      order_date: new Date(orderData.date).toLocaleDateString('de-DE'),
      delivery_address: orderData.delivery_address || 'Nicht angegeben',
      order_tracking_url: `https://brennholz-koenig.de/bestellverlauf?order=${orderData.number}`,
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
      order_id: shippingData.order_number,
      order_number: shippingData.order_number,
      tracking_number: shippingData.tracking_number,
      shipping_date: new Date().toLocaleDateString('de-DE'),
      estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
      shipping_company: shippingData.carrier,
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
 * Löst E-Mail-Benachrichtigungen für Kunden-Bestellstornierungen aus
 */
export async function triggerCustomerOrderCancellation(cancellationData: CancellationData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Kunden-Stornierungstrigger
    const customerTemplate = templates.find(t => 
      t.template.triggers?.customer_order_cancellation === true
    );

    if (!customerTemplate) {
      console.log('Kein aktives Kunden-Stornierungstemplate gefunden');
      return true; // Kein Fehler, nur kein Template aktiv
    }

    const customerTemplateData = {
      customer_name: cancellationData.customer.name,
      order_id: cancellationData.order_number,
      order_number: cancellationData.order_number,
      order_date: cancellationData.order_date,
      cancellation_date: cancellationData.cancellation_date,
      order_total: cancellationData.total_amount.toFixed(2),
      order_items: cancellationData.products.map(p => 
        `${p.quantity}x ${p.name} (${p.price.toFixed(2)}€)`
      ).join(', '),
      shop_url: 'https://brennholz-koenig.de',
      support_email: 'info@brennholz-koenig.de'
    };

    const result = await sendTemplateEmail(
      'customer_order_cancellation',
      cancellationData.customer.email,
      customerTemplateData
    );

    if (result.success) {
      console.log(`Stornierungsbestätigung für Kunde ${cancellationData.customer.email} gesendet`);
      await logEmailTrigger('customer_order_cancellation', cancellationData.customer.email, cancellationData.order_number);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Kunden-Stornierungsbenachrichtigung:', error);
    return false;
  }
}

/**
 * Löst E-Mail-Benachrichtigungen für Admin-Bestellstornierungen aus
 */
export async function triggerAdminOrderCancellation(cancellationData: CancellationData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Admin-Stornierungstrigger
    const adminTemplate = templates.find(t => 
      t.template.triggers?.admin_order_cancellation === true
    );

    if (!adminTemplate || !cancellationData.admin_email) {
      console.log('Kein aktives Admin-Stornierungstemplate gefunden oder keine Admin-E-Mail angegeben');
      return true; // Kein Fehler, nur kein Template aktiv oder keine Admin-E-Mail
    }

    const adminTemplateData = {
      order_id: cancellationData.order_number,
      order_number: cancellationData.order_number,
      order_date: cancellationData.order_date,
      customer_name: cancellationData.customer.name,
      customer_email: cancellationData.customer.email,
      customer_phone: 'Nicht verfügbar', // Telefonnummer ist nicht in cancellationData verfügbar
      cancellation_date: cancellationData.cancellation_date,
      order_total: cancellationData.total_amount.toFixed(2),
      order_items: cancellationData.products.map(p => 
        `${p.quantity}x ${p.name} (${p.price.toFixed(2)}€)`
      ).join(', '),
      admin_order_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders/${cancellationData.order_id}`
    };

    const result = await sendTemplateEmail(
      'admin_order_cancellation',
      cancellationData.admin_email,
      adminTemplateData
    );

    if (result.success) {
      console.log(`Admin-Benachrichtigung über Stornierung an ${cancellationData.admin_email} gesendet`);
      await logEmailTrigger('admin_order_cancellation', cancellationData.admin_email, cancellationData.order_number);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Admin-Stornierungsbenachrichtigung:', error);
    return false;
  }
}

/**
 * Löst E-Mail-Benachrichtigungen für Bestellstornierungen aus (beide: Kunde und Admin)
 */
export async function triggerOrderCancellation(cancellationData: CancellationData): Promise<boolean> {
  try {
    const customerSuccess = await triggerCustomerOrderCancellation(cancellationData);
    const adminSuccess = await triggerAdminOrderCancellation(cancellationData);
    
    return customerSuccess && adminSuccess;
  } catch (error) {
    console.error('Fehler beim Senden der Stornierungsbenachrichtigungen:', error);
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
        setting_key: `email_log_${Date.now()}`,
        setting_type: 'email_log',
        setting_value: JSON.stringify(logData)
      });

  } catch (error) {
    console.error('Fehler beim Protokollieren des E-Mail-Triggers:', error);
  }
}

/**
 * Trigger für Loyalty-Punkte erhalten
 */
export async function triggerLoyaltyPointsEarned(loyaltyData: LoyaltyPointsEarnedData): Promise<boolean> {
  try {
    console.log('🚀 triggerLoyaltyPointsEarned gestartet für:', loyaltyData.customer.email);
    
    const templates = await getActiveTemplatesWithTriggers();
    console.log(`📊 Geladene Templates: ${templates.length}`);
    
    // Debug: Zeige alle Template-Typen
    const templateTypes = templates.map(t => t.template.type);
    console.log('📋 Template-Typen:', templateTypes);
    
    // Finde Template mit aktiviertem Loyalty-Punkte-erhalten-Trigger
    const loyaltyTemplate = templates.find(t => 
      t.template.type === 'loyalty_points_earned' && 
      t.template.triggers?.loyalty_points_earned === true
    );

    console.log('🔍 Suche nach Template mit:');
    console.log('   - type: loyalty_points_earned');
    console.log('   - triggers.loyalty_points_earned: true');
    console.log('🎯 Template gefunden:', !!loyaltyTemplate);

    if (!loyaltyTemplate) {
      console.log('❌ Kein aktives Loyalty-Punkte-erhalten-Template gefunden');
      
      // Debug: Zeige alle Loyalty-Templates
      const loyaltyTemplates = templates.filter(t => t.template.type?.includes('loyalty'));
      console.log('🔍 Verfügbare Loyalty-Templates:');
      loyaltyTemplates.forEach(t => {
        console.log(`   - ${t.template.type}: triggers =`, t.template.triggers);
      });
      
      return false;
    }

    console.log('✅ Template gefunden:', loyaltyTemplate.setting_key);

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      customer_name: loyaltyData.customer.name,
      customer_number: loyaltyData.customer.customer_number,
      points_earned: loyaltyData.points_earned.toString(),
      order_number: loyaltyData.order_number || '',
      order_total: loyaltyData.order_total?.toFixed(2) || '',
      current_points_balance: loyaltyData.current_points_balance.toString(),
      tier_name: loyaltyData.tier_name,
      points_to_next_tier: loyaltyData.points_to_next_tier?.toString() || '',
      next_tier_name: loyaltyData.next_tier_name || '',
      loyalty_dashboard_url: 'https://brennholz-koenig.de/loyalty',
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    console.log('📧 Sende E-Mail mit Template-Daten (TEST-MODUS):', templateData);
    
    // E-Mail senden (Test-Modus)
    const result = await sendTemplateEmailTest(
      'loyalty_points_earned',
      loyaltyData.customer.email,
      templateData
    );

    console.log('📧 E-Mail-Versand-Ergebnis (TEST-MODUS):', result);

    if (result.success) {
      console.log(`✅ Loyalty-Punkte-erhalten E-Mail für ${loyaltyData.customer.email} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('loyalty_points_earned', loyaltyData.customer.email, loyaltyData.customer.customer_number);
    } else {
      console.log(`❌ E-Mail-Versand fehlgeschlagen:`, result.error);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Loyalty-Punkte-erhalten E-Mail:', error);
    return false;
  }
}

/**
 * Trigger für Loyalty-Punkte eingelöst
 */
export async function triggerLoyaltyPointsRedeemed(loyaltyData: LoyaltyPointsRedeemedData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Loyalty-Punkte-eingelöst-Trigger
    const loyaltyTemplate = templates.find(t => 
      t.template.type === 'loyalty_points_redeemed' && 
      t.template.triggers?.loyalty_points_redeemed === true
    );

    if (!loyaltyTemplate) {
      console.log('Kein aktives Loyalty-Punkte-eingelöst-Template gefunden');
      return false;
    }

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      customer_name: loyaltyData.customer.name,
      customer_number: loyaltyData.customer.customer_number,
      points_redeemed: loyaltyData.points_redeemed.toString(),
      discount_amount: loyaltyData.discount_amount.toFixed(2),
      order_number: loyaltyData.order_number || '',
      remaining_points_balance: loyaltyData.remaining_points_balance.toString(),
      tier_name: loyaltyData.tier_name,
      loyalty_dashboard_url: 'https://brennholz-koenig.de/loyalty',
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    // E-Mail senden
    const result = await sendTemplateEmail(
      'loyalty_points_redeemed',
      loyaltyData.customer.email,
      templateData
    );

    if (result.success) {
      console.log(`Loyalty-Punkte-eingelöst E-Mail für ${loyaltyData.customer.email} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('loyalty_points_redeemed', loyaltyData.customer.email, loyaltyData.customer.customer_number);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Loyalty-Punkte-eingelöst E-Mail:', error);
    return false;
  }
}

/**
 * Trigger für Loyalty-Tier-Upgrade
 */
export async function triggerLoyaltyTierUpgrade(loyaltyData: LoyaltyTierUpgradeData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Loyalty-Tier-Upgrade-Trigger
    const loyaltyTemplate = templates.find(t => 
      t.template.type === 'loyalty_tier_upgrade' && 
      t.template.triggers?.loyalty_tier_upgrade === true
    );

    if (!loyaltyTemplate) {
      console.log('Kein aktives Loyalty-Tier-Upgrade-Template gefunden');
      return false;
    }

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      customer_name: loyaltyData.customer.name,
      customer_number: loyaltyData.customer.customer_number,
      old_tier_name: loyaltyData.old_tier_name,
      new_tier_name: loyaltyData.new_tier_name,
      new_tier_benefits: loyaltyData.new_tier_benefits.join(', '),
      current_points_balance: loyaltyData.current_points_balance.toString(),
      points_to_next_tier: loyaltyData.points_to_next_tier?.toString() || '',
      next_tier_name: loyaltyData.next_tier_name || '',
      loyalty_dashboard_url: 'https://brennholz-koenig.de/loyalty',
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    // E-Mail senden
    const result = await sendTemplateEmail(
      'loyalty_tier_upgrade',
      loyaltyData.customer.email,
      templateData
    );

    if (result.success) {
      console.log(`Loyalty-Tier-Upgrade E-Mail für ${loyaltyData.customer.email} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('loyalty_tier_upgrade', loyaltyData.customer.email, loyaltyData.customer.customer_number);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Loyalty-Tier-Upgrade E-Mail:', error);
    return false;
  }
}

/**
 * Trigger für ablaufende Loyalty-Punkte
 */
export async function triggerLoyaltyPointsExpiring(loyaltyData: LoyaltyPointsExpiringData): Promise<boolean> {
  try {
    const templates = await getActiveTemplatesWithTriggers();
    
    // Finde Template mit aktiviertem Loyalty-Punkte-ablaufend-Trigger
    const loyaltyTemplate = templates.find(t => 
      t.template.type === 'loyalty_points_expiring' && 
      t.template.triggers?.loyalty_points_expiring === true
    );

    if (!loyaltyTemplate) {
      console.log('Kein aktives Loyalty-Punkte-ablaufend-Template gefunden');
      return false;
    }

    // Template-Daten für E-Mail vorbereiten
    const templateData = {
      customer_name: loyaltyData.customer.name,
      customer_number: loyaltyData.customer.customer_number,
      expiring_points: loyaltyData.expiring_points.toString(),
      expiration_date: new Date(loyaltyData.expiration_date).toLocaleDateString('de-DE'),
      current_points_balance: loyaltyData.current_points_balance.toString(),
      tier_name: loyaltyData.tier_name,
      days_until_expiration: loyaltyData.days_until_expiration.toString(),
      shop_url: 'https://brennholz-koenig.de',
      loyalty_dashboard_url: 'https://brennholz-koenig.de/loyalty',
      company_name: 'Brennholzkönig',
      support_email: 'support@brennholz-koenig.de'
    };

    // E-Mail senden
    const result = await sendTemplateEmail(
      'loyalty_points_expiring',
      loyaltyData.customer.email,
      templateData
    );

    if (result.success) {
      console.log(`Loyalty-Punkte-ablaufend E-Mail für ${loyaltyData.customer.email} gesendet`);
      
      // Log-Eintrag erstellen
      await logEmailTrigger('loyalty_points_expiring', loyaltyData.customer.email, loyaltyData.customer.customer_number);
    }

    return result.success;
  } catch (error) {
    console.error('Fehler beim Senden der Loyalty-Punkte-ablaufend E-Mail:', error);
    return false;
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
  console.log('- triggerLoyaltyPointsEarned(loyaltyData)');
  console.log('- triggerLoyaltyPointsRedeemed(loyaltyData)');
  console.log('- triggerLoyaltyTierUpgrade(loyaltyData)');
  console.log('- triggerLoyaltyPointsExpiring(loyaltyData)');
}