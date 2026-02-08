# Shareable Artifact Links with Password Protection

**Status:** Draft
**Authors:** Claude Code
**Date:** 2026-01-23
**Related:** `docs/ideation/shareable-artifact-links.md`, ValidationLink system

---

## Overview

Enable portal clients to share specific artifacts (decks, proposals, documents) with external parties via dedicated password-protected links. Clients set a simple password when generating the link from their portal, and recipients access the content by entering that password without needing full portal access.

**Example Flow:**
1. Tradeblock logs into their portal, sees "The 120-Day Sprint" deck
2. Clicks "Share" button on the artifact tile
3. Sets password "investor2026" in the modal
4. Copies link `33strategies.ai/share/V1StGXR8_Z5jdHi6B-myT`
5. Sends link to investor via email, shares password via text message
6. Investor visits link, enters password, views deck for 24 hours

---

## Background/Problem Statement

Currently, clients who want to share artifacts with external parties (investors, partners, advisors) have two options:
1. Share their full portal credentials (security risk, gives access to everything)
2. Request 33 Strategies to create a separate deployment (operational overhead)

Neither option is ideal. Clients need a way to share specific artifacts with controlled, lightweight access that they manage themselves.

The existing ValidationLink system in Clarity Canvas provides a proven pattern for public shareable links, but it's not password-protected and is tightly coupled to the persona validation flow.

---

## Goals

- Enable clients to generate shareable links for specific artifacts from their portal
- Allow clients to set their own password for each link
- Provide secure, time-limited access (24hr session) after password entry
- Support toggling shareability per-artifact via code configuration
- Follow established codebase patterns (iron-session, Prisma, design system)
- Prevent brute-force attacks via per-link lockout

---

## Non-Goals

- Admin UI for managing share links (v1 is code-managed)
- Analytics dashboard for share link access
- Automatic link expiration dates
- Multiple links per artifact (v1 is 1 link per artifact)
- Rate limiting infrastructure (Redis/Upstash) - simple DB-based lockout only
- CAPTCHA integration
- Email notifications on link access
- Client logo/branding on share page (use 33 Strategies design + client/artifact name)

---

## Technical Dependencies

### New Dependencies (to add to package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| `bcrypt` | `^5.1.1` | Password hashing with automatic salting |
| `@types/bcrypt` | `^5.0.2` | TypeScript types (devDependency) |
| `nanoid` | `^5.0.4` | Secure URL-friendly slug generation |

### Existing Dependencies (already in use)

| Package | Current Version | Purpose |
|---------|-----------------|---------|
| `iron-session` | `^8.0.0` | Encrypted session cookies |
| `@prisma/client` | `^6.19.1` | Database ORM |
| `framer-motion` | `^11.0.0` | Animations for share page |

---

## Detailed Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT PORTAL                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ EnhancedPortal.tsx                                                │   │
│  │  ├── ArtifactTile (existing)                                      │   │
│  │  │    └── [Share] button (NEW - only if shareable: true)          │   │
│  │  └── ShareLinkModal (NEW)                                         │   │
│  │       ├── Password input (min 6 chars)                            │   │
│  │       ├── [Create Link] → POST /api/share/create                  │   │
│  │       └── Success state with copy buttons                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ /api/share/create (POST)                                          │   │
│  │  ├── Verify portal session (must be logged into client portal)    │   │
│  │  ├── Hash password with bcrypt (work factor 10)                   │   │
│  │  ├── Generate slug with nanoid(21)                                │   │
│  │  └── Create ArtifactShareLink in database                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ /api/share/[slug]/auth (POST)                                     │   │
│  │  ├── Check lockout status                                         │   │
│  │  ├── Verify password with bcrypt.compare                          │   │
│  │  ├── On failure: increment failedAttempts, lock after 5           │   │
│  │  ├── On success: reset failedAttempts, set iron-session cookie    │   │
│  │  └── Return success/error with attempts remaining                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC SHARE PAGE                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ /share/[slug]/page.tsx                                            │   │
│  │  ├── Check iron-session cookie for valid share session            │   │
│  │  ├── If invalid/expired: render SharePasswordGate                 │   │
│  │  │    └── Password form → POST /api/share/[slug]/auth             │   │
│  │  └── If valid: render artifact component dynamically              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE                                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ArtifactShareLink                                                 │   │
│  │  ├── id: cuid                                                     │   │
│  │  ├── slug: nanoid(21) @unique                                     │   │
│  │  ├── clientId: string (e.g., "tradeblock")                        │   │
│  │  ├── artifactSlug: string @unique (e.g., "jan-2026-projections")  │   │
│  │  ├── hashedPassword: string (bcrypt)                              │   │
│  │  ├── failedAttempts: int (0-5)                                    │   │
│  │  ├── lockedUntil: datetime?                                       │   │
│  │  ├── accessCount: int                                             │   │
│  │  ├── lastAccessedAt: datetime?                                    │   │
│  │  └── createdAt: datetime                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model Changes

