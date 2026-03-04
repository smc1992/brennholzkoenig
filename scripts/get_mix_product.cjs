const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', 'scheitholz-industrieholz-mix-33-cm')
    .single();

  if (error) {
    console.error('Error fetching product:', error);
  } else {
    console.log('Product:', data);
  }
}

getProduct();
