# 33 Strategies Landing Page Redesign

**Slug:** landing-page-redesign
**Author:** Claude Code
**Date:** 2026-02-07
**Branch:** feature/landing-page-redesign
**Related:** `docs/reference/landing-page-alpha-prototype/33strategies-homepage.jsx`, `.claude/skills/33-strategies-frontend-design.md`, `.claude/skills/mobile-first-design.md`

---

## 1) Intent & Assumptions

**Task brief:** Transform the existing landing page prototype—which has strong content and narrative flow—from a "slide deck" feel into a premium, spatially-designed web experience that makes content breathe, uses smart visual hierarchy, incorporates brand-signature animations (particles, gold glows), and references the products suite. **Design mobile-first**, recognizing that most visitors will discover this page on mobile devices.

**Assumptions:**
- The existing copy is final and should not be changed
- The narrative progression (Hero → Three Pillars → Drudgery → Two Things → 3-Layer Stack → Long View → CTA) is fixed
- We have access to the 33 Strategies design system (gold accents, dark theme, Instrument Serif/DM Sans/JetBrains Mono)
- Products will be referenced on this page with a CTA leading to `/products` for details
- The page should feel like a premium consulting/agency site, not a SaaS landing page
- **Mobile is the primary design target** — desktop is the progressive enhancement
- **75%+ of traffic will come from mobile devices**

**Out of scope:**
- Changing any of the written copy
- Reordering the narrative sections
- Building the full `/products` page (already exists)
- Creating actual product screenshots/mockups (placeholders only)

---

## 2) Pre-reading Log

- `docs/reference/landing-page-alpha-prototype/33strategies-homepage.jsx`: Full prototype with all sections, uses RevealText pattern, staggered animations, drudgery carousel, gold `G` component for "you/your" highlighting
- `docs/reference/landing-page-alpha-prototype/33_Strategies_Homepage_Handoff.md`: Comprehensive design spec—colors, typography, animation patterns, section-by-section breakdown
- `.claude/skills/33-strategies-frontend-design.md`: Brand guidelines—gold #d4a54a, dark backgrounds, typography stack, component patterns, motion philosophy
- `.claude/skills/web-design-best-practice.md`: Vercel-style interface guidelines—accessibility, focus states, animation performance, typography rules
- `app/products/ProductsPageClient.tsx`: Products page structure with hero + product cards
- `lib/products.ts`: 4 products defined (Talking Docs, Better Contacts, M33T, Marketing Machine)
- `components/products/ProductCard.tsx`: Existing card component with device mockups, benefit icons, status badges

---

## 3) Codebase Map

**Primary components/modules:**
- `app/page.tsx` — Route handler (will import new LandingPage component)
- `components/landing/LandingPage.tsx` — New landing page client component
- `components/landing/sections/` — Section-specific components (Hero, Pillars, etc.)
- `components/landing/particles/` — Particle animation system

**Shared dependencies:**
- `framer-motion` — All animations
- `components/deck/RevealText.tsx` — Scroll-triggered reveals
- `lib/design-tokens.ts` — Color constants
- `lib/products.ts` — Product data for Products Preview section

**Data flow:**
- Static content defined inline or in constants
- Product data imported from `lib/products.ts`
- No database queries

**Potential blast radius:**
- `app/page.tsx` will be replaced
- Current `components/landing/LandingPage.tsx` may be refactored or replaced

---

## 4) Root Cause Analysis

N/A — This is a design enhancement, not a bug fix.

---

## 5) Research Findings

### Animation Best Practices (from Framer Motion Skill)

1. **Scroll-triggered reveals** — Use `useInView` with customizable margins for revealing content as users scroll
2. **Stagger patterns** — Parent containers orchestrate child animations via `staggerChildren` and `delayChildren`
3. **Spring physics** — More natural feel than tween; use `stiffness: 300-400, damping: 20-25` for responsive interactions
4. **GPU-only properties** — Animate only `opacity` and `transform` for performance
5. **Reduced motion** — Always implement `useReducedMotion` hook for accessibility

### Web Interface Guidelines (from best practices skill)

1. **Typography** — Use `…` not `...`, curly quotes, `tabular-nums` for numbers, `text-wrap: balance` for headlines
2. **Animation** — Honor `prefers-reduced-motion`, never `transition: all`, set `transform-origin` correctly
3. **Accessibility** — Proper heading hierarchy (h1 for hero, h2 for sections), ARIA labels on interactive elements
4. **Performance** — Preload fonts, use `will-change` sparingly, lazy-load below-fold sections

### Design Patterns for Premium Landing Pages

1. **Negative space** — Generous padding creates luxury feel; content shouldn't feel cramped
2. **Grid systems** — 12-column grid allows flexible layouts while maintaining alignment
3. **Visual hierarchy** — 3-level system: Display (72-96px) → Section (40-56px) → Body (18-20px)
4. **Micro-interactions** — Subtle hover states, scroll progress indicators, element reveals
5. **Particle backgrounds** — Ambient motion adds depth without distraction

### Recommendation

Implement a **section-based modular architecture** with:
- Each section as an independent component with its own reveal logic
- A global particle canvas that renders behind all content
- Smart grid layouts that adapt content to available space
- Generous vertical rhythm (128-160px between major sections)
- Staggered reveals within each section for visual interest

---

## 6) Clarification (Resolved)

1. **Particle system complexity:** CSS orbs + subtle parallax as baseline, iterate to canvas if needed ✓

2. **Products preview treatment:** Show 3 products (BetterContacts, MarketingMachine, TalkingDocs) + CTA to `/products` ✓

3. **Mobile behavior:** Simplified effects on mobile (both glow AND particles represented minimally) ✓

