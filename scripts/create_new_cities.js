/**
 * Create 15 new city pages for Brennholz König
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const newCities = [
  {
    city_name: 'Eschwege',
    slug: 'eschwege',
    region: 'Werra-Meißner-Kreis',
    landscape: 'Werratal',
    postal_codes: ['37269'],
    service_areas: ['Eschwege', 'Wanfried', 'Reichensachsen', 'Niederhone', 'Oberhone'],
    lat: 51.186, lng: 10.053,
    desc_s1: '<p>Eschwege, die malerische Fachwerkstadt im Werratal, ist bekannt für ihre historische Altstadt und den markanten Landgrafenschloss-Turm. Das Tor zum Geo-Naturpark Frau-Holle-Land bietet eine einzigartige Kulturlandschaft.</p><p>Aus den Wäldern des Werra-Meißner-Kreises liefern wir Premium-Brennholz direkt nach Eschwege – kammergetrocknet auf 6–8% Restfeuchte, ofenfertig gespalten und auf Wunsch bis vor die Haustür.</p><p>Regionale Qualität für gemütliche Abende am Kamin in der historischen Fachwerkstadt.</p>',
    desc_s2: '<p>Das Werratal und der Hohe Meißner bieten ideale Bedingungen für erstklassige Buchenbestände. Unser Premium-Brennholz wächst in diesen naturnahen Wäldern und wird nachhaltig geerntet.</p><p>Besonders dichtes Hartholz mit hohem Heizwert – perfekt für die langen Winter im Werra-Meißner-Kreis.</p>',
    desc_s3: '<p>Als regionaler Anbieter setzen wir auf kurze Transportwege und nachhaltige Forstwirtschaft. Unser Holz stammt aus zertifizierten Beständen der Region.</p>',
  },
  {
    city_name: 'Spangenberg',
    slug: 'spangenberg',
    region: 'Schwalm-Eder-Kreis',
    landscape: 'Nordhessen',
    postal_codes: ['34286'],
    service_areas: ['Spangenberg', 'Morschen', 'Melsungen', 'Altmorschen'],
    lat: 51.117, lng: 9.663,
    desc_s1: '<p>Spangenberg, die historische Liebenbachstadt mit ihrer imposanten Burg hoch über der Stadt, liegt eingebettet in die waldreiche Landschaft Nordhessens. Die charmante Fachwerkaltstadt zieht naturverbundene Besucher an.</p><p>Wir liefern hochwertiges Brennholz aus den umliegenden Wäldern direkt nach Spangenberg und alle Ortsteile – trocken, ofenfertig und zu fairen Preisen.</p>',
    desc_s2: '<p>Die waldreichen Höhenzüge rund um Spangenberg liefern erstklassiges Buchen- und Eichenholz. Kammergetrocknet und sorgfältig gespalten für optimale Verbrennung.</p>',
    desc_s3: '<p>Nachhaltige Forstwirtschaft in der Region Schwalm-Eder sichert den Bestand der heimischen Wälder für kommende Generationen.</p>',
  },
  {
    city_name: 'Eisenach',
    slug: 'eisenach',
    region: 'Thüringen',
    landscape: 'Thüringer Wald',
    postal_codes: ['99817'],
    service_areas: ['Eisenach', 'Wutha-Farnroda', 'Krauthausen', 'Mihla'],
    lat: 50.975, lng: 10.320,
    desc_s1: '<p>Eisenach, die Wartburgstadt am Rande des Thüringer Waldes, ist weltbekannt als Wirkungsstätte Martin Luthers und Johann Sebastian Bachs. Die UNESCO-Welterbe Wartburg thront majestätisch über der Stadt.</p><p>Auch über die hessische Landesgrenze hinaus liefern wir Premium-Brennholz nach Eisenach – kammergetrocknet, ofenfertig und aus nachhaltiger Forstwirtschaft der Region.</p>',
    desc_s2: '<p>Die Wälder am Rande des Thüringer Waldes und der Rhön liefern ausgezeichnetes Hartholz. Buche und Eiche aus der Region garantieren höchste Brennqualität.</p>',
    desc_s3: '<p>Kurze Transportwege aus dem hessisch-thüringischen Grenzgebiet – regional, nachhaltig und umweltschonend.</p>',
  },
  {
    city_name: 'Heringen',
    slug: 'heringen',
    region: 'Hersfeld-Rotenburg',
    landscape: 'Werratal',
    postal_codes: ['36266'],
    service_areas: ['Heringen (Werra)', 'Philippsthal', 'Friedewald', 'Schenklengsfeld'],
    lat: 50.878, lng: 9.967,
    desc_s1: '<p>Heringen an der Werra, bekannt als „Stadt des weißen Goldes" durch den Kalibergbau, liegt im östlichen Hersfeld-Rotenburg. Die Kleinstadt verbindet Industriegeschichte mit der naturnahen Lage im Werratal.</p><p>Wir liefern Premium-Brennholz direkt nach Heringen und alle umliegenden Ortschaften – ofenfertig, kammergetrocknet und aus regionaler Herkunft.</p>',
    desc_s2: '<p>Aus den Wäldern des Werratals und der angrenzenden Rhön beziehen wir hochwertiges Buchen- und Eichenholz mit besonders hohem Heizwert.</p>',
    desc_s3: '<p>Nachhaltiges Brennholz aus der Region – kurze Wege, faire Preise und verantwortungsvolle Forstwirtschaft.</p>',
  },
  {
    city_name: 'Kirchheim',
    slug: 'kirchheim',
    region: 'Hersfeld-Rotenburg',
    landscape: 'Nordhessen',
    postal_codes: ['36275'],
    service_areas: ['Kirchheim', 'Niederaula', 'Breitenbach am Herzberg', 'Ottrau'],
    lat: 50.830, lng: 9.563,
    desc_s1: '<p>Kirchheim in Nordhessen liegt zentral im Landkreis Hersfeld-Rotenburg, umgeben von waldreichen Höhenzügen und grünen Tälern. Die Gemeinde ist ein idealer Ausgangspunkt für Naturerlebnisse in der Region.</p><p>Aus den umliegenden Wäldern liefern wir Ihnen hochwertiges, kammergetrocknetes Brennholz direkt nach Kirchheim – ofenfertig und zu fairen Preisen.</p>',
    desc_s2: '<p>Die Mischwälder rund um Kirchheim bieten ideale Bedingungen für hochwertiges Hartholz. Sorgfältig getrocknet für optimale Heizleistung.</p>',
    desc_s3: '<p>Regionale Wertschöpfung und nachhaltige Waldwirtschaft – dafür stehen wir mit unserem Brennholz aus der Region.</p>',
  },
  {
    city_name: 'Mücke',
    slug: 'muecke',
    region: 'Vogelsbergkreis',
    landscape: 'Vogelsberg',
    postal_codes: ['35325'],
    service_areas: ['Mücke', 'Nieder-Ohmen', 'Ober-Ohmen', 'Flensungen', 'Merlau'],
    lat: 50.608, lng: 9.026,
    desc_s1: '<p>Mücke im Vogelsbergkreis liegt eingebettet in die sanfte Hügellandschaft des Vogelsbergs – Europas größtem zusammenhängenden Vulkangebiet. Die Gemeinde besticht durch ihre ländliche Idylle und die Nähe zur Natur.</p><p>Wir liefern kammergetrocknetes Premium-Brennholz aus den Vogelsberger Wäldern direkt nach Mücke und alle Ortsteile.</p>',
    desc_s2: '<p>Der Vogelsberg mit seinen ausgedehnten Buchenwäldern liefert erstklassiges Hartholz. Vulkanische Böden sorgen für besonders dichte und energiereiche Holzfasern.</p>',
    desc_s3: '<p>Nachhaltige Forstwirtschaft im Naturpark Hoher Vogelsberg – wir schützen, was uns das beste Brennholz liefert.</p>',
  },
  {
    city_name: 'Herbstein',
    slug: 'herbstein',
    region: 'Vogelsbergkreis',
    landscape: 'Vogelsberg',
    postal_codes: ['36358'],
    service_areas: ['Herbstein', 'Lanzenhain', 'Stockhausen', 'Altenschlirf'],
    lat: 50.568, lng: 9.348,
    desc_s1: '<p>Herbstein, das staatlich anerkannte Heilbad im Herzen des Vogelsbergs, verbindet Kur- und Erholungskultur mit der natürlichen Schönheit der Vulkanlandschaft. Die historische Altstadt mit ihren Fachwerkhäusern lädt zum Verweilen ein.</p><p>Aus den umliegenden Vogelsberger Wäldern liefern wir Ihnen hochwertiges Brennholz – kammergetrocknet und ofenfertig.</p>',
    desc_s2: '<p>Die Höhenlagen des Vogelsbergs bieten optimale Wachstumsbedingungen für dichte Buchenwälder. Unser Holz brennt langsam und gleichmäßig.</p>',
    desc_s3: '<p>Im Naturpark Hoher Vogelsberg setzen wir auf schonende Holzernte und nachhaltige Bewirtschaftung.</p>',
  },
  {
    city_name: 'Hosenfeld',
    slug: 'hosenfeld',
    region: 'Landkreis Fulda',
    landscape: 'Rhön-Vorland',
    postal_codes: ['36154'],
    service_areas: ['Hosenfeld', 'Blankenau', 'Hainzell', 'Jossa', 'Pfaffenrod'],
    lat: 50.553, lng: 9.509,
    desc_s1: '<p>Hosenfeld liegt im Landkreis Fulda, eingebettet zwischen Rhön und Vogelsberg. Die ländliche Gemeinde mit ihren zahlreichen Ortsteilen bietet eine hohe Lebensqualität in naturnaher Umgebung.</p><p>Als Ihr Brennholz-Lieferant sind wir in Hosenfeld quasi um die Ecke – kurze Wege, schnelle Lieferung und erstklassiges Kaminholz aus der Region.</p>',
    desc_s2: '<p>Direkt vor unserer Haustür wachsen die Wälder, aus denen wir unser Premium-Brennholz gewinnen. Kürzer geht es kaum – frischer geht es nicht.</p>',
    desc_s3: '<p>Als regionaler Betrieb kennen wir jeden Waldweg und arbeiten eng mit lokalen Forstbetrieben zusammen.</p>',
  },
  {
    city_name: 'Bad Neustadt an der Saale',
    slug: 'bad-neustadt',
    region: 'Rhön-Grabfeld',
    landscape: 'Bayerische Rhön',
    postal_codes: ['97616'],
    service_areas: ['Bad Neustadt', 'Salz', 'Hohenroth', 'Hollstadt', 'Rödelmaier'],
    lat: 50.323, lng: 10.215,
    desc_s1: '<p>Bad Neustadt an der Saale, die Kreisstadt im unterfränkischen Rhön-Grabfeld, ist das wirtschaftliche Zentrum der bayerischen Rhön. Die historische Altstadt mit dem Marktplatz und der Karmeliterkirche prägt das Stadtbild.</p><p>Auch ins benachbarte Bayern liefern wir unser Premium-Brennholz – kammergetrocknet aus den Rhöner Wäldern, ofenfertig und zu fairen Preisen.</p>',
    desc_s2: '<p>Die Rhön liefert erstklassiges Buchenholz mit besonders hohem Heizwert. Ideal für die kalten Winter in der fränkischen Rhön.</p>',
    desc_s3: '<p>Aus dem UNESCO-Biosphärenreservat Rhön – nachhaltig gewonnen und kurze Wege über die Landesgrenze.</p>',
  },
  {
    city_name: 'Bad Kissingen',
    slug: 'bad-kissingen',
    region: 'Unterfranken',
    landscape: 'Fränkische Saale',
    postal_codes: ['97688'],
    service_areas: ['Bad Kissingen', 'Münnerstadt', 'Oberthulba', 'Nüdlingen', 'Rannungen'],
    lat: 50.200, lng: 10.077,
    desc_s1: '<p>Bad Kissingen, das weltbekannte Staatsbad an der Fränkischen Saale, verbindet Kurkultur mit bayerischer Lebensart. Die prachtvolle Kurarchitektur und die historischen Parkanlagen machen die Stadt zu einem Juwel Unterfrankens.</p><p>Wir liefern hochwertiges Brennholz nach Bad Kissingen – kammergetrocknetes Hartholz für wohlige Wärme in der kalten Jahreszeit.</p>',
    desc_s2: '<p>Unsere Buchen- und Eichenwälder in der Rhön und am Rand der Fränkischen Saale liefern Brennholz höchster Qualität.</p>',
    desc_s3: '<p>Nachhaltige Forstwirtschaft und kurze Lieferwege – gut für die Umwelt und Ihren Geldbeutel.</p>',
  },
  {
    city_name: 'Steinau an der Straße',
    slug: 'steinau-an-der-strasse',
    region: 'Main-Kinzig-Kreis',
    landscape: 'Kinzigtal',
    postal_codes: ['36396'],
    service_areas: ['Steinau', 'Schlüchtern', 'Salmünster', 'Sinntal'],
    lat: 50.313, lng: 9.465,
    desc_s1: '<p>Steinau an der Straße, die Brüder-Grimm-Stadt im Main-Kinzig-Kreis, liegt am Übergang von Vogelsberg zu Spessart. Das imposante Renaissanceschloss und die liebevoll restaurierte Altstadt erzählen von einer reichen Geschichte.</p><p>Wir liefern Premium-Brennholz aus regionalen Wäldern nach Steinau und das gesamte Kinzigtal – ofenfertig und kammergetrocknet.</p>',
    desc_s2: '<p>Die Wälder zwischen Vogelsberg und Spessart liefern ausgezeichnetes Hartholz. Buche und Eiche für optimale Heizleistung.</p>',
    desc_s3: '<p>Regional verwurzelt, nachhaltig gewonnen – unser Brennholz kommt aus Ihrer direkten Umgebung.</p>',
  },
  {
    city_name: 'Büdingen',
    slug: 'buedingen',
    region: 'Wetteraukreis',
    landscape: 'Wetterau',
    postal_codes: ['63654'],
    service_areas: ['Büdingen', 'Düdelsheim', 'Aulendiebach', 'Calbach', 'Orleshausen'],
    lat: 50.289, lng: 9.114,
    desc_s1: '<p>Büdingen, die mittelalterliche Perle der Wetterau, beeindruckt mit einer der besterhaltenen Stadtbefestigungen Europas. Die malerische Altstadt mit Schloss und Fachwerkhäusern zieht Besucher aus aller Welt an.</p><p>Auch in die Wetterau liefern wir unser Premium-Brennholz – kammergetrocknet, ofenfertig und aus nachhaltiger regionaler Forstwirtschaft.</p>',
    desc_s2: '<p>Aus den Wäldern der östlichen Wetterau und des Vorderen Vogelsbergs beziehen wir hochwertiges Hartholz mit hervorragendem Heizwert.</p>',
    desc_s3: '<p>Nachhaltige Forstwirtschaft und regionale Lieferketten – für Wärme mit gutem Gewissen.</p>',
  },
  {
    city_name: 'Bad Homburg',
    slug: 'bad-homburg',
    region: 'Hochtaunuskreis',
    landscape: 'Taunus',
    postal_codes: ['61348', '61350', '61352'],
    service_areas: ['Bad Homburg', 'Oberursel', 'Friedrichsdorf', 'Usingen'],
    lat: 50.228, lng: 8.618,
    desc_s1: '<p>Bad Homburg vor der Höhe, die elegante Kurstadt am Taunus, verbindet mondäne Kurkultur mit der Nähe zur Metropole Frankfurt. Der historische Kurpark, das Schloss und die berühmte Spielbank prägen das exklusive Stadtbild.</p><p>Wir liefern Premium-Brennholz nach Bad Homburg – kammergetrocknetes Hartholz für anspruchsvolle Kaminabende in der Kurstadt.</p>',
    desc_s2: '<p>Erstklassiges Buchen- und Eichenholz aus nachhaltiger Forstwirtschaft – hoher Heizwert für gehobene Ansprüche.</p>',
    desc_s3: '<p>Nachhaltigkeit und Premium-Qualität schließen sich nicht aus – bei uns bekommen Sie beides.</p>',
  },
  {
    city_name: 'Freigericht',
    slug: 'freigericht',
    region: 'Main-Kinzig-Kreis',
    landscape: 'Vorspessart',
    postal_codes: ['63579'],
    service_areas: ['Freigericht', 'Somborn', 'Altenmittlau', 'Neuses', 'Bernbach'],
    lat: 50.140, lng: 9.132,
    desc_s1: '<p>Freigericht im Main-Kinzig-Kreis liegt am Übergang vom Rhein-Main-Gebiet zum Spessart. Die lebendige Gemeinde mit ihren fünf Ortsteilen verbindet ländliches Flair mit guter Anbindung an die Rhein-Main-Region.</p><p>Wir liefern kammergetrocknetes Brennholz nach Freigericht und Umgebung – Premium-Qualität aus regionaler Forstwirtschaft, ofenfertig gespalten.</p>',
    desc_s2: '<p>Die Wälder des Vorspessart und des Büdinger Waldes liefern ausgezeichnetes Buchen- und Eichenholz mit konstantem Heizwert.</p>',
    desc_s3: '<p>Regionale Herkunft, nachhaltige Ernte – für wohlige Wärme mit gutem Gewissen im Rhein-Main-Gebiet.</p>',
  },
  {
    city_name: 'Schweinfurt',
    slug: 'schweinfurt',
    region: 'Unterfranken',
    landscape: 'Maintal',
    postal_codes: ['97421', '97422', '97424'],
    service_areas: ['Schweinfurt', 'Sennfeld', 'Grafenrheinfeld', 'Schonungen', 'Gochsheim'],
    lat: 50.049, lng: 10.229,
    desc_s1: '<p>Schweinfurt, die Industriestadt am Main in Unterfranken, verbindet eine lebendige Wirtschaftskultur mit überraschend viel Grün. Die Museumslandschaft und die Mainpromenade machen die Stadt zu einem attraktiven Lebensort.</p><p>Auch nach Schweinfurt liefern wir unser Premium-Brennholz – kammergetrocknet aus den Wäldern der Rhön und des Steigerwaldes.</p>',
    desc_s2: '<p>Erstklassiges Hartholz aus den fränkischen Mittelgebirgen – Buche und Eiche mit besonders hohem Heizwert für die kalten Maintaler Winter.</p>',
    desc_s3: '<p>Nachhaltige Forstwirtschaft aus der Rhön bis in die Mainregion – regional und umweltbewusst.</p>',
  },
];

async function main() {
  console.log(`Creating ${newCities.length} new city pages...\n`);

  let created = 0;
  let skipped = 0;

  for (const city of newCities) {
    // Check if city already exists
    const { data: existing } = await supabase
      .from('city_pages')
      .select('id')
      .eq('slug', city.slug)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️ ${city.city_name}: already exists, skipping`);
      skipped++;
      continue;
    }

    const pageData = {
      city_name: city.city_name,
      slug: city.slug,
      is_active: true,
      meta_title: `Brennholz ${city.city_name} | Premium Kaminholz liefern lassen`,
      meta_description: `Premium-Brennholz in ${city.city_name} (${city.region}) bestellen ✓ Kammergetrocknet ✓ 6-8% Restfeuchte ✓ Ofenfertig ✓ Lieferung frei Haus. Jetzt bestellen!`,
      hero_title: `Premium Brennholz in ${city.city_name}`,
      hero_subtitle: `Kammergetrocknetes Kaminholz für ${city.city_name} und ${city.region} – ofenfertig geliefert`,
      local_keywords: [
        `Brennholz ${city.city_name}`,
        `Kaminholz ${city.city_name}`,
        `Feuerholz ${city.city_name}`,
        `Brennholz liefern ${city.city_name}`,
        `Holz kaufen ${city.city_name}`,
        `Kaminholz ${city.region}`,
      ],
      postal_codes: city.postal_codes,
      service_areas: city.service_areas,
      content_section_1_main_title: `Ihr Brennholz-Partner in ${city.city_name}`,
      content_section_1_subtitle: `Regional, nachhaltig und ofenfertig – Premium-Brennholz für ${city.city_name} und ${city.region}`,
      content_section_1_title: `Brennholz-Service für ${city.city_name}`,
      content_section_1_content: city.desc_s1,
      content_section_2_title: `${city.landscape}er Holz für Ihren Kamin`,
      content_section_2_content: city.desc_s2,
      content_section_3_title: `Nachhaltigkeit aus der Region ${city.region}`,
      content_section_3_content: city.desc_s3,
      contact_phone: '+49 176 71085234',
      contact_email: 'info@brennholz-koenig.de',
      phone_display: '+49 176 71085234',
      whatsapp_url: 'https://wa.me/+4917671085234',
      google_maps_center_lat: city.lat,
      google_maps_center_lng: city.lng,
      google_maps_zoom: 12,
    };

    const { data, error } = await supabase
      .from('city_pages')
      .insert(pageData)
      .select('id, city_name, slug')
      .single();

    if (error) {
      console.error(`❌ ${city.city_name}: ${error.message}`);
    } else {
      console.log(`✅ ${city.city_name} (${city.slug}) created`);
      created++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`\nTotal active cities now:`);
  
  const { count } = await supabase
    .from('city_pages')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  console.log(`  ${count} active city pages`);
}

main().catch(console.error);
