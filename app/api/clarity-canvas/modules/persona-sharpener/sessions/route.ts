import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureUser } from '@/lib/user-sync';

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await request.json();

    if (!personaId) {
      return NextResponse.json(
        { error: 'personaId required' },
        { status: 400 }
      );
    }

    // Ensure user record exists
    const user = await ensureUser(session);

    // Verify persona belongs to user using dual lookup
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: {
          OR: [
            { userRecordId: user.id },
            { userId: session.user.id },
          ],
        },
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
