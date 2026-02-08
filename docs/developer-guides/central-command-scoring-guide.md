# Central Command Scoring Guide

**Feature:** Intelligent Scoring with Learning Loop
**Implementation Date:** February 2026
**Related Specs:** `specs/feat-inline-score-editing.md`, `specs/feat-intelligent-scoring-loop.md`, `specs/rubric-driven-extraction.md`

---

## Overview

Central Command uses a 5-dimension scoring system to evaluate prospects. The system features:

1. **AI-powered initial scoring** during extraction from text dumps
2. **Inline score editing** for human calibration
3. **Learning loop** that refines rubrics based on user feedback
4. **Rubric approval workflow** for reviewing proposed changes before applying
5. **Dynamic rubric injection** into extraction prompts

### Why This Exists

After AI extracts prospect intelligence from meeting notes or call transcripts, it assigns scores across 5 dimensions. These scores help prioritize pipeline opportunities. However, AI calibration isn't perfect — the learning loop allows human expertise to calibrate the system over time.

---

## Score Dimensions

| Dimension | Short | What It Measures | Higher = Better |
|-----------|-------|------------------|-----------------|
| `strategic` | STRAT | Logo/brand value, network potential, referral value | Yes |
| `value` | VAL | Revenue potential, budget signals, growth opportunity | Yes |
| `readiness` | READY | Pain urgency, active search, readiness to buy | Yes |
| `timeline` | TIME | Forcing functions, deadlines, urgency signals | Yes |
| `bandwidth` | BAND | Capacity fit, scope complexity | Higher = easier for us |

**Scale:** 1-10 with thresholds:
- **7-10 (Green):** Strong signal
- **4-6 (Gold):** Moderate/neutral
- **1-3 (Red):** Weak/concerning

---

## Architecture

### Data Flow

```
                    ┌─────────────────────────────────────┐
                    │         EXTRACTION FLOW             │
                    └─────────────────────────────────────┘
                                    │
    Text Dump → POST /api/central-command/extract
                                    │
                    ┌───────────────┴───────────────┐
                    │  getRubricsWithFallback()     │
                    │  - Try database first         │
                    │  - Fall back to cache         │
                    │  - Fall back to INITIAL       │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  buildExtractionSystemPrompt()│
                    │  - Injects current rubrics    │
                    │  - High/Medium/Low indicators │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  gpt-4o generates scores      │
                    │  with evidence-based rationale│
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  Scores stored in             │
                    │  PipelineClient.enrichment    │
                    │  Findings.scoreAssessments    │
                    └─────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │    LEARNING LOOP WITH APPROVAL      │
                    └─────────────────────────────────────┘
                                    │
    User adjusts score → PATCH /api/central-command/prospects/[id]
                                    │
                    ┌───────────────┴───────────────┐
                    │  POST /rubric/feedback        │
                    │  - Records adjustment         │
                    │  - Stores feedback text       │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  LLM evaluates if rubric      │
                    │  should be updated            │
                    │  (gpt-4o-mini)               │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
         No changes                              Changes warranted
              │                                           │
    Feedback recorded only              ┌─────────────────┴─────────────┐
                                        │  Return PROPOSAL (not applied)│
                                        │  - Current rubric             │
                                        │  - Proposed rubric            │
                                        │  - LLM reasoning              │
                                        └───────────────┬───────────────┘
                                                        │
                                        ┌───────────────┴───────────────┐
                                        │  User reviews in modal        │
                                        │  - Approve → POST /approve    │
                                        │  - Reject → feedback only     │
                                        │  - Tweak → regenerate proposal│
                                        └───────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/central-command/rubric.ts` | Rubric CRUD, feedback processing, `getRubricsWithFallback()` |
| `lib/central-command/prompts.ts` | `buildExtractionSystemPrompt()`, prompt components |
| `lib/central-command/score-display.ts` | Canonical colors, thresholds, labels, extraction helpers |
| `app/central-command/components/ScoreDisplay.tsx` | Inline score editing UI |
| `app/api/central-command/rubric/route.ts` | GET rubrics + feedback history |
| `app/api/central-command/rubric/feedback/route.ts` | POST feedback, return proposal |
| `app/api/central-command/rubric/approve/route.ts` | POST approve/reject proposal |
| `app/api/central-command/extract/route.ts` | Uses dynamic rubrics for extraction |
| `app/central-command/components/RubricProposalModal.tsx` | UI for reviewing proposals |
| `app/central-command/components/ScoreAssessmentPanel.tsx` | Score UI with approval flow |

