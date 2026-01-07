import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { brainDumpExtractionSchema } from '@/lib/clarity-canvas/extraction-schema';
import { BRAIN_DUMP_EXTRACTION_PROMPT, EXTRACTION_SYSTEM_PROMPT } from '@/lib/clarity-canvas/prompts';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import { SourceType } from '@prisma/client';
import type { ProfileWithSections, BrainDumpResponse } from '@/lib/clarity-canvas/types';

interface ExtractRequestBody {
  transcript: string;
  sourceType: 'VOICE' | 'TEXT';
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<BrainDumpResponse | { error: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ExtractRequestBody;
    const { transcript, sourceType } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    // Get user's profile
    const profile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        sections: {
          include: {
            subsections: {
              include: {
                fields: {
                  include: {
                    sources: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please create a profile first.' }, { status: 404 });
    }

    // Extract information using AI
    const { object: extraction } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: brainDumpExtractionSchema,
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt: `${BRAIN_DUMP_EXTRACTION_PROMPT}\n\nTRANSCRIPT:\n${transcript}`,
    });

    // Update profile fields with extracted chunks
    const updatePromises = extraction.chunks.map(async (chunk) => {
      // Find the target field
      const section = profile.sections.find((s) => s.key === chunk.targetSection);
      if (!section) return null;

      const subsection = section.subsections.find((ss) => ss.key === chunk.targetSubsection);
      if (!subsection) return null;

      const field = subsection.fields.find((f) => f.key === chunk.targetField);
      if (!field) return null;

      // Update field with new content
      const existingContext = field.fullContext || '';
      const newContext = existingContext
        ? `${existingContext}\n\n---\n\n${chunk.content}`
        : chunk.content;

      // Create source record and update field
      await prisma.$transaction([
        prisma.fieldSource.create({
          data: {
            fieldId: field.id,
            type: sourceType === 'VOICE' ? SourceType.VOICE : SourceType.TEXT,
            rawContent: chunk.content,
            userConfidence: chunk.confidence,
          },
        }),
        prisma.profileField.update({
          where: { id: field.id },
          data: {
            summary: chunk.summary,
            fullContext: newContext,
            confidence: chunk.confidence,
          },
        }),
      ]);

      return chunk;
    });

    await Promise.all(updatePromises);

    // Fetch updated profile
    const updatedProfile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
              include: {
                fields: {
                  include: {
                    sources: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 });
    }

    const typedProfile = updatedProfile as ProfileWithSections;
    const scores = calculateAllScores(typedProfile.sections);

    return NextResponse.json({
      extractedChunks: extraction.chunks,
      updatedProfile: typedProfile,
      scores,
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract information from transcript' }, { status: 500 });
  }
}
