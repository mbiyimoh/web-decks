'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GOLD = '#d4a54a';

interface ConfidenceSliderProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ConfidenceSlider({ value, onChange, disabled = false }: ConfidenceSliderProps) {
  // Map 0-1 to 0-100 for display
  const displayValue = Math.round(value * 100);
  const percentage = value * 100;

  const getConfidenceLabel = (val: number): string => {
    if (val >= 0.8) return 'Very confident';
    if (val >= 0.6) return 'Fairly confident';
    if (val >= 0.4) return 'Somewhat confident';
    if (val >= 0.2) return 'Not very confident';
    return 'Just guessing';
  };

  return (
    <div className={`w-full ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400">How confident are you?</span>
        <span
          className="text-sm font-medium"
          style={{ color: disabled ? '#666' : GOLD }}
        >
          {getConfidenceLabel(value)}
        </span>
      </div>

      {/* Slider container */}
      <div className="relative h-6">
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          {/* Filled track */}
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: disabled ? '#666' : GOLD }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Native range input */}
        <input
          type="range"
          min={0}
          max={100}
          value={displayValue}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          disabled={disabled}
          aria-label="Confidence level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayValue}
          aria-valuetext={getConfidenceLabel(value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {/* Custom thumb */}
        {!disabled && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 pointer-events-none"
            style={{
              left: `calc(${percentage}% - 8px)`,
              backgroundColor: '#0a0a0f',
              borderColor: GOLD,
              boxShadow: `0 0 8px rgba(212, 168, 75, 0.4)`,
            }}
            animate={{ left: `calc(${percentage}% - 8px)` }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>
    </div>
  );
}
