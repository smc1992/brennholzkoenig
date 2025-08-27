
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { getCDNUrl } from '@/utils/cdn';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  features: string[];
  unit: string;
  original_price?: number;
  is_active: boolean;
  in_stock: boolean;
}

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image_url: string;
}

// SEO-freundliche URL-Zuordnung
const productUrlMapping: { [key: number]: string } = {
  1: 'industrieholz-buche-klasse-1',
  2: 'industrieholz-buche-klasse-2',
  3: 'scheitholz-buche-33cm',
  4: 'scheitholz-buche-25cm',
  5: 'scheitholz-industrieholz-mix-33cm',
  6: 'scheitholz-fichte-33cm'
};

export default function ProductSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('in_stock', true)
          .limit(3)
          .order('id');

        if (error) throw error;
        setProducts((data as unknown as Product[]) || []);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Fehler beim Laden der Produkte:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    
    // Real-time Updates für Produktänderungen
    const channel = supabase
      .channel('homepage-product-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'products' }, 
          (payload) => {
            console.log('Homepage: Produktänderung erkannt, aktualisiere Daten...');
            fetchProducts();
          })
      .subscribe();
    
    // Cleanup bei Komponentenabbau
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, supabase]);

  const addToCart = (product: Product, quantity: number = 1): void => {
    const cartItem: CartItem = {
      id: Math.floor(Math.random() * 1000000), // Vermeidet Date.now() für bessere Hydration
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      unit: product.unit,
      image_url: product.image_url
    };

    setCart(prevCart => {
      const existingItem = prevCart.find((item: CartItem) => item.productId === product.id);
      if (existingItem) {
        return prevCart.map((item: CartItem) => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, cartItem];
    });
  };

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  // Verhindert Hydration-Fehler durch einheitliche Darstellung
  if (!mounted) {
    return (
      <section className="py-20 bg-white" id="produkte">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4">
              <i className="ri-fire-line text-2xl text-white"></i>
            </div>
            <p className="text-lg font-medium text-gray-700">Preise werden geladen...</p>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-20 bg-white" id="produkte">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
              <i className="ri-fire-line text-2xl text-white"></i>
            </div>
            <p className="text-lg font-medium text-gray-700">Preise werden geladen...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#F5F0E0] to-white" id="produkte">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-[#1A1A1A] mb-6">
            Unser Premium Brennholz-Sortiment
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Entdecke unsere vielfältige Auswahl an hochwertigem Brennholz für dein Zuhause.
            Alle Hölzer sind kammergetrocknet und sofort verfügbar.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
              <i className="ri-product-hunt-line text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">Keine Produkte verfügbar</h3>
            <p className="text-gray-500">Aktuell sind keine Produkte verfügbar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product: Product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {/* Product Image */}
                <div className="relative">
                  <img 
                    src={getCDNUrl(product.image_url)} 
                    alt={product.name}
                    className="w-full h-48 object-cover object-top"
                  />
                  {product.original_price && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ANGEBOT
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {product.stock_quantity} {product.unit === 'SRM' ? 'SRM' : 
                     product.unit === 'RM' ? 'RM' :
                     product.unit === 'FM' ? 'FM' :
                     product.unit === 'kg' ? 'kg' :
                     product.unit === 'Stück' ? 'Stück' :
                     product.unit === 'Palette' ? 'Palette' :
                     product.unit === 'm³' ? 'm³' :
                     product.unit} verfügbar
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

                  {/* Price */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-2xl font-black text-[#C04020]">
                        €{formatPrice(product.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                         {product.unit === 'SRM' ? 'pro Schüttraummeter' : 
                          product.unit === 'RM' ? 'pro Raummeter' :
                          product.unit === 'FM' ? 'pro Festmeter' :
                          product.unit === 'kg' ? 'pro Kilogramm' :
                          product.unit === 'Stück' ? 'pro Stück' :
                          product.unit === 'Palette' ? 'pro Palette' :
                          product.unit === 'm³' ? 'pro Kubikmeter' :
                          product.unit || 'pro Schüttraummeter'}
                       </div>
                    </div>
                    {product.original_price && (
                      <div className="text-right">
                        <div className="text-lg text-gray-400 line-through">
                          €{formatPrice(product.original_price)}
                        </div>
                        <div className="text-xs text-red-600 font-bold">
                          -{Math.round((1 - product.price / product.original_price) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex space-x-2">
                    <Link 
                      href={`/shop/${productUrlMapping[product.id] || product.id}`}
                      className="flex-1 bg-[#C04020] hover:bg-[#A03318] text-white text-center py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Details ansehen
                    </Link>
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-lg transition-colors cursor-pointer"
                      title="In den Warenkorb"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-shopping-cart-line"></i>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link 
            href="/shop"
            className="inline-block bg-[#C04020] hover:bg-[#A03318] text-white font-bold py-4 px-8 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Alle Produkte ansehen
          </Link>
        </div>
      </div>
    </section>
  );
}
