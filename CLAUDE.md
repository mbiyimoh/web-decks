# CLAUDE.md — Web Decks System

## Project Purpose

This repo is a system for creating premium, scrollytelling web decks — investor pitches, strategy presentations, narrative documents, and other high-stakes communications that deserve more than a PowerPoint.

Each deck is a standalone React application with scroll-triggered animations, full-viewport sections, and a dark editorial aesthetic. The system provides shared components, design tokens, and patterns so new decks can be spun up quickly while maintaining visual and technical consistency.

---

## Directory Structure

```
/
├── CLAUDE.md                     # You are here
├── README.md                     # Project overview
├── package.json                  # Root dependencies (React, Framer Motion, etc.)
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config with design tokens
│
├── components/                   # Shared components (used across all decks)
│   ├── Section.tsx               # Full-viewport scroll section wrapper
│   ├── RevealText.tsx            # Animated text reveal component
│   ├── ProgressBar.tsx           # Fixed scroll progress indicator
│   ├── NavDots.tsx               # Side navigation dots
│   ├── DemoPlaceholder.tsx       # Video/demo placeholder
│   ├── StatusBadge.tsx           # Status indicators (Completed, In Beta, etc.)
│   └── index.ts                  # Barrel export
│
├── lib/                          # Utilities and helpers
│   ├── animations.ts             # Framer Motion animation presets
│   ├── hooks.ts                  # Custom hooks (useActiveSection, etc.)
│   └── types.ts                  # Shared TypeScript types
│
├── styles/                       # Design system
│   ├── tokens.ts                 # Color, typography, spacing tokens
│   └── globals.css               # Global styles, font imports
│
├── decks/                        # All decks organized by entity
│   ├── tradeblock/
│   │   ├── ai-inflection-2025/   # Individual deck
│   │   │   ├── page.tsx          # Main deck component
│   │   │   ├── components/       # Deck-specific components
│   │   │   ├── content.ts        # Deck content/copy (optional)
│   │   │   ├── assets/           # Deck-specific images/videos
│   │   │   └── README.md         # Deck-specific notes
│   │   └── [future-deck]/
│   │
│   └── 33-strategies/
│       └── [deck-name]/
│
└── public/                       # Static assets (fonts, global images)
```

---

## Shared Components

### Section

Full-viewport wrapper that fades in when scrolled into view.

```tsx
import { Section } from '@/components';

<Section id="intro" className="bg-black">
  {/* Content */}
</Section>
```

**Props:**
- `id` (string, required) — Unique identifier for navigation
- `className` (string) — Additional Tailwind classes
- `children` (ReactNode) — Section content

### RevealText

Animated text container. Fades in and slides up when visible.

```tsx
import { RevealText } from '@/components';

<RevealText delay={0.2}>
  <h2>Headline</h2>
</RevealText>
```

**Props:**
- `delay` (number) — Animation delay in seconds (default: 0)
- `className` (string) — Additional classes
- `children` (ReactNode) — Content to animate

### ProgressBar

Fixed scroll progress indicator at top of viewport.

```tsx
import { ProgressBar } from '@/components';

<ProgressBar color="#f59e0b" />
```

**Props:**
- `color` (string) — Progress bar color (default: amber)

### NavDots

Fixed right-side navigation dots. Desktop only.

```tsx
import { NavDots } from '@/components';

const sections = [
  { id: 'intro', label: 'Introduction' },
  { id: 'problem', label: 'The Problem' },
  // ...
];

<NavDots sections={sections} activeSection={activeSection} />
```

**Props:**
- `sections` (array) — Array of `{ id, label }` objects
- `activeSection` (string) — Currently active section ID

### DemoPlaceholder

Placeholder for video demos. Replace with `<video>` when ready.

```tsx
import { DemoPlaceholder } from '@/components';

<DemoPlaceholder
  title="Product Demo"
  duration="20-30 sec"
  description="Show the key workflow"
/>
```

**Props:**
- `title` (string) — Demo title
- `duration` (string) — Expected duration
- `description` (string) — What the demo should show

### StatusBadge

Status indicator badges for roadmaps, phases, etc.

```tsx
import { StatusBadge } from '@/components';

<StatusBadge status="completed" />
<StatusBadge status="in-progress" />
<StatusBadge status="beta" />
<StatusBadge status="live" />
```

**Props:**
- `status` (string) — One of: `completed`, `in-progress`, `beta`, `live`, `planned`

---

## Design System

