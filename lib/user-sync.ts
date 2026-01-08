import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

export type UserType = 'TEAM_MEMBER' | 'CLIENT' | 'POTENTIAL_CLIENT';

/**
 * Determines user type based on email domain.
 */
function determineUserType(email: string): UserType {
  if (email.endsWith('@33strategies.ai')) {
    return 'TEAM_MEMBER';
  }
  // Future: Check if email is linked to a client portal
  return 'POTENTIAL_CLIENT';
}

/**
 * Links any orphaned ClarityProfile to the user.
 * Orphaned = has userId (authId) but no userRecordId link.
 */
async function linkOrphanedProfile(userId: string, authId: string) {
  const orphanedProfile = await prisma.clarityProfile.findFirst({
    where: {
      userId: authId,        // Legacy column (stores authId)
      userRecordId: null,    // Not yet linked to User table
    },
  });

  if (orphanedProfile) {
    await prisma.clarityProfile.update({
      where: { id: orphanedProfile.id },
      data: { userRecordId: userId },
    });
  }
}

/**
 * Ensures a User record exists for the authenticated session.
 * Creates one if it doesn't exist.
 * Also links any orphaned ClarityProfile to the user.
 *
 * Call this at the start of any API route that needs user context.
 */
export async function ensureUser(session: Session) {
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error('Invalid session: missing user ID or email');
  }

  const authId = session.user.id;
  const email = session.user.email.toLowerCase();
  const name = session.user.name || email.split('@')[0];

  // First, try to find by authId
  let user = await prisma.user.findUnique({ where: { authId } });

  if (!user) {
    // Check if user exists with same email but different authId
    // This handles the OAuth vs credentials edge case
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    if (existingByEmail) {
      // Same person, different auth method - update authId
      user = await prisma.user.update({
        where: { email },
        data: {
          authId,  // Update to new auth method
          name,
          image: session.user.image,
        },
      });
    } else {
      // Brand new user
      user = await prisma.user.create({
        data: {
          authId,
          email,
          name,
          image: session.user.image,
          userType: determineUserType(email),
        },
      });
    }
  } else {
    // User exists, just update profile info (name/image may have changed)
    user = await prisma.user.update({
      where: { authId },
      data: { name, image: session.user.image },
    });
  }

  // Link orphaned ClarityProfile if exists (lazy migration)
  await linkOrphanedProfile(user.id, authId);

  return user;
}

/**
 * Get user with their clarity profile.
 */
export async function getUserWithProfile(authId: string) {
  return prisma.user.findUnique({
    where: { authId },
    include: {
      clarityProfile: true,
    },
  });
}
