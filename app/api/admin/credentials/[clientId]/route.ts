/**
 * Admin Credential Management API
 *
 * PATCH /api/admin/credentials/[clientId]
 * Actions: reset (password), unlock, toggle (active)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

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

  // Verify credential exists
  const credential = await prisma.clientCredential.findUnique({
    where: { clientId },
  });

  if (!credential) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  switch (action) {
    case 'reset': {
      // Generate new password
      const newPassword = nanoid(16);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.clientCredential.update({
        where: { clientId },
        data: {
          hashedPassword,
          failedAttempts: 0,
          lockedUntil: null,
        },
      });

      console.log(`[admin] Password reset for ${clientId} by ${session.user.email}`);

      return NextResponse.json({
        success: true,
        newPassword, // Only shown once!
      });
    }

    case 'unlock': {
      await prisma.clientCredential.update({
        where: { clientId },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });

      console.log(`[admin] Account unlocked for ${clientId} by ${session.user.email}`);

      return NextResponse.json({ success: true });
    }

    case 'toggle': {
      await prisma.clientCredential.update({
        where: { clientId },
        data: {
          isActive: !credential.isActive,
        },
      });

      console.log(
        `[admin] Account ${credential.isActive ? 'deactivated' : 'activated'} for ${clientId} by ${session.user.email}`
      );

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
  }
}
