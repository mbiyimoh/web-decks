# Specification: Clarity Companion API

**Status:** Ready for Implementation (after Auth Modernization)
**Priority:** High
**Estimated Effort:** 3-4 weeks
**Author:** Claude Code
**Date:** February 7, 2026
**Prerequisite:** `specs/auth-modernization-oauth-provider.md`

---

## 1. Overview

### Problem Statement

Clarity Canvas captures rich user context (personas, goals, pain points, decision dynamics, etc.). This context is valuable across multiple products:
- **Better Contacts** — Networking based on goals, network gaps, who they need to meet
- **SP33D** — Marketing automation based on GTM, target customers, messaging
- **Talking Docs** — Document review based on investor relationships, deal experience

Currently, each product would need to independently understand the user. We need a central API that provides synthesized context to all products.

### Solution

**Clarity Companion API** — A context delivery layer that:
1. Provides **base synthesis** (~800 tokens) as starting context for any product
2. Exposes **tools** for products to fetch additional profile data on-demand
3. Supports **progressive disclosure** (start minimal, fetch more when needed)
4. Tracks **staleness** so products know when to refresh

### Design Philosophy: Progressive Disclosure

**Critical insight from research:** AI performs worse with more context, not better. Loading 25,000 tokens when 200 are relevant causes "attention budget degradation."

**Our approach:**
- Start with ~800 token base synthesis
- Give AI tools to fetch more on-demand
- V1: User manually triggers ("go look for XYZ in my clarity canvas")
- V2 (future): AI automatically recognizes gaps
- V3 (future): Agentic autonomous retrieval

### Success Criteria

- [ ] Base synthesis endpoint returns ~800 token structured summary
- [ ] Profile section endpoints return specific sections on-demand
- [ ] Semantic search endpoint finds relevant profile content
- [ ] All endpoints return token counts and cache hints
- [ ] Better Contacts can fetch user context via OAuth
- [ ] Tool definitions enable AI to fetch context dynamically

---

## 2. Architecture

### Synthesis Ownership: Hybrid Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  CLARITY CANVAS (Source)                         │
│                                                                   │
│  Layer 1: BASE SYNTHESIS (~800 tokens)                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ • Customer personas (structured summaries)                   │ │
│  │ • Goals & vision (prioritized)                               │ │
│  │ • Pain points (ranked)                                       │ │
│  │ • Decision dynamics (mapped)                                 │ │
│  │ • Strategic priorities (ordered)                             │ │
│  │ • Company context (stage, industry, size)                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ↑ Cached at source, served to all products                      │
│                                                                   │
│  Layer 2: SEMANTIC INDEX (~200 tokens)                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Section titles, token counts, last updated dates             │ │
│  │ (Lightweight metadata for routing decisions)                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Layer 3: FULL SECTIONS (on-demand via tools)                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Complete profile data retrieved when AI calls tools          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                EXTERNAL PRODUCTS (Consumers)                      │
│                                                                   │
│  1. Authenticate via OAuth (get access token)                    │
│  2. Fetch base synthesis (cached, cheap, ~800 tokens)            │
│  3. Include base synthesis in system prompt                      │
│  4. Give AI tools to fetch more from Clarity Canvas              │
│  5. AI calls tools when conversation requires more context       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Product Request
    ↓
OAuth Token Validation
    ↓
Check scope (read:profile, read:synthesis, etc.)
    ↓
┌─────────────────────────────────────────┐
│ GET /companion/synthesis/base           │ → Return cached base synthesis
│ GET /companion/profile/index            │ → Return section metadata
│ GET /companion/profile/section/:id      │ → Return specific section
│ POST /companion/profile/search          │ → Semantic search
└─────────────────────────────────────────┘
    ↓
