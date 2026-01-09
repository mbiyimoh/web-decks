'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Brand constants
const GOLD = '#d4a54a';
const BG_PRIMARY = '#0a0a0f';

interface PasswordGateProps {
  clientId: string;
  clientName: string;
  returnTo?: string;
  portalType?: 'client' | 'strategist';
}

export default function PasswordGate({ clientId, clientName, returnTo, portalType = 'client' }: PasswordGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Unified auth endpoints check credentials against all clients
      const authPath = portalType === 'strategist' ? 'strategist-auth' : 'client-auth';
      const response = await fetch(`/api/${authPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Redirect to returnTo URL if provided, otherwise refresh current page
        if (returnTo) {
          router.push(returnTo);
        } else {
          router.refresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: BG_PRIMARY }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <p
            className="uppercase tracking-[0.2em] text-xs mb-3 font-mono"
            style={{ color: GOLD }}
          >
            {portalType === 'strategist' ? 'Strategist Portal' : 'Client Portal'}
          </p>
          <h1 className="text-3xl md:text-4xl text-white font-display">
            {clientName}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full px-4 py-3 rounded-xl text-white font-body focus:outline-none transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = GOLD;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl text-white font-body focus:outline-none transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = GOLD;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
              disabled={loading}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center font-body"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full px-4 py-3 font-medium font-body rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: GOLD,
              color: BG_PRIMARY,
            }}
          >
            {loading ? 'Verifying...' : 'Access Portal'}
          </button>
        </form>

        <p className="text-center text-sm mt-8 font-body" style={{ color: '#555' }}>
          <span className="font-display" style={{ color: GOLD }}>33</span> Strategies
        </p>
      </motion.div>
    </div>
  );
}
