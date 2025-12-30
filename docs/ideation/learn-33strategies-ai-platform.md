# learn.33strategies.ai — Internal Learning Platform

**Slug:** learn-33strategies-ai-platform
**Author:** Claude Code
**Date:** 2025-12-29
**Branch:** feature/learn-platform
**Related:** `docs/learning-modules/`, `.claude/skills/33-strategies-frontend-design.md`

---

## 1) Intent & Assumptions

### Task Brief

Create an internal-only learning platform at `learn.33strategies.ai` (or `/learning` route) with:
1. Email-based authentication restricted to `@33strategies.ai` domain (Google SSO or email/password)
2. Landing page with course tiles
3. First course: "33 Strategies AI Workflow: For Builders" containing all existing learning modules
4. Audit and standardize all learning modules against the 33 Strategies design system
5. Create a reusable component system guide for interactive learning content

### Assumptions

- **Subdomain vs Path:** Assuming `/learning` path on existing domain (easier than subdomain setup with Railway)
- **Authentication:** Google SSO with email domain restriction is preferred over email/password
- **Content Format:** Scrollytelling decks remain the primary format (not video, not markdown docs)
- **Access Model:** All authenticated users have access to all courses (no per-course permissions)
- **Course Structure:** Each course is a collection of sequential learning modules (decks)
- **Progression:** No enforced linear progression initially (users can jump to any module)

### Out of Scope

- Payment/subscription system
- User progress persistence (tracking which modules completed)
- Comments or discussion features
- Video content or live sessions
- Mobile app version
- Public-facing content or marketing pages
- Multi-tenant (other organizations using the platform)

---

## 2) Pre-reading Log

| File | Takeaway |
|------|----------|
| `CLAUDE.md` | Established patterns for components, design system reference, auth patterns documented |
| `.claude/skills/33-strategies-frontend-design.md` | **Authoritative design spec**: Instrument Serif (display), DM Sans (body), JetBrains Mono (mono). Gold `#d4a54a`. Dark bg `#0a0a0f` |
| `docs/learning-modules/learning-modules-handoff.md` | Current deck inventory, brand spec (uses Playfair Display, should migrate to Instrument Serif), component patterns |
| `docs/learning-modules/learning-modules-feedback.md` | Specific content improvements requested for existing decks |
| `docs/learning-modules/ClaudeCodeWorkflowDeck.tsx` | Most advanced module with Document Viewer system (1900+ lines) |
| `docs/learning-modules/GettingStartedDeck.tsx` | Basic structure, 678 lines, duplicates all shared components |
| `docs/learning-modules/ExistingCodebasesDeck.tsx` | Similar pattern, 1045 lines |
| `docs/learning-modules/OrchestrationSystemDeck.tsx` | Similar pattern, 753 lines |
| `lib/session.ts` | iron-session config, 7-day sessions, httpOnly cookies |
| `lib/clients.ts` | Client portal data model pattern — reusable for courses |
| `middleware.ts` | Edge-compatible (no iron-session), just security headers |
| `components/portal/PasswordGate.tsx` | Current password auth UI pattern |
| `app/api/auth/[client]/route.ts` | POST/DELETE auth endpoints with constant-time comparison |

---

## 3) Codebase Map

### Primary Components/Modules

| Component | Path | Role |
|-----------|------|------|
| Learning Modules | `docs/learning-modules/*.tsx` | 4 standalone scrollytelling decks |
| Session Management | `lib/session.ts` | iron-session configuration |
| Client Registry | `lib/clients.ts` | Pattern for content registry |
| Auth API | `app/api/auth/[client]/route.ts` | Password authentication |
| Portal Gate | `components/portal/PasswordGate.tsx` | Auth UI component |
| Content Index | `components/portal/ContentIndex.tsx` | Content listing UI |

### Shared Dependencies

- **Animation:** Framer Motion (v11.0.0)
- **Styling:** Tailwind CSS (v3.4.0)
- **Auth:** iron-session (v8.0.0)
- **Framework:** Next.js 14 App Router

### Data Flow

```
User → /learning route
    → Middleware (security headers only)
    → Page Server Component (session validation)
    → Session invalid? → GoogleAuthGate component
    → Session valid + @33strategies.ai? → LearningDashboard
    → Select course → CourseLanding (module list)
    → Select module → LearningModule (scrollytelling deck)
```

### Feature Flags/Config

