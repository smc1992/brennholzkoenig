import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[DEBUG-LIVE] Debug-Route aufgerufen');
    
    // Umgebungsinformationen sammeln
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_RUNTIME: process.env.NEXT_RUNTIME,
        PORT: process.env.PORT,
        platform: process.platform,
        nodeVersion: process.version
      },
      smtp: {
        host: process.env.SMTP_HOST || 'not set',
        port: process.env.SMTP_PORT || 'not set',
        user: process.env.SMTP_USER || 'not set',
        enabled: process.env.SMTP_ENABLED || 'not set'
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set'
      },
      deployment: {
        vercel: !!process.env.VERCEL,
        netlify: !!process.env.NETLIFY,
        railway: !!process.env.RAILWAY_ENVIRONMENT,
        coolify: !!process.env.COOLIFY_DEPLOYMENT_ID || !!process.env.COOLIFY,
        hetzner: process.env.HETZNER_TOKEN ? 'detected' : 'not detected'
      }
    };
    
    console.log('[DEBUG-LIVE] Debug-Info gesammelt:', debugInfo);
    
    return NextResponse.json({
      success: true,
      message: 'Live-Domain Debug-Informationen',
      data: debugInfo
    });
    
  } catch (error) {
    console.error('[DEBUG-LIVE] Fehler:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug-Route fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Debug-Route für Live-Domain-Diagnose',
    usage: 'GET /api/debug-live',
    description: 'Zeigt Umgebungsvariablen und Deployment-Informationen'
  });
}