Response with:
- data (requested content)
- tokenCount (for budget management)
- cacheHint ('stable' | 'volatile')
- version (for ETag caching)
- lastUpdated (for staleness)
```

---

## 3. Database Schema

### New Models

```prisma
// Cached synthesis for cross-product use
model CompanionSynthesis {
  id              String   @id @default(cuid())
  userId          String   @unique

  // Base synthesis (structured JSON)
  baseSynthesis   Json     // ~800 tokens of structured summary

  // Metadata
  profileHash     String   // Hash of source profile data
  tokenCount      Int      // Actual token count
  version         String   // For cache invalidation

  // Timestamps
  generatedAt     DateTime @default(now())
  expiresAt       DateTime // Synthesis TTL (24 hours default)

  // Relations
  user            User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([expiresAt])
  @@map("companion_syntheses")
}

// Track what products have fetched (for analytics)
model CompanionAccessLog {
  id          String   @id @default(cuid())
  userId      String
  productId   String   // OAuth client ID
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

### Update User Model

```prisma
model User {
  // ... existing fields ...

  // Add relation
  companionSynthesis CompanionSynthesis?
}
```

---

## 4. Base Synthesis Structure

The base synthesis is a structured JSON object (~800 tokens) that provides enough context for most AI interactions:

```typescript
interface BaseSynthesis {
  // User identity
  identity: {
    name: string;
    role: string;
    company: string;
    industry: string;
    companyStage: string; // 'startup' | 'growth' | 'enterprise'
  };

  // Customer understanding
  personas: {
    name: string;
    role: string;
    primaryGoal: string;
    topFrustration: string;
  }[];

  // Strategic context
  goals: {
    goal: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }[];

  // Challenges
  painPoints: {
    pain: string;
    severity: 'critical' | 'significant' | 'moderate';
    category: string;
  }[];

  // Decision making
  decisionDynamics: {
    decisionMakers: string[];
    buyingProcess: string;
    keyInfluencers: string[];
  };

  // Priorities
  strategicPriorities: string[]; // Ordered list

  // Metadata
  _meta: {
    tokenCount: number;
    version: string;
    generatedAt: string;
    profileCompleteness: number; // 0-100
  };
}
```

---

## 5. API Endpoints

### V1: Manual Fetch Endpoints

#### GET `/api/companion/synthesis/base`

Returns the cached base synthesis (~800 tokens).

**Request:**
```
GET /api/companion/synthesis/base
Authorization: Bearer <access_token>
If-None-Match: "v1.2.3" (optional, for caching)
```

**Response:**
```json
{
  "synthesis": {
    "identity": { ... },
    "personas": [ ... ],
    "goals": [ ... ],
    "painPoints": [ ... ],
    "decisionDynamics": { ... },
    "strategicPriorities": [ ... ],
    "_meta": {
      "tokenCount": 847,
      "version": "v1.2.3",
      "generatedAt": "2026-02-07T10:30:00Z",
      "profileCompleteness": 72
    }
  },
  "cacheHint": "stable",
  "stale": false
}
```

**Cache behavior:**
- Returns 304 Not Modified if ETag matches
- Regenerates synthesis if profile changed since last generation
- TTL: 24 hours (regenerate after expiry)

---

#### GET `/api/companion/profile/index`

Returns lightweight metadata about all profile sections (~200 tokens).

**Request:**
```
GET /api/companion/profile/index
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "sections": [
    {
      "id": "individual",
      "title": "Individual Profile",
      "subsections": ["background", "thinking", "priorities", "network_position"],
      "tokenCount": 2450,
      "lastUpdated": "2026-02-01T10:30:00Z",
      "cacheHint": "stable",
      "completeness": 85
    },
    {
      "id": "organization",
      "title": "Organization",
      "subsections": ["company", "market", "competition", "customers"],
      "tokenCount": 3200,
      "lastUpdated": "2026-02-05T14:20:00Z",
      "cacheHint": "volatile",
      "completeness": 60
    }
    // ... other sections
  ],
  "totalTokens": 18500,
  "version": "v1.2.3"
}
```

---

#### GET `/api/companion/profile/section/:sectionId`

Returns a specific profile section in full detail.

**Request:**
```
GET /api/companion/profile/section/goals
Authorization: Bearer <access_token>
If-None-Match: "goals-v1.0.5" (optional)
```

**Response:**
```json
{
  "section": {
    "id": "goals",
    "title": "Goals & Vision",
    "subsections": [
      {
        "id": "short_term",
        "title": "Short-term Goals",
        "fields": [
          {
            "key": "q1_objectives",
            "summary": "Launch MVP, secure 10 pilot customers",
            "fullContext": "Complete product launch by March...",
            "confidence": 0.9,
            "lastUpdated": "2026-02-01T10:30:00Z"
          }
          // ... other fields
        ]
      }
      // ... other subsections
    ]
  },
  "tokenCount": 1850,
  "version": "goals-v1.0.5",
  "cacheHint": "volatile"
}
```

---

#### POST `/api/companion/profile/search`

Semantic search across the user's profile.

**Request:**
```json
POST /api/companion/profile/search
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "query": "customer pain points related to scaling operations",
  "maxResults": 5,
  "sections": ["personas", "pain_points"] // optional filter
}
```

**Response:**
```json
{
  "results": [
    {
      "section": "pain_points",
      "subsection": "operational",
      "field": "scaling_challenges",
      "snippet": "Scaling from 10 to 100 team members has created significant process breakdowns...",
      "relevance": 0.92,
      "tokenCount": 450
    },
    {
      "section": "personas",
      "subsection": "primary",
      "field": "frustrations",
      "snippet": "Operations Manager frustrated by manual processes that don't scale...",
      "relevance": 0.87,
      "tokenCount": 280
    }
  ],
  "totalTokens": 1230,
  "query": "customer pain points related to scaling operations"
}
```

---

#### POST `/api/companion/cache/validate`

Check if cached synthesis is still valid.

**Request:**
```json
POST /api/companion/cache/validate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cachedVersion": "v1.2.3",
  "sections": {
    "goals": "goals-v1.0.5",
    "personas": "personas-v1.0.2"
  }
}
```

**Response:**
```json
{
  "synthesisStale": false,
  "sectionsStale": {
    "goals": false,
    "personas": true // This section has been updated
  },
  "currentVersions": {
    "synthesis": "v1.2.3",
    "goals": "goals-v1.0.5",
    "personas": "personas-v1.0.4" // New version
  }
}
```

---

### Tool Definitions for AI Products

Products should expose these tools to their AI:

```typescript
export const CLARITY_CANVAS_TOOLS = [
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
```

### System Prompt Template for Products

```typescript
export function getProductSystemPrompt(
  productName: string,
  baseSynthesis: BaseSynthesis
): string {
  return `You are ${productName}, an AI assistant that helps users with [product-specific purpose].

## User Context (from Clarity Canvas)

${JSON.stringify(baseSynthesis, null, 2)}

## Accessing More Context

You have access to the user's full Clarity Canvas profile via tools:
- Use \`get_profile_index\` to see what sections are available
- Use \`get_profile_section\` to fetch specific sections when needed
- Use \`search_profile\` to find information by topic

WHEN TO FETCH MORE CONTEXT:
- If the user asks about something not covered in the context above
- If you're making assumptions that could be verified from their profile
- If you need specific details (names, numbers, dates) not in the summary
- When the user explicitly asks you to "look in my canvas" or similar

Fetch additional context BEFORE responding when you identify a gap.

## Product-Specific Instructions

[Product-specific instructions here]
`;
}
```

---

## 6. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

**Tasks:**
1. Create Prisma models for `CompanionSynthesis` and `CompanionAccessLog`
2. Implement base synthesis generation logic
3. Create synthesis caching with hash-based invalidation
4. Implement OAuth token validation middleware

**Files to create:**
- `prisma/schema.prisma` — Add new models
- `lib/companion/synthesis.ts` — Synthesis generation
- `lib/companion/cache.ts` — Caching logic
- `lib/companion/middleware.ts` — OAuth validation
- `lib/companion/types.ts` — TypeScript interfaces

**Acceptance criteria:**
- [ ] Base synthesis generates from profile data
- [ ] Synthesis cached with version tracking
- [ ] Cache invalidates when profile changes

### Phase 2: API Endpoints (Week 2)

**Tasks:**
1. Implement `/api/companion/synthesis/base` endpoint
2. Implement `/api/companion/profile/index` endpoint
3. Implement `/api/companion/profile/section/:id` endpoint
4. Implement `/api/companion/profile/search` endpoint
5. Implement `/api/companion/cache/validate` endpoint
6. Add access logging for analytics

**Files to create:**
- `app/api/companion/synthesis/base/route.ts`
- `app/api/companion/profile/index/route.ts`
- `app/api/companion/profile/section/[sectionId]/route.ts`
- `app/api/companion/profile/search/route.ts`
- `app/api/companion/cache/validate/route.ts`
- `lib/companion/logging.ts` — Access logging

**Acceptance criteria:**
- [ ] All endpoints return correct data structure
- [ ] Token counts included in all responses
- [ ] Cache hints (stable/volatile) included
- [ ] ETag/If-None-Match caching working

### Phase 3: Tool Integration (Week 3)

**Tasks:**
1. Create tool definitions for AI products
2. Create tool handler implementations
3. Build system prompt template
4. Create example integration for Better Contacts
5. Add semantic search capability

**Files to create:**
- `lib/companion/tools.ts` — Tool definitions
- `lib/companion/tool-handlers.ts` — Tool implementations
- `lib/companion/prompts.ts` — System prompt templates
- `lib/companion/search.ts` — Semantic search
- `docs/developer-guides/companion-api-integration.md` — Integration guide

**Acceptance criteria:**
- [ ] Tools can be called by AI and return correct data
- [ ] System prompt template generates valid prompts
- [ ] Semantic search returns relevant results
- [ ] Integration guide complete

### Phase 4: Better Contacts Integration (Week 4)

**Tasks:**
1. Register Better Contacts as OAuth client
2. Implement OAuth flow in Better Contacts
3. Integrate Companion API tools
4. Test end-to-end context fetching
5. Optimize based on real usage

**Files to create/modify:**
- Better Contacts codebase (separate repo)
- `scripts/register-oauth-client.ts` — Client registration helper

**Acceptance criteria:**
- [ ] Better Contacts authenticates via OAuth
- [ ] Base synthesis loads on app start
- [ ] AI can fetch additional context via tools
- [ ] User can manually trigger "look in canvas"

---

## 7. Token Budget Management

### Guidelines for Products

```typescript
const TOKEN_BUDGET = {
  // Claude Sonnet 4.5 context window
  maxContextWindow: 200000,

  // Allocations
  systemPromptBase: 500,           // Product instructions
  baseSynthesis: 1000,             // Clarity Canvas summary
  toolDefinitions: 2000,           // Available tools
  conversationHistory: 50000,      // Reserve for chat
  outputBuffer: 8000,              // Reserve for response

  // Available for dynamic fetching
  dynamicContext: 138500           // Remaining budget
};

