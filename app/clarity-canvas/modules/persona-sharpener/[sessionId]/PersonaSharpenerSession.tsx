'use client';

/**
 * Persona Sharpener Questionnaire Session
 *
 * CRITICAL PATTERN: Two-Tier Question System
 * ==========================================
 *
 * This component uses TWO question data sources:
 *
 * 1. `questionSequence` (from questions.ts)
 *    - Static base questions with generic text
 *    - Property: `.question` (e.g., "What age range does this customer fall into?")
 *
 * 2. `customizedQuestions` (QuestionForUI[] from API)
 *    - AI-generated contextual versions from brain dump
 *    - Property: `.text` (e.g., "Based on your mention of 'college students,' are you targeting 18-24?")
 *
 * ALWAYS render: currentCustomizedQuestion?.text || currentQuestion.question
 * NEVER render: currentQuestion.question alone
 *
 * See: docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/customized-questions-pattern.md
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import {
  calculateClarity,
  calculateAvgConfidence,
  getUnsureCount,
  generateArchetype,
  generateSummary,
} from '@/lib/clarity-canvas/modules/persona-sharpener/scoring';
import type {
  PersonaDisplay,
  ResponseInput,
  Question,
} from '@/lib/clarity-canvas/modules/persona-sharpener/types';
import { PersonaCard } from '../components/PersonaCard';
import { ThisOrThat } from '../components/questions/ThisOrThat';
import { Slider } from '../components/questions/Slider';
import { Ranking } from '../components/questions/Ranking';
import { MultiSelect } from '../components/questions/MultiSelect';
import { FillBlank } from '../components/questions/FillBlank';
import { Scenario } from '../components/questions/Scenario';
import { SkipConfirmation } from '../components/SkipConfirmation';
import type { QuestionForUI } from '@/lib/clarity-canvas/modules/persona-sharpener/customized-question-schema';
import type { SiblingPersona } from '../components/types';

interface User {
  id?: string;
  name?: string | null;
}

interface Props {
  user: User;
  sessionId: string;
}

interface SessionData {
  id: string;
  personaId: string;
  status: string;
  lastQuestionIndex: number;
  questionsAnswered: number;
  questionsSkipped: number;
  questionsUnsure: number;
  startedAt: string;
  completedAt: string | null;
}

type LoadState = 'loading' | 'loaded' | 'completed' | 'error' | 'not-found';

export function PersonaSharpenerSession({ user, sessionId }: Props) {
  const router = useRouter();

  // Core state
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [session, setSession] = useState<SessionData | null>(null);
  const [persona, setPersona] = useState<PersonaDisplay | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, ResponseInput>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Question input state
  const [currentValue, setCurrentValue] = useState<unknown>(null);
  const [isUnsure, setIsUnsure] = useState(false);
  const [confidence, setConfidence] = useState(50);
  const [additionalContext, setAdditionalContext] = useState('');

  // Customized questions state
  const [customizedQuestions, setCustomizedQuestions] = useState<
    QuestionForUI[]
  >([]);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

  // Sibling personas state (for multi-persona sessions)
  const [siblingPersonas, setSiblingPersonas] = useState<SiblingPersona[]>([]);

  // Ref for cleanup of redirect timeout
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount to prevent navigation race conditions
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Use customized questions if available
  const activeQuestions =
    customizedQuestions.length > 0 ? customizedQuestions : null;
  const currentCustomizedQuestion = activeQuestions
    ? activeQuestions[currentQuestionIndex]
    : null;
  const currentQuestion = currentCustomizedQuestion
    ? questionSequence.find(
        (q) => q.id === currentCustomizedQuestion.questionId
      )
    : questionSequence[currentQuestionIndex];
  const totalQuestions = activeQuestions?.length || questionSequence.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Load session data on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(
          `/api/clarity-canvas/modules/persona-sharpener/sessions/${sessionId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setLoadState('not-found');
            return;
          }
          throw new Error('Failed to load session');
        }

        const data = await response.json();
        setSession(data.session);
        setPersona(data.persona);
        setPersonaId(data.session.personaId);

        // Store sibling personas for switcher
        if (data.siblingPersonas && data.siblingPersonas.length > 1) {
          setSiblingPersonas(data.siblingPersonas);
        }

        // Check if session is already completed
        if (data.session.status === 'completed') {
          setLoadState('completed');
          return;
        }

        // Convert responses to ResponseInput format
        const responseMap: Record<string, ResponseInput> = {};
        Object.entries(data.responses).forEach(([qId, r]) => {
          const resp = r as {
            questionId: string;
            value: unknown;
            isUnsure: boolean;
            confidence: number;
            additionalContext?: string;
            contextSource?: string | null;
          };
          responseMap[qId] = {
            questionId: resp.questionId,
            value: resp.value,
            isUnsure: resp.isUnsure,
            confidence: resp.confidence,
            additionalContext: resp.additionalContext,
            contextSource: resp.contextSource as 'text' | null,
          };
        });
        setResponses(responseMap);

        // Load customized questions
        const questionsResponse = await fetch(
          `/api/clarity-canvas/modules/persona-sharpener/personas/${data.session.personaId}/questions`
        );
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          const questions = questionsData.questions || [];
          setCustomizedQuestions(questions);

          // Resume at the correct question index with bounds validation
          const savedIndex = data.session.lastQuestionIndex || 0;
          const maxIndex = questions.length > 0 ? questions.length - 1 : questionSequence.length - 1;
          const resumeIndex = Math.min(Math.max(0, savedIndex), maxIndex);
          setCurrentQuestionIndex(resumeIndex);

          // Check if resuming to a skip question
          if (questions.length > 0 && questions[resumeIndex]?.isSkipped) {
            setShowSkipConfirmation(true);
          }
        }

        setLoadState('loaded');
      } catch (err) {
        console.error('Error loading session:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load session'
        );
        setLoadState('error');
      }
    }

    loadSession();
  }, [sessionId]);

  const resetQuestionState = (showSkipConfirm = false) => {
    setCurrentValue(null);
    setIsUnsure(false);
    setConfidence(50);
    setAdditionalContext('');
    setShowSkipConfirmation(showSkipConfirm);
  };

  // Submit current response and move to next question
  const handleContinue = async () => {
    if (!personaId || !currentQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/clarity-canvas/modules/persona-sharpener/personas/${personaId}/responses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: currentQuestion.id,
            currentQuestionIndex,
            value: currentValue,
            isUnsure,
            confidence: isUnsure ? 0 : confidence,
            additionalContext: additionalContext || undefined,
            contextSource: additionalContext ? 'text' : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await response.json();

      // Update local state
      setResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          value: currentValue,
          isUnsure,
          confidence: isUnsure ? 0 : confidence,
          additionalContext,
          contextSource: additionalContext ? 'text' : null,
        },
      }));

      // Update persona from server response
      if (data.persona) {
        setPersona(data.persona);
      }

      // Move to next question or complete
      if (currentQuestionIndex < totalQuestions - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextIsSkipped = !!(activeQuestions && activeQuestions[nextIndex]?.isSkipped);

        setCurrentQuestionIndex(nextIndex);
        resetQuestionState(nextIsSkipped);
      } else {
        // Session complete - show completion view first, then redirect
        setLoadState('completed');
        // Small delay to ensure user sees completion, then redirect
        redirectTimeoutRef.current = setTimeout(() => {
          router.push('/clarity-canvas/modules/persona-sharpener');
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Failed to save response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);

      const prevQuestionId = activeQuestions
        ? activeQuestions[prevIndex]?.questionId
        : questionSequence[prevIndex]?.id;
      const prevResponse = prevQuestionId ? responses[prevQuestionId] : null;

      if (prevResponse) {
        setCurrentValue(prevResponse.value);
        setIsUnsure(prevResponse.isUnsure);
        setConfidence(prevResponse.confidence);
        setAdditionalContext(prevResponse.additionalContext || '');
        setShowSkipConfirmation(false);
      } else {
        const prevIsSkipped = !!(activeQuestions && activeQuestions[prevIndex]?.isSkipped);
        resetQuestionState(prevIsSkipped);
      }
    }
  };

  const handleSkip = () => {
    setIsUnsure(true);
    setCurrentValue(null);
    handleContinue();
  };

  // Handle confirming a skip
  const handleSkipConfirm = async () => {
    if (
      !currentCustomizedQuestion?.skippedValue ||
      !personaId ||
      !currentQuestion
    )
      return;

    setIsLoading(true);
    setError(null);
    setShowSkipConfirmation(false);

    try {
      const response = await fetch(
        `/api/clarity-canvas/modules/persona-sharpener/personas/${personaId}/responses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: currentQuestion.id,
            currentQuestionIndex,
            value: currentCustomizedQuestion.skippedValue,
            isUnsure: false,
            confidence: 100,
            additionalContext: undefined,
            contextSource: null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await response.json();

      setResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          value: currentCustomizedQuestion.skippedValue,
          isUnsure: false,
          confidence: 100,
          additionalContext: '',
          contextSource: null,
        },
      }));

      if (data.persona) {
        setPersona(data.persona);
      }

      if (currentQuestionIndex < totalQuestions - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextIsSkipped = !!(activeQuestions && activeQuestions[nextIndex]?.isSkipped);

        setCurrentQuestionIndex(nextIndex);
        resetQuestionState(nextIsSkipped);
      } else {
        // Session complete - show completion view first, then redirect
        setLoadState('completed');
        redirectTimeoutRef.current = setTimeout(() => {
          router.push('/clarity-canvas/modules/persona-sharpener');
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting skip confirmation:', err);
      setError('Failed to save response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipEdit = () => {
    setShowSkipConfirmation(false);
  };

  // Handle switching to a persona that doesn't have a session yet
  const handleSwitchToPersona = async (targetPersonaId: string) => {
    setIsLoading(true);
    try {
      // Create a new session for this persona
      const sessionResponse = await fetch(
        '/api/clarity-canvas/modules/persona-sharpener/sessions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId: targetPersonaId }),
        }
      );

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const { session } = await sessionResponse.json();
      router.push(`/clarity-canvas/modules/persona-sharpener/${session.id}`);
    } catch (err) {
      console.error('Error switching to persona:', err);
      setError('Failed to switch persona. Please try again.');
      setIsLoading(false);
    }
  };

  // Update persona preview client-side
  const updatePersonaPreview = useCallback(() => {
    if (!persona) return;

    const tempResponses = {
      ...responses,
      ...(currentQuestion && currentValue !== null
        ? {
            [currentQuestion.id]: {
              questionId: currentQuestion.id,
              value: currentValue,
              isUnsure,
              confidence,
            },
          }
        : {}),
    };

    const clarity = calculateClarity(tempResponses);
    const avgConf = calculateAvgConfidence(tempResponses);
    const unsure = getUnsureCount(tempResponses);

    const updatedPersona: PersonaDisplay = {
      ...persona,
      clarity,
      avgConfidence: avgConf,
      unsureCount: unsure,
    };

    if (currentQuestion && currentValue !== null && !isUnsure) {
      const [section, key] = currentQuestion.field.split('.');
      if (section && key) {
        if (section === 'demographics') {
          updatedPersona.demographics = {
            ...updatedPersona.demographics,
            [key]: currentValue,
          };
        } else if (section === 'jobs') {
          updatedPersona.jobs = { ...updatedPersona.jobs, [key]: currentValue };
        } else if (section === 'goals') {
          updatedPersona.goals = {
            ...updatedPersona.goals,
            [key]: currentValue,
          };
        } else if (section === 'frustrations') {
          updatedPersona.frustrations = {
            ...updatedPersona.frustrations,
            [key]: currentValue,
          };
        } else if (section === 'behaviors') {
          updatedPersona.behaviors = {
            ...updatedPersona.behaviors,
            [key]: currentValue,
          };
        }
      } else if (currentQuestion.field === 'quote') {
        updatedPersona.quote = currentValue as string;
      } else if (currentQuestion.field === 'antiPatterns') {
        updatedPersona.antiPatterns = currentValue as string[];
      }
    }

    updatedPersona.archetype = generateArchetype(updatedPersona);
    updatedPersona.summary = generateSummary(updatedPersona);

    setPersona(updatedPersona);
  }, [responses, currentQuestion, currentValue, isUnsure, confidence, persona]);

  useEffect(() => {
    if (loadState === 'loaded') {
      updatePersonaPreview();
    }
  }, [currentValue, isUnsure, loadState, updatePersonaPreview]);

  // Render question component based on type
  const renderQuestion = (question: Question) => {
    const props = {
      question,
      value: currentValue,
      onChange: setCurrentValue,
      disabled: isUnsure,
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

  // Check if current question should show skip confirmation
  const shouldShowSkipConfirmation =
    currentCustomizedQuestion?.isSkipped &&
    currentCustomizedQuestion?.confirmationPrompt &&
    currentCustomizedQuestion?.skippedValue &&
    showSkipConfirmation;

  // Loading state
  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading session...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (loadState === 'not-found') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-6 block">🔍</span>
          <h1 className="text-2xl font-display text-white mb-4">
            Session Not Found
          </h1>
          <p className="text-zinc-400 mb-8">
            This session may have been completed or no longer exists.
          </p>
          <Link
            href="/clarity-canvas/modules/persona-sharpener"
            className="px-6 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors inline-block"
          >
            Start New Session
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-6 block">⚠️</span>
          <h1 className="text-2xl font-display text-white mb-4">
            Something Went Wrong
          </h1>
          <p className="text-zinc-400 mb-8">
            {error || 'Unable to load the session. Please try again.'}
          </p>
          <Link
            href="/clarity-canvas/modules/persona-sharpener"
            className="px-6 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors inline-block"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  // Completed session view
  if (loadState === 'completed' && persona) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white py-12 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-6xl mb-4 block">✓</span>
            <h1 className="text-4xl font-display text-white mb-4">
              Persona Complete
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              You&apos;ve completed this persona with {persona.clarity.overall}%
              clarity. Review your persona below or continue to the next one.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <PersonaCard persona={persona} showValidationShare />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/clarity-canvas/modules/persona-sharpener"
              className="px-8 py-4 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors text-center"
            >
              Back to Overview
            </Link>
            <Link
              href="/clarity-canvas/modules"
              className="px-8 py-4 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors text-center"
            >
              Explore More Modules
            </Link>
          </div>

          {persona.unsureCount > 0 && (
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center max-w-2xl mx-auto">
              <p className="text-amber-400">
                You marked <strong>{persona.unsureCount}</strong> answers as
                uncertain. Consider validating these with real customer
                interviews.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Questionnaire UI
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Progress bar - OUTSIDE AnimatePresence to prevent stacking context issues */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-800 z-50 pointer-events-none">
        <motion.div
          className="h-full bg-[#D4A84B]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header - OUTSIDE AnimatePresence to ensure clicks always work */}
      <header className="fixed top-0 left-0 right-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-40 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/clarity-canvas/modules/persona-sharpener"
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Exit
          </Link>

          {/* Persona Switcher - Only show if multiple personas */}
          {siblingPersonas.length > 1 && (
            <div className="flex items-center gap-1">
              {siblingPersonas.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.isCurrent) return;
                    if (p.sessionId) {
                      router.push(`/clarity-canvas/modules/persona-sharpener/${p.sessionId}`);
                    } else {
                      // Create a new session for this persona
                      handleSwitchToPersona(p.id);
                    }
                  }}
                  disabled={p.isCurrent || isLoading}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    p.isCurrent
                      ? 'bg-[#D4A84B] text-black'
                      : p.isComplete
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                  title={p.name || `Persona ${idx + 1}`}
                >
                  {p.isComplete && !p.isCurrent ? '✓ ' : ''}
                  {p.name || `Persona ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <span className="text-zinc-500 text-sm">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key="questionnaire"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen"
        >
          {/* Main content */}
          <div className="pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                {/* Persona preview side - LEFT */}
                <div className="hidden lg:block py-8">
                  <div className="sticky top-24">
                    {persona && (
                      <PersonaCard
                        persona={persona}
                      />
                    )}
                  </div>
                </div>

                {/* Question side - RIGHT */}
                <div className="py-8">
                  {shouldShowSkipConfirmation && currentCustomizedQuestion ? (
                    <SkipConfirmation
                      confirmationPrompt={
                        currentCustomizedQuestion.confirmationPrompt!
                      }
                      skippedValue={currentCustomizedQuestion.skippedValue!}
                      onConfirm={handleSkipConfirm}
                      onEdit={handleSkipEdit}
                      isLoading={isLoading}
                    />
                  ) : currentQuestion ? (
                    <>
                      {/* Category label */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#D4A84B]">
                          {currentQuestion.category}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">
                          {currentQuestionIndex + 1} of {totalQuestions}
                        </span>
                      </div>

                      <motion.h2
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl lg:text-3xl font-display text-white mb-8"
                      >
                        {/* Use contextualized text from customized questions if available */}
                        {currentCustomizedQuestion?.text || currentQuestion.question}
                      </motion.h2>

                      {renderQuestion(currentQuestion)}

                      {/* Confidence / Context (only for non-unsure answers) */}
                      {!isUnsure && currentValue !== null && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-8 space-y-6"
                        >
                          {/* Confidence slider */}
                          <div>
                            <label className="text-sm text-zinc-400 mb-2 block">
                              How confident are you in this answer?
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={confidence}
                              onChange={(e) =>
                                setConfidence(Number(e.target.value))
                              }
                              className="w-full accent-[#D4A84B]"
                            />
                            <div className="flex justify-between text-xs text-zinc-500 mt-1">
                              <span>Guess</span>
                              <span>{confidence}%</span>
                              <span>Certain</span>
                            </div>
                          </div>

                          {/* Additional context */}
                          <div>
                            <label className="text-sm text-zinc-400 mb-2 block">
                              Any additional context? (optional)
                            </label>
                            <textarea
                              value={additionalContext}
                              onChange={(e) =>
                                setAdditionalContext(e.target.value)
                              }
                              placeholder="E.g., based on user interviews, market research..."
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4A84B] resize-none"
                              rows={2}
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Actions */}
                      <div className="mt-8 flex items-center gap-4">
                        {currentQuestionIndex > 0 && (
                          <button
                            onClick={handleBack}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                          >
                            ← Back
                          </button>
                        )}

                        <div className="flex-1" />

                        <button
                          onClick={handleSkip}
                          disabled={isLoading}
                          className="px-4 py-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                        >
                          I don't know
                        </button>

                        <motion.button
                          onClick={handleContinue}
                          disabled={isLoading || currentValue === null}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </span>
                          ) : currentQuestionIndex < totalQuestions - 1 ? (
                            'Continue →'
                          ) : (
                            'Complete'
                          )}
                        </motion.button>
                      </div>

                      {error && (
                        <p className="mt-4 text-red-400 text-sm">{error}</p>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
