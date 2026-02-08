# 33 STRATEGIES HOMEPAGE — CLAUDE CODE HANDOFF DOCUMENT

> Complete context package for building the production homepage from the included JSX prototype. This document captures every content decision, design specification, animation pattern, and strategic rationale so that implementation can proceed without ambiguity.

---

## TABLE OF CONTENTS

1. Strategic Foundation
2. Page Architecture & Section Flow
3. Complete Copy (V4 — Final)
4. Design System & Visual Specifications
5. Animation & Interaction Specifications
6. Responsive Behavior
7. Component Inventory
8. Technical Implementation Notes
9. What the Prototype Gets Right vs. What Needs Production Polish
10. Reference Files

---

## 1. STRATEGIC FOUNDATION

### What This Page Needs to Accomplish

A visitor lands on 33strategies.com. Within 60-90 seconds of scrolling, they should:

1. **Feel provoked** — realize the AI landscape has shifted in a way they haven't fully processed
2. **Feel grounded** — understand concretely what 33 Strategies does (three service pillars)
3. **Feel identified** — see their exact daily pain points reflected back at them (drudgery carousel)
4. **Feel promised** — understand the two-part value proposition (kill drudgery + extend best thinking)
5. **Feel convinced** — see the mechanism that delivers on the promise (3-layer stack)
6. **Feel inspired** — grasp the long-term compounding advantage this creates
7. **Feel invited** — take action through one of two CTAs (Clarity Canvas or schedule a call)

### Target Audience

Business operators at mid-market companies ($10M-$500M revenue). They are:
- Tech-literate enough to recognize the AI opportunity
- NOT engineers — they're founders, COOs, VPs, department heads
- Experiencing the drudgery described in Section 3 daily
- Smart, resourceful, time-constrained
- Looking for a peer, not a vendor

### Strategic Positioning Baked Into the Copy

- **Not a consultant** — founder-to-founder peer relationship
- **Not selling AI tools** — selling the capture and deployment of YOUR unique context
- **Competitive advantage = human input quality** — when everyone has the same AI, the differentiator is who asks better questions with richer context
- **Independence over dependency** — teams build 2-4 more tools on their own after engagement

### The Copy's Signature Device: Gold "You/Your"

