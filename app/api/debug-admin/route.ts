import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Debug Admin API called');
    
    // 1. Prüfe Supabase-Verbindung
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      return Response.json({
        success: false,
        step: 'connection_test',
        error: connectionError.message,
        details: connectionError
      });
    }
    
    // 2. Prüfe ob admin_users Tabelle existiert
    const { data: adminUsersTest, error: adminUsersError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    if (adminUsersError) {
      return Response.json({
        success: false,
        step: 'admin_users_table_check',
        error: adminUsersError.message,
        details: adminUsersError,
        suggestion: 'admin_users Tabelle existiert möglicherweise nicht'
      });
    }
    
    // 3. Prüfe aktuelle Session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // 4. Zähle admin_users
    const { data: adminCount, error: countError } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact' });
    
    return Response.json({
      success: true,
      checks: {
        supabase_connection: connectionTest ? 'OK' : 'FAILED',
        admin_users_table: adminUsersTest !== null ? 'EXISTS' : 'NOT_FOUND',
        session_check: session ? 'ACTIVE_SESSION' : 'NO_SESSION',
        admin_users_count: adminCount?.length || 0
      },
      session_info: {
        user_id: session?.user?.id || null,
        email: session?.user?.email || null,
        expires_at: session?.expires_at || null
      },
      admin_users: adminCount || [],
      errors: {
        connection: connectionError,
        admin_table: adminUsersError,
        session: sessionError,
        count: countError
      }
    });
    
  } catch (error) {
    console.error('Debug Admin API error:', error);
    return Response.json(
      { 
        success: false, 
        step: 'general_error',
        error: 'Unerwarteter Fehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }, 
      { status: 500 }
    );
  }
}

// POST-Route zum Erstellen der admin_users Tabelle falls sie nicht existiert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'create_admin_table') {
      // Versuche admin_users Tabelle zu erstellen (falls Berechtigung vorhanden)
      const { data, error } = await supabase.rpc('create_admin_users_table');
      
      if (error) {
        return Response.json({
          success: false,
          error: 'Tabelle konnte nicht erstellt werden',
          details: error.message
        });
      }
      
      return Response.json({
        success: true,
        message: 'admin_users Tabelle erstellt'
      });
    }
    
    if (body.action === 'create_test_admin') {
      // Erstelle Test-Admin-User
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          email: 'admin@brennholz-koenig.de',
          name: 'Test Admin',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        return Response.json({
          success: false,
          error: 'Test-Admin konnte nicht erstellt werden',
          details: error.message
        });
      }
      
      return Response.json({
        success: true,
        message: 'Test-Admin erstellt',
        admin: data
      });
    }
    
    return Response.json({
      success: false,
      error: 'Unbekannte Aktion'
    });
    
  } catch (error) {
    return Response.json(
      { 
        success: false, 
        error: 'POST-Fehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }, 
      { status: 500 }
    );
  }
}