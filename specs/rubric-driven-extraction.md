# Spec: Rubric-Driven Extraction

**Status:** Implemented
**Author:** Claude Code
**Date:** 2026-02-07
**Related:** Spec 3 (Intelligent Scoring with Learning Loop)

---

## Problem

The extraction prompt uses hardcoded score dimension descriptions. When rubrics evolve via user feedback, the AI doesn't see those refinements — it keeps scoring against stale criteria. This breaks the learning loop.

## Solution

Inject current rubrics into the extraction system prompt so the AI uses the same calibration criteria humans see when reviewing scores.

---

## Requirements

### Functional

1. **Dynamic Prompt Builder** — Create `buildExtractionSystemPrompt(rubrics)` that generates the system prompt with current rubric indicators
2. **Rubric Fetch** — Extract route fetches rubrics via `getAllRubrics()` before each LLM call
3. **Fallback Cache** — Cache the most recent successful rubric fetch; use cached version if DB unavailable
4. **Graceful Degradation** — If no cache exists and DB fails, use `INITIAL_RUBRICS`

### Non-Functional

- Token overhead: ~250 tokens (acceptable)
- No caching between requests (rubric changes are rare, fresh query is fine)
- No schema changes required

---

## Implementation

### Phase 1: Add Prompt Builder

**File:** `lib/central-command/prompts.ts`

Add function that takes rubrics and returns complete system prompt:

```typescript
export function buildExtractionSystemPrompt(
  rubrics: Record<ScoreDimension, RubricContent>
): string {
  // Build score dimension section from rubrics
  const scoreDimensions = Object.entries(rubrics)
    .map(([dim, rubric]) => {
      return `**${dim}** (${rubric.description}):
- Score 7-10 (High): ${rubric.indicators.high.join('; ')}
- Score 4-6 (Medium): ${rubric.indicators.medium.join('; ')}
- Score 1-3 (Low): ${rubric.indicators.low.join('; ')}`;
    })
    .join('\n\n');

  // Return full prompt with dynamic section
  return `${EXTRACTION_PROMPT_BASE}

### Score Assessments (critical)

For each of the 5 scoring dimensions, provide a 1-10 score with evidence-based rationale:

${scoreDimensions}

${EXTRACTION_PROMPT_SUFFIX}`;
}
```

Split existing `PIPELINE_EXTRACTION_SYSTEM_PROMPT` into:
- `EXTRACTION_PROMPT_BASE` — Everything before score dimensions
- `EXTRACTION_PROMPT_SUFFIX` — Everything after (operational extractions, rules)

### Phase 2: Add Rubric Cache

**File:** `lib/central-command/rubric.ts`

Add module-level cache and helper:

```typescript
let cachedRubrics: Record<ScoreDimension, { content: RubricContent; version: number }> | null = null;

export async function getRubricsWithFallback(): Promise<{
  rubrics: Record<ScoreDimension, RubricContent>;
  versions: Record<ScoreDimension, number>;
  source: 'database' | 'cache' | 'initial';
}> {
  try {
    const dbRubrics = await getAllRubrics();
    cachedRubrics = dbRubrics; // Update cache on success
    return {
      rubrics: extractContent(dbRubrics),
      versions: extractVersions(dbRubrics),
      source: 'database',
    };
  } catch (error) {
    if (cachedRubrics) {
      return {
        rubrics: extractContent(cachedRubrics),
        versions: extractVersions(cachedRubrics),
        source: 'cache',
      };
    }
    return {
      rubrics: INITIAL_RUBRICS,
      versions: Object.fromEntries(SCORE_DIMENSIONS.map(d => [d, 0])),
      source: 'initial',
    };
  }
}
```

### Phase 3: Update Extract Route

**File:** `app/api/central-command/extract/route.ts`

```typescript
import { getRubricsWithFallback } from '@/lib/central-command/rubric';
import { buildExtractionSystemPrompt } from '@/lib/central-command/prompts';

// Inside POST handler, before LLM call:
const { rubrics, versions, source } = await getRubricsWithFallback();
const systemPrompt = buildExtractionSystemPrompt(rubrics);

if (source !== 'database') {
  console.warn(`[extract] Using ${source} rubrics`);
}

// Pass systemPrompt to generateObject instead of PIPELINE_EXTRACTION_SYSTEM_PROMPT
```

---

## Files Changed

| File | Change |
|------|--------|
| `lib/central-command/prompts.ts` | Split prompt, add `buildExtractionSystemPrompt()` |
| `lib/central-command/rubric.ts` | Add cache, add `getRubricsWithFallback()` |
| `app/api/central-command/extract/route.ts` | Fetch rubrics, build dynamic prompt |

---

## Testing

1. **Manual:** Run extraction, verify scores align with current rubric definitions
2. **Fallback:** Temporarily break DB connection, verify cache/initial fallback works
3. **Learning loop:** Adjust a rubric via feedback, run new extraction, verify new criteria reflected

---

## Success Criteria

- [ ] Extraction scores reflect current rubric definitions
- [ ] Rubric updates via feedback affect subsequent extractions
- [ ] Graceful fallback to cache or INITIAL_RUBRICS on DB failure
- [ ] No regression in extraction quality
- [ ] Console logs indicate rubric source (database/cache/initial)

---

## Non-Goals

- Rubric version tracking in extraction response (can add later)
- Caching rubrics across requests (not needed given low volume)
- Modifying the rubric structure itself
