# Rubric-Driven Extraction: Connect Learning Loop to AI Scoring

**Slug:** rubric-driven-extraction
**Author:** Claude Code
**Date:** 2026-02-07
**Branch:** feat/rubric-driven-extraction
**Related:** Spec 3 (Intelligent Scoring with Learning Loop)

---

## 1) Intent & Assumptions

- **Task brief:** Inject the current scoring rubrics (which evolve via user feedback) into the extraction prompt so the AI uses the same calibration criteria that humans see when reviewing scores. This closes the loop between human feedback and AI behavior.

- **Assumptions:**
  - Rubrics already exist in the database (seeded or evolved through feedback)
  - The extraction API has access to the database (it does - it's a server-side route)
  - Prompt token budget can accommodate rubric context (~500-800 additional tokens)
  - gpt-4o can effectively use structured rubric criteria for scoring

- **Out of scope:**
  - Changing the rubric structure itself
  - Modifying the feedback/learning loop mechanism
  - Re-training or fine-tuning models
  - Caching rubrics (can optimize later)

---

## 2) Pre-reading Log

- `lib/central-command/prompts.ts`: Contains `PIPELINE_EXTRACTION_SYSTEM_PROMPT` with hardcoded score dimension descriptions (lines 36-48). This is the static content that needs to become dynamic.

- `lib/central-command/rubric.ts`: Contains `getAllRubrics()` function that retrieves all 5 active rubrics with their high/medium/low indicators. Perfect for injection.

- `app/api/central-command/extract/route.ts`: The extraction endpoint. Uses `PIPELINE_EXTRACTION_SYSTEM_PROMPT` directly. Integration point is here.

- `lib/central-command/schemas.ts`: The `scoreAssessmentSchema` defines what the AI outputs (score, rationale, evidence, confidence). Rubric indicators should guide rationale generation.

---

## 3) Codebase Map

- **Primary files:**
  - `lib/central-command/prompts.ts` — System prompts (modify to accept dynamic rubric)
  - `app/api/central-command/extract/route.ts` — API endpoint (fetch + inject rubrics)
  - `lib/central-command/rubric.ts` — Rubric retrieval (already has `getAllRubrics()`)

- **Shared dependencies:**
  - Prisma client (already used in rubric.ts)
  - `RubricContent` type (high/medium/low indicators)

- **Data flow:**
  1. User submits text → `/api/central-command/extract`
  2. Route fetches rubrics via `getAllRubrics()`
  3. Route builds dynamic system prompt with rubric context
  4. gpt-4o extracts with rubric-calibrated scoring
  5. Scores returned align with current rubric definitions

- **Potential blast radius:**
  - Only affects extraction scoring accuracy (positive change)
  - Slightly increases token usage per extraction call
  - No UI changes required

---

## 4) Root Cause Analysis

N/A — This is a feature enhancement, not a bug fix.

---

## 5) Research

### Potential Solutions

**Option A: Dynamic Prompt Builder Function**
Create a `buildExtractionPrompt(rubrics)` function that generates the full system prompt with current rubric indicators embedded.

- **Pros:**
  - Clean separation of concerns
  - Rubrics injected as structured content
  - Easy to test prompt generation independently
  - Full flexibility in how rubrics are formatted

- **Cons:**
  - Requires refactoring the static prompt
  - Need to handle fallback if rubric fetch fails

**Option B: Prompt Template with Placeholder Substitution**
Keep the static prompt but use template markers (`{{RUBRIC_STRATEGIC}}`) that get replaced at runtime.

- **Pros:**
  - Minimal changes to existing prompt structure
  - Easy to understand diff

- **Cons:**
  - String replacement is fragile
  - Harder to maintain long-term
  - Awkward for multi-line content

**Option C: Two-Part System Prompt (Base + Rubric Addendum)**
Keep the base prompt and append a "Scoring Calibration" section with current rubrics.

- **Pros:**
  - Preserves existing prompt entirely
  - Additive change — lower risk
  - Clear separation of static vs dynamic content

- **Cons:**
  - Slightly longer prompt overall
  - Rubric section might feel tacked-on

### Recommendation

**Option A (Dynamic Prompt Builder)** is the cleanest long-term solution. It:
- Makes rubric integration explicit and testable
- Allows formatting rubrics optimally for LLM consumption
- Handles graceful degradation if rubric fetch fails
- Sets the pattern for future dynamic prompt needs

---

## 6) Clarification

1. **Token budget:** Should we enforce a rubric summary length limit to control token costs? Current rubrics are ~50 tokens per dimension (~250 total), which is reasonable.

2. **Caching:** Should rubrics be cached per-request, or is a fresh DB query acceptable? (Rubrics change rarely — caching could be added later if needed)

3. **Fallback behavior:** If rubric fetch fails, should we use hardcoded INITIAL_RUBRICS or let extraction proceed without rubrics? (Recommendation: use INITIAL_RUBRICS as fallback)

---

## 7) Implementation Plan

### Phase 1: Create Dynamic Prompt Builder

**File:** `lib/central-command/prompts.ts`

1. Create new function `buildExtractionSystemPrompt(rubrics: Record<ScoreDimension, RubricContent>): string`
2. Replace the hardcoded score dimension descriptions with rubric-derived content
3. Format each dimension as:
   ```
   **{dimension}** ({rubric.description}):
   - Score 7-10 (High): {indicators.high.join('; ')}
   - Score 4-6 (Medium): {indicators.medium.join('; ')}
   - Score 1-3 (Low): {indicators.low.join('; ')}
   ```
4. Keep `PIPELINE_EXTRACTION_SYSTEM_PROMPT` as base template or deprecate it

### Phase 2: Update Extraction Route

**File:** `app/api/central-command/extract/route.ts`

1. Import `getAllRubrics` from `lib/central-command/rubric`
2. Import `buildExtractionSystemPrompt` from prompts
3. Before LLM call:
   ```typescript
   const rubrics = await getAllRubrics();
   const systemPrompt = buildExtractionSystemPrompt(
     Object.fromEntries(
       Object.entries(rubrics).map(([k, v]) => [k, v.content])
     )
   );
   ```
4. Pass `systemPrompt` instead of `PIPELINE_EXTRACTION_SYSTEM_PROMPT`
5. Add error handling with fallback to INITIAL_RUBRICS

### Phase 3: Add Rubric Version Tracking (Optional)

For debugging/auditing, include rubric versions in extraction metadata:
- Add `rubricVersions: Record<ScoreDimension, number>` to extraction response
- Helps trace which rubric version produced a given score

---

## 8) Estimated Complexity

- **Lines of code:** ~80-100 new/modified lines
- **Files touched:** 2 (prompts.ts, extract/route.ts)
- **Risk level:** Low (additive change, graceful fallback)
- **Testing:** Manual verification by comparing scores before/after

---

## 9) Success Criteria

1. Extraction scores reflect current rubric definitions
2. When rubric is updated via feedback, next extraction uses new criteria
3. Graceful fallback to INITIAL_RUBRICS if database unavailable
4. No regression in extraction quality or speed
5. Token usage increase is reasonable (<800 tokens)
