const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration aus .env.local laden
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase-Konfiguration fehlt');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFAQCategories() {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .select('id, name, is_active, sort_order')
      .order('name')
      .order('sort_order');

    if (error) {
      console.error('Fehler:', error);
      return;
    }

    console.log('FAQ-Kategorien:');
    console.log('ID | Name | Aktiv | Sortierung');
    console.log('---|------|-------|----------');
    
    data.forEach(cat => {
      console.log(`${cat.id} | ${cat.name} | ${cat.is_active} | ${cat.sort_order}`);
    });

    // Doppelte Namen finden
    const nameCount = {};
    data.forEach(cat => {
      nameCount[cat.name] = (nameCount[cat.name] || 0) + 1;
    });

    console.log('\nDoppelte Kategorien:');
    Object.entries(nameCount).forEach(([name, count]) => {
      if (count > 1) {
        console.log(`"${name}" kommt ${count} mal vor`);
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
  }
}

checkFAQCategories();
