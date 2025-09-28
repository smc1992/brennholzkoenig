const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Verwende die korrekten Umgebungsvariablen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Verwende Anon Key

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase-Umgebungsvariablen fehlen!');
  console.log('Benötigt: NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔑 Verwende Supabase URL:', supabaseUrl);
console.log('🔑 Verwende Anon Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCityContent() {
  try {
    console.log('🔄 Lade erweiterte Stadtinhalte...');
    
    // Lade die JSON-Daten
    const jsonData = fs.readFileSync('city-content-data.json', 'utf8');
    const data = JSON.parse(jsonData);
    const cityData = data.cities;
    
    console.log(`📊 Gefunden: ${cityData.length} Städte`);
    
    for (const city of cityData) {
      console.log(`\n🏙️ Aktualisiere ${city.slug}...`);
      
      const { data, error } = await supabase
        .from('city_pages')
        .update({
          content_section_1_title: city.content_section_1_title,
          content_section_1_text: city.content_section_1_text,
          content_section_2_title: city.content_section_2_title,
          content_section_2_text: city.content_section_2_text,
          content_section_3_title: city.content_section_3_title,
          content_section_3_text: city.content_section_3_text,
          special_offers: city.special_offers
        })
        .eq('slug', city.slug)
        .select();
      
      if (error) {
        console.error(`❌ Fehler bei ${city.slug}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ ${city.slug} erfolgreich aktualisiert`);
        console.log(`📊 Aktualisierte Daten:`, data[0]);
      } else {
        console.log(`⚠️ ${city.slug} nicht gefunden (slug: ${city.slug})`);
        console.log(`🔍 Debug - data:`, data);
        console.log(`🔍 Debug - error:`, error);
      }
    }
    
    console.log('\n🎉 Alle Stadtinhalte wurden aktualisiert!');
    
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Stadtinhalte:', error);
  }
}

updateCityContent();