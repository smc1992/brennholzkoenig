import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[SMTP-HETZNER] SMTP-Test für Hetzner/Coolify gestartet');
    
    const body = await request.json().catch(() => ({}));
    const { testEmail = 'info@brennholz-koenig.de' } = body;
    
    // 1. Netzwerk-Verbindungstest
    const networkTest = await testNetworkConnection();
    
    // 2. SMTP-Konfiguration laden
    const smtpConfig = await loadSMTPConfig();
    
    // 3. Einfacher SMTP-Test ohne nodemailer
    const smtpTest = await testSMTPBasic(smtpConfig);
    
    return NextResponse.json({
      success: true,
      message: 'Hetzner SMTP-Diagnose abgeschlossen',
      data: {
        network: networkTest,
        smtp_config: smtpConfig,
        smtp_test: smtpTest,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[SMTP-HETZNER] Fehler:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Hetzner SMTP-Test fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

async function testNetworkConnection() {
  try {
    console.log('[SMTP-HETZNER] Teste Netzwerk-Verbindung zu w0208da5.kasserver.com');
    
    // DNS-Auflösung testen
    const dns = require('dns').promises;
    const addresses = await dns.resolve4('w0208da5.kasserver.com');
    
    // TCP-Verbindung testen
    const net = require('net');
    const testPorts = [465, 587, 25];
    const portResults: Record<number, { status: string; error: string | null }> = {};
    
    for (const port of testPorts) {
      try {
        await new Promise((resolve, reject) => {
          const socket = net.createConnection(port, 'w0208da5.kasserver.com');
          const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error('Timeout'));
          }, 5000);
          
          socket.on('connect', () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve(true);
          });
          
          socket.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
        
        portResults[port] = { status: 'open', error: null };
      } catch (error: any) {
        portResults[port] = { 
          status: 'blocked', 
          error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
        };
      }
    }
    
    return {
      dns_resolution: { success: true, addresses },
      port_tests: portResults
    };
    
  } catch (error: any) {
    return {
      dns_resolution: { 
        success: false, 
        error: error instanceof Error ? error.message : 'DNS-Fehler' 
      },
      port_tests: {}
    };
  }
}

async function loadSMTPConfig() {
  try {
    // Supabase-Client laden
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // SMTP-Konfiguration aus Datenbank laden
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_type, setting_key, setting_value')
      .eq('setting_type', 'smtp_config')
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (data?.setting_value) {
      const config = JSON.parse(data.setting_value);
      return {
        success: true,
        config: {
          host: config.smtp_host,
          port: config.smtp_port,
          secure: config.smtp_secure,
          username: config.smtp_username ? config.smtp_username.substring(0, 3) + '***' : 'not set',
          from_email: config.smtp_from_email
        }
      };
    }
    
    return { success: false, error: 'Keine SMTP-Konfiguration gefunden' };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Konfigurationsfehler' 
    };
  }
}

async function testSMTPBasic(smtpConfig: any) {
  if (!smtpConfig.success) {
    return { success: false, error: 'Keine gültige SMTP-Konfiguration' };
  }
  
  try {
    // Einfacher SMTP-Handshake-Test
    const net = require('net');
    const config = smtpConfig.config;
    
    return new Promise((resolve) => {
      const socket = net.createConnection(parseInt(config.port), config.host);
      let response = '';
      
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({ 
          success: false, 
          error: 'SMTP-Handshake Timeout nach 10 Sekunden' 
        });
      }, 10000);
      
      socket.on('data', (data: any) => {
        response += data.toString();
        if (response.includes('220')) {
          clearTimeout(timeout);
          socket.destroy();
          resolve({ 
            success: true, 
            message: 'SMTP-Server antwortet korrekt',
            response: response.trim()
          });
        }
      });
      
      socket.on('error', (error: any) => {
        clearTimeout(timeout);
        resolve({ 
          success: false, 
          error: error.message 
        });
      });
    });
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'SMTP-Test-Fehler' 
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SMTP-Diagnose für Hetzner/Coolify',
    usage: 'POST /api/debug-smtp-hetzner',
    description: 'Testet SMTP-Verbindung und Netzwerk-Konfiguration auf Hetzner'
  });
}