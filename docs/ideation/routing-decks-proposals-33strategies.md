# Routing Architecture for /decks and /proposals on 33strategies.ai

**Slug:** routing-decks-proposals-33strategies
**Author:** Claude Code
**Date:** 2025-12-13
**Branch:** preflight/routing-decks-proposals
**Related:** CLAUDE.md, deploy-tradeblock-deck-railway-password-protection.md

---

## 1) Intent & Assumptions

- **Task brief:** Create a routing architecture with `/decks` and `/proposals` routes for the 33strategies.ai domain, evaluate whether the PLYA HTML proposal should be refactored to React, and establish a consistent content delivery pattern for both content types.

- **Assumptions:**
  - The domain 33strategies.ai will be configured to point to this application
  - Both decks and proposals share the same dark editorial aesthetic and design system
  - Authentication may be required for some content but not all
  - Multiple decks and proposals will be added over time
  - The existing TradeblockDeck pattern is the reference implementation for decks

- **Out of scope:**
  - DNS/domain configuration for 33strategies.ai
  - Building out all future decks/proposals (just the architecture)
  - Major redesigns of existing content
  - API-driven content management (static/code-driven is fine)

---

## 2) Pre-reading Log

| File | Takeaway |
|------|----------|
| `CLAUDE.md` | Comprehensive architecture doc defining shared components, design tokens, directory structure (`decks/[entity]/[deck-name]/`), and Railway deployment patterns |
| `app/page.tsx` | Current root renders TradeblockDeck behind iron-session auth |
| `app/layout.tsx` | Root layout with Space Grotesk + Inter fonts, dark theme |
| `middleware.ts` | Edge-compatible auth check for session cookie, allows `/login`, `/api/`, static assets |
| `components/TradeblockDeck.tsx` | 1300+ lines, full React/Framer Motion deck with Section, RevealText, NavDots, ProgressBar components |
| `first-proposal-PLYA/33S_Interactive_Proposal.html` | ~900 lines of React via CDN, interactive shopping cart with equity slider, well-structured components |
| `tradeblock-decks/` | Contains `tradeblock-board-update-dec2025.jsx` |
| `33-strategies-decks/` | Contains `33strategies-question-advantage-deck.jsx`, `33-vision-deck.jsx` |
| `docs/ideation/deploy-tradeblock-deck-railway*.md` | Previous Railway deployment ideation with auth patterns |

---

## 3) Codebase Map

- **Primary components/modules:**
  - `app/page.tsx` - Current root route (TradeblockDeck)
  - `app/login/page.tsx` - Login form
  - `app/api/auth/route.ts` - Authentication endpoint
  - `components/TradeblockDeck.tsx` - Main deck component
  - `first-proposal-PLYA/33S_Interactive_Proposal.html` - PLYA proposal (standalone HTML)
  - `middleware.ts` - Route protection

- **Shared dependencies:**
  - `lib/session.ts` - iron-session configuration
  - `styles/globals.css` - Global styles, Tailwind
  - `tailwind.config.ts` - Design tokens

- **Data flow:**
  - Request → Middleware (cookie check) → Layout → Page → Component render
  - For proposals: same flow, different content components

- **Feature flags/config:**
  - `DECK_PASSWORD` - Shared password for protected content
  - `SESSION_SECRET` - iron-session encryption key

- **Potential blast radius:**
  - Middleware changes affect all routes
  - Layout changes affect all pages
  - New route structure requires updating existing bookmarks/links

---

## 4) Root Cause Analysis

*N/A - This is a new feature implementation, not a bug fix.*

---

## 5) Research Findings

### 5.1 Routing Architecture Options

| Approach | URL Structure | Pros | Cons |
|----------|---------------|------|------|
| **A: Route Groups** | `/(decks)/[slug]`, `/(proposals)/[slug]` | Separate layouts per section, clean organization | Full page reloads between sections, complex |
| **B: Regular Folders** | `/decks/[slug]`, `/proposals/[slug]` | Clear URLs, SEO-friendly, client-side navigation | Less layout isolation |
| **C: Flat Routes** | `/deck/[slug]`, `/proposal/[slug]` | Simplest, minimal changes | No section landing pages, harder to organize |

