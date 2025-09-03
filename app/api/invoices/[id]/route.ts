import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Dynamic imports für optionale Dependencies
let puppeteer: any;
let Handlebars: any;

try {
  puppeteer = require('puppeteer');
  Handlebars = require('handlebars');
} catch (error) {
  console.warn('Puppeteer or Handlebars not installed. Install with: npm install puppeteer handlebars @types/handlebars');
}

// Runtime-Konfiguration für Node.js Kompatibilität
export const runtime = 'nodejs';

// Verhindert Pre-rendering während des Builds
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Supabase Admin Client wird zur Laufzeit erstellt
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase environment variables not configured for app-api-invoices-[id]-route route');
    console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.warn('NEXT_PUBLIC_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'MISSING');
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

// Handlebars Helpers
Handlebars.registerHelper('formatDate', function(date: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
});

Handlebars.registerHelper('formatCurrency', function(amount: number) {
  if (typeof amount !== 'number') return '0,00 €';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
});

Handlebars.registerHelper('formatNumber', function(number: number) {
  if (typeof number !== 'number') return '0';
  return new Intl.NumberFormat('de-DE').format(number);
});

Handlebars.registerHelper('add', function(a: number, b: number) {
  return a + b;
});

// Interface Definitionen
interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_id: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  payment_terms?: string;
  notes?: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  customer_number?: string;
  company?: string;
  address: {
    street: string;
    house_number: string;
    line2?: string;
    postal_code: string;
    city: string;
  };
}

interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate: number;
  total_price: number;
}

interface CompanySettings {
  name: string;
  address: {
    street: string;
    house_number: string;
    line2?: string;
    postal_code: string;
    city: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  registration?: string;
  bank: {
    name?: string;
    iban?: string;
    bic?: string;
  };
  logo_url?: string;
}

// Template Data Interface
interface TemplateData {
  invoice: {
    number: string;
    date: string;
    due_date: string;
  };
  customer: Customer;
  issuer: CompanySettings;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  tax_breakdown: Array<{
    rate: number;
    amount: number;
  }>;
  payment_terms?: string;
  notes?: string;
  logo?: {
    url?: string;
  };
  order?: {
    number?: string;
    date?: string;
  };
}

// Daten aus Datenbank laden
async function loadInvoiceData(invoiceId: string): Promise<TemplateData | null> {
  try {
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      console.error('❌ Supabase client not configured');
      return null;
    }
    
    // Debug: Alle verfügbaren Rechnungen anzeigen
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .limit(10);
    
    console.log('🔍 Available invoices in database:', allInvoices);
    console.log('🎯 Looking for invoice:', invoiceId);
    
    // Rechnung laden - erst nach ID, dann nach invoice_number suchen
    let { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    console.log('📋 Search by ID result:', { invoice: invoice?.id, error: invoiceError?.message });

    // Falls nicht gefunden, nach invoice_number suchen
    if (invoiceError || !invoice) {
      console.log('🔄 Invoice not found by ID, trying invoice_number:', invoiceId);
      const { data: invoiceByNumber, error: numberError } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', invoiceId)
        .single();
      
      console.log('📋 Search by invoice_number result:', { invoice: invoiceByNumber?.id, error: numberError?.message });
      
      if (numberError || !invoiceByNumber) {
        console.error('❌ Invoice not found by ID or invoice_number:', { 
          invoiceId, 
          invoiceError: invoiceError?.message, 
          numberError: numberError?.message,
          availableInvoices: allInvoices?.map((i: any) => ({ id: i.id, number: i.invoice_number }))
        });
        return null;
      }
      
      invoice = invoiceByNumber;
      console.log('✅ Invoice found by invoice_number:', invoice.id);
    } else {
      console.log('✅ Invoice found by ID:', invoice.id);
    }

    // Kunde laden
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', invoice.customer_id)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found:', customerError);
      return null;
    }

    // Rechnungsposten laden
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('position');

    if (itemsError) {
      console.error('Items not found:', itemsError);
      return null;
    }

