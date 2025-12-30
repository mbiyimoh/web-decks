/**
 * Email validation for learning platform access
 *
 * Access granted if:
 * 1. Email domain is @33strategies.ai, OR
 * 2. Email is in the static allowlist
 */

// Allowed email domain
const ALLOWED_DOMAIN = '33strategies.ai';

// Static allowlist for external users (clients, contractors)
// Edit this array directly to add/remove allowed emails
const EMAIL_ALLOWLIST: readonly string[] = [
  // 'contractor@example.com',
  // 'client@theircompany.com',
] as const;

export function isEmailAllowed(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();

  // Check domain
  if (normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return true;
  }

  // Check allowlist
  if (EMAIL_ALLOWLIST.includes(normalizedEmail)) {
    return true;
  }

  return false;
}
