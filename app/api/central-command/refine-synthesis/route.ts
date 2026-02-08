import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { refineSynthesisRequestSchema, refineSynthesisResponseSchema } from '@/lib/central-command/schemas';
import { SYNTHESIS_REFINEMENT_SYSTEM_PROMPT } from '@/lib/central-command/prompts';

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const parseResult = refineSynthesisRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { currentSynthesis, currentScores, prompt } = parseResult.data;

  // Build context showing current sections
  const sectionContext = Object.entries(currentSynthesis)
    .filter(([, val]) => val)
    .map(([key, val]) => `### ${key}\n${val}`)
    .join('\n\n');

  // Build score context if provided
  const scoreContext = currentScores
    ? Object.entries(currentScores)
        .filter(([, val]) => val)
        .map(([key, val]) => `### ${key} Score: ${val!.score}/10\nRationale: ${val!.rationale}\nEvidence: ${val!.evidence.join(', ')}`)
        .join('\n\n')
    : '';

  // Combine contexts
  const fullContext = scoreContext
    ? `Current synthesis:\n\n${sectionContext}\n\nCurrent scores:\n\n${scoreContext}`
    : `Current synthesis:\n\n${sectionContext}`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: refineSynthesisResponseSchema,
      system: SYNTHESIS_REFINEMENT_SYSTEM_PROMPT,
      prompt: `${fullContext}\n\nRefinement request: ${prompt}`,
    });

    return NextResponse.json(object, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('[central-command/refine-synthesis] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refine synthesis' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