4. **Hero CTA:** No CTA in hero — just scroll indicator. Trust the narrative flow. ✓

5. **Content density:** Keep all 3 pillars stacked/visible (no carousel). Use progressive disclosure ("Read more") where helpful. Reduce drudgery items on mobile. ✓

6. **Sticky CTA:** Implement sticky "Work with us" button that appears after hero, anchor-links to CTA section. ✓

7. **Performance:** Prioritize wow-factor while using all available optimization patterns. ✓

---

## 7) Mobile-First Design Philosophy

### Core Principle

**Design for 375px first, enhance for larger screens.** Mobile is not a degraded desktop experience — it's the primary experience.

### Mobile-First Means:

1. **Start with constraints** — Single column, touch targets, thumb zones
2. **Add complexity progressively** — Multi-column layouts, particles, hover states are desktop enhancements
3. **Performance is non-negotiable** — Fast FCP/LCP on 4G, minimal JS blocking
4. **Touch > Mouse** — All interactions work with tap; hover is bonus

### Key Mobile Stats (Industry Research)

- 75%+ of web traffic comes from mobile devices
- Pages loading in <1s convert 3x better than 5s pages
- 70% of mobile landing pages take >7s to fully load (don't be this)
- 44×44px minimum touch targets (Apple HIG)

### The Mobile-First Wireframe Convention

All section wireframes below show **MOBILE LAYOUT FIRST**, then desktop enhancement. This inverts the original desktop-centric approach.

---

## 8) Proposed Layout Design

### Design Philosophy

Transform the "slide deck" prototype into a **spatial, editorial experience** by:
1. Breaking content across a grid that gives each element room to breathe
2. Using scale contrast (large headlines vs. small context labels) to guide the eye
3. Introducing ambient motion (particles, subtle parallax) for depth
4. Creating "rest moments" between dense information sections
5. **Designing for thumb-zone navigation on mobile**

### Global: Sticky CTA Bar (Mobile)

A fixed bottom bar appears after scrolling past the hero:

```
┌─────────────────────────────────────────┐
│                                         │
│   [ Work with us → ]                    │  ← Thumb-zone accessible
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Hidden during hero section
- Fades in after user scrolls past hero (~100vh)
- Anchor-links to CTA section at bottom of page
- Gold background, black text, full-width on mobile
- Transforms to floating pill on tablet/desktop (optional)

### Section-by-Section Layout

### Section-by-Section Layout

---

### SECTION 1: HERO (Full Viewport)

**Current problem:** Content is centered in a single column—functional but not spatially interesting.

#### Mobile Layout (375px baseline)

```
┌─────────────────────────────────┐
│                                 │
│  [Single gold glow orb]         │
│  [CSS breathing animation]      │
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │ AI gave everyone            ││
│  │ access to great             ││
│  │ answers.                    ││
│  │                             ││
│  │ The advantage               ││  ← Muted
│  │ is now in                   ││
│  │                             ││
│  │ WHO ASKS                    ││  ← Large, white
│  │ BETTER                      ││
│  │ QUESTIONS.                  ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ Every competitor can prompt ││
│  │ the same tools. The tech is ││
│  │ commoditized.               ││
│  │                             ││
│  │ What hasn't been            ││
│  │ commoditized is YOUR        ││  ← Gold
│  │ unique context...           ││
│  │                             ││
│  │ That's the input that makes ││
│  │ AI dangerous.               ││
│  └─────────────────────────────┘│
│                                 │
│         [ ↓ Scroll ]            │
│                                 │
└─────────────────────────────────┘
```

**Mobile specs:**
- Headline: 32-40px, line-height 1.1
- Body: 16-18px, line-height 1.6
- Padding: 24px horizontal
- Single gold glow orb (CSS, not canvas)
- Full viewport height

#### Desktop Enhancement (1024px+)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                         │
│    [PARTICLE FIELD - Subtle gold dots floating, parallax-responsive]                                    │
│                                                                                                         │
│         ╔════════════════════════════════════════════════════════════════════════════════╗              │
│         ║     AI gave everyone access to great answers.                                  ║              │
│         ║     The advantage is now in                           [MUTED]                  ║              │
│         ║     WHO ASKS BETTER QUESTIONS.                        [LARGE]                  ║              │
│         ╚════════════════════════════════════════════════════════════════════════════════╝              │
│                                                                                                         │
│                            [GOLD RADIAL GLOW - breathing animation]                                     │
│                                                                                                         │
│    ┌──────────────────────────────────────────────────────────────────────────────────────┐             │
│    │  Every competitor can prompt the same tools. The technology is commoditized.        │             │
│    │  What hasn't been commoditized is YOUR unique context — the way YOU think           │             │
│    │  about YOUR market, YOUR customers, YOUR strategy.                                  │             │
│    │  That's the input that makes AI dangerous.                                          │             │
│    └──────────────────────────────────────────────────────────────────────────────────────┘             │
│                                                                                                         │
│                               [ ↓ Scroll indicator ]                                                    │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop enhancements:**
- Headline: 72-96px
- Canvas particle system enabled
- Larger glow with parallax response
- More generous spacing

**Animation sequence:**
1. Glow fades in immediately (CSS)
2. Headline reveals line-by-line (staggered 0.2s)
3. Supporting paragraph fades up (0.6s delay)
4. Scroll indicator bobs continuously
5. **Desktop only:** Particles fade in after content (0.5s delay)

---

### SECTION 2: THREE PILLARS (What We Do)

**Current problem:** Cards stacked horizontally compete for attention; bridging headline runs too long.

#### Mobile Layout (375px baseline)

```
┌─────────────────────────────────┐
│                                 │
│ 01 — WHAT WE DO                 │  ← Gold, mono
│                                 │
│ ┌─────────────────────────────┐ │
│ │ We capture YOUR unique      │ │
│ │ context and unleash it on   │ │
│ │ YOUR business — while       │ │
│ │ eliminating the intellectual│ │
│ │ drudgery that limits the    │ │
│ │ time and headspace YOU have │ │
│ │ for the work that matters.  │ │
│ └─────────────────────────────┘ │
│                                 │
│      Three ways in:             │
│            │                    │
│            ▼                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 01  AI CONSULTING           │ │
│ │     & UPSKILLING            │ │
│ │ ────────────────────        │ │
│ │ Engagements that ship real  │ │
│ │ outcomes AND teach your     │ │
│ │ team to think AI-first.     │ │
│ │                             │ │
│ │      Learn more →           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 02  DEV FIRM +              │ │
│ │     CO-FOUNDER              │ │
│ │ ────────────────────        │ │
│ │ For founders with vision    │ │
│ │ but limited build capacity. │ │
│ │ Strategy, design, dev, AI.  │ │
│ │                             │ │
│ │      Learn more →           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [INCLUDED BADGE]            │ │
│ │ 03  PRODUCTS THAT           │ │
│ │     WORK FOR YOU            │ │
│ │ ────────────────────        │ │
│ │ Tools born from our own     │ │
│ │ workflows — included with   │ │
│ │ every engagement.           │ │
│ │                             │ │
│ │      Learn more →           │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Mobile specs:**
- All 3 cards fully visible (stacked, no carousel)
- Touch target for "Learn more" is full card tap
- 48px minimum tap target height
- 16px gap between cards

#### Desktop Enhancement (1024px+)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                       │
│  01 — WHAT WE DO                                                                                      │
│                                                                                                       │
│  We capture YOUR unique context and unleash it on YOUR business — while eliminating                  │
│  the intellectual drudgery that limits the time and headspace YOU have for the work that matters.    │
│                                                                                                       │
│                                Three ways in:                                                         │
│                                      │                                                                │
│                                      ▼                                                                │
│                                                                                                       │
│  ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐│
│  │ 01  AI CONSULTING             │ │ 02  DEV FIRM + CO-FOUNDER     │ │ [INCLUDED] 03  PRODUCTS       ││
│  │     & UPSKILLING              │ │     AS A SERVICE              │ │     THAT WORK FOR YOU         ││
│  │ ────────────────────          │ │ ────────────────────          │ │ ────────────────────          ││
│  │                               │ │                               │ │                               ││
│  │ Engagements that ship real    │ │ For founders with strong      │ │ Tools born from our own       ││
│  │ outcomes AND teach your team  │ │ vision but limited build      │ │ workflows that kill drudgery  ││
│  │ to think and build AI-first.  │ │ capacity. We're your tech     │ │ and extend your best          ││
│  │                               │ │ co-founder from zero to one.  │ │ thinking — included.          ││
│  │                               │ │                               │ │                               ││
│  │      Learn more →             │ │      Learn more →             │ │      Learn more →             ││
│  └───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘│
│                                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop enhancements:**
- 3-column grid layout
- Hover: lift + gold border glow
- Equal height cards via flexbox
- Staggered entrance animation (0.12s delay each)

**Animation sequence:**
1. Section label slides in from left
2. Headline reveals line-by-line
3. "Three ways in" fades up
4. Cards stagger in (mobile: top-to-bottom; desktop: left-to-right)

---

### SECTION 3: DRUDGERY CAROUSEL (The Problem)

**Current problem:** The carousel works but feels isolated; the content is rich but presentation is passive.

#### Mobile Layout (375px baseline)

```
┌─────────────────────────────────┐
│                                 │
│ 02 — THE PROBLEM                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │ YOU'VE ALREADY              │ │
│ │ DONE THE                    │ │
│ │ HARD THINKING.              │ │
│ │                             │ │
│ │ You just keep               │ │  ← Muted
│ │ having to redo it.          │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ You've built frameworks     │ │
│ │ that work. You know your    │ │
│ │ customers. But somehow most │ │
│ │ of your day is still spent  │ │
│ │ on intellectual drudgery:   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Fade top]                  │ │
│ │                             │ │
│ │ ● "Reviewing meeting notes  │ │
│ │    hours later trying to    │ │
│ │    remember what was said"  │ │  ← 50% opacity
│ │                             │ │
│ ├─────────────────────────────┤ │
│ │                             │ │
│ │ ● "Manually logging to-dos  │ │
│ │    and status updates one   │ │
│ │    by one — when you        │ │  ← ACTIVE (100%)
│ │    remember to"             │ │
│ │                             │ │
│ ├─────────────────────────────┤ │
│ │                             │ │
│ │ ● "Posting a single tweet   │ │
│ │    because that's all your  │ │
│ │    team has bandwidth for"  │ │  ← 50% opacity
│ │                             │ │
│ │ [Fade bottom]               │ │
│ └─────────────────────────────┘ │
│                                 │
│        ● ○ ○ ○ ○ ○              │  ← Progress dots
│                                 │
└─────────────────────────────────┘
```

**Mobile specs:**
- **Reduced drudgery items:** Show 6 items on mobile (not 12) — enough to feel relatable without overwhelming
- Auto-advances every 4s (slower than desktop for readability)
- Swipe-enabled for manual control
- Progress dots for position awareness
- Pause on touch

#### Desktop Enhancement (1024px+)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                       │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────────────────────────────────────┐ │
│  │                                         │  │                                                     │ │
│  │  02 — THE PROBLEM                       │  │  ┌─────────────────────────────────────────────────┐│ │
│  │                                         │  │  │  ● "Reviewing meeting notes hours later..."    ││ │
│  │  YOU'VE ALREADY                         │  │  ├─────────────────────────────────────────────────┤│ │
│  │  DONE THE                               │  │  │  ● "Manually logging to-dos..."     [ACTIVE]   ││ │
│  │  HARD THINKING.                         │  │  ├─────────────────────────────────────────────────┤│ │
│  │                                         │  │  │  ● "Posting a single tweet..."                 ││ │
│  │  You just keep                          │  │  └─────────────────────────────────────────────────┘│ │
│  │  having to redo it.                     │  │                                                     │ │
│  │                                         │  │                    [Progress dots: ● ○ ○ ○ ...]    │ │
│  │  You've built frameworks that work...   │  │                                                     │ │
│  │                                         │  │                                                     │ │
│  └─────────────────────────────────────────┘  └─────────────────────────────────────────────────────┘ │
│                                                                                                       │
│           [FIXED LEFT]                                    [SCROLLING RIGHT]                           │
│                                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop enhancements:**
- Split-screen layout (fixed left, carousel right)
- Full 12 drudgery items
- Auto-advances every 3s
- Pause on hover
- Mouse position parallax effect on items

**Animation sequence:**
1. Left content reveals first (mobile: headline section)
2. Carousel fades in after 0.3s delay
3. Carousel items cycle with AnimatePresence

---

### SECTION 4: THE TWO THINGS (The Promise)

**Current problem:** Both "things" compete visually; needs stronger differentiation and visual breathing room.

**Proposed layout — Vertical Emphasis with Visual Break:**

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                       │
│                              03 — THE PROMISE                                                         │
│                                                                                                       │
│                              ───────────────────────                                                  │
│                                                                                                       │
│                  We build AI systems that do two things simultaneously.                               │
│                                                                                                       │
│                                                                                                       │
│  ╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗│
│  ║                                                                                                   ║│
│  ║                                                                                                   ║│
│  ║                                    KILL THE DRUDGERY.                                             ║│
│  ║                                    ──────────────────                                             ║│
│  ║                                                                                                   ║│
│  ║          The reformatting, the re-explaining, the context-reloading,                              ║│
│  ║          the manual labor between YOUR thinking and its execution —                               ║│
│  ║          automated out of existence. What remains is the rich, creative,                          ║│
│  ║          decision-making work YOU're actually here to do.                                         ║│
│  ║                                                                                                   ║│
│  ║                                                                                                   ║│
│  ╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝│
│                                                                                                       │
│                                           │                                                           │
│                                           │  ← Gold vertical line (48px)                              │
│                                           │                                                           │
│                                                                                                       │
│  ╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗│
│  ║                                                                                                   ║│
│  ║                                                                                                   ║│
│  ║               MAKE YOUR BEST THINKING SHOW UP EVERYWHERE.                                         ║│
│  ║               ───────────────────────────────────────────                                         ║│
│  ║                                                                                                   ║│
│  ║          YOUR voice. YOUR strategy. YOUR decision-making frameworks.                              ║│
│  ║          Injected into every workflow, every draft, every analysis.                               ║│
│  ║          Automatically. Without YOU having to bring it each time.                                 ║│
│  ║                                                                                                   ║│
│  ║                                                                                                   ║│
│  ╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝│
│                                                                                                       │
│                                                                                                       │
│                  The result: AI that doesn't just execute tasks faster.                               │
│                  AI that executes them THE WAY YOU WOULD — if you had                                 │
│                  unlimited time and perfect memory.                                                   │
│                                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Glass card containers** — Each "thing" is in its own subtle glass card for definition
- **Gold vertical divider** — Visual connector between the two (not horizontal)
- **Headline scale** — "Kill the drudgery" and "Make your best thinking..." are largest text in section
- **Closing statement** — "the way YOU would" in gold italic stands out
- **Generous padding** — 64-80px between elements

**Animation sequence:**
1. Section label + intro reveal
2. First card slides up
3. Gold divider draws downward (center-origin)
4. Second card slides up
5. Closing statement fades in

---

### SECTION 5: 3-LAYER STACK (How It Works)

**Current problem:** Vertical stack works but feels like a list, not a visual architecture.

**Proposed layout — Stacked Layers with Visual Depth:**

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                       │
│  04 — HOW IT WORKS                                                                                    │
│                                                                                                       │
│  Every system we build sits on three layers.                                                          │
│                                                                                                       │
│                                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                                                   ││
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  ││
│  │  │                                                                                             │  ││
│  │  │   03   AI APPS LAYER                                                                        │  ││
│  │  │   ──   ─────────────                                                                        │  ││
│  │  │                                                                                             │  ││
│  │  │   Applications that don't just execute tasks — they execute them your way,                  │  ││
│  │  │   drawing on everything below.                                                              │  ││
│  │  │                                                                                             │  ││
│  │  └─────────────────────────────────────────────────────────────────────────────────────────────┘  ││
│  │      │                                                                                            ││
│  │      │  ← Connector line                                                                          ││
│  │      │                                                                                            ││
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  ││
│  │  │                                                                                             │  ││
│  │  │   02   DATA CONNECTIONS LAYER                                                               │  ││
│  │  │   ──   ───────────────────────                                                              │  ││
│  │  │                                                                                             │  ││
│  │  │   Clean integrations to the systems that run your business.                                 │  ││
│  │  │   One source of truth, not twelve tabs.                                                     │  ││
│  │  │                                                                                             │  ││
│  │  └─────────────────────────────────────────────────────────────────────────────────────────────┘  ││
│  │      │                                                                                            ││
│  │      │                                                                                            ││
│  │      │                                                                                            ││
│  │  ╔═════════════════════════════════════════════════════════════════════════════════════════════╗  ││
│  │  ║                                                                                             ║  ││
│  │  ║   01   BUSINESS CONTEXT LAYER                     [GOLD GLOW]                               ║  ││
│  │  ║   ──   ──────────────────────                                                               ║  ││
│  │  ║                                                                                             ║  ││
│  │  ║   We capture how you think, how you operate, who your customers are,                        ║  ││
│  │  ║   what your voice sounds like, how you make decisions.                                      ║  ││
│  │  ║   A living foundation that gets richer with every interaction.                              ║  ││
│  │  ║                                                                                             ║  ││
│  │  ╚═════════════════════════════════════════════════════════════════════════════════════════════╝  ││
│  │                                                                                                   ││
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                                       │
│                  And because the foundation is there,                                                 │
│                  YOUR team builds the next ones themselves.                                           │
│                                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Visual stacking** — Layers look literally stacked with subtle shadow/depth
- **Foundation emphasis** — Layer 01 has gold border + subtle glow, positioned at bottom
- **Connector lines** — Vertical lines show the relationship between layers
- **Render order** — Build from bottom up (foundation → data → apps)

**Animation sequence:**
1. Section label + headline reveal
2. Layer 01 (foundation) scales up from 0.95
3. Connector line draws upward
4. Layer 02 scales up
5. Connector line draws upward
6. Layer 03 scales up
7. Closing statement fades in

---

### SECTION 6: THE LONG VIEW (Vision)

**Current problem:** Content is good but feels like another paragraph section, not a climactic moment.

**Proposed layout — Intimate, Focused Typography:**

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                       │
│  [Subtle gradient background shift — darker center, gold tint edges]                                  │
│                                                                                                       │
│                                                                                                       │
│                              05 — THE LONG VIEW                                                       │
│                                                                                                       │
│                              ───────────────────────                                                  │
│                                                                                                       │
│                                                                                                       │
│                                                                                                       │
│          The longer YOU work with our tools, the more they feel like                                  │
│          an extension of YOUR own thinking.                                                           │
│                                                                                                       │
│                                                                                                       │
│                              ─────────────────                                                        │
│                                                                                                       │
│                                                                                                       │
│          Most AI tools reset every time you open them.                                                │
│          They don't know you.                                                                         │
│          Every session starts from zero.                                                              │
│                                                                                                       │
│                                                                                                       │
│          Ours are different.                                                                          │
│                                                                                                       │
│                                                                                                       │
│          The business context layer accumulates —                                                     │
│          YOUR strategy sharpens, YOUR voice clarifies,                                                │
│          YOUR decision-making frameworks get more precise.                                            │
│                                                                                                       │
│          And none of this requires special effort.                                                    │
│          YOU're just doing YOUR work. The system learns from that.                                    │
│                                                                                                       │
│                                                                                                       │
│          Over time, the tools stop feeling like tools.                                                │
│          They feel like working with someone who already knows                                        │
│          everything about YOUR business — because they do.                                            │
│                                                                                                       │
│                                                                                                       │
│                                                                                                       │
│                       ╔═══════════════════════════════════════════════════╗                           │
│                       ║                                                   ║                           │
│                       ║    That's not our moat. That's YOURS.             ║   ← GOLD TEXT             │
│                       ║    ─────────────────────────────────              ║   ← Animated underline    │
│                       ║                                                   ║                           │
│                       ╚═══════════════════════════════════════════════════╝                           │
│                                                                                                       │
│                                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Narrower max-width** — Content feels more intimate (640px vs 768px)
- **Short paragraph breaks** — Each thought on its own line
- **Visual pauses** — Extra spacing between paragraph groups
- **Climactic moment** — "That's not our moat. That's YOURS." centered with animated gold underline
- **Background shift** — Subtle gradient change signals a tonal shift

**Animation sequence:**
1. Each paragraph group reveals with 0.15s stagger
2. Final statement reveals last
3. Gold underline draws from center (width: 0 → 80px, delay 0.3s)

---

### NEW SECTION 6.5: PRODUCTS PREVIEW (Between Long View and CTA)

**Purpose:** Reference the products suite without duplicating the `/products` page.

**Featured products (in order):**
1. **BetterContacts** — AVAILABLE
2. **MarketingMachine** — BETA
3. **TalkingDocs** — AVAILABLE

#### Mobile Layout (375px baseline)

```
┌─────────────────────────────────┐
│                                 │
│ OUR PRODUCTS                    │
│                                 │
│ Tools born from our own         │
│ workflows — included with       │
│ every engagement.               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ BetterContacts              │ │
│ │ ────────────────            │ │
│ │ Your contacts are flat.     │ │
│ │ Give them some depth.       │ │
│ │                             │ │
│ │ ● AVAILABLE                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ MarketingMachine            │ │
│ │ ────────────────            │ │
│ │ Stop recreating campaigns.  │ │
│ │ Drag, swap, ship.           │ │
│ │                             │ │
│ │ ● BETA                      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ TalkingDocs                 │ │
│ │ ───────────                 │ │
│ │ Nobody reads docs.          │ │
│ │ Now they don't have to.     │ │
│ │                             │ │
│ │ ● AVAILABLE                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │   Explore all products →    │ │  ← Links to /products
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Mobile specs:**
- Stacked cards, full-width
- Compact treatment (name, 1-line tagline, status)
- CTA button at bottom leads to `/products`
- Touch target for each card links to external product URL (if AVAILABLE) or `/contact`

#### Desktop Enhancement (1024px+)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                       │
│                              OUR PRODUCTS                                                             │
│                                                                                                       │
│              Tools born from our own workflows — included with every engagement.                      │
│                                                                                                       │
│                                                                                                       │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐              │
│  │                          │ │                          │ │                          │              │
│  │  BetterContacts          │ │  MarketingMachine        │ │  TalkingDocs             │              │
│  │  ──────────────          │ │  ────────────────        │ │  ───────────             │              │
│  │                          │ │                          │ │                          │              │
│  │  Your contacts are flat. │ │  Stop recreating the     │ │  Nobody reads docs.      │              │
│  │  Give them some depth.   │ │  same campaigns. Drag,   │ │  Now they don't have to. │              │
│  │                          │ │  swap, ship.             │ │                          │              │
│  │  ● AVAILABLE             │ │  ● BETA                  │ │  ● AVAILABLE             │              │
│  │                          │ │                          │ │                          │              │
│  └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘              │
│                                                                                                       │
│                            [ Explore all products → ]                                                 │
│                                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop enhancements:**
- 3-column grid layout
- Hover: subtle lift + gold border hint
- Equal height cards

**Animation sequence:**
1. Section label + intro reveal
2. Cards stagger in (0.1s delay each)

---

### SECTION 7: CTA (Conversion)

**Current problem:** Functional but could be more impactful as the final moment.

**Proposed layout:**

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                       │
│  [GOLD RADIAL GLOW - centered, large, breathing animation]                                            │
│                                                                                                       │
│                                                                                                       │
│                                                                                                       │
│                       Start capturing YOUR unique context.                                            │
│                       ─────────────────────────────────────                                           │
│                                                                                                       │
│                                                                                                       │
│          Tell us who you are, how you think, what you do, and what you're                             │
│          trying to accomplish right now.                                                              │
│                                                                                                       │
│          Our Clarity Canvas walks you through it — and it means that when                             │
│          we have our first conversation, we're already fully caught up.                               │
│                                                                                                       │
│                                                                                                       │
│                              No pitch. No pressure. Just a head start.                                │
│                                                                                                       │
│                                                                                                       │
│                     ┌─────────────────────────────────────────────┐                                   │
│                     │                                             │                                   │
│                     │     [ Open the Clarity Canvas → ]           │  ← FULL GOLD BG, BLACK TEXT       │
│                     │                                             │                                   │
│                     └─────────────────────────────────────────────┘                                   │
│                                                                                                       │
│                                                                                                       │
│                     ┌─────────────────────────────────────────────┐                                   │
│                     │                                             │                                   │
│                     │   Wanna chat with us first? Schedule a call │  ← GHOST BUTTON                  │
│                     │                                             │                                   │
│                     └─────────────────────────────────────────────┘                                   │
│                                                                                                       │
│                                                                                                       │
│                                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- **Large breathing glow** — Creates ambient atmosphere behind CTAs
- **Clear hierarchy** — Primary CTA is full gold background, secondary is ghost
- **Extra vertical space** — Section feels important, not rushed

**Animation sequence:**
1. Glow fades in
2. Headline reveals
3. Body text fades up
4. "No pitch..." fades in
5. Primary CTA button pops (spring scale from 0.95 → 1)
6. Secondary CTA fades in

---

## 9) Particle & Glow System Design

### Mobile Baseline (CSS-only)

On mobile, we use **CSS-only effects** for performance:

```css
/* Single breathing gold glow behind hero */
.hero-glow {
  position: absolute;
  width: 300px;
  height: 200px;
  background: radial-gradient(ellipse, rgba(212,165,74,0.15) 0%, transparent 70%);
  filter: blur(40px);
  animation: breathe 5s ease-in-out infinite;
}

/* 2-3 floating orbs throughout page */
.float-orb {
  position: absolute;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(212,165,74,0.1) 0%, transparent 70%);
  filter: blur(30px);
  animation: float 8s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-20px) translateX(10px); }
}
```

**Mobile specs:**
- 1 breathing glow in hero section
- 2 floating orbs positioned at strategic points (after Pillars, before CTA)
- Pure CSS — no JavaScript overhead
- Respects `prefers-reduced-motion` (static positioning)

### Desktop Enhancement (Canvas Particles)

On desktop (768px+), add **canvas-based particles**:

```typescript
interface Particle {
  x: number;           // Current X position
  y: number;           // Current Y position
  size: number;        // Radius (1-3px)
  alpha: number;       // Opacity (0.1-0.4)
  vx: number;          // Velocity X
  vy: number;          // Velocity Y
  parallaxFactor: number;  // 0.2-0.8 for depth effect
}
```

**Particle behavior:**
- 30-50 particles on screen at once
- Slow, drifting movement (velocity 0.1-0.3 px/frame)
- Subtle parallax response to scroll position
- Color: Gold (#d4a54a) at low opacity

**Performance optimizations:**
- Defer canvas initialization until after LCP
- Use `requestAnimationFrame` for smooth updates
- Canvas behind all content (`z-index: -1`)
- Pause when tab not visible (`visibilitychange` event)
- Honor `prefers-reduced-motion` — show static or disable entirely
- Use `will-change: transform` sparingly

---

## 10) Performance Optimization Strategy

### Philosophy

**Prioritize wow-factor while using every optimization pattern available.** We want the page to feel premium and animated, but we're not willing to sacrifice load time for it.

### Performance Targets

| Metric | Target | Acceptable | Rationale |
|--------|--------|------------|-----------|
| First Contentful Paint (FCP) | < 1.5s | < 2.5s | First meaningful content visible |
| Largest Contentful Paint (LCP) | < 2.0s | < 3.0s | Hero headline fully rendered |
| Cumulative Layout Shift (CLS) | < 0.05 | < 0.1 | No layout jumps during load |
| Time to Interactive (TTI) | < 3.0s | < 4.0s | Page responds to input |
| Total JS (gzipped) | < 120KB | < 150KB | Framer Motion adds weight |

### Optimization Techniques

#### 1. Critical Path Optimization

```tsx
// Preload fonts in layout.tsx
<link rel="preload" href="/fonts/InstrumentSerif.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/DMSans.woff2" as="font" type="font/woff2" crossorigin />

