/**
 * Authenticated API: Manage validation link for a persona
 *
 * GET /api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/validation-link
 *   - Get existing validation link or create one if none exists
 *
 * PATCH /api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/validation-link
 *   - Toggle validation link active status
 *
 * Requires authentication - only persona owner can manage validation links
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { generateValidationSlug, buildValidationUrl } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';
import type { ValidationLinkInfo } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

/**
 * GET - Get or create validation link for a persona
 *
 * On first call, generates a slug and creates the ValidationLink record.
 * Subsequent calls return the existing link.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  try {
    // Authenticate user
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await params;

    // Fetch persona and verify ownership
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        profile: true,
        validationLink: true,
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    if (persona.profile.userRecordId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this persona' },
        { status: 403 }
      );
    }

    // If validation link exists, return it
    if (persona.validationLink) {
      const linkInfo: ValidationLinkInfo = {
        url: buildValidationUrl(persona.validationLink.slug),
        slug: persona.validationLink.slug,
        isActive: persona.validationLink.isActive,
        totalResponses: persona.validationLink.totalResponses,
        totalSessions: persona.validationLink.totalSessions,
        createdAt: persona.validationLink.createdAt,
      };

      return NextResponse.json({ validationLink: linkInfo });
    }

    // Create new validation link
    const slug = generateValidationSlug();
    const newLink = await prisma.validationLink.create({
      data: {
        personaId,
        slug,
        isActive: true,
      },
    });

    const linkInfo: ValidationLinkInfo = {
      url: buildValidationUrl(newLink.slug),
      slug: newLink.slug,
      isActive: newLink.isActive,
      totalResponses: newLink.totalResponses,
      totalSessions: newLink.totalSessions,
      createdAt: newLink.createdAt,
    };

    return NextResponse.json({ validationLink: linkInfo });
  } catch (error) {
    console.error('Error managing validation link:', error);
    return NextResponse.json(
      { error: 'Failed to manage validation link' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Toggle validation link active status
 *
 * Body: { isActive: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  try {
    // Authenticate user
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Fetch persona and verify ownership
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        profile: true,
        validationLink: true,
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    if (persona.profile.userRecordId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this persona' },
        { status: 403 }
      );
    }

    if (!persona.validationLink) {
      return NextResponse.json(
        { error: 'No validation link exists for this persona' },
        { status: 404 }
      );
    }

    // Update the active status
    const updatedLink = await prisma.validationLink.update({
      where: { id: persona.validationLink.id },
      data: { isActive },
    });

    const linkInfo: ValidationLinkInfo = {
      url: buildValidationUrl(updatedLink.slug),
      slug: updatedLink.slug,
      isActive: updatedLink.isActive,
      totalResponses: updatedLink.totalResponses,
      totalSessions: updatedLink.totalSessions,
      createdAt: updatedLink.createdAt,
    };

    return NextResponse.json({ validationLink: linkInfo });
  } catch (error) {
    console.error('Error updating validation link:', error);
    return NextResponse.json(
      { error: 'Failed to update validation link' },
      { status: 500 }
    );
  }
}
