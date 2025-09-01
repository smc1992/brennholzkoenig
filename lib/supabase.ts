import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Safari-kompatible Supabase-Konfiguration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Safari-Workaround
    flowType: 'pkce'
  },
  // Realtime komplett deaktiviert für Safari-Kompatibilität
  realtime: {
    params: {
      eventsPerSecond: 0
    }
  },
  // Safari-optimierte Fetch-Konfiguration
  global: {
     headers: {
       'X-Client-Info': 'brennholz-admin',
       'Content-Type': 'application/json',
       'Accept': 'application/json',
       'apikey': supabaseAnonKey
     },
     fetch: (url, options = {}) => {
       // Safari-spezifische Fetch-Optimierungen mit korrekten Headers
       const safariOptions = {
         ...options,
         // Safari-kompatible Headers mit API-Key
         headers: {
           'Content-Type': 'application/json',
           'Accept': 'application/json',
           'apikey': supabaseAnonKey,
           ...options.headers
         },
         // Safari-optimierte Einstellungen
         mode: 'cors' as RequestMode,
         credentials: 'same-origin' as RequestCredentials,
         cache: 'no-cache' as RequestCache,
         // Längerer Timeout für Safari
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
})

// Alias für Kompatibilität - verwendet denselben Client
export const supabaseSafari = supabase

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