- No feature flags currently
- Auth passwords in env vars (`*_PASSWORD`)
- Session secret in `SESSION_SECRET`

### Potential Blast Radius

| System | Impact | Risk |
|--------|--------|------|
| Authentication | New OAuth flow | Medium - isolated from existing client portals |
| Session Management | Extended schema | Low - additive, not breaking |
| Shared Components | New component library | Low - new code, doesn't modify existing |
| Learning Modules | Refactored | Medium - existing code, but isolated in docs/ |
| Client Portals | None | None - completely separate routes |

---

## 4) Design Audit: Current Learning Modules

### Typography Issues

| Issue | Current | Should Be |
|-------|---------|-----------|
| Display Font | `Playfair Display` | `Instrument Serif` |
| Font Loading | Inline `<style>` tags | Tailwind config + proper imports |
| Font Variables | `.font-display` hardcoded | Use `font-display` class from Tailwind config |

### Color Issues

| Issue | Current | Should Be |
|-------|---------|-----------|
| Gold Accent | `#D4A84B` (close but not exact) | `#d4a54a` (design system canonical) |
| Background | `#0a0a0a` | `#0a0a0f` (slight blue undertone per spec) |
| Border colors | Mixed zinc-800, inline styles | Consistent `border-white/10` or `border-zinc-800` |

### Component Duplication

All four deck files duplicate these components inline:
- `Section` (full-viewport scroll section)
- `RevealText` (animated text reveal)
- `ProgressBar` (scroll progress indicator)
- `NavDots` (side navigation)
- `Card` (content card)
- `CodeBlock` (code display)

**Result:** ~400 lines duplicated across 4 files (~1600 lines total waste)

### Pattern Inconsistencies

| Pattern | ClaudeCodeWorkflowDeck | Others |
|---------|------------------------|--------|
| Document Viewer | Yes (full system) | No |
| Section Labels | `"01 — SECTION NAME"` | Mixed |
| Max Width | `max-w-5xl` | Mixed (`max-w-4xl`, `max-w-5xl`) |
| Headline Pattern | Gold key phrase | Mostly consistent |
| Card Highlight | `border-[#D4A84B]/50` | Consistent |

### Missing Design Elements

1. **Section markers not using JetBrains Mono** — spec requires `font-mono` for labels
2. **No consistent "Theory to Practice" pattern** — requested in feedback
3. **Illustrations/visuals placement** — feedback requests side-by-side layout
4. **Interactive examples** — only ClaudeCodeWorkflowDeck has document viewer

---

## 5) Research Findings

### Best Practices from Industry Leaders

#### Scrollytelling Patterns (The Pudding, NYT)

**Key Techniques:**
1. **Trigger-based animations** — Content changes tied to scroll position
2. **Sticky graphic containers** — Visual stays fixed while text scrolls past
3. **Progressive disclosure** — Information revealed in digestible chunks
4. **Visual anchoring** — Each text block has corresponding visual state

**Recommended Library:** `scrollama.js` — 2KB, IntersectionObserver-based, battle-tested

#### Developer Documentation (Stripe, Vercel)

**Stripe's Three-Column Pattern:**
- Left: Navigation sidebar (always visible)
- Center: Content (scrollable)
- Right: Live code examples (contextual)

**Key Insights:**
- Personalized code samples (language selector)
- Copy-to-clipboard for all code
- Dark/light theme toggle
- Version awareness

#### Interactive Learning (Codecademy, Egghead)

**Effective Patterns:**
1. **Immediate feedback** — Actions produce visible results
2. **Sandbox environments** — Safe space to experiment
3. **Progress indicators** — Visual completion tracking
4. **Bite-sized modules** — 5-15 minute segments optimal

#### Progress Tracking UX

**Research Finding:** Progress bars increase perceived wait time by 3x — users stay engaged longer

**Best Patterns:**
- Vertical stepper for lesson navigation
- Horizontal bar for overall course progress
- Completion badges/checkmarks per module
- "Continue where you left off" feature

### Design Patterns for Dark Themes

**Eye Strain Reduction:**
- Background: `#0a0a0f` (not pure black)
- Text: `#f5f5f5` (not pure white)
- Reduced contrast ratio (~15:1, not 21:1)

**Cognitive Load:**
- Generous whitespace (1.75rem+ line height)
- Maximum 65-75 characters per line
- Clear visual hierarchy (3 levels max)

