// rubric.ts — Scoring rubric management with learning loop
import OpenAI from 'openai';
import prisma from '@/lib/prisma';

// Types
export type ScoreDimension = 'strategic' | 'value' | 'readiness' | 'timeline' | 'bandwidth';

export interface RubricContent {
  description: string;
  indicators: {
    high: string[];   // 7-10 signals
    medium: string[]; // 4-6 signals
    low: string[];    // 1-3 signals
  };
}

export interface RubricFeedbackInput {
  dimension: ScoreDimension;
  prospectId: string;
  originalScore: number;
  adjustedScore: number;
  feedback: string;
}

export interface RubricUpdateResult {
  rubricUpdated: boolean;
  newVersion?: number;
  changeSummary?: string;
}

export interface RubricProposalResult {
  feedbackId: string;
  hasProposal: boolean;
  currentRubric: RubricContent;
  currentVersion: number;
  proposedRubric: RubricContent | null;
  reasoning: string;
  dimension: ScoreDimension;
}

// All scoring dimensions
export const SCORE_DIMENSIONS: ScoreDimension[] = [
  'strategic',
  'value',
  'readiness',
  'timeline',
  'bandwidth',
];

// Initial rubrics — seeded from PIPELINE_EXTRACTION_SYSTEM_PROMPT
export const INITIAL_RUBRICS: Record<ScoreDimension, RubricContent> = {
  strategic: {
    description: 'Logo/Brand/Network Value — Would having this client add credibility? Are they a recognizable brand? Is the contact well-networked for referrals? Strategic industry entry point?',
    indicators: {
      high: [
        'Marquee brand with strong recognition',
        'Well-connected executive who can refer to other valuable clients',
        'Strategic entry point into new industry or market',
        'Notable achievements or press coverage that enhance our portfolio',
      ],
      medium: [
        'Known brand in their niche',
        'Some network connections but limited reach',
        'Established company but not high-visibility',
        'Moderate referral potential',
      ],
      low: [
        'Unknown brand with no referral potential',
        'Limited network reach or isolated contact',
        'No strategic value beyond the deal itself',
        'Early-stage with no brand equity yet',
      ],
    },
  },
  value: {
    description: 'Revenue Potential — How much could this deal be worth? Are there signals about budget, funding, or willingness to pay? Expansion potential?',
    indicators: {
      high: [
        'Explicit budget mention ($50k+)',
        'Recently funded company with capital to deploy',
        'Large scope with expansion potential',
        'Clear willingness to invest in quality',
      ],
      medium: [
        'Implied budget exists but not quantified',
        'Mid-size scope with some growth signals',
        'Stable company with moderate spending capacity',
        'Multiple engagement opportunities possible',
      ],
      low: [
        'Bootstrapped with no budget signals',
        'Very small scope with no expansion path',
        'Cost-sensitive framing or price shopping',
        'One-time project with limited follow-on',
      ],
    },
  },
  readiness: {
    description: 'Ready to Buy — How acute is their pain? Have they tried other solutions and failed? Actively searching or just exploring?',
    indicators: {
      high: [
        '"We need this now" urgency in language',
        'Previous failed attempts at solving the problem',
        'Active buying behavior (comparing vendors, scheduling calls)',
        'Clear gap between current state and desired state',
      ],
      medium: [
        'Acknowledged problem but no urgency',
        'Exploring options without commitment',
        'Some internal alignment on the need',
        'Budget cycle coming up soon',
      ],
      low: [
        '"Just curious" or "maybe someday" framing',
        'No active problem — looking for future planning',
        'Internal alignment unclear or lacking',
        'No decision timeline established',
      ],
    },
  },
  timeline: {
    description: 'Urgency — Is there a forcing function? A deadline? Board meeting? Product launch? External pressure?',
    indicators: {
      high: [
        'Explicit deadline mentioned (launch date, board meeting)',
        'External forcing function (regulatory, competitive)',
        'Q-end budget that must be spent',
        'Critical milestone dependent on our work',
      ],
      medium: [
        'Soft deadline without hard consequences',
        'General timeline goals without specifics',
        'Some time pressure but flexible',
        'Planning for a future event',
      ],
      low: [
        'Open-ended timeline with no urgency',
        'No external pressure or forcing function',
        'Can push indefinitely without consequence',
        'Exploratory with no decision point',
      ],
    },
  },
  bandwidth: {
    description: 'Our Capacity Fit — How complex is this engagement? Do we have the right skills? Would this take significant capacity? (Higher = easier for us)',
    indicators: {
      high: [
        'Aligns with our core capabilities',
        'Similar to past successful engagements',
        'Clear scope that we can scope confidently',
        'Standard deliverables we know how to produce',
      ],
      medium: [
        'Some new elements but manageable',
        'Requires coordination but not exceptional effort',
        'Moderate complexity with some unknowns',
        'Team can handle with current capacity',
      ],
      low: [
        'Requires capabilities we would need to build',
        'Highly complex with many dependencies',
        'Would consume significant team capacity',
        'Novel domain with steep learning curve',
      ],
    },
  },
};

