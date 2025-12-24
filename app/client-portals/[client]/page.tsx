import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForClient } from '@/lib/session';
import { getClient } from '@/lib/clients';
import PasswordGate from '@/components/portal/PasswordGate';
import ContentIndex from '@/components/portal/ContentIndex';

interface Props {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function ClientPortalPage({ params, searchParams }: Props) {
  const { client: clientId } = await params;
  const { returnTo } = await searchParams;
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
    return <PasswordGate clientId={clientId} clientName={client.name} returnTo={returnTo} />;
  }

  // Strip component references before passing to client component
  // (Functions can't be passed from Server to Client components)
  const clientData = {
    id: client.id,
    name: client.name,
    content: client.content.map(item => ({
      slug: item.slug,
      type: item.type,
      title: item.title,
      description: item.description,
      addedOn: item.addedOn,
      lastUpdated: item.lastUpdated,
    })),
  };

  return <ContentIndex client={clientData} />;
}

export async function generateMetadata({ params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    return { title: 'Portal Not Found' };
  }

  const title = `${client.name} Portal | 33 Strategies`;
  const description = `Access your ${client.name} strategy materials, proposals, and deliverables.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: '33 Strategies',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
