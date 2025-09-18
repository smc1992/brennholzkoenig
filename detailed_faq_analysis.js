const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qvvvxqlaafbgqmjfmzpx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2dnZ4cWxhYWZiZ3FtamZtenB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzIsImV4cCI6MjA1MDU0ODg3Mn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeFullFAQStructure() {
  console.log('=== VOLLSTÄNDIGE FAQ-STRUKTUR ANALYSE ===\n');
  
  try {
    // 1. Alle FAQ-Kategorien abrufen
    console.log('1. ALLE FAQ-KATEGORIEN:');
    const { data: categories, error: catError } = await supabase
      .from('faq_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (catError) {
      console.error('Fehler beim Abrufen der Kategorien:', catError);
      return;
    }
    
    console.log(`Gefunden: ${categories.length} Kategorien\n`);
    
    // Kategorien anzeigen
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. "${cat.name}"`);
      console.log(`   ID: ${cat.id}`);
      console.log(`   Sortierung: ${cat.sort_order}`);
      console.log(`   Aktiv: ${cat.is_active}`);
      console.log(`   Erstellt: ${cat.created_at}`);
      console.log('');
    });
    
    // 2. Doppelte Kategorien identifizieren
    console.log('2. DOPPELTE KATEGORIEN ANALYSE:');
    const categoryNames = {};
    categories.forEach(cat => {
      if (!categoryNames[cat.name]) {
        categoryNames[cat.name] = [];
      }
      categoryNames[cat.name].push(cat);
    });
    
    const duplicates = Object.entries(categoryNames).filter(([name, cats]) => cats.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`Gefunden: ${duplicates.length} doppelte Kategorie(n)\n`);
      
      for (const [name, cats] of duplicates) {
        console.log(`DOPPELT: "${name}"`);
        cats.forEach((cat, index) => {
          console.log(`  ${index + 1}. ID: ${cat.id}, Sortierung: ${cat.sort_order}, Aktiv: ${cat.is_active}`);
        });
        console.log('');
      }
    } else {
      console.log('Keine doppelten Kategorien gefunden.\n');
    }
    
    // 3. FAQ-Items für jede Kategorie abrufen
    console.log('3. FAQ-ITEMS PRO KATEGORIE:');
    
    for (const category of categories) {
      const { data: items, error: itemsError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('category_id', category.id)
        .order('sort_order', { ascending: true });
      
      if (itemsError) {
        console.error(`Fehler beim Abrufen der Items für Kategorie ${category.name}:`, itemsError);
        continue;
      }
      
      console.log(`Kategorie: "${category.name}" (ID: ${category.id})`);
      console.log(`  Items: ${items.length}`);
      
      if (items.length > 0) {
        items.forEach((item, index) => {
          console.log(`    ${index + 1}. "${item.question}" (ID: ${item.id}, Sort: ${item.sort_order})`);
        });
      } else {
        console.log('    (Keine Items)');
      }
      console.log('');
    }
    
    // 4. Zusammenfassung und Empfehlungen
    console.log('4. ZUSAMMENFASSUNG UND EMPFEHLUNGEN:');
    console.log(`- Gesamt Kategorien: ${categories.length}`);
    console.log(`- Doppelte Kategorien: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\nEMPFEHLUNGEN:');
      for (const [name, cats] of duplicates) {
        console.log(`\nFür "${name}":`);
        
        // Sortiere nach sort_order
        const sortedCats = cats.sort((a, b) => a.sort_order - b.sort_order);
        const keepCategory = sortedCats[0]; // Niedrigste sort_order behalten
        const deleteCategories = sortedCats.slice(1);
        
        console.log(`  BEHALTEN: ID ${keepCategory.id} (Sort: ${keepCategory.sort_order})`);
        deleteCategories.forEach(cat => {
          console.log(`  LÖSCHEN: ID ${cat.id} (Sort: ${cat.sort_order})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

analyzeFullFAQStructure();
