const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUnusedImages() {
    // 1. Get all files in products bucket
    const { data: files, error: filesError } = await supabase.storage.from('products').list();
    if (filesError) {
        console.error('Error fetching files:', filesError);
        return;
    }

    const fileNames = files.map(f => f.name).filter(name => name !== '.emptyFolderPlaceholder' && name !== 'products');
    console.log(`Found ${fileNames.length} total files in bucket.`);

    // 2. Get all active products
    const { data: products, error: productsError } = await supabase.from('products').select('image_url, additional_images');
    if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
    }

    // 3. Collect all used URLs
    const usedUrls = new Set();
    for (const p of products) {
        if (p.image_url) usedUrls.add(p.image_url);
        if (p.additional_images && Array.isArray(p.additional_images)) {
            p.additional_images.forEach(url => usedUrls.add(url));
        }
    }

    // 4. Check which files are not in used URLs
    const unusedFiles = [];
    for (const fileName of fileNames) {
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        const publicUrl = data.publicUrl;
        if (!usedUrls.has(publicUrl)) {
            unusedFiles.push(publicUrl);
        }
    }

    console.log(`Found ${unusedFiles.length} unused images:`);
    unusedFiles.forEach(url => console.log(url));
}

findUnusedImages();
