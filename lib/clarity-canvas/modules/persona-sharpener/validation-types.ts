/**
 * Types for persona validation sharing feature
 */

export type ValidationViewMode = 'by-question' | 'by-session';

export interface ValidationLinkInfo {
  url: string;
  slug: string;
  isActive: boolean;
  totalResponses: number;
  totalSessions: number;
  createdAt: Date;
}

export interface ValidationSessionSummary {
  id: string;
  respondentName: string | null;
  respondentEmail: string | null;
  status: string;
  questionsAnswered: number;
  questionsSkipped: number;
  startedAt: Date;
  completedAt: Date | null;
}

export interface ValidationProgress {
  sessionId: string;
  currentQuestionIndex: number;
  questionsAnswered: number;
  questionsSkipped: number;
  responses: Record<string, unknown>;
}

export interface LocalStorageValidationState {
  sessionId: string;
  slug: string;
  progress: ValidationProgress;
  expiresAt: number; // timestamp
}

/**
 * Individual validation response with comparison to founder assumption
 */
export interface ValidationResponseItem {
  sessionId: string;
  respondentName: string | null;
  value: unknown;
  confidence: number;
  isUnsure: boolean;
  additionalContext: string | null;
  createdAt: Date;
}

/**
 * Founder's original assumption for a question
 */
export interface FounderAssumption {
  value: unknown;
  confidence: number;
  isUnsure: boolean;
}

/**
 * Responses grouped by question (for by-question view)
 */
export interface ValidationResponseByQuestion {
  questionId: string;
  field: string;
  founderAssumption: FounderAssumption | null;
  validationResponses: ValidationResponseItem[];
  /** The contextualized question text that validators actually saw */
  validationContextualizedText?: string | null;
}

/**
 * Single response with founder comparison (for by-session view)
 */
export interface SessionResponseWithComparison {
  questionId: string;
  field: string;
  value: unknown;
  confidence: number;
  isUnsure: boolean;
  additionalContext: string | null;
  founderAssumption: FounderAssumption | null;
}

/**
 * Responses grouped by session (for by-session view)
 */
export interface ValidationResponseBySession {
  session: ValidationSessionSummary;
  responses: SessionResponseWithComparison[];
}

/**
 * Computed summary statistics for validation responses
 */
export interface ValidationSummary {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  abandonedSessions: number;
  totalResponses: number;
  questionsWithResponses: number;
  totalQuestions: number;
  overallAlignmentScore: number | null;
  confidenceLevel: {
    minResponses: number;
    confidencePercent: number;
    label: string;
    message: string;
    nextLevel: { responses: number; confidence: number } | null;
  };
  topMisalignments: Array<{
    questionId: string;
    questionText: string;
    category: string;
    alignmentScore: number;
    responseCount: number;
  }>;
  questionAlignments: Array<{
    questionId: string;
    alignmentScore: number;
    responseCount: number;
  }>;
}
