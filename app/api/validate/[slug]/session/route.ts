/**
 * Public API: Manage validation sessions
 * POST /api/validate/[slug]/session - Create new session
 * GET /api/validate/[slug]/session?sessionId=xxx - Get session state
 *
 * No auth required - sessions are identified by localStorage sessionId
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSlugFormat } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!isValidSlugFormat(slug)) {
      return NextResponse.json(
        { error: 'Invalid validation link' },
        { status: 400 }
      );
    }

    // Find the validation link
    const validationLink = await prisma.validationLink.findUnique({
      where: { slug },
    });

    if (!validationLink || !validationLink.isActive) {
      return NextResponse.json(
        { error: 'Validation link not found or inactive' },
        { status: 404 }
      );
    }

    // Create new validation session
    const session = await prisma.validationSession.create({
      data: {
        linkId: validationLink.id,
        status: 'in_progress',
      },
    });

    // Increment session count
    await prisma.validationLink.update({
      where: { id: validationLink.id },
      data: {
        totalSessions: { increment: 1 },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
    });
  } catch (error) {
    console.error('Error creating validation session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    if (!isValidSlugFormat(slug)) {
      return NextResponse.json(
        { error: 'Invalid validation link' },
        { status: 400 }
      );
    }

    // Find the session with its responses
    const session = await prisma.validationSession.findUnique({
      where: { id: sessionId },
      include: {
        link: {
          select: { slug: true },
        },
        responses: {
          select: {
            questionId: true,
            value: true,
            isUnsure: true,
            confidence: true,
            additionalContext: true,
          },
        },
      },
    });

    if (!session || session.link.slug !== slug) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      questionsAnswered: session.questionsAnswered,
      questionsSkipped: session.questionsSkipped,
      responses: session.responses.reduce(
        (acc, r) => ({
          ...acc,
          [r.questionId]: {
            value: r.value,
            isUnsure: r.isUnsure,
            confidence: r.confidence,
            additionalContext: r.additionalContext,
          },
        }),
        {} as Record<string, unknown>
      ),
    });
  } catch (error) {
    console.error('Error fetching validation session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
