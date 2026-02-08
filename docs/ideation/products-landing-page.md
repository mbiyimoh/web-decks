# Products Landing Page

**Slug:** products-landing-page
**Author:** Claude Code
**Date:** 2026-01-20
**Branch:** feature/products-landing
**Related:** M33T deck (`client-proposals-and-presentations/WSBC/M33T-Platform-Deck-v2 copy.jsx`)

---

## 1) Intent & Assumptions

**Task brief:** Create a `/products` landing page that indexes, explains, promotes, and links to all 33 Strategies products: Talking Docs (LIVE), Better Contacts (LIVE), M33T (BY REQUEST), and Marketing Automation Platform (BETA). Each product should have a header, subheading, 2-3 benefit bullets, status badge, wireframe suggestions, and CTA links.

**Assumptions:**
- Products link to external domains (talkingdocs.ai, bettercontacts.ai) except M33T and Marketing Automation which are request-based
- Content summaries will be provided separately from other project directories
- Design should follow 33 Strategies brand (dark theme, gold accents, premium scrollytelling feel)
- Status badges need custom states: AVAILABLE, BY REQUEST, BETA
- Page should be a marketing-focused showcase, not a functional dashboard
- Each product may eventually have its own detail page, but MVP is a single showcase page

**Out of scope:**
- Individual product detail pages within this codebase
- Authentication or gated access
- Dynamic data from database (static content for now)
- Pricing information
- Integration with external product APIs

---

## 2) Pre-reading Log

- `app/page.tsx`: Simple wrapper that imports LandingPage component, uses metadata export
- `components/landing/LandingPage.tsx`: Hero-style landing with geometric animation, motion reveals, centered content
- `components/portal/design-tokens.ts`: Canonical color values (GOLD, GREEN, BLUE, RED + dims, backgrounds)
- `components/portal/StatusPill.tsx`: Reusable status badge with dot + label, configurable colors
- `components/deck/Section.tsx`: Full-viewport scroll section wrapper (referenced in explore)
- `components/deck/RevealText.tsx`: Scroll-triggered fade-in animation
- `client-proposals-and-presentations/WSBC/M33T-Platform-Deck-v2 copy.jsx`: Rich example of provocative copy, scrollytelling structure, iPhone mockups, match cards
- `.claude/skills/33-strategies-frontend-design.md`: Authoritative design spec (fonts, colors, patterns)

---

## 3) Codebase Map

**Primary components/modules:**
- `app/products/page.tsx` (to create) — Route handler
- `app/products/ProductsPageClient.tsx` (to create) — Main client component
- `components/products/ProductCard.tsx` (to create) — Individual product showcase card
- `components/products/ProductStatusBadge.tsx` (to create) — Product-specific status variants

**Shared dependencies:**
- `components/deck/` — Section, RevealText, SectionLabel, ProgressBar
- `components/portal/design-tokens.ts` — Color constants
- `framer-motion` — Animation library
- Font stack: Instrument Serif (display), DM Sans (body), JetBrains Mono (labels)

**Data flow:**
- Static product data defined in `lib/products.ts` or inline
- No database queries needed for MVP
- External links to product domains

**Feature flags/config:**
- None needed for MVP

**Potential blast radius:**
- Low — New route, no changes to existing pages
- May want to add navigation link from main landing page later

---

## 4) Root Cause Analysis

N/A — This is a new feature, not a bug fix.

---

## 5) Research

### Potential Solutions

#### Option A: Single-Page Scrollytelling Showcase
**Description:** Full scrollytelling experience where each product is a full-viewport section with animated reveals, similar to M33T deck.

**Pros:**
- Immersive, premium feel aligned with 33 Strategies brand
- Each product gets dedicated attention
- Can showcase wireframes/mockups per product
- Leverages existing deck components

**Cons:**
- Longer scroll, may feel heavy for 4 products
- More complex to add/remove products
- Requires more content per product

#### Option B: Card Grid Landing
**Description:** Hero section + grid of product cards below, each card expandable or linking to detail.

**Pros:**
- Quick scannable overview
- Easy to add/remove products
- Familiar pattern (like CourseCard in learning)
- Less content needed per product

