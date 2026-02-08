/**
 * Refresh Token Rotation with Reuse Detection
 *
 * Implements OAuth 2.0 refresh token rotation:
 * - Each refresh generates a new token pair
 * - Old tokens are marked as "replaced" (not immediately revoked)
 * - If a replaced token is reused, the entire token family is revoked
 * - This detects token theft and limits damage
 */

import { prisma } from '@/lib/prisma';
import {
  generateRefreshToken,
  verifyRefreshToken,
  generateAccessToken,
  TOKEN_EXPIRY,
} from './tokens';

// ============================================================================
// Types
// ============================================================================

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface RotationResult {
  success: boolean;
  tokens?: TokenPair;
  error?: 'invalid' | 'expired' | 'revoked' | 'reuse_detected';
}

// ============================================================================
// Token Pair Creation
// ============================================================================

/**
 * Create initial token pair for new login.
 */
export async function createTokenPair(
  userId: string,
  clientId: string,
  scope: string
): Promise<TokenPair> {
  const accessToken = await generateAccessToken(userId, clientId, scope);
  const refreshData = await generateRefreshToken();

  // Store refresh token in database
  await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: refreshData.hash,
      clientId,
      userId,
      scope,
      expiresAt: refreshData.expiresAt,
      tokenFamilyId: refreshData.familyId,
    },
  });

  return {
    accessToken,
    refreshToken: refreshData.token,
    expiresIn: TOKEN_EXPIRY.accessTokenSeconds,
  };
}

// ============================================================================
// Token Rotation
// ============================================================================

/**
 * Rotate refresh token and return new pair.
 *
 * Security:
 * - Old token is marked as "replaced" (not deleted)
 * - If a replaced token is reused, entire family is revoked
 * - This detects token theft and limits damage
 */
export async function rotateRefreshToken(
  oldToken: string,
  clientId: string
): Promise<RotationResult> {
  // Find all non-revoked tokens for this client and check each
  // (We can't query by token because we only store the hash)
  const candidates = await prisma.oAuthRefreshToken.findMany({
    where: {
      clientId,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  // Find matching token by comparing hashes
  let matchedToken = null;
  for (const candidate of candidates) {
    const isMatch = await verifyRefreshToken(oldToken, candidate.tokenHash);
    if (isMatch) {
      matchedToken = candidate;
      break;
    }
  }

  if (!matchedToken) {
    return { success: false, error: 'invalid' };
  }

  // Check if this token was already rotated (REUSE DETECTION)
  if (matchedToken.replacedBy) {
    // SECURITY ALERT: Token reuse detected!
    // Revoke the entire token family to limit damage from theft
    await prisma.oAuthRefreshToken.updateMany({
      where: { tokenFamilyId: matchedToken.tokenFamilyId },
      data: { revoked: true },
    });

    console.warn(
      `[SECURITY] Refresh token reuse detected for family ${matchedToken.tokenFamilyId}. ` +
        `User: ${matchedToken.userId}, Client: ${clientId}. Entire family revoked.`
    );

    return { success: false, error: 'reuse_detected' };
  }

  // Generate new token pair
  const accessToken = await generateAccessToken(
    matchedToken.userId,
    clientId,
    matchedToken.scope
  );
  const newRefreshData = await generateRefreshToken(matchedToken.tokenFamilyId);

  // Create new refresh token in database
  const newRefreshRecord = await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: newRefreshData.hash,
      clientId,
      userId: matchedToken.userId,
      scope: matchedToken.scope,
      expiresAt: newRefreshData.expiresAt,
      tokenFamilyId: matchedToken.tokenFamilyId, // Same family for tracking
    },
  });

  // Mark old token as replaced (NOT revoked - for reuse detection)
  await prisma.oAuthRefreshToken.update({
    where: { id: matchedToken.id },
    data: { replacedBy: newRefreshRecord.id },
  });

  return {
    success: true,
    tokens: {
      accessToken,
      refreshToken: newRefreshData.token,
      expiresIn: TOKEN_EXPIRY.accessTokenSeconds,
    },
  };
}

// ============================================================================
// Token Revocation
// ============================================================================

/**
 * Revoke all tokens for a user, optionally filtered by client.
 */
export async function revokeTokensForUser(
  userId: string,
  clientId?: string
): Promise<number> {
  const result = await prisma.oAuthRefreshToken.updateMany({
    where: {
      userId,
      ...(clientId && { clientId }),
      revoked: false,
    },
    data: { revoked: true },
  });

  return result.count;
}

/**
 * Revoke all tokens for a specific OAuth client.
 */
export async function revokeTokensForClient(clientId: string): Promise<number> {
  const result = await prisma.oAuthRefreshToken.updateMany({
    where: {
      clientId,
      revoked: false,
    },
    data: { revoked: true },
  });

  return result.count;
}

/**
 * Revoke a specific token family (e.g., when user logs out).
 */
export async function revokeTokenFamily(familyId: string): Promise<number> {
  const result = await prisma.oAuthRefreshToken.updateMany({
    where: {
      tokenFamilyId: familyId,
      revoked: false,
    },
    data: { revoked: true },
  });

  return result.count;
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Delete expired tokens from database.
 * Run periodically (e.g., daily cron job).
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.oAuthRefreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}
