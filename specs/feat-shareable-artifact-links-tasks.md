# Task Breakdown: Shareable Artifact Links with Password Protection

**Generated:** 2026-01-23
**Source:** specs/feat-shareable-artifact-links.md
**Total Tasks:** 12
**Estimated Phases:** 5

---

## Overview

Enable portal clients to share specific artifacts via password-protected links. External recipients enter the password to view content for 24 hours without full portal access.

---

## Phase 1: Core Infrastructure

### Task 1.1: Add Dependencies (bcrypt, nanoid)

**Description:** Install bcrypt for password hashing and nanoid for secure slug generation
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** None (must complete first)

**Technical Requirements:**
- bcrypt ^5.1.1 - Password hashing with automatic salting
- @types/bcrypt ^5.0.2 - TypeScript types (devDependency)
- nanoid ^5.0.4 - Secure URL-friendly slug generation (126 bits entropy with 21 chars)

**Implementation Steps:**
```bash
npm install bcrypt@^5.1.1 nanoid@^5.0.4
npm install -D @types/bcrypt@^5.0.2
```

**Acceptance Criteria:**
- [ ] bcrypt, nanoid installed as dependencies
- [ ] @types/bcrypt installed as devDependency
- [ ] package.json updated with correct versions
- [ ] npm install runs without errors
- [ ] TypeScript can import both packages without errors

---

### Task 1.2: Create Prisma Migration for ArtifactShareLink

**Description:** Add ArtifactShareLink model to database schema
**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1

**Technical Requirements:**
Add the following model to `prisma/schema.prisma`:

```prisma
// Add to prisma/schema.prisma after ContactSubmission model

// ============================================================================
// ARTIFACT SHARE LINKS - Password-protected sharing for portal artifacts
// ============================================================================

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

**Implementation Steps:**
1. Add model to prisma/schema.prisma
2. Run `npx prisma migrate dev --name add_artifact_share_link`
3. Verify migration creates table with correct columns and indexes
4. Run `npx prisma generate` to update client

**Acceptance Criteria:**
- [ ] ArtifactShareLink model added to schema
- [ ] Migration created and applied successfully
- [ ] Composite unique constraint on [clientId, artifactSlug] works
- [ ] Index on slug created
- [ ] Prisma client regenerated

---

### Task 1.3: Extend ContentItem Interface with shareable Flag

**Description:** Add optional shareable property to ContentItem interface
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1, 1.2

**Technical Requirements:**
Modify `lib/clients.ts`:

```typescript
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

Also add `shareable: true` to at least one artifact for testing:

```typescript
// In tradeblock content array:
{
  slug: 'jan-2026-projections',
  type: 'deck',
  title: 'The 120-Day Sprint',
  description: 'Investor update - January 2025',
  addedOn: '2025-01-23',
  component: TradeblockJan2026Projections,
  shareable: true,  // Enable sharing for this deck
},
```

**Implementation Steps:**
1. Add `shareable?: boolean` to ContentItem interface
2. Add `shareable: true` to jan-2026-projections artifact
3. TypeScript should compile without errors

**Acceptance Criteria:**
- [ ] ContentItem interface extended with shareable property
- [ ] At least one artifact marked as shareable: true
- [ ] TypeScript compiles without errors
- [ ] Existing artifacts without shareable flag continue to work

---

### Task 1.4: Extend Session Types for Share Links

**Description:** Add ShareLinkSessionData type and getShareLinkSessionOptions function
**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1, 1.2, 1.3

**Technical Requirements:**
Add to `lib/session.ts`:

