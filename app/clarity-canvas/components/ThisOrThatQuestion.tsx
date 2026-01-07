'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GOLD = '#d4a54a';

interface ThisOrThatQuestionProps {
  question: string;
  options: [string, string];
  value: string | null;
  onChange: (value: string) => void;
}

export function ThisOrThatQuestion({
  question,
  options,
  value,
  onChange,
}: ThisOrThatQuestionProps) {
  return (
    <div className="w-full">
      <p className="text-lg text-white mb-6 text-center">{question}</p>
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => {
          const isSelected = value === option;
          return (
            <motion.button
              key={option}
              data-testid="question-option"
              onClick={() => onChange(option)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                min-h-[120px] flex items-center justify-center text-center
                ${
                  isSelected
                    ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                }
              `}
              style={{
                boxShadow: isSelected ? `0 0 20px rgba(212, 168, 75, 0.2)` : undefined,
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: GOLD }}
                >
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
              <span
                className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}
              >
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
