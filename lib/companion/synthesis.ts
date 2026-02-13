/**
 * Synthesis Generation for Clarity Companion API
 *
 * Generates a structured ~1500-2000 token summary of user context
 * by combining ALL ProfileSection data and Persona records.
 * Covers all 6 Clarity Canvas sections: Individual, Role, Organization,
 * Goals, Network, and Projects.
 */

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { Prisma } from '@prisma/client';
import type {
  BaseSynthesis,
  PersonaSummary,
  GoalSummary,
  PainPointSummary,
  ProjectSummary,
} from './types';

// ============================================================================
// Token Counting (word-based approximation)
// ============================================================================

/**
 * Approximate token count using word-based heuristic.
 * Average English word is ~1.33 tokens (including punctuation/spacing).
 */
// ============================================================================
// User ID Resolution
// ============================================================================

/**
 * Build a Prisma where clause that handles all user ID formats:
 * - email address (from credentials OAuth)
 * - User.id (cuid)
 * - User.authId (Google OAuth UUID or email for credentials)
 * - Legacy ClarityProfile.userId (Supabase ID)
 *
 * Always returns a valid WHERE clause (never null).
 */
/**
 * Resolve OAuth userId (email or Google UUID) to actual User.id (cuid).
 * Returns the User.id for use with tables that have FK to User.
 * Returns null if no matching user found.
 */
export async function resolveToUserId(userId: string): Promise<string | null> {
  // First check if this is already a User.id (cuid format)
  const directUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (directUser) {
    return directUser.id;
  }

  // Try to find User by authId (Google OAuth UUID) or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { authId: userId }, // Google OAuth: authId is the Google UUID
        { email: userId },  // Credentials: userId is the email
      ],
    },
    select: { id: true },
  });

  if (user) {
    return user.id;
  }

  return null;
}

export async function resolveProfileWhereClause(
  userId: string
): Promise<Prisma.ClarityProfileWhereInput> {
  // Start with direct match (handles legacy ClarityProfile.userId and userRecordId)
  const orConditions: Prisma.ClarityProfileWhereInput[] = [
    { userId },
    { userRecordId: userId },
  ];

  // Try to find User by authId (Google OAuth UUID) or email
  // This handles the case where userId is a NextAuth ID (UUID for Google, email for credentials)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { authId: userId }, // Google OAuth: authId is the Google UUID
        { email: userId },  // Credentials: userId is the email
      ],
    },
    select: { id: true, authId: true },
  });

  if (user) {
    // Add User.id and authId to the search
    orConditions.push(
      { userRecordId: user.id },
      { userId: user.authId }
    );
  }

  return { OR: orConditions };
}

// ============================================================================
// Token Counting (word-based approximation)
// ============================================================================

export function estimateTokens(text: string): number {
  if (!text) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount * 1.33);
}

export function estimateObjectTokens(obj: unknown): number {
  const json = JSON.stringify(obj, null, 2);
  return estimateTokens(json);
}

// ============================================================================
// Version Generation
// ============================================================================

export function generateVersion(): string {
  const timestamp = Date.now().toString(36);
  const random = nanoid(4);
  return `v${timestamp}.${random}`;
}

// ============================================================================
// Profile Hash Calculation
// ============================================================================

