/**
 * OAuth Token Validation Middleware
 *
 * Extracts and validates Bearer tokens from Authorization header.
 * Provides both wrapper and helper patterns for protected routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAccessToken, AccessTokenPayload } from './tokens';

// ============================================================================
// Types
// ============================================================================

export interface AuthenticatedRequest extends NextRequest {
  auth: AccessTokenPayload;
}

// ============================================================================
// Token Extraction
// ============================================================================

/**
 * Extract Bearer token from Authorization header.
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// ============================================================================
// Middleware Wrapper
// ============================================================================

/**
 * Wrapper for protected route handlers.
 * Validates token and checks required scopes before calling handler.
 *
 * @example
 * export const GET = withTokenAuth(
 *   async (req) => {
 *     const userId = req.auth.sub;
 *     // ... handler logic
 *   },
 *   ['read:profile']
 * );
 */
export function withTokenAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredScopes?: string[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = extractBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'missing_authorization', error_description: 'Authorization header required' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="33strategies.ai"',
          },
        }
      );
    }

    const payload = await validateAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Invalid or expired token' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="33strategies.ai", error="invalid_token"',
          },
        }
      );
    }

    // Check required scopes
    if (requiredScopes && requiredScopes.length > 0) {
      const tokenScopes = payload.scope.split(' ');
      const hasAllScopes = requiredScopes.every((scope) =>
        tokenScopes.includes(scope)
      );

      if (!hasAllScopes) {
        return NextResponse.json(
          {
            error: 'insufficient_scope',
            error_description: 'Token does not have required scopes',
            required_scopes: requiredScopes,
          },
          {
            status: 403,
            headers: {
              'WWW-Authenticate': `Bearer realm="33strategies.ai", error="insufficient_scope", scope="${requiredScopes.join(' ')}"`,
            },
          }
        );
      }
    }

    // Attach auth payload to request
    (request as AuthenticatedRequest).auth = payload;

    return handler(request as AuthenticatedRequest);
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get token auth from request (for use in route handlers).
 * Returns null if no valid token present.
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const auth = await getTokenAuth(request);
 *   if (!auth) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // ... handler logic
 * }
 */
export async function getTokenAuth(
  request: NextRequest
): Promise<AccessTokenPayload | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  return validateAccessToken(token);
}

/**
 * Require specific scopes from a token payload.
 * Returns an error response if scopes are insufficient.
 *
 * @example
 * const auth = await getTokenAuth(request);
 * const scopeError = requireScopes(auth, ['read:profile', 'write:profile']);
 * if (scopeError) return scopeError;
 */
export function requireScopes(
  auth: AccessTokenPayload | null,
  requiredScopes: string[]
): NextResponse | null {
  if (!auth) {
    return NextResponse.json(
      { error: 'unauthorized', error_description: 'Authentication required' },
      { status: 401 }
    );
  }

  const tokenScopes = auth.scope.split(' ');
  const hasAllScopes = requiredScopes.every((scope) =>
    tokenScopes.includes(scope)
  );

  if (!hasAllScopes) {
    return NextResponse.json(
      {
        error: 'insufficient_scope',
        error_description: 'Token does not have required scopes',
        required_scopes: requiredScopes,
        token_scopes: tokenScopes,
      },
      { status: 403 }
    );
  }

  return null;
}
