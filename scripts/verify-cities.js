const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase-Umgebungsvariablen fehlen!');
  process.exit(1);
}

let supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function listCityStatus() {
  try {
    let { data, error } = await supabase
      .from('city_pages')
      .select('slug, city_name, is_active, hero_title, hero_subtitle, meta_title, meta_description, special_offers, local_faqs, content_section_1_title, content_section_1_content, content_section_2_title, content_section_2_content, content_section_3_title, content_section_3_content, updated_at')
      .order('city_name');

    if (error && String(error.message || '').includes('Invalid API key') && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const retry = await supabase
        .from('city_pages')
        .select('slug, city_name, is_active, content_section_1_content, content_section_2_content, content_section_3_content, updated_at')
        .order('city_name');
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('❌ Fehler beim Laden der Städte:', error);
      process.exit(1);
    }

    let ok = 0, warn = 0; const actives = [];
    for (const c of (data || [])) {
      const sectionsFilled = [c.content_section_1_content, c.content_section_2_content, c.content_section_3_content]
        .filter(x => x && String(x).length > 0).length;
      const heroFilled = !!c.hero_title && !!c.hero_subtitle;
      const metaFilled = !!c.meta_title && !!c.meta_description;
      const offersFilled = !!c.special_offers;
      const faqsFilled = Array.isArray(c.local_faqs) && c.local_faqs.length >= 3;
      const complete = sectionsFilled === 3 && heroFilled && metaFilled && offersFilled && faqsFilled;
      const status = (c.is_active && complete) ? 'OK' : 'FEHLT_INHALT/INAKTIV';
      if (status === 'OK') { ok++; actives.push(c.slug); } else { warn++; }
      console.log(`REPORT | ${status} | ${c.slug} | active=${c.is_active} | sections=${sectionsFilled}/3 | hero=${heroFilled} | meta=${metaFilled} | offers=${offersFilled} | faqs=${faqsFilled} | name=${c.city_name} | updated=${c.updated_at}`);
    }
    console.log(`SUMMARY | OK=${ok} WARN=${warn} TOTAL=${(data || []).length}`);
    console.log('ACTIVE_SLUGS | ' + actives.join(','));

  } catch (err) {
    console.error('❌ Unerwarteter Fehler:', err);
    process.exit(1);
  }
}

listCityStatus();