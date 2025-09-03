import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerSupabase();
    
    // Lade Tracking-Konfiguration aus app_settings
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_type', 'tracking_config')
      .eq('setting_key', 'main')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading tracking config:', error);
      return NextResponse.json({ error: 'Failed to load tracking config' }, { status: 500 });
    }

    // Standard-Konfiguration wenn keine vorhanden
    const defaultConfig = {
      google_analytics_id: '',
      google_tag_manager_id: '',
      facebook_pixel_id: '',
      google_analytics_enabled: false,
      google_tag_manager_enabled: false,
      facebook_pixel_enabled: false,
      tracking_active: false
    };

    const config = data ? JSON.parse(data.setting_value) : defaultConfig;
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in tracking-config GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const config = await request.json();

    // Validierung der Eingaben
    const validatedConfig = {
      google_analytics_id: config.google_analytics_id || '',
      google_tag_manager_id: config.google_tag_manager_id || '',
      facebook_pixel_id: config.facebook_pixel_id || '',
      google_analytics_enabled: Boolean(config.google_analytics_enabled),
      google_tag_manager_enabled: Boolean(config.google_tag_manager_enabled),
      facebook_pixel_enabled: Boolean(config.facebook_pixel_enabled),
      tracking_active: Boolean(config.tracking_active),
      updated_at: new Date().toISOString()
    };

    // Speichere Konfiguration in app_settings
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        setting_type: 'tracking_config',
        setting_key: 'main',
        setting_value: JSON.stringify(validatedConfig),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_type,setting_key'
      });

    if (error) {
      console.error('Error saving tracking config:', error);
      return NextResponse.json({ error: 'Failed to save tracking config' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tracking-Konfiguration erfolgreich gespeichert',
      config: validatedConfig
    });
  } catch (error) {
    console.error('Error in tracking-config POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}