import { createClient } from '@supabase/supabase-js'

// Supabase-Konfiguration für Entwicklung und Produktion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmxhamdyrjuxwnskgfka.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RG-WtLPeFpt7cQGOXUIbsw_i87cO71q'

// Logging für Debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Umgebung:', process.env.NODE_ENV);

// Validierung der URL-Pattern
if (!supabaseUrl.includes('supabase.co')) {
  console.warn('Supabase URL Pattern nicht erkannt, verwende Fallback')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

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