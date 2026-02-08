/**
 * Database-backed credential verification with rate limiting.
 *
 * Replaces env var password lookups with secure database verification.
 * Implements:
 * - bcrypt password verification
 * - Rate limiting (5 attempts / 15 minutes)
 * - Account lockout
 * - Timing attack mitigation
 */

import { prisma } from './prisma';
import bcrypt from 'bcrypt';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Valid bcrypt hash for timing attack mitigation (hash of random UUID)
// This ensures bcrypt.compare() takes constant time even for non-existent users
const DUMMY_HASH = '$2b$10$K4GHPptXqWy8EsNkDdLVCO6dPwjWvRkXGlvJHNjXJNjXJNjXJNjXa';

export interface VerifyCredentialResult {
  success: boolean;
  error?: 'invalid' | 'locked' | 'inactive';
  credential?: {
    clientId: string;
    email: string;
    displayName: string;
  };
  lockoutRemaining?: number; // seconds remaining until unlock
}

/**
 * Verify a client credential against the database.
 *
 * @param clientId - The client identifier (e.g., "tradeblock")
 * @param password - The plaintext password to verify
 * @returns VerifyCredentialResult with success status and credential info
 */
export async function verifyCredential(
  clientId: string,
  password: string
): Promise<VerifyCredentialResult> {
  const credential = await prisma.clientCredential.findUnique({
    where: { clientId },
  });

  if (!credential) {
    // Timing attack mitigation: still perform hash comparison
    await bcrypt.compare(password, DUMMY_HASH);
    return { success: false, error: 'invalid' };
  }

  if (!credential.isActive) {
    // Still perform bcrypt comparison for timing attack mitigation
    await bcrypt.compare(password, credential.hashedPassword);
    return { success: false, error: 'inactive' };
  }

  // Always perform bcrypt comparison first (constant time for timing attack mitigation)
  const isValid = await bcrypt.compare(password, credential.hashedPassword);

  // Check lockout AFTER bcrypt to prevent timing-based account enumeration
  if (credential.lockedUntil && credential.lockedUntil > new Date()) {
    const remaining = Math.ceil(
      (credential.lockedUntil.getTime() - Date.now()) / 1000
    );
    return { success: false, error: 'locked', lockoutRemaining: remaining };
  }

  if (!isValid) {
    // Use atomic increment to prevent race conditions
    const updated = await prisma.clientCredential.update({
      where: { clientId },
      data: {
        failedAttempts: { increment: 1 },
      },
      select: { failedAttempts: true },
    });

    // Lock if threshold reached
    if (updated.failedAttempts >= LOCKOUT_THRESHOLD) {
      await prisma.clientCredential.update({
        where: { clientId },
        data: {
          lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
        },
      });
    }

    return { success: false, error: 'invalid' };
  }

  // Reset failed attempts on success
  if (credential.failedAttempts > 0 || credential.lockedUntil) {
    await prisma.clientCredential.update({
      where: { clientId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  return {
    success: true,
    credential: {
      clientId: credential.clientId,
      email: credential.email,
      displayName: credential.displayName,
    },
  };
}

/**
 * Get credential info by client ID (non-sensitive fields only).
 */
export async function getCredentialByClientId(clientId: string) {
  return prisma.clientCredential.findUnique({
    where: { clientId },
    select: {
      clientId: true,
      email: true,
      displayName: true,
      isActive: true,
    },
  });
}

/**
 * Unlock a locked account (for admin use).
 */
export async function unlockCredential(clientId: string): Promise<boolean> {
  try {
    await prisma.clientCredential.update({
      where: { clientId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
    return true;
  } catch {
    return false;
  }
}