// Inline critical CSS for hero section
<style dangerouslySetInnerHTML={{ __html: heroStyles }} />
```

#### 2. Deferred Animation Loading

```tsx
// Load heavy animations after initial paint
const [mounted, setMounted] = useState(false);
useEffect(() => {
  // Defer particle system
  const timer = setTimeout(() => setMounted(true), 100);
  return () => clearTimeout(timer);
}, []);

// Hero glow renders immediately (CSS)
// Particles render after mount (deferred)
return (
  <>
    <HeroGlow /> {/* CSS-only, immediate */}
    {mounted && <ParticleCanvas />} {/* Deferred */}
  </>
);
```

#### 3. Intersection Observer for Below-Fold

```tsx
// Only hydrate sections when they enter viewport
const DrudgerySection = dynamic(() => import('./DrudgerySection'), {
  loading: () => <DrudgerySkeleton />,
  ssr: true // SSR the static content
});

// Use React.lazy for heavy animation logic
const CarouselAnimations = lazy(() => import('./CarouselAnimations'));
```

#### 4. CSS-First Animations

Prefer CSS animations over Framer Motion where possible:

```tsx
// Bad: JS animation for simple fade
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

// Good: CSS animation, JS just triggers class
<div className={inView ? 'animate-fadeIn' : 'opacity-0'} />

