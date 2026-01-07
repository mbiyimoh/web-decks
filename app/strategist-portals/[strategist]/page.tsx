import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForStrategist } from '@/lib/session';
import { getStrategist } from '@/lib/strategists';
import PasswordGate from '@/components/portal/PasswordGate';
import ContentIndex from '@/components/portal/ContentIndex';

interface Props {
  params: Promise<{ strategist: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function StrategistPortalPage({ params, searchParams }: Props) {
  const { strategist: strategistId } = await params;
  const { returnTo } = await searchParams;
  const strategist = getStrategist(strategistId);

  if (!strategist) {
    notFound();
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  const isAuthenticated = isSessionValidForStrategist(session, strategistId);

  if (!isAuthenticated) {
    return (
      <PasswordGate
        clientId={strategistId}
        clientName={strategist.name}
        returnTo={returnTo}
        portalType="strategist"
      />
    );
  }

  // Strip component references before passing to client component
  // (Functions can't be passed from Server to Client components)
  const strategistData = {
    id: strategist.id,
    name: strategist.name,
    content: strategist.content.map(item => ({
      slug: item.slug,
      type: item.type,
      title: item.title,
      description: item.description,
      addedOn: item.addedOn,
      lastUpdated: item.lastUpdated,
      tagOverride: item.tagOverride,
    })),
  };

  return <ContentIndex client={strategistData} portalType="strategist" />;
}

export async function generateMetadata({ params }: Props) {
  const { strategist: strategistId } = await params;
  const strategist = getStrategist(strategistId);

  if (!strategist) {
    return { title: 'Portal Not Found' };
  }

  const title = `${strategist.name}'s Portal | 33 Strategies`;
  const description = `Internal portal for ${strategist.name}`;

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
