import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import type {
  CustomizedQuestion,
  QuestionForUI,
} from '@/lib/clarity-canvas/modules/persona-sharpener/customized-question-schema';

const isDev = process.env.NODE_ENV === 'development';

interface RouteParams {
  params: Promise<{ personaId: string }>;
}

/**
 * GET /api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/questions
 *
 * Fetch customized questions for a persona, incorporating brain dump skip logic.
 *
 * CRITICAL: This API maps base questions → QuestionForUI with customized text
 * ============================================================================
 *
 * Data Flow:
 * 1. Load persona with brainDump relation
 * 2. Extract customizedQuestions[personaId] from brain dump JSON
 * 3. Map questionSequence → QuestionForUI[] with:
 *    - .text = customized.contextualizedText || baseQuestion.question
 *    - .isSkipped, .confirmationPrompt from customization
 * 4. Sort by priority if customized questions available
 *
 * The .text property contains AI-customized question text that references
 * the user's brain dump. DO NOT use baseQuestion.question in the UI.
 *
 * See: docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/customized-questions-pattern.md
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await params;

    // Get persona with its brain dump
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        profile: true,
        brainDump: true,
        responses: true,
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Verify ownership
    if (persona.profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get customized questions from brain dump if available
    let customizedQuestions: CustomizedQuestion[] | null = null;
    if (persona.brainDump?.customizedQuestions) {
      const customizedData = persona.brainDump.customizedQuestions as Record<
        string,
        { questions?: CustomizedQuestion[] }
      >;

      if (customizedData[personaId]?.questions) {
        customizedQuestions = customizedData[personaId].questions;
      } else if (isDev) {
        // Log warning in dev if customized questions exist but not for this persona
        console.warn(
          `[Questions API] customizedQuestions exists but no entry for personaId ${personaId}. Keys: ${Object.keys(customizedData).join(', ')}`
        );
      }
    } else if (!persona.brainDumpId) {
      // This is expected for legacy/manual personas - no warning needed
    } else if (isDev) {
      // Persona has brainDumpId but brainDump relation didn't load - potential issue
      console.warn(
        `[Questions API] Persona ${personaId} has brainDumpId ${persona.brainDumpId} but brainDump relation is null`
      );
    }

    // Map questions to UI format
    const questions: QuestionForUI[] = questionSequence.map((baseQuestion) => {
      // Find customized version if available
      const customized = customizedQuestions?.find(
        (q) => q.questionId === baseQuestion.id
      );

      // Check if already answered
      const existingResponse = persona.responses.find(
        (r) => r.questionId === baseQuestion.id
      );

      // Build UI question
      const uiQuestion: QuestionForUI = {
        questionId: baseQuestion.id,
        text: customized?.contextualizedText || baseQuestion.question,
        type: baseQuestion.type as 'ranking' | 'freetext' | 'multiselect' | 'scale',
        field: baseQuestion.field,
        isSkipped: customized?.shouldSkip || false,
        skippedValue: customized?.skipReason || undefined,
        confirmationPrompt: customized?.confirmationPrompt || undefined,
      };

      // Add options if applicable
      if ('options' in baseQuestion && baseQuestion.options) {
        uiQuestion.options = baseQuestion.options.map((o) => o.label);
      } else if ('items' in baseQuestion && baseQuestion.items) {
        uiQuestion.options = baseQuestion.items.map((i) => i.label);
      }

      return uiQuestion;
    });

    // Sort by priority if customized questions available
    if (customizedQuestions) {
      questions.sort((a, b) => {
        const priorityA =
          customizedQuestions?.find((q) => q.questionId === a.questionId)
            ?.priority || 99;
        const priorityB =
          customizedQuestions?.find((q) => q.questionId === b.questionId)
            ?.priority || 99;
        return priorityA - priorityB;
      });
    }

    // Calculate progress
    const answeredCount = persona.responses.length;
    const skippedCount = questions.filter((q) => q.isSkipped).length;

    return NextResponse.json({
      personaId,
      questions,
      progress: {
        answered: answeredCount,
        total: questions.length,
        skipped: skippedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
