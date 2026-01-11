/**
 * Public API: Submit validation response
 * POST /api/validate/[slug]/respond
 *
 * Save individual responses during validation (no auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSlugFormat } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

interface ResponsePayload {
  sessionId: string;
  questionId: string;
  field: string;
  value: unknown;
  isUnsure?: boolean;
  confidence?: number;
  additionalContext?: string;
  skipped?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body: ResponsePayload = await request.json();

    if (!isValidSlugFormat(slug)) {
      return NextResponse.json(
        { error: 'Invalid validation link' },
        { status: 400 }
      );
    }

    const { sessionId, questionId, field, value, isUnsure, confidence, additionalContext, skipped } = body;

    if (!sessionId || !questionId || !field) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the validation link and session
    const validationLink = await prisma.validationLink.findUnique({
      where: { slug },
    });

    if (!validationLink || !validationLink.isActive) {
      return NextResponse.json(
        { error: 'Validation link not found or inactive' },
        { status: 404 }
      );
    }

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

    // Check if response already exists for this question
    const existingResponse = await prisma.response.findFirst({
      where: {
        validationSessionId: sessionId,
        questionId,
      },
    });

    if (existingResponse) {
      // Update existing response
      await prisma.response.update({
        where: { id: existingResponse.id },
        data: {
          value: value ?? {},
          isUnsure: isUnsure ?? false,
          confidence: confidence ?? 50,
          additionalContext: additionalContext ?? null,
        },
      });
    } else {
      // Create new response
      await prisma.response.create({
        data: {
          personaId: validationLink.personaId,
          validationSessionId: sessionId,
          questionId,
          field,
          value: value ?? {},
          isUnsure: isUnsure ?? false,
          confidence: confidence ?? 50,
          additionalContext: additionalContext ?? null,
          responseType: 'validation',
          respondentId: sessionId, // Use session ID as respondent identifier
          respondentRole: 'real-user',
        },
      });

      // Update session counters
      if (skipped) {
        await prisma.validationSession.update({
          where: { id: sessionId },
          data: {
            questionsSkipped: { increment: 1 },
          },
        });
      } else {
        await prisma.validationSession.update({
          where: { id: sessionId },
          data: {
            questionsAnswered: { increment: 1 },
          },
        });

        // Increment total responses on link
        await prisma.validationLink.update({
          where: { id: validationLink.id },
          data: {
            totalResponses: { increment: 1 },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving validation response:', error);
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    );
  }
}
