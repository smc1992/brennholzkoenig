FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Build-Args für Supabase-Umgebungsvariablen definieren
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_SITE_URL

# Umgebungsvariablen setzen
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Supabase-Umgebungsvariablen für Build-Zeit setzen
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SERVICE_ROLE_KEY=$NEXT_PUBLIC_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Abhängigkeiten installieren
COPY package.json package-lock.json ./
RUN npm ci

# Anwendungsdateien kopieren
COPY . .

# Anwendung bauen (mit verfügbaren Umgebungsvariablen)
RUN npm run build

# Port freigeben
EXPOSE 3000

# Server starten
CMD ["npm", "run", "start"]
