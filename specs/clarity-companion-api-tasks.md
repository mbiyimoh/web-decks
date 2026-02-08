# Task Breakdown: Clarity Companion API

**Generated:** February 7, 2026
**Source:** `specs/clarity-companion-api.md`

## Overview

The Clarity Companion API is a context delivery layer that provides synthesized user context (~800 tokens) to external products (Better Contacts, SP33D, Talking Docs) via OAuth-protected endpoints. It supports progressive disclosure through on-demand profile section fetching and semantic search.

## Clarifications from Validation

1. **OAuth Scopes:** Add new scopes `read:synthesis` and `search:profile` to `lib/oauth/scopes.ts`
2. **Persona Data Source:** Personas come from the `Persona` model (not ProfileField), synthesis must query both
3. **Token Counting:** Use word-based approximation (~0.75 tokens per word) initially; can add tiktoken later

---

## Phase 1: Foundation & Database

### Task 1.1: Add OAuth Scopes for Companion API

**Description:** Add new OAuth scopes to support Companion API endpoints
**Size:** Small
**Priority:** High
**Dependencies:** None (OAuth system already implemented)
**Can run parallel with:** Task 1.2

**Technical Requirements:**
- Add `read:synthesis` scope for base synthesis endpoint
- Add `search:profile` scope for semantic search endpoint
- Update DEFAULT_PORTAL_SCOPES if needed

**Implementation:**

Update `lib/oauth/scopes.ts`:

```typescript
export const OAUTH_SCOPES = {
  // Existing scopes
  'read:profile': 'Read your profile information',
  'write:profile': 'Update your profile information',
  'admin:credentials': 'Manage client credentials',

  // NEW: Companion API scopes
  'read:synthesis': 'Read synthesized profile context for AI products',
  'search:profile': 'Search profile content semantically',
} as const;
```

**Acceptance Criteria:**
- [ ] New scopes added to OAUTH_SCOPES constant
- [ ] Scope descriptions are clear and accurate
- [ ] No breaking changes to existing scopes

---

### Task 1.2: Add Prisma Models for Companion API

**Description:** Create CompanionSynthesis and CompanionAccessLog models in Prisma schema
**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1

**Technical Requirements:**
- Add CompanionSynthesis model with JSON baseSynthesis field
- Add CompanionAccessLog model for analytics
- Add companionSynthesis relation to User model
- Create and run migration

**Implementation:**

Add to `prisma/schema.prisma`:

```prisma
// ============================================================================
// CLARITY COMPANION API — Context Delivery for External Products
// ============================================================================

// Cached synthesis for cross-product use
model CompanionSynthesis {
  id            String   @id @default(cuid())
  userId        String   @unique

  // Base synthesis (structured JSON matching BaseSynthesis interface)
  baseSynthesis Json     // ~800 tokens of structured summary

  // Metadata
  profileHash   String   // Hash of source profile data for invalidation
  tokenCount    Int      // Actual token count
  version       String   // For cache invalidation (e.g., "v1.2.3")

  // Timestamps
  generatedAt   DateTime @default(now())
  expiresAt     DateTime // Synthesis TTL (24 hours default)

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("companion_syntheses")
}

// Track what products have fetched (for analytics)
model CompanionAccessLog {
  id          String   @id @default(cuid())
  userId      String
  productId   String   // OAuth client ID (e.g., "better-contacts")
  endpoint    String   // Which endpoint was called
  section     String?  // If section fetch, which section
  tokenCount  Int      // Tokens returned
  cacheHit    Boolean  // Was synthesis cached?
  latencyMs   Int      // Response time
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([productId, createdAt])
  @@map("companion_access_logs")
}
```

Update User model:

```prisma
model User {
  // ... existing fields ...

  // Add relation for Companion API
  companionSynthesis CompanionSynthesis?
}
```

**Commands to run:**
```bash
npx prisma migrate dev --name add-companion-api-models
npx prisma generate
```

**Acceptance Criteria:**
- [ ] CompanionSynthesis model created with all fields
- [ ] CompanionAccessLog model created with all fields
- [ ] User model has companionSynthesis relation
- [ ] Migration runs successfully
- [ ] Prisma client regenerated

---

### Task 1.3: Create Companion API Types

**Description:** Define TypeScript interfaces for Companion API
**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1, 1.2

**Technical Requirements:**
- BaseSynthesis interface matching spec
- API response types with token counts
- Section metadata types
- Search result types

**Implementation:**

Create `lib/companion/types.ts`:

```typescript
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

  // Metadata
  _meta: SynthesisMetadata;
}

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
```

**Acceptance Criteria:**
- [ ] All interfaces match spec requirements
- [ ] Types are exported correctly
- [ ] Documentation comments explain purpose
- [ ] PersonaSummary notes that data comes from Persona model

---

### Task 1.4: Implement Synthesis Generation Logic

**Description:** Create core synthesis generation from profile and persona data
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.2, Task 1.3
**Can run parallel with:** None (depends on types and schema)

**Technical Requirements:**
- Query both ProfileSection and Persona models
- Generate structured BaseSynthesis JSON
- Calculate token count (word-based approximation)
- Calculate profile completeness percentage
- Generate version string

**Implementation:**

Create `lib/companion/synthesis.ts`:

