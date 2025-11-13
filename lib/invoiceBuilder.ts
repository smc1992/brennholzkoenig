import puppeteer, { PDFOptions, Browser } from 'puppeteer';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Handlebars from 'handlebars';

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  order_number?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    customer_number?: string;
    company?: string;
    address: {
      street: string;
      house_number: string;
      postal_code: string;
      city: string;
    };
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category?: string;
    product_code?: string;
  }>;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  payment_terms?: string;
  notes?: string;
  delivery_address?: {
    name: string;
    company?: string;
    street: string;
    house_number: string;
    line2?: string;
    postal_code: string;
    city: string;
  };
}

export interface CompanySettings {
  company_name: string;
  company_address_line1: string;
  company_address_line2?: string;
  company_postal_code: string;
  company_city: string;
  company_phone: string;
  company_email: string;
  company_website?: string;
  tax_id?: string;
  vat_rate?: number;
  default_tax_included?: boolean;
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
  logo_url?: string;
  currency_symbol?: string;
  invoice_footer_text?: string;
  company_ceo?: string;
  company_registration?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  html_template: string;
  css_styles: string;
  preview_image?: string;
  is_default: boolean;
}

export class ModernInvoiceBuilder {
  private templateCache = new Map<string, string>();
  private browser: Browser | null = null;

  constructor() {
    this.initializeBrowser();
  }

  private async initializeBrowser() {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 Launching Puppeteer browser (attempt ${attempt}/${maxRetries})...`);
        
        // Schließe alten Browser falls vorhanden
        if (this.browser) {
          try {
            await this.browser.close();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            console.warn('Error closing old browser:', e);
          }
          this.browser = null;
        }
        
        // Produktionsumgebung erkennen und entsprechende Konfiguration verwenden
        const isProduction = process.env.NODE_ENV === 'production';
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
          (isProduction ? '/usr/bin/google-chrome-stable' : undefined);
        
        console.log('Environment:', { 
          isProduction, 
          executablePath, 
          attempt,
          memoryUsage: process.memoryUsage()
        });
        
        // Bewährte Praktiken für Container-Umgebungen basierend auf Community-Feedback
         const browserArgs = [
           '--no-sandbox',
           '--disable-setuid-sandbox',
           '--disable-dev-shm-usage',
           '--disable-gpu',
           '--disable-software-rasterizer',
           '--disable-background-timer-throttling',
           '--disable-backgrounding-occluded-windows',
           '--disable-renderer-backgrounding',
           '--disable-extensions',
           '--disable-default-apps',
           '--disable-sync',
           '--no-first-run',
           '--no-default-browser-check',
           '--memory-pressure-off',
           '--disable-ipc-flooding-protection',
           '--disable-background-networking',
           '--disable-client-side-phishing-detection',
           '--disable-hang-monitor',
           '--disable-popup-blocking',
           '--disable-prompt-on-repost',
           '--metrics-recording-only',
           '--force-color-profile=srgb'
         ];
         
         // Container-spezifische Optimierungen
         if (isProduction) {
           browserArgs.push(
             '--single-process',  // Kritisch für Container-Stabilität
             '--disable-web-security',
             '--disable-features=VizDisplayCompositor',
             '--disable-breakpad',
             '--disable-component-extensions-with-background-pages',
             '--disable-features=TranslateUI',
             '--use-mock-keychain',
             '--password-store=basic'
           );
         }
         
         this.browser = await puppeteer.launch({
           headless: true,
           executablePath,
           args: browserArgs,
           timeout: 60000,         // Reduziert für schnellere Fehlererkennnung
           protocolTimeout: 60000,
           handleSIGINT: false,
           handleSIGTERM: false,
           handleSIGHUP: false,
           ignoreDefaultArgs: false,  // Verwende Standard-Args
           defaultViewport: {
             width: 1024,
             height: 768,
             deviceScaleFactor: 1
           },
           pipe: true  // Verwende Pipes statt WebSocket für bessere Stabilität
         });
        
        // Browser-Verbindung testen
        const pages = await this.browser.pages();
        console.log(`✅ Browser initialized successfully with ${pages.length} pages`);
        
        // Event-Handler für Browser-Disconnect
        this.browser.on('disconnected', () => {
          console.warn('⚠️ Browser disconnected unexpectedly');
          this.browser = null;
        });
        
        return; // Erfolgreiche Initialisierung
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Browser initialization attempt ${attempt} failed:`, lastError.message);
        
