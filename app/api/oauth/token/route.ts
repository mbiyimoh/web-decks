/**
 * OAuth 2.0 Token Endpoint
 *
 * Handles token exchange for authorization codes and refresh tokens.
 *
 * POST /api/oauth/token
 * Body (form-urlencoded or JSON):
 *   grant_type: "authorization_code" | "refresh_token"
 *
 * For authorization_code:
 *   - code: Authorization code
 *   - client_id: Client identifier
 *   - client_secret: Client secret (for confidential clients)
 *   - redirect_uri: Must match original request
 *   - code_verifier: PKCE verifier (if code_challenge was used)
 *
 * For refresh_token:
 *   - refresh_token: The refresh token
 *   - client_id: Client identifier
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTokenPair, rotateRefreshToken } from '@/lib/oauth';
import { checkRateLimit } from '@/lib/redis';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP address (10 requests per minute)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    try {
      const rateLimit = await checkRateLimit(`oauth:token:${ip}`, 10, 60);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'rate_limit_exceeded',
            error_description: 'Too many requests. Try again later.',
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(
                (rateLimit.resetAt.getTime() - Date.now()) / 1000
              ).toString(),
            },
          }
        );
      }
    } catch (error) {
      // Redis unavailable - log and continue (fail open for availability)
      console.warn('[oauth/token] Rate limit check failed:', error);
    }

    // Parse body (support both form-urlencoded and JSON)
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, string>;

    try {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries()) as Record<string, string>;
      } else if (contentType.includes('application/json') || !contentType) {
        body = await request.json();
      } else {
        return NextResponse.json(
          {
            error: 'invalid_request',
            error_description: 'Content-Type must be application/x-www-form-urlencoded or application/json',
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Malformed request body' },
        { status: 400 }
      );
    }

    const grantType = body.grant_type;

    if (grantType === 'authorization_code') {
      return handleAuthorizationCode(body);
    }

    if (grantType === 'refresh_token') {
      return handleRefreshToken(body);
    }

    return NextResponse.json(
      {
        error: 'unsupported_grant_type',
        error_description: 'Supported grant types: authorization_code, refresh_token',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[oauth/token] Error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'An error occurred' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Grant Type Handlers
// ============================================================================

async function handleAuthorizationCode(body: Record<string, string>) {
  const { code, client_id, client_secret, redirect_uri, code_verifier } = body;

  // Validate required parameters
  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'code is required' },
      { status: 400 }
    );
  }

  if (!client_id) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'client_id is required' },
      { status: 400 }
    );
  }

  if (!redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'redirect_uri is required' },
      { status: 400 }
    );
  }

  // Find authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
    include: { client: true },
  });

  if (!authCode) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid authorization code' },
      { status: 400 }
    );
  }

  // Check expiry
  if (authCode.expiresAt < new Date()) {
    // Delete expired code
    await prisma.oAuthAuthorizationCode.delete({ where: { code } });
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code expired' },
      { status: 400 }
    );
  }

  // Validate client_id matches
  if (authCode.clientId !== client_id) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Client mismatch' },
      { status: 400 }
    );
  }

  // Validate redirect_uri matches
  if (authCode.redirectUri !== redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
      { status: 400 }
    );
  }

  // Validate client secret for confidential clients
  if (authCode.client.clientSecret) {
    if (!client_secret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client secret required' },
        { status: 401 }
      );
    }

    const secretValid = await bcrypt.compare(
      client_secret,
      authCode.client.clientSecret
    );
    if (!secretValid) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client secret' },
        { status: 401 }
      );
    }
  } else {
    // Public client (no secret) - PKCE is required
    if (!authCode.codeChallenge) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'PKCE required for public clients' },
        { status: 400 }
      );
    }
  }

  // Validate PKCE if code_challenge was used
  if (authCode.codeChallenge) {
    if (!code_verifier) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'code_verifier required' },
        { status: 400 }
      );
    }

    // Compute expected challenge from verifier
    const expectedChallenge = crypto
      .createHash('sha256')
      .update(code_verifier)
      .digest('base64url');

    if (expectedChallenge !== authCode.codeChallenge) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid code verifier' },
        { status: 400 }
      );
    }
  }

  // Use transaction to prevent code reuse race condition
  // Delete code BEFORE creating tokens (single-use enforcement)
  console.log('[DEBUG oauth/token] Starting token creation transaction for user:', authCode.userId);
  try {
    const tokens = await prisma.$transaction(async (tx) => {
      console.log('[DEBUG oauth/token] Deleting authorization code...');
      // Delete authorization code first (prevents reuse if token creation fails)
      await tx.oAuthAuthorizationCode.delete({ where: { code } });
      console.log('[DEBUG oauth/token] Authorization code deleted');

      console.log('[DEBUG oauth/token] Creating token pair...');
      // Create token pair
      return createTokenPair(authCode.userId, client_id, authCode.scope);
    });

    console.log('[DEBUG oauth/token] Transaction completed successfully');
    return NextResponse.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
      expires_in: tokens.expiresIn,
      scope: authCode.scope,
    });
  } catch (error) {
    // If transaction fails, code is already deleted - can't be reused
    console.error('[oauth/token] Token creation failed:', error);
    console.error('[oauth/token] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[oauth/token] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[oauth/token] Error stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: 'server_error', error_description: 'Token creation failed' },
      { status: 500 }
    );
  }
}

async function handleRefreshToken(body: Record<string, string>) {
  const { refresh_token, client_id } = body;

  if (!refresh_token) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'refresh_token is required' },
      { status: 400 }
    );
  }

  if (!client_id) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'client_id is required' },
      { status: 400 }
    );
  }

  const result = await rotateRefreshToken(refresh_token, client_id);

  if (!result.success) {
    // Map error types
    const errorMessages: Record<string, string> = {
      invalid: 'Invalid refresh token',
      expired: 'Refresh token has expired',
      revoked: 'Refresh token has been revoked',
      reuse_detected: 'Token reuse detected. All sessions revoked for security.',
    };

    return NextResponse.json(
      {
        error: 'invalid_grant',
        error_description: errorMessages[result.error!] || 'Token refresh failed',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    access_token: result.tokens!.accessToken,
    refresh_token: result.tokens!.refreshToken,
    token_type: 'Bearer',
    expires_in: result.tokens!.expiresIn,
  });
}
