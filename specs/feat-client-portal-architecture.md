# Feature: Client Portal Architecture for 33strategies.ai

**Status:** Draft
**Authors:** Claude Code
**Date:** 2025-12-13
**Related:** [Previous Routing Spec](./feat-routing-decks-proposals-33strategies.md) (superseded)

---

## Overview

Implement a client portal system where each client (PLYA, Tradeblock, etc.) has their own password-protected portal at `/client-portals/[client]` containing all their content—decks, proposals, and other files. Each client has a single password that unlocks access to their complete content index.

---

## Background / Problem Statement

33 Strategies creates premium content for multiple clients—investor decks, strategy presentations, consulting proposals. The current architecture serves a single deck at the root URL with one shared password.

**Problems with current approach:**
1. No way to serve content to multiple clients with different access
2. Clients can't see an index of all their materials
3. Adding new clients requires code changes, not just configuration
4. No clear URL structure for sharing specific content

**Client portal model solves these by:**
- Organizing content by client, not by content type
- Giving each client their own password and content index
- Enabling easy addition of new clients via registry + env var
- Providing clear, shareable URLs: `33strategies.ai/client-portals/plya/project-proposal`

---

## Goals

- Implement `/client-portals/[client]` route with per-client password protection
- Implement `/client-portals/[client]/[slug]` for individual content items
- Create client registry pattern for metadata and content management
- Migrate TradeblockDeck to `/client-portals/tradeblock/ai-inflection`
- Migrate PLYA HTML proposal to `/client-portals/plya/project-proposal`
- Build minimal 33 Strategies landing page at `/`
- Enable per-client session isolation (PLYA access ≠ Tradeblock access)
- Support inline password entry on portal pages (no separate /login route)
- Maintain Railway deployment compatibility

---

## Non-Goals

- Multi-user accounts or user registration
- Database-driven content management
- Content editing UI
- Analytics or access tracking
- Different passwords per content item within a client
- Public content (all client content is password-protected)
- Redesigning existing deck/proposal visual appearance

---

## Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | ^14.2.0 | App Router, dynamic routes, Server Components |
| React | ^18.2.0 | UI components |
| Framer Motion | ^11.0.0 | Scroll animations |
| iron-session | ^8.0.0 | Encrypted cookie sessions |
| Tailwind CSS | ^3.4.0 | Styling |
| TypeScript | ^5.0.0 | Type safety |

