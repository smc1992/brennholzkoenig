#!/usr/bin/env node

/**
 * Test-Runner für Loyalty Service
 * 
 * Führt die manuellen Tests für das Loyalty-System aus.
 * 
 * Verwendung:
 * node scripts/run-loyalty-tests.js
 */

const path = require('path');

// Setze NODE_ENV für Tests
process.env.NODE_ENV = 'test';

async function runTests() {
  try {
    console.log('🚀 Starte Loyalty Service Tests...\n');
    
    // Dynamischer Import der Test-Funktionen
    const { runAllLoyaltyTests } = await import('../__tests__/loyaltyService.test.ts');
    
    // Führe alle Tests aus
    const result = await runAllLoyaltyTests();
    
    // Exit-Code basierend auf Test-Ergebnis
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Fehler beim Ausführen der Tests:', error);
    process.exit(1);
  }
}

// Führe Tests aus
runTests();