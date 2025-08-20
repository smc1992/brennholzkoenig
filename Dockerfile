FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Umgebungsvariablen setzen
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Abhängigkeiten installieren
COPY package.json package-lock.json ./
RUN npm ci

# Anwendungsdateien kopieren
COPY . .

# Anwendung bauen
RUN npm run build

# Port freigeben
EXPOSE 3000

# Server starten
CMD ["npm", "run", "start"]