**Cons:**
- Less immersive/premium
- Products compete for attention
- May feel more "list" than "showcase"

#### Option C: Hybrid Approach (Recommended)
**Description:** Hero section with brand moment, then a "curated grid" of product cards with hover states and status badges. Each card has enough detail to be compelling but doesn't require scroll-per-product.

**Pros:**
- Balances premium feel with scanability
- Products are prominently featured but digestible
- Status badges clearly communicate availability
- Easy to extend with individual product pages later
- Can still use RevealText for staggered animations

**Cons:**
- Requires thoughtful card design to feel premium
- Needs careful visual hierarchy

### Recommendation

**Option C: Hybrid Approach** — Create a hero section with the geometric animation and brand messaging, followed by a curated grid of ProductCards. Each card should have:
- Status badge (top right)
- Product name + tagline
- 2-3 bullet points
- Primary CTA button
- Hover state with gold border glow

This approach balances the premium scrollytelling DNA of the site with practical scannability for a products showcase.

---

## 6) Clarification Needed

1. **Hero messaging:** What headline/tagline should the hero section use? Options:
   - "Tools built for clarity" (aligns with Clarity Canvas)
   - "The 33 Strategies Platform" (umbrella brand)
   - "AI-powered tools for founders" (functional)
   - Something else?
   >> AI-first Tools Built For Operators By Operators

2. **Card layout preference:**
   - 2x2 grid (equal prominence)?
   - Featured product (Talking Docs or Better Contacts) larger, others below?
   - Single column stack?
   >> all the same size, but I imagine each as a full-width thing that takes up about a 40% of a scroll (so 2-3 visible at a time), with 1/3 of the width of each going to name, tagline, status; 1/3rd going to the 2-3 bullets about the product and the pain point it sovles / the thing is does 10x better than current alternatives; and 1/3rd going to the product imagery

3. **Wireframe/mockup images:** Do you want placeholder slots for product screenshots/mockups, or should I design without images for now (copy-focused)?
>> placeholders for now, but specific placholders for the following:
- for talking docs: 1 desktop mockup, 1 mobile mockup (both showing the document reader / viewer experience)
- for better contacts: 2 mobile mockups (1. enrich a contact via voice; 2. enrich a contact via research) and 1 desktop (explore your contacts via chat)
- for m33t: 2 mobile mockups (1. the pre-event interview; 2. the pre-event curated matches screen)
- for marketing automation: 2 desktop mockups (1 for initial campaign creation page, 1 for drag+drop campaign editor)

4. **CTA destinations:**
   - AVAILABLE products → External link (talkingdocs.ai, bettercontacts.ai)? >> yes and yes
   - BY REQUEST (M33T) → Contact form? Email? Calendly? >> link to a (new) centralized 33 strategies contact form where they ahve to put in their name and email + an "I'm interested in" section that includes all four product at the top (with a checked checkbox next to the relevant product), but also additional boxes for, "Hard Reset: 33-Day AI Transformation (We... [concisely describe our 3-layer model of leaving clients with: 1) extensive business context; 2) core data connections and automation; and 3) an educated team thats thinking about whats possible in a whole new way] )" and "AI-driven development services (We help you build things like a traditional dev firm would ... just better, faster, and cheaper.)" ..... all of which ultimately sends a note to "whatsgood@33strategies.ai"
   - BETA (Marketing Automation) → Interest form? Email? >> same as above re: contact form
   

5. **Navigation integration:** Should this page be linked from the main landing page (`33strategies.ai`), or is it a standalone route for now?
>> yes, this should be 33strategies.ai/products

---

## 7) Product Content Structure (Template)

While awaiting the full content summaries from other projects, here's the data structure each product card will need:

```typescript
interface Product {
  id: string;
  name: string;
  tagline: string;           // 1 provocative line
  description: string;       // 1-2 sentences
  bullets: string[];         // 2-3 benefit bullets
  status: 'available' | 'by-request' | 'beta';
  externalUrl?: string;      // For AVAILABLE products
  ctaLabel: string;          // "Try Talking Docs", "Request Access", etc.
  ctaAction: 'link' | 'email' | 'form';
  wireframes?: string[];     // Optional: paths to mockup images
}
```

