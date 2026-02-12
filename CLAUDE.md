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
- `InputSession` — Raw user inputs (brain dumps) with metadata
- `FieldSource` — Links extracted chunks to their source InputSession
- `Persona`, `PersonaBrainDump`, `SharpenerSession` — Persona Sharpener data
- `ValidationLink`, `ValidationSession`, `Response` — Validation system

#### Raw Input Archive (`/clarity-canvas/archive`)

Preserves all raw user inputs (brain dumps, voice transcripts, file uploads) with source attribution.

**Key Files:**
- `app/clarity-canvas/archive/` — Archive page and components
- `lib/input-session/` — Types and utilities for InputSession management
- `components/clarity-canvas/FieldCitation.tsx` — Source citation popover with deep-linking

**Data Flow:**
1. User submits brain dump → stored as `InputSession.rawContent`
2. AI extracts chunks → each saved as `FieldSource.rawContent` linked to InputSession
3. Field displays show source count → clicking opens popover with "View in archive" links
4. Deep-link navigates to archive with session auto-expanded and highlighted

**Key Pattern - Atomic Commits:**
The commit route (`/api/clarity-canvas/commit`) creates InputSession AFTER all field updates succeed to prevent orphaned sessions on partial failures.

```typescript
// Create FieldSources first (without inputSessionId)
const createdFieldSourceIds: string[] = [];
for (const rec of recommendations) {
  const fieldSource = await prisma.fieldSource.create({...});
  createdFieldSourceIds.push(fieldSource.id);
}

// Create InputSession only after all succeed
const inputSession = await prisma.inputSession.create({...});

// Link FieldSources to InputSession
await prisma.fieldSource.updateMany({
  where: { id: { in: createdFieldSourceIds } },
  data: { inputSessionId: inputSession.id },
});
```

