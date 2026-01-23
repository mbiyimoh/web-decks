# CLAUDE.md — 33 Strategies Platform

## Project Overview

This is the **monorepo for the 33 Strategies web platform** — a Next.js 14 application that powers:

1. **Client Portals** — Password-protected project dashboards for active clients
2. **Clarity Canvas** — AI-powered platform for building customer clarity through structured modules
3. **Learning Platform** — Internal scrollytelling training modules for the 33 Strategies team
4. **Strategist Portals** — Internal team member dashboards
5. **Scrollytelling Decks** — Premium presentations (investor pitches, proposals, etc.)
6. **Public Validation** — Shareable links for real users to validate founder assumptions

**Live Site:** 33strategies.ai
**Database:** Supabase PostgreSQL via Prisma ORM
**Deployment:** Railway

---

## Quick Reference

| What | Where |
|------|-------|
| Local dev URL | http://localhost:3033 |
| Start dev server | `npm run dev` |
| Database schema | `prisma/schema.prisma` |
| Design system | `.claude/skills/33-strategies-frontend-design.md` |
| Developer guides | `docs/developer-guides/` |
| Clarity Canvas docs | `docs/clarity-canvas/` |

---

## Directory Structure

```
/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (33strategies.ai)
│   ├── client-portals/           # Client project dashboards
│   │   ├── [client]/             # Dynamic client routes (tradeblock, plya, wsbc)
│   │   └── [client]/project/     # Full project detail pages
│   ├── strategist-portals/       # Internal team dashboards
│   ├── clarity-canvas/           # Clarity Canvas platform
│   │   ├── modules/              # Clarity modules (persona-sharpener, etc.)
│   │   └── interview/            # Interactive interview flow
│   ├── learning/                 # Internal training platform
│   │   └── ai-workflow/          # Course modules
│   ├── validate/[slug]/          # Public validation questionnaires
│   ├── share/[slug]/             # Public shareable artifact links (password-protected)
│   ├── auth/                     # Authentication pages
│   └── api/                      # API routes
│       └── share/                # Share link creation and authentication
│
├── components/                   # Shared components
│   ├── deck/                     # Scrollytelling deck components
│   ├── portal/                   # Portal UI components (includes ShareLinkModal)
│   ├── share/                    # Share page components (SharePasswordGate)
│   ├── clients/                  # Client-specific deck components
│   └── auth/                     # Authentication components
│
├── lib/                          # Core utilities
│   ├── clarity-canvas/           # Clarity Canvas business logic
│   │   └── modules/              # Module-specific logic
│   │       └── persona-sharpener/  # Persona Sharpener module
│   ├── portal/                   # Portal data layer
│   ├── share/                    # Share link utilities (hashing, slug generation)
│   ├── auth.ts                   # NextAuth configuration
│   ├── session.ts                # iron-session configuration (portal + share links)
│   ├── clients.ts                # Client registry
│   ├── courses.ts                # Learning course registry
│   └── prisma.ts                 # Prisma client
│
├── docs/                         # Documentation
│   ├── developer-guides/         # Implementation patterns
│   └── clarity-canvas/           # Clarity Canvas documentation
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── .claude/
│   └── skills/                   # Claude Code skills
│       └── 33-strategies-frontend-design.md  # Design system spec
│
└── public/                       # Static assets
```

---

## Application Areas

### 1. Client Portals (`/client-portals/[client]`)

Password-protected dashboards for active clients showing:
- **Active Projects** — Status, progress, weekly tracks, action items
- **Active Work** — Links to in-progress Clarity Canvas sessions
- **Artifacts** — Delivered documents, decks, assets

**Key Files:**
- `components/portal/EnhancedPortal.tsx` — Main portal layout
- `components/portal/ProjectTile.tsx` — Expandable project card
- `lib/client-projects.ts` — Project data configuration
- `lib/portal/active-work.ts` — Database queries for active sessions

**Adding a new client:**
1. Add entry to `lib/clients.ts`
2. Add project data to `lib/client-projects.ts`
3. Set password in environment variables

#### Shareable Artifact Links

Clients can generate password-protected public URLs for specific artifacts (decks, proposals) to share with external parties (investors, advisors) without giving full portal access.

