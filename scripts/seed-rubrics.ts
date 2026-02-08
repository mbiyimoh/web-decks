// seed-rubrics.ts — Seed initial scoring rubrics into the database
// Run with: npx tsx scripts/seed-rubrics.ts

import prisma from '../lib/prisma';
import { INITIAL_RUBRICS, SCORE_DIMENSIONS } from '../lib/central-command/rubric';

async function seedRubrics() {
  console.log('Seeding scoring rubrics...\n');

  for (const dimension of SCORE_DIMENSIONS) {
    const existing = await prisma.scoringRubric.findFirst({
      where: { dimension, isActive: true },
    });

    if (existing) {
      console.log(`[SKIP] ${dimension}: Already has active rubric (v${existing.version})`);
      continue;
    }

    const content = INITIAL_RUBRICS[dimension];
    await prisma.scoringRubric.create({
      data: {
        dimension,
        version: 1,
        content: content as object,
        isActive: true,
      },
    });

    console.log(`[CREATED] ${dimension}: Seeded v1`);
  }

  console.log('\nDone!');
}

seedRubrics()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error seeding rubrics:', e);
    process.exit(1);
  });
