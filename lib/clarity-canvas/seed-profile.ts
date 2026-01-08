import { prisma } from '@/lib/prisma';
import { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES } from './profile-structure';
import type { ProfileWithSections } from './types';

/**
 * Create a new profile with the complete 6-section structure for a user.
 * Returns existing profile if one already exists (idempotent).
 */
export async function seedProfileForUser(
  userId: string,
  userName: string
): Promise<ProfileWithSections> {
  // Check if profile already exists
  const existing = await prisma.clarityProfile.findUnique({
    where: { userId },
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
    return existing as ProfileWithSections;
  }

  // Create profile with full structure in a single transaction
  const profile = await prisma.clarityProfile.create({
    data: {
      userId,
      name: userName,
      sections: {
        create: Object.entries(PROFILE_STRUCTURE).map(([sectionKey, section]) => ({
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
        })),
      },
    },
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

  return profile as ProfileWithSections;
}

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
 */
export async function initializeCanvasStructure(profileId: string) {
  const profile = await prisma.clarityProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile || profile.isCanvasInitialized) {
    return profile;
  }

  // Create all sections/subsections/fields in a transaction
  await prisma.$transaction(async (tx) => {
    for (const [sectionKey, section] of Object.entries(PROFILE_STRUCTURE)) {
      const createdSection = await tx.profileSection.create({
        data: {
          profileId,
          key: sectionKey,
          name: section.name,
          icon: section.icon,
          order: section.order,
        },
      });

      for (const [subsectionKey, subsection] of Object.entries(section.subsections)) {
        const createdSubsection = await tx.profileSubsection.create({
          data: {
            sectionId: createdSection.id,
            key: subsectionKey,
            name: subsection.name,
            order: subsection.order,
          },
        });

        for (const fieldKey of subsection.fields) {
          await tx.profileField.create({
            data: {
              subsectionId: createdSubsection.id,
              key: fieldKey,
              name: FIELD_DISPLAY_NAMES[fieldKey] || formatFieldKey(fieldKey),
            },
          });
        }
      }
    }

    await tx.clarityProfile.update({
      where: { id: profileId },
      data: { isCanvasInitialized: true },
    });
  });

  return prisma.clarityProfile.findUnique({
    where: { id: profileId },
    include: { sections: { include: { subsections: { include: { fields: true } } } } },
  });
}
