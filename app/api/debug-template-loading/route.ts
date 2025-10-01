import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Template Loading Process');

    // 1. Lade alle E-Mail-Templates aus der Datenbank
    const { data: rawTemplates, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (error) {
      console.error('❌ Fehler beim Laden der Templates:', error);
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Laden der Templates',
        details: error
      });
    }

    console.log(`📊 Gefundene Templates: ${rawTemplates?.length || 0}`);

    // 2. Parse und analysiere jedes Template
    const processedTemplates = rawTemplates?.map((template: any) => {
      console.log(`\n🔍 Verarbeite Template: ${template.setting_key}`);
      
      let parsedTemplate: any = {};
      let parseError = null;
      
      try {
        parsedTemplate = JSON.parse(template.setting_value);
        console.log(`✅ Template erfolgreich geparst`);
      } catch (e) {
        parseError = e;
        console.error(`❌ Fehler beim Parsen des Templates:`, e);
      }

      // Analysiere die Aktivierungslogik
      const isActiveOld = parsedTemplate?.active === true;
      const isActiveNew = parsedTemplate?.is_active === true;
      const isActive = isActiveOld || isActiveNew;
      
      console.log(`🔍 Aktivierungsstatus:`);
      console.log(`   - active: ${parsedTemplate?.active}`);
      console.log(`   - is_active: ${parsedTemplate?.is_active}`);
      console.log(`   - Endresultat isActive: ${isActive}`);

      // Analysiere den Typ
      const typeOld = parsedTemplate?.type;
      const typeNew = parsedTemplate?.template_type;
      const normalizedType = typeOld || typeNew || template.setting_key;
      
      console.log(`🔍 Typ-Analyse:`);
      console.log(`   - type: ${typeOld}`);
      console.log(`   - template_type: ${typeNew}`);
      console.log(`   - setting_key: ${template.setting_key}`);
      console.log(`   - Normalisierter Typ: ${normalizedType}`);

      // Analysiere Trigger
      const triggers = parsedTemplate?.triggers;
      console.log(`🔍 Trigger:`, triggers);

      const processedTemplate = {
        ...template,
        template: {
          ...parsedTemplate,
          type: normalizedType,
          active: isActive,
        },
        isActive,
        parseError,
        debug: {
          originalActive: parsedTemplate?.active,
          originalIsActive: parsedTemplate?.is_active,
          originalType: parsedTemplate?.type,
          originalTemplateType: parsedTemplate?.template_type,
          normalizedType,
          isActive,
          triggers
        }
      };

      console.log(`🔍 Template wird ${isActive ? 'EINGESCHLOSSEN' : 'AUSGESCHLOSSEN'}`);
      
      return processedTemplate;
    }) || [];

    // 3. Filtere aktive Templates
    const activeTemplates = processedTemplates.filter((t: any) => t.isActive);
    console.log(`\n📊 Aktive Templates: ${activeTemplates.length} von ${processedTemplates.length}`);

    // 4. Suche speziell nach Loyalty-Templates
    const loyaltyTemplates = activeTemplates.filter((t: any) => 
      t.template.type?.includes('loyalty')
    );
    console.log(`🎯 Loyalty Templates: ${loyaltyTemplates.length}`);

    // 5. Suche nach dem spezifischen "points_earned" Template
    const pointsEarnedTemplate = activeTemplates.find((t: any) => 
      t.template.type === 'loyalty_points_earned' && 
      t.template.triggers?.loyalty_points_earned === true
    );
    console.log(`🎯 Points Earned Template gefunden:`, !!pointsEarnedTemplate);

    return NextResponse.json({
      success: true,
      summary: {
        totalTemplates: rawTemplates?.length || 0,
        processedTemplates: processedTemplates.length,
        activeTemplates: activeTemplates.length,
        loyaltyTemplates: loyaltyTemplates.length,
        pointsEarnedTemplateFound: !!pointsEarnedTemplate
      },
      allTemplates: processedTemplates,
      activeTemplates,
      loyaltyTemplates,
      pointsEarnedTemplate
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    return NextResponse.json({
      success: false,
      error: 'Unerwarteter Fehler beim Debug-Prozess',
      details: error
    }, { status: 500 });
  }
}