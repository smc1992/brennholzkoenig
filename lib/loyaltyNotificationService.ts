import { createClient } from '@supabase/supabase-js';
import { 
  triggerLoyaltyPointsEarned,
  triggerLoyaltyPointsRedeemed,
  triggerLoyaltyTierUpgrade,
  triggerLoyaltyPointsExpiring
} from './emailTriggerEngine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NotificationData {
  customerEmail: string;
  customerName: string;
  pointsChange: number;
  newBalance: number;
  transactionType: 'earned' | 'redeemed' | 'expired';
  reason?: string;
  tier?: string;
}



export class LoyaltyNotificationService {

  static async sendPointsNotification(data: NotificationData): Promise<void> {
    try {
      // Hole Kundennummer für die E-Mail-Trigger
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('customer_number')
        .eq('email', data.customerEmail)
        .single();

      const customerNumber = customerData?.customer_number || 'N/A';

      // Verwende die neuen E-Mail-Trigger basierend auf dem Transaktionstyp
      switch (data.transactionType) {
        case 'earned':
          await triggerLoyaltyPointsEarned({
            customer: {
              name: data.customerName,
              email: data.customerEmail,
              customer_number: customerNumber
            },
            points_earned: Math.abs(data.pointsChange),
            current_points_balance: data.newBalance,
            tier_name: data.tier || 'Bronze',
            order_number: data.reason?.includes('Bestellung') ? data.reason.split(' ').pop() : undefined
          });
          break;

        case 'redeemed':
          await triggerLoyaltyPointsRedeemed({
            customer: {
              name: data.customerName,
              email: data.customerEmail,
              customer_number: customerNumber
            },
            points_redeemed: Math.abs(data.pointsChange),
            discount_amount: Math.abs(data.pointsChange) * 0.01, // 1 Punkt = 1 Cent
            remaining_points_balance: data.newBalance,
            tier_name: data.tier || 'Bronze',
            order_number: data.reason?.includes('Bestellung') ? data.reason.split(' ').pop() : undefined
          });
          break;

        case 'expired':
          // Für abgelaufene Punkte verwenden wir den Expiring-Trigger
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30); // 30 Tage in der Zukunft als Beispiel
          
          await triggerLoyaltyPointsExpiring({
            customer: {
              name: data.customerName,
              email: data.customerEmail,
              customer_number: customerNumber
            },
            expiring_points: Math.abs(data.pointsChange),
            expiration_date: expirationDate.toISOString(),
            current_points_balance: data.newBalance,
            tier_name: data.tier || 'Bronze',
            days_until_expiration: 30
          });
          break;
      }

      console.log(`Loyalty-Benachrichtigung (${data.transactionType}) über E-Mail-Trigger gesendet an ${data.customerEmail}`);

    } catch (error) {
      console.error('Fehler beim Senden der Loyalty-Benachrichtigung über E-Mail-Trigger:', error);
    }
  }

  static async sendTierUpgradeNotification(
    customerEmail: string,
    customerName: string,
    newTier: string,
    benefits: string[],
    oldTier?: string
  ): Promise<void> {
    try {
      // Hole Kundennummer für die E-Mail-Trigger
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('customer_number')
        .eq('email', customerEmail)
        .single();

      const customerNumber = customerData?.customer_number || 'N/A';

      // Verwende den neuen E-Mail-Trigger für Tier-Upgrades
       await triggerLoyaltyTierUpgrade({
         customer: {
           name: customerName,
           email: customerEmail,
           customer_number: customerNumber
         },
         old_tier_name: oldTier || 'Bronze',
         new_tier_name: newTier,
         new_tier_benefits: benefits.length > 0 ? benefits : ['Exklusive Vorteile und Rabatte'],
         current_points_balance: 0, // Wird später dynamisch ermittelt
         points_to_next_tier: 1000, // Beispielwert, kann später dynamisch gemacht werden
         next_tier_name: 'Premium' // Beispielwert, kann später dynamisch gemacht werden
       });

      console.log(`Tier-Upgrade-Benachrichtigung über E-Mail-Trigger gesendet an ${customerEmail}`);

    } catch (error) {
      console.error('Fehler beim Senden der Tier-Upgrade-Benachrichtigung über E-Mail-Trigger:', error);
    }
  }

  static async sendExpiringPointsNotification(
    customerEmail: string,
    customerName: string,
    expiringPoints: number,
    expirationDate: Date
  ): Promise<void> {
    try {
      // Hole Kundennummer für die E-Mail-Trigger
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('customer_number')
        .eq('email', customerEmail)
        .single();

      const customerNumber = customerData?.customer_number || 'N/A';

      // Berechne Tage bis zum Ablauf
      const today = new Date();
      const timeDiff = expirationDate.getTime() - today.getTime();
      const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Verwende den neuen E-Mail-Trigger für ablaufende Punkte
      await triggerLoyaltyPointsExpiring({
        customer: {
          name: customerName,
          email: customerEmail,
          customer_number: customerNumber
        },
        expiring_points: expiringPoints,
        expiration_date: expirationDate.toISOString(),
        current_points_balance: 0, // Wird später dynamisch gesetzt
        tier_name: 'Bronze', // Wird später dynamisch gesetzt
        days_until_expiration: Math.max(0, daysUntilExpiration)
      });

      console.log(`Punkte-Ablauf-Benachrichtigung über E-Mail-Trigger gesendet an ${customerEmail}`);

    } catch (error) {
      console.error('Fehler beim Senden der Punkte-Ablauf-Benachrichtigung über E-Mail-Trigger:', error);
    }
  }
}