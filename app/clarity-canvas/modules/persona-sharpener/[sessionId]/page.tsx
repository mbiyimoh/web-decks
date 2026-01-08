import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { PersonaSharpenerSession } from './PersonaSharpenerSession';
import { PersonaSharpenerErrorBoundary } from '../ErrorBoundary';

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
      <PersonaSharpenerSession user={user} sessionId={sessionId} />
    </PersonaSharpenerErrorBoundary>
  );
}
