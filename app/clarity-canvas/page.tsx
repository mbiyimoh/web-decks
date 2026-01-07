import { auth } from '@/lib/auth';
import { ClarityCanvasClient } from './ClarityCanvasClient';

export default async function ClarityCanvasPage() {
  // Auth is checked in layout.tsx, but we need user data
  const session = await auth();

  return <ClarityCanvasClient user={session?.user || {}} />;
}
