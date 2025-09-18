const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFAQStatus() {
  console.log('🔍 Aktuelle FAQ-Kategorien:');
  
  try {
    const { data: categories, error } = await supabase
      .from('faq_categories')
      .select('*')
      .order('created_at');
    
    if (error) {
      console.error('❌ Fehler:', error);
      return;
    }
    
    console.log(`📋 Gesamt: ${categories.length} Kategorien`);
    categories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: "${cat.name}", Erstellt: ${cat.created_at}`);
    });
    
    const allgemeineFragen = categories.filter(cat => cat.name === 'Allgemeine Fragen');
    console.log(`\n🔍 "Allgemeine Fragen" Kategorien: ${allgemeineFragen.length}`);
    
    for (const cat of allgemeineFragen) {
      const { data: items, error: itemsError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('category_id', cat.id);
      
      if (!itemsError) {
        console.log(`  - ID: ${cat.id}, Items: ${items.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
  }
}

checkFAQStatus();