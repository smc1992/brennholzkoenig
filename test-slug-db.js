import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlug() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, slug')
        .eq('id', 11);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Data:', data);
    }
}

checkSlug();