**Key References:**
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js Catch-all Segments](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#catch-all-segments)
- [iron-session API](https://github.com/vvo/iron-session)

---

## Detailed Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Request Flow                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   User visits /client-portals/plya                                  │
│         │                                                            │
│         ▼                                                            │
│   ┌──────────────┐                                                  │
│   │  middleware   │ ─── Is /client-portals/* ? ─── No ──► Allow     │
│   │    .ts        │                                                  │
│   └──────┬───────┘                                                  │
│          │ Yes                                                       │
│          ▼                                                           │
│   ┌──────────────┐                                                  │
│   │ [client]/    │                                                  │
│   │  page.tsx    │                                                  │
│   └──────┬───────┘                                                  │
│          │                                                           │
│          ▼                                                           │
│   ┌──────────────┐     ┌─────────────────┐                          │
│   │ Check session │────►│ Session valid   │──► Show ContentIndex    │
│   │ for 'plya'   │     │ for this client │                          │
│   └──────┬───────┘     └─────────────────┘                          │
│          │ No valid session                                          │
│          ▼                                                           │
│   ┌──────────────┐     ┌─────────────────┐                          │
│   │ PasswordGate │────►│ Password correct│──► Set session, reload   │
│   │  Component   │     │ via API         │                          │
│   └──────────────┘     └─────────────────┘                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
app/
├── layout.tsx                              # Root layout (unchanged)
├── page.tsx                                # NEW: Landing page
├── login/                                  # DELETE: No longer needed
│   └── page.tsx
├── api/
│   ├── auth/
│   │   └── [client]/
│   │       └── route.ts                    # NEW: Per-client auth endpoint
│   └── health/route.ts                     # Unchanged
└── client-portals/
    ├── page.tsx                            # NEW: Redirect to /
    └── [client]/
        ├── page.tsx                        # NEW: Portal (password + index)
        └── [slug]/
            └── page.tsx                    # NEW: Content renderer

components/
├── TradeblockDeck.tsx                      # DELETE after migration
├── clients/
│   ├── plya/
│   │   └── PLYAProposal.tsx               # NEW: Migrated from HTML
│   └── tradeblock/
│       └── TradeblockAIInflection.tsx     # MOVED from TradeblockDeck.tsx
├── portal/
│   ├── PasswordGate.tsx                   # NEW: Inline password form
│   └── ContentIndex.tsx                   # NEW: Client content listing
└── landing/
    └── LandingPage.tsx                    # NEW: 33 Strategies homepage

lib/
├── clients.ts                             # NEW: Client registry
└── session.ts                             # MODIFIED: Add clientId support

middleware.ts                              # MODIFIED: Simplified
```

### Client Registry

**lib/clients.ts**
```typescript
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export interface ContentItem {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  component: ComponentType;
}

export interface ClientEntry {
  id: string;
  name: string;
  passwordEnvVar: string;
  content: ContentItem[];
}

// Lazy-load components for code splitting
const TradeblockAIInflection = dynamic(
  () => import('@/components/clients/tradeblock/TradeblockAIInflection'),
  { ssr: true }
);

const PLYAProposal = dynamic(
  () => import('@/components/clients/plya/PLYAProposal'),
  { ssr: true }
);

export const clients: Record<string, ClientEntry> = {
  'tradeblock': {
    id: 'tradeblock',
    name: 'Tradeblock',
    passwordEnvVar: 'TRADEBLOCK_PASSWORD',
    content: [
      {
        slug: 'ai-inflection',
        type: 'deck',
        title: 'The AI Inflection',
        description: 'Investor pitch deck - November 2025',
        component: TradeblockAIInflection,
      },
    ],
  },
  'plya': {
    id: 'plya',
    name: 'PLYA',
    passwordEnvVar: 'PLYA_PASSWORD',
    content: [
      {
        slug: 'project-proposal',
        type: 'proposal',
        title: 'Project Proposal',
        description: 'Interactive consulting proposal',
        component: PLYAProposal,
      },
    ],
  },
};

export function getClient(clientId: string): ClientEntry | undefined {
  return clients[clientId];
}

export function getClientContent(
  clientId: string,
  slug: string
): ContentItem | undefined {
  const client = clients[clientId];
  if (!client) return undefined;
  return client.content.find((item) => item.slug === slug);
}

export function getClientPassword(clientId: string): string | undefined {
  const client = clients[clientId];
  if (!client) return undefined;
  return process.env[client.passwordEnvVar];
}

export function getAllClientIds(): string[] {
  return Object.keys(clients);
}
```

### Updated Session Management

**lib/session.ts**
```typescript
import { SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
  clientId?: string; // Which client portal is authenticated
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  clientId: undefined,
};

export function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
        'Generate one with: openssl rand -hex 32'
    );
  }

  return {
    password: secret,
    cookieName: '33strategies-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

/**
 * Check if session is valid for a specific client
 */
export function isSessionValidForClient(
  session: SessionData,
  clientId: string
): boolean {
  return session.isLoggedIn === true && session.clientId === clientId;
}
```

### Per-Client Auth API

**app/api/auth/[client]/route.ts**
```typescript
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getClient, getClientPassword } from '@/lib/clients';

interface Props {
  params: Promise<{ client: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const expectedPassword = getClientPassword(clientId);
  if (!expectedPassword) {
    console.error(`Missing password env var: ${client.passwordEnvVar}`);
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const { password } = await request.json();

    if (password === expectedPassword) {
      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.clientId = clientId;
      await session.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const { client: clientId } = await params;
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  // Only destroy if this session belongs to this client
  if (session.clientId === clientId) {
    session.destroy();
  }

  return NextResponse.json({ success: true });
}

export async function GET(_request: Request, { params }: Props) {
  const { client: clientId } = await params;
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  return NextResponse.json({
    isLoggedIn: session.isLoggedIn && session.clientId === clientId,
    clientId: session.clientId,
  });
}
```

### Client Portal Page

**app/client-portals/[client]/page.tsx**
```typescript
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForClient } from '@/lib/session';
import { getClient } from '@/lib/clients';
import PasswordGate from '@/components/portal/PasswordGate';
import ContentIndex from '@/components/portal/ContentIndex';

interface Props {
  params: Promise<{ client: string }>;
}

export default async function ClientPortalPage({ params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    notFound();
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  const isAuthenticated = isSessionValidForClient(session, clientId);

  if (!isAuthenticated) {
    return <PasswordGate clientId={clientId} clientName={client.name} />;
  }

  return <ContentIndex client={client} />;
}

export async function generateMetadata({ params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    return { title: 'Portal Not Found' };
  }

  return {
    title: `${client.name} Portal | 33 Strategies`,
    description: `Access your ${client.name} materials`,
  };
}
```

### Content Renderer

**app/client-portals/[client]/[slug]/page.tsx**
```typescript
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, isSessionValidForClient } from '@/lib/session';
import { getClient, getClientContent } from '@/lib/clients';

interface Props {
  params: Promise<{ client: string; slug: string }>;
}

export default async function ContentPage({ params }: Props) {
  const { client: clientId, slug } = await params;
  const client = getClient(clientId);

  if (!client) {
    notFound();
  }

  const contentItem = getClientContent(clientId, slug);
  if (!contentItem) {
    notFound();
  }

  // Check authentication
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (!isSessionValidForClient(session, clientId)) {
    // Redirect to portal page (which will show password gate)
    redirect(`/client-portals/${clientId}`);
  }

  const Component = contentItem.component;
  return <Component />;
}

export async function generateMetadata({ params }: Props) {
  const { client: clientId, slug } = await params;
  const client = getClient(clientId);
  const content = getClientContent(clientId, slug);

  if (!client || !content) {
    return { title: 'Content Not Found' };
  }

  return {
    title: `${content.title} | ${client.name}`,
    description: content.description,
  };
}
```

### Password Gate Component

**components/portal/PasswordGate.tsx**
```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface PasswordGateProps {
  clientId: string;
  clientName: string;
}

export default function PasswordGate({ clientId, clientName }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs mb-2">
            Client Portal
          </p>
          <h1 className="text-3xl font-bold text-white font-display">
            {clientName}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-4 py-3 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Access Portal'}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-8">
          33 Strategies
        </p>
      </motion.div>
    </div>
  );
}
```

### Content Index Component

**components/portal/ContentIndex.tsx**
```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ClientEntry, ContentItem } from '@/lib/clients';

interface ContentIndexProps {
  client: ClientEntry;
}

const typeLabels: Record<ContentItem['type'], string> = {
  deck: 'Presentation',
  proposal: 'Proposal',
  document: 'Document',
};

const typeColors: Record<ContentItem['type'], string> = {
  deck: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  proposal: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  document: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
};

export default function ContentIndex({ client }: ContentIndexProps) {
  return (
    <div className="min-h-screen bg-black px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12">
            <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs mb-2">
              Client Portal
            </p>
            <h1 className="text-4xl font-bold text-white font-display">
              {client.name}
            </h1>
          </div>

          <div className="space-y-4">
            {client.content.map((item, index) => (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link
                  href={`/client-portals/${client.id}/${item.slug}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded border mb-3 ${typeColors[item.type]}`}
                      >
                        {typeLabels[item.type]}
                      </span>
                      <h2 className="text-xl font-semibold text-white group-hover:text-zinc-200 transition-colors">
                        {item.title}
                      </h2>
                      {item.description && (
                        <p className="text-zinc-500 text-sm mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors ml-4">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800">
            <p className="text-zinc-600 text-sm text-center">
              33 Strategies
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

### Landing Page

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

        <a
          href="mailto:hello@33strategies.ai"
          className="inline-block px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium hover:bg-zinc-800 transition-colors"
        >
          Get in Touch
        </a>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-8 text-zinc-600 text-sm"
      >
        &copy; 2025 33 Strategies
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

### Updated Middleware

**middleware.ts**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simplified middleware - auth check happens in page components
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all routes - per-client auth is handled in page components
  // Middleware only needs to handle static files and Next.js internals

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Redirect Page

**app/client-portals/page.tsx**
```typescript
import { redirect } from 'next/navigation';

export default function ClientPortalsIndex() {
  redirect('/');
}
```

---

## User Experience

### URL Patterns

| URL | Content | Auth |
|-----|---------|------|
| `/` | 33 Strategies landing | Public |
| `/client-portals` | Redirect to `/` | N/A |
| `/client-portals/plya` | PLYA portal (password → index) | PLYA password |
| `/client-portals/plya/project-proposal` | PLYA proposal | PLYA session |
| `/client-portals/tradeblock` | Tradeblock portal | Tradeblock password |
| `/client-portals/tradeblock/ai-inflection` | Tradeblock deck | Tradeblock session |

### User Flow

```
1. Client receives URL: 33strategies.ai/client-portals/plya

2. First visit (no session):
   → See password form with "PLYA" branding
   → Enter password → Form submits to /api/auth/plya
   → Success → Page refreshes → See content index

3. Subsequent visits (valid session):
   → See content index immediately
   → Click item → View content

4. Cross-client isolation:
   → User authenticated for PLYA
   → Visits /client-portals/tradeblock
   → Sees Tradeblock password form (PLYA session doesn't work)
```

---

## Testing Strategy

### Unit Tests

**Test: Client Registry Functions**
```typescript
// Purpose: Verify client lookup and password retrieval work correctly
describe('lib/clients', () => {
  beforeEach(() => {
    process.env.PLYA_PASSWORD = 'test-plya-pass';
    process.env.TRADEBLOCK_PASSWORD = 'test-tb-pass';
  });

  it('returns client for valid clientId', () => {
    const client = getClient('plya');
    expect(client).toBeDefined();
    expect(client?.name).toBe('PLYA');
  });

  it('returns undefined for invalid clientId', () => {
    expect(getClient('nonexistent')).toBeUndefined();
  });

  it('retrieves password from correct env var', () => {
    expect(getClientPassword('plya')).toBe('test-plya-pass');
    expect(getClientPassword('tradeblock')).toBe('test-tb-pass');
  });

  it('returns content item by slug', () => {
    const content = getClientContent('plya', 'project-proposal');
    expect(content).toBeDefined();
    expect(content?.title).toBe('Project Proposal');
  });
});
```

**Test: Session Validation**
```typescript
// Purpose: Verify session isolation between clients
describe('isSessionValidForClient', () => {
  it('returns true when session matches client', () => {
    const session = { isLoggedIn: true, clientId: 'plya' };
    expect(isSessionValidForClient(session, 'plya')).toBe(true);
  });

  it('returns false when session is for different client', () => {
    const session = { isLoggedIn: true, clientId: 'plya' };
    expect(isSessionValidForClient(session, 'tradeblock')).toBe(false);
  });

  it('returns false when not logged in', () => {
    const session = { isLoggedIn: false, clientId: undefined };
    expect(isSessionValidForClient(session, 'plya')).toBe(false);
  });
});
```

### E2E Tests (Playwright)

**Test: Complete Portal Flow**
```typescript
// Purpose: Validate end-to-end client portal authentication and access
test.describe('Client Portal', () => {
  test('landing page is publicly accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=33')).toBeVisible();
    await expect(page.locator('text=Strategies')).toBeVisible();
  });

  test('client portal shows password form when unauthenticated', async ({ page }) => {
    await page.goto('/client-portals/plya');
    await expect(page.locator('text=PLYA')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('correct password grants access to content index', async ({ page }) => {
    await page.goto('/client-portals/plya');
    await page.fill('input[type="password"]', process.env.PLYA_PASSWORD!);
    await page.click('button[type="submit"]');

    // Should see content index
    await expect(page.locator('text=Project Proposal')).toBeVisible();
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/client-portals/plya');
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid password')).toBeVisible();
  });

  test('session isolation between clients', async ({ page }) => {
    // Login to PLYA
    await page.goto('/client-portals/plya');
    await page.fill('input[type="password"]', process.env.PLYA_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Project Proposal')).toBeVisible();

    // Try to access Tradeblock
    await page.goto('/client-portals/tradeblock');
    // Should see password form, not content
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('direct content URL redirects to portal if unauthenticated', async ({ page }) => {
    await page.goto('/client-portals/plya/project-proposal');
    // Should redirect to portal page with password form
    await expect(page).toHaveURL('/client-portals/plya');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('authenticated user can access content directly', async ({ page }) => {
    // Login first
    await page.goto('/client-portals/plya');
    await page.fill('input[type="password"]', process.env.PLYA_PASSWORD!);
    await page.click('button[type="submit"]');

    // Access content directly
    await page.goto('/client-portals/plya/project-proposal');
    // Should render the proposal component
    await expect(page.locator('text=PLYA Project Proposal')).toBeVisible();
  });

  test('invalid client returns 404', async ({ page }) => {
    await page.goto('/client-portals/nonexistent');
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('invalid content slug returns 404', async ({ page }) => {
    // Login to PLYA
    await page.goto('/client-portals/plya');
    await page.fill('input[type="password"]', process.env.PLYA_PASSWORD!);
    await page.click('button[type="submit"]');

    // Try invalid content
    await page.goto('/client-portals/plya/nonexistent');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
```

---

## Performance Considerations

### Code Splitting
- Each client's components are dynamically imported
- Content only loads when accessed
- Landing page and portal shell are minimal

### Bundle Sizes

| Route | Expected Size |
|-------|---------------|
| `/` (landing) | ~5KB |
| `/client-portals/[client]` (portal shell) | ~10KB |
| Content (deck/proposal) | ~60-80KB each |

### Caching
- Static generation for landing page
- Dynamic rendering for portal pages (auth required)
- Components lazy-loaded on demand

---

## Security Considerations

### Authentication
- Passwords stored in environment variables (not in code)
- Session cookies: `httpOnly`, `secure` (production), `sameSite: lax`
- Per-client session isolation prevents cross-client access
- 7-day session expiry

### Authorization
- Each content access checks session.clientId matches requested client
- Invalid clients/content return 404 (no information disclosure)
- Direct content URLs redirect to portal (forces auth flow)

### Environment Variables
- `SESSION_SECRET` - iron-session encryption key
- `PLYA_PASSWORD` - PLYA client access
- `TRADEBLOCK_PASSWORD` - Tradeblock client access
- Future clients: add `{CLIENT}_PASSWORD` env var

---

## Documentation

### Updates Required
1. **CLAUDE.md** - Add client portal patterns, new env vars
2. **README.md** - Update with new URL structure

### Adding New Clients

To add a new client:
1. Add entry to `lib/clients.ts`:
```typescript
'newclient': {
  id: 'newclient',
  name: 'New Client',
  passwordEnvVar: 'NEWCLIENT_PASSWORD',
  content: [
    { slug: 'deck', type: 'deck', title: 'Strategy Deck', component: NewClientDeck },
  ],
}
```
2. Create component in `components/clients/newclient/`
3. Add `NEWCLIENT_PASSWORD` to Railway environment variables
4. Deploy

---

## Implementation Phases

### Phase 1: Infrastructure
1. Create `lib/clients.ts` registry
2. Update `lib/session.ts` with clientId support
3. Create `/api/auth/[client]/route.ts`
4. Create `/client-portals/[client]/page.tsx`
5. Create `/client-portals/[client]/[slug]/page.tsx`
6. Create `PasswordGate` and `ContentIndex` components

### Phase 2: Content Migration
1. Move `TradeblockDeck.tsx` to `components/clients/tradeblock/TradeblockAIInflection.tsx`
2. Extract PLYA HTML to `components/clients/plya/PLYAProposal.tsx`
3. Add TypeScript types to PLYA components
4. Register both in `lib/clients.ts`

### Phase 3: Landing & Cleanup
1. Create `LandingPage` component
2. Update `app/page.tsx`
3. Delete `app/login/` directory
4. Delete old `components/TradeblockDeck.tsx`
5. Simplify `middleware.ts`
6. Update `app/layout.tsx` metadata

### Phase 4: Deploy & Verify
1. Add new env vars to Railway (`PLYA_PASSWORD`, `TRADEBLOCK_PASSWORD`)
2. Deploy and test
3. Update documentation

---

## Open Questions

None - all architectural decisions resolved.

---

## References

- [Previous Spec](./feat-routing-decks-proposals-33strategies.md) - Superseded by this spec
- [Ideation Document](../docs/ideation/routing-decks-proposals-33strategies.md)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [iron-session](https://github.com/vvo/iron-session)