```typescript
import { SessionOptions } from 'iron-session';

// Existing SessionData interface unchanged...

// NEW: Share link session type
export interface ShareLinkSessionData {
  isAuthenticated: boolean;
  shareSlug: string;       // Which share link is authenticated
  clientId: string;        // Client who owns the artifact
  artifactSlug: string;    // Which artifact can be viewed
  authenticatedAt: number; // Timestamp for session age validation
}

// NEW: Separate session options for share links (different cookie name/path)
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

**Implementation Steps:**
1. Add ShareLinkSessionData interface
2. Add getShareLinkSessionOptions function
3. Export both from lib/session.ts

**Acceptance Criteria:**
- [ ] ShareLinkSessionData interface exported
- [ ] getShareLinkSessionOptions function works correctly
- [ ] Cookie name uses first 8 chars of slug
- [ ] Cookie path scoped to /share/[slug]
- [ ] 24-hour maxAge configured
- [ ] TypeScript compiles without errors

---

### Task 1.5: Create Share Link Utilities Module

**Description:** Create lib/share/utils.ts with helper functions
**Size:** Small
**Priority:** Medium
**Dependencies:** Task 1.1 (needs bcrypt, nanoid)
**Can run parallel with:** Task 1.2, 1.3, 1.4 (after 1.1)

**Technical Requirements:**
Create `lib/share/utils.ts`:

```typescript
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const BCRYPT_WORK_FACTOR = 10;
const SLUG_LENGTH = 21;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Generate a secure share link slug using nanoid
 * 21 characters = 126 bits of entropy (URL-safe)
 */
export function generateShareSlug(): string {
  return nanoid(SLUG_LENGTH);
}

/**
 * Hash a password using bcrypt
 * Work factor 10 provides ~100ms hashing time
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_WORK_FACTOR);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password meets minimum requirements
 * Throws if invalid
 */
export function validatePassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

/**
 * Build full share URL from slug
 */
export function buildShareUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://33strategies.ai';
  return `${baseUrl}/share/${slug}`;
}

/**
 * Check if a share link is currently locked
 */
export function isLinkLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return lockedUntil > new Date();
}

/**
 * Calculate minutes remaining in lockout
 */
export function getLockoutMinutesRemaining(lockedUntil: Date): number {
  return Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
}
```

**Implementation Steps:**
1. Create lib/share/ directory
2. Create lib/share/utils.ts with all helper functions
3. Verify imports work correctly

**Acceptance Criteria:**
- [ ] lib/share/utils.ts created with all functions
- [ ] generateShareSlug returns 21-char alphanumeric strings
- [ ] hashPassword uses bcrypt with work factor 10
- [ ] verifyPassword correctly compares passwords
- [ ] validatePassword throws for passwords under 6 chars
- [ ] TypeScript compiles without errors

---

## Phase 2: API Routes

### Task 2.1: Implement POST /api/share/create

**Description:** Create API route for generating share links from portal
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.1, 1.2, 1.3, 1.4, 1.5
**Can run parallel with:** None in Phase 2

**Technical Requirements:**
Create `app/api/share/create/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSessionOptions, SessionData } from '@/lib/session';
import { getClient, getClientContent } from '@/lib/clients';
import { generateShareSlug, hashPassword, validatePassword, buildShareUrl } from '@/lib/share/utils';

