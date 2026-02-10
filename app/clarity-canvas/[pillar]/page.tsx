import { notFound } from 'next/navigation';
import { PROFILE_STRUCTURE, type SectionKey } from '@/lib/clarity-canvas/profile-structure';
import { prisma } from '@/lib/prisma';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
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

  // Get user from unified session (also triggers lazy migration for legacy profiles)
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    notFound();
  }

  // Fetch profile with full nested relations
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      userRecordId: user.id
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

  // Count input sessions for this pillar
  const inputSessionCount = await prisma.inputSession.count({
    where: {
      clarityProfileId: profile.id,
      sourceContext: { contains: pillar },
    },
  });

  // Calculate scores server-side
  const typedProfile = profile as ProfileWithSections;
  const scores = calculateAllScores(typedProfile.sections);

  return (
    <PillarPageClient
      pillarKey={pillar as SectionKey}
      initialProfile={typedProfile}
      initialScores={scores}
      inputSessionCount={inputSessionCount}
    />
  );
}