// Reserve Framer Motion for:
// - Complex spring physics
// - Staggered children
// - AnimatePresence (exit animations)
// - Scroll-linked transforms
```

#### 5. Image Optimization

```tsx
// Use Next.js Image with responsive sizes
<Image
  src="/hero-glow.png"
  alt=""
  width={600}
  height={400}
  priority // Above-fold
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// Product icons as inline SVG (no network request)
<ProductIcon className="w-6 h-6" />
```

#### 6. Bundle Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

// Import only what we need from Framer Motion
import { motion, useInView, useScroll } from 'framer-motion';
// NOT: import * as motion from 'framer-motion';
```

### Mobile-Specific Optimizations

1. **No canvas particles** — CSS orbs only
2. **Simplified carousel** — 6 items vs 12
3. **Reduced stagger delays** — Faster perceived load
4. **Touch events** — No mouse tracking overhead
5. **Smaller hero glow** — Less GPU compositing

### Accessibility Performance

```tsx
// Respect reduced motion preference
const prefersReducedMotion = useReducedMotion();

return (
  <motion.div
    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
  >
    {children}
  </motion.div>
);
```

---

## 11) Animation Specification

### Global Elements

| Element | Animation | Trigger | Mobile | Desktop |
|---------|-----------|---------|--------|---------|
| Progress bar | scaleX 0→1 with scroll | `useScroll` | ✓ | ✓ |
| Navigation | translateY -80px on scroll down | `scrollY > 100 && scrollingDown` | ✓ | ✓ |
| Sticky CTA bar | fadeIn after hero | `scrollY > 100vh` | ✓ | Optional |
| Gold glow | CSS breathing | Always | ✓ (simplified) | ✓ |
| Particles | Continuous drift | `requestAnimationFrame` | ✗ | ✓ (deferred) |

