# PDF-Generierung Deployment Guide

## Problem
PDF-Generierung funktioniert in der Entwicklungsumgebung, aber nicht in der Produktionsumgebung.

## Ursache
Puppeteer benötigt Chromium und spezielle Systemabhängigkeiten, die im Standard Alpine Docker Image nicht verfügbar sind.

## Lösungen

### Option 1: Alpine mit Chromium (Empfohlen für kleinere Images)

Verwende das Standard `Dockerfile` mit den hinzugefügten Chromium-Abhängigkeiten:

```dockerfile
FROM node:18-alpine

# Puppeteer-Abhängigkeiten installieren
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Puppeteer konfigurieren
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Option 2: Debian mit Google Chrome (Empfohlen für Stabilität)

Verwende `Dockerfile.puppeteer` für bessere Kompatibilität:

```bash
# Build mit Puppeteer-optimiertem Dockerfile
docker build -f Dockerfile.puppeteer -t brennholz-app .
```

## Deployment-Schritte

### 1. Dockerfile aktualisieren

Stelle sicher, dass eines der beiden Dockerfiles verwendet wird:
- `Dockerfile` (Alpine + Chromium)
- `Dockerfile.puppeteer` (Debian + Google Chrome)

### 2. Umgebungsvariablen setzen

```bash
# Für Alpine
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Für Debian
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Allgemein
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
NODE_ENV=production
```

### 3. Memory-Limits erhöhen

Puppeteer benötigt ausreichend Arbeitsspeicher:

```yaml
# docker-compose.yml
services:
  app:
    mem_limit: 1g
    memswap_limit: 1g
```

### 4. Security-Einstellungen

Für Container-Umgebungen:

```yaml
# docker-compose.yml
services:
  app:
    security_opt:
      - seccomp:unconfined
    cap_add:
      - SYS_ADMIN
```

## Debugging

### Logs prüfen

Die Invoice Builder Klasse gibt detaillierte Logs aus:

```bash
# Container-Logs anzeigen
docker logs <container-name>

# Nach Puppeteer-Fehlern suchen
docker logs <container-name> | grep "Puppeteer"
```

### Häufige Fehler

1. **"No usable sandbox!"**
   - Lösung: `--no-sandbox` Flag ist bereits gesetzt

2. **"Failed to launch chrome!"**
   - Lösung: Chromium/Chrome nicht installiert → Dockerfile prüfen

3. **"spawn ENOENT"**
   - Lösung: Falscher `PUPPETEER_EXECUTABLE_PATH`

4. **Memory-Fehler**
   - Lösung: Container-Memory erhöhen

### Test-Endpoint

Teste die PDF-Generierung:

```bash
# PDF-Generation testen
curl -X POST "https://your-domain.com/api/invoice-builder" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "test-order", "action": "generate"}' \
  --output test.pdf
```

## Coolify Deployment

Für Coolify-Deployments:

1. **Dockerfile auswählen**:
   ```bash
   # In Coolify Build Settings
   DOCKERFILE_PATH=Dockerfile.puppeteer
   ```

2. **Umgebungsvariablen setzen**:
   ```
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
   ```

3. **Resource-Limits**:
   - Memory: mindestens 1GB
   - CPU: mindestens 0.5 cores

## Performance-Optimierung

### Browser-Instanz wiederverwenden

Der Invoice Builder verwendet bereits Browser-Pooling:

```typescript
// Singleton-Pattern für Browser-Instanz
let invoiceBuilderInstance: ModernInvoiceBuilder | null = null;

export function getInvoiceBuilder(): ModernInvoiceBuilder {
  if (!invoiceBuilderInstance) {
    invoiceBuilderInstance = new ModernInvoiceBuilder();
  }
  return invoiceBuilderInstance;
}
```

### Memory-Management

- Browser wird automatisch nach Inaktivität geschlossen
- Seiten werden nach PDF-Generierung geschlossen
- Garbage Collection wird optimiert

## Monitoring

### Health-Check

Erstelle einen Health-Check für PDF-Generierung:

```typescript
// /api/health/pdf
export async function GET() {
  try {
    const builder = getInvoiceBuilder();
    // Test-PDF generieren
    await builder.generatePDF(testData, testSettings);
    return Response.json({ status: 'ok', pdf: 'working' });
  } catch (error) {
    return Response.json({ status: 'error', pdf: 'failed', error: error.message }, { status: 500 });
  }
}
```

### Metriken

- PDF-Generierungszeit
- Memory-Verbrauch
- Fehlerrate
- Browser-Restart-Häufigkeit

## Troubleshooting-Checklist

- [ ] Richtiges Dockerfile verwendet?
- [ ] Chromium/Chrome installiert?
- [ ] Umgebungsvariablen gesetzt?
- [ ] Ausreichend Memory verfügbar?
- [ ] Container-Logs geprüft?
- [ ] Test-Endpoint funktioniert?
- [ ] Browser-Argumente korrekt?
- [ ] Security-Einstellungen angepasst?

## Support

Bei weiteren Problemen:

1. Container-Logs sammeln
2. Test-PDF-Generation versuchen
3. Memory- und CPU-Verbrauch prüfen
4. Browser-Initialisierung debuggen