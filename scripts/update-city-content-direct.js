const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Verwende die gleichen Umgebungsvariablen wie die App
const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateCityContent() {
  try {
    console.log('🚀 Starte Update der städtespezifischen Inhalte...');
    
    // JSON-Datei laden
    const dataPath = path.join(__dirname, '..', 'city-content-data.json');
    const cityData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('📄 Daten geladen:', Object.keys(cityData));
    
    // Zuerst alle existierenden Städte abrufen
    const { data: existingCities, error: fetchError } = await supabase
      .from('city_pages')
      .select('slug, city_name, id')
      .eq('is_active', true);
    
    if (fetchError) {
      console.error('❌ Fehler beim Abrufen der Städte:', fetchError);
      return;
    }
    
    console.log('📋 Gefundene Städte:', existingCities.map(c => `${c.city_name} (${c.slug})`));
    
    // Für jede Stadt die Inhalte aktualisieren
    for (const [slug, content] of Object.entries(cityData)) {
      console.log(`\n🏙️  Aktualisiere Inhalte für: ${slug}`);
      
      const city = existingCities.find(c => c.slug === slug);
      if (!city) {
        console.log(`⚠️  Stadt mit Slug '${slug}' nicht gefunden`);
        continue;
      }
      
      const { data, error } = await supabase
        .from('city_pages')
        .update({
          content_section_1_text: content.content_section_1,
          content_section_2_text: content.content_section_2,
          content_section_3_text: content.content_section_3,
          special_offers: content.special_offers,
          updated_at: new Date().toISOString()
        })
        .eq('id', city.id)
        .select();
      
      if (error) {
        console.error(`❌ Fehler bei ${slug}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`✅ ${city.city_name} (${slug}) erfolgreich aktualisiert`);
      } else {
        console.log(`⚠️  Keine Daten für ${slug} aktualisiert`);
      }
    }
    
    console.log('\n🎉 Update abgeschlossen!');
    
    // Überprüfung der aktualisierten Daten
    console.log('\n📊 Überprüfe aktualisierte Städte...');
    const { data: updatedCities, error: checkError } = await supabase
      .from('city_pages')
      .select('slug, city_name, updated_at, content_section_1_text')
      .eq('is_active', true)
      .order('city_name');
    
    if (checkError) {
      console.error('❌ Fehler beim Überprüfen:', checkError);
    } else {
      console.log('📋 Aktualisierte Städte:');
      updatedCities.forEach(city => {
        const hasContent = city.content_section_1_text && city.content_section_1_text.length > 0;
        console.log(`   • ${city.city_name} (${city.slug}) - ${new Date(city.updated_at).toLocaleString('de-DE')} ${hasContent ? '✅ Mit Inhalt' : '❌ Ohne Inhalt'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    process.exit(1);
  }
}

// Skript ausführen
updateCityContent();