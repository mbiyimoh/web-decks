import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createMinimalProfile } from '@/lib/clarity-canvas/seed-profile';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { Prisma } from '@prisma/client';
import {
  brainDumpRequestSchema,
  brainDumpExtractionResponseSchema,
  type BrainDumpExtractionResponse,
  type ExtractedPersona,
} from '@/lib/clarity-canvas/modules/persona-sharpener/brain-dump-schema';
import {
  customizedQuestionsResponseSchema,
  type CustomizedQuestionsResponse,
} from '@/lib/clarity-canvas/modules/persona-sharpener/customized-question-schema';
import { buildExtractionPrompt } from '@/lib/clarity-canvas/modules/persona-sharpener/prompts/extraction';
import {
  buildCustomizationPrompt,
  prepareQuestionsForPrompt,
} from '@/lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';

// Lazy initialization of OpenAI client to avoid build-time errors
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

/**
 * POST /api/clarity-canvas/modules/persona-sharpener/brain-dump
 *
 * Process a brain dump transcript and extract personas with customized questions.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Initialize OpenAI client with proper error handling
  let openai: OpenAI;
  try {
    openai = getOpenAIClient();
  } catch {
    console.error('OPENAI_API_KEY not configured');
    return NextResponse.json(
      { error: 'AI processing temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  try {
    // Auth check
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = brainDumpRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { profileId, inputType, transcript, audioBlobUrl, durationSeconds } =
      parseResult.data;

    // Validate transcript quality before expensive OpenAI call
    const wordCount = transcript.trim().split(/\s+/).length;
    if (wordCount < 10) {
      return NextResponse.json(
        {
          error:
            'Brain dump must contain at least 10 words. Please describe your customers in more detail.',
        },
        { status: 400 }
      );
    }

    // Verify profile belongs to user
    let profile = await prisma.clarityProfile.findFirst({
      where: {
        id: profileId,
        userRecordId: user.id,
      },
    });

    if (!profile) {
      // Auto-create minimal profile if needed
      profile = await createMinimalProfile(user, user.authId);
    }

    // Step 1: Extract personas from transcript
    const extractionPrompt = buildExtractionPrompt(transcript);

    let extractionResponse: BrainDumpExtractionResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: extractionPrompt.system },
          { role: 'user', content: extractionPrompt.user },
        ],
        response_format: zodResponseFormat(
          brainDumpExtractionResponseSchema,
          'persona_extraction'
        ),
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No extraction response from OpenAI');
      }
      const parsed = brainDumpExtractionResponseSchema.parse(JSON.parse(content));
      extractionResponse = parsed;
    } catch (extractionError) {
      console.error('Extraction failed, using fallback:', extractionError);
      // Fallback to single generic persona
      extractionResponse = createFallbackExtraction(transcript);
    }

    // Ensure at least one persona
    if (extractionResponse.personas.length === 0) {
      extractionResponse = createFallbackExtraction(transcript);
    }

    // Step 2: Create personas in database
    const createdPersonas: Array<{
      id: string;
      displayName: string;
      confidence: number;
      extractedPersona: ExtractedPersona;
    }> = [];

    for (let i = 0; i < extractionResponse.personas.length; i++) {
      const extracted = extractionResponse.personas[i];

      const persona = await prisma.persona.create({
        data: {
          profileId: profile.id,
          name: extracted.displayName,
          isPrimary: i === 0, // First persona is primary
          extractionConfidence: extracted.confidence,
          skippedQuestionIds: [],
          demographics: extracted.demographics
            ? (extracted.demographics as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          jobs: extracted.jobs
            ? (extracted.jobs as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          goals: extracted.goals
            ? (extracted.goals as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          frustrations: extracted.frustrations
            ? (extracted.frustrations as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          behaviors: extracted.behaviors
            ? (extracted.behaviors as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          quote: extracted.rawQuote || null,
          antiPatterns: [],
        },
      });

      createdPersonas.push({
        id: persona.id,
        displayName: extracted.displayName,
        confidence: extracted.confidence,
        extractedPersona: extracted,
      });
    }

    // Step 3: Generate customized questions for each persona
    const customizedQuestionsMap: Record<string, CustomizedQuestionsResponse> =
      {};

    const questionsJson = prepareQuestionsForPrompt(
      questionSequence.map((q) => ({
        id: q.id,
        question: q.question,
        field: q.field,
        type: q.type,
        options: 'options' in q ? q.options : undefined,
      }))
    );

    for (const { id, extractedPersona } of createdPersonas) {
      try {
        const customizationPrompt = buildCustomizationPrompt(
          extractedPersona,
          extractionResponse.overallContext.productDescription,
          transcript,
          questionsJson
        );

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: customizationPrompt.system },
            { role: 'user', content: customizationPrompt.user },
          ],
          response_format: zodResponseFormat(
            customizedQuestionsResponseSchema,
            'customized_questions'
          ),
          temperature: 0.5,
        });

        const content = completion.choices[0].message.content;
        if (content) {
          const parsed = customizedQuestionsResponseSchema.parse(JSON.parse(content));
          customizedQuestionsMap[id] = {
            ...parsed,
            personaId: id,
          };
        } else {
          customizedQuestionsMap[id] = createFallbackQuestions(id);
        }
      } catch (customizationError) {
        console.error(
          `Question customization failed for persona ${id}:`,
          customizationError
        );
        customizedQuestionsMap[id] = createFallbackQuestions(id);
      }
    }

    // Update personas with skipped question IDs
    for (const [personaId, customized] of Object.entries(
      customizedQuestionsMap
    )) {
      const skippedIds = customized.questions
        .filter((q) => q.shouldSkip)
        .map((q) => q.questionId);

      await prisma.persona.update({
        where: { id: personaId },
        data: { skippedQuestionIds: skippedIds },
      });
    }

    // Step 4: Create PersonaBrainDump record
    const brainDump = await prisma.personaBrainDump.create({
      data: {
        profileId: profile.id,
        inputType,
        rawTranscript: transcript,
        audioBlobUrl: audioBlobUrl || null,
        durationSeconds: durationSeconds || null,
        extractedData: extractionResponse as unknown as Prisma.InputJsonValue,
        personaCount: createdPersonas.length,
        overallContext:
          extractionResponse.overallContext as unknown as Prisma.InputJsonValue,
        customizedQuestions:
          customizedQuestionsMap as unknown as Prisma.InputJsonValue,
        processingMs: Date.now() - startTime,
        personas: {
          connect: createdPersonas.map((p) => ({ id: p.id })),
        },
      },
    });

    // Explicitly update each persona's brainDumpId to ensure the connection is made.
    // Prisma's `connect` in create should handle this, but we've observed cases where
    // brainDumpId remained null. This explicit update ensures persona→brainDump link exists.
    // TODO: Investigate root cause and wrap in transaction for atomicity.
    const updateResult = await prisma.persona.updateMany({
      where: { id: { in: createdPersonas.map((p) => p.id) } },
      data: { brainDumpId: brainDump.id },
    });

    // Verify the connection was made
    if (updateResult.count !== createdPersonas.length) {
      console.warn(
        `[Brain Dump] Warning: Expected to update ${createdPersonas.length} personas, but updated ${updateResult.count}`
      );
    }

    // Log extraction results for debugging multi-persona issues
    console.log(
      `[Brain Dump] Extracted ${extractionResponse.personas.length} persona(s):`,
      extractionResponse.personas.map((p) => ({
        name: p.displayName,
        confidence: p.confidence,
        hasData: {
          demographics: !!p.demographics && Object.keys(p.demographics || {}).length > 0,
          jobs: !!p.jobs && Object.keys(p.jobs || {}).length > 0,
          goals: !!p.goals && Object.keys(p.goals || {}).length > 0,
          frustrations: !!p.frustrations && Object.keys(p.frustrations || {}).length > 0,
          quote: !!p.rawQuote,
        },
      }))
    );

    // Build response
    const suggestedStartPersona = createdPersonas.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    const response = {
      brainDumpId: brainDump.id,
      personas: createdPersonas.map((p) => {
        const customized = customizedQuestionsMap[p.id];
        const extracted = p.extractedPersona;
        return {
          id: p.id,
          displayName: p.displayName,
          confidence: p.confidence,
          questionCount:
            customized?.totalQuestions - customized?.skippedCount ||
            questionSequence.length,
          estimatedMinutes: Math.ceil(
            ((customized?.totalQuestions || questionSequence.length) -
              (customized?.skippedCount || 0)) *
              0.5
          ),
          // Include extracted data for richer confirmation display
          extractedData: {
            demographics: extracted.demographics || null,
            jobs: extracted.jobs || null,
            goals: extracted.goals || null,
            frustrations: extracted.frustrations || null,
            quote: extracted.rawQuote || null,
          },
        };
      }),
      overallContext: {
        productDescription:
          extractionResponse.overallContext.productDescription,
        marketContext: extractionResponse.overallContext.marketContext,
        keyThemes: extractionResponse.overallContext.keyThemes || [],
      },
      suggestedStartPersonaId: suggestedStartPersona.id,
      processingMs: Date.now() - startTime,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Brain dump processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process brain dump' },
      { status: 500 }
    );
  }
}

/**
 * Create a fallback extraction when GPT fails
 */
