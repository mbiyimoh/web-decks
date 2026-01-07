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
  insights: z.array(z.string()).optional().describe('Any key insights about this information'),
});

export const brainDumpExtractionSchema = z.object({
  chunks: z
    .array(extractionChunkSchema)
    .describe('Array of extracted information chunks mapped to profile fields'),
  overallThemes: z.array(z.string()).describe('High-level themes identified in the transcript'),
  suggestedFollowUps: z
    .array(z.string())
    .optional()
    .describe('Questions that could help fill gaps in the profile'),
});

export type ExtractionChunk = z.infer<typeof extractionChunkSchema>;
export type BrainDumpExtraction = z.infer<typeof brainDumpExtractionSchema>;
