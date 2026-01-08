import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    // Get user from unified session (NextAuth or client portal)
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await request.json();

    if (!personaId) {
      return NextResponse.json(
        { error: 'personaId required' },
        { status: 400 }
      );
    }

    // Verify persona belongs to user by user record ID
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userRecordId: user.id },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Mark any existing in_progress sessions as abandoned
    await prisma.sharpenerSession.updateMany({
      where: {
        personaId,
        status: 'in_progress',
      },
      data: {
        status: 'abandoned',
      },
    });

    // Create new session
    const sharpenerSession = await prisma.sharpenerSession.create({
      data: {
        personaId,
        sessionType: 'sharpen',
        status: 'in_progress',
      },
    });

    return NextResponse.json({ session: sharpenerSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
