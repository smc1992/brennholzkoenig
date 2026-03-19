/**
 * Optimize all city page images:
 * 1. Download each image
 * 2. Check file size
 * 3. Convert to WebP (max 250KB, quality auto-adjusted)
 * 4. Re-upload to Supabase Storage
 * 5. Update DB URLs
 */
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const path = require('path');
const https = require('https');
const http = require('http');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MAX_SIZE_KB = 250;
const TARGET_WIDTH_HERO = 1600;   // Hero images wider
const TARGET_WIDTH_OTHER = 800;   // City/section images
const BUCKET = 'city-images';

// Download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Convert image to WebP with size constraint
async function convertToWebP(buffer, maxWidth, maxSizeKB = 250) {
  let quality = 80;
  let result;

  // First pass: resize + convert
  result = await sharp(buffer)
    .resize(maxWidth, null, { withoutEnlargement: true, fit: 'inside' })
    .webp({ quality })
    .toBuffer();

  // If still too large, reduce quality iteratively
  while (result.length > maxSizeKB * 1024 && quality > 20) {
    quality -= 10;
    result = await sharp(buffer)
      .resize(maxWidth, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality })
      .toBuffer();
  }

  // If still too large, reduce dimensions
  if (result.length > maxSizeKB * 1024) {
    const reducedWidth = Math.round(maxWidth * 0.7);
    result = await sharp(buffer)
      .resize(reducedWidth, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 60 })
      .toBuffer();
  }

  return { buffer: result, quality };
}

async function processImage(city, imageType, imageUrl, maxWidth) {
  if (!imageUrl) return null;

  // Already optimized webp under 250KB? Skip check still needed for size
  const isWebP = imageUrl.toLowerCase().endsWith('.webp');

  try {
    // Download
    const originalBuffer = await downloadImage(imageUrl);
    const originalSizeKB = Math.round(originalBuffer.length / 1024);

    // Check if already small enough AND webp
    if (isWebP && originalSizeKB <= MAX_SIZE_KB) {
      console.log(`  ⏭️  ${imageType}: already WebP & ${originalSizeKB}KB — skip`);
      return null; // No change needed
    }

    // Convert
    const { buffer: webpBuffer, quality } = await convertToWebP(originalBuffer, maxWidth, MAX_SIZE_KB);
    const newSizeKB = Math.round(webpBuffer.length / 1024);
    const savings = Math.round((1 - webpBuffer.length / originalBuffer.length) * 100);

    console.log(`  📦 ${imageType}: ${originalSizeKB}KB → ${newSizeKB}KB (${savings}% smaller, q${quality})`);

    // Upload new WebP to Supabase
    const storagePath = `optimized/${city.slug}/${imageType}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error(`  ❌ Upload failed: ${uploadError.message}`);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return urlData.publicUrl;

  } catch (err) {
    console.error(`  ❌ ${imageType}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🖼️  City Image Optimizer');
  console.log('========================\n');

  // Load all active city pages
  const { data: cities, error } = await supabase
    .from('city_pages')
    .select('id, city_name, slug, hero_image_url, city_image_url, content_section_2_image_url, content_section_3_image_url')
    .eq('is_active', true)
    .order('city_name');

  if (error) {
    console.error('Failed to load cities:', error.message);
    return;
  }

  console.log(`Found ${cities.length} active city pages\n`);

  let totalOriginalKB = 0;
  let totalNewKB = 0;
  let optimizedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const city of cities) {
    console.log(`\n🏙️  ${city.city_name} (/${city.slug})`);

    const imageFields = [
      { type: 'hero', field: 'hero_image_url', url: city.hero_image_url, width: TARGET_WIDTH_HERO },
      { type: 'city', field: 'city_image_url', url: city.city_image_url, width: TARGET_WIDTH_OTHER },
      { type: 'section2', field: 'content_section_2_image_url', url: city.content_section_2_image_url, width: TARGET_WIDTH_OTHER },
      { type: 'section3', field: 'content_section_3_image_url', url: city.content_section_3_image_url, width: TARGET_WIDTH_OTHER },
    ];

    const updates = {};

    for (const img of imageFields) {
      if (!img.url) {
        console.log(`  ⚠️  ${img.type}: no URL — skip`);
        skippedCount++;
        continue;
      }

      const newUrl = await processImage(city, img.type, img.url, img.width);
      if (newUrl) {
        updates[img.field] = newUrl;
        optimizedCount++;
      } else {
        skippedCount++;
      }
    }

    // Update DB if any images were optimized
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('city_pages')
        .update(updates)
        .eq('id', city.id);

      if (updateError) {
        console.error(`  ❌ DB update failed: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ ${Object.keys(updates).length} images updated in DB`);
      }
    }
  }

  console.log('\n=============================');
  console.log('📊 SUMMARY');
  console.log('=============================');
  console.log(`Total cities: ${cities.length}`);
  console.log(`Images optimized: ${optimizedCount}`);
  console.log(`Images skipped (already OK): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('=============================\n');
}

main().catch(console.error);
