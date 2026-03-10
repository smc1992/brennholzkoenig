import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Lade Umgebungsvariablen
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL oder Key fehlt in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Die aktualisierten Inhalte mit SEO-Links
const UPDATED_CONTENT = {
    'kaminfeuer-richtig-anzuenden-top-down-methode': `
      <h2>Warum die Top-Down-Methode der neue Standard ist</h2>
      <p>Vergessen Sie alles, was Sie bisher über das Anzünden eines Kaminfeuers wussten. Das klassische Aufschichten von Zeitungspapier, dünnem Holz unten und dicken Scheiten oben ist nicht nur veraltet, sondern auch extrem umweltschädlich und ineffizient.</p>
      
      <p>Die <strong>Top-Down-Methode</strong> (auch Anzündmodul genannt) funktioniert genau umgekehrt: Das Feuer brennt von oben nach unten ab, ähnlich wie bei einer Kerze. Das hat entscheidende Vorteile:</p>
      <ul>
        <li><strong>Bis zu 80% weniger Emissionen</strong> in der Startphase</li>
        <li><strong>Kein lästiger Qualm</strong> im Wohnzimmer beim Öffnen der Tür</li>
        <li><strong>Schnellere Erwärmung</strong> des Schornsteins (besserer Zug)</li>
        <li>Holzscheite brennen gleichmäßiger und kontrollierter ab</li>
      </ul>

      <h2>Schritt-für-Schritt Anleitung: So bauen Sie das perfekte Anzündmodul</h2>
      
      <h3>Schritt 1: Die Basis legen</h3>
      <p>Legen Sie zunächst 2 bis 3 große, gleich dicke Holzscheite (am besten unser <a href="/shop/brennholz-buche">kammergetrocknetes Premium-Buchenholz</a>) quer in den Brennraum. Lassen Sie dazwischen etwa 1-2 cm Abstand für die Luftzirkulation.</p>

      <h3>Schritt 2: Die mittlere Schicht</h3>
      <p>Legen Sie nun 2 kleinere Holzscheite quer über die unterste Schicht. So entsteht ein stabiles Gitter.</p>

      <h3>Schritt 3: Das eigentliche Anzündmodul</h3>
      <p>Ganz nach oben kommt jetzt das sogenannte Anzündmodul. Nehmen Sie 4-6 dünne Anzündhölzer (Tannen- oder Fichtenholz eignet sich perfekt) und legen Sie diese als kleines Gitterkreuz oben auf. Legen Sie mittig zwischen diese Hölzer einen handelsüblichen, wachsgetränkten Holzwolle-Anzünder.</p>

      <h3>Schritt 4: Feuer frei!</h3>
      <p>Öffnen Sie alle Luftregler Ihres Kaminofens vollständig. Zünden Sie den Holzwolle-Anzünder an und schließen Sie die Tür. Das Feuer wird sich nun langsam von oben nach unten durcharbeiten.</p>

      <h2>Die wichtigste Zutat: Trockenes Holz</h2>
      <p>Selbst die beste Methode scheitert an feuchtem Holz. Bei Brennholz König garantieren wir eine <strong>Restfeuchte von 6-8%</strong> durch unsere Kammertrocknung. Das bedeutet: Das Feuer entfacht sofort, schwelgt nicht und Sie haben vom ersten Moment an eine schöne, leuchtend helle Flamme. Schauen Sie sich dazu am besten unsere hochwertigen Produkte im <a href="/shop">Online-Shop</a> an.</p>
  `,
    'brennholz-richtig-lagern-fatale-fehler': `
      <h2>Die Holzlagerung entscheidet über den Heizwert</h2>
      <p>Sie haben viel Geld für hochwertiges Brennholz ausgegeben. Wenn Sie es jetzt falsch lagern, zerstören Sie nicht nur den Heizwert, sondern riskieren auch Schimmelbildung und Schädlingsbefall. Ein Fehler bei der Lagerung führt zu feuchtem Holz im Ofen, starker Rauchentwicklung und massivem Rußansatz im Schornstein.</p>

      <h2>Fehler 1: Das Holz liegt direkt auf dem nassen Erdboden</h2>
      <p>Holz wirkt wie ein Schwamm. Liegen die untersten Scheite direkt auf Gras, Erde oder Beton, ziehen sie unweigerlich die Feuchtigkeit aus dem Boden. <strong>Die Lösung:</strong> Bauen Sie ein Podest! Verwenden Sie Einwegpaletten, Kanthölzer oder spezielle Brennholzregale, um mindestens 10-15 cm Abstand zum Boden zu gewährleisten. Die Luft muss unter dem Holzstapel zirkulieren können.</p>

      <h2>Fehler 2: Die Plane wird komplett über den Stapel gezogen</h2>
      <p>Ein absoluter Klassiker: Aus Angst vor Regen wird das Holz komplett in eine Plastikplane eingepackt. Das Resultat ist ein Treibhauseffekt. Die Restfeuchtigkeit aus dem Holz kondensiert an der Innenseite der Plane, es entsteht Staunässe und das Holz fängt an zu faulen. <strong>Die Lösung:</strong> Decken Sie nur die Oberseite des Stapels ab (z.B. mit Blechtafeln oder einer straff gespannten Plane). Die Seiten müssen zwingend offen bleiben, damit der Wind das Holz trocknen kann.</p>

      <h2>Fehler 3: Das Holz ist an der Hauswand "festgemauert"</h2>
      <p>Wer sein Holz direkt an die Hauswand stapelt, riskiert nicht nur eine feuchte Fassade. Auch hier fehlt die Hinterlüftung. Lassen Sie immer mindestens 5-10 cm Abstand (eine Handbreit) zwischen Holzstapel und Hauswand.</p>

      <h2>Fehler 4: Die falsche Himmelsrichtung</h2>
      <p>Die Nordseite Ihres Hauses ist der schlechteste Ort für die Holzlagerung. Hier scheint nie die Sonne und die Feuchtigkeit hält sich am längsten. <strong>Der ideale Platz:</strong> Die Süd- oder Westseite. Hier sorgt die Kombination aus Sonne und (bei uns häufigem) Westwind für eine optimale natürliche Trocknung.</p>

      <h2>Fehler 5: Frisches Holz im geschlossenen Keller lagern</h2>
      <p>Wer frisch geschlagenes Holz in Heizungskellern oder geschlossenen Garagen lagert, züchtet Schimmel. Holz braucht Wind zum Trocknen. Lagern Sie Holz nur dann im Haus, wenn es bereits komplett durchgetrocknet ist – wie unser auf 6-8% kammergetrocknetes <a href="/shop/brennholz-buche">Premiumholz vom Brennholz König</a>, das Sie bedenkenlos sofort im Wohnzimmer neben dem Kamin stapeln können. Keine Lust auf langes Lagern? Bestellen Sie einfach trockenes Holz, das Sie direkt verwenden können – <a href="/kontakt">wir beraten Sie gerne</a>.</p>
  `,
    'heizen-mit-holz-geld-sparen-effizienz': `
      <h2>Warum der billigste Raummeter am Ende der teuerste ist</h2>
      <p>Angebot im Internet: "Regionaler Mix, waldfrisch, nur 80 Euro der Schüttraummeter". Klingt verlockend, oder? Die bittere Wahrheit zeigt sich jedoch erst im Winter: Das Holz brennt schlecht, Sie verbrauchen die doppelte Menge, die Scheibe verrußt und im schlimmsten Fall droht Glanzruß im Schornstein.</p>

      <p>Wer beim Heizen mit Holz wirklich Geld sparen will, muss auf <strong>Effizienz</strong> setzen. Hier erfahren Sie, an welchen Stellschrauben Sie drehen müssen.</p>

      <h2>Die goldene Regel: Qualität über Quantität</h2>
      <p>Der Heizwert von Holz ist extrem abhängig von seiner Restfeuchte. Ein Beispiel: Waldfrisches Holz hat eine Feuchtigkeit von ca. 50% und einen Heizwert von nur 2,2 kWh/kg. Unser kammergetrocknetes <a href="/shop/brennholz-buche">Premium-Buchenholz</a> mit nur 6-8% Restfeuchte erreicht hingegen über <strong>4,2 kWh/kg</strong>!</p>
      
      <p>Das bedeutet: Sie brauchen fast nur noch <strong>halb so viel Holz</strong>, um die gleiche Wärmeleistung zu erzielen. Wenn Sie diesen Effizienzgewinn gegenrechnen, ist unser Premiumholz auf den Winter gerechnet signifikant günstiger (und vor allem komfortabler) als nasses "Billigholz".</p>

      <h2>Der richtige Zeitpunkt zum Nachlegen</h2>
      <p>Viele Kaminbesitzer machen den Fehler und legen zu früh nach, solange noch gelbe Flammen züngeln. <strong>Das Geheimnis effizienten Heizens liegt im perfekten Timing.</strong></p>
      <p>Legen Sie neues Holz erst dann nach, wenn die sichtbaren Flammen erloschen sind und sich ein leuchtendes, heißes Glutbett gebildet hat. Schieben Sie die Glut leicht zusammen und legen Sie 2-3 neue Scheite auf. Durch die enorme Hitze der Glut entflammt das neue Holz meist innerhalb weniger Sekunden von ganz allein – komplett ohne neue Anzünder.</p>

      <h2>Die Luftzufuhr meistern</h2>
      <p>Wer seinen Kaminofen ständig drosselt, um "Holz zu sparen", bewirkt genau das Gegenteil. Wenn ein Feuer zu wenig Sauerstoff bekommt:</p>
      <ul>
        <li>Sinkt die Brennraumtemperatur dramatisch ab</li>
        <li>Verbrennen die Holzgase nicht vollständig (die kostbare Energie geht durch den Schornstein verloren)</li>
        <li>Entstehen große Mengen an Feinstaub und Ruß</li>
      </ul>
      <p>Die Faustregel: Ein helles, lebhaftes Flammenbild ohne schwarze Rauchschwaden ist ein Zeichen für gute, effiziente Verbrennung. Drosseln Sie die Luft erst dann minimal, wenn der Ofen auf Betriebstemperatur ist, aber sorgen Sie immer für ausreichend Sauerstoffzufuhr.</p>

      <h2>Das Fazit</h2>
      <p>Investieren Sie einmal im Jahr in hochwertiges, kammergetrocknetes Holz mit maximalem Brennwert. Unser gesamtes Sortiment finden Sie im <a href="/shop">Brennholz König Onlineshop</a>. Wenn Sie dann noch unsere Tipps zum Top-Down-Anzünden und zur richtigen Luftregulierung beherzigen, heizen Sie nicht nur extrem klimaschonend, sondern entlasten auch spürbar Ihren Geldbeutel.</p>
  `
};

async function updateLinks() {
    console.log('🚀 Starte SEO-Link Update...');

    for (const [slug, content] of Object.entries(UPDATED_CONTENT)) {
        const { error } = await supabase
            .from('page_contents')
            .update({ content_value: content, updated_at: new Date().toISOString() })
            .eq('content_type', 'blog_post')
            .eq('slug', slug);

        if (error) {
            console.error(`❌ Fehler beim Update von ${slug}:`, error.message);
        } else {
            console.log(`✅ Artikel aktualisiert: ${slug}`);
        }
    }

    console.log('\n🎉 Alle SEO-Links wurden erfolgreich eingefügt!');
}

updateLinks();
