'use client';

import { useState } from 'react';
import {
  GOLD,
  GREEN,
  BLUE,
  BG_ELEVATED,
  BG_PRIMARY,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';

interface PipelineRecommendation {
  capturedText: string;
  category: string;
  targetField: string;
  suggestedValue: string;
  confidence: number;
  sourceSnippet: string | null;
}

interface OperationalDetailsProps {
  recommendations: PipelineRecommendation[];
  nextAction: string | null;
  nextActionDate: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  onUpdateNextAction: (action: string, date?: Date) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  budget_signal: 'Budget',
  timeline_signal: 'Timeline',
  next_action: 'Action',
  contact_info: 'Contact',
  company_info: 'Company',
};

const CATEGORY_COLORS: Record<string, string> = {
  budget_signal: GOLD,
  timeline_signal: BLUE,
  next_action: GREEN,
};

export default function OperationalDetails({
  recommendations,
  nextAction,
  nextActionDate,
  contactName,
  contactEmail,
  contactPhone,
  onUpdateNextAction,
}: OperationalDetailsProps) {
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [editedAction, setEditedAction] = useState(nextAction || '');
  const [editedDate, setEditedDate] = useState(
    nextActionDate ? new Date(nextActionDate).toISOString().split('T')[0] : ''
  );

  // Filter to operational categories only
  const operationalRecs = recommendations.filter(
    (r) => ['budget_signal', 'timeline_signal', 'next_action'].includes(r.category)
  );

  function handleSaveAction() {
    onUpdateNextAction(editedAction, editedDate ? new Date(editedDate) : undefined);
    setIsEditingAction(false);
  }

  function handleCancelEdit() {
    setEditedAction(nextAction || '');
    setEditedDate(nextActionDate ? new Date(nextActionDate).toISOString().split('T')[0] : '');
    setIsEditingAction(false);
  }

  return (
    <div className="space-y-4">
      {/* Next Action */}
      <div>
        <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
          Next Action
        </p>
        {isEditingAction ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editedAction}
              onChange={(e) => setEditedAction(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: BG_ELEVATED, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.15)' }}
              placeholder="What's the next step?"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                className="px-2 py-1 rounded text-sm"
                style={{ background: BG_ELEVATED, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <button onClick={handleCancelEdit} className="px-2 py-1 rounded text-xs" style={{ color: TEXT_MUTED }}>
                Cancel
              </button>
              <button onClick={handleSaveAction} className="px-2 py-1 rounded text-xs" style={{ background: GOLD, color: BG_PRIMARY }}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingAction(true)}
            className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5 flex items-center justify-between"
            style={{ background: BG_ELEVATED }}
          >
            <span className="text-sm" style={{ color: nextAction ? TEXT_PRIMARY : TEXT_DIM }}>
              {nextAction || 'Click to add next action...'}
            </span>
            {nextActionDate && (
              <span className="text-xs font-mono" style={{ color: GOLD }}>
                📅 {new Date(nextActionDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Extracted Signals */}
      {operationalRecs.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
            Extracted Signals
          </p>
          <div className="space-y-1">
            {operationalRecs.map((rec, idx) => {
              const color = CATEGORY_COLORS[rec.category] || TEXT_MUTED;
              const label = CATEGORY_LABELS[rec.category] || rec.category;

              return (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="font-mono" style={{ color }}>
                    {label}:
                  </span>
                  <span style={{ color: TEXT_MUTED }}>
                    &quot;{rec.capturedText}&quot;
                  </span>
                  {rec.suggestedValue && (
                    <span style={{ color: TEXT_DIM }}>
                      → {rec.suggestedValue}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {(contactName || contactEmail || contactPhone) && (
        <div>
          <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
            Contact Info
          </p>
          <p className="text-sm" style={{ color: TEXT_MUTED }}>
            {[contactName, contactEmail, contactPhone].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}
