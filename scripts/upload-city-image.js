const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Supabase-Umgebungsvariablen fehlen (URL/Service Key)');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getWikimediaImageUrl(query) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*`;
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Wikimedia API Fehler: ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages || {};
  const first = Object.values(pages)[0];
  const url = first?.imageinfo?.[0]?.url;
  if (!url) throw new Error('Kein Bild in Wikimedia-Ergebnis gefunden');
  return url;
}

async function uploadImage({ slug, section, imageUrl }) {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Bild-Download fehlgeschlagen (${section}): ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const fileName = `city-images/${slug}/${section}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from('media')
    .upload(fileName, buffer, { contentType, upsert: false, cacheControl: '3600' });
  if (uploadError) throw new Error(`Upload-Fehler (${section}): ${uploadError.message}`);
  const { data: urlData } = admin.storage.from('media').getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function updateCity(slug, updates) {
  const { error } = await admin
    .from('city_pages')
    .update(updates)
    .eq('slug', slug);
  if (error) throw error;
}

async function main() {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const heroIdx = args.indexOf('--hero');
  const cityIdx = args.indexOf('--city');
  const wikiIdx = args.indexOf('--wikimedia');
  const fixUnsplash = args.includes('--fix-unsplash');
  if (slugIdx === -1 && !fixUnsplash) {
    console.error('❌ Bitte --slug angeben');
    process.exit(1);
  }
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : null;
  const heroUrl = heroIdx !== -1 ? args[heroIdx + 1] : null;
  const cityUrl = cityIdx !== -1 ? args[cityIdx + 1] : null;
  const wikiQuery = wikiIdx !== -1 ? args[wikiIdx + 1] : null;

  try {
    if (fixUnsplash) {
      console.log('🔎 Suche Städte mit Unsplash-Bildern...');
      const { data: cities, error } = await admin
        .from('city_pages')
        .select('slug, city_name, hero_image_url, city_image_url');
      if (error) throw error;
      for (const c of cities) {
        const needsHero = c.hero_image_url && c.hero_image_url.includes('source.unsplash.com');
        const needsCity = c.city_image_url && c.city_image_url.includes('source.unsplash.com');
        if (!needsHero && !needsCity) continue;
        const qBase = c.city_name;
        const queries = [
          `${qBase} Hessen`,
          `${qBase} Stadt`,
          `${qBase} Skyline`,
          `${qBase} Rathaus`,
          `${qBase} Altstadt`,
        ];
        let foundUrl = null;
        for (const q of queries) {
          try {
            foundUrl = await getWikimediaImageUrl(q);
            if (foundUrl) break;
          } catch {}
        }
        if (!foundUrl) {
          console.warn(`⚠️ Kein Wikimedia-Bild gefunden für ${c.city_name}`);
          continue;
        }
        const updates = {};
        if (needsHero) {
          console.log(`⬆️ Ersetze Hero-Bild für ${c.slug}...`);
          updates.hero_image_url = await uploadImage({ slug: c.slug, section: 'hero', imageUrl: foundUrl });
        }
        if (needsCity) {
          console.log(`⬆️ Ersetze Stadtbild für ${c.slug}...`);
          updates.city_image_url = await uploadImage({ slug: c.slug, section: 'city', imageUrl: foundUrl });
        }
        if (Object.keys(updates).length) {
          await updateCity(c.slug, updates);
          console.log(`✅ Aktualisiert: ${c.city_name}`);
        }
      }
      console.log('🎉 Abschluss: Unsplash-Bilder ersetzt (soweit möglich).');
      return;
    }

    let updates = {};
    if (wikiQuery) {
      const wikiUrl = await getWikimediaImageUrl(wikiQuery);
      if (heroUrl === null && cityUrl === null) {
        console.log(`⬆️ Wikimedia-Bild für beide Sektionen verwenden: ${wikiQuery}`);
        const heroPublic = await uploadImage({ slug, section: 'hero', imageUrl: wikiUrl });
        const cityPublic = await uploadImage({ slug, section: 'city', imageUrl: wikiUrl });
        updates.hero_image_url = heroPublic;
        updates.city_image_url = cityPublic;
      } else {
        if (heroUrl === null) {
          const heroPublic = await uploadImage({ slug, section: 'hero', imageUrl: wikiUrl });
          updates.hero_image_url = heroPublic;
        }
        if (cityUrl === null) {
          const cityPublic = await uploadImage({ slug, section: 'city', imageUrl: wikiUrl });
          updates.city_image_url = cityPublic;
        }
      }
    }
    if (heroUrl) {
      console.log(`⬆️ Lade Hero-Bild für ${slug}...`);
      const heroPublic = await uploadImage({ slug, section: 'hero', imageUrl: heroUrl });
      console.log('✅ Hero public URL:', heroPublic);
      updates.hero_image_url = heroPublic;
    }
    if (cityUrl) {
      console.log(`⬆️ Lade Stadtbild für ${slug}...`);
      const cityPublic = await uploadImage({ slug, section: 'city', imageUrl: cityUrl });
      console.log('✅ City public URL:', cityPublic);
      updates.city_image_url = cityPublic;
    }
    if (Object.keys(updates).length > 0) {
      console.log(`🛠️ Aktualisiere Datensatz für ${slug || 'Batch'}...`);
      if (slug) {
        await updateCity(slug, updates);
      }
      console.log('🎉 Fertig.');
    } else {
      console.log('ℹ️ Keine Updates durchgeführt.');
    }
  } catch (err) {
    console.error('❌ Fehler:', err.message || err);
    process.exit(1);
  }
}

main();
