/**
 * Upload images for the 15 newly created cities
 * Uses existing hero/city variant images + section2/section3 themed images
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BRAIN_DIR = '/Users/smc/.gemini/antigravity/brain/72c7b289-03dc-459c-9092-498f2def8633';

// Existing hero landscape images (generated for batch cities earlier)
// We'll reuse the originals from existing cities by downloading and re-uploading
// For now, use the city variant images as hero + rotate
const heroImages = [
  path.join(BRAIN_DIR, 'section3_sustain_a_1773152484969.png'),  // aerial forest
  path.join(BRAIN_DIR, 'section3_sustain_b_1773152502256.png'),  // village valley
  path.join(BRAIN_DIR, 'city_variant_c_1773152758515.png'),       // castle town
  path.join(BRAIN_DIR, 'city_variant_e_1773152795883.png'),       // river valley
  path.join(BRAIN_DIR, 'section3_sustain_c_1773152520803.png'),  // forest regeneration
];

const cityImages = [
  path.join(BRAIN_DIR, 'city_variant_a_1773152725483.png'),  // Fachwerkstadt
  path.join(BRAIN_DIR, 'city_variant_b_1773152740905.png'),  // residential
  path.join(BRAIN_DIR, 'city_variant_c_1773152758515.png'),  // castle town
  path.join(BRAIN_DIR, 'city_variant_d_1773152778078.png'),  // marketplace
  path.join(BRAIN_DIR, 'city_variant_e_1773152795883.png'),  // river valley
];

const section2Images = [
  path.join(BRAIN_DIR, 'section2_quality_a_1773152425346.png'),
  path.join(BRAIN_DIR, 'section2_quality_b_1773152452054.png'),
  path.join(BRAIN_DIR, 'section2_quality_c_1773152466942.png'),
];

const section3Images = [
  path.join(BRAIN_DIR, 'section3_sustain_a_1773152484969.png'),
  path.join(BRAIN_DIR, 'section3_sustain_b_1773152502256.png'),
  path.join(BRAIN_DIR, 'section3_sustain_c_1773152520803.png'),
];

const newSlugs = [
  'eschwege', 'spangenberg', 'eisenach', 'heringen', 'kirchheim',
  'muecke', 'herbstein', 'hosenfeld', 'bad-neustadt', 'bad-kissingen',
  'steinau-an-der-strasse', 'buedingen', 'bad-homburg', 'freigericht', 'schweinfurt'
];

async function uploadImage(storagePath, filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const contentType = ext === 'webp' ? 'image/webp' : (ext === 'jpg' ? 'image/jpeg' : 'image/png');
  
  const { error } = await supabase.storage
    .from('city-images')
    .upload(storagePath, buffer, { contentType, upsert: true });
  
  if (error) throw error;
  
  const { data } = supabase.storage.from('city-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  console.log(`Uploading images for ${newSlugs.length} new cities...\n`);

  for (let i = 0; i < newSlugs.length; i++) {
    const slug = newSlugs[i];
    
    // Get city ID
    const { data: city } = await supabase
      .from('city_pages')
      .select('id, city_name')
      .eq('slug', slug)
      .single();
    
    if (!city) {
      console.error(`❌ ${slug}: not found`);
      continue;
    }

    try {
      // Offset the rotation so hero and city are DIFFERENT images
      const heroUrl = await uploadImage(
        `city-images/${slug}-hero.png`,
        heroImages[i % heroImages.length]
      );
      
      const cityUrl = await uploadImage(
        `city-images/${slug}-city.png`,
        cityImages[(i + 2) % cityImages.length]  // offset by 2 so it's different from hero
      );
      
      const s2Url = await uploadImage(
        `city-images/${slug}-section2.png`,
        section2Images[i % section2Images.length]
      );
      
      const s3Url = await uploadImage(
        `city-images/${slug}-section3.png`,
        section3Images[(i + 1) % section3Images.length]  // offset by 1
      );

      // Update DB
      const { error: updateError } = await supabase
        .from('city_pages')
        .update({
          hero_image_url: heroUrl,
          city_image_url: cityUrl,
          content_section_2_image_url: s2Url,
          content_section_3_image_url: s3Url,
        })
        .eq('id', city.id);

      if (updateError) throw updateError;
      
      console.log(`✅ ${city.city_name}: 4 images uploaded`);
    } catch (e) {
      console.error(`❌ ${city.city_name}: ${e.message}`);
    }
  }

  console.log('\n=== DONE ===');
  
  // Final status check
  const { data: allCities } = await supabase
    .from('city_pages')
    .select('city_name, hero_image_url, city_image_url, content_section_2_image_url, content_section_3_image_url')
    .eq('is_active', true);
  
  const missing = allCities.filter(c => !c.hero_image_url || !c.city_image_url || !c.content_section_2_image_url || !c.content_section_3_image_url);
  console.log(`\nCities with missing images: ${missing.length}`);
  if (missing.length > 0) {
    missing.forEach(c => console.log(`  - ${c.city_name}`));
  }
}

main().catch(console.error);
