'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { calculatePriceWithTiers, getPriceInfoForQuantity } from '../lib/pricing';
import Link from 'next/link';

interface CartItem {
  id: number;
  name: string;
  price: string;
  basePrice?: string;
  unit: string;
  quantity: number;
  image: string;
  category: string;
  has_quantity_discount?: boolean;
}

interface Tier {
  id: number;
  min_quantity: number;
  max_quantity?: number;
  adjustment_type: string;
  adjustment_value: number;
}

interface DeliveryOption {
  type: string;
  name: string;
  price: number;
}

interface OptimizedWarenkorbContentProps {
  initialProducts?: any[];
  initialDeliveryOptions?: DeliveryOption[];
  loadTime?: number;
  error?: string | null;
}

export default function OptimizedWarenkorbContent({
  initialProducts = [],
  initialDeliveryOptions = [],
  loadTime = 0,
  error: serverError = null
}: OptimizedWarenkorbContentProps) {
  const { products, subscribeToChanges, unsubscribeFromChanges } = useRealtimeSync();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [pricingTiers, setPricingTiers] = useState<Tier[]>([]);
  const [minOrderQuantity, setMinOrderQuantity] = useState(3);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [shippingCosts, setShippingCosts] = useState({ 
    standard: initialDeliveryOptions.find(d => d.type === 'standard')?.price || 43.5, 
    express: initialDeliveryOptions.find(d => d.type === 'express')?.price || 139 
  });
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Kombiniere Server- und Real-time Fehler
  const combinedError = serverError || realtimeError;

  /**
   * Returns dynamic delivery options from database or fallback.
   */
  const getDeliveryOptions = () => {
    if (initialDeliveryOptions.length > 0) {
      return initialDeliveryOptions;
    }
    return [
      { type: 'standard', name: 'Standard Lieferung (1-3 Wochen)', price: shippingCosts.standard },
      { type: 'express', name: 'Express Lieferung (24-48h)', price: shippingCosts.express },
    ];
  };

  useEffect(() => {
    subscribeToChanges();
    return () => {
      unsubscribeFromChanges();
    };
  }, [subscribeToChanges, unsubscribeFromChanges]);

  useEffect(() => {
    loadCartFromStorage();
    loadPricingTiers();
    loadShippingCosts();
  }, []);

  const loadCartFromStorage = async () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          
          // Lade Produktdaten aus der Datenbank um has_quantity_discount zu erhalten
          const productIds = parsedCart.map((item: any) => parseInt(item.id)).filter((id: number) => !isNaN(id));
          
          let productData: any[] = [];
          if (productIds.length > 0) {
            const { data } = await supabase
              .from('products')
              .select('id, has_quantity_discount')
              .in('id', productIds);
            productData = data || [];
          }
          
          const formattedCart = parsedCart.map((item: any) => {
            const product = productData.find(p => p.id === parseInt(item.id));
            return {
              id: parseInt(item.id),
              name: item.name,
              price: item.price,
              basePrice: item.basePrice,
              unit: item.unit,
              quantity: item.quantity,
              image: item.image_url || '',
              category: item.category,
              has_quantity_discount: product?.has_quantity_discount || false
            };
          });
          setCartItems(formattedCart);
        } catch (error) {
          console.error('Fehler beim Laden des Warenkorbs:', error);
        }
      }
    }
    setIsLoading(false);
  };

  const loadPricingTiers = async () => {
    // Nur laden wenn keine Server-Daten vorhanden
    if (initialProducts.length > 0) {
      console.log('Warenkorb: Verwende Server-Side Produktdaten');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPricingTiers(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Preisstufen:', error);
      setRealtimeError('Fehler beim Laden der Preisstufen');
    }
  };

  const loadShippingCosts = async () => {
    // Verwende Server-Side Daten wenn verfügbar
    if (initialDeliveryOptions.length > 0) {
      console.log('Warenkorb: Verwende Server-Side Lieferoptionen');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('setting_key', ['standard_delivery_price', 'express_delivery_price']);

      if (error) throw error;

      const standardPrice = data?.find((s: any) => s.setting_key === 'standard_delivery_price')?.setting_value;
      const expressPrice = data?.find((s: any) => s.setting_key === 'express_delivery_price')?.setting_value;

      if (standardPrice || expressPrice) {
        setShippingCosts({
          standard: standardPrice ? parseFloat(standardPrice) : 43.5,
          express: expressPrice ? parseFloat(expressPrice) : 139
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Versandkosten:', error);
      setRealtimeError('Fehler beim Laden der Versandkosten');
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    const updatedItems = cartItems.map(item => {
      if (item.id === id) {
        const basePrice = parseFloat(item.basePrice || item.price);
        const pricing = calculatePriceWithTiers(basePrice, newQuantity, pricingTiers, minOrderQuantity, item.has_quantity_discount || false);
        return {
          ...item,
          quantity: newQuantity,
          price: pricing.price.toString()
        };
      }
      return item;
    });

    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const removeFromCart = (id: number) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const saveCartToStorage = (items: CartItem[]) => {
    if (typeof window !== 'undefined') {
      const cartData = items.map(item => ({
        id: item.id.toString(),
        name: item.name,
        price: item.price,
        basePrice: item.basePrice,
        unit: item.unit,
        quantity: item.quantity,
        image_url: item.image,
        category: item.category,
        has_quantity_discount: item.has_quantity_discount
      }));
      localStorage.setItem('cart', JSON.stringify(cartData));
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    
    const subtotal = calculateSubtotal();
    
    if (appliedDiscount.discount_type === 'percentage') {
      return (subtotal * appliedDiscount.discount_value) / 100;
    } else {
      return appliedDiscount.discount_value;
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const deliveryOption = getDeliveryOptions().find(option => option.type === selectedDelivery);
    const deliveryCost = deliveryOption ? deliveryOption.price : 0;
    return Math.max(0, subtotal - discountAmount + deliveryCost);
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Bitte geben Sie einen Rabattcode ein');
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountError('');

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setDiscountError('Ungültiger Rabattcode');
        return;
      }

      // Prüfe Gültigkeitsdatum
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = new Date(data.valid_until);

      if (now < validFrom || now > validUntil) {
        setDiscountError('Dieser Rabattcode ist nicht mehr gültig');
        return;
      }

      // Prüfe Nutzungslimit
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        setDiscountError('Dieser Rabattcode wurde bereits zu oft verwendet');
        return;
      }

      // Prüfe Mindestbestellwert
      const subtotal = calculateSubtotal();
      if (data.minimum_order_amount && subtotal < data.minimum_order_amount) {
        setDiscountError(`Mindestbestellwert von €${data.minimum_order_amount.toFixed(2)} nicht erreicht`);
        return;
      }

      setAppliedDiscount(data);
      setDiscountError('');
      
      // Speichere Rabattcode im localStorage für Checkout
      localStorage.setItem('appliedDiscount', JSON.stringify(data));
    } catch (error) {
      console.error('Error applying discount code:', error);
      setDiscountError('Fehler beim Anwenden des Rabattcodes');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const removeDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
    
    // Entferne Rabattcode aus localStorage
    localStorage.removeItem('appliedDiscount');
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }
  };

  if (isLoading && initialProducts.length === 0) {
    return (
      <div className="min-h-screen bg-pergament py-16" style={{paddingTop: '120px'}}>
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
              <i className="ri-shopping-cart-line text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">Warenkorb wird geladen...</h1>
            <p className="text-gray-600">Bitte warten Sie einen Moment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (combinedError) {
    return (
      <div className="min-h-screen bg-pergament py-16" style={{paddingTop: '120px'}}>
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-red-800 mb-4">Fehler beim Laden</h1>
              <p className="text-red-600 mb-4">{combinedError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pergament py-16" style={{paddingTop: '120px'}}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">Ihr Warenkorb</h1>
          

        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
              <i className="ri-shopping-cart-line text-4xl text-gray-400"></i>
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Ihr Warenkorb ist leer</h2>
            <p className="text-gray-600 mb-8">Entdecken Sie unser hochwertiges Brennholz-Sortiment.</p>
            <Link 
              href="/shop"
              className="inline-flex items-center bg-[#C04020] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#A03318] transition-colors"
            >
              Zum Shop
              <i className="ri-arrow-right-line ml-2"></i>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Warenkorb Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Ihre Artikel ({cartItems.length})</h2>
                  
                  <div className="space-y-6">
                    {cartItems.map((item) => {
                      const priceInfo = getPriceInfoForQuantity(item.quantity, pricingTiers, minOrderQuantity);
                      
                      return (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/api/placeholder?width=80&height=80';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-image-line text-xl sm:text-2xl text-gray-400"></i>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 text-center sm:text-left">
                            <h3 className="font-semibold text-[#1A1A1A] mb-1 text-sm sm:text-base">{item.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.category}</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-2 sm:space-y-0 sm:space-x-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <i className="ri-subtract-line text-sm"></i>
                                </button>
                                <span className="w-12 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <i className="ri-add-line text-sm"></i>
                                </button>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-500">{item.unit}</span>
                            </div>
                            {priceInfo.info && (
                              <p className={`text-xs mt-1 ${priceInfo.color} text-center sm:text-left`}>
                                {priceInfo.info}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-center sm:text-right">
                            <div className="font-bold text-[#C04020] text-base sm:text-lg">
                              €{(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              €{parseFloat(item.price).toFixed(2)} / {item.unit}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 text-xs sm:text-sm mt-2 transition-colors"
                            >
                              <i className="ri-delete-bin-line mr-1"></i>
                              Entfernen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 text-sm transition-colors"
                    >
                      <i className="ri-delete-bin-line mr-1"></i>
                      Warenkorb leeren
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bestellübersicht */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Bestellübersicht</h2>
                
                {/* Lieferoptionen */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-3">Lieferung</h3>
                  <div className="space-y-2">
                    {getDeliveryOptions().map((option) => (
                      <label key={option.type} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value={option.type}
                          checked={selectedDelivery === option.type}
                          onChange={(e) => setSelectedDelivery(e.target.value)}
                          className="text-[#C04020] focus:ring-[#C04020]"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{option.name}</div>
                          <div className="text-[#C04020] font-bold">€{option.price.toFixed(2)}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Rabattcode */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-3">Rabattcode</h3>
                  {!appliedDiscount ? (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          placeholder="Rabattcode eingeben"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent text-sm"
                          disabled={isApplyingDiscount}
                        />
                        <button
                          onClick={applyDiscountCode}
                          disabled={isApplyingDiscount || !discountCode.trim()}
                          className="bg-[#C04020] text-white px-4 py-2 rounded-lg hover:bg-[#A03318] disabled:bg-gray-400 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {isApplyingDiscount ? 'Prüfe...' : 'Anwenden'}
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-red-600 text-sm">{discountError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-green-800">{appliedDiscount.code}</div>
                          <div className="text-sm text-green-600">
                            {appliedDiscount.discount_type === 'percentage' 
                              ? `${appliedDiscount.discount_value}% Rabatt`
                              : `€${appliedDiscount.discount_value.toFixed(2)} Rabatt`
                            }
                          </div>
                        </div>
                        <button
                          onClick={removeDiscountCode}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Entfernen
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preisaufschlüsselung */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme:</span>
                    <span className="font-medium">€{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Rabatt ({appliedDiscount.code}):</span>
                      <span>-€{calculateDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versand:</span>
                    <span className="font-medium">
                      €{getDeliveryOptions().find(option => option.type === selectedDelivery)?.price.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-[#1A1A1A]">Gesamt:</span>
                      <span className="text-lg font-bold text-[#C04020]">€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <Link
                  href="/checkout"
                  className="w-full bg-[#C04020] text-white py-4 rounded-lg font-semibold hover:bg-[#A03318] transition-colors text-center block"
                >
                  Zur Kasse
                </Link>
                
                <Link
                  href="/shop"
                  className="w-full mt-3 border border-[#C04020] text-[#C04020] py-3 rounded-lg font-semibold hover:bg-[#C04020] hover:text-white transition-colors text-center block"
                >
                  Weiter einkaufen
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}