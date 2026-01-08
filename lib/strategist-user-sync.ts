import { prisma } from '@/lib/prisma';

/**
 * Ensure a User record exists for a strategist portal user.
 * Uses upsert for atomic operation, with fallback for email-based lookup.
 *
 * authId format: "strategist-portal:{email}" to distinguish from other auth types.
 * Strategists are treated as TEAM_MEMBER users.
 */
export async function ensureStrategistUser(
  email: string,
  strategistId: string
): Promise<{ id: string; email: string }> {
  const normalizedEmail = email.toLowerCase();
  const authId = `strategist-portal:${normalizedEmail}`;

  try {
    // Try upsert first (atomic, handles race conditions)
    const user = await prisma.user.upsert({
      where: { authId },
      update: {
        userType: 'TEAM_MEMBER',
      },
      create: {
        authId,
        email: normalizedEmail,
        name: null,
        userType: 'TEAM_MEMBER',
      },
    });

    console.log(
      `[ensureStrategistUser] User synced: ${email} for strategist ${strategistId}`
    );
    return { id: user.id, email: user.email };
  } catch (error) {
    // If upsert fails (e.g., email exists with different authId), try email lookup
    console.warn(
      `[ensureStrategistUser] Upsert failed, trying email lookup:`,
      error
    );

    try {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingByEmail) {
        // Update to strategist-portal authId format
        const updated = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            authId,
            userType: 'TEAM_MEMBER',
          },
        });
        console.log(`[ensureStrategistUser] Migrated existing user: ${email}`);
        return { id: updated.id, email: updated.email };
      }
    } catch (fallbackError) {
      console.error(`[ensureStrategistUser] Fallback failed:`, fallbackError);
    }

    console.error(`[ensureStrategistUser] Failed for ${email}:`, error);
    throw new Error(
      `Failed to create or update user record for ${email}. Please contact support.`
    );
  }
}
