/**
 * OAuth 2.0 Scopes Definition
 *
 * Defines all available scopes with human-readable descriptions
 * for the consent screen and documentation.
 */

// ============================================================================
// Scope Definitions
// ============================================================================

export const OAUTH_SCOPES = {
  // Profile access
  'read:profile': 'Read your Clarity Canvas profile data',
  'write:profile': 'Update your Clarity Canvas profile data',

  // Synthesis (for Companion API)
  'read:synthesis': 'Access your profile synthesis for AI products',
  'trigger:synthesis': 'Request regeneration of your profile synthesis',

  // Search
  'search:profile': 'Search across your profile using natural language',

  // Admin (internal only)
  'admin:credentials': 'Manage client credentials (internal)',
  'admin:clients': 'Manage OAuth clients (internal)',
  'admin:users': 'Manage user accounts (internal)',
} as const;

export type OAuthScope = keyof typeof OAUTH_SCOPES;

// Scopes that are safe for third-party apps
export const PUBLIC_SCOPES: OAuthScope[] = [
  'read:profile',
  'read:synthesis',
  'search:profile',
];

// Scopes that require special consideration
export const SENSITIVE_SCOPES: OAuthScope[] = [
  'write:profile',
  'trigger:synthesis',
];

// Scopes restricted to internal use
export const ADMIN_SCOPES: OAuthScope[] = [
  'admin:credentials',
  'admin:clients',
  'admin:users',
];

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that requested scopes are within allowed scopes.
 */
export function validateScopes(
  requestedScopes: string,
  allowedScopes: string
): boolean {
  const requested = requestedScopes.split(' ').filter(Boolean);
  const allowed = allowedScopes.split(' ').filter(Boolean);
  return requested.every((scope) => allowed.includes(scope));
}

/**
 * Check if a scope string contains any admin scopes.
 */
export function hasAdminScopes(scopes: string): boolean {
  const scopeList = scopes.split(' ');
  return ADMIN_SCOPES.some((scope) => scopeList.includes(scope));
}

/**
 * Filter scopes to only those that are valid.
 */
export function filterValidScopes(scopes: string): string {
  const validScopes = Object.keys(OAUTH_SCOPES);
  return scopes
    .split(' ')
    .filter((scope) => validScopes.includes(scope))
    .join(' ');
}

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * Get human-readable descriptions for a scope string.
 * Used in consent screen.
 */
export function getScopeDescriptions(scopes: string): string[] {
  return scopes
    .split(' ')
    .filter((scope) => scope in OAUTH_SCOPES)
    .map((scope) => OAUTH_SCOPES[scope as OAuthScope]);
}

/**
 * Get scope objects with both key and description.
 */
export function getScopeDetails(
  scopes: string
): { scope: string; description: string }[] {
  return scopes
    .split(' ')
    .filter((scope) => scope in OAUTH_SCOPES)
    .map((scope) => ({
      scope,
      description: OAUTH_SCOPES[scope as OAuthScope],
    }));
}

// ============================================================================
// Default Scopes
// ============================================================================

/**
 * Default scopes for first-party portal authentication.
 */
export const DEFAULT_PORTAL_SCOPES = 'read:profile write:profile';

/**
 * Default scopes for external products (Companion API consumers).
 */
export const DEFAULT_COMPANION_SCOPES = 'read:profile read:synthesis search:profile';
