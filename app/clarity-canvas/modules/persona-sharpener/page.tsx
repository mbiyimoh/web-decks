import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { PersonaSharpenerClient } from './PersonaSharpenerClient';
import { PersonaSharpenerErrorBoundary } from './ErrorBoundary';
import { UserSessionHeader } from '@/components/auth/UserSessionHeader';

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
      {/* Fixed header with user session info */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <UserSessionHeader
          userEmail={session.userEmail}
          authSource={session.authSource}
        />
      </div>
      <PersonaSharpenerClient user={user} />
    </PersonaSharpenerErrorBoundary>
  );
}
