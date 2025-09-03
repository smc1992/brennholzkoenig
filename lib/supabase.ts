import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Build-safe Supabase Client-Erstellung
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Only use mock client during build-time (development)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase environment variables not configured for build-time');
      // Return mock client for build-time only
    } else {
      // In production, this should never happen - throw error
      console.error('CRITICAL: Supabase environment variables missing in production!');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'MISSING');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
      throw new Error('Production deployment failed: Supabase configuration missing');
    }
    // Mock client with warnings
       const logMockWarning = (operation: string) => {
         console.warn(`🚫 Mock Supabase: ${operation} operation blocked - configure environment variables`);
       };
     
     return {
       from: (table: string) => ({
         select: (columns?: string) => {
            logMockWarning(`SELECT from ${table}`);
            return {
              eq: (column: string, value: any) => ({
                single: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database connection' } }),
                limit: (count: number) => Promise.resolve({ data: [], error: { message: 'Mock client - no database connection' } }),
                order: (column: string, options?: any) => Promise.resolve({ data: [], error: { message: 'Mock client - no database connection' } })
              }),
              limit: (count: number) => Promise.resolve({ data: [], error: { message: 'Mock client - no database connection' } }),
              order: (column: string, options?: any) => Promise.resolve({ data: [], error: { message: 'Mock client - no database connection' } })
            };
          },
          insert: (values: any) => {
            logMockWarning(`INSERT into ${table}`);
            return Promise.resolve({ data: null, error: { message: 'Mock client - no database connection' } });
          },
          update: (values: any) => {
            logMockWarning(`UPDATE ${table}`);
            return {
              eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Mock client - no database connection' } })
            };
          },
          delete: () => {
            logMockWarning(`DELETE from ${table}`);
            return {
              eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Mock client - no database connection' } })
            };
          }
       }),
      auth: {
        getUser: () => {
          logMockWarning('AUTH getUser');
          return Promise.resolve({ data: { user: null }, error: { message: 'Mock client - no database connection. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY' } });
        },
        getSession: () => {
          logMockWarning('AUTH getSession');
          return Promise.resolve({ data: { session: null }, error: { message: 'Mock client - no database connection' } });
        },
        signInWithPassword: (credentials: any) => {
          logMockWarning('AUTH signInWithPassword');
          return Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Anmeldung nicht möglich - Datenbankverbindung fehlt. Bitte konfigurieren Sie die Supabase-Umgebungsvariablen.' } 
          });
        },
        signUp: (credentials: any) => {
          logMockWarning('AUTH signUp');
          return Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Registrierung nicht möglich - Datenbankverbindung fehlt. Bitte konfigurieren Sie die Supabase-Umgebungsvariablen.' } 
          });
        },
        signOut: () => {
          logMockWarning('AUTH signOut');
          return Promise.resolve({ error: null });
        },
        onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      storage: {
        from: (bucket: string) => ({
          upload: (path: string, file: any, options?: any) => Promise.resolve({ data: null, error: null }),
          download: (path: string) => Promise.resolve({ data: null, error: null }),
          remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
          list: (path?: string, options?: any) => Promise.resolve({ data: [], error: null })
        })
      },
      channel: (name: string, options?: any) => ({
        on: (event: string, filter: any, callback: any) => ({ subscribe: () => Promise.resolve('SUBSCRIBED') }),
        subscribe: () => Promise.resolve('SUBSCRIBED'),
        unsubscribe: () => Promise.resolve('CLOSED')
      }),
      removeChannel: (channel: any) => Promise.resolve('OK'),
      removeAllChannels: () => Promise.resolve('OK')
    } as any;
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

function createSupabaseLegacyClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Only use mock client during build-time (development)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase environment variables not configured for build-time');
      // Return mock client for build-time only
    } else {
      // In production, this should never happen - throw error
      console.error('CRITICAL: Supabase environment variables missing in production!');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'MISSING');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
      throw new Error('Production deployment failed: Supabase configuration missing');
    }
     // Mock client for development only
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            limit: (count: number) => Promise.resolve({ data: [], error: null }),
            order: (column: string, options?: any) => Promise.resolve({ data: [], error: null })
          }),
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          order: (column: string, options?: any) => Promise.resolve({ data: [], error: null })
        }),
        insert: (values: any) => Promise.resolve({ data: null, error: null }),
        update: (values: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
        })
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Mock client - no database connection. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY' } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Mock client - no database connection' } }),
        signInWithPassword: (credentials: any) => Promise.resolve({ 
          data: { user: null, session: null }, 
          error: { message: 'Anmeldung nicht möglich - Datenbankverbindung fehlt. Bitte konfigurieren Sie die Supabase-Umgebungsvariablen.' } 
        }),
        signUp: (credentials: any) => Promise.resolve({ 
          data: { user: null, session: null }, 
          error: { message: 'Registrierung nicht möglich - Datenbankverbindung fehlt. Bitte konfigurieren Sie die Supabase-Umgebungsvariablen.' } 
        }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      storage: {
        from: (bucket: string) => ({
          upload: (path: string, file: any, options?: any) => Promise.resolve({ data: null, error: null }),
          download: (path: string) => Promise.resolve({ data: null, error: null }),
          remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
          list: (path?: string, options?: any) => Promise.resolve({ data: [], error: null })
        })
      },
      channel: (name: string, options?: any) => ({
        on: (event: string, filter: any, callback: any) => ({ subscribe: () => Promise.resolve('SUBSCRIBED') }),
        subscribe: () => Promise.resolve('SUBSCRIBED'),
        unsubscribe: () => Promise.resolve('CLOSED')
      }),
      removeChannel: (channel: any) => Promise.resolve('OK'),
      removeAllChannels: () => Promise.resolve('OK')
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