import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use unified session (supports both NextAuth and client portal)
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify field ownership through chain
    // field → subsection → section → profile → userRecordId
    const field = await prisma.profileField.findUnique({
      where: { id },
      include: {
        subsection: {
          include: {
            section: {
              include: {
                profile: {
                  select: { userRecordId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Ownership check
    if (field.subsection.section.profile.userRecordId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sources = await prisma.fieldSource.findMany({
      where: { fieldId: id },
      orderBy: { extractedAt: 'desc' },
      include: {
        inputSession: {
          select: {
            id: true,
            title: true,
            inputType: true,
            capturedAt: true,
            rawContent: true,
          },
        },
      },
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching field sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}