```typescript
/**
 * Synthesis Generation for Clarity Companion API
 *
 * Generates a structured ~800 token summary of user context
 * by combining ProfileSection data and Persona records.
 */

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import type {
  BaseSynthesis,
  PersonaSummary,
  GoalSummary,
  PainPointSummary,
  SynthesisMetadata,
} from './types';

// ============================================================================
// Token Counting (word-based approximation)
// ============================================================================

/**
 * Approximate token count using word-based heuristic.
 * Average English word is ~0.75 tokens (including punctuation/spacing).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount * 1.33); // ~1.33 tokens per word average
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

  // Get timestamps that would affect synthesis
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userId },
        { userRecordId: userId }
      ]
    },
    include: {
      sections: {
        select: { key: true, updatedAt: true }
      },
      personas: {
        select: { id: true, updatedAt: true }
      }
    }
  });

  if (!profile) {
    return crypto.createHash('sha256').update('empty').digest('hex');
  }

  const hashInput = {
    profileUpdatedAt: profile.updatedAt.toISOString(),
    sections: profile.sections.map(s => ({
      key: s.key,
      updatedAt: s.updatedAt?.toISOString()
    })),
    personas: profile.personas.map(p => ({
      id: p.id,
      updatedAt: p.updatedAt.toISOString()
    }))
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
export async function generateBaseSynthesis(userId: string): Promise<BaseSynthesis | null> {
  // Fetch profile with all nested data
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userId },
        { userRecordId: userId }
      ]
    },
    include: {
      sections: {
        include: {
          subsections: {
            include: {
              fields: true
            }
          }
        }
      },
      personas: true
    }
  });

  if (!profile) {
    return null;
  }

  // Helper to get field value from profile
  const getField = (sectionKey: string, subsectionKey: string, fieldKey: string): string | null => {
    const section = profile.sections.find(s => s.key === sectionKey);
    if (!section) return null;
    const subsection = section.subsections.find(sub => sub.key === subsectionKey);
    if (!subsection) return null;
    const field = subsection.fields.find(f => f.key === fieldKey);
    return field?.summary || field?.fullContext || null;
  };

  // Build identity from individual and organization sections
  const identity = {
    name: profile.name || 'Unknown',
    role: getField('role', 'responsibilities', 'title') || 'Unknown',
    company: getField('organization', 'fundamentals', 'company_name') || 'Unknown',
    industry: getField('organization', 'fundamentals', 'org_industry') || 'Unknown',
    companyStage: parseCompanyStage(getField('organization', 'fundamentals', 'stage')),
  };

  // Build personas from Persona model (NOT ProfileField!)
  const personas: PersonaSummary[] = profile.personas
    .filter(p => p.name) // Only include named personas
    .slice(0, 3) // Max 3 personas
    .map(p => {
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
  const goalsSection = profile.sections.find(s => s.key === 'goals');
  if (goalsSection) {
    const immediateFields = goalsSection.subsections
      .find(sub => sub.key === 'immediate')?.fields || [];

    for (const field of immediateFields.slice(0, 3)) {
      if (field.summary || field.fullContext) {
        goals.push({
          goal: field.summary || field.fullContext!.slice(0, 100),
          priority: 'high',
          timeframe: 'immediate',
        });
      }
    }

    const mediumFields = goalsSection.subsections
      .find(sub => sub.key === 'medium')?.fields || [];

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
  const roleSection = profile.sections.find(s => s.key === 'role');
  if (roleSection) {
    const constraintFields = roleSection.subsections
      .find(sub => sub.key === 'constraints')?.fields || [];

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
  const individualSection = profile.sections.find(s => s.key === 'individual');
  const thinkingSubsection = individualSection?.subsections.find(sub => sub.key === 'thinking');

  const decisionDynamics = {
    decisionMakers: [identity.name],
    buyingProcess: getField('individual', 'thinking', 'decision_making') || 'Not specified',
    keyInfluencers: extractInfluencers(profile),
  };

  // Build strategic priorities from goals strategy
  const strategicPriorities: string[] = [];
  const strategyFields = goalsSection?.subsections
    .find(sub => sub.key === 'strategy')?.fields || [];

  for (const field of strategyFields.slice(0, 5)) {
    if (field.summary) {
      strategicPriorities.push(field.summary);
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

function parseCompanyStage(stage: string | null): 'startup' | 'growth' | 'enterprise' | 'unknown' {
  if (!stage) return 'unknown';
  const lower = stage.toLowerCase();
  if (lower.includes('startup') || lower.includes('seed') || lower.includes('early')) {
    return 'startup';
  }
  if (lower.includes('growth') || lower.includes('series')) {
    return 'growth';
  }
  if (lower.includes('enterprise') || lower.includes('public') || lower.includes('large')) {
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
      fields: Array<{ key: string; summary: string | null; fullContext: string | null }>;
    }>;
  }>;
}): string[] {
  const networkSection = profile.sections.find(s => s.key === 'network');
  if (!networkSection) return [];

  const influencers: string[] = [];

  const stakeholders = networkSection.subsections.find(sub => sub.key === 'stakeholders');
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
  const personaBonus = profile.personas.filter(p => p.name).length > 0 ? 10 : 0;

  if (totalFields === 0) return personaBonus;

  const fieldPercentage = Math.round((filledFields / totalFields) * 90);
  return Math.min(100, fieldPercentage + personaBonus);
}
```

**Acceptance Criteria:**
- [ ] Synthesis generates from both ProfileSection and Persona data
- [ ] Token count is calculated and included in _meta
- [ ] Profile completeness is calculated correctly
- [ ] Version string is generated
- [ ] Returns null for non-existent users
- [ ] Identity, personas, goals, painPoints all populated

---

### Task 1.5: Implement Caching Logic

**Description:** Create synthesis caching with hash-based invalidation
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.2, Task 1.3, Task 1.4

**Technical Requirements:**
- Cache synthesis in CompanionSynthesis table
- Invalidate when profile hash changes
- TTL of 24 hours
- Return cached version when valid

**Implementation:**

Create `lib/companion/cache.ts`:

