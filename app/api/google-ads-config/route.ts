import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

type GoogleAdsConfig = {
  google_ads_id: string;
  conversion_tracking: boolean;
  remarketing: boolean;
  enhanced_conversions: boolean;
  purchase_label: string;
  lead_label: string;
  signup_label: string;
};

const DEFAULT_CONFIG: GoogleAdsConfig = {
  google_ads_id: '',
  conversion_tracking: false,
  remarketing: true,
  enhanced_conversions: false,
  purchase_label: '',
  lead_label: '',
  signup_label: ''
};

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'google_ads_tracking');

    if (error) {
      console.error('Error loading Google Ads config:', error);
      return NextResponse.json(DEFAULT_CONFIG);
    }

    const config: GoogleAdsConfig = { ...DEFAULT_CONFIG };
    (data || []).forEach((row: any) => {
      const key = row.setting_key as keyof GoogleAdsConfig;
      const raw = row.setting_value;
      if (key in config) {
        // Booleans stored as strings
        if (key === 'conversion_tracking' || key === 'remarketing' || key === 'enhanced_conversions') {
          (config as any)[key] = raw === 'true';
        } else {
          (config as any)[key] = raw || '';
        }
      }
    });

    return NextResponse.json(config);
  } catch (e) {
    console.error('Error in google-ads-config GET:', e);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const body = (await req.json()) as Partial<GoogleAdsConfig>;

    const payload: GoogleAdsConfig = {
      google_ads_id: body.google_ads_id || '',
      conversion_tracking: Boolean(body.conversion_tracking),
      remarketing: body.remarketing === undefined ? true : Boolean(body.remarketing),
      enhanced_conversions: Boolean(body.enhanced_conversions),
      purchase_label: body.purchase_label || '',
      lead_label: body.lead_label || '',
      signup_label: body.signup_label || ''
    };

    // Persist as individual rows (matching existing Admin Tab usage)
    const rows = Object.entries(payload).map(([key, value]) => ({
      setting_type: 'google_ads_tracking',
      setting_key: key,
      setting_value: String(value),
      updated_at: new Date().toISOString()
    }));

    // Remove old rows, then insert new
    const { error: delError } = await supabase
      .from('app_settings')
      .delete()
      .eq('setting_type', 'google_ads_tracking');

    if (delError) {
      console.error('Error deleting old Google Ads config:', delError);
      // Continue anyway to attempt insert
    }

    const { error: insError } = await supabase
      .from('app_settings')
      .insert(rows);

    if (insError) {
      console.error('Error saving Google Ads config:', insError);
      return NextResponse.json({ success: false, error: 'Failed to save Google Ads config' }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: payload });
  } catch (e) {
    console.error('Error in google-ads-config POST:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}