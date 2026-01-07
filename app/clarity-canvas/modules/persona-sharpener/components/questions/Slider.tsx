'use client';

import React, { useEffect } from 'react';
import type { Question } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

interface Props {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function Slider({ question, value, onChange, disabled }: Props) {
  const currentValue =
    typeof value === 'number' ? value : (question.defaultValue ?? 50);

  // Initialize with default value if no value set
  useEffect(() => {
    if (value === null || value === undefined) {
      onChange(question.defaultValue ?? 50);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">{question.min}</span>
        <span className="text-2xl font-display text-[#D4A84B]">
          {currentValue}
        </span>
        <span className="text-sm text-zinc-400">{question.max}</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-zinc-800"
        style={{
          background: `linear-gradient(to right, #D4A84B ${currentValue}%, #27272a ${currentValue}%)`,
        }}
      />
    </div>
  );
}
