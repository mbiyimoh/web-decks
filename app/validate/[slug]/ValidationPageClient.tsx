'use client';

/**
 * Validation Page Client Component
 *
 * Main questionnaire for validators. Fetches data client-side and
 * allows anonymous users to complete persona validation questionnaires.
 *
 * Key differences from founder questionnaire:
 * - Uses validationQuestion text (second person: "Do you...")
 * - Hides "I'm not sure" checkbox
 * - Saves to localStorage for session persistence
 * - No persona preview sidebar
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '@/lib/clarity-canvas/modules/persona-sharpener/types';
import { ThisOrThat } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/ThisOrThat';
import { Slider } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/Slider';
import { Ranking } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/Ranking';
import { MultiSelect } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/MultiSelect';
import { FillBlank } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/FillBlank';
import { Scenario } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/Scenario';
import { ValidationComplete } from './ValidationComplete';

/**
 * Extended question type from validation API
 * Includes additional fields for validation-specific UX
 */
interface ValidationQuestion extends Question {
  isFactual?: boolean; // Skip confidence slider for factual questions (age, etc.)
  validationPlaceholder?: string; // Second-person placeholder text
  validationContextualizedText?: string; // Enriched question text reframed for real users
}

interface ValidationContext {
  personaName: string;
  personaQuote: string | null;
  productContext: string;
  questions: ValidationQuestion[];
  totalQuestions: number;
}

type ViewState = 'loading' | 'intro' | 'questionnaire' | 'complete' | 'error' | 'unavailable';

interface Props {
  slug: string;
}

