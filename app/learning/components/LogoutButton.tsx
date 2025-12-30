'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/learning' })}
      className="
        text-[#555555] hover:text-[#f5f5f5]
        text-sm transition-colors
      "
    >
      Sign out
    </button>
  );
}
