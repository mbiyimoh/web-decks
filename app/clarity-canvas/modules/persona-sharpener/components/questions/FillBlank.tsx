'use client';

import React, { useState, useEffect } from 'react';
import type { Question } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

interface Props {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function FillBlank({ question, value, onChange, disabled }: Props) {
  const blanks = question.blanks || [];
  const template = question.template || '';

  const [blankValues, setBlankValues] = useState<Record<string, string>>({});

  // Initialize from value if exists
  useEffect(() => {
    if (value && typeof value === 'object') {
      setBlankValues(value as Record<string, string>);
    }
  }, []);

  const handleBlankChange = (blankId: string, text: string) => {
    const newValues = { ...blankValues, [blankId]: text };
    setBlankValues(newValues);

    // Only emit if all blanks have values
    const allFilled = blanks.every((b) => newValues[b.id]?.trim());
    onChange(allFilled ? newValues : null);
  };

  // Parse template and render with inputs
  const renderTemplate = () => {
    const parts: React.ReactNode[] = [];
    let remaining = template;
    let key = 0;

    blanks.forEach((blank) => {
      const placeholder = `{${blank.id}}`;
      const index = remaining.indexOf(placeholder);

      if (index !== -1) {
        // Add text before blank
        if (index > 0) {
          parts.push(
            <span key={key++} className="text-zinc-300">
              {remaining.substring(0, index)}
            </span>
          );
        }

        // Add input for blank
        parts.push(
          <span key={key++} className="inline-block mx-1">
            <input
              type="text"
              value={blankValues[blank.id] || ''}
              onChange={(e) => handleBlankChange(blank.id, e.target.value)}
              placeholder={blank.placeholder}
              disabled={disabled}
              className="px-3 py-1 bg-zinc-800 border-b-2 border-[#D4A84B] text-white placeholder-zinc-600 focus:outline-none focus:border-[#e0b55c] min-w-[150px] disabled:opacity-50"
            />
            {blank.suggestions && blank.suggestions.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {blank.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleBlankChange(blank.id, suggestion)}
                    disabled={disabled}
                    className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded hover:bg-zinc-600 hover:text-white disabled:cursor-not-allowed"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </span>
        );

        remaining = remaining.substring(index + placeholder.length);
      }
    });

    // Add any remaining text
    if (remaining) {
      parts.push(
        <span key={key++} className="text-zinc-300">
          {remaining}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <p className="text-lg leading-relaxed">{renderTemplate()}</p>
    </div>
  );
}
