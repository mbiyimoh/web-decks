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

### Colors

Defined in `styles/tokens.ts`:

```ts
export const colors = {
  // Backgrounds
  bg: {
    primary: '#000000',
    surface: '#18181b',
    surfaceDim: '#09090b',
    elevated: '#27272a',
  },
  
  // Text
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
  
  // Accent (override per deck if needed)
  accent: {
    primary: '#f59e0b',    // Amber
    success: '#10b981',    // Emerald
    info: '#3b82f6',       // Blue
    highlight: '#a855f7',  // Purple
  },
  
  // Borders
  border: {
    default: '#27272a',
    subtle: '#3f3f46',
  },
};
```

### Typography

Fonts loaded via Google Fonts in `styles/globals.css`:
- **Headlines:** Space Grotesk (500, 600, 700)
- **Body:** Inter (400, 500, 600, 700)

```css
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
```

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
<div className="shadow-[0_0_60px_rgba(245,158,11,0.15)]">
  Card with glow
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

---

## Getting Help

- Check existing decks for patterns and examples
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
