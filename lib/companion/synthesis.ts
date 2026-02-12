/**
 * Synthesis Generation for Clarity Companion API
 *
 * Generates a structured ~800 token summary of user context
 * by combining ProfileSection data and Persona records.
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
  console.log('[DEBUG resolveToUserId] Input userId:', userId);

  // First check if this is already a User.id (cuid format)
  const directUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (directUser) {
    console.log('[DEBUG resolveToUserId] Direct match on User.id:', directUser.id);
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
    console.log('[DEBUG resolveToUserId] Found user by authId/email:', user.id);
    return user.id;
  }

  console.log('[DEBUG resolveToUserId] No user found for:', userId);
  return null;
}

export async function resolveProfileWhereClause(
  userId: string
): Promise<Prisma.ClarityProfileWhereInput> {
  console.log('[DEBUG resolveProfileWhereClause] Input userId:', userId);

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
    console.log('[DEBUG resolveProfileWhereClause] Found user:', { id: user.id, authId: user.authId });
    // Add User.id and authId to the search
    orConditions.push(
      { userRecordId: user.id },
      { userId: user.authId }
    );
  } else {
    console.log('[DEBUG resolveProfileWhereClause] No user found for:', userId);
  }

  console.log('[DEBUG resolveProfileWhereClause] OR conditions count:', orConditions.length);

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
 * Combines ProfileSection fields and Persona records.
 */
export async function generateBaseSynthesis(
  userId: string
): Promise<BaseSynthesis | null> {
  console.log('[DEBUG generateBaseSynthesis] Looking up profile for userId:', userId);

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

  console.log('[DEBUG generateBaseSynthesis] Profile found:', !!profile);

  if (!profile) {
    return null;
  }

  // Helper to get field value from profile
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

  // Build identity from individual and organization sections
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

  // Build personas from Persona model (NOT ProfileField!)
  const personas: PersonaSummary[] = profile.personas
    .filter((p) => p.name) // Only include named personas
    .slice(0, 3) // Max 3 personas
    .map((p) => {
      const goals = p.goals as { priorities?: string[] } | null;
      const frustrations = p.frustrations as { pastFailures?: string[] } | null;

      return {
        name: p.name || 'Unnamed Persona',
        role: extractPersonaRole(p.demographics),
        primaryGoal: goals?.priorities?.[0] || 'Not specified',
        topFrustration: frustrations?.pastFailures?.[0] || 'Not specified',
      };
    });

  // Build goals from goals section
  const goals: GoalSummary[] = [];
  const goalsSection = profile.sections.find((s) => s.key === 'goals');
  if (goalsSection) {
    const immediateFields =
      goalsSection.subsections.find((sub) => sub.key === 'immediate')?.fields ||
      [];

    for (const field of immediateFields.slice(0, 3)) {
      if (field.summary || field.fullContext) {
        goals.push({
          goal: field.summary || field.fullContext!.slice(0, 100),
          priority: 'high',
          timeframe: 'immediate',
        });
      }
    }

    const mediumFields =
      goalsSection.subsections.find((sub) => sub.key === 'medium')?.fields ||
      [];

    for (const field of mediumFields.slice(0, 2)) {
      if (field.summary || field.fullContext) {
        goals.push({
          goal: field.summary || field.fullContext!.slice(0, 100),
          priority: 'medium',
          timeframe: 'quarterly',
        });
      }
    }
  }

  // Build pain points from role constraints
  const painPoints: PainPointSummary[] = [];
  const roleSection = profile.sections.find((s) => s.key === 'role');
  if (roleSection) {
    const constraintFields =
      roleSection.subsections.find((sub) => sub.key === 'constraints')
        ?.fields || [];

    for (const field of constraintFields.slice(0, 3)) {
      if (field.summary || field.fullContext) {
        painPoints.push({
          pain: field.summary || field.fullContext!.slice(0, 100),
          severity: 'significant',
          category: field.key.replace(/_/g, ' '),
        });
      }
    }
  }

  // Build decision dynamics from individual thinking
  const decisionDynamics = {
    decisionMakers: [identity.name],
    buyingProcess:
      getField('individual', 'thinking', 'decision_making') || 'Not specified',
    keyInfluencers: extractInfluencers(profile),
  };

  // Build strategic priorities from goals strategy
  const strategicPriorities: string[] = [];
  const strategyFields =
    goalsSection?.subsections.find((sub) => sub.key === 'strategy')?.fields ||
    [];

  for (const field of strategyFields.slice(0, 5)) {
    if (field.summary) {
      strategicPriorities.push(field.summary);
    }
  }

  // Build active projects from projects section
  const activeProjects: ProjectSummary[] = [];
  const projectsSection = profile.sections.find((s) => s.key === 'projects');
  if (projectsSection) {
    // Active initiatives (highest priority)
    const activeFields =
      projectsSection.subsections.find((sub) => sub.key === 'active')?.fields ||
      [];

    for (const field of activeFields) {
      if (field.summary || field.fullContext) {
        activeProjects.push({
          name: field.name || field.key.replace(/_/g, ' '),
          status: 'active',
          priority: 'high',
          description: field.summary || field.fullContext!.slice(0, 150),
        });
      }
    }

    // Upcoming priorities (if we have room for more context)
    if (activeProjects.length < 4) {
      const upcomingFields =
        projectsSection.subsections.find((sub) => sub.key === 'upcoming')
          ?.fields || [];

      for (const field of upcomingFields.slice(0, 4 - activeProjects.length)) {
        if (field.summary || field.fullContext) {
          activeProjects.push({
            name: field.name || field.key.replace(/_/g, ' '),
            status: 'planned',
            priority: 'medium',
            description: field.summary || field.fullContext!.slice(0, 150),
          });
        }
      }
    }
  }

  // Calculate completeness
  const profileCompleteness = calculateCompleteness(profile);

  // Build synthesis
  const synthesis: BaseSynthesis = {
    identity,
    personas,
    goals,
    painPoints,
    decisionDynamics,
    strategicPriorities,
    activeProjects,
    _meta: {
      tokenCount: 0, // Will be calculated
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
