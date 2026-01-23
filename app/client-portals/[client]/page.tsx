import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForClient } from '@/lib/session';
import { getClient } from '@/lib/clients';
import { getProjectForClient } from '@/lib/client-projects';
import { getActiveWorkForUser } from '@/lib/portal/active-work';
import PasswordGate from '@/components/portal/PasswordGate';
import EnhancedPortal from '@/components/portal/EnhancedPortal';

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

  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());

  const isAuthenticated = isSessionValidForClient(session, clientId);

  if (!isAuthenticated) {
    return <PasswordGate clientId={clientId} clientName={client.name} returnTo={returnTo} />;
  }

  // Fetch project data for this client (config-driven)
  const project = getProjectForClient(clientId);

  // Fetch active work (in-progress Clarity Canvas sessions)
  // Only fetch if we have a userId in session
  let activeWork: Awaited<ReturnType<typeof getActiveWorkForUser>> = [];
  if (session.userId) {
    try {
      activeWork = await getActiveWorkForUser(session.userId);
    } catch (error) {
      // Log error but don't fail the page - active work is optional
      console.error('[portal] Failed to fetch active work:', error);
    }
  }

  // Strip component references before passing to client component
  // (Functions can't be passed from Server to Client components)
  const clientData = {
    id: client.id,
    name: client.name,
    content: client.content.map((item) => ({
      slug: item.slug,
      type: item.type,
      title: item.title,
      description: item.description,
      addedOn: item.addedOn,
      lastUpdated: item.lastUpdated,
      tagOverride: item.tagOverride,
      shareable: item.shareable,
    })),
  };

  return (
    <EnhancedPortal
      client={clientData}
      project={project}
      activeWork={activeWork}
      portalType="client"
    />
  );
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
