
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { SEOMetadata } from '@/components/SEOMetadata';
import WishlistButton from '@/components/WishlistButton';
import CartNotification from '@/components/CartNotification';
import ProductImageGalleryDisplay from '@/components/ProductImageGalleryDisplay';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  unit: string;
  specifications?: any;
  features?: string[];
  delivery_info?: string;
  meta_title?: string;
  meta_description?: string;
  detailed_description?: string;
  technical_specs?: { [key: string]: string };
  additional_images?: string[];
  original_price?: number;
}

interface PricingTier {
  id: string;
  product_id: string;
  min_quantity: number;
  max_quantity?: number;
  price_per_unit?: number;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  description: string;
}

interface ProductDetailProps {
  productId: string;
}

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: string;
  basePrice: number;
  image_url: string;
  unit: string;
  quantity: number;
  stock_quantity: number;
}

interface NotificationData {
  productName: string;
  quantity: number;
}

const urlToProductId: { [key: string]: string } = {
  'industrieholz-buche-klasse-1': '1',
  'industrieholz-buche-klasse-2': '2',
  'scheitholz-buche-33cm': '3',
  'scheitholz-buche-25cm': '4',
  'scheitholz-industrieholz-mix-33cm': '5',
  'scheitholz-fichte-33cm': '6'
};

function calculatePriceWithTiers(basePrice: number, quantity: number, tiers: PricingTier[], minOrderQuantity: number = 3) {
  if (quantity < minOrderQuantity) {
    return {
      price: basePrice,
      adjustmentText: `Mindestbestellung ${minOrderQuantity} SRM`,
      canOrder: false
    };
  }
  
  // Preise und Zuschläge/Rabatte basierend auf der Menge
  let finalPrice = basePrice;
  let adjustmentText = '';
  
  if (quantity >= 3 && quantity <= 5) {
    // 30% Zuschlag für 3-5 SRM
    const surcharge = basePrice * 0.3;
    finalPrice = basePrice + surcharge;
    adjustmentText = '30% Zuschlag je SRM';
  } else if (quantity >= 6 && quantity < 25) {
    // Normalpreis für 6-24 SRM
    adjustmentText = 'Normalpreis';
  } else if (quantity >= 25) {
    // 2,50€ Rabatt für 25+ SRM
    finalPrice = basePrice - 2.5;
    adjustmentText = '€2,50 Rabatt je SRM';
  }

  return {
    price: Math.max(0, finalPrice),
    adjustmentText,
    canOrder: true
  };
}

