import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware adds security headers - auth is handled in page components
// Note: request param required by Next.js middleware signature
export function middleware(request: NextRequest) {
  void request; // Required by Next.js middleware API
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
