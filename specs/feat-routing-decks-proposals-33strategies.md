# Feature: Multi-Route Architecture for Decks and Proposals

**Status:** Draft
**Authors:** Claude Code
**Date:** 2025-12-13
**Related:** [Ideation Document](../docs/ideation/routing-decks-proposals-33strategies.md)

---

## Overview

Implement a multi-route architecture supporting `/decks/[slug]` and `/proposals/[slug]` URL patterns for the 33strategies.ai domain. This includes migrating the existing TradeblockDeck to the new structure, converting the PLYA HTML proposal to a React/TypeScript component, and establishing a content registry pattern for scalable content management.

---

## Background / Problem Statement

The current web-decks application serves a single deck (TradeblockDeck) at the root URL. As 33 Strategies expands its content offerings—investor decks, strategy presentations, and client proposals—the architecture needs to support:

1. **Multiple content types** with distinct URL namespaces (`/decks/*`, `/proposals/*`)
2. **Per-item authentication** rather than global protection
3. **Consistent component patterns** across all content
4. **A professional landing page** at the root URL for 33strategies.ai

The existing PLYA proposal exists as a standalone HTML file with embedded React, creating maintenance overhead and preventing unified deployment.

---

## Goals

- Create `/decks/[slug]` and `/proposals/[slug]` dynamic routes
- Implement a content registry pattern for metadata and dynamic component loading
- Migrate TradeblockDeck to `/decks/tradeblock-ai-inflection`
- Convert PLYA HTML proposal to `components/proposals/PLYAProposal.tsx`
- Build a minimal 33 Strategies landing page at `/`
- Support per-item authentication via registry configuration
- Maintain Railway deployment compatibility
- Preserve all existing functionality (login flow, animations, interactivity)

---

## Non-Goals

- Building additional decks or proposals beyond the two being migrated
- Implementing a CMS or database-driven content management
- Redesigning the visual appearance of existing content
- Adding analytics or tracking
- DNS/domain configuration for 33strategies.ai
- Multi-password or user-based authentication

---

## Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | ^14.2.0 | App Router, dynamic routes, Server Components |
| React | ^18.2.0 | UI components |
| Framer Motion | ^11.0.0 | Scroll animations, transitions |
| iron-session | ^8.0.0 | Cookie-based session management |
| Tailwind CSS | ^3.4.0 | Styling |
| TypeScript | ^5.0.0 | Type safety |

