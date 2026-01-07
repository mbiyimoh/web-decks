'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

const GOLD = '#d4a54a';

export default function ClarityCanvasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Clarity Canvas error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-display text-white mb-3">
          Something went wrong
        </h2>

        <p className="text-zinc-400 mb-6">
          We encountered an unexpected error. Don&apos;t worry — your progress is saved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: GOLD, color: 'black' }}
          >
            Try Again
          </motion.button>

          <motion.a
            href="/clarity-canvas"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors"
          >
            Go to Dashboard
          </motion.a>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-zinc-600 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
