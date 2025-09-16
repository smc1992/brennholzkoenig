import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[COOLIFY-SMTP] Debug-Test für Coolify SMTP gestartet');
    
    // 1. Umgebungsvariablen prüfen
    const envCheck = {
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || 'not set',
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || 'not set',
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || 'not set',
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD ? 'set' : 'not set',
      EMAIL_FROM: process.env.EMAIL_FROM || 'not set',
      NODE_ENV: process.env.NODE_ENV,
      COOLIFY: process.env.COOLIFY || 'not detected'
    };
    
    console.log('[COOLIFY-SMTP] Umgebungsvariablen:', envCheck);
    
    // 2. Netzwerk-Tests für verschiedene Ports
    const networkTests = await testSMTPPorts(envCheck.EMAIL_SERVER_HOST);
    
    // 3. SMTP-Service-Test
    const smtpServiceTest = await testEmailService();
    
    return NextResponse.json({
      success: true,
      message: 'Coolify SMTP-Diagnose abgeschlossen',
      data: {
        environment_variables: envCheck,
        network_tests: networkTests,
        smtp_service: smtpServiceTest,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[COOLIFY-SMTP] Fehler:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Coolify SMTP-Test fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

async function testSMTPPorts(host: string) {
  if (!host || host === 'not set') {
    return { error: 'Kein SMTP-Host in Umgebungsvariablen gefunden' };
  }
  
  const ports = [465, 587, 25];
  const results: Record<number, any> = {};
  
  for (const port of ports) {
    try {
      console.log(`[COOLIFY-SMTP] Teste Port ${port} auf ${host}`);
      
      const net = require('net');
      const testResult = await new Promise((resolve, reject) => {
        const socket = net.createConnection(port, host);
        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error('Timeout nach 5 Sekunden'));
        }, 5000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve({ status: 'open', message: 'Verbindung erfolgreich' });
        });
        
        socket.on('error', (error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      results[port] = testResult;
      
    } catch (error: any) {
      results[port] = {
        status: 'blocked',
        error: error instanceof Error ? error.message : 'Verbindungsfehler'
      };
    }
  }
  
  return results;
}

async function testEmailService() {
  try {
    // Lade E-Mail-Service
    const { loadSMTPSettings } = await import('@/lib/emailService');
    
    console.log('[COOLIFY-SMTP] Teste E-Mail-Service-Konfiguration');
    const settings = await loadSMTPSettings();
    
    if (!settings) {
      return {
        success: false,
        error: 'Keine SMTP-Einstellungen gefunden'
      };
    }
    
    return {
      success: true,
      settings: {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        username: settings.smtp_username ? settings.smtp_username.substring(0, 3) + '***' : 'not set',
        from_email: settings.smtp_from_email
      },
      source: 'environment_variables'
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'E-Mail-Service-Fehler'
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Coolify SMTP-Diagnose',
    usage: 'POST /api/debug-coolify-smtp',
    description: 'Testet SMTP-Konfiguration mit Coolify-Umgebungsvariablen'
  });
}