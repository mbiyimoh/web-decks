/**
 * Authenticated API: View validation responses for a persona
 *
 * GET /api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/validation-responses
 *   - Query params:
 *     - view: 'by-question' | 'by-session' (default: 'by-question')
 *     - questionId: string (optional, filter by specific question)
 *     - sessionId: string (optional, filter by specific session)
 *
 * Returns validation responses organized either by question or by session,
 * allowing founders to compare their assumptions against real user feedback.
 *
 * Requires authentication - only persona owner can view responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import type {
  ValidationViewMode,
  ValidationSessionSummary,
  ValidationResponseByQuestion,
  ValidationResponseBySession,
  ValidationSummary,
} from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';
import {
  calculateQuestionAlignment,
  calculateOverallAlignment,
} from '@/lib/clarity-canvas/modules/persona-sharpener/alignment-calculator';
import { getConfidenceLevel } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';
import { getQuestionById, getTotalQuestions } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';

/**
 * Compute validation summary statistics including alignments and confidence
 */
function computeValidationSummary(
  sessions: ValidationSessionSummary[],
  founderResponses: Array<{ questionId: string; value: unknown }>,
  validationResponses: Array<{ questionId: string; value: unknown }>,
  totalQuestions: number
): ValidationSummary {
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const inProgressSessions = sessions.filter((s) => s.status === 'in_progress').length;
  const abandonedSessions = sessions.filter((s) => s.status === 'abandoned').length;

  // Group validation responses by questionId
  const responsesByQuestion = new Map<string, unknown[]>();
  validationResponses.forEach((r) => {
    const existing = responsesByQuestion.get(r.questionId) || [];
    existing.push(r.value);
    responsesByQuestion.set(r.questionId, existing);
  });

  // Build founder response map
  const founderByQuestion = new Map<string, unknown>();
  founderResponses.forEach((r) => {
    founderByQuestion.set(r.questionId, r.value);
  });

  // Calculate per-question alignments
  const questionAlignments: Array<{
    questionId: string;
    alignmentScore: number;
    responseCount: number;
  }> = [];

  responsesByQuestion.forEach((validatorValues, questionId) => {
    const founderValue = founderByQuestion.get(questionId);
    if (founderValue !== undefined) {
      const alignment = calculateQuestionAlignment(questionId, founderValue, validatorValues);
      questionAlignments.push({
        questionId,
        alignmentScore: alignment.averageScore,
        responseCount: alignment.total,
      });
    }
  });

  // Calculate overall alignment (map to format expected by calculateOverallAlignment)
  const overallAlignmentScore =
    questionAlignments.length > 0
      ? calculateOverallAlignment(
          questionAlignments.map((q) => ({
            questionId: q.questionId,
            averageScore: q.alignmentScore,
            responseCount: q.responseCount,
          }))
        )
      : null;

  // Find top misalignments (lowest scoring with >=2 responses)
  const topMisalignments = questionAlignments
    .filter((q) => q.responseCount >= 2)
    .sort((a, b) => a.alignmentScore - b.alignmentScore)
    .slice(0, 3)
    .map((q) => {
      const question = getQuestionById(q.questionId);
      return {
        questionId: q.questionId,
        questionText: question?.question || q.questionId,
        category: question?.category || 'unknown',
        alignmentScore: q.alignmentScore,
        responseCount: q.responseCount,
      };
    });

  const confidenceLevel = getConfidenceLevel(sessions.length);

  return {
    totalSessions: sessions.length,
    completedSessions,
    inProgressSessions,
    abandonedSessions,
    totalResponses: validationResponses.length,
    questionsWithResponses: responsesByQuestion.size,
    totalQuestions,
    overallAlignmentScore,
    confidenceLevel,
    topMisalignments,
    questionAlignments,
  };
}

