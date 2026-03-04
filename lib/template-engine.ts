import fs from 'fs/promises';
import path from 'path';

// Dynamic import für Handlebars
let Handlebars: any;
let SafeString: any;

try {
  Handlebars = require('handlebars');
  SafeString = Handlebars.SafeString;
} catch (error) {
  console.warn('Handlebars not installed. Install with: npm install handlebars @types/handlebars');
}

// Type für Template-Delegate
type TemplateDelegate = (context: any) => string;

// Handlebars Helpers registrieren
export function registerHelpers() {
  if (!Handlebars) {
    console.warn('Handlebars not available, skipping helper registration');
    return;
  }

  // Datum formatieren (DE)
  Handlebars.registerHelper('formatDate', function(date: string | Date) {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  });

  // Währung formatieren (DE)
  Handlebars.registerHelper('formatCurrency', function(amount: number) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0,00 €';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  });

  // Zahlen formatieren (DE)
  Handlebars.registerHelper('formatNumber', function(number: number, decimals?: number) {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals || 0,
      maximumFractionDigits: decimals || 2
    }).format(number);
  });

  // Addition
  Handlebars.registerHelper('add', function(a: number, b: number) {
    return (a || 0) + (b || 0);
  });

  // Subtraktion
  Handlebars.registerHelper('subtract', function(a: number, b: number) {
    return (a || 0) - (b || 0);
  });

  // Multiplikation
  Handlebars.registerHelper('multiply', function(a: number, b: number) {
    return (a || 0) * (b || 0);
  });

  // Division
  Handlebars.registerHelper('divide', function(a: number, b: number) {
    if (!b || b === 0) return 0;
    return (a || 0) / b;
  });

  // Prozent formatieren
  Handlebars.registerHelper('formatPercent', function(number: number) {
    if (typeof number !== 'number' || isNaN(number)) return '0%';
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number / 100);
  });

  // Bedingte Klassen
  Handlebars.registerHelper('classIf', function(condition: boolean, className: string) {
    return condition ? className : '';
  });

  // String kürzen
  Handlebars.registerHelper('truncate', function(str: string, length: number) {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  });

  // Erste Zeile extrahieren
  Handlebars.registerHelper('firstLine', function(str: string) {
    if (!str || typeof str !== 'string') return '';
    return str.split('\n')[0];
  });

  // Zeilenumbrüche zu <br> konvertieren
  Handlebars.registerHelper('nl2br', function(str: string) {
    if (!str || typeof str !== 'string') return '';
    return SafeString ? new SafeString(str.replace(/\n/g, '<br>')) : str.replace(/\n/g, '<br>');
  });

  // Bedingte Ausgabe
  Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });

  // Bedingte Ausgabe (nicht gleich)
  Handlebars.registerHelper('ifNotEquals', function(this: any, arg1: any, arg2: any, options: any) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
  });

  // Größer als
  Handlebars.registerHelper('ifGreater', function(this: any, arg1: number, arg2: number, options: any) {
    return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
  });

  // Kleiner als
  Handlebars.registerHelper('ifLess', function(this: any, arg1: number, arg2: number, options: any) {
    return (arg1 < arg2) ? options.fn(this) : options.inverse(this);
  });

  // Array-Länge
  Handlebars.registerHelper('length', function(array: any[]) {
    if (!Array.isArray(array)) return 0;
    return array.length;
  });

  // JSON stringify für Debugging
  Handlebars.registerHelper('json', function(obj: any) {
    return new Handlebars.SafeString(JSON.stringify(obj, null, 2));
  });

  // Aktuelles Jahr
  Handlebars.registerHelper('currentYear', function() {
    return new Date().getFullYear();
  });

  // Aktuelles Datum
  Handlebars.registerHelper('currentDate', function() {
    return new Date().toLocaleDateString('de-DE');
  });

  // MwSt berechnen
  Handlebars.registerHelper('calculateTax', function(netAmount: number, taxRate: number) {
    if (typeof netAmount !== 'number' || typeof taxRate !== 'number') return 0;
    return (netAmount * taxRate) / 100;
  });

  // Brutto berechnen
  Handlebars.registerHelper('calculateGross', function(netAmount: number, taxRate: number) {
    if (typeof netAmount !== 'number' || typeof taxRate !== 'number') return netAmount || 0;
    return netAmount + ((netAmount * taxRate) / 100);
  });

  // Netto aus Brutto berechnen
  Handlebars.registerHelper('calculateNet', function(grossAmount: number, taxRate: number) {
    if (typeof grossAmount !== 'number' || typeof taxRate !== 'number') return grossAmount || 0;
    return grossAmount / (1 + (taxRate / 100));
  });
}

// Template laden und kompilieren
export async function loadTemplate(templateName: string): Promise<TemplateDelegate> {
  if (!Handlebars) {
    throw new Error('Handlebars not available. Install with: npm install handlebars @types/handlebars');
  }

  try {
    const templatePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Helpers registrieren falls noch nicht geschehen
    registerHelpers();
    
    return Handlebars.compile(templateContent);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Template ${templateName} not found or invalid`);
  }
}

// Partial Templates registrieren
export async function registerPartials() {
  try {
    const partialsDir = path.join(process.cwd(), 'templates', 'partials');
    
    // Prüfen ob Partials-Verzeichnis existiert
    try {
      await fs.access(partialsDir);
    } catch {
      // Partials-Verzeichnis existiert nicht, überspringen
      return;
    }
    
    const partialFiles = await fs.readdir(partialsDir);
    
    for (const file of partialFiles) {
      if (file.endsWith('.hbs')) {
        const partialName = path.basename(file, '.hbs');
        const partialPath = path.join(partialsDir, file);
        const partialContent = await fs.readFile(partialPath, 'utf-8');
        
        Handlebars.registerPartial(partialName, partialContent);
      }
    }
  } catch (error) {
    console.error('Error registering partials:', error);
  }
}

// Template mit Daten rendern
export async function renderTemplate(templateName: string, data: any): Promise<string> {
  try {
    // Partials registrieren
    await registerPartials();
    
    // Template laden
    const template = await loadTemplate(templateName);
    
    // Rendern
    return template(data);
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw error;
  }
}

// Template-Validierung
export function validateTemplateData(data: any, requiredFields: string[]): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    const fieldPath = field.split('.');
    let current = data;
    
    for (const part of fieldPath) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        missing.push(field);
        break;
      }
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Template-Cache für Performance
const templateCache = new Map<string, TemplateDelegate>();

export async function getCachedTemplate(templateName: string): Promise<TemplateDelegate> {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }
  
  const template = await loadTemplate(templateName);
  templateCache.set(templateName, template);
  
  return template;
}

// Cache leeren (für Development)
export function clearTemplateCache() {
  templateCache.clear();
}

// Template-Debugging
export function debugTemplate(templateName: string, data: any) {
  console.log(`\n=== Template Debug: ${templateName} ===`);
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('=== End Debug ===\n');
}