function createFallbackExtraction(
  transcript: string
): BrainDumpExtractionResponse {
  return {
    personas: [
      {
        displayName: 'Your Ideal Customer',
        confidence: 0.3,
        demographics: null,
        jobs: null,
        goals: null,
        frustrations: null,
        behaviors: null,
        fieldConfidence: null,
        rawQuote: null,
      },
    ],
    overallContext: {
      productDescription: transcript.slice(0, 200),
      marketContext: null,
      keyThemes: [],
    },
  };
}

/**
 * Create fallback questions when customization fails
 */
function createFallbackQuestions(
  personaId: string
): CustomizedQuestionsResponse {
  return {
    personaId,
    questions: questionSequence.map((q, i) => ({
      questionId: q.id,
      originalText: q.question,
      field: q.field,
      type: q.type as 'ranking' | 'freetext' | 'multiselect' | 'scale',
      options: 'options' in q ? q.options?.map((o) => o.label) ?? null : null,
      shouldSkip: false,
      skipReason: null,
      contextualizedText: q.question,
      confirmationPrompt: null,
      priority: i + 1,
      questionStyle: 'exploratory' as const,
    })),
    totalQuestions: questionSequence.length,
    skippedCount: 0,
    estimatedMinutes: Math.ceil(questionSequence.length * 0.5),
  };
}
