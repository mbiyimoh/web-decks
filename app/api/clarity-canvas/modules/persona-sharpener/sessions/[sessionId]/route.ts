import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  resolveArchetype,
  generateSummary,
} from '@/lib/clarity-canvas/modules/persona-sharpener/scoring';
import type { PersonaDisplay } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/clarity-canvas/modules/persona-sharpener/sessions/[sessionId]
 *
 * Fetches a session with all data needed to resume the questionnaire:
 * - Session metadata (status, lastQuestionIndex, questionsAnswered)
 * - Associated persona with full display data
 * - All existing responses for this session
 *
 * Used when navigating to /clarity-canvas/modules/persona-sharpener/[sessionId]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await context.params;

    // Fetch session with persona and responses
    const sharpenerSession = await prisma.sharpenerSession.findUnique({
      where: { id: sessionId },
      include: {
        persona: {
          include: {
            profile: true,
            responses: {
              where: { sessionId },
            },
          },
        },
        responses: true,
      },
    });

    if (!sharpenerSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user owns this session
    if (sharpenerSession.persona.profile.userId !== authSession.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this session' },
        { status: 403 }
      );
    }

    // Build persona display object
    const persona = sharpenerSession.persona;
    const demographics =
      persona.demographics && typeof persona.demographics === 'object'
        ? (persona.demographics as Record<string, unknown>)
        : {};
    const jobs =
      persona.jobs && typeof persona.jobs === 'object'
        ? (persona.jobs as Record<string, unknown>)
        : {};
    const goals =
      persona.goals && typeof persona.goals === 'object'
        ? (persona.goals as Record<string, unknown>)
        : {};
    const frustrations =
      persona.frustrations && typeof persona.frustrations === 'object'
        ? (persona.frustrations as Record<string, unknown>)
        : {};
    const behaviors =
      persona.behaviors && typeof persona.behaviors === 'object'
        ? (persona.behaviors as Record<string, unknown>)
        : {};

    const personaDisplay: PersonaDisplay = {
      id: persona.id,
      name: persona.name,
      archetype: persona.name || 'Your Ideal Customer',
      summary: 'Based on your brain dump analysis.',
      quote: persona.quote,
      demographics: demographics as PersonaDisplay['demographics'],
      jobs: jobs as PersonaDisplay['jobs'],
      goals: goals as PersonaDisplay['goals'],
      frustrations: frustrations as PersonaDisplay['frustrations'],
      behaviors: behaviors as PersonaDisplay['behaviors'],
      antiPatterns: (persona.antiPatterns as string[]) || [],
      clarity: {
        overall: persona.clarityOverall ?? 0,
        identity: persona.clarityIdentity ?? 0,
        goals: persona.clarityGoals ?? 0,
        frustrations: persona.clarityFrustrations ?? 0,
        emotional: persona.clarityEmotional ?? 0,
        behaviors: persona.clarityBehaviors ?? 0,
      },
      avgConfidence: persona.avgConfidence ?? 0,
      unsureCount: persona.totalAssumptions ?? 0,
    };

    // Use shared functions to generate archetype and summary
    personaDisplay.archetype = resolveArchetype(persona.name, personaDisplay);
    const generatedSummary = generateSummary(personaDisplay);
    if (goals.primary && typeof goals.primary === 'string') {
      personaDisplay.summary = goals.primary;
    } else if (generatedSummary !== 'Answer questions to build their profile.') {
      personaDisplay.summary = generatedSummary;
    }

    // Convert responses to map for client
    const responsesMap: Record<
      string,
      {
        questionId: string;
        value: unknown;
        isUnsure: boolean;
        confidence: number;
        additionalContext?: string;
        contextSource?: string | null;
      }
    > = {};
    sharpenerSession.responses.forEach((r) => {
      responsesMap[r.questionId] = {
        questionId: r.questionId,
        value: r.value,
        isUnsure: r.isUnsure,
        confidence: r.confidence,
        additionalContext: r.additionalContext || undefined,
        contextSource: r.contextSource,
      };
    });

    // Fetch sibling personas from the same brain dump (if any)
    let siblingPersonas: Array<{
      id: string;
      name: string | null;
      sessionId: string | null;
      isComplete: boolean;
      isCurrent: boolean;
    }> = [];

    if (persona.brainDumpId) {
      const siblings = await prisma.persona.findMany({
        where: { brainDumpId: persona.brainDumpId },
        include: {
          sessions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      siblingPersonas = siblings.map((s) => ({
        id: s.id,
        name: s.name,
        sessionId: s.sessions[0]?.id || null,
        isComplete: s.sessions[0]?.status === 'completed',
        isCurrent: s.id === persona.id,
      }));
    }

    return NextResponse.json({
      session: {
        id: sharpenerSession.id,
        personaId: sharpenerSession.personaId,
        status: sharpenerSession.status,
        lastQuestionIndex: sharpenerSession.lastQuestionIndex,
        questionsAnswered: sharpenerSession.questionsAnswered,
        questionsSkipped: sharpenerSession.questionsSkipped,
        questionsUnsure: sharpenerSession.questionsUnsure,
        startedAt: sharpenerSession.startedAt,
        completedAt: sharpenerSession.completedAt,
      },
      persona: personaDisplay,
      responses: responsesMap,
      siblingPersonas,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