/**
 * Get the current active rubric for a dimension.
 * Falls back to INITIAL_RUBRICS if no database rubric exists.
 */
export async function getCurrentRubric(dimension: ScoreDimension): Promise<{
  content: RubricContent;
  version: number;
  id?: string;
}> {
  const rubric = await prisma.scoringRubric.findFirst({
    where: { dimension, isActive: true },
    orderBy: { version: 'desc' },
  });

  if (rubric) {
    return {
      content: rubric.content as unknown as RubricContent,
      version: rubric.version,
      id: rubric.id,
    };
  }

  // Fallback to initial rubric
  return {
    content: INITIAL_RUBRICS[dimension],
    version: 0,
  };
}

/**
 * Get all active rubrics for all dimensions.
 */
export async function getAllRubrics(): Promise<Record<ScoreDimension, {
  content: RubricContent;
  version: number;
  id?: string;
}>> {
  const result = {} as Record<ScoreDimension, { content: RubricContent; version: number; id?: string }>;

  for (const dimension of SCORE_DIMENSIONS) {
    result[dimension] = await getCurrentRubric(dimension);
  }

  return result;
}

// ============================================================================
// RUBRIC FETCH WITH FALLBACK (for extraction pipeline)
// ============================================================================

// Module-level cache for fallback when DB is unavailable
let cachedRubrics: Record<ScoreDimension, { content: RubricContent; version: number }> | null = null;

/**
 * Helper to extract just the content from rubrics record
 */
function extractRubricContent(
  rubrics: Record<ScoreDimension, { content: RubricContent; version: number }>
): Record<ScoreDimension, RubricContent> {
  return Object.fromEntries(
    Object.entries(rubrics).map(([k, v]) => [k, v.content])
  ) as Record<ScoreDimension, RubricContent>;
}

/**
 * Helper to extract versions from rubrics record
 */
function extractRubricVersions(
  rubrics: Record<ScoreDimension, { content: RubricContent; version: number }>
): Record<ScoreDimension, number> {
  return Object.fromEntries(
    Object.entries(rubrics).map(([k, v]) => [k, v.version])
  ) as Record<ScoreDimension, number>;
}

/**
 * Get rubrics with 3-tier fallback: database → cache → initial.
 * Updates cache on successful database fetch.
 *
 * Use this in the extraction pipeline to ensure rubrics are always available
 * even if the database is temporarily unavailable.
 */
export async function getRubricsWithFallback(): Promise<{
  rubrics: Record<ScoreDimension, RubricContent>;
  versions: Record<ScoreDimension, number>;
  source: 'database' | 'cache' | 'initial';
}> {
  try {
    const dbRubrics = await getAllRubrics();
    // Update cache on success (strip optional id field for cache)
    cachedRubrics = Object.fromEntries(
      Object.entries(dbRubrics).map(([k, v]) => [k, { content: v.content, version: v.version }])
    ) as Record<ScoreDimension, { content: RubricContent; version: number }>;

    return {
      rubrics: extractRubricContent(cachedRubrics),
      versions: extractRubricVersions(cachedRubrics),
      source: 'database',
    };
  } catch (error) {
    console.warn('[rubric] Database fetch failed, trying fallback:', error);

    if (cachedRubrics) {
      return {
        rubrics: extractRubricContent(cachedRubrics),
        versions: extractRubricVersions(cachedRubrics),
        source: 'cache',
      };
    }

    // Ultimate fallback to initial rubrics
    return {
      rubrics: INITIAL_RUBRICS,
      versions: Object.fromEntries(
        SCORE_DIMENSIONS.map(d => [d, 0])
      ) as Record<ScoreDimension, number>,
      source: 'initial',
    };
  }
}

/**
 * Get feedback history for transparency.
 */
