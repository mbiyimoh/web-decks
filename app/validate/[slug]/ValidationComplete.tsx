'use client';

/**
 * Validation Complete Component
 *
 * Thank you page shown after completing validation questionnaire.
 * Allows optional collection of respondent name/email.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  slug: string;
  sessionId: string;
}

type Stage = 'contact' | 'thanks';

export function ValidationComplete({ slug, sessionId }: Props) {
  const [stage, setStage] = useState<Stage>('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitWithContact = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/validate/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          respondentName: name || undefined,
          respondentEmail: email || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete session');
      }

      setStage('thanks');
    } catch (err) {
      console.error('Error completing session:', err);
      setError('Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/validate/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete session');
      }

      setStage('thanks');
    } catch (err) {
      console.error('Error completing session:', err);
      setError('Failed to complete. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contact collection stage
  if (stage === 'contact') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full"
        >
          <span className="text-6xl mb-6 block">🎉</span>
          <h1 className="text-3xl lg:text-4xl font-display text-white mb-4">
            You&apos;re Done!
          </h1>
          <p className="text-zinc-400 mb-8">
            Thank you for sharing your perspective. Your feedback helps build better products.
          </p>

          {/* Optional contact form */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6 text-left">
            <p className="text-zinc-300 text-sm mb-4">
              Want to stay connected? Share your details to hear about updates. (optional)
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4A84B]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4A84B]"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="flex flex-col gap-3">
            <motion.button
              onClick={handleSubmitWithContact}
              disabled={isSubmitting || (!name && !email)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit & Stay Connected'
              )}
            </motion.button>

            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full px-6 py-3 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Skip & Finish
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Final thanks stage
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-7xl mb-6 block"
        >
          ✨
        </motion.span>
        <h1 className="text-3xl lg:text-4xl font-display text-white mb-4">
          Thank You!
        </h1>
        <p className="text-zinc-400 mb-8">
          Your feedback has been recorded. You can close this window now.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Response saved
        </div>
      </motion.div>
    </div>
  );
}
