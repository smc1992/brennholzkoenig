'use client';
import { QueryClient } from '@tanstack/react-query';

// Optimierte Query Client Konfiguration für Performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache für 5 Minuten (statische Daten wie Produkte)
      staleTime: 5 * 60 * 1000, // 5 Minuten
      gcTime: 10 * 60 * 1000, // 10 Minuten (früher cacheTime)
      
      // Retry-Strategie
      retry: (failureCount, error: any) => {
        // Keine Retries bei 404 oder Auth-Fehlern
        if (error?.status === 404 || error?.status === 401) {
          return false;
        }
        // Maximal 3 Retries für andere Fehler
        return failureCount < 3;
      },
      
      // Retry-Delay mit exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background-Updates aktivieren
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // Prefetching-Strategien
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry für Mutations
      retry: 1,
      retryDelay: 1000,
    },
  },
});

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