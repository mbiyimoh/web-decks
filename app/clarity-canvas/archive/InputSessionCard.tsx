'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Mic, FileText, Upload } from 'lucide-react';
import {
  GOLD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  BG_SURFACE,
} from '@/components/portal/design-tokens';
import type { InputSessionWithSources } from '@/lib/input-session/types';
import { truncate, formatDate, getInputTypeLabel } from '@/lib/input-session/utils';
import type { InputType } from '@prisma/client';

const INPUT_TYPE_ICONS: Record<InputType, typeof Mic> = {
  VOICE_TRANSCRIPT: Mic,
  TEXT_INPUT: FileText,
  FILE_UPLOAD: Upload,
};

interface InputSessionCardProps {
  session: InputSessionWithSources;
  highlightChunkId?: string | null;
}

export function InputSessionCard({
  session,
  highlightChunkId,
}: InputSessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check if this card should be highlighted (linked from a source citation)
  const shouldHighlight = Boolean(highlightChunkId);

  // Auto-expand and scroll when linked from a source citation
  useEffect(() => {
    if (shouldHighlight) {
      setExpanded(true);
      // Wait for expansion, then scroll to card
      const timer = setTimeout(() => {
        cardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldHighlight]);

  const Icon = INPUT_TYPE_ICONS[session.inputType];

  return (
    <div
      ref={cardRef}
      className="rounded-lg border"
      style={{
        background: BG_SURFACE,
        borderColor: shouldHighlight ? GOLD : 'rgba(255, 255, 255, 0.1)',
        boxShadow: shouldHighlight ? `0 0 0 1px ${GOLD}` : undefined,
      }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: GOLD }} />
            <span
              className="text-xs font-mono uppercase"
              style={{ color: GOLD }}
            >
              {getInputTypeLabel(session.inputType)}
            </span>
          </div>
          <span className="text-xs" style={{ color: TEXT_MUTED }}>
            {formatDate(session.capturedAt)}
          </span>
        </div>
        <h3 className="font-medium" style={{ color: TEXT_PRIMARY }}>
          {session.title}
        </h3>
      </div>

      {/* Content Preview */}
      <div
        className="px-4 py-3 border-t border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <p
          className="text-sm whitespace-pre-wrap"
          style={{ color: TEXT_MUTED }}
        >
          {expanded ? session.rawContent : truncate(session.rawContent, 200)}
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-xs" style={{ color: TEXT_MUTED }}>
          → Contributed to {session.fieldsPopulated} field
          {session.fieldsPopulated !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs hover:opacity-80"
          style={{ color: GOLD }}
        >
          {expanded ? 'Collapse' : 'Expand'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded: Show linked fields */}
      {expanded && session.fieldSources?.length > 0 && (
        <div
          className="px-4 pb-4 border-t"
          style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <p
            className="text-xs font-mono uppercase mt-3 mb-2"
            style={{ color: GOLD }}
          >
            Fields populated
          </p>
          <div className="space-y-1">
            {session.fieldSources.map((source) => (
              <div
                key={source.id}
                className="text-xs flex items-center gap-2"
                style={{ color: TEXT_MUTED }}
              >
                <span>•</span>
                <span>
                  {source.field.subsection.section.name} →{' '}
                  {source.field.subsection.name} → {source.field.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