    // Firmeneinstellungen laden
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Company settings not found:', settingsError);
    }

    // MwSt-Aufschlüsselung berechnen
    const taxBreakdown = items?.reduce((acc: any[], item: any) => {
      const existingRate = acc.find(t => t.rate === item.tax_rate);
      const taxAmount = (item.total_price * item.tax_rate) / (100 + item.tax_rate);
      
      if (existingRate) {
        existingRate.amount += taxAmount;
      } else {
        acc.push({
          rate: item.tax_rate,
          amount: taxAmount
        });
      }
      return acc;
    }, []) || [];

    // Template-Daten zusammenstellen
    const templateData: TemplateData = {
      invoice: {
        number: invoice.invoice_number,
        date: invoice.invoice_date,
        due_date: invoice.due_date
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customer_number: customer.customer_number,
        company: customer.company,
        address: {
          street: customer.address?.street || '',
          house_number: customer.address?.house_number || '',
          line2: customer.address?.line2,
          postal_code: customer.address?.postal_code || '',
          city: customer.address?.city || ''
        }
      },
      issuer: {
        name: settings?.company_name || 'Brennholzkönig',
        address: {
          street: settings?.company_address_line1 || '',
          house_number: '',
          line2: settings?.company_address_line2,
          postal_code: settings?.company_postal_code || '',
          city: settings?.company_city || ''
        },
        phone: settings?.company_phone,
        email: settings?.company_email,
        website: settings?.company_website,
        tax_id: settings?.tax_id,
        registration: settings?.company_registration,
        bank: {
          name: settings?.bank_name,
          iban: settings?.bank_iban,
          bic: settings?.bank_bic
        }
      },
      items: items || [],
      subtotal: invoice.subtotal_amount,
      total: invoice.total_amount,
      tax_breakdown: taxBreakdown,
      payment_terms: invoice.payment_terms || settings?.payment_terms,
      notes: invoice.notes,
      logo: {
        url: settings?.logo_url
      }
    };

    return templateData;
  } catch (error) {
    console.error('Error loading invoice data:', error);
    return null;
  }
}

// HTML Template laden und rendern
async function renderTemplate(data: TemplateData): Promise<string> {
  try {
    const templatePath = path.join(process.cwd(), 'templates', 'invoice.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    const template = Handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    console.error('Error rendering template:', error);
    throw new Error('Template rendering failed');
  }
}

// PDF mit Puppeteer generieren
async function generatePDF(html: string): Promise<Buffer> {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // HTML setzen
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // PDF generieren
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    
    return Buffer.from(pdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('PDF generation failed');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// GET Handler - Test-Modus
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabaseAdmin) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';
    
    // Daten laden
    const data = await loadInvoiceData(id);
    if (!data) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Dependencies prüfen
    if (!puppeteer || !Handlebars) {
      return NextResponse.json(
        { error: 'PDF generation dependencies not installed. Run: npm install puppeteer handlebars @types/handlebars' },
        { status: 500 }
      );
    }
    
    // HTML rendern
    const html = await renderTemplate(data!);
    
    // Format bestimmen
    if (format === 'html') {
      // HTML für Debugging zurückgeben
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }
    
    // PDF generieren
    const pdfBuffer = await generatePDF(html);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${data.invoice.number}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST Handler - Produktiv-Modus
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Supabase Client zur Laufzeit erstellen
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Prüfen ob Supabase konfiguriert ist
    if (!supabaseAdmin) {
      return Response.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const { id } = params;
    const body = await request.json();
    
    // Optionale Überschreibung von Template-Daten
    let data = await loadInvoiceData(id);
    if (!data) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Dependencies prüfen
    if (!puppeteer || !Handlebars) {
      return NextResponse.json(
        { error: 'PDF generation dependencies not installed. Run: npm install puppeteer handlebars @types/handlebars' },
        { status: 500 }
      );
    }
    
    // Body-Daten mit geladenen Daten mergen
    if (body.overrides) {
      data = { ...data, ...body.overrides };
    }
    
    // HTML rendern (data ist garantiert nicht null durch vorherige Prüfung)
    const html = await renderTemplate(data!);
    
    // PDF generieren
    const pdfBuffer = await generatePDF(html);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${data?.invoice?.number || 'unknown'}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('POST /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}