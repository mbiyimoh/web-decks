'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionResponse, ProfileScores } from '@/lib/clarity-canvas/types';
import {
  ThisOrThatQuestion,
  SliderQuestion,
  MultiSelectQuestion,
  ScaleQuestion,
  QuestionMetaWrapper,
} from '../components';

const GOLD = '#d4a54a';

// Interview questions configuration
interface InterviewQuestionConfig {
  id: string;
  text: string;
  type: 'this-or-that' | 'slider' | 'multiselect' | 'scale';
  category: string;
  sectionIcon?: string;
  options?: string[] | { value: number; label: string }[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  maxSelections?: number;
}

const INTERVIEW_QUESTIONS: InterviewQuestionConfig[] = [
  {
    id: 'success-metric',
    text: 'When you imagine success, which feels more true?',
    type: 'this-or-that',
    category: 'Vision',
    sectionIcon: '🎯',
    options: ['Users come back every day', 'Users tell their friends'],
  },
  {
    id: 'decision-style',
    text: 'When facing a new problem, you typically:',
    type: 'this-or-that',
    category: 'Identity',
    sectionIcon: '🧠',
    options: ['Research extensively first', 'Jump in and iterate'],
  },
  {
    id: 'runway-months',
    text: 'How many months of runway do you have?',
    type: 'slider',
    category: 'Resources',
    sectionIcon: '💰',
    min: 0,
    max: 24,
    minLabel: '0 months',
    maxLabel: '24+ months',
  },
  {
    id: 'constraints',
    text: 'What are your biggest constraints right now?',
    type: 'multiselect',
    category: 'Challenges',
    sectionIcon: '⚠️',
    options: ['Time', 'Capital', 'Team', 'Technical debt', 'Strategy clarity'],
    maxSelections: 3,
  },
  {
    id: 'role-focus',
    text: 'Right now, your company needs you to be more of a:',
    type: 'this-or-that',
    category: 'Role',
    sectionIcon: '👤',
    options: ['Visionary (setting direction)', 'Operator (getting things done)'],
  },
  {
    id: 'risk-tolerance',
    text: 'How would you describe your risk tolerance?',
    type: 'scale',
    category: 'Identity',
    sectionIcon: '📊',
    options: [
      { value: 1, label: 'Very conservative - I prefer proven approaches' },
      { value: 2, label: 'Somewhat cautious - calculated risks only' },
      { value: 3, label: 'Balanced - risk vs. reward evaluation' },
      { value: 4, label: 'Growth-oriented - comfortable with uncertainty' },
      { value: 5, label: 'Bold - big bets, big rewards' },
    ],
  },
  {
    id: 'team-size',
    text: 'What is your current team size?',
    type: 'slider',
    category: 'Resources',
    sectionIcon: '👥',
    min: 1,
    max: 50,
    minLabel: 'Solo',
    maxLabel: '50+',
  },
  {
    id: 'growth-priority',
    text: 'Your top growth priority right now:',
    type: 'this-or-that',
    category: 'Strategy',
    sectionIcon: '📈',
    options: ['Product-market fit', 'Scaling what works'],
  },
];

function getDefaultResponse(): QuestionResponse {
  return {
    value: '',
    isUnsure: false,
    confidence: 0.7,
    additionalContext: '',
  };
}

export function InterviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState<ProfileScores | null>(null);
  const [previousScores, setPreviousScores] = useState<ProfileScores | null>(null);

