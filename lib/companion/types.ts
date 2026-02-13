/**
 * Clarity Companion API Types
 *
 * Type definitions for the context delivery layer that provides
 * synthesized user context to external products.
 *
 * Covers ALL 6 sections of Clarity Canvas:
 * - Individual (background, thinking, working, values)
 * - Role (responsibilities, scope, constraints)
 * - Organization (fundamentals, product, market, financials)
 * - Goals (immediate, medium, metrics, strategy)
 * - Network (stakeholders, team, support)
 * - Projects (active, upcoming, completed)
 */

// ============================================================================
// Base Synthesis Structure (~1500-2000 tokens)
// ============================================================================

export interface BaseSynthesis {
  // -------------------------------------------------------------------------
  // INDIVIDUAL SECTION - Who is this person?
  // -------------------------------------------------------------------------

  // Core identity (from 'individual.background' + 'role.responsibilities')
  identity: {
    name: string;
    role: string;
    company: string;
    industry: string;
    companyStage: 'startup' | 'growth' | 'enterprise' | 'unknown';
  };

  // Background & expertise (from 'individual.background')
  background: {
    careerPath: string | null;
    expertise: string[];
    yearsExperience: number | null;
    education: string | null;
  };

  // Thinking style (from 'individual.thinking')
  thinkingStyle: {
    decisionMaking: string | null;
    problemSolving: string | null;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' | null;
    learningStyle: string | null;
  };

  // Working style (from 'individual.working')
  workingStyle: {
    collaborationPreference: string | null;
    communicationStyle: string | null;
    workPace: string | null;
    autonomyLevel: string | null;
  };

  // Values & motivations (from 'individual.values')
  values: {
    coreValues: string[];
    motivations: string[];
    personalMission: string | null;
    passions: string[];
  };

  // -------------------------------------------------------------------------
  // ROLE SECTION - What do they do?
  // -------------------------------------------------------------------------

  // Role scope & authority (from 'role.scope')
  roleScope: {
    decisionAuthority: string | null;
    budgetControl: string | null;
    strategicInput: string | null;
    teamSize: number | null;
  };

  // Role constraints & challenges (from 'role.constraints')
  painPoints: PainPointSummary[];

  // -------------------------------------------------------------------------
  // ORGANIZATION SECTION - Where do they work?
  // -------------------------------------------------------------------------

  // Product & strategy (from 'organization.product')
  product: {
    coreProduct: string | null;
    valueProposition: string | null;
    businessModel: string | null;
    competitiveAdvantage: string | null;
  };

  // Market position (from 'organization.market')
  market: {
    targetMarket: string | null;
    customerSegments: string[];
    marketSize: string | null;
    competitiveLandscape: string | null;
  };

  // Financial context (from 'organization.financials')
  financials: {
    fundingStatus: string | null;
    runway: string | null;
    revenueStage: string | null;
  };

  // -------------------------------------------------------------------------
  // GOALS SECTION - What are they trying to achieve?
  // -------------------------------------------------------------------------

  // Goals summary (from 'goals.immediate' + 'goals.medium')
  goals: GoalSummary[];

  // Success metrics (from 'goals.metrics')
  successMetrics: {
    northStar: string | null;
    kpis: string[];
    successDefinition: string | null;
  };

  // Strategic direction (from 'goals.strategy')
  strategicPriorities: string[];

  // Decision dynamics (from 'individual.thinking' + derived)
  decisionDynamics: {
    decisionMakers: string[];
    buyingProcess: string;
    keyInfluencers: string[];
  };

  // -------------------------------------------------------------------------
  // NETWORK SECTION - Who do they work with?
  // -------------------------------------------------------------------------

  // Team & collaborators (from 'network.team')
  team: {
    directReports: string[];
    keyCollaborators: string[];
    crossFunctional: string[];
  };

  // Support network (from 'network.support')
  supportNetwork: {
    advisors: string[];
    mentors: string[];
    peerNetwork: string | null;
    helpNeeded: string[];
  };

  // Key stakeholders (from 'network.stakeholders') - used in decisionDynamics

  // -------------------------------------------------------------------------
  // PROJECTS SECTION - What are they working on?
  // -------------------------------------------------------------------------

  // Active & planned projects (from 'projects.active' + 'projects.upcoming')
  activeProjects: ProjectSummary[];

  // Recent completions & learnings (from 'projects.completed')
  recentAccomplishments: {
    recentWins: string[];
    lessonsLearned: string[];
  };

  // -------------------------------------------------------------------------
  // PERSONAS - Customer understanding (from Persona model - NOT ProfileField)
  // -------------------------------------------------------------------------
  personas: PersonaSummary[];

  // -------------------------------------------------------------------------
  // METADATA
  // -------------------------------------------------------------------------
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
  baseSynthesis: 2000, // Increased from 1000 to accommodate enriched synthesis
  toolDefinitions: 2000,
  conversationHistory: 50000,
  outputBuffer: 8000,
  dynamicContext: 137500, // Adjusted to account for larger baseSynthesis
};
