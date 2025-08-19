import { NextResponse } from 'next/server';

export function GET() {
  // Einfache Antwort mit Status 200, ohne async/await und ohne Supabase-Abhängigkeit
  // Dieser Endpunkt ist für die Kompatibilität mit älteren Konfigurationen
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
