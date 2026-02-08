# Task Breakdown: Rubric Approval Workflow

Generated: 2026-02-07
Source: specs/feat-rubric-approval-workflow.md

---

## Overview

Add a user approval step before rubric changes are applied. Currently, when a user adjusts a score and provides feedback, the system automatically updates the rubric if the LLM determines changes are warranted. This feature adds a review step where users see proposed changes and explicitly approve, reject, or tweak them.

**Key Change:** Transform `recordFeedbackAndUpdateRubric()` from auto-applying changes to returning a proposal for user review.

---

## Phase 1: API Layer Changes

### Task 1.1: Add Types and Rename Core Function

**Description**: Create new types for proposal-based workflow and rename function
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (foundational)

**Technical Requirements**:
Add new types to `lib/central-command/rubric.ts`:

```typescript
export interface RubricProposalResult {
  feedbackId: string;
  hasProposal: boolean;
  currentRubric: RubricContent;
  currentVersion: number;
  proposedRubric: RubricContent | null;
  reasoning: string;
  dimension: ScoreDimension;
}
```

Rename and modify existing function from `recordFeedbackAndUpdateRubric()` to `recordFeedbackAndProposeRubricUpdate()`:
- Still records feedback to database (always)
- Still generates LLM proposal via `generateRubricUpdate()`
- **NO LONGER applies the rubric** — returns proposal instead

**Implementation**:

```typescript
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
```

**Acceptance Criteria**:
- [ ] `RubricProposalResult` type is exported
- [ ] Function renamed and returns proposal instead of applying
- [ ] Feedback is still recorded to database
- [ ] LLM proposal generation still works
- [ ] Old `recordFeedbackAndUpdateRubric` removed or deprecated

---

### Task 1.2: Create `applyRubricUpdate()` Function

**Description**: Add function to apply an approved rubric proposal
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: None

**Technical Requirements**:
Add new function to `lib/central-command/rubric.ts`:

```typescript
export async function applyRubricUpdate(
  feedbackId: string,
  dimension: ScoreDimension,
  content: RubricContent,
  currentVersion: number
): Promise<{ success: boolean; newVersion: number }> {
  // Deactivate current version
  await prisma.scoringRubric.updateMany({
    where: { dimension, isActive: true },
    data: { isActive: false },
  });

  // Create new version
  const newRubric = await prisma.scoringRubric.create({
    data: {
      dimension,
      version: currentVersion + 1,
      content: content as object,
      isActive: true,
      triggeringFeedbackId: feedbackId,
    },
  });

  return { success: true, newVersion: newRubric.version };
}
```

**Key Points**:
- Uses transaction semantics (deactivate old, create new)
- Links new rubric to triggering feedback ID
- Returns new version number for UI toast

**Acceptance Criteria**:
- [ ] Function exported from rubric.ts
- [ ] Deactivates old rubric version
- [ ] Creates new rubric with incremented version
- [ ] Returns success and new version number

---

### Task 1.3: Update Feedback API Route to Return Proposal

**Description**: Modify `/api/central-command/rubric/feedback` to return proposal
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 1.2

**Technical Requirements**:
Update `app/api/central-command/rubric/feedback/route.ts`:

```typescript
import {
  recordFeedbackAndProposeRubricUpdate, // renamed import
  SCORE_DIMENSIONS,
  ScoreDimension
} from '@/lib/central-command/rubric';

// ... existing auth and validation ...

try {
  const result = await recordFeedbackAndProposeRubricUpdate({
    dimension: data.dimension as ScoreDimension,
    prospectId: data.prospectId,
    originalScore: data.originalScore,
    adjustedScore: data.adjustedScore,
    feedback: data.feedback,
  });

  return NextResponse.json(
    {
      success: true,
      feedbackId: result.feedbackId,
      hasProposal: result.hasProposal,
      currentRubric: result.currentRubric,
      currentVersion: result.currentVersion,
      proposedRubric: result.proposedRubric,
      reasoning: result.reasoning,
      dimension: result.dimension,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
} catch (error) {
  // ... existing error handling ...
}
```

