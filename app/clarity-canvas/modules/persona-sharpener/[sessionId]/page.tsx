import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PersonaSharpenerSession } from './PersonaSharpenerSession';
import { PersonaSharpenerErrorBoundary } from '../ErrorBoundary';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const session = await auth();
  const { sessionId } = await params;

  if (!session?.user) {
    redirect(
      `/auth/signin?returnTo=/clarity-canvas/modules/persona-sharpener/${sessionId}`
    );
  }

  return (
    <PersonaSharpenerErrorBoundary>
      <PersonaSharpenerSession user={session.user} sessionId={sessionId} />
    </PersonaSharpenerErrorBoundary>
  );
}
