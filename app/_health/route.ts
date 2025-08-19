import { NextResponse } from 'next/server';

export function GET() {
  // Einfache Antwort mit Status 200, ohne async/await und ohne Supabase-Abhängigkeit
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
