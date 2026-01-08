# Specification: User Table Architecture

## Overview

**Goal:** Add a proper `User` table to serve as the canonical user record across all 33 Strategies experiences (Persona Sharpener, Clarity Canvas, client portals), while maintaining JWT-based authentication for simplicity.

**Problem Statement:**
- Currently, no persistent user record exists - users only exist as JWT sessions
- `ClarityProfile` is doing double-duty as both user record and canvas data
- Creating a profile requires seeding ~100 database rows (sections/subsections/fields)
- Cannot track user types (team member, client, potential client)
- Client portal auth is completely separate from NextAuth

**Solution:** Introduce a lightweight `User` table that:
1. Gets created/synced on first authenticated API request (lazy creation)
2. Stores user metadata and type classification
3. Serves as the foreign key target for all user-owned data
4. Enables future client portal unification

**Non-Goals (explicitly out of scope):**
- Migrating client portal auth to NextAuth (future phase)
- User preferences or settings
- Activity/audit logging
- Real-time activity tracking

---

## Success Criteria

- [ ] Users can access Persona Sharpener without a full ClarityProfile being created
- [ ] User record is created automatically on first authenticated request
- [ ] User type is correctly classified based on email domain
- [ ] Existing ClarityProfile data continues to work during transition
- [ ] No changes required to NextAuth configuration (stays JWT-based)

---

## Database Schema Changes

### New Models

```prisma
// ============================================================================
// USER MANAGEMENT
// ============================================================================

model User {
  id             String    @id @default(cuid())

  // Auth linkage - the ID from NextAuth JWT (email for credentials, OAuth ID for Google)
  authId         String    @unique

  // Profile info - sourced from NextAuth session (authoritative)
  email          String    @unique
  name           String?
  image          String?

  // Classification
  userType       UserType  @default(TEAM_MEMBER)

  // Client portal linkage (nullable - only set for client users, future use)
  clientPortalId String?   // e.g., "tradeblock", "plya", "wsbc"

  // Timestamps
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  clarityProfile ClarityProfile?
}

enum UserType {
  TEAM_MEMBER       // @33strategies.ai email
  CLIENT            // Linked to active client portal
  POTENTIAL_CLIENT  // External user granted access via allowlist
}
```

### Modified Models

```prisma
model ClarityProfile {
  id        String   @id @default(cuid())

  // TRANSITION: Keep existing userId (authId) during migration
  // NEW: Add userRecordId to link to User table
  userId         String   @unique  // Legacy: stores authId directly
  userRecordId   String?  @unique  // New: references User.id
  user           User?    @relation(fields: [userRecordId], references: [id], onDelete: Cascade)

  name      String

  // NEW: Track whether full canvas structure has been seeded
  isCanvasInitialized Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sections   ProfileSection[]
  personas   Persona[]
  brainDumps PersonaBrainDump[]

  @@index([userId])
  @@index([userRecordId])
}
```

---

## Implementation Details

### 1. User Sync Utility

Create a utility function that ensures a User record exists for the authenticated session.

**File:** `lib/user-sync.ts`

```typescript
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

export type UserType = 'TEAM_MEMBER' | 'CLIENT' | 'POTENTIAL_CLIENT';

function determineUserType(email: string): UserType {
  if (email.endsWith('@33strategies.ai')) {
    return 'TEAM_MEMBER';
  }
  // Future: Check if email is linked to a client portal
  return 'POTENTIAL_CLIENT';
}

/**
 * Ensures a User record exists for the authenticated session.
 * Creates one if it doesn't exist.
 * Also links any orphaned ClarityProfile to the user.
 *
 * Call this at the start of any API route that needs user context.
 */
export async function ensureUser(session: Session) {
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error('Invalid session: missing user ID or email');
  }

  const authId = session.user.id;
  const email = session.user.email.toLowerCase();
  const name = session.user.name || email.split('@')[0];

  // Upsert user - email from session is authoritative
  const user = await prisma.user.upsert({
    where: { authId },
    create: {
      authId,
      email,
      name,
      image: session.user.image,
      userType: determineUserType(email),
    },
    update: {
      // Update name/image in case they changed (OAuth profile updates)
      name,
      image: session.user.image,
    },
  });

  // Link orphaned ClarityProfile if exists (lazy migration)
  const orphanedProfile = await prisma.clarityProfile.findFirst({
    where: {
      userId: authId,        // Legacy column (stores authId)
      userRecordId: null,    // Not yet linked to User table
    },
  });

  if (orphanedProfile) {
    await prisma.clarityProfile.update({
      where: { id: orphanedProfile.id },
      data: { userRecordId: user.id },
    });
  }

  return user;
}

/**
 * Get user with their clarity profile.
 */
export async function getUserWithProfile(authId: string) {
  return prisma.user.findUnique({
    where: { authId },
    include: {
      clarityProfile: true,
    },
  });
}
```