### Recommended UI/UX Patterns for This Project

1. **Course Landing Page**
   - Hero section with course title/description
   - Module list as vertical cards
   - Estimated time per module
   - Progress indicator (if implementing persistence)

2. **Module Navigation (Within Deck)**
   - Existing NavDots pattern is good
   - Add: Section title on hover (already exists)
   - Add: Estimated time remaining
   - Add: Module title in header

3. **Document Viewer Enhancement**
   - Keep expandable side panel pattern
   - Add: Tab switcher for multiple examples
   - Add: Syntax highlighting (use Shiki or similar)
   - Add: Copy button for code blocks

4. **Course Dashboard**
   - Grid of course tiles (like client portal but for courses)
   - Each tile: thumbnail, title, module count, estimated time
   - Coming soon: badges, completion status

---

## 6) Clarifications Needed

### Authentication Approach

1. **Google SSO vs Email/Password?**
   - Google SSO recommended for better security and user experience
   - Email/password is simpler but requires password management
   - Hybrid (both options) adds complexity

2. **Email domain validation strictness?**
   - Option A: Only `@33strategies.ai` emails
   - Option B: Allowlist of specific emails + domain check
   - Option C: Google Workspace organization restriction

### Content Organization

3. **Module ordering within course?**
   - Current decks have implicit order (Getting Started → Workflow → Existing Codebases → Orchestration)
   - Should this be enforced? (linear progression required)
   - Or flexible? (any order, recommended sequence shown)

4. **Learning module locations?**
   - Option A: Keep in `docs/learning-modules/` (current)
   - Option B: Move to `app/learning/[course]/[module]/` (Next.js convention)
   - Option C: Keep as reference, create new standardized versions in app/

### Design Decisions

5. **Document viewer multi-example feature?**
   - Feedback requests tabs for multiple examples
   - How many examples per concept is reasonable?
   - Should examples be file-based or inline?

6. **"Theory to Practice" pattern?**
   - Feedback requests this as recurring pattern
   - Visual treatment: banner, card, section label?
   - Placement: after each concept? grouped sections?

### Technical Scope

7. **Progress persistence?**
   - MVP without persistence (noted as out of scope)
   - But if desired: localStorage, database, or external service?
   - If database: new table or external analytics?

8. **Mobile experience?**
   - Current decks work on mobile but not optimized
   - Priority: desktop-first or responsive-first?
   - NavDots already hidden on mobile (good)

---

## 7) Recommended Approach

### Phase 1: Foundation (MVP)

1. **Authentication with Google SSO**
   - NextAuth.js v5 with Google provider
   - Email domain callback validation (`@33strategies.ai`)
   - Session integration with existing iron-session pattern
   - New routes: `/learning`, `/api/auth/google`

2. **Learning Dashboard**
   - `/learning` route with course grid
   - Single course tile: "33 Strategies AI Workflow: For Builders"
   - Reuse ContentIndex pattern adapted for courses

3. **Course Landing Page**
   - `/learning/ai-workflow` route
   - Module list with descriptions
   - Links to each learning module

4. **Shared Component Library**
   - Extract and standardize: Section, RevealText, ProgressBar, NavDots, Card, CodeBlock
   - New location: `components/learning/` or `components/deck/`
   - Migrate typography to Instrument Serif
   - Fix color tokens to match design system

### Phase 2: Module Standardization

5. **Refactor Learning Modules**
   - Move to `app/learning/ai-workflow/[module]/page.tsx`
   - Import shared components (eliminate duplication)
   - Standardize typography and colors
   - Apply consistent section label format

6. **Enhanced Document Viewer**
   - Tab-based multiple examples
   - Syntax highlighting with Shiki
   - Copy-to-clipboard functionality

### Phase 3: Component System Guide

7. **Create Guide Document**
   - `docs/developer-guides/learning-module-components.md`
   - Document all shared components with props/usage
   - Design tokens reference
   - Patterns (Section Label, Headline with Accent, etc.)

---

## 8) File Structure Proposal

