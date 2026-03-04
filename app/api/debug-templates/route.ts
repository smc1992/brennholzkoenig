import { NextRequest, NextResponse } from 'next/server';
import { getActiveTemplatesWithTriggers } from '../../../lib/emailTriggerEngine';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Lade alle E-Mail-Templates direkt aus der Datenbank
    const { data: rawTemplates, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Lade Templates über die Engine
    const processedTemplates = await getActiveTemplatesWithTriggers();

    // Parse die Raw-Templates für bessere Lesbarkeit
    const parsedRawTemplates = rawTemplates?.map((template: any) => ({
      setting_key: template.setting_key,
      setting_type: template.setting_type,
      parsed_value: JSON.parse(template.setting_value),
      raw_value: template.setting_value
    }));

    // Fokus auf Trigger-Informationen
    const cancellationTemplates = parsedRawTemplates?.filter((t: any) => 
      t.setting_key.includes('cancellation')
    );

    const triggerInfo = cancellationTemplates?.map((t: any) => ({
      setting_key: t.setting_key,
      type: t.parsed_value.type,
      active: t.parsed_value.active,
      has_triggers: !!t.parsed_value.triggers,
      triggers: t.parsed_value.triggers || 'MISSING',
      subject: t.parsed_value.subject
    }));

    return NextResponse.json({
      success: true,
      trigger_analysis: triggerInfo,
      processed_templates_count: processedTemplates.length,
      active_templates: processedTemplates.map((t: any) => ({
        setting_key: t.setting_key,
        isActive: t.isActive,
        has_triggers: !!t.template.triggers
      }))
    });
  } catch (error) {
    console.error('Debug Templates Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}