'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GOLD,
  GREEN,
  BLUE,
  RED,
  RED_DIM,
  BG_PRIMARY,
  BG_SURFACE,
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { ProspectWithRecord, EnrichmentFindings, SynthesisVersions, PendingRefinements } from '@/lib/central-command/types';
import type { Version } from '@/lib/central-command/utils';
import { STAGES, formatCurrency, calculatePriority, buildSynthesisVersionUpdate } from '@/lib/central-command/utils';
import StageDots from './StageDots';
import EditableField from './EditableField';
import EditableSynthesisBlock from './EditableSynthesisBlock';
import SynthesisGlobalRefine from './SynthesisGlobalRefine';
import DecisionPanel from './DecisionPanel';
import StakeholdersSection from './StakeholdersSection';
import OperationalDetails from './OperationalDetails';
import ScoreAssessmentPanel from './ScoreAssessmentPanel';
import { RawInputTab } from './RawInputTab';
import type { DecisionBucket } from '@/lib/central-command/decision-templates';
import type { Stakeholder } from '@/lib/central-command/types';
import { getScoreFieldName } from '@/lib/central-command/score-display';
import type { RubricContent, ScoreDimension } from '@/lib/central-command/rubric';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseVersions(jsonValue: unknown): Version[] {
  if (!jsonValue || !Array.isArray(jsonValue)) {
    return [];
  }
  // Runtime validation - ensure each item has the required Version fields
  return jsonValue.filter(
    (item): item is Version =>
      typeof item === 'object' &&
      item !== null &&
      'version' in item &&
      'content' in item &&
      'source' in item &&
      'createdAt' in item
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ClientDetailModalProps {
  prospect: ProspectWithRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ClientDetailModal({
  prospect,
  isOpen,
  onClose,
  onUpdate,
}: ClientDetailModalProps) {
  const [isAdvancingStage, setIsAdvancingStage] = useState(false);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [isClosingDeal, setIsClosingDeal] = useState(false);
  const [closedReason, setClosedReason] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [showTextDumpInput, setShowTextDumpInput] = useState(false);
  const [textDumpContent, setTextDumpContent] = useState('');
  const [pendingRefinements, setPendingRefinements] = useState<
    Record<string, { refinedContent: string; changeSummary: string }> | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allSectionsExpanded, setAllSectionsExpanded] = useState(true);
  const [rubrics, setRubrics] = useState<Record<ScoreDimension, { content: RubricContent; version: number }> | null>(null);

  // Handle escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowStageDropdown(false);
      setIsClosingDeal(false);
      setClosedReason('');
      setLessonsLearned('');
      setShowTextDumpInput(false);
      setTextDumpContent('');
      setPendingRefinements(null);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Fetch rubrics when modal opens
  useEffect(() => {
    if (isOpen && !rubrics) {
      fetch('/api/central-command/rubric')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.rubrics) {
            setRubrics(data.rubrics);
          }
        })
        .catch((err) => console.error('Failed to fetch rubrics:', err));
    }
  }, [isOpen, rubrics]);

  if (!prospect || !isOpen) return null;

  const record = prospect.pipelineRecord;
  if (!record) return null;

  const currentStageIndex = record.stageIndex;
  const currentStage = STAGES[currentStageIndex];
  const daysInStage = Math.floor(
    (Date.now() - new Date(record.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const priority = calculatePriority({
    strategic: record.scoreStrategic,
    value: record.scoreValue,
    readiness: record.scoreReadiness,
    timeline: record.scoreTimeline,
    bandwidth: record.scoreBandwidth,
  });

  const enrichmentFindings =
    typeof prospect.enrichmentFindings === 'object' && prospect.enrichmentFindings
      ? (prospect.enrichmentFindings as EnrichmentFindings)
      : null;

  const synthesisVersions =
    typeof prospect.enrichmentFindingsVersions === 'object' && prospect.enrichmentFindingsVersions
      ? (prospect.enrichmentFindingsVersions as SynthesisVersions)
      : null;

  // ---- Synthesis refinement handlers ----

  function handleGlobalRefinement(results: PendingRefinements) {
    // ClientDetailModal currently only handles section refinements
    if (results.updatedSections) {
      setPendingRefinements(results.updatedSections);
    }
  }

  async function handleAcceptSection(key: string) {
    if (!pendingRefinements?.[key]) return;
    const { refinedContent } = pendingRefinements[key];
    await handleSynthesisSave(key, refinedContent, 'refined');
    const remaining = { ...pendingRefinements };
    delete remaining[key];
    setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
  }

  function handleRejectSection(key: string) {
    if (!pendingRefinements) return;
    const remaining = { ...pendingRefinements };
    delete remaining[key];
    setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
  }

  async function handleSynthesisSave(key: string, content: string, source: 'manual' | 'refined') {
    const newVersions = buildSynthesisVersionUpdate(synthesisVersions, key, content, source);
    await handleUpdate({
      enrichmentFindings: { [key]: content },
      enrichmentFindingsVersions: newVersions,
    });
  }

  async function handleUpdate(updates: Record<string, unknown>) {
    const res = await fetch(`/api/central-command/prospects/${prospect!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      onUpdate();
    }
  }

  async function handleAdvanceStage(newStageIndex: number) {
    setIsAdvancingStage(true);
    const newStage = STAGES[newStageIndex];
    await handleUpdate({
      currentStage: newStage.id,
      stageIndex: newStageIndex,
    });
    setShowStageDropdown(false);
    setIsAdvancingStage(false);
  }

  async function handleCloseDeal() {
    if (!closedReason.trim()) return;

    await handleUpdate({
      status: 'closed',
      closedAt: new Date().toISOString(),
      closedReason: closedReason.trim(),
      lessonsLearned: lessonsLearned.trim() || null,
    });
    setIsClosingDeal(false);
    onClose();
  }

  async function handleAddTextDump() {
    if (!textDumpContent.trim()) return;

    // TODO: Call extract API with context
    // For now, just append to notes
    const currentNotes = prospect!.notes || '';
    const newNotes = currentNotes
      ? `${currentNotes}\n\n--- Added ${new Date().toLocaleDateString()} ---\n${textDumpContent}`
      : textDumpContent;

    await handleUpdate({
      notes: newNotes,
      notesSource: 'manual',
    });

    setShowTextDumpInput(false);
    setTextDumpContent('');
  }

  // ---- Decision workflow handlers ----

  async function handleDecisionSave(bucket: DecisionBucket, notes: string) {
    await handleUpdate({
      decisionBucket: bucket,
      nextStepNotes: notes,
      decisionMadeAt: new Date().toISOString(),
    });
  }

  async function handleStakeholderEdit(index: number, updated: Stakeholder) {
    if (!enrichmentFindings?.stakeholders) return;
    const newStakeholders = [...enrichmentFindings.stakeholders];
    newStakeholders[index] = updated;
    await handleUpdate({
      enrichmentFindings: { ...enrichmentFindings, stakeholders: newStakeholders },
    });
  }

  async function handleStakeholderAdd(stakeholder: Stakeholder) {
    const currentStakeholders = enrichmentFindings?.stakeholders || [];
    const newStakeholders = [...currentStakeholders, stakeholder];
    await handleUpdate({
      enrichmentFindings: { ...enrichmentFindings, stakeholders: newStakeholders },
    });
  }

  async function handleNextActionUpdate(action: string, date?: Date) {
    await handleUpdate({
      nextAction: action,
      nextActionSource: 'manual',
      nextActionDate: date ? date.toISOString() : null,
    });
  }

  // ---- Score update with feedback (rubric learning loop) ----

  async function handleScoreUpdateWithFeedback(dimension: string, newScore: number, feedback: string) {
    const scoreField = getScoreFieldName(dimension);
    if (!scoreField) {
      console.error(`Invalid score dimension: ${dimension}`);
      return;
    }
    const originalScore = enrichmentFindings?.scoreAssessments?.[dimension]?.score ?? 5;

    // 1. Update the score on PipelineRecord
    await handleUpdate({ [scoreField]: newScore });

    // 2. Record feedback and potentially update rubric
    try {
      const res = await fetch('/api/central-command/rubric/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimension,
          prospectId: prospect!.id,
          originalScore,
          adjustedScore: newScore,
          feedback,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.rubricUpdated) {
          // Refresh rubrics to get latest version
          setRubrics(null); // Will trigger re-fetch
        }
      }
    } catch (err) {
      console.error('Failed to record rubric feedback:', err);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/central-command/prospects/${prospect!.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onClose();
        onUpdate(); // Refresh the list
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl rounded-xl overflow-hidden"
          style={{ background: BG_SURFACE, maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b flex items-start justify-between"
            style={{
              background: BG_ELEVATED,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div>
              <h2 className="font-display text-2xl mb-1" style={{ color: TEXT_PRIMARY }}>
                {prospect.name}
              </h2>
              {prospect.industry && (
                <p className="text-sm" style={{ color: TEXT_MUTED }}>
                  {prospect.industry}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-2xl hover:opacity-70 transition-opacity"
              style={{ color: TEXT_MUTED }}
            >
              ×
            </button>
          </div>

          {/* Stage & Priority Bar */}
          <div
            className="px-6 py-4 border-b"
            style={{
              background: BG_ELEVATED,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-mono uppercase" style={{ color: TEXT_DIM }}>
                    Stage:
                  </p>
                  <StageDots currentIndex={currentStageIndex} />
                  <p className="text-sm font-mono" style={{ color: TEXT_MUTED }}>
                    {currentStage.name}
                  </p>
                </div>
              </div>

              {/* Advance Stage Button */}
              <div className="relative">
                <button
                  onClick={() => setShowStageDropdown(!showStageDropdown)}
                  disabled={currentStageIndex >= STAGES.length - 1 || isAdvancingStage}
                  className="px-4 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{
                    background: GOLD,
                    color: BG_PRIMARY,
                  }}
                >
                  Advance →
                </button>

                {/* Stage Dropdown */}
                {showStageDropdown && (
                  <div
                    className="absolute right-0 mt-2 rounded-lg border overflow-hidden shadow-xl z-10"
                    style={{
                      background: BG_SURFACE,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      minWidth: '200px',
                    }}
                  >
                    {STAGES.slice(currentStageIndex + 1).map((stage, idx) => {
                      const stageIndex = currentStageIndex + 1 + idx;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleAdvanceStage(stageIndex)}
                          className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/5"
                          style={{ color: TEXT_PRIMARY }}
                        >
                          {stage.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-mono" style={{ color: TEXT_DIM }}>
                  Priority:
                </span>{' '}
                <span className="font-mono font-medium" style={{ color: GOLD }}>
                  {priority.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="font-mono" style={{ color: TEXT_DIM }}>
                  Days in Stage:
                </span>{' '}
                <span className="font-mono" style={{ color: TEXT_MUTED }}>
                  {daysInStage}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(90vh - 300px)' }}>
            {/* Contact Section */}
            <Section title="CONTACT">
              <div className="grid grid-cols-2 gap-4">
                <InlineEditField
                  label="Name"
                  value={prospect.contactName}
                  onSave={(value) => handleUpdate({ contactName: value })}
                />
                <InlineEditField
                  label="Role"
                  value={prospect.contactRole}
                  onSave={(value) => handleUpdate({ contactRole: value })}
                />
                <InlineEditField
                  label="Email"
                  value={prospect.contactEmail}
                  onSave={(value) => handleUpdate({ contactEmail: value })}
                />
                <InlineEditField
                  label="Phone"
                  value={prospect.contactPhone}
                  onSave={(value) => handleUpdate({ contactPhone: value })}
                />
                <InlineEditField
                  label="LinkedIn"
                  value={prospect.contactLinkedin}
                  onSave={(value) => handleUpdate({ contactLinkedin: value })}
                  className="col-span-2"
                />
              </div>
            </Section>

            {/* Scores Section */}
            <Section title="SCORES">
              <div className="flex items-center gap-4 flex-wrap">
                <ScoreInput
                  label="Strategic"
                  value={record.scoreStrategic}
                  onChange={(value) => handleUpdate({ scoreStrategic: value })}
                />
                <ScoreInput
                  label="Value"
                  value={record.scoreValue}
                  onChange={(value) => handleUpdate({ scoreValue: value })}
                />
                <ScoreInput
                  label="Readiness"
                  value={record.scoreReadiness}
                  onChange={(value) => handleUpdate({ scoreReadiness: value })}
                />
                <ScoreInput
                  label="Timeline"
                  value={record.scoreTimeline}
                  onChange={(value) => handleUpdate({ scoreTimeline: value })}
                />
                <ScoreInput
                  label="Bandwidth"
                  value={record.scoreBandwidth}
                  onChange={(value) => handleUpdate({ scoreBandwidth: value })}
                />
              </div>
            </Section>

            {/* Notes Section */}
            <Section title="NOTES">
              <EditableField
                label=""
                fieldName="notes"
                value={prospect.notes || ''}
                versions={parseVersions(prospect.notesVersions)}
                source={prospect.notesSource || 'manual'}
                multiline
                onSave={(newValue, source) =>
                  handleUpdate({ notes: newValue, notesSource: source })
                }
              />
            </Section>

            {/* Raw Input Archive Section */}
            <Section title="RAW INPUT">
              <RawInputTab
                prospectId={prospect.id}
                prospectName={prospect.name}
                legacyRawInputText={prospect.rawInputText}
              />
            </Section>

            {/* Next Action Section */}
            <Section title="NEXT ACTION">
              <EditableField
                label=""
                fieldName="nextAction"
                value={record.nextAction || ''}
                versions={parseVersions(record.nextActionVersions)}
                source={record.nextActionSource || 'manual'}
                multiline
                onSave={(newValue, source) =>
                  handleUpdate({ nextAction: newValue, nextActionSource: source })
                }
              />
            </Section>

            {/* Client Intelligence Section */}
            {enrichmentFindings && (
              <Section
                title="CLIENT INTELLIGENCE"
                headerRight={
                  <div className="flex items-center gap-2">
                    {/* Expand/Collapse All Toggle */}
                    <button
                      onClick={() => setAllSectionsExpanded(!allSectionsExpanded)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
                      style={{ color: TEXT_MUTED }}
                      title={allSectionsExpanded ? 'Collapse all sections' : 'Expand all sections'}
                    >
                      <svg
                        className="w-3.5 h-3.5 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        style={{ transform: allSectionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="font-mono">{allSectionsExpanded ? 'Collapse' : 'Expand'}</span>
                    </button>
                    <SynthesisGlobalRefine
                      currentSynthesis={enrichmentFindings}
                      onRefinementComplete={handleGlobalRefinement}
                    />
                  </div>
                }
              >
                <div className="space-y-5">
                  <EditableSynthesisBlock
                    key={`companyOverview-${allSectionsExpanded}`}
                    label="Company Overview"
                    sectionKey="companyOverview"
                    content={enrichmentFindings.companyOverview || ''}
                    versions={parseVersions(synthesisVersions?.companyOverview)}
                    defaultExpanded={allSectionsExpanded}
                    onSave={(content, source) => handleSynthesisSave('companyOverview', content, source)}
                    pendingRefinement={pendingRefinements?.companyOverview}
                    onAcceptRefinement={() => handleAcceptSection('companyOverview')}
                    onRejectRefinement={() => handleRejectSection('companyOverview')}
                  />
                  <EditableSynthesisBlock
                    key={`goalsAndVision-${allSectionsExpanded}`}
                    label="Goals & Vision"
                    sectionKey="goalsAndVision"
                    content={enrichmentFindings.goalsAndVision || ''}
                    versions={parseVersions(synthesisVersions?.goalsAndVision)}
                    defaultExpanded={allSectionsExpanded}
                    onSave={(content, source) => handleSynthesisSave('goalsAndVision', content, source)}
                    pendingRefinement={pendingRefinements?.goalsAndVision}
                    onAcceptRefinement={() => handleAcceptSection('goalsAndVision')}
                    onRejectRefinement={() => handleRejectSection('goalsAndVision')}
                  />
                  <EditableSynthesisBlock
                    key={`painAndBlockers-${allSectionsExpanded}`}
                    label="Pain Points & Blockers"
                    sectionKey="painAndBlockers"
                    content={enrichmentFindings.painAndBlockers || ''}
                    versions={parseVersions(synthesisVersions?.painAndBlockers)}
                    defaultExpanded={allSectionsExpanded}
                    onSave={(content, source) => handleSynthesisSave('painAndBlockers', content, source)}
                    pendingRefinement={pendingRefinements?.painAndBlockers}
                    onAcceptRefinement={() => handleAcceptSection('painAndBlockers')}
                    onRejectRefinement={() => handleRejectSection('painAndBlockers')}
                  />
                  <EditableSynthesisBlock
                    key={`decisionDynamics-${allSectionsExpanded}`}
                    label="Decision Dynamics"
                    sectionKey="decisionDynamics"
                    content={enrichmentFindings.decisionDynamics || ''}
                    versions={parseVersions(synthesisVersions?.decisionDynamics)}
                    defaultExpanded={allSectionsExpanded}
                    onSave={(content, source) => handleSynthesisSave('decisionDynamics', content, source)}
                    pendingRefinement={pendingRefinements?.decisionDynamics}
                    onAcceptRefinement={() => handleAcceptSection('decisionDynamics')}
                    onRejectRefinement={() => handleRejectSection('decisionDynamics')}
                  />
                  <EditableSynthesisBlock
                    key={`strategicAssessment-${allSectionsExpanded}`}
                    label="Strategic Assessment"
                    sectionKey="strategicAssessment"
                    content={enrichmentFindings.strategicAssessment || ''}
                    versions={parseVersions(synthesisVersions?.strategicAssessment)}
                    color={GOLD}
                    defaultExpanded={allSectionsExpanded}
                    onSave={(content, source) => handleSynthesisSave('strategicAssessment', content, source)}
                    pendingRefinement={pendingRefinements?.strategicAssessment}
                    onAcceptRefinement={() => handleAcceptSection('strategicAssessment')}
                    onRejectRefinement={() => handleRejectSection('strategicAssessment')}
                  />
                  <EditableSynthesisBlock
                    key={`recommendedApproach-${allSectionsExpanded}`}
                    label="Recommended Approach"
                    sectionKey="recommendedApproach"
                    content={enrichmentFindings.recommendedApproach || ''}
                    versions={parseVersions(synthesisVersions?.recommendedApproach)}
                    color={GREEN}
                    defaultExpanded={allSectionsExpanded}
                    onSave={(content, source) => handleSynthesisSave('recommendedApproach', content, source)}
                    pendingRefinement={pendingRefinements?.recommendedApproach}
                    onAcceptRefinement={() => handleAcceptSection('recommendedApproach')}
                    onRejectRefinement={() => handleRejectSection('recommendedApproach')}
                  />
                </div>
              </Section>
            )}

            {/* Stakeholders Section */}
            {enrichmentFindings && (
              <Section title="STAKEHOLDERS">
                <StakeholdersSection
                  stakeholders={enrichmentFindings.stakeholders || []}
                  onEdit={handleStakeholderEdit}
                  onAdd={handleStakeholderAdd}
                />
              </Section>
            )}

            {/* Score Assessment Section - with rubric learning loop */}
            {enrichmentFindings?.scoreAssessments && rubrics && (
              <Section title="SCORE ASSESSMENT">
                <ScoreAssessmentPanel
                  prospectId={prospect.id}
                  scoreAssessments={enrichmentFindings.scoreAssessments}
                  rubrics={rubrics}
                  onScoreUpdate={handleScoreUpdateWithFeedback}
                />
              </Section>
            )}

            {/* Pursuit Decision Section */}
            <Section title="PURSUIT DECISION">
              <DecisionPanel
                currentBucket={(record.decisionBucket as DecisionBucket) || null}
                currentNotes={record.nextStepNotes || ''}
                decisionMadeAt={record.decisionMadeAt ? record.decisionMadeAt.toISOString() : null}
                synthesis={enrichmentFindings}
                onSave={handleDecisionSave}
              />
            </Section>

            {/* Operational Details Section */}
            <Section title="OPERATIONAL DETAILS">
              <OperationalDetails
                recommendations={[]}
                nextAction={record.nextAction}
                nextActionDate={record.nextActionDate}
                contactName={prospect.contactName}
                contactEmail={prospect.contactEmail}
                contactPhone={prospect.contactPhone}
                onUpdateNextAction={handleNextActionUpdate}
              />
            </Section>

            {prospect.enrichmentSuggestedActions &&
              prospect.enrichmentSuggestedActions.length > 0 && (
                <Section title="SUGGESTED APPROACH">
                  <ul className="space-y-1">
                    {prospect.enrichmentSuggestedActions.map((action, idx) => (
                      <li key={idx} className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
          </div>

          {/* Footer Actions */}
          <div
            className="px-6 py-4 border-t flex gap-3"
            style={{
              background: BG_ELEVATED,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {!isClosingDeal && !showTextDumpInput && !showDeleteConfirm && (
              <>
                <button
                  onClick={() => setShowTextDumpInput(true)}
                  className="px-4 py-2 rounded text-sm transition-colors hover:bg-white/5"
                  style={{
                    color: TEXT_MUTED,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Add Text Dump
                </button>
                <button
                  onClick={() => setIsClosingDeal(true)}
                  className="px-4 py-2 rounded text-sm transition-colors hover:opacity-90"
                  style={{
                    background: RED_DIM,
                    color: RED,
                    border: `1px solid ${RED}`,
                  }}
                >
                  Close Deal
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded text-sm transition-colors hover:opacity-90 ml-auto"
                  style={{
                    color: TEXT_DIM,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Delete
                </button>
              </>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="flex-1 flex items-center gap-4">
                <span className="text-sm" style={{ color: RED }}>
                  Permanently delete this prospect?
                </span>
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-1.5 rounded text-sm transition-colors hover:bg-white/5"
                    style={{
                      color: TEXT_MUTED,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-1.5 rounded text-sm transition-all disabled:opacity-50"
                    style={{
                      background: RED,
                      color: '#fff',
                    }}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}

            {/* Text Dump Input */}
            {showTextDumpInput && (
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={textDumpContent}
                  onChange={(e) => setTextDumpContent(e.target.value)}
                  placeholder="Paste additional notes, context, or updates..."
                  autoFocus
                  className="w-full px-3 py-2 rounded text-sm resize-none font-body"
                  style={{
                    background: BG_PRIMARY,
                    color: TEXT_PRIMARY,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minHeight: '100px',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowTextDumpInput(false);
                      setTextDumpContent('');
                    }}
                    className="px-4 py-1.5 rounded text-sm transition-colors hover:bg-white/5"
                    style={{
                      color: TEXT_MUTED,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTextDump}
                    disabled={!textDumpContent.trim()}
                    className="px-4 py-1.5 rounded text-sm transition-all disabled:opacity-50"
                    style={{
                      background: GOLD,
                      color: BG_PRIMARY,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Close Deal Form */}
            {isClosingDeal && (
              <div className="flex-1 flex flex-col gap-3">
                <input
                  type="text"
                  value={closedReason}
                  onChange={(e) => setClosedReason(e.target.value)}
                  placeholder="Reason for closing (required)"
                  autoFocus
                  className="w-full px-3 py-2 rounded text-sm font-body"
                  style={{
                    background: BG_PRIMARY,
                    color: TEXT_PRIMARY,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
                <textarea
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="Lessons learned (optional)"
                  className="w-full px-3 py-2 rounded text-sm resize-none font-body"
                  style={{
                    background: BG_PRIMARY,
                    color: TEXT_PRIMARY,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minHeight: '80px',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsClosingDeal(false);
                      setClosedReason('');
                      setLessonsLearned('');
                    }}
                    className="px-4 py-1.5 rounded text-sm transition-colors hover:bg-white/5"
                    style={{
                      color: TEXT_MUTED,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseDeal}
                    disabled={!closedReason.trim()}
                    className="px-4 py-1.5 rounded text-sm transition-all disabled:opacity-50"
                    style={{
                      background: RED,
                      color: BG_PRIMARY,
                    }}
                  >
                    Confirm Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Section({ title, headerRight, children }: { title: string; headerRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase"
          style={{ color: GOLD }}
        >
          {title}
        </p>
        {headerRight}
      </div>
      {children}
    </div>
  );
}


interface InlineEditFieldProps {
  label: string;
  value?: string | null;
  onSave: (value: string) => void;
  className?: string;
}

function InlineEditField({ label, value, onSave, className }: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  function handleSave() {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  }

  return (
    <div className={className}>
      <p className="text-xs mb-1" style={{ color: TEXT_DIM }}>
        {label}
      </p>
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-2 py-1 rounded text-sm font-body"
          style={{
            background: BG_PRIMARY,
            color: TEXT_PRIMARY,
            border: `1px solid ${GOLD}`,
          }}
        />
      ) : (
        <button
          onClick={() => {
            setEditValue(value || '');
            setIsEditing(true);
          }}
          className="w-full text-left px-2 py-1 rounded text-sm transition-colors hover:bg-white/5"
          style={{
            color: value ? TEXT_PRIMARY : TEXT_DIM,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {value || `Add ${label.toLowerCase()}...`}
        </button>
      )}
    </div>
  );
}

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function ScoreInput({ label, value, onChange }: ScoreInputProps) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: TEXT_DIM }}>
        {label}
      </p>
      <input
        type="number"
        min="1"
        max="10"
        value={value}
        onChange={(e) => {
          const newValue = parseInt(e.target.value, 10);
          if (newValue >= 1 && newValue <= 10) {
            onChange(newValue);
          }
        }}
        className="w-16 px-2 py-1 rounded text-sm font-mono text-center"
        style={{
          background: BG_PRIMARY,
          color: TEXT_PRIMARY,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      />
    </div>
  );
}

