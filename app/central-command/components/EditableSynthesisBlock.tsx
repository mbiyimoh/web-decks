'use client';

import { useState, useRef, useEffect } from 'react';
import {
  GOLD,
  GREEN,
  BLUE,
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { Version } from '@/lib/central-command/utils';

// ============================================================================
// TYPES
// ============================================================================

interface EditableSynthesisBlockProps {
  label: string;
  sectionKey: string;
  content: string;
  versions?: Version[];
  color?: string;
  onSave: (content: string, source: 'manual' | 'refined') => void;
  pendingRefinement?: { refinedContent: string; changeSummary: string } | null;
  onAcceptRefinement?: () => void;
  onRejectRefinement?: () => void;
  /** Initial expanded state, defaults to true */
  defaultExpanded?: boolean;
  /** Callback when expanded state changes */
  onExpandChange?: (expanded: boolean) => void;
}

type BlockState = 'VIEW' | 'EDIT' | 'REFINING' | 'HISTORY';

// ============================================================================
// CONSTANTS
// ============================================================================

const SOURCE_COLORS: Record<Version['source'], string> = {
  generated: BLUE,
  manual: GOLD,
  refined: GREEN,
};

const SOURCE_LABELS: Record<Version['source'], string> = {
  generated: 'G',
  manual: 'M',
  refined: 'R',
};

// ============================================================================
// EDITABLE SYNTHESIS BLOCK
// ============================================================================

export default function EditableSynthesisBlock({
  label,
  sectionKey,
  content,
  versions = [],
  color,
  onSave,
  pendingRefinement,
  onAcceptRefinement,
  onRejectRefinement,
  defaultExpanded = true,
  onExpandChange,
}: EditableSynthesisBlockProps) {
  const [state, setState] = useState<BlockState>('VIEW');
  const [editValue, setEditValue] = useState(content);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refinedContent, setRefinedContent] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const refineInputRef = useRef<HTMLInputElement>(null);

  // Sync with defaultExpanded prop changes (for global toggle)
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  // When there's a pending global refinement, that takes priority
  const hasPending = !!pendingRefinement;

  // Force expanded when in EDIT/REFINING/HISTORY states or has pending refinement
  const shouldForceExpand = state !== 'VIEW' || hasPending;
  const isCollapsed = !isExpanded && !shouldForceExpand;

  // Helper to update expanded state and notify parent
  function setExpandedState(expanded: boolean) {
    setIsExpanded(expanded);
    onExpandChange?.(expanded);
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleEdit() {
    setEditValue(content);
    setState('EDIT');
  }

  function handleCancelEdit() {
    setEditValue(content);
    setState('VIEW');
  }

  function handleSaveEdit() {
    if (editValue.trim() !== content.trim()) {
      onSave(editValue.trim(), 'manual');
    }
    setState('VIEW');
  }

  async function handleRefineSubmit() {
    if (!refinePrompt.trim() || isRefining) return;

    setIsRefining(true);
    setState('REFINING');

    try {
      const res = await fetch('/api/central-command/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: content,
          prompt: refinePrompt,
          fieldName: sectionKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRefinedContent(data.refinedContent);
        setChangeSummary(data.changeSummary);
        setRefinePrompt('');
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
    onSave(refinedContent, 'refined');
    setRefinedContent('');
    setChangeSummary('');
    setState('VIEW');
  }

  function handleRejectLocalRefinement() {
    setRefinedContent('');
    setChangeSummary('');
    setState('VIEW');
  }

  function handleVersionClick(version: Version) {
    setSelectedVersion(version);
    setState('HISTORY');
  }

  function handleRestoreVersion() {
    if (selectedVersion) {
      onSave(selectedVersion.content, 'manual');
      setSelectedVersion(null);
      setState('VIEW');
    }
  }

  function handleCancelHistory() {
    setSelectedVersion(null);
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

  // Determine display content
  const displayContent =
    hasPending
      ? pendingRefinement!.refinedContent
      : state === 'HISTORY' && selectedVersion
      ? selectedVersion.content
      : state === 'REFINING' && refinedContent
      ? refinedContent
      : content;

  const isPreview =
    hasPending ||
    state === 'HISTORY' ||
    (state === 'REFINING' && refinedContent);

  // Collapsed view - show label, 2-line preview, and chevron
  if (isCollapsed) {
    return (
      <div
        className="cursor-pointer p-3 rounded-lg transition-colors hover:bg-white/5"
        onClick={() => setExpandedState(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setExpandedState(true);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={false}
        aria-label={`Expand ${label} section`}
      >
        {/* Label row with chevron */}
        <div className="flex items-center justify-between mb-1">
          <p
            className="text-xs font-mono tracking-[0.2em] uppercase"
            style={{ color: color || TEXT_DIM }}
          >
            {label}
          </p>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            style={{ color: TEXT_MUTED }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Preview text or empty state */}
        <p className="text-xs italic line-clamp-2" style={{ color: TEXT_DIM }}>
          {content ? (content.length > 150 ? content.slice(0, 150) + '...' : content) : 'No content yet...'}
        </p>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Label row with hover actions */}
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase"
          style={{ color: color || TEXT_DIM }}
        >
          {label}
        </p>

        {/* Hover-reveal action icons (only in VIEW state, no pending) */}
        {state === 'VIEW' && !hasPending && isHovered && (
          <div className="flex items-center gap-1">
            {/* Collapse button */}
            <button
              onClick={() => setExpandedState(false)}
              className="p-1 rounded transition-colors hover:bg-white/5"
              style={{ color: TEXT_MUTED }}
              title="Collapse section"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={handleEdit}
              className="p-1 rounded transition-colors hover:bg-white/5"
              style={{ color: TEXT_MUTED }}
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => refineInputRef.current?.focus()}
              className="p-1 rounded transition-colors hover:bg-white/5"
              style={{ color: TEXT_MUTED }}
              title="Refine with AI"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Pending refinement badge */}
      {hasPending && (
        <div
          className="text-xs font-mono px-2 py-1 rounded mb-2 inline-block"
          style={{ background: 'rgba(74, 222, 128, 0.1)', color: GREEN }}
        >
          {pendingRefinement!.changeSummary}
        </div>
      )}

      {/* Local refinement change summary */}
      {!hasPending && state === 'REFINING' && refinedContent && changeSummary && (
        <div
          className="text-xs font-mono px-2 py-1 rounded mb-2 inline-block"
          style={{ background: 'rgba(74, 222, 128, 0.1)', color: GREEN }}
        >
          {changeSummary}
        </div>
      )}

      {/* Content area */}
      {state === 'EDIT' ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full resize-none text-sm leading-relaxed focus:outline-none font-body rounded-lg p-3 border"
          style={{
            background: BG_ELEVATED,
            color: TEXT_PRIMARY,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            minHeight: '120px',
          }}
          autoFocus
        />
      ) : (
        <p
          className="text-sm leading-relaxed font-body"
          style={{
            color: isPreview ? TEXT_MUTED : TEXT_PRIMARY,
            fontStyle: isPreview ? 'italic' : 'normal',
            whiteSpace: 'pre-wrap',
          }}
        >
          {displayContent || (
            <span style={{ color: TEXT_DIM }}>No content yet...</span>
          )}
        </p>
      )}

      {/* Refine input (always visible in VIEW, hidden in EDIT/HISTORY) */}
      {state !== 'EDIT' && state !== 'HISTORY' && !hasPending && (
        <div className="mt-3 flex items-center gap-2">
          <input
            ref={refineInputRef}
            type="text"
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            onKeyDown={handleRefineKeyDown}
            placeholder="Refine with AI..."
            disabled={isRefining}
            className="flex-1 px-3 py-1.5 rounded text-xs focus:outline-none font-body border transition-colors"
            style={{
              background: BG_ELEVATED,
              color: TEXT_PRIMARY,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          <button
            onClick={handleRefineSubmit}
            disabled={!refinePrompt.trim() || isRefining}
            className="px-2 py-1.5 rounded text-xs transition-all disabled:opacity-30"
            style={{ color: TEXT_MUTED }}
            title="Submit"
          >
            {isRefining ? (
              <span className="animate-pulse">...</span>
            ) : (
              <span>&#9166;</span>
            )}
          </button>
        </div>
      )}

      {/* Action buttons */}
      {state === 'EDIT' && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleCancelEdit}
            className="px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-3 py-1.5 rounded text-xs transition-all"
            style={{ background: GOLD, color: BG_ELEVATED }}
          >
            Save
          </button>
        </div>
      )}

      {/* Local refinement accept/reject */}
      {!hasPending && state === 'REFINING' && refinedContent && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleRejectLocalRefinement}
            className="px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Reject
          </button>
          <button
            onClick={handleAcceptLocalRefinement}
            className="px-3 py-1.5 rounded text-xs transition-all"
            style={{ background: GREEN, color: BG_ELEVATED }}
          >
            Accept
          </button>
        </div>
      )}

      {/* Pending (global) refinement accept/reject */}
      {hasPending && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onRejectRefinement}
            className="px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Reject
          </button>
          <button
            onClick={onAcceptRefinement}
            className="px-3 py-1.5 rounded text-xs transition-all"
            style={{ background: GREEN, color: BG_ELEVATED }}
          >
            Accept
          </button>
        </div>
      )}

      {/* History restore/cancel */}
      {state === 'HISTORY' && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleCancelHistory}
            className="px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleRestoreVersion}
            className="px-3 py-1.5 rounded text-xs transition-all"
            style={{ background: BLUE, color: BG_ELEVATED }}
          >
            Restore
          </button>
        </div>
      )}

      {/* Version pills */}
      {versions.length > 0 && state !== 'EDIT' && !hasPending && (
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto">
          {versions.map((version) => {
            const isCurrentVersion = version.version === versions.length;
            const isSelectedVersion =
              state === 'HISTORY' && selectedVersion?.version === version.version;
            const sourceColor = SOURCE_COLORS[version.source];
            const sourceLabel = SOURCE_LABELS[version.source];

            return (
              <button
                key={version.version}
                onClick={() => handleVersionClick(version)}
                className="px-1.5 py-0.5 rounded-full text-[10px] font-mono transition-all hover:opacity-80 flex items-center gap-0.5 whitespace-nowrap"
                style={{
                  background: isSelectedVersion
                    ? sourceColor
                    : 'rgba(255, 255, 255, 0.05)',
                  color: isSelectedVersion ? BG_ELEVATED : sourceColor,
                  border: `1px solid ${sourceColor}`,
                }}
              >
                {isCurrentVersion && (
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: GOLD }}
                  />
                )}
                <span>
                  v{version.version}({sourceLabel})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
