/**
 * Admin Dashboard
 *
 * Overview of authentication system status and quick links.
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Key, Users, RefreshCw, Shield } from 'lucide-react';

export default async function AdminDashboard() {
  // Fetch stats
  const [credentialCount, clientCount, activeTokenCount, recentConsents] =
    await Promise.all([
      prisma.clientCredential.count(),
      prisma.oAuthClient.count(),
      prisma.oAuthRefreshToken.count({
        where: { revoked: false, expiresAt: { gt: new Date() } },
      }),
      prisma.oAuthUserConsent.count({
        where: { grantedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-display text-[#f5f5f5] mb-8">
        Authentication Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Client Credentials"
          value={credentialCount}
          icon={<Key className="w-5 h-5" />}
        />
        <StatCard
          label="OAuth Clients"
          value={clientCount}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Active Sessions"
          value={activeTokenCount}
          icon={<RefreshCw className="w-5 h-5" />}
        />
        <StatCard
          label="Consents (7d)"
          value={recentConsents}
          icon={<Shield className="w-5 h-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/admin/credentials"
          className="block p-6 bg-[#111114] rounded-lg border border-[#222] hover:border-[#d4a54a] transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1a1a1f] flex items-center justify-center group-hover:bg-[#222] transition-colors">
              <Key className="w-5 h-5 text-[#d4a54a]" />
            </div>
            <div>
              <h2 className="text-lg font-display text-[#f5f5f5] mb-1">
                Client Credentials
              </h2>
              <p className="text-[#888] text-sm">
                Manage portal passwords. Reset passwords, unlock accounts, toggle
                active status.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/oauth-clients"
          className="block p-6 bg-[#111114] rounded-lg border border-[#222] hover:border-[#d4a54a] transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1a1a1f] flex items-center justify-center group-hover:bg-[#222] transition-colors">
              <Users className="w-5 h-5 text-[#d4a54a]" />
            </div>
            <div>
              <h2 className="text-lg font-display text-[#f5f5f5] mb-1">
                OAuth Clients
              </h2>
              <p className="text-[#888] text-sm">
                Register external applications. Configure redirect URIs, scopes,
                and first-party status.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* System Status */}
      <div className="mt-8 p-6 bg-[#111114] rounded-lg border border-[#222]">
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#888] mb-4">
          System Status
        </h3>
        <div className="space-y-3">
          <StatusRow label="Database" status="connected" />
          <StatusRow
            label="Redis"
            status={process.env.REDIS_URL ? 'configured' : 'not configured'}
            warning={!process.env.REDIS_URL}
          />
          <StatusRow
            label="OAuth Keys"
            status={
              process.env.OAUTH_PRIVATE_KEY && process.env.OAUTH_PUBLIC_KEY
                ? 'configured'
                : 'not configured'
            }
            warning={
              !process.env.OAUTH_PRIVATE_KEY || !process.env.OAUTH_PUBLIC_KEY
            }
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-[#111114] rounded-lg border border-[#222]">
      <div className="flex items-center gap-2 text-[#888] mb-2">
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-display text-[#f5f5f5]">{value}</p>
    </div>
  );
}

function StatusRow({
  label,
  status,
  warning = false,
}: {
  label: string;
  status: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#888] text-sm">{label}</span>
      <span
        className={`text-sm ${warning ? 'text-[#f59e0b]' : 'text-[#4ade80]'}`}
      >
        {status}
      </span>
    </div>
  );
}
