'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GOLD, BG_PRIMARY, BG_SURFACE } from '@/components/portal/design-tokens';

interface SharePasswordGateProps {
  slug: string;
  clientName: string;
  artifactTitle: string;
  isLocked: boolean;
  lockedUntil: Date | null;
}

export default function SharePasswordGate({
  slug,
  clientName,
  artifactTitle,
  isLocked,
  lockedUntil,
}: SharePasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/share/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh page to show artifact
        router.refresh();
      } else if (res.status === 429) {
        setError(data.error);
        setAttemptsRemaining(0);
      } else {
        setError(data.error || 'Invalid password');
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const minutesRemaining = lockedUntil
    ? Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000)
    : 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: BG_PRIMARY }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: BG_SURFACE }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke={GOLD}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <p
            className="text-xs font-mono uppercase tracking-wider mb-2"
            style={{ color: GOLD }}
          >
            {clientName}
          </p>

          <h1 className="text-2xl font-display text-white mb-2">
            {artifactTitle}
          </h1>

          <p className="text-sm text-[#888]">
            Enter the password to view this content
          </p>
        </div>

        {/* Form */}
        {isLocked && minutesRemaining > 0 ? (
          <div
            className="p-4 rounded-lg text-center"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <p className="text-[#f87171] text-sm">
              Too many failed attempts. Try again in {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-[#555] focus:outline-none transition-colors"
                  style={{
                    background: BG_SURFACE,
                    border: error ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  placeholder="Enter password"
                  autoFocus
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-sm text-[#f87171]" role="alert">
                  {error}
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <span className="block mt-1 text-xs text-[#888]">
                      {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                    </span>
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: GOLD,
                color: BG_PRIMARY,
              }}
            >
              {loading ? 'Verifying...' : 'Access Content'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-[#555]">
            Don&apos;t have the password?{' '}
            <span className="text-[#888]">Contact the person who shared this link.</span>
          </p>
        </div>

        {/* 33 Strategies Branding */}
        <div className="pt-8 text-center">
          <p className="text-xs text-[#555]">
            <span className="font-display" style={{ color: GOLD }}>33</span> Strategies
          </p>
        </div>
      </motion.div>
    </div>
  );
}
