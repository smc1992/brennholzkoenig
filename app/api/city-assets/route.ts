import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { city_slug, section, image_url } = body || {};

    if (!city_slug || !section || !image_url) {
      return NextResponse.json({ error: 'city_slug, section und image_url sind erforderlich' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    const res = await fetch(image_url);
    if (!res.ok) {
      throw new Error(`Bild-Download fehlgeschlagen: ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const fileName = `city-images/${city_slug}/${section}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from('media')
      .upload(fileName, buffer, { contentType, upsert: false, cacheControl: '3600' });
    if (uploadError) {
      throw new Error(`Upload-Fehler: ${uploadError.message}`);
    }

    const { data: urlData } = admin.storage.from('media').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    return NextResponse.json({ success: true, publicUrl, path: fileName });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}