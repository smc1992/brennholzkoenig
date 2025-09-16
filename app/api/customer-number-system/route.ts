import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Funktion zur Generierung einer Kundennummer basierend auf Email
function generateCustomerNumber(email: string): string {
  // Erstelle einen Hash aus der Email für konsistente Kundennummer
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Konvertiere zu positiver 5-stelliger Zahl zwischen 10000-99999
  const numericPart = Math.abs(hash) % 89999 + 10000;
  return `KD-${String(numericPart).padStart(5, '0')}`;
}

// Funktion zum Abrufen oder Erstellen einer Kundennummer
async function getOrCreateCustomerNumber(email: string): Promise<string> {
  try {
    // 1. Prüfe ob Kunde bereits existiert
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('id, customer_number')
      .eq('email', email)
      .single();

    if (existingCustomer && existingCustomer.customer_number) {
      console.log('✅ Existing customer found:', existingCustomer.customer_number);
      return existingCustomer.customer_number;
    }

    // 2. Generiere neue Kundennummer
    const newCustomerNumber = generateCustomerNumber(email);
    console.log('🔢 Generated customer number:', newCustomerNumber, 'for email:', email);

    // 3. Aktualisiere bestehenden Kunden oder erstelle neuen
    if (existingCustomer) {
      // Update existing customer
      const { error: updateError } = await supabase
        .from('customers')
        .update({ customer_number: newCustomerNumber })
        .eq('id', existingCustomer.id);

      if (updateError) {
        console.error('❌ Error updating customer:', updateError);
        throw updateError;
      }
      
      console.log('✅ Updated existing customer with customer_number');
    } else {
      // Create new customer
      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          email: email,
          customer_number: newCustomerNumber,
          first_name: '',
          last_name: ''
        });

      if (insertError) {
        console.error('❌ Error creating customer:', insertError);
        throw insertError;
      }
      
      console.log('✅ Created new customer with customer_number');
    }

    return newCustomerNumber;
  } catch (error) {
    console.error('💥 Error in getOrCreateCustomerNumber:', error);
    throw error;
  }
}

// POST: Erstelle oder aktualisiere Kundennummer für Email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }

    const customerNumber = await getOrCreateCustomerNumber(email);
    
    return NextResponse.json({
      success: true,
      email: email,
      customer_number: customerNumber,
      message: 'Customer number created/retrieved successfully'
    });

  } catch (error: any) {
    console.error('💥 Customer number system error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET: Hole Kundennummer für Email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email parameter is required' 
      }, { status: 400 });
    }

    const customerNumber = await getOrCreateCustomerNumber(email);
    
    return NextResponse.json({
      success: true,
      email: email,
      customer_number: customerNumber
    });

  } catch (error: any) {
    console.error('💥 Get customer number error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// PUT: Batch-Update aller bestehenden Kunden mit Kundennummern
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Starting batch update of customer numbers...');
    
    // Hole alle Kunden ohne customer_number
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('id, email, customer_number')
      .or('customer_number.is.null,customer_number.eq.');

    if (fetchError) {
      throw fetchError;
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No customers need customer number updates',
        updated_count: 0
      });
    }

    console.log(`📋 Found ${customers.length} customers without customer numbers`);
    
    const updates = [];
    
    for (const customer of customers) {
      if (customer.email) {
        const customerNumber = generateCustomerNumber(customer.email);
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({ customer_number: customerNumber })
          .eq('id', customer.id);

        if (updateError) {
          console.error(`❌ Error updating customer ${customer.id}:`, updateError);
          updates.push({ id: customer.id, email: customer.email, success: false, error: updateError.message });
        } else {
          console.log(`✅ Updated customer ${customer.id} with ${customerNumber}`);
          updates.push({ id: customer.id, email: customer.email, customer_number: customerNumber, success: true });
        }
      }
    }
    
    const successCount = updates.filter(u => u.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Batch update completed: ${successCount}/${customers.length} customers updated`,
      updated_count: successCount,
      total_count: customers.length,
      updates: updates
    });

  } catch (error: any) {
    console.error('💥 Batch update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}