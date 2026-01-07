'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NotSureCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function NotSureCheckbox({ checked, onChange }: NotSureCheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left group"
    >
      {/* Checkbox */}
      <div
        className={`
          mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
          transition-colors duration-200
          ${checked ? 'border-amber-500 bg-amber-500/20' : 'border-zinc-600 bg-transparent group-hover:border-zinc-500'}
        `}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-3 h-3 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </div>

      {/* Label and helper */}
      <div>
        <span
          className={`text-sm font-medium ${checked ? 'text-amber-500' : 'text-zinc-300 group-hover:text-zinc-200'}`}
        >
          I&apos;m not sure about this
        </span>
        <p className="text-xs text-zinc-500 mt-0.5">
          Mark this if you want to revisit or need more time to think
        </p>
      </div>
    </button>
  );
}
