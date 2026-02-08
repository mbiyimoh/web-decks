# Brain Dump to Reviewable Recommendations

**Slug:** braindump-reviewable-recommendations
**Author:** Claude Code
**Date:** 2026-02-01
**Branch:** preflight/braindump-reviewable-recommendations
**Related:** `docs/clarity-canvas/braindump-to-rcommendations.md`, `docs/clarity-canvas/prompt-based-text-iteration.md`

---

## 1) Intent & Assumptions

- **Task brief:** Transform the Clarity Canvas brain dump extraction flow from "auto-save everything AI extracts" to a human-in-the-loop review experience. After AI extraction, present: (1) an executive summary of key themes learned, then (2) per-field recommendations the user can approve, reject, or refine via prompt-based editing. Only approved/refined items get committed to the profile.

- **Assumptions:**
  - The existing `generateObject` extraction pipeline (brain dump -> AI -> structured chunks) stays as-is; we're adding a review layer between extraction and persistence
  - The extraction schema (`brainDumpExtractionSchema`) already returns `overallThemes` and `suggestedFollowUps` which power the executive summary
  - The `prompt-based-text-iteration.md` refinement pattern (current text + user prompt -> LLM -> refined text) is the model for per-recommendation refinement
  - We keep the existing `FlowStep` state machine pattern in `ClarityCanvasClient.tsx`
  - No database schema changes needed — we hold recommendations in client state until commit