// Products should track usage
interface TokenUsage {
  systemPrompt: number;
  baseSynthesis: number;
  fetchedSections: { section: string; tokens: number }[];
  conversationHistory: number;
  total: number;
  remaining: number;
}
```

### API Response Token Hints

All endpoints include token information:

```typescript
interface ApiResponse<T> {
  data: T;
  tokenCount: number;        // Tokens in this response
  cacheHint: 'stable' | 'volatile';
  version: string;           // For ETag caching
  _meta?: {
    generatedAt: string;
    latencyMs: number;
  };
}
```

---

## 8. Caching Strategy

### Synthesis Caching

```typescript
// Synthesis regeneration triggers
const REGENERATE_SYNTHESIS_WHEN = {
  // Profile data changed
  profileHashMismatch: true,

  // TTL expired (even if no changes)
  ttlExpired: 24 * 60 * 60 * 1000, // 24 hours

  // Explicit invalidation
  manualInvalidation: true,
};

// Hash calculation
function calculateProfileHash(profile: ProfileWithSections): string {
  // Hash key fields that affect synthesis
  const hashInput = {
    personas: profile.sections.find(s => s.key === 'personas')?.updatedAt,
    goals: profile.sections.find(s => s.key === 'goals')?.updatedAt,
    painPoints: profile.sections.find(s => s.key === 'pain_points')?.updatedAt,
    // ... other key sections
  };

  return crypto.createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex');
}
```

### HTTP Caching

```typescript
// Response headers for caching
res.setHeader('ETag', `"${synthesis.version}"`);
res.setHeader('Cache-Control', 'private, max-age=3600'); // 1 hour

