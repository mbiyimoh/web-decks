# Task Breakdown: Validation Responses Dashboard Improvements

**Generated:** 2026-01-11
**Source:** docs/specs/feat-validation-responses-dashboard.md

---

## Overview

Enhance the validation responses viewing experience with:
- Summary dashboard with overall alignment score and confidence messaging
- Dual view modes (by-question and by-session)
- Thoughtful alignment calculations for complex question types
- Statistical confidence thresholds (3→5→12 responses for 90%→95%→99%)

---

## Phase 1: Core Alignment Engine

### Task 1.1: Implement Alignment Calculator Module

**Description**: Create the core alignment calculation engine with type-aware scoring for all question types
**Size**: Large
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 1.2

**Technical Requirements**:
- Calculate meaningful alignment between founder assumptions and validation responses
- Handle 6 question types: this-or-that, slider, ranking, multi-select, fill-blank, scenario
- Return score (0-100), matchType ('exact'|'partial'|'none'), and explanation

**Implementation** (`lib/clarity-canvas/modules/persona-sharpener/alignment-calculator.ts`):

```typescript
import type { Question } from './types';
import { getQuestionById } from './questions';

export interface AlignmentResult {
  score: number;           // 0-100
  matchType: 'exact' | 'partial' | 'none';
  explanation: string;     // Human-readable explanation
}

/**
 * Calculate alignment between founder assumption and validation response
 * Uses question-type-aware comparison logic
 */
export function calculateAlignment(
  questionId: string,
  founderValue: unknown,
  validatorValue: unknown
): AlignmentResult {
  const question = getQuestionById(questionId);
  if (!question) {
    return { score: 0, matchType: 'none', explanation: 'Unknown question' };
  }

  switch (question.type) {
    case 'this-or-that':
      return calculateThisOrThatAlignment(founderValue, validatorValue);

    case 'slider':
      return calculateSliderAlignment(founderValue, validatorValue);

    case 'ranking':
      return calculateRankingAlignment(founderValue, validatorValue);

    case 'multi-select':
      return calculateMultiSelectAlignment(founderValue, validatorValue);

    case 'fill-blank':
      return calculateFillBlankAlignment(founderValue, validatorValue);

    case 'scenario':
      return calculateScenarioAlignment(founderValue, validatorValue);

    default:
      return calculateDefaultAlignment(founderValue, validatorValue);
  }
}

/**
 * This-or-that: Exact match = 100%, different = 0%
 */
function calculateThisOrThatAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  const match = JSON.stringify(founder) === JSON.stringify(validator);
  return {
    score: match ? 100 : 0,
    matchType: match ? 'exact' : 'none',
    explanation: match ? 'Same choice' : 'Different choice',
  };
}

/**
 * Slider: Proximity-based (within 10 points = 100%, linear decay)
 */
function calculateSliderAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  const f = typeof founder === 'number' ? founder : 50;
  const v = typeof validator === 'number' ? validator : 50;
  const diff = Math.abs(f - v);

  if (diff <= 10) {
    return { score: 100, matchType: 'exact', explanation: 'Very close values' };
  }
  if (diff <= 25) {
    const score = Math.round(100 - (diff - 10) * 2);
    return { score, matchType: 'partial', explanation: 'Similar values' };
  }
  if (diff <= 50) {
    const score = Math.round(70 - (diff - 25));
    return { score, matchType: 'partial', explanation: 'Somewhat different' };
  }
  return { score: Math.max(0, 45 - (diff - 50)), matchType: 'none', explanation: 'Very different values' };
}

/**
 * Ranking: Weighted position comparison
 * Top 3 positions matter most, lower positions matter less
 */
function calculateRankingAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  if (!Array.isArray(founder) || !Array.isArray(validator)) {
    return { score: 0, matchType: 'none', explanation: 'Invalid ranking data' };
  }

  // Weight positions: 1st=30pts, 2nd=25pts, 3rd=20pts, 4th=15pts, 5th=7pts, 6th=3pts
  const positionWeights = [30, 25, 20, 15, 7, 3];
  let earnedPoints = 0;
  let maxPoints = 0;

  founder.forEach((item, founderPos) => {
    const itemId = typeof item === 'object' && item !== null ? (item as { id?: string }).id : item;
    const validatorPos = validator.findIndex((v) => {
      const vId = typeof v === 'object' && v !== null ? (v as { id?: string }).id : v;
      return vId === itemId;
    });

    if (validatorPos !== -1) {
      const founderWeight = positionWeights[founderPos] || 1;
      maxPoints += founderWeight;

      // Points based on how close the positions are
      const positionDiff = Math.abs(founderPos - validatorPos);
      if (positionDiff === 0) {
        earnedPoints += founderWeight; // Exact position match
      } else if (positionDiff === 1) {
        earnedPoints += founderWeight * 0.7; // Off by one
      } else if (positionDiff === 2) {
        earnedPoints += founderWeight * 0.4; // Off by two
      }
      // 3+ positions off = no points
    } else {
      maxPoints += positionWeights[founderPos] || 1;
    }
  });

  const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;

  if (score >= 80) {
    return { score, matchType: 'exact', explanation: 'Priorities align closely' };
  }
  if (score >= 50) {
    return { score, matchType: 'partial', explanation: 'Some priority overlap' };
  }
  return { score, matchType: 'none', explanation: 'Different priorities' };
}

/**
 * Multi-select: Jaccard similarity (intersection / union)
 */
function calculateMultiSelectAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  if (!Array.isArray(founder) || !Array.isArray(validator)) {
    return { score: 0, matchType: 'none', explanation: 'Invalid selection data' };
  }

  const founderSet = new Set(founder);
  const validatorSet = new Set(validator);

  const intersection = [...founderSet].filter(x => validatorSet.has(x));
  const union = new Set([...founderSet, ...validatorSet]);

  const score = union.size > 0 ? Math.round((intersection.length / union.size) * 100) : 0;

  if (score >= 70) {
    return { score, matchType: 'exact', explanation: `${intersection.length} shared selections` };
  }
  if (score >= 40) {
    return { score, matchType: 'partial', explanation: `${intersection.length} overlap` };
  }
  return { score, matchType: 'none', explanation: 'Little overlap in selections' };
}

/**
 * Fill-blank: Semantic similarity check (simplified)
 * Check if key terms overlap
 */
function calculateFillBlankAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  if (typeof founder !== 'object' || typeof validator !== 'object') {
    return { score: 0, matchType: 'none', explanation: 'Invalid fill-blank data' };
  }

  const founderObj = founder as Record<string, string>;
  const validatorObj = validator as Record<string, string>;

  const founderBlanks = Object.keys(founderObj);
  let matchingBlanks = 0;
  let partialBlanks = 0;

  founderBlanks.forEach(key => {
    const fVal = (founderObj[key] || '').toLowerCase().trim();
    const vVal = (validatorObj[key] || '').toLowerCase().trim();

    if (fVal === vVal) {
      matchingBlanks++;
    } else if (fVal && vVal) {
      // Check for word overlap
      const fWords = new Set(fVal.split(/\s+/));
      const vWords = new Set(vVal.split(/\s+/));
      const overlap = [...fWords].filter(w => vWords.has(w) && w.length > 3);
      if (overlap.length > 0) {
        partialBlanks++;
      }
    }
  });

  const score = founderBlanks.length > 0
    ? Math.round(((matchingBlanks + partialBlanks * 0.5) / founderBlanks.length) * 100)
    : 0;

  if (score >= 70) {
    return { score, matchType: 'exact', explanation: 'Similar responses' };
  }
  if (score >= 40) {
    return { score, matchType: 'partial', explanation: 'Some similarity' };
  }
  return { score, matchType: 'none', explanation: 'Different responses' };
}

/**
 * Scenario (free text): Simple overlap check
 * We can't do true semantic analysis without AI, so check for keyword overlap
 */
function calculateScenarioAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  const fText = String(founder || '').toLowerCase();
  const vText = String(validator || '').toLowerCase();

  if (!fText || !vText) {
    return { score: 50, matchType: 'partial', explanation: 'Open-ended response' };
  }

  // Extract significant words (4+ chars, not common stopwords)
  const stopwords = new Set(['that', 'this', 'with', 'have', 'from', 'they', 'their', 'would', 'could', 'about', 'which', 'when', 'what', 'will', 'been', 'more', 'some', 'just', 'like', 'very', 'also', 'than']);
  const extractWords = (text: string) =>
    text.split(/\W+/)
      .filter(w => w.length >= 4 && !stopwords.has(w));

  const fWords = new Set(extractWords(fText));
  const vWords = new Set(extractWords(vText));

  const overlap = [...fWords].filter(w => vWords.has(w));
  const minSize = Math.min(fWords.size, vWords.size);

  if (minSize === 0) {
    return { score: 50, matchType: 'partial', explanation: 'Open-ended (no comparison)' };
  }

  const score = Math.min(100, Math.round((overlap.length / minSize) * 100));

  // Scenario questions are inherently subjective, so we're more lenient
  return {
    score: Math.max(40, score), // Floor at 40 for subjective responses
    matchType: score >= 60 ? 'partial' : 'none',
    explanation: score >= 60 ? 'Theme overlap detected' : 'Unique perspective',
  };
}

/**
 * Default: JSON stringify comparison
 */
function calculateDefaultAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  const match = JSON.stringify(founder) === JSON.stringify(validator);
  return {
    score: match ? 100 : 0,
    matchType: match ? 'exact' : 'none',
    explanation: match ? 'Exact match' : 'Different values',
  };
}

/**
 * Calculate aggregate alignment for a question across all validation responses
 */
export function calculateQuestionAlignment(
  questionId: string,
  founderValue: unknown,
  validatorValues: unknown[]
): { averageScore: number; matchCount: number; total: number } {
  if (validatorValues.length === 0) {
    return { averageScore: 0, matchCount: 0, total: 0 };
  }

  let totalScore = 0;
  let matchCount = 0;

  validatorValues.forEach(value => {
    const result = calculateAlignment(questionId, founderValue, value);
    totalScore += result.score;
    if (result.score >= 70) matchCount++;
  });

  return {
    averageScore: Math.round(totalScore / validatorValues.length),
    matchCount,
    total: validatorValues.length,
  };
}

/**
 * Calculate overall alignment score across all questions
 */
export function calculateOverallAlignment(
  questionAlignments: Array<{ questionId: string; averageScore: number; responseCount: number }>
): number {
  const questionsWithResponses = questionAlignments.filter(q => q.responseCount > 0);
  if (questionsWithResponses.length === 0) return 0;

  // Weight by response count (more responses = more confident)
  let weightedSum = 0;
  let totalWeight = 0;

  questionsWithResponses.forEach(q => {
    const weight = Math.min(q.responseCount, 5); // Cap weight at 5 responses
    weightedSum += q.averageScore * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}
```

