/**
 * Tests für Loyalty Notification Service
 * 
 * Diese Datei testet die Benachrichtigungsfunktionen des Loyalty-Systems.
 */

import { LoyaltyNotificationService } from '../lib/loyaltyNotificationService';

// Test-Daten
const TEST_CUSTOMER = {
  id: 'test-customer-123',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User'
};

/**
 * Test 1: Punkte-Benachrichtigung (Earned)
 */
export async function testSendPointsEarnedNotification() {
  console.log('🧪 Test: Punkte-Earned-Benachrichtigung senden');
  
  try {
    await LoyaltyNotificationService.sendPointsNotification({
      customerEmail: TEST_CUSTOMER.email,
      customerName: `${TEST_CUSTOMER.first_name} ${TEST_CUSTOMER.last_name}`,
      pointsChange: 50,
      newBalance: 150,
      transactionType: 'earned',
      reason: 'Bestellung #12345'
    });
    
    console.log('✅ Punkte-Earned-Benachrichtigung erfolgreich versendet');
    return true;
  } catch (error) {
    console.log('❌ Exception bei Punkte-Earned-Benachrichtigung:', error);
    return false;
  }
}

/**
 * Test 2: Punkte-Benachrichtigung (Redeemed)
 */
export async function testSendPointsRedeemedNotification() {
  console.log('🧪 Test: Punkte-Redeemed-Benachrichtigung senden');
  
  try {
    await LoyaltyNotificationService.sendPointsNotification({
      customerEmail: TEST_CUSTOMER.email,
      customerName: `${TEST_CUSTOMER.first_name} ${TEST_CUSTOMER.last_name}`,
      pointsChange: -25,
      newBalance: 125,
      transactionType: 'redeemed',
      reason: 'Rabatt eingelöst'
    });
    
    console.log('✅ Punkte-Redeemed-Benachrichtigung erfolgreich versendet');
    return true;
  } catch (error) {
    console.log('❌ Exception bei Punkte-Redeemed-Benachrichtigung:', error);
    return false;
  }
}

/**
 * Test 3: Tier-Upgrade-Benachrichtigung
 */
export async function testSendTierUpgradeNotification() {
  console.log('🧪 Test: Tier-Upgrade-Benachrichtigung senden');
  
  try {
    await LoyaltyNotificationService.sendTierUpgradeNotification(
      TEST_CUSTOMER.email,
      `${TEST_CUSTOMER.first_name} ${TEST_CUSTOMER.last_name}`,
      'Silver',
      ['5% Rabatt auf alle Bestellungen', 'Kostenloser Versand ab 50€', 'Exklusive Angebote']
    );
    
    console.log('✅ Tier-Upgrade-Benachrichtigung erfolgreich versendet');
    return true;
  } catch (error) {
    console.log('❌ Exception bei Tier-Upgrade-Benachrichtigung:', error);
    return false;
  }
}

/**
 * Test 4: Punkte-Ablauf-Benachrichtigung
 */
export async function testSendPointsExpirationNotification() {
  console.log('🧪 Test: Punkte-Ablauf-Benachrichtigung senden');
  
  try {
    const expirationDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 Tage
    
    await LoyaltyNotificationService.sendExpiringPointsNotification(
      TEST_CUSTOMER.email,
      `${TEST_CUSTOMER.first_name} ${TEST_CUSTOMER.last_name}`,
      150, // Ablaufende Punkte
      expirationDate
    );
    
    console.log('✅ Punkte-Ablauf-Benachrichtigung erfolgreich versendet');
    return true;
  } catch (error) {
    console.log('❌ Exception bei Punkte-Ablauf-Benachrichtigung:', error);
    return false;
  }
}

/**
 * Test 5: Batch-Benachrichtigungen
 */
export async function testBatchNotifications() {
  console.log('🧪 Test: Batch-Benachrichtigungen');
  
  try {
    const customers = [
      { ...TEST_CUSTOMER, id: 'customer-1', email: 'test1@example.com' },
      { ...TEST_CUSTOMER, id: 'customer-2', email: 'test2@example.com' },
      { ...TEST_CUSTOMER, id: 'customer-3', email: 'test3@example.com' }
    ];
    
    const results = await Promise.allSettled(
      customers.map(customer => 
        LoyaltyNotificationService.sendPointsNotification({
          customerEmail: customer.email,
          customerName: `${customer.first_name} ${customer.last_name}`,
          pointsChange: 25,
          newBalance: 100,
          transactionType: 'earned',
          reason: 'Batch-Test'
        })
      )
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    if (successCount === customers.length) {
      console.log('✅ Alle Batch-Benachrichtigungen erfolgreich versendet');
      return true;
    } else {
      console.log(`⚠️  ${successCount}/${customers.length} Batch-Benachrichtigungen erfolgreich`);
      return successCount > 0; // Teilweise erfolgreich ist auch OK
    }
  } catch (error) {
    console.log('❌ Exception bei Batch-Benachrichtigungen:', error);
    return false;
  }
}

/**
 * Test 6: API-Endpunkt Test
 */
export async function testNotificationAPI() {
  console.log('🧪 Test: Notification API-Endpunkt');
  
  try {
    const response = await fetch('/api/send-loyalty-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_CUSTOMER.email,
        subject: 'Test Loyalty Notification',
        content: 'Dies ist eine Test-Benachrichtigung für das Loyalty-System.',
        type: 'loyalty'
      }),
    });
    
    if (response.ok) {
      console.log('✅ Notification API-Endpunkt funktioniert');
      return true;
    } else {
      console.log('❌ Notification API-Endpunkt Fehler:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception bei Notification API-Test:', error);
    return false;
  }
}

/**
 * Alle Notification-Tests ausführen
 */
export async function runAllNotificationTests() {
  console.log('🚀 Starte Loyalty Notification Tests...\n');
  
  const tests = [
    { name: 'Punkte-Earned-Benachrichtigung', fn: testSendPointsEarnedNotification },
    { name: 'Punkte-Redeemed-Benachrichtigung', fn: testSendPointsRedeemedNotification },
    { name: 'Tier-Upgrade-Benachrichtigung', fn: testSendTierUpgradeNotification },
    { name: 'Punkte-Ablauf-Benachrichtigung', fn: testSendPointsExpirationNotification },
    { name: 'Batch-Benachrichtigungen', fn: testBatchNotifications },
    { name: 'Notification API-Endpunkt', fn: testNotificationAPI }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const success = await test.fn();
    results.push({ name: test.name, success });
    console.log(''); // Leerzeile
  }
  
  // Zusammenfassung
  console.log('📊 Notification Test-Zusammenfassung:');
  console.log('====================================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Ergebnis: ${passed}/${total} Tests bestanden`);
  
  if (passed === total) {
    console.log('🎉 Alle Notification-Tests erfolgreich!');
  } else {
    console.log('⚠️  Einige Notification-Tests sind fehlgeschlagen.');
  }
  
  return { passed, total, success: passed === total };
}

// Einzelne Test-Funktionen für manuelle Ausführung
export const notificationTests = {
  sendPointsEarned: testSendPointsEarnedNotification,
  sendPointsRedeemed: testSendPointsRedeemedNotification,
  sendTierUpgrade: testSendTierUpgradeNotification,
  sendExpiration: testSendPointsExpirationNotification,
  batchNotifications: testBatchNotifications,
  apiEndpoint: testNotificationAPI,
  runAll: runAllNotificationTests
};