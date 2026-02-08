'use client';

/**
 * Form to register a new OAuth client.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';

export function RegisterClientForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    redirectUris: '',
    scope: 'read:profile read:synthesis',
    isFirstParty: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/oauth-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          redirectUris: formData.redirectUris
            .split('\n')
            .map((uri) => uri.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Registration failed');
        return;
      }

      setNewSecret(data.clientSecret);
      router.refresh();
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setNewSecret(null);
    setFormData({
      clientId: '',
      clientName: '',
      redirectUris: '',
      scope: 'read:profile read:synthesis',
      isFirstParty: false,
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#d4a54a] text-[#0a0a0f] rounded hover:bg-[#e5b85b] transition-colors font-medium"
      >
        <Plus className="w-4 h-4" />
        Register Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111114] rounded-lg border border-[#222] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#222]">
              <h2 className="text-lg font-display text-[#f5f5f5]">
                {newSecret ? 'Client Registered' : 'Register OAuth Client'}
              </h2>
              <button
                onClick={handleClose}
                className="text-[#888] hover:text-[#f5f5f5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Secret Display */}
            {newSecret ? (
              <div className="p-6">
                <p className="text-[#888] text-sm mb-4">
                  Copy this client secret now. It will not be shown again.
                </p>
                <div className="bg-[#0a0a0f] rounded p-4 font-mono text-[#d4a54a] text-center mb-4 select-all break-all">
                  {newSecret}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-[#d4a54a] text-[#0a0a0f] rounded hover:bg-[#e5b85b] transition-colors font-medium"
                >
                  I&apos;ve Copied It
                </button>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[#888] text-sm mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    placeholder="e.g., better-contacts"
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#222] rounded text-[#f5f5f5] placeholder-[#555] focus:border-[#d4a54a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#888] text-sm mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData({ ...formData, clientName: e.target.value })
                    }
                    placeholder="e.g., Better Contacts"
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#222] rounded text-[#f5f5f5] placeholder-[#555] focus:border-[#d4a54a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#888] text-sm mb-2">
                    Redirect URIs (one per line)
                  </label>
                  <textarea
                    value={formData.redirectUris}
                    onChange={(e) =>
                      setFormData({ ...formData, redirectUris: e.target.value })
                    }
                    placeholder="https://app.example.com/callback"
                    required
                    rows={3}
                    className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#222] rounded text-[#f5f5f5] placeholder-[#555] focus:border-[#d4a54a] focus:outline-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[#888] text-sm mb-2">
                    Allowed Scopes
                  </label>
                  <input
                    type="text"
                    value={formData.scope}
                    onChange={(e) =>
                      setFormData({ ...formData, scope: e.target.value })
                    }
                    placeholder="read:profile read:synthesis"
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#222] rounded text-[#f5f5f5] placeholder-[#555] focus:border-[#d4a54a] focus:outline-none font-mono text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isFirstParty"
                    checked={formData.isFirstParty}
                    onChange={(e) =>
                      setFormData({ ...formData, isFirstParty: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-[#222] bg-[#0a0a0f] text-[#d4a54a] focus:ring-[#d4a54a]"
                  />
                  <label htmlFor="isFirstParty" className="text-[#888] text-sm">
                    First-party app (skip consent screen)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#d4a54a] text-[#0a0a0f] rounded hover:bg-[#e5b85b] transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register Client'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
