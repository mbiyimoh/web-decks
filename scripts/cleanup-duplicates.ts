import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  const email = 'mbiyimoh@33strategies.ai';

  // Find user and profile
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found');
    return;
  }

  const profile = await prisma.clarityProfile.findFirst({
    where: { userRecordId: user.id }
  });

  if (!profile) {
    console.log('Profile not found');
    return;
  }

  console.log('Profile ID:', profile.id);

  // Count InputSessions
  const sessions = await prisma.inputSession.findMany({
    where: { clarityProfileId: profile.id },
    orderBy: { capturedAt: 'asc' }
  });
  console.log('InputSessions found:', sessions.length);

  if (sessions.length > 1) {
    // Keep only the first one, delete the rest
    const [keep, ...toDelete] = sessions;
    console.log('Keeping session:', keep.id, 'Deleting:', toDelete.length);

    // First unlink FieldSources from sessions to delete
    for (const s of toDelete) {
      await prisma.fieldSource.updateMany({
        where: { inputSessionId: s.id },
        data: { inputSessionId: null }
      });
    }

    // Delete duplicate sessions
    await prisma.inputSession.deleteMany({
      where: { id: { in: toDelete.map(s => s.id) } }
    });
    console.log('Deleted duplicate InputSessions');

    // Now link remaining FieldSources to the kept session
    await prisma.fieldSource.updateMany({
      where: {
        inputSessionId: null,
        field: {
          subsection: {
            section: {
              profile: { id: profile.id }
            }
          }
        }
      },
      data: { inputSessionId: keep.id }
    });
  }

  // Count FieldSources per field to find duplicates
  const fieldsWithSources = await prisma.profileField.findMany({
    where: {
      subsection: {
        section: {
          profile: { id: profile.id }
        }
      }
    },
    include: {
      sources: {
        orderBy: { extractedAt: 'asc' }
      }
    }
  });

  let totalDeleted = 0;
  for (const f of fieldsWithSources) {
    if (f.sources.length > 1) {
      // Check for duplicate content
      const seen = new Set<string>();
      const toDeleteIds: string[] = [];
      for (const source of f.sources) {
        const contentKey = source.rawContent;
        if (seen.has(contentKey)) {
          toDeleteIds.push(source.id);
        } else {
          seen.add(contentKey);
        }
      }
      if (toDeleteIds.length > 0) {
        await prisma.fieldSource.deleteMany({
          where: { id: { in: toDeleteIds } }
        });
        totalDeleted += toDeleteIds.length;
        console.log(`Field ${f.name}: deleted ${toDeleteIds.length} duplicate sources`);
      }
    }
  }

  console.log('Total duplicate FieldSources deleted:', totalDeleted);

  // Final count
  const finalSessionCount = await prisma.inputSession.count({
    where: { clarityProfileId: profile.id }
  });
  const finalSourceCount = await prisma.fieldSource.count({
    where: {
      field: {
        subsection: {
          section: {
            profile: { id: profile.id }
          }
        }
      }
    }
  });

  console.log('Final InputSession count:', finalSessionCount);
  console.log('Final FieldSource count:', finalSourceCount);
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