  // Load initial scores on mount
  useEffect(() => {
    async function loadScores() {
      try {
        const response = await fetch('/api/clarity-canvas/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.scores) {
            setScores(data.scores);
          }
        }
      } catch (err) {
        console.error('Failed to load scores:', err);
      }
    }
    loadScores();
  }, []);

  const currentQuestion = INTERVIEW_QUESTIONS[currentIndex];
  const currentResponse = responses[currentQuestion.id] || getDefaultResponse();
  const isLastQuestion = currentIndex === INTERVIEW_QUESTIONS.length - 1;
  const progress = ((currentIndex + 1) / INTERVIEW_QUESTIONS.length) * 100;

  const updateResponse = (questionId: string, response: QuestionResponse) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const hasAnswer = (): boolean => {
    const value = currentResponse.value;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return true;
    if (typeof value === 'string') return value.length > 0;
    return false;
  };

  const submitCurrentQuestion = async () => {
    if (!hasAnswer()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clarity-canvas/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          response: currentResponse,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviousScores(scores);
        setScores(data.scores);
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    await submitCurrentQuestion();

    if (isLastQuestion) {
      // Navigate to profile with animation flag
      router.push('/clarity-canvas?showAnimation=true');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const renderQuestion = () => {
    const q = currentQuestion;

    switch (q.type) {
      case 'this-or-that':
        return (
          <ThisOrThatQuestion
            question={q.text}
            options={q.options as [string, string]}
            value={currentResponse.value as string | null}
            onChange={(value) =>
              updateResponse(q.id, { ...currentResponse, value })
            }
          />
        );

      case 'slider':
        return (
          <SliderQuestion
            question={q.text}
            min={q.min ?? 0}
            max={q.max ?? 100}
            minLabel={q.minLabel}
            maxLabel={q.maxLabel}
            value={
              typeof currentResponse.value === 'number'
                ? currentResponse.value
                : q.min ?? 0
            }
            onChange={(value) =>
              updateResponse(q.id, { ...currentResponse, value })
            }
          />
        );

      case 'multiselect':
        return (
          <MultiSelectQuestion
            question={q.text}
            options={q.options as string[]}
            value={
              Array.isArray(currentResponse.value)
                ? currentResponse.value
                : []
            }
            onChange={(value) =>
              updateResponse(q.id, { ...currentResponse, value })
            }
            maxSelections={q.maxSelections}
          />
        );

      case 'scale':
        return (
          <ScaleQuestion
            question={q.text}
            options={q.options as { value: number; label: string }[]}
            value={
              typeof currentResponse.value === 'number'
                ? currentResponse.value
                : null
            }
            onChange={(value) =>
              updateResponse(q.id, { ...currentResponse, value })
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Fixed header with back button */}
      <div className="fixed top-4 left-4 z-50 safe-area-inset-top">
        <button
          onClick={() => router.push('/clarity-canvas')}
          className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm hidden sm:inline">Back to Profile</span>
        </button>
      </div>

      {/* Fixed progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-zinc-800">
        <motion.div
          className="h-full"
          style={{ backgroundColor: GOLD }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <QuestionMetaWrapper
              questionNumber={currentIndex + 1}
              totalQuestions={INTERVIEW_QUESTIONS.length}
              sectionLabel={currentQuestion.category}
              sectionIcon={currentQuestion.sectionIcon}
              response={currentResponse}
              onResponseChange={(response) =>
                updateResponse(currentQuestion.id, response)
              }
            >
              {renderQuestion()}
            </QuestionMetaWrapper>
          </motion.div>
        </AnimatePresence>

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent pt-12 pb-8 px-4 sm:px-6 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {/* Back button */}
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-lg font-medium transition-colors ${
                currentIndex > 0
                  ? 'text-zinc-400 hover:text-white'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              ← Back
            </motion.button>

            {/* Continue / See Results button */}
            <motion.button
              onClick={handleContinue}
              disabled={!hasAnswer() || isSubmitting}
              whileHover={{ scale: hasAnswer() ? 1.02 : 1 }}
              whileTap={{ scale: hasAnswer() ? 0.98 : 1 }}
              className={`px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] rounded-lg font-medium transition-all ${
                hasAnswer() && !isSubmitting
                  ? 'bg-[#d4a54a] text-black hover:bg-[#e0b55c]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                  />
                  Saving...
                </span>
              ) : isLastQuestion ? (
                'See Results →'
              ) : (
                'Continue →'
              )}
            </motion.button>
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button
              onClick={() => {
                if (isLastQuestion) {
                  router.push('/clarity-canvas?showAnimation=true');
                } else {
                  setCurrentIndex((i) => i + 1);
                }
              }}
              className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
            >
              Skip this question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
