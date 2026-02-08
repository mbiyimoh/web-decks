import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { getAllRubrics, getRubricFeedbackHistory } from '@/lib/central-command/rubric';

/**
 * GET /api/central-command/rubric
 * Returns all active rubrics and feedback history
 */
export async function GET(request: NextRequest) {
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

  try {
    const [rubrics, feedbackHistory] = await Promise.all([
      getAllRubrics(),
      getRubricFeedbackHistory(20),
    ]);

    return NextResponse.json(
      { rubrics, feedbackHistory },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[central-command/rubric] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
