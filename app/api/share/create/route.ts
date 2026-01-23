import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getClientContent } from '@/lib/clients';
import { generateShareSlug, hashPassword, validatePassword, buildShareUrl } from '@/lib/share/utils';

/**
 * POST /api/share/create
 *
 * Creates a new share link for an artifact. Requires portal authentication.
 *
 * Request body:
 * - clientId: string (must match session)
 * - artifactSlug: string (must exist and be shareable)
 * - password: string (min 6 chars)
 *
 * Returns:
 * - 200: { success: true, slug: string, url: string }
 * - 401: Not authenticated
 * - 403: Wrong client
 * - 400: Invalid password or not shareable
 * - 404: Artifact not found
 * - 409: Link already exists
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify portal authentication
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions()
    );

    if (!session.isLoggedIn || !session.clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const { clientId, artifactSlug, password } = await req.json();

    // Verify client matches session
    if (clientId.toLowerCase() !== session.clientId) {
      return NextResponse.json(
        { error: 'Unauthorized for this client' },
        { status: 403 }
      );
    }

    // Validate password length
    try {
      validatePassword(password);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 }
      );
    }

    // 3. Verify artifact exists and is shareable
    const content = getClientContent(clientId, artifactSlug);
    if (!content) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    if (!content.shareable) {
      return NextResponse.json(
        { error: 'This artifact is not shareable' },
        { status: 400 }
      );
    }

    // 4. Check if link already exists
    const existing = await prisma.artifactShareLink.findUnique({
      where: {
        clientId_artifactSlug: {
          clientId: clientId.toLowerCase(),
          artifactSlug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Share link already exists for this artifact' },
        { status: 409 }
      );
    }

    // 5. Hash password and generate slug
    const hashedPassword = await hashPassword(password);
    const slug = generateShareSlug();

    // 6. Create share link
    const shareLink = await prisma.artifactShareLink.create({
      data: {
        slug,
        clientId: clientId.toLowerCase(),
        artifactSlug,
        hashedPassword,
      },
    });

    // 7. Return success with full URL
    return NextResponse.json({
      success: true,
      slug: shareLink.slug,
      url: buildShareUrl(shareLink.slug),
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
