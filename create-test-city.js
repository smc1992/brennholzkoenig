const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase Umgebungsvariablen fehlen');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestCity() {
  try {
    console.log('🏙️ Erstelle Test-Stadtseite...');
    
    const testCity = {
      slug: 'berlin',
      city_name: 'Berlin',
      meta_title: 'Brennholz Berlin - Premium Kaminholz Lieferung | Brennholzkönig',
      meta_description: 'Hochwertiges Brennholz in Berlin bestellen. Schnelle Lieferung, faire Preise. Buche, Eiche, Birke - ofenfertig und kammergetrocknet.',
      hero_title: 'Premium Brennholz für Berlin',
      hero_subtitle: 'Hochwertige Kaminholz-Lieferung direkt zu Ihnen nach Hause',
      hero_image_url: '/images/brennholz-hero.jpg',
      city_image_url: '/images/berlin-city.jpg',
      content_section_1_title: 'Brennholz Berlin - Ihre lokale Quelle für Premium Kaminholz',
      content_section_1_text: '<p>Als führender Brennholz-Lieferant in Berlin bieten wir Ihnen hochwertiges, kammergetrocknetes Kaminholz direkt vor Ihre Haustür. Unsere langjährige Erfahrung und unser Engagement für Qualität machen uns zur ersten Wahl für Berliner Haushalte.</p><p>Ob für gemütliche Abende am Kamin oder als zuverlässige Heizquelle - unser Brennholz erfüllt höchste Qualitätsstandards und wird nachhaltig aus regionalen Wäldern gewonnen.</p>',
      content_section_2_title: 'Warum Brennholzkönig in Berlin wählen?',
      content_section_2_text: '<p>✓ Schnelle Lieferung in alle Berliner Bezirke<br>✓ Kammergetrocknetes Holz mit unter 20% Restfeuchte<br>✓ Nachhaltige Forstwirtschaft aus der Region<br>✓ Faire Preise ohne versteckte Kosten<br>✓ Professionelle Beratung und Service</p>',
      local_keywords: ['Brennholz Berlin', 'Kaminholz Berlin', 'Holz Lieferung Berlin', 'Feuerholz Berlin', 'Brennholz kaufen Berlin'],
      postal_codes: ['10115', '10117', '10119', '10178', '10179', '10435', '10437', '10439', '10551', '10553', '10555', '10557', '10559', '10585', '10587', '10589', '10623', '10625', '10627', '10629', '10707', '10709', '10711', '10713', '10715', '10717', '10719', '10777', '10779', '10781', '10783', '10785', '10787', '10789', '10823', '10825', '10827', '10829', '10961', '10963', '10965', '10967', '10969', '10997', '10999'],
      service_areas: ['Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf', 'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'],
      contact_phone: '+49 30 12345678',
      contact_email: 'berlin@brennholz-koenig.de',
      contact_address: 'Musterstraße 123, 10115 Berlin',
      delivery_info: 'Kostenlose Lieferung ab 50€ Bestellwert in ganz Berlin. Lieferzeit: 2-3 Werktage.',
      special_offers: 'Neukunden erhalten 10% Rabatt auf die erste Bestellung!',
      is_active: true
    };

    const { data, error } = await supabase
      .from('city_pages')
      .insert([testCity])
      .select();

    if (error) {
      console.error('❌ Fehler beim Erstellen der Stadtseite:', error);
      return;
    }

    console.log('✅ Test-Stadtseite erfolgreich erstellt:', data[0]);
    console.log('🌐 Verfügbar unter: http://localhost:3001/berlin');
    
  } catch (err) {
    console.error('❌ Unerwarteter Fehler:', err);
  }
}

createTestCity();