'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ValidationSessionSummary } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';
import { calculateAlignment } from '@/lib/clarity-canvas/modules/persona-sharpener/alignment-calculator';
import { formatResponseValue } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';

interface SessionResponse {
  questionId: string;
  questionText: string;
  founderValue: unknown;
  validatorValue: unknown;
}

interface Props {
  session: ValidationSessionSummary;
  responses: SessionResponse[];
  onClose: () => void;
}

export function ValidationSessionDetail({ session, responses, onClose }: Props) {
  const respondentName = session.respondentName || 'Anonymous Respondent';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-zinc-900/95 border border-zinc-800 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-display text-white">{respondentName}</h3>
            <p className="text-sm text-zinc-400">{responses.length} responses - {session.status}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {responses.map((response, index) => {
            const alignment = calculateAlignment(response.questionId, response.founderValue, response.validatorValue);

            return (
              <motion.div
                key={response.questionId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-zinc-800/50 rounded-lg p-4"
              >
                <p className="text-sm text-zinc-300 mb-3">{response.questionText}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#D4A84B] mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#D4A84B]" />Your Assumption
                    </p>
                    <p className="text-sm text-zinc-200">{formatResponseValue(response.founderValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4ADE80] mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />Their Response
                    </p>
                    <p className="text-sm text-zinc-200">{formatResponseValue(response.validatorValue)}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-700 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{alignment.explanation}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: alignment.matchType === 'exact' ? '#4ADE8020' : alignment.matchType === 'partial' ? '#D4A84B20' : '#f8717120',
                      color: alignment.matchType === 'exact' ? '#4ADE80' : alignment.matchType === 'partial' ? '#D4A84B' : '#f87171',
                    }}
                  >
                    {alignment.score}% match
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
