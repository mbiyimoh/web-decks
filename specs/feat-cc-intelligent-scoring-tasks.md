# Task Breakdown: Intelligent Scoring with Learning Loop

Generated: 2026-02-07
Source: specs/feat-cc-intelligent-scoring.md

## Overview

Replace the static scoring display with an interactive assessment workflow that surfaces AI rationale, enables score refinement via feedback, and tracks rubric evolution. When users provide feedback that changes a score, the system records feedback and triggers rubric recalibration.

---

## Phase 1: Database & Data Layer

### Task 1.1: Add Prisma Models for Scoring Rubrics

**Description**: Add ScoringRubric and RubricFeedback models to Prisma schema
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (foundation task)

**Technical Requirements**:

Add to `prisma/schema.prisma`:

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

**Implementation Steps**:
1. Add ScoringRubric model with dimension, version, content JSON, isActive flag
2. Add RubricFeedback model with dimension, scores, feedback text, prospect relation
3. Add rubricFeedback relation to PipelineClient
4. Run `npx prisma db push` to sync schema
5. Run `npx prisma generate` to update client

**Acceptance Criteria**:
- [ ] ScoringRubric model exists with proper indexes
- [ ] RubricFeedback model exists with prospect relation
- [ ] PipelineClient has rubricFeedback relation
- [ ] Database synced successfully

---

### Task 1.2: Create Rubric Business Logic Module

**Description**: Create lib/central-command/rubric.ts with rubric loading, feedback processing, and LLM update logic
**Size**: Large
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: None

**Technical Requirements**:

Create `lib/central-command/rubric.ts`:

```typescript
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI();

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
  readiness: {
    description: 'Pain urgency, active search, previous attempts, readiness to act',
    indicators: {
      high: [
        'Active pain point causing immediate problems',
        'Already evaluating solutions',
        'Decision-maker engaged and responsive',
      ],
      medium: [
        'Acknowledged need but not urgent',
        'Early research phase',
        'Some internal alignment',
      ],
      low: [
        'No clear pain or urgency',
        'Just exploring options',
        'Multiple stakeholders unaligned',
      ],
    },
  },
  timeline: {
    description: 'Urgency, forcing functions, deadlines, decision timing',
    indicators: {
      high: [
        'Hard deadline mentioned (launch, board meeting, etc.)',
        'Budget expires end of quarter',
        'Urgent business need driving timeline',
      ],
      medium: [
        'Soft timeline of 2-3 months',
        'Some urgency but flexible',
        'Planning for next quarter',
      ],
      low: [
        'No timeline mentioned',
        'Just gathering information',
        'Long-term planning horizon',
      ],
    },
  },
  bandwidth: {
    description: 'Scope complexity, team fit, effort estimate for 33S',
    indicators: {
      high: [
        'Clear scope that fits 33S capabilities',
        'Reasonable project size (not too small, not overwhelming)',
        'Good team fit and availability',
      ],
      medium: [
        'Scope needs refinement',
        'May require some stretching',
        'Moderate team availability',
      ],
      low: [
        'Scope too large or too small',
        'Poor team fit',
        'Capacity constraints',
      ],
    },
  },
};

export async function getCurrentRubric(dimension: string): Promise<RubricContent> {
  const rubric = await prisma.scoringRubric.findFirst({
    where: { dimension, isActive: true },
    orderBy: { version: 'desc' },
  });
  return (rubric?.content as RubricContent) || INITIAL_RUBRICS[dimension];
}

export async function getAllCurrentRubrics(): Promise<Record<string, { version: number; content: RubricContent }>> {
  const rubrics = await prisma.scoringRubric.findMany({
    where: { isActive: true },
    orderBy: { version: 'desc' },
  });

  const result: Record<string, { version: number; content: RubricContent }> = {};

  // Add database rubrics
  for (const rubric of rubrics) {
    if (!result[rubric.dimension]) {
      result[rubric.dimension] = {
        version: rubric.version,
        content: rubric.content as RubricContent,
      };
    }
  }

  // Fill in missing dimensions with initial rubrics
  for (const dimension of Object.keys(INITIAL_RUBRICS)) {
    if (!result[dimension]) {
      result[dimension] = {
        version: 0,
        content: INITIAL_RUBRICS[dimension],
      };
    }
  }

  return result;
}

export async function getFeedbackHistory(limit = 20): Promise<Array<{
  dimension: string;
  date: string;
  feedback: string;
  originalScore: number;
  adjustedScore: number;
  createdRubricVersion: number | null;
}>> {
  const feedbacks = await prisma.rubricFeedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      createdRubric: true,
    },
  });

  return feedbacks.map((f) => ({
    dimension: f.dimension,
    date: f.createdAt.toISOString(),
    feedback: f.feedback,
    originalScore: f.originalScore,
    adjustedScore: f.adjustedScore,
    createdRubricVersion: f.createdRubric?.version || null,
  }));
}

async function generateRubricUpdate(
  dimension: string,
  currentRubric: RubricContent,
  feedback: { originalScore: number; adjustedScore: number; feedback: string }
): Promise<{ hasChanges: boolean; content: RubricContent; reasoning?: string }> {
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

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      hasChanges: result.hasChanges || false,
      content: result.content || currentRubric,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('Failed to generate rubric update:', error);
    // On LLM failure, return no changes — feedback is still recorded
    return { hasChanges: false, content: currentRubric };
  }
}

export async function recordFeedbackAndUpdateRubric(
  dimension: string,
  prospectId: string,
  originalScore: number,
  adjustedScore: number,
  feedback: string
): Promise<{ rubricUpdated: boolean; newVersion?: number; changeSummary?: string }> {
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
  const updatedRubric = await generateRubricUpdate(dimension, currentRubric, {
    originalScore,
    adjustedScore,
    feedback,
  });

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
        content: updatedRubric.content as any,
        isActive: true,
        triggeringFeedback: { connect: { id: feedbackRecord.id } },
      },
    });

    // Link feedback to rubric
    await prisma.rubricFeedback.update({
      where: { id: feedbackRecord.id },
      data: { createdRubricId: newRubric.id },
    });

    return {
      rubricUpdated: true,
      newVersion: newRubric.version,
      changeSummary: updatedRubric.reasoning,
    };
  }

  return { rubricUpdated: false };
}
```

