import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyExpirationService } from '@/lib/loyaltyExpirationService';

/**
 * API-Route für die tägliche Wartung des Loyalty-Programms
 * Diese Route sollte täglich von einem Cron-Job aufgerufen werden
 */
export async function POST(request: NextRequest) {
  try {
    // Überprüfe Authorization Header für Sicherheit
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.LOYALTY_MAINTENANCE_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starte Loyalty-Wartung via API...');

    // Führe die tägliche Wartung aus
    await LoyaltyExpirationService.runDailyMaintenance();

    return NextResponse.json({
      success: true,
      message: 'Loyalty-Wartung erfolgreich abgeschlossen',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fehler bei der Loyalty-Wartung:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler bei der Loyalty-Wartung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET-Route für Wartungsstatus und nächste geplante Ausführung
 */
export async function GET(request: NextRequest) {
  try {
    // Überprüfe Authorization Header
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.LOYALTY_MAINTENANCE_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Berechne nächste geplante Ausführung (täglich um 2:00 Uhr)
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(2, 0, 0, 0);
    
    // Wenn es bereits nach 2:00 Uhr ist, plane für den nächsten Tag
    if (now.getHours() >= 2) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return NextResponse.json({
      status: 'active',
      lastCheck: new Date().toISOString(),
      nextScheduledRun: nextRun.toISOString(),
      maintenanceEnabled: true,
      endpoints: {
        runMaintenance: '/api/loyalty/maintenance (POST)',
        status: '/api/loyalty/maintenance (GET)'
      }
    });

  } catch (error) {
    console.error('Fehler beim Abrufen des Wartungsstatus:', error);
    
    return NextResponse.json(
      {
        error: 'Fehler beim Abrufen des Status',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}