'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingStepProps {
  inputType: 'voice' | 'text';
  onError?: (error: string) => void;
}

interface Step {
  id: string;
  label: string;
  activeLabel: string;
}

// More granular steps to keep users engaged during longer processing
// Processing takes 30-90 seconds for multi-persona extraction + customization
const STEPS: Step[] = [
  {
    id: 'transcribe',
    label: 'Audio transcribed',
    activeLabel: 'Transcribing audio...',
  },
  {
    id: 'analyze',
    label: 'Brain dump analyzed',
    activeLabel: 'Analyzing your brain dump...',
  },
  {
    id: 'identify',
    label: 'Personas identified',
    activeLabel: 'Identifying customer personas...',
  },
  {
    id: 'extract',
    label: 'Details extracted',
    activeLabel: 'Extracting persona details...',
  },
  {
    id: 'customize-1',
    label: 'First persona customized',
    activeLabel: 'Customizing questions for persona 1...',
  },
  {
    id: 'customize-2',
    label: 'Additional personas customized',
    activeLabel: 'Customizing questions for additional personas...',
  },
  {
    id: 'finalize',
    label: 'Ready to go',
    activeLabel: 'Finalizing your questionnaire...',
  },
];

export function ProcessingStep({ inputType, onError }: ProcessingStepProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const hasInitialized = useRef(false);

  // Skip transcription step for text input (memoized to avoid recreating)
  const steps = useMemo(
    () => (inputType === 'text' ? STEPS.slice(1) : STEPS),
    [inputType]
  );

  // Simulate step progression with variable timing
  // Total ~60-90 seconds for multi-persona: use longer intervals
  useEffect(() => {
    // Prevent duplicate initialization in React Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Variable intervals: some steps feel faster, some slower
    const getIntervalForStep = (stepIndex: number): number => {
      // First few steps are quick (API is starting up)
      if (stepIndex < 2) return 4000;
      // Extraction takes longer
      if (stepIndex < 4) return 8000;
      // Customization per persona takes longest
      return 12000;
    };

    // Track all timeouts for proper cleanup
    const timeoutIds: NodeJS.Timeout[] = [];

    const scheduleNext = (stepIndex: number) => {
      if (stepIndex >= steps.length - 1) return;

      const timeoutId = setTimeout(() => {
        setCompletedSteps((completed) => [...completed, steps[stepIndex].id]);
        setCurrentStepIndex(stepIndex + 1);
        scheduleNext(stepIndex + 1);
      }, getIntervalForStep(stepIndex));

      timeoutIds.push(timeoutId);
    };

    scheduleNext(0);

    return () => {
      // Clear all scheduled timeouts to prevent memory leaks
      timeoutIds.forEach(clearTimeout);
      // Reset flag to allow remounting
      hasInitialized.current = false;
    };
  }, [inputType]);

  const currentStep = steps[currentStepIndex];

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center">
      {/* Animated loader */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Pulsing circles */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#D4A84B]/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-[#D4A84B]/50"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
          {/* Inner circle */}
          <motion.div
            className="absolute inset-8 rounded-full bg-[#D4A84B]/20 flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg
              className="w-8 h-8 text-[#D4A84B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* Current status */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep?.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xl text-white mb-8"
        >
          {currentStep?.activeLabel}
        </motion.p>
      </AnimatePresence>

      {/* Step checklist */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 justify-center transition-all ${
                isPending ? 'opacity-40' : ''
              }`}
            >
              {/* Status icon */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                      ? 'bg-[#D4A84B]'
                      : 'bg-zinc-700'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isCurrent ? (
                  <motion.div
                    className="w-2 h-2 bg-black rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ) : (
                  <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm ${
                  isCompleted
                    ? 'text-green-400'
                    : isCurrent
                      ? 'text-white'
                      : 'text-zinc-500'
                }`}
              >
                {isCompleted ? step.label : step.activeLabel.replace('...', '')}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Estimated time */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm text-zinc-500"
      >
        This usually takes 30-90 seconds for multiple personas
      </motion.p>
    </div>
  );
}

/**
 * Hook to manage processing state from parent component
 */
export function useProcessingSteps() {
  const [currentStep, setCurrentStep] = useState<
    'transcribe' | 'identify' | 'customize' | 'complete'
  >('transcribe');

  const advanceToStep = (
    step: 'transcribe' | 'identify' | 'customize' | 'complete'
  ) => {
    setCurrentStep(step);
  };

  return { currentStep, advanceToStep };
}