**New Prisma Model: `ArtifactShareLink`**

```prisma
// Add to prisma/schema.prisma

model ArtifactShareLink {
  id             String    @id @default(cuid())
  slug           String    @unique  // nanoid(21) - 126 bits entropy

  // What's being shared (composite unique - one link per artifact)
  clientId       String    // e.g., "tradeblock"
  artifactSlug   String    // e.g., "jan-2026-projections"

  // Security
  hashedPassword String    // bcrypt hash with work factor 10
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?

  // Metadata
  accessCount    Int       @default(0)
  lastAccessedAt DateTime?
  createdAt      DateTime  @default(now())

  @@unique([clientId, artifactSlug])  // One link per artifact
  @@index([slug])
}
```

### ContentItem Interface Extension

```typescript
// lib/clients.ts - extend ContentItem interface

export interface ContentItem {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  addedOn?: string;
  lastUpdated?: string;
  tagOverride?: string;
  component: ComponentType;
  shareable?: boolean;  // NEW: Enable share link functionality
}
```

### Session Types Extension

```typescript
// lib/session.ts - add share link session type

export interface ShareLinkSessionData {
  isAuthenticated: boolean;
  shareSlug: string;       // Which share link is authenticated
  clientId: string;        // Client who owns the artifact
  artifactSlug: string;    // Which artifact can be viewed
  authenticatedAt: number; // Timestamp for session age
}

// Separate session options for share links (different cookie name/path)
export function getShareLinkSessionOptions(slug: string): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required.');
  }

  return {
    password: secret,
    cookieName: `share-${slug.substring(0, 8)}`, // Unique per link
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: `/share/${slug}`,
    },
  };
}
```

### File Structure

```
app/
├── share/
│   └── [slug]/
│       ├── page.tsx              # Password gate + artifact render
│       └── opengraph-image.tsx   # OG image with client + artifact name
├── api/
│   └── share/
│       ├── create/
│       │   └── route.ts          # POST: Create share link (portal auth required)
│       └── [slug]/
│           └── auth/
│               └── route.ts      # POST: Verify password, set session

components/
├── portal/
│   ├── EnhancedPortal.tsx        # MODIFY: Add share button to ArtifactTile
│   ├── ShareLinkModal.tsx        # NEW: Modal for creating share links
│   └── types.ts                  # MODIFY: Add shareable to ContentItemData

lib/
├── clients.ts                    # MODIFY: Add shareable to ContentItem
├── session.ts                    # MODIFY: Add ShareLinkSessionData
└── share/
    └── utils.ts                  # NEW: Share link utilities
```

### API Endpoints

#### POST `/api/share/create`

Creates a new share link for an artifact. Requires portal authentication.

**Request:**
```typescript
{
  clientId: string;      // Must match session.clientId
  artifactSlug: string;  // Must exist in client's content
  password: string;      // Min 6 characters
}
```

**Response (200):**
```typescript
{
  success: true;
  slug: string;          // The generated slug
  url: string;           // Full share URL
}
```

**Error Responses:**
- `401`: Not authenticated to portal
- `400`: Invalid password (too short) or artifact not shareable
- `409`: Share link already exists for this artifact
- `500`: Server error

