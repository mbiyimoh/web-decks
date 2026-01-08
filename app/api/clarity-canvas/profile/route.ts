import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { seedProfileForUser, initializeCanvasStructure } from '@/lib/clarity-canvas/seed-profile';
import { ensureUser } from '@/lib/user-sync';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import type { ProfileApiResponse, CreateProfileResponse, ProfileWithSections } from '@/lib/clarity-canvas/types';

// Helper for consistent profile includes
const profileInclude = {
  sections: {
    orderBy: { order: 'asc' as const },
    include: {
      subsections: {
        orderBy: { order: 'asc' as const },
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
};

/**
 * GET /api/clarity-canvas/profile
 * Retrieve the current user's Clarity Canvas profile with all nested data and scores
 */
export async function GET(): Promise<NextResponse<ProfileApiResponse | { error: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user record exists
  const user = await ensureUser(session);

  // Find profile using dual lookup
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userRecordId: user.id },
        { userId: session.user.id },
      ],
    },
    include: profileInclude,
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
 * This is for explicit Clarity Canvas access - creates full canvas structure.
 */
export async function POST(): Promise<NextResponse<CreateProfileResponse | { error: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user record exists
  const user = await ensureUser(session);

  // Check if profile exists using dual lookup
  const existing = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userRecordId: user.id },
        { userId: session.user.id },
      ],
    },
    include: profileInclude,
  });

  if (existing) {
    // If profile exists but canvas not initialized (from Persona Sharpener), initialize it now
    if (!existing.isCanvasInitialized) {
      const initialized = await initializeCanvasStructure(existing.id);
      if (initialized) {
        // Re-fetch with full structure
        const refreshed = await prisma.clarityProfile.findUnique({
          where: { id: existing.id },
          include: profileInclude,
        });
        return NextResponse.json({
          profile: refreshed as ProfileWithSections,
          isNew: false,
        });
      }
    }
    return NextResponse.json({
      profile: existing as ProfileWithSections,
      isNew: false,
    });
  }

  // Create new profile with full structure (this is explicit canvas access)
  const profile = await seedProfileForUser(
    session.user.id,
    session.user.name || session.user.email || 'User'
  );

  // Link to user record
  await prisma.clarityProfile.update({
    where: { id: profile.id },
    data: { userRecordId: user.id },
  });

  return NextResponse.json({
    profile,
    isNew: true,
  });
}