**Documentation References:**
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [iron-session Usage](https://github.com/vvo/iron-session)

---

## Detailed Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Request Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Browser Request                                                │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────┐                                               │
│   │ middleware  │ ─── Cookie exists? ─── No ──► /login          │
│   │   .ts       │                                                │
│   └──────┬──────┘                                               │
│          │ Yes                                                   │
│          ▼                                                       │
│   ┌─────────────┐                                               │
│   │   Route     │                                                │
│   │   Match     │                                                │
│   └──────┬──────┘                                               │
│          │                                                       │
│    ┌─────┴─────┬──────────────┬──────────────┐                  │
│    ▼           ▼              ▼              ▼                  │
│  /           /decks        /proposals      /login               │
│  Landing     /[slug]       /[slug]         Page                 │
│  Page        ↓             ↓                                    │
│              Registry      Registry                             │
│              Lookup        Lookup                               │
│              ↓             ↓                                    │
│              Component     Component                            │
│              Render        Render                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
app/
├── layout.tsx                    # Unchanged - root layout
├── page.tsx                      # NEW: Landing page (replaces TradeblockDeck)
├── login/
│   └── page.tsx                  # Unchanged - login form
├── api/
│   ├── auth/route.ts             # Unchanged - auth endpoints
│   └── health/route.ts           # Unchanged - health check
├── decks/
│   ├── page.tsx                  # NEW: Redirect to /
│   └── [slug]/
│       └── page.tsx              # NEW: Dynamic deck renderer
└── proposals/
    ├── page.tsx                  # NEW: Redirect to /
    └── [slug]/
        └── page.tsx              # NEW: Dynamic proposal renderer

components/
├── TradeblockDeck.tsx            # DELETE after migration
├── decks/
│   └── TradeblockAIInflection.tsx  # MOVED from TradeblockDeck.tsx
├── proposals/
│   └── PLYAProposal.tsx          # NEW: Migrated from HTML
├── landing/
│   └── LandingPage.tsx           # NEW: 33 Strategies homepage
└── shared/                       # FUTURE: Extracted shared components

lib/
├── session.ts                    # Unchanged
├── decks.ts                      # NEW: Deck registry
└── proposals.ts                  # NEW: Proposal registry

middleware.ts                     # MODIFIED: Per-route auth logic
```

### Content Registry Pattern

**lib/decks.ts**
```typescript
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export interface DeckMetadata {
  slug: string;
  title: string;
  description: string;
  entity: string;
  date: string;
  protected: boolean;
}

export interface DeckEntry extends DeckMetadata {
  component: ComponentType;
}

// Lazy-load components for code splitting
const TradeblockAIInflection = dynamic(
  () => import('@/components/decks/TradeblockAIInflection'),
  { ssr: true }
);

export const decks: Record<string, DeckEntry> = {
  'tradeblock-ai-inflection': {
    slug: 'tradeblock-ai-inflection',
    title: 'Tradeblock: The AI Inflection',
    description: 'Investor pitch deck for Tradeblock AI transformation',
    entity: 'tradeblock',
    date: '2025-11',
    protected: true,
    component: TradeblockAIInflection,
  },
};

export function getDeck(slug: string): DeckEntry | undefined {
  return decks[slug];
}

export function getAllDecks(): DeckMetadata[] {
  return Object.values(decks).map(({ component, ...metadata }) => metadata);
}
```

**lib/proposals.ts**
```typescript
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export interface ProposalMetadata {
  slug: string;
  title: string;
  description: string;
  client: string;
  date: string;
  protected: boolean;
}

export interface ProposalEntry extends ProposalMetadata {
  component: ComponentType;
}

const PLYAProposal = dynamic(
  () => import('@/components/proposals/PLYAProposal'),
  { ssr: true }
);

export const proposals: Record<string, ProposalEntry> = {
  'plya-project-proposal': {
    slug: 'plya-project-proposal',
    title: 'PLYA Project Proposal',
    description: 'Interactive consulting proposal for PLYA',
    client: 'PLYA',
    date: '2024-12',
    protected: true,
    component: PLYAProposal,
  },
};

export function getProposal(slug: string): ProposalEntry | undefined {
  return proposals[slug];
}

export function getAllProposals(): ProposalMetadata[] {
  return Object.values(proposals).map(({ component, ...metadata }) => metadata);
}
```

### Dynamic Route Implementation

**app/decks/[slug]/page.tsx**
```typescript
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getDeck } from '@/lib/decks';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DeckPage({ params }: Props) {
  const { slug } = await params;
  const deck = getDeck(slug);

  if (!deck) {
    notFound();
  }

  // Check auth for protected decks
  if (deck.protected) {
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions()
    );

    if (!session.isLoggedIn) {
      redirect('/login');
    }
  }

  const Component = deck.component;
  return <Component />;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const deck = getDeck(slug);

  if (!deck) {
    return { title: 'Deck Not Found' };
  }

  return {
    title: deck.title,
    description: deck.description,
  };
}
```

**app/proposals/[slug]/page.tsx**
```typescript
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getProposal } from '@/lib/proposals';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProposalPage({ params }: Props) {
  const { slug } = await params;
  const proposal = getProposal(slug);

  if (!proposal) {
    notFound();
  }

  if (proposal.protected) {
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions()
    );

    if (!session.isLoggedIn) {
      redirect('/login');
    }
  }

  const Component = proposal.component;
  return <Component />;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const proposal = getProposal(slug);

  if (!proposal) {
    return { title: 'Proposal Not Found' };
  }

  return {
    title: proposal.title,
    description: proposal.description,
  };
}
```

### Section Index Redirects

**app/decks/page.tsx**
```typescript
import { redirect } from 'next/navigation';

