import { z } from 'zod';

export const InputTypeSchema = z.enum([
  'VOICE_TRANSCRIPT',
  'TEXT_INPUT',
  'FILE_UPLOAD',
]);

export const CreateSessionRequestSchema = z.object({
  rawContent: z.string().min(1, 'Content is required'),
  inputType: InputTypeSchema.optional().default('TEXT_INPUT'),
  title: z.string().optional(),
  sourceContext: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  originalFileName: z.string().optional(),
});

export const SessionFiltersSchema = z.object({
  inputType: InputTypeSchema.nullable().optional(),
  pillar: z.string().nullable().optional(),
});

// For clarity-canvas commit route modification
export const CommitRequestWithInputSchema = z.object({
  recommendations: z.array(
    z.object({
      targetSection: z.string(),
      targetSubsection: z.string(),
      targetField: z.string(),
      content: z.string(),
      summary: z.string(),
      confidence: z.number().min(0).max(1),
      sourceType: z.enum(['VOICE', 'TEXT', 'FILE']).optional(),
    })
  ),
  scope: z
    .object({
      section: z.string().optional(),
      subsection: z.string().optional(),
    })
    .optional(),
  originalInput: z.string().min(1, 'Original input is required'), // CRITICAL FIX
  inputType: z.enum(['VOICE', 'TEXT', 'FILE']).optional().default('TEXT'),
  durationSeconds: z.number().int().positive().optional(),
  originalFileName: z.string().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type CommitRequestWithInput = z.infer<typeof CommitRequestWithInputSchema>;
