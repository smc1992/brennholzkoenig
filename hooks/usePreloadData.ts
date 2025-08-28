'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';

// Hook für das Preloading kritischer Daten
export const usePreloadData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const preloadCriticalData = async () => {
      try {
        // Preload Produkte (nur aktive)
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
              .limit(20); // Nur die ersten 20 für bessere Performance
            
            if (error) throw error;
            return data || [];
          },
          staleTime: 10 * 60 * 1000, // 10 Minuten
        });

        // Preload Blog-Posts (neueste)
        queryClient.prefetchQuery({
          queryKey: queryKeys.blog.posts(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from('page_contents')
              .select('*')
              .eq('content_type', 'blog_post')
              .eq('status', 'published')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(10); // Nur die neuesten 10
            
            if (error) throw error;
            return data || [];
          },
          staleTime: 5 * 60 * 1000, // 5 Minuten
        });

        // Preload Shop-Einstellungen
        queryClient.prefetchQuery({
          queryKey: queryKeys.settings.shop(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from('shop_settings')
              .select('*')
              .single();
            
            if (error && error.code !== 'PGRST116') throw error; // Ignoriere "not found"
            return data || {};
          },
          staleTime: 15 * 60 * 1000, // 15 Minuten
        });

        console.log('Critical data preloaded successfully');
      } catch (error) {
        console.warn('Failed to preload some data:', error);
      }
    };

    // Preload nur im Browser und wenn noch nicht geladen
    if (typeof window !== 'undefined') {
      // Sofortiges Preload für bessere Performance
      preloadCriticalData();
    }
  }, [queryClient]);
};

// Hook für das Prefetching von Seiten-spezifischen Daten
export const usePrefetchPageData = (page: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchPageData = async () => {
      try {
        switch (page) {
          case 'shop':
            // Prefetch alle Produkte für Shop-Seite
            queryClient.prefetchQuery({
              queryKey: queryKeys.products.all,
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('page_contents')
                  .select('*')
                  .eq('content_type', 'product')
                  .eq('status', 'published')
                  .eq('is_active', true)
                  .order('id', { ascending: true });
                
                if (error) throw error;
                return data || [];
              },
              staleTime: 10 * 60 * 1000,
            });
            break;

          case 'blog':
            // Prefetch alle Blog-Posts für Blog-Seite
            queryClient.prefetchQuery({
              queryKey: queryKeys.blog.all,
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('page_contents')
                  .select('*')
                  .eq('content_type', 'blog_post')
                  .eq('status', 'published')
                  .eq('is_active', true)
                  .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
              },
              staleTime: 5 * 60 * 1000,
            });
            break;

          default:
            // Prefetch Seiten-spezifische Inhalte
            queryClient.prefetchQuery({
              queryKey: queryKeys.content.page(page),
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('page_contents')
                  .select('*')
                  .eq('page', page)
                  .eq('status', 'published')
                  .eq('is_active', true);
                
                if (error) throw error;
                return data || [];
              },
              staleTime: 10 * 60 * 1000,
            });
            break;
        }
      } catch (error) {
        console.warn(`Failed to prefetch data for page ${page}:`, error);
      }
    };

    if (typeof window !== 'undefined') {
      // Sofortiges Prefetch für bessere Performance
      prefetchPageData();
    }
  }, [page, queryClient]);
};

// Hook für das Invalidieren von Caches bei Datenänderungen
export const useInvalidateOnUpdate = () => {
  const queryClient = useQueryClient();

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  };

  const invalidateBlog = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.blog.all });
  };

  const invalidateSettings = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  return {
    invalidateProducts,
    invalidateBlog,
    invalidateSettings,
    invalidateAll,
  };
};