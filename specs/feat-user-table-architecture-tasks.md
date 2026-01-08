# Task Breakdown: User Table Architecture

Generated: 2026-01-07
Source: specs/feat-user-table-architecture.md

## Overview

Add a proper `User` table to serve as the canonical user record across all 33 Strategies experiences, with lazy migration from existing ClarityProfile data. This enables the Persona Sharpener to work without requiring full Clarity Canvas initialization.

## Phase 1: Database Schema

### Task 1.1: Add User Model and UserType Enum to Prisma Schema

**Description**: Add the new User model and UserType enum to the Prisma schema
**Size**: Small
**Priority**: High (blocks all other tasks)
**Dependencies**: None
**Can run parallel with**: None

**Technical Requirements**:

Add to `prisma/schema.prisma`:

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

**Implementation Steps**:
1. Open `prisma/schema.prisma`
2. Add the User model after the datasource block
3. Add the UserType enum
4. Run `npx prisma format` to validate syntax

**Acceptance Criteria**:
- [ ] User model added with all fields (id, authId, email, name, image, userType, clientPortalId, timestamps)
- [ ] UserType enum added with TEAM_MEMBER, CLIENT, POTENTIAL_CLIENT
- [ ] Schema passes `npx prisma format` validation

---

### Task 1.2: Modify ClarityProfile Model for Transition

**Description**: Add userRecordId and isCanvasInitialized fields to ClarityProfile for lazy migration
**Size**: Small
**Priority**: High (blocks all other tasks)
**Dependencies**: Task 1.1
**Can run parallel with**: None

**Technical Requirements**:

Modify the existing ClarityProfile model in `prisma/schema.prisma`:

```prisma
model ClarityProfile {
  id        String   @id @default(cuid())

  // TRANSITION: Keep existing userId (authId) during migration
  userId    String   @unique  // Legacy: stores authId directly

  // NEW: Add userRecordId to link to User table
  userRecordId   String?  @unique
  user           User?    @relation(fields: [userRecordId], references: [id], onDelete: Cascade)

  name      String

  // NEW: Track whether full canvas structure has been seeded
  isCanvasInitialized Boolean @default(true)  // true for existing profiles

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sections   ProfileSection[]
  personas   Persona[]
  brainDumps PersonaBrainDump[]

  @@index([userId])
  @@index([userRecordId])
}
```

**Implementation Steps**:
1. Add `userRecordId String? @unique` field
2. Add `user User? @relation(...)` relation
3. Add `isCanvasInitialized Boolean @default(true)` field
4. Add `@@index([userRecordId])` index
5. Run `npx prisma format` to validate

**Key Notes**:
- `isCanvasInitialized` defaults to `true` so existing profiles are considered initialized
- `userRecordId` is nullable to allow gradual migration
- Keep existing `userId` field during transition period

**Acceptance Criteria**:
- [ ] userRecordId field added as nullable unique
- [ ] User relation added with onDelete: Cascade
- [ ] isCanvasInitialized field added with default true
- [ ] Index on userRecordId added
- [ ] Schema passes validation

---

### Task 1.3: Run Prisma Migration

**Description**: Generate and apply the database migration
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1, Task 1.2
**Can run parallel with**: None

**Technical Requirements**:

Run the migration:
```bash
npx prisma migrate dev --name add-user-table
npx prisma generate
```

**Implementation Steps**:
1. Ensure all schema changes from Tasks 1.1 and 1.2 are complete
2. Run `npx prisma migrate dev --name add-user-table`
3. Review the generated SQL migration
4. Run `npx prisma generate` to update the client
5. Verify migration applied successfully

**Acceptance Criteria**:
- [ ] Migration file generated in `prisma/migrations/`
- [ ] Migration applied to database without errors
- [ ] Prisma client regenerated
- [ ] User table exists in database
- [ ] ClarityProfile has new columns (userRecordId, isCanvasInitialized)

---

## Phase 2: Core Application Code

### Task 2.1: Create User Sync Utility

**Description**: Create lib/user-sync.ts with ensureUser() function that handles user creation and orphaned profile linking
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.3
**Can run parallel with**: Task 2.2

**Technical Requirements**:

Create `lib/user-sync.ts`:

```typescript
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

export type UserType = 'TEAM_MEMBER' | 'CLIENT' | 'POTENTIAL_CLIENT';

/**
 * Determine user type based on email domain
 */
function determineUserType(email: string): UserType {
  if (email.endsWith('@33strategies.ai')) {
    return 'TEAM_MEMBER';
  }
  // Future: Check if email is linked to a client portal
  return 'POTENTIAL_CLIENT';
}

/**
 * Link any orphaned ClarityProfile to the user
 */
async function linkOrphanedProfile(userId: string, authId: string): Promise<void> {
  const orphanedProfile = await prisma.clarityProfile.findFirst({
    where: {
      userId: authId,        // Legacy column (stores authId)
      userRecordId: null,    // Not yet linked to User table
    },
  });

  if (orphanedProfile) {
    await prisma.clarityProfile.update({
      where: { id: orphanedProfile.id },
      data: { userRecordId: userId },
    });
  }
}

/**
 * Ensures a User record exists for the authenticated session.
 * Creates one if it doesn't exist.
 * Handles same email with different auth methods (OAuth vs credentials).
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

  // First, try to find by authId
  let user = await prisma.user.findUnique({ where: { authId } });

  if (!user) {
    // Check if user exists with same email but different authId
    // This handles the case where user switches from credentials to OAuth or vice versa
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    if (existingByEmail) {
      // Same person, different auth method - update authId to new method
      user = await prisma.user.update({
        where: { email },
        data: {
          authId,
          name,
          image: session.user.image,
        },
      });
    } else {
      // Brand new user - create record
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
    // User exists by authId, just update profile info
    user = await prisma.user.update({
      where: { authId },
      data: { name, image: session.user.image },
    });
  }

  // Link orphaned ClarityProfile (lazy migration)
  await linkOrphanedProfile(user.id, authId);

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

**Implementation Steps**:
1. Create `lib/user-sync.ts`
2. Import prisma and Session type
3. Implement `determineUserType()` function
4. Implement `linkOrphanedProfile()` helper
5. Implement `ensureUser()` with OAuth/credentials edge case handling
6. Implement `getUserWithProfile()` helper
7. Export all public functions

**Acceptance Criteria**:
- [ ] File created at lib/user-sync.ts
- [ ] determineUserType() classifies @33strategies.ai as TEAM_MEMBER
- [ ] ensureUser() creates new user on first call
- [ ] ensureUser() handles same email with different authId
- [ ] ensureUser() links orphaned ClarityProfile
- [ ] TypeScript compiles without errors

---

### Task 2.2: Update seed-profile.ts with Lazy Initialization

**Description**: Add createMinimalProfile() and modify initializeCanvasStructure() for lazy canvas initialization
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.3
**Can run parallel with**: Task 2.1

**Technical Requirements**:

Modify `lib/clarity-canvas/seed-profile.ts`:

```typescript
import { prisma } from '@/lib/prisma';
import { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES } from './profile-structure';
import type { ProfileWithSections } from './types';

/**
 * Format a field key into a display name
 */
function formatFieldKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
export async function initializeCanvasStructure(profileId: string): Promise<ProfileWithSections | null> {
  const profile = await prisma.clarityProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    return null;
  }

  if (profile.isCanvasInitialized) {
    // Already initialized, just return the profile with sections
    return prisma.clarityProfile.findUnique({
      where: { id: profileId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
              include: {
                fields: {
                  include: { sources: true },
                },
              },
            },
          },
        },
      },
    }) as Promise<ProfileWithSections | null>;
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
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                include: { sources: true },
              },
            },
          },
        },
      },
    },
  }) as Promise<ProfileWithSections | null>;
}