**Acceptance Criteria**:
- [ ] this-or-that: 100% for exact match, 0% for different
- [ ] slider: 100% within 10 points, linear decay to 0% at 100 point difference
- [ ] ranking: Weighted by position (1st=30pts, 2nd=25pts, etc.), partial credit for close positions
- [ ] multi-select: Jaccard similarity (intersection/union)
- [ ] fill-blank: Word overlap scoring with partial credit
- [ ] scenario: Keyword overlap with 40% floor for subjectivity
- [ ] calculateQuestionAlignment aggregates scores correctly
- [ ] calculateOverallAlignment weights by response count

---

### Task 1.2: Implement Confidence Thresholds Module

**Description**: Create the statistical confidence threshold system with progressive messaging
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 1.1

**Implementation** (`lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds.ts`):

```typescript
export interface ConfidenceLevel {
  minResponses: number;
  confidencePercent: number;
  label: string;
  message: string;
  nextLevel: { responses: number; confidence: number } | null;
}

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  {
    minResponses: 0,
    confidencePercent: 0,
    label: 'No Data',
    message: 'Share your validation link to start collecting responses.',
    nextLevel: { responses: 3, confidence: 90 },
  },
  {
    minResponses: 1,
    confidencePercent: 50,
    label: 'Early Signal',
    message: 'You have initial feedback, but need more responses for reliable insights.',
    nextLevel: { responses: 3, confidence: 90 },
  },
  {
    minResponses: 3,
    confidencePercent: 90,
    label: 'Statistically Meaningful',
    message: 'You have enough responses for basic statistical significance (90% confidence).',
    nextLevel: { responses: 5, confidence: 95 },
  },
  {
    minResponses: 5,
    confidencePercent: 95,
    label: 'High Confidence',
    message: 'Strong sample size for reliable insights (95% confidence).',
    nextLevel: { responses: 12, confidence: 99 },
  },
  {
    minResponses: 12,
    confidencePercent: 99,
    label: 'Very High Confidence',
    message: 'Excellent sample size for highly reliable insights (99% confidence).',
    nextLevel: null,
  },
];

export function getConfidenceLevel(responseCount: number): ConfidenceLevel {
  // Find the highest level we meet
  for (let i = CONFIDENCE_LEVELS.length - 1; i >= 0; i--) {
    if (responseCount >= CONFIDENCE_LEVELS[i].minResponses) {
      return CONFIDENCE_LEVELS[i];
    }
  }
  return CONFIDENCE_LEVELS[0];
}

export function getConfidenceColor(confidencePercent: number): string {
  if (confidencePercent >= 95) return '#4ADE80'; // Green
  if (confidencePercent >= 90) return '#D4A84B'; // Gold
  return '#FB923C'; // Orange
}
```

