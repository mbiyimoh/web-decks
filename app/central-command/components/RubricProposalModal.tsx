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
        className="max-w-2xl w-full mx-4 rounded-xl border overflow-hidden max-h-[90vh] overflow-y-auto"
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
                {isSubmitting ? 'Regenerating...' : 'Regenerate Proposal'}
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
