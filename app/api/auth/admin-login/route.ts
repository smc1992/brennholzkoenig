import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Runtime-Konfiguration für Node.js Kompatibilität
export const runtime = 'nodejs';

// Verhindert Pre-rendering während des Builds
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Supabase Admin Client wird zur Laufzeit erstellt
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase environment variables not configured for app-api-auth-admin-login-route route');
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

// Supabase SSR-kompatible Admin-Client-Erstellung
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // Service Role Client für Admin-Operationen
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// SSR-kompatible Session-Verwaltung
function getSupabaseSSR() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.warn('Cookie setting failed in API route:', error)
          }
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabaseAdmin) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'E-Mail und Passwort sind erforderlich' 
      }, { status: 400 })
    }
    
    console.log('🔐 API Admin Login attempt for:', email)
    
    const supabaseAdmin = getSupabaseAdmin()
    const supabaseSSR = getSupabaseSSR()
    
    // Erste Authentifizierung mit SSR-Client für Session-Management
    const { data: authData, error: authError } = await supabaseSSR.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })
    
    if (authError || !authData.user) {
      console.error('❌ API Auth failed:', authError?.message)
      return NextResponse.json({ 
        success: false, 
        error: 'Ungültige Anmeldedaten' 
      }, { status: 401 })
    }
    
    // Admin-Berechtigung prüfen
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, role, is_active')
      .eq('email', email.trim().toLowerCase())
      .eq('is_active', true)
      .single()
    
    if (adminError || !adminData) {
      console.error('❌ Admin check failed:', adminError?.message)
      await supabaseAdmin.auth.signOut()
      return NextResponse.json({ 
        success: false, 
        error: 'Kein Admin-Zugang für diese E-Mail-Adresse' 
      }, { status: 403 })
    }
    
    console.log('✅ API Admin login successful for:', adminData.email)
    
    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      session: authData.session,
      admin: adminData
    })
    
  } catch (error: any) {
    console.error('💥 API Admin login error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server-Fehler bei der Anmeldung' 
    }, { status: 500 })
  }
}