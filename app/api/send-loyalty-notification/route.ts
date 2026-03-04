import { NextRequest, NextResponse } from 'next/server';
import {
  triggerLoyaltyPointsEarned,
  triggerLoyaltyPointsRedeemed,
  triggerLoyaltyTierUpgrade,
  triggerLoyaltyPointsExpiring
} from '@/lib/emailTriggerEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json();

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Fehlende Parameter: event und data sind erforderlich' },
        { status: 400 }
      );
    }

    let ok = false;
    switch (event) {
      case 'loyalty_points_earned':
        ok = await triggerLoyaltyPointsEarned(data);
        break;
      case 'loyalty_points_redeemed':
        ok = await triggerLoyaltyPointsRedeemed(data);
        break;
      case 'loyalty_tier_upgrade':
        ok = await triggerLoyaltyTierUpgrade(data);
        break;
      case 'loyalty_points_expiring':
        ok = await triggerLoyaltyPointsExpiring(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Unbekanntes Loyalty-Event' },
          { status: 400 }
        );
    }

    if (!ok) {
      return NextResponse.json(
        { error: 'Template nicht aktiv oder Versand fehlgeschlagen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Benachrichtigung erfolgreich über Trigger gesendet' });

  } catch (error) {
    console.error('Fehler beim Senden der Loyalty-Benachrichtigung via Trigger:', error);
    return NextResponse.json(
      {
        error: 'Fehler beim Senden der Benachrichtigung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}