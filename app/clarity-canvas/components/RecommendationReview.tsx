'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ExtractionChunk,
  Recommendation,
  RecommendationStatus,
  ProfileWithSections,
  ProfileScores,
  CommitRecommendationsResponse,
  ExtractionMetadata,
} from '@/lib/clarity-canvas/types';
import { ChevronDown } from 'lucide-react';
import { PROFILE_STRUCTURE } from '@/lib/clarity-canvas/profile-structure';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationReviewProps {
  extractedChunks: ExtractionChunk[];
  overallThemes: string[];
  suggestedFollowUps: string[];
  sourceType: 'VOICE' | 'TEXT';
  extractionMetadata?: ExtractionMetadata;
  onCommit: (profile: ProfileWithSections, scores: ProfileScores, response?: CommitRecommendationsResponse) => void;
  onBack: () => void;
}

export function RecommendationReview({
  extractedChunks,
  overallThemes,
  suggestedFollowUps,
  sourceType,
  extractionMetadata,
  onCommit,
  onBack,
}: RecommendationReviewProps) {
  // Initialize recommendations from extracted chunks
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() =>
    extractedChunks.map((chunk) => ({
      id: crypto.randomUUID(),
      chunk,
      status: 'pending' as RecommendationStatus,
    }))
  );

  const [isCommitting, setIsCommitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [showLowConfidenceWarning, setShowLowConfidenceWarning] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // Group recommendations by section
  const groupedBySection = useMemo(() => {
    const groups: Record<
      string,
      { name: string; icon: string; recommendations: Recommendation[] }
    > = {};

    for (const rec of recommendations) {
      const key = rec.chunk.targetSection;
      if (!groups[key]) {
        const sectionMeta = PROFILE_STRUCTURE[key as keyof typeof PROFILE_STRUCTURE];
        groups[key] = {
          name: sectionMeta?.name ?? key,
          icon: sectionMeta?.icon ?? '',
          recommendations: [],
        };
      }
      groups[key].recommendations.push(rec);
    }

    return groups;
  }, [recommendations]);

  // Computed values
  const approvedCount = recommendations.filter(
    (r) => r.status === 'approved' || r.status === 'refined'
  ).length;
  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;
  const sectionCount = Object.keys(groupedBySection).length;
  const lowConfidenceItems = recommendations.filter(
    (r) => r.chunk.confidence < 0.7 && r.status === 'pending'
  );

  // Handler functions
  const handleApprove = (id: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' as RecommendationStatus } : r))
    );
  };

  const handleReject = (id: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as RecommendationStatus } : r))
    );
  };

  const handleUndo = (id: string) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'pending' as RecommendationStatus,
              refinedContent: undefined,
              refinedSummary: undefined,
            }
          : r
      )
    );
  };

  const handleRefine = (id: string, refinedContent: string, refinedSummary: string) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'refined' as RecommendationStatus,
              refinedContent,
              refinedSummary,
            }
          : r
      )
    );
  };

  const handleApproveAll = () => {
    if (lowConfidenceItems.length > 0) {
      setShowLowConfidenceWarning(true);
    } else {
      handleApproveAllAnyway();
    }
  };

  const handleApproveAllAnyway = () => {
    setRecommendations((prev) =>
      prev.map((r) => (r.status === 'pending' ? { ...r, status: 'approved' as RecommendationStatus } : r))
    );
    setShowLowConfidenceWarning(false);
  };

  const handleApproveSection = (sectionKey: string) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.chunk.targetSection === sectionKey && r.status === 'pending'
          ? { ...r, status: 'approved' as RecommendationStatus }
          : r
      )
    );
  };

  const handleCommitClick = () => {
    setShowConfirmation(true);
    setCommitError(null);
  };

  const handleConfirmCommit = async () => {
    setIsCommitting(true);
    setCommitError(null);

    try {
      const approvedRecs = recommendations.filter(
        (r) => r.status === 'approved' || r.status === 'refined'
      );

      const body = {
        recommendations: approvedRecs.map((r) => ({
          targetSection: r.chunk.targetSection,
          targetSubsection: r.chunk.targetSubsection,
          targetField: r.chunk.targetField,
          content: r.refinedContent ?? r.chunk.content,
          summary: r.refinedSummary ?? r.chunk.summary,
          confidence: r.chunk.confidence,
          sourceType: sourceType,
        })),
      };

      const response = await fetch('/api/clarity-canvas/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to commit recommendations');
      }

      const data: CommitRecommendationsResponse = await response.json();
      onCommit(data.updatedProfile, data.scores, data);
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setCommitError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display text-[#f5f5f5]">Review Recommendations</h1>
          <button
            onClick={onBack}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Executive Summary Card */}
        <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-6 space-y-4">
          {extractedChunks.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-zinc-400">
                We couldn&apos;t extract specific recommendations from this input.
              </p>
              <button
                onClick={onBack}
                className="bg-[#d4a54a]/10 hover:bg-[#d4a54a]/20 text-[#d4a54a] border border-[#d4a54a]/30 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <p className="text-zinc-300">
                We identified <span className="font-medium text-white">{extractedChunks.length}</span>{' '}
                insights across <span className="font-medium text-white">{sectionCount}</span> areas.
              </p>

              {/* Theme chips */}
              {overallThemes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {overallThemes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="bg-[#d4a54a]/10 text-[#d4a54a] text-xs px-3 py-1 rounded-full"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              {/* Approve All button */}
              <button
                onClick={handleApproveAll}
                disabled={pendingCount === 0}
                className="bg-[#d4a54a]/10 hover:bg-[#d4a54a]/20 disabled:bg-zinc-900 text-[#d4a54a] disabled:text-zinc-600 border border-[#d4a54a]/30 disabled:border-zinc-800 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                Approve All ({pendingCount})
              </button>
            </>
          )}
        </div>

        {/* Low confidence warning */}
        <AnimatePresence>
          {showLowConfidenceWarning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <p className="text-amber-200 text-sm">
                  <span className="font-medium">{lowConfidenceItems.length}</span> items have low
                  confidence. Review these first?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLowConfidenceWarning(false)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg px-3 py-1.5 text-sm transition-colors"
                  >
                    Review Low-Confidence
                  </button>
                  <button
                    onClick={handleApproveAllAnyway}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm transition-colors"
                  >
                    Approve All Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section groups */}
        {Object.entries(groupedBySection).map(([sectionKey, group]) => {
          const sectionPendingCount = group.recommendations.filter(
            (r) => r.status === 'pending'
          ).length;

          return (
            <div key={sectionKey} className="space-y-3">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{group.icon}</span>
                  <h2 className="text-lg font-display text-white">{group.name}</h2>
                  <span className="text-sm text-zinc-500">({group.recommendations.length})</span>
                </div>
                {sectionPendingCount > 0 && (
                  <button
                    onClick={() => handleApproveSection(sectionKey)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 text-xs transition-colors"
                  >
                    Approve All ({sectionPendingCount})
                  </button>
                )}
              </div>

              {/* Recommendation cards */}
              <div className="space-y-2">
                {group.recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onUndo={handleUndo}
                    onRefine={handleRefine}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Gaps section */}
        {suggestedFollowUps.length > 0 && (
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-6 space-y-3">
            <p className="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase">
              Areas to Explore
            </p>
            <ul className="space-y-2">
              {suggestedFollowUps.map((followUp, idx) => (
                <li key={idx} className="text-zinc-500 text-sm flex items-start gap-2">
                  <span className="text-zinc-700 mt-1">•</span>
                  <span>{followUp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Extraction Metadata (collapsible, subtle) */}
        {extractionMetadata && extractionMetadata.gapAnalysisApplied && (
          <div className="border-t border-zinc-800/50 pt-4 mt-8">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-500 text-xs transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showMetadata ? 'rotate-180' : ''}`}
              />
              <span className="font-mono tracking-wide">Extraction Metadata</span>
            </button>

            <AnimatePresence>
              {showMetadata && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2">
                    <p className="text-zinc-600 text-xs">
                      Initial extraction: {extractionMetadata.firstPassChunkCount} insights →
                      Final: {extractionMetadata.finalChunkCount} insights
                    </p>

                    {extractionMetadata.changes.length > 0 && (
                      <ul className="space-y-1">
                        {extractionMetadata.changes.map((change, idx) => (
                          <li key={idx} className="text-zinc-600 text-xs flex items-start gap-2">
                            <span className="text-zinc-700">
                              {change.type === 'added' && '+'}
                              {change.type === 'improved' && '↑'}
                              {change.type === 'consolidated' && '⊕'}
                              {change.type === 'recategorized' && '→'}
                              {change.type === 'confidence_adjusted' && '~'}
                            </span>
                            <span>{change.description}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {extractionMetadata.changes.length === 0 && (
                      <p className="text-zinc-700 text-xs italic">
                        No adjustments made during quality review
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Commit footer — hidden when no chunks were extracted */}
      {recommendations.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-sm border-t border-zinc-800 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleCommitClick}
              disabled={approvedCount === 0}
              className="w-full bg-[#d4a54a]/10 hover:bg-[#d4a54a]/20 disabled:bg-zinc-900 text-[#d4a54a] disabled:text-zinc-600 border border-[#d4a54a]/30 disabled:border-zinc-800 rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Commit {approvedCount} approved items to profile
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleCancelConfirmation}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md bg-[#111114] border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-display text-white mb-4">Confirm Commit</h3>
              <p className="text-zinc-400 text-sm mb-6">
                About to update <span className="font-medium text-white">{approvedCount}</span> fields
                across <span className="font-medium text-white">{sectionCount}</span> sections.
              </p>

              {commitError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{commitError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmCommit}
                  disabled={isCommitting}
                  className="flex-1 bg-[#d4a54a]/10 hover:bg-[#d4a54a]/20 disabled:bg-zinc-900 text-[#d4a54a] disabled:text-zinc-600 border border-[#d4a54a]/30 disabled:border-zinc-800 rounded-lg px-4 py-2 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isCommitting && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  {isCommitting ? 'Committing...' : 'Confirm'}
                </button>
                <button
                  onClick={handleCancelConfirmation}
                  disabled={isCommitting}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-zinc-400 disabled:text-zinc-600 border border-zinc-700 disabled:border-zinc-800 rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