const STORAGE_KEY_PREFIX = 'validation-progress-';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function ValidationPageClient({ slug }: Props) {
  // View state
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation context from API
  const [context, setContext] = useState<ValidationContext | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  // Current question input state
  const [currentValue, setCurrentValue] = useState<unknown>(null);
  const [confidence, setConfidence] = useState(70);
  const [additionalContext, setAdditionalContext] = useState('');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent double initialization in React Strict Mode
  const hasInitialized = useRef(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${slug}`;

  // Load validation context and restore progress
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initialize() {
      try {
        // Fetch validation context
        const response = await fetch(`/api/validate/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setErrorMessage('This validation link was not found.');
            setViewState('unavailable');
            return;
          }
          if (response.status === 410) {
            setErrorMessage('This validation link is no longer active.');
            setViewState('unavailable');
            return;
          }
          throw new Error('Failed to load validation');
        }

        const data: ValidationContext = await response.json();
        setContext(data);

        // Check for existing progress in localStorage
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Check if not expired and matches this slug
            if (parsed.slug === slug && Date.now() - parsed.savedAt < MAX_AGE_MS) {
              // Restore progress
              setSessionId(parsed.sessionId);
              setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
              setResponses(parsed.responses || {});

              // Check if already completed
              if (parsed.completed) {
                setViewState('complete');
                return;
              }

              // Resume questionnaire
              setViewState('questionnaire');
              return;
            } else {
              // Expired, clear it
              localStorage.removeItem(storageKey);
            }
          } catch {
            localStorage.removeItem(storageKey);
          }
        }

        // No existing progress, show intro
        setViewState('intro');
      } catch (err) {
        console.error('Error initializing validation:', err);
        setErrorMessage('Failed to load validation. Please try again.');
        setViewState('error');
      }
    }

    initialize();
  }, [slug, storageKey]);

  // Save progress to localStorage
  const saveProgress = (updates: {
    sessionId?: string;
    currentQuestionIndex?: number;
    responses?: Record<string, unknown>;
    completed?: boolean;
  }) => {
    try {
      const current = localStorage.getItem(storageKey);
      const parsed = current ? JSON.parse(current) : {};

      const toSave = {
        ...parsed,
        slug,
        savedAt: Date.now(),
        ...updates,
      };

      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  // Start the validation
  const handleStart = async () => {
    if (!context) return;

    setIsSubmitting(true);

    try {
      // Create session via API
      const response = await fetch(`/api/validate/${slug}/session`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // Save to localStorage
      saveProgress({
        sessionId: data.sessionId,
        currentQuestionIndex: 0,
        responses: {},
      });

      setViewState('questionnaire');
    } catch (err) {
      console.error('Error starting validation:', err);
      setErrorMessage('Failed to start validation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit current response and move to next question
  const handleContinue = async () => {
    if (!context || !sessionId) return;

    const currentQuestion = context.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setIsSubmitting(true);

    try {
      // Submit response via API
      const response = await fetch(`/api/validate/${slug}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          field: currentQuestion.field,
          value: currentValue,
          confidence,
          additionalContext: additionalContext || undefined,
          skipped: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save response');
      }

      // Update local state
      const newResponses = {
        ...responses,
        [currentQuestion.id]: {
          value: currentValue,
          confidence,
          additionalContext,
        },
      };
      setResponses(newResponses);

      // Move to next question or complete
      if (currentQuestionIndex < context.questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        resetQuestionState();

        // Save progress
        saveProgress({
          currentQuestionIndex: nextIndex,
          responses: newResponses,
        });
      } else {
        // Complete the session
        await handleComplete();
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setErrorMessage('Failed to save response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip current question
  const handleSkip = async () => {
    if (!context || !sessionId) return;

    const currentQuestion = context.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setIsSubmitting(true);

    try {
      // Submit skip via API
      const response = await fetch(`/api/validate/${slug}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          field: currentQuestion.field,
          value: null,
          isUnsure: true,
          confidence: 0,
          skipped: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save response');
      }

      // Update local state
      const newResponses = {
        ...responses,
        [currentQuestion.id]: {
          value: null,
          skipped: true,
        },
      };
      setResponses(newResponses);

      // Move to next question or complete
      if (currentQuestionIndex < context.questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        resetQuestionState();

        // Save progress
        saveProgress({
          currentQuestionIndex: nextIndex,
          responses: newResponses,
        });
      } else {
        // Complete the session
        await handleComplete();
      }
    } catch (err) {
      console.error('Error skipping question:', err);
      setErrorMessage('Failed to save response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete the validation session
  const handleComplete = async () => {
    saveProgress({ completed: true });
    setViewState('complete');
  };

  // Go back to previous question
  const handleBack = () => {
    if (currentQuestionIndex > 0 && context) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);

      // Restore previous answer if exists
      const prevQuestion = context.questions[prevIndex];
      const prevResponse = responses[prevQuestion.id] as { value?: unknown; confidence?: number; additionalContext?: string } | undefined;

      if (prevResponse && prevResponse.value !== undefined) {
        setCurrentValue(prevResponse.value);
        setConfidence(prevResponse.confidence || 70);
        setAdditionalContext(prevResponse.additionalContext || '');
      } else {
        resetQuestionState();
      }

      saveProgress({ currentQuestionIndex: prevIndex });
    }
  };

  const resetQuestionState = () => {
    setCurrentValue(null);
    setConfidence(70);
    setAdditionalContext('');
    setErrorMessage(null);
  };

  // Render question component based on type
  const renderQuestion = (question: ValidationQuestion) => {
    const props = {
      question,
      value: currentValue,
      onChange: setCurrentValue,
      disabled: false,
    };

    switch (question.type) {
      case 'this-or-that':
        return <ThisOrThat {...props} />;
      case 'slider':
        return <Slider {...props} />;
      case 'ranking':
        return <Ranking {...props} />;
      case 'multi-select':
        return <MultiSelect {...props} />;
      case 'fill-blank':
        return <FillBlank {...props} />;
      case 'scenario':
        return <Scenario {...props} />;
      default:
        return null;
    }
  };

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading validation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h1 className="text-2xl font-display text-white mb-3">
            Something Went Wrong
          </h1>
          <p className="text-zinc-400">
            {errorMessage || 'Failed to load validation. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  // Unavailable state (inactive/expired link)
  if (viewState === 'unavailable') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <span className="text-5xl mb-4 block">🔒</span>
          <h1 className="text-2xl font-display text-white mb-3">
            Link Unavailable
          </h1>
          <p className="text-zinc-400">
            {errorMessage || 'This validation link is no longer available.'}
          </p>
        </div>
      </div>
    );
  }

  // Intro state
  if (viewState === 'intro' && context) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <span className="text-6xl mb-6 block">👋</span>
          <h1 className="text-3xl lg:text-4xl font-display text-white mb-4">
            Help Us Understand You Better
          </h1>
          <p className="text-zinc-400 mb-2">
            You&apos;ve been invited to share your perspective on{' '}
            <span className="text-white">{context.productContext}</span>.
          </p>
          <p className="text-zinc-500 text-sm mb-8">
            {context.totalQuestions} questions • Takes about 5 minutes
          </p>

          {context.personaQuote && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-8">
              <p className="text-zinc-300 italic">&ldquo;{context.personaQuote}&rdquo;</p>
              <p className="text-zinc-500 text-sm mt-2">— {context.personaName}</p>
            </div>
          )}

          <motion.button
            onClick={handleStart}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Starting...
              </span>
            ) : (
              'Get Started →'
            )}
          </motion.button>

          <p className="text-zinc-600 text-xs mt-6">
            Your responses are anonymous and will help improve this product.
          </p>
        </motion.div>
      </div>
    );
  }

  // Complete state
  if (viewState === 'complete' && sessionId) {
    return <ValidationComplete slug={slug} sessionId={sessionId} />;
  }

  // Questionnaire state
  if (viewState === 'questionnaire' && context) {
    const currentQuestion = context.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / context.totalQuestions) * 100;

    if (!currentQuestion) {
      return null;
    }

    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-800 z-50">
          <motion.div
            className="h-full bg-[#D4A84B]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-40 border-b border-zinc-800">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-zinc-500 text-sm">
              Question {currentQuestionIndex + 1} of {context.totalQuestions}
            </span>
            <span className="text-xs text-zinc-600">
              {context.personaName}
            </span>
          </div>
        </header>

        {/* Main content */}
        <div className="pt-20 pb-12 px-6">
          <div className="max-w-2xl mx-auto py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Category label */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#D4A84B]">
                    {currentQuestion.category}
                  </span>
                </div>

                {/* Question text - Prefer validation-contextualized text, fall back to validationQuestion */}
                <h2 className="text-2xl lg:text-3xl font-display text-white mb-8">
                  {currentQuestion.validationContextualizedText || currentQuestion.validationQuestion || currentQuestion.question}
                </h2>

                {/* Question component */}
                {renderQuestion(currentQuestion)}

                {/* Confidence slider and context (only when value selected, skip for factual questions) */}
                {currentValue !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-8 space-y-6"
                  >
                    {/* Hide confidence slider for factual questions (age, lifestyle, etc.) */}
                    {!currentQuestion.isFactual && (
                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">
                          How confident are you in this answer?
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={confidence}
                          onChange={(e) => setConfidence(Number(e.target.value))}
                          className="w-full accent-[#D4A84B]"
                        />
                        <div className="flex justify-between text-xs text-zinc-500 mt-1">
                          <span>Not sure</span>
                          <span>{confidence}%</span>
                          <span>Very sure</span>
                        </div>
                      </div>
                    )}

                    {/* Additional context */}
                    <div>
                      <label className="text-base font-semibold text-zinc-300 mb-2 block">
                        Want to add any context? <span className="text-zinc-400 font-normal">(optional but encouraged!)</span>
                      </label>
                      <textarea
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        placeholder={currentQuestion.validationPlaceholder || "Share any relevant details..."}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4A84B] resize-none"
                        rows={2}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Error message */}
                {errorMessage && (
                  <p className="mt-4 text-red-400 text-sm">{errorMessage}</p>
                )}

                {/* Actions */}
                <div className="mt-8 flex items-center gap-4">
                  {currentQuestionIndex > 0 && (
                    <button
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      ← Back
                    </button>
                  )}

                  <div className="flex-1" />

                  <button
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                  >
                    Skip this question
                  </button>

                  <motion.button
                    onClick={handleContinue}
                    disabled={isSubmitting || currentValue === null}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : currentQuestionIndex < context.totalQuestions - 1 ? (
                      'Continue →'
                    ) : (
                      'Finish'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
