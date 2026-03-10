/**
 * Replace duplicate city images (where hero_image_url = city_image_url by content)
 * with unique city images rotated from 5 variants
 */
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BRAIN_DIR = '/Users/smc/.gemini/antigravity/brain/72c7b289-03dc-459c-9092-498f2def8633';

const cityVariants = [
  path.join(BRAIN_DIR, 'city_variant_a_1773152725483.png'),
  path.join(BRAIN_DIR, 'city_variant_b_1773152740905.png'),
  path.join(BRAIN_DIR, 'city_variant_c_1773152758515.png'),
  path.join(BRAIN_DIR, 'city_variant_d_1773152778078.png'),
  path.join(BRAIN_DIR, 'city_variant_e_1773152795883.png'),
];

async function uploadBuffer(storagePath, buffer, contentType) {
  const { data, error } = await supabase.storage
    .from('city-images')
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Upload error: ${error.message}`);
  const { data: urlData } = supabase.storage.from('city-images').getPublicUrl(storagePath);
  return urlData.publicUrl;
}

async function main() {
  // Get all cities with their image URLs
  const { data: cities, error } = await supabase
    .from('city_pages')
    .select('id, city_name, slug, hero_image_url, city_image_url')
    .eq('is_active', true)
    .order('city_name');

  if (error) { console.error(error); return; }

  // Find cities that have duplicate hero/city images
  // We check this by comparing the filename pattern (both end in hero.png and city.png with same file size)
  // Since we know from analysis that batch-generated cities have identical content,
  // we check if both URLs are in the same batch pattern
  const batchPattern = /city-images\/city-images\/.+-(hero|city)\.png$/;
  
  // Cities to skip (already have manually set unique images)
  const skipSlugs = ['fulda', 'bad-hersfeld', 'kassel', 'tann']; // These were manually fixed
  
  let updated = 0;
  let skipped = 0;
  
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    
    if (skipSlugs.includes(city.slug)) {
      console.log(`⏭️ ${city.city_name}: manually set, skipping`);
      skipped++;
      continue;
    }
    
    // Check if both hero and city match the batch pattern
    const heroIsBatch = batchPattern.test(city.hero_image_url || '');
    const cityIsBatch = batchPattern.test(city.city_image_url || '');
    
    if (heroIsBatch && cityIsBatch) {
      // This city has duplicate batch images - replace the city image
      const variantIdx = i % cityVariants.length;
      const imgPath = cityVariants[variantIdx];
      const buffer = fs.readFileSync(imgPath);
      const storagePath = `city-images/${city.slug}-city-unique.png`;
      
      try {
        const publicUrl = await uploadBuffer(storagePath, buffer, 'image/png');
        
        const { error: updateError } = await supabase
          .from('city_pages')
          .update({ city_image_url: publicUrl })
          .eq('id', city.id);
          
        if (updateError) {
          console.error(`❌ ${city.city_name}: DB update failed: ${updateError.message}`);
        } else {
          console.log(`✅ ${city.city_name}: replaced with variant ${variantIdx + 1}`);
          updated++;
        }
      } catch (e) {
        console.error(`❌ ${city.city_name}: ${e.message}`);
      }
    } else {
      console.log(`⏭️ ${city.city_name}: already has unique city image`);
      skipped++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Replaced: ${updated} duplicate city images`);
  console.log(`Skipped: ${skipped}`);
}

main().catch(console.error);
