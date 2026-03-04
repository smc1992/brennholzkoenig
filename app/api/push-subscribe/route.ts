import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { subscription, userAgent, timestamp } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Ungültige Subscription-Daten' },
        { status: 400 }
      );
    }

    // Prüfe ob Subscription bereits existiert
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh_key: subscription.keys?.p256dh || '',
          auth_key: subscription.keys?.auth || '',
          user_agent: userAgent || '',
          last_used: new Date().toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('endpoint', subscription.endpoint);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren der Subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription erfolgreich aktualisiert',
        subscriptionId: existingSubscription.id
      });
    }

    // Erstelle neue Subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys?.p256dh || '',
        auth_key: subscription.keys?.auth || '',
        user_agent: userAgent || '',
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        is_active: true
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating subscription:', insertError);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription erfolgreich erstellt',
      subscriptionId: newSubscription.id
    });

  } catch (error) {
    console.error('Error in push-subscribe:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}