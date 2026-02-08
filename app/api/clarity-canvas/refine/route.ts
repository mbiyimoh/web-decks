import { NextRequest, NextResponse } from 'next/server';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { RefineRecommendationRequest, RefineRecommendationResponse } from '@/lib/clarity-canvas/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<RefineRecommendationResponse | { error: string }>> {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RefineRecommendationRequest;
    const { currentContent, currentSummary, prompt, fieldKey } = body;

    if (!currentContent || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        refinedContent: z.string().describe('The refined content'),
        refinedSummary: z.string().max(150).describe('Updated summary (max 150 chars)'),
      }),
      system: `You are an expert at refining profile recommendations.
Maintain the core meaning while applying the user's requested changes.
Keep content concise and professional. The summary must be under 150 characters.`,
      prompt: `Current content:\n${currentContent}\n\nCurrent summary:\n${currentSummary}\n\nField: ${fieldKey}\n\nRefinement request: ${prompt}`,
    });

    return NextResponse.json({
      refinedContent: object.refinedContent,
      refinedSummary: object.refinedSummary,
    });
  } catch (error) {
    console.error('Refinement error:', error);
    return NextResponse.json({ error: 'Failed to refine recommendation' }, { status: 500 });
  }
}
