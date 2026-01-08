import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureUser } from '@/lib/user-sync';
import {
  getQuestionById,
  getTotalQuestions,
} from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import {
  calculateClarity,
  calculateAvgConfidence,
  getUnsureCount,
  resolveArchetype,
  generateSummary,
} from '@/lib/clarity-canvas/modules/persona-sharpener/scoring';
import type {
  PersonaDisplay,
  ResponseInput,
  PersonaClarity,
} from '@/lib/clarity-canvas/modules/persona-sharpener/types';
import type { Persona, Response as PrismaResponse } from '@prisma/client';

interface RouteContext {
  params: Promise<{ personaId: string }>;
}

// GET - Fetch all responses for persona
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await context.params;

    // Ensure user record exists
    const user = await ensureUser(session);

    // Find persona using dual lookup (new userRecordId OR legacy userId)
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: {
          OR: [
            { userRecordId: user.id },
            { userId: session.user.id },
          ],
        },
      },
      include: { responses: true },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    return NextResponse.json({ responses: persona.responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

// POST - Submit a response
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await context.params;
    const body = await request.json();
    const {
      sessionId,
      questionId,
      currentQuestionIndex,
      value,
      isUnsure,
      confidence,
      additionalContext,
      contextSource,
    } = body;

    // Validate required fields
    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: 'sessionId and questionId required' },
        { status: 400 }
      );
    }

    // Get question to find field mapping
    const question = getQuestionById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Ensure user record exists
    const user = await ensureUser(session);

    // Verify persona belongs to user using dual lookup (new userRecordId OR legacy userId)
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: {
          OR: [
            { userRecordId: user.id },
            { userId: session.user.id },
          ],
        },
      },
      include: { responses: true },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Check if response already exists for this question
    const existingResponse = await prisma.response.findFirst({
      where: {
        personaId,
        sessionId,
        questionId,
      },
    });

    let response;
    if (existingResponse) {
      // Update existing response
      response = await prisma.response.update({
        where: { id: existingResponse.id },
        data: {
          value,
          isUnsure,
          confidence,
          additionalContext,
          contextSource,
        },
      });
    } else {
      // Create new response
      response = await prisma.response.create({
        data: {
          personaId,
          sessionId,
          questionId,
          field: question.field,
          value,
          isUnsure,
          confidence,
          additionalContext,
          contextSource,
          responseType: 'assumption',
          respondentId: session.user.id,
          respondentRole: 'founder',
          respondentName: session.user.name || null,
        },
      });
    }

    // Update session progress with lastQuestionIndex
    // Calculate actual question count accounting for skipped questions
    const skippedCount = Array.isArray(persona.skippedQuestionIds)
      ? persona.skippedQuestionIds.length
      : 0;
    const totalQuestions = Math.max(1, getTotalQuestions() - skippedCount);
    const isLastQuestion =
      currentQuestionIndex !== undefined &&
      currentQuestionIndex >= totalQuestions - 1;

    await prisma.sharpenerSession.update({
      where: { id: sessionId },
      data: {
        lastQuestionIndex:
          currentQuestionIndex !== undefined ? currentQuestionIndex : undefined,
        questionsAnswered: {
          increment: existingResponse ? 0 : 1,
        },
        questionsUnsure: isUnsure
          ? { increment: existingResponse?.isUnsure ? 0 : 1 }
          : { decrement: existingResponse?.isUnsure ? 1 : 0 },
        // Mark session as completed if this is the last question
        ...(isLastQuestion && {
          status: 'completed',
          completedAt: new Date(),
        }),
      },
    });

    // Fetch all responses and recalculate persona
    const allResponses = await prisma.response.findMany({
      where: { personaId },
    });

    // Convert to ResponseInput format for scoring
    const responsesMap: Record<string, ResponseInput> = {};
    allResponses.forEach((r) => {
      responsesMap[r.questionId] = {
        questionId: r.questionId,
        value: r.value,
        isUnsure: r.isUnsure,
        confidence: r.confidence,
        additionalContext: r.additionalContext || undefined,
        contextSource: r.contextSource as 'text' | null,
      };
    });

    const clarity = calculateClarity(responsesMap);
    const avgConfidence = calculateAvgConfidence(responsesMap);
    const unsureCount = getUnsureCount(responsesMap);

    // Build updated persona fields from response (merge with existing JSON)
    const personaFieldUpdates = buildPersonaFields(
      question.field,
      value,
      isUnsure,
      persona
    );

    // Update persona with new clarity scores and field data
    const updatedPersona = await prisma.persona.update({
      where: { id: personaId },
      data: {
        clarityOverall: clarity.overall,
        clarityIdentity: clarity.identity,
        clarityGoals: clarity.goals,
        clarityFrustrations: clarity.frustrations,
        clarityEmotional: clarity.emotional,
        clarityBehaviors: clarity.behaviors,
        avgConfidence,
        totalAssumptions: allResponses.filter((r) => !r.isUnsure).length,
        ...personaFieldUpdates,
      },
    });

    // Build persona display object from responses
    const personaDisplay = buildPersonaDisplay(
      updatedPersona,
      allResponses,
      clarity,
      avgConfidence,
      unsureCount
    );

    return NextResponse.json({
      response: {
        id: response.id,
        questionId: response.questionId,
        value: response.value,
      },
      persona: personaDisplay,
      clarity,
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}

function buildPersonaDisplay(
  persona: Persona,
  responses: PrismaResponse[],
  clarity: PersonaClarity,
  avgConfidence: number,
  unsureCount: number
): PersonaDisplay {
  const demographics = (persona.demographics as Record<string, unknown>) || {};
  const jobs = (persona.jobs as Record<string, unknown>) || {};
  const goals = (persona.goals as Record<string, unknown>) || {};
  const frustrations = (persona.frustrations as Record<string, unknown>) || {};
  const behaviors = (persona.behaviors as Record<string, unknown>) || {};

  const display: PersonaDisplay = {
    id: persona.id,
    name: persona.name,
    archetype: '',
    summary: '',
    quote: persona.quote,
    demographics: {
      ageRange: demographics.ageRange as string | undefined,
      lifestyle: demographics.lifestyle as string | undefined,
      techSavviness: demographics.techSavviness as number | undefined,
    },
    jobs: {
      functional: jobs.functional as string | undefined,
      emotional: jobs.emotional as string | undefined,
      social: jobs.social as string | undefined,
    },
    goals: {
      priorities: goals.priorities as
        | { id: string; label: string; rank?: number }[]
        | undefined,
      successDefinition: goals.successDefinition as
        | Record<string, string>
        | undefined,
    },
    frustrations: {
      pastFailures: frustrations.pastFailures as string | undefined,
      dealbreakers: frustrations.dealbreakers as string[] | undefined,
      currentWorkaround: frustrations.currentWorkaround as
        | Record<string, string>
        | undefined,
    },
    behaviors: {
      decisionStyle: behaviors.decisionStyle as string | undefined,
      usageTime: behaviors.usageTime as string | undefined,
      timeAvailable: behaviors.timeAvailable as number | undefined,
      discoveryChannels: behaviors.discoveryChannels as
        | { id: string; label: string; rank?: number }[]
        | undefined,
      influences: behaviors.influences as string[] | undefined,
    },
    antiPatterns: persona.antiPatterns || [],
    clarity,
    avgConfidence,
    unsureCount,
  };

  display.archetype = resolveArchetype(persona.name, display);
  display.summary = generateSummary(display);

  return display;
}

function buildPersonaFields(
  field: string,
  value: unknown,
  isUnsure: boolean,
  existingPersona: Persona
): Record<string, unknown> {
  if (isUnsure) return {};

  // Handle special case for quote field which is a direct field, not nested
  if (field === 'quote') {
    return { quote: value };
  }

  // Handle antiPatterns which is a direct array field
  if (field === 'antiPatterns') {
    return { antiPatterns: value };
  }

  const [section, key] = field.split('.');
  if (!section || !key) return {};

  // Get existing section data and merge with new value
  const existingSection =
    (existingPersona[section as keyof Persona] as Record<string, unknown>) ||
    {};

  // For JSON fields, merge with existing data to preserve other keys
  return {
    [section]: {
      ...existingSection,
      [key]: value,
    },
  };
}
