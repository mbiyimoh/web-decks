# Multi-Brand Deck System

**Slug:** multi-brand-deck-system
**Author:** Claude Code
**Date:** 2025-12-09
**Branch:** preflight/multi-brand-deck-system
**Related:** N/A (greenfield infrastructure)

---

## 1) Intent & Assumptions

- **Task brief:** Create infrastructure for managing different brand identities (TradeBlock, 33 Strategies) within the same technical foundation. Decompose the current TradeBlock deck into brand identity components (fonts, colors, glow effects, rounded corners, component patterns). Create brand-specific design systems, component libraries, and developer guides. Support different deployment URLs per brand while using Railway for all deployments.

- **Assumptions:**
  - TradeBlock and 33 Strategies will have distinctly different visual identities (colors, fonts, accent styles)
  - Both brands share the same technical foundation (Next.js, Tailwind, Framer Motion, iron-session auth)
  - Each brand may have multiple decks (e.g., TradeBlock has investor decks, 33 Strategies has client pitch decks)
  - Authentication may differ per brand/deck (different passwords, different session cookies)
  - Each brand deployment may have its own custom domain
  - The system should make it easy to create new decks for either brand
  - The existing TradeBlock deck content and structure should be preserved

- **Out of scope:**
  - Migrating to a different tech stack
  - Building a CMS or visual editor for deck content
  - Automated brand asset generation (logos, images)
  - Complex authentication beyond password protection
  - A/B testing or analytics integration
  - Multi-language/i18n support

---

## 2) Pre-reading Log

| File | Takeaway |
|------|----------|
| `README.md` | Documents current single-deck deployment to Railway, iron-session auth pattern |
| `CLAUDE.md` | Comprehensive docs including shared components, design tokens, patterns, Railway deployment guide |
| `tailwind.config.ts` | Minimal config—extends fonts only, no color tokens yet |
| `app/layout.tsx` | Loads Space Grotesk + Inter fonts, sets CSS variables |
| `components/TradeblockDeck.tsx` | Monolithic 1300+ line component with inline styles, embedded CSS classes |
| `styles/globals.css` | Minimal—just Tailwind directives and smooth scroll |
| `lib/session.ts` | Session config uses hardcoded cookie name `tradeblock-deck-session` |
| `middleware.ts` | Edge-compatible auth check, references same cookie name |
| `app/login/page.tsx` | Login UI with TradeBlock branding hardcoded |
| `app/page.tsx` | Simple wrapper that validates session and renders TradeblockDeck |

---

## 3) Codebase Map

### Primary Components/Modules

| Path | Role |
|------|------|
| `components/TradeblockDeck.tsx` | Complete deck with 10+ embedded sub-components |
| `app/layout.tsx` | Root layout with fonts and metadata |
| `app/page.tsx` | Protected home route |
| `app/login/page.tsx` | Login page |
| `app/api/auth/route.ts` | Login/logout API |
| `app/api/health/route.ts` | Railway health check |
| `lib/session.ts` | Session configuration |
| `middleware.ts` | Auth middleware |

### Embedded Components in TradeblockDeck.tsx

1. `Section` — Full-viewport scroll section wrapper with fade animation
2. `RevealText` — Animated text reveal (slide up + fade)
3. `DemoPlaceholder` — Video/demo placeholder card
4. `ProgressBar` — Fixed top scroll progress indicator
5. `NavDots` — Right-side navigation dots (desktop only)
6. `PhaseStatus` — Status badges (completed, rolling-out, beta, live)
7. `Roadmap` — Phase timeline component
8. `CompanyCard` — Business/company cards
9. `AnalyticsCard` — Metric display cards
10. Inline CSS for `.text-gradient`, `.glow`, `.glow-strong`, `.glow-purple`

### Shared Dependencies

- **Fonts:** Space Grotesk (display), Inter (body)
- **Animations:** Framer Motion (`useInView`, `useScroll`, `useTransform`)
- **Styling:** Tailwind CSS with custom font variables
- **Auth:** iron-session

### Data Flow

```
Request → Middleware (cookie check) → Page (session validation) → Deck Component → Sections
                                                                       ↓
                                                        IntersectionObserver → NavDots active state
```

### Feature Flags/Config

- `DECK_PASSWORD` — Environment variable for deck access
- `SESSION_SECRET` — Session encryption key
- Cookie name hardcoded: `tradeblock-deck-session`

### Potential Blast Radius

- **High impact:** `tailwind.config.ts`, `globals.css`, `layout.tsx` (affect all pages)
- **Medium impact:** Session/auth system (if modified for multi-brand)
- **Low impact:** Adding new brand directories, new components (isolated)

