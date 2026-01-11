'use client';

/**
 * Validation Link Modal
 *
 * Modal for founders to get/copy their persona validation link.
 * Fetches or creates the link on open, allows copying and toggling active state.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ValidationLinkInfo } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  personaId: string;
  personaName: string;
  onClose: () => void;
}

export function ValidationLinkModal({ personaId, personaName, onClose }: Props) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#111114] border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-display text-white mb-1">
            Share for Validation
          </h2>
          <p className="text-zinc-400 text-sm">
            Send this link to real potential customers to validate your assumptions about{' '}
            <span className="text-white">{personaName}</span>.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#D4A84B] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : linkInfo ? (
          <div className="space-y-4">
            {/* Link URL */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                Validation Link
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
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                    'Copy'
                  )}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                <p className="text-2xl font-display text-white">{linkInfo.totalSessions}</p>
                <p className="text-xs text-zinc-500">Sessions Started</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                <p className="text-2xl font-display text-white">{linkInfo.totalResponses}</p>
                <p className="text-xs text-zinc-500">Responses Collected</p>
              </div>
            </div>

            {/* View Responses Button */}
            {linkInfo.totalResponses > 0 && (
              <a
                href={`/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-responses`}
                className="block w-full bg-[#D4A84B] hover:bg-[#e0b55c] text-black font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                View All Responses ({linkInfo.totalResponses})
              </a>
            )}

            {/* Active toggle */}
            <div className="flex items-center justify-between py-3 border-t border-zinc-800">
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

            {/* Instructions */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm">
              <p className="text-zinc-300 mb-2">
                <strong className="text-white">How it works:</strong>
              </p>
              <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                <li>Share this link with real potential customers</li>
                <li>They answer the same questions you did (about themselves)</li>
                <li>Compare their answers to your assumptions</li>
                <li>Refine your persona based on real data</li>
              </ul>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
