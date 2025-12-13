import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForClient } from '@/lib/session';
import { getClient } from '@/lib/clients';
import PasswordGate from '@/components/portal/PasswordGate';
import ContentIndex from '@/components/portal/ContentIndex';

interface Props {
  params: Promise<{ client: string }>;
}

export default async function ClientPortalPage({ params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    notFound();
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  const isAuthenticated = isSessionValidForClient(session, clientId);

  if (!isAuthenticated) {
    return <PasswordGate clientId={clientId} clientName={client.name} />;
  }

  return <ContentIndex client={client} />;
}

export async function generateMetadata({ params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    return { title: 'Portal Not Found' };
  }

  return {
    title: `${client.name} Portal | 33 Strategies`,
    description: `Access your ${client.name} materials`,
  };
}
