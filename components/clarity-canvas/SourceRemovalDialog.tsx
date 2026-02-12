'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface SourceRemovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceCount: number;
  isLoading?: boolean;
  error?: string | null;
}

export function SourceRemovalDialog({
  isOpen,
  onClose,
  onConfirm,
  sourceCount,
  isLoading = false,
  error = null,
}: SourceRemovalDialogProps) {
  const remainingCount = sourceCount - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-xl border p-6"
              style={{
                background: '#111114',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(248, 113, 113, 0.1)' }}
                  >
                    <AlertTriangle size={20} style={{ color: '#f87171' }} />
                  </div>
                  <h2 className="text-lg font-medium text-[#f5f5f5]">
                    Remove source?
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <p className="text-sm text-[#888888] mb-6">
                This will remove this source from the field
                {remainingCount > 0 ? (
                  <>
                    {' '}
                    and re-synthesize the summary from the remaining{' '}
                    {remainingCount} source{remainingCount > 1 ? 's' : ''}
                  </>
                ) : (
                  <> and clear the field content since no sources will remain</>
                )}
                . This action cannot be undone.
              </p>

              {/* Error display */}
              {error && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(248, 113, 113, 0.1)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    color: '#f87171',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm text-[#f5f5f5] hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                  style={{ background: '#f87171' }}
                >
                  {isLoading ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
