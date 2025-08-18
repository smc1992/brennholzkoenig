
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { calculatePriceWithTiers } from '../../lib/pricing';
import WishlistButton from '../../components/WishlistButton';

// SEO-freundliche URL-Zuordnung
const productUrlMapping: { [key: number]: string } = {
  1: 'industrieholz-buche-klasse-1',
  2: 'industrieholz-buche-klasse-2',
  3: 'scheitholz-buche-33cm',
  4: 'scheitholz-buche-25cm',
  5: 'scheitholz-industrieholz-mix-33cm',
  6: 'scheitholz-fichte-33cm'
};

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  features: string[];
  specifications?: { [key: string]: string };
  unit: string;
  original_price?: number;
  is_active: boolean;
  in_stock: boolean;
  created_at: string;
}

interface PricingTier {
  id: number;
  name: string;
  min_quantity: number;
  max_quantity?: number;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  is_active: boolean;
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);

  // Fallback-Produkte, falls keine aus der Datenbank geladen werden können
  const fallbackProducts: Product[] = [
    {
      id: 1,
      name: 'Industrieholz Buche Klasse 1',
      description: 'Hochwertiges Industrieholz aus Buche, Klasse 1',
      price: 89.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-1',
      category: 'Industrieholz',
      stock_quantity: 100,
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Premium Qualität'],
      unit: 'rm',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Industrieholz Buche Klasse 2',
      description: 'Industrieholz aus Buche, Klasse 2',
      price: 79.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-2',
      category: 'Industrieholz',
      stock_quantity: 150,
      features: ['Kammergetrocknet', 'Sofort verfügbar'],
      unit: 'rm',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Scheitholz Buche 33cm',
      description: 'Hochwertiges Scheitholz aus Buche, 33cm Länge',
      price: 99.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-3',
      category: 'Scheitholz',
      stock_quantity: 80,
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Premium Qualität'],
      unit: 'rm',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Scheitholz Buche 25cm',
      description: 'Hochwertiges Scheitholz aus Buche, 25cm Länge',
      price: 105.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-4',
      category: 'Scheitholz',
      stock_quantity: 60,
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Premium Qualität'],
      unit: 'rm',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Scheitholz-Industrieholz-Mix 33cm',
      description: 'Gemischtes Holz aus Scheitholz und Industrieholz, 33cm Länge',
      price: 85.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-5',
      category: 'Mix',
      stock_quantity: 120,
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Gutes Preis-Leistungs-Verhältnis'],
      unit: 'rm',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Scheitholz Fichte 33cm',
      description: 'Scheitholz aus Fichte, 33cm Länge',
      price: 75.00,
      image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=800&height=600&seq=product-6',
      category: 'Scheitholz',
      stock_quantity: 90,
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Ideal zum Anzünden'],
      unit: 'rm',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    }
  ];

  // Fallback für Preisstufen gemäß Vorgaben:
  // 3-5 SRM => +30% Zuschlag pro SRM
  // 6-24 SRM => Normalpreis
  // ab 25 SRM => -2,50 € pro SRM Rabatt
  const fallbackPricingTiers: PricingTier[] = [
    { id: 1, name: 'Kleinmenge', min_quantity: 3, max_quantity: 5, adjustment_type: 'percentage', adjustment_value: 30, is_active: true },
    { id: 2, name: 'Standard', min_quantity: 6, max_quantity: 24, adjustment_type: 'fixed', adjustment_value: 0, is_active: true },
    { id: 3, name: 'Großmenge', min_quantity: 25, adjustment_type: 'fixed', adjustment_value: -2.5, is_active: true },
    { id: 4, name: 'Kleinmenge', min_quantity: 3, max_quantity: 5, adjustment_type: 'percentage', adjustment_value: 30, is_active: true },
    { id: 5, name: 'Standard', min_quantity: 6, max_quantity: 24, adjustment_type: 'fixed', adjustment_value: 0, is_active: true },
    { id: 6, name: 'Großmenge', min_quantity: 25, adjustment_type: 'fixed', adjustment_value: -2.5, is_active: true },
    { id: 7, name: 'Kleinmenge', min_quantity: 3, max_quantity: 5, adjustment_type: 'percentage', adjustment_value: 30, is_active: true },
    { id: 8, name: 'Standard', min_quantity: 6, max_quantity: 24, adjustment_type: 'fixed', adjustment_value: 0, is_active: true },
    { id: 9, name: 'Großmenge', min_quantity: 25, adjustment_type: 'fixed', adjustment_value: -2.5, is_active: true }
  ];

  const fetchProducts = async () => {
    try {
      // Produkte laden
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('in_stock', true)

      if (productsError) throw productsError;

      // Preisstufen laden
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('is_active', true);

      if (pricingError) throw pricingError;

      // Mindestbestellmenge laden
      const { data: settingsData, error: settingsError } = await supabase
        .from('shop_settings')
        .select('min_order_quantity')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      // Wenn keine Produkte geladen werden konnten, verwende Fallback-Produkte
      if (!productsData || productsData.length === 0) {
        console.log('Keine Produkte aus der Datenbank geladen, verwende Fallback-Produkte');
        setProducts(fallbackProducts);
        setFilteredProducts(fallbackProducts);
        setPricingTiers(fallbackPricingTiers);
      } else {
        setProducts(productsData);
        setFilteredProducts(productsData);
        setPricingTiers(pricingData || []);
      }

      if (settingsData?.min_order_quantity) {
        setMinOrderQuantity(settingsData.min_order_quantity);
      }

      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Produkte:', error);
      // Im Fehlerfall Fallback-Produkte verwenden
      console.log('Fehler beim Laden der Produkte, verwende Fallback-Produkte');
      setProducts(fallbackProducts);
      setFilteredProducts(fallbackProducts);
      setPricingTiers(fallbackPricingTiers);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchProducts();
    
    // Echtzeit-Updates für Produktänderungen
    const channel = supabase
      .channel('product-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'products' }, 
          (payload: { new: Record<string, any>; old: Record<string, any> }) => {
            console.log('Produktänderung erkannt, aktualisiere Daten...');
            
            // Überprüfen, ob ein Produktbild aktualisiert wurde
            if (payload.new && payload.old && 
                'image_url' in payload.new && 'image_url' in payload.old && 
                payload.new.image_url !== payload.old.image_url) {
              console.log(`Produktbild wurde aktualisiert für Produkt ID ${payload.new.id}: ${payload.old.image_url} -> ${payload.new.image_url}`);
            }
            
            fetchProducts();
          })
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'pricing_tiers' },
          () => {
            console.log('Preisänderung erkannt, aktualisiere Daten...');
            fetchProducts();
          })
      .subscribe();
    
    // Cleanup bei Komponentenabbau
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  const getDisplayPrice = (product: Product) => {
    // Für Anzeige verwenden wir die Mindestbestellmenge als Referenz
    const basePrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const pricing = calculatePriceWithTiers(basePrice, minOrderQuantity, pricingTiers, minOrderQuantity);
    return pricing;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
            <i className="ri-product-hunt-line text-2xl text-white"></i>
          </div>
          <p className="text-lg font-medium text-gray-700">Lade Produkte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-[#1A1A1A] mb-4">
          Unser Premium Brennholz-Sortiment
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Entdecke unsere vielfältige Auswahl an hochwertigem Brennholz für dein Zuhause.
          Alle Hölzer sind kammergetrocknet und sofort verfügbar.
        </p>

        {/* Preishinweis */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <div className="w-5 h-5 flex items-center justify-center mr-2 text-blue-600">
              <i className="ri-information-line"></i>
            </div>
            <h3 className="font-bold text-blue-800">Preiskalkulation</h3>
          </div>
          <div className="text-sm text-blue-700">
            <p>Mindestbestellung: {minOrderQuantity} SRM</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              {pricingTiers.map((tier) => (
                <div key={tier.id} className="text-xs">
                  {tier.max_quantity ? `${tier.min_quantity}-${tier.max_quantity} SRM` : `ab ${tier.min_quantity} SRM`}: 
                  {tier.adjustment_value === 0 ? ' Normalpreis' :
                   tier.adjustment_type === 'percentage' ? 
                     (tier.adjustment_value > 0 ? ` +${tier.adjustment_value}%` : ` ${tier.adjustment_value}%`) :
                     (tier.adjustment_value > 0 ? ` +€${tier.adjustment_value}` : ` €${Math.abs(tier.adjustment_value)} Rabatt`)
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
            <i className="ri-product-hunt-line text-3xl text-gray-400"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Keine Produkte verfügbar</h2>
          <p className="text-gray-500">Aktuell sind keine Produkte im Shop verfügbar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const displayPricing = getDisplayPrice(product);

            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {/* Product Image */}
                <div className="relative">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-48 object-cover object-top"
                  />
                  <div className="absolute top-3 right-3">
                    <WishlistButton productId={product.id.toString()} />
                  </div>
                  {product.original_price && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ANGEBOT
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {product.stock_quantity} SRM verfügbar
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="mb-3">
                    <span className="text-xs font-bold text-[#C04020] uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#1A1A1A] mb-3">
                    {product.name}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Technical Specifications */}
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-bold text-[#1A1A1A] mb-2">Technische Daten</h4>
                      <div className="space-y-1">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium text-gray-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {product.features.slice(0, 3).map((feature: string, index: number) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                        {product.features.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{product.features.length - 3} weitere
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price with dynamic calculation */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-2xl font-black text-[#C04020]">
                        ab €{displayPricing.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{product.unit}</div>
                      <div className="text-xs text-blue-600 font-medium">
                        {displayPricing.adjustmentText}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-600">
                        ab {minOrderQuantity} SRM
                      </div>
                      <div className="text-xs text-gray-500">
                        Mindestbestellung
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link 
                    href={`/shop/${productUrlMapping[product.id] || product.id}`}
                    className="block w-full bg-[#C04020] hover:bg-[#A03318] text-white text-center py-3 px-6 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Details ansehen & bestellen
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
