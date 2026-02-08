/**
 * Admin OAuth Client Management API
 *
 * PATCH /api/admin/oauth-clients/[clientId]
 * Actions: toggle (active), revoke (all tokens)
 *
 * DELETE /api/admin/oauth-clients/[clientId]
 * Deletes the OAuth client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revokeTokensForClient } from '@/lib/oauth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  // Require admin auth
  const session = await auth();
  if (!session?.user?.email?.endsWith('@33strategies.ai')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const { action } = await request.json();

  // Verify client exists
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  switch (action) {
    case 'toggle': {
      await prisma.oAuthClient.update({
        where: { clientId },
        data: { isActive: !client.isActive },
      });

      console.log(
        `[admin] OAuth client "${clientId}" ${client.isActive ? 'deactivated' : 'activated'} by ${session.user.email}`
      );

      return NextResponse.json({ success: true });
    }

    case 'revoke': {
      const revokedCount = await revokeTokensForClient(clientId);

      console.log(
        `[admin] Revoked ${revokedCount} tokens for OAuth client "${clientId}" by ${session.user.email}`
      );

      return NextResponse.json({ success: true, revokedCount });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  // Require admin auth
  const session = await auth();
  if (!session?.user?.email?.endsWith('@33strategies.ai')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;

  // Verify client exists
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Prevent deletion of first-party clients
  if (client.isFirstParty) {
    return NextResponse.json(
      { error: 'Cannot delete first-party clients' },
      { status: 403 }
    );
  }

  // Delete client (cascades to auth codes, tokens, consents)
  await prisma.oAuthClient.delete({
    where: { clientId },
  });

  console.log(
    `[admin] OAuth client "${clientId}" deleted by ${session.user.email}`
  );

  return NextResponse.json({ success: true });
}
