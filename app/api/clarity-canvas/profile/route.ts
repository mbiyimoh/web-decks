import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedProfileForUser, initializeCanvasStructure } from '@/lib/clarity-canvas/seed-profile';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
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
  // Get user from unified session (NextAuth or client portal)
  const user = await ensureUserFromUnifiedSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find profile by user record ID
  const profile = await prisma.clarityProfile.findFirst({
    where: { userRecordId: user.id },
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
  // Get user from unified session (NextAuth or client portal)
  const user = await ensureUserFromUnifiedSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if profile exists by user record ID
  const existing = await prisma.clarityProfile.findFirst({
    where: { userRecordId: user.id },
    include: profileInclude,
  });

  if (existing) {
    // If profile exists but canvas not initialized (from Persona Sharpener), initialize it now
    if (!existing.isCanvasInitialized) {
      try {
        const initialized = await initializeCanvasStructure(existing.id);
        if (initialized) {
          return NextResponse.json({
            profile: initialized as ProfileWithSections,
            isNew: false,
          });
        }
        return NextResponse.json(
          { error: 'Failed to initialize canvas structure' },
          { status: 500 }
        );
      } catch (err) {
        console.error('[profile/route] Canvas initialization failed:', err);
        return NextResponse.json(
          { error: 'Canvas initialization failed' },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({
      profile: existing as ProfileWithSections,
      isNew: false,
    });
  }

  // Create new profile with full structure (this is explicit canvas access)
  const profile = await seedProfileForUser(
    user.authId,
    user.name || user.email || 'User'
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
