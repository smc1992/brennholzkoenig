const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('Error fetching buckets:', bucketsError);
    return;
  }
  
  console.log('Buckets:', buckets.map(b => b.name));

  for (const bucket of buckets) {
    console.log(`\nContents of bucket '${bucket.name}':`);
    const { data: files, error: filesError } = await supabase.storage.from(bucket.name).list();
    if (filesError) {
        console.error(`Error fetching files for ${bucket.name}:`, filesError);
    } else {
        console.log(files.map(f => f.name));
    }
  }
}

checkStorage();
