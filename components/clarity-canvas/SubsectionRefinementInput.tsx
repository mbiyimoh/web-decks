'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Pencil, Check, X, Loader2 } from 'lucide-react';
import {
  GOLD,
  TEXT_MUTED,
  TEXT_PRIMARY,
  GREEN,
  RED,
} from '@/components/portal/design-tokens';

interface RefinementPreview {
  refinedSummary: string;
  changeSummary: string;
}

interface SubsectionRefinementInputProps {
  subsectionId: string;
  subsectionName: string;
  onRefined: () => void;
}

export function SubsectionRefinementInput({
  subsectionId,
  subsectionName,
  onRefined,
}: SubsectionRefinementInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RefinementPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/clarity-canvas/subsections/${subsectionId}/refine`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await res.json();
      setPreview(data.preview);
    } catch (err) {
      console.error('Refinement error:', err);
      setError('Failed to generate preview. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!preview) return;
    setAccepting(true);

    try {
      const res = await fetch(
        `/api/clarity-canvas/subsections/${subsectionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: preview.refinedSummary,
          }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save changes');
      }

      onRefined();
      setPreview(null);
      setPrompt('');
      setExpanded(false);
    } catch (err) {
      console.error('Accept error:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setAccepting(false);
    }
  }

  function handleReject() {
    setPreview(null);
    setError(null);
  }

  // Preview state
  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-3 rounded-lg border"
        style={{ borderColor: GOLD }}
      >
        <p
          className="text-xs font-mono uppercase mb-2"
          style={{ color: GOLD }}
        >
          Preview Changes — {subsectionName}
        </p>
        <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
          {preview.changeSummary}
        </p>
        <div
          className="p-2 rounded mb-3"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="text-sm" style={{ color: TEXT_PRIMARY }}>
            {preview.refinedSummary}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs disabled:opacity-50"
            style={{ background: GREEN, color: 'black' }}
          >
            {accepting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Accept
          </button>
          <button
            onClick={handleReject}
            disabled={accepting}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs disabled:opacity-50"
            style={{ background: 'rgba(248,113,113,0.2)', color: RED }}
          >
            <X size={14} /> Reject
          </button>
        </div>
        {error && (
          <p className="text-xs mt-2" style={{ color: RED }}>
            {error}
          </p>
        )}
      </motion.div>
    );
  }

  // Input state
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs hover:opacity-80"
        style={{ color: GOLD }}
      >
        <Pencil size={12} />
        Refine {subsectionName}...
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`e.g., 'Summarize the key patterns' or 'Highlight the main strengths in ${subsectionName}'`}
                className="w-full p-2 rounded text-sm resize-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: TEXT_PRIMARY,
                }}
                rows={2}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || loading}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-50"
                  style={{ background: GOLD, color: 'black' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    'Generate Preview'
                  )}
                </button>
                {error && (
                  <p className="text-xs" style={{ color: RED }}>
                    {error}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
