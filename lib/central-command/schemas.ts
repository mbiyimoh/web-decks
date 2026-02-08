// schemas.ts — Zod schemas for Central Command API validation

import { z } from 'zod';

// ============ EXTRACTION CATEGORIES ============

/** Bucket 1: Client Intelligence — who they are, what they want */
export const CLIENT_INTELLIGENCE_CATEGORIES = [
  'company_info',     // Company name, industry, website, size
  'contact_info',     // Names, roles, emails, phones, linkedin
  'goals_vision',     // What they're trying to accomplish, success metrics
  'pain_blockers',    // Current pain points, failures, what's getting in the way
  'decision_dynamics', // Who decides, what matters, alternatives they're considering
] as const;

/** Bucket 2: Operations — moving the work forward */
export const OPERATIONS_CATEGORIES = [
  'next_action',      // Action items, follow-ups, commitments
  'budget_signal',    // Budget mentions, deal value indicators
  'timeline_signal',  // Urgency, deadlines, timing context
] as const;

/** Combined for backward compat in recommendation cards */
export const ALL_EXTRACTION_CATEGORIES = [
  ...CLIENT_INTELLIGENCE_CATEGORIES,
  ...OPERATIONS_CATEGORIES,
] as const;

// ============ STAKEHOLDER ROLES ============

/**
 * Standard stakeholder role types for B2B deals
 */
export const STAKEHOLDER_ROLES = [
  'champion',           // Internal advocate pushing for the deal
  'economic_buyer',     // Controls budget, signs off on spend
  'decision_maker',     // Has final say (may overlap with economic buyer)
  'technical_evaluator', // Evaluates technical fit, implementation feasibility
  'operations_gatekeeper', // Concerned with operational impact, processes
  'legal_compliance',   // Legal review, contracts, risk assessment
  'end_user',           // Will actually use the product/service
  'influencer',         // Shapes opinion but doesn't decide
  'blocker',            // Potential obstacle to the deal
  'unknown',            // Role not yet determined
] as const;

/**
 * Individual stakeholder extracted from text
 */
export const stakeholderSchema = z.object({
  name: z.string().describe('Full name if available, or identifying descriptor'),
  title: z.string().nullable().describe('Job title or position if mentioned'),
  role: z.enum(STAKEHOLDER_ROLES).describe('Their role in the buying process'),
  context: z.string().describe('What we know about them from the text - their concerns, influence, relationship to the deal'),
  contactInfo: z.object({
    email: z.string().nullable(),
    phone: z.string().nullable(),
    linkedin: z.string().nullable(),
  }).describe('Contact details if mentioned (use null for unknown fields)'),
  confidence: z.number().min(0).max(1).describe('How confident in role assignment'),
});

// ============ AI EXTRACTION SCHEMAS ============

/**
 * Score assessment: AI's analysis of one scoring dimension based on text evidence
 */
export const scoreAssessmentSchema = z.object({
  score: z.number().min(1).max(10).describe('Suggested score 1-10'),
  rationale: z.string().describe('1-2 sentence justification based on text evidence'),
  evidence: z.array(z.string()).describe('Key phrases from text supporting this score'),
  confidence: z.number().min(0).max(1).describe('How confident in this assessment (0-1)'),
});

/**
 * Structured client synthesis: rich understanding of who this prospect is
 */
export const clientSynthesisSchema = z.object({
  companyOverview: z.string().describe('2-3 sentences: who they are, what they do, their market position, stage'),
  goalsAndVision: z.string().describe('What they are trying to accomplish, their vision of success, key metrics they track'),
  painAndBlockers: z.string().describe('What is getting in their way, what they have tried, current failures and frustrations'),
  decisionDynamics: z.string().describe('Who makes decisions, what matters to them, alternatives they may be considering, buying signals'),
  strategicAssessment: z.string().describe('Why 33 Strategies should or should not work with them, what makes them interesting'),
  recommendedApproach: z.string().describe('How 33S should pitch them — what to lead with, what angle, what to emphasize'),
  stakeholders: z.array(stakeholderSchema).describe('All individuals mentioned in the text, tagged by their role in the buying process'),
  scoreAssessments: z.object({
    strategic: scoreAssessmentSchema.describe('Logo/brand value, network potential, referral value, industry expansion'),
    value: scoreAssessmentSchema.describe('Deal size, budget signals, growth potential, willingness to pay'),
    readiness: scoreAssessmentSchema.describe('Pain urgency, active search, previous attempts, readiness to act'),
    timeline: scoreAssessmentSchema.describe('Urgency, forcing functions, deadlines, decision timing'),
    bandwidth: scoreAssessmentSchema.describe('Scope complexity, team fit, effort estimate for 33S'),
  }).describe('Assessment of the 5 scoring dimensions with suggested scores'),
});

