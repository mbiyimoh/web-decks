import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { invalidateSynthesis } from '@/lib/companion/cache';

const updateSchema = z.object({
  summary: z.string().max(300).optional(),
});

/**
 * PATCH /api/clarity-canvas/subsections/[id]
 *
 * Commit a refinement to a subsection after user accepts preview.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: subsectionId } = await params;

  try {
    // Verify ownership
    const existingSubsection = await prisma.profileSubsection.findUnique({
      where: { id: subsectionId },
      include: {
        section: {
          include: { profile: true },
        },
      },
    });

    if (!existingSubsection) {
      return NextResponse.json(
        { error: 'Subsection not found' },
        { status: 404 }
      );
    }

    if (existingSubsection.section.profile.userRecordId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updates = updateSchema.parse(body);

    // Update the subsection
    const subsection = await prisma.profileSubsection.update({
      where: { id: subsectionId },
      data: updates,
      include: {
        fields: true,
      },
    });

    console.log(`[subsection-patch] Updated subsection ${subsectionId}`);

    // Invalidate Companion API cache (fire-and-forget)
    invalidateSynthesis(user.id).catch((err) =>
      console.error('[subsection-patch] Companion cache invalidation failed:', err)
    );

    return NextResponse.json({ subsection });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('[subsection-patch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update subsection' },
      { status: 500 }
    );
  }
}