### Per-Section Animations

| Section | Element | Animation | Mobile Delay | Desktop Delay |
|---------|---------|-----------|--------------|---------------|
| Hero | Headline L1 | fadeUp | 0.1s | 0.1s |
| Hero | Headline L2 | fadeUp | 0.2s | 0.3s |
| Hero | Headline L3 | fadeUp | 0.3s | 0.5s |
| Hero | Body text | fadeUp | 0.4s | 0.7s |
| Hero | Scroll indicator | continuous bob | — | — |
| Pillars | Section label | fadeUp | 0s | slideInFromLeft |
| Pillars | Headline | fadeUp | 0.1s | 0.1s |
| Pillars | Cards | stagger fadeUp | 0.1s each | 0.12s each |
| Drudgery | Headline | fadeUp | 0s | 0s |
| Drudgery | Carousel | fadeIn | 0.2s | 0.3s |
| Drudgery | Items | AnimatePresence | 4s cycle | 3s cycle |
| Two Things | Thing 1 | fadeUp | 0.1s | slideUp 0.1s |
| Two Things | Divider | drawDown | 0.2s | 0.3s |
| Two Things | Thing 2 | fadeUp | 0.3s | slideUp 0.4s |
| 3-Layer | Layers | stagger fadeUp | 0.1s each | scaleUp stagger |
| Long View | Paragraphs | stagger fadeUp | 0.1s each | 0.15s each |
| Long View | Underline | width draw | 0.2s after | 0.3s after |
| Products | Cards | stagger fadeUp | 0.1s each | 0.1s each |
| CTA | All content | fadeUp | 0.1s stagger | 0.15s stagger |
| CTA | Primary button | spring pop | 0.2s | 0.3s |

