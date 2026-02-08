'use client';

import { useState, useEffect } from 'react';
import {
  GOLD,
  RED,
  BG_ELEVATED,
  BG_PRIMARY,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import { DECISION_BUCKETS, type DecisionBucket } from '@/lib/central-command/decision-templates';
import type { EnrichmentFindings } from '@/lib/central-command/types';

interface DecisionPanelProps {
  currentBucket: DecisionBucket | null;
  currentNotes: string;
  decisionMadeAt: string | null;
  synthesis: EnrichmentFindings | null;
  onSave: (bucket: DecisionBucket, notes: string) => void;
}

export default function DecisionPanel({
  currentBucket,
  currentNotes,
  decisionMadeAt,
  onSave,
}: DecisionPanelProps) {
  const [selectedBucket, setSelectedBucket] = useState<DecisionBucket | null>(currentBucket);
  const [notes, setNotes] = useState(currentNotes);
  const [hasUserEdits, setHasUserEdits] = useState(false);
  const [showConfirmChange, setShowConfirmChange] = useState(false);
  const [pendingBucket, setPendingBucket] = useState<DecisionBucket | null>(null);

  // Sync with props
  useEffect(() => {
    setSelectedBucket(currentBucket);
    setNotes(currentNotes);
    setHasUserEdits(false);
  }, [currentBucket, currentNotes]);

  function handleBucketClick(bucket: DecisionBucket) {
    if (selectedBucket === bucket) return;

    if (hasUserEdits && notes.trim()) {
      setPendingBucket(bucket);
      setShowConfirmChange(true);
    } else {
      selectBucket(bucket);
    }
  }

  function selectBucket(bucket: DecisionBucket) {
    setSelectedBucket(bucket);
    setNotes(DECISION_BUCKETS[bucket].defaultTemplate);
    setHasUserEdits(false);
    setShowConfirmChange(false);
    setPendingBucket(null);
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    setHasUserEdits(true);
  }

  function handleSave() {
    if (selectedBucket) {
      onSave(selectedBucket, notes);
    }
  }

  function handleConfirmChange() {
    if (pendingBucket) {
      selectBucket(pendingBucket);
    }
  }

  function handleCancelChange() {
    setShowConfirmChange(false);
    setPendingBucket(null);
  }

  const bucketKeys = Object.keys(DECISION_BUCKETS) as DecisionBucket[];

  return (
    <div className="space-y-4">
      {/* Bucket buttons */}
      <div className="flex flex-wrap gap-2">
        {bucketKeys.map((key) => {
          const bucket = DECISION_BUCKETS[key];
          const isSelected = selectedBucket === key;

          return (
            <button
              key={key}
              onClick={() => handleBucketClick(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isSelected ? bucket.color : 'transparent',
                color: isSelected ? BG_PRIMARY : bucket.color,
                border: `1px solid ${bucket.color}`,
                opacity: isSelected ? 1 : 0.7,
              }}
              title={bucket.description}
            >
              {bucket.label}
            </button>
          );
        })}
      </div>

      {/* Change confirmation warning */}
      {showConfirmChange && pendingBucket && (
        <div
          className="p-3 rounded-lg flex items-center justify-between"
          style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)' }}
        >
          <p className="text-sm" style={{ color: RED }}>
            Changing bucket will replace your notes with the new template.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCancelChange}
              className="px-3 py-1 rounded text-xs"
              style={{ color: TEXT_MUTED }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChange}
              className="px-3 py-1 rounded text-xs"
              style={{ background: RED, color: '#fff' }}
            >
              Change Anyway
            </button>
          </div>
        </div>
      )}

      {/* Notes textarea */}
      {selectedBucket && (
        <div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="w-full resize-none text-sm leading-relaxed focus:outline-none font-body rounded-lg p-4 border"
            style={{
              background: BG_ELEVATED,
              color: TEXT_PRIMARY,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              minHeight: '200px',
            }}
            placeholder="Add your next steps and notes..."
          />
        </div>
      )}

      {/* Decision timestamp and save */}
      <div className="flex items-center justify-between">
        <div>
          {decisionMadeAt && (
            <p className="text-xs" style={{ color: TEXT_DIM }}>
              Decision made: {new Date(decisionMadeAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!selectedBucket}
          className="px-4 py-2 rounded text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: GOLD, color: BG_PRIMARY }}
        >
          Save Decision
        </button>
      </div>
    </div>
  );
}