```
app/
├── learning/
│   ├── page.tsx                    # Learning dashboard (course grid)
│   ├── layout.tsx                  # Learning layout (auth check)
│   ├── ai-workflow/
│   │   ├── page.tsx                # Course landing (module list)
│   │   ├── getting-started/
│   │   │   └── page.tsx            # Module 1
│   │   ├── claude-code-workflow/
│   │   │   └── page.tsx            # Module 2
│   │   ├── existing-codebases/
│   │   │   └── page.tsx            # Module 3
│   │   └── orchestration-system/
│   │       └── page.tsx            # Module 4
│   └── components/                 # Learning-specific components
│       ├── CourseCard.tsx
│       ├── ModuleList.tsx
│       └── GoogleAuthGate.tsx
├── api/
│   └── auth/
│       ├── [...nextauth]/          # NextAuth.js routes
│       │   └── route.ts
│       └── [client]/               # Existing client auth
│           └── route.ts

components/
├── deck/                           # Shared deck components
│   ├── Section.tsx
│   ├── RevealText.tsx
│   ├── ProgressBar.tsx
│   ├── NavDots.tsx
│   ├── Card.tsx
│   ├── CodeBlock.tsx
│   ├── DocumentViewer.tsx
│   ├── SectionLabel.tsx
│   └── index.ts
├── portal/                         # Existing portal components
│   ├── PasswordGate.tsx
│   └── ContentIndex.tsx
└── ui/                             # Generic UI components
    └── ...

lib/
├── auth.ts                         # NextAuth config + email validation
├── session.ts                      # Existing iron-session
├── clients.ts                      # Existing client registry
└── courses.ts                      # New course registry

docs/
├── ideation/
│   └── learn-33strategies-ai-platform.md  # This document
├── learning-modules/               # Original deck files (reference)
│   ├── ClaudeCodeWorkflowDeck.tsx
│   └── ...
└── developer-guides/
    └── learning-module-components.md      # New component system guide
```

---

## 9) Component System Outline

### Core Deck Components

```typescript
// components/deck/Section.tsx
interface SectionProps {
  id: string;
  className?: string;
  children: React.ReactNode;
  fullHeight?: boolean;  // default true
}

// components/deck/RevealText.tsx
interface RevealTextProps {
  delay?: number;        // stagger delay in seconds
  className?: string;
  children: React.ReactNode;
}

// components/deck/SectionLabel.tsx
interface SectionLabelProps {
  number: number | string;  // "01" or 1
  label: string;            // "THE THESIS"
  color?: string;           // default gold
}

// components/deck/Card.tsx
interface CardProps {
  highlight?: boolean;      // gold border
  className?: string;
  children: React.ReactNode;
}

// components/deck/DocumentViewer.tsx
interface DocumentViewerProps {
  documents: DocumentMeta[];  // array for tabs
  defaultDocument?: string;   // initial tab
  onClose: () => void;
}
```

### Design Tokens

```typescript
// lib/design-tokens.ts
export const colors = {
  background: '#0a0a0f',
  surface: '#111114',
  elevated: '#0d0d14',
  card: 'rgba(255,255,255,0.03)',
  text: '#f5f5f5',
  muted: '#888888',
  dim: '#555555',
  gold: '#d4a54a',
  goldGlow: 'rgba(212,165,74,0.3)',
  green: '#4ade80',
  blue: '#60a5fa',
  purple: '#a78bfa',
  red: '#f87171',
  border: 'rgba(255,255,255,0.08)',
};

export const fonts = {
  display: '"Instrument Serif", Georgia, serif',
  body: '"DM Sans", -apple-system, sans-serif',
  mono: '"JetBrains Mono", monospace',
};
```

---

## 10) Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google OAuth setup complexity | Medium | Medium | Clear documentation, test in dev first |
| Module refactoring breaks content | Low | Medium | Keep originals as reference, test thoroughly |
| Design inconsistencies remain | Medium | Low | Create checklist, use design tokens |
| Scope creep to add features | High | Medium | Strict MVP definition, defer to Phase 2+ |
| Mobile experience issues | Medium | Low | Desktop-first, progressive enhancement |

---

## Summary

This ideation document outlines a phased approach to building `learn.33strategies.ai`:

**Phase 1 (MVP):** Google SSO auth + Learning dashboard + Course landing + Shared components
**Phase 2:** Module standardization + Enhanced document viewer
**Phase 3:** Component system guide documentation

Key decisions needed from user:
1. Google SSO vs email/password (or both)
2. Email domain restriction approach
3. Module file locations
4. Progress persistence scope
5. Mobile priority level

The existing codebase provides solid patterns to build on, and the learning modules have good content but need design standardization and component extraction.
