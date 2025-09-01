import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Performance-optimierter Server-side Supabase Client
export const createServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Server-side braucht keine Session-Persistierung
      autoRefreshToken: false, // Server-side Auto-Refresh deaktivieren
      detectSessionInUrl: false, // Server-side URL-Detection deaktivieren
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Client-Info': 'brennholzkoenig-admin-server'
      },
      // Server-side Fetch-Optimierungen
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          // Timeout für Server-side Requests
          signal: AbortSignal.timeout(10000),
          // Keep-alive für bessere Performance
          keepalive: true
        })
      }
    },
    // Realtime für Server-side deaktivieren
    realtime: {
      timeout: 5000,
      params: {
        eventsPerSecond: 1,
        log_level: 'error'
      }
    }
  })
}

// Performance-optimierte Admin-Queries
export const adminQueries = {
  // Server-side optimierte Admin-Stats
  getAdminStats: async () => {
    const supabase = createServerSupabase()
    const startTime = Date.now()
    
    try {
      // Parallele Abfragen für bessere Performance
      const [productsCount, ordersCount, categoriesCount] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('product_categories').select('id', { count: 'exact', head: true })
      ])
      
      const duration = Date.now() - startTime
      console.log(`📊 Admin stats loaded in ${duration.toFixed(0)}ms`)
      
      return {
        products: productsCount.count || 0,
        orders: ordersCount.count || 0,
        categories: categoriesCount.count || 0,
        loadTime: duration
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error)
      return {
        products: 0,
        orders: 0,
        categories: 0,
        loadTime: Date.now() - startTime,
        error: 'Failed to load stats'
      }
    }
  },
  
  // Batch-Datenabfrage für Dashboard
  getBatchData: async () => {
    const supabase = createServerSupabase()
    const startTime = Date.now()
    
    try {
      // Alle Dashboard-Daten parallel laden
      const [recentProducts, recentOrders, categories] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('orders')
          .select('id, customer_name, total_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('product_categories')
          .select('id, name, color')
          .eq('is_active', true)
          .order('sort_order')
      ])
      
      const duration = Date.now() - startTime
      console.log(`📦 Batch data loaded in ${duration.toFixed(0)}ms`)
      
      return {
        recentProducts: recentProducts.data || [],
        recentOrders: recentOrders.data || [],
        categories: categories.data || [],
        loadTime: duration
      }
    } catch (error) {
      console.error('Failed to load batch data:', error)
      return {
        recentProducts: [],
        recentOrders: [],
        categories: [],
        loadTime: Date.now() - startTime,
        error: 'Failed to load data'
      }
    }
  },
  
  // Optimierte Admin-User-Validierung
  validateAdminUser: async (email: string) => {
    const supabase = createServerSupabase()
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, is_active, last_login')
        .eq('email', email)
        .eq('is_active', true)
        .single()
      
      const duration = Date.now() - startTime
      
      if (duration > 500) {
        console.warn(`⚠️ Slow admin validation: ${duration.toFixed(0)}ms`)
      }
      
      return {
        user: data,
        error,
        loadTime: duration
      }
    } catch (error) {
      return {
        user: null,
        error,
        loadTime: Date.now() - startTime
      }
    }
  }
}

// Performance-Monitoring für Server-side Queries
export class ServerPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()
  
  static trackQuery(queryName: string, duration: number) {
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, [])
    }
    
    const values = this.metrics.get(queryName)!
    values.push(duration)
    
    // Nur die letzten 50 Werte behalten
    if (values.length > 50) {
      values.shift()
    }
    
    // Warnung bei langsamen Queries
    if (duration > 1000) {
      console.warn(`🐌 Slow server query '${queryName}': ${duration.toFixed(0)}ms`)
    }
  }
  
  static getAverageTime(queryName: string): number {
    const values = this.metrics.get(queryName) || []
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }
  
  static getPerformanceReport() {
    const report: Record<string, { avg: number, count: number, max: number }> = {}
    
    for (const [queryName, values] of this.metrics.entries()) {
      if (values.length > 0) {
        report[queryName] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
          max: Math.max(...values)
        }
      }
    }
    
    return report
  }
}