### Transition Presets

```typescript
// Standard reveal (used for most fade-ups)
const reveal = { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] };

// Mobile reveal (faster for perceived performance)
const revealMobile = { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] };

// Spring for buttons and interactive elements
const springSmooth = { type: 'spring', stiffness: 300, damping: 24 };
const springSnappy = { type: 'spring', stiffness: 400, damping: 20 };

// Reduced motion fallback
const noMotion = { duration: 0 };
```

### Reduced Motion Behavior

When `prefers-reduced-motion: reduce`:
- All fade/slide animations → instant (duration: 0)
- Carousel auto-advance → disabled (manual swipe only)
- Particles → static positions (no drift)
- Glows → static (no breathing animation)
- Scroll indicator → static (no bob)

---

## 12) Responsive Breakpoints (Mobile-First)

| Breakpoint | Min Width | Key Changes |
|------------|-----------|-------------|
| **Default** | 0px | **THE BASELINE** — Single column, CSS orbs, touch targets, simplified animations |
| sm | 640px | Slightly larger typography, increased padding |
| **md** | 768px | **ENHANCEMENT THRESHOLD** — Two-column layouts, canvas particles enabled, hover states |
| lg | 1024px | Full layouts, generous spacing, split-screen sections |
| xl | 1280px | Max-width constraints (1200px), center alignment |

