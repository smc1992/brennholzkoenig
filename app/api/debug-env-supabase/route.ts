import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[ENV-SUPABASE] Debug-Test für Umgebungsvariablen und Supabase gestartet');
    
    // 1. Umgebungsvariablen-Status
    const envStatus = {
      // SMTP Umgebungsvariablen
      smtp: {
        EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || 'not set',
        EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || 'not set',
        EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || 'not set',
        EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD ? 'set' : 'not set',
        EMAIL_FROM: process.env.EMAIL_FROM || 'not set'
      },
      // Supabase Umgebungsvariablen
      supabase: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set'
      },
      // System
      system: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL || 'not detected',
        COOLIFY: process.env.COOLIFY || 'not detected',
        RAILWAY: process.env.RAILWAY_ENVIRONMENT || 'not detected'
      }
    };
    
    // 2. Supabase-Verbindungstest
    const supabaseTest = await testSupabaseConnection();
    
    // 3. SMTP-Einstellungen-Test
    const smtpSettingsTest = await testSMTPSettings();
    
    // 4. E-Mail-Service-Test
    const emailServiceTest = await testEmailService();
    
    return NextResponse.json({
      success: true,
      message: 'Umgebungsvariablen und Supabase-Diagnose abgeschlossen',
      data: {
        environment_variables: envStatus,
        supabase_connection: supabaseTest,
        smtp_settings: smtpSettingsTest,
        email_service: emailServiceTest,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[ENV-SUPABASE] Fehler:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Umgebungsvariablen/Supabase-Test fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

async function testSupabaseConnection() {
  try {
    console.log('[ENV-SUPABASE] Teste Supabase-Verbindung');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Supabase-Umgebungsvariablen fehlen',
        missing: {
          url: !process.env.NEXT_PUBLIC_SUPABASE_URL,
          service_key: !process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      };
    }
    
    // Supabase-Client erstellen
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Einfache Verbindungstest
    const { data, error } = await supabase
      .from('app_settings')
      .select('count')
      .limit(1);
    
    if (error) {
      return {
        success: false,
        error: 'Supabase-Verbindung fehlgeschlagen',
        details: error.message
      };
    }
    
    return {
      success: true,
      message: 'Supabase-Verbindung erfolgreich',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...'
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: 'Supabase-Test-Fehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

async function testSMTPSettings() {
  try {
    console.log('[ENV-SUPABASE] Teste SMTP-Einstellungen aus Supabase');
    
    // Supabase-Client erstellen
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // SMTP-Konfiguration laden
    const { data: smtpConfig, error: smtpError } = await supabase
      .from('app_settings')
      .select('setting_type, setting_key, setting_value')
      .eq('setting_type', 'smtp_config')
      .single();
    
    if (smtpError) {
      return {
        success: false,
        error: 'SMTP-Konfiguration nicht gefunden',
        details: smtpError.message
      };
    }
    
    if (!smtpConfig?.setting_value) {
      return {
        success: false,
        error: 'SMTP-Konfiguration leer'
      };
    }
    
    try {
      const config = JSON.parse(smtpConfig.setting_value);
      return {
        success: true,
        message: 'SMTP-Konfiguration aus Supabase geladen',
        config: {
          host: config.smtp_host,
          port: config.smtp_port,
          secure: config.smtp_secure,
          username: config.smtp_username ? config.smtp_username.substring(0, 3) + '***' : 'not set',
          from_email: config.smtp_from_email
        }
      };
    } catch (parseError) {
      return {
        success: false,
        error: 'SMTP-Konfiguration JSON-Parsing fehlgeschlagen',
        raw_value: smtpConfig.setting_value.substring(0, 100) + '...'
      };
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: 'SMTP-Einstellungen-Test fehlgeschlagen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

async function testEmailService() {
  try {
    console.log('[ENV-SUPABASE] Teste E-Mail-Service-Konfiguration');
    
    // E-Mail-Service laden
    const { loadSMTPSettings } = await import('@/lib/emailService');
    
    const settings = await loadSMTPSettings();
    
    if (!settings) {
      return {
        success: false,
        error: 'E-Mail-Service konnte keine SMTP-Einstellungen laden'
      };
    }
    
    // Bestimme Quelle der Einstellungen
    let source = 'unknown';
    if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
      source = 'environment_variables';
    } else {
      source = 'supabase_database';
    }
    
    return {
      success: true,
      message: 'E-Mail-Service-Konfiguration geladen',
      source: source,
      settings: {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        username: settings.smtp_username ? settings.smtp_username.substring(0, 3) + '***' : 'not set',
        from_email: settings.smtp_from_email
      }
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: 'E-Mail-Service-Test fehlgeschlagen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Umgebungsvariablen und Supabase-Diagnose',
    usage: 'GET /api/debug-env-supabase',
    description: 'Testet Umgebungsvariablen, Supabase-Verbindung und SMTP-Einstellungen'
  });
}