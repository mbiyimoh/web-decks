'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GOLD = '#d4a54a';

interface SliderQuestionProps {
  question: string;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export function SliderQuestion({
  question,
  min,
  max,
  minLabel,
  maxLabel,
  value,
  onChange,
  step = 1,
}: SliderQuestionProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-lg text-white mb-8 text-center">{question}</p>

      {/* Current value display */}
      <div className="text-center mb-6">
        <motion.span
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-display font-bold"
          style={{ color: GOLD }}
        >
          {value}
        </motion.span>
      </div>

      {/* Slider container */}
      <div className="relative px-2">
        {/* Track background */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          {/* Filled track */}
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: GOLD }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Native range input (hidden visually but functional) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          data-testid="question-option"
          aria-label={question}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value}${minLabel && maxLabel ? ` (between ${minLabel} and ${maxLabel})` : ''}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ margin: 0 }}
        />

        {/* Custom thumb indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2"
          style={{
            left: `calc(${percentage}% - 10px)`,
            backgroundColor: '#0a0a0f',
            borderColor: GOLD,
            boxShadow: `0 0 10px rgba(212, 168, 75, 0.4)`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between mt-4 text-sm">
        <span className="text-zinc-500">{minLabel || min}</span>
        <span className="text-zinc-500">{maxLabel || max}</span>
      </div>
    </motion.div>
  );
}
