import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { InputType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    // Use unified session (supports both NextAuth and client portal)
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const inputType = searchParams.get('inputType') as InputType | null;
    const pillar = searchParams.get('pillar');

    const profile = await prisma.clarityProfile.findFirst({
      where: { userRecordId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await prisma.inputSession.findMany({
      where: {
        clarityProfileId: profile.id,
        ...(inputType && { inputType }),
        ...(pillar && { sourceContext: { contains: pillar } }),
      },
      orderBy: { capturedAt: 'desc' },
      take: 50, // Pagination limit
      include: {
        fieldSources: {
          select: {
            id: true,
            type: true,
            extractedAt: true,
            field: {
              select: {
                key: true,
                name: true,
                subsection: {
                  select: {
                    key: true,
                    name: true,
                    section: {
                      select: { key: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