**Recommendation: Option B (Regular Folders)**

Reasons:
- Clear, SEO-friendly URLs: `33strategies.ai/decks/tradeblock-ai-inflection`
- Client-side navigation between sections (no full page reloads)
- Natural landing pages at `/decks` and `/proposals`
- Easier to understand and maintain
- Aligns with CLAUDE.md directory structure patterns

### 5.2 PLYA Proposal Refactor Evaluation

The PLYA proposal (`33S_Interactive_Proposal.html`) is **already React code** embedded in HTML with CDN dependencies. Key findings:

| Aspect | Current State | Assessment |
|--------|---------------|------------|
| **Technology** | React 18 via CDN, Babel transpilation | Already React, just needs extraction |
| **Components** | ServiceCard, DeliverableCard, Bullet, ThreeThreeProposal | Well-structured, reusable |
| **Styling** | Tailwind via CDN | Same design system |
| **Interactivity** | Cart, equity slider, company stage selector | Complex state management |
| **Lines of code** | ~900 lines | Medium complexity |

**Refactor Recommendation: YES, but as migration not rewrite**

| Factor | Refactor | Keep HTML |
|--------|----------|-----------|
| **Consistency** | Uses same build system, TypeScript, Next.js features | Inconsistent tech stack |
| **Maintainability** | Single codebase, shared components | Separate deployment concern |
| **Performance** | Bundled, optimized, no CDN dependency | CDN latency, larger initial load |
| **Developer Experience** | Hot reload, TypeScript, IDE support | Manual browser refresh |
| **Deployment** | Single Railway deployment | Separate static hosting needed |
| **Effort** | ~2-4 hours (extraction + TypeScript) | Zero |

**Bottom line:** The HTML file is already React code - refactoring is essentially extracting it into a `.tsx` file and adding types. The effort is low and the consistency benefits are high.

### 5.3 Authentication Strategy

Two patterns available:

**Pattern A: Global Auth (current)**
- All routes protected except `/login`
- Simple, secure, but inflexible

**Pattern B: Per-Route Auth**
- Some routes public, some protected
- More complex middleware logic
- Better for mixed content

**Recommendation: Pattern B with route-based config**

```typescript
// middleware.ts
const PUBLIC_ROUTES = ['/login', '/api/health'];
const PROTECTED_PREFIXES = ['/decks', '/proposals'];

// Check if route needs auth based on config
```

---

## 6) Clarifications

The following decisions would help refine the implementation:

### 1. Landing Page Strategy
**Question:** What should `/decks` and `/proposals` show?
- **Option A:** Index listing all available decks/proposals
- **Option B:** Redirect to most recent/featured item
- **Option C:** 404 (only direct links work)
- **Recommendation:** Option A - professional index pages

### 2. Authentication Scope
**Question:** Should all decks and proposals require authentication?
- **Option A:** Yes, all content protected
- **Option B:** Some public, some protected (per-item basis)
- **Option C:** Different passwords for different sections
- **Recommendation:** Option A initially for simplicity

### 3. URL Slug Format
**Question:** How should individual items be identified?
- **Option A:** Descriptive slugs: `/decks/tradeblock-ai-inflection-2025`
- **Option B:** Short IDs: `/decks/tb-ai-25`
- **Option C:** Entity-prefixed: `/decks/tradeblock/ai-inflection-2025`
- **Recommendation:** Option A - clear, memorable, SEO-friendly

### 4. PLYA Proposal Client Name
**Question:** Should the URL expose the client name?
- **Option A:** `/proposals/plya-project-2024`
- **Option B:** `/proposals/project-alpha` (anonymized)
- **Option C:** Token-based access (no slug in URL)
- **Recommendation:** Depends on client sensitivity - clarify with user

### 5. Existing Deck Migration
**Question:** Should the current `/` route (TradeblockDeck) move?
- **Option A:** Move to `/decks/tradeblock-ai-inflection`, redirect `/` to it
- **Option B:** Keep at `/` as homepage, also available at `/decks/...`
- **Option C:** Move completely, `/` becomes landing page
- **Recommendation:** Option C - cleaner architecture

