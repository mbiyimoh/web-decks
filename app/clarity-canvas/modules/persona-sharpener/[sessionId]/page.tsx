import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { PersonaSharpenerSession } from './PersonaSharpenerSession';
import { PersonaSharpenerErrorBoundary } from '../ErrorBoundary';
import { UserSessionHeader } from '@/components/auth/UserSessionHeader';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const session = await getUnifiedSession();
  const { sessionId } = await params;

  if (!session) {
    redirect(
      `/auth/signin?returnTo=/clarity-canvas/modules/persona-sharpener/${sessionId}`
    );
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
      <PersonaSharpenerSession user={user} sessionId={sessionId} />
    </PersonaSharpenerErrorBoundary>
  );
}
