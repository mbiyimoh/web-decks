/**
 * Field Synthesis — Multi-source synthesis and refinement utilities
 *
 * Synthesizes multiple FieldSources into unified summaries and provides
 * refinement capabilities for both fields and subsections.
 */

import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import prisma from '@/lib/prisma';
import type { FieldSource } from '@prisma/client';

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schema for field synthesis output
 */
export const fieldSynthesisSchema = z.object({
  summary: z
    .string()
    .max(150)
    .describe('Concise summary for display (max 150 chars)'),
  fullContext: z
    .string()
    .max(400)
    .describe(
      'Fuller context integrating all sources (max 400 chars, 2-3 sentences)'
    ),
});

export type FieldSynthesisResult = z.infer<typeof fieldSynthesisSchema>;

/**
 * Schema for field refinement output
 */
export const fieldRefinementSchema = z.object({
  refinedSummary: z
    .string()
    .max(150)
    .describe('Refined summary (max 150 chars)'),
  refinedFullContext: z
    .string()
    .max(400)
    .describe('Refined full context (max 400 chars)'),
  changeSummary: z
    .string()
    .max(200)
    .describe('Brief description of what changed'),
});

export type FieldRefinementResult = z.infer<typeof fieldRefinementSchema>;

/**
 * Schema for subsection refinement output
 */
export const subsectionRefinementSchema = z.object({
  refinedSummary: z
    .string()
    .max(300)
    .describe('Refined subsection summary (max 300 chars)'),
  changeSummary: z
    .string()
    .max(200)
    .describe('Brief description of what changed'),
});

export type SubsectionRefinementResult = z.infer<
  typeof subsectionRefinementSchema
>;

// ============================================================================
// PROMPTS
// ============================================================================

const FIELD_SYNTHESIS_SYSTEM_PROMPT = `You are synthesizing multiple pieces of information about a person into a unified field summary.

Given multiple source texts that all relate to the same profile field, create:
1. A concise summary (max 150 characters) for display
2. A fuller context (max 400 characters, 2-3 sentences) that integrates all sources

Rules:
- Preserve key facts and specifics from ALL sources
- Resolve any contradictions by favoring more specific/recent information
- Maintain professional, analytical tone
- Don't just concatenate — synthesize into a coherent narrative
- If sources provide complementary perspectives, integrate them
- Use third person (e.g., "They prefer..." not "I prefer...")`;

const FIELD_REFINEMENT_SYSTEM_PROMPT = `You are refining a profile field based on user feedback.

Given the current field content and the user's refinement request, generate:
1. refinedSummary (max 150 chars) — updated summary
2. refinedFullContext (max 400 chars) — updated full context
3. changeSummary (max 200 chars) — what you changed, for UI display

Rules:
- Honor the user's request while preserving accurate information
- Don't remove information unless explicitly asked
- Maintain consistency with the source material
- Keep the same professional, third-person tone`;

const SUBSECTION_REFINEMENT_SYSTEM_PROMPT = `You are refining a subsection summary for a clarity profile.

Given the subsection name, current summary, underlying field data, and the user's refinement request, generate:
1. refinedSummary (max 300 chars) — updated subsection summary
2. changeSummary (max 200 chars) — what you changed, for UI display

Rules:
- Address the user's feedback while accurately reflecting the underlying field data
- Provide a cohesive overview of this aspect of the person
- Maintain professional, third-person tone`;

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build the synthesis prompt from multiple sources
 */
function buildFieldSynthesisPrompt(sources: FieldSource[]): string {
  const sourceTexts = sources
    .map(
      (s, i) =>
        `Source ${i + 1} (${s.type}, ${s.extractedAt.toISOString().split('T')[0]}):\n${s.rawContent}`
    )
    .join('\n\n');

  return `${FIELD_SYNTHESIS_SYSTEM_PROMPT}

SOURCES TO SYNTHESIZE:
${sourceTexts}

Generate a unified summary and full context that integrates all ${sources.length} sources.`;
}

/**
 * Build the field refinement prompt
 */
function buildFieldRefinementPrompt(params: {
  summary: string | null;
  fullContext: string | null;
  sources: FieldSource[];
  userPrompt: string;
}): string {
  const { summary, fullContext, sources, userPrompt } = params;

  const sourceTexts = sources
    .map(
      (s, i) =>
        `Source ${i + 1} (${s.type}):\n${s.rawContent.slice(0, 200)}${s.rawContent.length > 200 ? '...' : ''}`
    )
    .join('\n\n');

  return `${FIELD_REFINEMENT_SYSTEM_PROMPT}

CURRENT FIELD:
- Summary: ${summary || '(empty)'}
- Full context: ${fullContext || '(empty)'}

UNDERLYING SOURCES:
${sourceTexts}

USER'S REFINEMENT REQUEST:
"${userPrompt}"

Refine the field according to the user's request.`;
}

