const { createClient } = require('@supabase/supabase-js');

// Verwende die Service Role Key für Admin-Berechtigungen
const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODIyOSwiZXhwIjoyMDcwNDk0MjI5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Definierte IDs basierend auf der Analyse
const KEEP_CATEGORY_ID = '61e8359e-a6a1-4a26-a668-0187d52d8cea'; // Sortierung: 0
const DELETE_CATEGORY_ID = '3e80c288-fc6c-4a64-8f90-eb408556beef'; // Sortierung: 1

async function adminFixFAQ() {
  try {
    console.log('🔧 Admin FAQ Fix gestartet...\n');

    // 1. Aktuelle Situation analysieren
    console.log('📊 Analysiere aktuelle FAQ-Struktur...');
    const { data: categories, error: catError } = await supabase
      .from('faq_categories')
      .select('*')
      .order('sort_order');

    if (catError) {
      console.error('❌ Fehler beim Laden der Kategorien:', catError);
      return;
    }

    console.log('Gefundene Kategorien:');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id}, Sortierung: ${cat.sort_order})`);
    });

    // 2. Items in beiden Kategorien prüfen
    console.log('\n📋 Prüfe Items in beiden "Allgemeine Fragen"-Kategorien...');
    
    const { data: keepItems, error: keepError } = await supabase
      .from('faq_items')
      .select('*')
      .eq('category_id', KEEP_CATEGORY_ID);

    const { data: deleteItems, error: deleteError } = await supabase
      .from('faq_items')
      .select('*')
      .eq('category_id', DELETE_CATEGORY_ID);

    if (keepError || deleteError) {
      console.error('❌ Fehler beim Laden der Items:', keepError || deleteError);
      return;
    }

    console.log(`Kategorie behalten (${KEEP_CATEGORY_ID}): ${keepItems.length} Items`);
    keepItems.forEach(item => console.log(`  - ${item.question}`));

    console.log(`Kategorie löschen (${DELETE_CATEGORY_ID}): ${deleteItems.length} Items`);
    deleteItems.forEach(item => console.log(`  - ${item.question}`));

    // 3. Items verschieben (mit Service Role Key)
    if (deleteItems.length > 0) {
      console.log('\n🔄 Verschiebe Items zur beizubehaltenden Kategorie...');
      
      for (const item of deleteItems) {
        const { data: updateResult, error: updateError } = await supabase
          .from('faq_items')
          .update({ category_id: KEEP_CATEGORY_ID })
          .eq('id', item.id)
          .select();

        if (updateError) {
          console.error(`❌ Fehler beim Verschieben von Item ${item.id}:`, updateError);
        } else {
          console.log(`✅ Item verschoben: "${item.question}"`);
          console.log(`   Update Result:`, updateResult);
        }
      }
    }

    // 4. Prüfe ob zu löschende Kategorie jetzt leer ist
    console.log('\n🔍 Prüfe ob zu löschende Kategorie leer ist...');
    const { data: remainingItems, error: remainingError } = await supabase
      .from('faq_items')
      .select('*')
      .eq('category_id', DELETE_CATEGORY_ID);

    if (remainingError) {
      console.error('❌ Fehler beim Prüfen der verbleibenden Items:', remainingError);
      return;
    }

    console.log(`Verbleibende Items in zu löschender Kategorie: ${remainingItems.length}`);

    // 5. Kategorie löschen (nur wenn leer)
    if (remainingItems.length === 0) {
      console.log('\n🗑️ Lösche leere doppelte Kategorie...');
      const { error: deleteError } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', DELETE_CATEGORY_ID);

      if (deleteError) {
        console.error('❌ Fehler beim Löschen der Kategorie:', deleteError);
      } else {
        console.log('✅ Doppelte Kategorie erfolgreich gelöscht!');
      }
    } else {
      console.log('⚠️ Kategorie nicht gelöscht - enthält noch Items!');
    }

    // 6. Finale Verifikation
    console.log('\n✅ Finale Verifikation...');
    const { data: finalCategories, error: finalError } = await supabase
      .from('faq_categories')
      .select('*')
      .ilike('name', '%allgemeine fragen%')
      .order('sort_order');

    if (finalError) {
      console.error('❌ Fehler bei der finalen Verifikation:', finalError);
      return;
    }

    console.log(`Verbleibende "Allgemeine Fragen"-Kategorien: ${finalCategories.length}`);
    finalCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id}, Sortierung: ${cat.sort_order})`);
    });

    if (finalCategories.length === 1) {
      console.log('\n🎉 FAQ-Korrektur erfolgreich abgeschlossen!');
    } else {
      console.log('\n⚠️ Problem weiterhin vorhanden - weitere Analyse erforderlich');
    }

  } catch (error) {
    console.error('💥 Unerwarteter Fehler:', error);
  }
}

adminFixFAQ();
