import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getStrategist, getStrategistPassword } from '@/lib/strategists';

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
  params: Promise<{ strategist: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const { strategist: strategistId } = await params;
  const strategist = getStrategist(strategistId);

  if (!strategist) {
    return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
  }

  const expectedPassword = getStrategistPassword(strategistId);
  if (!expectedPassword) {
    console.error(`Missing password env var: ${strategist.passwordEnvVar}`);
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
      session.strategistId = strategistId.toLowerCase(); // Normalize to lowercase
      await session.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const { strategist: strategistId } = await params;
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  // Only destroy if this session belongs to this strategist
  if (session.strategistId === strategistId.toLowerCase()) {
    session.destroy();
  }

  return NextResponse.json({ success: true });
}
