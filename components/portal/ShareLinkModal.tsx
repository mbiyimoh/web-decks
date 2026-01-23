'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOLD, BG_PRIMARY, BG_SURFACE } from './design-tokens';
import { SHARE_PASSWORD_MIN_LENGTH } from '@/lib/session';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  artifactSlug: string;
  artifactTitle: string;
}

type ModalState = 'input' | 'loading' | 'success' | 'error';

export default function ShareLinkModal({
  isOpen,
  onClose,
  clientId,
  artifactSlug,
  artifactTitle,
}: ShareLinkModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState<ModalState>('input');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState<'link' | 'password' | null>(null);

  async function handleCreate() {
    if (password.length < SHARE_PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${SHARE_PASSWORD_MIN_LENGTH} characters`);
      return;
    }

    setState('loading');
    setError('');

    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, artifactSlug, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setShareUrl(data.url);
        setState('success');
      } else {
        setError(data.error || 'Failed to create share link');
        setState('error');
      }
    } catch {
      setError('An error occurred. Please try again.');
      setState('error');
    }
  }

  async function copyToClipboard(text: string, type: 'link' | 'password') {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleClose() {
    // Reset state when closing
    setPassword('');
    setError('');
    setState('input');
    setShareUrl('');
    setCopied(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-xl p-6"
          style={{ background: BG_SURFACE, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display text-white">
              {state === 'success' ? 'Share Link Created' : 'Create Share Link'}
            </h2>
            <button
              onClick={handleClose}
              className="text-[#888] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {state === 'success' ? (
            // Success State
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#888] mb-2">Share this link:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded text-sm text-white truncate"
                    style={{ background: BG_PRIMARY, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl, 'link')}
                    className="px-4 py-2 rounded font-medium text-sm transition-colors"
                    style={{
                      background: copied === 'link' ? '#4ade80' : GOLD,
                      color: BG_PRIMARY,
                    }}
                  >
                    {copied === 'link' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#888] mb-2">Share this password separately:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    readOnly
                    className="flex-1 px-3 py-2 rounded text-sm text-white font-mono"
                    style={{ background: BG_PRIMARY, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                  <button
                    onClick={() => copyToClipboard(password, 'password')}
                    className="px-4 py-2 rounded font-medium text-sm transition-colors"
                    style={{
                      background: copied === 'password' ? '#4ade80' : GOLD,
                      color: BG_PRIMARY,
                    }}
                  >
                    {copied === 'password' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div
                className="p-3 rounded text-xs"
                style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)' }}
              >
                <p className="text-[#4ade80]">
                  <strong>Security tip:</strong> Share the link and password through separate channels (e.g., link via email, password via text).
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2 rounded text-sm text-[#888] hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                Done
              </button>
            </div>
          ) : (
            // Input State
            <div className="space-y-4">
              <p className="text-sm text-[#888]">
                Create a password-protected link for <span className="text-white">&ldquo;{artifactTitle}&rdquo;</span>
              </p>

              <div>
                <label className="block text-sm text-[#888] mb-2">
                  Set a password (min {SHARE_PASSWORD_MIN_LENGTH} characters)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 rounded text-white placeholder-[#555]"
                  style={{
                    background: BG_PRIMARY,
                    border: error ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-xs text-[#f87171]">{error}</p>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={state === 'loading' || password.length < SHARE_PASSWORD_MIN_LENGTH}
                className="w-full py-3 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: GOLD, color: BG_PRIMARY }}
              >
                {state === 'loading' ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
