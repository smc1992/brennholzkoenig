# Basis-Image mit Node.js
FROM node:18-alpine

# Pakete für Healthcheck
RUN apk add --no-cache curl

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Umgebungsvariablen setzen
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Abhängigkeiten installieren
COPY package.json package-lock.json ./
RUN npm ci

# Anwendungsdateien kopieren
COPY . .

# Anwendung bauen
RUN npm run build

# Health Check Script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3000/ || exit 1' > /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# Port freigeben
EXPOSE 3000

# Server starten
CMD ["npm", "run", "start"]
