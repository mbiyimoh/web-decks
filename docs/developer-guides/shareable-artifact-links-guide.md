# Shareable Artifact Links Developer Guide

**Last Updated:** January 2026
**Status:** Production
**Related Docs:** `specs/feat-shareable-artifact-links.md`, CLAUDE.md

---

## Overview

The shareable artifact links system enables portal clients to generate password-protected URLs for specific artifacts (decks, proposals, documents). Recipients can view the content without portal credentials by entering the client-set password.

### Why This Exists

Clients needed a way to share specific artifacts with external parties (investors, advisors) without:
- Sharing full portal credentials (security risk)
- Requesting separate deployments from 33 Strategies (operational overhead)

### Key Characteristics

- **Client-controlled**: Clients set their own passwords via modal in portal
- **Time-limited**: 24-hour session after successful authentication
- **Artifact-specific**: One link per artifact, isolated sessions
- **Brute-force protected**: 5 attempts, 15-minute lockout per link
- **Timing-attack resistant**: Artificial delays prevent slug enumeration

---

## Architecture

### Data Flow

```
┌─────────────┐
│   Portal    │ Client clicks share button
│  (Client)   │───────────────────┐
└─────────────┘                   │
                                  ▼
                    ┌─────────────────────────────┐
                    │ POST /api/share/create      │
                    │ - Requires portal auth      │
                    │ - Creates ArtifactShareLink │
                    │ - Returns public URL        │
                    └─────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │ Database                    │
                    │ - slug (nanoid, 21 chars)   │
                    │ - hashedPassword (bcrypt)   │
                    │ - failedAttempts tracking   │
                    └─────────────────────────────┘
                                  │
                                  ▼
┌─────────────┐    ┌─────────────────────────────┐
│ Recipient   │───▶│ /share/[slug]               │
│ (External)  │    │ - Shows password gate       │
└─────────────┘    └─────────────────────────────┘
       │                          │
       │ Enters password          │
       ▼                          ▼
┌─────────────────────────────────────────────────┐
│ POST /api/share/[slug]/auth                     │
│ - Verifies password (bcrypt.compare)            │
│ - Tracks failed attempts → lockout at 5         │
│ - Sets iron-session cookie (scoped to /share/*) │
└─────────────────────────────────────────────────┘
       │
       │ Session valid
       ▼
┌─────────────┐
│ Artifact    │ Deck/proposal/document renders
│ (Rendered)  │
└─────────────┘
```

### Session Isolation Strategy

Each share link gets its own session cookie:
- **Cookie name**: `share-{slug}` (full 21-char slug for uniqueness)
- **Cookie path**: `/share/{slug}` (prevents cross-link session leakage)
- **Max age**: 24 hours (86400 seconds)
- **Storage**: iron-session encrypted cookie (no database session table)

This allows multiple share links to be accessed simultaneously without conflicts.

---

## Key Files Reference

| File | Purpose | Notes |
|------|---------|-------|
| **Database** | | |
| `prisma/schema.prisma` | ArtifactShareLink model | Stores slug, hashed password, lockout tracking |
| **Utilities** | | |
| `lib/share/utils.ts` | Core helpers | Slug generation, password hashing/verification |
| `lib/session.ts` | Session types & helpers | ShareLinkSessionData, isShareSessionValid() |
| **API Routes** | | |
| `app/api/share/create/route.ts` | Create share link | Requires portal auth, checks `shareable: true` |
| `app/api/share/[slug]/auth/route.ts` | Password verification | Implements lockout, timing attack mitigation |
| **Frontend** | | |
| `app/share/[slug]/page.tsx` | Share page (SSR) | Shows password gate or artifact based on session |
| `components/share/SharePasswordGate.tsx` | Password entry UI | Client component with show/hide, error states |
| `app/share/[slug]/opengraph-image.tsx` | OG image | Uses nodejs runtime (Prisma incompatible with edge) |
| **Portal Integration** | | |
| `components/portal/ShareLinkModal.tsx` | Create link modal | Password input, copy buttons, success state |
| `components/portal/EnhancedPortal.tsx` | Portal with share button | Shows share icon only if `shareable: true` |
| `lib/clients.ts` | ContentItem interface | Defines `shareable?: boolean` flag |