### Mobile Baseline Specifications

| Element | Mobile Value | Desktop Enhancement |
|---------|--------------|---------------------|
| Hero headline | 32-40px | 72-96px |
| Body text | 16-18px | 18-20px |
| Section padding | 64-80px vertical | 96-128px vertical |
| Horizontal padding | 24px | 48-64px |
| Touch targets | 48×48px minimum | Hover states added |
| Card gaps | 16px | 24px |
| Drudgery items | 6 items | 12 items |
| Particles | CSS orbs only | Canvas + orbs |
| Sticky CTA | Full-width bottom bar | Floating pill (optional) |

### Progressive Enhancement Summary

**Mobile (baseline):**
- Single column layout everywhere
- All 3 pillar cards stacked and visible
- Drudgery carousel with 6 items, swipe-enabled
- CSS-only glow + floating orbs
- Sticky "Work with us" bar at bottom
- Full-width buttons

**Tablet (md: 768px+):**
- Two-column layouts for Drudgery section
- Canvas particle system enabled
- Hover states on cards
- Larger typography scale

**Desktop (lg: 1024px+):**
- Three-column layouts for Pillars, Products
- Split-screen for Drudgery
- Mouse parallax effects
- Full animation sequences
- Generous negative space

---

## 13) File Structure Proposal

