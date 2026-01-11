'use client';

import { motion } from 'framer-motion';

interface Props {
  activeView: 'by-question' | 'by-session';
  onViewChange: (view: 'by-question' | 'by-session') => void;
}

export function ValidationViewToggle({ activeView, onViewChange }: Props) {
  return (
    <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-lg p-1 w-fit">
      <button
        onClick={() => onViewChange('by-question')}
        className={'relative px-4 py-2 text-sm font-medium rounded-md transition-colors ' +
          (activeView === 'by-question' ? 'text-white' : 'text-zinc-400 hover:text-zinc-300')}
        role="tab"
        aria-selected={activeView === 'by-question'}
      >
        {activeView === 'by-question' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-zinc-800 rounded-md"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          By Question
        </span>
      </button>

      <button
        onClick={() => onViewChange('by-session')}
        className={'relative px-4 py-2 text-sm font-medium rounded-md transition-colors ' +
          (activeView === 'by-session' ? 'text-white' : 'text-zinc-400 hover:text-zinc-300')}
        role="tab"
        aria-selected={activeView === 'by-session'}
      >
        {activeView === 'by-session' && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-zinc-800 rounded-md"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          By Session
        </span>
      </button>
    </div>
  );
}
