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
