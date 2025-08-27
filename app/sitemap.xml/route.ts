
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://brennholz-koenig.de';
  
  // Statische Seiten
  const staticUrls = [
    { url: '', priority: '1.0', changefreq: 'weekly' },
    { url: '/ueber-uns', priority: '0.8', changefreq: 'monthly' },
    { url: '/kontakt', priority: '0.8', changefreq: 'monthly' },
    { url: '/shop', priority: '0.9', changefreq: 'daily' },
    { url: '/blog', priority: '0.9', changefreq: 'daily' },
    { url: '/impressum', priority: '0.3', changefreq: 'yearly' },
    { url: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
    { url: '/agb', priority: '0.3', changefreq: 'yearly' },
    { url: '/widerrufsrecht', priority: '0.3', changefreq: 'yearly' }
  ];

  // Blog-Artikel laden
  let blogUrls: any[] = [];
  try {
    const { data: blogPosts } = await supabase
      .from('page_contents')
      .select('slug, updated_at')
      .eq('content_type', 'blog_post')
      .eq('status', 'published')
      .eq('is_active', true);

    if (blogPosts) {
      blogUrls = blogPosts.map(post => ({
        url: `/blog/${String(post.slug || '')}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: new Date(String(post.updated_at || new Date())).toISOString().split('T')[0]
      }));
    }
  } catch (error) {
    console.error('Error loading blog posts for sitemap:', error);
  }

  // Produkte laden
  let productUrls: any[] = [];
  try {
    const { data: products } = await supabase
      .from('page_contents')
      .select('slug, updated_at')
      .eq('content_type', 'product')
      .eq('status', 'published')
      .eq('is_active', true);

    if (products) {
      productUrls = products.map(product => ({
        url: `/shop/${String(product.slug || '')}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: new Date(String(product.updated_at || new Date())).toISOString().split('T')[0]
      }));
    }
  } catch (error) {
    console.error('Error loading products for sitemap:', error);
  }

  // Alle URLs kombinieren
  const allUrls = [...staticUrls, ...blogUrls, ...productUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(item => `  <url>
    <loc>${baseUrl}${item.url}</loc>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>${item.lastmod ? `
    <lastmod>${item.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
