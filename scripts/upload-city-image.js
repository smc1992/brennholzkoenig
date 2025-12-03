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
  if (slugIdx === -1) {
    console.error('❌ Bitte --slug angeben');
    process.exit(1);
  }
  const slug = args[slugIdx + 1];
  const heroUrl = heroIdx !== -1 ? args[heroIdx + 1] : null;
  const cityUrl = cityIdx !== -1 ? args[cityIdx + 1] : null;

  try {
    let updates = {};
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
      console.log(`🛠️ Aktualisiere Datensatz für ${slug}...`);
      await updateCity(slug, updates);
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