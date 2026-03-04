import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import webpush from 'web-push';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: {
    url?: string;
    timestamp?: number;
    type?: string;
    [key: string]: any;
  };
}

interface SendNotificationRequest {
  title: string;
  message: string;
  target_audience: 'all' | 'active' | 'specific';
  target_subscriptions?: string[];
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at?: string;
  notification_type?: string;
  url?: string;
  image?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const notificationRequest: SendNotificationRequest = await request.json();

    // Validierung
    if (!notificationRequest.title || !notificationRequest.message) {
      return NextResponse.json(
        { error: 'Titel und Nachricht sind erforderlich' },
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
        { error: 'Push-Benachrichtigungen sind nicht aktiviert' },
        { status: 500 }
      );
    }

    // Konfiguriere web-push
    webpush.setVapidDetails(
      'mailto:admin@brennholzkoenig.de',
      config.vapidPublicKey,
      config.vapidPrivateKey
    );

    // Erstelle Notification-Eintrag in der Datenbank
    const { data: notificationData, error: notificationError } = await supabase
      .from('push_notifications')
      .insert({
        title: notificationRequest.title,
        body: notificationRequest.message,
        notification_type: notificationRequest.notification_type || 'general',
        target_audience: notificationRequest.target_audience,
        schedule_type: notificationRequest.schedule_type,
        scheduled_at: notificationRequest.scheduled_at || new Date().toISOString(),
        sent_at: notificationRequest.schedule_type === 'immediate' ? new Date().toISOString() : null,
        sent_count: 0,
        failed_count: 0,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Benachrichtigung' },
        { status: 500 }
      );
    }

    // Wenn geplant, speichere nur und sende später
    if (notificationRequest.schedule_type === 'scheduled') {
      return NextResponse.json({
        success: true,
        message: 'Benachrichtigung wurde geplant',
        notificationId: notificationData.id,
        scheduledAt: notificationRequest.scheduled_at
      });
    }

    // Lade Ziel-Subscriptions
    let subscriptionsQuery = supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh_key, auth_key')
      .eq('is_active', true);

    if (notificationRequest.target_audience === 'specific' && notificationRequest.target_subscriptions) {
      subscriptionsQuery = subscriptionsQuery.in('id', notificationRequest.target_subscriptions);
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

    if (subscriptionsError) {
      console.error('Error loading subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Keine aktiven Subscriptions gefunden' },
        { status: 404 }
      );
    }

    // Erstelle Notification-Payload
    const payload: NotificationPayload = {
      title: notificationRequest.title,
      body: notificationRequest.message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      image: notificationRequest.image,
      tag: `notification-${notificationData.id}`,
      requireInteraction: false,
      actions: notificationRequest.actions || [
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
        url: notificationRequest.url || '/',
        timestamp: Date.now(),
        type: notificationRequest.notification_type || 'general',
        notificationId: notificationData.id
      }
    };

    // Sende Benachrichtigungen
    let sentCount = 0;
    let failedCount = 0;
    const failedSubscriptions: string[] = [];

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          },
          JSON.stringify(payload),
          {
            TTL: config.ttl || 86400,
            urgency: 'normal'
          }
        );

        sentCount++;
        
        // Update last_used für erfolgreiche Subscription
        await supabase
          .from('push_subscriptions')
          .update({ last_used: new Date().toISOString() })
          .eq('id', subscription.id);

      } catch (error: any) {
        console.error(`Error sending to subscription ${subscription.id}:`, error);
        failedCount++;
        failedSubscriptions.push(subscription.id);

        // Behandle 410 Gone (Subscription expired)
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({
              is_active: false,
              error_message: 'Subscription expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
        }
      }
    });

    // Warte auf alle Send-Versuche
    await Promise.allSettled(sendPromises);

    // Update Notification-Statistiken
    await supabase
      .from('push_notifications')
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationData.id);

    return NextResponse.json({
      success: true,
      message: 'Benachrichtigungen gesendet',
      notificationId: notificationData.id,
      statistics: {
        total: subscriptions.length,
        sent: sentCount,
        failed: failedCount,
        failedSubscriptions
      }
    });

  } catch (error) {
    console.error('Error in push-notifications:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// GET-Methode für das Abrufen von Benachrichtigungen
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: notifications, error } = await supabase
      .from('push_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error loading notifications:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Benachrichtigungen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        limit,
        offset,
        total: notifications?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in push-notifications GET:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}