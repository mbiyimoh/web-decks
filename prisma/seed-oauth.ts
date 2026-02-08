/**
 * Seed OAuth Client for First-Party Portal Authentication
 *
 * Run with: npx tsx prisma/seed-oauth.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FIRST_PARTY_CLIENTS = [
  {
    clientId: 'client-portal',
    clientName: '33 Strategies Client Portal',
    scope: 'read:profile write:profile',
  },
  {
    clientId: 'strategist-portal',
    clientName: '33 Strategies Strategist Portal',
    scope: 'read:profile write:profile admin:credentials',
  },
];

async function seedOAuthClients() {
  console.log('Seeding first-party OAuth clients...\n');

  for (const client of FIRST_PARTY_CLIENTS) {
    try {
      await prisma.oAuthClient.upsert({
        where: { clientId: client.clientId },
        update: {
          clientName: client.clientName,
          scope: client.scope,
        },
        create: {
          clientId: client.clientId,
          clientSecret: '', // Empty for first-party (no secret required)
          clientName: client.clientName,
          redirectUris: [], // Not used for first-party password flow
          grantTypes: ['password', 'refresh_token'],
          scope: client.scope,
          isFirstParty: true,
          isActive: true,
        },
      });
      console.log(`✅ ${client.clientId}`);
    } catch (error) {
      console.error(`❌ Failed to seed ${client.clientId}:`, error);
    }
  }

  console.log('\nOAuth client seeding complete!');
}

seedOAuthClients()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