---

## 4) Root Cause Analysis

**N/A** — This is a feature/infrastructure addition, not a bug fix.

---

## 5) Research Findings

### Pattern 1: CSS Custom Properties with Data Attributes

**Approach:** Define brand-specific CSS variables scoped by `data-brand` attributes.

```css
:root, [data-brand="tradeblock"] {
  --color-accent: 245 158 11;     /* amber-500 */
  --color-bg-primary: 0 0 0;      /* black */
  --color-text-primary: 255 255 255;
  --font-display: 'Space Grotesk', sans-serif;
}

[data-brand="33strategies"] {
  --color-accent: 59 130 246;     /* blue-500 */
  --color-bg-primary: 15 23 42;   /* slate-900 */
  --font-display: 'Instrument Sans', sans-serif;
}
```

**Pros:**
- Runtime theme switching without rebuilds
- Works with Tailwind's alpha-value syntax: `bg-accent/20` → `rgb(var(--color-accent) / 0.2)`
- Single codebase, multiple brands
- Easy to add new brands

**Cons:**
- Requires Tailwind config updates
- CSS variable syntax slightly more verbose

### Pattern 2: Class Variance Authority (CVA) for Components

**Approach:** Use CVA to define component variants with type-safe brand switching.

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const statusBadge = cva(
  'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border',
  {
    variants: {
      status: {
        completed: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
        beta: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
      },
      brand: {
        tradeblock: '',  // uses default status colors
        '33strategies': 'border-opacity-75',  // brand-specific override
      }
    },
    defaultVariants: {
      brand: 'tradeblock'
    }
  }
);
```

**Pros:**
- Type-safe variant handling
- Composable with Tailwind
- Clear API for component consumers
- Works well with brand theming

**Cons:**
- Additional dependency
- Learning curve for CVA syntax

### Pattern 3: Directory Structure for Multi-Brand

**Recommended structure:**

```
web-decks/
├── brands/
│   ├── tradeblock/
│   │   ├── theme.ts          # Brand tokens
│   │   ├── components/       # Brand-specific components
│   │   └── assets/           # Logos, images
│   └── 33strategies/
│       ├── theme.ts
│       ├── components/
│       └── assets/
├── components/
│   ├── core/                 # Brand-agnostic components
│   │   ├── Section.tsx
│   │   ├── RevealText.tsx
│   │   ├── ProgressBar.tsx
│   │   └── NavDots.tsx
│   └── branded/              # Components that consume brand context
│       ├── StatusBadge.tsx
│       ├── Card.tsx
│       └── Callout.tsx
├── lib/
│   ├── brand-context.tsx     # React context for brand
│   ├── design-tokens.ts      # Token type definitions
│   └── session.ts            # Auth (now brand-aware)
├── decks/
│   ├── tradeblock/
│   │   └── ai-inflection-2025/
│   │       └── page.tsx
│   └── 33strategies/
│       └── intro-deck/
│           └── page.tsx
└── app/
    ├── [brand]/
    │   ├── [deck]/
    │   │   └── page.tsx      # Dynamic route for decks
    │   └── login/
    │       └── page.tsx      # Brand-specific login
    ├── api/
    └── layout.tsx
```

### Pattern 4: Domain-Based Brand Detection

**Approach:** Use Next.js middleware to detect brand from hostname.

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  let brand = 'tradeblock';  // default
  if (hostname.includes('33strategies')) {
    brand = '33strategies';
  }

  // Set brand in request headers or cookies
  const response = NextResponse.next();
  response.headers.set('x-brand', brand);
  return response;
}
```

**Pros:**
- Automatic brand detection
- Clean URLs (no `/tradeblock/deck-name`)
- Works with Railway custom domains

**Cons:**
- Requires middleware complexity
- Local dev needs hostname configuration

### Pattern 5: Style Dictionary for Token Management

**Approach:** Use Style Dictionary to generate brand-specific token files.

```json
// tokens/tradeblock/colors.json
{
  "color": {
    "accent": {
      "value": "#f59e0b",
      "type": "color"
    },
    "background": {
      "primary": { "value": "#000000" }
    }
  }
}
```

**Pros:**
- Industry-standard token format
- Generates CSS, JS, JSON outputs
- Supports multi-brand, multi-platform
- Great for scaling to many brands

**Cons:**
- Build step required
- Additional tooling complexity
- May be overkill for 2 brands initially

---

### Recommendation

