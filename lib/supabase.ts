import { createClient } from '@supabase/supabase-js'

// Supabase-Konfiguration für Entwicklung und Produktion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validierung der Umgebungsvariablen
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Umgebungsvariablen fehlen. Bitte .env.local Datei überprüfen.')
}

// Supabase Client erstellen mit verbesserten Optionen
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

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