// Keep existing seedProfileForUser for backward compatibility during transition
// It now creates a full profile (initialized)
export async function seedProfileForUser(
  userId: string,
  userName: string
): Promise<ProfileWithSections> {
  // Check if profile already exists
  const existing = await prisma.clarityProfile.findUnique({
    where: { userId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                include: { sources: true },
              },
            },
          },
        },
      },
    },
  });

  if (existing) {
    return existing as ProfileWithSections;
  }

  // Create profile then initialize canvas structure
  const profile = await prisma.clarityProfile.create({
    data: {
      userId,
      name: userName,
      isCanvasInitialized: false,
    },
  });

  const initialized = await initializeCanvasStructure(profile.id);
  return initialized as ProfileWithSections;
}
```

**Implementation Steps**:
1. Add `formatFieldKey()` helper function
2. Add `createMinimalProfile()` function
3. Refactor `initializeCanvasStructure()` to be idempotent
4. Update `seedProfileForUser()` to use new pattern
5. Export new functions

**Acceptance Criteria**:
- [ ] createMinimalProfile() creates profile without sections
- [ ] createMinimalProfile() sets isCanvasInitialized to false
- [ ] createMinimalProfile() populates both userId and userRecordId
- [ ] initializeCanvasStructure() is idempotent (safe to call multiple times)
- [ ] initializeCanvasStructure() creates all sections/subsections/fields
- [ ] seedProfileForUser() still works for backward compatibility
- [ ] TypeScript compiles without errors

---

## Phase 3: API Route Updates

### Task 3.1: Update Persona Sharpener Personas Route

**Description**: Update GET /api/clarity-canvas/modules/persona-sharpener/personas to use ensureUser() and create minimal profiles
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1, Task 2.2
**Can run parallel with**: Task 3.2, Task 3.3

**Technical Requirements**:

Update `app/api/clarity-canvas/modules/persona-sharpener/personas/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureUser } from '@/lib/user-sync';
import { createMinimalProfile } from '@/lib/clarity-canvas/seed-profile';
import type { BrainDumpProject } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

