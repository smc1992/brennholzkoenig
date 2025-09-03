import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Build-safe Supabase Client-Erstellung
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    // Return a mock client for build-time
    return {
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
      storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }) }) }
    } as any;
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

function createSupabaseLegacyClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    return {
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
      storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }) }) }
    } as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 0
      }
    },
    global: {
       headers: {
         'X-Client-Info': 'brennholz-admin',
         'Content-Type': 'application/json',
         'Accept': 'application/json',
         'apikey': supabaseAnonKey
       },
       fetch: (url, options = {}) => {
         const safariOptions = {
           ...options,
           headers: {
             'Content-Type': 'application/json',
             'Accept': 'application/json',
             'apikey': supabaseAnonKey,
             ...options.headers
           },
           mode: 'cors' as RequestMode,
           credentials: 'same-origin' as RequestCredentials,
           cache: 'no-cache' as RequestCache,
           signal: AbortSignal.timeout(30000)
         }
         
         console.log('🍎 Safari-optimized fetch with API key:', url, safariOptions)
         
         return fetch(url, safariOptions)
           .catch(error => {
             console.error('🍎 Safari fetch error:', error)
             throw error
           })
      }
     }
  });
}

// Lazy-loaded exports für Kompatibilität
export const supabase = createSupabaseClient();
export const supabaseLegacy = createSupabaseLegacyClient();
export const supabaseSafari = supabase;

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          description: string
          price: number
          image_url: string
          category: string
          stock_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description: string
          price: number
          image_url: string
          category: string
          stock_quantity: number
        }
        Update: {
          name?: string
          description?: string
          price?: number
          image_url?: string
          category?: string
          stock_quantity?: number
        }
      }
      orders: {
        Row: {
          id: number
          customer_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          total_amount: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          customer_id?: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          total_amount: number
          status?: string
        }
        Update: {
          customer_id?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          total_amount?: number
          status?: string
        }
      }
      customers: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
        }
        Update: {
          email?: string
          name?: string
          phone?: string | null
        }
      }
    }
  }
}