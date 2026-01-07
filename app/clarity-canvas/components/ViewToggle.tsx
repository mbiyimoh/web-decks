'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type ViewMode = 'orbital' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ view, onChange, className = '' }: ViewToggleProps) {
  return (
    <div
      className={`inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 ${className}`}
    >
      <button
        onClick={() => onChange('orbital')}
        className={`
          relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors
          ${view === 'orbital' ? 'text-black' : 'text-zinc-400 hover:text-white'}
        `}
      >
        {view === 'orbital' && (
          <motion.div
            layoutId="viewToggleBg"
            className="absolute inset-0 bg-[#D4A84B] rounded-md"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" strokeDasharray="4 4" />
          </svg>
          Orbital
        </span>
      </button>

      <button
        onClick={() => onChange('list')}
        className={`
          relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors
          ${view === 'list' ? 'text-black' : 'text-zinc-400 hover:text-white'}
        `}
      >
        {view === 'list' && (
          <motion.div
            layoutId="viewToggleBg"
            className="absolute inset-0 bg-[#D4A84B] rounded-md"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="10" width="18" height="4" rx="1" />
            <rect x="3" y="16" width="18" height="4" rx="1" />
          </svg>
          List
        </span>
      </button>
    </div>
  );
}
