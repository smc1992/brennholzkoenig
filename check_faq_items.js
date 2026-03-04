const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFAQItems() {
  try {
    const categoryId1 = '61e8359e-a6a1-4a26-a668-0187d52d8cea'; // Sortierung 0
    const categoryId2 = '3e80c288-fc6c-4a64-8f90-eb408556beef'; // Sortierung 1

    console.log('FAQ-Items für "Allgemeine Fragen" Kategorien:');
    console.log('='.repeat(50));

    // Items für erste Kategorie
    const { data: items1, error: error1 } = await supabase
      .from('faq_items')
      .select('id, question, answer, sort_order, is_active')
      .eq('category_id', categoryId1)
      .order('sort_order');

    if (error1) {
      console.error('Fehler bei Kategorie 1:', error1);
    } else {
      console.log(`\nKategorie 1 (ID: ${categoryId1}, Sortierung: 0):`);
      console.log(`Anzahl Items: ${items1.length}`);
      items1.forEach(item => {
        console.log(`  - ${item.question} (Sortierung: ${item.sort_order}, Aktiv: ${item.is_active})`);
      });
    }

    // Items für zweite Kategorie
    const { data: items2, error: error2 } = await supabase
      .from('faq_items')
      .select('id, question, answer, sort_order, is_active')
      .eq('category_id', categoryId2)
      .order('sort_order');

    if (error2) {
      console.error('Fehler bei Kategorie 2:', error2);
    } else {
      console.log(`\nKategorie 2 (ID: ${categoryId2}, Sortierung: 1):`);
      console.log(`Anzahl Items: ${items2.length}`);
      items2.forEach(item => {
        console.log(`  - ${item.question} (Sortierung: ${item.sort_order}, Aktiv: ${item.is_active})`);
      });
    }

    console.log('\n='.repeat(50));
    console.log('Empfehlung: Alle Items zur Kategorie mit Sortierung 0 verschieben und die andere löschen.');

  } catch (error) {
    console.error('Fehler:', error);
  }
}

checkFAQItems();
