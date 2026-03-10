require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const { data: pages } = await supabase.from('city_pages').select('*').eq('slug', 'fulda').limit(1);
    if (!pages || pages.length === 0) return console.log('not found');
    const fulda = pages[0];
    console.log('Before update:', fulda.city_image_url);

    const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Fulda_Dom_4.jpg';
    const { error } = await supabase.from('city_pages').update({ city_image_url: testUrl }).eq('id', fulda.id);

    if (error) {
        console.log('Update Error:', error);
        return;
    }

    const { data: updated } = await supabase.from('city_pages').select('*').eq('id', fulda.id).limit(1);
    console.log('After update:', updated[0].city_image_url);
}

testUpdate();
