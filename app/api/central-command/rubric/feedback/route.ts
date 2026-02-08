import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { recordFeedbackAndProposeRubricUpdate, SCORE_DIMENSIONS, ScoreDimension } from '@/lib/central-command/rubric';

const rubricFeedbackSchema = z.object({
  dimension: z.enum(['strategic', 'value', 'readiness', 'timeline', 'bandwidth']),
  prospectId: z.string().min(1),
  originalScore: z.number().min(1).max(10),
  adjustedScore: z.number().min(1).max(10),
  feedback: z.string().min(1),
});

/**
 * POST /api/central-command/rubric/feedback
 * Record user feedback and potentially update the rubric
 */
export async function POST(request: NextRequest) {
  // Auth check
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (!isSessionValidForCentralCommand(session)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const validation = rubricFeedbackSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const data = validation.data;

  try {
    const result = await recordFeedbackAndProposeRubricUpdate({
      dimension: data.dimension as ScoreDimension,
      prospectId: data.prospectId,
      originalScore: data.originalScore,
      adjustedScore: data.adjustedScore,
      feedback: data.feedback,
    });

    return NextResponse.json(
      {
        success: true,
        feedbackId: result.feedbackId,
        hasProposal: result.hasProposal,
        currentRubric: result.currentRubric,
        currentVersion: result.currentVersion,
        proposedRubric: result.proposedRubric,
        reasoning: result.reasoning,
        dimension: result.dimension,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[central-command/rubric/feedback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
