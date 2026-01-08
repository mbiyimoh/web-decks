import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getStrategist, getStrategistPassword } from '@/lib/strategists';
import { ensureStrategistUser } from '@/lib/strategist-user-sync';
import { secureCompare } from '@/lib/auth-utils';

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
  if (!expectedPassword || expectedPassword.trim().length === 0) {
    console.error(`Missing or empty password env var: ${strategist.passwordEnvVar}`);
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const { password } = await request.json();

    // Validate non-empty input
    if (!password || password.trim().length === 0) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (secureCompare(password, expectedPassword)) {
      // Create or update User record using the strategist's email from config
      const user = await ensureStrategistUser(strategist.email, strategistId);

      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.strategistId = strategistId.toLowerCase();
      session.userId = user.id;
      session.userEmail = user.email;
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
