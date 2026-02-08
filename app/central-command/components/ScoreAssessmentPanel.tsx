'use client';

import { useState } from 'react';
import {
  GOLD,
  GREEN,
  BLUE,
  BG_PRIMARY,
  BG_ELEVATED,
  BG_SURFACE,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { EnrichmentScoreAssessment } from '@/lib/central-command/types';
import type { RubricContent, ScoreDimension } from '@/lib/central-command/rubric';
import { getScoreColor } from '@/lib/central-command/score-display';
import RubricProposalModal from './RubricProposalModal';

// ============================================================================
// TYPES
// ============================================================================

interface ScoreAssessmentPanelProps {
  prospectId: string;
  scoreAssessments: Record<string, EnrichmentScoreAssessment>;
  rubrics: Record<ScoreDimension, { content: RubricContent; version: number }>;
  onScoreUpdate: (dimension: string, score: number, feedback: string) => Promise<void>;
}

type DimensionKey = 'strategic' | 'value' | 'readiness' | 'timeline' | 'bandwidth';

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  strategic: 'Strategic Value',
  value: 'Revenue Potential',
  readiness: 'Readiness to Buy',
  timeline: 'Timeline Urgency',
  bandwidth: 'Our Capacity Fit',
};

const DIMENSION_ORDER: DimensionKey[] = ['strategic', 'value', 'readiness', 'timeline', 'bandwidth'];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScoreAssessmentPanel({
  prospectId,
  scoreAssessments,
  rubrics,
  onScoreUpdate,
}: ScoreAssessmentPanelProps) {
  const [expandedDimension, setExpandedDimension] = useState<DimensionKey | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [newScore, setNewScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRubric, setShowRubric] = useState(false);

  // Rubric approval workflow state
  const [pendingProposal, setPendingProposal] = useState<{
    feedbackId: string;
    dimension: ScoreDimension;
    currentRubric: RubricContent;
    currentVersion: number;
    proposedRubric: RubricContent;
    reasoning: string;
    originalFeedback: string; // Preserved for tweak flow
  } | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  function handleExpand(dimension: DimensionKey) {
    if (expandedDimension === dimension) {
      setExpandedDimension(null);
      setFeedbackText('');
      setNewScore(null);
      setShowRubric(false);
    } else {
      setExpandedDimension(dimension);
      setFeedbackText('');
      setNewScore(scoreAssessments[dimension]?.score ?? 5);
      setShowRubric(false);
    }
  }

  async function handleSubmitFeedback() {
    if (!expandedDimension || !feedbackText.trim() || newScore === null || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Call the feedback API to get proposal
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

      // Score update happens immediately regardless of rubric proposal
      await onScoreUpdate(expandedDimension, newScore, feedbackText);

      // If proposal, show modal for approval
      if (result.hasProposal && result.proposedRubric) {
        setPendingProposal({
          feedbackId: result.feedbackId,
          dimension: expandedDimension as ScoreDimension,
          currentRubric: result.currentRubric,
          currentVersion: result.currentVersion,
          proposedRubric: result.proposedRubric,
          reasoning: result.reasoning,
          originalFeedback: feedbackText,
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

  async function handleApproveProposal() {
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
      // Close everything
      setPendingProposal(null);
      setExpandedDimension(null);
      setFeedbackText('');
      setNewScore(null);
    } finally {
      setModalSubmitting(false);
    }
  }

  function handleRejectProposal() {
    // Feedback already recorded, just close modal
    setPendingProposal(null);
    setExpandedDimension(null);
    setFeedbackText('');
    setNewScore(null);
  }

  async function handleTweakProposal(additionalFeedback: string) {
    if (!pendingProposal) return;
    setModalSubmitting(true);
    try {
      // Re-call feedback API with combined feedback (use preserved originalFeedback, not cleared feedbackText)
      const combinedFeedback = `${pendingProposal.originalFeedback}\n\nRefinement: ${additionalFeedback}`;
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
        // Update modal with new proposal, preserve original feedback for further tweaks
        setPendingProposal({
          feedbackId: result.feedbackId,
          dimension: pendingProposal.dimension,
          currentRubric: result.currentRubric,
          currentVersion: result.currentVersion,
          proposedRubric: result.proposedRubric,
          reasoning: result.reasoning,
          originalFeedback: pendingProposal.originalFeedback,
        });
      }
    } finally {
      setModalSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSubmitFeedback();
    }
  }

  return (
    <div className="space-y-2">
      {DIMENSION_ORDER.map((dimension) => {
        const assessment = scoreAssessments[dimension];
        const rubric = rubrics[dimension];
        const isExpanded = expandedDimension === dimension;

        if (!assessment) {
          return (
            <div
              key={dimension}
              className="p-3 rounded-lg border"
              style={{ background: BG_PRIMARY, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono uppercase" style={{ color: TEXT_MUTED }}>
                  {DIMENSION_LABELS[dimension]}
                </p>
                <p className="text-sm" style={{ color: TEXT_DIM }}>No assessment</p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={dimension}
            className="rounded-lg border transition-all"
            style={{
              background: BG_PRIMARY,
              borderColor: isExpanded ? 'rgba(212,165,74,0.3)' : 'rgba(255,255,255,0.1)',
            }}
          >
            {/* Header - always visible */}
            <div
              className="p-3 cursor-pointer flex items-center justify-between"
              onClick={() => handleExpand(dimension)}
            >
              <div className="flex items-center gap-3">
                <p
                  className="text-lg font-mono font-bold w-6 text-center"
                  style={{ color: getScoreColor(assessment.score) }}
                >
                  {assessment.score}
                </p>
                <div>
                  <p className="text-xs font-mono uppercase" style={{ color: TEXT_MUTED }}>
                    {DIMENSION_LABELS[dimension]}
                  </p>
                  <p
                    className="text-xs leading-relaxed line-clamp-1"
                    style={{ color: TEXT_DIM }}
                  >
                    {assessment.rationale}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {rubric && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.05)', color: TEXT_DIM }}
                  >
                    v{rubric.version}
                  </span>
                )}
                <svg
                  className="w-4 h-4 transition-transform"
                  style={{
                    color: TEXT_DIM,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {/* Full rationale */}
                <div className="pt-3">
                  <p className="text-[10px] font-mono uppercase mb-1" style={{ color: TEXT_DIM }}>
                    Rationale
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: TEXT_MUTED }}>
                    {assessment.rationale}
                  </p>
                </div>

                {/* Evidence */}
                {assessment.evidence && assessment.evidence.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono uppercase mb-1" style={{ color: TEXT_DIM }}>
                      Evidence
                    </p>
                    <ul className="space-y-1">
                      {assessment.evidence.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs flex items-start gap-1.5"
                          style={{ color: TEXT_MUTED }}
                        >
                          <span style={{ color: GOLD }}>•</span>
                          <span>&quot;{item}&quot;</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence */}
                <div>
                  <p className="text-[10px] font-mono uppercase mb-1" style={{ color: TEXT_DIM }}>
                    Confidence
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(assessment.confidence ?? 0.5) * 100}%`,
                          background: assessment.confidence > 0.7 ? GREEN : BLUE,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: TEXT_DIM }}>
                      {Math.round((assessment.confidence ?? 0.5) * 100)}%
                    </span>
                  </div>
                </div>

                {/* View Rubric toggle */}
                {rubric && (
                  <div>
                    <button
                      onClick={() => setShowRubric(!showRubric)}
                      className="text-[10px] font-mono underline transition-colors"
                      style={{ color: TEXT_DIM }}
                    >
                      {showRubric ? 'Hide Rubric' : 'View Rubric'}
                    </button>
                    {showRubric && (
                      <div
                        className="mt-2 p-2 rounded text-[10px] space-y-2"
                        style={{ background: BG_ELEVATED }}
                      >
                        <p style={{ color: TEXT_MUTED }}>{rubric.content.description}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="font-mono mb-1" style={{ color: GREEN }}>High (7-10)</p>
                            <ul className="space-y-0.5">
                              {rubric.content.indicators.high.map((ind, i) => (
                                <li key={i} style={{ color: TEXT_DIM }}>• {ind}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-mono mb-1" style={{ color: GOLD }}>Medium (4-6)</p>
                            <ul className="space-y-0.5">
                              {rubric.content.indicators.medium.map((ind, i) => (
                                <li key={i} style={{ color: TEXT_DIM }}>• {ind}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-mono mb-1" style={{ color: TEXT_MUTED }}>Low (1-3)</p>
                            <ul className="space-y-0.5">
                              {rubric.content.indicators.low.map((ind, i) => (
                                <li key={i} style={{ color: TEXT_DIM }}>• {ind}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback input */}
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-[10px] font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
                    Adjust Score
                  </p>
                  <div className="flex items-center gap-3 mb-2">
                    <label className="text-[10px]" style={{ color: TEXT_DIM }}>New Score:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newScore ?? assessment.score}
                      onChange={(e) => setNewScore(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-14 text-center font-mono text-sm rounded border focus:outline-none"
                      style={{
                        background: BG_ELEVATED,
                        color: getScoreColor(newScore ?? assessment.score),
                        borderColor: 'rgba(255,255,255,0.15)',
                      }}
                    />
                    <span className="text-[10px]" style={{ color: TEXT_DIM }}>
                      (was {assessment.score})
                    </span>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Why should this score be different? Your feedback helps improve future assessments..."
                    className="w-full resize-none text-xs rounded p-2 border focus:outline-none"
                    style={{
                      background: BG_ELEVATED,
                      color: TEXT_PRIMARY,
                      borderColor: 'rgba(255,255,255,0.1)',
                      minHeight: '60px',
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px]" style={{ color: TEXT_DIM }}>
                      Cmd+Enter to submit
                    </span>
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={!feedbackText.trim() || isSubmitting}
                      className="px-3 py-1.5 rounded text-xs font-mono transition-all disabled:opacity-30"
                      style={{ background: GOLD, color: BG_PRIMARY }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save & Refine Rubric'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Rubric Approval Modal */}
      {pendingProposal && (
        <RubricProposalModal
          isOpen={true}
          dimension={pendingProposal.dimension}
          currentRubric={pendingProposal.currentRubric}
          proposedRubric={pendingProposal.proposedRubric}
          reasoning={pendingProposal.reasoning}
          feedbackId={pendingProposal.feedbackId}
          currentVersion={pendingProposal.currentVersion}
          onApprove={handleApproveProposal}
          onReject={handleRejectProposal}
          onTweak={handleTweakProposal}
          isSubmitting={modalSubmitting}
        />
      )}
    </div>
  );
}
