/**
 * Admin Layout
 *
 * Protects admin routes - requires @33strategies.ai email via NextAuth.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Shield, Users, Key, ChevronLeft } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Require team member auth
  if (!session?.user?.email?.endsWith('@33strategies.ai')) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-[#222] bg-[#0d0d12]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-[#888] hover:text-[#f5f5f5] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </Link>
              <div className="w-px h-6 bg-[#222]" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#d4a54a]" />
                <span className="text-[#f5f5f5] font-display">Admin</span>
              </div>
            </div>
            <div className="text-[#888] text-sm">{session.user.email}</div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-[#222] bg-[#111114]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            <NavLink href="/admin" icon={<Shield className="w-4 h-4" />}>
              Dashboard
            </NavLink>
            <NavLink href="/admin/credentials" icon={<Key className="w-4 h-4" />}>
              Credentials
            </NavLink>
            <NavLink href="/admin/oauth-clients" icon={<Users className="w-4 h-4" />}>
              OAuth Clients
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 py-4 text-[#888] hover:text-[#f5f5f5] border-b-2 border-transparent hover:border-[#d4a54a] transition-colors"
    >
      {icon}
      <span className="text-sm">{children}</span>
    </Link>
  );
}
