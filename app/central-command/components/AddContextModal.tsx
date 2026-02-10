'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  GOLD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  BG_SURFACE,
  BG_ELEVATED,
} from '@/components/portal/design-tokens';

interface AddContextModalProps {
  prospectId: string;
  prospectName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddContextModal({
  prospectId,
  prospectName,
  onClose,
  onSuccess,
}: AddContextModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/central-command/prospects/${prospectId}/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawContent: content,
            title: title || undefined,
            inputType: 'TEXT_INPUT',
            sourceContext: 'follow-up',
          }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save context');
      }

      onSuccess();
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-lg border p-6"
        style={{
          background: BG_SURFACE,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display" style={{ color: TEXT_PRIMARY }}>
            Add Context
          </h2>
          <button onClick={onClose} style={{ color: TEXT_MUTED }}>
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: TEXT_MUTED }}>
          Add additional context for {prospectName}
        </p>

        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-mono uppercase mb-2"
              style={{ color: GOLD }}
            >
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow-up call notes"
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: BG_ELEVATED,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: TEXT_PRIMARY,
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-mono uppercase mb-2"
              style={{ color: GOLD }}
            >
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste meeting notes, call transcript, or any additional context..."
              rows={8}
              className="w-full px-3 py-2 rounded border text-sm resize-none"
              style={{
                background: BG_ELEVATED,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: TEXT_PRIMARY,
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm"
              style={{ color: TEXT_MUTED }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !content.trim()}
              className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              style={{
                background: GOLD,
                color: '#0a0a0f',
              }}
            >
              {saving ? 'Saving...' : 'Save Context'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
