import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForStrategist } from '@/lib/session';
import { getStrategist, getStrategistContent } from '@/lib/strategists';

interface Props {
  params: Promise<{ strategist: string; slug: string }>;
}

export default async function StrategistContentPage({ params }: Props) {
  const { strategist: strategistId, slug } = await params;
  const strategist = getStrategist(strategistId);

  if (!strategist) {
    notFound();
  }

  const contentItem = getStrategistContent(strategistId, slug);
  if (!contentItem) {
    notFound();
  }

  // Check authentication
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (!isSessionValidForStrategist(session, strategistId)) {
    // Redirect to portal page with returnTo param so we come back after login
    const returnTo = encodeURIComponent(`/strategist-portals/${strategistId}/${slug}`);
    redirect(`/strategist-portals/${strategistId}?returnTo=${returnTo}`);
  }

  const Component = contentItem.component;
  return <Component />;
}

export async function generateMetadata({ params }: Props) {
  const { strategist: strategistId, slug } = await params;
  const strategist = getStrategist(strategistId);
  const content = getStrategistContent(strategistId, slug);

  if (!strategist || !content) {
    return { title: 'Content Not Found' };
  }

  return {
    title: `${content.title} | ${strategist.name}`,
    description: content.description,
  };
}