---

## 7) Proposed Architecture

```
app/
├── layout.tsx                    # Root layout (fonts, global styles)
├── page.tsx                      # Landing page (33strategies.ai/)
├── login/
│   └── page.tsx                  # Login form
├── api/
│   ├── auth/route.ts             # Auth endpoint
│   └── health/route.ts           # Health check
├── decks/
│   ├── layout.tsx                # Deck-specific layout (optional)
│   ├── page.tsx                  # Index: list all decks
│   └── [slug]/
│       └── page.tsx              # Dynamic deck renderer
└── proposals/
    ├── layout.tsx                # Proposal-specific layout (optional)
    ├── page.tsx                  # Index: list all proposals
    └── [slug]/
        └── page.tsx              # Dynamic proposal renderer

components/
├── decks/
│   ├── TradeblockAIInflection.tsx
│   └── TradeblockBoardUpdate.tsx
├── proposals/
│   └── PLYAProposal.tsx          # Migrated from HTML
├── shared/
│   ├── Section.tsx
│   ├── RevealText.tsx
│   ├── ProgressBar.tsx
│   └── NavDots.tsx
└── ui/
    └── ServiceCard.tsx           # Extracted from PLYA

lib/
├── session.ts                    # Auth config
├── decks.ts                      # Deck metadata/registry
└── proposals.ts                  # Proposal metadata/registry

middleware.ts                     # Updated for /decks, /proposals routes
```

### Content Registry Pattern

```typescript
// lib/decks.ts
export const decks = {
  'tradeblock-ai-inflection': {
    title: 'Tradeblock: The AI Inflection',
    description: 'Investor pitch deck for Tradeblock AI transformation',
    component: 'TradeblockAIInflection',
    entity: 'tradeblock',
    date: '2025-11',
    protected: true,
  },
  // ... more decks
};

// lib/proposals.ts
export const proposals = {
  'plya-project': {
    title: 'PLYA Project Proposal',
    description: 'Interactive consulting proposal for PLYA',
    component: 'PLYAProposal',
    client: 'PLYA',
    date: '2024-12',
    protected: true,
  },
  // ... more proposals
};
```

---

## 8) Implementation Tasks (High-Level)

### Phase 1: Route Structure (Core)
1. Create `/decks` route group with index page
2. Create `/proposals` route group with index page
3. Create dynamic `[slug]` routes for both
4. Update middleware for new route patterns
5. Create content registry files (`lib/decks.ts`, `lib/proposals.ts`)

### Phase 2: Content Migration
1. Move TradeblockDeck to `components/decks/TradeblockAIInflection.tsx`
2. Extract PLYA proposal to `components/proposals/PLYAProposal.tsx`
3. Add TypeScript types to PLYA components
4. Wire up dynamic routes to content registry

### Phase 3: Landing Pages
1. Create root landing page for 33strategies.ai
2. Create deck index page (`/decks`)
3. Create proposals index page (`/proposals`)
4. Update navigation/linking

### Phase 4: Polish
1. Test all routes and auth flows
2. Verify Railway deployment
3. Update any existing links/bookmarks
4. Add metadata for SEO

---

## 9) Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing bookmarks to `/` | Medium | High | Implement redirect from `/` to new location |
| PLYA TypeScript conversion issues | Low | Medium | Component is already clean React, minimal type additions needed |
| Middleware complexity increase | Medium | Low | Keep logic simple, test thoroughly |
| Railway routing issues | Medium | Low | Test deployment before switching DNS |

---

## 10) Decision Summary

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Route structure | Regular folders (`/decks/[slug]`) | Clear URLs, client-side nav, landing pages |
| PLYA refactor | Yes - migrate to TSX | Already React, consistency benefits, low effort |
| Auth pattern | Per-route with protected prefixes | Flexibility for future mixed content |
| Landing pages | Index listings | Professional, discoverable |
| Current `/` route | Move to `/decks/...`, new landing at `/` | Clean architecture |

---

## Next Steps

1. User reviews and approves clarification decisions above
2. Generate detailed specification from this ideation
3. Execute implementation in phases
4. Deploy and verify on Railway
