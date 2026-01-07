'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GOLD = '#d4a54a';

interface AdditionalContextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdditionalContextInput({
  value,
  onChange,
  placeholder = 'Add any thoughts, context, or nuance you want to capture...',
}: AdditionalContextInputProps) {
  const [isExpanded, setIsExpanded] = useState(value.length > 0);

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
        <span>Add additional context</span>
        {value.length > 0 && (
          <span className="text-xs text-zinc-500">({value.length} chars)</span>
        )}
      </button>

      {/* Expandable textarea */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className={`
                mt-3 w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg
                text-white text-sm placeholder-zinc-500
                focus:outline-none focus:border-[${GOLD}] focus:ring-1 focus:ring-[${GOLD}]/50
                resize-none transition-colors
              `}
              style={{
                // Use inline style for focus border color since Tailwind can't use variable
              }}
              onFocus={(e) => {
                e.target.style.borderColor = GOLD;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#3f3f46'; // zinc-700
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
