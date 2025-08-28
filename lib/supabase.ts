import { createClient } from '@supabase/supabase-js'

// Singleton-Pattern für Supabase-Client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Supabase-Konfiguration für Entwicklung und Produktion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmxhamdyrjuxwnskgfka.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk'

// Validierung der Umgebungsvariablen
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Umgebungsvariablen fehlen. Bitte .env.local Datei überprüfen.')
}

// Verbesserte Fehlerbehandlung für Produktionsumgebung
const isProduction = process.env.NODE_ENV === 'production'

// Connection Pool für bessere Performance
const connectionPool = new Map<string, any>();

// Singleton-Funktion, um sicherzustellen, dass nur eine Instanz existiert
const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  // Supabase Client erstellen mit Performance-Optimierungen
  supabaseInstance = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Aggressive Session-Caching
        storageKey: 'brennholzkoenig-auth'
      },
      global: {
        headers: {
          'X-Client-Info': 'brennholzkoenig-website',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'Connection': 'keep-alive'
        },
      },
      // Optimierte Realtime-Einstellungen
      realtime: {
        timeout: 15000, // Reduziert auf 15 Sekunden
        heartbeatIntervalMs: 15000, // 15 Sekunden Heartbeat
        reconnectAfterMs: (tries: number) => Math.min(tries * 500, 5000), // Schnellere Reconnects
        params: {
          eventsPerSecond: 50, // Erhöht für bessere Performance
          log_level: isProduction ? 'error' : 'info'
        }
      }
    }
  );
  
  // Performance-Monitoring für Queries
  if (!isProduction && typeof window !== 'undefined') {
    console.log('Supabase Client initialized with performance monitoring');
  }
  
  return supabaseInstance;
};

// Exportiere eine einzige Instanz des Supabase-Clients
export const supabase = getSupabaseClient();

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