# Task Breakdown: Intake Extraction Refinement

**Generated:** 2026-02-05
**Source:** specs/feat-intake-extraction-refinement.md

---

## Overview

Add prompt-based refinement to IntakeModal's extraction review step. Users can refine extracted synthesis sections and score assessments before saving the prospect, reusing the EditableSynthesisBlock pattern from ClientDetailModal.

## Phase Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| Phase 1 | 2 tasks | API & Schema Extensions |
| Phase 2 | 2 tasks | New EditableScoreCard Component |
| Phase 3 | 1 task | IntakeModal Integration |

**Total Tasks:** 5
**Parallel Opportunities:** Phase 1 tasks can run in parallel

---

## Phase 1: API & Schema Extensions

### Task IR-1: Extend refine-synthesis API to handle score assessments

**Description:** Add scoreAssessments to the refine-synthesis request/response schemas and update the API endpoint to process score refinement prompts.

**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** IR-2

**Technical Requirements:**

1. Update `lib/central-command/schemas.ts`:

```typescript
// Add score assessment schema for refinement
const scoreAssessmentSchema = z.object({
  score: z.number().min(1).max(10),
  rationale: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

// Extend request schema
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

// Extend response schema
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

2. Update `app/api/central-command/refine-synthesis/route.ts`:

```typescript
// Add score context to the prompt sent to the LLM
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
      .map(([key, val]) => `### ${key} Score: ${val.score}/10\nRationale: ${val.rationale}\nEvidence: ${val.evidence.join(', ')}`)
      .join('\n\n')
  : '';

const fullContext = scoreContext
  ? `Current synthesis:\n\n${sectionContext}\n\nCurrent scores:\n\n${scoreContext}`
  : `Current synthesis:\n\n${sectionContext}`;

// Update generateObject call to use full context
const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: refineSynthesisResponseSchema,
  system: SYNTHESIS_REFINEMENT_SYSTEM_PROMPT,
  prompt: `${fullContext}\n\nRefinement request: ${prompt}`,
});
```

**Acceptance Criteria:**
- [ ] refineSynthesisRequestSchema accepts optional currentScores object
- [ ] refineSynthesisResponseSchema includes optional updatedScores object
- [ ] API endpoint builds score context when currentScores provided
- [ ] API returns updatedScores only when scores are changed
- [ ] Existing synthesis-only refinement still works (backward compatible)

---

### Task IR-2: Update system prompt for score refinement

**Description:** Add score refinement rules to SYNTHESIS_REFINEMENT_SYSTEM_PROMPT to guide the LLM on when and how to update scores.

**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** IR-1

**Technical Requirements:**

Update `lib/central-command/prompts.ts`, adding to existing SYNTHESIS_REFINEMENT_SYSTEM_PROMPT:

```typescript
export const SYNTHESIS_REFINEMENT_SYSTEM_PROMPT = `
You are a strategic consultant refining client intelligence synthesis. You receive:
1. Current synthesis sections (companyOverview, goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach)
2. Current score assessments (strategic, value, readiness, timeline, bandwidth) with scores 1-10, rationale, and evidence
3. A user prompt with additional context or corrections

## SYNTHESIS SECTION RULES (existing rules 1-6)
[... existing rules ...]

## SCORE REFINEMENT RULES

7. Scores must remain 1-10. If user feedback justifies a change, adjust the score AND update rationale + evidence to match.

8. Only update scores explicitly mentioned or clearly implied by the prompt. Leave others unchanged. If a prompt says "his NBA connection wasn't captured" this implies strategic network value should increase.

9. When updating a score, provide a changeSummary explaining what changed and why (e.g., "Increased strategic score from 5→8 based on NBA network connection").

10. Update the evidence array to include any new key phrases from the prompt that support the score change.

11. Confidence should remain high (0.8+) when user provides direct information. Lower confidence only if the connection is inferred rather than stated.

## RESPONSE FORMAT

Return ONLY sections and scores that changed. Do not include unchanged items.

For sections: { refinedContent: string, changeSummary: string }
For scores: { score: number, rationale: string, evidence: string[], confidence: number, changeSummary: string }
`;
```

**Acceptance Criteria:**
- [ ] System prompt includes rules 7-11 for score refinement
- [ ] Rules explain when to update scores (explicit mention or clear implication)
- [ ] Rules require changeSummary for all score updates
- [ ] Rules explain evidence array updates
- [ ] Rules explain confidence scoring

---

## Phase 2: EditableScoreCard Component

### Task IR-3: Create EditableScoreCard component

**Description:** Build new EditableScoreCard component with VIEW/EDIT/REFINE states for inline score refinement, following the EditableSynthesisBlock pattern.

**Size:** Large
**Priority:** High
**Dependencies:** IR-1, IR-2
**Can run parallel with:** None

**Technical Requirements:**

Create `app/central-command/components/EditableScoreCard.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';
import {
  GOLD,
  GREEN,
  BG_PRIMARY,
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { EnrichmentScoreAssessment } from '@/lib/central-command/types';

// ============================================================================
// TYPES
// ============================================================================

interface EditableScoreCardProps {
  scoreKey: string;
  label: string;
  assessment: EnrichmentScoreAssessment;
  onSave: (updated: EnrichmentScoreAssessment) => void;
  pendingRefinement?: (EnrichmentScoreAssessment & { changeSummary: string }) | null;
  onAcceptRefinement?: () => void;
  onRejectRefinement?: () => void;
}

type CardState = 'VIEW' | 'EDIT' | 'REFINING';

// ============================================================================
// SCORE COLOR HELPER
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 8) return GREEN;
  if (score >= 5) return GOLD;
  return TEXT_DIM;
}

