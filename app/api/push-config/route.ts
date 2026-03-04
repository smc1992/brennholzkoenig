import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerSupabase();
    
    // Lade Push-Konfiguration aus app_settings
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_type', 'push_config')
      .eq('setting_key', 'main')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading push config:', error);
      return NextResponse.json({ error: 'Failed to load push config' }, { status: 500 });
    }

    // Standard-Konfiguration wenn keine vorhanden
    const defaultConfig = {
      enabled: false,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      apiEndpoint: '/api/push-notifications',
      maxSubscriptions: 10000,
      retryAttempts: 3,
      ttl: 86400 // 24 Stunden
    };

    const config = data ? JSON.parse(data.setting_value) : defaultConfig;
    
    // Entferne private Key aus der Antwort
    const publicConfig = {
      enabled: config.enabled,
      vapidPublicKey: config.vapidPublicKey,
      apiEndpoint: config.apiEndpoint,
      maxSubscriptions: config.maxSubscriptions,
      ttl: config.ttl
    };
    
    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error('Error in push-config GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const config = await request.json();

    // Validierung der Eingaben
    const validatedConfig = {
      enabled: Boolean(config.enabled),
      vapidPublicKey: config.vapidPublicKey || '',
      vapidPrivateKey: config.vapidPrivateKey || '',
      apiEndpoint: config.apiEndpoint || '/api/push-notifications',
      maxSubscriptions: parseInt(config.maxSubscriptions) || 10000,
      retryAttempts: parseInt(config.retryAttempts) || 3,
      ttl: parseInt(config.ttl) || 86400,
      updated_at: new Date().toISOString()
    };

    // Speichere Konfiguration in app_settings
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        setting_type: 'push_config',
        setting_key: 'main',
        setting_value: JSON.stringify(validatedConfig),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving push config:', error);
      return NextResponse.json({ error: 'Failed to save push config' }, { status: 500 });
    }

    // Entferne private Key aus der Antwort
    const responseConfig = {
      enabled: validatedConfig.enabled,
      vapidPublicKey: validatedConfig.vapidPublicKey,
      apiEndpoint: validatedConfig.apiEndpoint,
      maxSubscriptions: validatedConfig.maxSubscriptions,
      ttl: validatedConfig.ttl
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Push-Konfiguration erfolgreich gespeichert',
      config: responseConfig
    });
  } catch (error) {
    console.error('Error in push-config POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}