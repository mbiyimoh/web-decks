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
    console.log('[client-auth] Starting authentication...');
    const body = await request.json();
    console.log('[client-auth] Request body parsed:', { hasEmail: !!body?.email, hasPassword: !!body?.password });

    const { email, password } = body;

    // Validate non-empty inputs
    if (
      !email ||
      !password ||
      email.trim().length === 0 ||
      password.trim().length === 0
    ) {
      console.log('[client-auth] Validation failed: empty email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[client-auth] Checking credentials for:', normalizedEmail);

    // Check credentials against all clients
    const clientIds = getAllClientIds();
    console.log('[client-auth] Checking against clients:', clientIds);
    let matchedClientId: string | null = null;

    for (const clientId of clientIds) {
      const expectedEmail = getClientEmail(clientId);
      const expectedPassword = getClientPassword(clientId);

      console.log(`[client-auth] Client ${clientId}: hasEmail=${!!expectedEmail}, hasPassword=${!!expectedPassword}`);

      // Skip clients with missing/empty config
      if (
        !expectedEmail ||
        !expectedPassword ||
        expectedEmail.trim().length === 0 ||
        expectedPassword.trim().length === 0
      ) {
        console.log(`[client-auth] Skipping ${clientId}: missing config`);
        continue;
      }

      const emailMatch = normalizedEmail === expectedEmail.toLowerCase().trim();
      const passwordMatch = secureCompare(password, expectedPassword);
      console.log(`[client-auth] Client ${clientId}: emailMatch=${emailMatch}, passwordMatch=${passwordMatch}`);

      if (emailMatch && passwordMatch) {
        matchedClientId = clientId;
        break;
      }
    }

    if (matchedClientId) {
      console.log('[client-auth] Matched client:', matchedClientId);
      // Create or update User record in database
      const user = await ensureClientUser(email, matchedClientId);
      console.log('[client-auth] User ensured:', user.id);

      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.clientId = matchedClientId.toLowerCase();
      session.userId = user.id;
      session.userEmail = user.email;
      await session.save();
      console.log('[client-auth] Session saved, success');

      return NextResponse.json({ success: true });
    }

    console.log('[client-auth] No match found, returning invalid credentials');
    // Generic error - don't reveal whether email exists
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('[client-auth] ERROR:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