**IMPORTANT:** The authoritative design specification is in `.claude/skills/33-strategies-frontend-design.md`. Always reference it when:
- Creating new components or decks
- Reviewing/auditing existing designs
- Checking brand alignment

Use `/design:audit <component>` to check any component against the design system.

### Colors

```ts
// Backgrounds - Dark with subtle blue undertone
const BG_PRIMARY = '#0a0a0f';
const BG_SURFACE = '#111114';
const BG_ELEVATED = '#0d0d14';
const BG_CARD = 'rgba(255,255,255,0.03)';

// Text Hierarchy
const TEXT_PRIMARY = '#f5f5f5';
const TEXT_MUTED = '#888888';
const TEXT_DIM = '#555555';

// Primary Accent - Warm Gold (signature color)
const GOLD = '#d4a54a';
const GOLD_GLOW = 'rgba(212,165,74,0.3)';

// Semantic Colors
const GREEN = '#4ade80';   // Value creation, success
const BLUE = '#60a5fa';    // Information
const PURPLE = '#a78bfa';  // Transformation
const RED = '#f87171';     // Warnings

// Borders
const BORDER = 'rgba(255,255,255,0.08)';
```

### Typography

Fonts configured in `tailwind.config.ts` and loaded via Google Fonts:

| Role | Font | Tailwind Class |
|------|------|----------------|
| Display/Headlines | Instrument Serif | `font-display` |
| Body/UI | DM Sans | `font-body` |
| Technical/Labels | JetBrains Mono | `font-mono` |

```css
.font-display { font-family: 'Instrument Serif', Georgia, serif; }
.font-body { font-family: var(--font-body), sans-serif; }
.font-mono { font-family: var(--font-mono), monospace; }
```

**Usage Rules:**
- Headlines and the "33" in brand name: `font-display`
- Body text, buttons, descriptions: `font-body`
- Section labels, tags, code: `font-mono` with `tracking-[0.2em] uppercase`

### Animation Presets

Defined in `lib/animations.ts`:

```ts
export const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, ease: 'easeOut' },
};

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } },
};
```

---

## Creating a New Deck

### 1. Create directory structure

```bash
mkdir -p decks/[entity]/[deck-name]/{components,assets}
```

Example:
```bash
mkdir -p decks/33-strategies/annual-review-2025/{components,assets}
```

### 2. Create the main deck file

Copy the template structure:

```tsx
// decks/[entity]/[deck-name]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Section, RevealText, ProgressBar, NavDots } from '@/components';

const sections = [
  { id: 'title', label: 'Title' },
  { id: 'section-1', label: 'Section 1' },
  // Add your sections
];

export default function DeckName() {
  const [activeSection, setActiveSection] = useState('title');

  useEffect(() => {
    // Section observer logic
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <ProgressBar />
      <NavDots sections={sections} activeSection={activeSection} />

      <Section id="title">
        <RevealText>
          <h1>Deck Title</h1>
        </RevealText>
      </Section>

      {/* Add more sections */}
    </div>
  );
}
```

### 3. Add deck-specific components

If a deck needs unique components (custom cards, visualizations, etc.), put them in the deck's `components/` folder:

```
decks/[entity]/[deck-name]/components/
├── CustomChart.tsx
├── TeamCard.tsx
└── index.ts
```

### 4. Add assets

Place deck-specific images and videos in the `assets/` folder:

```
decks/[entity]/[deck-name]/assets/
├── demo-video.mp4
├── team-photo.jpg
└── logo.svg
```

### 5. Create a README

Document deck-specific details:

```markdown
# [Deck Name]

## Purpose
What this deck is for, who the audience is.

## Content Status
- [ ] Copy finalized
- [ ] Demo videos recorded
- [ ] Calendar link added

## Deployment
URL: https://...
```

---

## Local Development

**Always run the dev server on port 3033:**

```bash
npm run dev
# Starts at http://localhost:3033
```

The port is configured in `package.json` scripts. This avoids conflicts with other local projects.

### Local URLs

| Route | URL |
|-------|-----|
| Landing page | http://localhost:3033 |
| PLYA portal | http://localhost:3033/client-portals/plya |
| Tradeblock portal | http://localhost:3033/client-portals/tradeblock |
| WSBC portal | http://localhost:3033/client-portals/wsbc |

### Environment Variables

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required for authentication to work locally:
- `SESSION_SECRET` - Generate with `openssl rand -hex 32`
- `PLYA_PASSWORD` - Password for PLYA portal
- `TRADEBLOCK_PASSWORD` - Password for Tradeblock portal
- `WSBC_PASSWORD` - Password for WSBC portal

