import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simuliere Cookie-Einwilligung für Test
    const testCookieConsent = {
      timestamp: new Date().toISOString(),
      preferences: {
        functional: true,
        analytics: true,
        marketing: false
      }
    };

    // Hole Tracking-Konfiguration
    const trackingResponse = await fetch(`${request.nextUrl.origin}/api/tracking-config`);
    const trackingConfig = await trackingResponse.json();

    // Prüfe alle Bedingungen
    const checks = {
      cookieConsent: testCookieConsent.preferences.analytics,
      trackingActive: trackingConfig.tracking_active,
      googleAnalyticsEnabled: trackingConfig.google_analytics_enabled,
      googleAnalyticsId: trackingConfig.google_analytics_id,
      allConditionsMet: testCookieConsent.preferences.analytics && 
                       trackingConfig.tracking_active && 
                       trackingConfig.google_analytics_enabled && 
                       trackingConfig.google_analytics_id
    };

    return NextResponse.json({
      success: true,
      trackingConfig,
      testCookieConsent,
      checks,
      message: checks.allConditionsMet 
        ? 'Google Analytics sollte geladen werden' 
        : 'Google Analytics wird nicht geladen - siehe checks für Details'
    });

  } catch (error) {
    console.error('Test Analytics Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}