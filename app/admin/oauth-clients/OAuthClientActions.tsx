'use client';

/**
 * Client-side OAuth client action buttons.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Power, PowerOff, Trash2, RefreshCw } from 'lucide-react';

interface OAuthClientActionsProps {
  clientId: string;
  isActive: boolean;
  isFirstParty: boolean;
}

export function OAuthClientActions({
  clientId,
  isActive,
  isFirstParty,
}: OAuthClientActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: 'toggle' | 'revoke' | 'delete') {
    if (action === 'delete') {
      const confirmed = confirm(
        `Are you sure you want to delete OAuth client "${clientId}"? This cannot be undone.`
      );
      if (!confirmed) return;
    }

    if (action === 'revoke') {
      const confirmed = confirm(
        `Are you sure you want to revoke all tokens for "${clientId}"? Users will need to re-authenticate.`
      );
      if (!confirmed) return;
    }

    setLoading(action);

    try {
      const res = await fetch(`/api/admin/oauth-clients/${clientId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Action failed');
        return;
      }

      if (action === 'revoke') {
        alert(`Revoked ${data.revokedCount} tokens`);
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
      {/* Revoke tokens button */}
      <button
        onClick={() => handleAction('revoke')}
        disabled={loading !== null}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1a1a1f] text-[#888] rounded hover:bg-[#222] hover:text-[#f5f5f5] transition-colors disabled:opacity-50"
      >
        <RefreshCw className="w-4 h-4" />
        {loading === 'revoke' ? 'Revoking...' : 'Revoke Tokens'}
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

      {/* Delete button (only for non-first-party) */}
      {!isFirstParty && (
        <button
          onClick={() => handleAction('delete')}
          disabled={loading !== null}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-[#2a1a1a] text-[#f87171] rounded hover:bg-[#3a1a1a] transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {loading === 'delete' ? 'Deleting...' : 'Delete'}
        </button>
      )}
    </div>
  );
}
