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

export function MultiSelect({ question, value, onChange, disabled }: Props) {
  const options = question.options || [];
  const maxSelections = question.maxSelections || options.length;
  const selectedValues = Array.isArray(value) ? (value as string[]) : [];

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    if (selectedValues.includes(optionValue)) {
      // Remove
      const newValues = selectedValues.filter((v) => v !== optionValue);
      onChange(newValues.length > 0 ? newValues : null);
    } else if (selectedValues.length < maxSelections) {
      // Add
      onChange([...selectedValues, optionValue]);
    }
  };

  const isAtMax = selectedValues.length >= maxSelections;

  return (
    <div className="space-y-3">
      {question.instruction && (
        <p className="text-sm text-zinc-500">{question.instruction}</p>
      )}

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const isDisabledOption = disabled || (isAtMax && !isSelected);

          return (
            <motion.button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              disabled={isDisabledOption}
              whileHover={isDisabledOption ? undefined : { scale: 1.01 }}
              whileTap={isDisabledOption ? undefined : { scale: 0.99 }}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                  : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
              } ${isDisabledOption ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-[#D4A84B] bg-[#D4A84B]' : 'border-zinc-600'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-white">{option.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-sm text-zinc-500">
        {selectedValues.length} of {maxSelections} selected
      </p>
    </div>
  );
}
