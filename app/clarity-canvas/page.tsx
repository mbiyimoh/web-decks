import { getUnifiedSession } from '@/lib/client-session-bridge';
import { redirect } from 'next/navigation';
import { ClarityCanvasClient } from './ClarityCanvasClient';

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

  return <ClarityCanvasClient user={user} />;
}