**Response Shape Change**:
- Before: `{ success, rubricUpdated, newRubricVersion, changeSummary }`
- After: `{ success, feedbackId, hasProposal, currentRubric, currentVersion, proposedRubric, reasoning, dimension }`

**Acceptance Criteria**:
- [ ] Returns proposal data instead of auto-applying
- [ ] Includes feedbackId for subsequent approve call
- [ ] Includes both current and proposed rubric content
- [ ] API still handles errors gracefully

---

### Task 1.4: Create Approve API Endpoint

**Description**: Create new `/api/central-command/rubric/approve` endpoint
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.2
**Can run parallel with**: Task 1.3

**Technical Requirements**:
Create `app/api/central-command/rubric/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { applyRubricUpdate, ScoreDimension, RubricContent } from '@/lib/central-command/rubric';

const approveSchema = z.object({
  feedbackId: z.string().min(1),
  dimension: z.enum(['strategic', 'value', 'readiness', 'timeline', 'bandwidth']),
  content: z.object({
    description: z.string(),
    indicators: z.object({
      high: z.array(z.string()),
      medium: z.array(z.string()),
      low: z.array(z.string()),
    }),
  }),
  currentVersion: z.number().int().min(0),
  action: z.enum(['approve', 'reject']),
});

/**
 * POST /api/central-command/rubric/approve
 * Approve or reject a proposed rubric change
 */
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
  const validation = approveSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { feedbackId, dimension, content, currentVersion, action } = validation.data;

  if (action === 'reject') {
    // Feedback already recorded, no rubric change needed
    return NextResponse.json(
      { success: true, rubricUpdated: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    // Apply the approved rubric
    const result = await applyRubricUpdate(
      feedbackId,
      dimension as ScoreDimension,
      content as RubricContent,
      currentVersion
    );

    return NextResponse.json(
      { success: true, rubricUpdated: true, newVersion: result.newVersion },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[central-command/rubric/approve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply rubric update' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Endpoint handles 'approve' action by calling applyRubricUpdate
- [ ] Endpoint handles 'reject' action with no-op response
- [ ] Auth check matches other Central Command endpoints
- [ ] Validates all required fields including rubric content structure

---

## Phase 2: UI Components

### Task 2.1: Create RubricProposalModal Component

**Description**: Build modal component for reviewing rubric proposals
**Size**: Large
**Priority**: High
**Dependencies**: Phase 1 complete
**Can run parallel with**: None

**Technical Requirements**:
Create `app/central-command/components/RubricProposalModal.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  GOLD,
  GREEN,
  RED,
  BG_PRIMARY,
  BG_ELEVATED,
  BG_SURFACE,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { RubricContent, ScoreDimension } from '@/lib/central-command/rubric';

interface RubricProposalModalProps {
  isOpen: boolean;
  dimension: ScoreDimension;
  currentRubric: RubricContent;
  proposedRubric: RubricContent;
  reasoning: string;
  feedbackId: string;
  currentVersion: number;
  onApprove: () => void;
  onReject: () => void;
  onTweak: (additionalFeedback: string) => void;
  isSubmitting: boolean;
}

const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  strategic: 'Strategic Value',
  value: 'Revenue Potential',
  readiness: 'Readiness to Buy',
  timeline: 'Timeline Urgency',
  bandwidth: 'Our Capacity Fit',
};