// ============================================================================
// EDITABLE SCORE CARD
// ============================================================================

export default function EditableScoreCard({
  scoreKey,
  label,
  assessment,
  onSave,
  pendingRefinement,
  onAcceptRefinement,
  onRejectRefinement,
}: EditableScoreCardProps) {
  const [state, setState] = useState<CardState>('VIEW');
  const [editScore, setEditScore] = useState(assessment.score);
  const [editRationale, setEditRationale] = useState(assessment.rationale);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedAssessment, setRefinedAssessment] = useState<(EnrichmentScoreAssessment & { changeSummary: string }) | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const refineInputRef = useRef<HTMLInputElement>(null);

  const hasPending = !!pendingRefinement;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleEdit() {
    setEditScore(assessment.score);
    setEditRationale(assessment.rationale);
    setState('EDIT');
  }

  function handleCancelEdit() {
    setEditScore(assessment.score);
    setEditRationale(assessment.rationale);
    setState('VIEW');
  }

  function handleSaveEdit() {
    if (editScore !== assessment.score || editRationale !== assessment.rationale) {
      onSave({
        ...assessment,
        score: editScore,
        rationale: editRationale,
      });
    }
    setState('VIEW');
  }

  async function handleRefineSubmit() {
    if (!refinePrompt.trim() || isRefining) return;

    setIsRefining(true);
    setState('REFINING');

    try {
      const res = await fetch('/api/central-command/refine-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSynthesis: {},
          currentScores: { [scoreKey]: assessment },
          prompt: refinePrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedScores?.[scoreKey]) {
          setRefinedAssessment(data.updatedScores[scoreKey]);
          setRefinePrompt('');
        } else {
          setState('VIEW');
        }
      } else {
        console.error('Refine failed');
        setState('VIEW');
      }
    } catch (err) {
      console.error('Refine error:', err);
      setState('VIEW');
    } finally {
      setIsRefining(false);
    }
  }

  function handleAcceptLocalRefinement() {
    if (refinedAssessment) {
      const { changeSummary, ...scoreData } = refinedAssessment;
      onSave(scoreData);
      setRefinedAssessment(null);
      setState('VIEW');
    }
  }

  function handleRejectLocalRefinement() {
    setRefinedAssessment(null);
    setState('VIEW');
  }

  function handleRefineKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRefineSubmit();
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const displayAssessment = hasPending
    ? pendingRefinement!
    : state === 'REFINING' && refinedAssessment
    ? refinedAssessment
    : assessment;

  const isPreview = hasPending || (state === 'REFINING' && refinedAssessment);

  return (
    <div
      className="p-3 rounded-lg border transition-all"
      style={{
        background: BG_PRIMARY,
        borderColor: isPreview ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-mono uppercase" style={{ color: TEXT_MUTED }}>
          {label}
        </p>

        {/* Score display or edit */}
        {state === 'EDIT' ? (
          <input
            type="number"
            min={1}
            max={10}
            value={editScore}
            onChange={(e) => setEditScore(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-12 text-lg font-mono font-bold text-center rounded border focus:outline-none"
            style={{
              background: BG_ELEVATED,
              color: getScoreColor(editScore),
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          />
        ) : (
          <p
            className="text-lg font-mono font-bold"
            style={{ color: getScoreColor(displayAssessment.score) }}
          >
            {displayAssessment.score}
          </p>
        )}
      </div>

      {/* Change summary badge */}
      {(hasPending || (state === 'REFINING' && refinedAssessment)) && (
        <div
          className="text-xs font-mono px-2 py-1 rounded mb-2 inline-block"
          style={{ background: 'rgba(74, 222, 128, 0.1)', color: GREEN }}
        >
          {hasPending ? pendingRefinement!.changeSummary : refinedAssessment!.changeSummary}
        </div>
      )}

      {/* Rationale */}
      {state === 'EDIT' ? (
        <textarea
          value={editRationale}
          onChange={(e) => setEditRationale(e.target.value)}
          className="w-full resize-none text-xs leading-relaxed focus:outline-none font-body rounded p-2 border"
          style={{
            background: BG_ELEVATED,
            color: TEXT_PRIMARY,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            minHeight: '60px',
          }}
        />
      ) : (
        <p
          className="text-xs leading-relaxed"
          style={{
            color: isPreview ? TEXT_MUTED : TEXT_DIM,
            fontStyle: isPreview ? 'italic' : 'normal',
          }}
        >
          {displayAssessment.rationale}
        </p>
      )}

      {/* Hover actions (VIEW state only, no pending) */}
      {state === 'VIEW' && !hasPending && isHovered && (
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED }}
            title="Edit"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => refineInputRef.current?.focus()}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED }}
            title="Refine with AI"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </button>
        </div>
      )}

      {/* Refine input (VIEW state, no pending) */}
      {state !== 'EDIT' && !hasPending && !refinedAssessment && (
        <div className="mt-2 flex items-center gap-1">
          <input
            ref={refineInputRef}
            type="text"
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            onKeyDown={handleRefineKeyDown}
            placeholder="Refine score..."
            disabled={isRefining}
            className="flex-1 px-2 py-1 rounded text-[10px] focus:outline-none font-body border transition-colors"
            style={{
              background: BG_ELEVATED,
              color: TEXT_PRIMARY,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          <button
            onClick={handleRefineSubmit}
            disabled={!refinePrompt.trim() || isRefining}
            className="px-1.5 py-1 rounded text-[10px] transition-all disabled:opacity-30"
            style={{ color: TEXT_MUTED }}
          >
            {isRefining ? '...' : '↵'}
          </button>
        </div>
      )}

      {/* EDIT action buttons */}
      {state === 'EDIT' && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleCancelEdit}
            className="px-2 py-1 rounded text-[10px] transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-2 py-1 rounded text-[10px] transition-all"
            style={{ background: GOLD, color: BG_PRIMARY }}
          >
            Save
          </button>
        </div>
      )}

      {/* Local refinement accept/reject */}
      {!hasPending && state === 'REFINING' && refinedAssessment && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleRejectLocalRefinement}
            className="px-2 py-1 rounded text-[10px] transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Reject
          </button>
          <button
            onClick={handleAcceptLocalRefinement}
            className="px-2 py-1 rounded text-[10px] transition-all"
            style={{ background: GREEN, color: BG_PRIMARY }}
          >
            Accept
          </button>
        </div>
      )}

      {/* Pending (global) refinement accept/reject */}
      {hasPending && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onRejectRefinement}
            className="px-2 py-1 rounded text-[10px] transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Reject
          </button>
          <button
            onClick={onAcceptRefinement}
            className="px-2 py-1 rounded text-[10px] transition-all"
            style={{ background: GREEN, color: BG_PRIMARY }}
          >
            Accept
          </button>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Component renders in VIEW state with score and rationale
