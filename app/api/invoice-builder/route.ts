import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceBuilder, InvoiceData, CompanySettings } from '@/lib/invoiceBuilder';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Admin Supabase Client mit Service Role Key
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  return supabase; // Fallback auf normalen Client
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Vorschau der Rechnung als HTML
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const invoiceId = searchParams.get('invoiceId');
    const orderId = searchParams.get('orderId');
    const templateId = searchParams.get('templateId') || 'default';

    if (!invoiceId && !orderId) {
      return NextResponse.json(
        { error: 'Invoice ID or Order ID is required' },
        { status: 400 }
      );
    }

    // Lade Rechnungsdaten
    const { invoiceData, companySettings } = await loadInvoiceData(invoiceId, orderId);
    const invoiceBuilder = getInvoiceBuilder();
    invoiceBuilder.clearTemplateCache();

    switch (action) {
      case 'preview':
        // HTML-Vorschau generieren
        const htmlPreview = await invoiceBuilder.generatePreview(
          invoiceData,
          companySettings,
          templateId
        );
        
        return new NextResponse(htmlPreview, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });

      case 'order-confirmation':
        // Auftragsbestätigung generieren
        const orderConfirmationHtml = await invoiceBuilder.generatePreview(
          invoiceData,
          companySettings,
          'order-confirmation'
        );
        
        return new NextResponse(orderConfirmationHtml, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });

      case 'screenshot':
        // Screenshot für Vorschau
        const screenshot = await invoiceBuilder.generateScreenshot(
          invoiceData,
          companySettings,
          templateId,
          {
            width: parseInt(searchParams.get('width') || '800'),
            height: parseInt(searchParams.get('height') || '1200'),
            quality: parseInt(searchParams.get('quality') || '90')
          }
        );
        // Buffer -> ArrayBuffer (korrekte Länge via Slice)
        const screenshotArrayBuffer = screenshot.buffer.slice(
          screenshot.byteOffset,
          screenshot.byteOffset + screenshot.byteLength
        );

        return new NextResponse(screenshotArrayBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600'
          }
        });

      default:
        // Wenn keine action angegeben ist, gib die berechneten invoiceData zurück
        return NextResponse.json({
          subtotal_amount: invoiceData.subtotal_amount,
          tax_amount: invoiceData.tax_amount,
          total_amount: invoiceData.total_amount,
          tax_rate: invoiceData.tax_rate,
          invoice_number: invoiceData.invoice_number,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
          customer: invoiceData.customer,
          items: invoiceData.items
        });
    }
  } catch (error) {
    console.error('Invoice builder GET error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice preview' },
      { status: 500 }
    );
  }
}

