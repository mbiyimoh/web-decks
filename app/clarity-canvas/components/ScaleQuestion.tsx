'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GOLD = '#d4a54a';

interface ScaleQuestionProps {
  question: string;
  options: { value: number; label: string }[];
  value: number | null;
  onChange: (value: number) => void;
}

export function ScaleQuestion({
  question,
  options,
  value,
  onChange,
}: ScaleQuestionProps) {
  return (
    <div className="w-full">
      <p className="text-lg text-white mb-6 text-center">{question}</p>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = value === option.value;

          return (
            <motion.button
              key={option.value}
              data-testid="question-option"
              onClick={() => onChange(option.value)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-lg border
                transition-all duration-200 text-left
                ${
                  isSelected
                    ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                }
              `}
              style={{
                boxShadow: isSelected ? `0 0 15px rgba(212, 168, 75, 0.15)` : undefined,
              }}
            >
              {/* Number indicator */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  text-sm font-mono font-bold
                  transition-colors duration-200
                  ${
                    isSelected
                      ? 'bg-[#D4A84B] text-black'
                      : 'bg-zinc-800 text-zinc-500'
                  }
                `}
              >
                {option.value}
              </div>

              {/* Label */}
              <span
                className={`flex-1 ${isSelected ? 'text-white' : 'text-zinc-400'}`}
              >
                {option.label}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: GOLD }}
                >
                  <svg
                    className="w-3 h-3 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
