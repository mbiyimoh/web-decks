import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForClient } from '@/lib/session';
import { getClient } from '@/lib/clients';
import { getFullProjectData } from '@/lib/client-projects';
import ProjectDetailPage from '@/components/portal/ProjectDetailPage';

interface Props {
  params: Promise<{ client: string; projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { client: clientId, projectId } = await params;
  const client = getClient(clientId);

  if (!client) {
    notFound();
  }

  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());

  const isAuthenticated = isSessionValidForClient(session, clientId);

  if (!isAuthenticated) {
    // Redirect to portal login with returnTo
    const returnTo = encodeURIComponent(`/client-portals/${clientId}/project/${projectId}`);
    redirect(`/client-portals/${clientId}?returnTo=${returnTo}`);
  }

  // Fetch full project data
  const project = getFullProjectData(clientId, projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetailPage project={project} clientId={clientId} />;
}

export async function generateMetadata({ params }: Props) {
  const { client: clientId, projectId } = await params;
  const client = getClient(clientId);
  const project = getFullProjectData(clientId, projectId);

  if (!client || !project) {
    return { title: 'Project Not Found' };
  }

  const title = `${project.name} | ${client.name} Portal`;
  const description = project.description;

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