**Acceptance Criteria**:
- [ ] 0 responses → "No Data" (0% confidence)
- [ ] 1-2 responses → "Early Signal" (50% confidence)
- [ ] 3-4 responses → "Statistically Meaningful" (90% confidence)
- [ ] 5-11 responses → "High Confidence" (95% confidence)
- [ ] 12+ responses → "Very High Confidence" (99% confidence)
- [ ] Each level shows next threshold correctly
- [ ] Colors: green (95%+), gold (90%), orange (<90%)

---

## Phase 2: API Enhancement

### Task 2.1: Extend Validation Responses API with Summary Data

**Description**: Add computed summary statistics to the validation-responses API endpoint
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1, Task 1.2

**Technical Requirements**:
- Compute and return ValidationSummary object
- Calculate per-question alignment scores using alignment calculator
- Determine overall alignment score
- Identify top misalignments (lowest scoring questions)
- Include confidence level based on response count

**Implementation** (update `app/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/validation-responses/route.ts`):

```typescript
import { calculateAlignment, calculateQuestionAlignment, calculateOverallAlignment } from '@/lib/clarity-canvas/modules/persona-sharpener/alignment-calculator';
import { getConfidenceLevel, type ConfidenceLevel } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';
import { getQuestionById } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';

interface ValidationSummary {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  abandonedSessions: number;
  totalResponses: number;
  questionsWithResponses: number;
  totalQuestions: number;
  overallAlignmentScore: number | null;
  confidenceLevel: ConfidenceLevel;
  topMisalignments: Array<{
    questionId: string;
    questionText: string;
    category: string;
    alignmentScore: number;
    responseCount: number;
  }>;
  questionAlignments: Array<{
    questionId: string;
    alignmentScore: number;
    responseCount: number;
  }>;
}

// In the GET handler, compute summary:
function computeValidationSummary(
  sessions: ValidationSession[],
  founderResponses: Response[],
  validationResponses: Response[],
  totalQuestions: number
): ValidationSummary {
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const inProgressSessions = sessions.filter(s => s.status === 'in_progress').length;
  const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;

  // Group validation responses by questionId
  const responsesByQuestion = new Map<string, unknown[]>();
  validationResponses.forEach(r => {
    const existing = responsesByQuestion.get(r.questionId) || [];
    existing.push(r.value);
    responsesByQuestion.set(r.questionId, existing);
  });

  // Build founder response map
  const founderByQuestion = new Map<string, unknown>();
  founderResponses.forEach(r => {
    founderByQuestion.set(r.questionId, r.value);
  });

  // Calculate per-question alignments
  const questionAlignments: Array<{
    questionId: string;
    alignmentScore: number;
    responseCount: number;
  }> = [];

  responsesByQuestion.forEach((validatorValues, questionId) => {
    const founderValue = founderByQuestion.get(questionId);
    if (founderValue !== undefined) {
      const alignment = calculateQuestionAlignment(questionId, founderValue, validatorValues);
      questionAlignments.push({
        questionId,
        alignmentScore: alignment.averageScore,
        responseCount: alignment.total,
      });
    }
  });

  // Calculate overall alignment
  const overallAlignmentScore = questionAlignments.length > 0
    ? calculateOverallAlignment(questionAlignments)
    : null;

  // Find top misalignments (lowest scoring questions with responses)
  const topMisalignments = questionAlignments
    .filter(q => q.responseCount >= 2)
    .sort((a, b) => a.alignmentScore - b.alignmentScore)
    .slice(0, 3)
    .map(q => {
      const question = getQuestionById(q.questionId);
      return {
        questionId: q.questionId,
        questionText: question?.question || q.questionId,
        category: question?.category || 'unknown',
        alignmentScore: q.alignmentScore,
        responseCount: q.responseCount,
      };
    });

  // Get confidence level
  const confidenceLevel = getConfidenceLevel(sessions.length);

  return {
    totalSessions: sessions.length,
    completedSessions,
    inProgressSessions,
    abandonedSessions,
    totalResponses: validationResponses.length,
    questionsWithResponses: responsesByQuestion.size,
    totalQuestions,
    overallAlignmentScore,
    confidenceLevel,
    topMisalignments,
    questionAlignments,
  };
}
```

