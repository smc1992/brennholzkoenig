'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { getCDNUrl } from '@/utils/cdn';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

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

interface OptimizedProductSectionProps {
  initialProducts?: Product[];
  loadTime?: number;
  error?: string | null;
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

export default function OptimizedProductSection({ 
  initialProducts = [], 
  loadTime = 0, 
  error: serverError = null 
}: OptimizedProductSectionProps = {}) {
  const { updateProductStockOptimistically } = useRealtimeSync();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(initialProducts.length === 0);
  const [mounted, setMounted] = useState<boolean>(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  // Kombiniere Server- und Real-time Fehler
  const combinedError = serverError || realtimeError;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Nur Real-time Updates wenn keine Server-Daten vorhanden
    const fetchProducts = async () => {
      if (initialProducts.length > 0) {
        console.log('Homepage: Verwende Server-Side Produktdaten');
        return;
      }

      try {
        setRealtimeError(null);
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
        console.error('Homepage: Fehler beim Laden der Produkte:', errorMessage);
        setRealtimeError(errorMessage);
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
          (payload: { eventType: string; new: any; old: any; schema: string; table: string }) => {
            console.log('Homepage: Produktänderung erkannt, aktualisiere Daten...');
            fetchProducts();
          })
      .subscribe();
    
    // Cleanup bei Komponentenabbau
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, initialProducts.length]);

  const addToCart = (product: Product, quantity: number = 1): void => {
    const cartItem: CartItem = {
      id: Math.floor(Math.random() * 1000000),
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      unit: product.unit,
      image_url: product.image_url
    };

    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, cartItem]);
    }

    // Warenkorb in localStorage speichern
    if (typeof window !== 'undefined') {
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingIndex = currentCart.findIndex((item: any) => item.id === product.id.toString());
      
      if (existingIndex >= 0) {
        currentCart[existingIndex].quantity += quantity;
      } else {
        currentCart.push({
          id: product.id.toString(),
          name: product.name,
          category: product.category,
          price: product.price.toString(),
          basePrice: product.price,
          image_url: product.image_url,
          unit: product.unit,
          quantity: quantity,
          stock_quantity: product.stock_quantity
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(currentCart));
      
      // Optimistische UI-Updates für sofortige SRM-Verfügbarkeits-Anzeige
      updateProductStockOptimistically(product.id, quantity);
      
      // Lokale Produktdaten auch sofort aktualisieren
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id 
            ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - quantity) }
            : p
        )
      );
      
      // Dispatch Event für andere Komponenten
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stockUpdated', {
          detail: { productId: product.id.toString(), quantityChange: quantity }
        }));
      }
    }
  };

  // Zeige Loading nur wenn keine Server-Daten und noch lädt
  if (loading && initialProducts.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Unsere beliebtesten Produkte
            </h2>
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
              <i className="ri-fire-line text-2xl text-white"></i>
            </div>
            <p className="text-lg text-gray-600">Produkte werden geladen...</p>
          </div>
        </div>
      </section>
    );
  }

  // Zeige Fehler nur wenn kombinedError vorhanden und keine Produkte
  if (combinedError && products.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Unsere beliebtesten Produkte
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600">
                {typeof combinedError === 'string' ? combinedError : 'Fehler beim Laden der Produkte'}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            Unsere beliebtesten Produkte
          </h2>
          

          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Entdecken Sie unser hochwertiges Brennholz-Sortiment. Perfekt für gemütliche Abende am Kamin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const productUrl = productUrlMapping[product.id] || `product-${product.id}`;
            const imageUrl = getCDNUrl(product.image_url);
            const hasDiscount = product.original_price && product.original_price > product.price;
            const discountPercentage = hasDiscount 
              ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
              : 0;

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="relative overflow-hidden">
                  <Link href={`/shop/${productUrl}`}>
                    <img 
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder?width=400&height=300';
                      }}
                    />
                  </Link>
                  
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{discountPercentage}%
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {product.stock_quantity > 0 ? 'Verfügbar' : 'Ausverkauft'}
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-2">
                    <span className="inline-block bg-[#C04020] text-white px-3 py-1 rounded-full text-sm font-medium">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 group-hover:text-[#C04020] transition-colors">
                    <Link href={`/shop/${productUrl}`}>
                      {product.name}
                    </Link>
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {product.features && product.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {hasDiscount && (
                        <span className="text-lg text-gray-400 line-through">
                          €{product.original_price?.toFixed(2)}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-[#C04020]">
                        €{product.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.unit === 'SRM' ? 'pro Schüttraummeter' : 
                       product.unit === 'RM' ? 'pro Raummeter' :
                       product.unit === 'FM' ? 'pro Festmeter' :
                       product.unit === 'kg' ? 'pro Kilogramm' :
                       product.unit === 'Stück' ? 'pro Stück' :
                       product.unit === 'Palette' ? 'pro Palette' :
                       product.unit === 'm³' ? 'pro Kubikmeter' :
                       product.unit || 'pro Schüttraummeter'}
                    </span>
                  </div>

                  <div className="flex space-x-3">
                    <Link 
                      href={`/shop/${productUrl}`}
                      className="flex-1 bg-[#C04020] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#A03318] transition-colors text-center"
                    >
                      Details ansehen
                    </Link>
                    
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                        product.stock_quantity > 0
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <i className="ri-shopping-cart-line text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/shop"
            className="inline-flex items-center bg-[#C04020] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#A03318] transition-colors"
          >
            Alle Produkte ansehen
            <i className="ri-arrow-right-line ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}