export default function RubricProposalModal({
  isOpen,
  dimension,
  currentRubric,
  proposedRubric,
  reasoning,
  feedbackId,
  currentVersion,
  onApprove,
  onReject,
  onTweak,
  isSubmitting,
}: RubricProposalModalProps) {
  const [showTweakInput, setShowTweakInput] = useState(false);
  const [tweakPrompt, setTweakPrompt] = useState('');

  if (!isOpen) return null;

  function handleTweakSubmit() {
    if (tweakPrompt.trim()) {
      onTweak(tweakPrompt);
      setTweakPrompt('');
      setShowTweakInput(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div
        className="max-w-2xl w-full mx-4 rounded-xl border overflow-hidden"
        style={{ background: BG_SURFACE, borderColor: 'rgba(212,165,74,0.3)' }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h2 className="text-lg font-display" style={{ color: TEXT_PRIMARY }}>
            Proposed Rubric Update
          </h2>
          <p className="text-sm font-mono mt-1" style={{ color: GOLD }}>
            {DIMENSION_LABELS[dimension]} (v{currentVersion} → v{currentVersion + 1})
          </p>
        </div>

        {/* Reasoning */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: BG_ELEVATED }}>
          <p className="text-[10px] font-mono uppercase mb-1" style={{ color: TEXT_DIM }}>
            Why This Change
          </p>
          <p className="text-sm" style={{ color: TEXT_MUTED }}>{reasoning}</p>
        </div>

        {/* Diff View */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {/* Current */}
          <div>
            <p className="text-[10px] font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
              Current (v{currentVersion})
            </p>
            <RubricDisplay rubric={currentRubric} />
          </div>
          {/* Proposed */}
          <div>
            <p className="text-[10px] font-mono uppercase mb-2" style={{ color: GREEN }}>
              Proposed (v{currentVersion + 1})
            </p>
            <RubricDisplay rubric={proposedRubric} isNew />
          </div>
        </div>

        {/* Tweak Input (when expanded) */}
        {showTweakInput && (
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
              Refine the Proposal
            </p>
            <textarea
              value={tweakPrompt}
              onChange={(e) => setTweakPrompt(e.target.value)}
              placeholder="Describe how you'd like to adjust the proposal..."
              className="w-full resize-none text-sm rounded p-2 border focus:outline-none"
              style={{
                background: BG_ELEVATED,
                color: TEXT_PRIMARY,
                borderColor: 'rgba(255,255,255,0.1)',
                minHeight: '80px',
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowTweakInput(false)}
                className="px-3 py-1.5 text-xs font-mono"
                style={{ color: TEXT_MUTED }}
              >
                Cancel
              </button>
              <button
                onClick={handleTweakSubmit}
                disabled={!tweakPrompt.trim() || isSubmitting}
                className="px-3 py-1.5 rounded text-xs font-mono disabled:opacity-30"
                style={{ background: GOLD, color: BG_PRIMARY }}
              >
                Regenerate Proposal
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setShowTweakInput(true)}
            disabled={showTweakInput || isSubmitting}
            className="px-3 py-1.5 rounded text-xs font-mono border disabled:opacity-30"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: TEXT_MUTED }}
          >
            Tweak...
          </button>
          <div className="flex gap-2">
            <button
              onClick={onReject}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded text-xs font-mono border disabled:opacity-30"
              style={{ borderColor: RED, color: RED }}
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded text-xs font-mono disabled:opacity-30"
              style={{ background: GREEN, color: BG_PRIMARY }}
            >
              {isSubmitting ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying rubric content
function RubricDisplay({ rubric, isNew }: { rubric: RubricContent; isNew?: boolean }) {
  return (
    <div
      className="text-xs rounded p-2 space-y-2"
      style={{ background: BG_PRIMARY }}
    >
      <p style={{ color: TEXT_MUTED }}>{rubric.description}</p>
      <div className="space-y-1.5">
        <div>
          <span className="font-mono" style={{ color: GREEN }}>High: </span>
          <span style={{ color: TEXT_DIM }}>{rubric.indicators.high.join('; ')}</span>
        </div>
        <div>
          <span className="font-mono" style={{ color: GOLD }}>Med: </span>
          <span style={{ color: TEXT_DIM }}>{rubric.indicators.medium.join('; ')}</span>
        </div>
        <div>
          <span className="font-mono" style={{ color: TEXT_MUTED }}>Low: </span>
          <span style={{ color: TEXT_DIM }}>{rubric.indicators.low.join('; ')}</span>
        </div>
      </div>
    </div>
  );
}
```

**UI Layout**:
- Modal with dark overlay
- Header: Title + dimension name + version change
- Reasoning section with LLM explanation
- Side-by-side rubric comparison (current vs proposed)
- Tweak input (revealed on click)
- Three action buttons: Tweak, Reject, Approve

**Acceptance Criteria**:
- [ ] Modal opens when isOpen is true
- [ ] Shows current vs proposed rubric side-by-side
- [ ] Shows LLM reasoning
- [ ] Approve button calls onApprove
- [ ] Reject button calls onReject
- [ ] Tweak reveals input and calls onTweak with prompt
- [ ] Uses 33 Strategies design tokens

---

### Task 2.2: Integrate Modal into ScoreAssessmentPanel

**Description**: Wire RubricProposalModal into score adjustment flow
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1
**Can run parallel with**: None

**Technical Requirements**:
Update `app/central-command/components/ScoreAssessmentPanel.tsx`:

1. Add state for pending proposal:
```typescript
const [pendingProposal, setPendingProposal] = useState<{
  feedbackId: string;
  dimension: ScoreDimension;
  currentRubric: RubricContent;
  currentVersion: number;
  proposedRubric: RubricContent;
  reasoning: string;
} | null>(null);
const [modalSubmitting, setModalSubmitting] = useState(false);
```

2. Update `handleSubmitFeedback` to show modal when proposal returned:
```typescript
async function handleSubmitFeedback() {
  if (!expandedDimension || !feedbackText.trim() || newScore === null || isSubmitting) return;

  setIsSubmitting(true);
  try {
    // Call the feedback API
    const response = await fetch('/api/central-command/rubric/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimension: expandedDimension,
        prospectId,
        originalScore: scoreAssessments[expandedDimension]?.score ?? 5,
        adjustedScore: newScore,
        feedback: feedbackText,
      }),
    });

    const result = await response.json();

    // Score update happens immediately regardless
    await onScoreUpdate(expandedDimension, newScore, feedbackText);

    // If proposal, show modal
    if (result.hasProposal && result.proposedRubric) {
      setPendingProposal({
        feedbackId: result.feedbackId,
        dimension: expandedDimension as ScoreDimension,
        currentRubric: result.currentRubric,
        currentVersion: result.currentVersion,
        proposedRubric: result.proposedRubric,
        reasoning: result.reasoning,
      });
    } else {
      // No proposal — just close
      setExpandedDimension(null);
      setFeedbackText('');
      setNewScore(null);
    }
  } finally {
    setIsSubmitting(false);
  }
}
```

3. Add modal handlers:
```typescript
async function handleApprove() {
  if (!pendingProposal) return;
  setModalSubmitting(true);
  try {
    await fetch('/api/central-command/rubric/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedbackId: pendingProposal.feedbackId,
        dimension: pendingProposal.dimension,
        content: pendingProposal.proposedRubric,
        currentVersion: pendingProposal.currentVersion,
        action: 'approve',
      }),
    });
    // TODO: Show toast "Rubric updated to v{newVersion}"
    setPendingProposal(null);
    setExpandedDimension(null);
    setFeedbackText('');
    setNewScore(null);
  } finally {
    setModalSubmitting(false);
  }
}

