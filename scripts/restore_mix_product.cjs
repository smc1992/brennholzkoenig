const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreProduct() {
  const newProduct = {
    name: 'Scheitholz - Industrieholz Mix 33 cm',
    category: 'Mischholz',
    description: 'Eine wirtschaftliche Mischung aus hochwertigem Scheitholz und Industrieholz mit einer Scheitlänge von 33 cm.',
    price: 90.00,
    unit: 'pro SRM',
    stock_quantity: 100,
    min_stock_level: 10,
    image_url: 'https://images.unsplash.com/photo-1574697275065-2ebad8065099?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    wood_type: 'Diverse',
    size: '33cm',
    in_stock: true,
    is_active: true,
    slug: 'scheitholz-industrieholz-mix-33-cm',
    features: [
      'Länge: ca. 33cm',
      'Mix aus Hart- und Weichholz',
      'Luftgetrocknet, gute Brenneigenschaften',
      'Ideal als günstiges Heizmaterial'
    ]
  };

  const { data, error } = await supabase
    .from('products')
    .insert([newProduct])
    .select();

  if (error) {
    console.error('Error restoring product:', error);
  } else {
    console.log('Successfully restored product:', data);
  }
}

restoreProduct();
