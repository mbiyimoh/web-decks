import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { invalidateSynthesis } from '@/lib/companion/cache';

const updateSchema = z.object({
  summary: z.string().max(150).optional(),
  fullContext: z.string().max(400).optional(),
});

/**
 * PATCH /api/clarity-canvas/fields/[id]
 *
 * Commit a refinement to a field after user accepts preview.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: fieldId } = await params;

  try {
    // Verify ownership
    const existingField = await prisma.profileField.findUnique({
      where: { id: fieldId },
      include: {
        subsection: {
          include: {
            section: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    if (existingField.subsection.section.profile.userRecordId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updates = updateSchema.parse(body);

    // Update the field
    const field = await prisma.profileField.update({
      where: { id: fieldId },
      data: {
        ...updates,
        lastSynthesizedAt: new Date(),
        synthesisVersion: { increment: 1 },
      },
      include: {
        sources: true,
      },
    });

    console.log(`[field-patch] Updated field ${fieldId}`);

    // Invalidate Companion API cache (fire-and-forget)
    invalidateSynthesis(user.id).catch((err) =>
      console.error('[field-patch] Companion cache invalidation failed:', err)
    );

    return NextResponse.json({ field });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('[field-patch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update field' },
      { status: 500 }
    );
  }
}
