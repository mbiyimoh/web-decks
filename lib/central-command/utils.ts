// utils.ts — Utility functions for Central Command

import { StageId, PriorityScores, ConfidenceLevel, SynthesisVersions } from './types';

// ============ VERSION HISTORY ============

export interface Version {
  version: number;
  content: string;
  source: 'generated' | 'manual' | 'refined';
  createdAt: string; // ISO date string
}

/**
 * Add a new version to the version history, capping at 10 versions
 */
export function addVersion(
  existing: Version[] | null,
  content: string,
  source: Version['source']
): Version[] {
  const versions = existing || [];
  return [
    ...versions,
    {
      version: versions.length + 1,
      content,
      source,
      createdAt: new Date().toISOString(),
    },
  ].slice(-10); // Cap at 10 versions
}

/**
 * Build updated synthesis version structure for a single section change.
 * Client-side: builds the complete updated versions object before sending PATCH.
 */
export function buildSynthesisVersionUpdate(
  existingVersions: SynthesisVersions | null,
  sectionKey: string,
  content: string,
  source: Version['source']
): SynthesisVersions {
  const versions = existingVersions || {};
  return {
    ...versions,
    [sectionKey]: addVersion(
      (versions as Record<string, Version[]>)[sectionKey] || null,
      content,
      source
    ),
  };
}

// ============ CURRENCY FORMATTING ============

/**
 * Format currency as $XK for amounts >= 1000, otherwise $X
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K';
  }
  return '$' + amount;
}

// ============ PRIORITY CALCULATION ============

/**
 * Calculate weighted average priority from 5 scores (each 1-10)
 * Each score has 20% weight (0.2), returning a value from 1-10
 */
export function calculatePriority(scores: PriorityScores): number {
  return (
    scores.strategic * 0.2 +
    scores.value * 0.2 +
    scores.readiness * 0.2 +
    scores.timeline * 0.2 +
    scores.bandwidth * 0.2
  );
}

// ============ PIPELINE STAGES ============

export const STAGES = [
  { id: 'lead' as const, name: 'Lead', short: 'LD' },
  { id: 'discovery' as const, name: 'Discovery', short: 'DS' },
  { id: 'assessment' as const, name: 'Assessment', short: 'AS' },
  { id: 'proposal' as const, name: 'Proposal', short: 'PR' },
  { id: 'negotiation' as const, name: 'Negotiation', short: 'NG' },
  { id: 'contract' as const, name: 'Contract', short: 'CT' },
  { id: 'payment' as const, name: 'Payment', short: 'PY' },
  { id: 'kickoff' as const, name: 'Kickoff', short: 'KO' },
] as const;

/**
 * Get stage by index (0-7)
 */
export function getStageByIndex(index: number): (typeof STAGES)[number] {
  return STAGES[index] || STAGES[0];
}

// ============ SCORE DISPLAY ============
// NOTE: Score display utilities have been consolidated to score-display.ts
// Import from '@/lib/central-command/score-display' for:
// - SCORE_LABELS, SCORE_KEYS, ScoreKey
// - getScoreColor, getConfidenceScoreColor, getOverallConfidence
// - getScoreFromFindings, getAllScoresFromFindings, getScoreAssessmentFromFindings

// ============ CONFIDENCE COLORS ============

/**
 * Map confidence level to hex color
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    high: '#4ADE80',
    medium: '#D4A84B',
    low: '#ef4444',
    unknown: '#71717a',
  };
  return colors[level];
}
