#!/usr/bin/env node

/**
 * VAPID Keys Generator für Push-Benachrichtigungen
 * 
 * VAPID (Voluntary Application Server Identification) Keys sind erforderlich
 * für Web Push Notifications. Sie bestehen aus einem öffentlichen und einem
 * privaten Schlüssel, die zur Authentifizierung des Servers gegenüber
 * Push-Services (wie FCM, Mozilla Push Service) verwendet werden.
 * 
 * Verwendung:
 * node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

function generateVapidKeys() {
  console.log('🔐 Generiere VAPID-Keys für Push-Benachrichtigungen...');
  
  // Generiere VAPID-Schlüsselpaar
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('\n✅ VAPID-Keys erfolgreich generiert!');
  console.log('\n📋 Ihre VAPID-Keys:');
  console.log('━'.repeat(80));
  console.log('🔑 Public Key (öffentlich):');
  console.log(vapidKeys.publicKey);
  console.log('\n🔒 Private Key (geheim - NIEMALS öffentlich teilen!):');
  console.log(vapidKeys.privateKey);
  console.log('━'.repeat(80));
  
  // Speichere Keys in .env.example Datei
  const envExample = `
# VAPID Keys für Push-Benachrichtigungen
# Generiert am: ${new Date().toISOString()}
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;
  
  const envPath = path.join(__dirname, '..', '.env.vapid.example');
  fs.writeFileSync(envPath, envExample);
  
  console.log('\n💾 Keys gespeichert in: .env.vapid.example');
  console.log('\n📝 Nächste Schritte:');
  console.log('1. Kopieren Sie die Keys in Ihre .env.local Datei');
  console.log('2. Oder geben Sie sie direkt im Admin-Dashboard ein');
  console.log('3. Aktivieren Sie Push-Benachrichtigungen in der Konfiguration');
  
  console.log('\n⚠️  WICHTIG:');
  console.log('- Der Private Key muss geheim bleiben!');
  console.log('- Verwenden Sie diese Keys nur für Ihre Domain');
  console.log('- Bei Kompromittierung neue Keys generieren');
  
  return vapidKeys;
}

// Führe Generierung aus wenn Skript direkt aufgerufen wird
if (require.main === module) {
  try {
    generateVapidKeys();
  } catch (error) {
    console.error('❌ Fehler beim Generieren der VAPID-Keys:', error.message);
    console.error('\n💡 Stellen Sie sicher, dass web-push installiert ist:');
    console.error('npm install web-push');
    process.exit(1);
  }
}

module.exports = { generateVapidKeys };