For this system, I recommend a **phased approach**:

**Phase 1 (Immediate):** CSS Custom Properties + Data Attributes
- Extract TradeBlock tokens to CSS variables
- Set up `data-brand` attribute scoping
- Update Tailwind config for CSS variable colors
- Refactor existing deck to use new token system

**Phase 2 (Short-term):** Component Library + CVA
- Extract embedded components to shared library
- Add CVA for type-safe variants
- Create brand context provider
- Build developer guide for component usage

**Phase 3 (Medium-term):** Multi-Brand Deployment
- Set up dynamic routing for brands/decks
- Configure Railway for multiple custom domains
- Brand-aware authentication (different passwords per brand)
- 33 Strategies brand definition

---

## 6) Clarification — DECISIONS MADE

### 1. Brand Detection Strategy
**Decision:** Option A — Domain-based

The system will detect brand from hostname (e.g., `tradeblock.decks.com` vs `33strategies.decks.com`). Clean URLs, no path prefixes needed.

### 2. Authentication Scope
**Decision:** Option C — Per-brand with deck overrides

Each brand has a default password, but individual decks can override with their own password if needed.

### 3. 33 Strategies Brand Direction
**Decision:** Extract from existing 33 Strategies website

**Extracted from `/33-strategies-website/`:**
- **Font:** Geist (Sans and Mono)
- **Primary Accent:** Green — `oklch(0.7 0.15 142)` ≈ `#4ade80`
- **Background:** Near-black — `oklch(0.05 0 0)` ≈ `#0a0a0a`
- **Cards:** Glassmorphism — `bg-white/10 backdrop-blur-md border-white/20`
- **Glow:** White-based — `rgba(255, 255, 255, 0.15)`
- **Radius:** `0.75rem` (12px), `rounded-full` for buttons
- **Mood:** Dark, modern, professional with subtle glassmorphism effects

### 4. Component Abstraction Level
**Decision:** Option B — Moderately abstracted

Components like `<Section>`, `<AnimatedText>`, `<Card>` that are flexible but guided. This enforces design system consistency while allowing customization.

### 5. Deck Content Structure
**Decision:** Option C — Hybrid

Core structure templated (Section wrapper, animations, navigation) with content written inline for maximum editorial control.

### 6. Priority Order (User-Ranked)

| Priority | Deliverable | Status |
|----------|-------------|--------|
| **1** | 33 Strategies brand definition | **COMPLETE** — Extracted from website |
| **2** | Claude Desktop knowledge file (tech + brand reference) | **COMPLETE** — Created at `docs/WEB-DECKS-KNOWLEDGE.md` |
| 3 | TradeBlock brand identity documentation | Included in knowledge file |
| 4 | Shared component library extraction | Pending implementation |
| 5 | Multi-brand infrastructure (theming, routing) | Pending implementation |
| 6 | Developer guide for creating new decks | Pending implementation |

---

## Appendix A: TradeBlock Brand Identity Extraction

### Typography

| Role | Font | Weights | CSS Variable |
|------|------|---------|--------------|
| Display/Headlines | Space Grotesk | 500, 600, 700 | `--font-display` |
| Body/UI | Inter | 400, 500, 600, 700 | `--font-body` |

### Color Palette

**Backgrounds:**
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `bg-primary` | `#000000` | `bg-black` | Main background |
| `bg-surface` | `#18181b` | `bg-zinc-900` | Card backgrounds |
| `bg-surface-dim` | `#09090b` | `bg-zinc-950` | Alternate sections |
| `bg-elevated` | `#27272a` | `bg-zinc-800` | Hover states, tags |

**Text:**
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `text-primary` | `#ffffff` | `text-white` | Headlines, emphasis |
| `text-secondary` | `#a1a1aa` | `text-zinc-400` | Body copy |
| `text-muted` | `#71717a` | `text-zinc-500` | Captions, labels |

**Accent (Primary):**
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `accent-primary` | `#f59e0b` | `amber-500` | Progress bar, CTAs, highlights |
| `accent-light` | `#fbbf24` | `amber-400` | Gradient endpoints |

**Accent Gradient:**
```css
background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%);
```

**Status Colors:**
| Status | Background | Border | Text | Icon |
|--------|------------|--------|------|------|
| Completed | `emerald-500/20` | `emerald-500/50` | `emerald-400` | ✓ |
| Rolling Out | `amber-500/20` | `amber-500/50` | `amber-400` | ◐ |
| Beta | `blue-500/20` | `blue-500/50` | `blue-400` | ○ |
| Live | `purple-500/20` | `purple-500/50` | `purple-400` | ● |

