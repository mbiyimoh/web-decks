# Clarity Companion API Layer

**Slug:** clarity-companion-api-layer
**Author:** Claude Code
**Date:** February 6, 2026
**Branch:** preflight/clarity-companion-api-layer
**Related:** `docs/reference/clarity-companion-API-layer.md` (original spec)

---

## 1) Intent & Assumptions

**Task brief:**
Design and plan an API layer ("Clarity Companion") that enables external 33 Strategies products (Talking Docs, SP33D, Better Contacts, M33T) to access synthesized Clarity Canvas user context. The API should provide tool-specific context synthesis, staleness detection, and update recommendations when Canvas data changes.

**Assumptions:**
- All products share the same PostgreSQL database (Supabase via Prisma)
- External products are deployed on the same infrastructure (Railway) or can make authenticated API calls
- LLM synthesis will use OpenAI (gpt-4o-mini for cost efficiency)
- Products need context "shaped" for their specific use cases, not raw profile dumps
- The spec's proposed version-based staleness detection is the right general approach
- Internal modules (Persona Sharpener, etc.) continue using direct Prisma access

**Out of scope:**
- Weekly sync engine / activity logging
- Internal module integration (they have direct Canvas access already)
- Authentication system changes (using existing session/auth patterns)
- Actual external product integration (separate implementation phase)
- Real-time push notifications (polling/on-demand is sufficient for MVP)

---

## 2) Pre-reading Log

### Documentation
- `docs/reference/clarity-companion-API-layer.md`: Original functional spec with architecture questions, data flow diagrams, and phase-based implementation plan
- `docs/clarity-canvas/clarity-canvas-handoff.md`: Comprehensive architecture overview including profile schema, scoring system, extraction pipeline
- `CLAUDE.md`: Project context including auth patterns, database setup, deployment on Railway

### Developer Guides
- `docs/developer-guides/synthesis-refinement-guide.md`: Existing pattern for iterative AI refinement with version tracking (Central Command)
- `docs/developer-guides/shareable-artifact-links-guide.md`: Security patterns for cross-product authentication

### Specs
- `specs/feat-central-command-pipeline-dashboard.md`: Pipeline management with similar AI extraction/synthesis patterns
- `specs/feat-braindump-reviewable-recommendations.md`: Extract → Review → Commit pattern

### Database Schema
- `prisma/schema.prisma`: Full schema including ClarityProfile, ProfileSection, ProfileSubsection, ProfileField, FieldSource models

### Core Libraries
- `lib/clarity-canvas/types.ts`: TypeScript types for profile, extraction, commit patterns
- `lib/clarity-canvas/scoring.ts`: Score calculation logic
- `lib/clarity-canvas/prompts.ts`: AI system prompts for extraction

---

## 3) Codebase Map

### Primary components/modules

| Path | Role |
|------|------|
| `app/api/clarity-canvas/profile/route.ts` | Profile CRUD - GET returns full nested structure |
| `app/api/clarity-canvas/extract/route.ts` | Two-pass extraction (no DB writes) |
| `app/api/clarity-canvas/commit/route.ts` | Commits approved recommendations to profile |
| `app/api/clarity-canvas/refine/route.ts` | AI refinement of individual recommendations |
| `lib/clarity-canvas/scoring.ts` | `calculateFieldScore()`, `calculateAllScores()` |
| `lib/clarity-canvas/types.ts` | `ProfileWithSections`, `ExtractionChunk`, API types |
| `lib/clarity-canvas/prompts.ts` | `BRAIN_DUMP_EXTRACTION_PROMPT`, system prompts |
| `lib/clarity-canvas/key-matching.ts` | `fuzzyMatchKey()` for AI hallucination prevention |
| `lib/user-sync.ts` | `ensureUserFromUnifiedSession()` - unified auth |

### Shared dependencies

| Dependency | Usage |
|------------|-------|
| `lib/prisma.ts` | Prisma client singleton |
| `lib/session.ts` | iron-session configuration for portal auth |
| `lib/auth.ts` | NextAuth configuration for learning platform |
| OpenAI SDK | gpt-4o for extraction, gpt-4o-mini for refinement |
| Zod | Schema validation for AI responses |

