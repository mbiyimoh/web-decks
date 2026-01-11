// lib/clarity-canvas/modules/persona-sharpener/alignment-calculator.ts

import type { Question } from './types';
import { getQuestionById } from './questions';

export interface AlignmentResult {
  score: number; // 0-100
  matchType: 'exact' | 'partial' | 'none';
  explanation: string;
}

export function calculateAlignment(
  questionId: string,
  founderValue: unknown,
  validatorValue: unknown
): AlignmentResult {
  const question = getQuestionById(questionId);
  if (!question) {
    return {
      score: 0,
      matchType: 'none',
      explanation: 'Unknown question',
    };
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

// this-or-that: Exact match = 100%, different = 0%
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

// slider: Proximity-based (within 10 points = 100%, linear decay)
function calculateSliderAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  const f = typeof founder === 'number' ? founder : 50;
  const v = typeof validator === 'number' ? validator : 50;
  const diff = Math.abs(f - v);

  if (diff <= 10)
    return { score: 100, matchType: 'exact', explanation: 'Very close values' };
  if (diff <= 25) {
    const score = Math.round(100 - (diff - 10) * 2);
    return { score, matchType: 'partial', explanation: 'Similar values' };
  }
  if (diff <= 50) {
    const score = Math.round(70 - (diff - 25));
    return { score, matchType: 'partial', explanation: 'Somewhat different' };
  }
  return {
    score: Math.max(0, 45 - (diff - 50)),
    matchType: 'none',
    explanation: 'Very different values',
  };
}

// ranking: Weighted position comparison (1st=30pts, 2nd=25pts, 3rd=20pts, 4th=15pts, 5th=7pts, 6th=3pts)
function calculateRankingAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  if (!Array.isArray(founder) || !Array.isArray(validator)) {
    return {
      score: 0,
      matchType: 'none',
      explanation: 'Invalid ranking data',
    };
  }

  const positionWeights = [30, 25, 20, 15, 7, 3];
  let earnedPoints = 0,
    maxPoints = 0;

  founder.forEach((item, founderPos) => {
    const itemId =
      typeof item === 'object' && item !== null
        ? (item as { id?: string }).id
        : item;
    const validatorPos = validator.findIndex((v) => {
      const vId =
        typeof v === 'object' && v !== null ? (v as { id?: string }).id : v;
      return vId === itemId;
    });

    const founderWeight = positionWeights[founderPos] || 1;
    maxPoints += founderWeight;

    if (validatorPos !== -1) {
      const positionDiff = Math.abs(founderPos - validatorPos);
      if (positionDiff === 0) earnedPoints += founderWeight;
      else if (positionDiff === 1) earnedPoints += founderWeight * 0.7;
      else if (positionDiff === 2) earnedPoints += founderWeight * 0.4;
    }
  });

  const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
  if (score >= 80)
    return {
      score,
      matchType: 'exact',
      explanation: 'Priorities align closely',
    };
  if (score >= 50)
    return { score, matchType: 'partial', explanation: 'Some priority overlap' };
  return { score, matchType: 'none', explanation: 'Different priorities' };
}

// multi-select: Jaccard similarity (intersection / union)
function calculateMultiSelectAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  if (!Array.isArray(founder) || !Array.isArray(validator)) {
    return {
      score: 0,
      matchType: 'none',
      explanation: 'Invalid selection data',
    };
  }

  const founderSet = new Set(founder);
  const validatorSet = new Set(validator);
  const intersection = Array.from(founderSet).filter((x) => validatorSet.has(x));
  const union = new Set([...Array.from(founderSet), ...Array.from(validatorSet)]);

  const score =
    union.size > 0 ? Math.round((intersection.length / union.size) * 100) : 0;
  if (score >= 70)
    return {
      score,
      matchType: 'exact',
      explanation: intersection.length + ' shared selections',
    };
  if (score >= 40)
    return {
      score,
      matchType: 'partial',
      explanation: intersection.length + ' overlap',
    };
  return { score, matchType: 'none', explanation: 'Little overlap in selections' };
}

