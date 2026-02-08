# Intelligent Scoring with Learning Loop

**Status:** Draft
**Author:** Claude Code
**Date:** 2026-02-06
**Context:** Central Command enhancement for refined scoring and rubric evolution

---

## Overview

Replace the current static scoring display with an interactive assessment workflow that surfaces AI rationale, enables score refinement via feedback, and tracks rubric evolution over time. When users provide feedback that changes a score, the system records the feedback and triggers a rubric recalibration, building an evolving scoring rubric that reflects 33 Strategies' real-world evaluation patterns.

## Problem Statement

The current 5-dimension scoring (Strategic, Value, Readiness, Timeline, Bandwidth) works as follows:
1. AI extracts initial scores with rationale during intake
2. Scores display in tables with color-coded numbers
3. Users can manually edit scores via EditableScoreCard

What's missing:
1. **Rationale visibility** — Users see scores but not the reasoning; AI's evidence and confidence are hidden
2. **Structured feedback** — When users adjust scores, there's no structured way to capture *why*
3. **Rubric evolution** — Each scoring is independent; the system doesn't learn from user corrections to improve future extractions

## Goals

- Display AI rationale, evidence, and confidence for each score dimension
- Enable score refinement via natural language feedback (not just manual number changes)
- Track rubric changes and the feedback that triggered them
- Store rubric evolution history for future analysis (no re-processing of historical prospects)
- Trigger rubric updates on any score feedback during assessment review

## Non-Goals

- Automatic re-scoring of existing prospects when rubric changes
- Real-time rubric application during extraction (rubric evolves, but extraction prompt is static)
- ML-based scoring model training
- A/B testing different rubrics
- Multi-user rubric versioning

---

## Technical Approach

### Files That Change

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `ScoringRubric` and `RubricFeedback` models |
| `lib/central-command/rubric.ts` | **New:** Rubric loading, update logic, feedback processing |
| `lib/central-command/prompts.ts` | Modify extraction prompt to reference rubric (future enhancement) |
| `app/central-command/components/ScoreAssessmentPanel.tsx` | **New:** Full-view score assessment with rationale + feedback |
| `app/central-command/components/EditableScoreCard.tsx` | Enhance to show rationale, evidence, confidence |
| `app/central-command/components/ClientDetailModal.tsx` | Add assessment review section with ScoreAssessmentPanel |
| `app/api/central-command/rubric/feedback/route.ts` | **New:** Record feedback and trigger rubric update |
| `app/api/central-command/rubric/route.ts` | **New:** Get current rubric, rubric history |

### Integration Points

- Existing `scoreAssessmentSchema` in `lib/central-command/schemas.ts`
- Existing `EditableScoreCard` component
- Existing score refinement via `/api/central-command/refine-synthesis` (already handles score updates)

---

## Implementation Details

### 1. Data Layer — Rubric Models

Add to Prisma schema:

```prisma
model ScoringRubric {
  id          String   @id @default(cuid())
  dimension   String   // 'strategic' | 'value' | 'readiness' | 'timeline' | 'bandwidth'
  version     Int      @default(1)
  content     Json     // { description: string, indicators: { high: string[], medium: string[], low: string[] } }
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Link to feedback that triggered this version
  triggeringFeedback RubricFeedback? @relation("TriggeringFeedback")

  @@unique([dimension, version])
  @@index([dimension, isActive])
}

model RubricFeedback {
  id              String   @id @default(cuid())
  dimension       String   // Which score dimension
  prospectId      String   // Which prospect triggered this
  originalScore   Int      // AI's original score
  adjustedScore   Int      // User's adjusted score
  feedback        String   // User's natural language feedback
  createdAt       DateTime @default(now())

  // Link to rubric version this created (if any)
  createdRubricId String?  @unique
  createdRubric   ScoringRubric? @relation("TriggeringFeedback", fields: [createdRubricId], references: [id])

  // Reference to prospect
  prospect        PipelineClient @relation(fields: [prospectId], references: [id], onDelete: Cascade)

  @@index([dimension])
  @@index([prospectId])
}
```

