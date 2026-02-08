/**
 * Unified Authentication Helper
 *
 * Supports both token-based and session-based authentication during migration.
 * Token auth is checked first, then falls back to iron-session.
 *
 * Usage:
 *   const auth = await getAuth(request);
 *   if (!auth.authenticated) { redirect('/login'); }
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SessionData, getSessionOptions } from '@/lib/session';
import { getTokenAuth, AccessTokenPayload } from '@/lib/oauth';
import { getCredentialByClientId } from '@/lib/client-auth-db';

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  authenticated: boolean;
  method: 'token' | 'session' | 'none';
  userId?: string;
  clientId?: string;
  email?: string;
  scopes?: string[];
}

// ============================================================================
// Auth Check Functions
// ============================================================================

/**
 * Check authentication using both token and session methods.
 *
 * @param request - Optional NextRequest for token extraction
 * @returns AuthResult with authentication status and user info
 *
 * @example Server Component (session only):
 * const auth = await getAuth();
 *
 * @example API Route (token + session):
 * export async function GET(request: NextRequest) {
 *   const auth = await getAuth(request);
 * }
 */
export async function getAuth(request?: NextRequest): Promise<AuthResult> {
  // Try token auth first (if request provided)
  if (request) {
    const tokenPayload = await getTokenAuth(request);
    if (tokenPayload) {
      return {
        authenticated: true,
        method: 'token',
        userId: tokenPayload.sub,
        clientId: tokenPayload.client_id,
        scopes: tokenPayload.scope.split(' '),
      };
    }
  }

  // Fall back to iron-session
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions()
    );

    // Check for client portal session
    if (session.isLoggedIn && session.clientId) {
      // Get email from credential if available
      const credential = await getCredentialByClientId(session.clientId);

      return {
        authenticated: true,
        method: 'session',
        userId: session.userId,
        clientId: session.clientId,
        email: session.userEmail || credential?.email,
      };
    }

    // Check for strategist session
    if (session.isLoggedIn && session.strategistId) {
      return {
        authenticated: true,
        method: 'session',
        clientId: session.strategistId,
      };
    }
  } catch {
    // Session not available (e.g., in edge runtime)
  }

  return { authenticated: false, method: 'none' };
}

/**
 * Require authentication - throws if not authenticated.
 * Use in API routes where auth is mandatory.
 *
 * @throws Error if not authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<AuthResult> {
  const auth = await getAuth(request);
  if (!auth.authenticated) {
    throw new Error('Authentication required');
  }
  return auth;
}

/**
 * Check if authenticated user has a specific scope.
 * Only applicable for token auth.
 */
export function hasScope(auth: AuthResult, scope: string): boolean {
  if (!auth.authenticated || !auth.scopes) {
    return false;
  }
  return auth.scopes.includes(scope);
}

/**
 * Check if authenticated user has all specified scopes.
 */
export function hasAllScopes(auth: AuthResult, scopes: string[]): boolean {
  return scopes.every((scope) => hasScope(auth, scope));
}

/**
 * Check if authenticated user has any of the specified scopes.
 */
export function hasAnyScope(auth: AuthResult, scopes: string[]): boolean {
  return scopes.some((scope) => hasScope(auth, scope));
}

// ============================================================================
// Portal-Specific Helpers
// ============================================================================

/**
 * Get auth for a specific client portal.
 * Returns authenticated result only if user has access to the specified client.
 */
export async function getPortalAuth(
  request: NextRequest | undefined,
  requiredClientId: string
): Promise<AuthResult> {
  const auth = await getAuth(request);

  if (!auth.authenticated) {
    return { authenticated: false, method: 'none' };
  }

  // Check if user has access to this portal
  if (auth.clientId?.toLowerCase() !== requiredClientId.toLowerCase()) {
    return { authenticated: false, method: 'none' };
  }

  return auth;
}