/**
 * Single extracted recommendation from text dump (operational + contact/company fields)
 */
export const pipelineRecommendationSchema = z.object({
  capturedText: z.string().describe('Key phrase extracted — concise, 3-15 words'),
  category: z.enum(ALL_EXTRACTION_CATEGORIES).describe('Category this extraction belongs to'),
  targetField: z.string().describe('Specific field to populate (e.g., "contactName", "industry", "notes", "nextAction")'),
  suggestedValue: z.string().describe('Formatted value to insert into the target field'),
  confidence: z.number().min(0).max(1).describe('Confidence in this extraction (0-1)'),
  sourceSnippet: z.string().nullable().describe('Original text that triggered this extraction'),
});

/**
 * Full extraction response: synthesis + recommendations
 */
export const pipelineExtractionSchema = z.object({
  // Bucket 1: Client Intelligence (primary)
  synthesis: clientSynthesisSchema.describe('Structured understanding of who this prospect is'),

  // Bucket 2: Operations + field extractions (secondary)
  recommendations: z.array(pipelineRecommendationSchema).describe('Operational extractions: contact info, company details, next actions, budget/timeline signals'),

  // Metadata
  suggestedCompanyName: z.string().nullable().describe('Best guess for company name'),
  suggestedIndustry: z.string().nullable().describe('Best guess for industry'),
  overallSummary: z.string().describe('1-2 sentence summary: who is this prospect and why should we care'),
});

// ============ REFINEMENT SCHEMA ============

/**
 * AI-powered field refinement response
 */
export const refinementResponseSchema = z.object({
  refinedContent: z.string().describe('The refined text'),
  changeSummary: z.string().describe('1-sentence summary of what changed'),
});

// ============ SYNTHESIS REFINEMENT SCHEMAS ============

/**
 * Score assessment for refinement (includes changeSummary in response)
 */
const scoreAssessmentForRefinementSchema = z.object({
  score: z.number().min(1).max(10),
  rationale: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

/**
 * Global multi-section refinement request (supports both sections and scores)
 */
export const refineSynthesisRequestSchema = z.object({
  currentSynthesis: z.object({
    companyOverview: z.string().optional(),
    goalsAndVision: z.string().optional(),
    painAndBlockers: z.string().optional(),
    decisionDynamics: z.string().optional(),
    strategicAssessment: z.string().optional(),
    recommendedApproach: z.string().optional(),
  }),
  currentScores: z.object({
    strategic: scoreAssessmentForRefinementSchema.optional(),
    value: scoreAssessmentForRefinementSchema.optional(),
    readiness: scoreAssessmentForRefinementSchema.optional(),
    timeline: scoreAssessmentForRefinementSchema.optional(),
    bandwidth: scoreAssessmentForRefinementSchema.optional(),
  }).optional(),
  prompt: z.string().min(1).max(5000),
});

/**
 * Individual section refinement result
 */
const sectionRefinementSchema = z.object({
  refinedContent: z.string(),
  changeSummary: z.string(),
}).nullable();

/**
 * Individual score refinement result
 */
const scoreRefinementSchema = z.object({
  score: z.number().min(1).max(10),
  rationale: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  changeSummary: z.string(),
}).nullable();

/**
 * Global refinement response — only changed sections/scores have values.
 * Note: OpenAI structured outputs don't support z.record() (dynamic keys).
 * All known keys are explicitly defined, with null for unchanged items.
 */
export const refineSynthesisResponseSchema = z.object({
  updatedSections: z.object({
    companyOverview: sectionRefinementSchema,
    goalsAndVision: sectionRefinementSchema,
    painAndBlockers: sectionRefinementSchema,
    decisionDynamics: sectionRefinementSchema,
    strategicAssessment: sectionRefinementSchema,
    recommendedApproach: sectionRefinementSchema,
  }),
  updatedScores: z.object({
    strategic: scoreRefinementSchema,
    value: scoreRefinementSchema,
    readiness: scoreRefinementSchema,
    timeline: scoreRefinementSchema,
    bandwidth: scoreRefinementSchema,
  }),
});

// ============ API REQUEST SCHEMAS ============

/**
 * Extract request: text dump with optional context
 */
export const extractRequestSchema = z.object({
  inputText: z.string().min(1).max(20000),
  context: z.object({
    existingClientId: z.string().optional(),
    existingClientName: z.string().optional(),
  }).optional(),
});

/**
 * Refine request: current content + prompt
 */
export const refineRequestSchema = z.object({
  currentContent: z.string(),
  prompt: z.string().min(1).max(1000),
  fieldName: z.string(),
});

/**
 * Create prospect request schema
 */
export const createProspectSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  color: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactLinkedin: z.string().optional(),
  notes: z.string().optional(),
  potentialValue: z.number().optional(),
  productFocus: z.string().optional(),
  rawInputText: z.string().optional(), // Original text dump

  // Enrichment data from AI extraction
  enrichmentFindings: z.any().optional(),     // ClientSynthesis JSON
  enrichmentConfidence: z.any().optional(),   // Score confidence data
  enrichmentSuggestedActions: z.array(z.string()).optional(),

  // AI-suggested scores
  scoreStrategic: z.number().min(1).max(10).optional(),
  scoreValue: z.number().min(1).max(10).optional(),
  scoreReadiness: z.number().min(1).max(10).optional(),
  scoreTimeline: z.number().min(1).max(10).optional(),
  scoreBandwidth: z.number().min(1).max(10).optional(),
});

