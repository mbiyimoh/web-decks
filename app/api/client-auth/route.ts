import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { getSessionOptions, SessionData } from '@/lib/session';
import {
  getAllClientIds,
  getClientEmail,
  verifyClientPassword,
} from '@/lib/clients';
import { ensureClientUser } from '@/lib/client-user-sync';
import { getCredentialByClientId } from '@/lib/client-auth-db';

/**
 * Unified client authentication endpoint.
 * Supports two auth modes:
 * 1. Email + password: Checks against all configured clients (original flow)
 * 2. ClientId + password: Direct verification against database (new flow)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, clientId: providedClientId } = body;

    // Validate password always required
    if (!password || password.trim().length === 0) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Mode 2: Direct clientId + password (new database-backed flow)
    if (providedClientId) {
      const result = await verifyClientPassword(providedClientId, password);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Get email from database credential
      const credential = await getCredentialByClientId(providedClientId);
      const userEmail = credential?.email || `${providedClientId}@client.33strategies.ai`;

      // Create or update User record
      const user = await ensureClientUser(userEmail, providedClientId);

      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.clientId = providedClientId.toLowerCase();
      session.userId = user.id;
      session.userEmail = user.email;
      await session.save();

      return NextResponse.json({ success: true });
    }

    // Mode 1: Email + password (original flow for backward compatibility)
    if (!email || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check credentials against all clients by email
    const clientIds = getAllClientIds();
    let matchedClientId: string | null = null;

    for (const clientId of clientIds) {
      const expectedEmail = getClientEmail(clientId);

      // Skip clients without email configured
      if (!expectedEmail || expectedEmail.trim().length === 0) {
        continue;
      }

      // Check if email matches
      if (normalizedEmail !== expectedEmail.toLowerCase().trim()) {
        continue;
      }

      // Email matches, verify password via database
      const result = await verifyClientPassword(clientId, password);
      if (result.success) {
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
