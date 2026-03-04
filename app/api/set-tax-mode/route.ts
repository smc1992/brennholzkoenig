import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// API zum Setzen der Steuerart für order_items
export async function POST(request: NextRequest) {
  try {
    const { orderId, taxIncluded } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID ist erforderlich' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();

    // Update alle order_items für diese Bestellung
    const { data, error } = await supabase
      .from('order_items')
      .update({ tax_included: taxIncluded })
      .eq('order_id', orderId)
      .select();

    if (error) {
      console.error('Error updating tax mode:', error);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Steuerart' }, { status: 500 });
    }

    console.log(`✅ Tax mode updated for order ${orderId}:`, {
      items_updated: data?.length || 0,
      tax_included: taxIncluded
    });

    return NextResponse.json({ 
      success: true, 
      message: `Steuerart für ${data?.length || 0} Artikel aktualisiert`,
      items_updated: data?.length || 0
    });

  } catch (error) {
    console.error('Error in set-tax-mode API:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// API zum Abrufen der aktuellen Steuereinstellungen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const supabase = getAdminSupabaseClient();

    if (orderId) {
      // Steuerart für spezifische Bestellung abrufen
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('tax_included')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error fetching order tax mode:', error);
        return NextResponse.json({ error: 'Fehler beim Abrufen der Steuerart' }, { status: 500 });
      }

      // Prüfe ob alle Items die gleiche Steuereinstellung haben
      const taxIncludedItems = orderItems?.filter(item => item.tax_included) || [];
      const taxExcludedItems = orderItems?.filter(item => !item.tax_included) || [];

      return NextResponse.json({
        orderId,
        total_items: orderItems?.length || 0,
        tax_included_items: taxIncludedItems.length,
        tax_excluded_items: taxExcludedItems.length,
        mixed_mode: taxIncludedItems.length > 0 && taxExcludedItems.length > 0,
        default_tax_included: taxIncludedItems.length > taxExcludedItems.length
      });
    } else {
      // Globale Steuereinstellungen abrufen
      const { data: settings, error } = await supabase
        .from('invoice_settings')
        .select('default_tax_included, vat_rate')
        .single();

      if (error) {
        console.error('Error fetching tax settings:', error);
        return NextResponse.json({ error: 'Fehler beim Abrufen der Steuereinstellungen' }, { status: 500 });
      }

      return NextResponse.json({
        default_tax_included: settings?.default_tax_included || false,
        vat_rate: settings?.vat_rate || 19
      });
    }

  } catch (error) {
    console.error('Error in set-tax-mode GET API:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}