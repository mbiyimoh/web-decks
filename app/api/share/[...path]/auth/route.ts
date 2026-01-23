import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getShareLinkSessionOptions, ShareLinkSessionData } from '@/lib/session';
import { verifyPassword, isLinkLocked, getLockoutMinutesRemaining } from '@/lib/share/utils';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * POST /api/share/[...path]/auth
 *
 * Verifies password and creates session for share link access.
 * Path segments are joined to reconstruct the full slug.
 *
 * Request body:
 * - password: string
 *
 * Returns:
 * - 200: { success: true }
 * - 401: Invalid password (with attemptsRemaining)
 * - 429: Link locked (with lockedUntil and minutesRemaining)
 * - 404: Link not found (disguised as 401 to prevent enumeration)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    // Remove 'auth' from path and join remaining segments to get slug
    // Path: ["tradeblock-artifacts", "the-120-day-sprint", "x7k9m2p3", "auth"]
    // Slug: "tradeblock-artifacts/the-120-day-sprint/x7k9m2p3"
    const slugSegments = path.slice(0, -1); // Remove 'auth' segment
    const slug = slugSegments.join('/');
    const { password } = await req.json();

    // 1. Fetch link
    const link = await prisma.artifactShareLink.findUnique({
      where: { slug },
    });

    // Don't reveal if link exists - always show password error
    if (!link) {
      // Add artificial delay to match bcrypt timing (~100-150ms)
      await new Promise((resolve) => setTimeout(resolve, 150));
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // 2. Check if locked
    if (isLinkLocked(link.lockedUntil)) {
      const minutesRemaining = getLockoutMinutesRemaining(link.lockedUntil!);
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${minutesRemaining} minutes.`,
          lockedUntil: link.lockedUntil!.toISOString(),
          minutesRemaining,
        },
        { status: 429 }
      );
    }

    // 3. Verify password
    const isValid = await verifyPassword(password, link.hashedPassword);

    if (!isValid) {
      // Increment failed attempts
      const failedAttempts = link.failedAttempts + 1;
      const updates: { failedAttempts: number; lockedUntil?: Date } = {
        failedAttempts,
      };

      // Lock after MAX_ATTEMPTS
      if (failedAttempts >= MAX_ATTEMPTS) {
        updates.lockedUntil = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000
        );
      }

      await prisma.artifactShareLink.update({
        where: { slug },
        data: updates,
      });

      return NextResponse.json(
        {
          error: 'Invalid password',
          attemptsRemaining: Math.max(0, MAX_ATTEMPTS - failedAttempts),
        },
        { status: 401 }
      );
    }

    // 4. Success - reset failed attempts, update access tracking
    await prisma.artifactShareLink.update({
      where: { slug },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // 5. Create session
    const session = await getIronSession<ShareLinkSessionData>(
      await cookies(),
      getShareLinkSessionOptions(slug)
    );

    session.isAuthenticated = true;
    session.shareSlug = slug;
    session.clientId = link.clientId;
    session.artifactSlug = link.artifactSlug;
    session.authenticatedAt = Date.now();

    await session.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error authenticating share link:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