```typescript
/**
 * Synthesis Caching for Clarity Companion API
 *
 * Handles caching of generated synthesis with:
 * - Hash-based invalidation when profile changes
 * - 24-hour TTL expiration
 * - Version tracking for ETag support
 */

import { prisma } from '@/lib/prisma';
import {
  generateBaseSynthesis,
  calculateProfileHash,
  generateVersion
} from './synthesis';
import type { BaseSynthesis } from './types';

const SYNTHESIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedSynthesis {
  synthesis: BaseSynthesis;
  version: string;
  cacheHit: boolean;
  stale: boolean;
}

/**
 * Get synthesis for a user, using cache if valid.
 * Regenerates if cache is stale or profile has changed.
 */
export async function getCachedSynthesis(userId: string): Promise<CachedSynthesis | null> {
  // Check for existing cached synthesis
  const cached = await prisma.companionSynthesis.findUnique({
    where: { userId },
  });

  // Calculate current profile hash
  const currentHash = await calculateProfileHash(userId);

  // Determine if cache is valid
  const now = new Date();
  const isExpired = cached ? cached.expiresAt < now : true;
  const hashMismatch = cached ? cached.profileHash !== currentHash : true;
  const needsRegeneration = !cached || isExpired || hashMismatch;

  if (!needsRegeneration && cached) {
    // Return cached synthesis
    return {
      synthesis: cached.baseSynthesis as BaseSynthesis,
      version: cached.version,
      cacheHit: true,
      stale: false,
    };
  }

  // Generate new synthesis
  const synthesis = await generateBaseSynthesis(userId);
  if (!synthesis) {
    return null;
  }

  // Calculate expiration
  const expiresAt = new Date(now.getTime() + SYNTHESIS_TTL_MS);

  // Upsert cache
  const version = synthesis._meta.version;
  await prisma.companionSynthesis.upsert({
    where: { userId },
    create: {
      userId,
      baseSynthesis: synthesis as unknown as Record<string, unknown>,
      profileHash: currentHash,
      tokenCount: synthesis._meta.tokenCount,
      version,
      expiresAt,
    },
    update: {
      baseSynthesis: synthesis as unknown as Record<string, unknown>,
      profileHash: currentHash,
      tokenCount: synthesis._meta.tokenCount,
      version,
      generatedAt: now,
      expiresAt,
    },
  });

  return {
    synthesis,
    version,
    cacheHit: false,
    stale: false,
  };
}

/**
 * Check if a cached version is stale.
 */
export async function isSynthesisStale(
  userId: string,
  cachedVersion: string
): Promise<{ stale: boolean; currentVersion: string }> {
  const cached = await prisma.companionSynthesis.findUnique({
    where: { userId },
    select: { version: true, expiresAt: true, profileHash: true },
  });

  if (!cached) {
    return { stale: true, currentVersion: '' };
  }

  const currentHash = await calculateProfileHash(userId);
  const isExpired = cached.expiresAt < new Date();
  const hashMismatch = cached.profileHash !== currentHash;

  return {
    stale: cachedVersion !== cached.version || isExpired || hashMismatch,
    currentVersion: cached.version,
  };
}

/**
 * Invalidate cached synthesis for a user.
 * Call this when profile is updated.
 */
export async function invalidateSynthesis(userId: string): Promise<void> {
  await prisma.companionSynthesis.deleteMany({
    where: { userId },
  });
}

/**
 * Get section version for ETag support.
 * Sections use their updatedAt timestamp as version.
 */
export async function getSectionVersion(
  userId: string,
  sectionKey: string
): Promise<string | null> {
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userId },
        { userRecordId: userId }
      ]
    },
    include: {
      sections: {
        where: { key: sectionKey },
        select: { updatedAt: true }
      }
    }
  });

  if (!profile || profile.sections.length === 0) {
    return null;
  }

  const updatedAt = profile.sections[0].updatedAt;
  return `${sectionKey}-${updatedAt?.getTime().toString(36) || 'v0'}`;
}
```

**Acceptance Criteria:**
- [ ] Synthesis cached in database
- [ ] Cache hit returns stored synthesis
- [ ] Cache miss generates new synthesis
- [ ] Profile hash change triggers regeneration
- [ ] TTL expiry triggers regeneration
- [ ] Version tracking works for ETag support

---

### Task 1.6: Create Companion API Middleware

**Description:** OAuth token validation middleware for Companion API endpoints
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1 (scopes)

**Technical Requirements:**
- Validate Bearer tokens
- Check required scopes per endpoint
- Extract user ID from token
- Return standardized errors

**Implementation:**

Create `lib/companion/middleware.ts`:

```typescript
/**
 * Companion API Middleware
 *
 * OAuth token validation and scope checking for Companion API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAccessToken, type AccessTokenPayload } from '@/lib/oauth/tokens';

// Scope requirements per endpoint pattern
const ENDPOINT_SCOPES: Record<string, string[]> = {
  '/api/companion/synthesis/base': ['read:synthesis', 'read:profile'],
  '/api/companion/profile/index': ['read:profile'],
  '/api/companion/profile/section': ['read:profile'],
  '/api/companion/profile/search': ['read:profile', 'search:profile'],
  '/api/companion/cache/validate': ['read:profile'],
};

export interface CompanionAuthResult {
  success: true;
  userId: string;
  clientId: string;
  scopes: string[];
}

export interface CompanionAuthError {
  success: false;
  error: string;
  status: number;
}

export type CompanionAuth = CompanionAuthResult | CompanionAuthError;

/**
 * Validate OAuth token and check scopes for Companion API.
 */
export async function validateCompanionAuth(
  request: NextRequest,
  endpoint: string
): Promise<CompanionAuth> {
  // Extract Bearer token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header',
      status: 401,
    };
  }

  const token = authHeader.slice(7);

  // Validate token
  let payload: AccessTokenPayload | null;
  try {
    payload = await validateAccessToken(token);
  } catch {
    return {
      success: false,
      error: 'Token validation failed',
      status: 401,
    };
  }

  if (!payload) {
    return {
      success: false,
      error: 'Invalid or expired token',
      status: 401,
    };
  }

  // Check scopes
  const requiredScopes = getRequiredScopes(endpoint);
  const tokenScopes = payload.scope.split(' ');

  const hasRequiredScope = requiredScopes.some(scope =>
    tokenScopes.includes(scope)
  );

  if (!hasRequiredScope) {
    return {
      success: false,
      error: `Insufficient scope. Required: ${requiredScopes.join(' or ')}`,
      status: 403,
    };
  }

  return {
    success: true,
    userId: payload.sub,
    clientId: payload.client_id,
    scopes: tokenScopes,
  };
}

/**
 * Get required scopes for an endpoint.
 */
function getRequiredScopes(endpoint: string): string[] {
  // Try exact match first
  if (ENDPOINT_SCOPES[endpoint]) {
    return ENDPOINT_SCOPES[endpoint];
  }

  // Try prefix match for dynamic routes
  for (const [pattern, scopes] of Object.entries(ENDPOINT_SCOPES)) {
    if (endpoint.startsWith(pattern)) {
      return scopes;
    }
  }

  // Default to read:profile
  return ['read:profile'];
}

/**
 * Create error response for failed auth.
 */
export function createAuthErrorResponse(auth: CompanionAuthError): NextResponse {
  return NextResponse.json(
    { error: auth.error },
    { status: auth.status }
  );
}

/**
 * Higher-order function to wrap API route with auth validation.
 */
export function withCompanionAuth(
  endpoint: string,
  handler: (
    request: NextRequest,
    auth: CompanionAuthResult
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await validateCompanionAuth(request, endpoint);

    if (!auth.success) {
      return createAuthErrorResponse(auth);
    }

    return handler(request, auth);
  };
}
```

