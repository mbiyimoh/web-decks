'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GOLD,
  GOLD_DIM,
  GREEN,
  GREEN_DIM,
  RED,
  RED_DIM,
  BLUE,
  BG_PRIMARY,
  BG_SURFACE,
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type {
  PipelineExtraction,
  PipelineRecommendation,
  CreateProspectRequest,
} from '@/lib/central-command/schemas';
import type { EnrichmentScoreAssessment, PendingRefinements } from '@/lib/central-command/types';
import { SCORE_LABELS, getScoreColor, getConfidenceScoreColor, getOverallConfidence, type ScoreKey } from '@/lib/central-command/score-display';
import EditableSynthesisBlock from './EditableSynthesisBlock';
import EditableScoreCard from './EditableScoreCard';
import SynthesisGlobalRefine from './SynthesisGlobalRefine';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProspectCreated: () => void;
}

type ModalStep = 'input' | 'review';

const CATEGORY_COLORS: Record<string, string> = {
  // Client Intelligence
  company_info: BLUE,
  contact_info: GREEN,
  goals_vision: GOLD,
  pain_blockers: RED,
  decision_dynamics: '#f472b6', // pink
  // Operations
  next_action: '#22d3ee', // cyan
  budget_signal: '#c084fc', // purple
  timeline_signal: '#fb923c', // orange
};

const MAX_CHARS = 20000;