---

## Database Models

### ScoringRubric

```prisma
model ScoringRubric {
  id                    String    @id @default(cuid())
  dimension             String    // strategic, value, readiness, timeline, bandwidth
  version               Int       @default(1)
  content               Json      // { description, indicators: { high, medium, low } }
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  triggeringFeedback    RubricFeedback? @relation("TriggeringFeedback")
  triggeringFeedbackId  String?   @unique
}
```

### RubricFeedback

```prisma
model RubricFeedback {
  id             String    @id @default(cuid())
  dimension      String
  prospectId     String
  originalScore  Int
  adjustedScore  Int
  feedback       String    // User's explanation for adjustment
  createdAt      DateTime  @default(now())
  createdRubric  ScoringRubric? @relation("TriggeringFeedback")
  prospect       PipelineClient @relation(...)
}
```

### RubricContent Type

```typescript
interface RubricContent {
  description: string;  // What this dimension measures
  indicators: {
    high: string[];    // 7-10 signals (4-5 items)
    medium: string[];  // 4-6 signals
    low: string[];     // 1-3 signals
  };
}
```

---

## Implementation Details

### Score Display (lib/central-command/score-display.ts)

This is the **canonical source** for score-related constants:

```typescript
// Always import from here
import {
  SCORE_KEYS,
  SCORE_LABELS,
  SCORE_THRESHOLDS,
  getScoreColor,
  getScoreFromFindings
} from '@/lib/central-command/score-display';

// Color thresholds
SCORE_THRESHOLDS.HIGH   // 7 (7+ = green)
SCORE_THRESHOLDS.MEDIUM // 4 (4-6 = gold, <4 = red)

// Get score from enrichmentFindings JSON
const score = getScoreFromFindings(client.enrichmentFindings, 'strategic');
```

### Rubric Fallback (lib/central-command/rubric.ts)

```typescript
// 3-tier fallback ensures extraction never fails
const { rubrics, versions, source } = await getRubricsWithFallback();
// source: 'database' | 'cache' | 'initial'

// Module-level cache persists across requests (serverless)
let cachedRubrics: Record<ScoreDimension, {...}> | null = null;
```

### Dynamic Prompt Building (lib/central-command/prompts.ts)

```typescript
// Inject current rubrics into extraction prompt
const systemPrompt = buildExtractionSystemPrompt(rubrics);

// Prompt structure:
// EXTRACTION_PROMPT_BASE (context, synthesis sections)
// + Dynamic score dimensions (from rubrics)
// + EXTRACTION_PROMPT_SUFFIX (operational extractions, rules)
```

---

## Rubric Approval Workflow

When a user adjusts a score and provides feedback, the system now presents proposed rubric changes for review before applying them.

### Flow

1. **User adjusts score** — Clicks score pill, changes value, enters explanation
2. **Score saves immediately** — The new score is persisted regardless of rubric outcome
3. **LLM evaluates** — Determines if feedback warrants rubric changes
4. **If changes warranted** — Modal appears showing proposed rubric update
5. **User reviews** — Can Approve, Reject, or Tweak the proposal
6. **On Approve** — Rubric is updated to new version
7. **On Reject** — Feedback is recorded but rubric unchanged
8. **On Tweak** — User provides refinement, new proposal generated

### API Endpoints

```typescript
// Returns proposal instead of auto-applying
POST /api/central-command/rubric/feedback
// Response: { feedbackId, hasProposal, currentRubric, proposedRubric, reasoning, ... }

// Apply or reject proposal
POST /api/central-command/rubric/approve
// Body: { feedbackId, dimension, content, currentVersion, action: 'approve' | 'reject' }
```

### Tweak Flow

When user clicks "Tweak..." in the modal:
1. Original feedback is combined with refinement: `${originalFeedback}\n\nRefinement: ${tweakPrompt}`
2. Re-calls `/api/central-command/rubric/feedback` with combined feedback
3. Creates new RubricFeedback record (audit trail)
4. Returns new proposal for review
5. User can iterate or approve/reject

### Key Functions

