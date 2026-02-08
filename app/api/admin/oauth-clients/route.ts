/**
 * Admin OAuth Client Registration API
 *
 * POST /api/admin/oauth-clients
 * Creates a new OAuth client and returns the client secret.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  // Require admin auth
  const session = await auth();
  if (!session?.user?.email?.endsWith('@33strategies.ai')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { clientId, clientName, redirectUris, scope, isFirstParty } = body;

  // Validate required fields
  if (!clientId || !clientName || !redirectUris || !scope) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Check if client already exists
  const existing = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Client ID already exists' },
      { status: 409 }
    );
  }

  // Generate client secret
  const clientSecret = nanoid(32);
  const hashedSecret = await bcrypt.hash(clientSecret, 10);

  // Create client
  await prisma.oAuthClient.create({
    data: {
      clientId,
      clientSecret: hashedSecret,
      clientName,
      redirectUris: Array.isArray(redirectUris) ? redirectUris : [redirectUris],
      grantTypes: ['authorization_code', 'refresh_token'],
      scope,
      isFirstParty: !!isFirstParty,
    },
  });

  console.log(
    `[admin] OAuth client "${clientId}" registered by ${session.user.email}`
  );

  return NextResponse.json({
    success: true,
    clientId,
    clientSecret, // Only returned once!
  });
}
