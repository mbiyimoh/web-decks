'use client';

import { motion } from 'framer-motion';
import type { ConfidenceLevel } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';
import { getConfidenceColor } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';

interface Props {
  level: ConfidenceLevel;
  currentResponses: number;
}

export function ConfidenceCallout({ level, currentResponses }: Props) {
  const color = getConfidenceColor(level.confidencePercent);
  const progressToNext = level.nextLevel
    ? Math.min(100, (currentResponses / level.nextLevel.responses) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: color + '20', color: color }}
        >
          {level.confidencePercent}% Confidence
        </div>

        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">{level.label}</h4>
          <p className="text-zinc-400 text-sm mt-1">{level.message}</p>

          {level.nextLevel && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-500">
                  {currentResponses}/{level.nextLevel.responses} responses
                </span>
                <span className="text-zinc-400">
                  → {level.nextLevel.confidence}% confidence
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: progressToNext + '%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
