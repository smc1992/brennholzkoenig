import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not configured');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database service not configured',
        message: 'Supabase environment variables missing'
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'info@brennholz-koenig.de';
    const action = searchParams.get('action') || 'search';

    console.log('🔍 Debug orders action:', action, 'email:', email);
    
    if (action === 'structure') {
      // Zeige Tabellenstruktur
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
      
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

      // Prüfe auch E-Mail-Logs Tabelle
      const { data: emailLogs, error: emailLogsError } = await supabase
        .from('email_logs')
        .select('*')
        .limit(1);

      return NextResponse.json({
        success: true,
        orders_structure: orders?.[0] ? Object.keys(orders[0]) : [],
        orders_sample: orders?.[0] || null,
        customers_structure: customers?.[0] ? Object.keys(customers[0]) : [],
        customers_sample: customers?.[0] || null,
        email_logs_structure: emailLogs?.[0] ? Object.keys(emailLogs[0]) : [],
        email_logs_sample: emailLogs?.[0] || null,
        orders_error: ordersError,
        customers_error: customersError,
        email_logs_error: emailLogsError
      });
    }

    if (action === 'email_logs') {
      // Suche nach E-Mail-Logs in app_settings für die E-Mail-Adresse
      const { data: emailLogs, error: emailLogsError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'email_log')
        .order('created_at', { ascending: false });

      // Filtere Logs nach E-Mail-Adresse
      const filteredLogs = emailLogs?.filter(log => {
        try {
          const logData = JSON.parse(log.setting_value);
          return logData.to === email;
        } catch {
          return false;
        }
      }).map(log => ({
        ...log,
        log_data: JSON.parse(log.setting_value)
      })) || [];

      return NextResponse.json({
        email_logs: filteredLogs,
        email_logs_error: emailLogsError?.message || null,
        total_email_logs: emailLogs?.length || 0
      });
    }
    
    // Erst alle Bestellungen abrufen um die Struktur zu sehen
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allOrdersError) {
      console.error('All orders query error:', allOrdersError);
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Abrufen aller Bestellungen',
        details: allOrdersError
      }, { status: 500 });
    }

    // Suche auch nach Kunden mit dieser E-Mail
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email);

    if (customersError) {
      console.error('Customers query error:', customersError);
    }

    return NextResponse.json({
      success: true,
      email: email,
      all_orders: allOrders || [],
      all_orders_count: allOrders?.length || 0,
      customers: customers || [],
      customers_count: customers?.length || 0,
      message: allOrders?.length ? `${allOrders.length} Bestellungen gefunden (alle)` : 'Keine Bestellungen gefunden',
      orders_structure: allOrders?.[0] ? Object.keys(allOrders[0]) : []
    });

  } catch (error) {
    console.error('Debug orders error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unerwarteter Fehler',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}