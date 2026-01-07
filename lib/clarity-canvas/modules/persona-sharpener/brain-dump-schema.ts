import { z } from 'zod';

// =============================================================================
// BRAIN DUMP EXTRACTION SCHEMAS
// =============================================================================
//
// NOTE: These schemas use .nullable() because they're used with OpenAI's
// zodResponseFormat which requires all fields to be required (not optional).
// See: https://platform.openai.com/docs/guides/structured-outputs
//
// This differs from extraction-schema.ts which uses .optional() because it
// uses Vercel AI SDK's generateObject() which supports optional fields.
// =============================================================================

/**
 * Demographics extracted from brain dump
 */
export const extractedDemographicsSchema = z.object({
  ageRange: z
    .string()
    .nullable()
    .describe('Age range like "25-34" or "mid-career"'),
  lifestyle: z
    .string()
    .nullable()
    .describe('Lifestyle descriptor like "busy professional" or "side hustler"'),
  location: z
    .string()
    .nullable()
    .describe('Geographic or work context like "urban" or "remote worker"'),
});

/**
 * Jobs to be Done extracted from brain dump
 */
export const extractedJobsSchema = z.object({
  functional: z
    .string()
    .nullable()
    .describe('Practical task they want to accomplish'),
  emotional: z
    .string()
    .nullable()
    .describe('How they want to feel'),
  social: z
    .string()
    .nullable()
    .describe('How they want to be perceived by others'),
});

/**
 * Goals extracted from brain dump
 */
export const extractedGoalsSchema = z.object({
  primary: z.string().nullable().describe('Main goal or outcome they want'),
  secondary: z.string().nullable().describe('Secondary goal if mentioned'),
});

/**
 * Frustrations extracted from brain dump
 */
export const extractedFrustrationsSchema = z.object({
  main: z
    .string()
    .nullable()
    .describe('Primary pain point or frustration'),
  secondary: z
    .string()
    .nullable()
    .describe('Secondary frustration if mentioned'),
});

/**
 * Behaviors extracted from brain dump
 */
export const extractedBehaviorsSchema = z.object({
  informationSources: z
    .string()
    .nullable()
    .describe('Where they get information or learn'),
  decisionStyle: z
    .string()
    .nullable()
    .describe('How they make decisions'),
});

/**
 * Field-level confidence scores for skip logic
 *
 * NOTE: OpenAI structured outputs don't support z.record() with dynamic keys.
 * Instead, we define explicit confidence fields that match our extraction fields.
 */
export const fieldConfidenceSchema = z.object({
  // Demographics confidence
  demographicsAgeRange: z.number().min(0).max(1).nullable().describe('Confidence for demographics.ageRange'),
  demographicsLifestyle: z.number().min(0).max(1).nullable().describe('Confidence for demographics.lifestyle'),
  demographicsLocation: z.number().min(0).max(1).nullable().describe('Confidence for demographics.location'),
  // Jobs confidence
  jobsFunctional: z.number().min(0).max(1).nullable().describe('Confidence for jobs.functional'),
  jobsEmotional: z.number().min(0).max(1).nullable().describe('Confidence for jobs.emotional'),
  jobsSocial: z.number().min(0).max(1).nullable().describe('Confidence for jobs.social'),
  // Goals confidence
  goalsPrimary: z.number().min(0).max(1).nullable().describe('Confidence for goals.primary'),
  goalsSecondary: z.number().min(0).max(1).nullable().describe('Confidence for goals.secondary'),
  // Frustrations confidence
  frustrationsMain: z.number().min(0).max(1).nullable().describe('Confidence for frustrations.main'),
  frustrationsSecondary: z.number().min(0).max(1).nullable().describe('Confidence for frustrations.secondary'),
  // Behaviors confidence
  behaviorsInformationSources: z.number().min(0).max(1).nullable().describe('Confidence for behaviors.informationSources'),
  behaviorsDecisionStyle: z.number().min(0).max(1).nullable().describe('Confidence for behaviors.decisionStyle'),
});

/**
 * Individual persona extracted from brain dump
 *
 * NOTE: OpenAI structured outputs require .nullable() on all optional fields.
 * See: https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses#all-fields-must-be-required
 */
