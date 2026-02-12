import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { generateSubsectionRefinementPreview } from '@/lib/clarity-canvas/synthesis';

const refinementRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

/**
 * POST /api/clarity-canvas/subsections/[id]/refine
 *
 * Generate a refinement preview for a subsection based on user prompt.
 * Does NOT commit changes — returns preview for accept/reject.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: subsectionId } = await params;

  try {
    const body = await req.json();
    const { prompt } = refinementRequestSchema.parse(body);

    // Verify ownership
    const subsection = await prisma.profileSubsection.findUnique({
      where: { id: subsectionId },
      include: {
        section: {
          include: { profile: true },
        },
      },
    });

    if (!subsection) {
      return NextResponse.json(
        { error: 'Subsection not found' },
        { status: 404 }
      );
    }

    if (subsection.section.profile.userRecordId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate refinement preview
    const preview = await generateSubsectionRefinementPreview(
      subsectionId,
      prompt
    );

    return NextResponse.json({
      preview: {
        refinedSummary: preview.refinedSummary,
        changeSummary: preview.changeSummary,
      },
      subsectionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('[subsection-refine] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate refinement preview' },
      { status: 500 }
    );
  }
}