async function handleReject() {
  // Feedback already recorded, just close
  // TODO: Show toast "Rubric unchanged. Your feedback has been recorded."
  setPendingProposal(null);
  setExpandedDimension(null);
  setFeedbackText('');
  setNewScore(null);
}

async function handleTweak(additionalFeedback: string) {
  if (!pendingProposal) return;
  setModalSubmitting(true);
  try {
    // Re-call feedback API with combined feedback
    const combinedFeedback = `${feedbackText}\n\nRefinement: ${additionalFeedback}`;
    const response = await fetch('/api/central-command/rubric/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimension: pendingProposal.dimension,
        prospectId,
        originalScore: scoreAssessments[pendingProposal.dimension]?.score ?? 5,
        adjustedScore: newScore,
        feedback: combinedFeedback,
      }),
    });

    const result = await response.json();

    if (result.hasProposal && result.proposedRubric) {
      // Update modal with new proposal
      setPendingProposal({
        feedbackId: result.feedbackId,
        dimension: pendingProposal.dimension,
        currentRubric: result.currentRubric,
        currentVersion: result.currentVersion,
        proposedRubric: result.proposedRubric,
        reasoning: result.reasoning,
      });
    }
  } finally {
    setModalSubmitting(false);
  }
}
```

4. Add import and render modal:
```typescript
import RubricProposalModal from './RubricProposalModal';

