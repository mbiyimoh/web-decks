/**
 * OAuth 2.0 UserInfo Endpoint
 *
 * Returns user information for the authenticated token.
 * Requires valid access token with read:profile scope.
 *
 * GET /api/oauth/userinfo
 * Authorization: Bearer <access_token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTokenAuth, AuthenticatedRequest } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthenticatedRequest) {
  const { sub: userId, client_id, scope } = request.auth;

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      userType: true,
      clientPortalId: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Build response based on granted scopes
  const scopes = scope.split(' ');
  const response: Record<string, unknown> = {
    sub: user.id, // Subject identifier
  };

  // Basic profile info (always included with read:profile)
  if (scopes.includes('read:profile')) {
    response.email = user.email;
    response.name = user.name;
    response.picture = user.image;
    response.user_type = user.userType;
    response.client_portal_id = user.clientPortalId;
    response.created_at = user.createdAt.toISOString();
  }

  // Include client that made the request
  response.client_id = client_id;

  return NextResponse.json(response);
}

export const GET = withTokenAuth(handler, ['read:profile']);
