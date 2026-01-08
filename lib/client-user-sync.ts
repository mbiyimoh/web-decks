import { prisma } from '@/lib/prisma';

/**
 * Ensure a User record exists for a client portal user.
 * Creates if not exists, updates clientPortalId if changed.
 *
 * authId format: "client-portal:{email}" to distinguish from NextAuth users.
 */
export async function ensureClientUser(
  email: string,
  clientId: string
): Promise<{ id: string; email: string }> {
  const normalizedEmail = email.toLowerCase();
  const authId = `client-portal:${normalizedEmail}`;

  // Try to find existing user by authId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { authId },
        { email: normalizedEmail },
      ],
    },
  });

  if (user) {
    // Update if needed (e.g., clientPortalId changed, or was a different auth type)
    if (user.clientPortalId !== clientId || user.authId !== authId || user.userType !== 'CLIENT') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authId,
          clientPortalId: clientId,
          userType: 'CLIENT',
        },
      });
    }
    return { id: user.id, email: user.email };
  }

  // Create new user
  user = await prisma.user.create({
    data: {
      authId,
      email: normalizedEmail,
      name: null, // Clients don't have names from OAuth
      userType: 'CLIENT',
      clientPortalId: clientId,
    },
  });

  return { id: user.id, email: user.email };
}
