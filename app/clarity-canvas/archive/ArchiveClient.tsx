'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { InputSessionCard } from './InputSessionCard';
import { FilterBar } from './FilterBar';
import type { InputSessionWithSources, InputSessionFilters } from '@/lib/input-session/types';
import {
  TEXT_PRIMARY,
  TEXT_MUTED,
  GOLD,
} from '@/components/portal/design-tokens';

export function ArchiveClient() {
  const searchParams = useSearchParams();
  const rawSessionId = searchParams.get('session');
  const rawChunkId = searchParams.get('chunk');

  // Validate both params are present (they're a pair)
  const validDeepLink = Boolean(rawSessionId && rawChunkId);
  const highlightSessionId = validDeepLink ? rawSessionId : null;
  const highlightChunkId = validDeepLink ? rawChunkId : null;

  const [sessions, setSessions] = useState<InputSessionWithSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InputSessionFilters>({
    inputType: null,
    pillar: null,
  });

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  async function fetchSessions() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.inputType) params.set('inputType', filters.inputType);
    if (filters.pillar) params.set('pillar', filters.pillar);

    const res = await fetch(`/api/clarity-canvas/sessions?${params}`);
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="mb-8">
        <Link
          href="/clarity-canvas"
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: TEXT_MUTED }}
        >
          ← Back to Canvas
        </Link>
        <h1
          className="text-2xl font-display mt-4"
          style={{ color: TEXT_PRIMARY }}
        >
          Raw Input Archive
        </h1>
        <p className="mt-2" style={{ color: TEXT_MUTED }}>
          Everything you&apos;ve shared is preserved here
        </p>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="space-y-4 mt-6">
        {loading ? (
          <div className="text-center py-8" style={{ color: TEXT_MUTED }}>
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: TEXT_MUTED }}>No inputs yet.</p>
            <Link
              href="/clarity-canvas"
              className="inline-block mt-4 text-sm hover:opacity-80"
              style={{ color: GOLD }}
            >
              Start by adding context to your pillars →
            </Link>
          </div>
        ) : (
          sessions.map((session) => (
            <InputSessionCard
              key={session.id}
              session={session}
              highlightChunkId={
                session.id === highlightSessionId ? highlightChunkId : null
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