**Borders:**
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `border-default` | `#27272a` | `border-zinc-800` | Card borders |
| `border-subtle` | `#3f3f46` | `border-zinc-700/50` | Subtle dividers |
| `border-accent` | `#f59e0b/50` | `border-amber-500/50` | Highlighted elements |

### Effects

**Glow Effects:**
```css
.glow {
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.15);
}

.glow-strong {
  box-shadow: 0 0 80px rgba(245, 158, 11, 0.25);
}

.glow-purple {
  box-shadow: 0 0 60px rgba(168, 85, 247, 0.15);
}
```

**Background Blurs:**
```css
.blur-accent {
  background: rgba(245, 158, 11, 0.1);
  filter: blur(48px); /* blur-3xl */
}
```

### Border Radius Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `radius-sm` | 8px | `rounded-lg` | Buttons, small cards |
| `radius-md` | 12px | `rounded-xl` | Standard cards |
| `radius-lg` | 16px | `rounded-2xl` | Featured cards, containers |
| `radius-full` | 9999px | `rounded-full` | Badges, dots, avatars |

### Animation Presets

**Section Fade:**
```ts
{
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, ease: "easeOut" }
}
```

**Text Reveal:**
```ts
{
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }
}
```

**Scale Reveal (Demo Placeholder):**
```ts
{
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6 }
}
```

**Stagger Delays:** 0.05s - 0.1s increments between elements

### Component Patterns

**Callout Box (Left Border Accent):**
```tsx
<div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 pl-6 py-4">
  <p className="text-zinc-300">
    <span className="text-white font-medium">Key point:</span> Supporting text
  </p>
</div>
```

**Metric Card:**
```tsx
<div className="rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5">
  <p className="text-zinc-400 text-xs mb-1">Title</p>
  <p className="text-white text-xl font-bold mb-1">Value</p>
  <p className="text-zinc-500 text-xs">Subtitle</p>
</div>
```

**Feature Card:**
```tsx
<div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
      <Icon className="w-5 h-5 text-amber-500" />
    </div>
    <h3 className="text-xl font-bold text-white">Title</h3>
  </div>
  <p className="text-zinc-400">Description</p>
</div>
```

**Bullet List:**
```tsx
<ul className="space-y-2">
  <li className="flex items-center gap-2 text-zinc-400">
    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
    List item
  </li>
</ul>
```

**Gradient Text:**
```tsx
<span className="bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
  Highlighted
</span>
```

---

## Appendix B: Proposed CSS Variables

```css
/* brands/tradeblock/theme.css */
:root,
[data-brand="tradeblock"] {
  /* Typography */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Backgrounds (RGB for alpha composition) */
  --color-bg-primary: 0 0 0;
  --color-bg-surface: 24 24 27;
  --color-bg-surface-dim: 9 9 11;
  --color-bg-elevated: 39 39 42;

  /* Text */
  --color-text-primary: 255 255 255;
  --color-text-secondary: 161 161 170;
  --color-text-muted: 113 113 122;

  /* Accent */
  --color-accent: 245 158 11;
  --color-accent-light: 251 191 36;

  /* Status */
  --color-status-success: 16 185 129;
  --color-status-warning: 245 158 11;
  --color-status-info: 59 130 246;
  --color-status-special: 168 85 247;

  /* Borders */
  --color-border-default: 39 39 42;
  --color-border-subtle: 63 63 70;

  /* Effects */
  --glow-color: 245 158 11;
  --glow-intensity: 0.15;
  --glow-radius: 60px;

  /* Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;

  /* Animations */
  --ease-out-expo: cubic-bezier(0.25, 0.4, 0.25, 1);
  --duration-fast: 0.3s;
  --duration-normal: 0.6s;
  --duration-slow: 0.8s;
}

/* Tailwind integration */
@layer base {
  .bg-primary { background-color: rgb(var(--color-bg-primary)); }
  .bg-surface { background-color: rgb(var(--color-bg-surface)); }
  .bg-accent { background-color: rgb(var(--color-accent)); }
  .bg-accent\/10 { background-color: rgb(var(--color-accent) / 0.1); }
  .bg-accent\/20 { background-color: rgb(var(--color-accent) / 0.2); }

  .text-primary { color: rgb(var(--color-text-primary)); }
  .text-secondary { color: rgb(var(--color-text-secondary)); }
  .text-accent { color: rgb(var(--color-accent)); }

  .border-default { border-color: rgb(var(--color-border-default)); }
  .border-accent { border-color: rgb(var(--color-accent)); }
  .border-accent\/50 { border-color: rgb(var(--color-accent) / 0.5); }

  .glow {
    box-shadow: 0 0 var(--glow-radius) rgb(var(--glow-color) / var(--glow-intensity));
  }
}
```

