/**
 * OAuth 2.0 Token Revocation Endpoint (RFC 7009)
 *
 * Revokes access or refresh tokens.
 *
 * POST /api/oauth/revoke
 * Body:
 *   - token: The token to revoke
 *   - token_type_hint: Optional hint ("access_token" or "refresh_token")
 *   - client_id: Client identifier
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAccessToken, verifyRefreshToken } from '@/lib/oauth';
import { blacklistToken } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Parse body
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, string>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      body = await request.json();
    }

    const { token, token_type_hint, client_id } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'token is required' },
        { status: 400 }
      );
    }

    if (!client_id) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'client_id is required' },
        { status: 400 }
      );
    }

    // Try to determine token type and revoke accordingly
    let revoked = false;

    // Try as access token first (unless hint says refresh)
    if (token_type_hint !== 'refresh_token') {
      const accessPayload = await validateAccessToken(token);
      if (accessPayload && accessPayload.client_id === client_id) {
        // Blacklist the access token for its remaining lifetime
        if (accessPayload.jti && accessPayload.exp) {
          const ttl = accessPayload.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await blacklistToken(accessPayload.jti, ttl);
            revoked = true;
          }
        }
      }
    }

    // Try as refresh token (if not already revoked or hint says refresh)
    if (!revoked) {
      // Find matching refresh tokens for this client
      const candidates = await prisma.oAuthRefreshToken.findMany({
        where: {
          clientId: client_id,
          revoked: false,
        },
      });

      for (const candidate of candidates) {
        const isMatch = await verifyRefreshToken(token, candidate.tokenHash);
        if (isMatch) {
          // Revoke the entire token family for security
          await prisma.oAuthRefreshToken.updateMany({
            where: { tokenFamilyId: candidate.tokenFamilyId },
            data: { revoked: true },
          });
          revoked = true;
          break;
        }
      }
    }

    // RFC 7009 requires 200 OK even if token was invalid
    // (to prevent token enumeration)
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[oauth/revoke] Error:', error);

    // Still return 200 to prevent information leakage
    return new NextResponse(null, { status: 200 });
  }
}
