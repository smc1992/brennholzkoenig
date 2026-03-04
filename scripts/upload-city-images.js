#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3002;
const API_URL = `http://localhost:${PORT}/api/city-assets`;
const ROOT = path.join(process.cwd(), 'content', 'cities');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-');
}

async function uploadImage(cityName, slug, section) {
  const query = encodeURIComponent(`${cityName},Germany`);
  const imageUrl = `https://source.unsplash.com/1600x900/?${query}`;
  const body = { city_slug: slug, section, image_url: imageUrl };
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Upload failed for ${slug}/${section}: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!data.publicUrl) throw new Error(`No publicUrl for ${slug}/${section}`);
  return data.publicUrl;
}

function replaceImageUrl(mdPath, key, url) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const regex = new RegExp(`(^\s*${key}:\s*")([^"]*)("\s*$)`, 'm');
  const updated = content.replace(regex, `$1${url}$3`);
  fs.writeFileSync(mdPath, updated, 'utf8');
}

async function processCity(cityName) {
  const slug = slugify(cityName);
  const mdPath = path.join(ROOT, `${slug}.md`);
  if (!fs.existsSync(mdPath)) {
    console.warn(`Skip: missing file ${mdPath}`);
    return;
  }
  console.log(`City: ${cityName} (${slug})`);
  try {
    const heroUrl = await uploadImage(cityName, slug, 'hero');
    replaceImageUrl(mdPath, 'hero_image_url', heroUrl);
    const cityUrl = await uploadImage(cityName, slug, 'city');
    replaceImageUrl(mdPath, 'city_image_url', cityUrl);
    console.log(`  ✓ Uploaded hero & city images`);
  } catch (e) {
    console.error(`  ✗ ${e.message}`);
  }
}

async function main() {
  const listPath = path.join(ROOT, 'cities.json');
  const cities = JSON.parse(fs.readFileSync(listPath, 'utf8'));
  for (const city of cities) {
    // slight delay to avoid rate limiting
    // eslint-disable-next-line no-await-in-loop
    await processCity(city);
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});