export async function getRubricFeedbackHistory(limit: number = 20): Promise<{
  id: string;
  dimension: string;
  originalScore: number;
  adjustedScore: number;
  feedback: string;
  createdAt: Date;
  createdRubricVersion?: number;
  prospectName?: string;
}[]> {
  const feedback = await prisma.rubricFeedback.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      createdRubric: { select: { version: true } },
      prospect: { select: { name: true } },
    },
  });

  return feedback.map((f) => ({
    id: f.id,
    dimension: f.dimension,
    originalScore: f.originalScore,
    adjustedScore: f.adjustedScore,
    feedback: f.feedback,
    createdAt: f.createdAt,
    createdRubricVersion: f.createdRubric?.version,
    prospectName: f.prospect.name,
  }));
}

/**
 * Record feedback and propose a rubric update for user review.
 * Does NOT apply the rubric change — returns a proposal instead.
 */
export async function recordFeedbackAndProposeRubricUpdate(
  input: RubricFeedbackInput
): Promise<RubricProposalResult> {
  const { dimension, prospectId, originalScore, adjustedScore, feedback } = input;

  // 1. Record the feedback (always)
  const feedbackRecord = await prisma.rubricFeedback.create({
    data: {
      dimension,
      prospectId,
      originalScore,
      adjustedScore,
      feedback,
    },
  });

  // 2. Get current rubric
  const current = await getCurrentRubric(dimension);

  // 3. Generate proposed update via LLM
  const proposal = await generateRubricUpdate(dimension, current.content, {
    originalScore,
    adjustedScore,
    feedback,
  });

  // 4. Return proposal for user review (don't apply yet)
  return {
    feedbackId: feedbackRecord.id,
    hasProposal: proposal.hasChanges,
    currentRubric: current.content,
    currentVersion: current.version,
    proposedRubric: proposal.hasChanges ? proposal.content : null,
    reasoning: proposal.reasoning ?? 'No changes needed based on this feedback.',
    dimension,
  };
}

/**
 * Apply an approved rubric update.
 * Called after user approves a proposal from recordFeedbackAndProposeRubricUpdate.
 * Uses a transaction to prevent race conditions between deactivate and create.
 */
export async function applyRubricUpdate(
  feedbackId: string,
  dimension: ScoreDimension,
  content: RubricContent,
  currentVersion: number
): Promise<{ success: boolean; newVersion: number }> {
  // Use transaction to ensure atomicity
  const newRubric = await prisma.$transaction(async (tx) => {
    // Deactivate current version
    await tx.scoringRubric.updateMany({
      where: { dimension, isActive: true },
      data: { isActive: false },
    });

    // Create new version
    return tx.scoringRubric.create({
      data: {
        dimension,
        version: currentVersion + 1,
        content: content as object,
        isActive: true,
        triggeringFeedbackId: feedbackId,
      },
    });
  });

  return { success: true, newVersion: newRubric.version };
}

/**
 * Generate rubric update via LLM.
 * On failure, returns no changes — feedback is still recorded.
 */
async function generateRubricUpdate(
  dimension: string,
  currentRubric: RubricContent,
  feedback: { originalScore: number; adjustedScore: number; feedback: string }
): Promise<{ hasChanges: boolean; content: RubricContent; reasoning?: string }> {
  const prompt = `You are refining a scoring rubric for evaluating B2B sales prospects.

## Current Rubric for "${dimension}"
${JSON.stringify(currentRubric, null, 2)}

## User Feedback
The AI scored a prospect ${feedback.originalScore}/10, but the user adjusted it to ${feedback.adjustedScore}/10.
User's reasoning: "${feedback.feedback}"

## Your Task
Determine if this feedback reveals a gap in the current rubric. If so, update the rubric to capture this insight.

Rules:
1. Only make changes if the feedback reveals a genuine gap or miscalibration
2. Add specific indicators, don't just rephrase existing ones
3. If the feedback is prospect-specific and doesn't generalize, don't change the rubric
4. Maintain the high/medium/low structure
5. Keep indicator lists concise (4-5 items per level max)

Return JSON:
{
  "hasChanges": boolean,
  "reasoning": "Why you did or didn't update the rubric",
  "content": { "description": "...", "indicators": { "high": [...], "medium": [...], "low": [...] } }
}`;

  try {
    const openai = new OpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a scoring rubric analyst. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      hasChanges: result.hasChanges ?? false,
      content: result.content ?? currentRubric,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('Failed to generate rubric update:', error);
    // On LLM failure, return no changes — feedback is still recorded
    return { hasChanges: false, content: currentRubric };
  }
}
