'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { QuestionResponse } from '@/lib/clarity-canvas/types';
import { ConfidenceSlider } from './ConfidenceSlider';
import { NotSureCheckbox } from './NotSureCheckbox';
import { AdditionalContextInput } from './AdditionalContextInput';

const GOLD = '#d4a54a';

interface QuestionMetaWrapperProps {
  questionNumber: number;
  totalQuestions: number;
  sectionLabel: string;
  sectionIcon?: string;
  response: QuestionResponse;
  onResponseChange: (response: QuestionResponse) => void;
  children: React.ReactNode;
}

export function QuestionMetaWrapper({
  questionNumber,
  totalQuestions,
  sectionLabel,
  sectionIcon,
  response,
  onResponseChange,
  children,
}: QuestionMetaWrapperProps) {
  const progress = (questionNumber / totalQuestions) * 100;

  const updateResponse = (partial: Partial<QuestionResponse>) => {
    onResponseChange({ ...response, ...partial });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="mb-8">
        {/* Section label */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {sectionIcon && <span className="text-lg">{sectionIcon}</span>}
          <span
            className="text-xs font-mono uppercase tracking-[0.2em]"
            style={{ color: GOLD }}
          >
            {sectionLabel}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: GOLD }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Question counter */}
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Question content (passed as children) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        {children}
      </motion.div>

      {/* Meta controls section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-6 pt-6 border-t border-zinc-800"
      >
        {/* Not sure checkbox */}
        <NotSureCheckbox
          checked={response.isUnsure}
          onChange={(checked) =>
            updateResponse({
              isUnsure: checked,
              // Reset confidence to 0.5 when unsure is unchecked
              confidence: checked ? response.confidence : 0.5,
            })
          }
        />

        {/* Confidence slider - disabled when not sure */}
        <ConfidenceSlider
          value={response.confidence}
          onChange={(confidence) => updateResponse({ confidence })}
          disabled={response.isUnsure}
        />

        {/* Additional context input */}
        <AdditionalContextInput
          value={response.additionalContext || ''}
          onChange={(additionalContext) => updateResponse({ additionalContext })}
        />
      </motion.div>
    </div>
  );
}