### Data flow

```
User Input (voice/text)
    ↓
POST /api/clarity-canvas/extract (two-pass, no DB writes)
    ↓
ExtractionChunk[] (recommendations)
    ↓
User Review (approve/reject/refine)
    ↓
POST /api/clarity-canvas/commit
    ↓
ProfileField.fullContext updated (with CONTEXT_DELIMITER)
    ↓
FieldSource created (audit trail)
    ↓
Scores recalculated
```

### Feature flags/config
- No explicit feature flags for Clarity Canvas
- `ClarityProfile.isCanvasInitialized` controls lazy initialization

### Potential blast radius
- **High**: Adding version tracking to ClarityProfile affects all profile reads/writes
- **Medium**: New API routes under `/api/companion/` - isolated from existing routes
- **Low**: New synthesis tables - no impact on existing functionality
- **Risk**: Database migrations on production Supabase (reversible)

---

## 4) Root Cause Analysis

*Not applicable - this is a new feature, not a bug fix.*

---

## 5) Research Findings

### Architecture Decision: API-Side vs Product-Side Synthesis

**Research finding:** Industry best practice is a **hybrid approach**:
- API layer provides raw data + metadata (version, timestamps)
- Products decide whether to use cached synthesis or request fresh
- Synthesis happens on-demand, not pre-computed for all products

**Recommended pattern for 33 Strategies:**
```typescript
// API returns:
{
  profile: { sections: [...] },  // Raw structured data
  synthesis: { ... },            // Cached synthesis (if exists)
  _meta: {
    synthesisStale: boolean,     // True if profile updated since synthesis
    synthesisAge: number,        // Milliseconds since last synthesis
    profileVersion: number,      // For cache invalidation
    lastUpdated: timestamp
  }
}

// Product decides:
// 1. Use cached synthesis if fresh enough
// 2. Request new synthesis via POST /synthesize
// 3. Do product-specific processing locally
```

**Pros:**
- Avoids wasted synthesis (only synthesize when needed)
- Products can customize their synthesis prompts
- Simpler infrastructure (no background job orchestration)
- Clear cost control (synthesis happens explicitly)

**Cons:**
- User may wait for synthesis on first access
- Each product needs to handle staleness logic

### Caching Strategy: Version-Based + TTL

**Research finding:** Semantic caching offers up to 73% cost reduction, but adds significant complexity. For your scale, **version-based invalidation** is the sweet spot.

**Recommended approach:**
1. Hash profile data to detect changes (`synthesisHash`)
2. Store synthesis with the hash used to generate it
3. On read: compare current hash vs stored hash → if different, synthesis is stale
4. Add 24-hour TTL as safety net (re-synthesize even if no hash change)
5. Add random jitter (±15 minutes) to prevent thundering herd

**Implementation:**
```typescript
// Add to ClarityProfile or new CompanionSynthesis model
synthesis: Json?           // Cached synthesis result
synthesisHash: String?     // Hash of profile data used
lastSynthesisAt: DateTime? // When synthesis was generated
```

### Staleness Detection: On-Demand (Not Event-Driven)

**Research finding:** Event-driven architectures add complexity that isn't justified for your use case. Railway's persistent Node.js process enables simple alternatives.

**Recommended approach (phased):**

**Phase 1 (MVP):** On-demand validation
- Check staleness when product requests context
- Return `_meta.synthesisStale` flag
- Product shows "context may be outdated" if stale
- User can click "Refresh" to trigger re-synthesis

**Phase 2 (Optimization):** Background refresh
- Use `node-cron` on Railway for hourly checks
- Pre-synthesize for active users (accessed in last 7 days)
- Reduces wait time for common users

**Phase 3 (Scale):** Event triggers
- Use Inngest if you need complex workflows
- Trigger synthesis on significant profile changes
- Add webhook support for external integrations

### Versioning: JSONB Per-Section (Existing Pattern)

**Research finding:** Your existing Central Command versioning pattern (`enrichmentFindingsVersions`) is well-aligned with industry best practices. Event sourcing would be overkill.

