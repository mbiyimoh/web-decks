'use client';

/**
 * By Question View
 *
 * Shows validation responses organized by question, allowing founders
 * to compare their assumptions with real customer responses.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ValidationResponseByQuestion } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import { formatResponseValue } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

interface Props {
  responses: Record<string, ValidationResponseByQuestion>;
  focusedQuestionId?: string | null;
  onFocusHandled?: () => void;
}

export function ValidationByQuestionView({ responses, focusedQuestionId, onFocusHandled }: Props) {
  const questionIds = Object.keys(responses);

  // Scroll to focused question when navigating from "Needs Attention"
  useEffect(() => {
    if (focusedQuestionId) {
      const element = document.getElementById(`question-${focusedQuestionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Clear the focus after scrolling
        onFocusHandled?.();
      }
    }
  }, [focusedQuestionId, onFocusHandled]);

  if (questionIds.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">📊</span>
        <h3 className="text-xl font-display text-white mb-2">
          No Validation Responses Yet
        </h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Share your validation link with real potential customers to start
          collecting responses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questionIds.map((questionId) => {
        const data = responses[questionId];
        const question = questionSequence.find((q) => q.id === questionId);

        if (!question) return null;

        return (
          <motion.div
            key={questionId}
            id={`question-${questionId}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-zinc-900/50 border rounded-xl p-6 scroll-mt-4 ${
              focusedQuestionId === questionId
                ? 'border-[#D4A84B] ring-1 ring-[#D4A84B]/50'
                : 'border-zinc-800'
            }`}
          >
            {/* Question header */}
            <div className="mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1 block">
                {question.category}
              </span>
              <h3 className="text-lg font-display text-white">
                {question.question}
              </h3>
              {data.validationContextualizedText && (
                <p className="text-sm text-zinc-400 mt-2 italic">
                  Validators saw: &ldquo;{data.validationContextualizedText}&rdquo;
                </p>
              )}
            </div>

            {/* Founder assumption */}
            {data.founderAssumption && (
              <div className="mb-4 p-4 bg-[#D4A84B]/10 border border-[#D4A84B]/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#D4A84B]">
                    Your Assumption
                  </span>
                  {data.founderAssumption.isUnsure && (
                    <span className="text-xs text-amber-400">(Uncertain)</span>
                  )}
                </div>
                <p className="text-white">
                  {formatResponseValue(data.founderAssumption.value)}
                </p>
                {!data.founderAssumption.isUnsure && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {data.founderAssumption.confidence}% confidence
                  </p>
                )}
              </div>
            )}

            {/* Validation responses */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-green-400">
                Customer Responses ({data.validationResponses.length})
              </p>

              {data.validationResponses.length === 0 ? (
                <p className="text-zinc-500 text-sm italic">
                  No responses for this question yet
                </p>
              ) : (
                data.validationResponses.map((response, idx) => (
                  <div
                    key={`${response.sessionId}-${idx}`}
                    className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white">
                          {formatResponseValue(response.value)}
                        </p>
                        {response.additionalContext && (
                          <p className="text-zinc-400 text-sm mt-1 italic">
                            &ldquo;{response.additionalContext}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        {response.respondentName && (
                          <p className="text-zinc-400">{response.respondentName}</p>
                        )}
                        <p>{response.confidence}% confident</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comparison insight */}
            {data.founderAssumption &&
              data.validationResponses.length > 0 &&
              !data.founderAssumption.isUnsure && (
                <ComparisonInsight
                  founderValue={data.founderAssumption.value}
                  validationValues={data.validationResponses.map((r) => r.value)}
                />
              )}
          </motion.div>
        );
      })}
    </div>
  );
}

function ComparisonInsight({
  founderValue,
  validationValues,
}: {
  founderValue: unknown;
  validationValues: unknown[];
}) {
  // Simple comparison - check if founder's answer matches majority
  const founderStr = JSON.stringify(founderValue);
  const matchCount = validationValues.filter(
    (v) => JSON.stringify(v) === founderStr
  ).length;
  const matchPercent = Math.round((matchCount / validationValues.length) * 100);

  if (validationValues.length < 2) return null;

  let insightColor = 'text-zinc-400';
  let insightIcon = '📊';
  let insightText = '';

  if (matchPercent >= 70) {
    insightColor = 'text-green-400';
    insightIcon = '✓';
    insightText = `Strong alignment: ${matchPercent}% of responses match your assumption`;
  } else if (matchPercent >= 40) {
    insightColor = 'text-amber-400';
    insightIcon = '~';
    insightText = `Partial alignment: ${matchPercent}% of responses match your assumption`;
  } else {
    insightColor = 'text-red-400';
    insightIcon = '!';
    insightText = `Low alignment: Only ${matchPercent}% of responses match your assumption`;
  }

  return (
    <div className={`mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-sm ${insightColor}`}>
      <span>{insightIcon}</span>
      <span>{insightText}</span>
    </div>
  );
}