// POST - PDF generieren und speichern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      invoiceId, 
      orderId, 
      templateId = 'default',
      action = 'generate',
      options = {},
      saveToFile = true 
    } = body;

    if (!invoiceId && !orderId) {
      return NextResponse.json(
        { error: 'Invoice ID or Order ID is required' },
        { status: 400 }
      );
    }

    // Lade Rechnungsdaten
    const { invoiceData, companySettings } = await loadInvoiceData(invoiceId, orderId);
    const invoiceBuilder = getInvoiceBuilder();
    invoiceBuilder.clearTemplateCache();

    // PDF generieren basierend auf Action
    const actualTemplateId = action === 'order-confirmation' ? 'order-confirmation' : templateId;
    const pdfBuffer = await invoiceBuilder.generatePDF(
      invoiceData,
      companySettings,
      actualTemplateId,
      {
        format: options.format || 'A4',
        // Margins werden jetzt von CSS @page-Regel übernommen
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || ''
      }
    );

    if (saveToFile) {
      // PDF in Supabase Storage speichern
      const fileName = `invoice-${invoiceData.invoice_number}-${Date.now()}.pdf`;
      const filePath = `invoices/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('PDF upload error:', uploadError);
      }
      
      let createdInvoiceId = invoiceId;
      
      // Wenn orderId aber keine invoiceId, erstelle neue Rechnung in Datenbank
      if (orderId && !invoiceId) {
        console.log('📦 Creating new invoice for order:', orderId);
        
        // Versuche zuerst mit ID, dann mit order_number
        let { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
          
        console.log('📋 Order by ID result:', orderData, 'Error:', orderError);
        
        // Falls nicht gefunden, versuche mit order_number
        if (!orderData && orderError) {
          console.log('🔄 Trying to find order by order_number:', orderId);
          const { data: orderByNumber, error: orderByNumberError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderId)
            .single();
          
          console.log('📋 Order by number result:', orderByNumber, 'Error:', orderByNumberError);
          orderData = orderByNumber;
        }
          
        if (orderData) {
          // Generiere neue Rechnungsnummer
          const newInvoiceNumber = await generateInvoiceNumber();
          
          console.log('💾 Creating invoice with number:', newInvoiceNumber);
          
          const invoiceData = {
            invoice_number: newInvoiceNumber,
            order_id: orderData.id,  // Verwende die echte order.id, nicht orderId
            customer_id: orderData.customer_id,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'draft',
            subtotal_amount: orderData.subtotal_amount,
            tax_amount: (parseFloat(orderData.subtotal_amount || '0') * 0.19).toFixed(2),
            total_amount: orderData.total_amount,
            payment_terms: 'Zahlbar innerhalb von 14 Tagen.',
            pdf_path: uploadData?.path || filePath
          };
          
          console.log('📄 Invoice data to insert:', invoiceData);
          
          // Verwende Admin-Client für Rechnungserstellung (umgeht RLS)
          const adminSupabase = getAdminSupabaseClient();
          console.log('🔑 Using admin client for invoice creation...');
          
          const { data: newInvoice, error: createError } = await adminSupabase
            .from('invoices')
            .insert(invoiceData)
            .select()
            .single();
            
          if (createError) {
            console.error('❌ Invoice creation error:', createError);
            console.error('❌ Error details:', JSON.stringify(createError, null, 2));
            console.error('❌ Invoice data that failed:', JSON.stringify(invoiceData, null, 2));
            throw new Error(`Failed to create invoice: ${createError.message}`);
          } else {
            console.log('✅ Invoice created successfully:', newInvoice);
            createdInvoiceId = newInvoice.id;
          }
        } else {
          console.error('❌ Order not found for ID:', orderId);
        }
      } else if (invoiceId && uploadData?.path) {
        // PDF-Pfad in bestehende Rechnung speichern
        await supabase
          .from('invoices')
          .update({ pdf_path: filePath })
          .eq('id', invoiceId);
      }

      return NextResponse.json({
        success: true,
        fileName,
        filePath,
        invoiceId: createdInvoiceId,
        downloadUrl: uploadData?.path ? `/api/invoice-builder/download?path=${encodeURIComponent(uploadData.path)}` : null,
        size: pdfBuffer.length
      });
    } else {
      // PDF direkt zurückgeben
      // Buffer -> ArrayBuffer (korrekte Länge via Slice)
      const pdfArrayBuffer = pdfBuffer.buffer.slice(
        pdfBuffer.byteOffset,
        pdfBuffer.byteOffset + pdfBuffer.byteLength
      );

      return new NextResponse(pdfArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoice_number}.pdf"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      });
    }
  } catch (error) {
    console.error('Invoice builder POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Hilfsfunktion zum Laden der Rechnungsdaten
// Funktion zur Generierung einer Kundennummer basierend auf Email
function generateCustomerNumber(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const numericPart = Math.abs(hash) % 89999 + 10000;
  return `KD-${String(numericPart).padStart(5, '0')}`;
}

// Funktion zum Abrufen oder Erstellen einer Kundennummer
async function getOrCreateCustomerNumber(email: string): Promise<string> {
  if (!email) return 'KD-GAST';
  
  try {
    console.log('🔍 Fetching customer for email:', email);
    
    // Prüfe ob Kunde bereits existiert und hole customer_number falls vorhanden
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, customer_number, email')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching customer:', fetchError);
    }

    // Wenn Kunde existiert und bereits eine customer_number hat, verwende diese
    if (existingCustomer && existingCustomer.customer_number) {
      console.log('✅ Found existing customer with number:', existingCustomer.customer_number);
      return existingCustomer.customer_number;
    }

    // Generiere neue Kundennummer
    const newCustomerNumber = generateCustomerNumber(email);
    console.log('🔢 Generated new customer number:', newCustomerNumber);
    
    if (existingCustomer) {
      // Kunde existiert, aber hat keine customer_number - aktualisiere ihn
      try {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ customer_number: newCustomerNumber })
          .eq('id', existingCustomer.id);
        
        if (updateError) {
          console.log('ℹ️ Could not update customer_number (column may not exist):', updateError.message);
        } else {
          console.log('✅ Updated existing customer with customer_number');
        }
      } catch (updateError) {
        console.log('ℹ️ customer_number column not available for update');
      }
    } else {
      // Kunde existiert nicht - erstelle neuen Kunden
      try {
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            email: email,
            customer_number: newCustomerNumber,
            first_name: '',
            last_name: ''
          });
        
        if (insertError) {
          console.log('ℹ️ Could not insert with customer_number (column may not exist):', insertError.message);
          // Fallback: Erstelle Kunde ohne customer_number
          await supabase
            .from('customers')
            .insert({
              email: email,
              first_name: '',
              last_name: ''
            });
        } else {
          console.log('✅ Created new customer with customer_number');
        }
      } catch (insertError) {
        console.log('ℹ️ customer_number column not available for insert');
      }
    }
    
    return newCustomerNumber;
  } catch (error) {
    console.error('💥 Error in getOrCreateCustomerNumber:', error);
    return generateCustomerNumber(email);
  }
}

async function loadInvoiceData(invoiceId?: string | null, orderId?: string | null): Promise<{
  invoiceData: InvoiceData;
  companySettings: CompanySettings;
}> {
  let invoice = null;
  let order = null;

  // Lade Rechnung falls vorhanden
  if (invoiceId) {
    // Versuche zuerst mit ID als String, dann als Nummer
    let invoiceResult = null;
    let invoiceError = null;
    
    // Versuche immer zuerst mit invoice_number (numerisch oder alphanumerisch)
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders(*),
          customers(*)
        `)
        .eq('invoice_number', invoiceId)
        .limit(1);
      invoiceResult = data?.[0] || null;
      invoiceError = error;
      
      console.log(`Searching for invoice_number: ${invoiceId}, found: ${invoiceResult ? 'yes' : 'no'}`);
     
     // Falls nicht gefunden und es ist eine UUID, versuche mit ID
      if (!invoiceResult && !invoiceError && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId)) {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            orders(*),
            customers(*)
          `)
          .eq('id', invoiceId)
          .limit(1);
        invoiceResult = data?.[0] || null;
        invoiceError = error;
      }
    
    if (invoiceError) {
       console.error('Invoice loading error:', invoiceError);
       throw new Error(`Invoice not found: ${invoiceError.message}`);
     }
     
     if (!invoiceResult) {
       throw new Error(`Invoice with ID ${invoiceId} not found`);
     }
     
     invoice = invoiceResult;
     order = invoiceResult?.orders;
     
     console.log('Loaded invoice:', invoice?.invoice_number);
     console.log('Linked order:', order?.order_number || 'none');
     console.log('Customer data:', invoice?.customers?.email || 'none');
  }
  
  // Lade Bestellung falls keine Rechnung vorhanden
  if (!invoice && orderId) {
    console.log('🔍 Searching for order with ID/Number:', orderId);
    
    // Versuche zuerst mit ID
    let { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers(*)
      `)
      .eq('id', orderId)
      .single();
    
    console.log('📋 Order by ID result:', orderResult, 'Error:', orderError);
    
    // Lade order_items separat für ID-basierte Suche
    if (orderResult) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderResult.id);
        
      if (itemsError) {
        console.error('❌ Error loading order items for ID search:', itemsError);
      } else {
        orderResult.order_items = items || [];
        console.log('✅ Order items loaded separately for ID search:', {
          count: items?.length || 0,
          items: items
        });
      }
    }
    
    // Falls nicht gefunden, versuche mit order_number
    if (!orderResult && orderError) {
      console.log('🔄 Trying to find order by order_number:', orderId);
      const { data: orderByNumber, error: orderByNumberError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('order_number', orderId)
        .single();
      
      console.log('📋 Order by number result:', orderByNumber, 'Error:', orderByNumberError);
      
      // Lade order_items separat für zuverlässige Datenladung
      if (orderByNumber) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderByNumber.id);
          
        if (itemsError) {
          console.error('❌ Error loading order items:', itemsError);
        } else {
          orderByNumber.order_items = items || [];
          console.log('✅ Order items loaded separately:', {
            count: items?.length || 0,
            items: items
          });
        }
      }
      
      orderResult = orderByNumber;
    }
    
    order = orderResult;
  }

  // Wenn wir eine Rechnung haben aber keine Bestellung, erstelle eine aus den Rechnungsdaten
  if (invoice && !order) {
    // Lade Kunden-Daten separat falls nicht über Join geladen
    let customer = invoice.customers;
    if (!customer && invoice.customer_id) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.customer_id)
        .single();
      customer = customerData;
    }
    
    // Erstelle eine virtuelle Bestellung aus den Rechnungsdaten
    order = {
      id: invoice.order_id || 'virtual-order',
      order_number: invoice.invoice_number,
      delivery_first_name: customer?.first_name || 'Kunde',
      delivery_last_name: customer?.last_name || '',
      delivery_email: customer?.email || '',
      delivery_phone: customer?.phone || '',
      delivery_street: customer?.address?.street || '',
      delivery_house_number: customer?.address?.house_number || '',
      delivery_postal_code: customer?.address?.postal_code || '',
      delivery_city: customer?.address?.city || '',
      subtotal_amount: invoice.subtotal_amount,
      total_amount: invoice.total_amount,
      order_items: [
        {
          id: 'invoice-item-1',
          product_name: 'Brennholz (aus Rechnung)',
          quantity: 1,
          unit_price: invoice.subtotal_amount,
          total_price: invoice.subtotal_amount,
          product_code: 'INV-ITEM'
        }
      ],
      customers: customer
    };
  }
  
  if (!order) {
    // Fallback: Erstelle Mock-Bestellung für Tests
    if (orderId && (orderId.includes('test') || orderId.includes('mock'))) {
      console.log('🧪 Creating mock order for testing:', orderId);
      order = {
        id: orderId,
        order_number: `TEST-${Date.now()}`,
        delivery_first_name: 'Test',
        delivery_last_name: 'Kunde',
        delivery_email: 'test@example.com',
        delivery_phone: '+49 123 456789',
        delivery_street: 'Teststraße',
        delivery_house_number: '123',
        delivery_postal_code: '12345',
        delivery_city: 'Teststadt',
        subtotal_amount: '100.00',
        total_amount: '119.00',
        customer_id: 'test-customer-id',
        order_items: [
          {
            id: 'item-1',
            product_name: 'Test Brennholz Buche',
            quantity: 2,
            unit_price: '50.00',
            total_price: '100.00',
            product_code: 'TEST-BUCHE-001'
          }
        ],
        customers: {
          id: 'test-customer-id',
          first_name: 'Test',
          last_name: 'Kunde',
          email: 'test@example.com'
        }
      };
    } else {
      throw new Error('Order or invoice not found');
    }
  }

  // Lade Firmeneinstellungen aus invoice_settings
  const { data: invoiceSettings } = await supabase
    .from('invoice_settings')
    .select('*')
    .limit(1)
    .single();
  
  console.log('📋 Loaded invoice settings for PDF:', invoiceSettings);

  const companySettings: CompanySettings = {
    company_name: invoiceSettings?.company_name || 'Brennholzkönig',
    company_address_line1: invoiceSettings?.company_address_line1 || 'Frankfurter Straße 3',
    company_address_line2: invoiceSettings?.company_address_line2 || '',
    company_postal_code: invoiceSettings?.company_postal_code || '36419',
    company_city: invoiceSettings?.company_city || 'Buttlar',
    company_phone: invoiceSettings?.company_phone || '+49 176 71085234',
    company_email: invoiceSettings?.company_email || 'info@brennholz-koenig.de',
    company_website: invoiceSettings?.company_website || 'www.brennholz-koenig.de',
    tax_id: invoiceSettings?.tax_id || 'DE200789994',
    vat_rate: invoiceSettings?.vat_rate ? parseFloat(invoiceSettings.vat_rate) : 19,
    default_tax_included: invoiceSettings?.default_tax_included || false,
    bank_name: invoiceSettings?.bank_name || '',
    bank_iban: invoiceSettings?.bank_iban || '',
    bank_bic: invoiceSettings?.bank_bic || '',
    logo_url: invoiceSettings?.logo_url || null,
    currency_symbol: '€',
    invoice_footer_text: invoiceSettings?.invoice_footer_text || 'Vielen Dank für Ihr Vertrauen! Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
    company_ceo: invoiceSettings?.company_ceo || null,
    company_registration: invoiceSettings?.company_registration || null
  };

  // Erstelle Rechnungsdaten
  const invoiceData: InvoiceData = {
    invoice_number: invoice?.invoice_number || `INV-${order.order_number}`,
    invoice_date: invoice?.invoice_date || new Date().toISOString(),
    due_date: invoice?.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    order_number: order.order_number,
    order_created_at: (order as any)?.created_at || new Date().toISOString(),
    customer: {
      name: `${order.delivery_first_name} ${order.delivery_last_name}`,
      email: order.delivery_email,
      phone: order.delivery_phone,
      customer_number: await getOrCreateCustomerNumber(order.delivery_email),
      company: order.delivery_company || order.customers?.company || '',
      address: {
        street: order.delivery_street,
        house_number: order.delivery_house_number,
        postal_code: order.delivery_postal_code,
        city: order.delivery_city
      }
    },
    delivery_address: {
      name: `${order.delivery_first_name} ${order.delivery_last_name}`,
      company: order.delivery_company || '',
      street: order.delivery_street,
      house_number: order.delivery_house_number,
      line2: order.delivery_notes || '',
      postal_code: order.delivery_postal_code,
      city: order.delivery_city
    },
    items: [],
    subtotal_amount: parseFloat(order.subtotal_amount || '0'),
    tax_amount: parseFloat(order.tax_amount || '0'),
    total_amount: parseFloat(order.total_amount || '0'),
    tax_rate: companySettings.vat_rate || 19,
    payment_terms: invoice?.payment_terms || invoiceSettings?.invoice_footer_text || 'Zahlbar innerhalb von 14 Tagen.',
    notes: invoice?.notes
  };

  console.log('📊 Initial invoice data from order:', {
    subtotal_amount: invoiceData.subtotal_amount,
    tax_amount: invoiceData.tax_amount,
    total_amount: invoiceData.total_amount,
    order_subtotal: order.subtotal_amount,
    order_total: order.total_amount
  });

  // Verarbeite order_items und berechne Summen
  if (order.order_items && order.order_items.length > 0) {
    // Übernehme Preise direkt aus der Bestellung - keine Umrechnung!
    // Die Bestellung enthält bereits die korrekten Brutto-Preise
    const processedItems = order.order_items.map((item: any, index: number) => {
      const unitPrice = parseFloat(item.unit_price);
      const totalPrice = parseFloat(item.total_price);
      
      console.log(`📦 Order item ${index + 1}:`, {
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      });
      
      return {
        description: item.product_name,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        product_code: item.product_code || item.id,
        category: item.product_category || item.category || 'Brennholz',
        tax_included: true
      };
    });
    
    // Füge Lieferkosten als separate Position hinzu falls vorhanden
    // Lieferkosten sind in der Bestellung bereits als Brutto gespeichert
    if (order.delivery_price && parseFloat(order.delivery_price) > 0) {
      const deliveryPrice = parseFloat(order.delivery_price);
      const deliveryItem = {
        description: `Lieferung (${order.delivery_type === 'express' ? 'Express 24-48h' : 'Standard'})`,
        quantity: 1,
        unit_price: deliveryPrice,
        total_price: deliveryPrice,
        product_code: 'DELIVERY',
        category: 'Lieferung',
        tax_included: true  // Lieferkosten sind Brutto
      };
      
      console.log('🚚 Adding delivery item:', deliveryItem);
      processedItems.push(deliveryItem);
    }
    
    // Füge Gutschein als separate Position hinzu falls vorhanden
    if (order.discount_amount && parseFloat(order.discount_amount) > 0) {
      let discountDescription = 'Gutschein/Rabatt';
      
      // Hole Gutschein-Details falls discount_code_id vorhanden
      if (order.discount_code_id) {
        try {
          const { data: discountCode } = await supabase
            .from('discount_codes')
            .select('code, description')
            .eq('id', order.discount_code_id)
            .single();
          
          if (discountCode) {
            discountDescription = `Gutschein (${discountCode.code})`;
            if (discountCode.description) {
              discountDescription += ` - ${discountCode.description}`;
            }
          }
        } catch (error) {
          console.warn('Could not fetch discount code details:', error);
        }
      }
      
      const discountItem = {
        description: discountDescription,
        quantity: 1,
        unit_price: -parseFloat(order.discount_amount),
        total_price: -parseFloat(order.discount_amount),
        product_code: 'DISCOUNT',
        category: 'Rabatt',
        tax_included: companySettings.default_tax_included || false
      };
      
      console.log('🎫 Adding discount item:', discountItem);
      processedItems.push(discountItem);
    }
    
    // Verwende die Bestellwerte direkt - diese sind bereits korrekt berechnet
    // order.total_amount = Gesamtbetrag (Brutto) inkl. Lieferung und abzgl. Rabatt
    // order.subtotal_amount = Warenwert (Brutto) ohne Lieferung
    const orderTotal = parseFloat(order.total_amount || '0');
    const orderSubtotal = parseFloat(order.subtotal_amount || '0');
    const orderDelivery = parseFloat(order.delivery_price || '0');
    const orderDiscount = parseFloat(order.discount_amount || '0');
    
    // Berechne Summe aus Items für Validierung
    const itemsSum = processedItems.reduce((sum: number, item: any) => sum + item.total_price, 0);
    
    console.log('💰 Order values:', {
      order_total: orderTotal,
      order_subtotal: orderSubtotal,
      order_delivery: orderDelivery,
      order_discount: orderDiscount,
      items_sum: itemsSum,
      items_count: processedItems.length
    });
    
    // Verwende order.total_amount als Gesamtbetrag (Brutto)
    const finalTotal = orderTotal;
    
    // Berechne Netto aus Brutto (MwSt. herausrechnen)
    const taxRate = companySettings.vat_rate || 19;
    const finalSubtotal = finalTotal / (1 + taxRate / 100);
    const finalTax = finalTotal - finalSubtotal;
    
    console.log('💰 Final invoice totals:', {
      total: finalTotal,
      subtotal: finalSubtotal,
      tax: finalTax,
      tax_rate: taxRate
    });
    
    // Aktualisiere invoiceData mit den Bestellwerten
    invoiceData.items = processedItems;
    invoiceData.subtotal_amount = finalSubtotal;
    invoiceData.tax_amount = finalTax;
    invoiceData.total_amount = finalTotal;
  } else {
    // Fallback: Wenn keine order_items vorhanden sind, verwende order.total_amount
    console.log('⚠️ No order items found, using order totals as fallback');
    
    // Berechne Steuer aus total_amount falls nicht vorhanden
    if (invoiceData.total_amount > 0 && invoiceData.tax_amount === 0) {
      const taxRate = companySettings.vat_rate || 19;
      // Annahme: total_amount ist Brutto
      invoiceData.subtotal_amount = invoiceData.total_amount / (1 + taxRate / 100);
      invoiceData.tax_amount = invoiceData.total_amount - invoiceData.subtotal_amount;
      console.log('📊 Calculated tax from total:', {
        total: invoiceData.total_amount,
        subtotal: invoiceData.subtotal_amount,
        tax: invoiceData.tax_amount
      });
    }
  }

  console.log('📄 Final invoice data:', {
    items_count: invoiceData.items.length,
    subtotal: invoiceData.subtotal_amount,
    tax: invoiceData.tax_amount,
    total: invoiceData.total_amount
  });

  return { invoiceData, companySettings };
}

