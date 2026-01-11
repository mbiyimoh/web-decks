/**
 * Backfill Script: Generate validationContextualizedText for Existing Personas
 *
 * This script finds all existing brain dumps with personas and regenerates
 * the customized questions to include the new validationContextualizedText field.
 *
 * Usage:
 *   npx tsx scripts/backfill-validation-contextualized-text.ts
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --persona-id <id>  Only process a specific persona
 */

import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  customizedQuestionsResponseSchema,
  type CustomizedQuestionsResponse,
} from '../lib/clarity-canvas/modules/persona-sharpener/customized-question-schema';
import {
  buildCustomizationPrompt,
  prepareQuestionsForPrompt,
} from '../lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization';
import { questionSequence } from '../lib/clarity-canvas/modules/persona-sharpener/questions';
import type { ExtractedPersona } from '../lib/clarity-canvas/modules/persona-sharpener/brain-dump-schema';

const prisma = new PrismaClient();

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const personaIdIndex = args.indexOf('--persona-id');
const targetPersonaId = personaIdIndex !== -1 ? args[personaIdIndex + 1] : null;

async function main() {
  console.log('='.repeat(60));
  console.log('Backfill: validationContextualizedText for Existing Personas');
  console.log('='.repeat(60));
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  if (targetPersonaId) {
    console.log(`Target: Single persona ${targetPersonaId}`);
  }
  console.log('');

  // Check OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey });

  // Find brain dumps with personas that need updating
  const brainDumps = await prisma.personaBrainDump.findMany({
    where: targetPersonaId
      ? { personas: { some: { id: targetPersonaId } } }
      : { personas: { some: {} } },
    include: {
      personas: {
        select: {
          id: true,
          name: true,
          demographics: true,
          jobs: true,
          goals: true,
          frustrations: true,
          behaviors: true,
          quote: true,
          extractionConfidence: true,
        },
      },
    },
  });

  console.log(`Found ${brainDumps.length} brain dump(s) to process\n`);

  let totalPersonas = 0;
  let updatedPersonas = 0;
  let skippedPersonas = 0;
  let errorPersonas = 0;

  for (const brainDump of brainDumps) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Brain Dump: ${brainDump.id}`);
    console.log(`Personas: ${brainDump.personas.length}`);
    console.log(`Created: ${brainDump.createdAt.toISOString()}`);

    // Get existing customized questions
    const existingCustomized = brainDump.customizedQuestions as Record<
      string,
      CustomizedQuestionsResponse
    > | null;

    // Get overall context for product description
    const overallContext = brainDump.overallContext as {
      productDescription?: string;
      marketContext?: string;
    } | null;
    const productDescription =
      overallContext?.productDescription || 'Product/service being validated';

    // Prepare questions JSON (same as in brain-dump route)
    const questionsJson = prepareQuestionsForPrompt(
      questionSequence.map((q) => ({
        id: q.id,
        question: q.question,
        field: q.field,
        type: q.type,
        options: 'options' in q ? q.options : undefined,
      }))
    );

    // Process each persona
    for (const persona of brainDump.personas) {
      totalPersonas++;
      console.log(`\n  Persona: "${persona.name}" (${persona.id})`);

      // Check if already has validationContextualizedText
      const existingQuestions = existingCustomized?.[persona.id]?.questions;
      const hasValidationText = existingQuestions?.some(
        (q) => q.validationContextualizedText && q.validationContextualizedText.length > 0
      );

      if (hasValidationText) {
        console.log('    ✓ Already has validationContextualizedText - skipping');
        skippedPersonas++;
        continue;
      }

      // Build extracted persona format for the prompt
      const extractedPersona: ExtractedPersona = {
        displayName: persona.name || 'Unknown',
        confidence: persona.extractionConfidence || 0.5,
        demographics: persona.demographics as ExtractedPersona['demographics'],
        jobs: persona.jobs as ExtractedPersona['jobs'],
        goals: persona.goals as ExtractedPersona['goals'],
        frustrations: persona.frustrations as ExtractedPersona['frustrations'],
        behaviors: persona.behaviors as ExtractedPersona['behaviors'],
        fieldConfidence: null, // We don't have this for existing personas
        rawQuote: persona.quote || null,
      };

      if (isDryRun) {
        console.log('    [DRY RUN] Would regenerate customized questions');
        updatedPersonas++;
        continue;
      }

      // Call OpenAI to regenerate customized questions
      try {
        console.log('    Calling OpenAI to generate validationContextualizedText...');

        const customizationPrompt = buildCustomizationPrompt(
          extractedPersona,
          productDescription,
          brainDump.rawTranscript,
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
        if (!content) {
          throw new Error('No response from OpenAI');
        }

        const parsed = customizedQuestionsResponseSchema.parse(JSON.parse(content));
        const newCustomized: CustomizedQuestionsResponse = {
          ...parsed,
          personaId: persona.id,
        };

        // Log sample of what we got
        const sampleQuestion = newCustomized.questions.find(
          (q) => q.validationContextualizedText
        );
        if (sampleQuestion) {
          console.log('    Sample validationContextualizedText:');
          console.log(
            `      "${sampleQuestion.validationContextualizedText?.slice(0, 100)}..."`
          );
        }

        // Update the brain dump's customizedQuestions
        const updatedCustomized = {
          ...(existingCustomized || {}),
          [persona.id]: newCustomized,
        };

        await prisma.personaBrainDump.update({
          where: { id: brainDump.id },
          data: {
            customizedQuestions: updatedCustomized as unknown as Prisma.InputJsonValue,
          },
        });

        console.log('    ✓ Updated customizedQuestions with validationContextualizedText');
        updatedPersonas++;
      } catch (error) {
        console.error(`    ✗ Error processing persona:`, error);
        errorPersonas++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total personas processed: ${totalPersonas}`);
  console.log(`Updated: ${updatedPersonas}`);
  console.log(`Skipped (already had data): ${skippedPersonas}`);
  console.log(`Errors: ${errorPersonas}`);
  console.log('');

  if (isDryRun) {
    console.log('This was a DRY RUN. No changes were made.');
    console.log('Run without --dry-run to apply changes.');
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
