# Spec: Rubric Approval Workflow

**Status:** Draft
**Author:** Claude Code
**Date:** 2026-02-07
**Related:** `specs/feat-cc-intelligent-scoring.md`, `specs/rubric-driven-extraction.md`

---

## Overview

Add a user approval step before rubric changes are applied. Currently, when a user adjusts a score and provides feedback, the system automatically updates the rubric if the LLM determines changes are warranted. This spec adds a review step where users see proposed changes and explicitly approve, reject, or tweak them.

## Problem Statement

The current rubric learning loop auto-applies changes without user review:
1. User adjusts score + provides feedback
2. LLM evaluates if rubric should change
3. **If yes, rubric is automatically activated** ← No approval step
4. User only learns rubric was updated after the fact

This removes user control over how the scoring system evolves. Users should be able to review proposed rubric changes before they affect future extractions.

## Goals

- Show users proposed rubric changes before applying them
- Allow users to approve, reject, or refine proposed changes
- Maintain existing score adjustment flow (score still saves immediately)
- Keep the experience lightweight (not a heavy workflow)

## Non-Goals

- Batch approval of multiple pending rubric changes (one at a time is fine)
- Admin-only approval (any Central Command user can approve)
- Rubric change notifications/alerts
- Audit log UI for rubric history (API already returns this)
- Rollback UI for rubric versions

---

## Technical Approach

### Architecture Change

**Current Flow:**
```
Feedback → LLM evaluates → Auto-activate new rubric
```

**New Flow:**
```
Feedback → LLM evaluates → Return proposed changes → User reviews → Approve/Reject → Then activate
```

### Key Changes

1. **API Response Change** — `/api/central-command/rubric/feedback` returns proposed changes instead of applying them
2. **New API Endpoint** — `POST /api/central-command/rubric/approve` to confirm/reject proposed changes
3. **UI Component** — Modal showing proposed rubric diff with Approve/Reject/Tweak options
4. **State Management** — Track pending proposal in component state (no database change needed)

---

## Implementation Details

### Phase 1: API Changes

#### 1.1 Modify `recordFeedbackAndUpdateRubric()` in `lib/central-command/rubric.ts`

Change from auto-activating to returning a proposal:

```typescript
export async function recordFeedbackAndProposeRubricUpdate(
  input: RubricFeedbackInput
): Promise<RubricProposalResult> {
  const { dimension, prospectId, originalScore, adjustedScore, feedback } = input;

  // Record the feedback (always)
  const feedbackRecord = await prisma.rubricFeedback.create({
    data: { dimension, prospectId, originalScore, adjustedScore, feedback },
  });

  // Get current rubric
  const current = await getCurrentRubric(dimension);

  // Generate proposed update via LLM
  const proposal = await generateRubricUpdate(dimension, current.content, {
    originalScore, adjustedScore, feedback,
  });

  // Return proposal for user review (don't apply yet)
  return {
    feedbackId: feedbackRecord.id,
    hasProposal: proposal.hasChanges,
    currentRubric: current.content,
    currentVersion: current.version,
    proposedRubric: proposal.hasChanges ? proposal.content : null,
    reasoning: proposal.reasoning,
    dimension,
  };
}
```

#### 1.2 New `applyRubricUpdate()` function

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

#### 1.3 New API endpoint: `POST /api/central-command/rubric/approve`

```typescript
// app/api/central-command/rubric/approve/route.ts
export async function POST(request: NextRequest) {
  // Auth check...

  const { feedbackId, dimension, content, currentVersion, action } = await request.json();
  // action: 'approve' | 'reject'

  if (action === 'reject') {
    // Just acknowledge - feedback already recorded, no rubric change
    return NextResponse.json({ success: true, rubricUpdated: false });
  }

  // Apply the approved rubric
  const result = await applyRubricUpdate(feedbackId, dimension, content, currentVersion);
  return NextResponse.json({ success: true, rubricUpdated: true, newVersion: result.newVersion });
}
```

