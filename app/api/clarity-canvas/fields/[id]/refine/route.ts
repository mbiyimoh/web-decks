import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { generateFieldRefinementPreview } from '@/lib/clarity-canvas/synthesis';

const refinementRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

/**
 * POST /api/clarity-canvas/fields/[id]/refine
 *
 * Generate a refinement preview for a field based on user prompt.
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

  const { id: fieldId } = await params;

  try {
    const body = await req.json();
    const { prompt } = refinementRequestSchema.parse(body);

    // Verify ownership
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
      },
    });

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    if (field.subsection.section.profile.userRecordId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate refinement preview
    const preview = await generateFieldRefinementPreview(fieldId, prompt);

    return NextResponse.json({
      preview: {
        refinedSummary: preview.refinedSummary,
        refinedFullContext: preview.refinedFullContext,
        changeSummary: preview.changeSummary,
      },
      fieldId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('[field-refine] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate refinement preview' },
      { status: 500 }
    );
  }
}
