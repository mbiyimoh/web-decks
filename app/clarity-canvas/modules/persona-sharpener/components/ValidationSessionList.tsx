'use client';

import { motion } from 'framer-motion';
import type { ValidationSessionSummary } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';
import { formatRelativeDate } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

interface Props {
  sessions: ValidationSessionSummary[];
  onSelectSession: (sessionId: string) => void;
  selectedSessionId: string | null;
}

export function ValidationSessionList({ sessions, onSelectSession, selectedSessionId }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: '#4ADE80', label: 'Completed' };
      case 'in_progress':
        return { color: '#D4A84B', label: 'In Progress' };
      case 'abandoned':
        return { color: '#f87171', label: 'Abandoned' };
      default:
        return { color: '#888888', label: status };
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-white font-medium mb-1">No Validation Sessions Yet</h3>
        <p className="text-zinc-400 text-sm">Share your validation link to start collecting responses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const statusBadge = getStatusBadge(session.status);
        const respondentName = session.respondentName || `Anonymous Respondent ${index + 1}`;
        const isSelected = session.id === selectedSessionId;

        return (
          <motion.button
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left bg-zinc-900/50 border rounded-xl p-4 transition-colors ${
              isSelected ? 'border-[#D4A84B] bg-[#D4A84B]/5' : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-sm text-zinc-400">{respondentName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{respondentName}</p>
                  <p className="text-zinc-500 text-xs">{formatRelativeDate(new Date(session.startedAt))}</p>
                </div>
              </div>
              <div
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: statusBadge.color + '20', color: statusBadge.color }}
              >
                {statusBadge.label}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>{session.questionsAnswered} questions answered</span>
              {session.questionsSkipped > 0 && (
                <span className="text-amber-500">{session.questionsSkipped} skipped</span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
