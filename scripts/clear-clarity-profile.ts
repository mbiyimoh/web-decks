import { prisma } from '../lib/prisma';

async function clearClarityProfile(email: string) {
  console.log(`Looking for user with email: ${email}`);

  const user = await prisma.user.findFirst({
    where: { email: { contains: email } },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`Found user: ${user.email} (id: ${user.id})`);

  const profile = await prisma.clarityProfile.findFirst({
    where: { userRecordId: user.id },
  });

  if (!profile) {
    console.log('No clarity profile found for this user');
    return;
  }

  console.log(`Found profile: ${profile.id}`);

  // Delete in order: sources -> fields -> subsections -> sections -> profile
  const sections = await prisma.profileSection.findMany({
    where: { profileId: profile.id },
    include: {
      subsections: {
        include: {
          fields: true,
        },
      },
    },
  });

  for (const section of sections) {
    for (const subsection of section.subsections) {
      for (const field of subsection.fields) {
        await prisma.fieldSource.deleteMany({ where: { fieldId: field.id } });
      }
      await prisma.profileField.deleteMany({ where: { subsectionId: subsection.id } });
    }
    await prisma.profileSubsection.deleteMany({ where: { sectionId: section.id } });
  }
  await prisma.profileSection.deleteMany({ where: { profileId: profile.id } });
  await prisma.clarityProfile.delete({ where: { id: profile.id } });

  console.log('Clarity profile deleted successfully!');
}

clearClarityProfile('mbiyimoh@tradeblock')
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
