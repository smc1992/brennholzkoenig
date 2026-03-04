'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  queryTime: number;
  cacheHits: number;
  cacheMisses: number;
  totalQueries: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    queryTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalQueries: 0,
  };
  
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  
  trackQuery(duration: number, fromCache: boolean) {
    this.metrics.totalQueries++;
    this.metrics.queryTime += duration;
    
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    this.notifyObservers();
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected: ${duration}ms`);
    }
    
    // Log cache performance
    if (process.env.NODE_ENV === 'development') {
      const cacheHitRate = (this.metrics.cacheHits / this.metrics.totalQueries) * 100;
      console.log(`📊 Cache hit rate: ${cacheHitRate.toFixed(1)}%`);
    }
  }
  
  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }
  
  private notifyObservers() {
    this.observers.forEach(callback => callback({ ...this.metrics }));
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  getAverageQueryTime(): number {
    return this.metrics.totalQueries > 0 
      ? this.metrics.queryTime / this.metrics.totalQueries 
      : 0;
  }
  
  getCacheHitRate(): number {
    return this.metrics.totalQueries > 0 
      ? (this.metrics.cacheHits / this.metrics.totalQueries) * 100 
      : 0;
  }
  
  reset() {
    this.metrics = {
      queryTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalQueries: 0,
    };
    this.notifyObservers();
  }
}

// Singleton Performance Tracker
export const performanceTracker = new PerformanceTracker();

// Performance Monitor Component
export default function PerformanceMonitor() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Monitor Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = entry.startTime;
            if (lcp > 2500) {
              console.warn(`🐌 Poor LCP: ${lcp}ms (should be < 2500ms)`);
            } else if (lcp > 1200) {
              console.log(`⚠️ Fair LCP: ${lcp}ms (should be < 1200ms)`);
            } else {
              console.log(`✅ Good LCP: ${lcp}ms`);
            }
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }
      
      // First Input Delay (FID) - approximation
      const handleFirstInput = (event: Event) => {
        const fid = performance.now() - (event as any).timeStamp;
        if (fid > 100) {
          console.warn(`🐌 Poor FID: ${fid}ms (should be < 100ms)`);
        } else {
          console.log(`✅ Good FID: ${fid}ms`);
        }
        
        // Remove listener after first input
        ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
          document.removeEventListener(type, handleFirstInput, true);
        });
      };
      
      ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
        document.addEventListener(type, handleFirstInput, { once: true, capture: true });
      });
      
      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0.25) {
          console.warn(`🐌 Poor CLS: ${clsValue} (should be < 0.1)`);
        } else if (clsValue > 0.1) {
          console.log(`⚠️ Fair CLS: ${clsValue} (should be < 0.1)`);
        } else {
          console.log(`✅ Good CLS: ${clsValue}`);
        }
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
      
      return () => {
        observer.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);
  
  useEffect(() => {
    // Monitor React Query Cache Performance
    const cache = queryClient.getQueryCache();
    
    const unsubscribe = cache.subscribe((event) => {
      if (event?.type === 'observerResultsUpdated') {
        const query = event.query;
        const state = query.state;
        
        // Track query performance
        if (state.dataUpdatedAt && state.dataUpdatedAt > 0) {
          const duration = Date.now() - state.dataUpdatedAt;
          const fromCache = state.status === 'success';
          
          performanceTracker.trackQuery(duration, fromCache);
        }
      }
    });
    
    return unsubscribe;
  }, [queryClient]);
  
  // Development-only performance display
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white text-xs p-2 rounded z-50">
        <div>Avg Query: {performanceTracker.getAverageQueryTime().toFixed(0)}ms</div>
        <div>Cache Hit: {performanceTracker.getCacheHitRate().toFixed(1)}%</div>
        <div>Total Queries: {performanceTracker.getMetrics().totalQueries}</div>
      </div>
    );
  }
  
  return null;
}

// Hook for accessing performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    queryTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalQueries: 0,
  });
  
  useEffect(() => {
    const unsubscribe = performanceTracker.subscribe(setMetrics);
    setMetrics(performanceTracker.getMetrics());
    return unsubscribe;
  }, []);
  
  return {
    metrics,
    averageQueryTime: performanceTracker.getAverageQueryTime(),
    cacheHitRate: performanceTracker.getCacheHitRate(),
    reset: performanceTracker.reset.bind(performanceTracker),
  };
}