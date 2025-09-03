# Invoice HTML → PDF Audit Report

**Datum:** $(date +%Y-%m-%d)  
**Projekt:** Brennholzkönig Invoice System  
**Audit-Typ:** IST vs. SOLL Analyse für HTML→PDF Rechnungsvorlage  

## Executive Summary

**Status:** 🔴 **Kritische Abweichungen gefunden**

Das aktuelle System verwendet jsPDF für PDF-Generierung, entspricht aber nicht den Anforderungen für eine professionelle HTML→PDF Pipeline mit Puppeteer und Handlebars-Templates.

---

## IST vs. SOLL Analyse

| Kriterium | SOLL | IST | Status | Priorität |
|-----------|------|-----|--------|----------|
| **Template-Engine** | Handlebars (.hbs) | jsPDF (programmatisch) | ❌ | Hoch |
| **PDF-Engine** | Puppeteer (HTML→PDF) | jsPDF (Canvas-basiert) | ❌ | Hoch |
| **API-Route** | `/api/invoices/[id]/route.ts` | Nicht vorhanden | ❌ | Hoch |
| **A4-Layout** | 210×297mm, 20mm Ränder | Teilweise implementiert | ⚠️ | Mittel |
| **Logo-Position** | Links oben | Links oben | ✅ | - |
| **Issuer-Position** | Rechts oben | Rechts oben | ✅ | - |
| **DIN-Brief Layout** | Empfänger links unter Header | Nicht DIN-konform | ❌ | Mittel |
| **Metadaten-Zeile** | Rechnungs-Nr., Datum, etc. | Vorhanden | ✅ | - |
| **Positionstabelle** | Strukturiert mit MwSt | Vorhanden | ✅ | - |
| **Footer** | Fix am Seitenende | Dynamisch positioniert | ⚠️ | Niedrig |
| **Seitenzahlen** | X/Y Format | Nicht implementiert | ❌ | Niedrig |
| **Print-CSS** | @page, page-break Regeln | Nicht vorhanden | ❌ | Hoch |
| **Typografie** | Inter, 12pt/14-18pt | Helvetica, verschiedene Größen | ⚠️ | Niedrig |
| **Währungsformat** | de-DE (Komma) | Punkt-Format | ❌ | Mittel |
| **Template-Struktur** | Getrennte .hbs/.css Dateien | Monolithische Klasse | ❌ | Hoch |

---

## Gefundene Abweichungen

### 🔴 Kritische Probleme

#### 1. Fehlende HTML→PDF Pipeline
**Problem:** Aktuell wird jsPDF verwendet statt Puppeteer + HTML-Templates  
**Impact:** Keine pixelgenaue Kontrolle, schwer wartbar, nicht drucktauglich  
**Fix:** Komplette Neuimplementierung mit Puppeteer

#### 2. Keine Template-Engine
**Problem:** Keine Handlebars-Templates, alles hardcoded in TypeScript  
**Impact:** Schwer anpassbar, keine Wiederverwendbarkeit  
**Fix:** Handlebars-Templates mit Platzhaltern implementieren

#### 3. Fehlende API-Route
**Problem:** Keine dedizierte `/api/invoices/[id]/route.ts`  
**Impact:** PDF-Generierung nicht über REST-API verfügbar  
**Fix:** API-Route mit GET/POST Endpoints erstellen

#### 4. Keine Print-CSS
**Problem:** Keine @page Regeln, page-break Kontrolle  
**Impact:** Unvorhersagbare Seitenumbrüche, nicht drucktauglich  
**Fix:** Dedizierte Print-CSS mit A4-Spezifikationen

### ⚠️ Mittlere Probleme

#### 5. Währungsformat
**Problem:** Verwendet Punkt statt Komma als Dezimaltrenner  
**Impact:** Nicht DE-konform  
**Fix:** Intl.NumberFormat('de-DE') implementieren

#### 6. DIN-Brief Layout
**Problem:** Empfängerblock nicht DIN-konform positioniert  
**Impact:** Nicht professionell, passt nicht in Briefumschläge  
**Fix:** DIN 5008 konforme Positionierung

### ✅ Funktionierende Bereiche

- Logo-Integration (mit Fallback)
- Firmeninformationen rechtsbündig
- Grundlegende Tabellenstruktur
- Summenberechnung
- Responsive Logo-Skalierung

---

## Implementierungsplan

### Phase 1: Grundstruktur (Priorität: Hoch)

1. **HTML-Template erstellen**
   ```
   /templates/invoice.hbs
   /templates/invoice.css
   ```

2. **API-Route implementieren**
   ```
   /app/api/invoices/[id]/route.ts
   ```

3. **Puppeteer Integration**
   ```bash
   npm install puppeteer handlebars
   ```

### Phase 2: Layout & Design (Priorität: Mittel)

4. **A4 Print-CSS**
   - @page Regeln
   - 20mm Ränder
   - page-break Kontrolle

5. **DIN-Brief Layout**
   - Empfängerblock korrekt positionieren
   - Metadaten-Zeile optimieren

6. **Typografie**
   - Inter Font einbinden
   - Konsistente Schriftgrößen

### Phase 3: Verfeinerung (Priorität: Niedrig)

7. **Seitenzahlen**
8. **Erweiterte Print-Features**
9. **Performance-Optimierung**

