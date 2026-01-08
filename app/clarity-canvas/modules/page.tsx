import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { ModulesIndexClient } from './ModulesIndexClient';

export default async function ModulesPage() {
  const session = await getUnifiedSession();

  if (!session) {
    redirect('/auth/signin?returnTo=/clarity-canvas/modules');
  }

  // Convert unified session to user object format expected by client
  const user = {
    id: session.userId,
    email: session.userEmail,
  };

  return <ModulesIndexClient user={user} />;
}
