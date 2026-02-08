'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recommendation, RefineRecommendationResponse } from '@/lib/clarity-canvas/types';
import { getScoreColor } from '@/lib/clarity-canvas/types';
import { FIELD_DISPLAY_NAMES } from '@/lib/clarity-canvas/profile-structure';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUndo: (id: string) => void;
  onRefine: (id: string, refinedContent: string, refinedSummary: string) => void;
}

export function RecommendationCard({
  recommendation,
  onApprove,
  onReject,
  onUndo,
  onRefine,
}: RecommendationCardProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefineLoading, setIsRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Derived values
  const displayContent = recommendation.refinedContent ?? recommendation.chunk.content;
  const displaySummary = recommendation.refinedSummary ?? recommendation.chunk.summary;
  const fieldName =
    FIELD_DISPLAY_NAMES[recommendation.chunk.targetField] || recommendation.chunk.targetField;
  const confidencePercent = Math.round(recommendation.chunk.confidence * 100);
  const confidenceColor = getScoreColor(recommendation.chunk.confidence * 100);

  const handleRefineClick = () => {
    setIsRefining(true);
    setRefineError(null);
  };

  const handleCancelRefine = () => {
    setIsRefining(false);
    setRefinePrompt('');
    setRefineError(null);
  };

  const handleApplyRefine = async () => {
    if (!refinePrompt.trim()) return;

    setIsRefineLoading(true);
    setRefineError(null);

    try {
      const response = await fetch('/api/clarity-canvas/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: displayContent,
          currentSummary: displaySummary,
          prompt: refinePrompt,
          fieldKey: recommendation.chunk.targetField,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refine recommendation');
      }

      const data: RefineRecommendationResponse = await response.json();
      onRefine(recommendation.id, data.refinedContent, data.refinedSummary);

      // Reset refine state
      setIsRefining(false);
      setRefinePrompt('');
      setRefineError(null);
    } catch (error) {
      setRefineError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsRefineLoading(false);
    }
  };

  const handleUndo = () => {
    onUndo(recommendation.id);
  };

  // State 3: Rejected (compact)
  if (recommendation.status === 'rejected') {
    return (
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-4 py-2 flex items-center justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm text-zinc-600 line-through">
            <span className="font-medium">{fieldName}</span>
            {' — '}
            {displaySummary}
          </span>
        </div>
        <button
          onClick={handleUndo}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Undo
        </button>
      </motion.div>
    );
  }

  // States 1, 2, 4: Full cards (pending, approved, refined)
  const isApprovedOrRefined =
    recommendation.status === 'approved' || recommendation.status === 'refined';

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`bg-[#111114] border rounded-xl p-4 ${
        isApprovedOrRefined
          ? 'border-zinc-800 border-l-2 border-l-green-500'
          : 'border-zinc-800'
      }`}
    >
      {/* Top row: field name + confidence badge + status icons */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[#f5f5f5] font-medium text-sm">{fieldName}</span>
          {recommendation.status === 'refined' && (
            <span className="text-xs text-[#d4a54a] font-mono tracking-wide uppercase">
              Refined
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${confidenceColor}33`,
              color: confidenceColor,
            }}
          >
            {confidencePercent}%
          </span>
          {isApprovedOrRefined && (
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content text */}
      <p
        className={`text-sm mt-2 ${
          isApprovedOrRefined ? 'text-zinc-400' : 'text-zinc-300'
        }`}
      >
        {displayContent}
      </p>

      {/* Summary text */}
      <p
        className={`text-xs mt-1 italic ${
          isApprovedOrRefined ? 'text-zinc-600' : 'text-zinc-500'
        }`}
      >
        {displaySummary}
      </p>

      {/* Refine expansion section */}
      <AnimatePresence>
        {isRefining && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="How should this be changed?"
                className="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 w-full text-sm focus:outline-none focus:border-[#d4a54a] transition-colors"
                disabled={isRefineLoading}
              />
              {refineError && (
                <p className="text-xs text-red-400">{refineError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleApplyRefine}
                  disabled={!refinePrompt.trim() || isRefineLoading}
                  className="bg-[#d4a54a]/10 hover:bg-[#d4a54a]/20 disabled:bg-zinc-900 text-[#d4a54a] disabled:text-zinc-600 border border-[#d4a54a]/30 disabled:border-zinc-800 rounded-lg px-3 py-1.5 text-sm transition-colors flex items-center gap-2"
                >
                  {isRefineLoading && (
                    <svg
                      className="w-3 h-3 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  Apply
                </button>
                <button
                  onClick={handleCancelRefine}
                  disabled={isRefineLoading}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-zinc-400 disabled:text-zinc-600 border border-zinc-700 disabled:border-zinc-800 rounded-lg px-3 py-1.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons row */}
      <div className="mt-3 flex gap-2">
        {recommendation.status === 'pending' ? (
          <>
            <button
              onClick={() => onApprove(recommendation.id)}
              className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(recommendation.id)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleRefineClick}
              className="bg-[#d4a54a]/10 hover:bg-[#d4a54a]/20 text-[#d4a54a] border border-[#d4a54a]/30 rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              Refine
            </button>
          </>
        ) : (
          <button
            onClick={handleUndo}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 rounded-lg px-2 py-1 text-xs transition-colors"
          >
            Undo
          </button>
        )}
      </div>
    </motion.div>
  );
}