---

## How to Mark an Artifact as Shareable

1. **Open** `lib/clients.ts`
2. **Find** the artifact in the client's `content` array
3. **Add** `shareable: true` flag:

```typescript
// Example: Tradeblock's jan-2026-projections
{
  slug: 'jan-2026-projections',
  type: 'deck',
  title: 'The 120-Day Sprint',
  description: 'Investor update - January 2025',
  addedOn: '2025-01-23',
  component: TradeblockJan2026Projections,
  shareable: true,  // ← Add this line
},
```

4. **Restart** dev server to see share button appear

**Important**: The share button will only appear in the portal after this flag is set. No database changes are needed.

---

## Creating a Share Link (User Flow)

### Portal Side (Client)

1. Client logs into portal at `/client-portals/{client}`
2. Sees artifact tile with share icon (only if `shareable: true`)
3. Clicks share button → `ShareLinkModal` opens
4. Enters password (min 6 characters)
5. Clicks "Create Share Link"
6. Modal calls `POST /api/share/create` with:
   ```json
   {
     "clientId": "tradeblock",
     "artifactSlug": "jan-2026-projections",
     "password": "investor2026"
   }
   ```
7. Success state shows:
   - Share URL: `https://33strategies.ai/share/V1StGXR8_Z5jdHi6B-myT`
   - Password: `investor2026` (for separate sharing)
   - Copy buttons for both
   - Security tip: share link and password via separate channels

### Recipient Side (External)

1. Receives link: `https://33strategies.ai/share/V1StGXR8_Z5jdHi6B-myT`
2. Visits link → sees `SharePasswordGate` component
3. Enters password
4. On submit → `POST /api/share/{slug}/auth`
5. If correct:
   - Session cookie set (24-hour expiry)
   - Page refreshes via `router.refresh()`
   - Artifact component renders
6. If incorrect:
   - Error message shown
   - Attempts remaining displayed (if < 5)
   - Lockout message if 5 failed attempts

---

## Security Model

### Password Hashing

Uses bcrypt with work factor 10 (~100ms hashing time):

```typescript
// lib/share/utils.ts
import bcrypt from 'bcrypt';

const BCRYPT_WORK_FACTOR = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_WORK_FACTOR);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash); // Constant-time comparison
}
```

**Why bcrypt?**
- Automatic salt generation (no need to store separately)
- Constant-time comparison (prevents timing attacks)
- Adjustable work factor (can increase as hardware improves)

### Brute Force Protection

Implemented at the database level per link:

```typescript
// app/api/share/[slug]/auth/route.ts
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// On failed password:
await prisma.artifactShareLink.update({
  where: { slug },
  data: {
    failedAttempts: { increment: 1 },
    lockedUntil: failedAttempts + 1 >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      : null,
  },
});

// On success:
await prisma.artifactShareLink.update({
  where: { slug },
  data: {
    failedAttempts: 0,  // Reset counter
    lockedUntil: null,
    accessCount: { increment: 1 },
    lastAccessedAt: new Date(),
  },
});
```

**Lockout behavior:**
- 5 failed attempts → 15-minute lockout
- During lockout: returns 429 with lockout message
- After successful login: counter resets

### Timing Attack Mitigation

Prevents slug enumeration via response timing:

```typescript
// app/api/share/[slug]/auth/route.ts
if (!link) {
  // Add artificial delay to match bcrypt timing (~100-150ms)
  await new Promise((resolve) => setTimeout(resolve, 150));
  return NextResponse.json(
    { error: 'Invalid password' },  // Same message as wrong password
    { status: 401 }
  );
}
```

**Why this matters:**
- Without delay: attacker can distinguish valid slugs (bcrypt delay) from invalid (instant)
- With delay: both responses take ~150ms → can't enumerate valid slugs

