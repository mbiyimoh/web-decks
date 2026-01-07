'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { PersonaDisplay } from '@/lib/clarity-canvas/modules/persona-sharpener/types';
import type { PersonaInfo } from './types';

interface PersonaCompleteProps {
  completedPersona: PersonaDisplay;
  allPersonas: PersonaInfo[];
  onContinueToNext: (nextPersonaId: string) => void;
  onFinish: () => void;
}

export function PersonaComplete({
  completedPersona,
  allPersonas,
  onContinueToNext,
  onFinish,
}: PersonaCompleteProps) {
  const incompletePersonas = allPersonas.filter((p) => !p.isComplete);
  const nextPersona = incompletePersonas[0];
  const completedCount = allPersonas.filter((p) => p.isComplete).length;
  const isAllComplete = incompletePersonas.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 py-12"
    >
      <div className="max-w-lg text-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
        >
          <svg
            className="w-10 h-10 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-display text-white mb-3"
        >
          {isAllComplete ? 'All Personas Complete!' : `${completedPersona.archetype} Complete`}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-400 mb-8"
        >
          {isAllComplete
            ? `You've successfully completed ${allPersonas.length} persona${allPersonas.length > 1 ? 's' : ''}. Your profile is now fully enriched.`
            : `Great work! You've completed ${completedCount} of ${allPersonas.length} personas.`}
        </motion.p>

        {/* Progress indicator */}
        {!isAllComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              {allPersonas.map((persona, index) => (
                <div
                  key={persona.id}
                  className={`w-3 h-3 rounded-full ${
                    persona.isComplete
                      ? 'bg-green-500'
                      : index === completedCount
                        ? 'bg-[#D4A84B] animate-pulse'
                        : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-zinc-500">
              {completedCount} of {allPersonas.length} personas complete
            </p>
          </motion.div>
        )}

        {/* Next persona preview */}
        {nextPersona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 mb-6"
          >
            <p className="text-sm text-zinc-400 mb-2">Up next:</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4A84B]/20 flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{nextPersona.displayName}</p>
                <p className="text-sm text-zinc-500">
                  {Math.round(nextPersona.confidence * 100)}% confidence from brain dump
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          {nextPersona ? (
            <>
              <motion.button
                onClick={() => onContinueToNext(nextPersona.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-[#D4A84B] text-black font-medium rounded-xl hover:bg-[#e0b55c] transition-colors"
              >
                Continue to {nextPersona.displayName} →
              </motion.button>
              <button
                onClick={onFinish}
                className="w-full py-3 px-6 text-zinc-400 hover:text-white transition-colors"
              >
                Finish for now (come back later)
              </button>
            </>
          ) : (
            <motion.button
              onClick={onFinish}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 bg-[#D4A84B] text-black font-medium rounded-xl hover:bg-[#e0b55c] transition-colors"
            >
              View Your Personas →
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
