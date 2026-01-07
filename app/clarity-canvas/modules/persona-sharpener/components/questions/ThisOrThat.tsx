'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Question } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

interface Props {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function ThisOrThat({ question, value, onChange, disabled }: Props) {
  const options = question.options || [];

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.01 }}
          whileTap={disabled ? undefined : { scale: 0.99 }}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            value === option.value
              ? 'border-[#D4A84B] bg-[#D4A84B]/10'
              : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                value === option.value
                  ? 'border-[#D4A84B]'
                  : 'border-zinc-600'
              }`}
            >
              {value === option.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4A84B]" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">{option.label}</p>
              {option.sublabel && (
                <p className="text-sm text-zinc-500">{option.sublabel}</p>
              )}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
