import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ModulesIndexClient } from './ModulesIndexClient';

export default async function ModulesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?returnTo=/clarity-canvas/modules');
  }

  return <ModulesIndexClient user={session.user} />;
}