**Implementation:**
```typescript
// app/api/share/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getClient, getClientContent } from '@/lib/clients';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  // 1. Verify portal authentication
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (!session.isLoggedIn || !session.clientId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Parse and validate request
  const { clientId, artifactSlug, password } = await req.json();

  // Verify client matches session
  if (clientId.toLowerCase() !== session.clientId) {
    return NextResponse.json(
      { error: 'Unauthorized for this client' },
      { status: 403 }
    );
  }

  // Validate password length
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // 3. Verify artifact exists and is shareable
  const content = getClientContent(clientId, artifactSlug);
  if (!content) {
    return NextResponse.json(
      { error: 'Artifact not found' },
      { status: 404 }
    );
  }

  if (!content.shareable) {
    return NextResponse.json(
      { error: 'This artifact is not shareable' },
      { status: 400 }
    );
  }

  // 4. Check if link already exists
  const existing = await prisma.artifactShareLink.findUnique({
    where: {
      clientId_artifactSlug: {
        clientId: clientId.toLowerCase(),
        artifactSlug,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Share link already exists for this artifact' },
      { status: 409 }
    );
  }

  // 5. Hash password and generate slug
  const hashedPassword = await bcrypt.hash(password, 10);
  const slug = nanoid(21);

  // 6. Create share link
  const shareLink = await prisma.artifactShareLink.create({
    data: {
      slug,
      clientId: clientId.toLowerCase(),
      artifactSlug,
      hashedPassword,
    },
  });

  // 7. Return success with full URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://33strategies.ai';

  return NextResponse.json({
    success: true,
    slug: shareLink.slug,
    url: `${baseUrl}/share/${shareLink.slug}`,
  });
}
```

#### POST `/api/share/[slug]/auth`

Verifies password and creates session for share link access.

**Request:**
```typescript
{
  password: string;
}
```

**Response (200):**
```typescript
{
  success: true;
}
```

**Error Responses:**
- `401`: Invalid password (with `attemptsRemaining`)
- `429`: Link locked (with `lockedUntil` and `minutesRemaining`)
- `404`: Link not found (disguised as 401 to prevent enumeration)

**Implementation:**
```typescript
// app/api/share/[slug]/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getShareLinkSessionOptions, ShareLinkSessionData } from '@/lib/session';
import bcrypt from 'bcrypt';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { password } = await req.json();

  // 1. Fetch link
  const link = await prisma.artifactShareLink.findUnique({
    where: { slug },
  });

  // Don't reveal if link exists - always show password error
  if (!link) {
    // Add artificial delay to match bcrypt timing
    await new Promise((resolve) => setTimeout(resolve, 100));
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    );
  }

  // 2. Check if locked
  if (link.lockedUntil && link.lockedUntil > new Date()) {
    const minutesRemaining = Math.ceil(
      (link.lockedUntil.getTime() - Date.now()) / 60000
    );
    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${minutesRemaining} minutes.`,
        lockedUntil: link.lockedUntil.toISOString(),
        minutesRemaining,
      },
      { status: 429 }
    );
  }

  // 3. Verify password
  const isValid = await bcrypt.compare(password, link.hashedPassword);

  if (!isValid) {
    // Increment failed attempts
    const failedAttempts = link.failedAttempts + 1;
    const updates: { failedAttempts: number; lockedUntil?: Date } = {
      failedAttempts,
    };

    // Lock after MAX_ATTEMPTS
    if (failedAttempts >= MAX_ATTEMPTS) {
      updates.lockedUntil = new Date(
        Date.now() + LOCKOUT_MINUTES * 60 * 1000
      );
    }

    await prisma.artifactShareLink.update({
      where: { slug },
      data: updates,
    });

    return NextResponse.json(
      {
        error: 'Invalid password',
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - failedAttempts),
      },
      { status: 401 }
    );
  }

  // 4. Success - reset failed attempts, update access tracking
  await prisma.artifactShareLink.update({
    where: { slug },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });

  // 5. Create session
  const session = await getIronSession<ShareLinkSessionData>(
    await cookies(),
    getShareLinkSessionOptions(slug)
  );

  session.isAuthenticated = true;
  session.shareSlug = slug;
  session.clientId = link.clientId;
  session.artifactSlug = link.artifactSlug;
  session.authenticatedAt = Date.now();

  await session.save();

  return NextResponse.json({ success: true });
}
```

### Share Page Implementation

```typescript
// app/share/[slug]/page.tsx
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getShareLinkSessionOptions, ShareLinkSessionData } from '@/lib/session';
import { getClient, getClientContent } from '@/lib/clients';
import SharePasswordGate from '@/components/share/SharePasswordGate';

