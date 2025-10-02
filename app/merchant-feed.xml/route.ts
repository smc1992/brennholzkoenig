import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  // Prefer server-side envs; fall back to public envs if not set
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not configured for merchant feed');
    return null;
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function xmlEscape(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://brennholz-koenig.de';
  const supabase = getSupabaseClient();

  let products: any[] = [];
  if (supabase) {
    try {
      const selectCols = 'id, slug, name, description, price, image_url, category, stock_quantity, in_stock, availability, brand, updated_at, is_active';
      const { data } = await supabase
        .from('products')
        .select(selectCols)
        .eq('is_active', true);
      products = data || [];

      // Optional sanity filter: positive price
      products = products.filter((p: any) => Number(p.price || 0) > 0);
    } catch (error) {
      console.error('Error loading products for merchant feed:', error);
    }
  }

  const nowIso = new Date().toISOString();
  const channelTitle = 'Brennholz König Produktfeed';
  const channelDesc = 'Produktdaten für Google Merchant Center';

  const rssHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`;
  const channelOpen = `\n  <channel>\n    <title>${xmlEscape(channelTitle)}</title>\n    <link>${baseUrl}</link>\n    <description>${xmlEscape(channelDesc)}</description>\n    <lastBuildDate>${nowIso}</lastBuildDate>`;

  const itemsXml = (products || []).map((p) => {
    const id = String(p.id || '').trim();
    const title = p.name ? String(p.name) : 'Produkt';
    const description = p.description ? String(p.description) : '';
    const slug = String(p.slug || id);
    const link = `${baseUrl}/shop/${slug}`;
    const imageLink = p.image_url?.startsWith('http') ? p.image_url : `${baseUrl}${p.image_url || '/images/brennholz-hero.jpg'}`;
    const priceNumber = Number(p.price || 0).toFixed(2);
    const price = `${priceNumber} EUR`;
    const inStock = (p.in_stock === true) || (Number(p.stock_quantity || 0) > 0) || (String(p.availability || '').toLowerCase() === 'in_stock');
    const availability = inStock ? 'in stock' : 'out of stock';
    const brand = p.brand ? String(p.brand) : 'Brennholz König';
    const condition = 'new';
    const googleCategory = 'Home & Garden > Household Supplies';

    return `\n    <item>
      <g:id>${xmlEscape(id)}</g:id>
      <title>${xmlEscape(title)}</title>
      <link>${xmlEscape(link)}</link>
      <description>${xmlEscape(description)}</description>
      <g:price>${xmlEscape(price)}</g:price>
      <g:condition>${condition}</g:condition>
      <g:availability>${availability}</g:availability>
      <g:image_link>${xmlEscape(imageLink)}</g:image_link>
      <g:brand>${xmlEscape(brand)}</g:brand>
      <g:google_product_category>${xmlEscape(googleCategory)}</g:google_product_category>
    </item>`;
  }).join('');

  const channelClose = `\n  </channel>`;
  const rssClose = `\n</rss>`;

  const xml = rssHeader + channelOpen + itemsXml + channelClose + rssClose;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}