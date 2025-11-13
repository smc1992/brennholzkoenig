#!/usr/bin/env node
/*
  Uploads local hero video MP4 to Supabase Storage bucket 'uploads' at path 'hero/brennholzkoenig-imagevideo.mp4'.
  - Reads env from .env.local
  - Uses SUPABASE_SERVICE_ROLE_KEY if available, otherwise NEXT_PUBLIC_SUPABASE_ANON_KEY
*/

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded env from ${envPath}`);
  } else {
    dotenv.config();
    console.warn('.env.local not found; loading default env');
  }
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Using ANON key. If bucket policies restrict uploads, this may fail.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function main() {
  loadEnv();
  const supabase = getSupabaseClient();

  const localFilePath = path.join(process.cwd(), 'public', 'uploads', 'hero', 'brennholzkoenig-imagevideo.mp4');
  const bucket = 'uploads';
  const storagePath = 'hero/brennholzkoenig-imagevideo.mp4';

  if (!fs.existsSync(localFilePath)) {
    console.error(`Local file not found: ${localFilePath}`);
    process.exit(1);
  }

  const fileStat = fs.statSync(localFilePath);
  console.log(`Uploading ${localFilePath} (${(fileStat.size / (1024*1024)).toFixed(2)} MB) to ${bucket}/${storagePath} ...`);

  const fileBuffer = fs.readFileSync(localFilePath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }

  console.log('Upload successful:', data);

  // Get public URL for verification
  const { data: publicData, error: publicErr } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  if (publicErr) {
    console.warn('Failed to get public URL:', publicErr);
  } else {
    console.log('Public URL:', publicData.publicUrl);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});