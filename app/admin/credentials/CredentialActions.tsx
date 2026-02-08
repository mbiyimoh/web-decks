'use client';

/**
 * Client-side credential action buttons.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, RefreshCw, Power, PowerOff } from 'lucide-react';

interface CredentialActionsProps {
  clientId: string;
  isActive: boolean;
  isLocked: boolean;
}

export function CredentialActions({
  clientId,
  isActive,
  isLocked,
}: CredentialActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  async function handleAction(action: 'reset' | 'unlock' | 'toggle') {
    setLoading(action);
    setNewPassword(null);

    try {
      const res = await fetch(`/api/admin/credentials/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Action failed');
        return;
      }

      if (action === 'reset' && data.newPassword) {
        setNewPassword(data.newPassword);
      }

      router.refresh();
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Unlock button (only if locked) */}
      {isLocked && (
        <button
          onClick={() => handleAction('unlock')}
          disabled={loading !== null}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1a1a1f] text-[#f59e0b] rounded hover:bg-[#222] transition-colors disabled:opacity-50"
        >
          <Unlock className="w-4 h-4" />
          {loading === 'unlock' ? 'Unlocking...' : 'Unlock'}
        </button>
      )}

      {/* Reset password button */}
      <button
        onClick={() => handleAction('reset')}
        disabled={loading !== null}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1a1a1f] text-[#888] rounded hover:bg-[#222] hover:text-[#f5f5f5] transition-colors disabled:opacity-50"
      >
        <RefreshCw className="w-4 h-4" />
        {loading === 'reset' ? 'Resetting...' : 'Reset Password'}
      </button>

      {/* Toggle active button */}
      <button
        onClick={() => handleAction('toggle')}
        disabled={loading !== null}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors disabled:opacity-50 ${
          isActive
            ? 'bg-[#1a1a1f] text-[#888] hover:bg-[#2a1a1a] hover:text-[#f87171]'
            : 'bg-[#1a2a1a] text-[#4ade80] hover:bg-[#1a3a1a]'
        }`}
      >
        {isActive ? (
          <>
            <PowerOff className="w-4 h-4" />
            {loading === 'toggle' ? 'Deactivating...' : 'Deactivate'}
          </>
        ) : (
          <>
            <Power className="w-4 h-4" />
            {loading === 'toggle' ? 'Activating...' : 'Activate'}
          </>
        )}
      </button>

      {/* New password display */}
      {newPassword && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111114] rounded-lg border border-[#222] p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-display text-[#f5f5f5] mb-4">
              New Password Generated
            </h3>
            <p className="text-[#888] text-sm mb-4">
              Copy this password now. It will not be shown again.
            </p>
            <div className="bg-[#0a0a0f] rounded p-4 font-mono text-[#d4a54a] text-center mb-4 select-all">
              {newPassword}
            </div>
            <button
              onClick={() => setNewPassword(null)}
              className="w-full px-4 py-2 bg-[#d4a54a] text-[#0a0a0f] rounded hover:bg-[#e5b85b] transition-colors font-medium"
            >
              I&apos;ve Copied It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