Every instance of "you," "your," "yours" in the body copy is rendered in **semi-bold gold (#D4A84B)** text. This is a deliberate design choice that:
- Makes the reader feel personally addressed throughout
- Creates a visual rhythm of gold flecks across every section
- Reinforces that this is about THEIR context, not generic AI
- Distinguishes 33 Strategies copy from every other AI consultancy

Implementation: wrap every you/your/yours in a `<span>` with `color: #D4A84B; font-weight: 500`.

---

## 2. PAGE ARCHITECTURE & SECTION FLOW

### Section Order (Final — V4)

| # | Section | Label | Purpose | Emotional Beat |
|---|---------|-------|---------|----------------|
| 1 | Hero | — | Provocation | "Wait, that's true..." |
| 2 | Three Pillars | 01 — What We Do | Practical grounding | "OK, so what do they actually do?" |
| 3 | Drudgery Carousel | 02 — The Problem | Emotional identification | "That's literally my day" |
| 4 | Two Things | 03 — The Promise | The dual value proposition | "Yes. Both of those." |
| 5 | 3-Layer Stack | 04 — How It Works | Mechanism reveal | "That's clever" |
| 6 | Long View | 05 — The Long View | Vision / moat | "Oh — the moat is mine" |
| 7 | CTA | — | Conversion | "Let me start" |

### Page Rhythm

- Total scroll depth: ~5,500-6,500px (desktop)
- Each section occupies roughly one viewport height (some shorter, some taller)
- Estimated full-scroll time: 60-90 seconds
- Emotional arc: Provocation (0%) → Grounding (15%) → Identification (30%) → Promise (50%) → Mechanism (65%) → Vision (80%) → Action (95%)

### Why This Order

The V3 version went Hero → Drudgery → Two Things → Stack → Long View → CTA. V4 added the "Three Pillars" section immediately after the hero because user testing of the copy revealed a gap: after the provocative hero, visitors needed practical grounding ("but what do you actually DO?") before being emotionally engaged by the drudgery carousel. The pillars bridge provocation and identification.

---

## 3. COMPLETE COPY (V4 — FINAL)

### Section 1: Hero

**Headline (Georgia/Instrument Serif, 72-96px desktop, 40-48px mobile):**
```
AI gave everyone access to great answers.
The advantage is now in
who asks better questions.
```

Line 2 ("The advantage is now in") renders in `text-zinc-500` (muted) to create a visual breath before the punchline.

**Supporting paragraph (DM Sans, 18-20px):**
```
Every competitor can prompt the same tools. The technology is commoditized.
What hasn't been commoditized is YOUR unique context — the way YOU think
about YOUR market, YOUR customers, YOUR strategy.
That's the input that makes AI dangerous.
```

All caps "YOUR" instances above are rendered as gold semi-bold in the actual implementation, not literally capitalized.

### Section 2: Three Pillars

**Section label:** `01 — WHAT WE DO`

**Bridging headline (Georgia, 32-40px):**
```
We capture YOUR unique context and unleash it on YOUR business —
while eliminating the intellectual drudgery that limits the time and headspace
YOU have for the work that matters.
```

**Subtext:** `Three ways in:`

**Card 1: AI Consulting & Operator Upskilling**
```
Engagements that ship real outcomes AND teach your team to think and build
AI-first — so you're more capable when we leave than when we arrived.
```

**Card 2: Dev Firm + Co-Founder as a Service**
```
For founders with strong vision but limited build capacity. We're your
technical co-founder from zero to one — strategy, design, development,
and AI integration.
```

**Card 3: Products That Work For You**
Badge: `Included with every engagement`
```
Tools born from our own workflows that kill drudgery and extend your best
thinking — included with every consulting or build engagement.
```

Each card has a "Learn more →" link at the bottom.

### Section 3: Drudgery Carousel

**Section label:** `02 — THE PROBLEM`

**Headline:**
```
YOU've already done the hard thinking.
YOU just keep having to redo it.
```

Line 2 in `text-zinc-500`.

**Supporting text:**
```
YOU've built frameworks that work. YOU know YOUR customers. But somehow
most of YOUR day is still spent on the intellectual drudgery between the
idea and the thing:
```

**The 12 drudgery items (cycle in carousel):**

1. "Reviewing meeting notes hours later trying to remember what was actually said on your morning call, let alone evaluate the deal that was discussed"
2. "Manually logging to-dos and status updates in your project management tools one by one — when you remember to, that is"
3. "Posting a single tweet for your product launch because that's all your team has bandwidth for, even though you know a multi-channel campaign would be ten times more effective"
4. "Digging through contacts and old emails trying to figure out who you've connected with in the past who could actually help with what you're working on right now"
5. "Re-explaining your brand voice and positioning every time you hand off a brief to a contractor or team member"
6. "Copy-pasting the same company context into yet another AI prompt because the tool has no memory of who you are"
7. "Scanning your calendar at 6pm trying to reconstruct what you actually accomplished today"
8. "Rebuilding the same spreadsheet analysis you've already done three times, just with slightly different inputs"
9. "Writing a follow-up email to someone you met at a conference last week and spending 10 minutes trying to remember what you even talked about"
10. "Drafting a proposal from scratch when 80% of it is the same strategic framing you've already articulated a dozen times"
11. "Translating a conversation with your co-founder into an actual project plan with owners and deadlines — by hand, after the fact"
12. "Staring at a blank content calendar knowing exactly what you want to say but lacking the time to produce it across every channel it should live on"

These are written in first-person inner-monologue voice (italic Georgia/Instrument Serif). They should feel like the reader's actual internal narration of their day.

### Section 4: The Two Things

**Section label:** `03 — THE PROMISE`

**Opening line:**
```
We build AI systems that do two things simultaneously.
```

**Thing 1:**
Headline: `Kill the drudgery.`
```
The reformatting, the re-explaining, the context-reloading, the manual labor
between YOUR thinking and its execution — automated out of existence. What
remains is the rich, creative, decision-making work YOU're actually here to do.
```

**Divider:** Single 48px gold line (horizontal rule, `#D4A84B` at 40% opacity)

**Thing 2:**
Headline: `Make YOUR best thinking show up everywhere.`
```
YOUR voice. YOUR strategy. YOUR decision-making frameworks. Injected into
every workflow, every draft, every analysis. Automatically. Without YOU
having to bring it each time.
```

**Closing line:**
```
The result: AI that doesn't just execute tasks faster. AI that executes them
the way YOU would — if YOU had unlimited time and perfect memory.
```

"the way YOU would" is rendered in gold italic.

### Section 5: 3-Layer Stack

**Section label:** `04 — HOW IT WORKS`

**Headline:**
```
Every system we build sits on three layers.
```

**Layer 01 — Business Context Layer** (gold-accented card):
```
We capture how you think, how you operate, who your customers are, what your
voice sounds like, how you make decisions. A living foundation that gets
richer with every interaction.
```

**Layer 02 — Data Connections Layer:**
```
Clean integrations to the systems that run your business. One source of truth,
not twelve tabs. Your data talks to your context, and your context talks to
your tools.
```

**Layer 03 — AI Apps Layer:**
```
Applications that don't just execute tasks — they execute them your way,
drawing on everything below. And because the foundation is there, your team
builds the next ones themselves.
```

**Closing line (centered):**
```
And because the foundation is there, YOUR team builds the next ones themselves.
```

### Section 6: The Long View

**Section label:** `05 — THE LONG VIEW`

**Opening headline:**
```
The longer YOU work with our tools, the more they feel like an extension
of YOUR own thinking.
```

**Paragraph 1:**
```
Most AI tools reset every time you open them. They don't know you. Every
session starts from zero.
```

**Paragraph 2:**
```
Ours are different. The business context layer accumulates — YOUR strategy
sharpens, YOUR voice clarifies, YOUR decision-making frameworks get more
precise. And none of this requires special effort. YOU're just doing YOUR
work. The system learns from that.
```

**Paragraph 3:**
```
Over time, the tools stop feeling like tools. They feel like working with
someone who already knows everything about YOUR business — because they do.
```

**Closing line (gold text, centered, with gold underline that animates from center):**
```
That's not our moat. That's YOURS.
```

"YOURS" renders in white against the gold text for contrast emphasis.

### Section 7: CTA

**Headline:**
```
Start capturing YOUR unique context.
```

**Supporting text:**
```
Tell us who you are, how you think, what you do, and what you're trying to
accomplish right now. Our Clarity Canvas walks you through it — and it means
that when we have our first conversation, we're already fully caught up.
```

**Subtext:**
```
No pitch. No pressure. Just a head start.
```

**Primary CTA button:** `Open the Clarity Canvas →`
- Full gold background (#D4A84B), black text, rounded-xl
- Only full-gold-background button on the entire page

**Secondary CTA button:** `Wanna chat with us first? Schedule a call`
- Ghost button: zinc-800 border, zinc-400 text, transparent background
- Hover: subtle background fill, border lightens

---

## 4. DESIGN SYSTEM & VISUAL SPECIFICATIONS

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background Primary | `#0a0a0a` | Main page background |
| Background Surface | `#111111` | Cards, containers |
| Background Elevated | `#1a1a1a` | Hover states, nav active |
| Gold (Primary Accent) | `#D4A84B` | Section labels, "you/your" text, CTAs, key phrases |
| Gold Light | `#E4C06B` | Hover states on gold elements |
| Gold Dim | `#B8923F` | Muted gold (badges, subtle accents) |
| Text Primary | `#ffffff` | Headlines |
| Text Secondary | `#a3a3a3` (zinc-400) | Body copy |
| Text Muted | `#737373` (zinc-500) | Supporting text, captions |
| Text Dimmed | `#525252` (zinc-600) | Subtle text, carousel inactive items |
| Border Default | `#27272a` (zinc-800) | Card borders |
| Border Subtle | `#18181b` (zinc-900) | Section dividers |

### Typography

| Role | Font | Fallback | Size Range |
|------|------|----------|------------|
| Display / Headlines | Instrument Serif | Georgia, serif | 32px - 96px responsive |
| Body / UI | DM Sans | system-ui, sans-serif | 14px - 20px |
| Technical / Code | JetBrains Mono | monospace | 12px - 14px |

**Note:** The prototype uses Georgia as a stand-in for Instrument Serif. Production should load Instrument Serif. Playfair Display is the alternative for web decks specifically (see Web Decks System doc) but the homepage should use Instrument Serif per the master design system.

**Typography Scale (Desktop):**
- Hero headline: 72-96px, font-medium, leading-[1.1]
- Section headlines: 48-64px, font-medium, leading-snug
- Sub-headlines: 32-40px, font-medium
- Body: 18-20px, leading-relaxed
- Section labels: 14px, font-medium, tracking-[0.2em], uppercase, gold
- Captions/badges: 10-12px, tracking-wider, uppercase

### Section Labels

Format: `## — LABEL` (e.g., `01 — WHAT WE DO`)
- Gold (#D4A84B), 14px, DM Sans, medium weight, tracking 0.2em, uppercase
- Positioned above section headline with 24px margin-bottom

### Spacing

- Section vertical padding: 96-128px (desktop), 80px (mobile)
- Hero section: full viewport height (min-h-screen)
- Long View section: 160px top/bottom padding (extra breathing room)
- Card padding: 28-32px
- Card gap: 20px
- Max content width: 1200px (5xl) for cards, 800px (3xl) for text-heavy sections, 640px (2xl) for intimate sections (Long View)

### Effects

**Gold glow orbs (behind hero and CTA):**
```css
width: 600px; height: 400px;
background: radial-gradient(ellipse, #D4A84B0d 0%, transparent 70%);
filter: blur(40px);
animation: breathe 5s ease-in-out infinite;
```

Breathe animation oscillates opacity 0.6↔1.0 and scale 1.0↔1.08.

**Card hover:**
```
translateY(-4px)
border-color transitions to #D4A84B50
box-shadow: 0 0 40px #D4A84B0a
transition: 0.3s
```

**Gold underline (Long View closing):**
- Draws from center outward (width 0 → 80px)
- Duration: 0.8s, delay 0.3s after text appears
- Ease: [0.25, 0.4, 0.25, 1]

**Text selection:**
```css
::selection {
  background: #D4A84B30;
  color: white;
}
```

---

## 5. ANIMATION & INTERACTION SPECIFICATIONS

### Animation Philosophy

"Animations that serve purpose, not decoration." Every animation exists to:
- Reveal content at the moment the user is ready for it (scroll-triggered)
- Create a sense of craftsmanship and intentional sequencing
- Guide the eye through the page's emotional arc

### Global: Progress Bar

- Fixed position, top of viewport, z-50
- 2px height, gold (#D4A84B) fill
- Scales horizontally from left (0%) to right (100%) with scroll progress
- Uses `useScroll` + `useTransform` from Framer Motion

### Global: Smart-Hide Navigation

- Sticky, top: 0, z-50
- Background: `#0a0a0aee` with `backdrop-filter: blur(16px)`
- **Hides** (translateY: -80px) when user scrolls down past 100px
- **Reappears** (translateY: 0) when user scrolls up
- Transition: 0.3s ease-in-out
- Bottom border: gradient gold line (`linear-gradient(90deg, transparent, #D4A84B30, transparent)`)

### Section Reveal Pattern (Applied to All Sections)

Every piece of content uses the `RevealText` component pattern:
```
initial: { opacity: 0, y: 40 }
animate (when in view): { opacity: 1, y: 0 }
transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }
trigger: useInView with once: true, margin: "-80px"
```

Content within sections staggers with 0.1-0.15s delays between elements.

### Hero Parallax

- Hero section opacity fades from 1→0 as scrollY goes 0→400
- Hero section translates Y from 0→60px over same range
- Uses `useScroll` + `useTransform`
- Scroll indicator (mouse icon) bobs with infinite animation: y oscillates [0, 8, 0] over 2s

### Three Pillars: Staggered Cards

- Container uses `StaggerContainer` variant pattern:
  - Parent: `staggerChildren: 0.12`, `delayChildren: 0.1`
  - Children: `{ opacity: 0, y: 24 }` → `{ opacity: 1, y: 0 }`
- Individual cards have `whileHover` via Framer Motion (not CSS):
  - `y: -4`, `borderColor: #D4A84B50`, `boxShadow: 0 0 40px #D4A84B0a`
  - Transition duration: 0.3s

### Drudgery Carousel

- **Auto-scroll:** Items advance every 3 seconds
- **Visible items:** 3 at a time (center item full opacity, top/bottom at 50%)
- **Animation:** `AnimatePresence` with `mode="popLayout"`:
  - Enter: `opacity: 0, y: 20` → `opacity: [0.5 or 1], y: 0` (0.5s)
  - Exit: `opacity: 0, y: -20` (0.5s)
- **Fade masks:** Top and bottom gradient overlays from surface color to transparent (12px height)
- **Pause on hover:** Timer stops, "Paused" indicator appears bottom-right
- **Infinite loop:** Index wraps with modulo

### 3-Layer Stack

- Layers render in reversed order (Layer 3 appears first in DOM for visual bottom-up stacking)
- Each layer staggers in with 0.15s delay between them
- Layer 01 (Business Context) has gold border accent (`#D4A84B40`) and subtle gold glow (`0 0 60px #D4A84B08`)
- Vertical connector lines (1px, zinc-800) between layers

### Long View: Gold Underline

- Uses `useInView` with separate ref
- `initial: { width: 0 }` → `animate: { width: 80 }`
- Duration: 0.8s, delay: 0.3s
- Centered with flexbox

### CTA Buttons

- Primary (Clarity Canvas): `whileHover: { scale: 1.02, backgroundColor: #E4C06B }`, `whileTap: { scale: 0.98 }`
- Secondary (Schedule a call): `whileHover: { color: #d4d4d8, borderColor: #3f3f46, backgroundColor: #1a1a1a80 }`, `whileTap: { scale: 0.98 }`
- Spring preset for primary: `{ type: 'spring', stiffness: 400, damping: 20 }`

### Framer Motion Patterns Used (from Skill Reference)

These patterns were pulled from the `framer-motion-animator` skill and adapted:

1. **Variants + staggerChildren** — Three pillar cards, 3-layer stack
2. **useInView (scroll-triggered reveals)** — Every section's content
3. **useScroll + useTransform** — Progress bar, hero parallax
4. **Spring physics** — Card hovers, button interactions (stiffness 300-400, damping 20-25)
5. **AnimatePresence** — Drudgery carousel item transitions
6. **Reduced motion** — Should be implemented in production via `useReducedMotion` hook (prototype doesn't include this yet)

### Transition Presets

```javascript
const springSmooth = { type: 'spring', stiffness: 300, damping: 24 };
const springSnappy = { type: 'spring', stiffness: 400, damping: 20 };
const easeReveal = { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] };
const easeSlow = { duration: 0.8, ease: 'easeOut' };
```

---

## 6. RESPONSIVE BEHAVIOR

### Breakpoints

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| (default) | 0px | Mobile |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

### Key Responsive Shifts

**Hero:**
- Desktop: 72-96px headline, max-width 768px
- Tablet: 48-56px headline
- Mobile: 40-48px headline, px-6

**Three Pillars:**
- Desktop: 3-column grid
- Tablet: 2-column (cards 1-2) + 1 full-width (card 3)
- Mobile: Single column stacked

**Drudgery Carousel:**
- Desktop: max-width 640px centered, 3 visible items
- Mobile: max-width 100%, potentially 2 visible items, larger touch targets

**Two Things:**
- Desktop: 48-56px headlines, max-width 640px
- Mobile: 32-36px headlines, full width

**3-Layer Stack:**
- Desktop: max-width 768px, horizontal layout within cards (number + content side by side)
- Mobile: Stacked, number above content

**Navigation:**
- Desktop: Full nav with links + CTA button
- Mobile: Hamburger menu (not in prototype — needs implementation)

---

## 7. COMPONENT INVENTORY

### Reusable Components

| Component | Props | Description |
|-----------|-------|-------------|
| `RevealText` | `children, delay, className, y` | Scroll-triggered fade-up animation wrapper |
| `StaggerContainer` | `children, className, stagger, delayStart` | Parent for staggered children animations |
| `StaggerItem` | `children, className` | Child item within StaggerContainer |
| `G` | `children` | Gold text wrapper (`color: #D4A84B, fontWeight: 500`) |
| `ProgressBar` | — | Fixed scroll progress indicator |
| `Nav` | — | Smart-hide sticky navigation |

### Section Components

| Component | Description |
|-----------|-------------|
| `Hero` | Full-viewport provocation with parallax |
| `ThreePillars` | 3-card grid with hover effects |
| `DrudgeryCarousel` | Auto-scrolling pain point list |
| `TwoThings` | Dual value proposition with divider |
| `ThreeLayerStack` | Methodology reveal with gold-accented foundation |
| `LongView` | Vision section with animated underline |
| `CTA` | Dual call-to-action with gold glow |
| `Footer` | Minimal footer with nav links |

---

## 8. TECHNICAL IMPLEMENTATION NOTES

### Stack

The prototype is a single JSX file (React artifact). Production should be:
- **Next.js 14** (App Router) — consistent with existing 33 Strategies web decks
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (already used extensively in prototype)
- **DM Sans** via `next/font/google`
- **Instrument Serif** via `next/font/google` (or local font file)

### Font Loading

```tsx
import { DM_Sans } from 'next/font/google';
// Instrument Serif may need to be loaded from Google Fonts or as a local file
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
```

### Deployment

Existing infrastructure uses Railway. See Web Decks System document for:
- `railway.toml` configuration
- Health check endpoint pattern
- Session/auth pattern (if password protection desired)
- Custom domain setup

### SEO / Meta

The prototype doesn't include meta tags. Production needs:
- Title: "33 Strategies — AI Implementation for Operators"
- Description: Based on the hero copy
- Open Graph tags with dark-themed preview image
- Structured data (Organization schema)

### Accessibility

Production should add:
- `useReducedMotion` hook from Framer Motion — disable all motion for users who prefer reduced motion
- Proper heading hierarchy (h1 for hero, h2 for section headlines, h3 for card titles)
- ARIA labels on interactive elements
- Keyboard navigation for carousel (arrow keys to advance/rewind)
- Focus management for nav

### Performance

- Lazy-load sections below the fold
- Use `will-change: transform` on animated elements sparingly
- GPU-accelerated properties only (opacity, transform) — no animating width/height/top/left
- Preload fonts
- Gold glow orbs should use CSS (not canvas or heavy SVG)

---

## 9. WHAT THE PROTOTYPE GETS RIGHT vs. WHAT NEEDS PRODUCTION POLISH

### Working Well in Prototype

- ✅ Full page rhythm and section ordering
- ✅ Gold "you/your" treatment throughout all copy
- ✅ Three pillar cards with "Included" badge
- ✅ Two Things section with gold divider
- ✅ 3-layer stack with gold-accented Business Context layer
- ✅ Gold underline animation on "That's not our moat"
- ✅ Dual CTAs (primary Clarity Canvas + secondary schedule call)
- ✅ Smart-hide navigation
- ✅ Progress bar
- ✅ Section label format and numbering
- ✅ Overall color palette and spacing

### Needs Production Work

- ⚠️ **Drudgery carousel animation** — AnimatePresence with `popLayout` is finicky in the artifact sandbox. Real Next.js build with proper Framer Motion should produce smooth cycling with clean enter/exit. Consider an alternative approach: CSS-only infinite vertical scroll (`@keyframes` translateY loop) if Framer Motion proves unreliable.
- ⚠️ **Font loading** — Georgia is standing in for Instrument Serif. Load the proper typeface.
- ⚠️ **Hero parallax** — May need tuning of the scroll range values (currently 0-400) depending on actual viewport heights.
- ⚠️ **Gold glow breathing animation** — Uses CSS `@keyframes` in a `<style>` tag. Should be in global CSS or Tailwind config.
- ⚠️ **Mobile navigation** — No hamburger/mobile menu implemented. Needs drawer or sheet pattern.
- ⚠️ **Reduced motion** — Not implemented in prototype. Add `useReducedMotion` checks.
- ⚠️ **CTA destinations** — Buttons are non-functional. Need actual routes (Clarity Canvas page, Calendly or scheduling link).
- ⚠️ **Footer links** — Placeholder text. Need actual routes for Products, Consulting, About, Contact.
- ⚠️ **Product pages** — The "Learn more →" links on pillar cards need destination pages.
- ⚠️ **Card hover gold glow** — Uses Framer Motion `whileHover` which may not work on touch devices. Add CSS fallback or touch-specific behavior.

---

## 10. REFERENCE FILES

### Included in This Package

| File | Description |
|------|-------------|
| `33strategies-homepage.jsx` | The JSX prototype artifact (render in Claude or React environment) |
| `33_Strategies_Homepage_Handoff.md` | This document |

### Project Knowledge Base (in Claude Project)

| Document | Relevance |
|----------|-----------|
| `33_Strategies_Design_System.md` | Master brand guidelines — colors, typography, effects, spacing |
| `33_Strategies_Web_Decks` | Technical architecture for scroll-based presentations (Next.js 14 patterns, auth, Railway deployment) |
| `33_Strategies_Nucleus_Document.md` | Core business reference — model, positioning, methodology, targets |
| `33_Strategies_Case_Studies.md` | Client examples with results (for future "proof" section on homepage) |
| `D33LFlow_V2.jsx` | Example of the 33 Strategies design language applied to a product prototype — radar charts, card patterns, modal patterns, gold accent usage |

### Design Research Consulted

The UI wireframe was informed by research into:
- Linear's landing page design (monochrome dark theme, sequential progression, bold typography, minimal color)
- Dark-mode SaaS templates (Framer, Tailwind-based) for card patterns and scroll behavior
- Premium consulting site copy patterns (Leadpages, Unbounce best practices for landing page conversion)
- Animated landing page techniques (scroll-triggered reveals, parallax, staggered animations)
- One-page website patterns for service businesses (anchor navigation, progressive disclosure)
- Framer Motion animation skill (`framer-motion-animator` by patricio0312rev) for implementation patterns: variants, staggerChildren, useInView, useScroll, useTransform, spring physics, AnimatePresence, useReducedMotion

### Copy Development History

The copy went through four iterations:
1. **V1** — Raw thesis paste from founder conversation (three pillars, drudgery thesis, origin story)
2. **V2** — Updated to include "extend best thinking" dimension alongside "kill drudgery"
3. **V3** — Website-specific copy with three strategic approaches explored; selected Approach C ("The Provocation") with Hero → Drudgery → Two Things → Stack → Long View → CTA flow; introduced gold you/your device and 12 drudgery items
4. **V4 (Final)** — Added "What We Do" three-pillar section between Hero and Drudgery to bridge provocation with practical grounding; refined pillar descriptions to include "Products included with engagements" positioning; added secondary CTA ("Wanna chat with us first? Schedule a call")

---

*Last updated: February 7, 2026*
*Prepared for Claude Code implementation handoff*
