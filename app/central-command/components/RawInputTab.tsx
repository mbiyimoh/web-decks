'use client';

import { useState, useEffect } from 'react';
import { Plus, Mic, FileText, Upload } from 'lucide-react';
import {
  GOLD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  BG_SURFACE,
  BG_ELEVATED,
} from '@/components/portal/design-tokens';
import { formatDate, getInputTypeLabel, truncate } from '@/lib/input-session/utils';
import type { InputSession, InputType } from '@prisma/client';
import { AddContextModal } from './AddContextModal';

const INPUT_TYPE_ICONS: Record<InputType, typeof Mic> = {
  VOICE_TRANSCRIPT: Mic,
  TEXT_INPUT: FileText,
  FILE_UPLOAD: Upload,
};

interface RawInputTabProps {
  prospectId: string;
  prospectName: string;
  legacyRawInputText?: string | null;
}

export function RawInputTab({
  prospectId,
  prospectName,
  legacyRawInputText,
}: RawInputTabProps) {
  const [sessions, setSessions] = useState<InputSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddContext, setShowAddContext] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [prospectId]);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/central-command/prospects/${prospectId}/sessions`
      );
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-mono uppercase tracking-[0.2em]"
          style={{ color: GOLD }}
        >
          Raw Input History
        </p>
        <button
          onClick={() => setShowAddContext(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs hover:opacity-80 transition-opacity"
          style={{
            background: 'rgba(212, 165, 74, 0.1)',
            color: GOLD,
            border: `1px solid ${GOLD}`,
          }}
        >
          <Plus size={14} />
          Add Context
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8" style={{ color: TEXT_MUTED }}>
          Loading...
        </div>
      ) : sessions.length === 0 ? (
        <div className="space-y-4">
          <p style={{ color: TEXT_MUTED }}>No input sessions recorded.</p>
          {/* Legacy fallback for existing prospects */}
          {legacyRawInputText && (
            <div>
              <p
                className="text-xs font-mono uppercase mb-2"
                style={{ color: GOLD }}
              >
                Legacy Raw Input
              </p>
              <div
                className="p-4 rounded-lg whitespace-pre-wrap text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: TEXT_MUTED,
                }}
              >
                {legacyRawInputText}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const Icon = INPUT_TYPE_ICONS[session.inputType];
            const isExpanded = expandedSession === session.id;

            return (
              <div
                key={session.id}
                className="rounded-lg border"
                style={{
                  background: BG_SURFACE,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
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
                  className="px-4 py-3 border-t"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <p
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: TEXT_MUTED }}
                  >
                    {isExpanded
                      ? session.rawContent
                      : truncate(session.rawContent, 200)}
                  </p>
                </div>

                {/* Footer */}
                {session.rawContent.length > 200 && (
                  <div
                    className="p-4 border-t"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <button
                      onClick={() =>
                        setExpandedSession(isExpanded ? null : session.id)
                      }
                      className="text-xs hover:opacity-80"
                      style={{ color: GOLD }}
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddContext && (
        <AddContextModal
          prospectId={prospectId}
          prospectName={prospectName}
          onClose={() => setShowAddContext(false)}
          onSuccess={() => {
            setShowAddContext(false);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