function getPriceInfoForQuantity(quantity: number, tiers: PricingTier[], minOrderQuantity: number) {
  if (quantity < minOrderQuantity) {
    return {
      info: `Mindestbestellung ${minOrderQuantity} SRM`,
      color: 'text-red-600',
      canOrder: false
    };
  }
  
  let info = '';
  let color = 'text-gray-600';
  
  if (quantity >= 3 && quantity <= 5) {
    // 30% Zuschlag für 3-5 SRM
    info = '30% Zuschlag je SRM';
    color = 'text-red-600';
  } else if (quantity >= 6 && quantity < 25) {
    // Normalpreis für 6-24 SRM
    info = 'Normalpreis';
    color = 'text-gray-600';
  } else if (quantity >= 25) {
    // 2,50€ Rabatt für 25+ SRM
    info = '€2,50 Rabatt je SRM';
    color = 'text-green-600';
  }

  return {
    info,
    color,
    canOrder: true
  };
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const { products, subscribeToChanges, unsubscribeFromChanges } = useRealtimeSync();
  const [productData, setProductData] = useState<Product | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationData, setNotificationData] = useState<NotificationData>({
    productName: '',
    quantity: 0
  });

  const minOrderQuantity = 3;
  const actualProductId = urlToProductId[productId] || productId;

  // Fallback-Produkte für den Fall, dass keine aus der Datenbank geladen werden können
  const fallbackProducts: { [key: string]: Product } = {
    '1': {
      id: '1',
      name: 'Industrieholz Buche Klasse 1',
      description: 'Hochwertiges Industrieholz aus Buche, Klasse 1',
      price: 89.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-1',
      category: 'Industrieholz',
      stock_quantity: 100,
      unit: 'rm',
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Premium Qualität'],
      delivery_info: 'Lieferung innerhalb von 3-5 Werktagen',
      meta_title: 'Industrieholz Buche Klasse 1 - Premium Brennholz',
      meta_description: 'Hochwertiges Industrieholz aus Buche, Klasse 1 - kammergetrocknet und sofort verfügbar',
      detailed_description: 'Unser Industrieholz Buche Klasse 1 ist die perfekte Wahl für Ihren Kamin oder Ofen. Das Holz ist kammergetrocknet und sofort verfügbar. Die Buche ist bekannt für ihre hohe Brenndauer und gleichmäßige Wärmeabgabe.',
      technical_specs: { 'Holzart': 'Buche', 'Länge': '33cm', 'Feuchtigkeitsgehalt': '<20%' },
      additional_images: []
    },
    '2': {
      id: '2',
      name: 'Industrieholz Buche Klasse 2',
      description: 'Industrieholz aus Buche, Klasse 2',
      price: 79.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-2',
      category: 'Industrieholz',
      stock_quantity: 150,
      unit: 'rm',
      features: ['Kammergetrocknet', 'Sofort verfügbar'],
      delivery_info: 'Lieferung innerhalb von 3-5 Werktagen',
      meta_title: 'Industrieholz Buche Klasse 2 - Qualitäts-Brennholz',
      meta_description: 'Industrieholz aus Buche, Klasse 2 - kammergetrocknet und sofort verfügbar',
      detailed_description: 'Unser Industrieholz Buche Klasse 2 bietet ein ausgezeichnetes Preis-Leistungs-Verhältnis für Ihren Kamin oder Ofen. Das Holz ist kammergetrocknet und sofort verfügbar.',
      technical_specs: { 'Holzart': 'Buche', 'Länge': '33cm', 'Feuchtigkeitsgehalt': '<20%' },
      additional_images: []
    },
    '3': {
      id: '3',
      name: 'Scheitholz Buche 33cm',
      description: 'Hochwertiges Scheitholz aus Buche, 33cm Länge',
      price: 99.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-3',
      category: 'Scheitholz',
      stock_quantity: 80,
      unit: 'rm',
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Premium Qualität'],
      delivery_info: 'Lieferung innerhalb von 3-5 Werktagen',
      meta_title: 'Scheitholz Buche 33cm - Premium Brennholz',
      meta_description: 'Hochwertiges Scheitholz aus Buche, 33cm Länge - kammergetrocknet und sofort verfügbar',
      detailed_description: 'Unser Scheitholz Buche 33cm ist die perfekte Wahl für Ihren Kamin oder Ofen. Das Holz ist kammergetrocknet und sofort verfügbar. Die Buche ist bekannt für ihre hohe Brenndauer und gleichmäßige Wärmeabgabe.',
      technical_specs: { 'Holzart': 'Buche', 'Länge': '33cm', 'Feuchtigkeitsgehalt': '<20%' },
      additional_images: []
    },
    '4': {
      id: '4',
      name: 'Scheitholz Buche 25cm',
      description: 'Hochwertiges Scheitholz aus Buche, 25cm Länge',
      price: 105.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-4',
      category: 'Scheitholz',
      stock_quantity: 60,
      unit: 'rm',
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Premium Qualität'],
      delivery_info: 'Lieferung innerhalb von 3-5 Werktagen',
      meta_title: 'Scheitholz Buche 25cm - Premium Brennholz',
      meta_description: 'Hochwertiges Scheitholz aus Buche, 25cm Länge - kammergetrocknet und sofort verfügbar',
      detailed_description: 'Unser Scheitholz Buche 25cm ist die perfekte Wahl für kleinere Öfen. Das Holz ist kammergetrocknet und sofort verfügbar. Die Buche ist bekannt für ihre hohe Brenndauer und gleichmäßige Wärmeabgabe.',
      technical_specs: { 'Holzart': 'Buche', 'Länge': '25cm', 'Feuchtigkeitsgehalt': '<20%' },
      additional_images: []
    },
    '5': {
      id: '5',
      name: 'Scheitholz-Industrieholz-Mix 33cm',
      description: 'Gemischtes Holz aus Scheitholz und Industrieholz, 33cm Länge',
      price: 85.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-5',
      category: 'Mix',
      stock_quantity: 120,
      unit: 'rm',
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Gutes Preis-Leistungs-Verhältnis'],
      delivery_info: 'Lieferung innerhalb von 3-5 Werktagen',
      meta_title: 'Scheitholz-Industrieholz-Mix 33cm - Brennholz',
      meta_description: 'Gemischtes Holz aus Scheitholz und Industrieholz, 33cm Länge - kammergetrocknet und sofort verfügbar',
      detailed_description: 'Unser Scheitholz-Industrieholz-Mix 33cm bietet ein ausgezeichnetes Preis-Leistungs-Verhältnis für Ihren Kamin oder Ofen. Das Holz ist kammergetrocknet und sofort verfügbar.',
      technical_specs: { 'Holzart': 'Buche/Mischholz', 'Länge': '33cm', 'Feuchtigkeitsgehalt': '<20%' },
      additional_images: []
    },
    '6': {
      id: '6',
      name: 'Scheitholz Fichte 33cm',
      description: 'Scheitholz aus Fichte, 33cm Länge',
      price: 75.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-6',
      category: 'Scheitholz',
      stock_quantity: 90,
      unit: 'rm',
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Ideal zum Anzünden'],
      delivery_info: 'Lieferung innerhalb von 3-5 Werktagen',
      meta_title: 'Scheitholz Fichte 33cm - Brennholz',
      meta_description: 'Scheitholz aus Fichte, 33cm Länge - kammergetrocknet und sofort verfügbar',
      detailed_description: 'Unser Scheitholz Fichte 33cm ist ideal zum Anzünden oder für kurze, intensive Feuer. Das Holz ist kammergetrocknet und sofort verfügbar.',
      technical_specs: { 'Holzart': 'Fichte', 'Länge': '33cm', 'Feuchtigkeitsgehalt': '<20%' },
      additional_images: []
    }
  };

  // Fallback für Preisstufen
  const fallbackPricingTiers: PricingTier[] = [
    { id: '1', product_id: '1', min_quantity: 1, max_quantity: 5, adjustment_type: 'fixed', adjustment_value: 0, description: 'Standardpreis' },
    { id: '2', product_id: '1', min_quantity: 6, max_quantity: 10, adjustment_type: 'fixed', adjustment_value: -4, description: 'Mengenrabatt klein' },
    { id: '3', product_id: '1', min_quantity: 11, adjustment_type: 'fixed', adjustment_value: -9, description: 'Mengenrabatt groß' },
    { id: '4', product_id: '2', min_quantity: 1, max_quantity: 5, adjustment_type: 'fixed', adjustment_value: 0, description: 'Standardpreis' },
    { id: '5', product_id: '2', min_quantity: 6, max_quantity: 10, adjustment_type: 'fixed', adjustment_value: -4, description: 'Mengenrabatt klein' },
    { id: '6', product_id: '2', min_quantity: 11, adjustment_type: 'fixed', adjustment_value: -9, description: 'Mengenrabatt groß' },
    { id: '7', product_id: '3', min_quantity: 1, max_quantity: 5, adjustment_type: 'fixed', adjustment_value: 0, description: 'Standardpreis' },
    { id: '8', product_id: '3', min_quantity: 6, max_quantity: 10, adjustment_type: 'fixed', adjustment_value: -4, description: 'Mengenrabatt klein' },
    { id: '9', product_id: '3', min_quantity: 11, adjustment_type: 'fixed', adjustment_value: -9, description: 'Mengenrabatt groß' },
    { id: '10', product_id: '4', min_quantity: 1, max_quantity: 5, adjustment_type: 'fixed', adjustment_value: 0, description: 'Standardpreis' },
    { id: '11', product_id: '4', min_quantity: 6, max_quantity: 10, adjustment_type: 'fixed', adjustment_value: -4, description: 'Mengenrabatt klein' },
    { id: '12', product_id: '4', min_quantity: 11, adjustment_type: 'fixed', adjustment_value: -9, description: 'Mengenrabatt groß' },
    { id: '13', product_id: '5', min_quantity: 1, max_quantity: 5, adjustment_type: 'fixed', adjustment_value: 0, description: 'Standardpreis' },
    { id: '14', product_id: '5', min_quantity: 6, max_quantity: 10, adjustment_type: 'fixed', adjustment_value: -4, description: 'Mengenrabatt klein' },
    { id: '15', product_id: '5', min_quantity: 11, adjustment_type: 'fixed', adjustment_value: -9, description: 'Mengenrabatt groß' },
    { id: '16', product_id: '6', min_quantity: 1, max_quantity: 5, adjustment_type: 'fixed', adjustment_value: 0, description: 'Standardpreis' },
    { id: '17', product_id: '6', min_quantity: 6, max_quantity: 10, adjustment_type: 'fixed', adjustment_value: -4, description: 'Mengenrabatt klein' },
    { id: '18', product_id: '6', min_quantity: 11, adjustment_type: 'fixed', adjustment_value: -9, description: 'Mengenrabatt groß' }
  ];

  const fetchProduct = async () => {
    try {
      const [productRes, pricingRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('id', actualProductId)
          .single(),
        supabase
          .from('pricing_tiers')
          .select('*')
          .eq('product_id', actualProductId)
          .order('min_quantity')
      ]);

      if (productRes.error) throw productRes.error;
      if (pricingRes.error) throw pricingRes.error;

      setProductData(productRes.data as unknown as Product);
        setPricingTiers((pricingRes.data || []) as unknown as PricingTier[]);
      setQuantity(minOrderQuantity);
    } catch (error: unknown) {
      console.error('Fehler beim Laden des Produkts:', error);
      
      // Fallback-Produkt verwenden, aber mit aktualisierter Bild-URL aus Datenbank falls verfügbar
      if (fallbackProducts[actualProductId]) {
        console.log(`Verwende Fallback-Produkt für ID ${actualProductId}`);
        const fallbackProduct = { ...fallbackProducts[actualProductId] };
        
        // Versuche, die aktuelle Bild-URL aus der Datenbank zu holen
        try {
          const { data: imageData } = await supabase
            .from('products')
            .select('image_url, additional_images')
            .eq('id', actualProductId)
            .single();
          
          if (imageData && (imageData as any).image_url) {
             fallbackProduct.image_url = (imageData as any).image_url;
             fallbackProduct.additional_images = (imageData as any).additional_images || [];
            console.log('Bild-URL aus Datenbank aktualisiert:', (imageData as any).image_url);
          }
        } catch (imageError) {
          console.log('Konnte Bild-URL nicht aus Datenbank laden, verwende Fallback-Bild');
        }
        
        setProductData(fallbackProduct);
        
        // Passende Preisstufen für dieses Produkt filtern
        const relevantTiers = fallbackPricingTiers.filter(tier => tier.product_id === actualProductId);
        setPricingTiers(relevantTiers);
        setQuantity(minOrderQuantity);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Synchronisation mit zentralem Hook
  useEffect(() => {
    subscribeToChanges();
    return () => {
      unsubscribeFromChanges();
    };
  }, [subscribeToChanges, unsubscribeFromChanges]);

  // Reagiere auf Änderungen in den Real-time Produktdaten
  useEffect(() => {
    const realtimeProduct = products.find(p => p.id.toString() === actualProductId);
    if (realtimeProduct && productData) {
      // Konvertiere Real-time Produkt zu lokalem Format
      const updatedProduct: Product = {
        id: realtimeProduct.id.toString(),
        name: realtimeProduct.name,
        description: realtimeProduct.description,
        price: realtimeProduct.price,
        image_url: realtimeProduct.image_url,
        category: realtimeProduct.category,
        stock_quantity: realtimeProduct.stock_quantity,
        unit: realtimeProduct.unit,
        features: realtimeProduct.features,
        specifications: realtimeProduct.specifications,
        delivery_info: productData.delivery_info,
        meta_title: productData.meta_title,
        meta_description: productData.meta_description,
        detailed_description: productData.detailed_description,
        technical_specs: productData.technical_specs,
        additional_images: productData.additional_images,
        original_price: realtimeProduct.original_price
      };
      
      console.log(`Real-time Update für Produkt ${actualProductId}:`, updatedProduct.name);
      setProductData(updatedProduct);
    }
  }, [products, actualProductId, productData]);

  useEffect(() => {
    // Initial data fetch
    fetchProduct();
    
    // Echtzeit-Updates für Produktänderungen
    const channel = supabase
      .channel('product-detail-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'products', filter: `id=eq.${actualProductId}` }, 
          (payload: { new: Record<string, any>; old: Record<string, any> }) => {
            console.log(`Produktänderung für ID ${actualProductId} erkannt, aktualisiere Daten...`);
            
            // Überprüfen, ob das Bild aktualisiert wurde
            if (payload.new && payload.old && 
                'image_url' in payload.new && 'image_url' in payload.old && 
                payload.new.image_url !== payload.old.image_url) {
              console.log(`Produktbild wurde aktualisiert: ${payload.old.image_url} -> ${payload.new.image_url}`);
            }
            
            fetchProduct();
          })
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'pricing_tiers', filter: `product_id=eq.${actualProductId}` },
          () => {
            console.log(`Preisänderung für Produkt ID ${actualProductId} erkannt, aktualisiere Daten...`);
            fetchProduct();
          })
      .subscribe();
    
    // Cleanup bei Komponentenabbau
    return () => {
      supabase.removeChannel(channel);
    };
  }, [actualProductId]);

  const getCurrentPricing = () => {
    if (!productData) return { price: 0, adjustmentText: '', canOrder: false };
    const basePrice = parseFloat(productData.price.toString());
    return calculatePriceWithTiers(basePrice, quantity, pricingTiers, minOrderQuantity);
  };

  const getPriceInfo = () => {
    return getPriceInfoForQuantity(quantity, pricingTiers, minOrderQuantity);
  };

  const addToCart = async () => {
    if (!productData) return;

    const pricing = getCurrentPricing();
    if (!pricing.canOrder) {
      alert(`Mindestbestellung ${minOrderQuantity} ${productData.unit}`);
      return;
    }

    setIsAddingToCart(true);

    try {
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');

      const existingItemIndex = currentCart.findIndex((item: CartItem) => item.id === productData.id);

      if (existingItemIndex >= 0) {
        const newQuantity = currentCart[existingItemIndex].quantity + quantity;
        const newPricing = calculatePriceWithTiers(parseFloat(productData.price.toString()), newQuantity, pricingTiers, minOrderQuantity);

        currentCart[existingItemIndex].quantity = newQuantity;
        currentCart[existingItemIndex].price = newPricing.price.toString();
        currentCart[existingItemIndex].basePrice = productData.price;
      } else {
        currentCart.push({
          id: productData.id,
          name: productData.name,
          category: productData.category,
          price: pricing.price.toString(),
          basePrice: productData.price,
          image_url: productData.image_url,
          unit: productData.unit,
          quantity: quantity,
          stock_quantity: productData.stock_quantity
        });
      }

      localStorage.setItem('cart', JSON.stringify(currentCart));

      setNotificationData({ productName: productData.name, quantity });
      setShowNotification(true);

      if (typeof window !== 'undefined' && (window as any).trackEvent) {
        (window as any).trackEvent('add_to_cart', {
          product_id: productData.id,
          product_name: productData.name,
          product_category: productData.category,
          quantity,
          price: pricing.price,
          total_value: pricing.price * quantity
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Fehler beim Hinzufügen zum Warenkorb');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const buyNow = () => {
    addToCart();
    setTimeout(() => {
      router.push('/warenkorb');
    }, 500);
  };

  if (isLoading) {
    return (
      <>
        <SEOMetadata
          title="Produkt wird geladen... - Brennholzkönig"
          description="Premium Brennholz Produktdetails werden geladen."
        />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
              <i className="ri-product-hunt-line text-2xl text-white"></i>
            </div>
            <p className="text-lg font-medium text-gray-700">Lade Produktdetails...</p>
          </div>
        </div>
      </>
    );
  }

  if (!productData) {
    return (
      <>
        <SEOMetadata
          title="Produkt nicht gefunden - Brennholzkönig"
          description="Das gesuchte Brennholz-Produkt konnte nicht gefunden werden."
        />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
              <i className="ri-error-warning-line text-3xl text-gray-400"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-600 mb-4">Produkt nicht gefunden</h1>
            <p className="text-gray-500 mb-6">Das gewünschte Produkt ist nicht verfügbar.</p>
            <button
              onClick={() => router.push('/shop')}
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Zurück zum Shop
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentPricing = getCurrentPricing();
  const priceInfo = getPriceInfo();

  return (
    <>
      <SEOMetadata
        title={productData?.meta_title || `${productData?.name} - Brennholz Premium`}
        description={productData?.meta_description || productData?.description}
        image={productData?.image_url}
      />

      <CartNotification
        isVisible={showNotification}
        productName={notificationData.productName}
        quantity={notificationData.quantity}
        onClose={() => setShowNotification(false)}
      />

      <div className="container mx-auto px-4 py-16">
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => router.push('/')}
              className="hover:text-[#C04020] cursor-pointer"
            >
              Startseite
            </button>
            <i className="ri-arrow-right-s-line"></i>
            <button
              onClick={() => router.push('/shop')}
              className="hover:text-[#C04020] cursor-pointer"
            >
              Shop
            </button>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-[#C04020] font-medium">{productData.name}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative">
            {productData.original_price && (
              <div className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold z-10">
                ANGEBOT
              </div>
            )}
            <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold z-10">
              {productData.stock_quantity} SRM verfügbar
            </div>

            <ProductImageGalleryDisplay
              productName={productData.name}
              productId={parseInt(urlToProductId[productId] || '0')}
            />
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-sm font-bold text-[#C04020] uppercase tracking-wider">
                {productData.category}
              </span>
              <h1 className="text-3xl font-black text-[#1A1A1A] mt-2 mb-4">
                {productData.name}
              </h1>
              <p className="text-lg text-gray-600">
                {productData.description}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Preiskalkulation</h3>
              <div className="space-y-3">
                <div className="text-sm text-blue-700">
                  <p>
                    <strong>Mindestbestellung:</strong> {minOrderQuantity} {productData.unit}
                  </p>
                </div>
                <div className="text-sm text-red-600 flex justify-between">
                  <span>3-5 {productData.unit}</span>
                  <span className="font-medium">30% Zuschlag je {productData.unit}</span>
                </div>
                <div className="text-sm text-blue-700 flex justify-between">
                  <span>6-24 {productData.unit}</span>
                  <span className="font-medium">Normalpreis</span>
                </div>
                <div className="text-sm text-green-600 flex justify-between">
                  <span>ab 25 {productData.unit}</span>
                  <span className="font-medium">€2,50 Rabatt je {productData.unit}</span>
                </div>
              </div>
            </div>

            {productData.detailed_description && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Produktbeschreibung</h3>
                <p className="text-gray-700 leading-relaxed">
                  {productData.detailed_description}
                </p>
              </div>
            )}

            {productData.technical_specs && Object.keys(productData.technical_specs).length > 0 && (
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Technische Daten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(productData.technical_specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 font-medium">{key}:</span>
                      <span className="font-bold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productData.features && productData.features.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Eigenschaften</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {productData.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border-2 border-[#C04020] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-black text-[#C04020]">
                    €{currentPricing.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {productData.unit === 'SRM' ? 'pro Schüttraummeter' : 
                     productData.unit === 'RM' ? 'pro Raummeter' :
                     productData.unit === 'FM' ? 'pro Festmeter' :
                     productData.unit === 'kg' ? 'pro Kilogramm' :
                     productData.unit === 'Stück' ? 'pro Stück' :
                     productData.unit === 'Palette' ? 'pro Palette' :
                     productData.unit === 'm³' ? 'pro Kubikmeter' :
                     productData.unit || 'pro Schüttraummeter'}
                  </div>
                  <div className={`text-sm font-medium ${priceInfo.color}`}>
                    {priceInfo.info}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <label className="text-sm font-bold text-[#1A1A1A]">Menge ({productData.unit}):</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(minOrderQuantity, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-subtract-line"></i>
                  </button>
                  <input
                    type="number"
                    min={minOrderQuantity}
                    max={productData.stock_quantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          minOrderQuantity,
                          Math.min(productData.stock_quantity, parseInt(e.target.value) || minOrderQuantity)
                        )
                      )
                    }
                    className="w-20 text-center border border-gray-300 rounded-lg py-2 focus:outline-none focus:border-[#C04020]"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(productData.stock_quantity, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line"></i>
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  max. {productData.stock_quantity} SRM
                </span>
              </div>

              <div className="flex justify-between items-center text-lg font-bold text-[#1A1A1A] mb-6 p-4 bg-gray-50 rounded-lg">
                <span>Gesamtpreis:</span>
                <span className="text-[#C04020]">€{(currentPricing.price * quantity).toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={buyNow}
                  disabled={isAddingToCart || !priceInfo.canOrder || productData.stock_quantity === 0}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isAddingToCart || !priceInfo.canOrder || productData.stock_quantity === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#C04020] hover:bg-[#A03318] text-white'
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <i className="ri-loader-4-line mr-2 animate-spin"></i>
                      Wird hinzugefügt...
                    </>
                  ) : !priceInfo.canOrder ? (
                    `Mindestbestellung ${minOrderQuantity} SRM`
                  ) : productData.stock_quantity === 0 ? (
                    'Ausverkauft'
                  ) : (
                    <>
                      <i className="ri-shopping-cart-line mr-2"></i>
                      Jetzt kaufen
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <WishlistButton productId={productData.id} />
                  <div className="flex-1">
                    <button
                      onClick={addToCart}
                      disabled={isAddingToCart || !priceInfo.canOrder || productData.stock_quantity === 0}
                      className={`w-full py-3 px-6 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        isAddingToCart || !priceInfo.canOrder || productData.stock_quantity === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-[#1A1A1A]'
                      }`}
                    >
                      {isAddingToCart ? (
                        'Wird hinzugefügt...'
                      ) : (
                        <>
                          <i className="ri-shopping-bag-line mr-2"></i>
                          In den Warenkorb
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