- [ ] EDIT state shows number input (1-10) and rationale textarea
- [ ] REFINE state shows inline prompt input and calls refine-synthesis API
- [ ] Pending refinement from global mode shows preview with accept/reject
- [ ] Local refinement shows preview with accept/reject
- [ ] Hover reveals edit and refine action buttons
- [ ] Score color coding matches existing getScoreColor pattern

---

### Task IR-4: Add SCORE_LABELS constant

**Description:** Add SCORE_LABELS constant to IntakeModal for consistent score labeling.

**Size:** Small
**Priority:** Medium
**Dependencies:** None
**Can run parallel with:** IR-3

**Technical Requirements:**

Verify SCORE_LABELS exists in IntakeModal.tsx or add it:

```typescript
const SCORE_LABELS: Record<string, string> = {
  strategic: 'Strategic Value',
  value: 'Deal Value',
  readiness: 'Readiness',
  timeline: 'Timeline',
  bandwidth: 'Bandwidth Fit',
};
```

**Acceptance Criteria:**
- [ ] SCORE_LABELS constant available for EditableScoreCard usage
- [ ] Labels match existing IntakeModal display

---

## Phase 3: IntakeModal Integration

### Task IR-5: Wire EditableSynthesisBlock and EditableScoreCard into IntakeModal

