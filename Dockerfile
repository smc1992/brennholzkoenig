# Basis-Image
FROM node:18-alpine AS base

# Abhängigkeiten installieren
FROM base AS deps
WORKDIR /app

# Pakete für Healthcheck
RUN apk add --no-cache curl

# Nur package.json und package-lock.json kopieren
COPY package.json package-lock.json ./
RUN npm ci

# Build-Phase
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Umgebungsvariablen für den Build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Anwendung bauen
RUN npm run build

# Produktions-Image
FROM base AS runner
WORKDIR /app

# Umgebungsvariablen für die Laufzeit
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Nicht-Root-Benutzer für Sicherheit
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Öffentliche Dateien kopieren
COPY --from=builder /app/public ./public

# Standalone-Output verwenden
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Berechtigungen setzen
RUN chown -R nextjs:nodejs /app

# Health Check Script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3000/_health || exit 1' > /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# Zum nicht-Root-Benutzer wechseln
USER nextjs

# Port freigeben
EXPOSE 3000

# Server starten
CMD ["node", "server.js"]
