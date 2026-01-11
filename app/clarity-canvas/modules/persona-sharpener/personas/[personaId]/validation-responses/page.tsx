import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { ValidationResponsesPageClient } from './ValidationResponsesPageClient';
import { PersonaSharpenerErrorBoundary } from '@/app/clarity-canvas/modules/persona-sharpener/ErrorBoundary';
import { UserSessionHeader } from '@/components/auth/UserSessionHeader';

export const metadata = {
  title: 'Validation Responses | Persona Sharpener',
  description: 'View validation responses for your persona',
};

export default async function ValidationResponsesPage({
  params,
}: {
  params: Promise<{ personaId: string }>;
}) {
  const session = await getUnifiedSession();
  const { personaId } = await params;

  if (!session) {
    redirect(
      `/auth/signin?returnTo=/clarity-canvas/modules/persona-sharpener/personas/${personaId}/validation-responses`
    );
  }

  return (
    <PersonaSharpenerErrorBoundary>
      {/* Fixed header with user session info */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <UserSessionHeader
          userEmail={session.userEmail}
          authSource={session.authSource}
        />
      </div>
      <ValidationResponsesPageClient personaId={personaId} />
    </PersonaSharpenerErrorBoundary>
  );
}
