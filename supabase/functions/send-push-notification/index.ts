import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body, url, icon, actions, users, type = 'general' } = await req.json()

    // Supabase Client initialisieren
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Push-Einstellungen laden
    const { data: pushSettings } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_type', 'push_settings')
      .single()

    if (!pushSettings) {
      throw new Error('Push-Benachrichtigungen sind nicht konfiguriert')
    }

    const settings = JSON.parse(pushSettings.setting_value)

    if (!settings.is_enabled || !settings.vapid_public_key || !settings.vapid_private_key) {
      throw new Error('Push-Benachrichtigungen sind nicht vollständig konfiguriert')
    }

    // Push-Subscriptions abrufen
    let subscriptionsQuery = supabase
      .from('push_subscriptions')
      .select('*')

    // Wenn spezifische Benutzer angegeben sind
    if (users && users.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in('user_id', users)
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery

    if (subscriptionsError) {
      throw new Error('Fehler beim Abrufen der Push-Subscriptions: ' + subscriptionsError.message)
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Keine aktiven Push-Subscriptions gefunden',
          sent: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Web Push Library importieren
    let webpush
    try {
      webpush = await import('https://esm.sh/web-push@3.6.6')
    } catch (error) {
      console.error('Web-push import error:', error)
      throw new Error('Web-push Bibliothek konnte nicht geladen werden')
    }

    // VAPID-Details setzen
    webpush.setVapidDetails(
      'mailto:info@brennholzkoenig.de',
      settings.vapid_public_key,
      settings.vapid_private_key
    )

    // Payload erstellen
    const payload = JSON.stringify({
      title: title || 'Brennholzkönig',
      body: body || 'Neue Benachrichtigung',
      icon: icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      url: url || '/',
      tag: type,
      requireInteraction: type === 'order_update' || type === 'stock_alert',
      actions: actions || [
        {
          action: 'view',
          title: 'Anzeigen'
        },
        {
          action: 'dismiss',
          title: 'Schließen'
        }
      ],
      data: {
        type: type,
        timestamp: Date.now(),
        url: url || '/'
      }
    })

    let sentCount = 0
    let failedCount = 0
    const results = []

    // Push-Benachrichtigungen an alle Subscriptions senden
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = JSON.parse(subscription.subscription_data)
        
        await webpush.sendNotification(pushSubscription, payload)
        
        sentCount++
        results.push({ 
          subscription_id: subscription.id, 
          status: 'sent' 
        })
        
        // Erfolgreich gesendet - Update der letzten Verwendung
        await supabase
          .from('push_subscriptions')
          .update({ last_used: new Date().toISOString() })
          .eq('id', subscription.id)
          
      } catch (error) {
        failedCount++
        results.push({ 
          subscription_id: subscription.id, 
          status: 'failed',
          error: error.message 
        })
        
        // Bei 410 (Gone) - Subscription entfernen
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id)
        }
      }
    }

    // Analytics Event protokollieren
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'push_notification_sent',
        event_data: {
          type: type,
          title: title,
          sent_count: sentCount,
          failed_count: failedCount,
          total_subscriptions: subscriptions.length,
          timestamp: new Date().toISOString()
        },
        user_id: null,
        session_id: null
      })

    // Push-Benachrichtigung in Datenbank speichern für Verlauf
    await supabase
      .from('push_notifications')
      .insert({
        title: title,
        body: body,
        type: type,
        payload: payload,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push-Benachrichtigungen gesendet: ${sentCount} erfolgreich, ${failedCount} fehlgeschlagen`,
        sent: sentCount,
        failed: failedCount,
        total: subscriptions.length,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Push-Benachrichtigung Fehler:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Fehler beim Senden der Push-Benachrichtigung'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})