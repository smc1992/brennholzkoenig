const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateCategories() {
  try {
    const keepCategoryId = '61e8359e-a6a1-4a26-a668-0187d52d8cea'; // Sortierung 0 - behalten
    const deleteCategoryId = '3e80c288-fc6c-4a64-8f90-eb408556beef'; // Sortierung 1 - löschen

    console.log('Schritt 1: FAQ-Items von der zu löschenden Kategorie zur beibehaltenen verschieben...');
    
    // Alle FAQ-Items von der zu löschenden Kategorie zur beibehaltenen verschieben
    const { data: itemsToMove, error: fetchError } = await supabase
      .from('faq_items')
      .select('id, question, sort_order')
      .eq('category_id', deleteCategoryId);

    if (fetchError) {
      console.error('Fehler beim Abrufen der zu verschiebenden Items:', fetchError);
      return;
    }

    console.log(`Gefunden: ${itemsToMove.length} Items zum Verschieben`);

    // Items verschieben und neue Sortierreihenfolge vergeben
    for (let i = 0; i < itemsToMove.length; i++) {
      const item = itemsToMove[i];
      const newSortOrder = 5 + i; // Beginne bei 5, da die bestehenden Items Sortierung 3 und 4 haben
      
      const { error: updateError } = await supabase
        .from('faq_items')
        .update({ 
          category_id: keepCategoryId,
          sort_order: newSortOrder
        })
        .eq('id', item.id);

      if (updateError) {
        console.error(`Fehler beim Verschieben von Item ${item.id}:`, updateError);
      } else {
        console.log(`✓ Verschoben: "${item.question}" (neue Sortierung: ${newSortOrder})`);
      }
    }

    console.log('\nSchritt 2: Leere Kategorie löschen...');
    
    // Die jetzt leere Kategorie löschen
    const { error: deleteError } = await supabase
      .from('faq_categories')
      .delete()
      .eq('id', deleteCategoryId);

    if (deleteError) {
      console.error('Fehler beim Löschen der Kategorie:', deleteError);
    } else {
      console.log('✓ Doppelte Kategorie erfolgreich gelöscht');
    }

    console.log('\nSchritt 3: Verifikation...');
    
    // Verifikation: Alle Items der beibehaltenen Kategorie anzeigen
    const { data: finalItems, error: verifyError } = await supabase
      .from('faq_items')
      .select('id, question, sort_order')
      .eq('category_id', keepCategoryId)
      .order('sort_order');

    if (verifyError) {
      console.error('Fehler bei der Verifikation:', verifyError);
    } else {
      console.log(`\nFinal: ${finalItems.length} Items in der "Allgemeine Fragen" Kategorie:`);
      finalItems.forEach(item => {
        console.log(`  - ${item.question} (Sortierung: ${item.sort_order})`);
      });
    }

    console.log('\n✅ Doppelte Kategorien erfolgreich zusammengeführt!');

  } catch (error) {
    console.error('Fehler:', error);
  }
}

fixDuplicateCategories();
