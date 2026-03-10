const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFAQs() {
    const slugsToCheck = ['kassel', 'voehl'];

    const { data: cities, error } = await supabase
        .from('city_pages')
        .select('slug, city_name, local_faqs, hero_title, hero_subtitle')
        .in('slug', slugsToCheck);

    if (error) {
        console.error("Error:", error);
        return;
    }

    cities.forEach(city => {
        console.log(`\n================= ${city.city_name} (${city.slug}) =================`);
        console.log(`[Hero Title]:`, city.hero_title);
        console.log(`[Hero Subtitle]:`, city.hero_subtitle);
        console.log(`\n[FAQs]:`);
        console.log(JSON.stringify(city.local_faqs, null, 2));
    });
}

checkFAQs();