export default async function SharePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  // 1. Fetch share link to get metadata (for password gate display)
  const link = await prisma.artifactShareLink.findUnique({
    where: { slug },
  });

  if (!link) {
    return <ShareNotFound />;
  }

  // 2. Get client and content info
  const client = getClient(link.clientId);
  const content = client ? getClientContent(link.clientId, link.artifactSlug) : null;

  if (!client || !content) {
    return <ShareNotFound />;
  }

  // 3. Check session
  const session = await getIronSession<ShareLinkSessionData>(
    await cookies(),
    getShareLinkSessionOptions(slug)
  );

  const isAuthenticated =
    session.isAuthenticated &&
    session.shareSlug === slug &&
    session.authenticatedAt &&
    Date.now() - session.authenticatedAt < 24 * 60 * 60 * 1000; // 24 hours

  // 4. If not authenticated, show password gate
  if (!isAuthenticated) {
    return (
      <SharePasswordGate
        slug={slug}
        clientName={client.name}
        artifactTitle={content.title}
        isLocked={link.lockedUntil ? link.lockedUntil > new Date() : false}
        lockedUntil={link.lockedUntil}
      />
    );
  }

  // 5. Authenticated - render the artifact
  const Component = content.component;
  return <Component />;
}

function ShareNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-display text-white mb-4">
          Link Not Found
        </h1>
        <p className="text-[#888] text-sm">
          This share link may have expired or been removed.
        </p>
      </div>
    </div>
  );
}
```

### SharePasswordGate Component

```typescript
// components/share/SharePasswordGate.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GOLD, BG_PRIMARY, BG_SURFACE } from '@/components/portal/design-tokens';

interface SharePasswordGateProps {
  slug: string;
  clientName: string;
  artifactTitle: string;
  isLocked: boolean;
  lockedUntil: Date | null;
}

