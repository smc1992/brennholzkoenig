
export async function GET() {
  return new Response(JSON.stringify({ error: 'PWA functionality has been disabled' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
