/**
 * Manuelle Tests für Loyalty Service
 * 
 * Diese Datei enthält Test-Funktionen, die manuell ausgeführt werden können,
 * um die wichtigsten Loyalty-Funktionen zu überprüfen.
 */

import { addPointsToMember, processOrderLoyaltyPoints, checkAndNotifyTierUpgrade, getOrCreateLoyaltyMember } from '../lib/loyaltyService';
import { LoyaltyExpirationService } from '../lib/loyaltyExpirationService';

// Test-Daten
const TEST_CUSTOMER_ID = 'test-customer-123';
const TEST_MEMBER_ID = 'test-member-123';
const TEST_ORDER_NUMBER = 'test-order-123';

/**
 * Test 1: Punkte hinzufügen
 */
export async function testAddPointsToMember() {
  console.log('🧪 Test: Punkte hinzufügen');
  
  try {
    const result = await addPointsToMember(
      TEST_MEMBER_ID,
      50,
      'Test Punkte hinzufügen',
      false // Keine Benachrichtigung im Test
    );
    
    if (result) {
      console.log('✅ Punkte erfolgreich hinzugefügt');
      return true;
    } else {
      console.log('❌ Fehler beim Hinzufügen von Punkten');
      return false;
    }
  } catch (error) {
    console.log('❌ Exception beim Hinzufügen von Punkten:', error);
    return false;
  }
}

/**
 * Test 2: Bestellungsverarbeitung
 */
export async function testProcessOrderLoyaltyPoints() {
  console.log('🧪 Test: Bestellungsverarbeitung');
  
  try {
    const result = await processOrderLoyaltyPoints(
      TEST_CUSTOMER_ID,
      TEST_ORDER_NUMBER,
      100.00, // 100€ Bestellung
      [] // Leere Items für Test
    );
    
    if (result.success) {
      console.log('✅ Bestellung erfolgreich verarbeitet:');
      console.log(`   Punkte erhalten: ${result.pointsAwarded}`);
      return true;
    } else {
      console.log('❌ Fehler bei Bestellungsverarbeitung:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception bei Bestellungsverarbeitung:', error);
    return false;
  }
}

/**
 * Test 3: Tier-Upgrade prüfen
 */
export async function testCheckAndNotifyTierUpgrade() {
  console.log('🧪 Test: Tier-Upgrade prüfen');
  
  try {
    await checkAndNotifyTierUpgrade(TEST_MEMBER_ID);
    console.log('✅ Tier-Upgrade-Prüfung erfolgreich durchgeführt');
    return true;
  } catch (error) {
    console.log('❌ Exception bei Tier-Upgrade-Prüfung:', error);
    return false;
  }
}

/**
 * Test 4: Loyalty Member erstellen/abrufen
 */
export async function testGetOrCreateLoyaltyMember() {
  console.log('🧪 Test: Loyalty Member erstellen/abrufen');
  
  try {
    const result = await getOrCreateLoyaltyMember(TEST_CUSTOMER_ID);
    
    if (result) {
      console.log('✅ Loyalty Member erfolgreich erstellt/abgerufen:', result.id);
      return true;
    } else {
      console.log('❌ Fehler beim Erstellen/Abrufen des Loyalty Members');
      return false;
    }
  } catch (error) {
    console.log('❌ Exception beim Erstellen/Abrufen des Loyalty Members:', error);
    return false;
  }
}

/**
 * Test 5: Ablaufende Punkte prüfen
 */
export async function testCheckExpiringPoints() {
  console.log('🧪 Test: Ablaufende Punkte prüfen');
  
  try {
    await LoyaltyExpirationService.checkExpiringPoints();
    console.log('✅ Ablaufende Punkte erfolgreich geprüft');
    return true;
  } catch (error) {
    console.log('❌ Exception bei Prüfung ablaufender Punkte:', error);
    return false;
  }
}

/**
 * Test 6: Abgelaufene Punkte bereinigen
 */
export async function testCleanupExpiredPoints() {
  console.log('🧪 Test: Abgelaufene Punkte bereinigen');
  
  try {
    await LoyaltyExpirationService.cleanupExpiredPoints();
    console.log('✅ Abgelaufene Punkte erfolgreich bereinigt');
    return true;
  } catch (error) {
    console.log('❌ Exception bei Bereinigung abgelaufener Punkte:', error);
    return false;
  }
}

/**
 * Test 7: Tägliche Wartung
 */
export async function testRunDailyMaintenance() {
  console.log('🧪 Test: Tägliche Wartung');
  
  try {
    await LoyaltyExpirationService.runDailyMaintenance();
    console.log('✅ Tägliche Wartung erfolgreich durchgeführt');
    return true;
  } catch (error) {
    console.log('❌ Exception bei täglicher Wartung:', error);
    return false;
  }
}

/**
 * Alle Tests ausführen
 */
export async function runAllLoyaltyTests() {
  console.log('🚀 Starte Loyalty Service Tests...\n');
  
  const tests = [
    { name: 'Loyalty Member erstellen/abrufen', fn: testGetOrCreateLoyaltyMember },
    { name: 'Punkte hinzufügen', fn: testAddPointsToMember },
    { name: 'Bestellungsverarbeitung', fn: testProcessOrderLoyaltyPoints },
    { name: 'Tier-Upgrade prüfen', fn: testCheckAndNotifyTierUpgrade },
    { name: 'Ablaufende Punkte prüfen', fn: testCheckExpiringPoints },
    { name: 'Abgelaufene Punkte bereinigen', fn: testCleanupExpiredPoints },
    { name: 'Tägliche Wartung', fn: testRunDailyMaintenance }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const success = await test.fn();
    results.push({ name: test.name, success });
    console.log(''); // Leerzeile
  }
  
  // Zusammenfassung
  console.log('📊 Test-Zusammenfassung:');
  console.log('========================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Ergebnis: ${passed}/${total} Tests bestanden`);
  
  if (passed === total) {
    console.log('🎉 Alle Tests erfolgreich!');
  } else {
    console.log('⚠️  Einige Tests sind fehlgeschlagen. Bitte überprüfen Sie die Implementierung.');
  }
  
  return { passed, total, success: passed === total };
}

/**
 * Test-Hilfsfunktionen für API-Endpunkte
 */
export async function testLoyaltyMaintenanceAPI() {
  console.log('🧪 Test: Loyalty Maintenance API');
  
  try {
    const response = await fetch('/api/loyalty/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOYALTY_MAINTENANCE_TOKEN}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Maintenance API erfolgreich aufgerufen:', result);
      return true;
    } else {
      console.log('❌ Fehler bei Maintenance API:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception bei Maintenance API:', error);
    return false;
  }
}

// Einzelne Test-Funktionen für manuelle Ausführung
export const loyaltyTests = {
  createMember: testGetOrCreateLoyaltyMember,
  addPoints: testAddPointsToMember,
  processOrder: testProcessOrderLoyaltyPoints,
  checkTierUpgrade: testCheckAndNotifyTierUpgrade,
  checkExpiring: testCheckExpiringPoints,
  cleanupExpired: testCleanupExpiredPoints,
  dailyMaintenance: testRunDailyMaintenance,
  maintenanceAPI: testLoyaltyMaintenanceAPI,
  runAll: runAllLoyaltyTests
};