### 2. Edge Case: Same Email, Different Auth Methods

**Scenario:** User signs in with credentials (`authId = "user@company.com"`) and later with Google OAuth (`authId = "google-123456"`, same email).

**Solution:** Upsert by email as fallback when authId doesn't match:

```typescript
export async function ensureUser(session: Session) {
  const authId = session.user.id;
  const email = session.user.email.toLowerCase();
  const name = session.user.name || email.split('@')[0];

  // First, try to find by authId
  let user = await prisma.user.findUnique({ where: { authId } });

  if (!user) {
    // Check if user exists with same email but different authId
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    if (existingByEmail) {
      // Same person, different auth method - update authId
      user = await prisma.user.update({
        where: { email },
        data: {
          authId,  // Update to new auth method
          name,
          image: session.user.image,
        },
      });
    } else {
      // Brand new user
      user = await prisma.user.create({
        data: {
          authId,
          email,
          name,
          image: session.user.image,
          userType: determineUserType(email),
        },
      });
    }
  } else {
    // User exists, just update profile info
    user = await prisma.user.update({
      where: { authId },
      data: { name, image: session.user.image },
    });
  }

  // Link orphaned ClarityProfile (lazy migration)
  await linkOrphanedProfile(user.id, authId);

  return user;
}

async function linkOrphanedProfile(userId: string, authId: string) {
  const orphanedProfile = await prisma.clarityProfile.findFirst({
    where: {
      userId: authId,
      userRecordId: null,
    },
  });

  if (orphanedProfile) {
    await prisma.clarityProfile.update({
      where: { id: orphanedProfile.id },
      data: { userRecordId: userId },
    });
  }
}
```

### 3. Lazy Profile Initialization

**File:** `lib/clarity-canvas/seed-profile.ts` (modified)

```typescript
/**
 * Create a minimal ClarityProfile for a user (no sections seeded).
 * Used by Persona Sharpener and other modules that don't need full canvas.
 */
export async function createMinimalProfile(user: { id: string; authId: string; name: string | null }) {
  return prisma.clarityProfile.create({
    data: {
      userId: user.authId,       // Legacy field (for backward compat during transition)
      userRecordId: user.id,     // New field (links to User table)
      name: user.name || 'User',
      isCanvasInitialized: false,
    },
  });
}

/**
 * Initialize the full canvas structure for a profile.
 * Idempotent - safe to call multiple times.
 */
export async function initializeCanvasStructure(profileId: string) {
  const profile = await prisma.clarityProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile || profile.isCanvasInitialized) {
    return profile;
  }

  // Create all sections/subsections/fields in a transaction
  await prisma.$transaction(async (tx) => {
    for (const [sectionKey, section] of Object.entries(PROFILE_STRUCTURE)) {
      const createdSection = await tx.profileSection.create({
        data: {
          profileId,
          key: sectionKey,
          name: section.name,
          icon: section.icon,
          order: section.order,
        },
      });

      for (const [subsectionKey, subsection] of Object.entries(section.subsections)) {
        const createdSubsection = await tx.profileSubsection.create({
          data: {
            sectionId: createdSection.id,
            key: subsectionKey,
            name: subsection.name,
            order: subsection.order,
          },
        });

        for (const fieldKey of subsection.fields) {
          await tx.profileField.create({
            data: {
              subsectionId: createdSubsection.id,
              key: fieldKey,
              name: FIELD_DISPLAY_NAMES[fieldKey] || formatFieldKey(fieldKey),
            },
          });
        }
      }
    }

    await tx.clarityProfile.update({
      where: { id: profileId },
      data: { isCanvasInitialized: true },
    });
  });

  return prisma.clarityProfile.findUnique({
    where: { id: profileId },
    include: { sections: { include: { subsections: { include: { fields: true } } } } },
  });
}
```

### 4. Persona Sharpener Flow (Updated)

```typescript
// In personas API route
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user record exists (creates if needed, links orphaned profiles)
  const user = await ensureUser(session);

  // Get or create minimal profile for this user
  let profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [
        { userRecordId: user.id },      // New way
        { userId: session.user.id },     // Legacy way (during transition)
      ],
    },
    include: {
      personas: { include: { sessions: true, responses: true } },
      brainDumps: { include: { personas: { include: { sessions: true } } } },
    },
  });

  if (!profile) {
    profile = await createMinimalProfile(user);
  }

  // Persona Sharpener doesn't need canvas sections
  // It just needs the profile as a parent for personas/brainDumps
  // ... rest of handler
}
```

---

## Migration Plan

### Phase 1: Add Schema (Non-breaking) - Deploy Immediately

**Prisma migration:**