// fill-blank: Word overlap scoring
function calculateFillBlankAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  if (typeof founder !== 'object' || typeof validator !== 'object') {
    return {
      score: 0,
      matchType: 'none',
      explanation: 'Invalid fill-blank data',
    };
  }

  const founderObj = founder as Record<string, string>;
  const validatorObj = validator as Record<string, string>;
  const founderBlanks = Object.keys(founderObj);
  let matchingBlanks = 0,
    partialBlanks = 0;

  founderBlanks.forEach((key) => {
    const fVal = (founderObj[key] || '').toLowerCase().trim();
    const vVal = (validatorObj[key] || '').toLowerCase().trim();
    if (fVal === vVal) matchingBlanks++;
    else if (fVal && vVal) {
      const fWords = new Set(fVal.split(/\s+/));
      const vWords = new Set(vVal.split(/\s+/));
      const overlap = Array.from(fWords).filter((w) => vWords.has(w) && w.length > 3);
      if (overlap.length > 0) partialBlanks++;
    }
  });

  const score =
    founderBlanks.length > 0
      ? Math.round(
          ((matchingBlanks + partialBlanks * 0.5) / founderBlanks.length) * 100
        )
      : 0;

  if (score >= 70)
    return { score, matchType: 'exact', explanation: 'Similar responses' };
  if (score >= 40)
    return { score, matchType: 'partial', explanation: 'Some similarity' };
  return { score, matchType: 'none', explanation: 'Different responses' };
}

// scenario: Keyword overlap with 40% floor for subjectivity
function calculateScenarioAlignment(
  founder: unknown,
  validator: unknown
): AlignmentResult {
  const fText = String(founder || '').toLowerCase();
  const vText = String(validator || '').toLowerCase();

  if (!fText || !vText)
    return {
      score: 50,
      matchType: 'partial',
      explanation: 'Open-ended response',
    };

  const stopwords = new Set([
    'that',
    'this',
    'with',
    'have',
    'from',
    'they',
    'their',
    'would',
    'could',
    'about',
    'which',
    'when',
    'what',
    'will',
    'been',
    'more',
    'some',
    'just',
    'like',
    'very',
    'also',
    'than',
  ]);
  const extractWords = (text: string) =>
    text
      .split(/\W+/)
      .filter((w) => w.length >= 4 && !stopwords.has(w));

  const fWords = new Set(extractWords(fText));
  const vWords = new Set(extractWords(vText));
  const overlap = Array.from(fWords).filter((w) => vWords.has(w));
  const minSize = Math.min(fWords.size, vWords.size);

  if (minSize === 0)
    return {
      score: 50,
      matchType: 'partial',
      explanation: 'Open-ended (no comparison)',
    };

  const score = Math.min(100, Math.round((overlap.length / minSize) * 100));
  return {
    score: Math.max(40, score),
    matchType: score >= 60 ? 'partial' : 'none',
    explanation: score >= 60 ? 'Theme overlap detected' : 'Unique perspective',
  };
}

// Default: JSON stringify comparison
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

// Aggregate alignment for a question across all responses
export function calculateQuestionAlignment(
  questionId: string,
  founderValue: unknown,
  validatorValues: unknown[]
): { averageScore: number; matchCount: number; total: number } {
  if (validatorValues.length === 0)
    return { averageScore: 0, matchCount: 0, total: 0 };

  let totalScore = 0,
    matchCount = 0;
  validatorValues.forEach((value) => {
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

// Overall alignment across all questions (weighted by response count)
export function calculateOverallAlignment(
  questionAlignments: Array<{
    questionId: string;
    averageScore: number;
    responseCount: number;
  }>
): number {
  const questionsWithResponses = questionAlignments.filter(
    (q) => q.responseCount > 0
  );
  if (questionsWithResponses.length === 0) return 0;

  let weightedSum = 0,
    totalWeight = 0;
  questionsWithResponses.forEach((q) => {
    const weight = Math.min(q.responseCount, 5);
    weightedSum += q.averageScore * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}
