import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Ungültige Subscription-Daten' },
        { status: 400 }
      );
    }

    // Deaktiviere Subscription (soft delete)
    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('endpoint', subscription.endpoint);

    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json(
        { error: 'Fehler beim Abmelden der Push-Benachrichtigungen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Push-Benachrichtigungen erfolgreich deaktiviert'
    });

  } catch (error) {
    console.error('Error in push-unsubscribe:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}