import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { SHARE_PASSWORD_MIN_LENGTH } from '@/lib/session';

const BCRYPT_WORK_FACTOR = 10;
const RANDOM_ID_LENGTH = 8;
const ARTIFACT_NAME_MAX_LENGTH = 20;

/**
 * Convert a title to URL-friendly slug
 * "The 120-Day Sprint" -> "the-120-day-sprint"
 */
function slugify(text: string, maxLength: number = ARTIFACT_NAME_MAX_LENGTH): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Trim leading/trailing hyphens
    .slice(0, maxLength)          // Truncate to max length
    .replace(/-+$/, '');          // Remove trailing hyphen if truncated mid-word
}

/**
 * Generate a readable share link slug
 * Format: [client]-artifacts/[artifact-name]/[random-id]
 * Example: tradeblock-artifacts/the-120-day-sprint/x7k9m2p3
 */
export function generateShareSlug(clientId: string, artifactTitle: string): string {
  const clientSlug = slugify(clientId, 50);  // Client names are short, allow more chars
  const artifactSlug = slugify(artifactTitle, ARTIFACT_NAME_MAX_LENGTH);
  const randomId = nanoid(RANDOM_ID_LENGTH);

  return `${clientSlug}-artifacts/${artifactSlug}/${randomId}`;
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