Also add to `PipelineClient`:
```prisma
rubricFeedback  RubricFeedback[]
```

### 2. Rubric Content Structure

**`lib/central-command/rubric.ts`**

```typescript
export interface RubricContent {
  description: string;
  indicators: {
    high: string[];    // 7-10 signals
    medium: string[];  // 4-6 signals
    low: string[];     // 1-3 signals
  };
}

// Initial rubrics (seeded from PIPELINE_EXTRACTION_SYSTEM_PROMPT)
export const INITIAL_RUBRICS: Record<string, RubricContent> = {
  strategic: {
    description: 'Logo/brand value, network potential, referral value, industry expansion',
    indicators: {
      high: [
        'Marquee brand with strong recognition',
        'Well-connected executive who can refer to other valuable clients',
        'Strategic entry point into new industry or market',
      ],
      medium: [
        'Known brand in their niche',
        'Some network connections',
        'Established but not high-visibility',
      ],
      low: [
        'Unknown brand with no referral potential',
        'Limited network reach',
        'No strategic value beyond the deal itself',
      ],
    },
  },
  value: {
    description: 'Deal size, budget signals, growth potential, willingness to pay',
    indicators: {
      high: [
        'Explicit budget mention ($50k+)',
        'Recently funded company',
        'Large scope with expansion potential',
      ],
      medium: [
        'Implied budget exists but not quantified',
        'Mid-size scope',
        'Some growth signals',
      ],
      low: [
        'Bootstrapped with no budget signals',
        'Very small scope',
        'Cost-sensitive framing',
      ],
    },
  },
  // ... readiness, timeline, bandwidth
};

export async function getCurrentRubric(dimension: string): Promise<RubricContent> {
  const rubric = await prisma.scoringRubric.findFirst({
    where: { dimension, isActive: true },
    orderBy: { version: 'desc' },
  });
  return rubric?.content as RubricContent || INITIAL_RUBRICS[dimension];
}

export async function recordFeedbackAndUpdateRubric(
  dimension: string,
  prospectId: string,
  originalScore: number,
  adjustedScore: number,
  feedback: string
): Promise<{ rubricUpdated: boolean; newVersion?: number }> {
  // 1. Record the feedback
  const feedbackRecord = await prisma.rubricFeedback.create({
    data: { dimension, prospectId, originalScore, adjustedScore, feedback },
  });

  // 2. Get current rubric
  const currentRubric = await getCurrentRubric(dimension);
  const currentVersion = await prisma.scoringRubric.findFirst({
    where: { dimension, isActive: true },
    orderBy: { version: 'desc' },
  });

  // 3. Generate updated rubric via LLM
  const updatedRubric = await generateRubricUpdate(
    dimension,
    currentRubric,
    { originalScore, adjustedScore, feedback }
  );

  // 4. If LLM suggests changes, create new version
  if (updatedRubric.hasChanges) {
    // Deactivate old version
    if (currentVersion) {
      await prisma.scoringRubric.update({
        where: { id: currentVersion.id },
        data: { isActive: false },
      });
    }

    // Create new version linked to feedback
    const newRubric = await prisma.scoringRubric.create({
      data: {
        dimension,
        version: (currentVersion?.version || 0) + 1,
        content: updatedRubric.content,
        isActive: true,
        triggeringFeedback: { connect: { id: feedbackRecord.id } },
      },
    });

    // Link feedback to rubric
    await prisma.rubricFeedback.update({
      where: { id: feedbackRecord.id },
      data: { createdRubricId: newRubric.id },
    });

    return { rubricUpdated: true, newVersion: newRubric.version };
  }

  return { rubricUpdated: false };
}
```

### 3. LLM-Powered Rubric Update

**`lib/central-command/rubric.ts`** (continued)

