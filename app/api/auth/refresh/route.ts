/**
 * Token Refresh Endpoint
 *
 * Exchanges a refresh token for a new access token and refresh token pair.
 * Implements refresh token rotation for security.
 *
 * POST /api/auth/refresh
 * Body: { refresh_token: string, client_id?: string }
 * Response: { access_token, refresh_token, token_type, expires_in }
 */

import { NextRequest, NextResponse } from 'next/server';
import { rotateRefreshToken } from '@/lib/oauth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token, client_id } = body;

    // Validate required fields
    if (!refresh_token || typeof refresh_token !== 'string') {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'refresh_token is required',
        },
        { status: 400 }
      );
    }

    // Default to client-portal for first-party apps
    const clientId = client_id || 'client-portal';

    // Rotate refresh token
    const result = await rotateRefreshToken(refresh_token, clientId);

    if (!result.success) {
      // Map error types to OAuth error responses
      const errorResponses: Record<
        string,
        { error: string; description: string; status: number }
      > = {
        invalid: {
          error: 'invalid_grant',
          description: 'Invalid refresh token',
          status: 401,
        },
        expired: {
          error: 'invalid_grant',
          description: 'Refresh token has expired',
          status: 401,
        },
        revoked: {
          error: 'invalid_grant',
          description: 'Refresh token has been revoked',
          status: 401,
        },
        reuse_detected: {
          error: 'invalid_grant',
          description:
            'Token reuse detected. All sessions have been revoked for security.',
          status: 401,
        },
      };

      const errorInfo = errorResponses[result.error!] || {
        error: 'invalid_grant',
        description: 'Token refresh failed',
        status: 401,
      };

      return NextResponse.json(
        { error: errorInfo.error, error_description: errorInfo.description },
        { status: errorInfo.status }
      );
    }

    // Return new token pair
    return NextResponse.json({
      access_token: result.tokens!.accessToken,
      refresh_token: result.tokens!.refreshToken,
      token_type: 'Bearer',
      expires_in: result.tokens!.expiresIn,
    });
  } catch (error) {
    console.error('[token-refresh] Error:', error);

    return NextResponse.json(
      { error: 'server_error', error_description: 'An error occurred' },
      { status: 500 }
    );
  }
}
