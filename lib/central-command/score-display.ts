// score-display.ts — Shared score display utilities for Central Command
//
// Canonical source for score colors, thresholds, labels, and extraction logic.
// All score display components should import from here to ensure consistency.

import { GREEN, GOLD, RED, TEXT_DIM } from '@/components/portal/design-tokens';
import type { EnrichmentFindings, EnrichmentScoreAssessment } from './types';

// ============================================================================
// SCORE KEYS & LABELS
// ============================================================================

export const SCORE_KEYS = ['strategic', 'value', 'readiness', 'timeline', 'bandwidth'] as const;

export type ScoreKey = (typeof SCORE_KEYS)[number];

export const SCORE_LABELS: Record<ScoreKey, { short: string; long: string }> = {
  strategic: { short: 'STRAT', long: 'Strategic / Logo Value' },
  value: { short: 'VAL', long: 'Revenue Potential' },
  readiness: { short: 'READY', long: 'Readiness to Buy' },
  timeline: { short: 'TIME', long: 'Timeline Urgency' },
  bandwidth: { short: 'BAND', long: 'Bandwidth Fit' },
};

/**
 * Maps score dimension keys to their corresponding PipelineClient field names.
 * Use this instead of string concatenation for type safety.
 */
export const SCORE_FIELD_MAP: Record<ScoreKey, string> = {
  strategic: 'scoreStrategic',
  value: 'scoreValue',
  readiness: 'scoreReadiness',
  timeline: 'scoreTimeline',
  bandwidth: 'scoreBandwidth',
} as const;

/**
 * Get the database field name for a score dimension.
 * Returns undefined for invalid dimensions.
 */
export function getScoreFieldName(dimension: string): string | undefined {
  return SCORE_FIELD_MAP[dimension as ScoreKey];
}

// ============================================================================
// SCORE COLOR THRESHOLDS
// ============================================================================
// Canonical thresholds for 1-10 scale:
// - GREEN (7-10): Strong/positive
// - GOLD (4-6): Moderate/neutral
// - RED (1-3): Weak/negative

export const SCORE_THRESHOLDS = {
  HIGH: 7,    // 7+ = green
  MEDIUM: 4,  // 4-6 = gold
  // Below 4 = red
} as const;

/**
 * Get color for a score on 1-10 scale.
 * Returns TEXT_DIM for null/undefined scores.
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return TEXT_DIM;
  if (score >= SCORE_THRESHOLDS.HIGH) return GREEN;
  if (score >= SCORE_THRESHOLDS.MEDIUM) return GOLD;
  return RED;
}

// ============================================================================
// SCORE EXTRACTION FROM ENRICHMENT FINDINGS
// ============================================================================

/**
 * Safely extract a single score from enrichmentFindings JSON.
 * @returns Score (1-10) or null if not found/invalid
 */
export function getScoreFromFindings(
  findings: unknown,
  key: ScoreKey
): number | null {
  if (!findings || typeof findings !== 'object') return null;

  const f = findings as Record<string, unknown>;

  if (!f.scoreAssessments || typeof f.scoreAssessments !== 'object') {
    return null;
  }

  const assessments = f.scoreAssessments as Record<string, unknown>;
  const assessment = assessments[key];

  if (!assessment || typeof assessment !== 'object') return null;

  const assessmentObj = assessment as Record<string, unknown>;
  const score = assessmentObj.score;

  if (typeof score !== 'number') return null;

  // Validate score is in valid range
  return score >= 1 && score <= 10 ? score : null;
}

/**
 * Get all scores from enrichmentFindings with fallback to default.
 */
export function getAllScoresFromFindings(
  findings: unknown,
  defaultScore = 5
): Record<ScoreKey, number> {
  return SCORE_KEYS.reduce(
    (acc, key) => {
      acc[key] = getScoreFromFindings(findings, key) ?? defaultScore;
      return acc;
    },
    {} as Record<ScoreKey, number>
  );
}

/**
 * Get full score assessment object from enrichmentFindings.
 */
export function getScoreAssessmentFromFindings(
  findings: unknown,
  key: ScoreKey
): EnrichmentScoreAssessment | null {
  if (!findings || typeof findings !== 'object') return null;

  const f = findings as EnrichmentFindings;
  const assessment = f.scoreAssessments?.[key];

  if (!assessment || typeof assessment.score !== 'number') return null;

  return assessment;
}

// ============================================================================
// CONFIDENCE DISPLAY
// ============================================================================

/** Color for a 0-1 confidence value: green (0.8+), gold (0.5-0.79), red (<0.5) */
export function getConfidenceScoreColor(confidence: number): string {
  if (confidence < 0.5) return RED;
  if (confidence < 0.8) return GOLD;
  return GREEN;
}

/** Calculate overall confidence level from score assessments */
export function getOverallConfidence(
  scoreAssessments: Record<string, { confidence: number }>
): 'high' | 'medium' | 'low' {
  const values = Object.values(scoreAssessments);
  if (values.length === 0) return 'low';
  const avg = values.reduce((sum, s) => sum + s.confidence, 0) / values.length;
  if (avg >= 0.7) return 'high';
  if (avg >= 0.4) return 'medium';
  return 'low';
}
