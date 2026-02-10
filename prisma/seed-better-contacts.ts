/**
 * Seed OAuth Client for Better Contacts
 *
 * Run with: npx tsx prisma/seed-better-contacts.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  const clientId = 'better-contacts';

  // Check if already exists
  const existing = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (existing) {
    console.log(`\n⚠️  Client "${clientId}" already exists.\n`);
    console.log('To reset, delete it first:');
    console.log(
      `  npx prisma db execute --stdin <<< "DELETE FROM \\"OAuthClient\\" WHERE \\"clientId\\" = '${clientId}';"\n`
    );
    return;
  }

  // Generate client secret
  const clientSecret = nanoid(32);
  const hashedSecret = await bcrypt.hash(clientSecret, 10);

  await prisma.oAuthClient.create({
    data: {
      clientId,
      clientSecret: hashedSecret,
      clientName: 'Better Contacts',
      redirectUris: [
        'http://localhost:3000/api/auth/callback/clarity-canvas',
        'https://bettercontacts.ai/api/auth/callback/clarity-canvas',
      ],
      grantTypes: ['authorization_code', 'refresh_token'],
      scope: 'read:profile read:synthesis search:profile',
      isFirstParty: false,
      isActive: true,
    },
  });

  console.log('\n✅ Better Contacts OAuth client registered!\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SAVE THESE CREDENTIALS - SECRET SHOWN ONLY ONCE!         ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Client ID:     ${clientId.padEnd(42)}║`);
  console.log(`║  Client Secret: ${clientSecret.padEnd(42)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Add to Better Contacts .env:\n');
  console.log(`CLARITY_CANVAS_CLIENT_ID=${clientId}`);
  console.log(`CLARITY_CANVAS_CLIENT_SECRET=${clientSecret}`);
  console.log('CLARITY_CANVAS_ISSUER=https://33strategies.ai');
  console.log('CLARITY_CANVAS_API_URL=https://33strategies.ai/api/companion\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
