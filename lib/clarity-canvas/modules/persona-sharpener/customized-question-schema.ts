import { z } from 'zod';

// =============================================================================
// CUSTOMIZED QUESTION SCHEMAS
// =============================================================================
//
// NOTE: These schemas use .nullable() because they're used with OpenAI's
// zodResponseFormat which requires all fields to be required (not optional).
// See: https://platform.openai.com/docs/guides/structured-outputs
// =============================================================================

/**
 * A single question customized based on brain dump context
 */
export const customizedQuestionSchema = z.object({
  // Original question reference
  questionId: z.string().describe('Original question ID from question bank'),
  originalText: z.string().describe('Original question text'),
  field: z.string().describe('Target field path, e.g., "demographics.ageRange"'),
  type: z
    .enum(['ranking', 'freetext', 'multiselect', 'scale'])
    .describe('Question input type'),
  options: z
    .array(z.string())
    .nullable()
    .describe('Options for ranking/multiselect questions, or null if not applicable'),

  // Skip logic
  shouldSkip: z
    .boolean()
    .describe('True if high-confidence value exists from brain dump'),
  skipReason: z
    .string()
    .nullable()
    .describe('If skipping, the pre-populated value from brain dump'),

  // Contextualized version (for founder questionnaire - second person to founder)
  contextualizedText: z
    .string()
    .describe(
      'Question rewritten to reference brain dump context, or original if no context. Written for the FOUNDER (second-person: "You mentioned...")'
    ),
  // Validation version (for real user questionnaire - second person to the real user)
  validationContextualizedText: z
    .string()
    .nullable()
    .describe(
      'Question reframed for real user validation. Transforms founder perspective ("they want X") to user perspective ("we have a hypothesis that you..."). Written in second-person TO THE REAL USER, framing founder assumptions as hypotheses to validate.'
    ),
  confirmationPrompt: z
    .string()
    .nullable()
    .describe(
      'For skipped questions: "You mentioned earlier that [X]... does that still feel right?"'
    ),

  // Priority (lower = ask first)
  priority: z
    .number()
    .min(1)
    .max(19)
    .describe('Priority order based on confidence gaps (1 = highest priority)'),

  // Question styling based on confidence band
  questionStyle: z
    .enum(['exploratory', 'confirmatory', 'skip'])
    .nullable()
    .describe(
      'Question framing style based on field confidence: exploratory (<0.5), confirmatory (0.5-0.7), skip (>=0.7)'
    ),
});

/**
 * Response when generating customized questions for a persona
 */
export const customizedQuestionsResponseSchema = z.object({
  personaId: z.string().describe('Persona these questions are for'),
  questions: z.array(customizedQuestionSchema),
  totalQuestions: z.number().describe('Total questions in base set'),
  skippedCount: z.number().describe('Questions that will show skip confirmation'),
  estimatedMinutes: z.number().describe('Estimated completion time'),
});

/**
 * Batch response for all personas from a brain dump
 */
export const batchCustomizedQuestionsSchema = z.record(
  z.string(), // personaId
  customizedQuestionsResponseSchema
);

// =============================================================================
// API RESPONSE SCHEMAS
// =============================================================================

/**
 * Single question for the questionnaire UI
 *
 * CRITICAL: Use .text property (not .question) when rendering in UI
 * ==================================================================
 *
 * The .text property contains AI-customized question text that references
 * the user's brain dump context (e.g., "Based on your mention of 'college
 * students,' are you targeting 18-24?").
 *
 * This differs from the base Question.question property which contains
 * generic text (e.g., "What age range does this customer fall into?").
 *
 * UI components should ALWAYS render: questionForUI.text
 * NEVER render: baseQuestion.question alone
 *
 * See: docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/customized-questions-pattern.md
 */
export const questionForUISchema = z.object({
  questionId: z.string(),
  text: z.string().describe('Contextualized question text to display (AI-customized from brain dump)'),
  type: z.enum(['ranking', 'freetext', 'multiselect', 'scale']),
  options: z.array(z.string()).optional(),
  field: z.string(),

  // Skip logic
  isSkipped: z.boolean().describe('Whether this question has a pre-populated value'),
  skippedValue: z.string().optional().describe('The pre-populated value if skipped'),
  confirmationPrompt: z
    .string()
    .optional()
    .describe('Prompt for skip confirmation UI'),
});

/**
 * Response from GET /personas/[personaId]/questions
 */
export const questionsApiResponseSchema = z.object({
  personaId: z.string(),
  questions: z.array(questionForUISchema),
  progress: z.object({
    answered: z.number(),
    total: z.number(),
    skipped: z.number(),
  }),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CustomizedQuestion = z.infer<typeof customizedQuestionSchema>;
export type CustomizedQuestionsResponse = z.infer<
  typeof customizedQuestionsResponseSchema
>;
export type BatchCustomizedQuestions = z.infer<
  typeof batchCustomizedQuestionsSchema
>;
export type QuestionForUI = z.infer<typeof questionForUISchema>;
export type QuestionsApiResponse = z.infer<typeof questionsApiResponseSchema>;
