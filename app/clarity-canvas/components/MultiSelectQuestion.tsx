'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GOLD = '#d4a54a';

interface MultiSelectQuestionProps {
  question: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
}

export function MultiSelectQuestion({
  question,
  options,
  value,
  onChange,
  maxSelections,
}: MultiSelectQuestionProps) {
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      // Remove option
      onChange(value.filter((v) => v !== option));
    } else {
      // Add option (if under limit)
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if at limit
      }
      onChange([...value, option]);
    }
  };

  const isAtLimit = maxSelections !== undefined && value.length >= maxSelections;

  return (
    <div className="w-full">
      <p className="text-lg text-white mb-2 text-center">{question}</p>
      {maxSelections && (
        <p className="text-sm text-zinc-500 mb-6 text-center">
          Select up to {maxSelections} options ({value.length}/{maxSelections})
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {options.map((option, index) => {
          const isSelected = value.includes(option);
          const isDisabled = !isSelected && isAtLimit;

          return (
            <motion.button
              key={option}
              data-testid="question-option"
              onClick={() => !isDisabled && toggleOption(option)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={!isDisabled ? { scale: 1.02 } : undefined}
              whileTap={!isDisabled ? { scale: 0.98 } : undefined}
              disabled={isDisabled}
              className={`
                relative px-4 py-3 rounded-lg border transition-all duration-200
                ${
                  isSelected
                    ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                    : isDisabled
                      ? 'border-zinc-800 bg-zinc-900/30 opacity-50 cursor-not-allowed'
                      : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 cursor-pointer'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox indicator */}
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                    transition-colors duration-200
                    ${isSelected ? 'border-[#D4A84B] bg-[#D4A84B]' : 'border-zinc-600 bg-transparent'}
                  `}
                >
                  {isSelected && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </div>

                <span
                  className={`text-sm ${isSelected ? 'text-white' : 'text-zinc-400'}`}
                >
                  {option}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
