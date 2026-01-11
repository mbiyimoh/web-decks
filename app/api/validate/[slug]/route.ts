/**
 * Public API: Get validation context
 * GET /api/validate/[slug]
 *
 * Returns persona context and questions for validators (no auth required).
 *
 * Uses brain dump customizedQuestions for:
 * - Priority ordering (lowest founder confidence = highest priority)
 * - Contextualized question text (enriched with brain dump context)
 *
 * Key behaviors:
 * - Questions sorted by priority (lowest founder confidence = highest priority)
 * - Uses contextualizedText from brain dump for richer questions
 * - Falls back to validationQuestion if no customization available
 * - Adds isFactual flag to skip confidence slider on demographic questions
 * - Only shows questions the founder actually answered
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { questionBank } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import type { Question } from '@/lib/clarity-canvas/modules/persona-sharpener/types';
import type { CustomizedQuestion } from '@/lib/clarity-canvas/modules/persona-sharpener/customized-question-schema';
import { isValidSlugFormat } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

// Questions that are factual (no confidence slider needed)
const FACTUAL_QUESTION_IDS = new Set(['age-range', 'lifestyle', 'tech-savvy']);

// Questions where placeholder text needs second-person framing
const VALIDATION_PLACEHOLDERS: Record<string, string> = {
  'past-failures': "e.g., 'I tried fitness apps but hated logging every meal...'",
  'functional-job': "e.g., 'Fit a workout into my lunch break' or 'Find the right gift in under 5 minutes'",
  'recommendation-trigger': "e.g., 'If I finally stuck with a routine for more than 2 weeks...'",
};

/**
 * Extended question type for validation UI
 */
export interface ValidationQuestion extends Question {
  isFactual?: boolean;
  validationPlaceholder?: string;
  validationContextualizedText?: string; // Enriched question text reframed for real users
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validate slug format
    if (!isValidSlugFormat(slug)) {
      return NextResponse.json(
        { error: 'Invalid validation link' },
        { status: 400 }
      );
    }

    // Find the validation link with persona and brain dump
    const validationLink = await prisma.validationLink.findUnique({
      where: { slug },
      include: {
        persona: {
          select: {
            id: true,
            name: true,
            quote: true,
            brainDumpId: true,
            brainDump: {
              select: {
                customizedQuestions: true,
              },
            },
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!validationLink) {
      return NextResponse.json(
        { error: 'Validation link not found' },
        { status: 404 }
      );
    }

    // Check if link is active
    if (!validationLink.isActive) {
      return NextResponse.json(
        { error: 'This validation link is no longer active' },
        { status: 410 }
      );
    }

    const personaId = validationLink.personaId;

    // Get founder responses to determine which questions to show
    const founderResponses = await prisma.response.findMany({
      where: {
        personaId,
        responseType: 'assumption',
      },
      select: {
        questionId: true,
      },
    });

    const answeredQuestionIds = new Set(founderResponses.map(r => r.questionId));

    // Get customized questions from brain dump if available
    let customizedQuestions: CustomizedQuestion[] | null = null;
    if (validationLink.persona.brainDump?.customizedQuestions) {
      const customizedData = validationLink.persona.brainDump.customizedQuestions as Record<
        string,
        { questions?: CustomizedQuestion[] }
      >;

      if (customizedData[personaId]?.questions) {
        customizedQuestions = customizedData[personaId].questions;
      }
    }

    // Build validation questions from question bank, enriched with customization
    const questions: ValidationQuestion[] = [];

    for (const category of Object.values(questionBank)) {
      for (const baseQuestion of category) {
        // Only include questions the founder answered AND have validation framing
        if (!baseQuestion.validationQuestion || !answeredQuestionIds.has(baseQuestion.id)) {
          continue;
        }

        // Find customized version if available
        const customized = customizedQuestions?.find(
          (q) => q.questionId === baseQuestion.id
        );

        // Build the validation question
        const validationQuestion: ValidationQuestion = {
          ...baseQuestion,
          // Mark factual questions (no confidence slider)
          isFactual: FACTUAL_QUESTION_IDS.has(baseQuestion.id),
          // Use validation-specific placeholder if available
          validationPlaceholder: VALIDATION_PLACEHOLDERS[baseQuestion.id],
          // Include enriched validation text from brain dump (reframed for real users)
          validationContextualizedText: customized?.validationContextualizedText ?? undefined,
        };

        questions.push(validationQuestion);
      }
    }

    // Sort by priority if customized questions available
    if (customizedQuestions) {
      questions.sort((a, b) => {
        const priorityA = customizedQuestions?.find(q => q.questionId === a.id)?.priority || 99;
        const priorityB = customizedQuestions?.find(q => q.questionId === b.id)?.priority || 99;
        return priorityA - priorityB;
      });
    }

    return NextResponse.json({
      personaName: validationLink.persona.name || 'Target Customer',
      personaQuote: validationLink.persona.quote,
      productContext: validationLink.persona.profile?.name || 'this product',
      questions,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error('Error fetching validation context:', error);
    return NextResponse.json(
      { error: 'Failed to load validation' },
      { status: 500 }
    );
  }
}
