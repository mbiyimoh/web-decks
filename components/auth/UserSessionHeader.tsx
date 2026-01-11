'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserSessionHeaderProps {
  userEmail: string;
  authSource: 'nextauth' | 'client-portal';
}

/**
 * Displays current user email and logout button.
 * Handles both NextAuth (team) and iron-session (client) logouts.
 */
export function UserSessionHeader({ userEmail, authSource }: UserSessionHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (authSource === 'nextauth') {
      // NextAuth logout
      await signOut({ callbackUrl: '/auth/signin' });
    } else {
      // Iron-session logout - call API endpoint then redirect
      try {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/auth/signin');
        router.refresh();
      } catch (error) {
        console.error('Logout failed:', error);
        // Force redirect anyway
        router.push('/auth/signin');
      }
    }
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-zinc-500">
        {userEmail}
      </span>
      <button
        onClick={handleLogout}
        className="text-zinc-500 hover:text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
