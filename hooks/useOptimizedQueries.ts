'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, performanceMonitor } from '@/lib/queryClient';

// Optimierte Produkt-Queries mit verbessertem Caching und Timeout
export const useProducts = (filters?: { category?: string; active?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters || {}),
    queryFn: async ({ signal }) => {
      const startTime = performance.now();
      
      // AbortController für Timeout (7 Sekunden)
      const timeoutId = setTimeout(() => {
        if (!signal?.aborted) {
          console.warn('Products query timeout after 7s');
        }
      }, 7000);
      
      try {
        // Verwende page_contents Tabelle mit gezielten Spalten
        let query = supabase
          .from('page_contents')
          .select('id, title, content, category, is_active, status, created_at, updated_at, meta_data')
          .eq('content_type', 'product')
          .eq('status', 'published')
          .order('id', { ascending: true })
          .limit(50); // Pagination: max 50 Items
        
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }
        
        if (filters?.active !== undefined) {
          query = query.eq('is_active', filters.active);
        } else {
          // Standard: nur aktive Produkte
          query = query.eq('is_active', true);
        }
        
        const { data, error } = await query;
        
        clearTimeout(timeoutId);
        const duration = performance.now() - startTime;
        performanceMonitor.logQueryPerformance(['products', 'list'], duration);
        
        if (error) {
          console.error('Products query error:', {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details
          });
          throw error;
        }
        
        return data || [];
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Failed to fetch products:', error);
        // Fallback zu leerer Liste statt Fehler
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 Minuten
    gcTime: 20 * 60 * 1000, // 20 Minuten (größer als staleTime)
    retry: (failureCount, error: any) => {
      // Keine Retries bei 404, 401, 403
      if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 3; // Max 3 Retries
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000), // 1s, 2s, 4s, 8s
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst',
  });
};

