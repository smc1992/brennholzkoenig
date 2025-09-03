# Docker Deployment Fix - Stack Smashing Error

## Problem

Der Docker-Build schlägt fehl mit folgendem Fehler:
```
*** stack smashing detected ***: terminated
/bin/bash: line 1: 9 Aborted (core dumped) sudo apt-get update
ERROR: process "/bin/bash -ol pipefail -c sudo apt-get update && sudo apt-get install -y --no-install-recommends curl wget" did not complete successfully: exit code: 134
```

## Ursache

Das Problem tritt auf, weil Nixpacks versucht, zusätzliche Pakete über `apt-get` zu installieren, was zu einem Stack-Smashing-Fehler führt. Dies ist ein bekanntes Problem bei bestimmten Nixpacks-Konfigurationen.

## Lösungen

### Lösung 1: Optimierte Nixpacks-Konfiguration (Empfohlen)

**Datei:** `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs_18", "curl", "wget"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"

[variables]
NODE_ENV = "production"
PORT = "3000"
NEXT_TELEMETRY_DISABLED = "1"
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
```

**Änderungen:**
- Verwendung von `nodejs_18` statt `nodejs` für bessere Stabilität
- Hinzufügung von `curl` und `wget` über nixPkgs statt apt-get
- Puppeteer-Konfiguration für Nixpacks-Umgebung

### Lösung 2: Alternative Alpine-Dockerfile

**Datei:** `Dockerfile.alpine`

Für Deployment-Plattformen, die Standard-Dockerfiles bevorzugen:

```dockerfile
FROM node:18-alpine

# Install system dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    wget

# Tell Puppeteer to skip installing Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ... rest of configuration
```

### Lösung 3: .dockerignore Optimierung

**Datei:** `.dockerignore`

Reduziert Build-Kontext und verhindert Konflikte:
```
node_modules
.next
.env*
logs
*.log
.git
docs/
```

## Deployment-Anweisungen

### Für Coolify/Nixpacks:
1. Verwenden Sie die optimierte `nixpacks.toml`
2. Stellen Sie sicher, dass `.dockerignore` vorhanden ist
3. Deployen Sie normal über Coolify

### Für Standard-Docker:
1. Verwenden Sie `Dockerfile.alpine`:
   ```bash
   docker build -f Dockerfile.alpine -t brennholzkoenig .
   docker run -p 3000:3000 brennholzkoenig
   ```

### Für andere Plattformen:
1. Versuchen Sie zuerst die Nixpacks-Lösung
2. Falls Probleme auftreten, wechseln Sie zu `Dockerfile.alpine`
3. Stellen Sie sicher, dass alle Umgebungsvariablen korrekt gesetzt sind

## Umgebungsvariablen für Produktion

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### Wenn der Build immer noch fehlschlägt:
1. Überprüfen Sie die Logs auf spezifische Fehlermeldungen
2. Versuchen Sie einen Clean-Build ohne Cache
3. Kontaktieren Sie den Plattform-Support mit den spezifischen Logs

### Für Puppeteer-Probleme:
1. Stellen Sie sicher, dass `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` gesetzt ist
2. Überprüfen Sie, ob Chromium korrekt installiert ist
3. Testen Sie die PDF-Generierung nach dem Deployment

## Monitoring

Nach erfolgreichem Deployment:
1. Testen Sie die HTML→PDF Funktionalität
2. Überprüfen Sie die Logs auf Puppeteer-Warnungen
3. Monitoren Sie die Speicher- und CPU-Nutzung

Diese Konfiguration sollte das Stack-Smashing-Problem beheben und eine stabile Deployment-Umgebung bereitstellen.