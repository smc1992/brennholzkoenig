# E-Mail-System Dokumentation

## Überblick

Das E-Mail-System für Bestellbestätigungen ist vollständig implementiert und produktionsbereit. Es unterstützt sowohl Entwicklungs- als auch Produktionsmodus.

## Features

✅ **Template-System**
- E-Mail-Templates werden aus der Admin-Oberfläche geladen
- Dynamische Platzhalter-Ersetzung
- HTML und Text-Versionen

✅ **SMTP-Konfiguration**
- Konfiguration über Admin-Panel
- Sichere Speicherung in der Datenbank
- Unterstützung für verschiedene SMTP-Provider

✅ **Entwicklungsmodus**
- Automatische E-Mail-Simulation im Development
- Keine echten E-Mails werden versendet
- Vollständige Logs für Debugging

✅ **Produktionsmodus**
- Echter E-Mail-Versand in Production
- Fehlerbehandlung und Logging
- Fallback-Mechanismen

## Modi

### Entwicklungsmodus (Standard)
```bash
NODE_ENV=development
# E-Mails werden simuliert, nicht versendet
```

### Produktionsmodus
```bash
NODE_ENV=production
# E-Mails werden echt versendet
```

### Erzwungener E-Mail-Versand im Development
```bash
NODE_ENV=development
FORCE_REAL_EMAIL=true
# E-Mails werden auch im Development echt versendet
```

## API Endpoint

**POST** `/api/send-order-email`

### Request Body
```json
{
  "customerData": {
    "name": "Max Mustermann",
    "email": "max.mustermann@example.com",
    "address": "Musterstraße 123",
    "postalCode": "12345",
    "city": "Musterstadt"
  },
  "orderData": {
    "id": "ORD-2024-001",
    "total": 299.99,
    "items": [
      {
        "name": "Premium Buche Brennholz 1RM",
        "quantity": 2,
        "price": 149.99
      }
    ]
  }
}
```

### Response (Erfolg)
```json
{
  "success": true,
  "message": "Bestellbestätigung erfolgreich versendet",
  "emailDetails": {
    "to": "max.mustermann@example.com",
    "subject": "Bestellbestätigung #ORD-2024-001 - Brennholzkönig",
    "orderId": "ORD-2024-001",
    "total": 299.99
  }
}
```

### Response (Fehler)
```json
{
  "success": false,
  "message": "Fehler aufgetreten"
}
```

## Template-Platzhalter

Das System ersetzt automatisch folgende Platzhalter:

- `{{customer_name}}` - Name des Kunden
- `{{customer_email}}` - E-Mail des Kunden
- `{{customer_address}}` - Adresse des Kunden
- `{{customer_postal_code}}` - PLZ des Kunden
- `{{customer_city}}` - Stadt des Kunden
- `{{order_id}}` - Bestellnummer
- `{{order_total}}` - Gesamtbetrag
- `{{order_items}}` - HTML-Liste der Bestellpositionen
- `{{current_date}}` - Aktuelles Datum

## SMTP-Konfiguration

Die SMTP-Einstellungen werden über das Admin-Panel konfiguriert:

1. Gehe zu `/admin#smtp-settings`
2. Konfiguriere SMTP-Server, Port, Benutzername, Passwort
3. Teste die Verbindung
4. Speichere die Einstellungen

## Produktionsbereitschaft

✅ **Getestet und funktionsfähig:**
- Template-Loading aus Datenbank
- Platzhalter-Ersetzung
- SMTP-Konfiguration
- Entwicklungsmodus-Simulation
- Fehlerbehandlung
- Logging und Debugging

✅ **Sicherheit:**
- Keine Passwörter in Logs
- Sichere SMTP-Authentifizierung
- Eingabevalidierung

✅ **Performance:**
- Effiziente Template-Verarbeitung
- Optimierte Datenbankabfragen
- Asynchrone E-Mail-Verarbeitung

## Deployment

Das System ist bereit für die Produktion. Stelle sicher, dass:

1. `NODE_ENV=production` gesetzt ist
2. SMTP-Einstellungen im Admin-Panel konfiguriert sind
3. E-Mail-Templates im Admin-Panel erstellt sind
4. Firewall-Regeln für SMTP-Ports konfiguriert sind

## Troubleshooting

### E-Mails werden nicht versendet
1. Prüfe SMTP-Konfiguration im Admin-Panel
2. Teste SMTP-Verbindung über `/api/test-smtp`
3. Prüfe Server-Logs für Fehler
4. Verifiziere Firewall-Einstellungen

### Template-Fehler
1. Prüfe ob Templates im Admin-Panel existieren
2. Verifiziere Template-Syntax
3. Teste Platzhalter-Ersetzung

### Entwicklungsmodus-Probleme
1. Prüfe `NODE_ENV` Variable
2. Setze `FORCE_REAL_EMAIL=true` für echten Versand
3. Prüfe Console-Logs für Simulation-Meldungen