        if (this.browser) {
          try {
            await this.browser.close();
          } catch (e) {
            console.warn('Error closing failed browser:', e);
          }
          this.browser = null;
        }
        
        // Warte vor nächstem Versuch
        if (attempt < maxRetries) {
          const delay = attempt * 2000; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Alle Versuche fehlgeschlagen
    console.error('❌ All browser initialization attempts failed');
    console.error('Error details:', {
      message: lastError?.message,
      stack: lastError?.stack,
      environment: process.env.NODE_ENV,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      memoryUsage: process.memoryUsage()
    });
    
    // Detaillierte Fehlermeldung für Produktionsumgebung
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production PDF generation failed. Possible causes:');
      console.error('1. Insufficient memory (need ≥1GB)');
      console.error('2. Chrome/Chromium not properly installed');
      console.error('3. Container resource limits too low');
      console.error('4. Browser process killed by OOM killer');
      console.error('5. Network/protocol timeout issues');
      console.error('💡 Solutions:');
      console.error('- Increase memory limit to 2GB');
      console.error('- Use Dockerfile.puppeteer');
      console.error('- Check container logs for OOM kills');
      console.error('- Verify Chrome installation path');
    }
    
    throw new Error(`PDF generation failed after ${maxRetries} attempts: ${lastError?.message}. Check server logs for details.`);
  }

  /**
   * Registriert Handlebars Helper
   */
  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatDate', (date) => {
      if (!date) return '';
      return this.formatDate(date);
    });
    
    Handlebars.registerHelper('formatCurrency', (amount) => {
      if (!amount) return '0,00 €';
      return this.formatCurrency(parseFloat(amount));
    });
    
    Handlebars.registerHelper('add', (a, b) => {
      return (a || 0) + (b || 0);
    });
    
    Handlebars.registerHelper('subtract', (a, b) => {
      return (a || 0) - (b || 0);
    });
    
    Handlebars.registerHelper('multiply', (a, b) => {
      return (a || 0) * (b || 0);
    });
    
    Handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });
    
    Handlebars.registerHelper('ne', (a, b) => {
      return a !== b;
    });
    
    Handlebars.registerHelper('gt', (a, b) => {
      return a > b;
    });
    
    Handlebars.registerHelper('lt', (a, b) => {
      return a < b;
    });
    
    Handlebars.registerHelper('formatNumber', (number) => {
      if (!number) return '0';
      return parseFloat(number).toLocaleString('de-DE');
    });
  }

  /**
   * Generiert eine HTML-Vorschau der Rechnung
   */
  public async generatePreview(
    invoiceData: InvoiceData,
    companySettings: CompanySettings,
    templateId: string = 'invoice'
  ): Promise<string> {
    // Registriere Handlebars Helper
    this.registerHandlebarsHelpers();
    
    const template = await this.getTemplate(templateId);
    const compiledTemplate = Handlebars.compile(template);
    
    const templateData = {
      invoice: {
        number: invoiceData.invoice_number,
        date: this.formatDate(invoiceData.invoice_date),
        due_date: this.formatDate(invoiceData.due_date),
        order_number: invoiceData.order_number
      },
      company: {
        name: companySettings.company_name,
        address_line1: companySettings.company_address_line1,
        address_line2: companySettings.company_address_line2,
        postal_code: companySettings.company_postal_code,
        city: companySettings.company_city,
        phone: companySettings.company_phone,
        email: companySettings.company_email,
        website: companySettings.company_website,
        tax_id: companySettings.tax_id,
        logo_url: companySettings.logo_url,
        ceo: companySettings.company_ceo,
        registration: companySettings.company_registration,
        default_tax_included: companySettings.default_tax_included
      },
      customer: {
        name: invoiceData.customer.name,
        email: invoiceData.customer.email,
        phone: invoiceData.customer.phone,
        customer_number: invoiceData.customer.customer_number,
        address: invoiceData.customer.address
      },
      delivery_address: invoiceData.delivery_address,
      items: invoiceData.items.map(item => ({
        name: item.description,  // Template erwartet 'name'
        category: item.category || 'Brennholz',   // Dynamische Kategorie aus Item, Fallback 'Brennholz'
        quantity: item.quantity,
        unitPrice: item.unit_price,   // Template formatiert mit formatCurrency Helper
        totalPrice: item.total_price, // Template formatiert mit formatCurrency Helper
        unit_price_formatted: this.formatCurrency(item.unit_price, companySettings.currency_symbol),
        total_price_formatted: this.formatCurrency(item.total_price, companySettings.currency_symbol),
        product_code: item.product_code
      })),
      totals: {
        subtotal: invoiceData.subtotal_amount,  // Rohe Zahl für Handlebars Helper
        tax_rate: invoiceData.tax_rate,
        tax: invoiceData.tax_amount,  // Rohe Zahl für Handlebars Helper
        total: invoiceData.total_amount  // Rohe Zahl für Handlebars Helper
      },
      payment: {
        terms: invoiceData.payment_terms,
        bank_name: companySettings.bank_name,
        iban: companySettings.bank_iban,
        bic: companySettings.bank_bic
      },
      notes: invoiceData.notes,
      footer_text: companySettings.invoice_footer_text,
      current_date: this.formatDate(new Date().toISOString())
    };

    return compiledTemplate(templateData);
  }

  /**
   * Generiert ein PDF aus der HTML-Rechnung
   */
  public async generatePDF(
    invoiceData: InvoiceData,
    companySettings: CompanySettings,
    templateId: string = 'invoice',
    options: {
      format?: 'A4' | 'Letter';
      margin?: { top: string; right: string; bottom: string; left: string };
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    } = {}
  ): Promise<Buffer> {
    // Überprüfe ob Browser existiert und noch verbunden ist
    if (!this.browser || !this.browser.connected) {
      console.log('🔄 Browser not connected, reinitializing...');
      await this.initializeBrowser();
    }

    if (!this.browser || !this.browser.connected) {
      throw new Error('Failed to initialize browser for PDF generation');
    }

    // Minimale Wartezeit für maximale Performance
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Überprüfe Browser-Status nochmals
    if (!this.browser.connected) {
      console.log('🔄 Browser disconnected after wait, reinitializing...');
      await this.initializeBrowser();
    }

    const html = await this.generatePreview(invoiceData, companySettings, templateId);
    
    let page: any = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Überprüfe Browser-Status vor jeder Page-Erstellung
        if (!this.browser || !this.browser.connected) {
          console.log('🔄 Browser disconnected, reinitializing...');
          await this.initializeBrowser();
        }
        
        page = await this.browser!.newPage();
        break;
      } catch (error) {
        retryCount++;
        console.error(`❌ Failed to create new page (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to create page after ${maxRetries} attempts: ${error}`);
        }
        
        // Warte kurz und initialisiere Browser neu
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.initializeBrowser();
      }
    }

    if (!page) {
      throw new Error('Failed to create page after all retry attempts');
    }

    try {
      // Setze Viewport für konsistente Darstellung
      await page.setViewport({ width: 1200, height: 1600 });
      
      console.log('📝 Setting page content with setContent method...');
      // Verwende setContent für maximale Stabilität
      try {
        await page.setContent(html, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Kurze Stabilisierung
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Überprüfe dass der Frame noch verfügbar ist
        try {
          await page.evaluate(() => document.readyState);
          console.log('✅ Content set successfully with setContent method');
        } catch (evalError) {
          throw new Error('Frame became detached after setContent');
        }
      } catch (contentError) {
        console.error('❌ Content injection failed:', contentError);
        throw new Error(`Failed to inject page content: ${contentError}`);
      }
      
      console.log('⏳ Waiting for fonts and resources...');
      // Warte auf Bilder und Fonts mit Fehlerbehandlung
      try {
        await page.evaluateHandle('document.fonts.ready');
        await page.evaluate(() => {
          return new Promise((resolve) => {
            if (document.readyState === 'complete') {
              resolve(true);
            } else {
              window.addEventListener('load', () => resolve(true));
            }
          });
        });
      } catch (fontError) {
        console.warn('⚠️ Font loading failed:', fontError);
      }
      
      // Minimale Wartezeit für bessere Performance
      await new Promise(resolve => setTimeout(resolve, 100));

      // PDF-Optionen - CSS @page-Regeln haben Priorität
      const pdfOptions: PDFOptions = {
        format: options.format || 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
      };

      console.log('📄 Generating PDF...');
      
      // Überprüfe Page-Status vor PDF-Generierung
      if (page.isClosed()) {
        throw new Error('Page was closed before PDF generation');
      }
      
      let pdfBuffer;
      try {
        // Überprüfe nochmals Page-Status
        if (page.isClosed()) {
          throw new Error('Page was closed during PDF generation');
        }
        
        pdfBuffer = await page.pdf(pdfOptions);
        console.log('✅ PDF generated successfully');
        
        // Warte kurz nach PDF-Generierung
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('❌ PDF generation failed:', error);
        throw new Error(`PDF generation failed: ${error}`);
      }
      
      return Buffer.from(pdfBuffer);
    } finally {
      if (page && !page.isClosed()) {
        try {
          // Warte vor Page-Schließung
          await new Promise(resolve => setTimeout(resolve, 500));
          await page.close();
          console.log('🔒 Page closed successfully');
          // Warte nach Page-Schließung
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.warn('⚠️ Error closing page:', e);
        }
      }
    }
  }

  /**
   * Erstellt einen Screenshot der Rechnung für Vorschau
   */
  public async generateScreenshot(
    invoiceData: InvoiceData,
    companySettings: CompanySettings,
    templateId: string = 'invoice',
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<Buffer> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    if (!this.browser) {
      throw new Error('Failed to initialize browser for screenshot generation');
    }

    const html = await this.generatePreview(invoiceData, companySettings, templateId);
    const page = await this.browser.newPage();

    try {
      await page.setViewport({ 
        width: options.width || 800, 
        height: options.height || 1200 
      });
      
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      await page.evaluateHandle('document.fonts.ready');
      await new Promise(resolve => setTimeout(resolve, 500));

      const screenshot = await page.screenshot({
        type: 'png',
        quality: options.quality || 90,
        fullPage: true
      });

      return Buffer.from(screenshot);
    } finally {
      await page.close();
    }
  }

  /**
   * Lädt ein Template aus der Datenbank oder Datei
   */
  private async getTemplate(templateId: string): Promise<string> {
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    try {
      // Versuche Template aus Datei zu laden
      const templatePath = join(process.cwd(), 'templates', `${templateId}.hbs`);
      const template = await readFile(templatePath, 'utf-8');
      this.templateCache.set(templateId, template);
      return template;
    } catch (error) {
      // Fallback auf Standard-Template
      const defaultTemplate = await this.getDefaultTemplate();
      this.templateCache.set(templateId, defaultTemplate);
      return defaultTemplate;
    }
  }

  /**
   * Standard-Template für Rechnungen
   */
  private async getDefaultTemplate(): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rechnung {{invoice.number}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1a1a1a;
      background: white;
    }
    
    .invoice-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-logo {
      max-width: 150px;
      max-height: 80px;
      margin-bottom: 15px;
    }
    
    .company-name {
      font-size: 18pt;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .company-address {
      font-size: 10pt;
      color: #6b7280;
      line-height: 1.3;
    }
    
    .invoice-title {
      text-align: right;
      flex: 1;
    }
    
    .invoice-title h1 {
      font-size: 24pt;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .invoice-meta {
      font-size: 10pt;
      color: #6b7280;
    }
    
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .customer-info, .invoice-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .items-table th {
      background: #1f2937;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 10pt;
    }
    
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10pt;
    }
    
    .items-table tr:last-child td {
      border-bottom: none;
    }
    
    .items-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .text-right {
      text-align: right;
    }
    
    .totals {
      margin-left: auto;
      width: 300px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .totals-row:last-child {
      border-bottom: none;
      font-weight: 600;
      font-size: 12pt;
      color: #1f2937;
      border-top: 2px solid #1f2937;
      padding-top: 12px;
      margin-top: 8px;
    }
    
    .payment-info {
      margin-top: 40px;
      padding: 20px;
      background: #f0f9ff;
      border-radius: 8px;
      border-left: 4px solid #0ea5e9;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        {{#if company.logo_url}}
        <img src="{{company.logo_url}}" alt="{{company.name}}" class="company-logo">
        {{/if}}
        <div class="company-name">{{company.name}}</div>
        <div class="company-address">
          {{company.address_line1}}<br>
          {{#if company.address_line2}}{{company.address_line2}}<br>{{/if}}
          {{company.postal_code}} {{company.city}}<br>
          Tel: {{company.phone}}<br>
          E-Mail: {{company.email}}
          {{#if company.website}}<br>Web: {{company.website}}{{/if}}
        </div>
      </div>
      
      <div class="invoice-title">
        <h1>RECHNUNG</h1>
        <div class="invoice-meta">
          <strong>Nr:</strong> {{invoice.number}}<br>
          <strong>Datum:</strong> {{invoice.date}}<br>
          <strong>Fällig:</strong> {{invoice.due_date}}<br>
          {{#if customer.customer_number}}<strong>Kunden-Nr:</strong> {{customer.customer_number}}{{else}}<strong>Kunden-Nr:</strong> -{{/if}}
          {{#if invoice.order_number}}<br><strong>Bestellung:</strong> {{invoice.order_number}}{{/if}}
        </div>
      </div>
    </div>
    
    <!-- Invoice Details -->
    <div class="invoice-details">
      <div class="customer-info">
        <div class="section-title">Rechnungsadresse</div>
        <strong>{{customer.name}}</strong><br>
        {{customer.address.street}} {{customer.address.house_number}}<br>
        {{customer.address.postal_code}} {{customer.address.city}}<br>
        {{#if customer.email}}E-Mail: {{customer.email}}<br>{{/if}}
        {{#if customer.phone}}Tel: {{customer.phone}}{{/if}}
      </div>
      
      {{#if delivery_address}}
      <div class="invoice-info">
        <div class="section-title">Lieferadresse</div>
        {{delivery_address.street}} {{delivery_address.house_number}}<br>
        {{delivery_address.postal_code}} {{delivery_address.city}}
      </div>
      {{/if}}
    </div>
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Beschreibung</th>
          <th class="text-right">Menge</th>
          <th class="text-right">Einzelpreis</th>
          <th class="text-right">Gesamtpreis</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>
            <strong>{{this.description}}</strong>
            {{#if this.product_code}}<br><small>Art.-Nr.: {{this.product_code}}</small>{{/if}}
          </td>
          <td class="text-right">{{this.quantity}}</td>
          <td class="text-right">{{this.unit_price_formatted}}</td>
          <td class="text-right">{{this.total_price_formatted}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span>Zwischensumme:</span>
        <span>{{formatCurrency totals.subtotal}}</span>
      </div>
      <div class="totals-row">
        <span>zzgl. {{totals.tax_rate}}% MwSt.:</span>
        <span>{{formatCurrency totals.tax}}</span>
      </div>
      <div class="totals-row">
        <span>Gesamtbetrag:</span>
        <span>{{formatCurrency totals.total}}</span>
      </div>
    </div>
    
    <!-- Payment Info -->
    {{#if payment.bank_name}}
    <div class="payment-info">
      <div class="section-title">Zahlungsinformationen</div>
      {{#if payment.terms}}{{payment.terms}}<br><br>{{/if}}
      <strong>Bankverbindung:</strong><br>
      {{payment.bank_name}}<br>
      IBAN: {{payment.iban}}<br>
      {{#if payment.bic}}BIC: {{payment.bic}}{{/if}}
    </div>
    {{/if}}
    
    {{#if notes}}
    <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px;">
      <strong>Anmerkungen:</strong><br>
      {{notes}}
    </div>
    {{/if}}
    
    <!-- Footer -->
    <div class="footer">
      {{#if company.ceo}}Geschäftsführer: {{company.ceo}} | {{/if}}
      {{#if company.registration}}{{company.registration}} | {{/if}}
      {{#if company.tax_id}}Steuernummer: {{company.tax_id}}{{/if}}
      {{#if footer_text}}<br><br>{{footer_text}}{{/if}}
    </div>
  </div>
</body>
</html>
`;
  }

  /**
   * Formatiert Datum für deutsche Darstellung
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatiert Währungsbeträge
   */
  private formatCurrency(amount: number, symbol: string = '€'): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: symbol === '€' ? 'EUR' : 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Leert den Template-Cache
   */
  public clearTemplateCache(): void {
    this.templateCache.clear();
  }

  /**
   * Schließt den Browser
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton-Instanz für die Anwendung
let invoiceBuilderInstance: ModernInvoiceBuilder | null = null;

export function getInvoiceBuilder(): ModernInvoiceBuilder {
  if (!invoiceBuilderInstance) {
    invoiceBuilderInstance = new ModernInvoiceBuilder();
  }
  return invoiceBuilderInstance;
}

// Cleanup beim Prozess-Ende
process.on('beforeExit', async () => {
  if (invoiceBuilderInstance) {
    await invoiceBuilderInstance.close();
  }
});