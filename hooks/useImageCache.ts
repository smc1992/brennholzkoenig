'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ImageCacheItem {
  images: string[];
  timestamp: number;
  productId?: number;
}

interface ImageCacheHook {
  getProductImages: (productName: string, productId?: number) => Promise<string[]>;
  invalidateCache: (productName: string) => void;
  clearCache: () => void;
}

// Cache-Dauer: 5 Minuten
const CACHE_DURATION = 5 * 60 * 1000;

// In-Memory Cache
const imageCache = new Map<string, ImageCacheItem>();

export function useImageCache(): ImageCacheHook {
  const [cacheVersion, setCacheVersion] = useState(0);

  const getCacheKey = useCallback((productName: string) => {
    if (!productName || typeof productName !== 'string') {
      console.warn('Invalid productName provided to getCacheKey:', productName);
      return 'fallback-product';
    }
    return productName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  const isValidCache = useCallback((item: ImageCacheItem): boolean => {
    return Date.now() - item.timestamp < CACHE_DURATION;
  }, []);

  const getProductImages = useCallback(async (productName: string, productId?: number): Promise<string[]> => {
    if (!productName || typeof productName !== 'string') {
      console.error('Error loading product images: Invalid productName provided:', productName);
      return [];
    }
    const cacheKey = getCacheKey(productName);
    const cachedItem = imageCache.get(cacheKey);

    // Prüfe Cache-Gültigkeit
    if (cachedItem && isValidCache(cachedItem)) {
      console.log(`Cache hit for ${productName}`);
      return cachedItem.images;
    }

    console.log(`Cache miss for ${productName}, loading from Supabase`);

    try {
      let images: string[] = [];
      
      // Lade Bilder aus Supabase mit Multi-Bild-Support
      if (productId) {
        // Primär: Lade Bilder aus image_mappings mit Multi-Bild-Support
        const { data, error } = await supabase
          .from('image_mappings')
          .select('seo_slug, is_main_image, image_order, image_index')
          .eq('product_id', productId)
          .order('image_order', { ascending: true }); // Sortiere nach Reihenfolge
        
        if (error) {
          console.error('Error loading product images:', error);
          return [];
        }
        
        if (data && data.length > 0) {
          // Sortiere Bilder: Hauptbild zuerst, dann nach image_order
          const sortedData = data.sort((a: any, b: any) => {
            // Hauptbild hat immer Priorität
            if (a.is_main_image && !b.is_main_image) return -1;
            if (!a.is_main_image && b.is_main_image) return 1;
            
            // Ansonsten nach image_order sortieren
            return (a.image_order || 1) - (b.image_order || 1);
          });
          
          images = sortedData.map((item: any) => `/images/${item.seo_slug}`);
          
          console.log(`Loaded ${images.length} images for product ${productId}:`, {
            mainImage: sortedData.find((item: any) => item.is_main_image)?.seo_slug,
            totalImages: images.length,
            imageOrder: sortedData.map((item: any) => `${item.seo_slug} (${item.image_order})`)
          });
        } else {
          // Fallback: Versuche image_url aus products-Tabelle
          const { data: productData } = await supabase
            .from('products')
            .select('image_url')
            .eq('id', productId)
            .single();
          
          if (productData && typeof productData.image_url === 'string') {
            images = [productData.image_url];
            console.log(`Fallback: Using product.image_url for product ${productId}:`, productData.image_url);
          }
        }
      } else {
        // Fallback: Verbesserte Suche nach SEO-Slug wenn keine productId vorhanden
        console.log(`Fallback: Searching for images by product name: ${productName}`);
        
        // Versuche verschiedene Suchstrategien
        const searchStrategies = [
          // 1. Exakte Übereinstimmung mit normalisiertem Namen
          productName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          // 2. Erste Wörter des Produktnamens
          productName.toLowerCase().split(' ').slice(0, 3).join('-'),
          // 3. Produktname ohne Sonderzeichen
          productName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        ];
        
        for (const searchTerm of searchStrategies) {
          console.log(`Trying search strategy: ${searchTerm}`);
          
          const { data, error } = await supabase
            .from('image_mappings')
            .select('seo_slug, is_main_image, image_order, product_id')
            .like('seo_slug', `%${searchTerm}%`)
            .order('image_order', { ascending: true });

          if (error) {
            console.error('Error loading product images:', error);
            continue;
          }

          if (data && data.length > 0) {
            console.log(`Found ${data.length} images with search term: ${searchTerm}`);
            
            // Sortiere Bilder: Hauptbild zuerst, dann nach image_order
            const sortedData = data.sort((a: any, b: any) => {
              if (a.is_main_image && !b.is_main_image) return -1;
              if (!a.is_main_image && b.is_main_image) return 1;
              return (a.image_order || 1) - (b.image_order || 1);
            });
            
            images = sortedData.map((item: any) => `/images/${item.seo_slug}`);
            break; // Erfolgreiche Suche, beende Loop
          }
        }
        
        if (images.length === 0) {
          console.warn(`No images found for product: ${productName} with any search strategy`);
        }
      }

       // Cache die Ergebnisse
       imageCache.set(cacheKey, {
         images,
         timestamp: Date.now(),
         productId
       });

       return images;
    } catch (error) {
      console.error('Error in getProductImages:', error);
      return [];
    }
  }, [getCacheKey, isValidCache]);

  const invalidateCache = useCallback((productName: string) => {
    const cacheKey = getCacheKey(productName);
    imageCache.delete(cacheKey);
    setCacheVersion(prev => prev + 1);
    console.log(`Cache invalidated for ${productName}`);
  }, [getCacheKey]);

  const clearCache = useCallback(() => {
    imageCache.clear();
    setCacheVersion(prev => prev + 1);
    console.log('Image cache cleared');
  }, []);

  // Cleanup-Funktion für abgelaufene Cache-Einträge
  useEffect(() => {
    const cleanup = () => {
      for (const [key, item] of imageCache.entries()) {
        if (!isValidCache(item)) {
          imageCache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, 60000); // Cleanup alle 60 Sekunden
    return () => clearInterval(interval);
  }, [isValidCache]);

  // Real-time Subscription für image_mappings Änderungen
  useEffect(() => {
    const channel = supabase
      .channel('image_mappings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'image_mappings'
        },
        (payload: any) => {
           console.log('Image mapping change detected:', payload);
           
           // Bei Löschung oder Update: Cache für betroffenes Produkt invalidieren
           if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
             const seoSlug = (payload.old as any)?.seo_slug || (payload.new as any)?.seo_slug;
             if (seoSlug && typeof seoSlug === 'string') {
               // Extrahiere Produktname aus SEO-Slug
               const productName = seoSlug.split('-').slice(0, -1).join('-');
               if (productName) {
                 console.log(`Invalidating cache for product: ${productName}`);
                 invalidateCache(productName);
                 
                 // Dispatch custom event für UI-Updates
                 if (typeof window !== 'undefined') {
                   window.dispatchEvent(new CustomEvent('imageChange', {
                     detail: { productName, action: payload.eventType }
                   }));
                 }
               }
             }
           }
           
           // Bei INSERT: Cache für betroffenes Produkt invalidieren
           if (payload.eventType === 'INSERT') {
             const seoSlug = (payload.new as any)?.seo_slug;
             if (seoSlug && typeof seoSlug === 'string') {
               const productName = seoSlug.split('-').slice(0, -1).join('-');
               if (productName) {
                 console.log(`Invalidating cache for new image: ${productName}`);
                 invalidateCache(productName);
                 
                 if (typeof window !== 'undefined') {
                   window.dispatchEvent(new CustomEvent('imageChange', {
                     detail: { productName, action: 'INSERT' }
                   }));
                 }
               }
             }
           }
         }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateCache]);

  return {
    getProductImages,
    invalidateCache,
    clearCache
  };
}

// Globale Cache-Funktionen für direkten Zugriff
export const globalImageCache = {
  invalidate: (productName: string) => {
    const cacheKey = productName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    imageCache.delete(cacheKey);
  },
  clear: () => {
    imageCache.clear();
  }
};