**Description:** Replace read-only SynthesisBlock with EditableSynthesisBlock, replace inline score cards with EditableScoreCard, add SynthesisGlobalRefine bar, and wire up local state handlers.

**Size:** Large
**Priority:** High
**Dependencies:** IR-3, IR-4
**Can run parallel with:** None

**Technical Requirements:**

1. Update imports in `app/central-command/components/IntakeModal.tsx`:

```typescript
import EditableSynthesisBlock from './EditableSynthesisBlock';
import EditableScoreCard from './EditableScoreCard';
import SynthesisGlobalRefine from './SynthesisGlobalRefine';
import type { EnrichmentScoreAssessment } from '@/lib/central-command/types';
```

2. Add state for pending refinements in ReviewStep:

```typescript
interface PendingRefinements {
  updatedSections?: Record<string, { refinedContent: string; changeSummary: string }>;
  updatedScores?: Record<string, EnrichmentScoreAssessment & { changeSummary: string }>;
}

const [pendingRefinements, setPendingRefinements] = useState<PendingRefinements | null>(null);
```

3. Add handlers for synthesis and score updates:

```typescript
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

function handleGlobalRefinement(
  results: Record<string, { refinedContent: string; changeSummary: string }>
) {
  // For global refinement, we need to parse results into sections and scores
  // The refine-synthesis API returns updatedSections and updatedScores separately
  setPendingRefinements(results as PendingRefinements);
}

function acceptSection(sectionKey: string) {
  if (!pendingRefinements?.updatedSections?.[sectionKey]) return;
  handleSynthesisSave(sectionKey, pendingRefinements.updatedSections[sectionKey].refinedContent);

  const remaining = { ...pendingRefinements };
  if (remaining.updatedSections) {
    delete remaining.updatedSections[sectionKey];
    if (Object.keys(remaining.updatedSections).length === 0) {
      delete remaining.updatedSections;
    }
  }
  setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
}

function rejectSection(sectionKey: string) {
  if (!pendingRefinements?.updatedSections) return;

  const remaining = { ...pendingRefinements };
  delete remaining.updatedSections![sectionKey];
  if (Object.keys(remaining.updatedSections!).length === 0) {
    delete remaining.updatedSections;
  }
  setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
}

function acceptScore(scoreKey: string) {
  if (!pendingRefinements?.updatedScores?.[scoreKey]) return;
  const { changeSummary, ...scoreData } = pendingRefinements.updatedScores[scoreKey];
  handleScoreSave(scoreKey, scoreData);

  const remaining = { ...pendingRefinements };
  if (remaining.updatedScores) {
    delete remaining.updatedScores[scoreKey];
    if (Object.keys(remaining.updatedScores).length === 0) {
      delete remaining.updatedScores;
    }
  }
  setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
}

function rejectScore(scoreKey: string) {
  if (!pendingRefinements?.updatedScores) return;

  const remaining = { ...pendingRefinements };
  delete remaining.updatedScores![scoreKey];
  if (Object.keys(remaining.updatedScores!).length === 0) {
    delete remaining.updatedScores;
  }
  setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
}
```

