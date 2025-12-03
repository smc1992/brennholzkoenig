const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!serviceKey && !anonKey)) {
  console.error('❌ Supabase-Umgebungsvariablen fehlen!');
  console.log('Benötigt: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY (bevorzugt) oder NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

let supabaseKey = serviceKey || anonKey;
console.log('🔑 Verwende Supabase URL:', supabaseUrl);

let supabase = createClient(supabaseUrl, supabaseKey);

function toTitleCase(slug) {
  return String(slug || '')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function updateCityContent() {
  try {
    console.log('🔄 Lade erweiterte Stadtinhalte...');
    
    const jsonData = fs.readFileSync('city-content-data.json', 'utf8');
    const data = JSON.parse(jsonData);
    let cityData = data.cities;
    const extraCityContent = [
      {
        slug: 'alheim',
        hero_title: 'Premium Brennholz für Alheim',
        hero_subtitle: 'Zuverlässige Lieferung in Gemeinde und Ortsteile',
        hero_image_url: 'https://readdy.ai/api/search-image?query=Cozy%20German%20countryside%20firewood%20storage%20in%20Alheim%20Hesse%2C%20stacked%20dry%20oak%20logs%2C%20warm%20wood%20tones%2C%20professional%20firewood%20business%20background%20photo&width=1920&height=1080&seq=hero-alheim&orientation=landscape',
        city_image_url: 'https://readdy.ai/api/search-image?query=Alheim%20Hessen%20town%20and%20rural%20landscape%20view%2C%20German%20village%20fields%20and%20forest%2C%20soft%20light%20photography&width=1200&height=800&seq=city-alheim&orientation=landscape',
        content_section_1_main_title: 'Lokale Expertise für {city_name}',
        content_section_1_subtitle: 'Ihr vertrauensvoller Partner für hochwertiges Brennholz',
        content_section_1_title: 'Lokale Expertise',
        content_section_1_text: '<p>Wärme für Alheim – regionaler Anbieter, lokaler Brennholzhändler und direkter Service aus der Region. Unser heimisches Holz stammt aus nachhaltiger Forstwirtschaft rund um Alheim und steht für verlässliche, regionale Qualität. Kurze Wege bedeuten faire Preise und schnelle Lieferung.</p><p><strong>Schwerpunkte:</strong> vor Ort produziert • regionale Qualität • nachhaltige Forstwirtschaft • lokale Lieferung • direkter Service</p><p><strong>PLZ & Begriffe:</strong> Brennholz 36211 • Kaminholz 36211 • Holzlieferung 36211</p><p><strong>Gebietsbezug:</strong> Brennholz Gemeinde Alheim • Holzservice in den Ortsteilen</p><p>Wir liefern regionales Brennholz in Alheim und Umgebung. Kurze Wege, faire Preise und nachhaltige Qualität aus der Region.</p>',
        content_section_2_title: 'Regionale Qualität aus Alheim',
        content_section_2_text: '<p>Ofenfertiges Hartholz mit unter 20% Restfeuchte für saubere Verbrennung und gleichmäßige Wärme. Scheitgrößen 25/33 cm, handverlesen und sortenrein – ideal für moderne Kamin- und Kachelöfen.</p>',
        content_section_3_title: 'Nachhaltigkeit & kurze Wege',
        content_section_3_text: '<p>Naturnahe Bewirtschaftung, Schutz der Biodiversität und kurze Transportwege stehen im Mittelpunkt. Jede Lieferung wird vor Abfahrt kontrolliert – für dauerhaft hohe Qualität.</p>',
        local_keywords: [
          'regionaler Anbieter Alheim',
          'lokaler Brennholzhändler Alheim',
          'aus der Region Alheim',
          'heimisches Holz Alheim',
          'regionale Qualität Alheim',
          'vor Ort produziert Alheim',
          'nachhaltige Forstwirtschaft Alheim',
          'lokale Lieferung Alheim',
          'direkter Service Alheim',
          'Brennholz 36211',
          'Kaminholz 36211',
          'Holzlieferung 36211',
          'Brennholz Gemeinde Alheim',
          'Holzservice Ortsteile Alheim'
        ],
        postal_codes: ['36211'],
        service_areas: ['Gemeinde Alheim', 'Ortsteile Alheim'],
        special_offers: '<p><strong>🔥 Alheim-Spezial:</strong> 3+1 auf Premium-Buche, Lieferung im Gemeindegebiet zum Festpreis inkl. optionalem Stapelservice.</p>'
      },
      {
        slug: 'kassel',
        content_section_1_title: 'Brennholz aus dem Habichtswald – Kasseler Qualität',
        content_section_1_text: '<p>Kassel verbindet den berühmten Bergpark Wilhelmshöhe, die Tradition der Brüder Grimm und die waldreiche Umgebung des Habichtswalds. Unser Brennholz für Kassel stammt aus nachhaltiger Forstwirtschaft der Region: vorwiegend Buche und Eiche mit hoher Dichte und gleichmäßigem Brennverhalten.</p><p>Die kurzen Lieferwege im Raum Kassel senken Emissionen und sichern konstante Qualität. Jede Charge wird auf Restfeuchte geprüft und für moderne Kaminöfen optimiert.</p>',
        content_section_2_title: 'Effiziente Wärme für Stadt und Umland',
        content_section_2_text: '<p>Ob Vorderer Westen, Wehlheiden oder die Hanglagen rund um den Habichtswald: Wir liefern passend geschnittene Scheite (25/33 cm) und stapeln auf Wunsch vor Ort. Trockenes Holz mit unter 20% Restfeuchte sorgt für saubere Verbrennung, weniger Rauch und langanhaltende Wärme.</p>',
        content_section_3_title: 'Nachhaltig aus der Region Kassel',
        content_section_3_text: '<p>Wir arbeiten mit zertifizierten Forstbetrieben und achten auf naturnahe Bewirtschaftung. Totholz und Biotopbäume bleiben erhalten, Mischwälder werden gefördert. Kurze Wege, transparente Herkunft und faire Preise – das ist Kasseler Brennholzqualität.</p>',
        special_offers: '<p><strong>🌳 Kassel-Spezial:</strong> 3+1 Aktion auf Premium-Buche, Lieferung im Stadtgebiet (42,50€) inkl. Stapelservice.</p>'
      },
      {
        slug: 'bad-hersfeld',
        content_section_1_title: 'Brennholz aus Seulingswald & Knüll – Bad Hersfeld',
        content_section_1_text: '<p>Bad Hersfeld liegt umgeben von Seulingswald und Knüll – zwei waldreiche Regionen mit exzellenter Holzqualität. Unser Brennholz stammt aus nachhaltiger Ernte mit Fokus auf Buche und Eiche für hohen Heizwert und gleichmäßige Glut.</p><p>Die berühmte Stiftsruine und Kulturtradition der Stadt spiegeln sich in unserem Service: zuverlässig, termintreu, regional verbunden.</p>',
        content_section_2_title: 'Konstante Wärme, wenig Aufwand',
        content_section_2_text: '<p>Getrocknetes Holz unter 20% Restfeuchte reduziert Rauch, schont den Schornstein und liefert behagliche Wärme. Wir liefern bis vor die Haustür, auch in engen Altstadtlagen, und bieten optional Kellerstapelung.</p>',
        content_section_3_title: 'Regionale Verantwortung',
        content_section_3_text: '<p>Wir setzen auf zertifizierte Forstpartner, Aufforstung und kurze Lieferwege. Jede Bestellung stärkt die regionale Wirtschaft und den nachhaltigen Waldbau rund um Bad Hersfeld.</p>',
        special_offers: '<p><strong>🔥 Bad-Hersfeld-Spezial:</strong> 10% Rabatt auf Erstbestellung, 3+1 auf Premium-Buche.</p>'
      },
      {
        slug: 'homberg-efze',
        content_section_1_title: 'Knüll-Qualität für Homberg (Efze)',
        content_section_1_text: '<p>Homberg (Efze) profitiert von den dichten Wäldern des Knüllgebirges. Das langsam gewachsene Holz liefert hohe Energiedichte und stabile Glut – ideal für Kaminöfen und Kachelöfen.</p><p>Wir beziehen vorwiegend Buche und Eiche aus nahegelegenen Beständen mit transparenter Herkunft.</p>',
        content_section_2_title: 'Sauber, effizient, regional',
        content_section_2_text: '<p>Trocknung auf unter 20% Restfeuchte, Scheitgrößen 25/33 cm, handverlesene Sortierung ohne Störanteile. Das sorgt für effiziente Verbrennung und reduziert Feinstaub.</p>',
        content_section_3_title: 'Für Natur und Region',
        content_section_3_text: '<p>Wir fördern Mischwälder, schützen Biotope und reduzieren Transportwege. Homberg erhält hochwertiges Brennholz mit fairen Preisen und zuverlässiger Lieferung.</p>',
        special_offers: '<p><strong>🌲 Homberg-Spezial:</strong> Lieferpauschale reduziert im Ortsgebiet, 3+1 auf Buche.</p>'
      },
      {
        slug: 'fritzlar',
        content_section_1_title: 'Eder & Chattengau – Brennholz für Fritzlar',
        content_section_1_text: '<p>Fritzlar liegt im traditionsreichen Chattengau, nahe der Eder. Die Region bietet erstklassiges Laubholz mit hoher Dichte. Unsere Lieferungen stammen aus zertifizierter, naturnaher Forstwirtschaft.</p>',
        content_section_2_title: 'Wärme für historische Gebäude',
        content_section_2_text: '<p>Gleichmäßige Scheitgrößen für historische Häuser und moderne Anlagen. Unter 20% Restfeuchte, saubere Flamme, weniger Asche. Auf Wunsch Terminabstimmung mit präzisem Zeitfenster.</p>',
        content_section_3_title: 'Regional und transparent',
        content_section_3_text: '<p>Kurze Wege entlang der Eder, faire Preise, klare Herkunft. Wir arbeiten mit lokalen Betrieben und setzen auf langfristige Walderhaltung.</p>',
        special_offers: '<p><strong>🏰 Fritzlar-Spezial:</strong> Gratis Stapelservice in der Altstadt, 3+1 auf Premium-Buche.</p>'
      },
      {
        slug: 'korbach',
        content_section_1_title: 'Kellerwald-Edersee Qualität für Korbach',
        content_section_1_text: '<p>Nahe dem UNESCO-Weltnaturerbe Kellerwald-Edersee wachsen robuste Laubwälder. Unser Holz aus der Region Korbach überzeugt mit hoher Dichte und gleichmäßigem Abbrand.</p>',
        content_section_2_title: 'Effizient heizen im Waldecker Land',
        content_section_2_text: '<p>Professionell getrocknetes Holz, ideal für Kamin- und Kachelöfen. Konstante Wärme, weniger Nachlegen, saubere Verbrennung. Lieferung zuverlässig bis vor die Tür.</p>',
        content_section_3_title: 'Respekt für Schutzgebiete',
        content_section_3_text: '<p>Wir achten besonders auf Schutzflächen, fördern Mischwald und reduzieren Transportemissionen. Regionale Wertschöpfung steht im Mittelpunkt.</p>',
        special_offers: '<p><strong>🟢 Korbach-Spezial:</strong> 5% Regionalrabatt, 3+1 auf Buche.</p>'
      },
      {
        slug: 'wolfhagen',
        content_section_1_title: 'Habichtswald & Weidelsburg – Brennholz für Wolfhagen',
        content_section_1_text: '<p>Wolfhagen profitiert vom Habichtswald und den Höhen rund um die Weidelsburg. Die Region liefert erstklassiges Buchenholz mit hoher Energiedichte.</p><p>Wir sortieren handverlesen und liefern pünktlich, auch in abgelegene Ortsteile.</p>',
        content_section_2_title: 'Konstant warme Räume',
        content_section_2_text: '<p>Unter 20% Restfeuchte, saubere Verbrennung, wenig Rauch. Scheite in 25/33 cm, optional Kellerstapelung.</p>',
        content_section_3_title: 'Regional verantwortungsvoll',
        content_section_3_text: '<p>Transparente Herkunft, kurze Wege, Zusammenarbeit mit lokalen Forstbetrieben. Fokus auf nachhaltige Bewirtschaftung und Biodiversität.</p>',
        special_offers: '<p><strong>🔔 Wolfhagen-Spezial:</strong> Lieferung zum Festpreis im Stadtgebiet, 3+1 auf Premium-Buche.</p>'
      }
    ];
    cityData = [...cityData, ...extraCityContent];
    
    console.log(`📊 Gefunden: ${cityData.length} Städte`);
    
    for (const city of cityData) {
      console.log(`\n🏙️ Prüfe/aktualisiere ${city.slug}...`);

      let { data: existing, error: selectError } = await supabase
        .from('city_pages')
        .select('id, is_active')
        .eq('slug', city.slug)
        .limit(1);

      if (selectError) {
        console.error(`❌ Fehler beim Prüfen von ${city.slug}:`, selectError);
        if (String(selectError.message || '').includes('Invalid API key') && anonKey && serviceKey) {
          console.log('↩️ Fallback auf Anon Key für Lesezugriff');
          supabaseKey = anonKey;
          supabase = createClient(supabaseUrl, supabaseKey);
          const retry = await supabase
            .from('city_pages')
            .select('id, is_active')
            .eq('slug', city.slug)
            .limit(1);
          existing = retry.data;
          selectError = retry.error;
          if (selectError) {
            console.error('❌ Prüfen fehlgeschlagen nach Fallback:', selectError);
            continue;
          }
        } else {
          continue;
        }
      }

      if (!existing || existing.length === 0) {
        console.log(`➕ Erstelle Stadtseite für ${city.slug}`);
        const defaults = {
          slug: city.slug,
          city_name: toTitleCase(city.slug),
          is_active: true
        };
        const { data: insertData, error: insertError } = await supabase
          .from('city_pages')
          .insert([defaults])
          .select();
        if (insertError) {
          console.error(`❌ Fehler beim Erstellen von ${city.slug}:`, insertError);
          continue;
        }
        console.log(`✅ Erstellt:`, insertData && insertData[0] ? insertData[0].id : 'ok');
      } else if (existing[0] && existing[0].is_active === false) {
        console.log(`🔧 Setze is_active=true für ${city.slug}`);
        await supabase
          .from('city_pages')
          .update({ is_active: true })
          .eq('slug', city.slug);
      }

      const { data, error } = await supabase
        .from('city_pages')
        .update({
          content_section_1_title: city.content_section_1_title,
          content_section_1_content: city.content_section_1_text,
          content_section_2_title: city.content_section_2_title,
          content_section_2_content: city.content_section_2_text,
          content_section_3_title: city.content_section_3_title,
          content_section_3_content: city.content_section_3_text,
          special_offers: city.special_offers,
          is_active: true
        })
        .eq('slug', city.slug)
        .select();

      if (error) {
        console.error(`❌ Fehler bei Update von ${city.slug}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ ${city.slug} aktualisiert`);
      } else {
        console.log(`⚠️ Kein Update für ${city.slug} durchgeführt`);
      }
    }

    console.log('\n🔎 Prüfe bestehende Städte außerhalb der JSON-Datei...');
    const jsonSlugs = new Set(cityData.map((c) => c.slug));
    const { data: allCities, error: listError } = await supabase
      .from('city_pages')
      .select('slug, city_name, is_active, hero_title, hero_subtitle, meta_title, meta_description, special_offers, local_faqs, content_section_1_title, content_section_1_content, content_section_2_title, content_section_2_content, content_section_3_title, content_section_3_content');

    if (listError) {
      console.error('❌ Fehler beim Laden bestehender Städte:', listError);
    } else if (allCities && allCities.length > 0) {
      const ensureFaqs = (cityName) => ([
        { question: `Wie schnell liefern Sie nach ${cityName}?`, answer: 'In der Regel innerhalb von 3–5 Werktagen; Express nach Absprache.' },
        { question: 'Welche Holzarten sind verfügbar?', answer: 'Buche (Premium), Eiche und gemischtes Hartholz – je nach Verfügbarkeit.' },
        { question: 'Wie trocken ist das Holz?', answer: 'Unter 20% Restfeuchte, ideal für Kamin- und Kachelöfen.' },
        { question: 'Welche Scheitgrößen bieten Sie an?', answer: 'Standard 25 cm und 33 cm; Sondergrößen auf Anfrage.' },
        { question: 'Gibt es einen Stapelservice?', answer: 'Ja, optional vor Ort – gegen geringe Pauschale.' }
      ]);

      const replaceCityPlaceholders = (text, cityName) => {
        if (!text) return text;
        return String(text).replaceAll('{city_name}', cityName);
      };

      for (const c of allCities) {
        if (!jsonSlugs.has(c.slug)) {
          const name = c.city_name || toTitleCase(c.slug);
          const updates = {};
          if (!c.content_section_1_title) updates.content_section_1_title = 'Lokale Expertise für {city_name}';
          if (!c.content_section_1_content) updates.content_section_1_content = `Wir liefern regionales Brennholz in {city_name} und Umgebung. Kurze Wege, faire Preise und nachhaltige Qualität.`;
          if (!c.content_section_2_title) updates.content_section_2_title = 'Regionale Qualität';
          if (!c.content_section_2_content) updates.content_section_2_content = `Hochwertiges Holz aus der Region, handverlesen und optimal getrocknet.`;
          if (!c.content_section_3_title) updates.content_section_3_title = 'Nachhaltigkeit & Umwelt';
          if (!c.content_section_3_content) updates.content_section_3_content = `Naturnahe Forstwirtschaft, Biodiversität und kurze Lieferwege für {city_name}.`;

          // Hero & Meta Defaults
          if (!c.hero_title) updates.hero_title = `Premium Brennholz Lieferung in ${name}`;
          if (!c.hero_subtitle) updates.hero_subtitle = `Regional, nachhaltig und zuverlässig – ${name} & Umgebung`;
          if (!c.meta_title) updates.meta_title = `${name}: Brennholz Lieferung vom Brennholz König`;
          if (!c.meta_description) updates.meta_description = `Premium Brennholz in ${name} – kurze Lieferwege, regionale Qualität und faire Preise. Jetzt bestellen!`;

          // Special Offers Default
          if (!c.special_offers) updates.special_offers = `<p><strong>🔥 ${name}-Spezial:</strong> 3+1 Aktion auf Premium-Buche, zuverlässige Lieferung im Stadtgebiet inkl. optionalem Stapelservice.</p>`;

          // FAQs Default (ensure at least 3)
          const faqs = Array.isArray(c.local_faqs) ? c.local_faqs : [];
          if (faqs.length < 3) updates.local_faqs = ensureFaqs(name);

          if (c.is_active === false) updates.is_active = true;

          // Replace placeholders
          ['content_section_1_title','content_section_1_content','content_section_2_title','content_section_2_content','content_section_3_title','content_section_3_content'].forEach(k => {
            if (updates[k]) updates[k] = replaceCityPlaceholders(updates[k], name);
          });

          if (Object.keys(updates).length > 0) {
            console.log(`🛠️ Ergänze Defaults für ${c.slug}`);
            const { error: updErr } = await supabase
              .from('city_pages')
              .update(updates)
              .eq('slug', c.slug);
            if (updErr) {
              console.error(`❌ Fehler beim Ergänzen für ${c.slug}:`, updErr);
            } else {
              console.log(`✅ Defaults ergänzt für ${c.slug}`);
            }
          }
        }
      }
    }
    
    console.log('\n🎉 Alle Stadtinhalte wurden aktualisiert!');
    
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Stadtinhalte:', error);
  }
}

updateCityContent();