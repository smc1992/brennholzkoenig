const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

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
        // Zeige IDs der doppelten Einträge
        const duplicates = data.filter(cat => cat.name === name);
        duplicates.forEach(dup => {
          console.log(`  - ID: ${dup.id}, Sortierung: ${dup.sort_order}, Aktiv: ${dup.is_active}`);
        });
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
  }
}

checkFAQCategories();
