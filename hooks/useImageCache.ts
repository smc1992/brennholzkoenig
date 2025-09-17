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
        const { data: mappingData, error: mappingError } = await supabase
          .from('image_mappings')
          .select('seo_slug, is_main_image, image_order, image_index')
          .eq('product_id', productId)
          .order('image_order', { ascending: true });
        
        // Parallel: Lade auch Bilder aus products Tabelle für Konsistenz
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('image_url, additional_images')
          .eq('id', productId)
          .single();
        
        if (mappingError && productError) {
          console.error('Error loading product images from both sources:', { mappingError, productError });
          return [];
        }
        
        // Kombiniere Bilder aus beiden Quellen für maximale Konsistenz
        let mappingImages: string[] = [];
        let productImages: string[] = [];
        
        // Verarbeite image_mappings Daten
        if (mappingData && mappingData.length > 0) {
          const sortedData = mappingData.sort((a: any, b: any) => {
            if (a.is_main_image && !b.is_main_image) return -1;
            if (!a.is_main_image && b.is_main_image) return 1;
            return (a.image_order || 1) - (b.image_order || 1);
          });
          
          mappingImages = sortedData.map((item: any) => `/images/${item.seo_slug}`);
          console.log(`Loaded ${mappingImages.length} images from image_mappings for product ${productId}`);
        }
        
        // Verarbeite products Tabelle Daten
        if (productData) {
          if (productData.image_url) {
            productImages.push(productData.image_url);
          }
          if (productData.additional_images && Array.isArray(productData.additional_images)) {
            productImages.push(...productData.additional_images);
          }
          console.log(`Loaded ${productImages.length} images from products table for product ${productId}`);
        }
        
        // Priorisiere image_mappings, aber füge fehlende Bilder aus products hinzu
        if (mappingImages.length > 0) {
          images = mappingImages;
          // Füge zusätzliche Bilder aus products hinzu, die nicht in mappings sind
          for (const productImage of productImages) {
            if (!images.some(img => img.includes(productImage.split('/').pop() || ''))) {
              images.push(productImage);
            }
          }
        } else if (productImages.length > 0) {
          // Fallback: Verwende nur products Tabelle
          images = productImages;
          console.log(`Fallback: Using products table images for product ${productId}`);
        }
        
        console.log(`Final image list for product ${productId}:`, {
          totalImages: images.length,
          mappingImages: mappingImages.length,
          productImages: productImages.length,
          finalImages: images
        });
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

  // Real-time Subscription für image_mappings und products Änderungen
  useEffect(() => {
    const channel = supabase
      .channel('image_and_product_changes')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload: any) => {
          console.log('Product change detected:', payload);
          
          // Prüfe ob Bildfelder geändert wurden
          const oldData = payload.old as any;
          const newData = payload.new as any;
          
          if (payload.eventType === 'UPDATE') {
            const imageFieldsChanged = 
              oldData?.image_url !== newData?.image_url ||
              JSON.stringify(oldData?.additional_images || []) !== JSON.stringify(newData?.additional_images || []);
            
            if (imageFieldsChanged) {
              const productId = newData?.id || oldData?.id;
              const productName = newData?.name || oldData?.name;
              
              if (productId && productName) {
                console.log(`Product images changed for ${productName} (ID: ${productId})`);
                invalidateCache(productName);
                
                // Dispatch custom event für UI-Updates
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('productImageChange', {
                    detail: { productId, productName, action: 'UPDATE' }
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

// Synchronisationsfunktion für Konsistenz zwischen image_mappings und products
export const syncProductImages = async (productId: number) => {
  try {
    console.log(`🔄 Synchronizing images for product ${productId}...`);
    
    // Lade aktuelle Daten aus beiden Tabellen
    const [mappingResult, productResult] = await Promise.all([
      supabase
        .from('image_mappings')
        .select('seo_slug, is_main_image, image_order')
        .eq('product_id', productId)
        .order('image_order', { ascending: true }),
      supabase
        .from('products')
        .select('image_url, additional_images')
        .eq('id', productId)
        .single()
    ]);
    
    if (mappingResult.error || productResult.error) {
      console.error('Error during sync:', { mappingResult, productResult });
      return false;
    }
    
    const mappingData = mappingResult.data || [];
    const productData = productResult.data;
    
    if (!productData) {
      console.warn(`Product ${productId} not found`);
      return false;
    }
    
    // Erstelle konsistente Bildliste aus image_mappings
    const mappingImages = mappingData.map((item: any) => `/images/${item.seo_slug}`);
    const mainImage = mappingData.find((item: any) => item.is_main_image);
    
    // Aktualisiere products Tabelle basierend auf image_mappings (Single Source of Truth)
    const newImageUrl = mainImage ? `/images/${mainImage.seo_slug}` : (productData.image_url || null);
    const newAdditionalImages = mappingImages.filter((img: string) => img !== newImageUrl);
    
    // Update nur wenn sich etwas geändert hat
    const needsUpdate = 
      productData.image_url !== newImageUrl ||
      JSON.stringify(productData.additional_images || []) !== JSON.stringify(newAdditionalImages);
    
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          image_url: newImageUrl,
          additional_images: newAdditionalImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Error updating product images:', updateError);
        return false;
      }
      
      console.log(`✅ Synchronized images for product ${productId}:`, {
        mainImage: newImageUrl,
        additionalImages: newAdditionalImages.length,
        totalImages: mappingImages.length
      });
      
      // Invalidiere Cache nach Synchronisation
      const productName = `product-${productId}`;
      globalImageCache.invalidate(productName);
      
      return true;
    } else {
      console.log(`✅ Product ${productId} images already in sync`);
      return true;
    }
  } catch (error) {
    console.error('Error in syncProductImages:', error);
    return false;
  }
};

// Globale Cache-Funktionen für direkten Zugriff
export const globalImageCache = {
  invalidate: (productName: string) => {
    const cacheKey = productName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    imageCache.delete(cacheKey);
    console.log(`Global cache invalidated for ${productName}`);
  },
  clear: () => {
    imageCache.clear();
    console.log('Global image cache cleared');
  },
  sync: syncProductImages
};