**Acceptance Criteria**:
- [ ] RubricContent interface defined
- [ ] INITIAL_RUBRICS covers all 5 dimensions
- [ ] getCurrentRubric returns database rubric or fallback
- [ ] getAllCurrentRubrics returns all dimensions with versions
- [ ] getFeedbackHistory returns recent feedback
- [ ] generateRubricUpdate handles LLM errors gracefully
- [ ] recordFeedbackAndUpdateRubric creates feedback and updates rubric

---

### Task 1.3: Create Rubric Seed Script

**Description**: Create seed script to populate initial rubrics in database
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 1.1, Task 1.2
**Can run parallel with**: None

**Technical Requirements**:

Create `scripts/seed-rubrics.ts`:

```typescript
import prisma from '../lib/prisma';
import { INITIAL_RUBRICS } from '../lib/central-command/rubric';

async function seedRubrics() {
  console.log('Seeding scoring rubrics...');

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
      console.log(`✓ Seeded rubric: ${dimension}`);
    } else {
      console.log(`- Rubric exists: ${dimension} (v${existing.version})`);
    }
  }

  console.log('Done!');
}

seedRubrics()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

Run with: `npx tsx scripts/seed-rubrics.ts`

**Acceptance Criteria**:
- [ ] Script creates rubrics for all 5 dimensions
- [ ] Script is idempotent (doesn't duplicate existing rubrics)
- [ ] Script provides clear console output

---

## Phase 2: API Endpoints

### Task 2.1: Create Rubric Feedback API Endpoint

**Description**: Create POST /api/central-command/rubric/feedback to record feedback and trigger rubric updates
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.2
**Can run parallel with**: Task 2.2

**Technical Requirements**:

Create `app/api/central-command/rubric/feedback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { recordFeedbackAndUpdateRubric } from '@/lib/central-command/rubric';

