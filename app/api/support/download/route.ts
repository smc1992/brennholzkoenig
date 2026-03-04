import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Attachment-Details abrufen
    const { data: attachment, error: attachmentError } = await supabase
      .from('ticket_attachments')
      .select(`
        *,
        support_tickets!inner(
          id,
          customer_id
        )
      `)
      .eq('id', attachmentId)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: 'Datei nicht gefunden' },
        { status: 404 }
      );
    }

    // Berechtigung prüfen
    let hasPermission = false;

    // Admin-Berechtigung (vereinfacht - in Produktion sollte echte Admin-Prüfung erfolgen)
    if (user.email?.includes('@admin.') || user.email?.includes('@brennholzkoenig.')) {
      hasPermission = true;
    } else {
      // Kunden-Berechtigung: Nur eigene Tickets
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customer && customer.id === (attachment.support_tickets as any).customer_id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Datei' },
        { status: 403 }
      );
    }

    // Datei-Pfad prüfen und lesen
    const filePath = attachment.storage_path;
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Datei nicht auf dem Server gefunden' },
        { status: 404 }
      );
    }

    try {
      const fileBuffer = await readFile(filePath);
      
      // Content-Type basierend auf Dateityp setzen
      const headers = new Headers();
      headers.set('Content-Type', attachment.file_type || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
      headers.set('Content-Length', attachment.file_size.toString());
      headers.set('Cache-Control', 'private, max-age=3600');

      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });

    } catch (fileError) {
      console.error('Fehler beim Lesen der Datei:', fileError);
      return NextResponse.json(
        { error: 'Fehler beim Lesen der Datei' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// HEAD-Request für Datei-Informationen ohne Download
export async function HEAD(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return new NextResponse(null, { status: 400 });
    }

    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse(null, { status: 401 });
    }

    // Attachment-Details abrufen
    const { data: attachment, error: attachmentError } = await supabase
      .from('ticket_attachments')
      .select(`
        file_name,
        file_size,
        file_type,
        storage_path,
        support_tickets!inner(
          customer_id
        )
      `)
      .eq('id', attachmentId)
      .single();

    if (attachmentError || !attachment) {
      return new NextResponse(null, { status: 404 });
    }

    // Berechtigung prüfen (gleiche Logik wie GET)
    let hasPermission = false;

    if (user.email?.includes('@admin.') || user.email?.includes('@brennholzkoenig.')) {
      hasPermission = true;
    } else {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customer && customer.id === (attachment.support_tickets as any).customer_id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return new NextResponse(null, { status: 403 });
    }

    // Datei existiert?
    if (!existsSync(attachment.storage_path)) {
      return new NextResponse(null, { status: 404 });
    }

    // Headers für HEAD-Response
    const headers = new Headers();
    headers.set('Content-Type', attachment.file_type || 'application/octet-stream');
    headers.set('Content-Length', attachment.file_size.toString());
    headers.set('Last-Modified', new Date().toUTCString());
    headers.set('Cache-Control', 'private, max-age=3600');

    return new NextResponse(null, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}