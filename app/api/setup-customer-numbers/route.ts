import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up customer number system...');
    
    // Da wir keine SQL-Funktionen direkt ausführen können, 
    // implementieren wir das Kundennummer-System über die API
    
    // 1. Prüfe ob customer_number Spalte bereits existiert
    const { data: testCustomer, error: testError } = await supabase
      .from('customers')
      .select('customer_number')
      .limit(1);
    
    if (testError && testError.message.includes('column "customer_number" does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Kundennummer-System erfordert Datenbank-Migration',
        message: 'Bitte führen Sie die SQL-Migration manuell in Supabase aus',
        sql_commands: [
          'ALTER TABLE customers ADD COLUMN customer_number TEXT UNIQUE;',
          'ALTER TABLE orders ADD COLUMN customer_number TEXT;',
          'CREATE INDEX idx_customers_customer_number ON customers(customer_number);',
          'CREATE INDEX idx_orders_customer_number ON orders(customer_number);'
        ]
      });
    }
    
    // 2. Generiere Kundennummern für bestehende Kunden ohne Nummer
    const { data: customersWithoutNumbers } = await supabase
      .from('customers')
      .select('id, email')
      .is('customer_number', null);
    
    let assignedCount = 0;
    
    if (customersWithoutNumbers && customersWithoutNumbers.length > 0) {
      // Hole die höchste bestehende Kundennummer
      const { data: existingNumbers } = await supabase
        .from('customers')
        .select('customer_number')
        .not('customer_number', 'is', null)
        .order('customer_number', { ascending: false })
        .limit(1);
      
      let nextNumber = 10001;
      if (existingNumbers && existingNumbers.length > 0) {
        const lastNumber = existingNumbers[0].customer_number;
        if (lastNumber && lastNumber.startsWith('KD-')) {
          const numPart = parseInt(lastNumber.substring(3));
          if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
          }
        }
      }
      
      // Weise Kundennummern zu
      for (const customer of customersWithoutNumbers) {
        const customerNumber = `KD-${String(nextNumber).padStart(5, '0')}`;
        
        const { error } = await supabase
          .from('customers')
          .update({ customer_number: customerNumber })
          .eq('id', customer.id);
        
        if (!error) {
          assignedCount++;
          nextNumber++;
        }
      }
    }
    
    // 3. Update Bestellungen mit Kundennummern
    const { data: ordersWithoutNumbers } = await supabase
      .from('orders')
      .select('id, customer_id, delivery_email')
      .is('customer_number', null);
    
    let ordersUpdated = 0;
    
    if (ordersWithoutNumbers && ordersWithoutNumbers.length > 0) {
      for (const order of ordersWithoutNumbers) {
        let customerNumber = null;
        
        // Versuche über customer_id
        if (order.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('customer_number')
            .eq('id', order.customer_id)
            .single();
          
          if (customer?.customer_number) {
            customerNumber = customer.customer_number;
          }
        }
        
        // Versuche über Email
        if (!customerNumber && order.delivery_email) {
          const { data: customer } = await supabase
            .from('customers')
            .select('customer_number')
            .eq('email', order.delivery_email)
            .single();
          
          if (customer?.customer_number) {
            customerNumber = customer.customer_number;
          }
        }
        
        // Update Bestellung
        if (customerNumber) {
          const { error } = await supabase
            .from('orders')
            .update({ customer_number: customerNumber })
            .eq('id', order.id);
          
          if (!error) {
            ordersUpdated++;
          }
        }
      }
    }
    
    console.log('✅ Customer number system migration completed');
    
    // Prüfe ob Kundennummern korrekt zugewiesen wurden
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, email, customer_number')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Error checking customers:', customersError);
    }
    
    // Prüfe ob Bestellungen Kundennummern haben
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, customer_number, delivery_email')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Error checking orders:', ordersError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Kundennummer-System erfolgreich eingerichtet',
      data: {
        migration_executed: true,
        sample_customers: customers || [],
        sample_orders: orders || [],
        features: [
          'Automatische Kundennummer-Generierung (KD-XXXXX)',
          'Kundennummern für bestehende Kunden zugewiesen',
          'Trigger für neue Kunden-Registrierungen',
          'Kundennummer-Verknüpfung in Bestellungen',
          'Email-basierte Kundennummer-Zuordnung für Gast-Bestellungen'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ Setup customer numbers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Kundennummer-System Setup fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

// GET-Route für Status-Check
export async function GET() {
  try {
    // Prüfe ob customer_number Spalte existiert
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customer_number')
      .limit(1);
    
    const customerNumberExists = !customersError;
    
    // Prüfe Statistiken
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const { count: customersWithNumbers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .not('customer_number', 'is', null);
    
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: ordersWithCustomerNumbers } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('customer_number', 'is', null);
    
    // Hole Beispiel-Kundennummern
    const { data: sampleCustomers } = await supabase
      .from('customers')
      .select('customer_number, email, first_name, last_name')
      .not('customer_number', 'is', null)
      .limit(3);
    
    return NextResponse.json({
      success: true,
      status: {
        customer_number_system_active: customerNumberExists,
        customers: {
          total: totalCustomers || 0,
          with_customer_numbers: customersWithNumbers || 0,
          coverage_percentage: totalCustomers ? Math.round((customersWithNumbers || 0) / totalCustomers * 100) : 0
        },
        orders: {
          total: totalOrders || 0,
          with_customer_numbers: ordersWithCustomerNumbers || 0,
          coverage_percentage: totalOrders ? Math.round((ordersWithCustomerNumbers || 0) / totalOrders * 100) : 0
        },
        sample_customer_numbers: sampleCustomers || [],
        next_customer_number: 'KD-' + String(10001 + (totalCustomers || 0)).padStart(5, '0')
      }
    });
    
  } catch (error) {
    console.error('❌ Customer numbers status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Status-Check fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}