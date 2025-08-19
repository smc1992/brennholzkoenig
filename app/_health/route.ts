import { NextResponse } from 'next/server';

export async function GET() {
  // Einfache Antwort mit Status 200, genau wie in Coolify konfiguriert
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
