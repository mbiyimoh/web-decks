/**
 * JWT Access Token and Refresh Token Generation/Validation
 *
 * Access tokens: RS256-signed JWTs (15-minute expiry)
 * Refresh tokens: Opaque tokens with bcrypt hash (14-day expiry)
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { getPrivateKey, getPublicKey, areKeysConfigured } from './keys';
import { nanoid } from 'nanoid';
import { isTokenBlacklisted } from '@/lib/redis';

const ISSUER = process.env.NEXTAUTH_URL || 'https://33strategies.ai';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 14;

// ============================================================================
// Types
// ============================================================================

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // User ID
  client_id: string; // OAuth client ID
  scope: string; // Space-separated scopes
  type: 'access';
}

export interface RefreshTokenData {
  token: string; // Opaque token (sent to client)
  hash: string; // bcrypt hash (stored in database)
  familyId: string; // For reuse detection
  expiresAt: Date;
}

// ============================================================================
// Access Token (JWT)
// ============================================================================

/**
 * Generate an RS256-signed JWT access token.
 */
export async function generateAccessToken(
  userId: string,
  clientId: string,
  scope: string
): Promise<string> {
  console.log('[DEBUG generateAccessToken] Checking keys configuration...');
  console.log('[DEBUG generateAccessToken] OAUTH_PRIVATE_KEY set:', !!process.env.OAUTH_PRIVATE_KEY);
  console.log('[DEBUG generateAccessToken] OAUTH_PUBLIC_KEY set:', !!process.env.OAUTH_PUBLIC_KEY);
  console.log('[DEBUG generateAccessToken] areKeysConfigured():', areKeysConfigured());

  if (!areKeysConfigured()) {
    console.error('[DEBUG generateAccessToken] Keys NOT configured!');
    throw new Error('OAuth keys not configured. Set OAUTH_PRIVATE_KEY and OAUTH_PUBLIC_KEY.');
  }

  console.log('[DEBUG generateAccessToken] Getting private key...');
  let privateKey;
  try {
    privateKey = getPrivateKey();
    console.log('[DEBUG generateAccessToken] Private key loaded successfully');
  } catch (error) {
    console.error('[DEBUG generateAccessToken] Failed to load private key:', error);
    throw error;
  }

  console.log('[DEBUG generateAccessToken] Signing JWT...');
  const jwt = await new SignJWT({
    sub: userId,
    client_id: clientId,
    scope,
    type: 'access',
  } as AccessTokenPayload)
    .setProtectedHeader({ alg: 'RS256', kid: 'primary' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(nanoid())
    .sign(privateKey);

  console.log('[DEBUG generateAccessToken] JWT signed successfully');
  return jwt;
}

/**
 * Validate an access token and return its payload.
 * Returns null if invalid, expired, or blacklisted.
 */
export async function validateAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  if (!areKeysConfigured()) {
    console.error('[OAuth] Keys not configured, cannot validate token');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getPublicKey(), {
      issuer: ISSUER,
    });

    // Type check
    if (payload.type !== 'access') {
      return null;
    }

    // Check blacklist (for early revocation)
    if (payload.jti) {
      try {
        const blacklisted = await isTokenBlacklisted(payload.jti);
        if (blacklisted) {
          return null;
        }
      } catch (error) {
        // Redis unavailable - log warning but allow validation to continue
        // Tokens will still expire naturally at 15 minutes
        console.warn('[OAuth] Blacklist check failed (Redis unavailable)');
      }
    }

    return payload as AccessTokenPayload;
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

// ============================================================================
// Refresh Token (Opaque)
// ============================================================================

/**
 * Generate an opaque refresh token with bcrypt hash for storage.
 */
export async function generateRefreshToken(
  familyId?: string
): Promise<RefreshTokenData> {
  const bcrypt = await import('bcrypt');
  const token = nanoid(32);
  const hash = await bcrypt.hash(token, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  return {
    token,
    hash,
    familyId: familyId || nanoid(),
    expiresAt,
  };
}

/**
 * Verify a refresh token against its stored hash.
 */
export async function verifyRefreshToken(
  token: string,
  storedHash: string
): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(token, storedHash);
}

// ============================================================================
// Token Expiry Constants (exported for client use)
// ============================================================================

export const TOKEN_EXPIRY = {
  accessTokenSeconds: 15 * 60, // 15 minutes
  refreshTokenDays: REFRESH_TOKEN_EXPIRY_DAYS,
};
