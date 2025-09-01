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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'E-Mail-Parameter erforderlich' 
      }, { status: 400 })
    }
    
    console.log('🔍 API Admin check for:', email)
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Admin-Berechtigung prüfen
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, role, is_active')
      .eq('email', email.trim().toLowerCase())
      .eq('is_active', true)
      .single()
    
    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Admin check error:', adminError.message)
      return NextResponse.json({ 
        success: false, 
        error: 'Fehler bei der Admin-Prüfung' 
      }, { status: 500 })
    }
    
    if (!adminData) {
      console.log('⚠️ No admin access found for:', email)
      return NextResponse.json({ 
        success: false, 
        admin: null,
        message: 'Kein Admin-Zugang gefunden'
      })
    }
    
    console.log('✅ Admin access confirmed for:', adminData.email)
    
    return NextResponse.json({ 
      success: true, 
      admin: adminData
    })
    
  } catch (error: any) {
    console.error('💥 API Admin check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server-Fehler bei der Admin-Prüfung' 
    }, { status: 500 })
  }
}