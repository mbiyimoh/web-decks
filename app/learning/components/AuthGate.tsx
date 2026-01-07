'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

interface AuthGateProps {
  returnTo?: string;
}

export function AuthGate({ returnTo = '/learning' }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: returnTo });
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Access is restricted to @33strategies.ai emails.');
      } else {
        window.location.href = returnTo;
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <p className="text-[#d4a54a] uppercase tracking-[0.2em] text-xs font-mono mb-2">
            33 Strategies
          </p>
          <h1 className="text-3xl font-bold text-[#f5f5f5] font-display">
            Sign In
          </h1>
          <p className="text-[#888888] text-sm mt-2">
            Continue with your @33strategies.ai account
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="
              w-full px-4 py-3
              bg-white text-black font-medium rounded-xl
              hover:bg-zinc-200 transition-colors
              flex items-center justify-center gap-3
            "
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0f] text-[#555555]">or</span>
            </div>
          </div>

          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="
                w-full px-4 py-3
                bg-[#111114] border border-white/[0.08] rounded-xl
                text-[#f5f5f5] font-medium
                hover:bg-[#0d0d14] hover:border-white/[0.12]
                transition-colors
              "
            >
              Sign in with Email
            </button>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="
                  w-full px-4 py-3
                  bg-[#111114] border border-white/[0.08] rounded-xl
                  text-[#f5f5f5] placeholder-[#555555]
                  focus:outline-none focus:border-white/[0.12]
                  transition-colors
                "
                disabled={loading}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="
                  w-full px-4 py-3
                  bg-[#111114] border border-white/[0.08] rounded-xl
                  text-[#f5f5f5] placeholder-[#555555]
                  focus:outline-none focus:border-white/[0.12]
                  transition-colors
                "
                disabled={loading}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#f87171] text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="
                  w-full px-4 py-3
                  bg-[#d4a54a] text-black font-medium rounded-xl
                  hover:bg-[#e4b55a] transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[#555555] text-xs mt-8">
          Access restricted to 33 Strategies team members
        </p>
      </motion.div>
    </div>
  );
}
