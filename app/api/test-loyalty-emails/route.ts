import { NextRequest, NextResponse } from 'next/server';
import { 
  triggerLoyaltyPointsEarned,
  triggerLoyaltyPointsRedeemed,
  triggerLoyaltyTierUpgrade,
  triggerLoyaltyPointsExpiring
} from '@/lib/emailTriggerEngine';

export async function POST(request: NextRequest) {
  try {
    const { testType, email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'E-Mail-Adresse ist erforderlich'
      }, { status: 400 });
    }

    console.log(`🧪 Teste Loyalty E-Mail-Trigger: ${testType} für ${email}`);

    let result = false;
    let message = '';

    switch (testType) {
      case 'points_earned':
        result = await triggerLoyaltyPointsEarned({
          customer: {
            name: 'Test Kunde',
            email: email,
            customer_number: 'TEST001'
          },
          points_earned: 50,
          order_number: 'TEST-ORDER-001',
          order_total: 99.99,
          current_points_balance: 150,
          tier_name: 'Bronze',
          points_to_next_tier: 350,
          next_tier_name: 'Silber'
        });
        message = 'Punkte erhalten E-Mail';
        break;

      case 'points_redeemed':
        result = await triggerLoyaltyPointsRedeemed({
          customer: {
            name: 'Test Kunde',
            email: email,
            customer_number: 'TEST001'
          },
          points_redeemed: 100,
          discount_amount: 10.00,
          order_number: 'TEST-ORDER-002',
          remaining_points_balance: 50,
          tier_name: 'Bronze'
        });
        message = 'Punkte eingelöst E-Mail';
        break;

      case 'tier_upgrade':
        result = await triggerLoyaltyTierUpgrade({
          customer: {
            name: 'Test Kunde',
            email: email,
            customer_number: 'TEST001'
          },
          old_tier_name: 'Bronze',
          new_tier_name: 'Silber',
          new_tier_benefits: ['5% Rabatt auf alle Bestellungen', 'Kostenloser Versand ab 50€', 'Exklusive Angebote'],
          current_points_balance: 500,
          points_to_next_tier: 500,
          next_tier_name: 'Gold'
        });
        message = 'Tier-Upgrade E-Mail';
        break;

      case 'points_expiring':
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // 7 Tage in der Zukunft
        
        result = await triggerLoyaltyPointsExpiring({
          customer: {
            name: 'Test Kunde',
            email: email,
            customer_number: 'TEST001'
          },
          expiring_points: 75,
          expiration_date: expirationDate.toISOString(),
          current_points_balance: 200,
          tier_name: 'Bronze',
          days_until_expiration: 7
        });
        message = 'Punkte ablaufend E-Mail';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Unbekannter Test-Typ'
        }, { status: 400 });
    }

    if (result) {
      console.log(`✅ ${message} erfolgreich gesendet an ${email}`);
      return NextResponse.json({
        success: true,
        message: `${message} wurde erfolgreich gesendet`,
        testType,
        email
      });
    } else {
      console.log(`❌ ${message} konnte nicht gesendet werden`);
      return NextResponse.json({
        success: false,
        error: `${message} konnte nicht gesendet werden - möglicherweise ist das Template inaktiv oder nicht konfiguriert`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Fehler beim Testen der Loyalty E-Mails:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}