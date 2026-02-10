'use client';

import { useState, useEffect } from 'react';
import { X, Archive } from 'lucide-react';
import Link from 'next/link';
import {
  GOLD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  BG_SURFACE,
} from '@/components/portal/design-tokens';

const DISMISSED_KEY = 'input-preservation-card-dismissed';

export function InputPreservationCard() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div
      className="rounded-lg border p-4 mb-6"
      style={{
        background: BG_SURFACE,
        borderColor: 'rgba(212, 165, 74, 0.2)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Archive
            size={20}
            style={{ color: GOLD }}
            className="mt-0.5 flex-shrink-0"
          />
          <div>
            <h3 className="font-medium mb-1" style={{ color: TEXT_PRIMARY }}>
              Your inputs are always preserved
            </h3>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>
              Everything you share — voice recordings, text, uploaded files — is
              saved in its original form. Even as we synthesize your input into
              clear summaries, you can always revisit what you originally said.
            </p>
            <Link
              href="/clarity-canvas/archive"
              className="inline-block mt-3 text-sm hover:opacity-80"
              style={{ color: GOLD }}
            >
              View Archive →
            </Link>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="hover:opacity-60 flex-shrink-0"
          style={{ color: TEXT_MUTED }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
