/**
 * OAuth Clients Management Page
 *
 * View, register, and manage OAuth client applications.
 */

import { prisma } from '@/lib/prisma';
import { Users, Plus, ExternalLink, Shield } from 'lucide-react';
import { OAuthClientActions } from './OAuthClientActions';
import { RegisterClientForm } from './RegisterClientForm';

export default async function OAuthClientsPage() {
  const clients = await prisma.oAuthClient.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          refreshTokens: { where: { revoked: false, expiresAt: { gt: new Date() } } },
          consents: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display text-[#f5f5f5]">OAuth Clients</h1>
        <RegisterClientForm />
      </div>

      <div className="space-y-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="p-6 bg-[#111114] rounded-lg border border-[#222]"
          >
            <div className="flex items-start justify-between">
              {/* Left: Info */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    client.isActive ? 'bg-[#1a1a1f]' : 'bg-[#2a1a1a]'
                  }`}
                >
                  <Users
                    className={`w-5 h-5 ${
                      client.isActive ? 'text-[#d4a54a]' : 'text-[#f87171]'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-display text-[#f5f5f5]">
                      {client.clientName}
                    </h2>
                    {client.isFirstParty && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-[#1a2a1a] text-[#4ade80] rounded flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        FIRST-PARTY
                      </span>
                    )}
                    {!client.isActive && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-[#2a1a1a] text-[#f87171] rounded">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[#888] text-sm font-mono">{client.clientId}</p>

                  {/* Redirect URIs */}
                  <div className="mt-3">
                    <p className="text-[#555] text-xs font-mono uppercase tracking-wider mb-1">
                      Redirect URIs
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {client.redirectUris.map((uri, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-mono bg-[#0a0a0f] text-[#888] rounded"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {uri}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Scopes */}
                  <div className="mt-3">
                    <p className="text-[#555] text-xs font-mono uppercase tracking-wider mb-1">
                      Allowed Scopes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {client.scope.split(' ').map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-1 text-xs font-mono bg-[#1a1a2a] text-[#60a5fa] rounded"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Stats & Actions */}
              <div className="flex flex-col items-end gap-4">
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-[#f5f5f5] font-display">
                      {client._count.refreshTokens}
                    </p>
                    <p className="text-[#555] text-xs">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#f5f5f5] font-display">
                      {client._count.consents}
                    </p>
                    <p className="text-[#555] text-xs">Consents</p>
                  </div>
                </div>

                <OAuthClientActions
                  clientId={client.clientId}
                  isActive={client.isActive}
                  isFirstParty={client.isFirstParty}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-[#1a1a1f] flex items-center gap-4 text-xs text-[#555]">
              <span>Created: {client.createdAt.toLocaleDateString()}</span>
              <span>Grant types: {client.grantTypes.join(', ')}</span>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="p-12 bg-[#111114] rounded-lg border border-[#222] text-center">
            <Users className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <p className="text-[#888]">No OAuth clients registered</p>
            <p className="text-[#555] text-sm mt-1">
              Register a client to enable OAuth authentication
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
