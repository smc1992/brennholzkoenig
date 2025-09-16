import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/emailService';

interface EmailNotificationRequest {
  ticketId: string;
  newStatus?: string;
  type: 'status_change' | 'new_message' | 'ticket_created' | 'ticket_resolved';
  messageContent?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { ticketId, newStatus, type, messageContent }: EmailNotificationRequest = await request.json();

    if (!ticketId || !type) {
      return NextResponse.json(
        { error: 'Ticket-ID und Typ sind erforderlich' },
        { status: 400 }
      );
    }

    // Ticket-Details mit Kunden-Informationen abrufen
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        customers!inner(
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket nicht gefunden' },
        { status: 404 }
      );
    }

    const customer = ticket.customers as any;
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Kunde';
    
    let subject = '';
    let htmlContent = '';
    let textContent = '';

    // Email-Inhalt basierend auf Typ generieren
    switch (type) {
      case 'status_change':
        subject = `Brennholzkönig Support - Status-Update für Ticket #${ticket.ticket_number || ticket.id.substring(0, 8)}`;
        
        const statusLabels: { [key: string]: string } = {
          'open': 'Offen',
          'in_progress': 'In Bearbeitung',
          'resolved': 'Gelöst',
          'closed': 'Geschlossen'
        };
        
        const statusLabel = statusLabels[newStatus || ''] || newStatus;
        
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Brennholzkönig Support</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #374151; margin-bottom: 20px;">Hallo ${customerName},</h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                der Status Ihres Support-Tickets wurde aktualisiert:
              </p>
              
              <div style="background-color: white; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #374151;">${ticket.subject}</h3>
                <p style="margin: 0; color: #6b7280;"><strong>Neuer Status:</strong> ${statusLabel}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Ticket-Nr.:</strong> #${ticket.ticket_number || ticket.id.substring(0, 8)}</p>
              </div>
              
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 30px;">
                Sie können Ihr Ticket jederzeit in Ihrem Kundenkonto einsehen und weitere Nachrichten hinzufügen.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005'}/konto/support" 
                   style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ticket anzeigen
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
                Bei Fragen stehen wir Ihnen gerne zur Verfügung.<br>
                Ihr Brennholzkönig Support-Team
              </p>
            </div>
            
            <div style="background-color: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Brennholzkönig | Premium Brennholz für Ihr Zuhause</p>
            </div>
          </div>
        `;
        
        textContent = `
Hallo ${customerName},

der Status Ihres Support-Tickets wurde aktualisiert:

Ticket: ${ticket.subject}
Neuer Status: ${statusLabel}
Ticket-Nr.: #${ticket.ticket_number || ticket.id.substring(0, 8)}

Sie können Ihr Ticket jederzeit in Ihrem Kundenkonto einsehen:
${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005'}/konto/support

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Ihr Brennholzkönig Support-Team
        `;
        break;

      case 'new_message':
        subject = `Brennholzkönig Support - Neue Nachricht für Ticket #${ticket.ticket_number || ticket.id.substring(0, 8)}`;
        
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Brennholzkönig Support</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #374151; margin-bottom: 20px;">Hallo ${customerName},</h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                Sie haben eine neue Nachricht zu Ihrem Support-Ticket erhalten:
              </p>
              
              <div style="background-color: white; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #374151;">${ticket.subject}</h3>
                <p style="margin: 0; color: #6b7280;"><strong>Ticket-Nr.:</strong> #${ticket.ticket_number || ticket.id.substring(0, 8)}</p>
                ${messageContent ? `<div style="margin-top: 15px; padding: 15px; background-color: #f3f4f6; border-radius: 6px;"><p style="margin: 0; color: #374151;">${messageContent}</p></div>` : ''}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005'}/konto/support" 
                   style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Antworten
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
                Ihr Brennholzkönig Support-Team
              </p>
            </div>
            
            <div style="background-color: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Brennholzkönig | Premium Brennholz für Ihr Zuhause</p>
            </div>
          </div>
        `;
        
        textContent = `
Hallo ${customerName},

Sie haben eine neue Nachricht zu Ihrem Support-Ticket erhalten:

Ticket: ${ticket.subject}
Ticket-Nr.: #${ticket.ticket_number || ticket.id.substring(0, 8)}

${messageContent ? `Nachricht: ${messageContent}` : ''}

Antworten Sie hier: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005'}/konto/support

Ihr Brennholzkönig Support-Team
        `;
        break;

      default:
        return NextResponse.json(
          { error: 'Unbekannter Benachrichtigungstyp' },
          { status: 400 }
        );
    }

    // Email senden
    try {
      await sendEmail({
        to: customer.email,
        subject,
        html: htmlContent,
        text: textContent
      });

      // Log der Email-Benachrichtigung in Datenbank speichern
      await supabase
        .from('email_logs')
        .insert({
          recipient: customer.email,
          subject,
          type: 'support_notification',
          status: 'sent',
          ticket_id: ticketId,
          sent_at: new Date().toISOString()
        });

      return NextResponse.json({ success: true });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Fehler-Log in Datenbank speichern
      await supabase
        .from('email_logs')
        .insert({
          recipient: customer.email,
          subject,
          type: 'support_notification',
          status: 'failed',
          error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
          ticket_id: ticketId,
          sent_at: new Date().toISOString()
        });

      return NextResponse.json(
        { error: 'Fehler beim Senden der Email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}