```typescript
async function generateRubricUpdate(
  dimension: string,
  currentRubric: RubricContent,
  feedback: { originalScore: number; adjustedScore: number; feedback: string }
): Promise<{ hasChanges: boolean; content: RubricContent }> {
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

Return:
{
  "hasChanges": boolean,
  "reasoning": "Why you did or didn't update the rubric",
  "content": { description, indicators: { high, medium, low } }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a scoring rubric analyst.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Failed to generate rubric update:', error);
    // On LLM failure, return no changes — feedback is still recorded
    return { hasChanges: false, content: currentRubric };
  }
}
```

### 3a. Initial Rubric Seeding

On first access, if no active rubric exists for a dimension, the system uses `INITIAL_RUBRICS` as fallback. Optionally, run a seed script to populate the database:

**`scripts/seed-rubrics.ts`**

```typescript
import prisma from '../lib/prisma';
import { INITIAL_RUBRICS } from '../lib/central-command/rubric';

async function seedRubrics() {
  for (const [dimension, content] of Object.entries(INITIAL_RUBRICS)) {
    const existing = await prisma.scoringRubric.findFirst({
      where: { dimension, isActive: true },
    });

    if (!existing) {
      await prisma.scoringRubric.create({
        data: {
          dimension,
          version: 1,
          content: content as any,
          isActive: true,
        },
      });
      console.log(`Seeded rubric: ${dimension}`);
    }
  }
}

seedRubrics().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run with: `npx tsx scripts/seed-rubrics.ts`

### 4. Component — ScoreAssessmentPanel

**`app/central-command/components/ScoreAssessmentPanel.tsx`**

Full-view assessment panel showing all 5 dimensions with rationale.

```typescript
interface ScoreAssessmentPanelProps {
  scoreAssessments: Record<string, EnrichmentScoreAssessment>;
  rubrics: Record<string, RubricContent>;
  onScoreUpdate: (dimension: string, score: number, feedback: string) => void;
}
```

UI Layout per dimension:
```
┌─────────────────────────────────────────────────────────────────┐
│ STRATEGIC VALUE                                      SCORE: 7  │
├─────────────────────────────────────────────────────────────────┤
│ Rationale:                                                      │
│ "Well-connected VP with strong industry network. Potential      │
│  referral value to other enterprise accounts."                  │
│                                                                 │
│ Evidence:                                                       │
│ • "Previously led BD at Salesforce"                            │
│ • "Mentioned knowing several VP-level contacts"                │
│ • "Active LinkedIn presence with 10k+ followers"               │
│                                                                 │
│ Confidence: 0.85 ████████░░                                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Adjust score? Tell me why...                            │    │
│ │ [________________________________________________]     │    │
│ └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

Behavior:
- Expanding a dimension shows full rationale, evidence, and confidence
- Feedback input appears below — user types why they think score should change
- On submit: calls `/api/central-command/rubric/feedback` with feedback
- Score update triggers `onScoreUpdate` which persists to PipelineRecord

### 5. Enhanced EditableScoreCard

Update existing `EditableScoreCard` to optionally show rationale/evidence:

```typescript
interface EditableScoreCardProps {
  // ... existing props
  showRationale?: boolean;  // Expand to show AI reasoning
  evidence?: string[];      // Key phrases supporting the score
  confidence?: number;      // AI confidence 0-1
}
```

When `showRationale` is true:
- Click card to expand and show rationale
- Evidence shown as bullet points
- Confidence shown as progress bar

### 6. API — Feedback Endpoint

**`POST /api/central-command/rubric/feedback`**

```typescript
// Request
{
  dimension: 'strategic',
  prospectId: 'cuid...',
  originalScore: 5,
  adjustedScore: 8,
  feedback: 'His NBA connections make him highly valuable for referrals'
}

// Response
{
  success: true,
  rubricUpdated: true,
  newRubricVersion: 2,
  changeSummary: 'Added "Professional sports network connections" to high-value strategic indicators'
}
```

This endpoint:
1. Records the feedback to `RubricFeedback` table
2. Calls `recordFeedbackAndUpdateRubric` to potentially update rubric
3. Returns whether rubric was updated

