const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Verwende die Umgebungsvariablen aus .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Verwende Anon Key

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Using anon key for public access');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Fehlende Umgebungsvariablen. Prüfe .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateFAQCategories() {
  console.log('🔍 Analysiere FAQ-Kategorien...');
  
  try {
    // 1. Alle Kategorien laden
    const { data: categories, error: categoriesError } = await supabase
      .from('faq_categories')
      .select('*')
      .order('created_at');
    
    if (categoriesError) {
      console.error('❌ Fehler beim Laden der Kategorien:', categoriesError);
      return;
    }
    
    console.log(`📋 Gefundene Kategorien: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: "${cat.name}", Erstellt: ${cat.created_at}`);
    });
    
    // 2. Doppelte "Allgemeine Fragen" Kategorien finden
    const allgemeineFragen = categories.filter(cat => 
      cat.name === 'Allgemeine Fragen'
    );
    
    if (allgemeineFragen.length < 2) {
      console.log('✅ Keine doppelten "Allgemeine Fragen" Kategorien gefunden.');
      return;
    }
    
    console.log(`🔍 Gefunden: ${allgemeineFragen.length} "Allgemeine Fragen" Kategorien`);
    
    // Die älteste Kategorie behalten (erste in der Liste nach created_at sortiert)
    const keepCategory = allgemeineFragen[0];
    const deleteCategories = allgemeineFragen.slice(1);
    
    console.log(`✅ Behalte Kategorie: ID ${keepCategory.id} (erstellt: ${keepCategory.created_at})`);
    console.log(`🗑️ Lösche Kategorien: ${deleteCategories.map(c => `ID ${c.id}`).join(', ')}`);
    
    // 3. Für jede zu löschende Kategorie: Items zur beizubehaltenden Kategorie verschieben
    for (const deleteCategory of deleteCategories) {
      console.log(`\n📦 Verarbeite Kategorie ID ${deleteCategory.id}...`);
      
      // Items dieser Kategorie laden
      const { data: items, error: itemsError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('category_id', deleteCategory.id);
      
      if (itemsError) {
        console.error(`❌ Fehler beim Laden der Items für Kategorie ${deleteCategory.id}:`, itemsError);
        continue;
      }
      
      console.log(`  📝 Gefundene Items: ${items.length}`);
      
      if (items.length > 0) {
        // Items zur beizubehaltenden Kategorie verschieben
        console.log(`  🔄 Verschiebe ${items.length} Items zu Kategorie ID ${keepCategory.id}...`);
        
        const { error: updateError } = await supabase
          .from('faq_items')
          .update({ category_id: keepCategory.id })
          .eq('category_id', deleteCategory.id);
        
        if (updateError) {
          console.error(`  ❌ Fehler beim Verschieben der Items:`, updateError);
          continue;
        }
        
        console.log(`  ✅ ${items.length} Items erfolgreich verschoben`);
      }
      
      // Kategorie löschen
      console.log(`  🗑️ Lösche leere Kategorie ID ${deleteCategory.id}...`);
      
      const { error: deleteError } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', deleteCategory.id);
      
      if (deleteError) {
        console.error(`  ❌ Fehler beim Löschen der Kategorie:`, deleteError);
        continue;
      }
      
      console.log(`  ✅ Kategorie ID ${deleteCategory.id} erfolgreich gelöscht`);
    }
    
    // 4. Finale Verifikation
    console.log('\n🔍 Finale Verifikation...');
    
    const { data: finalCategories, error: finalError } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('name', 'Allgemeine Fragen');
    
    if (finalError) {
      console.error('❌ Fehler bei der finalen Verifikation:', finalError);
      return;
    }
    
    console.log(`📊 Verbleibende "Allgemeine Fragen" Kategorien: ${finalCategories.length}`);
    
    if (finalCategories.length === 1) {
      const { data: finalItems, error: itemsError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('category_id', finalCategories[0].id);
      
      if (!itemsError) {
        console.log(`📝 Items in der verbleibenden Kategorie: ${finalItems.length}`);
        console.log('🎉 FAQ-Kategorien erfolgreich bereinigt!');
      }
    } else {
      console.log('⚠️ Problem: Es sollte genau eine "Allgemeine Fragen" Kategorie geben');
    }
    
  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
  }
}

// Skript ausführen
fixDuplicateFAQCategories();