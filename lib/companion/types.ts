/**
 * Clarity Companion API Types
 *
 * Type definitions for the context delivery layer that provides
 * synthesized user context to external products.
 */

// ============================================================================
// Base Synthesis Structure (~800 tokens)
// ============================================================================

export interface BaseSynthesis {
  // User identity (from ProfileSection 'individual' and 'organization')
  identity: {
    name: string;
    role: string;
    company: string;
    industry: string;
    companyStage: 'startup' | 'growth' | 'enterprise' | 'unknown';
  };

  // Customer understanding (from Persona model - NOT ProfileField)
  personas: PersonaSummary[];

  // Strategic context (from ProfileSection 'goals')
  goals: GoalSummary[];

  // Challenges (derived from ProfileSection 'role.constraints' and context)
  painPoints: PainPointSummary[];

  // Decision making (from ProfileSection 'individual.thinking')
  decisionDynamics: {
    decisionMakers: string[];
    buyingProcess: string;
    keyInfluencers: string[];
  };

  // Strategic priorities (from ProfileSection 'goals.strategy')
  strategicPriorities: string[];

  // Current work context (from ProfileSection 'projects')
  activeProjects: ProjectSummary[];

  // Metadata
  _meta: SynthesisMetadata;
}

/**
 * Summary of a customer persona.
 * NOTE: Data comes from the Persona model, NOT ProfileField.
 */
export interface PersonaSummary {
  name: string;
  role: string;
  primaryGoal: string;
  topFrustration: string;
}

export interface GoalSummary {
  goal: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface PainPointSummary {
  pain: string;
  severity: 'critical' | 'significant' | 'moderate';
  category: string;
}

export interface ProjectSummary {
  name: string;
  status: 'active' | 'planned' | 'completed';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface SynthesisMetadata {
  tokenCount: number;
  version: string;
  generatedAt: string; // ISO date string
  profileCompleteness: number; // 0-100
}

// ============================================================================
// API Response Types
// ============================================================================

export type CacheHint = 'stable' | 'volatile';

export interface ApiResponseMeta {
  generatedAt: string;
  latencyMs: number;
}

export interface SynthesisResponse {
  synthesis: BaseSynthesis;
  cacheHint: CacheHint;
  stale: boolean;
}

export interface ProfileIndexResponse {
  sections: SectionMetadata[];
  totalTokens: number;
  version: string;
}

export interface SectionMetadata {
  id: string;
  title: string;
  subsections: string[];
  tokenCount: number;
  lastUpdated: string;
  cacheHint: CacheHint;
  completeness: number; // 0-100
}

export interface SectionResponse {
  section: SectionDetail;
  tokenCount: number;
  version: string;
  cacheHint: CacheHint;
}

export interface SectionDetail {
  id: string;
  title: string;
  subsections: SubsectionDetail[];
}

export interface SubsectionDetail {
  id: string;
  title: string;
  fields: FieldDetail[];
}

export interface FieldDetail {
  key: string;
  summary: string | null;
  fullContext: string | null;
  confidence: number;
  lastUpdated: string;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchRequest {
  query: string;
  maxResults?: number;
  sections?: string[]; // Filter to specific sections
}

export interface SearchResponse {
  results: SearchResult[];
  totalTokens: number;
  query: string;
}

export interface SearchResult {
  section: string;
  subsection: string;
  field: string;
  snippet: string;
  relevance: number; // 0-1
  tokenCount: number;
}

// ============================================================================
// Cache Validation Types
// ============================================================================

export interface CacheValidateRequest {
  cachedVersion: string;
  sections?: Record<string, string>; // sectionId -> version
}

export interface CacheValidateResponse {
  synthesisStale: boolean;
  sectionsStale: Record<string, boolean>;
  currentVersions: {
    synthesis: string;
    [sectionId: string]: string;
  };
}

// ============================================================================
// Token Budget Types (for consuming products)
// ============================================================================

export interface TokenBudget {
  maxContextWindow: number;
  systemPromptBase: number;
  baseSynthesis: number;
  toolDefinitions: number;
  conversationHistory: number;
  outputBuffer: number;
  dynamicContext: number;
}

export interface TokenUsage {
  systemPrompt: number;
  baseSynthesis: number;
  fetchedSections: { section: string; tokens: number }[];
  conversationHistory: number;
  total: number;
  remaining: number;
}

export const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  maxContextWindow: 200000,
  systemPromptBase: 500,
  baseSynthesis: 1000,
  toolDefinitions: 2000,
  conversationHistory: 50000,
  outputBuffer: 8000,
  dynamicContext: 138500,
};
