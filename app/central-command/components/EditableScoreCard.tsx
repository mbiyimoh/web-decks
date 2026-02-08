'use client';

import { useState, useRef } from 'react';
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
import { getScoreColor } from '@/lib/central-command/score-display';

// ============================================================================
// TYPES
// ============================================================================

interface EditableScoreCardProps {
  scoreKey: string;
  label: string;
  assessment: EnrichmentScoreAssessment;
  onSave: (updated: EnrichmentScoreAssessment) => void;
  pendingRefinement?: (EnrichmentScoreAssessment & { changeSummary: string }) | null;
  onAcceptRefinement?: () => void;
  onRejectRefinement?: () => void;
}

type CardState = 'VIEW' | 'EDIT' | 'REFINING';

// ============================================================================
// EDITABLE SCORE CARD
// ============================================================================

export default function EditableScoreCard({
  scoreKey,
  label,
  assessment,
  onSave,
  pendingRefinement,
  onAcceptRefinement,
  onRejectRefinement,
}: EditableScoreCardProps) {
  const [state, setState] = useState<CardState>('VIEW');
  const [editScore, setEditScore] = useState(assessment.score);
  const [editRationale, setEditRationale] = useState(assessment.rationale);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedAssessment, setRefinedAssessment] = useState<(EnrichmentScoreAssessment & { changeSummary: string }) | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const refineInputRef = useRef<HTMLInputElement>(null);

  const hasPending = !!pendingRefinement;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleEdit() {
    setEditScore(assessment.score);
    setEditRationale(assessment.rationale);
    setState('EDIT');
  }

  function handleCancelEdit() {
    setEditScore(assessment.score);
    setEditRationale(assessment.rationale);
    setState('VIEW');
  }

  function handleSaveEdit() {
    if (editScore !== assessment.score || editRationale !== assessment.rationale) {
      onSave({
        ...assessment,
        score: editScore,
        rationale: editRationale,
      });
    }
    setState('VIEW');
  }

  async function handleRefineSubmit() {
    if (!refinePrompt.trim() || isRefining) return;

    setIsRefining(true);
    setState('REFINING');

    try {
      const res = await fetch('/api/central-command/refine-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSynthesis: {},
          currentScores: { [scoreKey]: assessment },
          prompt: refinePrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedScores?.[scoreKey]) {
          setRefinedAssessment(data.updatedScores[scoreKey]);
          setRefinePrompt('');
        } else {
          setState('VIEW');
        }
      } else {
        console.error('Refine failed');
        setState('VIEW');
      }
    } catch (err) {
      console.error('Refine error:', err);
      setState('VIEW');
    } finally {
      setIsRefining(false);
    }
  }

  function handleAcceptLocalRefinement() {
    if (refinedAssessment) {
      const { changeSummary, ...scoreData } = refinedAssessment;
      onSave(scoreData);
      setRefinedAssessment(null);
      setState('VIEW');
    }
  }

  function handleRejectLocalRefinement() {
    setRefinedAssessment(null);
    setState('VIEW');
  }

  function handleRefineKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRefineSubmit();
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const displayAssessment = hasPending
    ? pendingRefinement!
    : state === 'REFINING' && refinedAssessment
    ? refinedAssessment
    : assessment;

  const isPreview = hasPending || (state === 'REFINING' && refinedAssessment);

  return (
    <div
      className="p-3 rounded-lg border transition-all"
      style={{
        background: BG_PRIMARY,
        borderColor: isPreview ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-mono uppercase" style={{ color: TEXT_MUTED }}>
          {label}
        </p>

        {/* Score display or edit */}
        {state === 'EDIT' ? (
          <input
            type="number"
            min={1}
            max={10}
            value={editScore}
            onChange={(e) => setEditScore(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-12 text-lg font-mono font-bold text-center rounded border focus:outline-none"
            style={{
              background: BG_ELEVATED,
              color: getScoreColor(editScore),
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          />
        ) : (
          <p
            className="text-lg font-mono font-bold"
            style={{ color: getScoreColor(displayAssessment.score) }}
          >
            {displayAssessment.score}
          </p>
        )}
      </div>

      {/* Change summary badge */}
      {(hasPending || (state === 'REFINING' && refinedAssessment)) && (
        <div
          className="text-xs font-mono px-2 py-1 rounded mb-2 inline-block"
          style={{ background: 'rgba(74, 222, 128, 0.1)', color: GREEN }}
        >
          {hasPending ? pendingRefinement!.changeSummary : refinedAssessment!.changeSummary}
        </div>
      )}

      {/* Rationale */}
      {state === 'EDIT' ? (
        <textarea
          value={editRationale}
          onChange={(e) => setEditRationale(e.target.value)}
          className="w-full resize-none text-xs leading-relaxed focus:outline-none font-body rounded p-2 border"
          style={{
            background: BG_ELEVATED,
            color: TEXT_PRIMARY,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            minHeight: '60px',
          }}
        />
      ) : (
        <p
          className="text-xs leading-relaxed"
          style={{
            color: isPreview ? TEXT_MUTED : TEXT_DIM,
            fontStyle: isPreview ? 'italic' : 'normal',
          }}
        >
          {displayAssessment.rationale}
        </p>
      )}

      {/* Hover actions (VIEW state only, no pending) */}
      {state === 'VIEW' && !hasPending && isHovered && (
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED }}
            title="Edit"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => refineInputRef.current?.focus()}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED }}
            title="Refine with AI"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </button>
        </div>
      )}

      {/* Refine input (VIEW state, no pending) */}
      {state !== 'EDIT' && !hasPending && !refinedAssessment && (
        <div className="mt-2 flex items-center gap-1">
          <input
            ref={refineInputRef}
            type="text"
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            onKeyDown={handleRefineKeyDown}
            placeholder="Refine score..."
            disabled={isRefining}
            className="flex-1 px-2 py-1 rounded text-[10px] focus:outline-none font-body border transition-colors"
            style={{
              background: BG_ELEVATED,
              color: TEXT_PRIMARY,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          <button
            onClick={handleRefineSubmit}
            disabled={!refinePrompt.trim() || isRefining}
            className="px-1.5 py-1 rounded text-[10px] transition-all disabled:opacity-30"
            style={{ color: TEXT_MUTED }}
          >
            {isRefining ? '...' : '↵'}
          </button>
        </div>
      )}

      {/* EDIT action buttons */}
      {state === 'EDIT' && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleCancelEdit}
            className="px-2 py-1 rounded text-[10px] transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-2 py-1 rounded text-[10px] transition-all"
            style={{ background: GOLD, color: BG_PRIMARY }}
          >
            Save
          </button>
        </div>
      )}

      {/* Local refinement accept/reject */}
      {!hasPending && state === 'REFINING' && refinedAssessment && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleRejectLocalRefinement}
            className="px-2 py-1 rounded text-[10px] transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Reject
          </button>
          <button
            onClick={handleAcceptLocalRefinement}
            className="px-2 py-1 rounded text-[10px] transition-all"
            style={{ background: GREEN, color: BG_PRIMARY }}
          >
            Accept
          </button>
        </div>
      )}

      {/* Pending (global) refinement accept/reject */}
      {hasPending && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onRejectRefinement}
            className="px-2 py-1 rounded text-[10px] transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Reject
          </button>
          <button
            onClick={onAcceptRefinement}
            className="px-2 py-1 rounded text-[10px] transition-all"
            style={{ background: GREEN, color: BG_PRIMARY }}
          >
            Accept
          </button>
        </div>
      )}
    </div>
  );
}