**Key Files:**
- `lib/share/utils.ts` — Slug generation, password hashing (bcrypt), verification
- `app/api/share/create/route.ts` — Create link (requires portal auth)
- `app/api/share/[slug]/auth/route.ts` — Password verification with brute-force protection
- `app/share/[slug]/page.tsx` — Public share page (SSR)
- `components/portal/ShareLinkModal.tsx` — Create link modal in portal
- `components/share/SharePasswordGate.tsx` — Password entry UI

**Configuration:**
- `lib/session.ts` — Session constants (`SHARE_PASSWORD_MIN_LENGTH`, `SHARE_SESSION_MAX_AGE_SECONDS`)
- Add `shareable: true` to ContentItem in `lib/clients.ts` to enable share button

**Security:**
- bcrypt password hashing (work factor 10, ~100ms)
- Per-link lockout: 5 attempts → 15-minute lockout
- Timing attack mitigation: 150ms artificial delay for invalid slugs
- Session isolation: Separate iron-session cookie per share link (path: `/share/{slug}`)
- 24-hour session expiry

**Database:**
- `ArtifactShareLink` model in `prisma/schema.prisma`
- Stores: slug (nanoid, 21 chars), hashedPassword, failedAttempts, lockedUntil

**Critical Gotchas:**
- OG image requires `runtime = 'nodejs'` (Prisma not compatible with edge runtime)
- Use full slug in cookie name (not truncated) to prevent collisions
- Always import design tokens from `@/components/portal/design-tokens` (don't hardcode colors)
- Session validation uses helper: `isShareSessionValid(session, slug)` from `lib/session.ts`

**See:** `docs/developer-guides/shareable-artifact-links-guide.md` for full tutorial

### 2. Clarity Canvas (`/clarity-canvas`)

AI-powered platform for building customer clarity through structured modules.

**Current Modules:**
- **Persona Sharpener** — Build validated customer personas through brain dumps and structured questionnaires

**Key Documentation:**
- `docs/clarity-canvas/clarity-canvas-handoff.md` — Architecture overview
- `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/` — Persona Sharpener docs

**Database Models:**
- `ClarityProfile` — User's profile with nested sections
- `ProfileSection`, `ProfileSubsection`, `ProfileField` — Hierarchical profile structure
- `Persona`, `PersonaBrainDump`, `SharpenerSession` — Persona Sharpener data
- `ValidationLink`, `ValidationSession`, `Response` — Validation system

### 3. Learning Platform (`/learning`)

Internal training for the 33 Strategies team via scrollytelling decks.

**Current Course:** "33 Strategies AI Workflow" with modules:
- Getting Started
- Claude Code Workflow
- Existing Codebases
- Orchestration System

**Key Files:**
- `lib/courses.ts` — Course registry
- `lib/progress.ts` — localStorage-based progress tracking
- `components/deck/` — Shared deck components

### 4. Validation System (`/validate/[slug]`)

Public validation questionnaires for real users to validate founder assumptions.

**Flow:**
1. Founder generates persona from brain dump
2. System generates customized questions with dual perspectives
3. Founder creates shareable validation link
4. Real users complete questionnaire (no auth required)
5. Founder reviews alignment scores in dashboard

**Key Files:**
- `app/validate/[slug]/` — Public questionnaire pages
- `app/api/validate/[slug]/` — Validation API endpoints
- `lib/clarity-canvas/modules/persona-sharpener/validation-utils.ts` — Validation helpers

### 5. Scrollytelling Decks

Premium presentations with scroll-triggered animations, used for:
- Client proposals
- Investor pitches
- Strategy presentations

**Key Components** (`components/deck/`):
- `Section` — Full-viewport scroll section
- `RevealText` — Fade-in animation wrapper
- `SectionLabel` — Gold uppercase labels
- `Card`, `CodeBlock` — Content containers
- `ProgressBar`, `NavDots` — Navigation elements

---

## Authentication

This project uses **two authentication systems**:

### 1. iron-session (Client/Strategist Portals)
Simple password-based authentication for portal access.

```typescript
// lib/session.ts
getSessionOptions()  // Returns iron-session config
```

**API Routes:**
- `/api/client-auth` — Unified client authentication
- `/api/strategist-auth/[strategist]` — Per-strategist authentication

### 2. NextAuth.js v5 (Learning Platform)
OAuth + credentials authentication for team members.

```typescript
// lib/auth.ts
NextAuth configuration with Google OAuth + credentials
```

**Restricted to:** `@33strategies.ai` emails

### Critical Gotcha: Route Conflicts

**Never add dynamic routes under `/api/auth/`** — they will conflict with NextAuth's `[...nextauth]` catch-all. Client portal auth was moved to `/api/client-auth/` for this reason.

---

## Database

### Connection

Uses **Supabase PostgreSQL** via Prisma ORM.

```bash
# Environment variable format (MUST include pgbouncer=true)
DATABASE_URL="postgresql://postgres.[ref]:[pw]@pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

**Critical:** Without `pgbouncer=true`, you'll get prepared statement conflicts. If this happens, restart your Supabase project from the dashboard.

### Prisma Commands

```bash
npx prisma generate        # Generate client after schema changes
npx prisma migrate dev     # Create and apply migrations
npx prisma db push         # Push schema changes (dev only)
npx prisma studio          # Database GUI
```

### Key Models

**User Management:**
- `User` — Unified user record with auth linkage

**Clarity Canvas:**
- `ClarityProfile` — User's clarity profile
- `ProfileSection`, `ProfileSubsection`, `ProfileField` — Nested structure
- `FieldSource` — Source tracking for profile data

**Persona Sharpener:**
- `PersonaBrainDump` — Voice/text input with extracted personas
- `Persona` — Generated customer persona
- `SharpenerSession` — Questionnaire session
- `Response` — Individual question responses

**Validation:**
- `ValidationLink` — Shareable validation link
- `ValidationSession` — Real user validation session

**Shareable Artifacts:**
- `ArtifactShareLink` — Password-protected artifact share links (slug, hashedPassword, lockout tracking)

---

## Design System

**Authoritative Source:** `.claude/skills/33-strategies-frontend-design.md`

Use `/design:audit <component>` to check brand alignment.

### Colors

```typescript
// Backgrounds
BG_PRIMARY = '#0a0a0f'    // Main background
BG_SURFACE = '#111114'    // Cards, containers
BG_ELEVATED = '#0d0d14'   // Headers, footers

// Text
TEXT_PRIMARY = '#f5f5f5'  // Headlines
TEXT_MUTED = '#888888'    // Body
TEXT_DIM = '#555555'      // Tertiary

// Accent
GOLD = '#d4a54a'          // Primary accent (signature color)
GOLD_GLOW = 'rgba(212,165,74,0.3)'

// Semantic
GREEN = '#4ade80'         // Success, strategy track
BLUE = '#60a5fa'          // Information
RED = '#f87171'           // Warnings, attention
```

### Typography

| Role | Font | Class |
|------|------|-------|
| Headlines | Instrument Serif | `font-display` |
| Body | DM Sans | `font-body` |
| Labels/Code | JetBrains Mono | `font-mono` |

**Label Pattern:**
```tsx
<p className="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase">
  SECTION LABEL
</p>
```

---

## Local Development

```bash
npm run dev  # Starts at http://localhost:3033
```

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1

# Authentication
SESSION_SECRET=<openssl rand -hex 32>
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=http://localhost:3033

# Client Passwords
PLYA_PASSWORD=...
TRADEBLOCK_PASSWORD=...
WSBC_PASSWORD=...

# Learning (optional for local)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LEARNING_PASSWORD=...

# OpenAI (for Clarity Canvas)
OPENAI_API_KEY=...
```

### Local URLs

| Feature | URL |
|---------|-----|
| Landing | http://localhost:3033 |
| Client Portals | http://localhost:3033/client-portals/[client] |
| Clarity Canvas | http://localhost:3033/clarity-canvas |
| Learning | http://localhost:3033/learning |
| Validation | http://localhost:3033/validate/[slug] |

---

## Deployment (Railway)

Configuration in `railway.toml`.

### Critical Next.js Settings

```toml
[deploy]
startCommand = "next start -H 0.0.0.0 -p $PORT"
healthcheckPath = "/api/health"
```

**Must bind to `0.0.0.0`** — Railway routes traffic via PORT, and localhost binding won't receive it.

### Common Commands

```bash
railway up           # Deploy from local
railway logs         # View runtime logs
railway logs -b      # View build logs
railway variables    # List env vars
railway redeploy     # Redeploy latest
```

### Debugging 502 Errors

1. Check start command includes `-H 0.0.0.0 -p $PORT`
2. Check health endpoint returns 200 at `/api/health`
3. Check logs show `Network: http://0.0.0.0:PORT`
4. Verify middleware isn't blocking health checks

---

## Critical Patterns & Gotchas

### Persona Sharpener: Two-Tier Question System

**Problem:** Displaying wrong question text in questionnaire UI.

**Solution:** Always use customized text, not base question text:

```tsx
// CORRECT: Use customized question text
{currentCustomizedQuestion?.text || currentQuestion.question}

// WRONG: Uses generic base question
{currentQuestion.question}
```

See `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/customized-questions-pattern.md`.

### Validation Links: Dual Perspectives

Questions have two framings:
- `contextualizedText` — Founder perspective (questionnaire)
- `validationContextualizedText` — User perspective (validation links)

**In validation UI, always use `validationContextualizedText`.**

### Response Metrics: Calculate from Records

Never read metrics like `unsureCount` from denormalized database fields — always calculate from actual Response records:

```typescript
// CORRECT
const unsureCount = responses.filter((r) => r.isUnsure).length;

// WRONG (stale data)
const unsureCount = persona.totalAssumptions;
```

### React Strict Mode

Prevent duplicate initialization in development:

```tsx
const hasInitialized = useRef(false);

useEffect(() => {
  if (hasInitialized.current) return;
  hasInitialized.current = true;
  // initialization logic
}, []);
```

### Middleware: Edge Runtime Limits

Middleware runs in Edge Runtime — cannot use iron-session, Prisma, etc. Keep middleware minimal (cookie checks only), move heavy logic to Server Components/API routes.

---

## Key Documentation

### Developer Guides (`docs/developer-guides/`)
- `learning-module-components.md` — Shared deck component system
- `openai-structured-outputs-gotchas.md` — Zod schema constraints for OpenAI

### Clarity Canvas (`docs/clarity-canvas/`)
- `clarity-canvas-handoff.md` — Full architecture specification
- `clarity-modules-and-artifacts/persona-sharpener/` — Persona Sharpener docs
  - `customized-questions-pattern.md` — **Critical:** Two-tier question system
  - `persona-sharpener-handoff.md` — Module architecture
  - `voice-text-extraction-pattern.md` — Brain dump processing

### Design System
- `.claude/skills/33-strategies-frontend-design.md` — Authoritative design spec
- `docs/learning-modules/learning-modules-handoff.md` — Brand patterns

---

## Task Management

This project uses **STM (Simple Task Master)** for tracking implementation tasks.

```bash
stm list --pretty         # List all tasks
stm add "Task" ...        # Add task
stm update <id> --status completed
stm grep "pattern"        # Search tasks
```

### Workflow Commands

```bash
/spec:create <description>      # Create specification
/spec:validate <spec-file>      # Check spec completeness
/spec:decompose <spec-file>     # Break into tasks
/spec:execute <spec-file>       # Implement specification
/design:audit <component>       # Check design compliance
```

---

## API Routes Reference

### Client Authentication
- `POST /api/client-auth` — Unified client login
- `POST /api/logout` — Logout

### Clarity Canvas
- `GET/POST /api/clarity-canvas/profile` — Profile CRUD
- `POST /api/clarity-canvas/extract` — Brain dump extraction
- `POST /api/clarity-canvas/transcribe` — Voice transcription

### Persona Sharpener
- `GET/POST /api/clarity-canvas/modules/persona-sharpener/personas` — Personas
- `GET/POST .../personas/[personaId]/responses` — Responses
- `POST .../personas/[personaId]/validation-link` — Create validation link
- `GET .../personas/[personaId]/validation-responses` — Validation dashboard data
- `POST .../brain-dump` — Process brain dump
- `GET/POST .../sessions` — Sharpener sessions

### Validation (Public)
- `GET /api/validate/[slug]` — Get validation context
- `POST /api/validate/[slug]/session` — Create session
- `POST /api/validate/[slug]/respond` — Submit response
- `POST /api/validate/[slug]/complete` — Complete session

### Shareable Artifacts (Public + Portal Auth)
- `POST /api/share/create` — Create share link (requires portal auth)
- `POST /api/share/[slug]/auth` — Password verification (public, brute-force protected)

### Health
- `GET /api/health` — Railway health check

---

## Getting Help

- Check `docs/developer-guides/` for implementation guides:
  - `shareable-artifact-links-guide.md` — Password-protected share links tutorial
  - `scrollytelling-deck-guide.md` — Deck component patterns
  - `learning-module-components.md` — Shared deck components
- Use `/design:audit` for brand compliance
- Reference `.claude/skills/33-strategies-frontend-design.md` for design decisions
- Check existing components in `components/` for patterns

---

*Last Updated: January 2025*
