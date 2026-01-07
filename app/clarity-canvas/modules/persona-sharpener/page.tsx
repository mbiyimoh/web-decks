import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PersonaSharpenerClient } from './PersonaSharpenerClient';
import { PersonaSharpenerErrorBoundary } from './ErrorBoundary';

export default async function PersonaSharpenerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?returnTo=/clarity-canvas/modules/persona-sharpener');
  }

  return (
    <PersonaSharpenerErrorBoundary>
      <PersonaSharpenerClient user={session.user} />
    </PersonaSharpenerErrorBoundary>
  );
}
