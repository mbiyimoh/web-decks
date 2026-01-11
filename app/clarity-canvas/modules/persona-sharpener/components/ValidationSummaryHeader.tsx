'use client';

import { motion } from 'framer-motion';
import type { ValidationSummary } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  summary: ValidationSummary;
  personaName: string;
}

export function ValidationSummaryHeader({ summary, personaName }: Props) {
  const getAlignmentColor = (score: number | null) => {
    if (score === null) return '#888888';
    if (score >= 70) return '#4ADE80';
    if (score >= 40) return '#D4A84B';
    return '#f87171';
  };

  const getAlignmentLabel = (score: number | null) => {
    if (score === null) return 'No Data';
    if (score >= 70) return 'Strong Match';
    if (score >= 40) return 'Partial Match';
    return 'Weak Match';
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-white">
        Validation Results for "{personaName}"
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Sessions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-display text-white">{summary.totalSessions}</p>
          <p className="text-xs text-zinc-500 mt-1">Sessions</p>
          {summary.inProgressSessions > 0 && (
            <p className="text-xs text-amber-500 mt-1">{summary.inProgressSessions} in progress</p>
          )}
        </div>

        {/* Responses */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-display text-white">{summary.totalResponses}</p>
          <p className="text-xs text-zinc-500 mt-1">Responses</p>
        </div>

        {/* Alignment */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-display" style={{ color: getAlignmentColor(summary.overallAlignmentScore) }}>
            {summary.overallAlignmentScore !== null ? summary.overallAlignmentScore + '%' : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Alignment</p>
          <p className="text-xs mt-1" style={{ color: getAlignmentColor(summary.overallAlignmentScore) }}>
            {getAlignmentLabel(summary.overallAlignmentScore)}
          </p>
        </div>

        {/* Questions Validated */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-display text-white">
            {summary.questionsWithResponses}/{summary.totalQuestions}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Questions Validated</p>
        </div>
      </motion.div>

      {/* Top Misalignments */}
      {summary.topMisalignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-sm font-medium text-red-400">Needs Attention</h3>
          </div>
          <ul className="space-y-2">
            {summary.topMisalignments.map(m => (
              <li key={m.questionId} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{m.questionText}</span>
                <span className="text-red-400">{m.alignmentScore}% ({m.responseCount} responses)</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
