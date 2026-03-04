
export const dynamic = 'force-static';

export async function GET() {
  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icon-192x192.png"/>
      <TileColor>#C04020</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

  return new Response(browserConfig, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
