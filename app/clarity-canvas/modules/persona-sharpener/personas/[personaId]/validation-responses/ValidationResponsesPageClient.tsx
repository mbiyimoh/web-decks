'use client';

/**
 * Validation Responses Page Client
 *
 * Shows all validation responses for a persona with dual view modes:
 * - By Question: Compare all responses for each question
 * - By Session: Drill down into individual respondent sessions
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ValidationSummaryHeader } from '@/app/clarity-canvas/modules/persona-sharpener/components/ValidationSummaryHeader';
import { ConfidenceCallout } from '@/app/clarity-canvas/modules/persona-sharpener/components/ConfidenceCallout';
import { ValidationViewToggle } from '@/app/clarity-canvas/modules/persona-sharpener/components/ValidationViewToggle';
import { ValidationByQuestionView } from '@/app/clarity-canvas/modules/persona-sharpener/components/ValidationByQuestionView';
import { ValidationSessionList } from '@/app/clarity-canvas/modules/persona-sharpener/components/ValidationSessionList';
import { ValidationSessionDetail } from '@/app/clarity-canvas/modules/persona-sharpener/components/ValidationSessionDetail';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import type {
  ValidationSummary,
  ValidationSessionSummary,
  ValidationResponseByQuestion,
  ValidationResponseBySession,
} from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  personaId: string;
}

// Transform SessionResponseWithComparison to SessionResponse format for detail view
interface SessionResponse {
  questionId: string;
  questionText: string;
  founderValue: unknown;
  validatorValue: unknown;
}

export function ValidationResponsesPageClient({ personaId }: Props) {
  // View state
  const [activeView, setActiveView] = useState<'by-question' | 'by-session'>('by-question');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showEmptySessions, setShowEmptySessions] = useState(false);
  const [focusedQuestionId, setFocusedQuestionId] = useState<string | null>(null);

  // Refs for auto-scroll
  const sessionDetailRef = useRef<HTMLDivElement>(null);

  // Data state
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [personaName, setPersonaName] = useState('');
  const [responsesByQuestion, setResponsesByQuestion] = useState<Record<string, ValidationResponseByQuestion>>({});
  const [sessions, setSessions] = useState<ValidationSessionSummary[]>([]);
  const [sessionResponses, setSessionResponses] = useState<Map<string, SessionResponse[]>>(new Map());

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-responses`
        );

        if (!response.ok) {
          // Try to get specific error message from API
          let errorMessage = 'Failed to fetch validation responses';
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // If parsing fails, use generic message
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Set summary and metadata
        setSummary(data.summary);
        setPersonaName(data.personaName || '');

        // Set responses by question (keep as Record)
        setResponsesByQuestion(data.responsesByQuestion || {});

        // Set sessions
        setSessions(data.sessions || []);

        // Build session responses map - transform to SessionResponse format
        const responseMap = new Map<string, SessionResponse[]>();
        const responsesBySession = data.responsesBySession as ValidationResponseBySession[] | undefined;

        if (responsesBySession) {
          responsesBySession.forEach((sessionData) => {
            const transformedResponses: SessionResponse[] = sessionData.responses.map((response) => {
              const question = questionSequence.find((q) => q.id === response.questionId);
              return {
                questionId: response.questionId,
                questionText: question?.question || response.questionId,
                founderValue: response.founderAssumption?.value ?? null,
                validatorValue: response.value,
              };
            });
            responseMap.set(sessionData.session.id, transformedResponses);
          });
        }

        setSessionResponses(responseMap);
      } catch (err) {
        console.error('Error fetching validation data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load validation responses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [personaId]);

  // Auto-scroll to session detail when a session is selected
  useEffect(() => {
    if (selectedSessionId && sessionDetailRef.current) {
      sessionDetailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSessionId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl mb-4 block">⚠️</span>
          <p className="text-red-400 mb-4">{error || 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[#D4A84B] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Filter sessions by answer count
  const sessionsWithAnswers = sessions.filter(s => s.questionsAnswered > 0);
  const emptySessions = sessions.filter(s => s.questionsAnswered === 0);

  // Handle clicking a "Needs Attention" question
  const handleQuestionClick = (questionId: string) => {
    setActiveView('by-question');
    setFocusedQuestionId(questionId);
  };

  // Get selected session data
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const selectedSessionResponseList = selectedSessionId ? sessionResponses.get(selectedSessionId) || [] : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <a
          href={`/clarity-canvas/modules/persona-sharpener/personas/${personaId}`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Persona
        </a>

        {/* Summary header */}
        <ValidationSummaryHeader
          summary={summary}
          personaName={personaName}
          onQuestionClick={handleQuestionClick}
        />

        {/* Confidence callout */}
        <ConfidenceCallout
          level={summary.confidenceLevel}
          currentResponses={summary.totalSessions}
        />

        {/* View toggle */}
        <ValidationViewToggle activeView={activeView} onViewChange={setActiveView} />

        {/* Content based on active view */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'by-question' ? (
            <ValidationByQuestionView
              responses={responsesByQuestion}
              focusedQuestionId={focusedQuestionId}
              onFocusHandled={() => setFocusedQuestionId(null)}
            />
          ) : (
            <div className="space-y-4">
              <ValidationSessionList
                sessions={sessionsWithAnswers}
                onSelectSession={setSelectedSessionId}
                selectedSessionId={selectedSessionId}
              />

              {/* Toggle for empty sessions */}
              {emptySessions.length > 0 && (
                <button
                  onClick={() => setShowEmptySessions(!showEmptySessions)}
                  className="w-full text-sm text-zinc-500 hover:text-zinc-300 py-2 border border-dashed border-zinc-800 rounded-lg transition-colors"
                >
                  {showEmptySessions ? 'Hide' : 'Show'} {emptySessions.length} session{emptySessions.length !== 1 ? 's' : ''} with 0 answers
                </button>
              )}

              {showEmptySessions && emptySessions.length > 0 && (
                <ValidationSessionList
                  sessions={emptySessions}
                  onSelectSession={setSelectedSessionId}
                  selectedSessionId={selectedSessionId}
                />
              )}

              {/* Session detail with ref for auto-scroll */}
              <div ref={sessionDetailRef}>
                {selectedSession && (
                  <ValidationSessionDetail
                    session={selectedSession}
                    responses={selectedSessionResponseList}
                    onClose={() => setSelectedSessionId(null)}
                  />
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