const feedbackSchema = z.object({
  dimension: z.enum(['strategic', 'value', 'readiness', 'timeline', 'bandwidth']),
  prospectId: z.string().min(1),
  originalScore: z.number().min(1).max(10),
  adjustedScore: z.number().min(1).max(10),
  feedback: z.string().min(1).max(2000),
});

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

  // Parse and validate request body
  const body = await request.json();
  const validation = feedbackSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { dimension, prospectId, originalScore, adjustedScore, feedback } = validation.data;

  try {
    const result = await recordFeedbackAndUpdateRubric(
      dimension,
      prospectId,
      originalScore,
      adjustedScore,
      feedback
    );

    return NextResponse.json(
      {
        success: true,
        rubricUpdated: result.rubricUpdated,
        newRubricVersion: result.newVersion,
        changeSummary: result.changeSummary,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] POST endpoint validates auth
- [ ] Request body validated with Zod
- [ ] Calls recordFeedbackAndUpdateRubric
- [ ] Returns success, rubricUpdated, newRubricVersion, changeSummary
- [ ] Handles errors gracefully

---

### Task 2.2: Create Rubric GET API Endpoint

**Description**: Create GET /api/central-command/rubric to return current rubrics and feedback history
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 1.2
**Can run parallel with**: Task 2.1

**Technical Requirements**:

Create `app/api/central-command/rubric/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { getAllCurrentRubrics, getFeedbackHistory } from '@/lib/central-command/rubric';

export async function GET(request: NextRequest) {
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

  try {
    const [rubrics, feedbackHistory] = await Promise.all([
      getAllCurrentRubrics(),
      getFeedbackHistory(20),
    ]);

    return NextResponse.json(
      { rubrics, feedbackHistory },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] GET endpoint validates auth
- [ ] Returns rubrics object with all 5 dimensions
- [ ] Returns feedbackHistory array with recent feedback
- [ ] Handles errors gracefully

---

## Phase 3: UI Components

### Task 3.1: Create ScoreAssessmentPanel Component

**Description**: Create full-view assessment panel showing all 5 dimensions with rationale, evidence, confidence, and feedback input
**Size**: Large
**Priority**: High
**Dependencies**: Task 2.1
**Can run parallel with**: Task 3.2

**Technical Requirements**:

Create `app/central-command/components/ScoreAssessmentPanel.tsx`:

```typescript
'use client';

import { useState } from 'react';
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
import type { RubricContent } from '@/lib/central-command/rubric';
import { getScoreColor, SCORE_LABELS, SCORE_KEYS, ScoreKey } from '@/lib/central-command/score-display';

interface ScoreAssessmentPanelProps {
  scoreAssessments: Record<string, EnrichmentScoreAssessment>;
  rubrics: Record<string, { version: number; content: RubricContent }>;
  onScoreUpdate: (dimension: string, score: number, feedback: string) => Promise<void>;
}

export default function ScoreAssessmentPanel({
  scoreAssessments,
  rubrics,
  onScoreUpdate,
}: ScoreAssessmentPanelProps) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [newScores, setNewScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState<string | null>(null);

  async function handleSubmitFeedback(dimension: string) {
    const feedback = feedbackInputs[dimension]?.trim();
    const newScore = newScores[dimension];
    if (!feedback || newScore === undefined) return;

    setIsSubmitting(dimension);
    try {
      await onScoreUpdate(dimension, newScore, feedback);
      // Clear inputs on success
      setFeedbackInputs((prev) => ({ ...prev, [dimension]: '' }));
      setNewScores((prev) => {
        const updated = { ...prev };
        delete updated[dimension];
        return updated;
      });
      setExpandedDimension(null);
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <div className="space-y-3">
      {SCORE_KEYS.map((key) => {
        const assessment = scoreAssessments[key];
        const rubric = rubrics[key];
        const isExpanded = expandedDimension === key;
        const label = SCORE_LABELS[key];

        if (!assessment) return null;

        return (
          <div
            key={key}
            className="rounded-lg border transition-all"
            style={{
              background: BG_PRIMARY,
              borderColor: isExpanded ? 'rgba(212, 165, 74, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header - always visible */}
            <button
              onClick={() => setExpandedDimension(isExpanded ? null : key)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <p className="text-xs font-mono uppercase" style={{ color: TEXT_MUTED }}>
                  {label.short}
                </p>
                <p className="text-sm" style={{ color: TEXT_DIM }}>
                  {label.long}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className="text-lg font-mono font-bold"
                  style={{ color: getScoreColor(assessment.score) }}
                >
                  {assessment.score}
                </p>
                <svg
                  className="w-4 h-4 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  style={{
                    color: TEXT_MUTED,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Rationale */}
                <div className="pt-3">
                  <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
                    Rationale
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                    {assessment.rationale}
                  </p>
                </div>

                {/* Evidence */}
                {assessment.evidence && assessment.evidence.length > 0 && (
                  <div>
                    <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
                      Evidence
                    </p>
                    <ul className="space-y-1">
                      {assessment.evidence.map((item, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-2" style={{ color: TEXT_MUTED }}>
                          <span style={{ color: GOLD }}>•</span>
                          <span>"{item}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence bar */}
                <div>
                  <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
                    Confidence: {Math.round(assessment.confidence * 100)}%
                  </p>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${assessment.confidence * 100}%`,
                        background: assessment.confidence > 0.7 ? GREEN : GOLD,
                      }}
                    />
                  </div>
                </div>

                {/* View Rubric Toggle */}
                <div>
                  <button
                    onClick={() => setShowRubric(showRubric === key ? null : key)}
                    className="text-xs font-mono hover:underline"
                    style={{ color: TEXT_DIM }}
                  >
                    {showRubric === key ? 'Hide Rubric' : 'View Rubric'} (v{rubric?.version || 0})
                  </button>

                  {showRubric === key && rubric && (
                    <div className="mt-2 p-3 rounded" style={{ background: BG_ELEVATED }}>
                      <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
                        {rubric.content.description}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <p className="font-mono uppercase mb-1" style={{ color: GREEN }}>
                            High (7-10)
                          </p>
                          <ul className="space-y-0.5">
                            {rubric.content.indicators.high.map((i, idx) => (
                              <li key={idx} style={{ color: TEXT_DIM }}>• {i}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-mono uppercase mb-1" style={{ color: GOLD }}>
                            Medium (4-6)
                          </p>
                          <ul className="space-y-0.5">
                            {rubric.content.indicators.medium.map((i, idx) => (
                              <li key={idx} style={{ color: TEXT_DIM }}>• {i}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-mono uppercase mb-1" style={{ color: '#f87171' }}>
                            Low (1-3)
                          </p>
                          <ul className="space-y-0.5">
                            {rubric.content.indicators.low.map((i, idx) => (
                              <li key={idx} style={{ color: TEXT_DIM }}>• {i}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback input */}
                <div className="pt-2">
                  <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
                    Adjust Score
                  </p>
                  <div className="flex items-start gap-3">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newScores[key] ?? assessment.score}
                      onChange={(e) =>
                        setNewScores((prev) => ({
                          ...prev,
                          [key]: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                        }))
                      }
                      className="w-16 px-2 py-2 rounded text-center font-mono font-bold border focus:outline-none"
                      style={{
                        background: BG_ELEVATED,
                        color: getScoreColor(newScores[key] ?? assessment.score),
                        borderColor: 'rgba(255,255,255,0.15)',
                      }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={feedbackInputs[key] || ''}
                        onChange={(e) =>
                          setFeedbackInputs((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder="Why should this score be different?"
                        className="w-full px-3 py-2 rounded text-sm border focus:outline-none"
                        style={{
                          background: BG_ELEVATED,
                          color: TEXT_PRIMARY,
                          borderColor: 'rgba(255,255,255,0.15)',
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleSubmitFeedback(key)}
                      disabled={
                        !feedbackInputs[key]?.trim() ||
                        newScores[key] === undefined ||
                        newScores[key] === assessment.score ||
                        isSubmitting === key
                      }
                      className="px-4 py-2 rounded text-sm font-medium transition-all disabled:opacity-30"
                      style={{ background: GOLD, color: BG_PRIMARY }}
                    >
                      {isSubmitting === key ? '...' : 'Submit'}
                    </button>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: TEXT_DIM }}>
                    Your feedback may help refine the scoring rubric for future assessments.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**UI Layout per dimension**:
```
┌─────────────────────────────────────────────────────────────────┐
│ STRATEGIC VALUE                                      SCORE: 7  │
├─────────────────────────────────────────────────────────────────┤
│ Rationale:                                                      │
│ "Well-connected VP with strong industry network..."             │
│                                                                 │
│ Evidence:                                                       │
│ • "Previously led BD at Salesforce"                            │
│ • "Mentioned knowing several VP-level contacts"                │
│                                                                 │
│ Confidence: 85% ████████░░                                     │
│                                                                 │
│ View Rubric (v2)                                               │
│                                                                 │
│ Adjust Score:                                                   │
│ [8] [Why should this score be different?___________] [Submit]  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Shows all 5 dimensions in collapsed view with scores
- [ ] Clicking dimension expands to show rationale, evidence, confidence
- [ ] Confidence bar renders correctly
- [ ] View Rubric toggle shows current rubric indicators
- [ ] Score input + feedback text + submit button works
- [ ] Submit calls onScoreUpdate with dimension, newScore, feedback
- [ ] Loading state shown during submission
- [ ] Inputs clear on successful submission

---

### Task 3.2: Integrate ScoreAssessmentPanel into ClientDetailModal

**Description**: Add SCORE ASSESSMENT section to ClientDetailModal using ScoreAssessmentPanel
**Size**: Medium
**Priority**: High
**Dependencies**: Task 3.1, Task 2.1
**Can run parallel with**: None

**Technical Requirements**:

Update `app/central-command/components/ClientDetailModal.tsx`:

1. Add imports:
```typescript
import ScoreAssessmentPanel from './ScoreAssessmentPanel';
import type { RubricContent } from '@/lib/central-command/rubric';
```

2. Add state for rubrics:
```typescript
const [rubrics, setRubrics] = useState<Record<string, { version: number; content: RubricContent }>>({});
```

3. Add useEffect to fetch rubrics:
```typescript
useEffect(() => {
  if (isOpen) {
    fetch('/api/central-command/rubric')
      .then((res) => res.json())
      .then((data) => setRubrics(data.rubrics || {}))
      .catch(console.error);
  }
}, [isOpen]);
```

4. Add handler:
```typescript
async function handleScoreUpdateWithFeedback(
  dimension: string,
  newScore: number,
  feedback: string
) {
  // 1. Update the score on PipelineRecord
  const scoreField = `score${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
  await handleUpdate({ [scoreField]: newScore });

  // 2. Record feedback and potentially update rubric
  const originalScore = enrichmentFindings?.scoreAssessments?.[dimension]?.score || 5;
  await fetch('/api/central-command/rubric/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dimension,
      prospectId: prospect!.id,
      originalScore,
      adjustedScore: newScore,
      feedback,
    }),
  });

  // 3. Refresh rubrics
  const rubricRes = await fetch('/api/central-command/rubric');
  const rubricData = await rubricRes.json();
  setRubrics(rubricData.rubrics || {});
}
```

5. Add Section after CLIENT INTELLIGENCE:
```tsx
{/* Score Assessment Section */}
{enrichmentFindings?.scoreAssessments && (
  <Section title="SCORE ASSESSMENT">
    <ScoreAssessmentPanel
      scoreAssessments={enrichmentFindings.scoreAssessments}
      rubrics={rubrics}
      onScoreUpdate={handleScoreUpdateWithFeedback}
    />
  </Section>
)}
```

**Acceptance Criteria**:
- [ ] ScoreAssessmentPanel renders in ClientDetailModal
- [ ] Rubrics fetched when modal opens
- [ ] Score updates persist to PipelineRecord
- [ ] Feedback recorded via API
- [ ] Rubrics refresh after feedback submission
- [ ] Section only shows when scoreAssessments exist

---

## Phase 4: Testing & Validation

### Task 4.1: Manual Testing

**Description**: Test the complete intelligent scoring flow
**Size**: Medium
**Priority**: High
**Dependencies**: All previous tasks
**Can run parallel with**: None

**Test Scenarios**:

1. **Rationale display**
   - Open prospect with enrichmentFindings.scoreAssessments
   - Expand a dimension
   - Verify rationale, evidence, confidence display correctly

2. **Rubric view**
   - Click "View Rubric" toggle
   - Verify rubric indicators display for high/medium/low
   - Verify version number shows

3. **Feedback submission**
   - Enter new score different from current
   - Enter feedback text
   - Submit
   - Verify score updates in UI
   - Verify feedback recorded in database (check via Prisma Studio)

4. **Rubric update**
   - Submit feedback that reveals a rubric gap (e.g., "His NBA connections make him highly valuable for referrals")
   - Check if rubric version increments
   - Verify new indicator appears in rubric

5. **No-op feedback**
   - Submit prospect-specific feedback that doesn't generalize
   - Verify rubric NOT updated

6. **Error handling**
   - Test with invalid inputs
   - Test with network errors

**Acceptance Criteria**:
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Feedback persists across page refreshes
- [ ] Rubric updates are reflected in UI

---

## Summary

| Phase | Tasks | Priority | Parallel Opportunities |
|-------|-------|----------|----------------------|
| Phase 1: Database & Data | 3 tasks | High | None (sequential) |
| Phase 2: API Endpoints | 2 tasks | High | 2.1 and 2.2 can run parallel |
| Phase 3: UI Components | 2 tasks | High | None (sequential) |
| Phase 4: Testing | 1 task | High | None |

**Total Tasks**: 8
**Critical Path**: 1.1 → 1.2 → 2.1 → 3.1 → 3.2 → 4.1

**Parallel Execution Opportunities**:
- Task 2.1 and 2.2 can run in parallel after Task 1.2
- Task 1.3 can run after 1.2, parallel to Phase 2
