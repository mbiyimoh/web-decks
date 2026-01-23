import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { SHARE_PASSWORD_MIN_LENGTH } from '@/lib/session';

const BCRYPT_WORK_FACTOR = 10;
const SLUG_LENGTH = 21;

/**
 * Generate a secure share link slug using nanoid
 * 21 characters = 126 bits of entropy (URL-safe)
 */
export function generateShareSlug(): string {
  return nanoid(SLUG_LENGTH);
}

/**
 * Hash a password using bcrypt
 * Work factor 10 provides ~100ms hashing time
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_WORK_FACTOR);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password meets minimum requirements
 * Throws if invalid
 */
export function validatePassword(password: string): void {
  if (!password || password.length < SHARE_PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${SHARE_PASSWORD_MIN_LENGTH} characters`);
  }
}

/**
 * Build full share URL from slug
 */
export function buildShareUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://33strategies.ai';
  return `${baseUrl}/share/${slug}`;
}

/**
 * Check if a share link is currently locked
 */
export function isLinkLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return lockedUntil > new Date();
}

/**
 * Calculate minutes remaining in lockout
 */
export function getLockoutMinutesRemaining(lockedUntil: Date): number {
  return Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
}
