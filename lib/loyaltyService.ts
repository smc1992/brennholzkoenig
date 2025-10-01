import { supabase } from '@/lib/supabase';
import { LoyaltyNotificationService } from './loyaltyNotificationService';

interface OrderItem {
  product_name: string;
  product_category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface LoyaltySettings {
  points_per_euro: number;
  is_enabled: boolean;
  categoryMultipliers?: {
    premium: number;
    standard: number;
    accessories: number;
  };
  timeBonuses?: {
    weekendMultiplier: number;
    holidayMultiplier: number;
    enabled: boolean;
  };
  orderValueBonuses?: Array<{
    minValue: number;
    bonusPoints: number;
  }>;
}

/**
 * Lädt die aktuellen Loyalty-Einstellungen
 */
export async function getLoyaltySettings(): Promise<LoyaltySettings | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_type', 'loyalty_program')
      .eq('setting_key', 'settings')
      .single();

    if (error || !data) {
      console.log('Keine Loyalty-Einstellungen gefunden, verwende Defaults');
      return {
        points_per_euro: 1,
        is_enabled: true,
        categoryMultipliers: {
          premium: 2.0,
          standard: 1.0,
          accessories: 1.5
        },
        timeBonuses: {
          weekendMultiplier: 1.5,
          holidayMultiplier: 2.0,
          enabled: false
        },
        orderValueBonuses: [
          { minValue: 100, bonusPoints: 20 },
          { minValue: 200, bonusPoints: 50 },
          { minValue: 500, bonusPoints: 150 }
        ]
      };
    }

    return JSON.parse(data.setting_value);
  } catch (error) {
    console.error('Fehler beim Laden der Loyalty-Einstellungen:', error);
    return null;
  }
}

/**
 * Berechnet die Punkte für eine Bestellung basierend auf den Loyalty-Einstellungen
 */
export function calculateOrderPoints(
  orderTotal: number,
  orderItems: OrderItem[],
  settings: LoyaltySettings
): number {
  if (!settings.is_enabled) return 0;

  let totalPoints = 0;

  // Basis-Punkte basierend auf Bestellwert
  let basePoints = orderTotal * settings.points_per_euro;

  // Kategorie-Multiplikatoren anwenden
  if (settings.categoryMultipliers) {
    let categoryAdjustedPoints = 0;
    const multipliers = settings.categoryMultipliers;
    
    orderItems.forEach(item => {
      let itemPoints = item.total_price * settings.points_per_euro;
      
      // Bestimme Kategorie-Multiplikator basierend auf Produktname/Kategorie
      let multiplier = 1.0;
      const productName = item.product_name.toLowerCase();
      const category = item.product_category?.toLowerCase() || '';
      
      if (productName.includes('premium') || category.includes('premium')) {
        multiplier = multipliers.premium;
      } else if (productName.includes('zubehör') || category.includes('zubehör') || category.includes('accessories')) {
        multiplier = multipliers.accessories;
      } else {
        multiplier = multipliers.standard;
      }
      
      categoryAdjustedPoints += itemPoints * multiplier;
    });
    
    basePoints = categoryAdjustedPoints;
  }

  // Zeit-basierte Boni (Wochenende/Feiertage)
  if (settings.timeBonuses?.enabled) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sonntag, 6 = Samstag
    
    // Wochenend-Bonus
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      basePoints *= settings.timeBonuses.weekendMultiplier;
    }
    
    // Hier könnten weitere Feiertags-Checks implementiert werden
    // Für jetzt verwenden wir einen einfachen Check für bestimmte Daten
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // Beispiel: Weihnachtszeit (Dezember)
    if (month === 12) {
      basePoints *= settings.timeBonuses.holidayMultiplier;
    }
  }

  totalPoints += Math.floor(basePoints);

  // Bestellwert-Boni hinzufügen
  if (settings.orderValueBonuses) {
    settings.orderValueBonuses.forEach(bonus => {
      if (orderTotal >= bonus.minValue) {
        totalPoints += bonus.bonusPoints;
      }
    });
  }

  return Math.floor(totalPoints);
}

