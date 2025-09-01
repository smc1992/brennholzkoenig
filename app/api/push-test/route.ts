import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import webpush from 'web-push';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { subscription, title, body, url } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Ungültige Subscription-Daten' },
        { status: 400 }
      );
    }

    // Lade Push-Konfiguration
    const { data: configData, error: configError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_type', 'push_config')
      .eq('setting_key', 'main')
      .single();

    if (configError || !configData) {
      return NextResponse.json(
        { error: 'Push-Konfiguration nicht gefunden' },
        { status: 500 }
      );
    }

    const config = JSON.parse(configData.setting_value);

    if (!config.enabled || !config.vapidPublicKey || !config.vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Push-Benachrichtigungen sind nicht konfiguriert' },
        { status: 500 }
      );
    }

    // Konfiguriere web-push
    webpush.setVapidDetails(
      'mailto:admin@brennholzkoenig.de',
      config.vapidPublicKey,
      config.vapidPrivateKey
    );

    // Erstelle Notification-Payload
    const payload = JSON.stringify({
      title: title || 'Test-Benachrichtigung',
      body: body || 'Dies ist eine Test-Benachrichtigung von Brennholzkönig.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Öffnen'
        },
        {
          action: 'close',
          title: 'Schließen'
        }
      ],
      data: {
        url: url || '/',
        timestamp: Date.now(),
        type: 'test'
      }
    });

    // Sende Push-Benachrichtigung
    try {
      const result = await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        },
        payload,
        {
          TTL: config.ttl || 86400,
          urgency: 'normal'
        }
      );

      console.log('Test notification sent successfully:', result);

      // Logge die gesendete Benachrichtigung
      await supabase
        .from('push_notifications')
        .insert({
          title: title || 'Test-Benachrichtigung',
          body: body || 'Dies ist eine Test-Benachrichtigung von Brennholzkönig.',
          sent_at: new Date().toISOString(),
          sent_count: 1,
          failed_count: 0,
          notification_type: 'test',
          target_audience: 'single',
          created_at: new Date().toISOString()
        });

      return NextResponse.json({
        success: true,
        message: 'Test-Benachrichtigung erfolgreich gesendet'
      });

    } catch (pushError: any) {
      console.error('Error sending push notification:', pushError);
      
      // Behandle verschiedene Fehlertypen
      if (pushError.statusCode === 410) {
        // Subscription ist nicht mehr gültig
        await supabase
          .from('push_subscriptions')
          .update({
            is_active: false,
            error_message: 'Subscription expired',
            updated_at: new Date().toISOString()
          })
          .eq('endpoint', subscription.endpoint);

        return NextResponse.json(
          { error: 'Subscription ist nicht mehr gültig' },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: 'Fehler beim Senden der Push-Benachrichtigung' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in push-test:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}