---

## Database

This project uses **Supabase PostgreSQL** for all database needs (Clarity Canvas, Persona Sharpener, etc.).

**Project:** `33-strategies-website-and-portals`
**Dashboard:** https://supabase.com/dashboard/project/skimccdltdnzsvrfdaek

### Connection

Database access is via Prisma ORM. The connection string is set via `DATABASE_URL` environment variable.

```bash
# Format (pooler connection for serverless) - MUST include pgbouncer=true
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

**CRITICAL: PgBouncer Configuration Gotcha**

When using Supabase's connection pooler (port 6543), you **MUST** include `?pgbouncer=true` in the DATABASE_URL or you'll get prepared statement conflicts:

```
PostgresError { code: "42P05", message: "prepared statement already exists" }
```

**If you ever connect without `pgbouncer=true`:**
1. The prepared statement cache becomes corrupted
2. Adding the flag afterward won't fix it
3. **Solution:** Restart your Supabase project from the dashboard to clear the cache

**Correct URL format:**
```
postgresql://postgres.xxx:[pw]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

Note the single `?` before first parameter, then `&` for subsequent parameters.

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration-name>

# Push schema changes without migration (dev only)
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (DESTRUCTIVE - dev only)
npx prisma migrate reset
```

### Schema Location

Database schema is defined in `prisma/schema.prisma`. Key models:
- `ClarityProfile` - User's clarity canvas profile
- `ProfileSection`, `ProfileSubsection`, `ProfileField` - Nested profile structure
- `Persona`, `PersonaBrainDump`, `PersonaSession` - Persona Sharpener data
- `User`, `Account`, `Session` - NextAuth authentication

**Important:** Always run `npx prisma generate` after pulling schema changes.

---

## Deployment

Each deck can be deployed independently or as part of a multi-deck site.

### Single Deck Deployment (Vercel)

```bash
# From repo root
vercel --cwd decks/[entity]/[deck-name]
```

### Multi-Deck Site (Next.js App Router)

Structure decks as routes:

```
app/
├── tradeblock/
│   └── ai-inflection/
│       └── page.tsx → imports from decks/tradeblock/ai-inflection-2025/
├── 33-strategies/
│   └── annual-review/
│       └── page.tsx → imports from decks/33-strategies/annual-review-2025/
└── page.tsx → Landing/index page
```

---

## Conventions

### Naming

- **Directories:** kebab-case (`ai-inflection-2025`, `annual-review-2025`)
- **Components:** PascalCase (`RevealText.tsx`, `StatusBadge.tsx`)
- **Files:** kebab-case for non-components (`animations.ts`, `tokens.ts`)

### Section IDs

Use descriptive, URL-friendly IDs:
- ✅ `intro`, `problem`, `solution`, `team`, `ask`
- ❌ `slide-1`, `section-2`, `s3`

### Animation Delays

Stagger content within sections using 0.05-0.1s increments:

```tsx
<RevealText delay={0}>Title</RevealText>
<RevealText delay={0.1}>Subtitle</RevealText>
<RevealText delay={0.2}>Body</RevealText>
<RevealText delay={0.3}>CTA</RevealText>
```

### Responsive Behavior

- Sections should be full-viewport on all devices
- NavDots hidden on mobile (< 1024px)
- Font sizes scale down on mobile using Tailwind responsive prefixes
- Test on mobile before deploying

### Accessibility

- All sections should have unique `id` attributes
- Videos should have `muted` and `playsInline` for autoplay
- Ensure sufficient color contrast (use design tokens)
- Add `aria-label` to navigation elements

---

## Common Patterns

### Gradient Text

```tsx
<span className="bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
  Highlighted Text
</span>
```

### Glow Effect

```tsx
<div style={{ boxShadow: '0 0 40px rgba(212,165,74,0.3)' }}>
  Card with gold glow
</div>
```

### Before/After Tables

```tsx
<div className="grid grid-cols-3 gap-4">
  <p className="text-white">Metric</p>
  <p className="text-zinc-500 line-through">Before</p>
  <p className="text-amber-500">After</p>
</div>
```

### Callout Box

```tsx
<div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 pl-6 py-4">
  <p className="text-zinc-300">
    <span className="text-white font-medium">Key point:</span> Supporting text
  </p>