**Acceptance Criteria:**
- [ ] Bearer token extraction works
- [ ] Token validation calls OAuth library
- [ ] Scope checking per endpoint works
- [ ] Returns 401 for missing/invalid tokens
- [ ] Returns 403 for insufficient scopes
- [ ] User ID extracted from token

---

## Phase 2: API Endpoints

### Task 2.1: Implement Base Synthesis Endpoint

**Description:** Create GET /api/companion/synthesis/base endpoint
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.4, Task 1.5, Task 1.6

**Technical Requirements:**
- Return cached synthesis
- Support ETag with If-None-Match
- Include token count and cache hints
- Log access for analytics

**Implementation:**

Create `app/api/companion/synthesis/base/route.ts`:

```typescript
/**
 * GET /api/companion/synthesis/base
 *
 * Returns the cached base synthesis (~800 tokens) for the authenticated user.
 * Supports ETag-based caching via If-None-Match header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCompanionAuth, createAuthErrorResponse } from '@/lib/companion/middleware';
import { getCachedSynthesis } from '@/lib/companion/cache';
import { logAccess } from '@/lib/companion/logging';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/companion/synthesis/base';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Check If-None-Match header for caching
  const ifNoneMatch = request.headers.get('if-none-match');

  // Get cached synthesis
  const result = await getCachedSynthesis(auth.userId);

  if (!result) {
    return NextResponse.json(
      { error: 'No profile found for user' },
      { status: 404 }
    );
  }

  const latencyMs = Date.now() - startTime;

  // Handle ETag match (304 Not Modified)
  if (ifNoneMatch === `"${result.version}"`) {
    // Log access even for 304
    await logAccess({
      userId: auth.userId,
      productId: auth.clientId,
      endpoint,
      tokenCount: 0,
      cacheHit: true,
      latencyMs,
    });

    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': `"${result.version}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  // Log access
  await logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    tokenCount: result.synthesis._meta.tokenCount,
    cacheHit: result.cacheHit,
    latencyMs,
  });

  // Return synthesis with caching headers
  return NextResponse.json(
    {
      synthesis: result.synthesis,
      cacheHint: 'stable' as const,
      stale: result.stale,
    },
    {
      headers: {
        'ETag': `"${result.version}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    }
  );
}
```

**Acceptance Criteria:**
- [ ] Returns synthesis with correct structure
- [ ] ETag header set correctly
- [ ] 304 returned when If-None-Match matches
- [ ] Token count included in response
- [ ] Access logged to database
- [ ] Returns 404 for non-existent profiles

---

### Task 2.2: Implement Profile Index Endpoint

**Description:** Create GET /api/companion/profile/index endpoint
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.6

**Implementation:**

Create `app/api/companion/profile/index/route.ts`:

```typescript
/**
 * GET /api/companion/profile/index
 *
 * Returns lightweight metadata about all profile sections (~200 tokens).
 * Includes section titles, token counts, and last updated dates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCompanionAuth, createAuthErrorResponse } from '@/lib/companion/middleware';
import { logAccess } from '@/lib/companion/logging';
import { estimateTokens, generateVersion } from '@/lib/companion/synthesis';
import type { SectionMetadata, ProfileIndexResponse } from '@/lib/companion/types';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/companion/profile/index';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Fetch profile with sections
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userId: auth.userId },
        { userRecordId: auth.userId }
      ]
    },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: true
            }
          }
        }
      }
    }
  });

  if (!profile) {
    return NextResponse.json(
      { error: 'No profile found for user' },
      { status: 404 }
    );
  }

  // Build section metadata
  const sections: SectionMetadata[] = profile.sections.map(section => {
    // Calculate token count for section
    let sectionText = section.name + ' ';
    let filledFields = 0;
    let totalFields = 0;

    for (const subsection of section.subsections) {
      sectionText += subsection.name + ' ';
      for (const field of subsection.fields) {
        totalFields++;
        if (field.summary || field.fullContext) {
          filledFields++;
          sectionText += (field.summary || '') + ' ';
          sectionText += (field.fullContext || '') + ' ';
        }
      }
    }

    const tokenCount = estimateTokens(sectionText);
    const completeness = totalFields > 0
      ? Math.round((filledFields / totalFields) * 100)
      : 0;

    // Find most recent update
    let lastUpdated = section.updatedAt || profile.updatedAt;
    for (const subsection of section.subsections) {
      for (const field of subsection.fields) {
        if (field.lastUpdated && field.lastUpdated > lastUpdated) {
          lastUpdated = field.lastUpdated;
        }
      }
    }

    return {
      id: section.key,
      title: section.name,
      subsections: section.subsections.map(sub => sub.key),
      tokenCount,
      lastUpdated: lastUpdated.toISOString(),
      cacheHint: completeness > 80 ? 'stable' : 'volatile',
      completeness,
    };
  });

  // Calculate total tokens
  const totalTokens = sections.reduce((sum, s) => sum + s.tokenCount, 0);

  const response: ProfileIndexResponse = {
    sections,
    totalTokens,
    version: generateVersion(),
  };

  const latencyMs = Date.now() - startTime;
  const responseTokens = estimateTokens(JSON.stringify(response));

  // Log access
  await logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    tokenCount: responseTokens,
    cacheHit: false,
    latencyMs,
  });

  return NextResponse.json(response);
}
```

**Acceptance Criteria:**
- [ ] Returns all sections with metadata
- [ ] Token counts calculated per section
- [ ] Completeness percentage accurate
- [ ] Last updated dates correct
- [ ] Cache hints based on completeness

---

### Task 2.3: Implement Section Detail Endpoint

**Description:** Create GET /api/companion/profile/section/[sectionId] endpoint
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.6

**Implementation:**

Create `app/api/companion/profile/section/[sectionId]/route.ts`:

```typescript
/**
 * GET /api/companion/profile/section/[sectionId]
 *
 * Returns a specific profile section in full detail.
 * Supports ETag caching via If-None-Match header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCompanionAuth, createAuthErrorResponse } from '@/lib/companion/middleware';
import { logAccess } from '@/lib/companion/logging';
import { getSectionVersion } from '@/lib/companion/cache';
import { estimateTokens } from '@/lib/companion/synthesis';
import type { SectionResponse, SectionDetail, SubsectionDetail, FieldDetail } from '@/lib/companion/types';

interface RouteParams {
  params: Promise<{ sectionId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const { sectionId } = await params;
  const endpoint = `/api/companion/profile/section/${sectionId}`;

  // Validate auth
  const auth = await validateCompanionAuth(request, '/api/companion/profile/section');
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Check If-None-Match header
  const ifNoneMatch = request.headers.get('if-none-match');
  const currentVersion = await getSectionVersion(auth.userId, sectionId);

  if (currentVersion && ifNoneMatch === `"${currentVersion}"`) {
    await logAccess({
      userId: auth.userId,
      productId: auth.clientId,
      endpoint,
      section: sectionId,
      tokenCount: 0,
      cacheHit: true,
      latencyMs: Date.now() - startTime,
    });

    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': `"${currentVersion}"`,
        'Cache-Control': 'private, max-age=1800',
      },
    });
  }

  // Fetch profile with specific section
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userId: auth.userId },
        { userRecordId: auth.userId }
      ]
    },
    include: {
      sections: {
        where: { key: sectionId },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: true
            }
          }
        }
      }
    }
  });

  if (!profile || profile.sections.length === 0) {
    return NextResponse.json(
      { error: `Section '${sectionId}' not found` },
      { status: 404 }
    );
  }

  const dbSection = profile.sections[0];

  // Build section detail
  const subsections: SubsectionDetail[] = dbSection.subsections.map(sub => ({
    id: sub.key,
    title: sub.name,
    fields: sub.fields.map(field => ({
      key: field.key,
      summary: field.summary,
      fullContext: field.fullContext,
      confidence: field.confidence,
      lastUpdated: field.lastUpdated.toISOString(),
    } as FieldDetail)),
  }));

  const section: SectionDetail = {
    id: dbSection.key,
    title: dbSection.name,
    subsections,
  };

  // Calculate token count
  const tokenCount = estimateTokens(JSON.stringify(section));

  // Determine cache hint based on completeness
  const filledFields = subsections.reduce((sum, sub) =>
    sum + sub.fields.filter(f => f.summary || f.fullContext).length, 0
  );
  const totalFields = subsections.reduce((sum, sub) => sum + sub.fields.length, 0);
  const completeness = totalFields > 0 ? (filledFields / totalFields) : 0;

  const response: SectionResponse = {
    section,
    tokenCount,
    version: currentVersion || `${sectionId}-v0`,
    cacheHint: completeness > 0.8 ? 'stable' : 'volatile',
  };

  const latencyMs = Date.now() - startTime;

  // Log access
  await logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    section: sectionId,
    tokenCount,
    cacheHit: false,
    latencyMs,
  });

  return NextResponse.json(response, {
    headers: {
      'ETag': `"${response.version}"`,
      'Cache-Control': 'private, max-age=1800',
    },
  });
}
```

**Acceptance Criteria:**
- [ ] Returns full section detail
- [ ] All fields included with summary and fullContext
- [ ] ETag caching works
- [ ] 404 for non-existent sections
- [ ] Token count accurate

---

### Task 2.4: Implement Profile Search Endpoint

**Description:** Create POST /api/companion/profile/search endpoint with text-based search
**Size:** Medium
**Priority:** Medium
**Dependencies:** Task 1.6

**Note:** V1 uses text-based search. Semantic search with embeddings is a future enhancement.

**Implementation:**

Create `app/api/companion/profile/search/route.ts`:

```typescript
/**
 * POST /api/companion/profile/search
 *
 * Search across the user's profile using text matching.
 * V1: Simple text-based search with relevance scoring.
 * V2 (future): Semantic search with embeddings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCompanionAuth, createAuthErrorResponse } from '@/lib/companion/middleware';
import { logAccess } from '@/lib/companion/logging';
import { estimateTokens } from '@/lib/companion/synthesis';
import type { SearchRequest, SearchResponse, SearchResult } from '@/lib/companion/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/companion/profile/search';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Parse request body
  let body: SearchRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { query, maxResults = 5, sections: sectionFilter } = body;

  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { error: 'Query is required' },
      { status: 400 }
    );
  }

  // Fetch profile
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userId: auth.userId },
        { userRecordId: auth.userId }
      ]
    },
    include: {
      sections: {
        include: {
          subsections: {
            include: {
              fields: true
            }
          }
        }
      }
    }
  });

  if (!profile) {
    return NextResponse.json(
      { error: 'No profile found' },
      { status: 404 }
    );
  }

  // Perform text-based search
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  for (const section of profile.sections) {
    // Apply section filter if provided
    if (sectionFilter && sectionFilter.length > 0) {
      if (!sectionFilter.includes(section.key)) {
        continue;
      }
    }

    for (const subsection of section.subsections) {
      for (const field of subsection.fields) {
        const content = [
          field.key,
          field.name,
          field.summary || '',
          field.fullContext || '',
        ].join(' ').toLowerCase();

        // Calculate relevance score based on term matches
        let matchedTerms = 0;
        for (const term of queryTerms) {
          if (content.includes(term)) {
            matchedTerms++;
          }
        }

        if (matchedTerms > 0) {
          const relevance = matchedTerms / queryTerms.length;

          // Create snippet from matching content
          const snippet = field.fullContext || field.summary || field.name;
          const tokenCount = estimateTokens(snippet);

          results.push({
            section: section.key,
            subsection: subsection.key,
            field: field.key,
            snippet: snippet.slice(0, 300), // Limit snippet length
            relevance: Math.round(relevance * 100) / 100,
            tokenCount,
          });
        }
      }
    }
  }

  // Sort by relevance and limit results
  results.sort((a, b) => b.relevance - a.relevance);
  const limitedResults = results.slice(0, maxResults);

  const totalTokens = limitedResults.reduce((sum, r) => sum + r.tokenCount, 0);

  const response: SearchResponse = {
    results: limitedResults,
    totalTokens,
    query,
  };

  const latencyMs = Date.now() - startTime;

  // Log access
  await logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    tokenCount: totalTokens,
    cacheHit: false,
    latencyMs,
  });

  return NextResponse.json(response);
}
```

**Acceptance Criteria:**
- [ ] Text-based search works
- [ ] Results sorted by relevance
- [ ] Section filtering works
- [ ] Max results honored
- [ ] Token counts included

---

### Task 2.5: Implement Cache Validation Endpoint

**Description:** Create POST /api/companion/cache/validate endpoint
**Size:** Small
**Priority:** Medium
**Dependencies:** Task 1.5, Task 1.6

**Implementation:**

Create `app/api/companion/cache/validate/route.ts`:

```typescript
/**
 * POST /api/companion/cache/validate
 *
 * Check if cached synthesis and sections are still valid.
 * Returns staleness status for each cached version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCompanionAuth, createAuthErrorResponse } from '@/lib/companion/middleware';
import { isSynthesisStale, getSectionVersion } from '@/lib/companion/cache';
import type { CacheValidateRequest, CacheValidateResponse } from '@/lib/companion/types';

export async function POST(request: NextRequest) {
  const endpoint = '/api/companion/cache/validate';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Parse request body
  let body: CacheValidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { cachedVersion, sections = {} } = body;

  // Check synthesis staleness
  const { stale: synthesisStale, currentVersion: currentSynthesisVersion } =
    await isSynthesisStale(auth.userId, cachedVersion);

  // Check section staleness
  const sectionsStale: Record<string, boolean> = {};
  const currentVersions: Record<string, string> = {
    synthesis: currentSynthesisVersion,
  };

  for (const [sectionId, cachedSectionVersion] of Object.entries(sections)) {
    const currentSectionVersion = await getSectionVersion(auth.userId, sectionId);

    if (currentSectionVersion) {
      sectionsStale[sectionId] = cachedSectionVersion !== currentSectionVersion;
      currentVersions[sectionId] = currentSectionVersion;
    } else {
      sectionsStale[sectionId] = true;
      currentVersions[sectionId] = '';
    }
  }

  const response: CacheValidateResponse = {
    synthesisStale,
    sectionsStale,
    currentVersions,
  };

  return NextResponse.json(response);
}
```

**Acceptance Criteria:**
- [ ] Synthesis staleness detected correctly
- [ ] Section staleness per section
- [ ] Current versions returned
- [ ] Handles missing sections gracefully

---

### Task 2.6: Implement Access Logging

**Description:** Create access logging utility for analytics
**Size:** Small
**Priority:** Medium
**Dependencies:** Task 1.2

**Implementation:**

Create `lib/companion/logging.ts`:

```typescript
/**
 * Access Logging for Clarity Companion API
 *
 * Logs all API access for analytics, audit, and optimization.
 */

import { prisma } from '@/lib/prisma';

export interface AccessLogEntry {
  userId: string;
  productId: string;
  endpoint: string;
  section?: string;
  tokenCount: number;
  cacheHit: boolean;
  latencyMs: number;
}

/**
 * Log an API access event.
 * Fire-and-forget - doesn't block the response.
 */
export async function logAccess(entry: AccessLogEntry): Promise<void> {
  try {
    await prisma.companionAccessLog.create({
      data: {
        userId: entry.userId,
        productId: entry.productId,
        endpoint: entry.endpoint,
        section: entry.section,
        tokenCount: entry.tokenCount,
        cacheHit: entry.cacheHit,
        latencyMs: entry.latencyMs,
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('[Companion] Failed to log access:', error);
  }
}

/**
 * Get access statistics for a product.
 */
export async function getProductStats(
  productId: string,
  since: Date
): Promise<{
  totalRequests: number;
  totalTokens: number;
  cacheHitRate: number;
  avgLatencyMs: number;
}> {
  const logs = await prisma.companionAccessLog.findMany({
    where: {
      productId,
      createdAt: { gte: since },
    },
    select: {
      tokenCount: true,
      cacheHit: true,
      latencyMs: true,
    },
  });

  if (logs.length === 0) {
    return {
      totalRequests: 0,
      totalTokens: 0,
      cacheHitRate: 0,
      avgLatencyMs: 0,
    };
  }

  const totalTokens = logs.reduce((sum, log) => sum + log.tokenCount, 0);
  const cacheHits = logs.filter(log => log.cacheHit).length;
  const totalLatency = logs.reduce((sum, log) => sum + log.latencyMs, 0);

  return {
    totalRequests: logs.length,
    totalTokens,
    cacheHitRate: Math.round((cacheHits / logs.length) * 100) / 100,
    avgLatencyMs: Math.round(totalLatency / logs.length),
  };
}
```

**Acceptance Criteria:**
- [ ] Access logged to database
- [ ] Logging is fire-and-forget
- [ ] Stats calculation works
- [ ] Doesn't fail main request on error

---

## Phase 3: Tool Integration

### Task 3.1: Create AI Tool Definitions

**Description:** Create tool definitions for AI products to fetch context
**Size:** Medium
**Priority:** High
**Dependencies:** Phase 2 complete

**Implementation:**

Create `lib/companion/tools.ts`:

```typescript
/**
 * Clarity Canvas Tools for AI Products
 *
 * Tool definitions that products can expose to their AI assistants
 * for fetching user context from Clarity Canvas.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      enum?: string[];
      description: string;
    }>;
    required: string[];
  };
}

/**
 * Standard tool definitions for Clarity Canvas integration.
 * Products should include these in their AI tool configuration.
 */
export const CLARITY_CANVAS_TOOLS: ToolDefinition[] = [
  {
    name: 'get_profile_index',
    description: 'Get an overview of the user\'s Clarity Canvas profile sections with token counts and last updated dates. Use this to understand what information is available before fetching specific sections.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_profile_section',
    description: 'Retrieve a specific section of the user\'s Clarity Canvas profile in full detail. Use this when you need more information about a particular topic (goals, personas, pain points, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['individual', 'role', 'organization', 'goals', 'network', 'projects'],
          description: 'Which profile section to retrieve'
        }
      },
      required: ['section']
    }
  },
  {
    name: 'search_profile',
    description: 'Search the user\'s Clarity Canvas profile using natural language. Use this when looking for specific information that might be spread across multiple sections.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum results to return (default: 5)'
        }
      },
      required: ['query']
    }
  }
];

/**
 * Get tools formatted for Claude API.
 */
export function getToolsForClaude(): ToolDefinition[] {
  return CLARITY_CANVAS_TOOLS;
}

/**
 * Get tools formatted for OpenAI API (function calling).
 */
export function getToolsForOpenAI() {
  return CLARITY_CANVAS_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}
```

**Acceptance Criteria:**
- [ ] All three tools defined
- [ ] Correct input schemas
- [ ] Descriptions are clear and helpful
- [ ] Format helpers for Claude and OpenAI

---

### Task 3.2: Create System Prompt Template

**Description:** Create reusable system prompt template for AI products
**Size:** Small
**Priority:** Medium
**Dependencies:** Task 3.1

**Implementation:**

Create `lib/companion/prompts.ts`:

```typescript
/**
 * System Prompt Templates for AI Products
 *
 * Generates system prompts that include user context from Clarity Canvas
 * and instructions for using context-fetching tools.
 */

import type { BaseSynthesis } from './types';

/**
 * Generate a system prompt that includes Clarity Canvas context.
 */
export function getProductSystemPrompt(
  productName: string,
  baseSynthesis: BaseSynthesis
): string {
  return `You are ${productName}, an AI assistant that helps users with their work.

## User Context (from Clarity Canvas)

${JSON.stringify(baseSynthesis, null, 2)}

## Accessing More Context

You have access to the user's full Clarity Canvas profile via tools:
- Use \`get_profile_index\` to see what sections are available
- Use \`get_profile_section\` to fetch specific sections when needed
- Use \`search_profile\` to find information by topic

### WHEN TO FETCH MORE CONTEXT:
- If the user asks about something not covered in the context above
- If you're making assumptions that could be verified from their profile
- If you need specific details (names, numbers, dates) not in the summary
- When the user explicitly asks you to "look in my canvas" or similar

Fetch additional context BEFORE responding when you identify a gap.

## Guidelines

1. Use the context above to personalize your responses
2. Reference their goals, personas, and priorities when relevant
3. If you need more detail, use the tools to fetch it
4. Don't make assumptions - verify from their profile when uncertain

## Product-Specific Instructions

[Product-specific instructions here]
`;
}

/**
 * Generate a minimal prompt for token-constrained scenarios.
 */
export function getMinimalPrompt(
  productName: string,
  synthesis: BaseSynthesis
): string {
  const { identity, goals, strategicPriorities } = synthesis;

  return `You are ${productName} helping ${identity.name}, ${identity.role} at ${identity.company} (${identity.industry}, ${identity.companyStage}).

Top priorities: ${strategicPriorities.slice(0, 3).join(', ')}
Current goals: ${goals.slice(0, 2).map(g => g.goal).join('; ')}

Use tools to fetch more context when needed.`;
}
```

**Acceptance Criteria:**
- [ ] Full prompt template includes all context
- [ ] Minimal prompt for token-constrained use
- [ ] Instructions for tool usage clear
- [ ] JSON formatted correctly

---

### Task 3.3: Create Integration Guide Documentation

**Description:** Write developer guide for integrating Companion API
**Size:** Medium
**Priority:** Medium
**Dependencies:** Phase 2, Task 3.1, Task 3.2

**Implementation:**

Create `docs/developer-guides/companion-api-integration.md`:

```markdown
# Clarity Companion API Integration Guide

This guide explains how to integrate the Clarity Companion API into your AI product.

## Overview

The Companion API provides synthesized user context from Clarity Canvas to power personalized AI experiences. It follows a progressive disclosure model:

1. **Base Synthesis** (~800 tokens) - Start with this in every conversation
2. **On-Demand Sections** - Fetch more detail via AI tools when needed
3. **Search** - Find specific information across the profile

## Authentication

The Companion API uses OAuth 2.0 with Bearer tokens.

### Required Scopes

- `read:synthesis` - Required for base synthesis endpoint
- `read:profile` - Required for profile section endpoints
- `search:profile` - Required for search endpoint

### Getting a Token

```typescript
// Exchange authorization code for tokens
const response = await fetch('https://33strategies.ai/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    redirect_uri: 'your-redirect-uri',
  }),
});

const { access_token, refresh_token } = await response.json();
```

## Endpoints

### GET /api/companion/synthesis/base

Returns the base synthesis (~800 tokens).

```typescript
const response = await fetch('https://33strategies.ai/api/companion/synthesis/base', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'If-None-Match': cachedVersion, // Optional: for caching
  },
});

if (response.status === 304) {
  // Use cached version
}

const { synthesis, cacheHint, stale } = await response.json();
```

### GET /api/companion/profile/index

Returns section metadata for routing decisions.

```typescript
const response = await fetch('https://33strategies.ai/api/companion/profile/index', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});

const { sections, totalTokens, version } = await response.json();
```

### GET /api/companion/profile/section/:sectionId

Returns a specific section in full detail.

```typescript
const response = await fetch(
  `https://33strategies.ai/api/companion/profile/section/goals`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
);

const { section, tokenCount, version, cacheHint } = await response.json();
```

### POST /api/companion/profile/search

Searches across the profile.

```typescript
const response = await fetch('https://33strategies.ai/api/companion/profile/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'customer pain points',
    maxResults: 5,
    sections: ['personas', 'goals'], // Optional filter
  }),
});

