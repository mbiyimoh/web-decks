# Specification: Client Portal Email+Password Authentication with User Integration

## Overview

Extend client portal authentication to require both email and password, creating User records in the database. This enables client portal users to access features like Persona Sharpener that require a `userId`.

## Problem Statement

Currently:
- Client portals use password-only authentication via iron-session
- No User record is created when clients log in
- Clients cannot access Clarity Canvas features (Persona Sharpener, etc.) because those routes require `session.user.id` from NextAuth

## Solution

Add email to client portal authentication flow:
1. Configure email+password per client (environment variables)
2. Update login UI to accept email+password
3. On successful login, create/update User record with `userType: CLIENT`
4. Store `userId` in iron-session for downstream use
5. Create bridge utilities so Clarity Canvas routes can authenticate client portal sessions

## Technical Design

### 1. Schema Changes

**No schema changes needed** - User model already supports this:
```prisma
model User {
  authId         String    @unique  // Will use "client-portal:{email}" format
  email          String    @unique
  userType       UserType  @default(TEAM_MEMBER)  // Will set to CLIENT
  clientPortalId String?   // Will set to client ID (e.g., "plya")
  // ... existing fields
}
```

### 2. Client Configuration Updates

**File: `lib/clients.ts`**

Extend `ClientEntry` interface:
```typescript
export interface ClientEntry {
  id: string;
  name: string;
  passwordEnvVar: string;
  emailEnvVar: string;      // NEW: e.g., 'PLYA_EMAIL'
  content: ContentItem[];
}
```

Update client definitions:
```typescript
'plya': {
  id: 'plya',
  name: 'PLYA',
  passwordEnvVar: 'PLYA_PASSWORD',
  emailEnvVar: 'PLYA_EMAIL',        // NEW
  content: [...]
}
```

Add helper:
```typescript
export function getClientEmail(clientId: string): string | undefined {
  const client = getClient(clientId);
  if (!client) return undefined;
  return process.env[client.emailEnvVar];
}
```

### 3. Session Updates

**File: `lib/session.ts`**

Extend SessionData to include user info:
```typescript
export interface SessionData {
  isLoggedIn: boolean;
  clientId?: string;
  strategistId?: string;
  // NEW: User info for client portal users
  userId?: string;        // Database User.id
  userEmail?: string;     // For display/verification
}
```

### 4. Auth Route Updates

**File: `app/api/client-auth/[client]/route.ts`**

Update POST handler to:
1. Accept `{ email, password }` instead of just `{ password }`
2. Validate both email and password match configured values
3. Create/update User record on success
4. Store userId in session

```typescript
export async function POST(request: Request, { params }: Props) {
  const { client: clientId } = await params;
  const client = getClient(clientId);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const expectedPassword = getClientPassword(clientId);
  const expectedEmail = getClientEmail(clientId);

  if (!expectedPassword || !expectedEmail) {
    console.error(`Missing auth config for client: ${clientId}`);
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { email, password } = await request.json();

    // Validate both email and password
    const emailMatch = email?.toLowerCase() === expectedEmail.toLowerCase();
    const passwordMatch = secureCompare(password, expectedPassword);

    if (emailMatch && passwordMatch) {
      // Create or update User record
      const user = await ensureClientUser(email, clientId);

      const session = await getIronSession<SessionData>(
        await cookies(),
        getSessionOptions()
      );
      session.isLoggedIn = true;
      session.clientId = clientId.toLowerCase();
      session.userId = user.id;          // NEW
      session.userEmail = user.email;    // NEW
      await session.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

### 5. Client User Sync Utility

**File: `lib/client-user-sync.ts`** (new file)

```typescript
import { prisma } from '@/lib/prisma';

/**
 * Ensure a User record exists for a client portal user.
 * Creates if not exists, updates if email changed.
 */
export async function ensureClientUser(
  email: string,
  clientId: string
): Promise<{ id: string; email: string }> {
  const normalizedEmail = email.toLowerCase();
  const authId = `client-portal:${normalizedEmail}`;

  // Try to find existing user by authId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { authId },
        { email: normalizedEmail },
      ],
    },
  });

  if (user) {
    // Update if needed (e.g., clientPortalId changed)
    if (user.clientPortalId !== clientId || user.authId !== authId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authId,
          clientPortalId: clientId,
          userType: 'CLIENT',
        },
      });
    }
    return { id: user.id, email: user.email };
  }

  // Create new user
  user = await prisma.user.create({
    data: {
      authId,
      email: normalizedEmail,
      name: null,  // Clients don't have names from OAuth
      userType: 'CLIENT',
      clientPortalId: clientId,
    },
  });

  return { id: user.id, email: user.email };
}
```

### 6. Session Bridge for Clarity Canvas

**File: `lib/client-session-bridge.ts`** (new file)

Create a utility that Clarity Canvas routes can use to get user info from either NextAuth OR client portal session:

```typescript
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export interface UnifiedSession {
  userId: string;
  userEmail: string;
  authSource: 'nextauth' | 'client-portal';
}

/**
 * Get unified session from either NextAuth or client portal iron-session.
 * Returns null if not authenticated via either method.
 */
