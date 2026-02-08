/**
 * GET /api/companion/synthesis/base
 *
 * Returns the cached base synthesis (~800 tokens) for the authenticated user.
 * Supports ETag-based caching via If-None-Match header.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateCompanionAuth,
  createAuthErrorResponse,
} from '@/lib/companion/middleware';
import { getCachedSynthesis } from '@/lib/companion/cache';
import { logAccess } from '@/lib/companion/logging';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/companion/synthesis/base';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Check If-None-Match header for caching
  const ifNoneMatch = request.headers.get('if-none-match');

  // Get cached synthesis
  const result = await getCachedSynthesis(auth.userId);

  if (!result) {
    return NextResponse.json(
      { error: 'No profile found for user' },
      { status: 404 }
    );
  }

  const latencyMs = Date.now() - startTime;

  // Handle ETag match (304 Not Modified)
  if (ifNoneMatch === `"${result.version}"`) {
    // Log access even for 304
    logAccess({
      userId: auth.userId,
      productId: auth.clientId,
      endpoint,
      tokenCount: 0,
      cacheHit: true,
      latencyMs,
    });

    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: `"${result.version}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  // Log access (fire-and-forget)
  logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    tokenCount: result.synthesis._meta.tokenCount,
    cacheHit: result.cacheHit,
    latencyMs,
  });

  // Return synthesis with caching headers
  return NextResponse.json(
    {
      synthesis: result.synthesis,
      cacheHint: 'stable' as const,
      stale: result.stale,
    },
    {
      headers: {
        ETag: `"${result.version}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    }
  );
}
