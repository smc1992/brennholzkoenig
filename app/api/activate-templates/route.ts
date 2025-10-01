import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Aktiviere Loyalty E-Mail-Templates...');

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

    console.log(`📧 Gefundene Templates: ${templates?.length || 0}`);

    // Filtere Loyalty-Templates und aktiviere sie
    const loyaltyTemplates = templates?.filter((template: any) => {
      return template.setting_key && (
        template.setting_key.includes('loyalty') ||
        template.setting_key.includes('points') ||
        template.setting_key.includes('tier')
      );
    }) || [];

    console.log(`🎯 Loyalty-Templates gefunden: ${loyaltyTemplates.length}`);
    loyaltyTemplates.forEach((template: any) => {
      console.log(`  - ${template.setting_key}`);
    });

    const results = [];

    for (const template of loyaltyTemplates) {
      try {
        // Parse das aktuelle Template
        let templateData = JSON.parse(template.setting_value);
        
        // Aktiviere das Template
        templateData.is_active = true;
        templateData.active = true; // Fallback für beide Schemas
        
        // Stelle sicher, dass die Trigger aktiviert sind
        if (!templateData.triggers) {
          templateData.triggers = {};
        }
        
        // Aktiviere den entsprechenden Trigger basierend auf dem Template-Key
        if (template.setting_key.includes('points_earned')) {
          templateData.triggers.loyalty_points_earned = true;
        } else if (template.setting_key.includes('points_redeemed')) {
          templateData.triggers.loyalty_points_redeemed = true;
        } else if (template.setting_key.includes('tier_upgrade')) {
          templateData.triggers.loyalty_tier_upgrade = true;
        } else if (template.setting_key.includes('points_expiring')) {
          templateData.triggers.loyalty_points_expiring = true;
        }

        // Update das Template in der Datenbank
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({
            setting_value: JSON.stringify(templateData),
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (updateError) {
          console.error(`❌ Fehler beim Aktivieren von ${template.setting_key}:`, updateError);
          results.push({
            template: template.setting_key,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`✅ Template aktiviert: ${template.setting_key}`);
          results.push({
            template: template.setting_key,
            success: true,
            message: 'Template aktiviert'
          });
        }
      } catch (parseError) {
        console.error(`❌ Fehler beim Parsen von ${template.setting_key}:`, parseError);
        results.push({
          template: template.setting_key,
          success: false,
          error: 'Fehler beim Parsen des Templates'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`🎉 Aktivierung abgeschlossen: ${successCount}/${totalCount} Templates erfolgreich aktiviert`);

    return NextResponse.json({
      success: true,
      message: `${successCount}/${totalCount} Loyalty-Templates wurden aktiviert`,
      results
    });

  } catch (error) {
    console.error('❌ Fehler beim Aktivieren der Loyalty-Templates:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}