require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Testing city update...');

    // 1. Fetch Fulda ID
    const { data: fulda, error: fetchErr } = await supabase
        .from('city_pages')
        .select('id, city_image_url')
        .eq('slug', 'fulda')
        .single();

    if (fetchErr) {
        console.error('Fetch error:', fetchErr);
        return;
    }

    console.log('Current Fulda:', fulda);

    // 2. Perform update
    const newUrl = 'https://example.com/test_image_' + Date.now() + '.jpg';
    console.log('Updating to:', newUrl);

    const { data: updated, error: updateErr } = await supabase
        .from('city_pages')
        .update({ city_image_url: newUrl })
        .eq('id', fulda.id)
        .select('id, city_image_url')
        .single();

    if (updateErr) {
        console.error('Update error:', updateErr);
    } else {
        console.log('Update result:', updated);
    }
}

run();
