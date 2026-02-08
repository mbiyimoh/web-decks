/**
 * Portal Login Endpoint (Token-Issuing)
 *
 * Issues JWT access tokens and refresh tokens for portal authentication.
 * This is the new token-based auth flow alongside the existing iron-session flow.
 *
 * POST /api/auth/portal-login
 * Body: { clientId: string, password: string }
 * Response: { access_token, refresh_token, token_type, expires_in }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyClientPassword } from '@/lib/clients';
import { createTokenPair, DEFAULT_PORTAL_SCOPES } from '@/lib/oauth';
import { ensureClientUser } from '@/lib/client-user-sync';
import { getCredentialByClientId } from '@/lib/client-auth-db';
import { checkRateLimit } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    try {
      const rateLimit = await checkRateLimit(`portal-login:${clientIp}`, 10, 60);
      if (!rateLimit.allowed) {
        const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: 'rate_limit_exceeded',
            error_description: 'Too many login attempts. Please try again later.',
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          }
        );
      }
    } catch {
      // Redis unavailable - continue without rate limiting
      console.warn('[portal-login] Rate limiting unavailable (Redis down)');
    }

    const { clientId, password } = await request.json();

    // Validate required fields
    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'clientId is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'password is required' },
        { status: 400 }
      );
    }

    // Verify credentials
    const result = await verifyClientPassword(clientId, password);

    if (!result.success) {
      // Use standard OAuth error format
      if (result.error?.includes('locked')) {
        return NextResponse.json(
          {
            error: 'access_denied',
            error_description: result.error,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get credential info for user email
    const credential = await getCredentialByClientId(clientId);
    const userEmail =
      credential?.email || `${clientId.toLowerCase()}@client.33strategies.ai`;

    // Ensure user exists in database
    const user = await ensureClientUser(userEmail, clientId);

    // Create token pair
    const tokens = await createTokenPair(
      user.id,
      'client-portal', // First-party client identifier
      DEFAULT_PORTAL_SCOPES
    );

    // Return OAuth 2.0 token response format
    return NextResponse.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
      expires_in: tokens.expiresIn,
      scope: DEFAULT_PORTAL_SCOPES,
    });
  } catch (error) {
    console.error('[portal-login] Error:', error);

    // Don't expose internal errors
    return NextResponse.json(
      { error: 'server_error', error_description: 'An error occurred' },
      { status: 500 }
    );
  }
}
