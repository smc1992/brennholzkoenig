import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// SSR Supabase Client für Server-Side Authentication
function getSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Überprüfe Admin-Berechtigung
async function checkAdminPermission(supabase: any, userEmail: string) {
  console.log('🔍 Checking admin permission for email:', userEmail);
  
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', userEmail)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('❌ Admin check error:', error);
    return false;
  }

  if (!adminUser) {
    console.log('❌ No admin user found for email:', userEmail);
    return false;
  }

  console.log('✅ Admin user found:', adminUser.name, adminUser.role);
  return true;
}

// DELETE - Lösche eine Städte-Seite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Hole die Session über SSR
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: 'Ungültige Authentifizierung' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Überprüfe Admin-Berechtigung
    if (!user.email) {
      return NextResponse.json(
        { error: 'Keine E-Mail-Adresse gefunden' },
        { status: 401 }
      );
    }

    const isAdmin = await checkAdminPermission(supabase, user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Keine Admin-Berechtigung' },
        { status: 403 }
      );
    }

    console.log('🗑️ Admin-Benutzer', user.email, 'versucht Städte-Seite zu löschen mit ID:', id);

    // Verwende RPC-Funktion für Admin-Löschung oder direktes SQL
    const { data, error } = await supabase.rpc('admin_delete_city_page', { page_id: id });

    if (error) {
      console.error('❌ Fehler beim Löschen über RPC:', error);
      
      // Fallback: Versuche direktes DELETE (funktioniert nur wenn RLS-Policy es erlaubt)
      const { data: deleteData, error: deleteError } = await supabase
        .from('city_pages')
        .delete()
        .eq('id', id)
        .select();

      if (deleteError) {
        console.error('❌ Auch direktes DELETE fehlgeschlagen:', deleteError);
        return NextResponse.json(
          { error: 'Fehler beim Löschen der Städte-Seite: ' + deleteError.message },
          { status: 500 }
        );
      }

      console.log('✅ Erfolgreich über direktes DELETE gelöscht:', deleteData);
      return NextResponse.json(
        { message: 'Städte-Seite erfolgreich gelöscht' },
        { status: 200 }
      );
    }

    console.log('✅ Erfolgreich über RPC gelöscht:', data);

    return NextResponse.json(
      { message: 'Städte-Seite erfolgreich gelöscht' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return NextResponse.json(
      { error: 'Unerwarteter Fehler beim Löschen der Städte-Seite' },
      { status: 500 }
    );
  }
}

// POST - Erstelle eine neue Städte-Seite
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Hole die Session über SSR
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: 'Ungültige Authentifizierung' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Überprüfe Admin-Berechtigung
    if (!user.email) {
      return NextResponse.json(
        { error: 'Keine E-Mail-Adresse gefunden' },
        { status: 401 }
      );
    }

    const isAdmin = await checkAdminPermission(supabase, user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Keine Admin-Berechtigung' },
        { status: 403 }
      );
    }

    const pageData = await request.json();

    const { data, error } = await supabase
      .from('city_pages')
      .insert([pageData])
      .select();

    if (error) {
      console.error('❌ Fehler beim Erstellen der Städte-Seite:', error);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Städte-Seite: ' + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('❌ Keine Daten nach dem Erstellen erhalten');
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Städte-Seite' },
        { status: 500 }
      );
    }

    console.log('✅ Städte-Seite erfolgreich erstellt:', data[0]);
    return NextResponse.json(data[0], { status: 201 });

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return NextResponse.json(
      { error: 'Unerwarteter Fehler beim Erstellen der Städte-Seite' },
      { status: 500 }
    );
  }
}

// PUT - Aktualisiere eine Städte-Seite
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Hole die Session über SSR
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: 'Ungültige Authentifizierung' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Überprüfe Admin-Berechtigung
    if (!user.email) {
      return NextResponse.json(
        { error: 'Keine E-Mail-Adresse gefunden' },
        { status: 401 }
      );
    }

    const isAdmin = await checkAdminPermission(supabase, user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Keine Admin-Berechtigung' },
        { status: 403 }
      );
    }

    const { id, ...pageData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('city_pages')
      .update(pageData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Fehler beim Aktualisieren der Städte-Seite:', error);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Städte-Seite: ' + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('❌ Keine Städte-Seite mit ID gefunden:', id);
      return NextResponse.json(
        { error: 'Städte-Seite nicht gefunden' },
        { status: 404 }
      );
    }

    console.log('✅ Städte-Seite erfolgreich aktualisiert:', data[0]);
    return NextResponse.json(data[0], { status: 200 });

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return NextResponse.json(
      { error: 'Unerwarteter Fehler beim Aktualisieren der Städte-Seite' },
      { status: 500 }
    );
  }
}

// GET - Lade alle Städte-Seiten (für Admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Hole die Session über SSR
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: 'Ungültige Authentifizierung' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Überprüfe Admin-Berechtigung
    if (!user.email) {
      return NextResponse.json(
        { error: 'Keine E-Mail-Adresse gefunden' },
        { status: 401 }
      );
    }

    const isAdmin = await checkAdminPermission(supabase, user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Keine Admin-Berechtigung' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('city_pages')
      .select('*')
      .order('city_name');

    if (error) {
      console.error('Fehler beim Laden der Städte-Seiten:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Städte-Seiten: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return NextResponse.json(
      { error: 'Unerwarteter Fehler beim Laden der Städte-Seiten' },
      { status: 500 }
    );
  }
}