import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization für Build-Kompatibilität
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'E-Mail und Passwort sind erforderlich' 
      }, { status: 400 })
    }
    
    console.log('🔐 API Admin Login attempt for:', email)
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Server-Side Authentifizierung mit Service Role
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
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