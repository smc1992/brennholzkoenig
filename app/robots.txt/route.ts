
export const dynamic = 'force-static';

export async function GET() {
  const robots = `User-agent: *
Allow: /

Sitemap: https://kfz-sv-thorsten.com/sitemap.xml`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
