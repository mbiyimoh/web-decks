'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PersonaSwitchModalProps {
  isOpen: boolean;
  currentPersonaName: string;
  targetPersonaName: string;
  currentProgress: number; // percentage 0-100
  totalQuestions: number;
  answeredQuestions: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PersonaSwitchModal({
  isOpen,
  currentPersonaName,
  targetPersonaName,
  currentProgress,
  totalQuestions,
  answeredQuestions,
  onConfirm,
  onCancel,
}: PersonaSwitchModalProps) {
  const remainingQuestions = totalQuestions - answeredQuestions;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-display text-white text-center mb-2">
                Switch Persona?
              </h3>

              {/* Progress Info */}
              <p className="text-zinc-400 text-center mb-4">
                You're {Math.round(currentProgress)}% through{' '}
                <span className="text-white font-medium">{currentPersonaName}</span>{' '}
                with <span className="text-amber-400">{remainingQuestions} questions</span> remaining.
              </p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#D4A84B]"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-zinc-500">
                  <span>{answeredQuestions} answered</span>
                  <span>{remainingQuestions} remaining</span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-zinc-300">
                  <span className="text-amber-400 font-medium">Tip:</span> Finishing{' '}
                  {currentPersonaName} first gives you the most accurate profile. Your progress will be saved if you switch.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Keep Going
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 px-4 bg-amber-500/20 text-amber-400 font-medium rounded-lg hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
                >
                  Switch to {targetPersonaName.split(' ').slice(0, 2).join(' ')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
