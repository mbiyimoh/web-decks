import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import {
  INTERVIEW_QUESTIONS,
  mapQuestionResponseToFields,
  type QuestionResponse,
} from '@/lib/clarity-canvas/question-mapping';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import { SourceType } from '@prisma/client';
import type { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';

interface QuestionSubmission {
  questionId: string;
  response: QuestionResponse;
}

interface QuestionsApiResponse {
  fieldsUpdated: number;
  profile: ProfileWithSections;
  scores: ProfileScores;
}

/**
 * GET /api/clarity-canvas/questions
 * Returns the list of interview questions
 */
export async function GET(): Promise<NextResponse<{ questions: typeof INTERVIEW_QUESTIONS }>> {
  return NextResponse.json({ questions: INTERVIEW_QUESTIONS });
}

/**
 * POST /api/clarity-canvas/questions
 * Process a question response and update profile fields
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<QuestionsApiResponse | { error: string }>> {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as QuestionSubmission;
    const { questionId, response } = body;

    if (!questionId || response === undefined) {
      return NextResponse.json({ error: 'Missing questionId or response' }, { status: 400 });
    }

    // Validate question exists
    const question = INTERVIEW_QUESTIONS.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
    }

    // Get user's profile
    const profile = await prisma.clarityProfile.findFirst({
      where: { userRecordId: user.id },
      include: {
        sections: {
          include: {
            subsections: {
              include: {
                fields: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Map response to field updates
    const mappings = mapQuestionResponseToFields(questionId, response);

    // Build update operations
    const updates: Promise<unknown>[] = [];

    for (const mapping of mappings) {
      // Find the target field
      const section = profile.sections.find((s) => s.key === mapping.targetSection);
      if (!section) continue;

      const subsection = section.subsections.find((ss) => ss.key === mapping.targetSubsection);
      if (!subsection) continue;

      const field = subsection.fields.find((f) => f.key === mapping.targetField);
      if (!field) continue;

      // Skip if value is empty
      if (!mapping.value || mapping.value.trim() === '') continue;

      // Update field and create source
      updates.push(
        prisma.$transaction([
          prisma.profileField.update({
            where: { id: field.id },
            data: {
              summary: mapping.value.substring(0, 150),
              fullContext: field.fullContext
                ? `${field.fullContext}\n\n---\n\n${mapping.value}`
                : mapping.value,
              confidence: response.confidence,
              flaggedForValidation: response.isUnsure,
            },
          }),
          prisma.fieldSource.create({
            data: {
              fieldId: field.id,
              type: SourceType.QUESTION,
              rawContent: mapping.value,
              questionId: questionId,
              userConfidence: response.confidence,
            },
          }),
        ])
      );
    }

    await Promise.all(updates);

    // Fetch updated profile with all relations using profile.id for precision
    const updatedProfile = await prisma.clarityProfile.findUnique({
      where: { id: profile.id },
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
      fieldsUpdated: updates.length,
      profile: typedProfile,
      scores,
    });
  } catch (error) {
    console.error('Question processing error:', error);
    return NextResponse.json({ error: 'Failed to process question response' }, { status: 500 });
  }
}