4. Replace SynthesisBlock with EditableSynthesisBlock (6 instances):

```tsx
{synthesis && (
  <>
    <EditableSynthesisBlock
      label="COMPANY OVERVIEW"
      sectionKey="companyOverview"
      content={synthesis.companyOverview || ''}
      versions={[]}
      onSave={(content) => handleSynthesisSave('companyOverview', content)}
      pendingRefinement={pendingRefinements?.updatedSections?.companyOverview}
      onAcceptRefinement={() => acceptSection('companyOverview')}
      onRejectRefinement={() => rejectSection('companyOverview')}
    />
    <EditableSynthesisBlock
      label="GOALS & VISION"
      sectionKey="goalsAndVision"
      content={synthesis.goalsAndVision || ''}
      versions={[]}
      onSave={(content) => handleSynthesisSave('goalsAndVision', content)}
      pendingRefinement={pendingRefinements?.updatedSections?.goalsAndVision}
      onAcceptRefinement={() => acceptSection('goalsAndVision')}
      onRejectRefinement={() => rejectSection('goalsAndVision')}
    />
    <EditableSynthesisBlock
      label="PAIN POINTS & BLOCKERS"
      sectionKey="painAndBlockers"
      content={synthesis.painAndBlockers || ''}
      versions={[]}
      onSave={(content) => handleSynthesisSave('painAndBlockers', content)}
      pendingRefinement={pendingRefinements?.updatedSections?.painAndBlockers}
      onAcceptRefinement={() => acceptSection('painAndBlockers')}
      onRejectRefinement={() => rejectSection('painAndBlockers')}
    />
    <EditableSynthesisBlock
      label="DECISION DYNAMICS"
      sectionKey="decisionDynamics"
      content={synthesis.decisionDynamics || ''}
      versions={[]}
      onSave={(content) => handleSynthesisSave('decisionDynamics', content)}
      pendingRefinement={pendingRefinements?.updatedSections?.decisionDynamics}
      onAcceptRefinement={() => acceptSection('decisionDynamics')}
      onRejectRefinement={() => rejectSection('decisionDynamics')}
    />
    <EditableSynthesisBlock
      label="STRATEGIC ASSESSMENT"
      sectionKey="strategicAssessment"
      content={synthesis.strategicAssessment || ''}
      versions={[]}
      color={GOLD}
      onSave={(content) => handleSynthesisSave('strategicAssessment', content)}
      pendingRefinement={pendingRefinements?.updatedSections?.strategicAssessment}
      onAcceptRefinement={() => acceptSection('strategicAssessment')}
      onRejectRefinement={() => rejectSection('strategicAssessment')}
    />
    <EditableSynthesisBlock
      label="RECOMMENDED APPROACH"
      sectionKey="recommendedApproach"
      content={synthesis.recommendedApproach || ''}
      versions={[]}
      color={GREEN}
      onSave={(content) => handleSynthesisSave('recommendedApproach', content)}
      pendingRefinement={pendingRefinements?.updatedSections?.recommendedApproach}
      onAcceptRefinement={() => acceptSection('recommendedApproach')}
      onRejectRefinement={() => rejectSection('recommendedApproach')}
    />
  </>
)}
```

