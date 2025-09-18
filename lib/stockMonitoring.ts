import { createClient } from '@supabase/supabase-js';
import { triggerLowStockAlert } from './emailTriggerEngine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  stock_status: string;
}

/**
 * Prüft ein einzelnes Produkt auf niedrigen Lagerbestand und löst Warnung aus
 */
export async function checkProductLowStock(product: Product): Promise<boolean> {
  if (product.min_stock_level && product.stock_quantity <= product.min_stock_level) {
    console.log(`Niedriger Lagerbestand erkannt für Produkt: ${product.name} (${product.stock_quantity}/${product.min_stock_level})`);
    
    try {
      await triggerLowStockAlert({
        product_name: product.name,
        current_stock: product.stock_quantity,
        minimum_stock: product.min_stock_level,
        admin_email: 'admin@brennholzkoenig.de' // Standard Admin-E-Mail
      });
      
      // Aktualisiere den stock_status auf "Niedrig"
      await supabase
        .from('products')
        .update({ stock_status: 'Niedrig' })
        .eq('id', product.id);
        
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der Lagerbestand-Warnung:', error);
      return false;
    }
  }
  
  // Wenn Lagerbestand wieder über Mindestbestand ist, status auf "OK" setzen
  if (product.stock_status === 'Niedrig' && product.stock_quantity > product.min_stock_level) {
    await supabase
      .from('products')
      .update({ stock_status: 'OK' })
      .eq('id', product.id);
  }
  
  return false;
}

/**
 * Prüft ein Produkt nach ID auf niedrigen Lagerbestand
 */
export async function checkProductLowStockById(productId: string): Promise<boolean> {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock_level, stock_status')
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
 * Prüft alle Produkte auf niedrigen Lagerbestand
 */
export async function checkAllProductsLowStock(): Promise<{ checked: number; alerts: number }> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock_level, stock_status')
      .not('min_stock_level', 'is', null);

    if (error) {
      console.error('Fehler beim Laden der Produkte:', error);
      return { checked: 0, alerts: 0 };
    }

    let alertCount = 0;
    
    for (const product of products || []) {
      const alertSent = await checkProductLowStock(product);
      if (alertSent) {
        alertCount++;
      }
    }

    console.log(`Lagerbestand-Prüfung abgeschlossen: ${products?.length || 0} Produkte geprüft, ${alertCount} Warnungen gesendet`);
    
    return { 
      checked: products?.length || 0, 
      alerts: alertCount 
    };
  } catch (error) {
    console.error('Fehler bei der vollständigen Lagerbestand-Prüfung:', error);
    return { checked: 0, alerts: 0 };
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