**Gotcha - FieldSource.rawContent vs InputSession.rawContent:**
- `InputSession.rawContent` = verbatim user input
- `FieldSource.rawContent` = AI-summarized/extracted text (NOT verbatim)
- Deep-linking highlights the card, not specific text (text matching won't work)

#### Expandable Field Details

Pillar pages show expandable field items. Clicking a field with data expands to show up to 400 characters of `fullContext`.

**Implementation:** `app/clarity-canvas/[pillar]/PillarPageClient.tsx`
- State: `expandedFieldKey` tracks which field is expanded
- Any field with `hasData` shows chevron and is clickable
- Uses framer-motion AnimatePresence for smooth expand/collapse

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

### 6. Central Command (`/central-command`)

Internal admin dashboard for sales pipeline management. Password-protected via iron-session.

**Features:**
- AI-powered prospect intake from text dumps (meeting notes, call transcripts)
- 8-stage pipeline tracking (Lead → Kickoff)
- Prompt-based field editing with version history
- Team capacity management
- Closed deal tracking with lessons learned

**Key Files:**
- `app/central-command/page.tsx` — Server Component with auth + data fetch
- `app/central-command/CentralCommandClient.tsx` — Main client component
- `app/central-command/components/` — All UI components (11 total)
- `lib/central-command/` — Business logic, schemas, prompts, queries, utils

**Database Models:**
- `PipelineClient` — Company info + enrichment fields + primary contact
  - `enrichmentFindings Json?` — 6 synthesis sections (companyOverview, goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach)
  - `enrichmentFindingsVersions Json?` — Per-section version history: `{ companyOverview: Version[], ... }`
- `PipelineRecord` — Pipeline status, stage tracking, scores, version-tracked fields
- `TeamCapacity` — Team member utilization and allocation data

**API Routes:**
- `POST /api/central-command/auth` — Password authentication
- `POST /api/central-command/extract` — AI extraction from text dump (gpt-4o)
- `POST /api/central-command/refine` — Prompt-based single-field refinement (gpt-4o-mini)
- `POST /api/central-command/refine-synthesis` — Global multi-section synthesis refinement (gpt-4o-mini)
- `POST /api/central-command/transcribe` — Voice transcription with CC auth (Whisper-1)
- `GET/POST /api/central-command/prospects` — List all / create new
- `GET/PATCH /api/central-command/prospects/[id]` — Detail / update (handles stage, close, versions, synthesis)
- `GET /api/central-command/team` — List team members
- `PATCH /api/central-command/team/[id]` — Update team member

**Environment:**
- `CENTRAL_COMMAND_PASSWORD` — Required for auth

#### Synthesis Refinement (New)

Iterative AI-powered improvement of the 6 Client Intelligence synthesis sections. Two modes: global (multi-section) and targeted (single-section).

**Key Patterns:**
- **Client-side version building** — Use `buildSynthesisVersionUpdate()` to construct full version object before PATCH
- **Server-side merge** — Both `enrichmentFindings` and `enrichmentFindingsVersions` use `{ ...existing, ...updates }` to prevent overwrites
- **Per-section versioning** — Each section tracks up to 10 versions independently
- **Dual refinement modes** — Global bar affects multiple sections, inline input affects one section

**Gotchas:**
- `parseVersions()` accepts `unknown` — don't use `as unknown` cast (TypeScript naturally allows `Version[] | undefined`)
- Empty `updatedSections` from AI needs user-friendly error message in client
- `z.record()` requires both key and value schemas: `z.record(z.string(), z.object({...}))`
- PATCH handler must merge, not replace, to avoid race condition data loss

**Key Files:**
- `app/central-command/components/EditableSynthesisBlock.tsx` — Per-section editing with states: VIEW/EDIT/REFINING/HISTORY
- `app/central-command/components/SynthesisGlobalRefine.tsx` — Global prompt bar + inline voice recording
- `lib/central-command/utils.ts` — `buildSynthesisVersionUpdate()` client-side utility
- `docs/developer-guides/synthesis-refinement-guide.md` — Full tutorial

#### Intelligent Scoring with Learning Loop (New)

AI-powered prospect scoring across 5 dimensions with human feedback calibration. The system learns from score adjustments to improve future extractions.

**Score Dimensions (1-10 scale):**
- `strategic` — Logo/brand value, network potential, referral value
- `value` — Revenue potential, budget signals, growth opportunity
- `readiness` — Pain urgency, active search, readiness to buy
- `timeline` — Forcing functions, deadlines, urgency signals
- `bandwidth` — Capacity fit, scope complexity (higher = easier for us)

**Key Features:**
- **Inline score editing** — Click any score to adjust with rationale
- **Learning loop** — Feedback triggers LLM-powered rubric refinement
- **Dynamic rubrics** — Extraction prompts use current calibrated rubrics
- **3-tier fallback** — Database → cache → initial rubrics (extraction never fails)
- **Version tracking** — Scores track version numbers for audit trail

**Architecture:**
```
User adjusts score → PATCH /api/central-command/prospects/[id]
                   → POST /api/central-command/rubric/feedback
                   → LLM evaluates if rubric needs updating
                   → New rubric version created (if warranted)
                   → Future extractions use updated rubrics
```

**Key Files:**
- `lib/central-command/rubric.ts` — Rubric CRUD, `getRubricsWithFallback()`, feedback processing
- `lib/central-command/prompts.ts` — `buildExtractionSystemPrompt(rubrics)` for dynamic injection
- `lib/central-command/score-display.ts` — Canonical score colors, thresholds, labels
- `app/central-command/components/ScoreDisplay.tsx` — Inline score editing UI
- `app/api/central-command/rubric/route.ts` — Get rubrics (with feedback history)
- `app/api/central-command/rubric/feedback/route.ts` — Submit feedback, trigger learning

**Database Models:**
- `ScoringRubric` — Active rubric per dimension with high/medium/low indicators
- `RubricFeedback` — Human correction history linked to triggering rubric

**Gotchas:**
- `SCORE_KEYS` array in `score-display.ts` is canonical — import from there
- Rubric cache is module-level, not request-scoped (persists across requests in serverless)
- `buildExtractionSystemPrompt()` must receive all 5 dimensions (use `INITIAL_RUBRICS` as fallback)
- Score colors use `SCORE_THRESHOLDS.HIGH` (7+) and `MEDIUM` (4+) constants

**See:** `docs/developer-guides/central-command-scoring-guide.md` for full tutorial

### 7. Companion API (`/api/companion`)

OAuth-protected API for external AI products to access Clarity Canvas user context.

**Purpose:** Enables third-party AI applications (e.g., Better Contacts) to personalize their experiences using synthesized user data from Clarity Canvas profiles.

**Architecture:**
- Progressive disclosure model (base synthesis → on-demand sections → search)
- OAuth 2.0 with PKCE for secure authorization
- Token-based access with configurable scopes
- ETag caching for efficient data transfer

**Key Endpoints:**
- `GET /api/companion/synthesis/base` — Base synthesis (~800 tokens)
- `GET /api/companion/profile/index` — Section metadata
- `GET /api/companion/profile/section/:sectionId` — Full section detail
- `POST /api/companion/profile/search` — Natural language search
- `POST /api/companion/cache/validate` — Cache validation

**Key Files:**
- `app/api/companion/` — All Companion API routes
- `lib/companion/` — Synthesis generation, tool definitions, prompts
- `lib/oauth.ts` — Token validation and scope checking

**Required Scopes:**
- `read:synthesis` — Base synthesis endpoint
- `read:profile` — Profile section endpoints
- `search:profile` — Search endpoint

**See:** `docs/developer-guides/companion-api-integration.md` for full integration guide

---

## Authentication

This project uses **three authentication systems** with a unified auth helper:

### 1. iron-session (Client/Strategist Portals)
Simple password-based authentication for portal access.

```typescript
// lib/session.ts
getSessionOptions()  // Returns iron-session config
```

**API Routes:**
- `/api/client-auth` — Unified client authentication
- `/api/strategist-auth/[strategist]` — Per-strategist authentication

### 2. NextAuth.js v5 (Team Members)
OAuth + credentials authentication for team members.

```typescript
// lib/auth.ts
NextAuth configuration with Google OAuth + credentials
```

**Restricted to:** `@33strategies.ai` emails

### 3. OAuth 2.0 (External Integrations)
Authorization code flow with PKCE for third-party apps (e.g., Better Contacts).

**Key Files:**
- `lib/oauth.ts` — Token validation, scope checking
- `lib/auth/unified-auth.ts` — Unified auth helper (checks all three systems)
- `app/api/oauth/authorize/route.ts` — Authorization endpoint
- `app/api/oauth/token/route.ts` — Token exchange endpoint

**Database Models:**
- `OAuthClient` — Registered OAuth clients
- `OAuthAuthorizationCode` — Temporary authorization codes
- `OAuthAccessToken`, `OAuthRefreshToken` — Issued tokens
- `OAuthUserConsent` — User consent records

**Registering a client:**
```bash
npx tsx prisma/seed-better-contacts.ts  # Example seed script
```

### Unified Auth Helper

Use `getAuth()` for API routes that need to support multiple auth methods:

```typescript
import { getAuth } from '@/lib/auth/unified-auth';

export async function GET(request: NextRequest) {
  const auth = await getAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // auth.method tells you: 'token' | 'session' | 'none'
  // auth.userId, auth.clientId, auth.email, auth.scopes available
}
```

**Auth check order:**
1. Bearer token (OAuth access token)
2. NextAuth session (Google OAuth for team members)
3. iron-session (client/strategist portals)

### Signin Page & Redirect Validation

The unified signin page (`/auth/signin`) handles all auth types:

```typescript
// Supports both internal and OAuth callback params
const { returnTo, callbackUrl } = await searchParams;
const destination = validateReturnTo(returnTo || callbackUrl);
```

**`validateReturnTo()` security features** (`lib/auth-utils.ts`):
- Handles both relative paths (`/learning`) and full URLs (`https://33strategies.ai/api/oauth/...`)
- Validates host against allowlist: `33strategies.ai`, `localhost:3033`, `localhost:3000`
- Blocks protocol-relative URLs (`//evil.com`)
- Blocks dangerous protocols (`javascript:`, `data:`)
- Allowlisted prefixes: `/learning`, `/clarity-canvas`, `/auth`, `/api/oauth`, `/client-portals`, `/strategist-portals`, `/central-command`

### Critical Gotchas

**Route Conflicts:** Never add dynamic routes under `/api/auth/` — they conflict with NextAuth's `[...nextauth]` catch-all. Client portal auth was moved to `/api/client-auth/`.

**getAuth() vs getUnifiedSession():** Both must check the same auth sources. If adding a new auth method, update BOTH:
- `lib/auth/unified-auth.ts` → `getAuth()` — Used by API routes
- `lib/client-session-bridge.ts` → `getUnifiedSession()` — Used by Server Components

**OAuth URL Construction:** In Railway, `request.url` contains the internal server address (e.g., `0.0.0.0:8080`). Always use `NEXTAUTH_URL` for user-facing redirects:
```typescript
const BASE_URL = process.env.NEXTAUTH_URL || 'https://33strategies.ai';
const loginUrl = new URL('/auth/signin', BASE_URL);
```

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

### Seed Scripts

```bash
npx tsx scripts/seed-rubrics.ts  # Seed Central Command scoring rubrics (v1)
```

**Central Command Scoring Rubrics:** The learning loop for prospect scoring requires initial rubrics to be seeded. Run this after schema migrations on a fresh database. The script is idempotent (skips dimensions that already have active rubrics).

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

**OAuth 2.0:**
- `OAuthClient` — Registered OAuth clients (clientId, redirectUris, scopes)
- `OAuthAuthorizationCode` — Temporary auth codes (5-minute expiry)
- `OAuthAccessToken`, `OAuthRefreshToken` — Issued tokens
- `OAuthUserConsent` — User consent records for third-party apps

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

# Central Command
CENTRAL_COMMAND_PASSWORD=...
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

### OAuth 2.0
- `GET /api/oauth/authorize` — Authorization endpoint (redirects to signin if needed)
- `POST /api/oauth/token` — Token exchange (auth code → access/refresh tokens)
- `POST /api/oauth/revoke` — Token revocation

### Companion API (OAuth-protected)
- `GET /api/companion/synthesis/base` — Base synthesis (~800 tokens)
- `GET /api/companion/profile/index` — Section metadata for routing
- `GET /api/companion/profile/section/:id` — Full section detail
- `POST /api/companion/profile/search` — Natural language search
- `POST /api/companion/cache/validate` — Check cached data validity

### Clarity Canvas
- `GET/POST /api/clarity-canvas/profile` — Profile CRUD
- `POST /api/clarity-canvas/extract` — Brain dump extraction (two-pass with gap analysis)
- `POST /api/clarity-canvas/commit` — Commit approved recommendations to profile
- `POST /api/clarity-canvas/transcribe` — Voice transcription
- `GET /api/clarity-canvas/sessions` — List InputSessions for archive
- `GET /api/clarity-canvas/fields/[id]/sources` — Get FieldSources for a field (deep-linking)

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

### Central Command
- `POST /api/central-command/auth` — Password authentication
- `POST /api/central-command/extract` — AI extraction from text dump (uses dynamic rubrics)
- `POST /api/central-command/refine` — Prompt-based field refinement
- `POST /api/central-command/refine-synthesis` — Global multi-section synthesis refinement
- `POST /api/central-command/transcribe` — Voice transcription (Whisper-1)
- `GET /api/central-command/prospects` — List all prospects + team data
- `POST /api/central-command/prospects` — Create new prospect
- `GET /api/central-command/prospects/[id]` — Prospect detail
- `PATCH /api/central-command/prospects/[id]` — Update prospect (fields, stage, scores, synthesis)
- `GET /api/central-command/team` — List team members
- `PATCH /api/central-command/team/[id]` — Update team member
- `GET /api/central-command/rubric` — Get all rubrics + feedback history
- `POST /api/central-command/rubric/feedback` — Submit score feedback (triggers learning loop)

### Health
- `GET /api/health` — Railway health check

---

## Getting Help

- Check `docs/developer-guides/` for implementation guides:
  - `companion-api-integration.md` — OAuth + Companion API integration for external apps
  - `central-command-scoring-guide.md` — Scoring learning loop and rubric system
  - `synthesis-refinement-guide.md` — Central Command synthesis refinement (global + targeted modes)
  - `shareable-artifact-links-guide.md` — Password-protected share links tutorial
  - `scrollytelling-deck-guide.md` — Deck component patterns
  - `learning-module-components.md` — Shared deck components
  - `33-strategies-question-ui-guide.md` — Question UI patterns
  - `validation-response-viewer-guide.md` — Validation dashboard patterns
- Use `/design:audit` for brand compliance
- Reference `.claude/skills/33-strategies-frontend-design.md` for design decisions
- Check existing components in `components/` for patterns

---

*Last Updated: February 2026*
