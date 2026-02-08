import { prisma } from '@/lib/prisma';
import { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES } from './profile-structure';
import type { ProfileWithSections } from './types';

/**
 * Format a field key as a display name (fallback)
 * e.g., "decision_making" -> "Decision Making"
 */
function formatFieldKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Build the nested create data for the 6-section profile structure.
 * Shared by seedProfileForUser and initializeCanvasStructure.
 */
function buildProfileStructureCreateData() {
  return Object.entries(PROFILE_STRUCTURE).map(([sectionKey, section]) => ({
    key: sectionKey,
    name: section.name,
    icon: section.icon,
    order: section.order,
    subsections: {
      create: Object.entries(section.subsections).map(([subsectionKey, subsection]) => ({
        key: subsectionKey,
        name: subsection.name,
        order: subsection.order,
        fields: {
          create: subsection.fields.map((fieldKey: string) => ({
            key: fieldKey,
            name: FIELD_DISPLAY_NAMES[fieldKey] || formatFieldKey(fieldKey),
          })),
        },
      })),
    },
  }));
}

/** Shared include for full profile with nested sections */
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
 * Create a new profile with the complete 6-section structure for a user.
 * Returns existing profile if one already exists (idempotent).
 */
export async function seedProfileForUser(
  userId: string,
  userName: string
): Promise<ProfileWithSections> {
  const existing = await prisma.clarityProfile.findUnique({
    where: { userId },
    include: profileInclude,
  });

  if (existing) {
    return existing as ProfileWithSections;
  }

  const profile = await prisma.clarityProfile.create({
    data: {
      userId,
      name: userName,
      sections: {
        create: buildProfileStructureCreateData(),
      },
    },
    include: profileInclude,
  });

  return profile as ProfileWithSections;
}

/**
 * Delete a user's profile (for testing/admin purposes)
 */
export async function deleteProfileForUser(userId: string): Promise<boolean> {
  const deleted = await prisma.clarityProfile.deleteMany({
    where: { userId },
  });
  return deleted.count > 0;
}

/**
 * Get profile statistics
 */
export async function getProfileStats(userId: string): Promise<{
  exists: boolean;
  sectionCount: number;
  subsectionCount: number;
  fieldCount: number;
  sourceCount: number;
} | null> {
  const profile = await prisma.clarityProfile.findUnique({
    where: { userId },
    include: {
      sections: {
        include: {
          subsections: {
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
    return null;
  }

  let subsectionCount = 0;
  let fieldCount = 0;
  let sourceCount = 0;

  for (const section of profile.sections) {
    subsectionCount += section.subsections.length;
    for (const subsection of section.subsections) {
      fieldCount += subsection.fields.length;
      for (const field of subsection.fields) {
        sourceCount += field.sources.length;
      }
    }
  }

  return {
    exists: true,
    sectionCount: profile.sections.length,
    subsectionCount,
    fieldCount,
    sourceCount,
  };
}

/**
 * Create a minimal ClarityProfile for a user (no sections seeded).
 * Used by Persona Sharpener and other modules that don't need full canvas.
 *
 * @param user - User record from ensureUser()
 * @param authId - Legacy authId for backward compatibility
 */
export async function createMinimalProfile(user: {
  id: string;
  name: string | null;
}, authId: string) {
  return prisma.clarityProfile.create({
    data: {
      userId: authId,          // Legacy field (for backward compat during transition)
      userRecordId: user.id,   // New field (links to User table)
      name: user.name || 'User',
      isCanvasInitialized: false,
    },
  });
}

/**
 * Initialize the full canvas structure for a profile.
 * Idempotent - safe to call multiple times.
 *
 * Call this when user explicitly enters Clarity Canvas for the first time.
 * Uses atomic update with nested creates (same pattern as seedProfileForUser)
 * to avoid PgBouncer transaction timeout issues.
 */
export async function initializeCanvasStructure(profileId: string) {
  const profile = await prisma.clarityProfile.findUnique({
    where: { id: profileId },
    include: { sections: true },
  });

  if (!profile) return null;
  if (profile.isCanvasInitialized) return profile;

  // Clean up partial data from any previous failed attempts
  if (profile.sections.length > 0) {
    await prisma.profileSection.deleteMany({
      where: { profileId },
    });
  }

  // Atomic update: create all sections + mark initialized in one Prisma operation.
  // No explicit transaction needed — Prisma handles nested creates atomically.
  const updated = await prisma.clarityProfile.update({
    where: { id: profileId },
    data: {
      isCanvasInitialized: true,
      sections: {
        create: buildProfileStructureCreateData(),
      },
    },
    include: profileInclude,
  });

  return updated;
}