```
components/
  landing/
    LandingPage.tsx              # Main client component
    StickyCtaBar.tsx             # Mobile sticky "Work with us" button
    effects/
      GoldGlow.tsx               # CSS breathing glow (mobile baseline)
      FloatingOrbs.tsx           # CSS floating orbs (mobile baseline)
      ParticleCanvas.tsx         # Canvas particles (desktop enhancement)
      useParticles.ts            # Particle logic hook
    sections/
      HeroSection.tsx
      PillarsSection.tsx
      DrudgerySection.tsx
      TwoThingsSection.tsx
      ThreeLayerSection.tsx
      LongViewSection.tsx
      ProductsPreviewSection.tsx
      CTASection.tsx
    components/
      RevealText.tsx             # Enhanced scroll reveal
      GlassCard.tsx              # Reusable glass card
      GoldHighlight.tsx          # "You/your" wrapper
      AnimatedDivider.tsx        # Gold line animations
      SectionLabel.tsx           # "01 — SECTION" labels
      ProductMiniCard.tsx        # Compact product preview card
```

---

## 14) Success Criteria

The redesigned landing page should:

### Mobile-First Excellence
1. **Load fast on 4G** — FCP < 1.5s, LCP < 2.0s
2. **Feel native** — Touch targets 48px+, thumb-zone CTAs, swipe-friendly carousel
3. **Look complete without JS** — Core content visible even if animations fail

### Experience Quality
4. **Never feel like a slide deck** — Content flows naturally, no "next slide" feeling
5. **Make content breathable** — Generous whitespace, smart grid usage
6. **Limit cognitive load** — Never more than 1-2 lines of text demanding attention at once
7. **Guide the eye** — Clear visual hierarchy, obvious reading flow
8. **Feel premium** — Glow effects, gold accents, subtle animations

### Conversion
9. **Showcase products** — 3 featured products with clear CTA to `/products`
10. **Clear conversion path** — Sticky "Work with us" on mobile, dual CTAs in final section
11. **Accessible** — Respects reduced motion, proper heading hierarchy, keyboard navigable

### Performance
12. **60fps animations** — No jank on scroll or interaction
13. **Progressive enhancement** — Particles and hover states are desktop bonuses, not requirements

---

## 15) Testing Checklist

Before launch, verify:

### Mobile (375px iPhone SE)
- [ ] FCP < 2.5s on 4G throttling
- [ ] All touch targets ≥ 48×48px
- [ ] Sticky CTA bar appears after hero scroll
- [ ] Drudgery carousel is swipe-enabled
- [ ] All 3 pillar cards visible without horizontal scroll
- [ ] No horizontal overflow/scroll on any section
- [ ] Glow effects render (CSS)

### Tablet (768px iPad)
- [ ] Two-column layouts render correctly
- [ ] Canvas particles initialize
- [ ] Hover states work with mouse

### Desktop (1280px)
- [ ] Full 3-column layouts for Pillars, Products
- [ ] Split-screen for Drudgery
- [ ] Particle parallax responds to scroll
- [ ] All 12 drudgery items cycle

### Accessibility
- [ ] `prefers-reduced-motion` disables all animation
- [ ] Screen reader announces section structure
- [ ] Keyboard navigation through CTAs works
- [ ] Color contrast meets WCAG AA

---

*Ready for implementation.*
