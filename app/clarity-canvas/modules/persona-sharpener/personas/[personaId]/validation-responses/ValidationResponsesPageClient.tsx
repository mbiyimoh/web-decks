'use client';

/**
 * Validation Responses Page Client
 *
 * Shows all validation responses for a persona organized by question,
 * allowing founders to compare their assumptions with real user responses.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ValidationByQuestionView } from '@/app/clarity-canvas/modules/persona-sharpener/components/ValidationByQuestionView';
import type { ValidationResponseByQuestion } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  personaId: string;
}

export function ValidationResponsesPageClient({ personaId }: Props) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, ValidationResponseByQuestion>>({});
  const [personaName, setPersonaName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResponses() {
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
        setResponses(data.responsesByQuestion || {});
        setPersonaName(data.personaName || '');
      } catch (err) {
        console.error('Error fetching validation responses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load validation responses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchResponses();
  }, [personaId]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-[#111114]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div>
            <h1 className="text-3xl font-display text-white mb-2">
              Validation Responses
            </h1>
            {personaName && (
              <p className="text-zinc-400">
                Comparing assumptions with real user responses for{' '}
                <span className="text-white font-medium">{personaName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">⚠️</span>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#D4A84B] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ValidationByQuestionView responses={responses} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
