import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ticketId = formData.get('ticketId') as string;
    const messageId = formData.get('messageId') as string;
    const uploaderType = formData.get('uploaderType') as string; // 'customer' oder 'admin'

    if (!file || !ticketId || !uploaderType) {
      return NextResponse.json(
        { error: 'Datei, Ticket-ID und Uploader-Typ sind erforderlich' },
        { status: 400 }
      );
    }

    // Datei-Validierung
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datei ist zu groß (max. 10MB)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Dateityp nicht erlaubt' },
        { status: 400 }
      );
    }

    // Ticket-Berechtigung prüfen
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, customer_id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket nicht gefunden' },
        { status: 404 }
      );
    }

    // Berechtigung prüfen (Kunde kann nur eigene Tickets, Admin alle)
    if (uploaderType === 'customer') {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customer || customer.id !== ticket.customer_id) {
        return NextResponse.json(
          { error: 'Keine Berechtigung für dieses Ticket' },
          { status: 403 }
        );
      }
    }

    // Eindeutigen Dateinamen generieren
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'support', ticketId);
    const filePath = join(uploadDir, uniqueFileName);
    const publicUrl = `/uploads/support/${ticketId}/${uniqueFileName}`;

    // Upload-Verzeichnis erstellen
    await mkdir(uploadDir, { recursive: true });

    // Datei speichern
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Attachment in Datenbank speichern
    const { data: attachment, error: dbError } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        message_id: messageId || null,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: publicUrl,
        storage_path: filePath,
        uploaded_by_type: uploaderType,
        uploaded_by_id: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Fehler beim Speichern in der Datenbank' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.file_name,
        fileSize: attachment.file_size,
        fileType: attachment.file_type,
        fileUrl: attachment.file_url,
        createdAt: attachment.created_at
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// GET-Route für Attachment-Liste
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const messageId = searchParams.get('messageId');

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket-ID ist erforderlich' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (messageId) {
      query = query.eq('message_id', messageId);
    }

    const { data: attachments, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Anhänge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachments });

  } catch (error) {
    console.error('Get attachments error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// DELETE-Route für Attachment-Löschung
export async function DELETE(request: NextRequest) {
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

    // Attachment aus Datenbank löschen
    const { error } = await supabase
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Fehler beim Löschen des Anhangs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete attachment error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}