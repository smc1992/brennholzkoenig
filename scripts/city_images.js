/**
 * City Image Batch Processing Script
 * 1. Downloads Wikimedia images and re-uploads to Supabase
 * 2. Uploads new generated images to Supabase (from local files)
 * 3. Updates DB with new URLs
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Download a URL to a buffer
function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Upload buffer to Supabase storage
async function uploadToSupabase(filePath, buffer, contentType = 'image/webp') {
  const { data, error } = await supabase.storage
    .from('city-images')
    .upload(filePath, buffer, { contentType, upsert: true });
  
  if (error) throw new Error(`Upload error: ${error.message}`);
  
  const { data: urlData } = supabase.storage
    .from('city-images')
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
}

async function main() {
  const action = process.argv[2];
  
  if (action === 'migrate-wikimedia') {
    // Find cities with Wikimedia URLs
    const { data: cities, error } = await supabase
      .from('city_pages')
      .select('id, city_name, slug, hero_image_url, city_image_url, content_section_2_image_url, content_section_3_image_url')
      .eq('is_active', true);
    
    if (error) { console.error(error); return; }
    
    for (const city of cities) {
      const urls = {
        hero_image_url: city.hero_image_url,
        city_image_url: city.city_image_url,
        content_section_2_image_url: city.content_section_2_image_url,
        content_section_3_image_url: city.content_section_3_image_url
      };
      
      for (const [field, url] of Object.entries(urls)) {
        if (!url) continue;
        if (url.includes('wikimedia.org') || url.includes('unsplash.com') || url.includes('wikipedia.org')) {
          console.log(`\n📥 Migrating ${city.city_name} ${field}...`);
          console.log(`   From: ${url.substring(0, 80)}...`);
          
          try {
            const buffer = await downloadUrl(url);
            const ext = url.includes('.jpg') || url.includes('.jpeg') ? 'jpg' : 'png';
            const sectionType = field.replace('_url', '').replace('_image', '');
            const storagePath = `city-images/${city.slug}-${sectionType}-migrated.${ext}`;
            
            const publicUrl = await uploadToSupabase(storagePath, buffer, `image/${ext === 'jpg' ? 'jpeg' : ext}`);
            
            // Update DB
            const { error: updateError } = await supabase
              .from('city_pages')
              .update({ [field]: publicUrl })
              .eq('id', city.id);
            
            if (updateError) {
              console.error(`   ❌ DB update failed: ${updateError.message}`);
            } else {
              console.log(`   ✅ Migrated to: ${publicUrl}`);
            }
          } catch (e) {
            console.error(`   ❌ Failed: ${e.message}`);
          }
        }
      }
    }
    console.log('\n✅ Wikimedia migration complete!');
    
  } else if (action === 'upload-generated') {
    // Upload generated images from a directory
    const imageDir = process.argv[3];
    if (!imageDir) { console.error('Usage: node script.js upload-generated /path/to/images'); return; }
    
    const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.webp') || f.endsWith('.png'));
    
    for (const file of files) {
      // Expected format: slug-sectionType.webp (e.g., tann-city.webp, tann-section2.webp)
      const match = file.match(/^(.+)-(hero|city|section2|section3)\.(webp|png)$/);
      if (!match) {
        console.log(`⚠️ Skipping ${file} (unexpected format)`);
        continue;
      }
      
      const [, slug, sectionType, ext] = match;
      const fieldMap = {
        'hero': 'hero_image_url',
        'city': 'city_image_url',
        'section2': 'content_section_2_image_url',
        'section3': 'content_section_3_image_url'
      };
      
      const field = fieldMap[sectionType];
      const buffer = fs.readFileSync(path.join(imageDir, file));
      const storagePath = `city-images/${slug}-${sectionType}.${ext}`;
      
      console.log(`📤 Uploading ${file} → ${storagePath}...`);
      
      try {
        const publicUrl = await uploadToSupabase(storagePath, buffer, ext === 'webp' ? 'image/webp' : 'image/png');
        
        const { error: updateError } = await supabase
          .from('city_pages')
          .update({ [field]: publicUrl })
          .eq('slug', slug);
        
        if (updateError) {
          console.error(`  ❌ DB update failed: ${updateError.message}`);
        } else {
          console.log(`  ✅ Done: ${publicUrl}`);
        }
      } catch (e) {
        console.error(`  ❌ Upload failed: ${e.message}`);
      }
    }
    
  } else if (action === 'status') {
    // Show status of all cities
    const { data: cities, error } = await supabase
      .from('city_pages')
      .select('city_name, slug, hero_image_url, city_image_url, content_section_2_image_url, content_section_3_image_url')
      .eq('is_active', true)
      .order('city_name');
    
    if (error) { console.error(error); return; }
    
    let missing = { hero: 0, city: 0, section2: 0, section3: 0 };
    let external = { hero: 0, city: 0, section2: 0, section3: 0 };
    
    for (const c of cities) {
      const isExternal = (url) => url && (url.includes('wikimedia') || url.includes('unsplash') || url.includes('wikipedia'));
      if (!c.hero_image_url) missing.hero++;
      if (!c.city_image_url) missing.city++;
      if (!c.content_section_2_image_url) missing.section2++;
      if (!c.content_section_3_image_url) missing.section3++;
      if (isExternal(c.hero_image_url)) external.hero++;
      if (isExternal(c.city_image_url)) external.city++;
      if (isExternal(c.content_section_2_image_url)) external.section2++;
      if (isExternal(c.content_section_3_image_url)) external.section3++;
    }
    
    console.log(`\n=== CITY IMAGE STATUS (${cities.length} cities) ===`);
    console.log(`Hero:     ${cities.length - missing.hero} set, ${missing.hero} missing, ${external.hero} external`);
    console.log(`City:     ${cities.length - missing.city} set, ${missing.city} missing, ${external.city} external`);
    console.log(`Section2: ${cities.length - missing.section2} set, ${missing.section2} missing, ${external.section2} external`);
    console.log(`Section3: ${cities.length - missing.section3} set, ${missing.section3} missing, ${external.section3} external`);
    console.log(`\nTotal images needed: ${missing.section2 + missing.section3} (section 2+3)`);
    
  } else {
    console.log('Usage:');
    console.log('  node city_images.js status              - Show status');
    console.log('  node city_images.js migrate-wikimedia    - Migrate Wikimedia/Unsplash images');
    console.log('  node city_images.js upload-generated DIR - Upload generated images from directory');
  }
}

main().catch(console.error);
