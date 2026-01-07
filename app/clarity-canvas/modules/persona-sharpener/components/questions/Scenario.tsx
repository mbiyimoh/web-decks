'use client';

import React from 'react';
import type { Question } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

interface Props {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function Scenario({ question, value, onChange, disabled }: Props) {
  const textValue = typeof value === 'string' ? value : '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text.trim() ? text : null);
  };

  return (
    <div className="space-y-2">
      <textarea
        value={textValue}
        onChange={handleChange}
        placeholder={question.placeholder}
        disabled={disabled}
        rows={4}
        className="w-full p-4 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-[#D4A84B] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {question.helperText && (
        <p className="text-sm text-zinc-500">{question.helperText}</p>
      )}
    </div>
  );
}