const { results, totalTokens, query } = await response.json();
```

## Tool Integration

### Adding Tools to Your AI

```typescript
import { getToolsForClaude } from '@/lib/companion/tools';

const tools = getToolsForClaude();

// Use with Claude API
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  tools,
  // ... rest of config
});
```

### Handling Tool Calls

```typescript
async function handleToolCall(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'get_profile_index':
      return fetch('/api/companion/profile/index', { /* ... */ });

    case 'get_profile_section':
      return fetch(`/api/companion/profile/section/${input.section}`, { /* ... */ });

    case 'search_profile':
      return fetch('/api/companion/profile/search', {
        method: 'POST',
        body: JSON.stringify(input),
        // ...
      });
  }
}
```

## System Prompt Setup

```typescript
import { getProductSystemPrompt } from '@/lib/companion/prompts';

// Fetch base synthesis on app start
const { synthesis } = await fetchBaseSynthesis(accessToken);

// Generate system prompt
const systemPrompt = getProductSystemPrompt('Better Contacts', synthesis);

// Use in AI conversation
const response = await anthropic.messages.create({
  system: systemPrompt,
  // ...
});
```

## Token Budget Management

```typescript
import { DEFAULT_TOKEN_BUDGET, type TokenUsage } from '@/lib/companion/types';