---

## Technische Spezifikationen

### Neue Dateistruktur

```
/templates/
  ├── invoice.hbs          # Handlebars Template
  ├── invoice.css          # Print-optimierte Styles
  └── partials/
      ├── header.hbs       # Header-Komponente
      ├── footer.hbs       # Footer-Komponente
      └── table.hbs        # Tabellen-Komponente

/app/api/invoices/
  └── [id]/
      └── route.ts         # PDF-API Endpoint

/lib/
  ├── pdf-generator.ts     # Puppeteer PDF-Engine
  ├── template-engine.ts   # Handlebars Helper
  └── invoice-helpers.ts   # Berechnungen & Formatierung
```

### Handlebars Template Struktur

```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rechnung {{invoice.number}}</title>
  <link rel="stylesheet" href="invoice.css">
</head>
<body>
  {{> header issuer=issuer logo=logo}}
  
  <div class="recipient">
    {{customer.name}}<br>
    {{customer.address.street}} {{customer.address.house_number}}<br>
    {{customer.address.postal_code}} {{customer.address.city}}
  </div>
  
  <div class="metadata">
    <table>
      <tr>
        <td>Rechnungs-Nr.:</td>
        <td>{{invoice.number}}</td>
        <td>Kunden-Nr.:</td>
        <td>{{customer.number}}</td>
      </tr>
      <tr>
        <td>Datum:</td>
        <td>{{formatDate invoice.date}}</td>
        <td>Fällig bis:</td>
        <td>{{formatDate invoice.due_date}}</td>
      </tr>
    </table>
  </div>
  
  {{> table items=items}}
  
  <div class="totals">
    <table>
      <tr>
        <td>Netto:</td>
        <td>{{formatCurrency subtotal}}</td>
      </tr>
      <tr>
        <td>MwSt. {{tax_rate}}%:</td>
        <td>{{formatCurrency tax_amount}}</td>
      </tr>
      <tr class="total">
        <td>Gesamt:</td>
        <td>{{formatCurrency total}}</td>
      </tr>
    </table>
  </div>
  
  {{> footer issuer=issuer}}
</body>
</html>
```

### CSS Print-Spezifikationen

```css
@page {
  size: A4;
  margin: 20mm;
}

@media print {
  .no-print { display: none; }
  
  table {
    page-break-inside: avoid;
  }
  
  tr {
    page-break-inside: avoid;
  }
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12pt;
  line-height: 1.4;
  color: #000;
}

h1 {
  font-size: 18pt;
  font-weight: 600;
}

h2 {
  font-size: 14pt;
  font-weight: 500;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40pt;
}

.logo {
  max-width: 150pt;
  max-height: 80pt;
}

.issuer {
  text-align: right;
  font-size: 10pt;
}

.recipient {
  margin-bottom: 30pt;
  font-size: 11pt;
}

.metadata table {
  width: 100%;
  margin-bottom: 20pt;
  font-size: 10pt;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20pt;
}

.items-table th,
.items-table td {
  padding: 8pt;
  border-bottom: 1pt solid #ddd;
  text-align: left;
}

.items-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.items-table .number {
  text-align: right;
}

.totals {
  margin-left: auto;
  width: 200pt;
}

.totals table {
  width: 100%;
  font-size: 11pt;
}

.totals .total {
  font-weight: 600;
  border-top: 2pt solid #000;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40pt;
  font-size: 8pt;
  text-align: center;
  border-top: 1pt solid #ddd;
  padding-top: 10pt;
}
```

---

## Nächste Schritte

### Sofortige Maßnahmen (Diese Woche)

1. ✅ **Audit-Report erstellen** (Aktuell)
2. 🔄 **Puppeteer & Handlebars installieren**
3. 🔄 **Basis HTML-Template erstellen**
4. 🔄 **API-Route implementieren**

### Kurzfristig (Nächste 2 Wochen)

5. 🔄 **Print-CSS optimieren**
6. 🔄 **DIN-Brief Layout implementieren**
7. 🔄 **Währungsformatierung korrigieren**
8. 🔄 **Template-Engine integrieren**

### Mittelfristig (Nächster Monat)

9. 🔄 **Seitenzahlen implementieren**
10. 🔄 **Performance-Tests durchführen**
11. 🔄 **Dokumentation erstellen**
12. 🔄 **Migration von jsPDF zu Puppeteer**

---

## Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Puppeteer Performance | Mittel | Hoch | Caching, Optimierung |
| Template-Komplexität | Niedrig | Mittel | Schrittweise Migration |
| Print-Kompatibilität | Niedrig | Hoch | Extensive Tests |
| Breaking Changes | Hoch | Mittel | Parallel-Implementierung |

---

## Fazit

Die aktuelle jsPDF-Implementierung funktioniert grundlegend, entspricht aber nicht den professionellen Anforderungen für eine HTML→PDF Pipeline. Eine komplette Neuimplementierung mit Puppeteer und Handlebars ist erforderlich, um die Ziele zu erreichen.

**Empfehlung:** Parallel-Implementierung der neuen HTML→PDF Pipeline neben der bestehenden jsPDF-Lösung, um Risiken zu minimieren.

---

**Erstellt von:** AI Assistant  
**Review:** Pending  
**Nächstes Update:** Nach Phase 1 Implementierung