- **Out of scope:**
  - Changing the AI extraction model or prompt (those can be tuned separately)
  - Voice-based refinement (text prompt only for now)
  - Version history for individual field recommendations (that's a future enhancement)
  - Batch processing / chunked extraction for very long brain dumps (separate issue)
  - Changes to the profile visualization or scoring system

---

## 2) Pre-reading Log

- `docs/clarity-canvas/braindump-to-rcommendations.md`: Comprehensive patterns for text-to-structured-recommendations. Key takeaways: (1) Schema-first with Zod, (2) Context injection prevents duplicates, (3) Confidence scoring enables filtering, (4) Visual bubbles/chips for feedback, (5) Accumulation rules per field type. Directly applicable architecture.
- `docs/clarity-canvas/prompt-based-text-iteration.md`: Refinement pattern: system prompt + current text + user instruction -> LLM -> refined text. Version history with source tracking. Two-phase persistence (client state during review, DB on commit). This is exactly the "refine" UX we need per-recommendation.
- `app/clarity-canvas/ClarityCanvasClient.tsx`: Main client component with `FlowStep` state machine (welcome -> brain-dump -> processing -> profile). Currently auto-saves extraction results. We need to insert a `review` step between `processing` and `profile`.
- `app/api/clarity-canvas/extract/route.ts`: Current extraction API. Returns `{ extractedChunks, updatedProfile, scores }`. Currently writes to DB during extraction. Needs to be split into extract-only (no DB writes) and commit (DB writes for approved items).
- `lib/clarity-canvas/extraction-schema.ts`: Zod schema for extraction. `extractionChunkSchema` has: content, targetSection, targetSubsection, targetField, summary, confidence, insights. `brainDumpExtractionSchema` wraps chunks + overallThemes + suggestedFollowUps.
- `lib/clarity-canvas/profile-structure.ts`: 6 sections, 21 subsections, 60+ fields. `FIELD_DISPLAY_NAMES` maps field keys to human-readable names. `PROFILE_STRUCTURE` has section icons and ordering.
- `lib/clarity-canvas/types.ts`: `ExtractionChunk` type matches schema. `BrainDumpResponse` includes extractedChunks, updatedProfile, scores.
- `app/clarity-canvas/components/SectionDetail.tsx`: New component showing per-field detail. Shows populated vs empty fields with green/grey dots. Can inform the recommendation card design.

---

## 3) Codebase Map

- **Primary components/modules:**
  - `app/clarity-canvas/ClarityCanvasClient.tsx` — Flow orchestrator (state machine), will add `review` step
  - `app/api/clarity-canvas/extract/route.ts` — Extraction API, needs extract-only mode
  - NEW: `app/api/clarity-canvas/commit/route.ts` — Commit approved recommendations to DB
  - NEW: `app/api/clarity-canvas/refine/route.ts` — Refine a single recommendation via prompt
  - NEW: `app/clarity-canvas/components/RecommendationReview.tsx` — Review screen with exec summary + recommendation cards
  - NEW: `app/clarity-canvas/components/RecommendationCard.tsx` — Individual recommendation with approve/reject/refine

- **Shared dependencies:**
  - `lib/clarity-canvas/extraction-schema.ts` — Zod schemas (extend for review state)
  - `lib/clarity-canvas/profile-structure.ts` — Section/field metadata for display names, icons
  - `lib/clarity-canvas/types.ts` — Type definitions (extend for recommendation state)
  - `lib/clarity-canvas/scoring.ts` — Score calculation (used after commit)
  - `framer-motion` — Animations for card transitions
  - `ai` / `@ai-sdk/openai` — AI SDK for refinement endpoint

- **Data flow:**
  ```
  Brain Dump Text
    -> POST /api/clarity-canvas/extract (AI extraction, NO DB writes)
    -> Client receives extractedChunks + overallThemes + suggestedFollowUps
    -> RecommendationReview screen (client state)
    -> User approves/rejects/refines each recommendation
    -> POST /api/clarity-canvas/refine (for refinement, returns refined text)
    -> POST /api/clarity-canvas/commit (approved items -> DB writes)
    -> Profile view with updated scores
  ```

- **Potential blast radius:**
  - `ClarityCanvasClient.tsx` — New flow step, new state variables
  - `extract/route.ts` — Must stop writing to DB (or add `dryRun` flag)
  - `lib/clarity-canvas/types.ts` — New types for recommendation state
  - 2-3 new components
  - 2 new API routes

---

## 4) Root Cause Analysis

N/A — This is a new feature, not a bug fix.

---

## 5) Research

### Potential Solutions

**1. Contextual Cherry-Picking Pattern (Recommended)**

A scrollable list of recommendation cards grouped by section, each with approve/reject/refine controls. Executive summary at top. "Approve All" and "Approve Remaining" bulk actions.

- **Pros:** Maximum user control; handles multi-part outputs well; natural grouping by section matches the canvas structure; supports both quick bulk-approve and careful individual review; maps directly to existing extraction chunk structure
- **Cons:** More UI to build; longer review time for users who trust the AI; needs good empty/loading states

**2. Card-Stacked Swipe Pattern (Tinder-style)**

One recommendation at a time, swipe to approve/reject.

- **Pros:** Most engaging interaction; forces clear decisions; gamified feel
- **Cons:** Can't see context of other recommendations; slow for 15-30 chunks; no overview; hard to refine inline; doesn't support the exec summary requirement; loses the "section grouping" context

**3. Diff/Side-by-Side Pattern**

Show current profile state on left, proposed additions on right.

- **Pros:** Clear change visualization; familiar from code review
- **Cons:** Profile is mostly empty on first brain dump (nothing to diff against); heavy horizontal space; overkill for "add new data" vs "change existing data"; doesn't map well to the 60+ field structure

**4. Two-Phase: Summary-then-Detail**

Phase 1: Show exec summary + themes only with "Looks Good" / "Let Me Review" choice. Phase 2: Only if user wants detail, show per-field recommendations.

- **Pros:** Fast path for trusting users; respects user time
- **Cons:** Trusting users may miss bad extractions; the "fast path" skips the value of human review; harder to implement the partial-approve case

### Recommendation

**Solution 1: Contextual Cherry-Picking** is the best fit because:
- Maps naturally to the existing 6-section canvas structure (group recommendations by section)
- Supports the exec summary at top (from `overallThemes`)
- Each chunk already has `targetSection`, `targetField`, `summary`, `confidence`, and `content` — perfect for a recommendation card
- The prompt-based refinement from `prompt-based-text-iteration.md` fits naturally as a per-card action
- Bulk actions ("Approve All High-Confidence") leverage the existing confidence scores
- The `suggestedFollowUps` from extraction can appear as a "gaps" section at the bottom

### UX Flow Design

```
┌──────────────────────────────────────────────────────────┐
│ EXECUTIVE SUMMARY                                         │
│                                                           │
│ "We identified 18 insights across 4 areas of your        │
│  profile. Key themes: [theme chips]"                      │
│                                                           │
│ [Approve All (18)]  [Review Individually]                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ INDIVIDUAL (5 recommendations)              [Approve All] │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Career Path                           confidence: 92% │  │
│ │ "Founded 33 Strategies, a brand strategy..."         │  │
│ │                                                      │  │
│ │ [Approve]  [Reject]  [Refine...]                    │  │
│ └─────────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Areas of Expertise                    confidence: 85% │  │
│ │ "Brand strategy, positioning, visual identity..."    │  │
│ │                                                      │  │
│ │ [Approve]  [Reject]  [Refine...]                    │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ROLE (4 recommendations)                    [Approve All] │
│ ...                                                       │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ GAPS (suggested follow-ups)                               │
│ "Consider sharing more about: Network, Financials..."     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ [Commit 14 Approved Items to Profile]                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Refine Flow (per-card)

When user clicks "Refine..." on a recommendation card:
1. Card expands to show a text input below the current content
2. User types instruction (e.g., "Make this more specific about my role at 33 Strategies")
3. POST /api/clarity-canvas/refine with `{ currentContent, currentSummary, prompt, fieldKey }`
4. LLM returns refined `{ content, summary }`
5. Card updates in-place with refined text, marked as "Refined"
6. Auto-approved after refinement (user explicitly engaged = implicit approval)

---

## 6) Clarification

1. **Bulk approve threshold:** Should "Approve All" approve everything regardless of confidence, or only items above a confidence threshold (e.g., 0.7)? Low-confidence items could require individual review.
>> warn the user if they are about to approve some items below 0.7 / prompt them to review those first but thats all / let them proceed with "approve all" without reviewing those if they want

2. **Refine model:** Should refinement use `gpt-4o-mini` (fast, cheap) or `gpt-4o` (better quality)? The refinement is a simpler task (rewrite one sentence given instruction), so mini is likely sufficient.
>> gpt-4o-mini for this step but lets make sure we're using the legit gpt-4o for the main extraction task that comes before this

3. **Commit behavior:** When committing approved items, should we show a confirmation ("About to update 14 fields") or commit immediately? The review screen itself is the confirmation, so immediate commit seems right.
>>always show confirmation first so the user is never caught off guard

4. **Re-extraction:** After committing, if the user does another brain dump ("Add More Context"), should the review screen show only new recommendations, or also show what was previously committed? Recommend: only new recommendations, since existing data is already in the profile.
>> only new

5. **Empty sections:** Should sections with 0 recommendations still appear in the review (to show coverage gaps), or only show sections that have recommendations? Recommend: only sections with recommendations, plus a "Gaps" section at the bottom using `suggestedFollowUps`.
>> I like your recommendation lets do that

6. **Card animation on approve/reject:** Should approved items stay visible (greyed out / checkmarked) or animate away? Recommend: stay visible with a green check overlay, so user maintains context. Rejected items fade to a compact "rejected" state.
>> follow your recommendation, thats a good ux
