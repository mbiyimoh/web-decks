import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware adds security headers and passes pathname for returnTo handling
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Pass the current pathname to layouts for proper returnTo handling
  response.headers.set('x-pathname', request.nextUrl.pathname);

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