// Einzelnes Produkt mit Caching und Timeout
export const useProduct = (id: string | number) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async ({ signal }) => {
      const startTime = performance.now();
      
      // Timeout für einzelne Produkte (5 Sekunden)
      const timeoutId = setTimeout(() => {
        if (!signal?.aborted) {
          console.warn(`Product ${id} query timeout after 5s`);
        }
      }, 5000);
      
      try {
        // Versuche zuerst page_contents, dann products als Fallback
        let data, error;
        
        // Primär: page_contents Tabelle
         const pageContentResult = await supabase
           .from('page_contents')
           .select('id, title, content, category, is_active, status, created_at, updated_at, meta_data')
           .eq('content_type', 'product')
           .eq('id', id)
           .eq('is_active', true)
           .eq('status', 'published')
           .single();
         
         if (pageContentResult.data) {
           data = pageContentResult.data;
           error = null;
         } else {
           // Fallback: products Tabelle
           const productResult = await supabase
             .from('products')
             .select('id, name, description, price, image_url, category, stock_quantity, unit, is_active, created_at, updated_at')
             .eq('id', id)
             .eq('is_active', true)
             .single();
          
          data = productResult.data;
          error = productResult.error;
        }
        
        clearTimeout(timeoutId);
        const duration = performance.now() - startTime;
        performanceMonitor.logQueryPerformance(['products', 'detail'], duration);
        
        if (error) {
          console.error('Product query error:', {
            code: error.code,
            message: error.message,
            hint: error.hint,
            productId: id
          });
          throw error;
        }
        
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Failed to fetch product ${id}:`, error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 Minuten für einzelne Produkte
    gcTime: 20 * 60 * 1000, // 20 Minuten
    enabled: !!id,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false; // Produkt existiert nicht
      return failureCount < 2; // Max 2 Retries für einzelne Produkte
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000), // 500ms, 1s, 2s
  });
};

// Produkt-Kategorien mit langem Cache
export const useProductCategories = () => {
  return useQuery({
    queryKey: queryKeys.products.categories(),
    queryFn: async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      const duration = performance.now() - startTime;
      performanceMonitor.logQueryPerformance(['products', 'categories'], duration);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 Minuten - Kategorien ändern sich selten
    gcTime: 30 * 60 * 1000, // 30 Minuten
  });
};

// Shop-Einstellungen mit sehr langem Cache
export const useShopSettings = () => {
  return useQuery({
    queryKey: queryKeys.settings.shop(),
    queryFn: async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['minimum_order_quantity', 'shipping_cost_standard', 'shipping_cost_express']);
      
      const duration = performance.now() - startTime;
      performanceMonitor.logQueryPerformance(['settings', 'shop'], duration);
      
      if (error) throw error;
      
      // Transformiere zu Object für einfachere Nutzung
      const settings: Record<string, string> = {};
      data?.forEach((item: any) => {
        settings[item.setting_key] = item.setting_value;
      });
      
      return {
        minOrderQuantity: parseInt(settings.minimum_order_quantity) || 3,
        shippingCosts: {
          standard: parseFloat(settings.shipping_cost_standard) || 43.5,
          express: parseFloat(settings.shipping_cost_express) || 139,
        },
      };
    },
    staleTime: 30 * 60 * 1000, // 30 Minuten - Einstellungen ändern sich sehr selten
    gcTime: 60 * 60 * 1000, // 1 Stunde
  });
};

// Preisstaffeln mit Cache
export const usePricingTiers = () => {
  return useQuery({
    queryKey: queryKeys.settings.pricing(),
    queryFn: async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('min_quantity', { ascending: true });
      
      const duration = performance.now() - startTime;
      performanceMonitor.logQueryPerformance(['settings', 'pricing'], duration);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 Minuten
    gcTime: 30 * 60 * 1000, // 30 Minuten
  });
};

// Blog-Posts mit Pagination
export const useBlogPosts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: [...queryKeys.blog.posts(), { page, limit }],
    queryFn: async () => {
      const startTime = performance.now();
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await supabase
        .from('page_contents')
        .select('*', { count: 'exact' })
        .eq('page', 'blog')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      const duration = performance.now() - startTime;
      performanceMonitor.logQueryPerformance(['blog', 'posts'], duration);
      
      if (error) throw error;
      
      return {
        posts: data || [],
        totalCount: count || 0,
        hasMore: (count || 0) > page * limit,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 Minuten
    placeholderData: (previousData) => previousData, // Für smooth pagination
  });
};

// Einzelner Blog-Post
export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.blog.post(slug),
    queryFn: async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('page', 'blog')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      const duration = performance.now() - startTime;
      performanceMonitor.logQueryPerformance(['blog', 'post'], duration);
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 Minuten
    enabled: !!slug,
  });
};

// Content Management für Seiten
export const usePageContent = (page: string, section?: string) => {
  const queryKey = section 
    ? queryKeys.content.section(page, section)
    : queryKeys.content.page(page);
    
  return useQuery({
    queryKey,
    queryFn: async () => {
      const startTime = performance.now();
      
      let query = supabase
        .from('page_contents')
        .select('*')
        .eq('page', page)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (section) {
        query = query.eq('section', section);
      }
      
      const { data, error } = await query;
      
      const duration = performance.now() - startTime;
      performanceMonitor.logQueryPerformance(['content', page], duration);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 Minuten - Content ändert sich selten
    gcTime: 30 * 60 * 1000, // 30 Minuten
  });
};

// Optimierte Mutation für Produkt-Updates
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidiere relevante Queries
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      
      // Optimistic Update für bessere UX
      queryClient.setQueryData(queryKeys.products.detail(data.id as number), data);
    },
  });
};

// Prefetching Hook für kritische Daten
export const usePrefetchCriticalData = () => {
  const queryClient = useQueryClient();
  
  const prefetchProducts = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.lists(),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchSettings = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.settings.shop(),
      staleTime: 30 * 60 * 1000,
    });
  };
  
  const prefetchCategories = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.categories(),
      staleTime: 15 * 60 * 1000,
    });
  };
  
  return {
    prefetchProducts,
    prefetchSettings,
    prefetchCategories,
    prefetchAll: () => {
      prefetchProducts();
      prefetchSettings();
      prefetchCategories();
    },
  };
};