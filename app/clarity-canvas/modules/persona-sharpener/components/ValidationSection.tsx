'use client';

/**
 * Validation Section (Inline)
 *
 * Displays validation link info, stats, and actions directly on the persona page
 * instead of in a modal. Provides the same functionality: copy link, view responses,
 * toggle active state.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ValidationLinkInfo } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  personaId: string;
  personaName: string;
}

export function ValidationSection({ personaId, personaName }: Props) {
  const [linkInfo, setLinkInfo] = useState<ValidationLinkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch or create validation link on mount
  useEffect(() => {
    async function fetchLink() {
      try {
        const response = await fetch(
          `/api/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-link`
        );

        if (!response.ok) {
          throw new Error('Failed to get validation link');
        }

        const data = await response.json();
        setLinkInfo(data.validationLink);
      } catch (err) {
        console.error('Error fetching validation link:', err);
        setError('Failed to load validation link. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLink();
  }, [personaId]);

  const handleCopy = async () => {
    if (!linkInfo) return;

    try {
      await navigator.clipboard.writeText(linkInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggleActive = async () => {
    if (!linkInfo) return;

    setIsToggling(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-link`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !linkInfo.isActive }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update link');
      }

      const data = await response.json();
      setLinkInfo(data.validationLink);
    } catch (err) {
      console.error('Error toggling link:', err);
      setError('Failed to update link. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
        <div className="text-center py-4">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[#D4A84B] text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!linkInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-display text-white">Validate with Real Users</h3>
          <p className="text-zinc-400 text-sm">
            Share this link to test your assumptions about {personaName}
          </p>
        </div>
      </div>

      {/* Link Input + Copy */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Shareable Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={linkInfo.url}
            readOnly
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-[#D4A84B] text-black hover:bg-[#e0b55c]'
            }`}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </span>
            ) : (
              'Copy Link'
            )}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-center">
          <p className="text-3xl font-display text-white">{linkInfo.totalSessions}</p>
          <p className="text-xs text-zinc-500 mt-1">Sessions Started</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-center">
          <p className="text-3xl font-display text-white">{linkInfo.totalResponses}</p>
          <p className="text-xs text-zinc-500 mt-1">Responses Collected</p>
        </div>
      </div>

      {/* View Responses Button - only if responses exist */}
      {linkInfo.totalResponses > 0 && (
        <a
          href={`/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-responses`}
          className="flex items-center justify-center gap-2 w-full bg-[#D4A84B] hover:bg-[#e0b55c] text-black font-medium py-3 px-4 rounded-lg text-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View All Responses ({linkInfo.totalResponses})
        </a>
      )}

      {/* Active Toggle */}
      <div className="flex items-center justify-between py-3 border-t border-zinc-700">
        <div>
          <p className="text-white text-sm">Link Active</p>
          <p className="text-zinc-500 text-xs">
            {linkInfo.isActive
              ? 'People can access this link'
              : 'Link is disabled and cannot be accessed'}
          </p>
        </div>
        <button
          onClick={handleToggleActive}
          disabled={isToggling}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            linkInfo.isActive ? 'bg-green-500' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              linkInfo.isActive ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* How it works - collapsible or always shown */}
      <details className="group">
        <summary className="text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors list-none flex items-center gap-2">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          How validation works
        </summary>
        <ul className="mt-3 text-zinc-400 space-y-2 text-sm pl-6 list-disc">
          <li>Share this link with real potential customers</li>
          <li>They answer the same questions you did (about themselves)</li>
          <li>Compare their answers to your assumptions</li>
          <li>Refine your persona based on real data</li>
        </ul>
      </details>
    </motion.div>
  );
}
