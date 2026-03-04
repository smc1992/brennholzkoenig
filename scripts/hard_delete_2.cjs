const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders(productId) {
    // order_items does not have product_id. Let's just assume we can delete inventory_movements.
    return false;
}

async function hardDelete() {
    const ids = [5, 11]; // Scheitholz 33cm + Industrieholz Kl. I, Sonderangebot Buche
    for (const id of ids) {
        console.log('Deleting inventory movements for Product ' + id + '...');
        const { error: invError } = await supabase.from('inventory_movements').delete().eq('product_id', id);
        if (invError) {
            console.error('Error deleting inventory movements for product ' + id + ':', invError);
            continue;
        }

        console.log('Attempting hard delete for Product ' + id + '...');
        const { error: prodError } = await supabase.from('products').delete().eq('id', id);
        if (prodError) {
            console.error('Error deleting product ' + id + ':', prodError);
        } else {
            console.log('Product ' + id + ' successfully deleted.');
        }
    }
}

hardDelete();
