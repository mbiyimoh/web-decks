import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed Persona Sharpener module
  await prisma.clarityModule.upsert({
    where: { slug: 'persona-sharpener' },
    update: {},
    create: {
      slug: 'persona-sharpener',
      name: 'Persona Sharpener',
      description:
        'Build a detailed, research-backed customer persona with assumption tracking and validation.',
      icon: '👤',
      estimatedMinutes: 10,
      enrichesSections: ['Individual', 'Goals', 'Network'],
      isActive: true,
      sortOrder: 1,
    },
  });

  console.log('Seeded ClarityModule table');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
