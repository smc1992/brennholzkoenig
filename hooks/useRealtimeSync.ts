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
}

interface RealtimeSyncHook {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  subscribeToChanges: () => void;
  unsubscribeFromChanges: () => void;
}

export function useRealtimeSync(): RealtimeSyncHook {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setProducts((data as unknown as Product[]) || []);
      console.log('Products refreshed:', data?.length || 0, 'items');
    } catch (err) {
      console.error('Error refreshing products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    if (subscription) {
      console.log('Already subscribed to product changes');
      return;
    }

    console.log('Subscribing to real-time product changes...');
    
    const newSubscription = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Product change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setProducts(prev => {
                const newProduct = payload.new as Product;
                if (newProduct.is_active) {
                  return [...prev, newProduct].sort((a, b) => a.id - b.id);
                }
                return prev;
              });
              break;
              
            case 'UPDATE':
              setProducts(prev => {
                const updatedProduct = payload.new as Product;
                if (updatedProduct.is_active) {
                  return prev.map(product => 
                    product.id === updatedProduct.id ? updatedProduct : product
                  );
                } else {
                  // Product deactivated, remove from list
                  return prev.filter(product => product.id !== updatedProduct.id);
                }
              });
              break;
              
            case 'DELETE':
              setProducts(prev => 
                prev.filter(product => product.id !== (payload.old as Product).id)
              );
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to product changes');
        }
      });

    setSubscription(newSubscription);
  }, [subscription]);

  const unsubscribeFromChanges = useCallback(() => {
    if (subscription) {
      console.log('Unsubscribing from product changes...');
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [subscription]);

  // Initial load
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Auto-subscribe on mount
  useEffect(() => {
    subscribeToChanges();
    
    // Cleanup on unmount
    return () => {
      unsubscribeFromChanges();
    };
  }, [subscribeToChanges, unsubscribeFromChanges]);

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