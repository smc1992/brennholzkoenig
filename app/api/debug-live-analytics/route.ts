import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Live Analytics Check gestartet');

    // Environment-Informationen sammeln
    const environmentInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      url: request.url
    };

    console.log('Environment Info:', environmentInfo);

    // Supabase-Verbindung testen
    let supabaseStatus = 'UNKNOWN';
    let trackingConfig = null;
    let supabaseError = null;

    try {
      const supabase = createServerSupabase();
      
      // Test Supabase-Verbindung
      const { data: testData, error: testError } = await supabase
        .from('app_settings')
        .select('count')
        .limit(1);

      if (testError) {
        supabaseStatus = 'ERROR';
        supabaseError = testError.message;
      } else {
        supabaseStatus = 'CONNECTED';
        
        // Lade Tracking-Konfiguration
        const { data: configData, error: configError } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_type', 'tracking_config')
          .eq('setting_key', 'main')
          .single();

        if (configError && configError.code !== 'PGRST116') {
          console.error('Error loading tracking config:', configError);
          trackingConfig = { error: configError.message };
        } else {
          trackingConfig = configData ? JSON.parse(configData.setting_value) : {
            google_analytics_id: '',
            google_tag_manager_id: '',
            facebook_pixel_id: '',
            google_analytics_enabled: false,
            google_tag_manager_enabled: false,
            facebook_pixel_enabled: false,
            tracking_active: false
          };
        }
      }
    } catch (error) {
      supabaseStatus = 'EXCEPTION';
      supabaseError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Supabase connection error:', error);
    }

    // Simuliere Cookie-Einwilligung für Test
    const testCookieConsent = {
      timestamp: new Date().toISOString(),
      preferences: {
        functional: true,
        analytics: true,
        marketing: false
      }
    };

    // Prüfe alle Bedingungen für Google Analytics
    const analyticsChecks = {
      supabaseConnected: supabaseStatus === 'CONNECTED',
      trackingConfigExists: trackingConfig && !trackingConfig.error,
      trackingActive: trackingConfig?.tracking_active || false,
      googleAnalyticsEnabled: trackingConfig?.google_analytics_enabled || false,
      googleAnalyticsId: trackingConfig?.google_analytics_id || '',
      googleAnalyticsIdValid: trackingConfig?.google_analytics_id && trackingConfig.google_analytics_id !== 'GA_MEASUREMENT_ID',
      cookieConsentAnalytics: testCookieConsent.preferences.analytics,
      allConditionsMet: false
    };

    analyticsChecks.allConditionsMet = 
      analyticsChecks.supabaseConnected &&
      analyticsChecks.trackingConfigExists &&
      analyticsChecks.trackingActive &&
      analyticsChecks.googleAnalyticsEnabled &&
      analyticsChecks.googleAnalyticsIdValid &&
      analyticsChecks.cookieConsentAnalytics;

    const result = {
      success: true,
      environment: environmentInfo,
      supabase: {
        status: supabaseStatus,
        error: supabaseError
      },
      trackingConfig,
      testCookieConsent,
      analyticsChecks,
      message: analyticsChecks.allConditionsMet 
        ? '✅ Google Analytics sollte auf der Live-Domain geladen werden' 
        : '❌ Google Analytics wird nicht geladen - siehe analyticsChecks für Details',
      recommendations: [] as string[]
    };

    // Empfehlungen basierend auf den Checks
    if (!analyticsChecks.supabaseConnected) {
      result.recommendations.push('Supabase-Verbindung prüfen - Environment-Variablen korrekt?');
    }
    if (!analyticsChecks.trackingConfigExists) {
      result.recommendations.push('Tracking-Konfiguration in der Datenbank erstellen');
    }
    if (!analyticsChecks.trackingActive) {
      result.recommendations.push('Tracking in den Admin-Einstellungen aktivieren');
    }
    if (!analyticsChecks.googleAnalyticsEnabled) {
      result.recommendations.push('Google Analytics in den Admin-Einstellungen aktivieren');
    }
    if (!analyticsChecks.googleAnalyticsIdValid) {
      result.recommendations.push('Gültige Google Analytics ID in den Admin-Einstellungen eingeben');
    }

    console.log('Debug Live Analytics Result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Debug Live Analytics Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Fehler beim Debuggen der Live Analytics'
    }, { status: 500 });
  }
}