export async function getUnifiedSession(): Promise<UnifiedSession | null> {
  // Try NextAuth first (team members, learning platform users)
  const nextAuthSession = await auth();
  if (nextAuthSession?.user?.id && nextAuthSession?.user?.email) {
    return {
      userId: nextAuthSession.user.id,
      userEmail: nextAuthSession.user.email,
      authSource: 'nextauth',
    };
  }

  // Try client portal session
  const ironSession = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (ironSession.isLoggedIn && ironSession.userId && ironSession.userEmail) {
    return {
      userId: ironSession.userId,
      userEmail: ironSession.userEmail,
      authSource: 'client-portal',
    };
  }

  return null;
}

/**
 * Get the full User record from unified session.
 * Creates User if needed (for NextAuth users via ensureUser pattern).
 */
export async function getSessionUser(): Promise<{
  id: string;
  email: string;
  userType: string;
} | null> {
  const session = await getUnifiedSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, userType: true },
  });

  return user;
}
```

### 7. Update Clarity Canvas Routes

Update routes to use unified session. Example for `lib/user-sync.ts`:

```typescript
// Add overload or alternative function
export async function ensureUserFromUnifiedSession(): Promise<User | null> {
  const unified = await getUnifiedSession();
  if (!unified) return null;

  // For client portal users, user already exists
  if (unified.authSource === 'client-portal') {
    return prisma.user.findUnique({
      where: { id: unified.userId },
    });
  }

  // For NextAuth users, use existing ensureUser logic
  const nextAuthSession = await auth();
  if (nextAuthSession) {
    return ensureUser(nextAuthSession);
  }

  return null;
}
```

### 8. PasswordGate UI Updates

**File: `components/portal/PasswordGate.tsx`**

Add email field:
```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// In form:
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter email"
  // ... styles
/>
<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter password"
  // ... styles
/>

// In handleSubmit:
body: JSON.stringify({ email, password }),
```

### 9. Environment Variables

Add to `.env.example` and Railway:
```bash
# Client Portal Authentication
PLYA_EMAIL=client@plya.com
PLYA_PASSWORD=secure_password_here

TRADEBLOCK_EMAIL=client@tradeblock.com
TRADEBLOCK_PASSWORD=secure_password_here

WSBC_EMAIL=client@wsbc.com
WSBC_PASSWORD=secure_password_here
```

## Implementation Tasks

### Phase 1: Core Infrastructure
1. [ ] Extend `ClientEntry` interface with `emailEnvVar`
2. [ ] Add `getClientEmail()` helper to `lib/clients.ts`
3. [ ] Update `SessionData` to include `userId` and `userEmail`
4. [ ] Create `lib/client-user-sync.ts` with `ensureClientUser()`

### Phase 2: Auth Flow
5. [ ] Update `client-auth/[client]/route.ts` to validate email+password
6. [ ] Update `client-auth/[client]/route.ts` to create User record on login
7. [ ] Update `client-auth/[client]/route.ts` to store userId in session
8. [ ] Update `PasswordGate.tsx` to accept email input

### Phase 3: Session Bridge
9. [ ] Create `lib/client-session-bridge.ts` with `getUnifiedSession()`
10. [ ] Add `ensureUserFromUnifiedSession()` to `lib/user-sync.ts`

### Phase 4: Route Updates (Required for Persona Sharpener access)
11. [ ] Update `app/api/clarity-canvas/profile/route.ts` to use unified session
12. [ ] Update `app/api/clarity-canvas/modules/persona-sharpener/personas/route.ts`
13. [ ] Update `app/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/route.ts`
14. [ ] Update `app/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/responses/route.ts`
15. [ ] Update `app/api/clarity-canvas/modules/persona-sharpener/sessions/route.ts`
16. [ ] Update `app/api/clarity-canvas/modules/persona-sharpener/sessions/[sessionId]/route.ts`
17. [ ] Update `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts`
18. [ ] Update `app/api/clarity-canvas/questions/route.ts`

### Phase 5: Configuration & Deployment
19. [ ] Update `.env.example` with email env vars
20. [ ] Add client email env vars to Railway
21. [ ] Update existing client configs with `emailEnvVar`
22. [ ] Test login flow end-to-end

## Migration Path

**Backward Compatibility:**
- Existing password-only clients continue to work during transition
- Add `emailEnvVar` as optional field initially
- Once all clients have email configured, make it required

**For Existing Clients (PLYA, Tradeblock, WSBC):**
1. Add email env vars to Railway
2. Update client configs with `emailEnvVar`
3. Communicate new login credentials to clients
4. They will get User records created on next login

## Testing Checklist

- [ ] Login with correct email+password creates User record
- [ ] Login with wrong email fails
- [ ] Login with wrong password fails
- [ ] Session contains userId after login
- [ ] Client can access Persona Sharpener after login
- [ ] Logout clears session properly
- [ ] Multiple clients have separate User records
- [ ] Same email cannot be used for multiple clients

## Security Considerations

1. **Email validation**: Case-insensitive comparison
2. **Password security**: Continue using timing-safe comparison
3. **Session integrity**: userId in session can only be set by server
4. **Rate limiting**: Consider adding for failed login attempts (future)

## Open Questions

1. ~~**Should we hash passwords?**~~ No - env vars are secure enough for this use case.
2. ~~**Multi-user client portals?**~~ No - 1 email per client for now. Deferred to future spec if needed.
3. ~~**Password reset flow?**~~ No - manual via env var update is acceptable.