export default function IntakeModal({
  isOpen,
  onClose,
  onProspectCreated,
}: IntakeModalProps) {
  const [step, setStep] = useState<ModalStep>('input');
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [extraction, setExtraction] = useState<PipelineExtraction | null>(null);
  const [checkedRecommendations, setCheckedRecommendations] = useState<
    Set<number>
  >(new Set());
  const [error, setError] = useState('');

  // Handle escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  function handleClose() {
    setStep('input');
    setInputText('');
    setExtraction(null);
    setCheckedRecommendations(new Set());
    setError('');
    onClose();
  }

  async function handleExtract() {
    if (!inputText.trim()) return;

    setIsExtracting(true);
    setError('');

    try {
      const res = await fetch('/api/central-command/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText }),
      });

      const data = await res.json();

      if (res.ok) {
        setExtraction(data);
        // Auto-check recommendations with confidence > 0.5
        const autoChecked = new Set<number>();
        data.recommendations.forEach((rec: PipelineRecommendation, idx: number) => {
          if (rec.confidence > 0.5) {
            autoChecked.add(idx);
          }
        });
        setCheckedRecommendations(autoChecked);
        setStep('review');
      } else {
        setError(data.error || 'Failed to extract recommendations');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  }

  function toggleRecommendation(idx: number) {
    setCheckedRecommendations((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  async function handleCreateProspect() {
    if (!extraction) return;

    setIsCreating(true);
    setError('');

    try {
      // Build prospect data from checked recommendations
      const prospectData = buildProspectData(
        extraction,
        Array.from(checkedRecommendations)
      );

      const res = await fetch('/api/central-command/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospectData),
      });

      if (res.ok) {
        handleClose();
        onProspectCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create prospect');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Create prospect error:', err);
    } finally {
      setIsCreating(false);
    }
  }

  function buildProspectData(
    extraction: PipelineExtraction,
    checkedIndices: number[]
  ): CreateProspectRequest {
    const recommendations = extraction.recommendations.filter((_, idx) =>
      checkedIndices.includes(idx)
    );

    const data: CreateProspectRequest = {
      name:
        recommendations.find((r) => r.targetField === 'name')?.suggestedValue ||
        extraction.suggestedCompanyName ||
        'Unnamed Prospect',
      rawInputText: inputText,
    };

    // Map recommendations to fields
    const noteValues: string[] = [];

    recommendations.forEach((rec) => {
      const { targetField, suggestedValue } = rec;

      if (targetField === 'notes') {
        noteValues.push(suggestedValue);
      } else if (targetField === 'potentialValue') {
        const parsed = parseInt(suggestedValue.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed)) {
          data.potentialValue = parsed;
        }
      } else {
        switch (targetField) {
          case 'industry':
            data.industry = suggestedValue;
            break;
          case 'color':
            data.color = suggestedValue;
            break;
          case 'website':
            data.website = suggestedValue;
            break;
          case 'contactName':
            data.contactName = suggestedValue;
            break;
          case 'contactRole':
            data.contactRole = suggestedValue;
            break;
          case 'contactEmail':
            data.contactEmail = suggestedValue;
            break;
          case 'contactPhone':
            data.contactPhone = suggestedValue;
            break;
          case 'contactLinkedin':
            data.contactLinkedin = suggestedValue;
            break;
          case 'nextAction':
            // Don't overwrite if already set
            if (!data.notes?.includes('Next:')) {
              noteValues.push(`Next: ${suggestedValue}`);
            }
            break;
        }
      }
    });

    if (noteValues.length > 0) {
      data.notes = noteValues.join('\n\n');
    }

    // Attach synthesis as enrichment data
    if (extraction.synthesis) {
      data.enrichmentFindings = extraction.synthesis;

      // Build confidence from score assessments
      const sa = extraction.synthesis.scoreAssessments;
      data.enrichmentConfidence = {
        overall: getOverallConfidence(sa),
        strategic: { score: sa.strategic.confidence, evidence: sa.strategic.evidence.length },
        value: { score: sa.value.confidence, evidence: sa.value.evidence.length },
        readiness: { score: sa.readiness.confidence, evidence: sa.readiness.evidence.length },
        timeline: { score: sa.timeline.confidence, evidence: sa.timeline.evidence.length },
        bandwidth: { score: sa.bandwidth.confidence, evidence: sa.bandwidth.evidence.length },
      };

      // Suggested actions from synthesis
      const actions: string[] = [];
      if (extraction.synthesis.recommendedApproach) {
        actions.push(extraction.synthesis.recommendedApproach);
      }
      if (actions.length > 0) {
        data.enrichmentSuggestedActions = actions;
      }

      // AI-suggested scores
      data.scoreStrategic = sa.strategic.score;
      data.scoreValue = sa.value.score;
      data.scoreReadiness = sa.readiness.score;
      data.scoreTimeline = sa.timeline.score;
      data.scoreBandwidth = sa.bandwidth.score;
    }

    return data;
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl rounded-xl overflow-hidden"
          style={{ background: BG_SURFACE, maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {step === 'input' ? (
            <InputStep
              inputText={inputText}
              setInputText={setInputText}
              isExtracting={isExtracting}
              error={error}
              onExtract={handleExtract}
              onCancel={handleClose}
            />
          ) : (
            <ReviewStep
              extraction={extraction!}
              setExtraction={setExtraction}
              checkedRecommendations={checkedRecommendations}
              isCreating={isCreating}
              error={error}
              onToggle={toggleRecommendation}
              onCreate={handleCreateProspect}
              onBack={() => setStep('input')}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// INPUT STEP
// ============================================================================

interface InputStepProps {
  inputText: string;
  setInputText: (text: string) => void;
  isExtracting: boolean;
  error: string;
  onExtract: () => void;
  onCancel: () => void;
}

function InputStep({
  inputText,
  setInputText,
  isExtracting,
  error,
  onExtract,
  onCancel,
}: InputStepProps) {
  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isDisabled = !inputText.trim() || isOverLimit || isExtracting;

  return (
    <div className="flex flex-col" style={{ height: '90vh', maxHeight: '800px' }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          background: BG_ELEVATED,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase mb-1"
          style={{ color: GOLD }}
        >
          NEW PROSPECT — Paste Notes
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste meeting notes, call transcript, or any text about this prospect..."
          autoFocus
          className="w-full h-full resize-none text-base leading-relaxed placeholder-[#555] focus:outline-none font-body"
          style={{
            background: 'transparent',
            color: TEXT_PRIMARY,
            minHeight: '300px',
          }}
        />
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 border-t"
        style={{
          background: BG_ELEVATED,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-mono" style={{ color: TEXT_DIM }}>
            <span style={{ color: isOverLimit ? RED : TEXT_MUTED }}>
              {charCount.toLocaleString()}
            </span>
            {' / '}
            {MAX_CHARS.toLocaleString()}
          </p>
          {error && <p className="text-sm" style={{ color: RED }}>{error}</p>}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
          <button
            onClick={onExtract}
            disabled={isDisabled}
            className="flex-1 py-2 px-4 rounded font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: GOLD, color: BG_PRIMARY }}
          >
            {isExtracting ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-pulse">Extracting...</span>
              </span>
            ) : (
              'Extract →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REVIEW STEP
// ============================================================================

interface ReviewStepProps {
  extraction: PipelineExtraction;
  setExtraction: (extraction: PipelineExtraction) => void;
  checkedRecommendations: Set<number>;
  isCreating: boolean;
  error: string;
  onToggle: (idx: number) => void;
  onCreate: () => void;
  onBack: () => void;
}

function ReviewStep({
  extraction,
  setExtraction,
  checkedRecommendations,
  isCreating,
  error,
  onToggle,
  onCreate,
  onBack,
}: ReviewStepProps) {
  const [showOps, setShowOps] = useState(false);
  const [pendingRefinements, setPendingRefinements] = useState<PendingRefinements | null>(null);
  const synthesis = extraction.synthesis;

  // ============================================================================
  // REFINEMENT HANDLERS
  // ============================================================================

  function handleSynthesisSave(sectionKey: string, content: string) {
    setExtraction({
      ...extraction,
      synthesis: {
        ...extraction.synthesis,
        [sectionKey]: content,
      },
    });
  }

  function handleScoreSave(scoreKey: string, updated: EnrichmentScoreAssessment) {
    setExtraction({
      ...extraction,
      synthesis: {
        ...extraction.synthesis,
        scoreAssessments: {
          ...extraction.synthesis.scoreAssessments,
          [scoreKey]: updated,
        },
      },
    });
  }

  function handleGlobalRefinement(results: PendingRefinements) {
    setPendingRefinements(results);
  }

  function acceptSection(sectionKey: string) {
    if (!pendingRefinements?.updatedSections?.[sectionKey]) return;
    handleSynthesisSave(sectionKey, pendingRefinements.updatedSections[sectionKey].refinedContent);

    const remaining = { ...pendingRefinements };
    if (remaining.updatedSections) {
      delete remaining.updatedSections[sectionKey];
      if (Object.keys(remaining.updatedSections).length === 0) {
        delete remaining.updatedSections;
      }
    }
    setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
  }

  function rejectSection(sectionKey: string) {
    if (!pendingRefinements?.updatedSections) return;

    const remaining = { ...pendingRefinements };
    delete remaining.updatedSections![sectionKey];
    if (Object.keys(remaining.updatedSections!).length === 0) {
      delete remaining.updatedSections;
    }
    setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
  }

  function acceptScore(scoreKey: string) {
    if (!pendingRefinements?.updatedScores?.[scoreKey]) return;
    const { changeSummary, ...scoreData } = pendingRefinements.updatedScores[scoreKey];
    handleScoreSave(scoreKey, scoreData);

    const remaining = { ...pendingRefinements };
    if (remaining.updatedScores) {
      delete remaining.updatedScores[scoreKey];
      if (Object.keys(remaining.updatedScores).length === 0) {
        delete remaining.updatedScores;
      }
    }
    setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
  }

  function rejectScore(scoreKey: string) {
    if (!pendingRefinements?.updatedScores) return;

    const remaining = { ...pendingRefinements };
    delete remaining.updatedScores![scoreKey];
    if (Object.keys(remaining.updatedScores!).length === 0) {
      delete remaining.updatedScores;
    }
    setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
  }

  return (
    <div className="flex flex-col" style={{ height: '90vh', maxHeight: '800px' }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          background: BG_ELEVATED,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase mb-1"
          style={{ color: GOLD }}
        >
          CLIENT INTELLIGENCE REPORT
        </p>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>
          {extraction.overallSummary}
        </p>
        {extraction.suggestedCompanyName && (
          <p className="text-base mt-2 font-display" style={{ color: TEXT_PRIMARY }}>
            {extraction.suggestedCompanyName}
            {extraction.suggestedIndustry && (
              <span className="font-body text-sm ml-2" style={{ color: TEXT_DIM }}>
                {extraction.suggestedIndustry}
              </span>
            )}
          </p>
        )}

        {/* Global Refine Bar */}
        <SynthesisGlobalRefine
          currentSynthesis={{
            companyOverview: synthesis?.companyOverview,
            goalsAndVision: synthesis?.goalsAndVision,
            painAndBlockers: synthesis?.painAndBlockers,
            decisionDynamics: synthesis?.decisionDynamics,
            strategicAssessment: synthesis?.strategicAssessment,
            recommendedApproach: synthesis?.recommendedApproach,
          }}
          currentScores={synthesis?.scoreAssessments}
          onRefinementComplete={handleGlobalRefinement}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ── SYNTHESIS SECTIONS ── */}
        {synthesis && (
          <>
            <EditableSynthesisBlock
              sectionKey="companyOverview"
              label="COMPANY OVERVIEW"
              content={synthesis.companyOverview}
              onSave={(content) => handleSynthesisSave('companyOverview', content)}
              pendingRefinement={pendingRefinements?.updatedSections?.companyOverview}
              onAcceptRefinement={() => acceptSection('companyOverview')}
              onRejectRefinement={() => rejectSection('companyOverview')}
            />
            <EditableSynthesisBlock
              sectionKey="goalsAndVision"
              label="GOALS & VISION"
              content={synthesis.goalsAndVision}
              onSave={(content) => handleSynthesisSave('goalsAndVision', content)}
              pendingRefinement={pendingRefinements?.updatedSections?.goalsAndVision}
              onAcceptRefinement={() => acceptSection('goalsAndVision')}
              onRejectRefinement={() => rejectSection('goalsAndVision')}
            />
            <EditableSynthesisBlock
              sectionKey="painAndBlockers"
              label="PAIN POINTS & BLOCKERS"
              content={synthesis.painAndBlockers}
              onSave={(content) => handleSynthesisSave('painAndBlockers', content)}
              pendingRefinement={pendingRefinements?.updatedSections?.painAndBlockers}
              onAcceptRefinement={() => acceptSection('painAndBlockers')}
              onRejectRefinement={() => rejectSection('painAndBlockers')}
            />
            <EditableSynthesisBlock
              sectionKey="decisionDynamics"
              label="DECISION DYNAMICS"
              content={synthesis.decisionDynamics}
              onSave={(content) => handleSynthesisSave('decisionDynamics', content)}
              pendingRefinement={pendingRefinements?.updatedSections?.decisionDynamics}
              onAcceptRefinement={() => acceptSection('decisionDynamics')}
              onRejectRefinement={() => rejectSection('decisionDynamics')}
            />
            <EditableSynthesisBlock
              sectionKey="strategicAssessment"
              label="STRATEGIC ASSESSMENT"
              content={synthesis.strategicAssessment}
              color={GOLD}
              onSave={(content) => handleSynthesisSave('strategicAssessment', content)}
              pendingRefinement={pendingRefinements?.updatedSections?.strategicAssessment}
              onAcceptRefinement={() => acceptSection('strategicAssessment')}
              onRejectRefinement={() => rejectSection('strategicAssessment')}
            />
            <EditableSynthesisBlock
              sectionKey="recommendedApproach"
              label="RECOMMENDED APPROACH"
              content={synthesis.recommendedApproach}
              color={GREEN}
              onSave={(content) => handleSynthesisSave('recommendedApproach', content)}
              pendingRefinement={pendingRefinements?.updatedSections?.recommendedApproach}
              onAcceptRefinement={() => acceptSection('recommendedApproach')}
              onRejectRefinement={() => rejectSection('recommendedApproach')}
            />

            {/* ── SCORE ASSESSMENTS ── */}
            <div>
              <p
                className="text-xs font-mono tracking-[0.2em] uppercase mb-3"
                style={{ color: GOLD }}
              >
                SUGGESTED SCORES
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(synthesis.scoreAssessments) as [string, EnrichmentScoreAssessment][]).map(
                  ([key, assessment]) => (
                    <EditableScoreCard
                      key={key}
                      scoreKey={key}
                      label={SCORE_LABELS[key as ScoreKey]?.long || key}
                      assessment={assessment}
                      onSave={(updated) => handleScoreSave(key, updated)}
                      pendingRefinement={pendingRefinements?.updatedScores?.[key]}
                      onAcceptRefinement={() => acceptScore(key)}
                      onRejectRefinement={() => rejectScore(key)}
                    />
                  )
                )}
              </div>
            </div>
          </>
        )}

        {/* ── OPERATIONAL EXTRACTIONS (collapsible) ── */}
        <div>
          <button
            onClick={() => setShowOps(!showOps)}
            className="text-xs font-mono tracking-[0.2em] uppercase flex items-center gap-2"
            style={{ color: TEXT_DIM }}
          >
            OPERATIONAL DETAILS — {extraction.recommendations.length} extractions
            <span>{showOps ? '▲' : '▼'}</span>
          </button>
          {showOps && (
            <div className="mt-3 space-y-3">
              {extraction.recommendations.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  recommendation={rec}
                  isChecked={checkedRecommendations.has(idx)}
                  onToggle={() => onToggle(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 border-t"
        style={{
          background: BG_ELEVATED,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {error && (
          <p className="text-sm mb-3" style={{ color: RED }}>
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isCreating}
            className="px-4 py-2 rounded text-sm transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            ← Back
          </button>
          <button
            onClick={onCreate}
            disabled={isCreating}
            className="flex-1 py-2 px-4 rounded font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: GOLD, color: BG_PRIMARY }}
          >
            {isCreating ? 'Creating...' : 'Create Prospect'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RECOMMENDATION CARD
// ============================================================================

interface RecommendationCardProps {
  recommendation: PipelineRecommendation;
  isChecked: boolean;
  onToggle: () => void;
}

function RecommendationCard({
  recommendation,
  isChecked,
  onToggle,
}: RecommendationCardProps) {
  const { category, capturedText, suggestedValue, targetField, confidence } =
    recommendation;

  const categoryColor = CATEGORY_COLORS[category] || TEXT_MUTED;

  const confidenceColor = getConfidenceScoreColor(confidence);

  return (
    <div
      className="p-4 rounded-lg border transition-all cursor-pointer hover:border-white/20"
      style={{
        background: isChecked ? 'rgba(255, 255, 255, 0.03)' : BG_PRIMARY,
        borderColor: isChecked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      }}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="flex-shrink-0 mt-1">
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: isChecked ? GOLD : 'rgba(255, 255, 255, 0.2)',
              background: isChecked ? GOLD : 'transparent',
            }}
          >
            {isChecked && (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke={BG_PRIMARY}
                viewBox="0 0 24 24"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <p
            className="text-xs font-mono tracking-wider uppercase mb-2"
            style={{ color: categoryColor }}
          >
            {category.replace(/_/g, ' ')}
          </p>

          {/* Captured text */}
          <p className="text-base font-medium mb-1" style={{ color: TEXT_PRIMARY }}>
            {capturedText}
          </p>

          {/* Suggested value */}
          <p className="text-sm mb-2" style={{ color: TEXT_MUTED }}>
            {suggestedValue}
          </p>

          {/* Target field */}
          <p className="text-xs mb-2" style={{ color: TEXT_DIM }}>
            → {targetField}
          </p>

          {/* Confidence bar */}
          <div className="flex items-center gap-2">
            <div
              className="h-1 rounded-full flex-1"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${confidence * 100}%`,
                  background: confidenceColor,
                }}
              />
            </div>
            <p className="text-xs font-mono" style={{ color: TEXT_DIM }}>
              {Math.round(confidence * 100)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