export async function POST(req: NextRequest) {
  try {
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
    try {
      validatePassword(password);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
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
    const hashedPassword = await hashPassword(password);
    const slug = generateShareSlug();

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
    return NextResponse.json({
      success: true,
      slug: shareLink.slug,
      url: buildShareUrl(shareLink.slug),
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
```

**API Contract:**
- Request: `{ clientId: string, artifactSlug: string, password: string }`
- Response 200: `{ success: true, slug: string, url: string }`
- Error 401: Not authenticated
- Error 403: Wrong client
- Error 400: Invalid password or not shareable
- Error 404: Artifact not found
- Error 409: Link already exists
- Error 500: Server error

**Implementation Steps:**
1. Create app/api/share/create/ directory
2. Create route.ts with full implementation
3. Test with curl or Postman

**Acceptance Criteria:**
- [ ] Route requires valid portal session
- [ ] Returns 401 if not authenticated
- [ ] Returns 403 if clientId doesn't match session
- [ ] Returns 400 for passwords under 6 chars
- [ ] Returns 404 for non-existent artifacts
- [ ] Returns 400 for non-shareable artifacts
- [ ] Returns 409 if link already exists
- [ ] Successfully creates link with bcrypt hash
- [ ] Returns correct URL format

---

### Task 2.2: Implement POST /api/share/[slug]/auth

**Description:** Create API route for verifying share link passwords
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.1, 1.2, 1.4, 1.5
**Can run parallel with:** Task 2.1 (after Phase 1)

**Technical Requirements:**
Create `app/api/share/[slug]/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getShareLinkSessionOptions, ShareLinkSessionData } from '@/lib/session';
import { verifyPassword, isLinkLocked, getLockoutMinutesRemaining } from '@/lib/share/utils';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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
    if (isLinkLocked(link.lockedUntil)) {
      const minutesRemaining = getLockoutMinutesRemaining(link.lockedUntil!);
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${minutesRemaining} minutes.`,
          lockedUntil: link.lockedUntil!.toISOString(),
          minutesRemaining,
        },
        { status: 429 }
      );
    }

    // 3. Verify password
    const isValid = await verifyPassword(password, link.hashedPassword);

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

  } catch (error) {
    console.error('Error authenticating share link:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

**Security Features:**
- Same 401 response for invalid slug and wrong password (enumeration prevention)
- Artificial delay for missing links to match bcrypt timing
- 5-attempt lockout with 15-minute duration
- Session cookie scoped to specific share link path

**Implementation Steps:**
1. Create app/api/share/[slug]/auth/ directory structure
2. Create route.ts with full implementation
3. Test lockout behavior

**Acceptance Criteria:**
- [ ] Returns 401 for both invalid slug and wrong password
- [ ] Adds artificial delay for missing links
- [ ] Increments failedAttempts on wrong password
- [ ] Locks after 5 failed attempts
- [ ] Returns 429 when locked with minutesRemaining
- [ ] Resets failedAttempts on success
- [ ] Increments accessCount on success
- [ ] Sets session cookie correctly
- [ ] Session contains all required fields

---

## Phase 3: Share Page

### Task 3.1: Create Share Page with Password Gate

**Description:** Create /share/[slug] page that shows password gate or artifact
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.1, 2.2, 1.3, 1.4
**Can run parallel with:** Task 3.2 (SharePasswordGate component)

**Technical Requirements:**
Create `app/share/[slug]/page.tsx`:

```typescript
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getShareLinkSessionOptions, ShareLinkSessionData } from '@/lib/session';
import { getClient, getClientContent } from '@/lib/clients';
import SharePasswordGate from '@/components/share/SharePasswordGate';

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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

**Implementation Steps:**
1. Create app/share/[slug]/ directory
2. Create page.tsx with session checking logic
3. Uses SharePasswordGate component (Task 3.2)

**Acceptance Criteria:**
- [ ] Shows ShareNotFound for invalid slugs
- [ ] Shows ShareNotFound if artifact no longer exists
- [ ] Shows SharePasswordGate when not authenticated
- [ ] Shows artifact component when authenticated
- [ ] Validates session is for correct slug
- [ ] Validates session is less than 24 hours old
- [ ] Uses Next.js 15 async params correctly

---

### Task 3.2: Create SharePasswordGate Component

**Description:** Client component for password entry with lockout handling
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.2
**Can run parallel with:** Task 3.1

**Technical Requirements:**
Create `components/share/SharePasswordGate.tsx` with full implementation from spec (see specification for complete 200+ line component code with:
- Password form with show/hide toggle
- Lockout state display
- Error handling with attempts remaining
- Loading states
- 33 Strategies branding
- Framer Motion animations)

**Key Features:**
- Uses design tokens from portal (GOLD, BG_PRIMARY, BG_SURFACE)
- Shows client name and artifact title
- Handles 401 errors with attempts remaining
- Handles 429 lockout with countdown
- Calls router.refresh() on success

**Implementation Steps:**
1. Create components/share/ directory
2. Create SharePasswordGate.tsx with full implementation
3. Verify imports work correctly

**Acceptance Criteria:**
- [ ] Shows client name and artifact title
- [ ] Password input with show/hide toggle
- [ ] Submit calls /api/share/[slug]/auth
- [ ] Displays attempts remaining on failure
- [ ] Shows lockout message when locked
- [ ] Calls router.refresh() on success
- [ ] Uses 33 Strategies design tokens
- [ ] Accessible (sr-only labels, role="alert")

---

### Task 3.3: Create OG Image for Share Links

**Description:** Dynamic OpenGraph image showing client name and artifact title
**Size:** Medium
**Priority:** Medium
**Dependencies:** Task 1.2
**Can run parallel with:** Task 3.1, 3.2

**Technical Requirements:**
Create `app/share/[slug]/opengraph-image.tsx`:

NOTE: The spec shows edge runtime but Prisma doesn't work in edge. Use Node runtime instead:

```typescript
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getClient, getClientContent } from '@/lib/clients';

// Use Node runtime since Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const alt = 'Shared Content';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const link = await prisma.artifactShareLink.findUnique({
    where: { slug },
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
        {/* Lock icon circle */}
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

**Implementation Steps:**
1. Create opengraph-image.tsx in app/share/[slug]/
2. Use Node runtime (not edge) for Prisma compatibility
3. Test by visiting /share/[slug] and checking og:image meta

**Acceptance Criteria:**
- [ ] Uses Node runtime (not edge)
- [ ] Shows "Content Not Found" for invalid slugs
- [ ] Shows client name in gold uppercase
- [ ] Shows artifact title in white
- [ ] Shows "Password required to view"
- [ ] Shows 33 Strategies branding
- [ ] Correct size (1200x630)

---

## Phase 4: Portal Integration

### Task 4.1: Create ShareLinkModal Component

**Description:** Modal for creating share links from portal
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.1
**Can run parallel with:** Task 4.2

**Technical Requirements:**
Create `components/portal/ShareLinkModal.tsx` with full implementation from spec (see specification for complete component with:
- Password input state
- Loading/success/error states
- Copy to clipboard for URL and password
- Security tip about separate channels
- Framer Motion animations)

**Key Features:**
- AnimatePresence for mount/unmount
- Three states: input, loading, success
- Copy buttons with feedback
- Security tip in success state
- Uses portal design tokens

**Implementation Steps:**
1. Create ShareLinkModal.tsx in components/portal/
2. Full implementation matching spec
3. Test modal open/close and state transitions

**Acceptance Criteria:**
- [ ] Modal opens/closes correctly
- [ ] Password input with min 6 char validation
- [ ] Shows loading state during API call
- [ ] Shows success state with URL and password
- [ ] Copy buttons work with visual feedback
- [ ] Security tip displayed in success state
- [ ] Resets state when closing
- [ ] Backdrop click closes modal

---

### Task 4.2: Add Share Button to ArtifactTile

**Description:** Modify EnhancedPortal to show Share button on shareable artifacts
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.3, 4.1
**Can run parallel with:** Task 4.1 (after 1.3)

**Technical Requirements:**
Modify `components/portal/EnhancedPortal.tsx`:

1. Update ContentItemData interface to include shareable:
```typescript
interface ContentItemData {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  addedOn?: string;
  lastUpdated?: string;
  tagOverride?: string;
  shareable?: boolean;  // NEW
}
```

2. Add state for modal in EnhancedPortal:
```typescript
const [shareModal, setShareModal] = useState<{
  isOpen: boolean;
  artifactSlug: string;
  artifactTitle: string;
} | null>(null);
```

3. Add Share button to ArtifactTile (only if shareable):
```typescript
{item.shareable && (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setShareModal({
        isOpen: true,
        artifactSlug: item.slug,
        artifactTitle: item.title,
      });
    }}
    className="..."
    data-testid={`share-button-${item.slug}`}
  >
    <ShareIcon /> Share
  </button>
)}
```

4. Add ShareLinkModal to EnhancedPortal:
```typescript
{shareModal && (
  <ShareLinkModal
    isOpen={shareModal.isOpen}
    onClose={() => setShareModal(null)}
    clientId={client.id}
    artifactSlug={shareModal.artifactSlug}
    artifactTitle={shareModal.artifactTitle}
  />
)}
```

**Implementation Steps:**
1. Update ContentItemData interface
2. Add share modal state
3. Add share button to ArtifactTile
4. Import and render ShareLinkModal
5. Pass shareable flag from page to component

**Acceptance Criteria:**
- [ ] Share button only appears on shareable artifacts
- [ ] Share button prevents link navigation on click
- [ ] Clicking Share opens ShareLinkModal
- [ ] Modal receives correct clientId and artifactSlug
- [ ] Closing modal resets state
- [ ] data-testid added for E2E testing

---

## Phase 5: Testing & Polish

### Task 5.1: Manual End-to-End Testing

**Description:** Manually test complete flow in development
**Size:** Medium
**Priority:** High
**Dependencies:** All previous tasks
**Can run parallel with:** None

**Test Scenarios:**

1. **Happy Path - Create and Use Share Link:**
   - Login to Tradeblock portal
   - Find artifact with Share button
   - Click Share, enter password "test123"
   - Verify success state shows URL
   - Copy URL, open in incognito
   - Enter password, verify artifact loads
   - Close incognito, reopen URL
   - Verify session persists (no password needed)

2. **Security - Lockout:**
   - Get share link URL
   - Open in incognito
   - Enter wrong password 5 times
   - Verify locked message with countdown
   - Wait 15 minutes (or manually clear lockedUntil in DB)
   - Verify can try again

3. **Security - Invalid Slug:**
   - Visit /share/invalid-slug-12345
   - Verify "Link Not Found" message
   - Try password submission
   - Verify same error as wrong password

4. **Edge Cases:**
   - Non-shareable artifact has no Share button
   - Already-shared artifact returns 409
   - Session expires after 24 hours

**Acceptance Criteria:**
- [ ] Complete happy path works
- [ ] Lockout mechanism works
- [ ] Invalid slugs handled gracefully
- [ ] All edge cases verified
- [ ] No console errors in browser

---

### Task 5.2: Build Verification

**Description:** Verify build succeeds and no TypeScript errors
**Size:** Small
**Priority:** High
**Dependencies:** All previous tasks
**Can run parallel with:** Task 5.1

**Implementation Steps:**
```bash
npm run build
```

**Acceptance Criteria:**
- [ ] TypeScript compilation succeeds
- [ ] Next.js build completes
- [ ] No warnings about missing types
- [ ] All pages statically analyzed correctly

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Infrastructure | 5 tasks | High |
| Phase 2: API Routes | 2 tasks | High |
| Phase 3: Share Page | 3 tasks | High |
| Phase 4: Portal Integration | 2 tasks | High |
| Phase 5: Testing | 2 tasks | High |

**Parallel Execution Opportunities:**
- Tasks 1.1, 1.2, 1.3, 1.4 can run in parallel
- Task 1.5 depends on 1.1 but can run with 1.2-1.4
- Tasks 2.1 and 2.2 can run in parallel after Phase 1
- Tasks 3.1, 3.2, 3.3 can run in parallel after Phase 2
- Tasks 4.1 and 4.2 can run in parallel

**Critical Path:**
1.1 → 1.5 → 2.1/2.2 → 3.1/3.2 → 4.2 → 5.1

**Total Tasks:** 12
