'use client';
import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Optimierte Query Client Konfiguration für Performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressiveres Caching für bessere Performance
      staleTime: 10 * 60 * 1000, // 10 Minuten (erhöht von 5)
      gcTime: 30 * 60 * 1000, // 30 Minuten (erhöht von 10)
      
      // Optimierte Retry-Strategie
      retry: (failureCount, error: any) => {
        // Keine Retries bei 404, 401 oder 403
        if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Maximal 2 Retries für bessere Performance
        return failureCount < 2;
      },
      
      // Schnellere Retry-Delays
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
      
      // Optimierte Background-Updates
      refetchOnWindowFocus: false, // Deaktiviert für bessere Performance
      refetchOnReconnect: true,
      
      // Intelligenteres Refetching
      refetchOnMount: (query) => {
        // Nur refetch wenn Daten älter als 5 Minuten
        return (Date.now() - (query.state.dataUpdatedAt || 0)) > 5 * 60 * 1000;
      },
      
      // Network Mode für bessere Offline-Unterstützung
       networkMode: 'offlineFirst'
    },
    mutations: {
      // Optimierte Mutation-Einstellungen
       retry: 2,
       retryDelay: 500
    },
  },
});

// Prefetch wird nach queryKeys-Definition ausgeführt

// Query Keys für konsistente Caching-Strategien
export const queryKeys = {
  // Produkte
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.products.details(), id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
  },
  
  // Bestellungen
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), { filters }] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.orders.details(), id] as const,
  },
  
  // Kunden
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.customers.lists(), { filters }] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
  
  // Einstellungen
  settings: {
    all: ['settings'] as const,
    shop: () => [...queryKeys.settings.all, 'shop'] as const,
    pricing: () => [...queryKeys.settings.all, 'pricing'] as const,
    shipping: () => [...queryKeys.settings.all, 'shipping'] as const,
  },
  
  // Blog
  blog: {
    all: ['blog'] as const,
    posts: () => [...queryKeys.blog.all, 'posts'] as const,
    post: (slug: string) => [...queryKeys.blog.all, 'post', slug] as const,
    categories: () => [...queryKeys.blog.all, 'categories'] as const,
  },
  
  // Content Management
  content: {
    all: ['content'] as const,
    page: (page: string) => [...queryKeys.content.all, 'page', page] as const,
    section: (page: string, section: string) => [...queryKeys.content.all, 'section', page, section] as const,
  },
} as const;

// Cache-Invalidierung Utilities
export const invalidateQueries = {
  products: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  customers: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  settings: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
  blog: () => queryClient.invalidateQueries({ queryKey: queryKeys.blog.all }),
  content: () => queryClient.invalidateQueries({ queryKey: queryKeys.content.all }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetching Utilities
export const prefetchQueries = {
  products: () => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.lists(),
      staleTime: 5 * 60 * 1000, // 5 Minuten
    });
  },
  
  settings: () => {
    return Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.settings.shop(),
        staleTime: 10 * 60 * 1000, // 10 Minuten für Einstellungen
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.settings.pricing(),
        staleTime: 10 * 60 * 1000,
      }),
    ]);
  },
};

// Performance Monitoring
export const performanceMonitor = {
  logQueryPerformance: (queryKey: string[], duration: number) => {
    console.log(`Query ${queryKey.join('.')} took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryKey.join('.')} took ${duration}ms`);
    }
  },
  
  logCacheHit: (queryKey: string[]) => {
    console.log(`Cache hit: ${queryKey.join('.')}`);
  },
  
  logCacheMiss: (queryKey: string[]) => {
    console.log(`Cache miss: ${queryKey.join('.')}`);
  },
};

// Prefetch kritische Daten beim App-Start
if (typeof window !== 'undefined') {
  // Prefetch Produkte mit konsistenten Query Keys
  queryClient.prefetchQuery({
    queryKey: queryKeys.products.list({ active: true }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('content_type', 'product')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('id', { ascending: true })
        .limit(50);
      
      if (error) {
        console.error('Prefetch products error:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
  
  // Prefetch Shop-Einstellungen
  queryClient.prefetchQuery({
    queryKey: queryKeys.settings.shop(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Prefetch settings error:', error);
        return null;
      }
      return data;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}