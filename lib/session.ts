import { SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
  clientId?: string; // Which client portal is authenticated
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
