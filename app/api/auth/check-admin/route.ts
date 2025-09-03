import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    console.warn('Supabase environment variables not configured for app-api-auth-check-admin-route route');
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

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
    // Supabase Client zur Laufzeit erstellen
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabaseAdmin) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'E-Mail-Parameter erforderlich' 
      }, { status: 400 })
    }
    
    console.log('🔍 API Admin check for:', email)
    
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