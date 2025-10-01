import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Lade Loyalty E-Mail-Templates...');

    // Lade alle E-Mail-Templates aus app_settings
    const { data: templates, error: fetchError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Templates:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Laden der Templates: ' + fetchError.message
      }, { status: 500 });
    }

    // Filtere und parse nur Loyalty-Templates
    const loyaltyTemplates = templates?.filter((template: any) => {
      return template.setting_key && (
        template.setting_key.includes('loyalty') ||
        template.setting_key.includes('points') ||
        template.setting_key.includes('tier')
      );
    }).map((template: any) => {
      let parsedData: any = {};
      let parseError = null;
      
      try {
        parsedData = JSON.parse(template.setting_value);
      } catch (e) {
        parseError = (e as Error).message;
      }

      return {
        id: template.id,
        setting_key: template.setting_key,
        description: template.description,
        parseError,
        template_key: parsedData.template_key,
        template_name: parsedData.template_name,
        template_type: parsedData.template_type,
        type: parsedData.type,
        subject: parsedData.subject,
        is_active: parsedData.is_active,
        active: parsedData.active,
        triggers: parsedData.triggers,
        variables: parsedData.variables
      };
    }) || [];

    console.log(`🎯 Loyalty-Templates gefunden: ${loyaltyTemplates.length}`);

    return NextResponse.json({
      success: true,
      loyalty_templates_count: loyaltyTemplates.length,
      loyalty_templates: loyaltyTemplates
    });

  } catch (error) {
    console.error('❌ Fehler beim Debug der Loyalty-Templates:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}