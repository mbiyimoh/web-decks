import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { synthesizeField } from '@/lib/clarity-canvas/synthesis';
import { invalidateSynthesis } from '@/lib/companion/cache';

/**
 * DELETE /api/clarity-canvas/fields/[id]/sources/[sourceId]
 *
 * Removes a source from a field and triggers re-synthesis.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: fieldId, sourceId } = await params;

  // Verify ownership through the profile chain
  const field = await prisma.profileField.findUnique({
    where: { id: fieldId },
    include: {
      subsection: {
        include: {
          section: {
            include: { profile: true },
          },
        },
      },
      sources: true,
    },
  });

  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 });
  }

  if (field.subsection.section.profile.userRecordId !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Check source exists and belongs to this field
  const sourceExists = field.sources.some((s) => s.id === sourceId);
  if (!sourceExists) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  try {
    // Delete the source
    await prisma.fieldSource.delete({
      where: { id: sourceId },
    });

    // Re-synthesize based on remaining sources
    const remainingSources = field.sources.filter((s) => s.id !== sourceId);

    if (remainingSources.length === 0) {
      // Clear field content
      await prisma.profileField.update({
        where: { id: fieldId },
        data: {
          summary: null,
          fullContext: null,
          lastSynthesizedAt: null,
          synthesisVersion: 0,
        },
      });
    } else if (remainingSources.length === 1) {
      // Single source - use directly (no synthesis needed)
      const singleSource = remainingSources[0];
      await prisma.profileField.update({
        where: { id: fieldId },
        data: {
          summary: singleSource.rawContent.slice(0, 150),
          fullContext: singleSource.rawContent,
          lastSynthesizedAt: new Date(),
          synthesisVersion: { increment: 1 },
        },
      });
    } else {
      // Multiple sources - re-synthesize
      try {
        await synthesizeField(fieldId);
      } catch (synthError) {
        // Synthesis failed but source is already deleted
        // Log error and return partial success with warning
        console.error('[source-delete] Synthesis failed after source removal:', synthError);

        // Invalidate cache anyway since data changed
        invalidateSynthesis(user.id).catch((err) =>
          console.error('[source-delete] Companion cache invalidation failed:', err)
        );

        return NextResponse.json({
          success: true,
          warning: 'Source removed but automatic re-synthesis failed. You may need to manually refresh.',
        });
      }
    }

    console.log(
      `[source-delete] Removed source ${sourceId} from field ${fieldId}, ${remainingSources.length} sources remaining`
    );

    // Invalidate Companion API cache (fire-and-forget)
    invalidateSynthesis(user.id).catch((err) =>
      console.error('[source-delete] Companion cache invalidation failed:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[source-delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove source' },
      { status: 500 }
    );
  }
}
