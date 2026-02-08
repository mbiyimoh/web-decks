'use client';

import { useState, useRef } from 'react';
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

interface EditableFieldProps {
  label: string;
  fieldName: string;
  value: string;
  versions?: Version[];
  source?: string;
  multiline?: boolean;
  onSave: (value: string, source: 'manual' | 'refined') => void;
}

type FieldState = 'VIEW' | 'EDIT' | 'REFINING' | 'HISTORY';

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
// EDITABLE FIELD COMPONENT
// ============================================================================

export default function EditableField({
  label,
  fieldName,
  value,
  versions = [],
  source,
  multiline = false,
  onSave,
}: EditableFieldProps) {
  const [state, setState] = useState<FieldState>('VIEW');
  const [editValue, setEditValue] = useState(value);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refinedContent, setRefinedContent] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const refineInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleEdit() {
    setEditValue(value);
    setState('EDIT');
  }

  function handleCancelEdit() {
    setEditValue(value);
    setState('VIEW');
  }

  function handleSaveEdit() {
    if (editValue.trim() !== value.trim()) {
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
          currentContent: value,
          prompt: refinePrompt,
          fieldName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRefinedContent(data.refinedContent);
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

  function handleAcceptRefinement() {
    onSave(refinedContent, 'refined');
    setRefinedContent('');
    setState('VIEW');
  }

  function handleRejectRefinement() {
    setRefinedContent('');
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
  // RENDER HELPERS
  // ============================================================================

  function renderHeader() {
    return (
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase"
          style={{ color: GOLD }}
        >
          {label}
        </p>
        <div className="flex items-center gap-2">
          {state === 'VIEW' && (
            <>
              <button
                onClick={handleEdit}
                className="p-1.5 rounded transition-colors hover:bg-white/5"
                style={{ color: TEXT_MUTED }}
                title="Edit"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={() => refineInputRef.current?.focus()}
                className="p-1.5 rounded transition-colors hover:bg-white/5"
                style={{ color: TEXT_MUTED }}
                title="Refine with AI"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderBody() {
    const displayContent =
      state === 'HISTORY' && selectedVersion
        ? selectedVersion.content
        : state === 'REFINING' && refinedContent
        ? refinedContent
        : value;

    const isHistoryOrPreview =
      state === 'HISTORY' || (state === 'REFINING' && refinedContent);

    return (
      <div className="px-4 py-3">
        {state === 'EDIT' ? (
          multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full resize-none text-base leading-relaxed focus:outline-none font-body"
              style={{
                background: 'transparent',
                color: TEXT_PRIMARY,
                minHeight: '120px',
              }}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full text-base focus:outline-none font-body"
              style={{
                background: 'transparent',
                color: TEXT_PRIMARY,
              }}
              autoFocus
            />
          )
        ) : (
          <p
            className="text-base font-body whitespace-pre-wrap"
            style={{
              color: isHistoryOrPreview ? TEXT_MUTED : TEXT_PRIMARY,
              fontStyle: isHistoryOrPreview ? 'italic' : 'normal',
            }}
          >
            {displayContent || (
              <span style={{ color: TEXT_DIM }}>No content yet...</span>
            )}
          </p>
        )}
      </div>
    );
  }

  function renderRefineRow() {
    if (state === 'EDIT' || state === 'HISTORY') return null;

    return (
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="flex items-center gap-2">
          <input
            ref={refineInputRef}
            type="text"
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            onKeyDown={handleRefineKeyDown}
            placeholder="Refine with AI..."
            disabled={isRefining}
            className="flex-1 px-3 py-2 rounded text-sm focus:outline-none font-body border transition-colors"
            style={{
              background: BG_ELEVATED,
              color: TEXT_PRIMARY,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <button
            onClick={handleRefineSubmit}
            disabled={!refinePrompt.trim() || isRefining}
            className="px-3 py-2 rounded text-sm transition-all disabled:opacity-30"
            style={{ color: TEXT_MUTED }}
            title="Submit"
          >
            {isRefining ? (
              <span className="animate-pulse">...</span>
            ) : (
              <span>⏎</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  function renderFooter() {
    if (state === 'EDIT') {
      return (
        <div
          className="px-4 py-3 border-t flex items-center gap-2"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 rounded text-sm transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-4 py-2 rounded text-sm transition-all"
            style={{ background: GOLD, color: BG_ELEVATED }}
          >
            Save
          </button>
        </div>
      );
    }

    if (state === 'REFINING' && refinedContent) {
      return (
        <div
          className="px-4 py-3 border-t flex items-center gap-2"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <button
            onClick={handleRejectRefinement}
            className="px-4 py-2 rounded text-sm transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Reject
          </button>
          <button
            onClick={handleAcceptRefinement}
            className="px-4 py-2 rounded text-sm transition-all"
            style={{ background: GREEN, color: BG_ELEVATED }}
          >
            Accept
          </button>
        </div>
      );
    }

    if (state === 'HISTORY') {
      return (
        <div
          className="px-4 py-3 border-t flex items-center gap-2"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <button
            onClick={handleCancelHistory}
            className="px-4 py-2 rounded text-sm transition-colors hover:bg-white/5"
            style={{ color: TEXT_MUTED, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleRestoreVersion}
            className="px-4 py-2 rounded text-sm transition-all"
            style={{ background: BLUE, color: BG_ELEVATED }}
          >
            Restore
          </button>
        </div>
      );
    }

    return null;
  }

  function renderVersionPills() {
    if (!versions.length || state === 'EDIT') return null;

    return (
      <div
        className="px-4 py-3 border-t flex items-center gap-2 overflow-x-auto"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
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
              className="px-2 py-0.5 rounded-full text-xs font-mono transition-all hover:opacity-80 flex items-center gap-1 whitespace-nowrap"
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
                  className="w-1.5 h-1.5 rounded-full"
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
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        background: BG_ELEVATED,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {renderHeader()}
      {renderBody()}
      {renderRefineRow()}
      {renderVersionPills()}
      {renderFooter()}
    </div>
  );
}
