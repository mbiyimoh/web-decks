/**
 * Credentials Management Page
 *
 * View, edit, and manage client portal credentials.
 */

import { prisma } from '@/lib/prisma';
import { Key, Lock, Unlock, AlertCircle } from 'lucide-react';
import { CredentialActions } from './CredentialActions';

export default async function CredentialsPage() {
  const credentials = await prisma.clientCredential.findMany({
    orderBy: { clientId: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display text-[#f5f5f5]">
          Client Credentials
        </h1>
        <p className="text-[#888] text-sm">{credentials.length} credentials</p>
      </div>

      <div className="space-y-4">
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="p-6 bg-[#111114] rounded-lg border border-[#222]"
          >
            <div className="flex items-start justify-between">
              {/* Left: Info */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    cred.isActive ? 'bg-[#1a1a1f]' : 'bg-[#2a1a1a]'
                  }`}
                >
                  <Key
                    className={`w-5 h-5 ${
                      cred.isActive ? 'text-[#d4a54a]' : 'text-[#f87171]'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-display text-[#f5f5f5]">
                      {cred.displayName}
                    </h2>
                    {!cred.isActive && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-[#2a1a1a] text-[#f87171] rounded">
                        INACTIVE
                      </span>
                    )}
                    {cred.lockedUntil && cred.lockedUntil > new Date() && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-[#2a2a1a] text-[#f59e0b] rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        LOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-[#888] text-sm font-mono">{cred.clientId}</p>
                  <p className="text-[#666] text-sm mt-1">{cred.email}</p>
                </div>
              </div>

              {/* Right: Stats & Actions */}
              <div className="flex items-center gap-6">
                {/* Failed attempts indicator */}
                {cred.failedAttempts > 0 && (
                  <div className="flex items-center gap-2 text-[#f59e0b]">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {cred.failedAttempts} failed attempts
                    </span>
                  </div>
                )}

                <CredentialActions
                  clientId={cred.clientId}
                  isActive={cred.isActive}
                  isLocked={!!(cred.lockedUntil && cred.lockedUntil > new Date())}
                />
              </div>
            </div>

            {/* Last updated */}
            <div className="mt-4 pt-4 border-t border-[#1a1a1f] flex items-center gap-4 text-xs text-[#555]">
              <span>Created: {cred.createdAt.toLocaleDateString()}</span>
              <span>Updated: {cred.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {credentials.length === 0 && (
          <div className="p-12 bg-[#111114] rounded-lg border border-[#222] text-center">
            <Key className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <p className="text-[#888]">No credentials configured</p>
            <p className="text-[#555] text-sm mt-1">
              Run the migration script to import existing passwords
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
