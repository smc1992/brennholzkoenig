import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing invoices RLS policies...');
    
    // Verwende Service Role Key für Admin-Operationen
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.log('⚠️ No service role key available, using anon key...');
      
      // Fallback: Verwende normalen Client und versuche INSERT ohne RLS-Umgehung
      const supabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Versuche einfach eine Rechnung zu erstellen
      const testData = {
        invoice_number: 'TEST-' + Date.now(),
        order_id: null,  // Erlaubt NULL
        customer_id: null,  // Erlaubt NULL
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        subtotal_amount: '100.00',
        tax_amount: '19.00',
        total_amount: '119.00',
        payment_terms: 'Test'
      };
      
      const { data: testInsert, error: testError } = await supabase
        .from('invoices')
        .insert(testData)
        .select()
        .single();
      
      return NextResponse.json({
        success: !testError,
        message: testError ? 'RLS still blocking' : 'Insert successful with anon key',
        testInsert: {
          success: !testError,
          error: testError?.message || null,
          data: testInsert
        }
      });
    }
    
    // Verwende Service Role für Admin-Operationen
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('🔑 Using service role key for admin operations...');
    
    // Test ob wir jetzt in die invoices-Tabelle schreiben können mit Admin-Client
    const testData = {
      invoice_number: 'TEST-' + Date.now(),
      order_id: null,  // NULL erlaubt
      customer_id: null,  // NULL erlaubt
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      subtotal_amount: '100.00',
      tax_amount: '19.00',
      total_amount: '119.00',
      payment_terms: 'Test'
    };
    
    const { data: testInsert, error: testError } = await adminSupabase
      .from('invoices')
      .insert(testData)
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test insert failed:', testError);
    } else {
      console.log('✅ Test insert successful:', testInsert);
      
      // Lösche den Test-Eintrag wieder
      await adminSupabase
        .from('invoices')
        .delete()
        .eq('id', testInsert.id);
    }
    
    const results = [{
      action: 'admin_client_test',
      success: !testError,
      error: testError?.message || null
    }];
    
    return NextResponse.json({
      success: !testError,
      message: testError ? 'Admin client also blocked by RLS' : 'Admin client can insert invoices',
      results,
      testInsert: {
        success: !testError,
        error: testError?.message || null
      }
    });
    
  } catch (error) {
    console.error('❌ Fix invoices RLS error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix invoices RLS',
        details: error instanceof Error ? error.message : error
      },
      { status: 500 }
    );
  }
}