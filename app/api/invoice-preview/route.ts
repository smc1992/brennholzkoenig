import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, invoiceId, customSettings, templateId = 'invoice' } = body;
    
    console.log('📋 Invoice preview request:', { invoiceId, orderId, templateId });
    console.log('🔍 Request details:', {
      invoiceId_type: typeof invoiceId,
      orderId_type: typeof orderId,
      invoiceId_value: invoiceId,
      orderId_value: orderId
    });
    
    // Lade Rechnungseinstellungen aus invoice_settings Tabelle
    const { data: invoiceSettings } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1)
      .single();
    
    console.log('📋 Loaded invoice settings:', invoiceSettings);
    
    // Verwende echte Unternehmensdaten oder Fallback-Werte
    const finalSettings = {
      company_name: invoiceSettings?.company_name || 'Brennholzkönig',
      company_address_line1: invoiceSettings?.company_address_line1 || 'Frankfurter Straße 3',
      company_address_line2: invoiceSettings?.company_address_line2 || '',
      company_postal_code: invoiceSettings?.company_postal_code || '36419',
      company_city: invoiceSettings?.company_city || 'Buttlar',
      company_phone: invoiceSettings?.company_phone || '+49 176 71085234',
      company_email: invoiceSettings?.company_email || 'info@brennholz-koenig.de',
      company_website: invoiceSettings?.company_website || 'www.brennholz-koenig.de',
      tax_id: invoiceSettings?.tax_id || 'DE200789994',
      vat_rate: invoiceSettings?.vat_rate || 19,
      bank_name: invoiceSettings?.bank_name || 'Sparkasse Bad Hersfeld-Rotenburg',
      bank_iban: invoiceSettings?.bank_iban || 'DE89 5325 0000 0000 1234 56',
      bank_bic: invoiceSettings?.bank_bic || 'HELADEF1HER',
      invoice_prefix: invoiceSettings?.invoice_prefix || 'RG-',
      invoice_footer_text: invoiceSettings?.invoice_footer_text || 'Vielen Dank für Ihr Vertrauen! Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
      logo_url: invoiceSettings?.logo_url || null,
      ...customSettings // Custom settings überschreiben die geladenen Werte
    };
    
    // Lade Bestellungs- oder Rechnungsdaten
    let orderData = null;
    let invoiceData = null;
    
    if (invoiceId) {
      // Lade existierende Rechnung
      const { data: invoice } = await supabase
        .from('invoices')
        .select(`
          *,
          orders!inner(*),
          customers!inner(*)
        `)
        .eq('id', invoiceId)
        .single();
      
      if (invoice) {
        invoiceData = invoice;
        orderData = invoice.orders;
      }
    } else if (orderId) {
      // Lade Bestellung für neue Rechnung
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .single();
        
      // Lade order_items separat
      let orderItems = [];
      if (order) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
          
        if (itemsError) {
          console.error('❌ Error loading order items:', itemsError);
        } else {
          orderItems = items || [];
          console.log('✅ Order items loaded separately:', {
            count: orderItems.length,
            items: orderItems
          });
        }
        
        // Füge order_items zum order-Objekt hinzu
        order.order_items = orderItems;
      }
        
      console.log('🔍 Complete order data structure:', {
         order_id: order?.id,
         order_number: order?.order_number,
         order_items_raw: order?.order_items,
         order_items_count: order?.order_items?.length || 0,
         first_item_details: order?.order_items?.[0] || null,
         order_items_is_array: Array.isArray(order?.order_items),
         order_items_type: typeof order?.order_items
       });
       
       if (!order?.order_items || order.order_items.length === 0) {
         console.error('❌ NO ORDER ITEMS FOUND!', {
           order_exists: !!order,
           order_items_exists: !!order?.order_items,
           order_items_length: order?.order_items?.length,
           full_order_keys: order ? Object.keys(order) : 'no order'
         });
       }
        
      console.log('🔍 Raw Supabase query result:', {
        order_found: !!order,
        order_items_count: order?.order_items?.length || 0,
        first_item: order?.order_items?.[0] || null,
        error: orderError
      });
        
      if (orderError) {
        console.error('❌ Error loading order:', orderError);
      }
      
      if (order) {
        orderData = order;
        console.log('📦 Order data loaded:', {
          id: order.id,
          order_number: order.order_number,
          order_items_count: order.order_items?.length || 0,
          order_items: order.order_items
        });
        
        // Erstelle temporäre Rechnungsdaten
        invoiceData = {
          invoice_number: `${finalSettings.invoice_prefix || 'RG-'}PREVIEW`,
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'draft',
          subtotal_amount: order.subtotal_amount,
          tax_amount: (parseFloat(order.subtotal_amount || '0') * 0.19).toFixed(2),
          total_amount: order.total_amount,
          payment_terms: finalSettings.invoice_payment_terms || 'Zahlbar innerhalb von 14 Tagen.'
        };
      }
    }
    
    if (!orderData) {
      // Fallback: Mock-Daten für Vorschau
      orderData = {
        order_number: 'PREVIEW-001',
        created_at: new Date().toISOString(),
        delivery_first_name: 'Max',
        delivery_last_name: 'Mustermann',
        delivery_street: 'Musterstraße',
        delivery_house_number: '123',
        delivery_postal_code: '12345',
        delivery_city: 'Musterstadt',
        delivery_phone: '+49 123 456789',
        delivery_email: 'max@example.com',
        subtotal_amount: '250.00',
        total_amount: '297.50',
        customers: {
          first_name: 'Max',
          last_name: 'Mustermann',
          email: 'max@example.com'
        },
        order_items: [
          {
            product_name: 'Brennholz Buche 25cm',
            quantity: 5,
            unit_price: '50.00',
            total_price: '250.00'
          }
        ]
      };
      
      invoiceData = {
        invoice_number: `${finalSettings.invoice_prefix || 'RG-'}PREVIEW`,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        subtotal_amount: '250.00',
        tax_amount: '47.50',
        total_amount: '297.50',
        payment_terms: finalSettings.invoice_payment_terms || 'Zahlbar innerhalb von 14 Tagen.'
      };
    }
    
    // Registriere Handlebars Helper
    Handlebars.registerHelper('formatDate', function(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('de-DE');
    });
    
    Handlebars.registerHelper('formatCurrency', function(amount) {
      if (!amount) return '0,00';
      return parseFloat(amount).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    });
    
    Handlebars.registerHelper('formatNumber', function(number) {
      if (!number) return '0';
      return parseInt(number).toString();
    });
    
    Handlebars.registerHelper('add', function(a, b) {
      return (a || 0) + (b || 0);
    });
    
    Handlebars.registerHelper('subtract', function(a, b) {
      return (a || 0) - (b || 0);
    });
    
    Handlebars.registerHelper('multiply', function(a, b) {
      return (a || 0) * (b || 0);
    });
    
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    Handlebars.registerHelper('ne', function(a, b) {
      return a !== b;
    });
    
    Handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });
    
    Handlebars.registerHelper('lt', function(a, b) {
      return a < b;
    });
    
    Handlebars.registerHelper('formatNumber', function(number) {
      if (!number) return '0';
      return parseFloat(number).toLocaleString('de-DE');
    });
    
    // Lade Template
    const templatePath = path.join(process.cwd(), 'templates', 'invoice.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);
    
    // Bereite Template-Daten vor
    const templateData = {
      company: {
        name: finalSettings.company_name,
        address_line1: finalSettings.company_address_line1,
        address_line2: finalSettings.company_address_line2,
        postal_code: finalSettings.company_postal_code,
        city: finalSettings.company_city,
        phone: finalSettings.company_phone,
        email: finalSettings.company_email,
        website: finalSettings.company_website,
        tax_id: finalSettings.tax_id,
        logo_url: finalSettings.logo_url
      },
      payment: {
        bank_name: finalSettings.bank_name,
        iban: finalSettings.bank_iban,
        bic: finalSettings.bank_bic
      },
      invoice: {
        number: invoiceData.invoice_number,
        date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        paymentTerms: invoiceData.payment_terms
      },
      customer: {
        name: `${orderData.delivery_first_name || orderData.customers?.first_name || ''} ${orderData.delivery_last_name || orderData.customers?.last_name || ''}`.trim(),
        number: orderData.customer_id ? `KD-${String(parseInt(orderData.customer_id.replace(/-/g, '').slice(-5), 16) % 99999 + 10000).padStart(5, '0')}` : (orderData.delivery_email ? `KD-${String(Math.abs(orderData.delivery_email.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 89999 + 10000).padStart(5, '0')}` : '-'),
        address: {
          street: orderData.delivery_street || '',
          house_number: orderData.delivery_house_number || '',
          postal_code: orderData.delivery_postal_code || '',
          city: orderData.delivery_city || ''
        },
        phone: orderData.delivery_phone || '',
        email: orderData.delivery_email || orderData.customers?.email || ''
      },
      order: {
        number: orderData.order_number,
        date: orderData.created_at
      },
      items: (orderData.order_items && Array.isArray(orderData.order_items) && orderData.order_items.length > 0) 
        ? orderData.order_items.map((item: any, index: number) => {
         console.log(`🔍 Processing order item ${index + 1}:`, {
           raw_item: item,
           product_name: item.product_name,
           name: item.name,
           category: item.product_category,
           quantity: item.quantity,
           unit_price: item.unit_price,
           total_price: item.total_price
         });
         
         if (!item.product_name) {
           console.error(`❌ MISSING PRODUCT NAME for item ${index + 1}:`, item);
         }
         if (!item.unit_price || item.unit_price === '0' || item.unit_price === '0.00') {
           console.error(`❌ MISSING OR ZERO UNIT PRICE for item ${index + 1}:`, item);
         }
         
         // Verwende Produktdaten direkt aus order_items
          const productName = item.product_name || 
                            item.name || 
                            item.description || 
                            `Artikel ${index + 1}`;
                            
          const productCategory = item.product_category || 
                                item.category || 
                                'Brennholz';
                                
          console.log(`📦 Final product data for item ${index + 1}:`, {
            name: productName,
            category: productCategory,
            product_name_field: item.product_name,
            product_category_field: item.product_category,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            all_item_fields: Object.keys(item)
          });
         
         return {
           name: productName,
           category: productCategory,
           quantity: item.quantity || 0,
           unit: 'SRM',
           unitPrice: parseFloat(item.unit_price || item.price || '0').toFixed(2),
           totalPrice: parseFloat(item.total_price || item.total || '0').toFixed(2)
         };
       })
        : [],
       totals: {
        subtotal: parseFloat(invoiceData.subtotal_amount).toFixed(2),
        tax: parseFloat(invoiceData.tax_amount).toFixed(2),
        total: parseFloat(invoiceData.total_amount).toFixed(2)
      }
    };
    
    console.log('🎯 FINAL TEMPLATE DATA:', {
      items_count: templateData.items?.length || 0,
      items_array: templateData.items,
      first_item: templateData.items?.[0] || null,
      customer_name: templateData.customer?.name,
      order_number: templateData.order?.number
    });
    
    // Generiere HTML
    const html = template(templateData);
    
    return NextResponse.json({
      success: true,
      html,
      data: templateData
    });
    
  } catch (error) {
    console.error('❌ Invoice preview error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate invoice preview',
        details: error instanceof Error ? error.message : error
      },
      { status: 500 }
    );
  }
}