### Session Security

iron-session provides:
- **Encrypted cookies**: Session data encrypted with `SESSION_SECRET`
- **HttpOnly**: Prevents JavaScript access (XSS protection)
- **SameSite: Lax**: CSRF protection
- **Path scoping**: `/share/{slug}` prevents cross-link access
- **24-hour expiry**: `maxAge: 86400` seconds

---

## Configuration

### Environment Variables

```bash
# Required (already in use for portal auth)
SESSION_SECRET=<32+ character random string>

# Optional (defaults to production URL)
NEXT_PUBLIC_APP_URL=https://33strategies.ai
```

**Note**: Share links use the same `SESSION_SECRET` as portal authentication. Each share link gets a separate cookie (by slug) to isolate sessions.

### Password Requirements

Centralized in `lib/session.ts`:

```typescript
export const SHARE_PASSWORD_MIN_LENGTH = 6;
```

**Where used:**
- `lib/share/utils.ts` → `validatePassword()` (backend validation)
- `components/portal/ShareLinkModal.tsx` → form validation & label
- `app/api/share/create/route.ts` → API validation

**To change minimum:** Update the constant in one place, all locations inherit.

---

## Testing Strategy

### Manual Testing Flow

1. **Mark artifact as shareable**
   ```bash
   # Edit lib/clients.ts
   # Add shareable: true to an artifact
   npm run dev
   ```

2. **Portal login**
   ```
   Visit: http://localhost:3033/client-portals/tradeblock
   Login with: TRADEBLOCK_EMAIL + TRADEBLOCK_PASSWORD
   ```

3. **Create share link**
   - Click share button on shareable artifact
   - Enter password: `testpass123`
   - Copy link from success modal

4. **Test password gate** (open incognito window)
   - Paste share link
   - Verify password gate shows
   - Enter wrong password → see error
   - Enter 5 wrong passwords → see lockout
   - Wait 15 minutes OR reset database → try correct password

5. **Test session**
   - After successful auth, verify artifact loads
   - Refresh page → should stay authenticated
   - Clear cookies → should show password gate again

### API Testing with curl

```bash
# 1. Create share link (requires portal auth cookie)
curl -X POST http://localhost:3033/api/share/create \
  -H "Content-Type: application/json" \
  -H "Cookie: portal-session=..." \
  -d '{
    "clientId": "tradeblock",
    "artifactSlug": "jan-2026-projections",
    "password": "test123456"
  }'

# Response:
# {
#   "success": true,
#   "slug": "V1StGXR8_Z5jdHi6B-myT",
#   "url": "http://localhost:3033/share/V1StGXR8_Z5jdHi6B-myT"
# }

# 2. Test password auth (no prior auth required)
curl -X POST http://localhost:3033/api/share/V1StGXR8_Z5jdHi6B-myT/auth \
  -H "Content-Type: application/json" \
  -d '{"password": "test123456"}' \
  -c cookies.txt  # Save session cookie

# Success: { "success": true }
# Failure: { "error": "Invalid password", "attemptsRemaining": 4 }

# 3. Test lockout
# Run step 2 with wrong password 5 times:
for i in {1..5}; do
  curl -X POST http://localhost:3033/api/share/V1StGXR8_Z5jdHi6B-myT/auth \
    -H "Content-Type: application/json" \
    -d '{"password": "wrong"}'
done

# 6th attempt should return:
# { "error": "Too many failed attempts. Try again in 15 minutes." }
```

### Database Queries for Debugging

```bash
# View all share links
npx prisma studio
# Navigate to: ArtifactShareLink table

# Or via psql/SQL:
SELECT slug, clientId, artifactSlug, failedAttempts, lockedUntil, accessCount
FROM "ArtifactShareLink"
ORDER BY createdAt DESC;

# Reset lockout for testing
UPDATE "ArtifactShareLink"
SET failedAttempts = 0, lockedUntil = NULL
WHERE slug = 'V1StGXR8_Z5jdHi6B-myT';

# Delete share link
DELETE FROM "ArtifactShareLink"
WHERE slug = 'V1StGXR8_Z5jdHi6B-myT';
```

