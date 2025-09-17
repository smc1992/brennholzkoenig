# Coolify PDF-Deployment Anleitung

## Schnell-Setup für PDF-Generierung in Coolify

### 1. Repository in Coolify hinzufügen

```
GitHub Repository: https://github.com/smc1992/brennholzkoenig.git
Branch: main
Build Pack: Docker
```

### 2. Dockerfile konfigurieren

**Wichtig:** Verwende `Dockerfile.puppeteer` für PDF-Support!

In Coolify unter **Build Settings**:
```
Dockerfile Path: Dockerfile.puppeteer
```

### 3. Umgebungsvariablen setzen

Unter **Environment Variables** folgende Variablen hinzufügen:

```bash
# PDF-Generierung (KRITISCH!)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Supabase (aus deinem Projekt)
NEXT_PUBLIC_SUPABASE_URL=https://tmxhamdyrjuxwnskgfka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
NEXT_PUBLIC_SERVICE_ROLE_KEY=dein_service_role_key
NEXT_PUBLIC_SITE_URL=https://deine-domain.com
```

### 4. Resource-Limits setzen

**KRITISCH für PDF-Generierung:**

Unter **Resources**:
```
Memory Limit: 2048Mi (empfohlen für stabile PDF-Generierung!)
CPU Limit: 1000m (empfohlen!)

# Minimum-Anforderungen:
Memory Limit: 1536Mi (absolutes Minimum)
CPU Limit: 500m (absolutes Minimum)
```

**Hinweis:** Der Fehler "Target closed" tritt oft bei zu wenig Memory auf!

### 5. Health Check konfigurieren

```
Health Check Path: /api/_health
Interval: 30s
Timeout: 10s
Retries: 3
```

### 6. Build & Deploy

1. **Deploy** klicken
2. **Build Logs** überwachen:
   - Chrome-Installation sollte erfolgreich sein
   - Keine Puppeteer-Download-Fehler

3. **Runtime Logs** prüfen:
   ```
   ✅ Browser initialized successfully
   ```

### 7. PDF-Funktionalität testen

Nach erfolgreichem Deployment:

```bash
# PDF-Test
curl -X POST "https://deine-domain.com/api/invoice-builder" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "test", "action": "generate"}' \
  --output test.pdf
```

## Troubleshooting

### Problem: "Protocol error (Target.setAutoAttach): Target closed"

**Ursache:** Browser-Prozess wird unerwartet beendet, meist durch Memory-Mangel <mcreference link="https://github.com/puppeteer/puppeteer/issues/10855" index="1">1</mcreference>

**Lösung:**
1. Memory auf mindestens 2GB erhöhen (KRITISCH!)
2. `--single-process` Flag nur in Produktion verwenden
3. `pipe: true` für bessere Stabilität
4. Non-root User verwenden (pptruser)

### Problem: "Failed to launch chrome!"

**Lösung:**
1. Prüfe ob `Dockerfile.puppeteer` verwendet wird
2. Stelle sicher dass Memory ≥ 2GB ist <mcreference link="https://raslasarslas.medium.com/how-to-make-puppeteer-in-docker-both-in-local-en-prod-env-bb92628b2da6" index="4">4</mcreference>
3. Prüfe Build-Logs auf Chrome-Installation
4. Verwende non-root User (pptruser)

### Problem: "spawn ENOENT"

**Lösung:**
1. Prüfe `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`
2. Restart der Anwendung
3. Prüfe Chrome-Installation im Container

### Problem: Memory-Fehler / OOM Kills

**Lösung:**
1. Memory auf 2GB oder mehr erhöhen <mcreference link="https://pptr.dev/troubleshooting" index="5">5</mcreference>
2. CPU auf 1000m erhöhen
3. `--memory-pressure-off` Flag verwenden
4. Container-Logs auf OOM-Kills prüfen

### Problem: Build schlägt fehl

**Lösung:**
1. Prüfe ob alle Umgebungsvariablen gesetzt sind
2. Verwende `Dockerfile.puppeteer` statt Standard-Dockerfile
3. Prüfe GitHub-Repository-Zugriff
4. Verwende bewährte Chrome-Installation <mcreference link="https://dev.to/cloudx/how-to-use-puppeteer-inside-a-docker-container-568c" index="5">5</mcreference>

## Coolify-spezifische Konfiguration

### Build Settings
```
Build Command: npm run build
Start Command: npm start
Port: 3000
Dockerfile: Dockerfile.puppeteer
```

### Advanced Settings
```
Restart Policy: unless-stopped
Network Mode: bridge
Privileged: false
Init: true
```

### Volume Mounts (optional)
```
# Für persistente PDF-Speicherung
/app/invoices:/data/invoices
```

## Monitoring

### Health Check Endpoint

Erstelle `/api/_health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getInvoiceBuilder } from '@/lib/invoiceBuilder';

export async function GET() {
  try {
    // Test PDF-Generierung
    const builder = getInvoiceBuilder();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        pdf: 'operational',
        database: 'operational'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

### Log-Monitoring

Überwache diese Log-Nachrichten:

```bash
# Erfolgreiche PDF-Generierung
"✅ Browser initialized successfully"
"📄 PDF generated successfully"

# Probleme
"❌ Failed to initialize Puppeteer browser"
"🚨 Production PDF generation failed"
```

## Performance-Optimierung

### Memory-Tuning

```bash
# Für hohe PDF-Last
Memory: 2048Mi
CPU: 1000m

# Für normale Last
Memory: 1024Mi
CPU: 500m
```

### Auto-Scaling (falls verfügbar)

```yaml
min_replicas: 1
max_replicas: 3
target_cpu: 70%
target_memory: 80%
```

## Backup & Recovery

### Konfiguration sichern

1. Exportiere Umgebungsvariablen
2. Sichere `coolify.json`
3. Dokumentiere Resource-Settings

### Rollback-Plan

1. Vorherige Git-Version deployen
2. Umgebungsvariablen wiederherstellen
3. Resource-Limits anpassen

## Support-Checklist

- [ ] `Dockerfile.puppeteer` verwendet?
- [ ] Memory ≥ 1GB gesetzt?
- [ ] Puppeteer-Umgebungsvariablen konfiguriert?
- [ ] Health Check funktioniert?
- [ ] PDF-Test erfolgreich?
- [ ] Build-Logs ohne Fehler?
- [ ] Runtime-Logs zeigen Browser-Initialisierung?

## Kontakt

Bei Problemen:
1. Coolify-Logs sammeln
2. PDF-Test-Ergebnis dokumentieren
3. Umgebungsvariablen prüfen
4. Resource-Verbrauch analysieren