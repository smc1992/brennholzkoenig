import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

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

    const { ticketId, rating, feedback } = await request.json();

    if (!ticketId || !rating) {
      return NextResponse.json(
        { error: 'Ticket-ID und Bewertung sind erforderlich' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Bewertung muss zwischen 1 und 5 liegen' },
        { status: 400 }
      );
    }

    // Prüfen ob Ticket existiert und dem Benutzer gehört
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, customer_id, status')
      .eq('id', ticketId)
      .eq('customer_id', customer.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    // Nur geschlossene oder gelöste Tickets können bewertet werden
    if (!['resolved', 'closed'].includes(ticket.status)) {
      return NextResponse.json(
        { error: 'Nur abgeschlossene Tickets können bewertet werden' },
        { status: 400 }
      );
    }

    // Bewertung speichern (UPSERT für den Fall einer Aktualisierung)
    const { data: ticketRating, error } = await supabase
      .from('ticket_ratings')
      .upsert({
        ticket_id: ticketId,
        customer_id: customer.id,
        rating,
        feedback: feedback || null
      }, {
        onConflict: 'ticket_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Bewertung' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rating: {
        id: ticketRating.id,
        ticketId: ticketRating.ticket_id,
        rating: ticketRating.rating,
        feedback: ticketRating.feedback,
        createdAt: ticketRating.created_at
      }
    });

  } catch (error) {
    console.error('Create rating error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const adminView = searchParams.get('admin') === 'true';

    if (ticketId) {
      // Einzelne Bewertung abrufen
      const { data: rating, error } = await supabase
        .from('ticket_ratings')
        .select('*')
        .eq('ticket_id', ticketId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Fehler beim Laden der Bewertung' },
          { status: 500 }
        );
      }

      return NextResponse.json({ rating: rating || null });
    }

    if (adminView) {
      // Admin-Übersicht: Alle Bewertungen mit Statistiken
      const { data: ratings, error } = await supabase
        .from('ticket_ratings')
        .select(`
          *,
          support_tickets!inner(
            id,
            subject,
            category,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Fehler beim Laden der Bewertungen' },
          { status: 500 }
        );
      }

      // Statistiken berechnen
      const totalRatings = ratings?.length || 0;
      const averageRating = totalRatings > 0 
        ? ratings!.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;
      
      const ratingDistribution = {
        1: ratings?.filter(r => r.rating === 1).length || 0,
        2: ratings?.filter(r => r.rating === 2).length || 0,
        3: ratings?.filter(r => r.rating === 3).length || 0,
        4: ratings?.filter(r => r.rating === 4).length || 0,
        5: ratings?.filter(r => r.rating === 5).length || 0
      };

      return NextResponse.json({
        ratings,
        statistics: {
          totalRatings,
          averageRating: Math.round(averageRating * 100) / 100,
          ratingDistribution
        }
      });
    }

    return NextResponse.json(
      { error: 'Ticket-ID oder Admin-Parameter erforderlich' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get ratings error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}