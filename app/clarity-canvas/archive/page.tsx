import { redirect } from 'next/navigation';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { ArchiveClient } from './ArchiveClient';

export const metadata = {
  title: 'Raw Input Archive | Clarity Canvas',
};

export default async function ArchivePage() {
  // Get user from unified session (supports both NextAuth and client portal)
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    redirect('/auth/signin');
  }

  return <ArchiveClient />;
}