// GET - Fetch persona for current user's profile, including all brain dump projects
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists (creates if needed, links orphaned profiles)
    const user = await ensureUser(session);

    // Get profile - check both new and legacy ways during transition
    let profile = await prisma.clarityProfile.findFirst({
      where: {
        OR: [
          { userRecordId: user.id },      // New way
          { userId: session.user.id },     // Legacy way (during transition)
        ],
      },
      include: {
        personas: {
          include: {
            sessions: {
              orderBy: { startedAt: 'desc' },
            },
            responses: true,
          },
        },
        brainDumps: {
          orderBy: { createdAt: 'desc' },
          include: {
            personas: {
              include: {
                sessions: {
                  orderBy: { startedAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    // Create minimal profile if none exists (no canvas sections needed for sharpener)
    if (!profile) {
      const minimalProfile = await createMinimalProfile(user);
      profile = await prisma.clarityProfile.findUnique({
        where: { id: minimalProfile.id },
        include: {
          personas: {
            include: {
              sessions: { orderBy: { startedAt: 'desc' } },
              responses: true,
            },
          },
          brainDumps: {
            orderBy: { createdAt: 'desc' },
            include: {
              personas: {
                include: {
                  sessions: { orderBy: { startedAt: 'desc' } },
                },
              },
            },
          },
        },
      });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Rest of the existing logic for building response...
    // [Keep existing brainDumpProjects mapping logic]

    // ... existing code continues
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}

// POST handler remains similar but uses ensureUser()
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists
    const user = await ensureUser(session);

    // Get or create profile
    let profile = await prisma.clarityProfile.findFirst({
      where: {
        OR: [
          { userRecordId: user.id },
          { userId: session.user.id },
        ],
      },
    });

    if (!profile) {
      profile = await createMinimalProfile(user);
    }

    // Rest of existing POST logic...
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}
```

**Implementation Steps**:
1. Import ensureUser from lib/user-sync
2. Import createMinimalProfile from lib/clarity-canvas/seed-profile
3. Replace seedProfileForUser calls with ensureUser + createMinimalProfile
4. Update profile lookup to use OR clause for transition period
5. Test that existing functionality still works

**Acceptance Criteria**:
- [ ] Route imports ensureUser and createMinimalProfile
- [ ] ensureUser() called at start of both GET and POST handlers
- [ ] Profile lookup uses OR clause for userRecordId and userId
- [ ] Creates minimal profile (no sections) for new users
- [ ] Existing brainDumpProjects logic preserved
- [ ] Returns proper error responses
- [ ] TypeScript compiles without errors

---

### Task 3.2: Update Brain Dump Route

**Description**: Update POST /api/clarity-canvas/modules/persona-sharpener/brain-dump to use ensureUser()
**Size**: Small
**Priority**: High
**Dependencies**: Task 2.1, Task 2.2
**Can run parallel with**: Task 3.1, Task 3.3

**Technical Requirements**:

Update `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts`:

Add at the top:
```typescript
import { ensureUser } from '@/lib/user-sync';
import { createMinimalProfile } from '@/lib/clarity-canvas/seed-profile';
```

Update the POST handler:
```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists
    const user = await ensureUser(session);

    const body = await request.json();
    // ... existing validation

    // Get or create profile using new pattern
    let profile = await prisma.clarityProfile.findFirst({
      where: {
        OR: [
          { userRecordId: user.id },
          { userId: session.user.id },
        ],
      },
    });

    if (!profile) {
      profile = await createMinimalProfile(user);
    }

    // Rest of existing brain dump processing logic...
  } catch (error) {
    // ... existing error handling
  }
}
```

**Implementation Steps**:
1. Add imports for ensureUser and createMinimalProfile
2. Call ensureUser() after auth check
3. Update profile lookup to use OR clause
4. Replace seedProfileForUser with createMinimalProfile if no profile exists
5. Keep all existing brain dump processing logic

**Acceptance Criteria**:
- [ ] Imports added for ensureUser and createMinimalProfile
- [ ] ensureUser() called after auth check
- [ ] Profile lookup uses OR clause
- [ ] Creates minimal profile for new users
- [ ] Existing brain dump processing unchanged
- [ ] TypeScript compiles without errors

---

### Task 3.3: Update Sessions Route

**Description**: Update POST /api/clarity-canvas/modules/persona-sharpener/sessions to use ensureUser()
**Size**: Small
**Priority**: High
**Dependencies**: Task 2.1
**Can run parallel with**: Task 3.1, Task 3.2

**Technical Requirements**:

Update `app/api/clarity-canvas/modules/persona-sharpener/sessions/route.ts`:

```typescript
import { ensureUser } from '@/lib/user-sync';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists
    await ensureUser(session);

    // Rest of existing session creation logic...
  } catch (error) {
    // ... existing error handling
  }
}
```

**Implementation Steps**:
1. Add import for ensureUser
2. Call ensureUser() after auth check (don't need the return value here)
3. Keep all existing session creation logic

**Acceptance Criteria**:
- [ ] Import added for ensureUser
- [ ] ensureUser() called after auth check
- [ ] Existing session logic unchanged
- [ ] TypeScript compiles without errors

---

### Task 3.4: Update Profile API Route

**Description**: Update /api/clarity-canvas/profile to use ensureUser() and support minimal profiles
**Size**: Medium
**Priority**: Medium
**Dependencies**: Task 2.1, Task 2.2
**Can run parallel with**: Task 3.1, Task 3.2, Task 3.3

**Technical Requirements**:

Update `app/api/clarity-canvas/profile/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureUser } from '@/lib/user-sync';
import { createMinimalProfile, initializeCanvasStructure } from '@/lib/clarity-canvas/seed-profile';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import type { ProfileApiResponse, CreateProfileResponse, ProfileWithSections } from '@/lib/clarity-canvas/types';

/**
 * GET /api/clarity-canvas/profile
 * Retrieve the current user's Clarity Canvas profile with all nested data and scores
 */
export async function GET(): Promise<NextResponse<ProfileApiResponse | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists
    const user = await ensureUser(session);

    // Find profile using both new and legacy methods
    const profile = await prisma.clarityProfile.findFirst({
      where: {
        OR: [
          { userRecordId: user.id },
          { userId: session.user.id },
        ],
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
              include: {
                fields: {
                  include: { sources: true },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ profile: null, scores: null });
    }

    // Calculate scores
    const typedProfile = profile as ProfileWithSections;
    const scores = calculateAllScores(typedProfile.sections);

    return NextResponse.json({
      profile: typedProfile,
      scores,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * POST /api/clarity-canvas/profile
 * Create a new Clarity Canvas profile for the current user
 * For Persona Sharpener: creates minimal profile (no sections)
 * For Clarity Canvas: initializes full structure
 */
export async function POST(request: Request): Promise<NextResponse<CreateProfileResponse | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists
    const user = await ensureUser(session);

    // Check if profile exists
    let existing = await prisma.clarityProfile.findFirst({
      where: {
        OR: [
          { userRecordId: user.id },
          { userId: session.user.id },
        ],
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
              include: {
                fields: {
                  include: { sources: true },
                },
              },
            },
          },
        },
      },
    });

    if (existing) {
      // If profile exists but not initialized, initialize it for Clarity Canvas
      if (!existing.isCanvasInitialized) {
        existing = await initializeCanvasStructure(existing.id) as typeof existing;
      }
      return NextResponse.json({
        profile: existing as ProfileWithSections,
        isNew: false,
      });
    }

    // Create new minimal profile, then initialize canvas structure
    const minimal = await createMinimalProfile(user);
    const profile = await initializeCanvasStructure(minimal.id);

    return NextResponse.json({
      profile: profile as ProfileWithSections,
      isNew: true,
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
```

**Implementation Steps**:
1. Add imports for ensureUser, createMinimalProfile, initializeCanvasStructure
2. Update GET to use ensureUser and OR clause for profile lookup
3. Update POST to use ensureUser and handle both new and existing profiles
4. Initialize canvas structure for Clarity Canvas access
5. Add try-catch error handling

**Acceptance Criteria**:
- [ ] GET uses ensureUser() and OR clause for lookup
- [ ] POST creates minimal profile then initializes canvas
- [ ] POST initializes existing unininitialized profiles
- [ ] Error handling added with proper logging
- [ ] TypeScript compiles without errors

---

## Phase 4: Testing & Validation

### Task 4.1: Test New User Flow

**Description**: Manually test that new users can access Persona Sharpener without errors
**Size**: Small
**Priority**: High
**Dependencies**: Task 3.1, Task 3.2, Task 3.3
**Can run parallel with**: Task 4.2

**Test Steps**:
1. Clear browser cookies/storage
2. Log in with a @33strategies.ai email that has never accessed the app
3. Navigate directly to /clarity-canvas/modules/persona-sharpener
4. Verify no "Failed to initialize profile" error appears
5. Complete a brain dump
6. Verify persona is created successfully

**Acceptance Criteria**:
- [ ] New user can access Persona Sharpener without error
- [ ] User record created in database with correct userType
- [ ] Minimal profile created (isCanvasInitialized = false)
- [ ] Brain dump and persona creation work correctly

---

### Task 4.2: Test Existing User Migration

**Description**: Test that existing users are properly linked to new User records
**Size**: Small
**Priority**: High
**Dependencies**: Task 3.1
**Can run parallel with**: Task 4.1

**Test Steps**:
1. Find a user with existing ClarityProfile (check database)
2. Log in as that user
3. Access any Clarity Canvas route
4. Verify in database:
   - User record created with correct email
   - ClarityProfile.userRecordId is populated
   - Existing data still accessible

**Acceptance Criteria**:
- [ ] Existing profile linked to new User record
- [ ] userRecordId populated on ClarityProfile
- [ ] All existing persona/brain dump data accessible
- [ ] No data loss

---

### Task 4.3: Run Monitoring Queries

**Description**: Execute monitoring queries to verify migration progress
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 4.1, Task 4.2
**Can run parallel with**: None

**Monitoring Queries**:

```sql
-- Count users created
SELECT COUNT(*) as user_count FROM "User";

-- Count profiles linked to users
SELECT COUNT(*) as linked_profiles FROM "ClarityProfile" WHERE "userRecordId" IS NOT NULL;

-- Count orphaned profiles (should decrease over time)
SELECT COUNT(*) as orphaned_profiles FROM "ClarityProfile" WHERE "userRecordId" IS NULL;

-- Verify user types
SELECT "userType", COUNT(*) FROM "User" GROUP BY "userType";
```

**Acceptance Criteria**:
- [ ] User records exist for active users
- [ ] Linked profile count matches expectations
- [ ] Orphaned profiles are being migrated on login
- [ ] User types correctly classified

---

## Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Database Schema | 3 tasks | 1.5 hours |
| Phase 2: Core Code | 2 tasks | 3 hours |
| Phase 3: API Routes | 4 tasks | 2.5 hours |
| Phase 4: Testing | 3 tasks | 1 hour |
| **Total** | **12 tasks** | **~8 hours** |

### Parallel Execution Opportunities

- Task 2.1 and 2.2 can run in parallel
- Tasks 3.1, 3.2, 3.3, 3.4 can run in parallel
- Tasks 4.1 and 4.2 can run in parallel

### Critical Path

1. Task 1.1 → Task 1.2 → Task 1.3 (schema, sequential)
2. Task 1.3 → Tasks 2.1/2.2 (code depends on schema)
3. Tasks 2.1/2.2 → Tasks 3.x (routes depend on utilities)
4. Tasks 3.x → Tasks 4.x (testing depends on implementation)