</div>
```

### React Strict Mode Initialization

Prevent duplicate initialization in development (Strict Mode mounts components twice):

```tsx
const MyComponent = () => {
  const [data, setData] = useState([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization in React Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // One-time initialization logic
    initializeData();
  }, []);

  return <div>{/* ... */}</div>;
};
```

**When to use:**
- Components that should only initialize once (chat message loading, demo sequences)
- Prevents duplicate API calls or state updates in development
- Production behavior unaffected (components only mount once)

---

## Troubleshooting

### Fonts not loading
- Check that Google Fonts import is in `globals.css`
- Verify font-family classes are applied correctly

### Animations not triggering
- Ensure `useInView` margin is set appropriately (try `-10%` to `-20%`)
- Check that Framer Motion is installed and imported

### Scroll jank on mobile
- Reduce number of animated elements
- Use `will-change: transform` sparingly
- Test on real devices, not just DevTools

### NavDots not updating
- Verify section IDs match between content and sections array
- Check IntersectionObserver threshold (try 0.3-0.5)

---

## Dependencies

Core dependencies (install at root level):

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.16.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@types/react": "^18.2.0"
  }
}
```

---

## Authentication Pattern

This project uses iron-session for simple password-based authentication.

### Architecture

```
Request → Middleware (Edge) → Page/API (Node.js)
              ↓                    ↓
         Cookie check         Session validation
         (lightweight)        (iron-session)
```

### Key Constraint: Edge Runtime

Next.js middleware runs in Edge Runtime, which has limited Node.js APIs. **iron-session cannot be used directly in middleware.**

**Pattern that works:**
1. `middleware.ts` - Only checks if session cookie EXISTS (no decryption)
2. `app/page.tsx` - Server Component validates session with iron-session
3. `app/api/auth/route.ts` - Handles login/logout with iron-session

### Session Configuration

```typescript
// lib/session.ts
export function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET required');

  return {
    password: secret,
    cookieName: 'tradeblock-deck-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}
```

### Middleware Pattern (Edge-compatible)

```typescript
// middleware.ts - Keep minimal, no iron-session
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('tradeblock-deck-session');
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
```

### Session Validation in Pages

```typescript
// app/page.tsx - Server Component
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export default async function Home() {
  const session = await getIronSession(await cookies(), getSessionOptions());
  if (!session.isLoggedIn) redirect('/login');
  return <TradeblockDeck />;
}
```

### Gotchas

- **Never import iron-session in middleware.ts** - causes Edge Runtime errors
- **Always use `getSessionOptions()` function** - validates env vars at runtime, not build time
- **Middleware file location must be at root** - not in `app/` directory

### Deep Link Support (Return URL Pattern)

Protected routes redirect to login with a `returnTo` query param:

```typescript
// In protected page - redirect with returnTo
if (!isAuthenticated) {
  const returnTo = encodeURIComponent(currentPath);
  redirect(`/client-portals/${clientId}?returnTo=${returnTo}`);
}

// In PasswordGate - use returnTo after login
if (response.ok) {
  if (returnTo) {
    router.push(returnTo);  // Go to original destination
  } else {
    router.refresh();       // Stay on portal index
  }
}
```

This ensures shared links work - users land on the content they were trying to access after login.

---

## Client Portals

Client portals provide password-protected access to deliverables, project tracking, and active work sessions.

### Architecture

**Portal Types:**
- **Client Portals** (`/client-portals/[client]`) - External client access
- **Strategist Portals** (`/strategist-portals/[strategist]`) - Internal team member access

Both use iron-session with email+password authentication and unified session bridging with NextAuth.

### Key Components

Located in `components/portal/`:

| Component | Purpose |
|-----------|---------|
| `EnhancedPortal.tsx` | Main portal layout with Active Projects, Active Work, and Artifacts sections |
| `ProjectTile.tsx` | Expandable project card showing status, progress, tracks, and action items |
| `ProjectDetailPage.tsx` | Full project page with timeline and deliverables |
| `ActiveWorkTile.tsx` | Links to in-progress Clarity Canvas sessions |
| `PasswordGate.tsx` | Login form component |
| `design-tokens.ts` | Canonical design values (GOLD `#d4a54a`, GREEN `#4ade80`, etc.) |
| `types.ts` | TypeScript interfaces for all portal data |

### Data Layer

**Project Tracking** (config-driven):
- `lib/client-projects.ts` - Project configuration and data
- `lib/portal/active-work.ts` - Database queries for active Clarity Canvas sessions

**Sample project data structure:**
```typescript
{
  id: string;
  name: string;
  status: 'on-track' | 'ahead' | 'attention';
  currentWeek: number;
  totalWeeks: number;
  thisWeek: { productBuild: TrackData; strategy: TrackData; };
  actionItems: ActionItem[];
  timeline: { productBuild: TimelineBlock[]; strategy: TimelineBlock[]; };
  deliverables: { completed: [], inProgress: [], upcoming: [] };
}
```

