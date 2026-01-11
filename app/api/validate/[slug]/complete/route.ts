/**
 * Public API: Complete validation session
 * POST /api/validate/[slug]/complete
 *
 * Mark session as complete and optionally collect respondent info
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSlugFormat } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

interface CompletePayload {
  sessionId: string;
  respondentName?: string;
  respondentEmail?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body: CompletePayload = await request.json();

    if (!isValidSlugFormat(slug)) {
      return NextResponse.json(
        { error: 'Invalid validation link' },
        { status: 400 }
      );
    }

    const { sessionId, respondentName, respondentEmail } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Find the validation link
    const validationLink = await prisma.validationLink.findUnique({
      where: { slug },
    });

    if (!validationLink) {
      return NextResponse.json(
        { error: 'Validation link not found' },
        { status: 404 }
      );
    }

    // Find and update the session
    const session = await prisma.validationSession.findUnique({
      where: { id: sessionId },
      include: {
        link: true,
      },
    });

    if (!session || session.link.id !== validationLink.id) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 404 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Mark session as complete
    await prisma.validationSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        respondentName: respondentName || null,
        respondentEmail: respondentEmail || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('Error completing validation session:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}