/**
 * Build the subsection refinement prompt
 */
function buildSubsectionRefinementPrompt(params: {
  subsectionName: string;
  currentSummary: string | null;
  fields: Array<{ name: string; summary: string | null }>;
  userPrompt: string;
}): string {
  const { subsectionName, currentSummary, fields, userPrompt } = params;

  const fieldSummaries = fields
    .filter((f) => f.summary)
    .map((f) => `- ${f.name}: ${f.summary}`)
    .join('\n');

  return `${SUBSECTION_REFINEMENT_SYSTEM_PROMPT}

SUBSECTION: ${subsectionName}

CURRENT SUMMARY:
${currentSummary || '(no summary yet)'}

UNDERLYING FIELDS:
${fieldSummaries || '(no fields populated)'}

USER'S REFINEMENT REQUEST:
"${userPrompt}"

Refine the subsection summary according to the user's request.`;
}

// ============================================================================
// SYNTHESIS FUNCTIONS
// ============================================================================

/**
 * Synthesize multiple sources into a unified field summary.
 * Updates the field in the database and returns the result.
 *
 * @param fieldId - The ProfileField ID to synthesize
 * @returns The synthesized summary and fullContext
 */
export async function synthesizeField(
  fieldId: string
): Promise<FieldSynthesisResult> {
  const field = await prisma.profileField.findUnique({
    where: { id: fieldId },
    include: { sources: { orderBy: { extractedAt: 'desc' } } },
  });

  if (!field) {
    throw new Error(`Field ${fieldId} not found`);
  }

  // No synthesis needed for 0 or 1 sources
  if (field.sources.length <= 1) {
    return {
      summary: field.summary || '',
      fullContext: field.fullContext || '',
    };
  }

  // Generate synthesized content
  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: fieldSynthesisSchema,
    prompt: buildFieldSynthesisPrompt(field.sources),
  });

  // Update the field with synthesized content
  await prisma.profileField.update({
    where: { id: fieldId },
    data: {
      summary: result.object.summary,
      fullContext: result.object.fullContext,
      lastSynthesizedAt: new Date(),
      synthesisVersion: { increment: 1 },
    },
  });

  return result.object;
}

/**
 * Generate a refinement preview for a field (does not commit).
 *
 * @param fieldId - The ProfileField ID to refine
 * @param userPrompt - The user's refinement request
 * @returns Preview of the refined content
 */
export async function generateFieldRefinementPreview(
  fieldId: string,
  userPrompt: string
): Promise<FieldRefinementResult> {
  const field = await prisma.profileField.findUnique({
    where: { id: fieldId },
    include: { sources: true },
  });

  if (!field) {
    throw new Error(`Field ${fieldId} not found`);
  }

  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: fieldRefinementSchema,
    prompt: buildFieldRefinementPrompt({
      summary: field.summary,
      fullContext: field.fullContext,
      sources: field.sources,
      userPrompt,
    }),
  });

  return result.object;
}

/**
 * Generate a refinement preview for a subsection (does not commit).
 *
 * @param subsectionId - The ProfileSubsection ID to refine
 * @param userPrompt - The user's refinement request
 * @returns Preview of the refined content
 */
export async function generateSubsectionRefinementPreview(
  subsectionId: string,
  userPrompt: string
): Promise<SubsectionRefinementResult> {
  const subsection = await prisma.profileSubsection.findUnique({
    where: { id: subsectionId },
    include: { fields: { select: { name: true, summary: true } } },
  });

  if (!subsection) {
    throw new Error(`Subsection ${subsectionId} not found`);
  }

  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: subsectionRefinementSchema,
    prompt: buildSubsectionRefinementPrompt({
      subsectionName: subsection.name,
      currentSummary: subsection.summary,
      fields: subsection.fields,
      userPrompt,
    }),
  });

  return result.object;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a field was synthesized within the display threshold (30 seconds).
 * Used to show the "Synthesized" badge in the UI.
 */
export function wasSynthesizedRecently(date: Date | string | null): boolean {
  if (!date) return false;
  const timestamp =
    typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  return Date.now() - timestamp < 30_000; // 30 seconds
}

/**
 * Format a timestamp as relative time for display.
 * e.g., "Just now", "2 minutes ago", "3 hours ago"
 */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never';
  const timestamp =
    typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)} minute${seconds >= 120 ? 's' : ''} ago`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)} hour${seconds >= 7200 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
}
