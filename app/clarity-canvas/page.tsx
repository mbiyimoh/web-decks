import { getUnifiedSession } from '@/lib/client-session-bridge';
import { redirect } from 'next/navigation';
import { ClarityCanvasClient } from './ClarityCanvasClient';
import { UserSessionHeader } from '@/components/auth/UserSessionHeader';

export default async function ClarityCanvasPage() {
  // Auth is checked in layout.tsx, but we need user data
  const session = await getUnifiedSession();

  // Defensive check (should never happen if layout is correct)
  if (!session) {
    redirect('/auth/signin?returnTo=/clarity-canvas');
  }

  const user = {
    id: session.userId,
    email: session.userEmail,
  };

  return (
    <>
      {/* Fixed header with user session info */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <UserSessionHeader
          userEmail={session.userEmail}
          authSource={session.authSource}
        />
      </div>
      <ClarityCanvasClient user={user} />
    </>
  );
}
