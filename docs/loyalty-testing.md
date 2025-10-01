# Loyalty System Testing Guide

## Übersicht

Dieses Dokument beschreibt, wie das Loyalty-System getestet werden kann. Da das Projekt noch kein vollständiges Test-Framework eingerichtet hat, verwenden wir manuelle Tests.

## Test-Dateien

### 1. `__tests__/loyaltyService.test.ts`
Enthält alle Test-Funktionen für das Loyalty-System:

- **testGetOrCreateLoyaltyMember**: Testet das Erstellen/Abrufen von Loyalty-Mitgliedern
- **testAddPointsToMember**: Testet das Hinzufügen von Punkten
- **testProcessOrderLoyaltyPoints**: Testet die Bestellungsverarbeitung
- **testCheckAndNotifyTierUpgrade**: Testet Tier-Upgrades
- **testCheckExpiringPoints**: Testet die Prüfung ablaufender Punkte
- **testCleanupExpiredPoints**: Testet die Bereinigung abgelaufener Punkte
- **testRunDailyMaintenance**: Testet die tägliche Wartung
- **testLoyaltyMaintenanceAPI**: Testet die Maintenance-API

### 2. `scripts/run-loyalty-tests.js`
Node.js-Skript zum Ausführen aller Tests.

## Tests ausführen

### Alle Tests ausführen
```bash
node scripts/run-loyalty-tests.js
```

### Einzelne Tests ausführen
```javascript
// In der Browser-Konsole oder Node.js
import { loyaltyTests } from './__tests__/loyaltyService.test.ts';

// Einzelne Tests
await loyaltyTests.addPoints();
await loyaltyTests.processOrder();
await loyaltyTests.checkTierUpgrade();

// Alle Tests
await loyaltyTests.runAll();
```

## Test-Szenarien

### 1. Grundfunktionen testen

**Voraussetzungen:**
- Supabase-Verbindung funktioniert
- Loyalty-Tabellen sind erstellt
- Test-Kunde existiert in der Datenbank

**Tests:**
1. Loyalty Member erstellen
2. Punkte hinzufügen
3. Bestellungsverarbeitung
4. Tier-Upgrade prüfen

### 2. Expiration-System testen

**Tests:**
1. Ablaufende Punkte prüfen
2. Abgelaufene Punkte bereinigen
3. Tägliche Wartung ausführen

### 3. API-Endpunkte testen

**Tests:**
1. Maintenance-API aufrufen
2. Fehlerbehandlung testen

## Manuelle Tests

### Frontend-Komponenten

#### 1. Kunden-Dashboard (`/konto/treueprogramm`)
- [ ] Punktestand wird korrekt angezeigt
- [ ] Tier-Informationen sind sichtbar
- [ ] Transaktionshistorie lädt
- [ ] Fortschrittsbalken funktioniert
- [ ] Tier-Vorteile werden angezeigt

#### 2. Points Redemption (Checkout)
- [ ] Verfügbare Punkte werden angezeigt
- [ ] Einlösung funktioniert korrekt
- [ ] Maximaler Rabatt wird eingehalten (50%)
- [ ] Punkte werden korrekt abgezogen

#### 3. Admin-Dashboard
- [ ] Mitglieder-Liste lädt
- [ ] Transaktionen werden angezeigt
- [ ] Punkte können manuell hinzugefügt werden
- [ ] Statistiken werden korrekt berechnet
- [ ] Wartungsaufgaben können ausgeführt werden

### Backend-Funktionen

#### 1. Punktevergabe bei Bestellungen
```javascript
// Test-Bestellung erstellen und prüfen ob Punkte vergeben werden
const testOrder = {
  customer_id: 'test-customer',
  total_amount: 100.00,
  items: [...]
};

// Erwartung: 10 Punkte (10% von 100€)
```

#### 2. Tier-Upgrades
```javascript
// Kunde mit genügend Punkten für Upgrade
const customer = {
  total_earned: 1500 // Sollte Silver-Tier erreichen
};

// Erwartung: Tier wird auf 'silver' gesetzt
```

#### 3. Punkteablauf
```javascript
// Punkte mit Ablaufdatum in der Vergangenheit
const expiredPoints = {
  expires_at: '2023-01-01',
  points: 100
};

// Erwartung: Punkte werden als abgelaufen markiert
```

## Fehlerbehandlung testen

### 1. Ungültige Daten
- Nicht existierende Customer-ID
- Negative Punktzahlen
- Ungültige Tier-Namen

### 2. Datenbankfehler
- Verbindungsfehler simulieren
- Constraint-Verletzungen testen

### 3. API-Fehler
- Ungültige Tokens
- Fehlende Parameter
- Rate-Limiting

## Performance-Tests

### 1. Große Datenmengen
- Viele Transaktionen pro Member
- Viele Members gleichzeitig
- Bulk-Operationen

### 2. Concurrent Operations
- Gleichzeitige Punktevergabe
- Parallele Tier-Upgrades

## Monitoring und Logging

### 1. Console-Logs prüfen
```bash
# Development Server
npm run dev

# Logs in Browser-Konsole und Terminal beobachten
```

### 2. Supabase Dashboard
- Tabellen-Inhalte prüfen
- Query-Performance überwachen
- Fehler-Logs analysieren

## Deployment-Tests

### 1. Staging-Umgebung
- Alle Tests in Staging ausführen
- Performance unter Last testen
- Monitoring einrichten

### 2. Production-Readiness
- [ ] Alle Tests bestehen
- [ ] Performance ist akzeptabel
- [ ] Monitoring funktioniert
- [ ] Backup-Strategie ist implementiert
- [ ] Rollback-Plan ist vorhanden

## Troubleshooting

### Häufige Probleme

1. **Supabase-Verbindung fehlgeschlagen**
   - Environment-Variablen prüfen
   - Netzwerk-Verbindung testen

2. **Punkte werden nicht vergeben**
   - Loyalty-Einstellungen prüfen
   - Bestellungsstatus überprüfen

3. **Tier-Upgrades funktionieren nicht**
   - Punkteschwellen überprüfen
   - Berechnungslogik testen

4. **Benachrichtigungen werden nicht versendet**
   - E-Mail-Konfiguration prüfen
   - Template-Verfügbarkeit testen

## Nächste Schritte

1. **Jest-Integration**: Vollständiges Test-Framework einrichten
2. **Automatisierte Tests**: CI/CD-Pipeline mit Tests
3. **E2E-Tests**: Cypress oder Playwright für Frontend-Tests
4. **Load-Tests**: Performance unter Last testen
5. **Monitoring**: Produktions-Monitoring einrichten