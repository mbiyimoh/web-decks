import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, defaultSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());

  try {
    const { password } = await request.json();

    if (!process.env.DECK_PASSWORD) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password === process.env.DECK_PASSWORD) {
      session.isLoggedIn = true;
      await session.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
  session.destroy();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
  return NextResponse.json({
    isLoggedIn: session.isLoggedIn ?? defaultSession.isLoggedIn,
  });
}
