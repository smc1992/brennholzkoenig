const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setProductsInactive() {
    const { data, error } = await supabase
        .from('products')
        .update({ is_active: false })
        .in('id', [5, 11])
        .select('id, name, is_active');

    if (error) {
        console.error('Error updating products:', error);
        return;
    }
    console.log('Successfully set products to inactive:', data);
}

setProductsInactive();
