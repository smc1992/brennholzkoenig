const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeFix() {
  try {
    console.log('=== VOLLSTÄNDIGE ANALYSE UND KORREKTUR ===\n');

    // Schritt 1: Alle Kategorien anzeigen
    console.log('1. Aktuelle FAQ-Kategorien:');
    const { data: categories, error: catError } = await supabase
      .from('faq_categories')
      .select('*')
      .order('name', { ascending: true });

    if (catError) {
      console.error('Fehler beim Laden der Kategorien:', catError);
      return;
    }

    categories.forEach(cat => {
      console.log(`   ${cat.name} (ID: ${cat.id}, Sortierung: ${cat.sort_order}, Aktiv: ${cat.is_active})`);
    });

    // Schritt 2: Alle FAQ-Items anzeigen
    console.log('\n2. Alle FAQ-Items:');
    const { data: allItems, error: itemsError } = await supabase
      .from('faq_items')
      .select('*, faq_categories(name)')
      .order('category_id')
      .order('sort_order');

    if (itemsError) {
      console.error('Fehler beim Laden der Items:', itemsError);
      return;
    }

    allItems.forEach(item => {
      console.log(`   "${item.question}" (Kategorie: ${item.faq_categories?.name}, Sortierung: ${item.sort_order})`);
    });

    // Schritt 3: Doppelte "Allgemeine Fragen" identifizieren
    const duplicateCategories = categories.filter(cat => cat.name === 'Allgemeine Fragen');
    console.log(`\n3. Gefundene "Allgemeine Fragen" Kategorien: ${duplicateCategories.length}`);
    
    if (duplicateCategories.length !== 2) {
      console.log('Keine doppelten Kategorien gefunden oder unerwartete Anzahl.');
      return;
    }

    // Die Kategorie mit der niedrigeren Sortierung behalten
    const keepCategory = duplicateCategories.sort((a, b) => a.sort_order - b.sort_order)[0];
    const deleteCategory = duplicateCategories.find(cat => cat.id !== keepCategory.id);

    console.log(`   Behalten: ID ${keepCategory.id} (Sortierung: ${keepCategory.sort_order})`);
    console.log(`   Löschen: ID ${deleteCategory.id} (Sortierung: ${deleteCategory.sort_order})`);

    // Schritt 4: Alle Items zur beibehaltenen Kategorie verschieben
    console.log('\n4. Items verschieben...');
    
    const itemsToMove = allItems.filter(item => item.category_id === deleteCategory.id);
    const existingItems = allItems.filter(item => item.category_id === keepCategory.id);
    
    console.log(`   Items zu verschieben: ${itemsToMove.length}`);
    console.log(`   Bestehende Items: ${existingItems.length}`);

    // Neue Sortierreihenfolge berechnen
    const maxSortOrder = Math.max(...existingItems.map(item => item.sort_order), 0);
    
    for (let i = 0; i < itemsToMove.length; i++) {
      const item = itemsToMove[i];
      const newSortOrder = maxSortOrder + i + 1;
      
      const { error: updateError } = await supabase
        .from('faq_items')
        .update({ 
          category_id: keepCategory.id,
          sort_order: newSortOrder
        })
        .eq('id', item.id);

      if (updateError) {
        console.error(`   Fehler beim Verschieben von "${item.question}":`, updateError);
      } else {
        console.log(`   ✓ Verschoben: "${item.question}" (neue Sortierung: ${newSortOrder})`);
      }
    }

    // Schritt 5: Leere Kategorie löschen
    console.log('\n5. Leere Kategorie löschen...');
    const { error: deleteError } = await supabase
      .from('faq_categories')
      .delete()
      .eq('id', deleteCategory.id);

    if (deleteError) {
      console.error('   Fehler beim Löschen:', deleteError);
    } else {
      console.log('   ✓ Kategorie erfolgreich gelöscht');
    }

    // Schritt 6: Finale Verifikation
    console.log('\n6. Finale Verifikation:');
    
    const { data: finalCategories, error: finalCatError } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('name', 'Allgemeine Fragen');

    const { data: finalItems, error: finalItemsError } = await supabase
      .from('faq_items')
      .select('*')
      .eq('category_id', keepCategory.id)
      .order('sort_order');

    if (finalCatError || finalItemsError) {
      console.error('Fehler bei der Verifikation');
      return;
    }

    console.log(`   Kategorien mit Namen "Allgemeine Fragen": ${finalCategories.length}`);
    console.log(`   Items in der finalen Kategorie: ${finalItems.length}`);
    
    finalItems.forEach(item => {
      console.log(`     - "${item.question}" (Sortierung: ${item.sort_order})`);
    });

    console.log('\n✅ KORREKTUR ABGESCHLOSSEN!');

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

completeFix();