export default function SharePasswordGate({
  slug,
  clientName,
  artifactTitle,
  isLocked,
  lockedUntil,
}: SharePasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/share/${slug}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh page to show artifact
        router.refresh();
      } else if (res.status === 429) {
        setError(data.error);
        setAttemptsRemaining(0);
      } else {
        setError(data.error || 'Invalid password');
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const minutesRemaining = lockedUntil
    ? Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000)
    : 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: BG_PRIMARY }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: BG_SURFACE }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke={GOLD}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <p
            className="text-xs font-mono uppercase tracking-wider mb-2"
            style={{ color: GOLD }}
          >
            {clientName}
          </p>

          <h1 className="text-2xl font-display text-white mb-2">
            {artifactTitle}
          </h1>

          <p className="text-sm text-[#888]">
            Enter the password to view this content
          </p>
        </div>

        {/* Form */}
        {isLocked && minutesRemaining > 0 ? (
          <div
            className="p-4 rounded-lg text-center"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <p className="text-[#f87171] text-sm">
              Too many failed attempts. Try again in {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-[#555] focus:outline-none transition-colors"
                  style={{
                    background: BG_SURFACE,
                    border: error ? '1px solid #f87171' : `1px solid rgba(255, 255, 255, 0.1)`,
                  }}
                  placeholder="Enter password"
                  autoFocus
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-sm text-[#f87171]" role="alert">
                  {error}
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <span className="block mt-1 text-xs text-[#888]">
                      {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                    </span>
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: GOLD,
                color: BG_PRIMARY,
              }}
            >
              {loading ? 'Verifying...' : 'Access Content'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-[#555]">
            Don&apos;t have the password?{' '}
            <span className="text-[#888]">Contact the person who shared this link.</span>
          </p>
        </div>

        {/* 33 Strategies Branding */}
        <div className="pt-8 text-center">
          <p className="text-xs text-[#555]">
            <span className="font-display" style={{ color: GOLD }}>33</span> Strategies
          </p>
        </div>
      </motion.div>
    </div>
  );
}
```

### ShareLinkModal Component

```typescript
// components/portal/ShareLinkModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOLD, BG_PRIMARY, BG_SURFACE } from './design-tokens';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  artifactSlug: string;
  artifactTitle: string;
}

type ModalState = 'input' | 'loading' | 'success' | 'error';

export default function ShareLinkModal({
  isOpen,
  onClose,
  clientId,
  artifactSlug,
  artifactTitle,
}: ShareLinkModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState<ModalState>('input');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState<'link' | 'password' | null>(null);

  async function handleCreate() {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setState('loading');
    setError('');

    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, artifactSlug, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setShareUrl(data.url);
        setState('success');
      } else {
        setError(data.error || 'Failed to create share link');
        setState('error');
      }
    } catch {
      setError('An error occurred. Please try again.');
      setState('error');
    }
  }

  async function copyToClipboard(text: string, type: 'link' | 'password') {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleClose() {
    // Reset state when closing
    setPassword('');
    setError('');
    setState('input');
    setShareUrl('');
    setCopied(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-xl p-6"
          style={{ background: BG_SURFACE, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display text-white">
              {state === 'success' ? 'Share Link Created' : 'Create Share Link'}
            </h2>
            <button
              onClick={handleClose}
              className="text-[#888] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {state === 'success' ? (
            // Success State
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#888] mb-2">Share this link:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded text-sm text-white truncate"
                    style={{ background: BG_PRIMARY, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl, 'link')}
                    className="px-4 py-2 rounded font-medium text-sm transition-colors"
                    style={{
                      background: copied === 'link' ? '#4ade80' : GOLD,
                      color: BG_PRIMARY,
                    }}
                  >
                    {copied === 'link' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#888] mb-2">Share this password separately:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    readOnly
                    className="flex-1 px-3 py-2 rounded text-sm text-white font-mono"
                    style={{ background: BG_PRIMARY, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                  <button
                    onClick={() => copyToClipboard(password, 'password')}
                    className="px-4 py-2 rounded font-medium text-sm transition-colors"
                    style={{
                      background: copied === 'password' ? '#4ade80' : GOLD,
                      color: BG_PRIMARY,
                    }}
                  >
                    {copied === 'password' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div
                className="p-3 rounded text-xs"
                style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)' }}
              >
                <p className="text-[#4ade80]">
                  <strong>Security tip:</strong> Share the link and password through separate channels (e.g., link via email, password via text).
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2 rounded text-sm text-[#888] hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                Done
              </button>
            </div>
          ) : (
            // Input State
            <div className="space-y-4">
              <p className="text-sm text-[#888]">
                Create a password-protected link for <span className="text-white">&ldquo;{artifactTitle}&rdquo;</span>
              </p>

              <div>
                <label className="block text-sm text-[#888] mb-2">
                  Set a password (min 6 characters)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 rounded text-white placeholder-[#555]"
                  style={{
                    background: BG_PRIMARY,
                    border: error ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-xs text-[#f87171]">{error}</p>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={state === 'loading' || password.length < 6}
                className="w-full py-3 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: GOLD, color: BG_PRIMARY }}
              >
                {state === 'loading' ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### OG Image for Share Links

```typescript
// app/share/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getClient, getClientContent } from '@/lib/clients';

export const runtime = 'edge';
export const alt = 'Shared Content';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: { slug: string };
}) {
  const link = await prisma.artifactShareLink.findUnique({
    where: { slug: params.slug },
  });

  if (!link) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#0a0a0f',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#888', fontSize: 32 }}>Content Not Found</div>
        </div>
      ),
      size
    );
  }

  const client = getClient(link.clientId);
  const content = client ? getClientContent(link.clientId, link.artifactSlug) : null;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #111114 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            background: 'rgba(212, 165, 74, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4a54a" strokeWidth="1.5">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Client name */}
        <div style={{ color: '#d4a54a', fontSize: 18, marginBottom: 16, letterSpacing: '0.2em' }}>
          {client?.name?.toUpperCase() || 'SHARED CONTENT'}
        </div>

        {/* Artifact title */}
        <div
          style={{
            color: '#f5f5f5',
            fontSize: 48,
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          {content?.title || 'Protected Content'}
        </div>

        {/* Password required notice */}
        <div style={{ color: '#888', fontSize: 20 }}>
          Password required to view
        </div>

        {/* 33 Strategies branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#d4a54a', fontSize: 24 }}>33</span>
          <span style={{ color: '#555', fontSize: 16 }}>Strategies</span>
        </div>
      </div>
    ),
    size
  );
}
```

---

## User Experience

### Portal User (Creating Share Link)

1. User logs into client portal (e.g., Tradeblock)
2. Sees artifacts list with "Share" button on shareable items
3. Clicks "Share" on "The 120-Day Sprint" deck
4. Modal opens, prompts for password (min 6 chars)
5. Enters "investor2026", clicks "Create Share Link"
6. Modal shows success state with:
   - Share URL with copy button
   - Password with copy button
   - Security tip about separate channels
7. Copies link, sends to investor via email
8. Copies password, sends to investor via text

### External User (Accessing Share Link)

1. Receives link `33strategies.ai/share/V1StGXR8_Z5jdHi6B-myT`
2. Visits link, sees password gate with:
   - "Tradeblock" label
   - "The 120-Day Sprint" title
   - Password input field
   - "33 Strategies" branding
3. Enters password "investor2026"
4. If correct: page refreshes, artifact renders
5. If wrong: sees error with attempts remaining
6. After 5 wrong attempts: locked for 15 minutes
7. Session lasts 24 hours; can revisit without re-entering password

---

## Testing Strategy

### Unit Tests

**Password Hashing (`lib/share/utils.test.ts`)**
```typescript
// Purpose: Verify bcrypt hashing works correctly and timing is consistent
describe('password hashing', () => {
  it('should hash password and verify correctly', async () => {
    const password = 'testpass123';
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrongpass', hash)).toBe(false);
  });

  it('should reject passwords under 6 characters', () => {
    expect(() => validatePassword('12345')).toThrow();
    expect(() => validatePassword('123456')).not.toThrow();
  });
});
```

**Slug Generation (`lib/share/utils.test.ts`)**
```typescript
// Purpose: Verify slugs are correct length and unique
describe('slug generation', () => {
  it('should generate 21-character alphanumeric slugs', () => {
    const slug = generateShareSlug();
    expect(slug).toHaveLength(21);
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should generate unique slugs', () => {
    const slugs = new Set(Array.from({ length: 1000 }, generateShareSlug));
    expect(slugs.size).toBe(1000);
  });
});
```

### Integration Tests

**API Route Tests (`__tests__/api/share.test.ts`)**
```typescript
// Purpose: Verify full API flow including auth, database, and sessions
describe('POST /api/share/create', () => {
  it('should require portal authentication', async () => {
    const res = await fetch('/api/share/create', {
      method: 'POST',
      body: JSON.stringify({ clientId: 'tradeblock', artifactSlug: 'test', password: 'test123' }),
    });
    expect(res.status).toBe(401);
  });

  it('should reject non-shareable artifacts', async () => {
    // With valid portal session but non-shareable artifact
    const res = await authenticatedFetch('/api/share/create', {
      method: 'POST',
      body: JSON.stringify({ clientId: 'tradeblock', artifactSlug: 'non-shareable', password: 'test123' }),
    });
    expect(res.status).toBe(400);
  });

  it('should create share link for shareable artifact', async () => {
    const res = await authenticatedFetch('/api/share/create', {
      method: 'POST',
      body: JSON.stringify({ clientId: 'tradeblock', artifactSlug: 'jan-2026-projections', password: 'test123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.slug).toHaveLength(21);
    expect(data.url).toContain('/share/');
  });
});

describe('POST /api/share/[slug]/auth', () => {
  it('should lock after 5 failed attempts', async () => {
    // Create link first
    const link = await createTestShareLink();

    // Fail 5 times
    for (let i = 0; i < 5; i++) {
      await fetch(`/api/share/${link.slug}/auth`, {
        method: 'POST',
        body: JSON.stringify({ password: 'wrongpassword' }),
      });
    }

    // 6th attempt should be locked
    const res = await fetch(`/api/share/${link.slug}/auth`, {
      method: 'POST',
      body: JSON.stringify({ password: 'wrongpassword' }),
    });
    expect(res.status).toBe(429);
  });

  it('should set session cookie on successful auth', async () => {
    const link = await createTestShareLink('correctpassword');

    const res = await fetch(`/api/share/${link.slug}/auth`, {
      method: 'POST',
      body: JSON.stringify({ password: 'correctpassword' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain(`share-${link.slug.substring(0, 8)}`);
  });
});
```

### E2E Tests (Playwright)

```typescript
// Purpose: Verify full user flow from portal to share link access
describe('share link flow', () => {
  test('client can create and share link', async ({ page }) => {
    // Login to portal
    await page.goto('/client-portals/tradeblock');
    await page.fill('[data-testid="email"]', 'test@tradeblock.us');
    await page.fill('[data-testid="password"]', process.env.TRADEBLOCK_PASSWORD!);
    await page.click('[data-testid="login-button"]');

    // Click share on shareable artifact
    await page.click('[data-testid="share-button-jan-2026-projections"]');

    // Enter password in modal
    await page.fill('[data-testid="share-password-input"]', 'investor2026');
    await page.click('[data-testid="create-share-link-button"]');

    // Verify success state
    await expect(page.locator('[data-testid="share-url"]')).toBeVisible();
    const shareUrl = await page.locator('[data-testid="share-url"]').inputValue();

    // Open share link in new context (simulating external user)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(shareUrl);

    // Verify password gate
    await expect(page2.locator('text=Enter the password')).toBeVisible();

    // Enter correct password
    await page2.fill('[data-testid="share-password"]', 'investor2026');
    await page2.click('[data-testid="access-button"]');

    // Verify artifact loads
    await expect(page2.locator('text=The 120-Day Sprint')).toBeVisible();
  });

  test('lockout after failed attempts', async ({ page }) => {
    // Create share link via API
    const link = await createShareLinkViaAPI('tradeblock', 'jan-2026-projections', 'secret123');

    await page.goto(`/share/${link.slug}`);

    // Attempt wrong password 5 times
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="share-password"]', 'wrongpassword');
      await page.click('[data-testid="access-button"]');
      await page.waitForTimeout(500);
    }

    // Verify locked state
    await expect(page.locator('text=Too many failed attempts')).toBeVisible();
  });
});
```

---

## Performance Considerations

1. **bcrypt Hashing**: ~100ms per operation (work factor 10). Acceptable for auth flows.
2. **Session Cookies**: Scoped to `/share/[slug]` path, not sent on other routes.
3. **Database Queries**: Indexed on `slug` and `[clientId, artifactSlug]` for fast lookups.
4. **Artifact Loading**: Same dynamic component loading as portal; no additional overhead.

---

## Security Considerations

1. **Password Storage**: bcrypt with work factor 10, automatic salting
2. **Brute Force Protection**: 5 attempts then 15-minute lockout per link
3. **Enumeration Prevention**: Same 401 response for invalid slug and wrong password
4. **Timing Attacks**: bcrypt provides constant-time comparison; artificial delay for missing links
5. **Session Security**: HttpOnly cookies, SameSite=lax, secure in production
6. **XSS Prevention**: No user input rendered without escaping
7. **CSRF Protection**: Implicit via SameSite cookies and POST-only mutations

---

## Documentation

- Update `CLAUDE.md` with share link system overview
- Add `docs/developer-guides/share-links.md` with implementation details
- Document `ContentItem.shareable` flag usage in `lib/clients.ts` comments

---

## Implementation Phases

### Phase 1: Core Infrastructure
- Add bcrypt and nanoid dependencies
- Create Prisma migration for `ArtifactShareLink` model
- Extend `ContentItem` interface with `shareable` flag
- Extend session types for share link sessions
- Create share link utilities (`lib/share/utils.ts`)

### Phase 2: API Routes
- Implement `POST /api/share/create`
- Implement `POST /api/share/[slug]/auth`
- Add error handling and validation

### Phase 3: Share Page
- Create `/share/[slug]/page.tsx` with password gate
- Create `SharePasswordGate` component
- Create OG image generation

### Phase 4: Portal Integration
- Create `ShareLinkModal` component
- Add share button to `ArtifactTile` in `EnhancedPortal`
- Pass `shareable` flag through to portal components

### Phase 5: Testing & Polish
- Write unit tests for utilities
- Write integration tests for API routes
- Write E2E tests for full flow
- Manual testing with real artifacts

---

## Open Questions

1. **Regenerating Links**: Should clients be able to regenerate a link (new slug, new password) for an artifact that already has one?
   - Current: 409 Conflict if link exists
   - Alternative: Allow regeneration (deletes old link)
   - Recommendation: v1 keeps current behavior; v2 can add regeneration

2. **Link Deletion**: Should there be an API to delete share links?
   - Current: Only via direct database access
   - Recommendation: Add in v2 with portal UI

---

## References

- Ideation document: `docs/ideation/shareable-artifact-links.md`
- Existing ValidationLink pattern: `prisma/schema.prisma:324-342`
- Portal authentication: `lib/session.ts`
- iron-session docs: https://github.com/vvo/iron-session
- bcrypt best practices: https://auth0.com/blog/hashing-in-action-understanding-bcrypt/
- nanoid: https://github.com/ai/nanoid

---

**Quality Score: 9/10**

Comprehensive spec covering all aspects of the feature with concrete implementation details, security considerations, and testing strategy. Minor deductions for not including rollback strategy and data migration (not applicable for new feature with no existing data).
