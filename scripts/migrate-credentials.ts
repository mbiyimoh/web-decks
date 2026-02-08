/**
 * One-time migration script to move client passwords from env vars to database.
 *
 * Usage:
 *   npx tsx scripts/migrate-credentials.ts
 *
 * This script:
 * 1. Reads passwords from environment variables
 * 2. Hashes them with bcrypt (work factor 10)
 * 3. Creates ClientCredential records in the database
 * 4. Uses upsert for idempotency (safe to run multiple times)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CLIENTS_TO_MIGRATE = [
  {
    clientId: 'tradeblock',
    envVar: 'TRADEBLOCK_PASSWORD',
    email: 'client@tradeblock.us',
    displayName: 'Tradeblock',
  },
  {
    clientId: 'plya',
    envVar: 'PLYA_PASSWORD',
    email: 'client@plya.com',
    displayName: 'PLYA',
  },
  {
    clientId: 'wsbc',
    envVar: 'WSBC_PASSWORD',
    email: 'client@wsbc.com',
    displayName: 'WSBC',
  },
  {
    clientId: 'scott-arnett',
    envVar: 'SCOTT_ARNETT_PASSWORD',
    email: 'scott@email.com',
    displayName: 'Scott Arnett',
  },
  {
    clientId: 'noggin-guru',
    envVar: 'NOGGIN_GURU_PASSWORD',
    email: 'rob@nogginguru.com',
    displayName: 'Noggin Guru',
  },
];

const STRATEGISTS_TO_MIGRATE = [
  {
    clientId: 'sherril',
    envVar: 'SHERRIL_PASSWORD',
    email: 'sherril@33strategies.ai',
    displayName: 'Sherril',
  },
];

async function migrateCredentials() {
  console.log('Starting credential migration...\n');

  const allCredentials = [...CLIENTS_TO_MIGRATE, ...STRATEGISTS_TO_MIGRATE];
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const cred of allCredentials) {
    const password = process.env[cred.envVar];

    if (!password) {
      console.log(`⚠️  Skipping ${cred.clientId}: ${cred.envVar} not set`);
      skipped++;
      continue;
    }

    try {
      // Hash password with bcrypt (work factor 10, ~100ms)
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.clientCredential.upsert({
        where: { clientId: cred.clientId },
        update: {
          hashedPassword,
          email: cred.email,
          displayName: cred.displayName,
        },
        create: {
          clientId: cred.clientId,
          hashedPassword,
          email: cred.email,
          displayName: cred.displayName,
        },
      });

      console.log(`✅ Migrated ${cred.clientId}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate ${cred.clientId}:`, error);
      failed++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

migrateCredentials()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