// In return, after the dimension map:
{pendingProposal && (
  <RubricProposalModal
    isOpen={true}
    dimension={pendingProposal.dimension}
    currentRubric={pendingProposal.currentRubric}
    proposedRubric={pendingProposal.proposedRubric}
    reasoning={pendingProposal.reasoning}
    feedbackId={pendingProposal.feedbackId}
    currentVersion={pendingProposal.currentVersion}
    onApprove={handleApprove}
    onReject={handleReject}
    onTweak={handleTweak}
    isSubmitting={modalSubmitting}
  />
)}
```

**Tweak Flow API Contract (Clarification)**:
When user clicks "Tweak..." and provides refinement text:
1. Append tweak prompt to original feedback: `${originalFeedback}\n\nRefinement: ${tweakPrompt}`
2. Re-call `/api/central-command/rubric/feedback` with combined feedback
3. This creates a new RubricFeedback record (audit trail)
4. Display new proposal in modal
5. User can iterate or approve/reject

**Acceptance Criteria**:
- [ ] Score saves immediately (unchanged behavior)
- [ ] Modal appears when hasProposal is true
- [ ] Approve calls /approve endpoint and closes
- [ ] Reject closes modal without API call
- [ ] Tweak re-calls feedback API with combined prompt
- [ ] Multiple tweak iterations work correctly
- [ ] Proposal is ephemeral (navigating away loses it)

---

## Phase 3: Testing & Polish

### Task 3.1: Manual Testing Scenarios

**Description**: Manually verify all approval workflow paths
**Size**: Small
**Priority**: High
**Dependencies**: Phase 2 complete
**Can run parallel with**: None

**Test Scenarios**:

1. **Proposal Shown**
   - Go to Central Command → open any prospect
   - Expand a score dimension
   - Adjust score (e.g., 5 → 8)
   - Provide meaningful feedback ("Contact has NBA connections")
   - Submit
   - Verify modal appears with proposal

2. **Approve Works**
   - From scenario 1, click "Approve"
   - Verify new rubric version created (check via API or Prisma Studio)
   - Verify toast shows "Rubric updated to v{N}"
   - Verify modal closes

3. **Reject Works**
   - Repeat scenario 1
   - Click "Reject"
   - Verify no new rubric version created
   - Verify toast shows "Rubric unchanged. Your feedback has been recorded."
   - Verify modal closes

4. **Tweak Regenerates**
   - Repeat scenario 1
   - Click "Tweak..."
   - Enter refinement: "Focus on network value, not just sports"
   - Click "Regenerate Proposal"
   - Verify new proposal appears in modal
   - Verify can then approve/reject

5. **No Proposal Case**
   - Adjust score with vague feedback ("Seems off")
   - Verify LLM returns hasProposal: false
   - Verify no modal appears
   - Verify score still saved

6. **Proposal Expiry**
   - Get proposal modal
   - Navigate to different prospect or refresh page
   - Verify proposal is lost (ephemeral)

**Acceptance Criteria**:
- [ ] All 6 scenarios pass
- [ ] No console errors
- [ ] Correct toast messages shown

---

### Task 3.2: Documentation Update

**Description**: Update developer guide with approval workflow
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 3.1
**Can run parallel with**: None

**Technical Requirements**:
Update `docs/developer-guides/central-command-scoring-guide.md`:

1. Update Architecture Diagram to show approval step
2. Add new section "Rubric Approval Workflow":
   - Describe the propose → review → approve/reject flow
   - Document the Tweak iteration pattern
   - Reference new API endpoint `/api/central-command/rubric/approve`
3. Update "Testing Score Adjustments" section with modal behavior

**Acceptance Criteria**:
- [ ] Architecture diagram reflects new flow
- [ ] New section documents approval workflow
- [ ] API route reference updated

---

## Execution Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Phase 1: API | 4 tasks | Tasks 1.2 and 1.3 can run parallel after 1.1 |
| Phase 2: UI | 2 tasks | Sequential (modal before integration) |
| Phase 3: Testing | 2 tasks | Sequential |

**Total Tasks**: 8
**Estimated Effort**: Medium (2-3 focused sessions)
**Critical Path**: 1.1 → 1.2 → 1.4 → 2.1 → 2.2 → 3.1
