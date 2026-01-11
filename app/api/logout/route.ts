import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData } from '@/lib/session';

/**
 * Logout endpoint for iron-session (client portal) users.
 * NextAuth users use NextAuth's signOut() directly.
 */
export async function POST() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions()
    );

    // Destroy the session
    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
