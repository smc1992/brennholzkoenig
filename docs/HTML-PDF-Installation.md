# HTML→PDF Pipeline Installation & Setup

## 🚀 Schnellstart

### 1. Dependencies installieren

```bash
# Puppeteer für PDF-Generierung
npm install puppeteer

# Handlebars für Templates
npm install handlebars @types/handlebars

# Optional: Puppeteer für Production optimieren
npm install puppeteer-core
```

### 2. Template-Verzeichnis erstellen

```bash
mkdir -p templates/partials
```

### 3. API testen

```bash
# Development Server starten
npm run dev

# HTML-Preview (zum Debugging)
curl "http://localhost:3000/api/invoices/123?format=html"

# PDF generieren
curl "http://localhost:3000/api/invoices/123" -o test-invoice.pdf
```

---

## 📋 Vollständige Installation

### Dependencies

```json
{
  "dependencies": {
    "puppeteer": "^21.0.0",
    "handlebars": "^4.7.8"
  },
  "devDependencies": {
    "@types/handlebars": "^4.1.0",
    "@types/puppeteer": "^7.0.4"
  }
}
```

### Verzeichnisstruktur

```
project/
├── templates/
│   ├── invoice.hbs          # Haupt-Template
│   ├── invoice.css          # Styles (optional, inline möglich)
│   └── partials/            # Wiederverwendbare Komponenten
│       ├── header.hbs
│       ├── footer.hbs
│       └── table.hbs
├── app/api/invoices/
│   └── [id]/
│       └── route.ts         # PDF-API Endpoint
├── lib/
│   ├── template-engine.ts   # Handlebars Helpers
│   └── pdf-generator.ts     # Puppeteer Wrapper
└── docs/
    ├── Audit-Report.md
    └── HTML-PDF-Installation.md
```

---

## 🔧 Konfiguration

### Puppeteer für Production

```typescript
// lib/pdf-generator.ts
import puppeteer from 'puppeteer';

const browserOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--single-process', // Für Container
  ]
};

// Für Docker/Container
if (process.env.NODE_ENV === 'production') {
  browserOptions.executablePath = '/usr/bin/chromium-browser';
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Puppeteer Konfiguration
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## 📝 Template-Entwicklung

### Basis-Template erstellen

```handlebars
<!-- templates/invoice.hbs -->
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Rechnung {{invoice.number}}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  {{> header}}
  
  <main>
    <h1>Rechnung {{invoice.number}}</h1>
    {{> table items=items}}
  </main>
  
  {{> footer}}