// Hilfsfunktion für Settings
function getSettingValue(settings: any[], key: string, defaultValue: string = ''): string {
  const setting = settings?.find(s => s.setting_key === key);
  return setting?.setting_value || defaultValue;
}

// Hilfsfunktion für Steuerberechnung
function calculateTax(subtotal: string, taxRate: number): string {
  const amount = parseFloat(subtotal || '0');
  const tax = amount * (taxRate / 100);
  return tax.toFixed(2);
}

// Funktion zum Generieren der nächsten Rechnungsnummer
async function generateInvoiceNumber(): Promise<string> {
  try {
    console.log('🔢 Generating invoice number...');
    
    // Lade Rechnungseinstellungen
    let { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['invoice_prefix', 'invoice_counter']);
    
    console.log('⚙️ Settings loaded:', settings, 'Error:', settingsError);
    
    // Stelle sicher, dass die Einstellungen existieren
    if (!settings || settings.length === 0) {
      console.log('🔧 Creating default invoice settings...');
      await supabase
        .from('app_settings')
        .upsert([
          { setting_key: 'invoice_prefix', setting_value: 'RG-' },
          { setting_key: 'invoice_counter', setting_value: '10000' }
        ]);
      
      // Lade die Einstellungen erneut
      const { data: newSettings } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['invoice_prefix', 'invoice_counter']);
      
      settings = newSettings;
      console.log('🔄 Reloaded settings:', settings);
    }
    
    const prefix = getSettingValue(settings, 'invoice_prefix', 'RG-');
    let counter = parseInt(getSettingValue(settings, 'invoice_counter', '10000'));
    
    console.log('📋 Using prefix:', prefix, 'Starting counter:', counter);
    
    // Finde die höchste existierende Rechnungsnummer mit diesem Präfix
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);
    
    console.log('📄 Existing invoices with prefix:', existingInvoices);
    
    if (existingInvoices && existingInvoices.length > 0) {
      const lastNumber = existingInvoices[0].invoice_number;
      const numberPart = lastNumber.replace(prefix, '');
      const lastCounter = parseInt(numberPart);
      if (!isNaN(lastCounter)) {
        counter = Math.max(counter, lastCounter + 1);
      }
    }
    
    const newInvoiceNumber = `${prefix}${counter}`;
    console.log('✅ Generated invoice number:', newInvoiceNumber);
    
    // Aktualisiere den Counter in den Einstellungen
    await supabase
      .from('app_settings')
      .upsert({
        setting_key: 'invoice_counter',
        setting_value: (counter + 1).toString()
      });
    
    return newInvoiceNumber;
  } catch (error) {
    console.error('❌ Error generating invoice number:', error);
    // Fallback
    const fallbackNumber = `RG-${Date.now()}`;
    console.log('🔄 Using fallback number:', fallbackNumber);
    return fallbackNumber;
  }
}