/**
 * GET - Fetch validation responses with flexible view modes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  try {
    // Authenticate user
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const view = (searchParams.get('view') || 'by-question') as ValidationViewMode;
    const filterQuestionId = searchParams.get('questionId');
    const filterSessionId = searchParams.get('sessionId');

    // Fetch persona with validation link and verify ownership
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        profile: true,
        validationLink: {
          include: {
            sessions: {
              orderBy: { startedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    if (persona.profile.userRecordId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this persona' },
        { status: 403 }
      );
    }

    if (!persona.validationLink) {
      const emptySummary: ValidationSummary = {
        totalSessions: 0,
        completedSessions: 0,
        inProgressSessions: 0,
        abandonedSessions: 0,
        totalResponses: 0,
        questionsWithResponses: 0,
        totalQuestions: getTotalQuestions(),
        overallAlignmentScore: null,
        confidenceLevel: getConfidenceLevel(0),
        topMisalignments: [],
        questionAlignments: [],
      };

      return NextResponse.json({
        view,
        personaName: persona.name || 'Unknown Persona',
        totalSessions: 0,
        totalResponses: 0,
        sessions: [],
        responses: view === 'by-question' ? {} : [],
        summary: emptySummary,
      });
    }

    // Build response query conditions
    const responseWhereClause: Record<string, unknown> = {
      personaId,
      responseType: 'validation',
      validationSessionId: { not: null },
    };

    if (filterQuestionId) {
      responseWhereClause.questionId = filterQuestionId;
    }

    if (filterSessionId) {
      responseWhereClause.validationSessionId = filterSessionId;
    }

    // Fetch all validation responses for this persona
    const responses = await prisma.response.findMany({
      where: responseWhereClause,
      include: {
        validationSession: {
          select: {
            id: true,
            respondentName: true,
            respondentEmail: true,
            status: true,
            questionsAnswered: true,
            questionsSkipped: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get founder's assumptions for comparison
    const founderResponses = await prisma.response.findMany({
      where: {
        personaId,
        responseType: 'assumption',
      },
    });

    // Create a map of founder responses by questionId
    const founderResponseMap = new Map(
      founderResponses.map((r) => [r.questionId, r])
    );

    // Build session summaries
    const sessionSummaries: ValidationSessionSummary[] =
      persona.validationLink.sessions.map((s) => ({
        id: s.id,
        respondentName: s.respondentName,
        respondentEmail: s.respondentEmail,
        status: s.status,
        questionsAnswered: s.questionsAnswered,
        questionsSkipped: s.questionsSkipped,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      }));

    if (view === 'by-question') {
      // Group responses by questionId
      const responsesByQuestion: Record<string, ValidationResponseByQuestion> = {};

      for (const response of responses) {
        if (!responsesByQuestion[response.questionId]) {
          const founderResponse = founderResponseMap.get(response.questionId);
          responsesByQuestion[response.questionId] = {
            questionId: response.questionId,
            field: response.field,
            founderAssumption: founderResponse
              ? {
                  value: founderResponse.value,
                  confidence: founderResponse.confidence,
                  isUnsure: founderResponse.isUnsure,
                }
              : null,
            validationResponses: [],
          };
        }

        responsesByQuestion[response.questionId].validationResponses.push({
          sessionId: response.validationSessionId!,
          respondentName: response.validationSession?.respondentName || null,
          value: response.value,
          confidence: response.confidence,
          isUnsure: response.isUnsure,
          additionalContext: response.additionalContext,
          createdAt: response.createdAt,
        });
      }

      // Compute summary statistics
      const summary = computeValidationSummary(
        sessionSummaries,
        founderResponses.map((r) => ({ questionId: r.questionId, value: r.value })),
        responses.map((r) => ({ questionId: r.questionId, value: r.value })),
        getTotalQuestions()
      );

      return NextResponse.json({
        view: 'by-question',
        personaName: persona.name || 'Unknown Persona',
        totalSessions: persona.validationLink.totalSessions,
        totalResponses: persona.validationLink.totalResponses,
        sessions: sessionSummaries,
        responsesByQuestion: responsesByQuestion,
        summary,
      });
    } else {
      // Group responses by session
      const responsesBySession: ValidationResponseBySession[] = [];
      const sessionResponseMap = new Map<
        string,
        ValidationResponseBySession['responses']
      >();

      for (const response of responses) {
        const sessionId = response.validationSessionId!;
        if (!sessionResponseMap.has(sessionId)) {
          sessionResponseMap.set(sessionId, []);
        }

        const founderResponse = founderResponseMap.get(response.questionId);
        sessionResponseMap.get(sessionId)!.push({
          questionId: response.questionId,
          field: response.field,
          value: response.value,
          confidence: response.confidence,
          isUnsure: response.isUnsure,
          additionalContext: response.additionalContext,
          founderAssumption: founderResponse
            ? {
                value: founderResponse.value,
                confidence: founderResponse.confidence,
                isUnsure: founderResponse.isUnsure,
              }
            : null,
        });
      }

      // Build session response objects
      for (const session of sessionSummaries) {
        const sessionResponses = sessionResponseMap.get(session.id) || [];
        if (sessionResponses.length > 0 || !filterQuestionId) {
          responsesBySession.push({
            session,
            responses: sessionResponses,
          });
        }
      }

      // Compute summary statistics
      const summary = computeValidationSummary(
        sessionSummaries,
        founderResponses.map((r) => ({ questionId: r.questionId, value: r.value })),
        responses.map((r) => ({ questionId: r.questionId, value: r.value })),
        getTotalQuestions()
      );

      return NextResponse.json({
        view: 'by-session',
        personaName: persona.name || 'Unknown Persona',
        totalSessions: persona.validationLink.totalSessions,
        totalResponses: persona.validationLink.totalResponses,
        sessions: sessionSummaries,
        responsesBySession: responsesBySession,
        summary,
      });
    }
  } catch (error) {
    console.error('Error fetching validation responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation responses' },
      { status: 500 }
    );
  }
}
