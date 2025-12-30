import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getClient, getClientPassword } from '@/lib/clients';

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Compare against self to maintain constant time
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

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
  if (!expectedPassword) {
    console.error(`Missing password env var: ${client.passwordEnvVar}`);
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const { password } = await request.json();

    if (secureCompare(password, expectedPassword)) {
      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.clientId = clientId.toLowerCase(); // Normalize to lowercase
      await session.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
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
