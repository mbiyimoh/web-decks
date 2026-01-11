import { redirect } from 'next/navigation';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { ValidationResponsesPageClient } from './ValidationResponsesPageClient';

export const metadata = {
  title: 'Validation Responses | Persona Sharpener',
  description: 'View validation responses for your persona',
};

export default async function ValidationResponsesPage({
  params,
}: {
  params: Promise<{ personaId: string }>;
}) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    redirect('/auth/login');
  }

  const { personaId } = await params;

  return <ValidationResponsesPageClient personaId={personaId} />;
}
