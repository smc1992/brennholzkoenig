#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'content', 'cities');
const listPath = path.join(ROOT, 'cities.json');

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

function frontmatter(slug, city) {
  return `---\nslug: ${slug}\ncity_name: ${city}\nis_active: true\nmeta_title: ""\nmeta_description: ""\nhero_title: ""\nhero_subtitle: ""\npostal_codes: []\nservice_areas: []\nimages:\n  hero_image_url: ""\n  city_image_url: ""\n  qualifier_image_url: ""\n  testimonial_image_url: ""\n  expertise_image_url: ""\n  regional_quality_image_url: ""\n  sustainability_image_url: ""\n  local_partnerships_image_url: ""\nctas:\n  hero_cta_text: "Jetzt bestellen"\n  hero_secondary_cta_text: "WhatsApp Beratung"\n  primary_cta_url: "/shop"\n  secondary_cta_url: ""\n  contact_url: "/kontakt"\n  shop_url: "/shop"\ncontent:\n  section1:\n    title: ""\n    text: ""\n  section2:\n    title: ""\n    text: ""\n    image_url: ""\n  section3:\n    title: ""\n    text: ""\n    image_url: ""\nservice:\n  title: ""\n  subtitle: ""\n  description: ""\n  areas: []\n  expertise_title: ""\n  expertise_description: ""\n  expertise_benefits: []\n  local_rooted_title: ""\n  local_rooted_description: ""\ndelivery:\n  title: ""\n  description: ""\n  zones: []\n  routes: []\nfaq: []\npartnerships: []\nevents: []\ncontact:\n  phone: ""\n  phone_display: ""\n  email: ""\n  address: ""\n---\n\n# Hero\n\n# Content Abschnitt 1\n\n# Content Abschnitt 2\n\n# Content Abschnitt 3\n\n# Service\n\n# Lieferung\n\n# FAQs\n\n# Partner\n\n# Saisonale Events\n\n`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  ensureDir(ROOT);
  const cities = JSON.parse(fs.readFileSync(listPath, 'utf8'));
  cities.forEach((city) => {
    const slug = slugify(city);
    const filePath = path.join(ROOT, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, frontmatter(slug, city), 'utf8');
      console.log(`Created: ${filePath}`);
    } else {
      console.log(`Exists: ${filePath}`);
    }
  });
}

main();