// Track usage throughout conversation
const usage: TokenUsage = {
  systemPrompt: 500,
  baseSynthesis: synthesis._meta.tokenCount,
  fetchedSections: [],
  conversationHistory: 0,
  total: 0,
  remaining: DEFAULT_TOKEN_BUDGET.dynamicContext,
};

// Update after fetching sections
function trackSectionFetch(section: string, tokens: number) {
  usage.fetchedSections.push({ section, tokens });
  usage.total += tokens;
  usage.remaining -= tokens;
}
```

## Best Practices

1. **Always start with base synthesis** - It's cached and provides good initial context
2. **Fetch sections lazily** - Only when the AI needs more detail
3. **Use search for specific queries** - More efficient than fetching all sections
4. **Cache aggressively** - Use ETags and respect cache hints
5. **Track token usage** - Stay within budget for optimal AI performance

## Error Handling

```typescript
try {
  const response = await fetch('/api/companion/synthesis/base', { /* ... */ });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired - refresh and retry
    } else if (response.status === 403) {
      // Insufficient scope
    } else if (response.status === 404) {
      // User has no profile
    }
  }
} catch (error) {
  // Network error
}
```
```

**Acceptance Criteria:**
- [ ] All endpoints documented
- [ ] Code examples for each endpoint
- [ ] Tool integration explained
- [ ] Token budget guidance included
- [ ] Error handling documented

