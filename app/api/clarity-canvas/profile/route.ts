import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { seedProfileForUser } from '@/lib/clarity-canvas/seed-profile';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import type { ProfileApiResponse, CreateProfileResponse, ProfileWithSections } from '@/lib/clarity-canvas/types';

/**
 * GET /api/clarity-canvas/profile
 * Retrieve the current user's Clarity Canvas profile with all nested data and scores
 */
export async function GET(): Promise<NextResponse<ProfileApiResponse | { error: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await prisma.clarityProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                include: {
                  sources: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ profile: null, scores: null });
  }

  // Calculate scores
  const typedProfile = profile as ProfileWithSections;
  const scores = calculateAllScores(typedProfile.sections);

  return NextResponse.json({
    profile: typedProfile,
    scores,
  });
}

/**
 * POST /api/clarity-canvas/profile
 * Create a new Clarity Canvas profile for the current user (or return existing)
 */
export async function POST(): Promise<NextResponse<CreateProfileResponse | { error: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if profile exists
  const existing = await prisma.clarityProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                include: {
                  sources: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      profile: existing as ProfileWithSections,
      isNew: false,
    });
  }

  // Create new profile with full structure
  const profile = await seedProfileForUser(
    session.user.id,
    session.user.name || session.user.email || 'User'
  );

  return NextResponse.json({
    profile,
    isNew: true,
  });
}