**Acceptance Criteria**:
- [ ] API returns `summary` object with all ValidationSummary fields
- [ ] Session counts are accurate (total, completed, in-progress, abandoned)
- [ ] Question alignments use alignment calculator correctly
- [ ] Overall alignment is weighted by response count
- [ ] Top 3 misalignments are identified (lowest scoring with ≥2 responses)
- [ ] Confidence level matches response count

---

## Phase 3: UI Components

### Task 3.1: Create ValidationSummaryHeader Component

**Description**: Build the stats grid header showing sessions, responses, alignment, and questions validated
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1

**Implementation** (`app/clarity-canvas/modules/persona-sharpener/components/ValidationSummaryHeader.tsx`):

```typescript
'use client';

import { motion } from 'framer-motion';
import type { ValidationSummary } from '../types';

interface Props {
  summary: ValidationSummary;
  personaName: string;
}

export function ValidationSummaryHeader({ summary, personaName }: Props) {
  const getAlignmentColor = (score: number | null) => {
    if (score === null) return '#888888';
    if (score >= 70) return '#4ADE80';
    if (score >= 40) return '#D4A84B';
    return '#f87171';
  };

  const getAlignmentLabel = (score: number | null) => {
    if (score === null) return 'No Data';
    if (score >= 70) return 'Strong Match';
    if (score >= 40) return 'Partial Match';
    return 'Weak Match';
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-white">
        Validation Results for "{personaName}"
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Sessions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-display text-white">{summary.totalSessions}</p>
          <p className="text-xs text-zinc-500 mt-1">Sessions</p>
          {summary.inProgressSessions > 0 && (
            <p className="text-xs text-amber-500 mt-1">
              {summary.inProgressSessions} in progress
            </p>
          )}
        </div>

        {/* Responses */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-display text-white">{summary.totalResponses}</p>
          <p className="text-xs text-zinc-500 mt-1">Responses</p>
        </div>

        {/* Alignment */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p
            className="text-3xl font-display"
            style={{ color: getAlignmentColor(summary.overallAlignmentScore) }}
          >
            {summary.overallAlignmentScore !== null
              ? `${summary.overallAlignmentScore}%`
              : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Alignment</p>
          <p
            className="text-xs mt-1"
            style={{ color: getAlignmentColor(summary.overallAlignmentScore) }}
          >
            {getAlignmentLabel(summary.overallAlignmentScore)}
          </p>
        </div>

        {/* Questions Validated */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-display text-white">
            {summary.questionsWithResponses}/{summary.totalQuestions}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Questions Validated</p>
        </div>
      </motion.div>

      {/* Top Misalignments */}
      {summary.topMisalignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-sm font-medium text-red-400">Needs Attention</h3>
          </div>
          <ul className="space-y-2">
            {summary.topMisalignments.map(m => (
              <li key={m.questionId} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{m.questionText}</span>
                <span className="text-red-400">
                  {m.alignmentScore}% ({m.responseCount} responses)
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows 4-column grid: Sessions, Responses, Alignment, Questions Validated
- [ ] Alignment score is color-coded (green/gold/red)
- [ ] Shows in-progress session count if > 0
- [ ] Displays top misalignments section when misalignments exist
- [ ] Responsive (2 columns on mobile, 4 on desktop)
- [ ] Framer Motion animations on mount

---

### Task 3.2: Create ConfidenceCallout Component

**Description**: Build the statistical confidence messaging component with progress to next level
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.2

**Implementation** (`app/clarity-canvas/modules/persona-sharpener/components/ConfidenceCallout.tsx`):

```typescript
'use client';

