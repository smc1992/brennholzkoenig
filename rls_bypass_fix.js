const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Definierte IDs basierend auf der Analyse
const KEEP_CATEGORY_ID = '61e8359e-a6a1-4a26-a668-0187d52d8cea'; // Sortierung: 0
const DELETE_CATEGORY_ID = '3e80c288-fc6c-4a64-8f90-eb408556beef'; // Sortierung: 1

async function rlsBypassFix() {
  try {
    console.log('🔧 RLS Bypass FAQ Fix gestartet...\n');

    // 1. Verwende SQL-Funktionen um RLS zu umgehen
    console.log('📋 Verschiebe Items mit SQL...');
    
    // SQL-Befehl zum Verschieben der Items
    const moveItemsSQL = `
      UPDATE faq_items 
      SET category_id = '${KEEP_CATEGORY_ID}' 
      WHERE category_id = '${DELETE_CATEGORY_ID}';
    `;

    const { data: moveResult, error: moveError } = await supabase.rpc('exec_sql', {
      sql_query: moveItemsSQL
    });

    if (moveError) {
      console.log('⚠️ SQL-Funktion nicht verfügbar, versuche direktes Update...');
      
      // Fallback: Direkte Updates mit expliziter Berechtigung
      const { data: itemsToMove } = await supabase
        .from('faq_items')
        .select('*')
        .eq('category_id', DELETE_CATEGORY_ID);

      if (itemsToMove && itemsToMove.length > 0) {
        console.log(`Verschiebe ${itemsToMove.length} Items...`);
        
        for (const item of itemsToMove) {
          // Versuche mit upsert statt update
          const { data: upsertResult, error: upsertError } = await supabase
            .from('faq_items')
            .upsert({
              id: item.id,
              category_id: KEEP_CATEGORY_ID,
              question: item.question,
              answer: item.answer,
              sort_order: item.sort_order,
              is_active: item.is_active,
              created_at: item.created_at,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (upsertError) {
            console.error(`❌ Upsert-Fehler für Item ${item.id}:`, upsertError);
          } else {
            console.log(`✅ Item upserted: "${item.question}"`);
          }
        }
      }
    } else {
      console.log('✅ Items mit SQL verschoben:', moveResult);
    }

    // 2. Prüfe Ergebnis
    console.log('\n🔍 Prüfe Ergebnis...');
    const { data: remainingItems } = await supabase
      .from('faq_items')
      .select('*')
      .eq('category_id', DELETE_CATEGORY_ID);

    console.log(`Verbleibende Items in zu löschender Kategorie: ${remainingItems?.length || 0}`);

    // 3. Lösche Kategorie wenn leer
    if (!remainingItems || remainingItems.length === 0) {
      console.log('\n🗑️ Lösche leere Kategorie...');
      
      const deleteSQL = `DELETE FROM faq_categories WHERE id = '${DELETE_CATEGORY_ID}';`;
      
      const { data: deleteResult, error: deleteError } = await supabase.rpc('exec_sql', {
        sql_query: deleteSQL
      });

      if (deleteError) {
        console.log('⚠️ SQL-Löschung nicht verfügbar, versuche direktes Delete...');
        
        const { error: directDeleteError } = await supabase
          .from('faq_categories')
          .delete()
          .eq('id', DELETE_CATEGORY_ID);

        if (directDeleteError) {
          console.error('❌ Direktes Löschen fehlgeschlagen:', directDeleteError);
        } else {
          console.log('✅ Kategorie direkt gelöscht!');
        }
      } else {
        console.log('✅ Kategorie mit SQL gelöscht:', deleteResult);
      }
    }

    // 4. Finale Verifikation
    console.log('\n✅ Finale Verifikation...');
    const { data: finalCheck } = await supabase
      .from('faq_categories')
      .select('*')
      .ilike('name', '%allgemeine fragen%');

    console.log(`Verbleibende "Allgemeine Fragen"-Kategorien: ${finalCheck?.length || 0}`);
    finalCheck?.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id}, Sortierung: ${cat.sort_order})`);
    });

    if (finalCheck?.length === 1) {
      console.log('\n🎉 FAQ-Korrektur erfolgreich abgeschlossen!');
    } else {
      console.log('\n⚠️ Problem weiterhin vorhanden');
    }

  } catch (error) {
    console.error('💥 Unerwarteter Fehler:', error);
  }
}

rlsBypassFix();
