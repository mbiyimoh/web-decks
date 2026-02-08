import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { applyRubricUpdate, ScoreDimension, RubricContent } from '@/lib/central-command/rubric';

const approveSchema = z.object({
  feedbackId: z.string().min(1),
  dimension: z.enum(['strategic', 'value', 'readiness', 'timeline', 'bandwidth']),
  content: z.object({
    description: z.string(),
    indicators: z.object({
      high: z.array(z.string()),
      medium: z.array(z.string()),
      low: z.array(z.string()),
    }),
  }),
  currentVersion: z.number().int().min(0),
  action: z.enum(['approve', 'reject']),
});

/**
 * POST /api/central-command/rubric/approve
 * Approve or reject a proposed rubric change
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

  // Parse and validate
  const body = await request.json();
  const validation = approveSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { feedbackId, dimension, content, currentVersion, action } = validation.data;

  if (action === 'reject') {
    // Feedback already recorded, no rubric change needed
    return NextResponse.json(
      { success: true, rubricUpdated: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    // Apply the approved rubric
    const result = await applyRubricUpdate(
      feedbackId,
      dimension as ScoreDimension,
      content as RubricContent,
      currentVersion
    );

    return NextResponse.json(
      { success: true, rubricUpdated: true, newVersion: result.newVersion },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[central-command/rubric/approve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply rubric update' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
