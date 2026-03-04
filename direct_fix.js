const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function directFix() {
  console.log('=== DIREKTE FAQ-KORREKTUR ===\n');
  
  const KEEP_ID = '61e8359e-a6a1-4a26-a668-0187d52d8cea'; // Sortierung 0
  const DELETE_ID = '3e80c288-fc6c-4a64-8f90-eb408556beef'; // Sortierung 1
  
  try {
    // 1. Items der zu löschenden Kategorie abrufen
    console.log('1. Abrufen der Items aus der zu löschenden Kategorie...');
    const { data: itemsToMove, error: fetchError } = await supabase
      .from('faq_items')
      .select('id, question, sort_order')
      .eq('category_id', DELETE_ID);
    
    if (fetchError) {
      console.error('Fehler beim Abrufen der Items:', fetchError);
      return;
    }
    
    console.log(`Gefunden: ${itemsToMove.length} Items`);
    itemsToMove.forEach(item => {
      console.log(`  - "${item.question}" (ID: ${item.id})`);
    });
    
    // 2. Items einzeln verschieben
    console.log('\n2. Verschiebe Items einzeln...');
    for (const item of itemsToMove) {
      console.log(`Verschiebe: "${item.question}"`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('faq_items')
        .update({ category_id: KEEP_ID })
        .eq('id', item.id)
        .select();
      
      if (updateError) {
        console.error(`❌ Fehler beim Verschieben von "${item.question}":`, updateError);
      } else {
        console.log(`✓ Erfolgreich verschoben: "${item.question}"`);
        console.log(`  Update Result:`, updateResult);
      }
    }
    
    // 3. Prüfen, ob die zu löschende Kategorie jetzt leer ist
    console.log('\n3. Prüfe, ob Kategorie leer ist...');
    const { data: remainingItems, error: checkError } = await supabase
      .from('faq_items')
      .select('id')
      .eq('category_id', DELETE_ID);
    
    if (checkError) {
      console.error('Fehler beim Prüfen der verbleibenden Items:', checkError);
      return;
    }
    
    console.log(`Verbleibende Items in zu löschender Kategorie: ${remainingItems.length}`);
    
    if (remainingItems.length === 0) {
      // 4. Leere Kategorie löschen
      console.log('\n4. Lösche leere Kategorie...');
      const { error: deleteError } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', DELETE_ID);
      
      if (deleteError) {
        console.error('❌ Fehler beim Löschen der Kategorie:', deleteError);
      } else {
        console.log('✓ Kategorie erfolgreich gelöscht');
      }
    } else {
      console.log('❌ Kategorie ist nicht leer, kann nicht gelöscht werden');
    }
    
    // 5. Finale Verifikation
    console.log('\n5. Finale Verifikation...');
    const { data: finalCategories } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('name', 'Allgemeine Fragen');
    
    console.log(`Verbleibende "Allgemeine Fragen" Kategorien: ${finalCategories.length}`);
    
    if (finalCategories.length === 1) {
      const { data: finalItems } = await supabase
        .from('faq_items')
        .select('question, sort_order')
        .eq('category_id', finalCategories[0].id)
        .order('sort_order');
      
      console.log(`✓ Items in finaler Kategorie: ${finalItems.length}`);
      finalItems.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.question}"`);
      });
      
      console.log('\n🎉 KORREKTUR ERFOLGREICH!');
    } else {
      console.log('❌ Problem: Es gibt immer noch doppelte Kategorien');
    }
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
  }
}

directFix();
