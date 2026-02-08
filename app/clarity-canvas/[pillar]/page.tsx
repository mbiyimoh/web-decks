import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData } from '@/lib/session';
import { PROFILE_STRUCTURE, type SectionKey } from '@/lib/clarity-canvas/profile-structure';
import { prisma } from '@/lib/prisma';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import type { ProfileWithSections } from '@/lib/clarity-canvas/types';
import PillarPageClient from './PillarPageClient';

const validPillars = Object.keys(PROFILE_STRUCTURE);

export function generateStaticParams() {
  return validPillars.map((pillar) => ({ pillar }));
}

export default async function PillarPage({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;

  // Validate pillar slug
  if (!validPillars.includes(pillar)) {
    notFound();
  }

  // Get session
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
  if (!session?.isLoggedIn || !session?.userEmail) {
    notFound();
  }

  // Fetch profile with full nested relations
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      user: { email: session.userEmail }
    },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                include: { sources: true },
              },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  // Calculate scores server-side
  const typedProfile = profile as ProfileWithSections;
  const scores = calculateAllScores(typedProfile.sections);

  return (
    <PillarPageClient
      pillarKey={pillar as SectionKey}
      initialProfile={typedProfile}
      initialScores={scores}
    />
  );
}
