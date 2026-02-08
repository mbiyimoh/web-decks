/**
 * JSON Web Key Set (JWKS) Endpoint
 *
 * GET /.well-known/jwks.json
 *
 * Returns the public keys used to verify JWT signatures.
 * External products use this to validate access tokens.
 */

import { NextResponse } from 'next/server';
import { getPublicJWK, areKeysConfigured } from '@/lib/oauth';

export async function GET() {
  if (!areKeysConfigured()) {
    return NextResponse.json(
      {
        error: 'not_configured',
        error_description: 'OAuth keys not configured',
      },
      { status: 503 }
    );
  }

  try {
    const jwk = getPublicJWK();

    return NextResponse.json(
      { keys: [jwk] },
      {
        headers: {
          // Cache for 1 hour, revalidate in background
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[jwks] Error exporting public key:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to export keys' },
      { status: 500 }
    );
  }
}
