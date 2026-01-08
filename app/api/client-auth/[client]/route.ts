import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getClient, getClientPassword, getClientEmail } from '@/lib/clients';
import { ensureClientUser } from '@/lib/client-user-sync';
import { secureCompare } from '@/lib/auth-utils';

interface Props {
  params: Promise<{ client: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const expectedPassword = getClientPassword(clientId);
  const expectedEmail = getClientEmail(clientId);

  // Validate expected values exist and are non-empty
  if (
    !expectedPassword ||
    !expectedEmail ||
    expectedPassword.trim().length === 0 ||
    expectedEmail.trim().length === 0
  ) {
    console.error(
      `Invalid auth config for client: ${clientId} - empty or missing email/password`
    );
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const { email, password } = await request.json();

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

    // Validate both email and password
    const emailMatch = email.toLowerCase() === expectedEmail.toLowerCase();
    const passwordMatch = secureCompare(password, expectedPassword);

    if (emailMatch && passwordMatch) {
      // Create or update User record in database
      const user = await ensureClientUser(email, clientId);

      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.clientId = clientId.toLowerCase();
      session.userId = user.id;
      session.userEmail = user.email;
      await session.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const { client: clientId } = await params;
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  // Only destroy if this session belongs to this client
  if (session.clientId === clientId.toLowerCase()) {
    session.destroy();
  }

  return NextResponse.json({ success: true });
}