### Phase 2: UI Changes

#### 2.1 RubricProposalModal Component

New component that shows when `hasProposal: true`:

```tsx
// app/central-command/components/RubricProposalModal.tsx
interface RubricProposalModalProps {
  isOpen: boolean;
  dimension: string;
  currentRubric: RubricContent;
  proposedRubric: RubricContent;
  reasoning: string;
  feedbackId: string;
  currentVersion: number;
  onApprove: () => void;
  onReject: () => void;
  onTweak: (prompt: string) => void;
}
```

**UI Layout:**
- Modal title: "Proposed Rubric Update: {dimension}"
- LLM reasoning displayed at top
- Side-by-side or diff view of current vs proposed indicators
- Three buttons: "Approve" (green), "Reject" (red outline), "Tweak..." (secondary)
- Tweak reveals a text input for refinement prompt

#### 2.2 Integration in ScoreAssessmentPanel

After score feedback submission:
1. If response has `hasProposal: true`, show RubricProposalModal
2. On Approve → call `/api/central-command/rubric/approve` with action: 'approve'
3. On Reject → call with action: 'reject'
4. On Tweak → re-call `/api/central-command/rubric/feedback` with additional prompt, show new proposal

---

## User Experience

### Happy Path
1. User adjusts score from 5 → 8, enters feedback: "Contact has NBA connections"
2. Score saves immediately (unchanged behavior)
3. Modal appears: "Proposed Rubric Update: strategic"
4. Shows reasoning: "Adding 'professional sports network connections' to high indicators"
5. Shows diff: current indicators vs proposed
6. User clicks "Approve"
7. Toast: "Rubric updated to v2"

### Reject Path
1-3. Same as above
4. User sees proposal but disagrees
5. Clicks "Reject"
6. Toast: "Rubric unchanged. Your feedback has been recorded."

### Tweak Path
1-4. Same as above
5. User wants adjustment, clicks "Tweak..."
6. Input appears, user types: "Focus on network value, not just sports"
7. Submits → new proposal generated
8. User reviews revised proposal → Approve/Reject

---

## Testing Approach

### Key Scenarios
1. **Proposal shown** — Adjust score, verify modal appears with proposed changes
2. **Approve works** — Click approve, verify new rubric version created
3. **Reject works** — Click reject, verify no rubric change, feedback recorded
4. **Tweak regenerates** — Enter tweak prompt, verify new proposal generated
5. **No proposal** — Adjust score where LLM says no changes needed, verify no modal

### Manual Testing
1. Go to Central Command → open any prospect
2. Expand a score dimension
3. Adjust score and provide feedback explaining why
4. Verify proposal modal appears (if LLM suggests changes)
5. Test Approve, Reject, and Tweak flows

---

## Open Questions

1. **Tweak iteration limit?** — Should we limit how many times a user can tweak before forcing approve/reject? (Suggest: no limit, trust users)

2. **Proposal expiry?** — Should proposals expire if user navigates away? (Suggest: yes, proposals are ephemeral in component state)

---

## Future Improvements

*These are out of scope for initial implementation:*

- **Batch approval UI** — Review multiple pending proposals at once
- **Rubric diff visualization** — Rich diff view highlighting exact changes
- **Proposal persistence** — Store pending proposals in database for cross-session review
- **Admin approval workflow** — Require admin sign-off for rubric changes
- **Undo/rollback** — Ability to revert to previous rubric version
- **Change notifications** — Alert users when rubrics they use have been updated
- **Rubric changelog** — UI to browse rubric version history

---

## References

- Current rubric implementation: `lib/central-command/rubric.ts`
- Score UI: `app/central-command/components/ScoreAssessmentPanel.tsx`
- Feedback API: `app/api/central-command/rubric/feedback/route.ts`
- Related spec: `specs/feat-cc-intelligent-scoring.md`
