import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Performance-optimierte Middleware für Admin-Authentifizierung
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Nur für Admin-Routen
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Performance-optimierte Session-Prüfung mit Timeout
    const startTime = Date.now()
    
    try {
      // Safari-kompatible direkte Session-Abfrage
      const { data: { session }, error } = await supabase.auth.getSession()
      const authDuration = Date.now() - startTime
      
      // Performance-Logging für langsame Auth-Checks
      if (authDuration > 1000) {
        console.warn(`⚠️ Slow auth check: ${authDuration.toFixed(0)}ms`)
      } else {
        console.log(`✅ Fast auth check: ${authDuration.toFixed(0)}ms`)
      }
      
      // Redirect zu Login wenn keine Session
      if (!session && req.nextUrl.pathname !== '/admin/login') {
        const loginUrl = new URL('/admin/login', req.url)
        return NextResponse.redirect(loginUrl)
      }
      
      // Admin-Berechtigung prüfen (nur wenn Session vorhanden)
      if (session && req.nextUrl.pathname !== '/admin/login') {
        const adminStartTime = Date.now()
        
        try {
          // Safari-kompatible direkte Admin-Abfrage
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('id, email, is_active')
            .eq('email', session.user.email)
            .eq('is_active', true)
            .single()
          const adminDuration = Date.now() - adminStartTime
          
          if (adminDuration > 500) {
            console.warn(`⚠️ Slow admin check: ${adminDuration.toFixed(0)}ms`)
          }
          
          // Redirect zu Login wenn kein Admin-Zugang
          if (adminError || !adminData) {
            const loginUrl = new URL('/admin/login', req.url)
            return NextResponse.redirect(loginUrl)
          }
          
        } catch (adminError) {
          console.error('Admin check failed:', adminError)
          const loginUrl = new URL('/admin/login', req.url)
          return NextResponse.redirect(loginUrl)
        }
      }
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      
      // Bei Timeout oder Fehler zu Login weiterleiten
      if (req.nextUrl.pathname !== '/admin/login') {
        const loginUrl = new URL('/admin/login', req.url)
        return NextResponse.redirect(loginUrl)
      }
    }
  }
  
  return res
}

// Middleware nur für Admin-Routen aktivieren, aber Login-Seite ausschließen
export const config = {
  matcher: [
    '/admin/((?!login).*)'
  ]
}