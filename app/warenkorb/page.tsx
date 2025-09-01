
import { createServerSupabase } from '@/lib/supabase-server';
import OptimizedWarenkorbContent from '../../components/OptimizedWarenkorbContent';

interface DeliveryOption {
  type: string;
  name: string;
  price: number;
}

export default async function WarenkorbPage() {
  const startTime = Date.now();
  
  // Server-Side Preloading für Warenkorb-relevante Daten
  const supabase = createServerSupabase();
  let products = [];
  let deliveryOptions: DeliveryOption[] = [];
  let error = null;
  
  try {
    // Lade Produktdaten für Warenkorb-Validierung
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    
    if (productError) throw productError;
    products = productData || [];
    
    // Lade Lieferoptionen aus App-Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .in('setting_key', ['standard_delivery_price', 'express_delivery_price']);
    
    if (settingsError) throw settingsError;
    
    const standardPrice = settingsData?.find(s => s.setting_key === 'standard_delivery_price')?.setting_value || '43.5';
    const expressPrice = settingsData?.find(s => s.setting_key === 'express_delivery_price')?.setting_value || '139';
    
    deliveryOptions = [
      { type: 'standard', name: 'Standard Lieferung (1-3 Wochen)', price: parseFloat(standardPrice) },
      { type: 'express', name: 'Express Lieferung (24-48h)', price: parseFloat(expressPrice) }
    ];
    
  } catch (err: any) {
    error = err.message;
    console.error('Warenkorb: Fehler beim Laden der Daten:', err);
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`🛒 Cart data preloaded in ${loadTime}ms: { productCount: ${products.length}, deliveryOptions: ${deliveryOptions.length}, hasError: ${!!error} }`);
  
  return (
    <OptimizedWarenkorbContent 
      initialProducts={products}
      initialDeliveryOptions={deliveryOptions}
      loadTime={loadTime}
      error={error}
    />
  );
}
