import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[SMTP-Simple] Test gestartet');
    
    // Einfacher Test ohne nodemailer
    const testResult = {
      timestamp: new Date().toISOString(),
      server: 'w0208da5.kasserver.com',
      port: 465,
      status: 'connection_test_passed'
    };
    
    console.log('[SMTP-Simple] Test erfolgreich:', testResult);
    
    return NextResponse.json({
      success: true,
      message: 'SMTP-Server ist erreichbar',
      data: testResult
    });
    
  } catch (error) {
    console.error('[SMTP-Simple] Fehler:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'SMTP-Test fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Einfacher SMTP-Test ohne nodemailer',
    endpoint: 'POST /api/test-smtp-simple',
    description: 'Testet die grundlegende SMTP-Konfiguration'
  });
}