```prisma
// Add to schema.prisma

model User {
  id             String    @id @default(cuid())
  authId         String    @unique
  email          String    @unique
  name           String?
  image          String?
  userType       UserType  @default(TEAM_MEMBER)
  clientPortalId String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  clarityProfile ClarityProfile?
}

enum UserType {
  TEAM_MEMBER
  CLIENT
  POTENTIAL_CLIENT
}

// Modify ClarityProfile
model ClarityProfile {
  // ... existing fields ...
  userRecordId        String?  @unique
  user                User?    @relation(fields: [userRecordId], references: [id], onDelete: Cascade)
  isCanvasInitialized Boolean  @default(true)  // true for existing profiles

  @@index([userRecordId])
}
```

**Run:** `npx prisma migrate dev --name add-user-table`

### Phase 2: Deploy Application Code

1. Add `lib/user-sync.ts` with `ensureUser()` function
2. Update persona sharpener routes to use `ensureUser()`
3. Update `seed-profile.ts` with `createMinimalProfile()` and `initializeCanvasStructure()`
4. Deploy to production

### Phase 3: Monitor & Validate (1-2 weeks)

**Monitoring queries:**

```sql
-- Count users created
SELECT COUNT(*) FROM "User";

-- Count profiles linked to users
SELECT COUNT(*) FROM "ClarityProfile" WHERE "userRecordId" IS NOT NULL;

-- Count orphaned profiles (should decrease over time)
SELECT COUNT(*) FROM "ClarityProfile" WHERE "userRecordId" IS NULL;
```

### Phase 4: Finalize Migration (After validation)

Once all active users have been migrated (orphaned count is stable/zero):

```sql
-- Make userRecordId required (only if all profiles are linked)
-- First verify: SELECT COUNT(*) FROM "ClarityProfile" WHERE "userRecordId" IS NULL;
-- Should be 0

ALTER TABLE "ClarityProfile" ALTER COLUMN "userRecordId" SET NOT NULL;

-- Optionally drop legacy userId column (only after code no longer references it)
-- ALTER TABLE "ClarityProfile" DROP COLUMN "userId";
```

---

## API Route Changes

### Routes to Update with `ensureUser()`:

| Route | Change |
|-------|--------|
| `GET /api/clarity-canvas/profile` | Add `ensureUser()`, use `user.id` for queries |
| `POST /api/clarity-canvas/profile` | Add `ensureUser()`, create minimal profile |
| `GET /api/clarity-canvas/modules/persona-sharpener/personas` | Add `ensureUser()`, create minimal profile if needed |
| `POST /api/clarity-canvas/modules/persona-sharpener/brain-dump` | Add `ensureUser()` |
| `POST /api/clarity-canvas/modules/persona-sharpener/sessions` | Add `ensureUser()` |

---

## Testing Checklist

### Unit Tests
- [ ] `ensureUser()` creates new user on first call
- [ ] `ensureUser()` handles same email with different authId (OAuth vs credentials)
- [ ] `ensureUser()` links orphaned ClarityProfile
- [ ] `determineUserType()` correctly classifies @33strategies.ai as TEAM_MEMBER
- [ ] `createMinimalProfile()` creates profile without sections
- [ ] `initializeCanvasStructure()` is idempotent

### Integration Tests
- [ ] New user can access Persona Sharpener without error
- [ ] User record is created on first API request
- [ ] Persona Sharpener works without full canvas initialization
- [ ] Existing users with profiles continue to work (legacy userId lookup)
- [ ] Profile gets linked to User on next login

### E2E Tests
- [ ] Login with @33strategies.ai email -> userType = TEAM_MEMBER
- [ ] Complete Persona Sharpener flow without touching Clarity Canvas
- [ ] All existing persona/brain dump data remains accessible

---

## Rollback Plan

If issues are discovered after deployment:

1. **Phase 1 rollback:** User table can be ignored (no code depends on it yet)
2. **Phase 2 rollback:** Revert to looking up by `session.user.id` directly (legacy behavior)
3. **userRecordId stays nullable** until Phase 4, so no data integrity issues

---

## Future Considerations (Out of Scope)

These are documented for context but NOT part of this implementation:

- **Client Portal Unification:** Link client portal auth to User table
- **User Preferences:** Add preferences JSON field
- **Activity Tracking:** Add UserActivity model for audit trail

---

## Dependencies

- Prisma ORM (existing)
- NextAuth v5 (existing, no changes needed)
- Supabase PostgreSQL (existing)

## Estimated Effort

| Task | Estimate |
|------|----------|
| Schema migration (Phase 1) | 1 hour |
| `ensureUser()` utility with edge cases | 2 hours |
| Update API routes | 2 hours |
| Update seed-profile.ts | 1 hour |
| Testing | 2 hours |
| **Total** | **~8 hours** |
