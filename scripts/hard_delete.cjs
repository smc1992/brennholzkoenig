const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders(productId) {
    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('product_id', productId);
    if (error) {
        console.error('Error checking orders for product ' + productId + ':', error);
        return false;
    }
    return data && data.length > 0;
}

async function hardDelete() {
    const ids = [5, 11]; // Scheitholz 33cm + Industrieholz Kl. I, Sonderangebot Buche
    for (const id of ids) {
        const hasOrders = await checkOrders(id);
        if (hasOrders) {
            console.log('Product ' + id + ' has orders. Cannot hard delete. It will remain soft-deleted.');
        } else {
            console.log('No orders for Product ' + id + '. Attempting hard delete...');
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
                console.error('Error deleting product ' + id + ':', error);
            } else {
                console.log('Product ' + id + ' successfully deleted.');
            }
        }
    }
}

hardDelete();
