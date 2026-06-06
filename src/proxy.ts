import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Only protect /api/chat — and only when CHAT_API_KEY is set
  const validKey = process.env.CHAT_API_KEY;
  if (!validKey) return NextResponse.next();

  const origin = request.headers.get('origin') ?? '';
  const referer = request.headers.get('referer') ?? '';
  const host = request.nextUrl.host;

  // Allow requests that come from our own domain (browser fetches always send Origin/Referer)
  const isFromSameSite =
    origin.includes(host) ||
    referer.includes(host) ||
    (origin === '' && referer === ''); // allow server-side / health checks

  if (!isFromSameSite) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/chat',
};
