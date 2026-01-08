import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData } from '@/lib/session';

export interface UnifiedSession {
  userId: string;
  userEmail: string;
  authSource: 'nextauth' | 'client-portal';
}

/**
 * Get unified session from either NextAuth or client portal iron-session.
 * Returns null if not authenticated via either method.
 *
 * Check order:
 * 1. NextAuth (team members via Google OAuth, learning platform)
 * 2. Client portal iron-session (clients via email+password)
 */
export async function getUnifiedSession(): Promise<UnifiedSession | null> {
  // Try NextAuth first (team members, learning platform users)
  try {
    const nextAuthSession = await auth();
    if (nextAuthSession?.user?.id && nextAuthSession?.user?.email) {
      return {
        userId: nextAuthSession.user.id,
        userEmail: nextAuthSession.user.email,
        authSource: 'nextauth',
      };
    }
  } catch {
    // NextAuth not available or errored - continue to iron-session
  }

  // Try client portal session
  try {
    const ironSession = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions()
    );

    if (ironSession.isLoggedIn && ironSession.userId && ironSession.userEmail) {
      return {
        userId: ironSession.userId,
        userEmail: ironSession.userEmail,
        authSource: 'client-portal',
      };
    }
  } catch {
    // Iron session not available or errored
  }

  return null;
}

/**
 * Check if user is authenticated via any method.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getUnifiedSession();
  return session !== null;
}