---

### Task 3.4: Create Module Index

**Description:** Create lib/companion/index.ts to export all public APIs
**Size:** Small
**Priority:** Low
**Dependencies:** All Phase 1-3 tasks

**Implementation:**

Create `lib/companion/index.ts`:

```typescript
/**
 * Clarity Companion API
 *
 * Public exports for the context delivery layer.
 */

// Types
export * from './types';

// Synthesis
export {
  generateBaseSynthesis,
  estimateTokens,
  estimateObjectTokens,
  calculateProfileHash,
  generateVersion,
} from './synthesis';

// Caching
export {
  getCachedSynthesis,
  isSynthesisStale,
  invalidateSynthesis,
  getSectionVersion,
} from './cache';

// Middleware
export {
  validateCompanionAuth,
  createAuthErrorResponse,
  withCompanionAuth,
  type CompanionAuth,
  type CompanionAuthResult,
  type CompanionAuthError,
} from './middleware';

// Tools
export {
  CLARITY_CANVAS_TOOLS,
  getToolsForClaude,
  getToolsForOpenAI,
} from './tools';

// Prompts
export {
  getProductSystemPrompt,
  getMinimalPrompt,
} from './prompts';

// Logging
export {
  logAccess,
  getProductStats,
} from './logging';
```

**Acceptance Criteria:**
- [ ] All public APIs exported
- [ ] Clean import path for consumers

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Foundation | 6 tasks | High |
| Phase 2: API Endpoints | 6 tasks | High |
| Phase 3: Tool Integration | 4 tasks | Medium |
| **Total** | **16 tasks** | |

### Execution Order

1. **Phase 1.1-1.3** can run in parallel (scopes, schema, types)
2. **Phase 1.4** depends on 1.2, 1.3
3. **Phase 1.5** depends on 1.4
4. **Phase 1.6** depends on 1.1
5. **Phase 2.1-2.6** can mostly run in parallel after Phase 1
6. **Phase 3.1-3.4** after Phase 2

### Critical Path

1.2 (Schema) → 1.4 (Synthesis) → 1.5 (Cache) → 2.1 (Base Endpoint) → 3.1 (Tools)
