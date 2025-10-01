#!/usr/bin/env node

/**
 * Skript zum Ausführen der Loyalty Notification Tests
 * 
 * Verwendung:
 * node scripts/run-notification-tests.js
 * 
 * Oder spezifische Tests:
 * node scripts/run-notification-tests.js sendPointsEarned
 * node scripts/run-notification-tests.js sendTierUpgrade
 * node scripts/run-notification-tests.js batchNotifications
 */

const path = require('path');

async function runNotificationTests() {
  try {
    console.log('🔧 Lade Notification Tests...');
    
    // Dynamischer Import der Test-Funktionen
    const testModule = await import(path.join(process.cwd(), '__tests__', 'loyaltyNotificationService.test.ts'));
    const { notificationTests } = testModule;
    
    // Kommandozeilenargument für spezifischen Test
    const specificTest = process.argv[2];
    
    if (specificTest && notificationTests[specificTest]) {
      console.log(`\n🎯 Führe spezifischen Test aus: ${specificTest}\n`);
      const result = await notificationTests[specificTest]();
      
      if (result) {
        console.log(`\n✅ Test '${specificTest}' erfolgreich abgeschlossen!`);
        process.exit(0);
      } else {
        console.log(`\n❌ Test '${specificTest}' fehlgeschlagen!`);
        process.exit(1);
      }
    } else if (specificTest) {
      console.log(`\n❌ Unbekannter Test: ${specificTest}`);
      console.log('Verfügbare Tests:');
      Object.keys(notificationTests).forEach(test => {
        if (test !== 'runAll') {
          console.log(`  - ${test}`);
        }
      });
      process.exit(1);
    } else {
      // Alle Tests ausführen
      console.log('\n🚀 Führe alle Notification Tests aus...\n');
      const result = await notificationTests.runAll();
      
      if (result.success) {
        console.log('\n🎉 Alle Notification Tests erfolgreich abgeschlossen!');
        process.exit(0);
      } else {
        console.log(`\n⚠️  ${result.passed}/${result.total} Tests bestanden`);
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Ausführen der Notification Tests:', error);
    process.exit(1);
  }
}

// Hilfe anzeigen
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧪 Loyalty Notification Test Runner

Verwendung:
  node scripts/run-notification-tests.js [test-name]

Verfügbare Tests:
  sendPointsEarned     - Test für Punkte-Earned-Benachrichtigungen
  sendPointsRedeemed   - Test für Punkte-Redeemed-Benachrichtigungen  
  sendTierUpgrade      - Test für Tier-Upgrade-Benachrichtigungen
  sendExpiration       - Test für Punkte-Ablauf-Benachrichtigungen
  batchNotifications   - Test für Batch-Benachrichtigungen
  apiEndpoint          - Test für Notification API-Endpunkt

Beispiele:
  node scripts/run-notification-tests.js                    # Alle Tests
  node scripts/run-notification-tests.js sendPointsEarned   # Nur Punkte-Earned Test
  node scripts/run-notification-tests.js batchNotifications # Nur Batch Test

Optionen:
  --help, -h           Zeigt diese Hilfe an
`);
  process.exit(0);
}

// Tests ausführen
runNotificationTests();