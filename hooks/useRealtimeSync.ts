'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  features?: string[];
  specifications?: { [key: string]: string };
  unit: string;
  original_price?: number;
  is_active: boolean;
  in_stock?: boolean;
  created_at: string;
  updated_at?: string;
  has_quantity_discount?: boolean;
}

interface RealtimeSyncHook {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  subscribeToChanges: () => void;
  unsubscribeFromChanges: () => void;
}

// Fallback-Produkte für sofortige Anzeige
const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Industrieholz Buche Klasse 1",
    description: "Premium Industrieholz aus Buche - perfekt für sauberes Heizen",
    price: 89.99,
    image_url: "/images/industrieholz-buche-1.jpg",
    category: "Industrieholz",
    stock_quantity: 50,
    unit: "SRM",
    is_active: true,
    in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Industrieholz Buche Klasse 2",
    description: "Hochwertiges Industrieholz aus Buche - ideal für den Kamin",
    price: 79.99,
    image_url: "/images/industrieholz-buche-2.jpg",
    category: "Industrieholz",
    stock_quantity: 30,
    unit: "SRM",
    is_active: true,
    in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Scheitholz Buche 33cm",
    description: "Klassisches Scheitholz aus Buche - 33cm Länge",
    price: 99.99,
    image_url: "/images/scheitholz-buche-33-cm-1756681329634.webp",
    category: "Scheitholz",
    stock_quantity: 25,
    unit: "SRM",
    is_active: true,
    in_stock: true,
    created_at: new Date().toISOString()
  }
];

export function useRealtimeSync(): RealtimeSyncHook {
  // Starte mit Fallback-Produkten für sofortige Anzeige
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isUnmounting, setIsUnmounting] = useState<boolean>(false);

  const refreshProducts = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      console.log('🔍 useRealtimeSync: Raw data from database:', data);
      
      // Explizite Datenkonvertierung für korrekte Typen
      const fetchedProducts: Product[] = (data || []).map((item: any) => ({
        id: item.id || 0,
        name: item.name || '',
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        image_url: item.image_url || '',
        category: item.category || '',
        stock_quantity: item.stock_quantity || 0,
        features: item.features || [],
        specifications: item.specifications || {},
        unit: item.unit || '',
        original_price: item.original_price ? parseFloat(item.original_price) : undefined,
        is_active: item.is_active || false,
        in_stock: item.in_stock || false,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at,
        has_quantity_discount: item.has_quantity_discount || false
      }));
      
      console.log('🔍 useRealtimeSync: Converted products:', fetchedProducts);
      
      // Nur aktualisieren wenn sich die Daten unterscheiden
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
        console.log('Products refreshed:', fetchedProducts.length, 'items');
      }
    } catch (err) {
      console.error('Error refreshing products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Bei Fehler bleiben Fallback-Produkte erhalten
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    if (subscription) {
      console.log('Real-time subscription already active');
      return;
    }

    console.log('🔄 Activating real-time subscription for products and images...');
    
    const channel = supabase
      .channel('products_and_images_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload: any) => {
          console.log('Product change detected:', payload);
          // Refresh products when any product changes
          refreshProducts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'image_mappings'
        },
        (payload: any) => {
          console.log('Image mapping change detected:', payload);
          // Refresh products to get updated image URLs
          refreshProducts();
          
          // Dispatch custom event for image components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('imageChange', {
              detail: { 
                action: payload.eventType,
                productId: payload.new?.product_id || payload.old?.product_id,
                seoSlug: payload.new?.seo_slug || payload.old?.seo_slug
              }
            }));
          }
        }
      )
      .subscribe((status: string) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for products and images');
        }
      });
    
    setSubscription(channel);
  }, [subscription, refreshProducts]);

  const unsubscribeFromChanges = useCallback(() => {
    if (subscription) {
      console.log('🔄 Unsubscribing from real-time changes...');
      supabase.removeChannel(subscription);
      setSubscription(null);
      console.log('✅ Real-time subscription cleaned up');
    }
  }, [subscription]);

  // Initial load
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Aktiviere Real-time Subscription für automatische Updates
  useEffect(() => {
    if (!subscription && !isUnmounting) {
      subscribeToChanges();
    }
    
    // Cleanup on unmount
    return () => {
      setIsUnmounting(true);
      if (subscription) {
        console.log('Cleaning up subscription on unmount...');
        supabase.removeChannel(subscription);
        setSubscription(null);
      }
    };
  }, [subscription, subscribeToChanges, isUnmounting]);

  // Periodic refresh as fallback (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Periodic product refresh...');
      refreshProducts();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshProducts]);

  return {
    products,
    isLoading,
    error,
    refreshProducts,
    subscribeToChanges,
    unsubscribeFromChanges
  };
}

// Global notification system for product changes
export const productChangeNotifier = {
  notify: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // This can be extended to show toast notifications
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('productChange', {
      detail: { message, type }
    }));
  }
};