'use client';

import { signOut } from 'next-auth/react';

interface LogoutButtonProps {
  returnTo?: string;
}

export function LogoutButton({ returnTo = '/auth/signin' }: LogoutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: returnTo })}
      className="
        text-[#555555] hover:text-[#f5f5f5]
        text-sm transition-colors
      "
    >
      Sign out
    </button>
  );
}
