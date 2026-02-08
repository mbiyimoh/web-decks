# Intake Extraction Refinement

**Status:** Draft
**Author:** Claude Code
**Date:** 2026-02-05
**Related:** `specs/feat-synthesis-refinement.md`

---

## Overview

Add prompt-based refinement to the IntakeModal extraction review step. Users can refine extracted synthesis sections and score assessments before saving the prospect, using the same EditableSynthesisBlock pattern already implemented in ClientDetailModal.

## Problem Statement

When reviewing extracted data in IntakeModal before creating a prospect, users currently see read-only previews. If the AI extraction missed context or scored incorrectly, users must either:
1. Create the prospect anyway and fix it later in ClientDetailModal
2. Go back and re-paste with additional notes

Users should be able to refine the extraction in-place before saving, e.g., "his NBA connection wasn't captured - strategic network value should be higher."

## Goals

- Swap read-only SynthesisBlock → EditableSynthesisBlock in IntakeModal review step
- Create EditableScoreCard component for inline score refinement (VIEW/EDIT/REFINE states)
- Add SynthesisGlobalRefine bar to IntakeModal for multi-section + score refinement
- Extend refine-synthesis API to include scoreAssessments in request/response
- Update local `extraction` state (not PATCH) since data isn't saved yet

## Non-Goals

- Version history in IntakeModal (no DB record exists yet)
- Voice recording for global refinement in IntakeModal (text prompt only for MVP)
- Re-running full extraction from scratch
- Editing operational recommendations via prompt

---

## Technical Approach

### Files That Change

| File | Change |
|------|--------|
| `app/central-command/components/IntakeModal.tsx` | Swap SynthesisBlock → EditableSynthesisBlock, add global refine bar, wire state handlers |
| `app/central-command/components/EditableScoreCard.tsx` | **New:** Score card with VIEW/EDIT/REFINE states |
| `app/api/central-command/refine-synthesis/route.ts` | Extend to accept/return scoreAssessments |
| `lib/central-command/schemas.ts` | Extend refineSynthesisRequestSchema with scoreAssessments |
| `lib/central-command/prompts.ts` | Update SYNTHESIS_REFINEMENT_SYSTEM_PROMPT for score handling |

### Key Difference from ClientDetailModal

In ClientDetailModal, `onSave` triggers a PATCH to the API and updates the database. In IntakeModal, `onSave` just updates local React state (`setExtraction`) since no prospect exists yet.

---

## Implementation Details

### 1. EditableScoreCard Component

New component for score assessment cards with three states:

```typescript
// app/central-command/components/EditableScoreCard.tsx
interface EditableScoreCardProps {
  scoreKey: string;           // 'strategic' | 'value' | 'readiness' | 'timeline' | 'bandwidth'
  label: string;              // Display label
  assessment: EnrichmentScoreAssessment;
  onSave: (updated: EnrichmentScoreAssessment) => void;
}

type CardState = 'VIEW' | 'EDIT' | 'REFINING';
```

**VIEW state:** Current read-only display (score + rationale)
**EDIT state:** Manual score slider (1-10) + rationale textarea
**REFINING state:** Inline prompt input → calls refine API → preview → accept/reject

### 2. Extend refine-synthesis API

Add scoreAssessments to request/response:

```typescript
// lib/central-command/schemas.ts
export const refineSynthesisRequestSchema = z.object({
  currentSynthesis: z.object({
    companyOverview: z.string().optional(),
    goalsAndVision: z.string().optional(),
    painAndBlockers: z.string().optional(),
    decisionDynamics: z.string().optional(),
    strategicAssessment: z.string().optional(),
    recommendedApproach: z.string().optional(),
  }),
  currentScores: z.object({
    strategic: scoreAssessmentSchema.optional(),
    value: scoreAssessmentSchema.optional(),
    readiness: scoreAssessmentSchema.optional(),
    timeline: scoreAssessmentSchema.optional(),
    bandwidth: scoreAssessmentSchema.optional(),
  }).optional(),
  prompt: z.string().min(1).max(5000),
});

export const refineSynthesisResponseSchema = z.object({
  updatedSections: z.record(z.string(), z.object({
    refinedContent: z.string(),
    changeSummary: z.string(),
  })),
  updatedScores: z.record(z.string(), z.object({
    score: z.number().min(1).max(10),
    rationale: z.string(),
    evidence: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    changeSummary: z.string(),
  })).optional(),
});
```