</body>
</html>
```

### Partials erstellen

```handlebars
<!-- templates/partials/header.hbs -->
<header>
  <div class="logo">
    {{#if logo.url}}
      <img src="{{logo.url}}" alt="Logo">
    {{else}}
      <div class="logo-text">{{issuer.name}}</div>
    {{/if}}
  </div>
  
  <div class="issuer">
    <strong>{{issuer.name}}</strong><br>
    {{issuer.address.street}} {{issuer.address.house_number}}<br>
    {{issuer.address.postal_code}} {{issuer.address.city}}
  </div>
</header>
```

### Handlebars Helpers nutzen

```handlebars
<!-- Währung formatieren -->
{{formatCurrency total}}  <!-- → 1.234,56 € -->

<!-- Datum formatieren -->
{{formatDate invoice.date}}  <!-- → 15.03.2024 -->

<!-- Berechnungen -->
{{multiply quantity unit_price}}  <!-- → Zeilensumme -->

<!-- Bedingungen -->
{{#ifGreater total 1000}}
  <div class="high-value-notice">Hoher Rechnungsbetrag</div>
{{/ifGreater}}
```

---

## 🧪 Testing & Debugging

### HTML-Preview für Debugging

```bash
# HTML anzeigen (ohne PDF-Generierung)
curl "http://localhost:3000/api/invoices/123?format=html" > debug.html
open debug.html
```

### Template-Validierung

```typescript
import { validateTemplateData } from '@/lib/template-engine';

const requiredFields = [
  'invoice.number',
  'invoice.date',
  'customer.name',
  'items'
];

const validation = validateTemplateData(data, requiredFields);
if (!validation.valid) {
  console.error('Missing fields:', validation.missing);
}
```

### Performance-Monitoring

```typescript
// PDF-Generierung messen
const startTime = Date.now();
const pdf = await generatePDF(html);
const duration = Date.now() - startTime;
console.log(`PDF generated in ${duration}ms`);
```

---

## 🐳 Docker Setup

### Dockerfile für Puppeteer

```dockerfile
FROM node:18-alpine

# Chromium installieren
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Puppeteer konfigurieren
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    volumes:
      - ./templates:/app/templates:ro
```

---

## 🚀 Production Deployment

### Vercel Deployment

```json
// vercel.json
{
  "functions": {
    "app/api/invoices/[id]/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD": "true"
  }
}
```

**Hinweis:** Puppeteer funktioniert nicht auf Vercel. Alternativen:
- Playwright (experimentell)
- Externe PDF-Services (PDFShift, HTMLtoPDF)
- Eigener Server mit Docker

### Performance-Optimierungen

```typescript
// Browser-Pool für bessere Performance
class BrowserPool {
  private browsers: puppeteer.Browser[] = [];
  private maxBrowsers = 3;
  
  async getBrowser(): Promise<puppeteer.Browser> {
    if (this.browsers.length < this.maxBrowsers) {
      const browser = await puppeteer.launch(browserOptions);
      this.browsers.push(browser);
      return browser;
    }
    
    // Round-robin
    return this.browsers[Math.floor(Math.random() * this.browsers.length)];
  }
}
```

---

## 🔍 Troubleshooting

### Häufige Probleme

#### 1. Puppeteer startet nicht

```bash
# Fehlende Dependencies installieren
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2

# Oder Alpine Linux
apk add --no-cache chromium nss freetype freetype-dev harfbuzz
```

#### 2. Fonts werden nicht geladen

```css
/* Lokale Fonts einbinden */
@font-face {
  font-family: 'Inter';
  src: url('data:font/woff2;base64,...') format('woff2');
}

/* Oder System-Fonts nutzen */
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
```

#### 3. Template nicht gefunden

```typescript
// Template-Pfad prüfen
const templatePath = path.join(process.cwd(), 'templates', 'invoice.hbs');
console.log('Template path:', templatePath);

// Existenz prüfen
if (!fs.existsSync(templatePath)) {
  throw new Error(`Template not found: ${templatePath}`);
}
```

#### 4. PDF-Qualität schlecht

```typescript
// Höhere DPI für bessere Qualität
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: false,
  scale: 1.0  // Wichtig für Schärfe
});
```

---

## 📚 Weiterführende Dokumentation

- [Puppeteer API](https://pptr.dev/)
- [Handlebars Guide](https://handlebarsjs.com/guide/)
- [CSS Print Styles](https://developer.mozilla.org/en-US/docs/Web/CSS/@page)
- [A4 Print Specifications](https://en.wikipedia.org/wiki/ISO_216)

---

## ✅ Checkliste für Go-Live

- [ ] Dependencies installiert (`puppeteer`, `handlebars`)
- [ ] Template-Verzeichnis erstellt
- [ ] API-Route funktioniert
- [ ] HTML-Preview zeigt korrektes Layout
- [ ] PDF wird generiert
- [ ] A4-Format korrekt (210×297mm)
- [ ] Ränder 20mm eingehalten
- [ ] Logo wird angezeigt
- [ ] Währungsformat DE (Komma)
- [ ] Datumsformat DE (DD.MM.YYYY)
- [ ] Seitenumbrüche korrekt
- [ ] Performance akzeptabel (<5s)
- [ ] Error-Handling implementiert
- [ ] Production-Deployment getestet

---

**Status:** ✅ Implementierung abgeschlossen  
**Nächste Schritte:** Dependencies installieren und testen