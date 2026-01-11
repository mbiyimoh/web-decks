'use client';

/**
 * By Session View
 *
 * Shows validation responses organized by session, allowing founders
 * to see individual respondent journeys.
 */

import { motion } from 'framer-motion';
import type {
  ValidationSessionSummary,
  ValidationResponseBySession,
} from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import { formatResponseValue, formatRelativeDate } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

interface Props {
  sessions: ValidationSessionSummary[];
  responses: ValidationResponseBySession[];
  onSelectSession?: (sessionId: string) => void;
}

export function ValidationBySessionView({
  sessions,
  responses,
  onSelectSession,
}: Props) {
  // Filter to only completed sessions
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  if (completedSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">👥</span>
        <h3 className="text-xl font-display text-white mb-2">
          No Completed Sessions Yet
        </h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Responses will appear here once people complete the validation
          questionnaire.
        </p>
        {sessions.length > 0 && (
          <p className="text-zinc-500 text-sm mt-4">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} in progress
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedSessions.map((session, idx) => {
        const sessionResponses = responses.find(
          (r) => r.session.id === session.id
        );

        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelectSession?.(session.id)}
            className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 ${
              onSelectSession ? 'cursor-pointer hover:border-zinc-700 transition-colors' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Session info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-display text-white">
                    {session.respondentName || session.respondentEmail || `Response #${idx + 1}`}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete
                  </span>
                </div>

                {session.respondentEmail && session.respondentName && (
                  <p className="text-zinc-500 text-sm mb-2">{session.respondentEmail}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span>
                    {session.questionsAnswered} answered
                    {session.questionsSkipped > 0 && (
                      <span className="text-zinc-600">
                        , {session.questionsSkipped} skipped
                      </span>
                    )}
                  </span>
                  <span>•</span>
                  <span>
                    {session.completedAt
                      ? formatRelativeDate(new Date(session.completedAt))
                      : formatRelativeDate(new Date(session.startedAt))}
                  </span>
                </div>
              </div>

              {/* Arrow indicator */}
              {onSelectSession && (
                <svg
                  className="w-5 h-5 text-zinc-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>

            {/* Preview of responses (collapsed view) */}
            {sessionResponses && sessionResponses.responses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
                  Response Preview
                </p>
                <div className="space-y-2">
                  {sessionResponses.responses.slice(0, 3).map((response) => {
                    const question = questionSequence.find(
                      (q) => q.id === response.questionId
                    );
                    if (!question) return null;

                    const isMatch =
                      response.founderAssumption &&
                      JSON.stringify(response.value) ===
                        JSON.stringify(response.founderAssumption.value);

                    return (
                      <div
                        key={response.questionId}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isMatch ? 'bg-green-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-zinc-500 truncate flex-1">
                          {question.category}:
                        </span>
                        <span className="text-zinc-300 truncate">
                          {formatResponseValue(response.value, true)}
                        </span>
                      </div>
                    );
                  })}
                  {sessionResponses.responses.length > 3 && (
                    <p className="text-zinc-600 text-xs">
                      +{sessionResponses.responses.length - 3} more responses
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* In-progress sessions indicator */}
      {sessions.length > completedSessions.length && (
        <div className="text-center py-4 text-zinc-500 text-sm">
          {sessions.length - completedSessions.length} session
          {sessions.length - completedSessions.length !== 1 ? 's' : ''} still in progress
        </div>
      )}
    </div>
  );
}