export default function DecksIndex() {
  redirect('/');
}
```

**app/proposals/page.tsx**
```typescript
import { redirect } from 'next/navigation';

export default function ProposalsIndex() {
  redirect('/');
}
```

### Updated Middleware

**middleware.ts**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'tradeblock-deck-session';

// Routes that never require authentication
const PUBLIC_ROUTES = ['/login', '/api/', '/_next', '/favicon'];

// Route prefixes that require authentication check
// (actual per-item check happens in page components)
const PROTECTED_PREFIXES = ['/decks/', '/proposals/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Root landing page is public
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Check if route is in protected prefixes
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute) {
    // Check if session cookie exists (actual validation in page)
    const sessionCookie = request.cookies.get(COOKIE_NAME);

    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Landing Page Component

**components/landing/LandingPage.tsx**
```typescript
'use client';

import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        className="text-center max-w-2xl"
      >
        <div className="mb-8">
          <span className="text-6xl md:text-8xl font-bold font-display">33</span>
          <p className="text-zinc-500 uppercase tracking-[0.3em] text-sm mt-2">
            Strategies
          </p>
        </div>

        <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed mb-12">
          Premium strategy presentations and consulting proposals.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:hello@33strategies.ai"
            className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium hover:bg-zinc-800 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-8 text-zinc-600 text-sm"
      >
        © 2025 33 Strategies
      </motion.p>
    </div>
  );
}
```

**app/page.tsx**
```typescript
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  return <LandingPage />;
}

export const metadata = {
  title: '33 Strategies',
  description: 'Premium strategy presentations and consulting proposals',
};
```

### PLYA Proposal Migration

The PLYA proposal migration involves:

1. **Extract React code** from `first-proposal-PLYA/33S_Interactive_Proposal.html`
2. **Add TypeScript types** for all components and props
3. **Replace CDN imports** with project dependencies (React, Tailwind already available)
4. **Convert inline SVG icons** to typed components

**components/proposals/PLYAProposal.tsx** (structure)
```typescript
'use client';

import React, { useState } from 'react';

// TypeScript interfaces
interface ServiceItem {
  id: string;
  icon: React.ComponentType;
  title: string;
  value: number;
  description: string;
  details?: Array<{ type: 'deliverable' | 'meeting'; text: string }>;
}

interface DeliverableItem {
  id: string;
  icon: React.ComponentType;
  title: string;
  description: string;
  timeframe: string;
  basePrice: number;
}

interface Phase2Options {
  businessConsulting: boolean;
  technicalSupport: boolean;
}

// Icon components (typed)
const Check: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ... remaining icon components with explicit React.FC typing

// Sub-components
interface BulletProps {
  children: React.ReactNode;
  type?: 'meeting' | 'deliverable';
}

const Bullet: React.FC<BulletProps> = ({ children, type = 'meeting' }) => {
  // ... implementation
};

interface ServiceCardProps {
  item: ServiceItem;
  inCart: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  phase?: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ item, inCart, onAdd, onRemove, phase }) => {
  // ... implementation (extracted from HTML)
};

// ... DeliverableCard component

