import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForClient } from '@/lib/session';
import { getClient, getClientContent } from '@/lib/clients';

interface Props {
  params: Promise<{ client: string; slug: string }>;
}

export default async function ContentPage({ params }: Props) {
  const { client: clientId, slug } = await params;
  const client = getClient(clientId);

  if (!client) {
    notFound();
  }

  const contentItem = getClientContent(clientId, slug);
  if (!contentItem) {
    notFound();
  }

  // Check authentication
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (!isSessionValidForClient(session, clientId)) {
    // Redirect to portal page with returnTo param so we come back after login
    const returnTo = encodeURIComponent(`/client-portals/${clientId}/${slug}`);
    redirect(`/client-portals/${clientId}?returnTo=${returnTo}`);
  }

  const Component = contentItem.component;
  return <Component />;
}

export async function generateMetadata({ params }: Props) {
  const { client: clientId, slug } = await params;
  const client = getClient(clientId);
  const content = getClientContent(clientId, slug);

  if (!client || !content) {
    return { title: 'Content Not Found' };
  }

  return {
    title: `${content.title} | ${client.name}`,
    description: content.description,
  };
}
