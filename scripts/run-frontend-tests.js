#!/usr/bin/env node

/**
 * Skript zum Ausführen der Loyalty Frontend Tests
 * 
 * Verwendung:
 * node scripts/run-frontend-tests.js
 * 
 * Oder spezifische Tests:
 * node scripts/run-frontend-tests.js customerDashboard
 * node scripts/run-frontend-tests.js pointsRedemption
 * node scripts/run-frontend-tests.js adminManagement
 */

const path = require('path');

async function runFrontendTests() {
  try {
    console.log('🔧 Lade Frontend Tests...');
    
    // Dynamischer Import der Test-Funktionen
    const testModule = await import(path.join(process.cwd(), '__tests__', 'loyaltyFrontend.test.ts'));
    const { frontendTests } = testModule;
    
    // Kommandozeilenargument für spezifischen Test
    const specificTest = process.argv[2];
    
    if (specificTest && frontendTests[specificTest]) {
      console.log(`\n🎯 Führe spezifischen Test aus: ${specificTest}\n`);
      const result = await frontendTests[specificTest]();
      
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
      Object.keys(frontendTests).forEach(test => {
        if (test !== 'runAll') {
          console.log(`  - ${test}`);
        }
      });
      process.exit(1);
    } else {
      // Alle Tests ausführen
      console.log('\n🚀 Führe alle Frontend Tests aus...\n');
      const result = await frontendTests.runAll();
      
      if (result.success) {
        console.log('\n🎉 Alle Frontend Tests erfolgreich abgeschlossen!');
        process.exit(0);
      } else {
        console.log(`\n⚠️  ${result.passed}/${result.total} Tests bestanden`);
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Ausführen der Frontend Tests:', error);
    process.exit(1);
  }
}

// Hilfe anzeigen
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧪 Loyalty Frontend Test Runner

Verwendung:
  node scripts/run-frontend-tests.js [test-name]

Verfügbare Tests:
  customerDashboard    - Test für Kunden-Dashboard
  pointsRedemption     - Test für Points Redemption Komponente
  adminManagement      - Test für Admin Loyalty Management
  responsiveDesign     - Test für Responsive Design
  userInteraction      - Test für Benutzerinteraktion
  dataIntegration      - Test für Datenintegration
  performance          - Test für Performance
  accessibility        - Test für Accessibility

Beispiele:
  node scripts/run-frontend-tests.js                      # Alle Tests
  node scripts/run-frontend-tests.js customerDashboard    # Nur Dashboard Test
  node scripts/run-frontend-tests.js pointsRedemption     # Nur Redemption Test

Optionen:
  --help, -h           Zeigt diese Hilfe an
`);
  process.exit(0);
}

// Tests ausführen
runFrontendTests();