### Placeholder Content (to be replaced)

#### Talking Docs
- **Tagline:** "Your documents want to talk. Let them."
- **Status:** AVAILABLE
- **URL:** talkingdocs.ai

#### Better Contacts
- **Tagline:** "Your contacts are flat. Give them some depth."
- **Status:** AVAILABLE
- **URL:** bettercontacts.ai

#### M33T
- **Tagline:** "The right people. The right context. Before you arrive."
- **Status:** BY REQUEST
- **Inspiration from deck:** "What if you knew exactly who to meet before you walked in?"

#### Marketing Automation Platform
- **Tagline:** "Intelligent outreach at scale."
- **Status:** BETA

---

## 8) Proposed File Structure

```
app/
  products/
    page.tsx                    # Route with metadata
    ProductsPageClient.tsx      # Main client component

components/
  products/
    ProductCard.tsx             # Individual product card
    ProductStatusBadge.tsx      # Status badge variants
    ProductsHero.tsx            # Hero section (optional)

lib/
  products.ts                   # Product data definitions
```

---

## 9) Status Badge Design

Extending the existing StatusPill pattern:

```typescript
export const PRODUCT_STATUS = {
  'available': {
    color: '#4ade80',  // GREEN
    bg: 'rgba(74, 222, 128, 0.15)',
    label: 'AVAILABLE'
  },
  'by-request': {
    color: '#60a5fa',  // BLUE
    bg: 'rgba(96, 165, 250, 0.15)',
    label: 'BY REQUEST'
  },
  'beta': {
    color: '#d4a54a',  // GOLD
    bg: 'rgba(212, 165, 74, 0.15)',
    label: 'BETA'
  },
} as const;
```

---

## 10) Next Steps

1. **User provides clarifications** (Section 6)
2. **User provides product content** from other project directories
3. **Create spec document** with finalized design
4. **Implement** following spec

---

## 11) Visual Concept Sketch

```
┌─────────────────────────────────────────────────────────────┐
│  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  (progress bar, gold)  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ◦   ◦   ◦   ◦                           │
│                  ◦           ◦                             │
│                ◦    [33]      ◦   (geometric animation)    │
│                  ◦           ◦                             │
│                    ◦   ◦   ◦   ◦                           │
│                                                             │
│              OUR PRODUCTS (gold label)                      │
│                                                             │
│           The 33 Strategies Platform                        │
│         AI-powered tools for founders                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────┐    ┌───────────────────┐            │
│  │ ● AVAILABLE       │    │ ● AVAILABLE       │            │
│  │                   │    │                   │            │
│  │ Talking Docs      │    │ Better Contacts   │            │
│  │ ─────────────     │    │ ─────────────     │            │
│  │ Your documents    │    │ Your contacts are │            │
│  │ want to talk.     │    │ flat. Give them   │            │
│  │                   │    │ some depth.       │            │
│  │ • Bullet one      │    │ • Bullet one      │            │
│  │ • Bullet two      │    │ • Bullet two      │            │
│  │                   │    │                   │            │
│  │ [Try Talking Docs]│    │ [Try Better...]   │            │
│  └───────────────────┘    └───────────────────┘            │
│                                                             │
│  ┌───────────────────┐    ┌───────────────────┐            │
│  │ ● BY REQUEST      │    │ ● BETA            │            │
│  │                   │    │                   │            │
│  │ M33T              │    │ Marketing         │            │
│  │ ─────────────     │    │ Automation        │            │
│  │ The right people. │    │ ─────────────     │            │
│  │ The right context.│    │ Intelligent       │            │
│  │                   │    │ outreach at scale │            │
│  │ • Bullet one      │    │ • Bullet one      │            │
│  │ • Bullet two      │    │ • Bullet two      │            │
│  │                   │    │                   │            │
│  │ [Request Access]  │    │ [Join Waitlist]   │            │
│  └───────────────────┘    └───────────────────┘            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              © 2025 33 Strategies                           │
└─────────────────────────────────────────────────────────────┘
```

---

*Ready for user feedback on clarifications and product content.*