```typescript
// lib/central-command/rubric.ts

// Returns proposal for user review (does NOT apply)
export async function recordFeedbackAndProposeRubricUpdate(
  input: RubricFeedbackInput
): Promise<RubricProposalResult>

// Applies an approved rubric update
export async function applyRubricUpdate(
  feedbackId: string,
  dimension: ScoreDimension,
  content: RubricContent,
  currentVersion: number
): Promise<{ success: boolean; newVersion: number }>
```

### State Management

Proposals are **ephemeral** (stored in component state only):
- Navigating away loses the pending proposal
- No database table for pending proposals
- This keeps the implementation simple

---

## Common Tasks

### Adding a New Score Dimension

1. Add to `SCORE_DIMENSIONS` in `lib/central-command/rubric.ts`
2. Add to `SCORE_KEYS` and `SCORE_LABELS` in `lib/central-command/score-display.ts`
3. Add initial rubric content to `INITIAL_RUBRICS`
4. Update `scoreAssessmentSchema` in `lib/central-command/schemas.ts`
5. Run `npx tsx scripts/seed-rubrics.ts` to seed the new dimension

### Viewing Rubric History

```typescript
// API endpoint returns rubrics + recent feedback
GET /api/central-command/rubric

// Response includes:
{
  rubrics: Record<ScoreDimension, { content, version, id }>,
  feedbackHistory: [
    { dimension, originalScore, adjustedScore, feedback, createdAt, prospectName }
  ]
}
```

### Testing Score Adjustments with Approval Workflow

1. Open a prospect in Central Command
2. Click any score pill to enter edit mode
3. Adjust the score (e.g., 5 → 8)
4. Enter meaningful feedback ("Contact has NBA connections")
5. Submit — score saves immediately
6. If LLM proposes changes, modal appears
7. Review proposed rubric update
8. Test: Approve, Reject, or Tweak the proposal

**Test Scenarios:**
- **Proposal shown** — Adjust score, verify modal appears
- **Approve works** — Click approve, verify new rubric version created
- **Reject works** — Click reject, verify no rubric change
- **Tweak regenerates** — Enter refinement, verify new proposal
- **No proposal** — Vague feedback, verify no modal appears
- **Proposal expiry** — Navigate away, verify proposal lost

---

## Gotchas

### Module-Level Cache in Serverless

The rubric cache is module-level (`let cachedRubrics = null`). In serverless environments:
- Cache persists across requests within the same instance
- Different instances may have different cache states
- This is intentional — provides fallback without external cache

### Score Field Mapping

Use `SCORE_FIELD_MAP` for database field names:

```typescript
// CORRECT
import { SCORE_FIELD_MAP } from '@/lib/central-command/score-display';
const fieldName = SCORE_FIELD_MAP['strategic']; // 'scoreStrategic'

// WRONG - string concatenation
const fieldName = `score${capitalize(dimension)}`; // Fragile
```

### Rubric Updates Are Not Retroactive

When a rubric is updated via feedback:
- New extractions use the updated rubric
- Existing scores are NOT recalculated
- This is by design — preserves audit trail

### INITIAL_RUBRICS as Ultimate Fallback

If both database and cache fail, `INITIAL_RUBRICS` ensures extraction still works:

```typescript
// INITIAL_RUBRICS defined in rubric.ts
// Always keep these in sync with the database schema
```

---

## Testing

### Manual Testing Flow

1. **Extraction with rubrics:**
   - Submit new text dump
   - Check console: `[central-command/extract] Using database rubrics (versions: {...})`
   - Verify scores appear with rationale

2. **Score adjustment:**
   - Click score → adjust → submit feedback
   - Check response includes `rubricUpdated: true/false`
   - If updated, check new version number

3. **Fallback testing:**
   - Temporarily break DB connection
   - Submit new extraction
   - Console should show: `Using cache rubrics` or `Using initial rubrics`

### API Testing

```bash
# Get current rubrics
curl -X GET http://localhost:3033/api/central-command/rubric \
  -H "Cookie: central-command-session=..."

# Submit feedback
curl -X POST http://localhost:3033/api/central-command/rubric/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "dimension": "strategic",
    "prospectId": "...",
    "originalScore": 5,
    "adjustedScore": 8,
    "feedback": "Contact has strong NBA connections not initially captured"
  }'
```

---

## Future Enhancements

- **Rubric diff view** — Show what changed between versions
- **Confidence calibration** — Track accuracy of score predictions
- **Batch recalculation** — Option to re-score with updated rubrics
- **Export feedback** — Download feedback history for analysis

---

*Last Updated: February 2026*
