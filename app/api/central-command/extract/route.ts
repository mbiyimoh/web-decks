import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import {
  pipelineExtractionSchema,
  extractRequestSchema,
} from '@/lib/central-command/schemas';
import { buildExtractionSystemPrompt, GAP_ANALYSIS_SYSTEM_PROMPT, EXTRACTION_GAP_ANALYSIS_PROMPT } from '@/lib/central-command/prompts';
import { getRubricsWithFallback } from '@/lib/central-command/rubric';

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
  const parseResult = extractRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { inputText, context } = parseResult.data;

  // Short-circuit trivial input
  if (inputText.trim().length < 10) {
    return NextResponse.json(
      { recommendations: [], overallSummary: 'Input too short to extract.' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    // Fetch current rubrics with fallback (database → cache → initial)
    const { rubrics, versions, source } = await getRubricsWithFallback();
    const systemPrompt = buildExtractionSystemPrompt(rubrics);

    if (source !== 'database') {
      console.warn(`[central-command/extract] Using ${source} rubrics (versions: ${JSON.stringify(versions)})`);
    } else {
      console.log(`[central-command/extract] Using database rubrics (versions: ${JSON.stringify(versions)})`);
    }

    // Build prompt with context
    let userPrompt = `Extract pipeline information from this text:\n\n"${inputText}"`;
    if (context?.existingClientName) {
      userPrompt += `\n\nContext: This is about an existing prospect named "${context.existingClientName}". Avoid duplicating known information.`;
    }

    // First pass: Initial extraction with dynamic rubrics
    const { object: firstPassExtraction } = await generateObject({
      model: openai('gpt-4o'),
      schema: pipelineExtractionSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    // Second pass: Gap analysis (quality audit)
    let finalExtraction = firstPassExtraction;
    try {
      const { object: secondPassExtraction } = await generateObject({
        model: openai('gpt-4o'),
        schema: pipelineExtractionSchema,
        system: GAP_ANALYSIS_SYSTEM_PROMPT,
        prompt: `${EXTRACTION_GAP_ANALYSIS_PROMPT}

Pay special attention to the synthesis sections (companyOverview, goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach). Ensure each captures the full richness from the source. Also verify each score assessment has proper evidence from the text.

ORIGINAL SOURCE TEXT:
${inputText}

FIRST PASS EXTRACTION:
${JSON.stringify(firstPassExtraction, null, 2)}

Return the complete, final extraction with all sections properly audited.`,
      });
      finalExtraction = secondPassExtraction;

      // Log improvement metrics
      console.log(`[central-command/extract] First pass: ${firstPassExtraction.recommendations.length} recommendations`);
      console.log(`[central-command/extract] Second pass: ${finalExtraction.recommendations.length} recommendations`);
    } catch (gapError) {
      console.warn('[central-command/extract] Gap analysis failed, using first-pass results:', gapError);
      // Graceful degradation: use first pass if second fails
    }

    return NextResponse.json(finalExtraction, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('[central-command/extract] Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract information from text' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
