const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase-Konfiguration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key für Admin-Operationen

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase-Umgebungsvariablen fehlen!');
  console.log('Benötigt: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importCityContent() {
  try {
    console.log('🚀 Starte Import der städtespezifischen Inhalte...');
    
    // JSON-Datei laden
    const dataPath = path.join(__dirname, '..', 'city-content-data.json');
    const cityData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('📄 Daten geladen:', Object.keys(cityData));
    
    // Für jede Stadt die Inhalte aktualisieren
    for (const [slug, content] of Object.entries(cityData)) {
      console.log(`\n🏙️  Aktualisiere Inhalte für: ${slug}`);
      
      const { data, error } = await supabase
        .from('city_pages')
        .update({
          content_section_1: content.content_section_1,
          content_section_2: content.content_section_2,
          content_section_3: content.content_section_3,
          special_offers: content.special_offers,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug)
        .select();
      
      if (error) {
        console.error(`❌ Fehler bei ${slug}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`✅ ${slug} erfolgreich aktualisiert`);
      } else {
        console.log(`⚠️  Keine Stadt mit Slug '${slug}' gefunden`);
      }
    }
    
    console.log('\n🎉 Import abgeschlossen!');
    
    // Überprüfung der aktualisierten Daten
    console.log('\n📊 Überprüfe aktualisierte Städte...');
    const { data: cities, error: fetchError } = await supabase
      .from('city_pages')
      .select('slug, city_name, updated_at')
      .eq('is_active', true)
      .order('city_name');
    
    if (fetchError) {
      console.error('❌ Fehler beim Abrufen der Städte:', fetchError);
    } else {
      console.log('📋 Aktuelle Städte:');
      cities.forEach(city => {
        console.log(`   • ${city.city_name} (${city.slug}) - ${new Date(city.updated_at).toLocaleString('de-DE')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    process.exit(1);
  }
}

// Skript ausführen
importCityContent();