### 3. Update System Prompt

Add score refinement rules to SYNTHESIS_REFINEMENT_SYSTEM_PROMPT:

```typescript
// Add to existing prompt
`
## SCORE REFINEMENT RULES

7. Scores must remain 1-10. If user feedback justifies a change, adjust the score AND update rationale + evidence to match.
8. Only update scores explicitly mentioned or clearly implied by the prompt. Leave others unchanged.
9. When updating a score, provide a changeSummary explaining what changed and why (e.g., "Increased strategic score from 5→8 based on NBA network connection").
10. Update the evidence array to include any new key phrases from the prompt that support the score change.
`
```

### 4. IntakeModal Integration

Wire EditableSynthesisBlock and EditableScoreCard with local state handlers:

```typescript
// In IntakeModal ReviewStep

// Handler for synthesis section updates
function handleSynthesisSave(sectionKey: string, content: string) {
  if (!extraction) return;
  setExtraction({
    ...extraction,
    synthesis: {
      ...extraction.synthesis,
      [sectionKey]: content,
    },
  });
}

// Handler for score updates
function handleScoreSave(scoreKey: string, updated: EnrichmentScoreAssessment) {
  if (!extraction) return;
  setExtraction({
    ...extraction,
    synthesis: {
      ...extraction.synthesis,
      scoreAssessments: {
        ...extraction.synthesis.scoreAssessments,
        [scoreKey]: updated,
      },
    },
  });
}

// Handler for global refinement results
function handleGlobalRefinement(results: {
  updatedSections?: Record<string, { refinedContent: string; changeSummary: string }>;
  updatedScores?: Record<string, EnrichmentScoreAssessment & { changeSummary: string }>;
}) {
  // Set pending state for preview, then accept/reject individually
  setPendingRefinements(results);
}
```

### 5. Simplified EditableSynthesisBlock Usage

Since IntakeModal has no version history (no DB record yet), pass simplified props:

```tsx
<EditableSynthesisBlock
  label="COMPANY OVERVIEW"
  sectionKey="companyOverview"
  content={synthesis.companyOverview}
  versions={[]}  // No history pre-save
  onSave={(content) => handleSynthesisSave('companyOverview', content)}
  pendingRefinement={pendingRefinements?.updatedSections?.companyOverview}
  onAcceptRefinement={() => acceptSection('companyOverview')}
  onRejectRefinement={() => rejectSection('companyOverview')}
/>
```

---

## Testing Approach

### Key Scenarios

1. **Synthesis section refinement in IntakeModal**
   - Extract text → Review step → Click refine on a section → Submit prompt → Accept → Verify extraction state updated

2. **Score refinement in IntakeModal**
   - Extract text → Review step → Click refine on score card → Submit "NBA connection" prompt → Accept → Verify score increased and rationale updated

3. **Global refinement affecting both sections and scores**
   - Submit global prompt mentioning both context and score adjustments → Verify both sections and scores show pending changes → Accept all → Create prospect → Verify saved data matches

4. **State isolation**
   - Refine extraction → Go back to input step → Return to review → Verify refinements persisted in local state

---

## Open Questions

1. **Score slider UX:** For manual edit, should we use a slider (1-10) or a number input? Slider is more visual but less precise.

2. **Evidence array editing:** Should users be able to manually edit the evidence array in EDIT mode, or is rationale sufficient?

---

## Future Improvements

> **OUT OF SCOPE for initial implementation**

- **Voice recording in IntakeModal:** Add mic button to global refine bar (reuse from SynthesisGlobalRefine)
- **Batch accept/reject:** "Accept all changes" button when global refinement affects multiple sections
- **Confidence visualization:** Show confidence score on each assessment card with color coding
- **Undo/redo stack:** Track refinement history within the IntakeModal session (not persisted)
- **Side-by-side diff view:** Show original vs refined content before accepting
- **Re-extract with context:** Button to re-run full extraction with additional notes appended

---

## References

- `specs/feat-synthesis-refinement.md` — Original synthesis refinement spec
- `app/central-command/components/EditableSynthesisBlock.tsx` — Existing component to reuse
- `app/central-command/components/SynthesisGlobalRefine.tsx` — Existing global refine bar
- `docs/developer-guides/synthesis-refinement-guide.md` — Implementation patterns
