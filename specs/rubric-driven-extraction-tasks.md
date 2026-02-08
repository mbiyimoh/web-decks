# Task Breakdown: Rubric-Driven Extraction

**Generated:** 2026-02-07
**Source:** specs/rubric-driven-extraction.md

---

## Overview

Connect the scoring rubric learning loop to the extraction pipeline by injecting current rubrics into the system prompt. This ensures AI scoring aligns with human-calibrated criteria.

**Files to modify:** 3
**Estimated LOC:** ~80

---

## Phase 1: Prompt Infrastructure

### Task 1.1: Split System Prompt into Base and Suffix

**Description:** Split `PIPELINE_EXTRACTION_SYSTEM_PROMPT` into composable parts
**Size:** Small
**Priority:** High
**Dependencies:** None

**Technical Requirements:**
- Keep the existing prompt's structure and quality
- Create `EXTRACTION_PROMPT_BASE` containing lines 1-35 (everything before "### Score Assessments")
- Create `EXTRACTION_PROMPT_SUFFIX` containing lines 50-77 (operational extractions and rules)
- Export both constants

**Implementation:**

In `lib/central-command/prompts.ts`, split the existing prompt:

```typescript
// Base prompt - everything before score dimensions
export const EXTRACTION_PROMPT_BASE = `You are a client intelligence analyst for 33 Strategies, a strategy consulting firm. Your PRIMARY job is to synthesize a rich understanding of who this prospect is, what they want, and whether we should work with them. Your SECONDARY job is to extract operational details (contacts, next actions, dates).

## Context: 33 Strategies
33 Strategies helps companies with strategic consulting — product strategy, customer clarity, go-to-market. Our clients range from funded startups to established mid-market companies. We evaluate every prospect on 5 dimensions to decide whether to pursue them and how to approach the pitch.

## Your Output Has Two Parts

### PART 1: Client Synthesis (PRIMARY — this is the main value)

Write a thorough, synthesized profile of this prospect based on the text. This is NOT a summary — it's an analysis. Connect dots, identify patterns, and draw conclusions that help 33 Strategies decide whether and how to engage.

**companyOverview**: Who are they? What do they do? What's their market position, stage, and scale? If the text mentions funding, team size, or notable achievements, include them.

**goalsAndVision**: What are they trying to accomplish? What does success look like to them? What metrics are they tracking? What's their vision for the future? Even if they don't say it explicitly, what can you infer from their pain points about what they WANT?

**painAndBlockers**: What's getting in their way? What have they tried that didn't work? What are they frustrated by? What's the gap between where they are and where they want to be? Be specific — "they struggle with customer acquisition" is better than "they have challenges."

**decisionDynamics**: Who makes the buying decision? What do they care about? Are they comparing alternatives? What would make them say yes vs. no? Any political dynamics, stakeholder concerns, or procurement process hints?

**strategicAssessment**: Your analysis for 33 Strategies. Should we pursue this? What makes them interesting or risky? Are they a good fit for what we do? Be honest — flag concerns.

**recommendedApproach**: If we pursue them, how should we pitch? What should we lead with? What angle resonates with their stated needs? What should we avoid? Be tactical.

**stakeholders**: Extract ALL individuals mentioned in the text, tagging each with their role in the buying/decision process.`;

// Suffix prompt - operational extractions and rules
export const EXTRACTION_PROMPT_SUFFIX = `### PART 2: Operational Extractions (SECONDARY)

Extract specific data points into recommendations:

**Categories and field mapping:**
- **company_info** → name, industry, website (only explicit mentions)
- **contact_info** → contactName, contactRole, contactEmail, contactPhone, contactLinkedin
- **goals_vision** → notes (append key goals/metrics verbatim)
- **pain_blockers** → notes (append specific pain points verbatim)
- **decision_dynamics** → notes (append decision-maker info verbatim)
- **next_action** → nextAction (specific follow-up items)
- **budget_signal** → potentialValue (extract as integer, e.g., 15000 not "$15K")
- **timeline_signal** → notes (append timing context)

## Rules
1. Synthesis should be thorough even from limited text — connect dots and infer where reasonable
2. Score assessments MUST cite specific evidence from the text. If no evidence exists for a dimension, score it 5 (neutral) and say "No evidence in text"
3. Operational extractions should be factual and concise — only things explicitly stated
4. Keep capturedText concise (3-15 words), suggestedValue clean and formatted
5. For monetary values, extract as integers
6. Clean up verbal noise (um, uh, like, so yeah) from values
7. The overallSummary should be a compelling 1-2 sentence pitch for WHY we should care about this prospect

## Confidence Scoring (for operational extractions)
- 0.9-1.0: Explicitly stated, unambiguous
- 0.6-0.89: Strongly implied, high confidence
- 0.3-0.59: Moderately implied, some ambiguity
- <0.3: Don't include (too uncertain)`;
```

**Acceptance Criteria:**
- [ ] `EXTRACTION_PROMPT_BASE` exported and contains context + synthesis sections
- [ ] `EXTRACTION_PROMPT_SUFFIX` exported and contains operational extractions + rules
- [ ] Original `PIPELINE_EXTRACTION_SYSTEM_PROMPT` still works (backward compatible)
- [ ] No TypeScript errors

---

### Task 1.2: Create Dynamic Prompt Builder Function

**Description:** Add `buildExtractionSystemPrompt()` that injects rubrics
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1

**Technical Requirements:**
- Function accepts rubrics record keyed by dimension
- Formats each rubric with high/medium/low indicators
- Returns complete system prompt string

**Implementation:**

Add to `lib/central-command/prompts.ts`:

```typescript
import type { ScoreDimension, RubricContent } from './rubric';

