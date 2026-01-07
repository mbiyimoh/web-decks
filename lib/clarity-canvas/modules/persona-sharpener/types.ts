// lib/clarity-canvas/modules/persona-sharpener/types.ts

export type QuestionType =
  | 'this-or-that'
  | 'slider'
  | 'ranking'
  | 'multi-select'
  | 'fill-blank'
  | 'scenario';

export type QuestionCategory =
  | 'identity'
  | 'goals'
  | 'frustrations'
  | 'emotional'
  | 'social'
  | 'behaviors'
  | 'antiPatterns';

export interface QuestionOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface RankedItem {
  id: string;
  label: string;
  rank?: number;
}

export interface BlankConfig {
  id: string;
  placeholder: string;
  suggestions?: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  field: string;
  question: string;
  validationQuestion: string | null;
  options?: QuestionOption[];
  items?: RankedItem[];
  blanks?: BlankConfig[];
  template?: string;
  min?: string;
  max?: string;
  defaultValue?: number;
  maxSelections?: number;
  placeholder?: string;
  helperText?: string;
  instruction?: string;
}

export interface ResponseInput {
  questionId: string;
  value: unknown;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  contextSource?: 'text' | null;
}

export interface PersonaClarity {
  overall: number;
  identity: number;
  goals: number;
  frustrations: number;
  emotional: number;
  behaviors: number;
}

export interface PersonaDemographics {
  ageRange?: string;
  lifestyle?: string;
  techSavviness?: number;
}

export interface PersonaJobs {
  functional?: string;
  emotional?: string;
  social?: string;
}

export interface PersonaGoals {
  priorities?: RankedItem[];
  successDefinition?: Record<string, string>;
}

export interface PersonaFrustrations {
  pastFailures?: string;
  dealbreakers?: string[];
  currentWorkaround?: Record<string, string>;
}

export interface PersonaBehaviors {
  decisionStyle?: string;
  usageTime?: string;
  timeAvailable?: number;
  discoveryChannels?: RankedItem[];
  influences?: string[];
}

export interface PersonaDisplay {
  id: string;
  name: string | null;
  archetype: string;
  summary: string;
  quote: string | null;
  demographics: PersonaDemographics;
  jobs: PersonaJobs;
  goals: PersonaGoals;
  frustrations: PersonaFrustrations;
  behaviors: PersonaBehaviors;
  antiPatterns: string[];
  clarity: PersonaClarity;
  avgConfidence: number;
  unsureCount: number;
}

export interface SharpenerState {
  persona: PersonaDisplay;
  responses: Record<string, ResponseInput>;
  currentQuestionIndex: number;
  sessionId: string;
  isComplete: boolean;
}

// API response types
export interface CreatePersonaResponse {
  persona: PersonaDisplay;
  sessionId: string;
}

export interface SubmitResponsePayload {
  sessionId: string;
  questionId: string;
  value: unknown;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  contextSource?: 'text' | null;
}

export interface SubmitResponseResponse {
  response: {
    id: string;
    questionId: string;
    value: unknown;
  };
  persona: PersonaDisplay;
  clarity: PersonaClarity;
}

/**
 * Brain dump project with personas and completion status.
 * Used by both API routes and client components.
 */
export interface BrainDumpProject {
  id: string;
  createdAt: string;
  personaCount: number;
  personas: Array<{
    id: string;
    name: string | null;
    extractionConfidence: number | null;
    isComplete: boolean;
    hasCompletedSession: boolean;
    hasInProgressSession?: boolean;
    // Session IDs for direct URL linking
    inProgressSessionId?: string | null;
    completedSessionId?: string | null;
  }>;
  completedPersonaCount: number;
  hasAnyProgress: boolean;
}

/**
 * Default archetype name when no persona name is extracted
 */
export const DEFAULT_ARCHETYPE = 'Your Ideal Customer';
