/**
 * Batch upload section 2/3 images to all cities
 * Rotates 3 quality images and 3 sustainability images across all cities
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

// Source images (generated PNGs)
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

// Convert PNG to WebP using sips (macOS built-in)
function convertToWebP(inputPath) {
  const outputPath = inputPath.replace('.png', '.webp');
  if (fs.existsSync(outputPath)) return outputPath;
  
  try {
    // Use sips for conversion with reduced quality
    const tmpPath = inputPath.replace('.png', '_tmp.png');
    // First resize to reasonable dimensions (1200px width max)
    execSync(`sips -Z 1200 "${inputPath}" --out "${tmpPath}" 2>/dev/null`, { stdio: 'pipe' });
    // Convert to JPEG as intermediate (sips doesn't do WebP natively)
    const jpgPath = inputPath.replace('.png', '.jpg');
    execSync(`sips -s format jpeg -s formatOptions 80 "${tmpPath}" --out "${jpgPath}" 2>/dev/null`, { stdio: 'pipe' });
    fs.unlinkSync(tmpPath);
    
    // Try cwebp if available, otherwise use the JPG
    try {
      execSync(`cwebp -q 80 -resize 1200 0 "${inputPath}" -o "${outputPath}" 2>/dev/null`, { stdio: 'pipe' });
      fs.unlinkSync(jpgPath);
    } catch {
      // cwebp not available, rename jpg to webp (browsers handle this)
      fs.renameSync(jpgPath, outputPath);
    }
    
    return outputPath;
  } catch (e) {
    console.log(`  ⚠️ WebP conversion failed, using PNG: ${e.message}`);
    return inputPath;
  }
}

async function uploadBuffer(storagePath, buffer, contentType) {
  const { data, error } = await supabase.storage
    .from('city-images')
    .upload(storagePath, buffer, { contentType, upsert: true });
  
  if (error) throw new Error(`Upload error: ${error.message}`);
  
  const { data: urlData } = supabase.storage
    .from('city-images')
    .getPublicUrl(storagePath);
  
  return urlData.publicUrl;
}

async function main() {
  // Get all cities
  const { data: cities, error } = await supabase
    .from('city_pages')
    .select('id, city_name, slug, content_section_2_image_url, content_section_3_image_url')
    .eq('is_active', true)
    .order('city_name');

  if (error) { console.error(error); return; }

  console.log(`Processing ${cities.length} cities...\n`);

  // Convert images
  console.log('Converting images...');
  const s2Paths = section2Images.map(convertToWebP);
  const s3Paths = section3Images.map(convertToWebP);
  console.log('Done.\n');

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const updates = {};
    
    // Section 2: rotate through 3 images
    if (!city.content_section_2_image_url || city.content_section_2_image_url.includes('unsplash') || city.content_section_2_image_url.includes('wikimedia')) {
      const imgPath = s2Paths[i % s2Paths.length];
      const ext = path.extname(imgPath).slice(1);
      const contentType = ext === 'webp' ? 'image/webp' : (ext === 'jpg' ? 'image/jpeg' : 'image/png');
      const buffer = fs.readFileSync(imgPath);
      const storagePath = `city-images/${city.slug}-section2.${ext}`;
      
      try {
        const publicUrl = await uploadBuffer(storagePath, buffer, contentType);
        updates.content_section_2_image_url = publicUrl;
        console.log(`✅ ${city.city_name} section2 → image ${(i % 3) + 1}`);
      } catch (e) {
        console.error(`❌ ${city.city_name} section2: ${e.message}`);
      }
    } else {
      console.log(`⏭️ ${city.city_name} section2: already has custom image`);
      skipped++;
    }
    
    // Section 3: rotate through 3 images  
    if (!city.content_section_3_image_url || city.content_section_3_image_url.includes('unsplash') || city.content_section_3_image_url.includes('wikimedia')) {
      const imgPath = s3Paths[i % s3Paths.length];
      const ext = path.extname(imgPath).slice(1);
      const contentType = ext === 'webp' ? 'image/webp' : (ext === 'jpg' ? 'image/jpeg' : 'image/png');
      const buffer = fs.readFileSync(imgPath);
      const storagePath = `city-images/${city.slug}-section3.${ext}`;
      
      try {
        const publicUrl = await uploadBuffer(storagePath, buffer, contentType);
        updates.content_section_3_image_url = publicUrl;
        console.log(`✅ ${city.city_name} section3 → image ${(i % 3) + 1}`);
      } catch (e) {
        console.error(`❌ ${city.city_name} section3: ${e.message}`);
      }
    } else {
      console.log(`⏭️ ${city.city_name} section3: already has custom image`);
      skipped++;
    }
    
    // Update DB if we have changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('city_pages')
        .update(updates)
        .eq('id', city.id);
        
      if (updateError) {
        console.error(`❌ DB update for ${city.city_name}: ${updateError.message}`);
      } else {
        updated++;
      }
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated} cities`);
  console.log(`Skipped: ${skipped} (already had custom images)`);
  
  // Verify
  console.log('\nRunning status check...');
  execSync('node scripts/city_images.js status', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
}

main().catch(console.error);