5. Replace inline score cards with EditableScoreCard:

```tsx
{/* ── SCORE ASSESSMENTS ── */}
<div>
  <p
    className="text-xs font-mono tracking-[0.2em] uppercase mb-3"
    style={{ color: GOLD }}
  >
    SUGGESTED SCORES
  </p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {(Object.entries(synthesis.scoreAssessments) as [string, EnrichmentScoreAssessment][]).map(
      ([key, assessment]) => (
        <EditableScoreCard
          key={key}
          scoreKey={key}
          label={SCORE_LABELS[key] || key}
          assessment={assessment}
          onSave={(updated) => handleScoreSave(key, updated)}
          pendingRefinement={pendingRefinements?.updatedScores?.[key]}
          onAcceptRefinement={() => acceptScore(key)}
          onRejectRefinement={() => rejectScore(key)}
        />
      )
    )}
  </div>
</div>
```

6. Add SynthesisGlobalRefine bar to ReviewStep header:

```tsx
{/* Header with global refine */}
<div
  className="px-6 py-4 border-b flex items-center justify-between"
  style={{
    background: BG_ELEVATED,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  }}
>
  <h2 className="text-lg font-display" style={{ color: TEXT_PRIMARY }}>
    Review Extraction
  </h2>
  <SynthesisGlobalRefine
    currentSynthesis={{
      companyOverview: synthesis?.companyOverview || '',
      goalsAndVision: synthesis?.goalsAndVision || '',
      painAndBlockers: synthesis?.painAndBlockers || '',
      decisionDynamics: synthesis?.decisionDynamics || '',
      strategicAssessment: synthesis?.strategicAssessment || '',
      recommendedApproach: synthesis?.recommendedApproach || '',
    }}
    onRefinementComplete={handleGlobalRefinement}
  />
</div>
```

**Acceptance Criteria:**
- [ ] SynthesisBlock replaced with EditableSynthesisBlock (6 instances)
- [ ] Inline score cards replaced with EditableScoreCard (5 instances)
- [ ] SynthesisGlobalRefine bar appears in review step header
- [ ] Local state updates correctly when sections are edited/refined
- [ ] Local state updates correctly when scores are edited/refined
- [ ] Global refinement shows pending state for affected sections/scores
- [ ] Accept/reject works for both sections and scores
- [ ] Refinements persist when navigating back to input step and returning
- [ ] Create Prospect saves refined data correctly

---

## Execution Strategy

### Phase 1 (Parallel)
- IR-1 and IR-2 can run in parallel (no dependencies)
- Both extend existing files, no conflicts

### Phase 2 (Sequential)
- IR-3 depends on IR-1 and IR-2 (needs extended API)
- IR-4 can run parallel with IR-3

### Phase 3 (Sequential)
- IR-5 depends on IR-3 (needs EditableScoreCard)
- Final integration and testing

### Recommended Order
1. IR-1 + IR-2 (parallel)
2. IR-3 + IR-4 (parallel after Phase 1)
3. IR-5 (after Phase 2)

---

## Testing Checklist

After implementation, verify:

1. **Synthesis refinement in IntakeModal**
   - [ ] Extract text → Review → Refine a section → Accept → Verify state updated

2. **Score refinement in IntakeModal**
   - [ ] Extract text → Review → Refine score with "NBA connection" → Accept → Verify score increased

3. **Global refinement**
   - [ ] Submit prompt affecting both sections and scores → Verify pending states → Accept all → Create prospect → Verify saved data

4. **Manual editing**
   - [ ] Edit score manually (change number + rationale) → Save → Verify state updated

5. **State persistence**
   - [ ] Refine → Back to input → Return to review → Verify refinements persisted

6. **Backward compatibility**
   - [ ] ClientDetailModal synthesis refinement still works
   - [ ] Synthesis-only refinement (no scores) still works