---

## Appendix C: 33 Strategies Brand Identity Extraction

*Extracted from `/Users/AstroLab/Desktop/code-projects/33-strategies-website/`*

### Typography

| Role | Font | Source |
|------|------|--------|
| Sans | Geist Sans | `--font-geist-sans` |
| Mono | Geist Mono | `--font-geist-mono` |

### Color Palette (OKLCH)

**Backgrounds:**
| Token | OKLCH | Approx Hex | Usage |
|-------|-------|------------|-------|
| Background | `oklch(0.05 0 0)` | `#0a0a0a` | Main background |
| Card | `oklch(0.08 0 0)` | `#141414` | Card surfaces |
| Muted | `oklch(0.12 0 0)` | `#1f1f1f` | Secondary surfaces |
| Secondary | `oklch(0.15 0 0)` | `#262626` | Elevated surfaces |

**Text:**
| Token | OKLCH | Approx Hex | Usage |
|-------|-------|------------|-------|
| Foreground | `oklch(0.98 0 0)` | `#fafafa` | Primary text |
| Muted FG | `oklch(0.6 0 0)` | `#999999` | Secondary text |

**Accent (Primary):**
| Token | OKLCH | Approx Hex | Usage |
|-------|-------|------------|-------|
| Primary | `oklch(0.7 0.15 142)` | `#4ade80` (green-400) | CTAs, highlights |
| Ring | `oklch(0.7 0.15 142)` | `#4ade80` | Focus rings |

**Semantic Colors:**
- Blue (`text-blue-400`) — Product experience
- Purple (`text-purple-400`) — Technical depth
- Green (`text-green-400`) — Thought leadership
- Orange (`rgba(251, 146, 60, X)`) — Glow accents

**Borders:**
| Token | OKLCH | Usage |
|-------|-------|-------|
| Border | `oklch(0.2 0 0)` | Standard borders |
| Input | `oklch(0.15 0 0)` | Form inputs |

### Effects

**Shadows:**
```css
--shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-elevated: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-glow: 0 0 20px rgba(255, 255, 255, 0.15);
--shadow-cta-glow: 0 0 30px rgba(255, 255, 255, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.2);
```

**Glassmorphism:**
```tsx
className="bg-white/10 backdrop-blur-md border border-white/20"
```

**Gradient Card:**
```tsx
className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20"
```

### Border Radius

| Token | Value |
|-------|-------|
| Default (`--radius`) | `0.75rem` (12px) |
| Cards | `rounded-2xl` |
| Buttons | `rounded-full` |

### Spacing Tokens

```css
--section-padding-sm: 5rem;   /* 80px - mobile */
--section-padding-md: 8rem;   /* 128px - desktop */
--section-padding-lg: 10rem;  /* 160px - hero */
--card-padding: 2rem;         /* 32px */
--card-gap: 2rem;             /* 32px */
```

### Component Patterns

**Badge:**
```tsx
<div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
  <span className="w-2 h-2 bg-white/60 rounded-full mr-2 animate-pulse"></span>
  Badge Text
</div>
```

**Primary CTA:**
```tsx
<Button className="bg-white text-black rounded-full px-10 py-7 text-xl font-semibold
  transition-all duration-300 hover:bg-gray-50 hover:scale-105
  shadow-cta-glow hover:shadow-glow">
  Button Text
</Button>
```

**Stat Card:**
```tsx
<div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-12">
  <div className="text-7xl font-bold text-white mb-6">$16M+</div>
  <div className="text-2xl font-semibold text-white mb-6">Label</div>
  <div className="text-white/70 text-lg">Description</div>
</div>
```

---

## Next Steps

**Completed:**
1. ~~33 Strategies brand definition~~ — Extracted in Appendix C
2. ~~Claude Desktop knowledge file~~ — Created at `docs/WEB-DECKS-KNOWLEDGE.md`
3. ~~TradeBlock brand identity documentation~~ — Included in knowledge file

**Remaining Implementation:**
1. Convert this ideation to a formal specification (`/spec:ideate-to-spec`)
2. Multi-brand infrastructure (CSS variables, data-brand attributes)
3. Shared component library extraction with CVA variants
4. Domain-based brand detection in middleware
5. Per-brand auth with deck overrides
6. Developer guide for creating new decks
