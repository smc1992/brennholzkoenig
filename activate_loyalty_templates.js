const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function activateLoyaltyTemplates() {
  try {
    console.log('🔍 Suche nach Loyalty E-Mail-Templates...');
    
    // Lade alle E-Mail-Templates
    const { data: templates, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (error) {
      throw error;
    }

    console.log(`📧 Gefunden: ${templates.length} E-Mail-Templates`);

    // Finde und aktiviere Loyalty-Templates
    const loyaltyTemplates = templates.filter(template => {
      try {
        const parsed = JSON.parse(template.setting_value);
        const type = parsed.type || '';
        return type.includes('loyalty');
      } catch (e) {
        return false;
      }
    });

    console.log(`🎯 Gefunden: ${loyaltyTemplates.length} Loyalty-Templates`);

    for (const template of loyaltyTemplates) {
      try {
        const parsed = JSON.parse(template.setting_value);
        
        // Aktiviere das Template
        parsed.active = true;
        
        // Aktiviere auch die entsprechenden Trigger
        if (parsed.triggers) {
          if (parsed.type === 'loyalty_points_earned') {
            parsed.triggers.loyalty_points_earned = true;
          } else if (parsed.type === 'loyalty_points_redeemed') {
            parsed.triggers.loyalty_points_redeemed = true;
          } else if (parsed.type === 'loyalty_tier_upgrade') {
            parsed.triggers.loyalty_tier_upgrade = true;
          } else if (parsed.type === 'loyalty_points_expiring') {
            parsed.triggers.loyalty_points_expiring = true;
          }
        }

        // Update in der Datenbank
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({
            setting_value: JSON.stringify(parsed),
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ Aktiviert: ${template.setting_key} (${parsed.type})`);
      } catch (e) {
        console.error(`❌ Fehler bei Template ${template.setting_key}:`, e);
      }
    }

    console.log('🎉 Alle Loyalty-Templates wurden aktiviert!');
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

activateLoyaltyTemplates();
