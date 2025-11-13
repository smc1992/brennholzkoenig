/*
 * Simple PDF analysis script using pdf-parse.
 * Usage: node scripts/analyze-pdf.js "/absolute/path/to/file.pdf"
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Fehler: Bitte einen PDF-Pfad übergeben.');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Fehler: Datei nicht gefunden: ${resolved}`);
    process.exit(1);
  }

  // Optional: pdf-parse Fallback wird später dynamisch geladen, wenn pdfjs-dist fehlschlägt

  const buf = fs.readFileSync(resolved);
  const sizeKB = (buf.length / 1024).toFixed(1);
  const start = Date.now();
  try {
    let pages = 'unbekannt';
    let meta = {};
    let text = '';
    let durMs;

    // Versuch 1: pdfjs-dist (legacy build für Node)
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      const { getDocument } = pdfjsLib;
      const loadingTask = getDocument({ data: buf });
      const pdf = await loadingTask.promise;
      pages = pdf.numPages;
      try {
        const md = await pdf.getMetadata();
        meta = md?.info || {};
      } catch (_) {}
      const pieces = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const pageText = tc.items.map(it => it.str).join(' ');
        pieces.push(pageText);
      }
      text = pieces.join('\n');
      durMs = Date.now() - start;
    } catch (e1) {
      throw e1;
    }

    const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
    const sampleLines = lines.slice(0, 80);

    console.log('=== PDF Analyse ===');
    console.log(`Datei: ${resolved}`);
    console.log(`Größe: ${sizeKB} KB`);
    console.log(`Seiten: ${pages}`);
    console.log(`Extraktionsdauer: ${durMs} ms`);
    console.log('--- Info ---');
    console.log(`Title: ${meta?.Title || meta?.title || ''}`);
    console.log(`Author: ${meta?.Author || meta?.author || ''}`);
    console.log(`Creator: ${meta?.Creator || meta?.creator || ''}`);
    console.log(`Producer: ${meta?.Producer || meta?.producer || ''}`);
    console.log(`CreationDate: ${meta?.CreationDate || meta?.creationDate || ''}`);
    console.log(`ModDate: ${meta?.ModDate || meta?.modDate || ''}`);
    console.log('--- Text (erste Zeilen) ---');
    if (sampleLines.length === 0) {
      console.log('(Kein extrahierbarer Text gefunden – vermutlich Bild-/Vektorbasiert)');
    } else {
      for (const line of sampleLines) {
        console.log(line);
      }
    }

    // einfache Feature-Erkennung für Formular/Tabellenstruktur
    const keywords = ['Bestellformular', 'Bestellung', 'Name', 'Adresse', 'E-Mail', 'Telefon', 'Artikel', 'Menge', 'Preis', 'Summe', 'Liefer', 'Zahlung'];
    const found = [];
    const lowerText = text.toLowerCase();
    for (const k of keywords) {
      if (lowerText.includes(k.toLowerCase())) found.push(k);
    }
    console.log('--- Erkannte Schlüsselwörter ---');
    console.log(found.length ? found.join(', ') : '(Keine Standard-Schlüsselwörter erkannt)');

    // Heuristik: Enthält das Dokument Tabellenausrichtung?
    const looksTabular = /\t|\s{2,}/.test(text);
    console.log('--- Struktur ---');
    console.log(`Tabellarisch wirkend: ${looksTabular ? 'Ja' : 'Nein/Unklar'}`);
  } catch (err) {
    console.error('Fehler bei der PDF-Analyse:', err.message || err);
    process.exit(1);
  }
}

main();