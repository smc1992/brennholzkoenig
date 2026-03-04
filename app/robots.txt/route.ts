
export const dynamic = 'force-static';

export async function GET() {
  const robots = `User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /test
Disallow: /test-image-manager

User-agent: Googlebot-Image
Allow: /
Disallow: /admin
Disallow: /test
Disallow: /test-image-manager

User-agent: AdsBot-Google
Allow: /
Disallow: /admin
Disallow: /test
Disallow: /test-image-manager

User-agent: Storebot-Google
Allow: /
Disallow: /admin
Disallow: /test
Disallow: /test-image-manager

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /test
Disallow: /test-image-manager

Sitemap: https://brennholz-koenig.de/sitemap.xml`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