/**
 * Erstellt oder aktualisiert einen Loyalty-Member für einen Kunden
 */
export async function getOrCreateLoyaltyMember(customerId: string) {
  try {
    // Prüfe ob bereits ein Loyalty-Member existiert
    let { data: member, error } = await supabase
      .from('loyalty_members')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Kein Member gefunden, erstelle einen neuen
      const { data: newMember, error: createError } = await supabase
        .from('loyalty_members')
        .insert({
          customer_id: customerId,
          points_balance: 0,
          total_points_earned: 0,
          total_points_redeemed: 0,
          tier: 'Bronze'
        })
        .select()
        .single();

      if (createError) {
        console.error('Fehler beim Erstellen des Loyalty Members:', createError);
        return null;
      }

      return newMember;
    } else if (error) {
      console.error('Fehler beim Laden des Loyalty Members:', error);
      return null;
    }

    return member;
  } catch (error) {
    console.error('Fehler bei getOrCreateLoyaltyMember:', error);
    return null;
  }
}

/**
 * Fügt Punkte zu einem Loyalty-Member hinzu
 */
export async function addPointsToMember(
  memberId: string,
  points: number,
  reason: string = 'Bestellung',
  sendNotification: boolean = true
): Promise<boolean> {
  try {
    // Hole Member-Daten vor der Aktualisierung für Benachrichtigung
    let memberData = null;
    let customerData = null;
    
    if (sendNotification) {
      const { data: member, error: memberError } = await supabase
        .from('loyalty_members')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', memberId)
        .single();

      if (!memberError && member) {
        memberData = member;
        customerData = member.customers;
      }
    }

    // Verwende die RPC-Funktion für atomare Punkteaktualisierung
    const { error } = await supabase.rpc('adjust_loyalty_points', {
      member_id: memberId,
      points_change: points,
      reason: reason
    });

    if (error) {
      console.error('Fehler beim Hinzufügen von Punkten:', error);
      return false;
    }

    // Sende Benachrichtigung wenn gewünscht und Daten verfügbar
    if (sendNotification && memberData && customerData) {
      try {
        const newBalance = memberData.points_balance + points;
        
        await LoyaltyNotificationService.sendPointsNotification({
          customerEmail: customerData.email,
          customerName: `${customerData.first_name} ${customerData.last_name}`,
          pointsChange: points,
          newBalance: newBalance,
          transactionType: points > 0 ? 'earned' : 'redeemed',
          reason: reason,
          tier: memberData.tier
        });
      } catch (notificationError) {
        console.error('Fehler beim Senden der Benachrichtigung:', notificationError);
        // Benachrichtigungsfehler sollen die Punktevergabe nicht blockieren
      }
    }

    console.log(`✅ ${points} Punkte erfolgreich hinzugefügt für Member ${memberId}`);
    return true;
  } catch (error) {
    console.error('Fehler bei addPointsToMember:', error);
    return false;
  }
}

/**
 * Hilfsfunktion: Gibt die Vorteile für ein bestimmtes Tier zurück
 */
function getTierBenefits(tier: string): string[] {
  switch (tier) {
    case 'silver':
      return [
        '5% Rabatt auf alle Bestellungen',
        'Kostenloser Versand ab 50€',
        'Exklusive Angebote per E-Mail'
      ];
    case 'gold':
      return [
        '10% Rabatt auf alle Bestellungen',
        'Kostenloser Versand ab 30€',
        'Prioritäts-Kundenservice',
        'Früher Zugang zu neuen Produkten'
      ];
    case 'platinum':
      return [
        '15% Rabatt auf alle Bestellungen',
        'Kostenloser Versand ohne Mindestbestellwert',
        'VIP-Kundenservice',
        'Exklusive Platinum-Events',
        'Persönlicher Ansprechpartner'
      ];
    default: // bronze
      return [
        'Punkte sammeln bei jeder Bestellung',
        'Geburtstags-Überraschung',
        'Newsletter mit Tipps und Angeboten'
      ];
  }
}

/**
 * Prüft und sendet Tier-Upgrade-Benachrichtigung
 */
