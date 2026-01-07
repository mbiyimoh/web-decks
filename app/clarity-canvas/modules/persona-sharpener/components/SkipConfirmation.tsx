'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SkipConfirmationProps {
  confirmationPrompt: string;
  skippedValue: string;
  onConfirm: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}

export function SkipConfirmation({
  confirmationPrompt,
  skippedValue,
  onConfirm,
  onEdit,
  isLoading = false,
}: SkipConfirmationProps) {
  const [showEditHint, setShowEditHint] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* AI-detected context */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#D4A84B]/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-[#D4A84B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[#D4A84B] font-medium mb-1">
              From your brain dump
            </p>
            <p className="text-white text-lg">{confirmationPrompt}</p>
          </div>
        </div>

        {/* Extracted value display */}
        <div className="bg-zinc-900/50 rounded-lg p-4 mt-4">
          <p className="text-zinc-400 text-sm mb-1">We captured:</p>
          <p className="text-white font-medium">&ldquo;{skippedValue}&rdquo;</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          onClick={onConfirm}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-4 px-6 bg-[#D4A84B] text-black font-medium rounded-xl hover:bg-[#e0b55c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg
                className="w-5 h-5"
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
              Yes, that feels right
            </>
          )}
        </motion.button>

        <motion.button
          onClick={() => {
            setShowEditHint(true);
            onEdit();
          }}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-4 px-6 bg-zinc-800 text-white font-medium rounded-xl border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Let me refine this
        </motion.button>
      </div>

      {/* Edit hint animation */}
      <AnimatePresence>
        {showEditHint && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-zinc-500 text-sm"
          >
            You can now answer this question yourself
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
