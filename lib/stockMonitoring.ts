import { createLegacyServerSupabase } from './supabase-server';
import { triggerLowStockAlert, triggerOutOfStockAlert } from './emailTriggerEngine';

// Verwende Server-Side Supabase-Instanz für bessere Build-Kompatibilität
const getSupabase = () => createLegacyServerSupabase();

export interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  in_stock: boolean;
}

/**
 * Prüft ein Produkt auf niedrigen Lagerbestand und sendet ggf. eine Warnung
 */
export async function checkProductLowStock(product: Product): Promise<boolean> {
  try {
    // Prüfe ob Lagerbestand unter Mindestbestand liegt
    if (product.stock_quantity <= product.min_stock_level && product.stock_quantity > 0) {
      console.log(`Niedriger Lagerbestand erkannt für ${product.name}: ${product.stock_quantity} (Min: ${product.min_stock_level})`);
      
      // Hole Admin-E-Mail aus den Einstellungen
      const supabase = getSupabase();
      const { data: settings } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_email')
        .single();

      if (!settings?.setting_value) {
        console.error('Admin-E-Mail nicht in den Einstellungen gefunden');
        return false;
      }

      // Sende Lagerbestand-Warnung
      const alertSent = await triggerLowStockAlert({
        product_name: product.name,
        current_stock: product.stock_quantity,
        minimum_stock: product.min_stock_level,
        admin_email: settings.setting_value
      });

      if (alertSent) {
        console.log(`Lagerbestand-Warnung für ${product.name} erfolgreich gesendet`);
        return true;
      } else {
        console.error(`Fehler beim Senden der Lagerbestand-Warnung für ${product.name}`);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error(`Fehler bei der Lagerbestand-Prüfung für ${product.name}:`, error);
    return false;
  }
}

/**
 * Prüft ein Produkt auf ausverkauften Zustand und sendet ggf. eine Warnung
 */
export async function checkProductOutOfStock(product: Product): Promise<boolean> {
  try {
    // Prüfe ob Produkt ausverkauft ist (Lagerbestand = 0)
    if (product.stock_quantity === 0) {
      console.log(`Ausverkauftes Produkt erkannt: ${product.name}`);
      
      const supabase = getSupabase();
      
      // Hole Admin-E-Mail aus den Einstellungen
      const { data: settings } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_email')
        .single();

      if (!settings?.setting_value) {
        console.error('Admin-E-Mail nicht in den Einstellungen gefunden');
        return false;
      }

      // Hole Verkaufsdaten der letzten 30 Tage für bessere Analyse
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: salesData } = await supabase
        .from('order_items')
        .select(`
          quantity,
          orders!inner(created_at)
        `)
        .eq('product_id', product.id)
        .gte('orders.created_at', thirtyDaysAgo.toISOString());

      // Berechne Verkaufsstatistiken
      const salesLast30Days = salesData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const avgDailySales = salesLast30Days / 30;
      const recommendedReorder = Math.max(product.min_stock_level, Math.ceil(avgDailySales * 14)); // 2 Wochen Vorrat

      // Hole letztes Verkaufsdatum
      const { data: lastSale } = await supabase
        .from('order_items')
        .select(`
          orders(created_at)
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSaleDate = lastSale?.[0]?.orders?.created_at 
        ? new Date((lastSale[0].orders as any).created_at).toLocaleDateString('de-DE')
        : 'Unbekannt';

      // Sende Ausverkauft-Warnung
      const alertSent = await triggerOutOfStockAlert({
        product_name: product.name,
        minimum_stock: product.min_stock_level,
        out_of_stock_date: new Date().toLocaleDateString('de-DE'),
        last_sale_date: lastSaleDate,
        sales_last_30_days: salesLast30Days,
        avg_daily_sales: Math.round(avgDailySales * 100) / 100,
        recommended_reorder: recommendedReorder,
        admin_email: settings.setting_value,
        admin_inventory_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/inventory`,
        reorder_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/products/${product.id}/edit`
      });

      if (alertSent) {
        console.log(`Ausverkauft-Warnung für ${product.name} erfolgreich gesendet`);
        return true;
      } else {
        console.error(`Fehler beim Senden der Ausverkauft-Warnung für ${product.name}`);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error(`Fehler bei der Ausverkauft-Prüfung für ${product.name}:`, error);
    return false;
  }
}

/**
 * Prüft ein Produkt nach ID auf niedrigen Lagerbestand
 */
export async function checkProductLowStockById(productId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock_level, in_stock')
      .eq('id', productId)
      .single();

    if (error || !product) {
      console.error('Fehler beim Laden des Produkts:', error);
      return false;
    }

    return await checkProductLowStock(product);
  } catch (error) {
    console.error('Fehler bei der Lagerbestand-Prüfung:', error);
    return false;
  }
}

/**
 * Prüft alle Produkte auf niedrigen Lagerbestand und ausverkaufte Produkte
 */
export async function checkAllProductsLowStock(): Promise<{ checked: number; alerts: number; outOfStockAlerts: number }> {
  try {
    const supabase = getSupabase();
    
    // Hole alle Produkte mit Lagerbestand-Informationen
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock_level, in_stock')
      .gt('min_stock_level', 0); // Nur Produkte mit definiertem Mindestbestand

    if (error) {
      console.error('Fehler beim Laden der Produkte:', error);
      return { checked: 0, alerts: 0, outOfStockAlerts: 0 };
    }

    let alertCount = 0;
    let outOfStockAlertCount = 0;
    
    for (const product of products || []) {
      // Prüfe auf niedrigen Lagerbestand
      const lowStockAlertSent = await checkProductLowStock(product);
      if (lowStockAlertSent) {
        alertCount++;
      }
      
      // Prüfe auf ausverkaufte Produkte
      const outOfStockAlertSent = await checkProductOutOfStock(product);
      if (outOfStockAlertSent) {
        outOfStockAlertCount++;
      }
    }

    console.log(`Lagerbestand-Prüfung abgeschlossen: ${products?.length || 0} Produkte geprüft, ${alertCount} Lagerbestand-Warnungen, ${outOfStockAlertCount} Ausverkauft-Warnungen gesendet`);
    
    return { 
      checked: products?.length || 0, 
      alerts: alertCount,
      outOfStockAlerts: outOfStockAlertCount
    };
  } catch (error) {
    console.error('Fehler bei der vollständigen Lagerbestand-Prüfung:', error);
    return { checked: 0, alerts: 0, outOfStockAlerts: 0 };
  }
}

/**
 * Prüft mehrere Produkte nach IDs auf niedrigen Lagerbestand
 */
export async function checkMultipleProductsLowStock(productIds: string[]): Promise<{ checked: number; alerts: number }> {
  let alertCount = 0;
  
  for (const productId of productIds) {
    const alertSent = await checkProductLowStockById(productId);
    if (alertSent) {
      alertCount++;
    }
  }
  
  return { 
    checked: productIds.length, 
    alerts: alertCount 
  };
}