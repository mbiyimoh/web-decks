import { getUnifiedSession } from '@/lib/client-session-bridge';
import { ClarityCanvasClient } from './ClarityCanvasClient';

export default async function ClarityCanvasPage() {
  // Auth is checked in layout.tsx, but we need user data
  const session = await getUnifiedSession();

  const user = session
    ? { id: session.userId, email: session.userEmail }
    : {};

  return <ClarityCanvasClient user={user} />;
}