export const extractedPersonaSchema = z.object({
  displayName: z
    .string()
    .describe(
      'Short memorable name like "The Busy Executive" or "The Side Hustler" (3-4 words max)'
    ),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Overall extraction confidence (0-1)'),

  // Structured attributes - must use .nullable() for OpenAI structured outputs
  demographics: extractedDemographicsSchema
    .nullable()
    .describe('Demographic information if mentioned, or null if not'),

  jobs: extractedJobsSchema
    .nullable()
    .describe('Jobs to be done if mentioned, or null if not'),

  goals: extractedGoalsSchema
    .nullable()
    .describe('Goals if mentioned, or null if not'),

  frustrations: extractedFrustrationsSchema
    .nullable()
    .describe('Frustrations if mentioned, or null if not'),

  behaviors: extractedBehaviorsSchema
    .nullable()
    .describe('Behavioral patterns if mentioned, or null if not'),

  // Field-level confidence for skip logic (uses explicit fields, not dynamic keys)
  fieldConfidence: fieldConfidenceSchema
    .nullable()
    .describe('Confidence per field, or null if no confidence data'),

  // Raw quote if they said something specific
  rawQuote: z
    .string()
    .nullable()
    .describe('Direct quote from transcript about this persona'),
});

/**
 * Overall context extracted from brain dump
 */
export const overallContextSchema = z.object({
  productDescription: z
    .string()
    .describe('What the user is building, in their own words'),
  marketContext: z
    .string()
    .nullable()
    .describe('Industry, stage, or market context if mentioned'),
  keyThemes: z
    .array(z.string())
    .describe('Recurring themes across all personas'),
});

/**
 * Full extraction response from GPT
 */
export const brainDumpExtractionResponseSchema = z.object({
  personas: z
    .array(extractedPersonaSchema)
    .max(3)
    .describe('1-3 distinct personas extracted from the brain dump'),

  overallContext: overallContextSchema.describe(
    'Context about the product and market'
  ),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ExtractedDemographics = z.infer<typeof extractedDemographicsSchema>;
export type ExtractedJobs = z.infer<typeof extractedJobsSchema>;
export type ExtractedGoals = z.infer<typeof extractedGoalsSchema>;
export type ExtractedFrustrations = z.infer<typeof extractedFrustrationsSchema>;
export type ExtractedBehaviors = z.infer<typeof extractedBehaviorsSchema>;
export type FieldConfidence = z.infer<typeof fieldConfidenceSchema>;
export type ExtractedPersona = z.infer<typeof extractedPersonaSchema>;
export type OverallContext = z.infer<typeof overallContextSchema>;
export type BrainDumpExtractionResponse = z.infer<
  typeof brainDumpExtractionResponseSchema
>;

// =============================================================================
// API REQUEST/RESPONSE SCHEMAS
// =============================================================================

/**
 * Request to the brain dump API
 */
export const brainDumpRequestSchema = z.object({
  profileId: z.string().describe('ClarityProfile ID'),
  inputType: z.enum(['voice', 'text']).describe('How the brain dump was captured'),
  transcript: z
    .string()
    .min(50, 'Brain dump must be at least 50 characters')
    .max(4000, 'Brain dump must be under 4000 characters')
    .describe('Raw transcript from voice or text input'),
  audioBlobUrl: z
    .string()
    .url()
    .optional()
    .describe('S3/R2 URL if voice input'),
  durationSeconds: z.number().optional().describe('Voice recording duration'),
});

/**
 * Response from the brain dump API
 */
export const brainDumpApiResponseSchema = z.object({
  brainDumpId: z.string().describe('Created PersonaBrainDump ID'),
  personas: z.array(
    z.object({
      id: z.string().describe('Created Persona ID'),
      displayName: z.string(),
      confidence: z.number(),
      questionCount: z.number().describe('Questions after skip logic'),
      estimatedMinutes: z.number(),
    })
  ),
  overallContext: z.object({
    productDescription: z.string(),
    marketContext: z.string().nullable(),
  }),
  suggestedStartPersonaId: z.string().describe('Highest confidence persona'),
  processingMs: z.number().describe('Total processing time'),
});

export type BrainDumpRequest = z.infer<typeof brainDumpRequestSchema>;
export type BrainDumpApiResponse = z.infer<typeof brainDumpApiResponseSchema>;