**Extend existing pattern:**
```typescript
// Already have this for Central Command
enrichmentFindings: { section: content, ... }
enrichmentFindingsVersions: { section: Version[], ... }

// Apply same pattern to Companion synthesis
companionSynthesis: { talkingDocs: {...}, speed: {...}, ... }
companionSynthesisVersions: { talkingDocs: Version[], ... }
```

### API Design: REST BFF Over GraphQL

**Research finding:** For known product use cases with a shared database, REST endpoints shaped per-product (Backend-for-Frontend pattern) outperform GraphQL.

**Recommended structure:**
```
/api/companion/
├── context/               # Base context endpoint
│   └── route.ts          # GET: raw profile + metadata
├── synthesize/           # Synthesis endpoint
│   └── route.ts          # POST: generate/refresh synthesis
├── clarity-canvas/       # Product-specific BFF
│   └── route.ts          # GET: shaped for Clarity Canvas
├── talking-docs/         # Product-specific BFF
│   └── route.ts          # GET: shaped for Talking Docs
├── speed/                # Product-specific BFF
│   └── route.ts          # GET: shaped for SP33D
└── better-contacts/      # Product-specific BFF
    └── route.ts          # GET: shaped for Better Contacts / M33T
```

**Why not GraphQL:**
- Known use cases (don't need client-defined queries)
- URL-based caching works out of the box
- Simpler to implement and maintain
- Railway deployment benefits from HTTP caching

---

## 6) Potential Solutions

### Solution 1: Centralized Synthesis API (Recommended)

**Description:** Single API layer that serves all products with product-specific synthesis prompts stored in config.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Product Applications                       │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│   │ Talking  │  │  SP33D   │  │  Better  │  │  M33T    │    │
│   │  Docs    │  │Mktg Auto │  │ Contacts │  │          │    │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└────────┼─────────────┼─────────────┼─────────────┼──────────┘
         │             │             │             │
         └─────────────┴──────┬──────┴─────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────────────────┐
         │           Clarity Companion API                     │
         │                                                     │
         │  GET /api/companion/context                         │
         │    → Returns profile + staleness metadata           │
         │                                                     │
         │  POST /api/companion/synthesize                     │
         │    → Generates tool-specific synthesis              │
         │    → Body: { tool: 'talking-docs', activity?: '' }  │
         │                                                     │
         │  GET /api/companion/{tool}                          │
         │    → Returns shaped response for specific tool      │
         └──────────────────────┬─────────────────────────────┘
                                │
                                ▼
         ┌────────────────────────────────────────────────────┐
         │           Data Access Layer (DAL)                   │
         │  lib/companion/                                     │
         │    - getContext()                                   │
         │    - synthesize()                                   │
         │    - checkStaleness()                               │
         │    - getToolSynthesis()                             │
         └──────────────────────┬─────────────────────────────┘
                                │
                                ▼
         ┌────────────────────────────────────────────────────┐
         │           PostgreSQL (via Prisma)                   │
         │  - ClarityProfile (existing)                        │
         │  - CompanionSynthesis (new)                         │
         │  - SynthesisCache (optional, future)                │
         └────────────────────────────────────────────────────┘
```

**Pros:**
- Single source of truth for synthesis logic
- Centralized prompt management
- Easy to add new products
- Clear ownership (Companion API team)
- Consistent caching/staleness behavior

**Cons:**
- Products can't customize synthesis prompts themselves
- API becomes bottleneck for changes
- Need coordination for new product integration

### Solution 2: Product-Owned Synthesis

**Description:** Each product does its own synthesis using raw profile data from a simple context API.

**Architecture:**
- Single `/api/companion/context` endpoint returns raw profile
- Each product has its own synthesis logic
- No centralized synthesis caching

**Pros:**
- Maximum product autonomy
- No API coordination needed
- Products evolve independently

**Cons:**
- Duplicated synthesis logic across products
- Inconsistent behavior across products
- No shared caching (higher LLM costs)
- Harder to maintain quality across products

### Solution 3: Hybrid with Shared DAL (Recommended Balance)

**Description:** Centralized Data Access Layer with optional product override capability.

**Architecture:**
```typescript
// Default synthesis in lib/companion/synthesis.ts
const DEFAULT_SYNTHESIS_PROMPTS: Record<Tool, string> = {
  'talking-docs': '... investor context ...',
  'speed': '... marketing context ...',
  'better-contacts': '... networking context ...'
};

// Products can optionally provide custom prompt
POST /api/companion/synthesize
{
  tool: 'talking-docs',
  activity: 'reviewing investor agreement',  // Optional context
  customPrompt?: string  // Optional override
}
```

**Pros:**
- Best of both: centralized management + product flexibility
- Shared caching for common prompts
- Products can customize when needed
- Clear upgrade path

**Cons:**
- Slightly more complex API
- Need to handle prompt versioning

---

## 7) Recommendation

**Recommended approach: Solution 3 (Hybrid with Shared DAL) + Progressive Disclosure**

### Critical Finding from Research

**AI performs WORSE with more context, not better.** Industry research shows:
- Traditional approach: 25,000 tokens loaded, only ~200 relevant (0.8% efficiency)
- Progressive disclosure: ~800 tokens base synthesis, 100% relevance
- "Every new token introduced depletes the attention budget"

### Synthesis Ownership: Hybrid Model

Based on production patterns from Notion AI, Mem, and Google ADK:

**Clarity Canvas (Source) creates:**
1. **Base Synthesis** (~800 tokens) — structured summary of personas, goals, pain points, decision dynamics, strategic priorities. Cached at the source, served to all products.
2. **Semantic Index** (~200 tokens) — lightweight metadata (section titles, token counts, last updated dates) for routing decisions.
3. **Full Sections** — complete profile data available on-demand via tools.

**Products (Consumers) augment:**
1. Fetch base synthesis as starting system prompt context
2. Add product-specific context (campaign history, contact graphs, document context)
3. Use **tools** to fetch more from Clarity Canvas when conversation requires it

### Tool-Based Dynamic Retrieval

Products receive tools to fetch context on-demand:

```typescript
// Available to all products
const clarityCanvasTools = [
  {
    name: 'get_profile_index',
    description: 'Get lightweight overview of profile sections with token counts',
    // Returns: section titles, token counts, last updated dates (~200 tokens)
  },
  {
    name: 'get_profile_section',
    description: 'Retrieve specific profile section in full detail',
    parameters: { section: 'personas | goals | pain_points | ...' }
  },
  {
    name: 'search_profile_semantic',
    description: 'Search user profile using natural language query',
    parameters: { query: string, maxResults: number }
  }
];
```

**V1 (Manual):** User says "go look for XYZ in my clarity canvas" → AI calls tool
**V2 (Smart):** AI recognizes when more context would help → proactively calls tools
**V3 (Agentic):** AI autonomously plans multi-step retrieval strategies

### Rationale

1. **Matches existing patterns:** The Central Command synthesis refinement uses a similar hybrid approach (default prompts + user customization).

2. **Proven caching pattern:** Version-based invalidation with JSONB storage is already working well for `enrichmentFindingsVersions`.

3. **Railway-friendly:** On-demand synthesis with optional background refresh works well with Railway's persistent Node.js process.

4. **Incrementally adoptable:** Start with base synthesis + tools, add smart retrieval later.

5. **Cost-efficient:** Shared synthesis cache + prompt caching (Anthropic: 90% cost savings).

### Implementation Phases

**Phase 1: Foundation (Estimated: 2-3 days)**
- Add `CompanionSynthesis` model to Prisma schema
- Create `lib/companion/` DAL with core functions
- Implement basic `/api/companion/context` endpoint

**Phase 2: Synthesis Layer (Estimated: 3-4 days)**
- Create tool-specific synthesis prompts
- Implement `/api/companion/synthesize` endpoint
- Add version tracking and staleness detection

**Phase 3: Product BFFs (Estimated: 2-3 days)**
- Create product-specific endpoints
- Shape responses for each product's needs
- Add `_meta` with staleness indicators

**Phase 4: Staleness UX (Estimated: 1-2 days)**
- Update product UIs to show staleness warnings
- Add "Refresh Context" action
- Implement comparison view (what changed)

**Phase 5: Background Optimization (Future)**
- Add node-cron for proactive synthesis
- Implement synthesis cache warming
- Monitor and optimize LLM costs

---

## 8) Clarifications Needed

1. **Product prioritization:** Which external product should be integrated first? (Recommendation: SP33D or Better Contacts as they have clearer context needs)
>> better contacts first

2. **Synthesis prompt ownership:** Who will write/maintain the tool-specific synthesis prompts? Should we involve product teams or keep centralized?
>> keep centralized for now

3. **Staleness threshold:** The spec suggests 24 hours. Is this the right threshold, or should different products have different freshness requirements?
>> thats fine

4. **Update recommendations UX:** The spec describes showing "what changed" when synthesis is refreshed. How detailed should this be? Full diff or just high-level summary?
>> both, with the latter being presented first, but the former available upon click or expand to "view full changes"

5. **Authentication scope:** Should external products use the existing iron-session pattern, or do we need API keys for service-to-service calls?
>> I'm not sure... talk me through it and give me more context that will help me make a more informed decision here

6. **Rate limiting:** Should we implement rate limiting on synthesis endpoints to prevent runaway LLM costs?
>> sure but with a very generous maximum. very few users will be using these things simultaneously right now

7. **Graceful degradation:** What should happen if synthesis fails? Return stale data with warning? Return raw profile? Error?
>> error + keep existing stale data with warning

---

## 9) Database Schema Additions

```prisma
// New model for cross-product synthesis
model CompanionSynthesis {
  id              String   @id @default(cuid())
  userId          String   @unique

  // Per-tool synthesis (JSONB)
  syntheses       Json     // { 'talking-docs': {...}, 'speed': {...}, ... }
  synthesisVersions Json?  // { 'talking-docs': Version[], ... }

  // Staleness tracking
  profileHash     String?  // Hash of source profile data
  lastSynthesisAt DateTime?

  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([lastSynthesisAt])
}

// Synthesis version tracking (within synthesisVersions JSON)
// {
//   tool: string;
//   content: object;
//   timestamp: string;
//   prompt: string;
//   profileVersion: number;
// }
```

---

## 10) API Endpoint Summary

### V1: Manual Fetch (Implement Now)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/companion/profile/index` | GET | Lightweight metadata (~200 tokens) | OAuth |
| `/api/companion/profile/section/:id` | GET | Specific section with cache hints | OAuth |
| `/api/companion/profile/search` | POST | Semantic search across profile | OAuth |
| `/api/companion/synthesis/base` | GET | Base synthesis (~800 tokens, cached) | OAuth |
| `/api/companion/cache/validate` | POST | Check version freshness | OAuth |

### V2: Smart Synthesis (Future)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/companion/synthesis/for-product` | POST | Product-optimized synthesis | OAuth |
| `/api/companion/synthesis/for-intent` | POST | Intent-based context selection | OAuth |
| `/api/companion/recommendations/context` | GET | "You might also want to fetch..." | OAuth |

### V3: Agentic Query (Future)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/companion/agentic/query` | POST | Natural language profile query | OAuth |
| `/api/companion/agentic/plan` | POST | Multi-step retrieval plan | OAuth |

**All endpoints return:**
- `tokenCount` — for budget management
- `cacheHint` — 'stable' or 'volatile'
- `version` — for ETag/If-None-Match caching
- `lastUpdated` — for staleness detection

---

## 11) Key Files to Create

| File | Purpose |
|------|---------|
| `lib/companion/index.ts` | Public exports |
| `lib/companion/dal.ts` | Data Access Layer |
| `lib/companion/synthesis.ts` | Synthesis logic + prompts |
| `lib/companion/staleness.ts` | Staleness detection utilities |
| `lib/companion/types.ts` | TypeScript types |
| `app/api/companion/context/route.ts` | Context API endpoint |
| `app/api/companion/synthesize/route.ts` | Synthesis API endpoint |
| `app/api/companion/[tool]/route.ts` | Dynamic product BFFs |

---

*Last Updated: February 2026*