// Main component
export default function PLYAProposal() {
  const [cart, setCart] = useState<Array<ServiceItem | DeliverableItem>>([]);
  const [viewMode, setViewMode] = useState<'shop' | 'cart'>('shop');
  const [equitySlider, setEquitySlider] = useState(0);
  const [companyStage, setCompanyStage] = useState<'idea' | 'prototype' | 'revenue' | 'growth'>('idea');
  const [phase2Options, setPhase2Options] = useState<Phase2Options>({
    businessConsulting: false,
    technicalSupport: false,
  });

  // ... services and deliverables arrays with type annotations

  // ... calculation functions

  // ... render logic (extracted from HTML)
}
```

**Key Migration Steps:**

1. Copy the `<script type="text/babel">` content from HTML
2. Remove Babel runtime transpilation wrapper
3. Add explicit TypeScript types to all:
   - Component props interfaces
   - State variables
   - Event handlers
   - Array/object definitions
4. Update JSX syntax for Next.js compatibility:
   - `className` already used (no changes)
   - Event handlers already camelCase
5. Add `'use client'` directive (uses useState)
6. Export as default function component

---

## User Experience

### URL Patterns

| URL | Content | Auth Required |
|-----|---------|---------------|
| `/` | 33 Strategies landing page | No |
| `/login` | Password form | No |
| `/decks` | Redirect to `/` | No |
| `/decks/tradeblock-ai-inflection` | TradeblockDeck investor pitch | Yes |
| `/proposals` | Redirect to `/` | No |
| `/proposals/plya-project-proposal` | PLYA interactive proposal | Yes |

### Authentication Flow

1. User visits `/decks/tradeblock-ai-inflection`
2. Middleware checks for session cookie → missing → redirect to `/login`
3. User enters password → submits form
4. API validates → sets iron-session cookie → redirect to original URL
5. Middleware sees cookie → allows through
6. Page component validates session → renders deck

### 404 Handling

Invalid slugs (e.g., `/decks/nonexistent`) return Next.js `notFound()` which renders the default or custom 404 page.

---

## Testing Strategy

### Unit Tests

**Test: Content Registry Functions**
```typescript
// Purpose: Verify registry lookup functions return correct data or undefined
describe('lib/decks', () => {
  it('returns deck entry for valid slug', () => {
    const deck = getDeck('tradeblock-ai-inflection');
    expect(deck).toBeDefined();
    expect(deck?.title).toBe('Tradeblock: The AI Inflection');
    expect(deck?.protected).toBe(true);
  });

  it('returns undefined for invalid slug', () => {
    const deck = getDeck('nonexistent-deck');
    expect(deck).toBeUndefined();
  });

  it('getAllDecks returns metadata without components', () => {
    const decks = getAllDecks();
    expect(decks.length).toBeGreaterThan(0);
    expect(decks[0]).not.toHaveProperty('component');
  });
});
```

### Integration Tests

**Test: Middleware Route Protection**
```typescript
// Purpose: Verify middleware correctly redirects unauthenticated requests
describe('middleware', () => {
  it('allows access to public landing page', async () => {
    const response = await fetch('/');
    expect(response.status).toBe(200);
  });

  it('redirects unauthenticated user from protected route', async () => {
    const response = await fetch('/decks/tradeblock-ai-inflection', {
      redirect: 'manual',
    });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('allows authenticated user to access protected route', async () => {
    // Login first, then access with session cookie
    const loginResponse = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.DECK_PASSWORD }),
    });
    const cookies = loginResponse.headers.get('set-cookie');

    const deckResponse = await fetch('/decks/tradeblock-ai-inflection', {
      headers: { Cookie: cookies ?? '' },
    });
    expect(deckResponse.status).toBe(200);
  });
});
```

### E2E Tests (Playwright)

**Test: Full Authentication and Navigation Flow**
```typescript
// Purpose: Validate complete user journey from landing to protected content
test.describe('Deck and Proposal Access', () => {
  test('landing page loads without authentication', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=33')).toBeVisible();
    await expect(page.locator('text=Strategies')).toBeVisible();
  });

  test('protected deck redirects to login', async ({ page }) => {
    await page.goto('/decks/tradeblock-ai-inflection');
    await expect(page).toHaveURL(/\/login/);
  });

  test('successful login grants access to deck', async ({ page }) => {
    await page.goto('/decks/tradeblock-ai-inflection');
    await page.fill('input[type="password"]', process.env.DECK_PASSWORD!);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/decks/tradeblock-ai-inflection');
    await expect(page.locator('text=TRADEBLOCK')).toBeVisible();
  });

  test('PLYA proposal interactivity works', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="password"]', process.env.DECK_PASSWORD!);
    await page.click('button[type="submit"]');

    // Navigate to proposal
    await page.goto('/proposals/plya-project-proposal');

    // Test cart functionality
    await page.click('text=Add to cart >> nth=0');
    await expect(page.locator('text=Added to cart')).toBeVisible();

    // Test view cart
    await page.click('text=View Cart');
    await expect(page.locator('text=Your Cart')).toBeVisible();
  });

  test('section index pages redirect to landing', async ({ page }) => {
    await page.goto('/decks');
    await expect(page).toHaveURL('/');

    await page.goto('/proposals');
    await expect(page).toHaveURL('/');
  });

  test('invalid slug returns 404', async ({ page }) => {
    await page.goto('/decks/nonexistent');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
```

---

## Performance Considerations

### Code Splitting

- Dynamic imports with `next/dynamic` for deck/proposal components
- Each deck/proposal lazy-loads independently (~60-100KB each)
- Landing page is minimal (~5KB)

### Bundle Analysis

| Route | Expected Bundle Size |
|-------|---------------------|
| `/` (landing) | ~5KB |
| `/decks/tradeblock-ai-inflection` | ~80KB (Framer Motion + component) |
| `/proposals/plya-project-proposal` | ~60KB (component only) |

### Caching Strategy

- Static generation for landing page and section indexes
- Dynamic rendering for deck/proposal pages (auth check required)
- Railway CDN handles static asset caching

---

## Security Considerations

### Authentication

- Session cookies are `httpOnly`, `secure` (in production), `sameSite: lax`
- Middleware performs cookie existence check (Edge Runtime compatible)
- Page components perform full session validation with iron-session
- No sensitive data exposed in client-side code

### Route Protection

- Protected routes require valid session
- Invalid slugs return 404 (no information leakage about existing content)
- Login form uses POST (password not in URL)

### Content Security

- All content served from same origin
- No external API calls from protected pages
- CDN dependencies removed in PLYA migration

---

## Documentation

### Updates Required

1. **CLAUDE.md** - Add new routing patterns and content registry documentation
2. **README.md** - Update with new URL structure
3. **Deployment docs** - Verify Railway config unchanged

### New Documentation

- Inline code comments for registry pattern
- TypeScript interfaces serve as API documentation

---

## Implementation Phases

### Phase 1: Route Infrastructure

1. Create `lib/decks.ts` and `lib/proposals.ts` registries
2. Create `app/decks/[slug]/page.tsx` dynamic route
3. Create `app/proposals/[slug]/page.tsx` dynamic route
4. Create section index pages with redirects
5. Update `middleware.ts` for new route patterns

### Phase 2: Content Migration

1. Move `components/TradeblockDeck.tsx` to `components/decks/TradeblockAIInflection.tsx`
2. Register in `lib/decks.ts`
3. Extract PLYA proposal to `components/proposals/PLYAProposal.tsx`
4. Add TypeScript types to PLYA components
5. Register in `lib/proposals.ts`

### Phase 3: Landing Page

1. Create `components/landing/LandingPage.tsx`
2. Update `app/page.tsx` to render landing page
3. Update `app/layout.tsx` metadata for 33 Strategies branding

### Phase 4: Cleanup and Testing

1. Delete old `components/TradeblockDeck.tsx` (after verifying migration)
2. Run full E2E test suite
3. Deploy to Railway and verify
4. Update documentation

---

## Open Questions

None - all clarifications resolved in ideation phase.

---

## References

- [Ideation Document](../docs/ideation/routing-decks-proposals-33strategies.md)
- [Previous Railway Deployment Spec](./feat-deploy-tradeblock-deck-railway.md)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [iron-session](https://github.com/vvo/iron-session)