---

## Common Issues & Solutions

### Issue: Share button doesn't appear

**Cause**: Artifact not marked as shareable.

**Solution**:
1. Open `lib/clients.ts`
2. Find the artifact in the client's `content` array
3. Add `shareable: true`
4. Restart dev server

---

### Issue: "Share link already exists" error

**Cause**: Database has unique constraint `[clientId, artifactSlug]`. Only one link per artifact.

**Solution**:
```bash
# Delete existing link
npx prisma studio
# Navigate to ArtifactShareLink → find record → delete

# Or via SQL:
DELETE FROM "ArtifactShareLink"
WHERE clientId = 'tradeblock' AND artifactSlug = 'jan-2026-projections';
```

---

### Issue: Lockout won't reset

**Cause**: `lockedUntil` timestamp is in the future.

**Solution**:
```sql
-- Check lockout status
SELECT slug, failedAttempts, lockedUntil
FROM "ArtifactShareLink"
WHERE slug = 'your-slug';

-- Manually reset
UPDATE "ArtifactShareLink"
SET failedAttempts = 0, lockedUntil = NULL
WHERE slug = 'your-slug';
```

---

### Issue: Session expires immediately

**Cause**: `authenticatedAt` timestamp check failing (likely clock skew).

**Debug**:
```typescript
// Add to app/share/[slug]/page.tsx temporarily
console.log({
  authenticatedAt: session.authenticatedAt,
  now: Date.now(),
  ageSeconds: (Date.now() - session.authenticatedAt) / 1000,
  maxAge: SHARE_SESSION_MAX_AGE_SECONDS
});
```

**Fix**: Use server-side rendering (already implemented) to avoid client clock issues.

---

### Issue: OG image not generating

**Cause**: OG image route uses Prisma, which requires nodejs runtime (not edge).

**Verify**:
```typescript
// app/share/[slug]/opengraph-image.tsx
export const runtime = 'nodejs';  // ← Must be present
```

**Test**:
```
Visit: http://localhost:3033/share/some-slug/opengraph-image
Should return PNG (not error)
```

---

### Issue: Design tokens not matching portal

**Cause**: Hardcoded colors instead of importing from design-tokens.ts.

**Fix**:
```typescript
// components/share/SharePasswordGate.tsx
// BAD:
const GOLD = '#d4a54a';

// GOOD:
import { GOLD, BG_PRIMARY, BG_SURFACE } from '@/components/portal/design-tokens';
```

---

## Code Patterns

### Pattern: Centralized Constants

All share link configuration lives in `lib/session.ts`:

```typescript
// lib/session.ts
export const SHARE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;  // 24 hours
export const SHARE_PASSWORD_MIN_LENGTH = 6;

export function getShareLinkSessionOptions(slug: string): SessionOptions {
  return {
    password: process.env.SESSION_SECRET,
    cookieName: `share-${slug}`,  // Full slug (no truncation)
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SHARE_SESSION_MAX_AGE_SECONDS,
      path: `/share/${slug}`,  // Scoped to this share link only
    },
  };
}
```

**Rationale**: Single source of truth for session configuration. Changing max age or password requirements updates everywhere.

---

### Pattern: Session Validation Helper

Extract session validation logic to reusable function:

```typescript
// lib/session.ts
export function isShareSessionValid(
  session: ShareLinkSessionData,
  expectedSlug: string
): boolean {
  if (!session.isAuthenticated || session.shareSlug !== expectedSlug) {
    return false;
  }

  if (!session.authenticatedAt) {
    return false;
  }

  const ageSeconds = (Date.now() - session.authenticatedAt) / 1000;
  return ageSeconds < SHARE_SESSION_MAX_AGE_SECONDS;
}

// app/share/[slug]/page.tsx
const isAuthenticated = isShareSessionValid(session, slug);
```

