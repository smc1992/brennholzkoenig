import { supabase } from '@/lib/supabase';
import { LoyaltyNotificationService } from './loyaltyNotificationService';

interface LoyaltyTransaction {
  id: string;
  member_id: string;
  points: number;
  transaction_type: string;
  reason: string;
  order_number: string | null;
  expires_at: string | null;
  created_at: string;
  loyalty_members?: {
    customer_id: string;
    customers?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

/**
 * Service für die Verwaltung ablaufender Loyalty-Punkte
 */
export class LoyaltyExpirationService {
  
  /**
   * Prüft auf ablaufende Punkte und sendet Benachrichtigungen
   * Sollte täglich als Cron-Job ausgeführt werden
   */
  static async checkExpiringPoints(): Promise<void> {
    try {
      console.log('🔍 Prüfe auf ablaufende Punkte...');

      // Hole alle Punkte, die in den nächsten 7 Tagen ablaufen
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: expiringTransactions, error } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          loyalty_members (
            customer_id,
            customers (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('transaction_type', 'earned')
        .lt('expires_at', sevenDaysFromNow.toISOString())
        .gt('expires_at', new Date().toISOString())
        .gt('points', 0); // Nur positive Punkte (nicht bereits eingelöst)

      if (error) {
        console.error('Fehler beim Abrufen ablaufender Punkte:', error);
        return;
      }

      if (!expiringTransactions || expiringTransactions.length === 0) {
        console.log('Keine ablaufenden Punkte gefunden');
        return;
      }

      // Gruppiere nach Kunden
      const customerGroups = new Map<string, {
        customer: any;
        totalExpiringPoints: number;
        earliestExpiration: Date;
      }>();

      expiringTransactions.forEach((transaction: LoyaltyTransaction) => {
        const customer = transaction.loyalty_members?.customers;
        if (!customer || !transaction.loyalty_members || !transaction.expires_at) return;

        const customerId = transaction.loyalty_members.customer_id;
        const expirationDate = new Date(transaction.expires_at);

        if (customerGroups.has(customerId)) {
          const existing = customerGroups.get(customerId)!;
          existing.totalExpiringPoints += transaction.points;
          if (expirationDate < existing.earliestExpiration) {
            existing.earliestExpiration = expirationDate;
          }
        } else {
          customerGroups.set(customerId, {
            customer,
            totalExpiringPoints: transaction.points,
            earliestExpiration: expirationDate
          });
        }
      });

      // Sende Benachrichtigungen
      for (const [customerId, data] of customerGroups) {
        try {
          await LoyaltyNotificationService.sendExpiringPointsNotification(
            data.customer.email,
            `${data.customer.first_name} ${data.customer.last_name}`,
            data.totalExpiringPoints,
            data.earliestExpiration
          );

          console.log(`✅ Ablauf-Benachrichtigung gesendet an ${data.customer.email}: ${data.totalExpiringPoints} Punkte`);
        } catch (notificationError) {
          console.error(`Fehler beim Senden der Ablauf-Benachrichtigung an ${data.customer.email}:`, notificationError);
        }
      }

      console.log(`📧 ${customerGroups.size} Ablauf-Benachrichtigungen versendet`);

    } catch (error) {
      console.error('Fehler bei checkExpiringPoints:', error);
    }
  }

  /**
   * Bereinigt abgelaufene Punkte
   * Sollte täglich als Cron-Job ausgeführt werden
   */
  static async cleanupExpiredPoints(): Promise<void> {
    try {
      console.log('🧹 Bereinige abgelaufene Punkte...');

      // Hole alle abgelaufenen Transaktionen
      const { data: expiredTransactions, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('transaction_type', 'earned')
        .lt('expires_at', new Date().toISOString())
        .gt('points', 0); // Nur positive Punkte

      if (error) {
        console.error('Fehler beim Abrufen abgelaufener Punkte:', error);
        return;
      }

      if (!expiredTransactions || expiredTransactions.length === 0) {
        console.log('Keine abgelaufenen Punkte gefunden');
        return;
      }

      let totalExpiredPoints = 0;
      let processedMembers = 0;

      // Verarbeite jeden abgelaufenen Punkt
      for (const transaction of expiredTransactions as LoyaltyTransaction[]) {
        try {
          // Erstelle eine "expired" Transaktion
          const { error: expiredError } = await supabase
            .from('loyalty_transactions')
            .insert({
              member_id: transaction.member_id,
              points: -transaction.points, // Negative Punkte für Ablauf
              transaction_type: 'expired',
              reason: `Punkte abgelaufen (ursprünglich vom ${new Date(transaction.created_at).toLocaleDateString()})`,
              order_number: null,
              expires_at: null
            });

          if (expiredError) {
            console.error('Fehler beim Erstellen der Ablauf-Transaktion:', expiredError);
            continue;
          }

          // Setze die ursprüngliche Transaktion auf 0 Punkte
          const { error: updateError } = await supabase
            .from('loyalty_transactions')
            .update({ points: 0 })
            .eq('id', transaction.id);

          if (updateError) {
            console.error('Fehler beim Aktualisieren der abgelaufenen Transaktion:', updateError);
            continue;
          }

          totalExpiredPoints += transaction.points;
          processedMembers++;

        } catch (transactionError) {
          console.error('Fehler beim Verarbeiten der abgelaufenen Transaktion:', transactionError);
        }
      }

      // Aktualisiere die Punktestände aller betroffenen Member
      const memberIds = [...new Set((expiredTransactions as LoyaltyTransaction[]).map((t: LoyaltyTransaction) => t.member_id))];
      for (const memberId of memberIds) {
        try {
          await this.recalculateMemberBalance(memberId);
        } catch (recalcError) {
          console.error(`Fehler beim Neuberechnen des Punktestands für Member ${memberId}:`, recalcError);
        }
      }

      console.log(`🗑️ ${totalExpiredPoints} Punkte von ${processedMembers} Mitgliedern bereinigt`);

    } catch (error) {
      console.error('Fehler bei cleanupExpiredPoints:', error);
    }
  }

  /**
   * Berechnet den Punktestand eines Members neu
   */
  private static async recalculateMemberBalance(memberId: string): Promise<void> {
    const { data: transactions, error } = await supabase
      .from('loyalty_transactions')
      .select('points')
      .eq('member_id', memberId);

    if (error) {
      console.error('Fehler beim Abrufen der Transaktionen:', error);
      return;
    }

    const totalPoints = transactions?.reduce((sum: number, t: { points: number }) => sum + t.points, 0) || 0;

    const { error: updateError } = await supabase
      .from('loyalty_members')
      .update({ points_balance: totalPoints })
      .eq('id', memberId);

    if (updateError) {
      console.error('Fehler beim Aktualisieren des Punktestands:', updateError);
    }
  }

  /**
   * Erstellt einen Cron-Job für die tägliche Ausführung
   * Diese Funktion sollte von einem externen Scheduler aufgerufen werden
   */
  static async runDailyMaintenance(): Promise<void> {
    console.log('🔄 Starte tägliche Loyalty-Wartung...');
    
    try {
      // Prüfe auf ablaufende Punkte (7 Tage Vorlauf)
      await this.checkExpiringPoints();
      
      // Bereinige abgelaufene Punkte
      await this.cleanupExpiredPoints();
      
      console.log('✅ Tägliche Loyalty-Wartung abgeschlossen');
    } catch (error) {
      console.error('❌ Fehler bei der täglichen Loyalty-Wartung:', error);
    }
  }
}