import { motion } from 'framer-motion';
import type { ConfidenceLevel } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';
import { getConfidenceColor } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';

interface Props {
  level: ConfidenceLevel;
  currentResponses: number;
}

export function ConfidenceCallout({ level, currentResponses }: Props) {
  const color = getConfidenceColor(level.confidencePercent);
  const progressToNext = level.nextLevel
    ? Math.min(100, (currentResponses / level.nextLevel.responses) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        {/* Confidence badge */}
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          {level.confidencePercent}% Confidence
        </div>

        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">{level.label}</h4>
          <p className="text-zinc-400 text-sm mt-1">{level.message}</p>

          {/* Progress to next level */}
          {level.nextLevel && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-500">
                  {currentResponses}/{level.nextLevel.responses} responses
                </span>
                <span className="text-zinc-400">
                  → {level.nextLevel.confidence}% confidence
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows confidence percentage badge with color
- [ ] Displays confidence level label and message
- [ ] Shows progress bar to next level when applicable
- [ ] Progress bar animates on mount
- [ ] No progress bar shown at max confidence (99%)

---

### Task 3.3: Create ValidationViewToggle Component

**Description**: Build the tab toggle for switching between by-question and by-session views
**Size**: Small
**Priority**: High
**Dependencies**: None

**Implementation** (`app/clarity-canvas/modules/persona-sharpener/components/ValidationViewToggle.tsx`):

```typescript
'use client';

import { motion } from 'framer-motion';

interface Props {
  activeView: 'by-question' | 'by-session';
  onViewChange: (view: 'by-question' | 'by-session') => void;
}

export function ValidationViewToggle({ activeView, onViewChange }: Props) {
  return (
    <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-lg p-1 w-fit">
      <button
        onClick={() => onViewChange('by-question')}
        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeView === 'by-question'
            ? 'text-white'
            : 'text-zinc-400 hover:text-zinc-300'
        }`}
        role="tab"
        aria-selected={activeView === 'by-question'}
      >
        {activeView === 'by-question' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-zinc-800 rounded-md"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          By Question
        </span>
      </button>

      <button
        onClick={() => onViewChange('by-session')}
        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeView === 'by-session'
            ? 'text-white'
            : 'text-zinc-400 hover:text-zinc-300'
        }`}
        role="tab"
        aria-selected={activeView === 'by-session'}
      >
        {activeView === 'by-session' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-zinc-800 rounded-md"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          By Session
        </span>
      </button>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Two tabs: "By Question" (default) and "By Session"
- [ ] Active tab has animated background indicator
- [ ] Icons for each view mode
- [ ] Accessible with role="tab" and aria-selected
- [ ] Smooth animation when switching tabs

---

### Task 3.4: Create ValidationSessionList Component

**Description**: Build the session list showing individual respondent cards
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1

**Implementation** (`app/clarity-canvas/modules/persona-sharpener/components/ValidationSessionList.tsx`):

```typescript
'use client';

import { motion } from 'framer-motion';
import type { ValidationSessionSummary } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  sessions: ValidationSessionSummary[];
  onSelectSession: (sessionId: string) => void;
  selectedSessionId: string | null;
}

export function ValidationSessionList({ sessions, onSelectSession, selectedSessionId }: Props) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: '#4ADE80', label: 'Completed' };
      case 'in_progress':
        return { color: '#D4A84B', label: 'In Progress' };
      case 'abandoned':
        return { color: '#f87171', label: 'Abandoned' };
      default:
        return { color: '#888888', label: status };
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-white font-medium mb-1">No Validation Sessions Yet</h3>
        <p className="text-zinc-400 text-sm">Share your validation link to start collecting responses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const statusBadge = getStatusBadge(session.status);
        const respondentName = session.respondentName || `Anonymous Respondent ${index + 1}`;
        const isSelected = session.id === selectedSessionId;

        return (
          <motion.button
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left bg-zinc-900/50 border rounded-xl p-4 transition-colors ${
              isSelected
                ? 'border-[#D4A84B] bg-[#D4A84B]/5'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-sm text-zinc-400">
                    {respondentName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{respondentName}</p>
                  <p className="text-zinc-500 text-xs">{formatDate(session.createdAt)}</p>
                </div>
              </div>

              <div
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: `${statusBadge.color}20`,
                  color: statusBadge.color,
                }}
              >
                {statusBadge.label}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>{session.questionsAnswered} questions answered</span>
              {session.questionsSkipped > 0 && (
                <span className="text-amber-500">{session.questionsSkipped} skipped</span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Lists all sessions with respondent name or "Anonymous Respondent N"
- [ ] Shows relative date ("2 hours ago", "Yesterday", etc.)
- [ ] Status badges: green (completed), gold (in-progress), red (abandoned)
- [ ] Shows questions answered and skipped counts
- [ ] Selected session has gold border highlight
- [ ] Empty state when no sessions
- [ ] Staggered animation on mount

---

### Task 3.5: Create ValidationSessionDetail Component

**Description**: Build the expanded view showing a single respondent's full response set with comparison
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1, Task 3.4

**Implementation** (`app/clarity-canvas/modules/persona-sharpener/components/ValidationSessionDetail.tsx`):

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ValidationSessionSummary } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';
import { calculateAlignment } from '@/lib/clarity-canvas/modules/persona-sharpener/alignment-calculator';
import { formatResponseValue } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

interface SessionResponse {
  questionId: string;
  questionText: string;
  founderValue: unknown;
  validatorValue: unknown;
}

interface Props {
  session: ValidationSessionSummary;
  responses: SessionResponse[];
  onClose: () => void;
}

export function ValidationSessionDetail({ session, responses, onClose }: Props) {
  const respondentName = session.respondentName || 'Anonymous Respondent';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-zinc-900/95 border border-zinc-800 rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-display text-white">{respondentName}</h3>
            <p className="text-sm text-zinc-400">
              {responses.length} responses • {session.status}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Responses */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {responses.map((response, index) => {
            const alignment = calculateAlignment(
              response.questionId,
              response.founderValue,
              response.validatorValue
            );

            return (
              <motion.div
                key={response.questionId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-zinc-800/50 rounded-lg p-4"
              >
                <p className="text-sm text-zinc-300 mb-3">{response.questionText}</p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Founder assumption */}
                  <div>
                    <p className="text-xs text-[#D4A84B] mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#D4A84B]" />
                      Your Assumption
                    </p>
                    <p className="text-sm text-zinc-200">
                      {formatResponseValue(response.founderValue)}
                    </p>
                  </div>

                  {/* Validator answer */}
                  <div>
                    <p className="text-xs text-[#4ADE80] mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                      Their Response
                    </p>
                    <p className="text-sm text-zinc-200">
                      {formatResponseValue(response.validatorValue)}
                    </p>
                  </div>
                </div>

                {/* Alignment indicator */}
                <div className="mt-3 pt-3 border-t border-zinc-700 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{alignment.explanation}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        alignment.matchType === 'exact'
                          ? '#4ADE8020'
                          : alignment.matchType === 'partial'
                          ? '#D4A84B20'
                          : '#f8717120',
                      color:
                        alignment.matchType === 'exact'
                          ? '#4ADE80'
                          : alignment.matchType === 'partial'
                          ? '#D4A84B'
                          : '#f87171',
                    }}
                  >
                    {alignment.score}% match
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows respondent name and response count in header
- [ ] Close button to exit detail view
- [ ] Each response shows question text
- [ ] Side-by-side: founder assumption (gold) vs validator answer (green)
- [ ] Uses formatResponseValue for display
- [ ] Shows alignment score and explanation for each response
- [ ] Color-coded match indicator (green/gold/red)
- [ ] Scrollable if many responses

---

### Task 3.6: Create AlignmentBadge Component

**Description**: Build the reusable alignment indicator badge for question cards
**Size**: Small
**Priority**: Medium
**Dependencies**: None

**Implementation** (`app/clarity-canvas/modules/persona-sharpener/components/AlignmentBadge.tsx`):

```typescript
'use client';

interface Props {
  score: number | null;
  responseCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AlignmentBadge({ score, responseCount, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // No data state
  if (responseCount === 0 || score === null) {
    return (
      <span className={`inline-flex items-center gap-1 rounded bg-zinc-800 text-zinc-500 ${sizeClasses[size]}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Awaiting data
      </span>
    );
  }

  // Score-based styling
  const getStyle = () => {
    if (score >= 70) {
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        label: 'Strong match',
      };
    }
    if (score >= 40) {
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
        ),
        label: 'Partial match',
      };
    }
    return {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      label: 'Weak match',
    };
  };

  const style = getStyle();

  return (
    <span className={`inline-flex items-center gap-1 rounded ${style.bg} ${style.text} ${sizeClasses[size]}`}>
      {style.icon}
      {style.label}
    </span>
  );
}
```

**Acceptance Criteria**:
- [ ] Green checkmark + "Strong match" for 70%+
- [ ] Yellow warning + "Partial match" for 40-70%
- [ ] Red alert + "Weak match" for <40%
- [ ] Gray clock + "Awaiting data" for 0 responses
- [ ] Three size options (sm, md, lg)

---

## Phase 4: Page Integration

### Task 4.1: Update ValidationResponsesPageClient with Dashboard Layout

**Description**: Refactor the main page to use new components and support dual view modes
**Size**: Large
**Priority**: High
**Dependencies**: Task 3.1, Task 3.2, Task 3.3, Task 3.4, Task 3.5

**Technical Requirements**:
- Add summary data fetching from enhanced API
- Implement view mode state management
- Integrate all new components
- Handle session selection for drill-down
- Maintain existing by-question view

**Implementation** (update `ValidationResponsesPageClient.tsx`):

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ValidationSummaryHeader } from './ValidationSummaryHeader';
import { ConfidenceCallout } from './ConfidenceCallout';
import { ValidationViewToggle } from './ValidationViewToggle';
import { ValidationByQuestionView } from './ValidationByQuestionView';
import { ValidationSessionList } from './ValidationSessionList';
import { ValidationSessionDetail } from './ValidationSessionDetail';
import type { ValidationSummary, ValidationSessionSummary } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  personaId: string;
}

export function ValidationResponsesPageClient({ personaId }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'by-question' | 'by-session'>('by-question');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Data from API
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [personaName, setPersonaName] = useState('');
  const [responsesByQuestion, setResponsesByQuestion] = useState<any[]>([]);
  const [sessions, setSessions] = useState<ValidationSessionSummary[]>([]);
  const [sessionResponses, setSessionResponses] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-responses`
        );

        if (!response.ok) throw new Error('Failed to fetch validation data');

        const data = await response.json();
        setSummary(data.summary);
        setPersonaName(data.personaName);
        setResponsesByQuestion(data.responsesByQuestion || []);
        setSessions(data.sessions || []);

        // Build session responses map for drill-down
        const responseMap = new Map<string, any[]>();
        (data.responsesBySession || []).forEach((sessionData: any) => {
          responseMap.set(sessionData.session.id, sessionData.responses);
        });
        setSessionResponses(responseMap);
      } catch (err) {
        console.error('Error fetching validation data:', err);
        setError('Failed to load validation responses.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [personaId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error || 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[#D4A84B] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const selectedSessionResponseList = selectedSessionId
    ? sessionResponses.get(selectedSessionId) || []
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <a
          href={`/clarity-canvas/modules/persona-sharpener/personas/${personaId}`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Persona
        </a>

        {/* Summary Header */}
        <ValidationSummaryHeader summary={summary} personaName={personaName} />

        {/* Confidence Callout */}
        <ConfidenceCallout
          level={summary.confidenceLevel}
          currentResponses={summary.totalSessions}
        />

        {/* View Toggle */}
        <ValidationViewToggle
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* Content based on view */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'by-question' ? (
            <ValidationByQuestionView
              responses={responsesByQuestion}
              questionAlignments={summary.questionAlignments}
            />
          ) : (
            <div className="space-y-4">
              <ValidationSessionList
                sessions={sessions}
                onSelectSession={setSelectedSessionId}
                selectedSessionId={selectedSessionId}
              />

              {selectedSession && (
                <ValidationSessionDetail
                  session={selectedSession}
                  responses={selectedSessionResponseList}
                  onClose={() => setSelectedSessionId(null)}
                />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Fetches data from enhanced API with summary
- [ ] Displays ValidationSummaryHeader at top
- [ ] Shows ConfidenceCallout below summary
- [ ] View toggle switches between by-question and by-session
- [ ] By-question view uses existing ValidationByQuestionView
- [ ] By-session view shows session list with drill-down
- [ ] Session selection shows detail panel
- [ ] Loading and error states handled
- [ ] Back button returns to persona page

---

## Phase 5: Testing & Documentation

### Task 5.1: Unit Tests for Alignment Calculator

**Description**: Write comprehensive unit tests for all alignment calculation functions
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1

**Acceptance Criteria**:
- [ ] this-or-that: exact match and different choice tests
- [ ] slider: boundary tests (10pt, 25pt, 50pt differences)
- [ ] ranking: position match, off-by-one, reversed priorities
- [ ] multi-select: Jaccard similarity edge cases
- [ ] fill-blank: word overlap tests
- [ ] scenario: stopword filtering, empty text handling
- [ ] calculateQuestionAlignment: aggregation tests
- [ ] calculateOverallAlignment: weighting tests

---

### Task 5.2: Unit Tests for Confidence Thresholds

**Description**: Write unit tests for confidence level determination
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.2

**Acceptance Criteria**:
- [ ] Tests for each threshold: 0, 1-2, 3-4, 5-11, 12+
- [ ] Next level calculation tests
- [ ] Color mapping tests

---

### Task 5.3: Integration Test for Validation Responses API

**Description**: Write integration tests for the enhanced API endpoint
**Size**: Medium
**Priority**: Medium
**Dependencies**: Task 2.1

**Acceptance Criteria**:
- [ ] Summary data returned correctly
- [ ] Alignment calculations match expected values
- [ ] Session data returned in by-session mode
- [ ] Authorization checks work

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Core Engine | 2 | High |
| Phase 2: API Enhancement | 1 | High |
| Phase 3: UI Components | 6 | High/Medium |
| Phase 4: Page Integration | 1 | High |
| Phase 5: Testing | 3 | High/Medium |

**Total Tasks**: 13
**Critical Path**: 1.1 → 2.1 → 3.1 → 4.1

**Parallel Opportunities**:
- Task 1.1 and 1.2 can run in parallel
- Tasks 3.2, 3.3, 3.6 can run in parallel (no dependencies)
- Testing tasks can run after their respective implementation tasks
