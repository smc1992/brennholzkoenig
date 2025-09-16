import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Funktion um Kundennummer aus UUID zu generieren
function generateCustomerNumberFromId(customerId: string): string {
  // Nehme die letzten 8 Zeichen der UUID und konvertiere zu Nummer
  const idSuffix = customerId.replace(/-/g, '').slice(-8);
  const numericPart = parseInt(idSuffix.slice(-5), 16) % 99999;
  const paddedNumber = String(10000 + numericPart).padStart(5, '0');
  return `KD-${paddedNumber}`;
}

// Funktion um Kundennummer aus Email zu generieren (für Gäste)
function generateCustomerNumberFromEmail(email: string): string {
  // Einfacher Hash der Email für konsistente Kundennummer
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const numericPart = Math.abs(hash) % 89999 + 10000;
  return `KD-${String(numericPart).padStart(5, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, customerId, email } = body;
    
    if (action === 'get_customer_number') {
      if (customerId) {
        // Hole Kunde aus Datenbank
        const { data: customer, error } = await supabase
          .from('customers')
          .select('id, email')
          .eq('id', customerId)
          .single();
        
        if (error || !customer) {
          return NextResponse.json(
            { success: false, error: 'Kunde nicht gefunden' },
            { status: 404 }
          );
        }
        
        const customerNumber = generateCustomerNumberFromId(customer.id);
        
        return NextResponse.json({
          success: true,
          customer_number: customerNumber,
          customer_id: customer.id,
          email: customer.email
        });
      }
      
      if (email) {
        // Versuche Kunde über Email zu finden
        const { data: customer, error } = await supabase
          .from('customers')
          .select('id, email')
          .eq('email', email)
          .single();
        
        if (customer) {
          // Registrierter Kunde gefunden
          const customerNumber = generateCustomerNumberFromId(customer.id);
          
          return NextResponse.json({
            success: true,
            customer_number: customerNumber,
            customer_id: customer.id,
            email: customer.email,
            type: 'registered'
          });
        } else {
          // Gast-Kunde - generiere Nummer aus Email
          const customerNumber = generateCustomerNumberFromEmail(email);
          
          return NextResponse.json({
            success: true,
            customer_number: customerNumber,
            customer_id: null,
            email: email,
            type: 'guest'
          });
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'customerId oder email erforderlich' },
        { status: 400 }
      );
    }
    
    if (action === 'get_all_customer_numbers') {
      // Hole alle Kunden und generiere Kundennummern
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, created_at');
      
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Fehler beim Laden der Kunden' },
          { status: 500 }
        );
      }
      
      const customersWithNumbers = customers?.map((customer: any) => ({
        ...customer,
        customer_number: generateCustomerNumberFromId(customer.id)
      })) || [];
      
      return NextResponse.json({
        success: true,
        customers: customersWithNumbers,
        total: customersWithNumbers.length
      });
    }
    
    if (action === 'update_orders_with_customer_numbers') {
      // Hole alle Bestellungen und weise Kundennummern zu
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_id, delivery_email');
      
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Fehler beim Laden der Bestellungen' },
          { status: 500 }
        );
      }
      
      const ordersWithNumbers = [];
      
      for (const order of orders || []) {
        let customerNumber = null;
        
        if (order.customer_id) {
          // Registrierter Kunde
          customerNumber = generateCustomerNumberFromId(order.customer_id);
        } else if (order.delivery_email) {
          // Gast-Kunde
          customerNumber = generateCustomerNumberFromEmail(order.delivery_email);
        }
        
        ordersWithNumbers.push({
          ...order,
          customer_number: customerNumber
        });
      }
      
      return NextResponse.json({
        success: true,
        orders: ordersWithNumbers,
        total: ordersWithNumbers.length
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Unbekannte Aktion' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ Customer number service error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Service-Fehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

// GET-Route für Status und Beispiele
export async function GET() {
  try {
    // Hole Beispiel-Kunden
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .limit(5);
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Fehler beim Laden der Kunden' },
        { status: 500 }
      );
    }
    
    const customersWithNumbers = customers?.map((customer: any) => ({
      ...customer,
      customer_number: generateCustomerNumberFromId(customer.id)
    })) || [];
    
    // Hole Beispiel-Bestellungen
    const { data: orders } = await supabase
      .from('orders')
      .select('id, customer_id, delivery_email, order_number')
      .limit(5);
    
    const ordersWithNumbers = orders?.map((order: any) => {
      let customerNumber = null;
      if (order.customer_id) {
        customerNumber = generateCustomerNumberFromId(order.customer_id);
      } else if (order.delivery_email) {
        customerNumber = generateCustomerNumberFromEmail(order.delivery_email);
      }
      return {
        ...order,
        customer_number: customerNumber
      };
    }) || [];
    
    return NextResponse.json({
      success: true,
      message: 'Kundennummer-Service aktiv (ohne Datenbank-Änderungen)',
      features: [
        'Kundennummern aus UUID generiert (KD-XXXXX)',
        'Konsistente Nummern für registrierte Kunden',
        'Email-basierte Nummern für Gast-Bestellungen',
        'Keine Datenbank-Änderungen erforderlich',
        'Sofort einsatzbereit'
      ],
      examples: {
        customers: customersWithNumbers,
        orders: ordersWithNumbers
      },
      api_endpoints: {
        get_customer_number: 'POST /api/customer-number-service {"action": "get_customer_number", "customerId": "..."}',
        get_by_email: 'POST /api/customer-number-service {"action": "get_customer_number", "email": "..."}',
        get_all: 'POST /api/customer-number-service {"action": "get_all_customer_numbers"}',
        update_orders: 'POST /api/customer-number-service {"action": "update_orders_with_customer_numbers"}'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Status-Check fehlgeschlagen'
      },
      { status: 500 }
    );
  }
}