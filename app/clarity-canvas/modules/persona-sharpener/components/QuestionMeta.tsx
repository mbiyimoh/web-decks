'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface QuestionMetaProps {
  children: React.ReactNode;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  onUnsureChange: (isUnsure: boolean) => void;
  onConfidenceChange: (confidence: number) => void;
  onContextChange: (context: string) => void;
}

export function QuestionMeta({
  children,
  isUnsure,
  confidence,
  additionalContext = '',
  onUnsureChange,
  onConfidenceChange,
  onContextChange,
}: QuestionMetaProps) {
  const [showContext, setShowContext] = useState(false);

  const getConfidenceColor = (value: number) => {
    if (value >= 70) return '#4ADE80';
    if (value >= 40) return '#D4A84B';
    return '#FB923C';
  };

  return (
    <div className="space-y-6">
      {/* Question content */}
      <div className={isUnsure ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* I'm not sure checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={isUnsure}
          onChange={(e) => onUnsureChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-[#FB923C] focus:ring-[#FB923C] focus:ring-offset-0"
        />
        <div>
          <span className="text-white group-hover:text-[#FB923C] transition-colors">
            I'm not sure about this
          </span>
          <p className="text-sm text-zinc-500 mt-0.5">
            That's okay — we'll flag it for validation
          </p>
        </div>
      </label>

      {/* Confidence slider (only if not unsure) */}
      {!isUnsure && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Confidence</span>
            <span
              className="text-sm font-medium"
              style={{ color: getConfidenceColor(confidence) }}
            >
              {confidence}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => onConfidenceChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-800"
            style={{
              background: `linear-gradient(to right, ${getConfidenceColor(confidence)} ${confidence}%, #27272a ${confidence}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>Just guessing</span>
            <span>Have data</span>
          </div>
        </div>
      )}

      {/* Add context (collapsible) */}
      {!isUnsure && (
        <div>
          <button
            onClick={() => setShowContext(!showContext)}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <span>{showContext ? '−' : '+'}</span>
            <span>Add context (optional)</span>
          </button>
          {showContext && (
            <motion.textarea
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              value={additionalContext}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder="Any supporting details or reasoning..."
              className="mt-2 w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-[#D4A84B]"
              rows={3}
            />
          )}
        </div>
      )}
    </div>
  );
}