**Rationale**: Consistent validation logic, testable, no magic numbers.

---

### Pattern: Design Token Imports

Always import design tokens (never hardcode colors):

```typescript
// components/portal/ShareLinkModal.tsx
import { GOLD, BG_PRIMARY, BG_SURFACE } from './design-tokens';

// Use throughout component
style={{ background: BG_SURFACE, border: `1px solid ${GOLD}` }}
```

**Rationale**: Single source of truth for brand colors. If design system changes, all components update.

---

## Future Enhancements

### Link Management Dashboard

Currently, links can only be deleted via database. Consider adding:

```
/client-portals/{client}/share-links
└── Table of share links
    ├── Artifact name
    ├── Created date
    ├── Access count
    ├── Last accessed
    └── [Delete] button
```

**Implementation notes:**
- New API route: `GET /api/share/list?clientId={client}`
- Portal page: `app/client-portals/[client]/share-links/page.tsx`
- Requires portal authentication
- Delete endpoint: `DELETE /api/share/[slug]`

---

### IP-Based Rate Limiting

Current lockout is per-link. Attacker can try 5 passwords on 1000 different links. Consider:

```typescript
// New model in schema.prisma
model ShareLinkAttempt {
  id         String   @id @default(cuid())
  ipAddress  String   // Hashed IP for privacy
  slug       String
  attemptAt  DateTime @default(now())

  @@index([ipAddress, attemptAt])
}

// In auth route
const hashedIP = createHash('sha256').update(req.ip || 'unknown').digest('hex');
const recentAttempts = await prisma.shareLinkAttempt.count({
  where: {
    ipAddress: hashedIP,
    attemptAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
  }
});

if (recentAttempts > 20) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

### Password Strength Indicator

Current minimum is 6 characters. Consider adding visual feedback:

```typescript
function getPasswordStrength(pw: string): 'weak' | 'medium' | 'strong' {
  if (pw.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3 && pw.length >= 10) return 'strong';
  if (score >= 2 && pw.length >= 8) return 'medium';
  return 'weak';
}
```

Display as colored bars below password input in `ShareLinkModal`.

---

### Multiple Links per Artifact

Current design: 1 link per artifact. To support multiple:

1. Remove unique constraint on `[clientId, artifactSlug]`
2. Add link name/label field
3. Update portal to show list of links per artifact
4. Add expiration date field (optional)

**Migration**:
```sql
-- Remove unique constraint
ALTER TABLE "ArtifactShareLink" DROP CONSTRAINT "ArtifactShareLink_clientId_artifactSlug_key";

-- Add optional fields
ALTER TABLE "ArtifactShareLink" ADD COLUMN "label" TEXT;
ALTER TABLE "ArtifactShareLink" ADD COLUMN "expiresAt" TIMESTAMP;
```

---

## Troubleshooting Checklist

When share links aren't working, check:

- [ ] Artifact has `shareable: true` in `lib/clients.ts`
- [ ] `SESSION_SECRET` environment variable is set
- [ ] Database has `ArtifactShareLink` table (run `npx prisma db push` if missing)
- [ ] Link is not locked out (check `lockedUntil` in database)
- [ ] Password meets minimum length (`SHARE_PASSWORD_MIN_LENGTH`)
- [ ] Session cookie is being set (check browser DevTools → Application → Cookies)
- [ ] Cookie path is scoped to `/share/{slug}` (not `/`)
- [ ] OG image route has `runtime = 'nodejs'` (not edge)

---

## Related Documentation

- **Specification**: `specs/feat-shareable-artifact-links.md` — Full technical spec
- **Ideation**: `docs/ideation/shareable-artifact-links.md` — Original ideation doc
- **CLAUDE.md**: Project-wide reference (concise patterns section)
- **Design System**: `.claude/skills/33-strategies-frontend-design.md` — Brand guidelines

---

**Questions or issues?** Check the spec file or search for `share` in CLAUDE.md for quick reference patterns.