export async function calculateProfileHash(userId: string): Promise<string> {
  const crypto = await import('crypto');

  // Resolve WHERE clause (handles email, User.id, authId)
  const whereClause = await resolveProfileWhereClause(userId);

  const profile = await prisma.clarityProfile.findFirst({
    where: whereClause,
    include: {
      sections: true,
      personas: true,
    },
  });

  if (!profile) {
    return crypto.createHash('sha256').update('empty').digest('hex');
  }

  const hashInput = {
    profileUpdatedAt: profile.updatedAt.toISOString(),
    sections: profile.sections.map((s) => ({
      key: s.key,
      score: s.score, // Use score as proxy for content changes
    })),
    personas: profile.personas.map((p) => ({
      id: p.id,
      updatedAt: p.updatedAt.toISOString(),
    })),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex')
    .slice(0, 16); // Short hash for readability
}

// ============================================================================
// Synthesis Generation
// ============================================================================

/**
 * Generate base synthesis for a user.
 * Combines ALL ProfileSection fields and Persona records.
 * Covers all 6 sections: Individual, Role, Organization, Goals, Network, Projects
 */
export async function generateBaseSynthesis(
  userId: string
): Promise<BaseSynthesis | null> {
  // Resolve WHERE clause (handles email, User.id, authId)
  const whereClause = await resolveProfileWhereClause(userId);

  // Fetch profile with all nested data
  const profile = await prisma.clarityProfile.findFirst({
    where: whereClause,
    include: {
      sections: {
        include: {
          subsections: {
            include: {
              fields: true,
            },
          },
        },
      },
      personas: true,
    },
  });

  if (!profile) {
    return null;
  }

  // Helper to get field value from profile (returns summary or fullContext)
  const getField = (
    sectionKey: string,
    subsectionKey: string,
    fieldKey: string
  ): string | null => {
    const section = profile.sections.find((s) => s.key === sectionKey);
    if (!section) return null;
    const subsection = section.subsections.find(
      (sub) => sub.key === subsectionKey
    );
    if (!subsection) return null;
    const field = subsection.fields.find((f) => f.key === fieldKey);
    return field?.summary || field?.fullContext || null;
  };

  // Helper to get multiple fields as array (non-null values only)
  const getFieldsAsArray = (
    sectionKey: string,
    subsectionKey: string,
    fieldKeys: string[]
  ): string[] => {
    return fieldKeys
      .map((key) => getField(sectionKey, subsectionKey, key))
      .filter((v): v is string => v !== null);
  };

  // Helper to parse list from field (comma-separated or JSON array)
  const parseListField = (value: string | null): string[] => {
    if (!value) return [];
    // Try JSON array first
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // Not JSON, treat as comma-separated
    }
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  };

  // -------------------------------------------------------------------------
  // INDIVIDUAL SECTION
  // -------------------------------------------------------------------------

  // Identity (individual + organization + role)
  const identity = {
    name: profile.name || 'Unknown',
    role: getField('role', 'responsibilities', 'title') || 'Unknown',
    company:
      getField('organization', 'fundamentals', 'company_name') || 'Unknown',
    industry:
      getField('organization', 'fundamentals', 'org_industry') || 'Unknown',
    companyStage: parseCompanyStage(
      getField('organization', 'fundamentals', 'stage')
    ),
  };

  // Background & expertise (individual.background)
  const background = {
    careerPath: getField('individual', 'background', 'career'),
    expertise: parseListField(getField('individual', 'background', 'expertise')),
    yearsExperience: parseYearsExperience(
      getField('individual', 'background', 'experience_years')
    ),
    education: getField('individual', 'background', 'education'),
  };

  // Thinking style (individual.thinking)
  const thinkingStyle = {
    decisionMaking: getField('individual', 'thinking', 'decision_making'),
    problemSolving: getField('individual', 'thinking', 'problem_solving'),
    riskTolerance: parseRiskTolerance(
      getField('individual', 'thinking', 'risk_tolerance')
    ),
    learningStyle: getField('individual', 'thinking', 'learning_style'),
  };

  // Working style (individual.working)
  const workingStyle = {
    collaborationPreference: getField('individual', 'working', 'collaboration_preference'),
    communicationStyle: getField('individual', 'working', 'communication_style'),
    workPace: getField('individual', 'working', 'work_pace'),
    autonomyLevel: getField('individual', 'working', 'autonomy_level'),
  };

  // Values & motivations (individual.values)
  const values = {
    coreValues: parseListField(getField('individual', 'values', 'core_values')),
    motivations: parseListField(getField('individual', 'values', 'motivations')),
    personalMission: getField('individual', 'values', 'mission'),
    passions: parseListField(getField('individual', 'values', 'passions')),
  };

  // -------------------------------------------------------------------------
  // ROLE SECTION
  // -------------------------------------------------------------------------

  // Role scope & authority (role.scope)
  const roleScope = {
    decisionAuthority: getField('role', 'scope', 'decision_authority'),
    budgetControl: getField('role', 'scope', 'budget_control'),
    strategicInput: getField('role', 'scope', 'strategic_input'),
    teamSize: parseTeamSize(getField('role', 'responsibilities', 'team_size')),
  };

  // Pain points from role constraints
  const painPoints: PainPointSummary[] = [];
  const roleSection = profile.sections.find((s) => s.key === 'role');
  if (roleSection) {
    const constraintFields =
      roleSection.subsections.find((sub) => sub.key === 'constraints')
        ?.fields || [];

    for (const field of constraintFields) {
      if (field.summary || field.fullContext) {
        painPoints.push({
          pain: field.summary || field.fullContext!.slice(0, 150),
          severity: 'significant',
          category: field.key.replace(/_/g, ' '),
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // ORGANIZATION SECTION
  // -------------------------------------------------------------------------

  // Product & strategy (organization.product)
  const product = {
    coreProduct: getField('organization', 'product', 'core_product'),
    valueProposition: getField('organization', 'product', 'value_proposition'),
    businessModel: getField('organization', 'product', 'business_model'),
    competitiveAdvantage: getField('organization', 'product', 'competitive_advantage'),
  };

  // Market position (organization.market)
  const market = {
    targetMarket: getField('organization', 'market', 'target_market'),
    customerSegments: parseListField(
      getField('organization', 'market', 'customer_segments')
    ),
    marketSize: getField('organization', 'market', 'market_size'),
    competitiveLandscape: getField('organization', 'market', 'competitive_landscape'),
  };

  // Financial context (organization.financials)
  const financials = {
    fundingStatus: getField('organization', 'financials', 'funding_status'),
    runway: getField('organization', 'financials', 'runway'),
    revenueStage: getField('organization', 'financials', 'revenue_stage'),
  };

  // -------------------------------------------------------------------------
  // GOALS SECTION
  // -------------------------------------------------------------------------

  // Goals from immediate + medium term
  const goals: GoalSummary[] = [];
  const goalsSection = profile.sections.find((s) => s.key === 'goals');
  if (goalsSection) {
    // Immediate goals (high priority)
    const immediateFields =
      goalsSection.subsections.find((sub) => sub.key === 'immediate')?.fields ||
      [];

    for (const field of immediateFields) {
      if (field.summary || field.fullContext) {
        goals.push({
          goal: field.summary || field.fullContext!.slice(0, 150),
          priority: 'high',
          timeframe: mapFieldToTimeframe(field.key),
        });
      }
    }

    // Medium-term goals
    const mediumFields =
      goalsSection.subsections.find((sub) => sub.key === 'medium')?.fields ||
      [];

    for (const field of mediumFields) {
      if (field.summary || field.fullContext) {
        goals.push({
          goal: field.summary || field.fullContext!.slice(0, 150),
          priority: 'medium',
          timeframe: mapFieldToTimeframe(field.key),
        });
      }
    }
  }

  // Success metrics (goals.metrics)
  const successMetrics = {
    northStar: getField('goals', 'metrics', 'north_star'),
    kpis: parseListField(getField('goals', 'metrics', 'kpis')),
    successDefinition: getField('goals', 'metrics', 'success_definition'),
  };

  // Strategic priorities from goals.strategy
  const strategicPriorities: string[] = [];
  const strategyFields =
    goalsSection?.subsections.find((sub) => sub.key === 'strategy')?.fields ||
    [];

  for (const field of strategyFields) {
    if (field.summary) {
      strategicPriorities.push(field.summary);
    } else if (field.fullContext) {
      strategicPriorities.push(field.fullContext.slice(0, 100));
    }
  }

  // Decision dynamics
  const decisionDynamics = {
    decisionMakers: [identity.name],
    buyingProcess:
      getField('individual', 'thinking', 'decision_making') || 'Not specified',
    keyInfluencers: extractInfluencers(profile),
  };

  // -------------------------------------------------------------------------
  // NETWORK SECTION
  // -------------------------------------------------------------------------

  // Team & collaborators (network.team)
  const team = {
    directReports: parseListField(getField('network', 'team', 'direct_reports')),
    keyCollaborators: parseListField(getField('network', 'team', 'key_collaborators')),
    crossFunctional: parseListField(getField('network', 'team', 'cross_functional')),
  };

  // Support network (network.support)
  const supportNetwork = {
    advisors: parseListField(getField('network', 'support', 'advisors')),
    mentors: parseListField(getField('network', 'support', 'mentors')),
    peerNetwork: getField('network', 'support', 'peer_network'),
    helpNeeded: parseListField(getField('network', 'support', 'help_needed')),
  };

  // -------------------------------------------------------------------------
  // PROJECTS SECTION
  // -------------------------------------------------------------------------

  // Active & planned projects
  const activeProjects: ProjectSummary[] = [];
  const projectsSection = profile.sections.find((s) => s.key === 'projects');
  if (projectsSection) {
    // Active initiatives
    const activeFields =
      projectsSection.subsections.find((sub) => sub.key === 'active')?.fields ||
      [];

    for (const field of activeFields) {
      if (field.summary || field.fullContext) {
        activeProjects.push({
          name: field.name || field.key.replace(/_/g, ' '),
          status: 'active',
          priority: 'high',
          description: field.summary || field.fullContext!.slice(0, 200),
        });
      }
    }

    // Upcoming priorities
    const upcomingFields =
      projectsSection.subsections.find((sub) => sub.key === 'upcoming')
        ?.fields || [];

    for (const field of upcomingFields) {
      if (field.summary || field.fullContext) {
        activeProjects.push({
          name: field.name || field.key.replace(/_/g, ' '),
          status: 'planned',
          priority: 'medium',
          description: field.summary || field.fullContext!.slice(0, 200),
        });
      }
    }
  }

  // Recent accomplishments (projects.completed)
  const recentAccomplishments = {
    recentWins: parseListField(getField('projects', 'completed', 'recent_wins')),
    lessonsLearned: parseListField(getField('projects', 'completed', 'lessons_learned')),
  };

  // -------------------------------------------------------------------------
  // PERSONAS (from Persona model, NOT ProfileField)
  // -------------------------------------------------------------------------

  const personas: PersonaSummary[] = profile.personas
    .filter((p) => p.name)
    .slice(0, 5) // Allow up to 5 personas
    .map((p) => {
      const goalsData = p.goals as { priorities?: string[] } | null;
      const frustrations = p.frustrations as { pastFailures?: string[] } | null;

      return {
        name: p.name || 'Unnamed Persona',
        role: extractPersonaRole(p.demographics),
        primaryGoal: goalsData?.priorities?.[0] || 'Not specified',
        topFrustration: frustrations?.pastFailures?.[0] || 'Not specified',
      };
    });

  // -------------------------------------------------------------------------
  // BUILD FINAL SYNTHESIS
  // -------------------------------------------------------------------------

  const profileCompleteness = calculateCompleteness(profile);

  const synthesis: BaseSynthesis = {
    // Individual section
    identity,
    background,
    thinkingStyle,
    workingStyle,
    values,
    // Role section
    roleScope,
    painPoints,
    // Organization section
    product,
    market,
    financials,
    // Goals section
    goals,
    successMetrics,
    strategicPriorities,
    decisionDynamics,
    // Network section
    team,
    supportNetwork,
    // Projects section
    activeProjects,
    recentAccomplishments,
    // Personas
    personas,
    // Metadata
    _meta: {
      tokenCount: 0,
      version: generateVersion(),
      generatedAt: new Date().toISOString(),
      profileCompleteness,
    },
  };

  // Calculate actual token count
  synthesis._meta.tokenCount = estimateObjectTokens(synthesis);

  return synthesis;
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseCompanyStage(
  stage: string | null
): 'startup' | 'growth' | 'enterprise' | 'unknown' {
  if (!stage) return 'unknown';
  const lower = stage.toLowerCase();
  if (
    lower.includes('startup') ||
    lower.includes('seed') ||
    lower.includes('early')
  ) {
    return 'startup';
  }
  if (lower.includes('growth') || lower.includes('series')) {
    return 'growth';
  }
  if (
    lower.includes('enterprise') ||
    lower.includes('public') ||
    lower.includes('large')
  ) {
    return 'enterprise';
  }
  return 'unknown';
}

function parseYearsExperience(value: string | null): number | null {
  if (!value) return null;
  // Extract first number from string
  const match = value.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function parseRiskTolerance(
  value: string | null
): 'conservative' | 'moderate' | 'aggressive' | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes('conservative') || lower.includes('low') || lower.includes('risk-averse')) {
    return 'conservative';
  }
  if (lower.includes('aggressive') || lower.includes('high') || lower.includes('bold')) {
    return 'aggressive';
  }
  if (lower.includes('moderate') || lower.includes('balanced') || lower.includes('medium')) {
    return 'moderate';
  }
  return 'moderate'; // Default to moderate if unclear
}

function parseTeamSize(value: string | null): number | null {
  if (!value) return null;
  // Extract first number from string
  const match = value.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function mapFieldToTimeframe(fieldKey: string): string {
  const mapping: Record<string, string> = {
    current_focus: 'now',
    this_week: 'this week',
    this_month: 'this month',
    blockers: 'immediate',
    quarterly_goals: 'quarterly',
    annual_goals: 'annual',
    milestones: 'milestone-based',
  };
  return mapping[fieldKey] || 'ongoing';
}

function extractPersonaRole(demographics: unknown): string {
  if (!demographics || typeof demographics !== 'object') {
    return 'Unknown Role';
  }
  const demo = demographics as Record<string, unknown>;
  return String(demo.role || demo.jobTitle || demo.title || 'Unknown Role');
}

function extractInfluencers(profile: {
  sections: Array<{
    key: string;
    subsections: Array<{
      key: string;
      fields: Array<{
        key: string;
        summary: string | null;
        fullContext: string | null;
      }>;
    }>;
  }>;
}): string[] {
  const networkSection = profile.sections.find((s) => s.key === 'network');
  if (!networkSection) return [];

  const influencers: string[] = [];

  const stakeholders = networkSection.subsections.find(
    (sub) => sub.key === 'stakeholders'
  );
  if (stakeholders) {
    for (const field of stakeholders.fields) {
      if (field.summary) {
        influencers.push(field.summary.slice(0, 50));
      }
    }
  }

  return influencers.slice(0, 3);
}

function calculateCompleteness(profile: {
  sections: Array<{
    subsections: Array<{
      fields: Array<{ summary: string | null; fullContext: string | null }>;
    }>;
  }>;
  personas: Array<{ name: string | null }>;
}): number {
  let totalFields = 0;
  let filledFields = 0;

  for (const section of profile.sections) {
    for (const subsection of section.subsections) {
      for (const field of subsection.fields) {
        totalFields++;
        if (field.summary || field.fullContext) {
          filledFields++;
        }
      }
    }
  }

  // Bonus for having personas
  const personaBonus = profile.personas.filter((p) => p.name).length > 0 ? 10 : 0;

  if (totalFields === 0) return personaBonus;

  const fieldPercentage = Math.round((filledFields / totalFields) * 90);
  return Math.min(100, fieldPercentage + personaBonus);
}
