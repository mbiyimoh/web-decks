import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions } from '@/lib/session';
import { secureCompare } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expectedPassword = process.env.CENTRAL_COMMAND_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { error: 'Central Command not configured' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Use timing-safe comparison to prevent timing attacks
  if (!password || !secureCompare(password, expectedPassword)) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );
  session.isLoggedIn = true;
  session.isCentralCommand = true;
  await session.save();

  return NextResponse.json(
    { success: true },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