/**
 * Build extraction system prompt with current rubrics injected.
 * This ensures AI scoring aligns with human-calibrated criteria.
 */
export function buildExtractionSystemPrompt(
  rubrics: Record<ScoreDimension, RubricContent>
): string {
  // Format each rubric dimension with indicators
  const scoreDimensions = Object.entries(rubrics)
    .map(([dim, rubric]) => {
      return `**${dim}** (${rubric.description}):
- Score 7-10 (High): ${rubric.indicators.high.join('; ')}
- Score 4-6 (Medium): ${rubric.indicators.medium.join('; ')}
- Score 1-3 (Low): ${rubric.indicators.low.join('; ')}`;
    })
    .join('\n\n');

  return `${EXTRACTION_PROMPT_BASE}

### Score Assessments (critical)

For each of the 5 scoring dimensions, provide a 1-10 score with evidence-based rationale:

${scoreDimensions}

${EXTRACTION_PROMPT_SUFFIX}`;
}
```

**Acceptance Criteria:**
- [ ] Function compiles without TypeScript errors
- [ ] Output includes all 5 rubric dimensions
- [ ] Each dimension shows high/medium/low indicators
- [ ] Full prompt is well-formed (no missing sections)

---

## Phase 2: Rubric Fetching with Fallback

### Task 2.1: Add Module-Level Rubric Cache and Fallback Helper

**Description:** Create `getRubricsWithFallback()` with 3-tier fallback
**Size:** Medium
**Priority:** High
**Dependencies:** None (can run parallel with Phase 1)

**Technical Requirements:**
- Module-level cache variable for last successful fetch
- Try database first, update cache on success
- Fall back to cache if DB fails
- Fall back to INITIAL_RUBRICS if no cache
- Return source indicator for logging

**Implementation:**

Add to `lib/central-command/rubric.ts`:

```typescript
// Module-level cache for fallback
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
 * Get rubrics with 3-tier fallback: database → cache → initial
 * Updates cache on successful database fetch.
 */
export async function getRubricsWithFallback(): Promise<{
  rubrics: Record<ScoreDimension, RubricContent>;
  versions: Record<ScoreDimension, number>;
  source: 'database' | 'cache' | 'initial';
}> {
  try {
    const dbRubrics = await getAllRubrics();
    cachedRubrics = dbRubrics; // Update cache on success
    return {
      rubrics: extractRubricContent(dbRubrics),
      versions: extractRubricVersions(dbRubrics),
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
```

**Acceptance Criteria:**
- [ ] Cache updates on successful DB fetch
- [ ] Returns cached rubrics when DB fails
- [ ] Returns INITIAL_RUBRICS when no cache exists
- [ ] Source field correctly indicates origin
- [ ] No TypeScript errors

---

## Phase 3: Route Integration

### Task 3.1: Update Extract Route to Use Dynamic Prompt

**Description:** Wire up rubric fetch and dynamic prompt in extraction
**Size:** Small
**Priority:** High
**Dependencies:** Tasks 1.2, 2.1

**Technical Requirements:**
- Import new functions
- Fetch rubrics before LLM call
- Build dynamic prompt with rubrics
- Log source for debugging
- Use dynamic prompt in both first and second pass

**Implementation:**

Update `app/api/central-command/extract/route.ts`:

```typescript
// Add imports at top
import { getRubricsWithFallback } from '@/lib/central-command/rubric';
import { buildExtractionSystemPrompt, GAP_ANALYSIS_SYSTEM_PROMPT, EXTRACTION_GAP_ANALYSIS_PROMPT } from '@/lib/central-command/prompts';

// Inside POST handler, before LLM calls (after input validation):

// Fetch current rubrics with fallback
const { rubrics, versions, source } = await getRubricsWithFallback();
const systemPrompt = buildExtractionSystemPrompt(rubrics);

if (source !== 'database') {
  console.warn(`[central-command/extract] Using ${source} rubrics (versions: ${JSON.stringify(versions)})`);
} else {
  console.log(`[central-command/extract] Using database rubrics (versions: ${JSON.stringify(versions)})`);
}

// First pass: Use dynamic system prompt
const { object: firstPassExtraction } = await generateObject({
  model: openai('gpt-4o'),
  schema: pipelineExtractionSchema,
  system: systemPrompt,  // Changed from PIPELINE_EXTRACTION_SYSTEM_PROMPT
  prompt: userPrompt,
});

// Second pass remains the same (uses GAP_ANALYSIS_SYSTEM_PROMPT)
```

**Acceptance Criteria:**
- [ ] Route compiles without errors
- [ ] Rubrics fetched before LLM call
- [ ] Dynamic prompt used for first pass extraction
- [ ] Console logs indicate rubric source and versions
- [ ] Extraction still works correctly

---

## Summary

| Phase | Tasks | Can Parallelize |
|-------|-------|-----------------|
| Phase 1 | 1.1, 1.2 | 1.1 → 1.2 (sequential) |
| Phase 2 | 2.1 | Yes (parallel with Phase 1) |
| Phase 3 | 3.1 | Requires 1.2 + 2.1 |

**Critical Path:** 1.1 → 1.2 → 3.1 (with 2.1 parallel to Phase 1)

**Total Tasks:** 4
**Estimated Time:** ~30 minutes implementation + testing