### 7. API — Rubric Endpoint

**`GET /api/central-command/rubric`**

```typescript
// Response
{
  rubrics: {
    strategic: { version: 2, content: {...} },
    value: { version: 1, content: {...} },
    // ...
  },
  feedbackHistory: [
    {
      dimension: 'strategic',
      date: '2026-02-06',
      feedback: 'NBA connections...',
      createdRubricVersion: 2,
    },
    // ...
  ]
}
```

Returns current active rubrics and feedback history for transparency.

### 8. ClientDetailModal Integration

Add SCORE ASSESSMENT section after CLIENT INTELLIGENCE:

```tsx
<Section title="SCORE ASSESSMENT">
  <ScoreAssessmentPanel
    scoreAssessments={enrichmentFindings?.scoreAssessments || {}}
    rubrics={rubrics}
    onScoreUpdate={handleScoreUpdateWithFeedback}
  />
</Section>
```

Handler:
```typescript
async function handleScoreUpdateWithFeedback(
  dimension: string,
  newScore: number,
  feedback: string
) {
  // 1. Update the score on PipelineRecord
  await updateProspect(prospectId, {
    [`score${capitalize(dimension)}`]: newScore,
  });

  // 2. Record feedback and potentially update rubric
  await fetch('/api/central-command/rubric/feedback', {
    method: 'POST',
    body: JSON.stringify({
      dimension,
      prospectId,
      originalScore: enrichmentFindings.scoreAssessments[dimension].score,
      adjustedScore: newScore,
      feedback,
    }),
  });

  // 3. Refresh local state
  refetchProspect();
}
```

---

## User Experience

### Assessment Review Flow

1. User opens prospect and scrolls to SCORE ASSESSMENT
2. Sees 5 dimension cards with scores and rationale summaries
3. Clicks a dimension (e.g., Strategic) to expand
4. Sees full rationale, evidence bullets, confidence bar
5. Disagrees with score → types feedback: "His NBA connections make him highly valuable"
6. Submits → score updates to their adjustment
7. System records feedback → potentially updates rubric
8. Toast: "Score updated. Rubric refined based on your feedback."

### Rubric Transparency

- Optional "View Rubric" link shows current rubric indicators
- "Rubric History" shows how rubric has evolved and what feedback triggered changes
- Users can see they're shaping the system's future evaluations

---

## Testing Approach

- **Rationale display**: Verify score cards show rationale when expanded
- **Feedback submission**: Submit feedback → verify recorded in database
- **Rubric update**: Submit feedback that should trigger update → verify new rubric version created
- **No-op feedback**: Submit prospect-specific feedback → verify rubric not updated
- **Score persistence**: Adjust score with feedback → verify PipelineRecord updated
- **History tracking**: Multiple feedbacks → verify history shows all with rubric version links

---

## Open Questions

None — clarified with user:
- Rubric updates trigger on any score feedback during assessment review
- Zero historical data to process; track rubric changes + triggering feedback for future analysis
- No automatic re-scoring of existing prospects

---

## Future Improvements

- **Rubric injection into extraction prompt** — Use current rubric in PIPELINE_EXTRACTION_SYSTEM_PROMPT for better initial scoring
- **Confidence calibration** — Track AI confidence vs user adjustment patterns to calibrate confidence scoring
- **Rubric diff view** — Visual diff of rubric versions
- **Feedback clustering** — Group similar feedback to identify common calibration patterns
- **Export rubric** — Download current rubric as documentation
- **Rollback rubric** — Revert to previous version if new one performs poorly
- **Multi-user rubric governance** — Approval workflow for rubric changes

---

## References

- **Score display utilities:** `lib/central-command/score-display.ts`
- **Existing score cards:** `app/central-command/components/EditableScoreCard.tsx`
- **Score refinement API:** `app/api/central-command/refine-synthesis/route.ts`
- **Schema definitions:** `lib/central-command/schemas.ts`
- **Extraction prompt:** `lib/central-command/prompts.ts`
