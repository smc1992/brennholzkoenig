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
    const { email, name, role } = await request.json()
    
    console.log('🔧 Creating admin user:', { email, name, role })
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Prüfe ob Admin bereits existiert
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin)
      return NextResponse.json({ 
        success: true, 
        message: 'Admin user already exists',
        admin: existingAdmin 
      })
    }
    
    // Erstelle neuen Admin-Benutzer
    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: email,
        name: name || 'Admin',
        role: role || 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating admin:', createError)
      return NextResponse.json({ 
        success: false, 
        error: createError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Admin user created successfully:', newAdmin)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      admin: newAdmin 
    })
    
  } catch (error: any) {
    console.error('💥 Error in create-admin API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email parameter required' 
      }, { status: 400 })
    }
    
    console.log('🔍 Checking admin user:', email)
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Prüfe Admin-Benutzer
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking admin:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    if (!admin) {
      console.log('⚠️ Admin user not found:', email)
      return NextResponse.json({ 
        success: false, 
        message: 'Admin user not found',
        admin: null 
      })
    }
    
    console.log('✅ Admin user found:', admin)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin user found',
      admin: admin 
    })
    
  } catch (error: any) {
    console.error('💥 Error in check-admin API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}