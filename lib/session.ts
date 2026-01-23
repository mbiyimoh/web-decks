import { SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
  clientId?: string;      // Which client portal is authenticated
  strategistId?: string;  // Which strategist portal is authenticated
  // User info for client portal users (enables Clarity Canvas access)
  userId?: string;        // Database User.id
  userEmail?: string;     // For display/verification
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  clientId: undefined,
};

export function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  return {
    password: secret,
    cookieName: '33strategies-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

/**
 * Check if session is valid for a specific client
 */
export function isSessionValidForClient(
  session: SessionData,
  clientId: string
): boolean {
  // Case-insensitive comparison - session stores lowercase clientId
  return session.isLoggedIn === true && session.clientId === clientId.toLowerCase();
}

/**
 * Check if session is valid for a specific strategist
 */
export function isSessionValidForStrategist(
  session: SessionData,
  strategistId: string
): boolean {
  // Case-insensitive comparison - session stores lowercase strategistId
  return session.isLoggedIn === true && session.strategistId === strategistId.toLowerCase();
}

// ============================================================================
// SHARE LINK SESSION - For password-protected artifact sharing
// ============================================================================

/** Session duration in seconds (24 hours) */
export const SHARE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

/** Minimum password length for share links */
export const SHARE_PASSWORD_MIN_LENGTH = 6;

/**
 * Session data for share link access
 */
export interface ShareLinkSessionData {
  isAuthenticated: boolean;
  shareSlug: string;       // Which share link is authenticated
  clientId: string;        // Client who owns the artifact
  artifactSlug: string;    // Which artifact can be viewed
  authenticatedAt: number; // Timestamp for session age validation
}

/**
 * Get session options for share links
 * Uses separate cookie name and path scoped to the specific share link
 */
export function getShareLinkSessionOptions(slug: string): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required.');
  }

  return {
    password: secret,
    cookieName: `share-${slug}`, // Full slug ensures uniqueness
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SHARE_SESSION_MAX_AGE_SECONDS,
      path: `/share/${slug}`,
    },
  };
}

/**
 * Validate if a share link session is still valid
 */
export function isShareSessionValid(
  session: ShareLinkSessionData,
  expectedSlug: string
): boolean {
  if (!session.isAuthenticated || session.shareSlug !== expectedSlug) {
    return false;
  }

  if (!session.authenticatedAt) {
    return false;
  }

  const ageSeconds = (Date.now() - session.authenticatedAt) / 1000;
  return ageSeconds < SHARE_SESSION_MAX_AGE_SECONDS;
}