### Adding New Projects

1. Add project data to `lib/client-projects.ts`:
   ```typescript
   export const clientProjects: Record<string, ProjectData | null> = {
     'client-id': { id: '...', name: '...', ... },
   };
   ```

2. Project will automatically appear on portal homepage
3. Full project page available at `/client-portals/[client]/project/[projectId]`

### Design System

Portal components use design tokens from `components/portal/design-tokens.ts`:
- **GOLD** `#d4a54a` - Product Build track, primary accent
- **GREEN** `#4ade80` - Strategy track, success states
- **BLUE** `#60a5fa` - Information, ahead status
- **RED** `#f87171` - Needs attention status

Track visualization uses two-track layout:
- **Product Build** (gold) - Development, UX, technical work
- **Strategy** (green) - Go-to-market, positioning, messaging

### Gotchas

**Active Work Integration:**
- Queries `SharpenerSession` model for in-progress sessions
- Links directly to Clarity Canvas resume URLs
- Only shown if user has active sessions

**Authentication Flow:**
- Unified `/api/client-auth` endpoint checks credentials against ALL clients
- Creates/updates User record in database for session bridging
- Supports deep linking with `returnTo` query parameter

**Strategist Portals:**
- Use separate `/api/strategist-auth/[strategist]` endpoints (per-strategist, not unified)
- Share same components but with `portalType="strategist"` prop

---

## Skills & Design Review

### Design Skill