export async function checkAndNotifyTierUpgrade(memberId: string): Promise<void> {
  try {
    const { data: member, error } = await supabase
      .from('loyalty_members')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', memberId)
      .single();

    if (error || !member || !member.customers) {
      console.error('Fehler beim Abrufen der Member-Daten für Tier-Check:', error);
      return;
    }

    // Hole Loyalty-Einstellungen für Tier-Schwellenwerte
    const settings = await getLoyaltySettings();
    if (!settings) return;

    // Bestimme das neue Tier basierend auf Punkten
    let newTier = 'bronze';
    if (member.points_balance >= 5000) {
      newTier = 'platinum';
    } else if (member.points_balance >= 2000) {
      newTier = 'gold';
    } else if (member.points_balance >= 500) {
      newTier = 'silver';
    }

    // Prüfe ob Tier-Upgrade stattgefunden hat
    if (newTier !== member.tier) {
      // Aktualisiere Tier in der Datenbank
      const { error: updateError } = await supabase
        .from('loyalty_members')
        .update({ tier: newTier })
        .eq('id', memberId);

      if (updateError) {
        console.error('Fehler beim Aktualisieren des Tiers:', updateError);
        return;
      }

      // Sende Tier-Upgrade-Benachrichtigung
       try {
         const tierBenefits = getTierBenefits(newTier);
         await LoyaltyNotificationService.sendTierUpgradeNotification(
           member.customers.email,
           `${member.customers.first_name} ${member.customers.last_name}`,
           newTier,
           tierBenefits
         );

        console.log(`✅ Tier-Upgrade-Benachrichtigung gesendet: ${member.tier} → ${newTier}`);
      } catch (notificationError) {
        console.error('Fehler beim Senden der Tier-Upgrade-Benachrichtigung:', notificationError);
      }
    }
  } catch (error) {
    console.error('Fehler bei checkAndNotifyTierUpgrade:', error);
  }
}

/**
 * Hauptfunktion: Verarbeitet Punktevergabe für eine Bestellung
 */
export async function processOrderLoyaltyPoints(
  customerId: string,
  orderNumber: string,
  orderTotal: number,
  orderItems: OrderItem[]
): Promise<{ success: boolean; pointsAwarded: number; error?: string }> {
  try {
    console.log(`🎯 Verarbeite Loyalty-Punkte für Bestellung ${orderNumber}`);

    // Lade Loyalty-Einstellungen
    const settings = await getLoyaltySettings();
    if (!settings || !settings.is_enabled) {
      console.log('Loyalty-Programm ist deaktiviert');
      return { success: true, pointsAwarded: 0 };
    }

    // Berechne Punkte
    const pointsToAward = calculateOrderPoints(orderTotal, orderItems, settings);
    if (pointsToAward <= 0) {
      console.log('Keine Punkte zu vergeben');
      return { success: true, pointsAwarded: 0 };
    }

    // Hole oder erstelle Loyalty-Member
    const member = await getOrCreateLoyaltyMember(customerId);
    if (!member) {
      return { 
        success: false, 
        pointsAwarded: 0, 
        error: 'Konnte Loyalty-Member nicht erstellen oder laden' 
      };
    }

    // Füge Punkte hinzu
    const success = await addPointsToMember(
      member.id,
      pointsToAward,
      `Bestellung ${orderNumber}`
    );

    if (success) {
      console.log(`🎉 ${pointsToAward} Punkte erfolgreich vergeben für Bestellung ${orderNumber}`);
      
      // Prüfe auf Tier-Upgrade nach Punktevergabe
      try {
        await checkAndNotifyTierUpgrade(member.id);
      } catch (tierError) {
        console.error('Fehler bei Tier-Upgrade-Prüfung:', tierError);
        // Tier-Upgrade-Fehler sollen die Punktevergabe nicht beeinträchtigen
      }
      
      return { success: true, pointsAwarded: pointsToAward };
    } else {
      return { 
        success: false, 
        pointsAwarded: 0, 
        error: 'Fehler beim Hinzufügen der Punkte' 
      };
    }

  } catch (error) {
    console.error('Fehler bei processOrderLoyaltyPoints:', error);
    return { 
      success: false, 
      pointsAwarded: 0, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}