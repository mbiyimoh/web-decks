import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { refinementResponseSchema, refineRequestSchema } from '@/lib/central-command/schemas';
import { PIPELINE_REFINEMENT_SYSTEM_PROMPT } from '@/lib/central-command/prompts';

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
  const parseResult = refineRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { currentContent, prompt, fieldName } = parseResult.data;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: refinementResponseSchema,
      system: PIPELINE_REFINEMENT_SYSTEM_PROMPT,
      prompt: `Field: ${fieldName}\n\nCurrent content:\n${currentContent}\n\nRefinement request: ${prompt}`,
    });

    return NextResponse.json(object, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('[central-command/refine] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refine content' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
