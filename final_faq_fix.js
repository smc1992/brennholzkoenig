const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Definierte IDs basierend auf der Analyse
const KEEP_CATEGORY_ID = '61e8359e-a6a1-4a26-a668-0187d52d8cea'; // Sortierung: 0
const DELETE_CATEGORY_ID = '3e80c288-fc6c-4a64-8f90-eb408556beef'; // Sortierung: 1

async function fixDuplicateFAQCategories() {
  console.log('=== FINALE FAQ-KATEGORIEN KORREKTUR ===\n');
  
  try {
    // 1. Aktuelle Situation anzeigen
    console.log('1. AKTUELLE SITUATION:');
    const { data: beforeCategories } = await supabase
      .from('faq_categories')
      .select('*')
      .in('id', [KEEP_CATEGORY_ID, DELETE_CATEGORY_ID])
      .order('sort_order');
    
    console.log('Doppelte "Allgemeine Fragen" Kategorien:');
    beforeCategories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Sortierung: ${cat.sort_order}, Name: "${cat.name}"`);
    });
    
    // 2. Items der zu löschenden Kategorie abrufen
    console.log('\n2. ITEMS ZU VERSCHIEBEN:');
    const { data: itemsToMove, error: itemsError } = await supabase
      .from('faq_items')
      .select('*')
      .eq('category_id', DELETE_CATEGORY_ID);
    
    if (itemsError) {
      console.error('Fehler beim Abrufen der Items:', itemsError);
      return;
    }
    
    console.log(`Gefunden: ${itemsToMove.length} Items zu verschieben`);
    itemsToMove.forEach((item, index) => {
      console.log(`  ${index + 1}. "${item.question}" (ID: ${item.id})`);
    });
    
    // 3. Items verschieben
    console.log('\n3. VERSCHIEBE ITEMS:');
    for (const item of itemsToMove) {
      const { error: updateError } = await supabase
        .from('faq_items')
        .update({ category_id: KEEP_CATEGORY_ID })
        .eq('id', item.id);
      
      if (updateError) {
        console.error(`Fehler beim Verschieben von Item ${item.id}:`, updateError);
      } else {
        console.log(`✓ Verschoben: "${item.question}"`);
      }
    }
    
    // 4. Leere Kategorie löschen
    console.log('\n4. LÖSCHE LEERE KATEGORIE:');
    const { error: deleteError } = await supabase
      .from('faq_categories')
      .delete()
      .eq('id', DELETE_CATEGORY_ID);
    
    if (deleteError) {
      console.error('Fehler beim Löschen der Kategorie:', deleteError);
    } else {
      console.log(`✓ Kategorie ${DELETE_CATEGORY_ID} gelöscht`);
    }
    
    // 5. Verifikation
    console.log('\n5. VERIFIKATION:');
    
    // Prüfe, ob die doppelte Kategorie weg ist
    const { data: remainingDuplicates } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('name', 'Allgemeine Fragen');
    
    console.log(`Verbleibende "Allgemeine Fragen" Kategorien: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length === 1) {
      const category = remainingDuplicates[0];
      console.log(`✓ Nur noch eine Kategorie: ID ${category.id}, Sortierung: ${category.sort_order}`);
      
      // Prüfe Items in der finalen Kategorie
      const { data: finalItems } = await supabase
        .from('faq_items')
        .select('*')
        .eq('category_id', category.id)
        .order('sort_order');
      
      console.log(`✓ Items in finaler Kategorie: ${finalItems.length}`);
      finalItems.forEach((item, index) => {
        console.log(`    ${index + 1}. "${item.question}" (Sort: ${item.sort_order})`);
      });
      
      console.log('\n🎉 KORREKTUR ERFOLGREICH ABGESCHLOSSEN!');
      console.log('Die doppelten "Allgemeine Fragen"-Kategorien wurden erfolgreich zusammengeführt.');
      
    } else {
      console.log('❌ FEHLER: Es gibt immer noch doppelte Kategorien!');
      remainingDuplicates.forEach(cat => {
        console.log(`  - ID: ${cat.id}, Sortierung: ${cat.sort_order}`);
      });
    }
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

fixDuplicateFAQCategories();