/**
 * Update prospect request schema (handles all mutations)
 */
export const updateProspectSchema = z.object({
  // Client fields
  name: z.string().optional(),
  industry: z.string().optional(),
  color: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactLinkedin: z.string().optional(),
  notes: z.string().optional(),
  notesSource: z.string().optional(),

  // Pipeline fields
  status: z.enum(['intent', 'funnel', 'closed']).optional(),
  decision: z.enum(['yes', 'no', 'pending']).optional(),
  decisionReason: z.string().optional(),
  value: z.number().optional(),
  potentialValue: z.number().optional(),
  scoreStrategic: z.number().min(1).max(10).optional(),
  scoreValue: z.number().min(1).max(10).optional(),
  scoreReadiness: z.number().min(1).max(10).optional(),
  scoreTimeline: z.number().min(1).max(10).optional(),
  scoreBandwidth: z.number().min(1).max(10).optional(),
  discoveryComplete: z.boolean().optional(),
  assessmentComplete: z.boolean().optional(),
  readinessPercent: z.number().min(0).max(100).optional(),
  nextAction: z.string().optional(),
  nextActionSource: z.string().optional(),
  nextActionDate: z.string().optional(), // ISO date
  currentStage: z.string().optional(), // StageId string
  stageIndex: z.number().min(0).max(7).optional(),
  isNew: z.boolean().optional(),
  productFocus: z.string().optional(),
  clientStatus: z.enum(['active', 'paused', 'at-risk']).optional(),

  // Closed deal fields
  closedReason: z.string().optional(),
  closedReasonDetail: z.string().optional(),
  lessonsLearned: z.string().optional(),
  lessonsSource: z.string().optional(),
  reengageDate: z.string().optional(),
  reengageNotes: z.string().optional(),
  reengageSource: z.string().optional(),

  // Enrichment data (for synthesis refinement)
  enrichmentFindings: z.any().optional(),
  enrichmentFindingsVersions: z.any().optional(),

  // Decision workflow fields
  decisionBucket: z.enum(['aggressive', 'slow_burn', 'back_burner', 'explicit_no']).optional(),
  nextStepNotes: z.string().optional(),
  decisionMadeAt: z.string().optional(), // ISO date string
});

// ============ EXPORTED TYPES ============

export type ScoreAssessment = z.infer<typeof scoreAssessmentSchema>;
export type ClientSynthesis = z.infer<typeof clientSynthesisSchema>;
export type PipelineRecommendation = z.infer<typeof pipelineRecommendationSchema>;
export type PipelineExtraction = z.infer<typeof pipelineExtractionSchema>;
export type RefinementResponse = z.infer<typeof refinementResponseSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
export type RefineRequest = z.infer<typeof refineRequestSchema>;
export type CreateProspectRequest = z.infer<typeof createProspectSchema>;
export type UpdateProspectRequest = z.infer<typeof updateProspectSchema>;
export type RefineSynthesisRequest = z.infer<typeof refineSynthesisRequestSchema>;
export type RefineSynthesisResponse = z.infer<typeof refineSynthesisResponseSchema>;
