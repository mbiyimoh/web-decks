'use client';

/**
 * Validation Dashboard
 *
 * Founder dashboard for viewing validation responses with toggle
 * between by-question and by-session views.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type {
  ValidationViewMode,
  ValidationSessionSummary,
  ValidationResponseByQuestion,
  ValidationResponseBySession,
} from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';
import { ValidationByQuestionView } from './ValidationByQuestionView';
import { ValidationBySessionView } from './ValidationBySessionView';

interface Props {
  personaId: string;
  personaName: string;
}

interface DashboardData {
  view: ValidationViewMode;
  totalSessions: number;
  totalResponses: number;
  sessions: ValidationSessionSummary[];
  responses: Record<string, ValidationResponseByQuestion> | ValidationResponseBySession[];
}

export function ValidationDashboard({ personaId, personaName }: Props) {
  const [viewMode, setViewMode] = useState<ValidationViewMode>('by-question');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when view mode changes
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-responses?view=${viewMode}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch validation responses');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching validation responses:', err);
        setError('Failed to load validation responses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [personaId, viewMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display text-white">
            Validation Responses
          </h2>
          <p className="text-zinc-400 text-sm">
            Compare your assumptions about {personaName} with real customer feedback
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('by-question')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'by-question'
                ? 'bg-[#D4A84B] text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            By Question
          </button>
          <button
            onClick={() => setViewMode('by-session')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'by-session'
                ? 'bg-[#D4A84B] text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            By Session
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Sessions"
            value={data.totalSessions}
            icon="👥"
          />
          <StatCard
            label="Total Responses"
            value={data.totalResponses}
            icon="📝"
          />
          <StatCard
            label="Completed"
            value={data.sessions.filter((s) => s.status === 'completed').length}
            icon="✓"
          />
          <StatCard
            label="In Progress"
            value={data.sessions.filter((s) => s.status === 'in_progress').length}
            icon="⏳"
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => setViewMode(viewMode)}
            className="text-[#D4A84B] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : data ? (
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'by-question' ? (
            <ValidationByQuestionView
              responses={data.responses as Record<string, ValidationResponseByQuestion>}
            />
          ) : (
            <ValidationBySessionView
              sessions={data.sessions}
              responses={data.responses as ValidationResponseBySession[]}
            />
          )}
        </motion.div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-2xl font-display text-white">{value}</span>
      </div>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
