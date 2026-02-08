import { z } from 'zod';

export const extractionChunkSchema = z.object({
  content: z.string().describe('The extracted content verbatim from the transcript'),
  targetSection: z
    .enum(['individual', 'role', 'organization', 'goals', 'network', 'projects'])
    .describe('The profile section this content belongs to'),
  targetSubsection: z
    .string()
    .describe('The subsection key (e.g., "background", "responsibilities")'),
  targetField: z.string().describe('The specific field key (e.g., "career", "title")'),
  summary: z.string().max(150).describe('A brief summary suitable for UI display (max 150 chars)'),
  confidence: z.number().min(0).max(1).describe('Confidence in this extraction (0-1)'),
  insights: z.array(z.string()).describe('Any key insights about this information (empty array if none)'),
});

export const brainDumpExtractionSchema = z.object({
  chunks: z
    .array(extractionChunkSchema)
    .describe('Array of extracted information chunks mapped to profile fields'),
  overallThemes: z.array(z.string()).describe('High-level themes identified in the transcript'),
  suggestedFollowUps: z
    .array(z.string())
    .describe('Questions that could help fill gaps in the profile (empty array if none)'),
});

export type ExtractionChunk = z.infer<typeof extractionChunkSchema>;
export type BrainDumpExtraction = z.infer<typeof brainDumpExtractionSchema>;

/**
 * Builds a scoped extraction schema that constrains the AI to extract content
 * for a specific section only, using z.literal() to prevent hallucination.
 *
 * @param sectionKey - The section key to constrain extraction to (e.g., 'individual', 'role')
 * @returns Zod schema for scoped extraction with literal section constraint
 *
 * @example
 * const schema = buildScopedExtractionSchema('individual');
 * // AI can only extract to 'individual' section, not others
 */
export function buildScopedExtractionSchema(sectionKey: string) {
  const scopedChunkSchema = z.object({
    content: z.string().describe('The extracted content verbatim from the text'),
    targetSection: z.literal(sectionKey).describe('The profile section (scoped to this section only)'),
    targetSubsection: z
      .string()
      .describe('The subsection key (e.g., "background", "responsibilities")'),
    targetField: z.string().describe('The specific field key (e.g., "career", "title")'),
    summary: z.string().max(150).describe('Brief summary for display (max 150 chars)'),
    confidence: z.number().min(0).max(1).describe('Confidence in this extraction (0-1)'),
    insights: z.array(z.string()).describe('Key insights about this information'),
  });

  return z.object({
    chunks: z
      .array(scopedChunkSchema)
      .describe('Extracted information chunks mapped to profile fields'),
    overallThemes: z.array(z.string()).describe('Themes identified in the text'),
    suggestedFollowUps: z
      .array(z.string())
      .describe('Questions to fill gaps in this section'),
  });
}

export type ScopedExtractionChunk = z.infer<ReturnType<typeof buildScopedExtractionSchema>>['chunks'][number];
export type ScopedBrainDumpExtraction = z.infer<ReturnType<typeof buildScopedExtractionSchema>>;
