import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { PersonaSharpenerClient } from './PersonaSharpenerClient';
import { PersonaSharpenerErrorBoundary } from './ErrorBoundary';

export default async function PersonaSharpenerPage() {
  const session = await getUnifiedSession();

  if (!session) {
    redirect('/auth/signin?returnTo=/clarity-canvas/modules/persona-sharpener');
  }

  // Convert unified session to user object format expected by client
  const user = {
    id: session.userId,
    email: session.userEmail,
  };

  return (
    <PersonaSharpenerErrorBoundary>
      <PersonaSharpenerClient user={user} />
    </PersonaSharpenerErrorBoundary>
  );
}
