
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { calculatePriceWithTiers, getPriceInfoForQuantity } from '../../lib/pricing';
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
}

interface Tier {
  id: number;
  min_quantity: number;
  max_quantity?: number;
  adjustment_type: string;
  adjustment_value: number;
}

/**
 * Returns static delivery options.
 */
const getDeliveryOptions = () => [
  { type: 'standard', name: 'Standard Lieferung (1-3 Wochen)', price: 43.5 },
  { type: 'express', name: 'Express Lieferung (24-48h)', price: 139 },
];

export default function WarenkorbPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [pricingTiers, setPricingTiers] = useState<Tier[]>([]);
  const [minOrderQuantity, setMinOrderQuantity] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /* -------------------------------------------------
   *  Side‑effects
   * ------------------------------------------------- */
  useEffect(() => {
    loadData();
    // Track cart abandonment
    trackCartView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------
   *  Tracking
   * ------------------------------------------------- */
  const trackCartView = async () => {
    try {
      const cartData = localStorage.getItem('cart');
      if (!cartData) return;

      const cart = JSON.parse(cartData);
      if (!Array.isArray(cart) || cart.length === 0) return;

      await supabase.from('analytics_events').insert({
        event_type: 'cart_view',
        page_url: '/warenkorb',
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        session_id: sessionStorage.getItem('analytics_session_id') || 'unknown',
        properties: {
          cart_items: cart.length,
          cart_total: cart.reduce(
            (total, item: CartItem) => total + parseFloat(item.price) * item.quantity,
            0
          ),
        },
      });
    } catch (error) {
      console.error('Error tracking cart view:', error);
    }
  };

  /* -------------------------------------------------
   *  Data loading
   * ------------------------------------------------- */
  const loadData = async () => {
    try {
      // 1️⃣ Load price tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('min_quantity');

      if (tiersError) throw tiersError;
      const tiers = (tiersData as Tier[]) ?? [];

      // 2️⃣ Load minimum order quantity
      const {
        data: settingsData,
        error: settingsError,
      } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'minimum_order_quantity')
        .single();

      if (!settingsError && settingsData?.setting_value) {
        const parsed = parseInt(settingsData.setting_value, 10);
        setMinOrderQuantity(isNaN(parsed) ? 3 : parsed);
      }

      setPricingTiers(tiers);

      // 3️⃣ Load cart from localStorage and recalculate prices
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        const updatedCart = parsedCart.map((item) => {
          const basePrice = parseFloat(item.basePrice ?? item.price);
          const pricing = calculatePriceWithTiers(
            basePrice,
            item.quantity,
            tiers,
            parseInt(settingsData?.setting_value ?? '3', 10)
          );
          return { ...item, price: pricing.price.toString() };
        });
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------
   *  Cart manipulation helpers
   * ------------------------------------------------- */
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }

    if (newQuantity < minOrderQuantity) return; // enforce min order

    const updatedCart = cartItems.map((item) => {
      if (item.id !== id) return item;
      const basePrice = parseFloat(item.basePrice ?? item.price);
      const pricing = calculatePriceWithTiers(
        basePrice,
        newQuantity,
        pricingTiers,
        minOrderQuantity
      );
      return {
        ...item,
        quantity: newQuantity,
        price: pricing.price.toString(),
      };
    });

    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: number) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  /* -------------------------------------------------
   *  Calculations
   * ------------------------------------------------- */
  const getTotalPrice = () =>
    cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);

  const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0);

  const getDeliveryPrice = () => {
    const selected = getDeliveryOptions().find((opt) => opt.type === selectedDelivery);
    return selected ? selected.price : 43.5;
  };

  const getPriceInfoForItem = (item: CartItem) =>
    getPriceInfoForQuantity(item.quantity, pricingTiers, minOrderQuantity);

  /* -------------------------------------------------
   *  UI
   * ------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
            <i className="ri-shopping-cart-line text-2xl text-white"></i>
          </div>
          <p className="text-lg font-medium text-[#1A1A1A]">Warenkorb wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E0]">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#C04020] to-[#A03318] text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/20 rounded-full mr-3 md:mr-4">
                <i className="ri-shopping-cart-line text-xl md:text-2xl"></i>
              </div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                IHR WARENKORB
              </h1>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light">
              Überprüfen Sie Ihre Auswahl und gehen Sie zur Kasse
            </p>
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {cartItems.length === 0 ? (
            // ---- Empty Cart ----
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
                <i className="ri-shopping-cart-line text-3xl md:text-4xl text-gray-400"></i>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-4">Ihr Warenkorb ist leer</h2>
              <p className="text-gray-600 mb-8 text-sm md:text-base">
                Entdecken Sie unser hochwertiges Brennholz‑Sortiment und finden Sie das perfekte Holz für Ihre
                Bedürfnisse.
              </p>
              <Link
                href="/shop"
                className="bg-[#C04020] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold hover:bg-[#A03318] transition-colors cursor-pointer inline-flex items-center text-sm md:text-base"
              >
                <div className="w-5 h-5 flex items-center justify-center mr-2">
                  <i className="ri-store-line"></i>
                </div>
                Zum Shop
              </Link>
            </div>
          ) : (
            // ---- Filled Cart ----
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Cart Items Column */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">
                      Ihre Artikel ({getTotalItems()} SRM)
                    </h2>
                    <button
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 transition-colors cursor-pointer flex items-center text-xs md:text-sm"
                    >
                      <div className="w-4 h-4 flex items-center justify-center mr-1 md:mr-2">
                        <i className="ri-delete-bin-line"></i>
                      </div>
                      <span className="hidden sm:inline">Alle entfernen</span>
                      <span className="sm:hidden">Leeren</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {cartItems.map((item) => {
                      const priceInfo = getPriceInfoForItem(item);
                      return (
                        <div key={item.id} className="bg-gray-50 rounded-xl p-3 md:p-4">
                          {/* Mobile layout */}
                          <div className="block md:hidden">
                            <div className="flex items-start gap-3 mb-4">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover object-top rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-[#C04020] font-bold uppercase mb-1">
                                  {item.category}
                                </div>
                                <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 leading-tight">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  €{parseFloat(item.price).toFixed(2)} {item.unit}
                                </p>
                                {priceInfo.info && (
                                  <p className={`text-xs font-medium mt-1 ${priceInfo.color}`}>
                                    {priceInfo.info}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer flex-shrink-0"
                              >
                                <i className="ri-close-line text-lg"></i>
                              </button>
                            </div>

                            {/* Quantity controls (mobile) */}
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= minOrderQuantity}
                                  className={`w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-full transition-colors cursor-pointer ${
                                    item.quantity <= minOrderQuantity
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <i className="ri-subtract-line text-sm"></i>
                                </button>
                                <div className="text-center">
                                  <div className="font-bold text-xl min-w-[2.5rem] text-center px-2 py-1">
                                    {item.quantity}
                                  </div>
                                  <div className="text-xs text-gray-500 font-medium">SRM</div>
                                </div>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  <i className="ri-add-line text-sm"></i>
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-[#C04020]">
                                  €{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">Gesamt</p>
                              </div>
                            </div>
                          </div>

                          {/* Desktop layout */}
                          <div className="hidden md:flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover object-top rounded-lg flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="text-xs text-[#C04020] font-bold uppercase mb-1">
                                {item.category}
                              </div>
                              <h3 className="font-bold text-base text-[#1A1A1A] mb-1">{item.name}</h3>
                              <p className="text-sm text-gray-600">
                                €{parseFloat(item.price).toFixed(2)} {item.unit}
                              </p>
                              {priceInfo.info && (
                                <p className={`text-xs font-medium ${priceInfo.color}`}>{priceInfo.info}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= minOrderQuantity}
                                className={`w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-full transition-colors cursor-pointer ${
                                  item.quantity <= minOrderQuantity
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-gray-50'
                                }`}
                              >
                                <i className="ri-subtract-line text-sm"></i>
                              </button>
                              <div className="text-center">
                                <span className="font-bold text-xl min-w-[3rem] text-center px-3 py-2 bg-white rounded-lg border">
                                  {item.quantity}
                                </span>
                                <span className="text-xs text-gray-500 font-medium mt-1 block">
                                  SRM
                                </span>
                              </div>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <i className="ri-add-line text-sm"></i>
                              </button>
                            </div>

                            <div className="text-right min-w-[100px]">
                              <p className="text-lg font-bold text-[#C04020]">
                                €{(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </p>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                            >
                              <i className="ri-close-line text-base"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pricing Information */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-5 h-5 flex items-center justify-center mr-3 text-blue-600 flex-shrink-0">
                        <i className="ri-information-line"></i>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Aktuelle Preiskalkulation:</p>
                        <div className="space-y-1 text-xs">
                          <div>• Mindestbestellmenge: {minOrderQuantity} SRM</div>
                          {pricingTiers.map((tier) => (
                            <div key={tier.id}>
                              •{' '}
                              {tier.max_quantity
                                ? `${tier.min_quantity}-${tier.max_quantity} SRM`
                                : `ab ${tier.min_quantity} SRM`}
                              :{' '}
                              {tier.adjustment_value === 0
                                ? ' Normalpreis'
                                : tier.adjustment_type === 'percentage'
                                ? tier.adjustment_value > 0
                                  ? ` +${tier.adjustment_value}%`
                                  : ` ${tier.adjustment_value}%`
                                : tier.adjustment_value > 0
                                ? ` +€${tier.adjustment_value}`
                                : ` €${Math.abs(tier.adjustment_value)} Rabatt`}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue Shopping */}
                <div className="text-center">
                  <Link
                    href="/shop"
                    className="inline-flex items-center text-[#C04020] hover:text-[#A03318] transition-colors cursor-pointer"
                  >
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-arrow-left-line"></i>
                    </div>
                    Weiter einkaufen
                  </Link>
                </div>
              </div>

              {/* Order Summary Column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 sticky top-24">
                  <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A] mb-6">Bestellübersicht</h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600 text-sm md:text-base">
                      <span>Artikel ({getTotalItems()} SRM)</span>
                      <span>€{getTotalPrice().toFixed(2)}</span>
                    </div>

                    {/* Delivery Options */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-bold text-[#1A1A1A] mb-3 text-sm md:text-base">
                        Lieferart wählen:
                      </h4>
                      <div className="space-y-2">
                        {getDeliveryOptions().map((option) => (
                          <label
                            key={option.type}
                            className="flex items-center cursor-pointer p-2 md:p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="delivery"
                              value={option.type}
                              checked={selectedDelivery === option.type}
                              onChange={(e) => setSelectedDelivery(e.target.value)}
                              className="mr-2 md:mr-3"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs md:text-sm truncate">{option.name}</div>
                              <div className="text-xs text-gray-600">
                                {option.type === 'express' ? 'Schnellste Option' : 'Günstigste Option'}
                              </div>
                            </div>
                            <div className="font-bold text-[#C04020] text-sm md:text-base">
                              €{option.price.toFixed(2)}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg md:text-xl font-bold text-[#1A1A1A]">
                        <span>Gesamt</span>
                        <span className="text-[#C04020]">
                          €{(getTotalPrice() + getDeliveryPrice()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="w-full bg-[#C04020] text-white py-3 md:py-4 px-4 md:px-6 rounded-lg font-bold hover:bg-[#A03318] transition-colors cursor-pointer mb-4 whitespace-nowrap block text-center text-sm md:text-base"
                  >
                    Zur Kasse gehen
                  </Link>

                  <div className="text-center text-xs text-gray-500 mb-4">
                    Sichere Bestellung - Bezahlung bei Lieferung
                  </div>

                  {/* Trust Elements */}
                  <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 flex items-center justify-center mr-3 text-green-500 flex-shrink-0">
                        <i className="ri-shield-check-line"></i>
                      </div>
                      <span>27 Jahre Erfahrung</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 flex items-center justify-center mr-3 text-green-500 flex-shrink-0">
                        <i className="ri-truck-line"></i>
                      </div>
                      <span>Zuverlässige Lieferung</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 flex items-center justify-center mr-3 text-green-500 flex-shrink-0">
                        <i className="ri-customer-service-line"></i>
                      </div>
                      <span>Persönliche Beratung</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