// Handle conditional requests
if (req.headers['if-none-match'] === `"${synthesis.version}"`) {
  return new Response(null, { status: 304 });
}
```

---

## 9. Security & Privacy

### Scope Validation

```typescript
// Validate OAuth scopes for each endpoint
const ENDPOINT_SCOPES = {
  '/companion/synthesis/base': ['read:synthesis', 'read:profile'],
  '/companion/profile/index': ['read:profile'],
  '/companion/profile/section/:id': ['read:profile'],
  '/companion/profile/search': ['read:profile', 'search:profile'],
  '/companion/cache/validate': ['read:profile'],
};

async function validateScopes(
  token: JWTPayload,
  endpoint: string
): Promise<boolean> {
  const requiredScopes = ENDPOINT_SCOPES[endpoint];
  const tokenScopes = token.scope.split(' ');

  return requiredScopes.some(scope => tokenScopes.includes(scope));
}
```

### Rate Limiting

```typescript
// Per-product rate limits
const RATE_LIMITS = {
  'better-contacts': { requests: 100, window: '1m' },
  'speed': { requests: 100, window: '1m' },
  'talking-docs': { requests: 50, window: '1m' },
};
```

### Access Logging

All access logged for:
- Compliance and audit
- Usage analytics
- Abuse detection
- Performance optimization

---

## 10. Testing Requirements

### Unit Tests

- [ ] Synthesis generation produces valid structure
- [ ] Token counting is accurate
- [ ] Cache invalidation triggers correctly
- [ ] Scope validation works

### Integration Tests

- [ ] Full flow: OAuth → fetch synthesis → fetch section
- [ ] Cache hit/miss scenarios
- [ ] ETag-based caching
- [ ] Semantic search accuracy

### Load Tests

- [ ] Synthesis generation under load
- [ ] Cache performance
- [ ] Search latency

---

## 11. Monitoring & Analytics

### Metrics to Track

```typescript
interface CompanionMetrics {
  // Usage
  requestsPerProduct: Record<string, number>;
  sectionsAccessedFrequency: Record<string, number>;
  averageTokensPerRequest: number;

  // Performance
  synthesisGenerationLatency: number;
  cacheHitRate: number;
  searchLatency: number;

  // Quality
  profileCompletenessDistribution: number[];
  staleRequestsPercentage: number;
}
```

---

## 12. Future Enhancements (V2/V3)

### V2: Smart Retrieval

- `POST /companion/synthesis/for-intent` — Conversation-aware synthesis
- AI intent analysis to predict what context is needed
- Automatic pre-fetching based on conversation patterns

### V3: Agentic Query

- `POST /companion/agentic/query` — Natural language profile queries
- `POST /companion/agentic/plan` — Multi-step retrieval planning
- Autonomous context management by AI agents

---

## 13. Related Documents

- `specs/auth-modernization-oauth-provider.md` — Prerequisite: OAuth implementation
- `docs/ideation/clarity-companion-api-layer.md` — Full ideation with research
- `docs/ideation/auth-modernization-oauth-provider.md` — Auth ideation
- `docs/reference/clarity-companion-API-layer.md` — Original spec
- `/tmp/research_20260207_context_synthesis_multi_product_ai.md` — Research findings

---

*Last Updated: February 2026*