The **33 Strategies Frontend Design Skill** (`.claude/skills/33-strategies-frontend-design.md`) is the authoritative source for:
- Brand aesthetic and tone
- Typography (Instrument Serif, DM Sans, JetBrains Mono)
- Color system (gold #d4a54a accent)
- Component patterns
- Animation specifications

**When to use:** Any request involving design review, brand alignment, visual audits, or "does this match our design language" questions should reference this skill.

### Design Audit Command

Use `/design:audit <component-or-file>` to check any component against the design system. This will:
1. Load the design skill
2. Analyze the target file
3. Report compliance issues
4. Recommend specific fixes

Example:
```
/design:audit IPFrameworkDeck
/design:audit components/clients/plya/
```

---

## Getting Help

- Check existing decks for patterns and examples
- Reference the design skill: `.claude/skills/33-strategies-frontend-design.md`
- Use `/design:audit` to check brand alignment
- Reference Framer Motion docs: https://www.framer.com/motion/
- Reference Tailwind docs: https://tailwindcss.com/docs

---

## Task Management

This project uses **STM (Simple Task Master)** for task management. STM should be used by default for:
- Tracking implementation tasks from specifications
- Managing dependencies between tasks
- Persisting task state across sessions

### Common STM Commands

```bash
# List all tasks
stm list --pretty

# Add a new task
stm add "Task title" --description "Brief description" --details "Full details" --validation "Acceptance criteria"

# Show a specific task
stm show <id>

# Update task status
stm update <id> --status in_progress
stm update <id> --status completed

# Search tasks
stm grep "pattern"

# Export tasks
stm export --format markdown
```

### Workflow Integration

1. **Specification Decomposition**: Use `/spec:decompose <spec-file>` to break down specifications into STM tasks
2. **Task Execution**: Use `/spec:execute` to implement decomposed tasks
3. **Progress Tracking**: Use `stm list --pretty` to monitor progress

### STM Status Check

Before task management operations, verify STM is available:
```bash
claudekit status stm
```

Expected output: `STM_STATUS: Available and initialized`

---

## Railway Deployment

This project deploys to Railway. Configuration is in `railway.toml`.

### How Railway Routing Works

1. External request hits Railway's edge proxy (`server: railway-edge` header)
2. Edge proxy routes to your container using the PORT environment variable
3. App MUST bind to `0.0.0.0` (not localhost) to receive traffic

**Critical Requirements for Next.js:**
- Start command MUST include `-H 0.0.0.0` flag
- Start command MUST use `$PORT` environment variable
- Railway auto-provides PORT (usually 8080, don't hardcode)

### CLI Setup

```bash
# Login (once)
railway login

# Link project directory
railway link
```

### Common Commands

| Command | Purpose |
|---------|---------|
| `railway up` | Deploy from local directory |
| `railway up --detach` | Deploy without following logs |
| `railway logs` | View deployment logs |
| `railway logs -b` | View build logs |
| `railway status` | View project status |
| `railway variables` | List environment variables |
| `railway variables --set "KEY=value"` | Set env variable |
| `railway domain` | Configure/generate domains |
| `railway shell` | SSH into container |
| `railway run <cmd>` | Run command with Railway env vars |
| `railway redeploy` | Redeploy latest version |

### Log Types

1. **Build Logs** (`railway logs -b`)
   - Docker build output, npm install, compilation

2. **Deploy Logs** (`railway logs -d` or `railway logs`)
   - Runtime application stdout/stderr

3. **HTTP Logs** (Dashboard only)
   - Filter by: `@httpStatus:<code>`, `@path:<path>`, `@method:<method>`

### Configuration (railway.toml)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "next start -H 0.0.0.0 -p $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Config priority:** railway.toml > Dashboard settings > package.json

### Environment Variables

Required for this project:
- `TRADEBLOCK_PASSWORD` - Password for Tradeblock client portal
- `PLYA_PASSWORD` - Password for PLYA client portal
- `SESSION_SECRET` - 32-char hex (generate: `openssl rand -hex 32`)

Auto-provided by Railway:
- `PORT` - Dynamically assigned port (use this, don't hardcode)
- `RAILWAY_ENVIRONMENT` - Current environment name

### Health Check Requirements

Health checks come from `healthcheck.railway.app`. Endpoint must:
- Return HTTP 200 (not 204, 301, etc.)
- Not require authentication
- Not redirect to HTTPS
- Be fast (< 100 seconds default timeout)

Example endpoint at `app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
```

### Debugging 502 Bad Gateway

**Symptom:** App logs show "Ready" but all requests return 502

**Diagnostic checklist:**
1. Check start command includes `-H 0.0.0.0 -p $PORT`
2. Check logs show `Network: http://0.0.0.0:PORT` (not localhost)
3. Check Service Settings → Networking → Target Port matches PORT
4. Check health check endpoint exists and returns 200
5. If no request logs appear → traffic never reaches container

**Common causes:**
- Missing `-H 0.0.0.0` flag (app binds to localhost only)
- Wrong Target Port in Railway settings
- Health check failing silently
- Middleware blocking health check requests

### Next.js Specific Notes

**Middleware Limitations:**
- Runs in Edge Runtime (limited Node.js APIs)
- Cannot use iron-session, database adapters, etc.
- Keep middleware minimal - just cookie checks, redirects
- Move heavy logic to API routes / Server Components

**Correct middleware location:**
- `{root}/middleware.ts` (NOT in app/ directory)
- If using src/: `{root}/src/middleware.ts`

**Start command for Next.js:**
```bash
next start -H 0.0.0.0 -p $PORT
```
NOT just `next start` (won't bind correctly)

### Useful References

- [Railway Public Networking](https://docs.railway.com/guides/public-networking)
- [Railway Healthchecks](https://docs.railway.com/guides/healthchecks)
- [Railway Config as Code](https://docs.railway.com/reference/config-as-code)
- [Application Failed to Respond](https://docs.railway.com/reference/errors/application-failed-to-respond)

---

## Clarity Canvas

The Clarity Canvas is an interactive platform for building customer clarity through structured modules.

### Key Documentation

- **Developer Guides:**
  - `docs/developer-guides/learning-module-components.md` - Shared deck components
  - `docs/developer-guides/openai-structured-outputs-gotchas.md` - OpenAI Zod schema constraints

- **Persona Sharpener Module:**
  - `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/customized-questions-pattern.md` - **Critical:** Two-tier question system (base vs customized)
  - `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-handoff.md` - Module architecture
  - `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/voice-text-extraction-pattern.md` - Brain dump processing

**Most Common Gotcha:** When displaying question text in the Persona Sharpener questionnaire UI, always use `currentCustomizedQuestion?.text` (contextualized) NOT `currentQuestion.question` (generic). See customized-questions-pattern.md for full details.

### Validation Sharing System

The Persona Sharpener includes a validation link system that allows founders to share generated personas with real users for validation.

**Architecture:**
- Founders generate personas from brain dumps (voice or text)
- OpenAI extracts personas and generates customized questions with **two perspectives**:
  - `contextualizedText` - Founder perspective (questionnaire UI)
  - `validationContextualizedText` - User perspective (validation link UI)
- Founders can generate shareable validation links for each persona
- Real users validate assumptions via public links (no auth required)

**Perspective Transformation:**

The validation system transforms questions from founder perspective to user perspective:

| Founder Questionnaire | Validation Link |
|----------------------|-----------------|
| "You mentioned they want to..." | "We have a hypothesis that people like you want to..." |
| "Based on your brain dump..." | "Based on our research, we believe..." |
| Direct reference to founder's thoughts | Framed as testable hypothesis for user |

**Key Files:**
- `app/api/validate/[slug]/route.ts` - Public validation endpoint (GET)
- `app/api/validate/[slug]/submit/route.ts` - Response submission (POST)
- `app/validate/[slug]/page.tsx` - Validation questionnaire UI
- `lib/clarity-canvas/modules/persona-sharpener/customized-question-schema.ts` - Schema with `validationContextualizedText` field
- `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts` - Prompt that generates both perspectives
- `scripts/backfill-validation-contextualized-text.ts` - Backfill script for existing personas

**Database Models:**
- `ValidationLink` - Shareable link with slug, persona relation, active status
- `ValidationSession` - Tracking individual validation attempts
- `Response` - Stores both assumption (founder) and validation (user) responses

**Question Retrieval Pattern:**

```typescript
// In validation endpoint (app/api/validate/[slug]/route.ts)
const customized = customizedQuestions?.find(q => q.questionId === baseQuestion.id);

const validationQuestion: ValidationQuestion = {
  ...baseQuestion,
  // Use enriched user-perspective text
  validationContextualizedText: customized?.validationContextualizedText ?? undefined,
};
```

**Backfilling Existing Personas:**

For personas created before the `validationContextualizedText` field was added:

```bash
# Dry run (no changes)
npx tsx scripts/backfill-validation-contextualized-text.ts --dry-run

# Live update all personas
npx tsx scripts/backfill-validation-contextualized-text.ts

# Update specific persona
npx tsx scripts/backfill-validation-contextualized-text.ts --persona-id <id>
```

The backfill script:
1. Finds brain dumps with personas
2. Regenerates customized questions using OpenAI with current prompt (includes both perspectives)
3. Updates `customizedQuestions` JSON field on brain dump
4. Preserves all existing data

**Critical Gotcha:** Always use `validationContextualizedText` in validation UI, NOT `contextualizedText`. The former is reframed for real users, the latter is for founders.

### Validation Responses Dashboard

The validation responses dashboard allows founders to view and analyze responses collected from real users.

**Key Files:**
- `app/clarity-canvas/modules/persona-sharpener/personas/[personaId]/validation-responses/ValidationResponsesPageClient.tsx` - Main dashboard page
- `app/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/validation-responses/route.ts` - API endpoint
- `lib/clarity-canvas/modules/persona-sharpener/alignment-calculator.ts` - Score calculation algorithms
- `lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds.ts` - Statistical confidence system
- `lib/clarity-canvas/modules/persona-sharpener/validation-types.ts` - TypeScript interfaces

**Dashboard Components:**
- `ValidationSummaryHeader` - 4-stat grid (Sessions, Responses, Alignment %, Questions Validated)
- `ConfidenceCallout` - Statistical confidence level with progress to next threshold
- `ValidationViewToggle` - Switch between "By Question" and "By Session" views
- `ValidationByQuestionView` - Compare all responses for each question
- `ValidationSessionList` / `ValidationSessionDetail` - Drill into individual respondent sessions

**Alignment Scoring by Question Type:**

| Type | Scoring Method |
|------|----------------|
| `this-or-that` | Exact match = 100%, different = 0% |
| `slider` | Proximity-based (within 10 = 100%, linear decay beyond) |
| `ranking` | Weighted position comparison (1st=30pts, 2nd=25pts, etc.) |
| `multi-select` | Jaccard similarity (intersection / union) |
| `fill-blank` | Word overlap scoring |
| `scenario` | Keyword overlap with 40% floor for subjectivity |

**Confidence Thresholds:**

| Responses | Confidence | Label |
|-----------|------------|-------|
| 0 | 0% | No Data |
| 1-2 | 50% | Early Signal |
| 3-4 | 90% | Statistically Meaningful |
| 5-11 | 95% | High Confidence |
| 12+ | 99% | Very High Confidence |

```typescript
// Usage
import { getConfidenceLevel, getConfidenceColor } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';

const level = getConfidenceLevel(3);
// { label: 'Statistically Meaningful', confidencePercent: 90, nextLevel: { responses: 5, confidence: 95 }, ... }

const color = getConfidenceColor(90); // '#D4A84B' (gold)
```

**Misalignment Detection:**

The dashboard surfaces "Top Misalignments" - questions with:
- At least 2 validation responses
- Alignment score below 70%
- Sorted by lowest alignment first (max 3 shown)

---

## Learning Platform

The learning platform (`learn.33strategies.ai`) provides internal training through scrollytelling deck modules.

### Architecture

```
app/learning/
├── page.tsx                      # Dashboard with CourseCard tiles
├── layout.tsx                    # Learning section layout
├── components/
│   ├── AuthGate.tsx              # NextAuth login form
│   ├── LogoutButton.tsx          # Session logout
│   ├── CourseCard.tsx            # Course catalog tile
│   ├── ModuleCard.tsx            # Module list item
│   └── ModuleCompleteButton.tsx  # Progress marking
│
└── ai-workflow/                  # "33 Strategies AI Workflow" course
    ├── page.tsx                  # Course landing with module list
    ├── [module]/page.tsx         # Dynamic route for modules
    ├── getting-started/
    │   └── GettingStartedDeck.tsx
    ├── claude-code-workflow/
    │   └── ClaudeCodeWorkflowDeck.tsx
    ├── existing-codebases/
    │   └── ExistingCodebasesDeck.tsx
    └── orchestration-system/
        └── OrchestrationSystemDeck.tsx
```

### Authentication

Uses NextAuth.js v5 (beta) with:
- **Google OAuth**: Primary SSO for `@33strategies.ai` users
- **Credentials**: Email/password fallback with bcrypt
- **Domain restriction**: Only `@33strategies.ai` emails accepted

**Required environment variables:**
```bash
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=https://learn.33strategies.ai  # or http://localhost:3033 for local
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
LEARNING_PASSWORD=<password for email/password fallback>
```

**Key files:**
- `lib/auth.ts` - NextAuth configuration
- `lib/email-allowlist.ts` - Domain validation
- `lib/auth-types.ts` - TypeScript extensions

### Shared Deck Components

Located in `components/deck/`:

| Component | Purpose |
|-----------|---------|
| `Section` | Full-viewport scroll section |
| `RevealText` | Fade-in animation wrapper |
| `SectionLabel` | Gold uppercase section label |
| `Card` | Styled content card |
| `CodeBlock` | Syntax-highlighted code |
| `ProgressBar` | Scroll progress indicator |
| `NavDots` | Side navigation (desktop) |

See `docs/developer-guides/learning-module-components.md` for full documentation.

### Progress Tracking

Uses localStorage with `lib/progress.ts`:

```typescript
import { markModuleCompleted, isModuleCompleted, getCompletedCount } from '@/lib/progress';

// Mark module as complete
markModuleCompleted('ai-workflow', 'getting-started');

// Check completion status
const done = isModuleCompleted('ai-workflow', 'getting-started');

// Get count for course
const count = getCompletedCount('ai-workflow');
```

**Storage key pattern:** `33s-learning-progress`
**Data structure:** `{ completed: ["courseId/moduleSlug", ...] }`

### Course Registry

Defined in `lib/courses.ts`:

```typescript
export const COURSES = [
  {
    id: 'ai-workflow',
    title: '33 Strategies AI Workflow',
    subtitle: 'For Builders',
    modules: [
      { slug: 'getting-started', title: '...', order: 1 },
      // ...
    ],
  },
];

// Lookup helpers
getCourse('ai-workflow');
getModule('ai-workflow', 'getting-started');
```

### Adding a New Module

1. Create directory: `app/learning/ai-workflow/new-module/`
2. Create deck: `NewModuleDeck.tsx` using shared components
3. Register in `[module]/page.tsx` dynamic imports
4. Add to `lib/courses.ts` modules array

### Critical Gotcha: API Route Conflict

**Problem:** NextAuth requires `/api/auth/[...nextauth]` for all authentication routes (signin, callback, session, etc.). Any dynamic routes under `/api/auth/` will intercept these requests.

**Why it happened:** Client portals originally used `/api/auth/[client]` for authentication. The `[client]` dynamic segment has higher priority than `[...nextauth]` catch-all, causing NextAuth requests to return 405 errors.

**Solution:** Client portal auth moved to `/api/client-auth/[client]`.

**Rule:** Never add dynamic routes under `/api/auth/` - they will conflict with NextAuth. Use a different base path like `/api/client-auth/`, `/api/session/`, etc.

### Testing Authentication Locally

1. Copy `.env.example` to `.env`
2. Set `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LEARNING_PASSWORD`
3. Configure Google OAuth with `http://localhost:3033/api/auth/callback/google`
4. Run `npm run dev` and visit `http://localhost:3033/learning`
