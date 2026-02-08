/**
 * Companion API Middleware
 *
 * OAuth token validation and scope checking for Companion API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAccessToken, type AccessTokenPayload } from '@/lib/oauth/tokens';
import { checkRateLimit } from '@/lib/redis';

// Scope requirements per endpoint pattern
const ENDPOINT_SCOPES: Record<string, string[]> = {
  '/api/companion/synthesis/base': ['read:synthesis', 'read:profile'],
  '/api/companion/profile/index': ['read:profile'],
  '/api/companion/profile/section': ['read:profile'],
  '/api/companion/profile/search': ['read:profile', 'search:profile'],
  '/api/companion/cache/validate': ['read:profile'],
};

export interface CompanionAuthResult {
  success: true;
  userId: string;
  clientId: string;
  scopes: string[];
}

export interface CompanionAuthError {
  success: false;
  error: string;
  status: number;
}

export type CompanionAuth = CompanionAuthResult | CompanionAuthError;

/**
 * Validate OAuth token and check scopes for Companion API.
 */
export async function validateCompanionAuth(
  request: NextRequest,
  endpoint: string
): Promise<CompanionAuth> {
  // Extract Bearer token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header',
      status: 401,
    };
  }

  const token = authHeader.slice(7);

  // Validate token
  let payload: AccessTokenPayload | null;
  try {
    payload = await validateAccessToken(token);
  } catch (error) {
    // Log error for debugging but return generic message to client
    console.error('[Companion Auth] Token validation error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Token validation failed',
      status: 401,
    };
  }

  if (!payload) {
    return {
      success: false,
      error: 'Invalid or expired token',
      status: 401,
    };
  }

  // Check scopes
  const requiredScopes = getRequiredScopes(endpoint);
  const tokenScopes = payload.scope.split(' ');

  const hasRequiredScope = requiredScopes.some((scope) =>
    tokenScopes.includes(scope)
  );

  if (!hasRequiredScope) {
    return {
      success: false,
      error: `Insufficient scope. Required: ${requiredScopes.join(' or ')}`,
      status: 403,
    };
  }

  // Rate limit by client_id (100 requests per minute per client)
  try {
    const rateLimit = await checkRateLimit(
      `companion:${payload.client_id}`,
      100,
      60
    );
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded. Try again later.',
        status: 429,
      };
    }
  } catch (error) {
    // Redis unavailable - log and continue (fail open for availability)
    console.warn('[Companion Auth] Rate limit check failed:', error);
  }

  return {
    success: true,
    userId: payload.sub,
    clientId: payload.client_id,
    scopes: tokenScopes,
  };
}

/**
 * Get required scopes for an endpoint.
 */
function getRequiredScopes(endpoint: string): string[] {
  // Try exact match first
  if (ENDPOINT_SCOPES[endpoint]) {
    return ENDPOINT_SCOPES[endpoint];
  }

  // Try prefix match for dynamic routes
  for (const [pattern, scopes] of Object.entries(ENDPOINT_SCOPES)) {
    if (endpoint.startsWith(pattern)) {
      return scopes;
    }
  }

  // Default to read:profile
  return ['read:profile'];
}

/**
 * Create error response for failed auth.
 */
export function createAuthErrorResponse(auth: CompanionAuthError): NextResponse {
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}

