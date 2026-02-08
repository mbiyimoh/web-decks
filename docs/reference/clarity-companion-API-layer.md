# Clarity Companion: Handoff Package

> Portable context layer enabling Clarity Canvas data to flow intelligently across the 33 Strategies product ecosystem.

**Status:** Functional spec complete, requires architectural validation and implementation planning
**Approach:** Research-first — validate patterns before implementing

---

## Pre-Implementation Directive

**Before writing any code, Claude Code should:**

1. **Research existing patterns** for shared user context across multiple products (multi-tenant profile APIs, context-aware microservices, user graph systems)

2. **Validate the architecture** described here against industry best practices — identify any gaps, anti-patterns, or better approaches

3. **Review actual data structures** in the existing codebase (Clarity Canvas schema, Better Contacts, any existing APIs) and adapt examples accordingly

4. **Consider alternatives** — if research surfaces a meaningfully better approach than what's outlined, propose it before implementation

5. **Gut-check the synthesis model** — is LLM-based synthesis at the API layer the right pattern, or should products handle their own synthesis? What are the tradeoffs?

The goal is a sound implementation, not blind adherence to this spec.

---

## What We're Building

### The Problem

Clarity Canvas captures rich context about a user (who they are, what they're doing, their goals, their network, etc.). This context is valuable across multiple products:

- **Talking Docs** — Contract/document review benefits from knowing investor relationships, deal experience, risk tolerance
- **SP33D (Marketing Automation)** — Benefits from knowing GTM strategy, target customers, messaging, positioning
- **Better Contacts + M33T** — Benefits from knowing goals, company stage, network gaps, who they need to meet
- **Internal Modules** (Persona Sharpener, etc.) — Live within Clarity Canvas itself, have direct access

Currently, each product would need to independently understand the user. We want them to draw from a single source of truth.

### The Solution

**Clarity Companion** — An API layer that:

1. Exposes Clarity Canvas data to external products
2. Synthesizes that data appropriately for each product's context
3. Tracks when Canvas has been updated
4. Enables products to know when their cached synthesis is stale

---

## Product Structure (Context)

```
33 Strategies Domain (33strategies.ai/clarity/...)
├── Clarity Canvas (core profile experience)
├── Persona Sharpener (internal module)
└── [Other sharpening modules - internal]

External Products (separate URLs, shared database)
├── Better Contacts (standalone product)
├── M33T (networking layer on Better Contacts)
├── Talking Docs (document/contract AI)
└── SP33D (marketing automation)
```

**Key distinction:** Internal modules have direct Canvas access. External products go through Clarity Companion API.

---

## Functional Requirements

### 1. Context Fetching

**What products need to do:**
- Request user's Clarity Canvas context
- Specify what they're trying to do (optional but helpful for synthesis)
- Receive synthesized, relevant context back

**Example flow (illustrative — adapt to actual schema):**
```
Product: "I'm Talking Docs. User is reviewing an investor agreement."

API returns: {
  relevant_context: {
    investor_relationships: "...",
    funding_history: "...",
    deal_experience: "...",
    risk_tolerance: "..."
  },
  synthesis_version: "abc123",
  canvas_last_updated: "2025-01-03T15:30:00Z"
}
```

### 2. Tool-Specific Synthesis

Each product gets a synthesis shaped for its purpose:

| Product | Synthesis Focus |
|---------|-----------------|
| Talking Docs | Investors, deals, legal experience, risk tolerance, negotiation style |
| SP33D | Customers, GTM, messaging, positioning, market, competition |
| Better Contacts / M33T | Goals, network composition, gaps, who they need to meet, company stage |

**Implementation note:** This could be:
- Multiple synthesis prompts (one per product)
- A single flexible prompt that takes product context as input
- Products doing their own synthesis from raw data

**Research question for Claude Code:** Which approach is better? What are the tradeoffs of API-side synthesis vs. product-side synthesis?

### 3. Staleness Detection

**The pattern:**
- Clarity Canvas has a version/timestamp that increments on any update
- Each product tracks: "I last synthesized at version X"
- On product open: Check if Canvas version > last synthesis version
- If stale: Re-synthesize and show user what changed

**Key efficiency:** Don't re-synthesize on every Canvas update. Only synthesize when user actually opens the product. (User might update Canvas 4 times before opening SP33D — only synthesize once.)

### 4. Update Recommendations

When a product detects stale synthesis:

1. Fetch fresh synthesis from Canvas
2. Compare to cached/previous synthesis
3. Identify meaningful differences
4. Present to user: "Your Canvas changed. This affects X, Y, Z in this product. Review?"

**Example (illustrative):**
```
"Your Clarity Canvas was updated since you last used SP33D.

Changes detected:
- GTM strategy shifted from growth-focused to retention-focused
- New investor relationships added
- Target customer definition refined

This may affect:
- Your audience profiles (suggest review)
- Your messaging framework (suggest update)

[Review Now] [Dismiss]"
```

---

## Data Flow (Conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLARITY CANVAS                           │
│                 (Central Profile Data)                       │
│                                                             │
│  version: 47                                                │
│  last_updated: 2025-01-03T15:30:00Z                        │
│  sections: { individual, role, organization, goals, ... }  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  CLARITY COMPANION API                       │
│                                                             │
│  GET /companion/context                                     │
│    - userId                                                 │
│    - tool (talking-docs | speed | better-contacts | m33t)  │
│    - activity (optional - what user is doing)              │
│                                                             │
│  Returns:                                                   │
│    - Synthesized context (shaped for requesting tool)       │
│    - Canvas version/timestamp                               │
│    - Relevant sections used                                 │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ↓                 ↓                 ↓
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │  Talking  │    │   SP33D   │    │  Better   │
   │   Docs    │    │           │    │ Contacts  │
   │           │    │           │    │  + M33T   │
   │ Stores:   │    │ Stores:   │    │ Stores:   │
   │ last_sync │    │ last_sync │    │ last_sync │
   │ = v45     │    │ = v42     │    │ = v47     │
   └───────────┘    └───────────┘    └───────────┘
         │                 │                 │
         │                 │                 │
   On open:          On open:          On open:
   v47 > v45?        v47 > v42?        v47 = v47?
   YES → refresh     YES → refresh     NO → use cache
```

---

## Architecture Questions for Validation

Before implementing, research and validate:

### 1. Synthesis Location
**Question:** Should synthesis happen in the API (Clarity Companion) or in each product?

- **API-side:** Centralized, cacheable, consistent, but less flexible
- **Product-side:** More flexible, but duplicated logic, harder to maintain

What do similar systems do? What's the industry standard for multi-product user context?

### 2. Caching Strategy
**Question:** How should synthesized context be cached?

- Per-product cache with version invalidation?
- TTL-based expiration?
- No cache (always synthesize fresh)?

What are the performance and cost tradeoffs (LLM calls aren't free)?

### 3. Granular vs. Full Refresh
**Question:** When Canvas updates, should products:

- Re-synthesize everything?
- Only re-synthesize sections that changed?
- Diff the old vs. new synthesis and only surface changes?

What's the right balance of accuracy vs. efficiency?

### 4. Event Model
**Question:** How should products know Canvas was updated?

- Polling (check version on product open)?
- Webhooks/events (Canvas pushes notification)?
- Shared database flag?

What's simplest given our infrastructure?

### 5. Partial Context Requests
**Question:** Should products be able to request specific sections?

```
GET /companion/context?sections=goals,network
```

Or always get full tool-specific synthesis?

---

## What Already Exists (Review Before Implementing)

Claude Code should examine:

1. **Clarity Canvas schema** — What's the actual data model? (ProfileField, ProfileSection, etc.)
2. **Better Contacts schema** — How does it currently store user context?
3. **Existing API patterns** — Are there existing patterns for cross-product data access?
4. **Authentication/authorization** — How do products authenticate to access user data?

Adapt all examples in this doc to match actual structures.

---

## Implementation Phases (Suggested)

### Phase 1: Foundation
- Design and validate API structure
- Implement basic context fetching (no synthesis)
- Add version tracking to Canvas

### Phase 2: Synthesis Layer
- Implement tool-specific synthesis prompts
- Add synthesis caching
- Build staleness detection

### Phase 3: Product Integration
- Integrate with one product (suggest: SP33D or Talking Docs)
- Implement "stale synthesis" UX
- Test update recommendation flow

### Phase 4: Rollout
- Integrate remaining products
- Optimize caching/performance
- Add monitoring/logging

---

## Out of Scope (For Now)

- **Weekly sync engine** — The "here's what we learned this week" feature is separate
- **Activity logging** — What products log for the weekly sync is separate
- **Internal modules** — Persona Sharpener etc. have direct Canvas access, don't need Companion API

---

## Summary

**What we want:**
- Central Clarity Canvas that all products can draw from
- Each product gets context synthesized for its purpose
- Products know when their synthesis is stale
- Users see recommendations when Canvas changes affect a product

**What Claude Code should do:**
1. Research similar patterns (shared user context APIs, profile services, etc.)
2. Validate the architecture against best practices
3. Review actual data structures and adapt
4. Propose alternatives if research surfaces better approaches
5. Then implement

**The functional requirements are clear. The implementation approach should be validated.**

---

*Last Updated: January 2026*
