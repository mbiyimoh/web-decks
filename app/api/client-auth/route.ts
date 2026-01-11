import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getAllClientIds, getClientPassword, getClientEmail } from '@/lib/clients';
import { ensureClientUser } from '@/lib/client-user-sync';
import { secureCompare } from '@/lib/auth-utils';

/**
 * Unified client authentication endpoint.
 * Checks email+password against ALL configured clients without exposing client list.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate non-empty inputs
    if (
      !email ||
      !password ||
      email.trim().length === 0 ||
      password.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check credentials against all clients
    const clientIds = getAllClientIds();
    let matchedClientId: string | null = null;

    for (const clientId of clientIds) {
      const expectedEmail = getClientEmail(clientId);
      const expectedPassword = getClientPassword(clientId);

      // Skip clients with missing/empty config
      if (
        !expectedEmail ||
        !expectedPassword ||
        expectedEmail.trim().length === 0 ||
        expectedPassword.trim().length === 0
      ) {
        continue;
      }

      const emailMatch = normalizedEmail === expectedEmail.toLowerCase().trim();
      const passwordMatch = secureCompare(password, expectedPassword);

      if (emailMatch && passwordMatch) {
        matchedClientId = clientId;
        break;
      }
    }

    if (matchedClientId) {
      // Create or update User record in database
      const user = await ensureClientUser(email, matchedClientId);

      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.clientId = matchedClientId.toLowerCase();
      session.userId = user.id;
      session.userEmail = user.email;
      await session.save();

      return NextResponse.json({ success: true });
    }

    // Generic error - don't reveal whether email exists
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('[client-auth] Authentication error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
