import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureUser } from '@/lib/user-sync';
import {
  resolveArchetype,
  generateSummary,
} from '@/lib/clarity-canvas/modules/persona-sharpener/scoring';
import type { PersonaDisplay } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

/**
 * GET /api/clarity-canvas/modules/persona-sharpener/personas/[personaId]
 *
 * Fetches a single persona with full extracted data for display in the questionnaire.
 *
 * This endpoint transforms database JSON fields into the PersonaDisplay format,
 * including:
 * - Extracted demographics, jobs, goals, frustrations, behaviors from brain dump
 * - Calculated clarity scores based on responses
 * - Generated archetype and summary using shared scoring functions
 *
 * Used when:
 * - Starting a persona questionnaire from brain dump
 * - Resuming an incomplete persona
 * - Switching between personas in multi-persona flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await params;

    // Ensure user record exists
    const user = await ensureUser(session);

    // Fetch persona with responses
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        profile: true,
        responses: true,
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Verify user owns this persona using dual lookup (new userRecordId OR legacy userId)
    const hasAccess =
      persona.profile.userRecordId === user.id ||
      persona.profile.userId === session.user.id;
    if (!hasAccess) {
      console.warn(
        `Unauthorized persona access attempt: user=${session.user.id}, persona=${personaId}`
      );
      return NextResponse.json(
        { error: 'You do not have permission to access this persona' },
        { status: 403 }
      );
    }

    // Calculate clarity scores from responses
    const responses = persona.responses || [];
    const answeredCount = responses.filter(
      (r) => !r.isUnsure && r.value !== null
    ).length;
    const unsureCount = responses.filter((r) => r.isUnsure).length;
    const avgConfidence =
      answeredCount > 0
        ? Math.round(
            responses
              .filter((r) => !r.isUnsure && r.value !== null)
              .reduce((sum, r) => sum + (r.confidence || 70), 0) / answeredCount
          )
        : 0;

    // Parse JSON fields safely
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

    // Calculate category clarity scores
    const categoryScores = {
      identity: persona.clarityIdentity ?? 0,
      goals: persona.clarityGoals ?? 0,
      frustrations: persona.clarityFrustrations ?? 0,
      emotional: persona.clarityEmotional ?? 0,
      behaviors: persona.clarityBehaviors ?? 0,
    };

    // If no clarity scores yet, estimate from extracted data presence
    if (Object.values(categoryScores).every((v) => v === 0)) {
      categoryScores.identity = Object.keys(demographics).length > 0 ? 30 : 0;
      categoryScores.goals = Object.keys(goals).length > 0 ? 30 : 0;
      categoryScores.frustrations =
        Object.keys(frustrations).length > 0 ? 30 : 0;
      categoryScores.emotional = jobs.emotional ? 30 : 0;
      categoryScores.behaviors = Object.keys(behaviors).length > 0 ? 30 : 0;
    }

    const overallClarity = Math.round(
      (categoryScores.identity +
        categoryScores.goals +
        categoryScores.frustrations +
        categoryScores.emotional +
        categoryScores.behaviors) /
        5
    );

    // Build PersonaDisplay with extracted data
    const personaDisplay: PersonaDisplay = {
      id: persona.id,
      name: persona.name,
      archetype: persona.name || 'Your Ideal Customer', // Temporary, will be regenerated
      summary: 'Based on your brain dump analysis.', // Temporary, will be regenerated
      quote: persona.quote,
      demographics: demographics as PersonaDisplay['demographics'],
      jobs: jobs as PersonaDisplay['jobs'],
      goals: goals as PersonaDisplay['goals'],
      frustrations: frustrations as PersonaDisplay['frustrations'],
      behaviors: behaviors as PersonaDisplay['behaviors'],
      antiPatterns: (persona.antiPatterns as string[]) || [],
      clarity: {
        overall: persona.clarityOverall ?? overallClarity,
        ...categoryScores,
      },
      avgConfidence: persona.avgConfidence ?? avgConfidence,
      unsureCount: persona.totalAssumptions ?? unsureCount,
    };

    // Use shared functions to generate archetype and summary
    personaDisplay.archetype = resolveArchetype(persona.name, personaDisplay);

    // Generate summary, but prefer extracted goals.primary if available
    const generatedSummary = generateSummary(personaDisplay);
    if (goals.primary && typeof goals.primary === 'string') {
      personaDisplay.summary = goals.primary;
    } else if (generatedSummary !== 'Answer questions to build their profile.') {
      personaDisplay.summary = generatedSummary;
    } else {
      personaDisplay.summary = 'Based on your brain dump analysis.';
    }

    return NextResponse.json({ persona: personaDisplay });
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}
