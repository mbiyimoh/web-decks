# Task Breakdown: Authentication Modernization & OAuth 2.0 Provider

Generated: February 7, 2026
Source: specs/auth-modernization-oauth-provider.md

## Overview

This task breakdown implements a unified authentication system for the 33 Strategies platform:
1. Database-backed credentials (replacing env var passwords)
2. OAuth 2.0 authorization server for external products
3. JWT-based token authentication
4. Admin UI for credential management

**Total estimated effort:** 4-5 weeks across 5 phases

---

## Phase 1: Database Foundation (Week 1)

### Task 1.1: Add Prisma Schema for OAuth Tables
**Description**: Add database models for client credentials and OAuth infrastructure
**Size**: Medium
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (foundation task)

**Technical Requirements**:
Add the following models to `prisma/schema.prisma`:

```prisma
// Client credentials (replaces env var passwords)
model ClientCredential {
  id             String   @id @default(cuid())
  clientId       String   @unique  // e.g., "tradeblock"
  hashedPassword String   // bcrypt hash
  email          String   // For user creation on login
  displayName    String   // e.g., "Tradeblock"
  isActive       Boolean  @default(true)
  failedAttempts Int      @default(0)  // Rate limiting
  lockedUntil    DateTime? // Account lockout
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("client_credentials")
}

// OAuth clients (applications)
model OAuthClient {
  id            String   @id @default(cuid())
  clientId      String   @unique  // e.g., "better-contacts"
  clientSecret  String   // bcrypt hashed
  clientName    String   // e.g., "Better Contacts"
  redirectUris  String[] // Allowed callback URLs
  grantTypes    String[] // ["authorization_code", "refresh_token"]
  scope         String   // Space-separated allowed scopes
  isFirstParty  Boolean  @default(false)  // Skip consent for internal apps
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  authCodes     OAuthAuthorizationCode[]
  accessTokens  OAuthAccessToken[]
  refreshTokens OAuthRefreshToken[]
  consents      OAuthUserConsent[]

  @@map("oauth_clients")
}

// Authorization codes (short-lived, single-use)
model OAuthAuthorizationCode {
  code                String   @id
  clientId            String
  userId              String
  redirectUri         String
  scope               String
  expiresAt           DateTime
  codeChallenge       String?  // PKCE
  codeChallengeMethod String?  // "S256"
  createdAt           DateTime @default(now())

  client OAuthClient @relation(fields: [clientId], references: [clientId], onDelete: Cascade)

  @@index([expiresAt])
  @@map("oauth_authorization_codes")
}

// Access tokens (optional - for early revocation if needed)
model OAuthAccessToken {
  id          String   @id @default(cuid())
  tokenHash   String   @unique  // SHA-256 hash (faster than bcrypt for lookup)
  clientId    String
  userId      String?  // Null for client_credentials grant
  scope       String
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  client OAuthClient @relation(fields: [clientId], references: [clientId], onDelete: Cascade)

  @@index([expiresAt])
  @@index([userId])
  @@map("oauth_access_tokens")
}

// Refresh tokens (with rotation support)
model OAuthRefreshToken {
  id            String   @id @default(cuid())
  tokenHash     String   @unique  // bcrypt hash
  clientId      String
  userId        String
  scope         String
  expiresAt     DateTime
  revoked       Boolean  @default(false)
  replacedBy    String?  // Token rotation tracking
  tokenFamilyId String   // Reuse detection
  createdAt     DateTime @default(now())

  client OAuthClient @relation(fields: [clientId], references: [clientId], onDelete: Cascade)

  @@index([expiresAt])
  @@index([tokenFamilyId])
  @@map("oauth_refresh_tokens")
}

// User consent records
model OAuthUserConsent {
  id        String    @id @default(cuid())
  userId    String
  clientId  String
  scope     String
  grantedAt DateTime  @default(now())
  expiresAt DateTime? // Null for permanent consent

  client OAuthClient @relation(fields: [clientId], references: [clientId], onDelete: Cascade)

  @@unique([userId, clientId])
  @@map("oauth_user_consents")
}
```

**Implementation Steps**:
1. Open `prisma/schema.prisma`
2. Add all 6 models above after existing models
3. Run `npx prisma migrate dev --name add-oauth-tables`
4. Run `npx prisma generate`

**Acceptance Criteria**:
- [ ] All 6 models added to schema
- [ ] Migration runs successfully
- [ ] Prisma client regenerated with new types
- [ ] Tables visible in Prisma Studio (`npx prisma studio`)

---

### Task 1.2: Create Credential Migration Script
**Description**: Create one-time script to migrate existing passwords from env vars to database
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 1.3

**Technical Requirements**:
Create `scripts/migrate-credentials.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CLIENTS_TO_MIGRATE = [
  { clientId: 'tradeblock', envVar: 'TRADEBLOCK_PASSWORD', email: 'client@tradeblock.us', displayName: 'Tradeblock' },
  { clientId: 'plya', envVar: 'PLYA_PASSWORD', email: 'client@plya.com', displayName: 'PLYA' },
  { clientId: 'wsbc', envVar: 'WSBC_PASSWORD', email: 'client@wsbc.com', displayName: 'WSBC' },
  { clientId: 'scott-arnett', envVar: 'SCOTT_ARNETT_PASSWORD', email: 'scott@email.com', displayName: 'Scott Arnett' },
  { clientId: 'noggin-guru', envVar: 'NOGGIN_GURU_PASSWORD', email: 'rob@nogginguru.com', displayName: 'Noggin Guru' },
];

const STRATEGISTS_TO_MIGRATE = [
  { clientId: 'sherril', envVar: 'SHERRIL_PASSWORD', email: 'sherril@33strategies.ai', displayName: 'Sherril' },
];

async function migrateCredentials() {
  console.log('Starting credential migration...\n');

  const allCredentials = [...CLIENTS_TO_MIGRATE, ...STRATEGISTS_TO_MIGRATE];

  for (const cred of allCredentials) {
    const password = process.env[cred.envVar];

    if (!password) {
      console.log(`⚠️  Skipping ${cred.clientId}: ${cred.envVar} not set`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await prisma.clientCredential.upsert({
        where: { clientId: cred.clientId },
        update: { hashedPassword, email: cred.email, displayName: cred.displayName },
        create: {
          clientId: cred.clientId,
          hashedPassword,
          email: cred.email,
          displayName: cred.displayName,
        },
      });
      console.log(`✅ Migrated ${cred.clientId}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${cred.clientId}:`, error);
    }
  }

  console.log('\nMigration complete!');
}

migrateCredentials()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Implementation Steps**:
1. Create `scripts/migrate-credentials.ts`
2. Add to package.json: `"migrate-credentials": "npx tsx scripts/migrate-credentials.ts"`
3. Run locally first to test
4. Run on Railway after deployment

**Acceptance Criteria**:
- [ ] Script creates records for all 6 credentials
- [ ] Passwords are bcrypt hashed (work factor 10)
- [ ] Script is idempotent (uses upsert)
- [ ] Skips missing env vars gracefully

---

### Task 1.3: Create Database Credential Lookup Module
**Description**: Create `lib/credentials.ts` for secure database credential verification
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 1.2

**Technical Requirements**:
Create `lib/credentials.ts`:

```typescript
import { prisma } from './prisma';
import bcrypt from 'bcrypt';
import { secureCompare } from './auth-utils';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface VerifyCredentialResult {
  success: boolean;
  error?: 'invalid' | 'locked' | 'inactive';
  credential?: {
    clientId: string;
    email: string;
    displayName: string;
  };
  lockoutRemaining?: number; // seconds
}

export async function verifyCredential(
  clientId: string,
  password: string
): Promise<VerifyCredentialResult> {
  const credential = await prisma.clientCredential.findUnique({
    where: { clientId },
  });

  if (!credential) {
    // Timing attack mitigation: still perform hash comparison
    await bcrypt.compare(password, '$2b$10$dummy.hash.for.timing.attack.mitigation');
    return { success: false, error: 'invalid' };
  }

  if (!credential.isActive) {
    return { success: false, error: 'inactive' };
  }

  // Check lockout
  if (credential.lockedUntil && credential.lockedUntil > new Date()) {
    const remaining = Math.ceil((credential.lockedUntil.getTime() - Date.now()) / 1000);
    return { success: false, error: 'locked', lockoutRemaining: remaining };
  }

  const isValid = await bcrypt.compare(password, credential.hashedPassword);

  if (!isValid) {
    // Increment failed attempts
    const newAttempts = credential.failedAttempts + 1;
    const shouldLock = newAttempts >= LOCKOUT_THRESHOLD;

    await prisma.clientCredential.update({
      where: { clientId },
      data: {
        failedAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });

    return { success: false, error: 'invalid' };
  }

  // Reset failed attempts on success
  if (credential.failedAttempts > 0) {
    await prisma.clientCredential.update({
      where: { clientId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  return {
    success: true,
    credential: {
      clientId: credential.clientId,
      email: credential.email,
      displayName: credential.displayName,
    },
  };
}

export async function getCredentialByClientId(clientId: string) {
  return prisma.clientCredential.findUnique({
    where: { clientId },
    select: {
      clientId: true,
      email: true,
      displayName: true,
      isActive: true,
    },
  });
}
```

**Implementation Steps**:
1. Create `lib/credentials.ts`
2. Ensure `lib/auth-utils.ts` exports `secureCompare`
3. Add bcrypt types if needed: `npm install --save-dev @types/bcrypt`

**Acceptance Criteria**:
- [ ] `verifyCredential()` returns success/failure with typed result
- [ ] Rate limiting tracks failed attempts in database
- [ ] Lockout enforced after 5 failed attempts
- [ ] Timing attack mitigation for invalid clientIds
- [ ] Successful login resets failed attempts

---

### Task 1.4: Update lib/clients.ts to Use Database
**Description**: Update client password lookup to use database with env var fallback
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.3
**Can run parallel with**: Task 1.5

**Technical Requirements**:
Modify `lib/clients.ts`:

```typescript
import { verifyCredential, getCredentialByClientId } from './credentials';

// Keep existing CLIENT_CONFIG for non-auth metadata

// NEW: Database-backed verification
export async function verifyClientPassword(
  clientId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // Try database first
  const result = await verifyCredential(clientId, password);

  if (result.success) {
    return { success: true };
  }

  if (result.error === 'locked') {
    return {
      success: false,
      error: `Account locked. Try again in ${result.lockoutRemaining} seconds.`
    };
  }

  // Fallback to env var during migration period
  const client = CLIENT_CONFIG[clientId as keyof typeof CLIENT_CONFIG];
  if (client?.passwordEnvVar) {
    const envPassword = process.env[client.passwordEnvVar];
    if (envPassword && password === envPassword) {
      console.warn(`[DEPRECATION] Client ${clientId} authenticated via env var. Migrate to database.`);
      return { success: true };
    }
  }

  return { success: false, error: 'Invalid credentials' };
}

// DEPRECATED: Keep for backward compatibility during migration
export function getClientPassword(clientId: string): string | undefined {
  console.warn('[DEPRECATION] getClientPassword() is deprecated. Use verifyClientPassword() instead.');
  const client = CLIENT_CONFIG[clientId as keyof typeof CLIENT_CONFIG];
  if (!client) return undefined;
  return process.env[client.passwordEnvVar];
}
```

**Implementation Steps**:
1. Add new `verifyClientPassword()` function
2. Add deprecation warning to `getClientPassword()`
3. Update imports

**Acceptance Criteria**:
- [ ] `verifyClientPassword()` checks database first
- [ ] Falls back to env var during migration
- [ ] Deprecation warnings logged for env var usage
- [ ] Returns typed result with error messages

---

### Task 1.5: Fix Central Command Timing Vulnerability
**Description**: Replace `===` comparison with timing-safe comparison in Central Command auth
**Size**: Small
**Priority**: High (Security)
**Dependencies**: None
**Can run parallel with**: Task 1.4, Task 1.6

**Technical Requirements**:
Update `app/api/central-command/auth/route.ts`:

```typescript
import { secureCompare } from '@/lib/auth-utils';

// BEFORE (vulnerable):
// if (!password || password !== expectedPassword) {

// AFTER (secure):
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expectedPassword = process.env.CENTRAL_COMMAND_PASSWORD;

  if (!password || !expectedPassword) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!secureCompare(password, expectedPassword)) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // ... rest of handler
}
```

**Implementation Steps**:
1. Import `secureCompare` from `@/lib/auth-utils`
2. Replace `===` with `secureCompare()`
3. Ensure both values are checked for existence first

**Acceptance Criteria**:
- [ ] Uses timing-safe comparison
- [ ] No direct `===` or `!==` for password comparison
- [ ] Handles undefined/null passwords gracefully

---

### Task 1.6: Fix NextAuth Credentials Provider Timing Vulnerability
**Description**: Replace `!==` comparison with timing-safe comparison in NextAuth credentials provider
**Size**: Small
**Priority**: High (Security)
**Dependencies**: None
**Can run parallel with**: Task 1.4, Task 1.5

**Technical Requirements**:
Update `lib/auth.ts`:

```typescript
import { secureCompare } from './auth-utils';

// In the Credentials provider authorize function:
async authorize(credentials) {
  const email = credentials?.email as string;
  const password = credentials?.password as string;

  if (!email || !password) return null;

  // Check password against env var with timing-safe comparison
  const expectedPassword = process.env.LEARNING_PASSWORD;
  if (!expectedPassword || !secureCompare(password, expectedPassword)) {
    return null;
  }

  return {
    id: email,
    email: email,
    name: email.split('@')[0],
  };
},
```

**Implementation Steps**:
1. Import `secureCompare` from `./auth-utils`
2. Replace `password !== expectedPassword` with `!secureCompare(password, expectedPassword)`

**Acceptance Criteria**:
- [ ] Uses timing-safe comparison
- [ ] LEARNING_PASSWORD stays in env var (not migrated)
- [ ] Handles undefined password gracefully

---

### Task 1.7: Update Client Portal Auth Routes
**Description**: Update client auth routes to use new database verification
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.4
**Can run parallel with**: None

**Technical Requirements**:
Update `app/api/client-auth/route.ts`:

```typescript
import { verifyClientPassword } from '@/lib/clients';

export async function POST(request: NextRequest) {
  const { clientId, password } = await request.json();

  if (!clientId || !password) {
    return NextResponse.json(
      { error: 'Client ID and password required' },
      { status: 400 }
    );
  }

  const result = await verifyClientPassword(clientId, password);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Create session...
  const session = await getIronSession<SessionData>(cookies(), getSessionOptions());
  session.clientId = clientId;
  await session.save();

  return NextResponse.json({ success: true });
}
```

**Implementation Steps**:
1. Import `verifyClientPassword` instead of `getClientPassword`
2. Use async verification
3. Handle rate limiting errors in response

**Acceptance Criteria**:
- [ ] Uses database verification
- [ ] Returns appropriate error messages for lockout
- [ ] Session creation unchanged
- [ ] Existing login flow works

---

## Phase 2: Redis & Token Infrastructure (Week 2)

### Task 2.1: Add Redis Configuration
**Description**: Set up Redis client and connection for token/session storage
**Size**: Medium
**Priority**: High
**Dependencies**: Phase 1 complete
**Can run parallel with**: Task 2.2

**Technical Requirements**:
Install ioredis and create `lib/redis.ts`:

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

```typescript
// lib/redis.ts
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL && process.env.NODE_ENV === 'production') {
  throw new Error('REDIS_URL environment variable is required in production');
}

// Singleton pattern for connection reuse
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    if (!REDIS_URL) {
      // Development fallback: in-memory mock (or throw)
      throw new Error('REDIS_URL not configured. Add Redis for token storage.');
    }

    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected');
    });
  }

  return redis;
}

// Helper for token storage
export async function setWithExpiry(
  key: string,
  value: string,
  expirySeconds: number
): Promise<void> {
  const client = getRedis();
  await client.setex(key, expirySeconds, value);
}

export async function get(key: string): Promise<string | null> {
  const client = getRedis();
  return client.get(key);
}

export async function del(key: string): Promise<void> {
  const client = getRedis();
  await client.del(key);
}
```

**Implementation Steps**:
1. Install ioredis
2. Create `lib/redis.ts`
3. Add `REDIS_URL` to `.env.example`

**Acceptance Criteria**:
- [ ] Redis client connects successfully
- [ ] Error handling for connection failures
- [ ] Helper functions for token operations
- [ ] Singleton pattern prevents connection spam

---

### Task 2.2: Generate and Store RSA Keys
**Description**: Generate RS256 key pair for JWT signing
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 2.1

**Technical Requirements**:
Generate keys locally and add to Railway:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Convert to single-line format for env vars
cat private.pem | base64 | tr -d '\n'
cat public.pem | base64 | tr -d '\n'
```

Create `lib/oauth/keys.ts`:

```typescript
// lib/oauth/keys.ts
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto';

let privateKey: KeyObject | null = null;
let publicKey: KeyObject | null = null;

function decodeBase64Key(base64Key: string): string {
  return Buffer.from(base64Key, 'base64').toString('utf-8');
}

export function getPrivateKey(): KeyObject {
  if (!privateKey) {
    const keyData = process.env.OAUTH_PRIVATE_KEY;
    if (!keyData) {
      throw new Error('OAUTH_PRIVATE_KEY environment variable is required');
    }
    privateKey = createPrivateKey(decodeBase64Key(keyData));
  }
  return privateKey;
}

export function getPublicKey(): KeyObject {
  if (!publicKey) {
    const keyData = process.env.OAUTH_PUBLIC_KEY;
    if (!keyData) {
      throw new Error('OAUTH_PUBLIC_KEY environment variable is required');
    }
    publicKey = createPublicKey(decodeBase64Key(keyData));
  }
  return publicKey;
}

// Get JWK representation for JWKS endpoint
export function getPublicJWK(): object {
  const key = getPublicKey();
  const jwk = key.export({ format: 'jwk' });
  return {
    ...jwk,
    kid: 'primary', // Key ID
    use: 'sig',
    alg: 'RS256',
  };
}
```

**Implementation Steps**:
1. Generate key pair locally
2. Add base64-encoded keys to Railway env vars
3. Create `lib/oauth/keys.ts`
4. Add to `.env.example` (without actual values)

**Acceptance Criteria**:
- [ ] RSA key pair generated (2048-bit minimum)
- [ ] Keys stored as base64 in env vars
- [ ] Keys load and decode correctly
- [ ] JWK export works for JWKS endpoint

---

### Task 2.3: Implement Token Generation Utilities
**Description**: Create JWT access token generation and validation
**Size**: Large
**Priority**: High
**Dependencies**: Task 2.2
**Can run parallel with**: Task 2.4

**Technical Requirements**:
Install jose and create `lib/oauth/tokens.ts`:

```bash
npm install jose
```

```typescript
// lib/oauth/tokens.ts
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { getPrivateKey, getPublicKey } from './keys';
import { nanoid } from 'nanoid';

const ISSUER = 'https://33strategies.ai';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 14;

export interface AccessTokenPayload extends JWTPayload {
  sub: string;        // User ID
  client_id: string;  // OAuth client ID
  scope: string;      // Space-separated scopes
  type: 'access';
}

export interface RefreshTokenData {
  token: string;      // Opaque token (for client)
  hash: string;       // bcrypt hash (for storage)
  familyId: string;   // For reuse detection
  expiresAt: Date;
}

// Generate access token (JWT)
export async function generateAccessToken(
  userId: string,
  clientId: string,
  scope: string
): Promise<string> {
  const jwt = await new SignJWT({
    sub: userId,
    client_id: clientId,
    scope,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'primary' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(nanoid())
    .sign(getPrivateKey());

  return jwt;
}

// Validate access token
export async function validateAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getPublicKey(), {
      issuer: ISSUER,
    });

    if (payload.type !== 'access') {
      return null;
    }

    return payload as AccessTokenPayload;
  } catch (error) {
    return null;
  }
}

// Generate refresh token (opaque)
export async function generateRefreshToken(
  familyId?: string
): Promise<RefreshTokenData> {
  const bcrypt = await import('bcrypt');
  const token = nanoid(32);
  const hash = await bcrypt.hash(token, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  return {
    token,
    hash,
    familyId: familyId || nanoid(),
    expiresAt,
  };
}

// Verify refresh token against stored hash
export async function verifyRefreshToken(
  token: string,
  storedHash: string
): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(token, storedHash);
}
```

**Implementation Steps**:
1. Install jose
2. Create `lib/oauth/tokens.ts`
3. Add token expiry constants
4. Implement generation and validation

**Acceptance Criteria**:
- [ ] Access tokens are RS256-signed JWTs
- [ ] Token validation checks signature and expiry
- [ ] Refresh tokens are opaque with bcrypt hash
- [ ] Token family ID generated for rotation tracking

---

### Task 2.4: Implement Refresh Token Rotation
**Description**: Create refresh token rotation logic with reuse detection
**Size**: Large
**Priority**: High
**Dependencies**: Task 2.3
**Can run parallel with**: None

**Technical Requirements**:
Create `lib/oauth/refresh.ts`:

```typescript
// lib/oauth/refresh.ts
import { prisma } from '@/lib/prisma';
import { generateRefreshToken, verifyRefreshToken, generateAccessToken } from './tokens';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RotationResult {
  success: boolean;
  tokens?: TokenPair;
  error?: 'invalid' | 'expired' | 'revoked' | 'reuse_detected';
}

// Create initial token pair for new login
export async function createTokenPair(
  userId: string,
  clientId: string,
  scope: string
): Promise<TokenPair> {
  const accessToken = await generateAccessToken(userId, clientId, scope);
  const refreshData = await generateRefreshToken();

  // Store refresh token in database
  await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: refreshData.hash,
      clientId,
      userId,
      scope,
      expiresAt: refreshData.expiresAt,
      tokenFamilyId: refreshData.familyId,
    },
  });

  return {
    accessToken,
    refreshToken: refreshData.token,
    expiresIn: 900, // 15 minutes in seconds
  };
}

// Rotate refresh token (returns new pair, invalidates old)
export async function rotateRefreshToken(
  oldToken: string,
  clientId: string
): Promise<RotationResult> {
  // Find all non-revoked tokens and check each (bcrypt comparison)
  const candidates = await prisma.oAuthRefreshToken.findMany({
    where: {
      clientId,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  let matchedToken = null;
  for (const candidate of candidates) {
    const isMatch = await verifyRefreshToken(oldToken, candidate.tokenHash);
    if (isMatch) {
      matchedToken = candidate;
      break;
    }
  }

  if (!matchedToken) {
    return { success: false, error: 'invalid' };
  }

  // Check if this token was already rotated (reuse detection)
  if (matchedToken.replacedBy) {
    // SECURITY: Revoke entire token family
    await prisma.oAuthRefreshToken.updateMany({
      where: { tokenFamilyId: matchedToken.tokenFamilyId },
      data: { revoked: true },
    });

    console.warn(`[SECURITY] Refresh token reuse detected for family ${matchedToken.tokenFamilyId}`);
    return { success: false, error: 'reuse_detected' };
  }

  // Generate new token pair
  const accessToken = await generateAccessToken(
    matchedToken.userId,
    clientId,
    matchedToken.scope
  );
  const newRefreshData = await generateRefreshToken(matchedToken.tokenFamilyId);

  // Create new refresh token
  const newRefreshRecord = await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: newRefreshData.hash,
      clientId,
      userId: matchedToken.userId,
      scope: matchedToken.scope,
      expiresAt: newRefreshData.expiresAt,
      tokenFamilyId: matchedToken.tokenFamilyId,
    },
  });

  // Mark old token as replaced (but not revoked - for reuse detection)
  await prisma.oAuthRefreshToken.update({
    where: { id: matchedToken.id },
    data: { replacedBy: newRefreshRecord.id },
  });

  return {
    success: true,
    tokens: {
      accessToken,
      refreshToken: newRefreshData.token,
      expiresIn: 900,
    },
  };
}

// Revoke all tokens for a user/client combination
export async function revokeTokensForUser(
  userId: string,
  clientId?: string
): Promise<void> {
  await prisma.oAuthRefreshToken.updateMany({
    where: {
      userId,
      ...(clientId && { clientId }),
    },
    data: { revoked: true },
  });
}
```

**Implementation Steps**:
1. Create `lib/oauth/refresh.ts`
2. Implement token creation, rotation, and revocation
3. Add reuse detection with family revocation

**Acceptance Criteria**:
- [ ] Token rotation generates new pair
- [ ] Old token marked as replaced (not immediately revoked)
- [ ] Reuse of replaced token revokes entire family
- [ ] Security warning logged on reuse detection

---

### Task 2.5: Create Token Validation Middleware
**Description**: Create middleware for validating JWT access tokens on protected routes
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.3
**Can run parallel with**: Task 2.4

**Technical Requirements**:
Create `lib/oauth/middleware.ts`:

```typescript
// lib/oauth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateAccessToken, AccessTokenPayload } from './tokens';

export interface AuthenticatedRequest extends NextRequest {
  auth: AccessTokenPayload;
}

// Extract Bearer token from Authorization header
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// Middleware wrapper for protected routes
export function withTokenAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredScopes?: string[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = extractBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const payload = await validateAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check required scopes
    if (requiredScopes && requiredScopes.length > 0) {
      const tokenScopes = payload.scope.split(' ');
      const hasAllScopes = requiredScopes.every(scope =>
        tokenScopes.includes(scope)
      );

      if (!hasAllScopes) {
        return NextResponse.json(
          { error: 'Insufficient scope', required: requiredScopes },
          { status: 403 }
        );
      }
    }

    // Attach auth payload to request
    (request as AuthenticatedRequest).auth = payload;

    return handler(request as AuthenticatedRequest);
  };
}

// Helper to get auth from request (for use in route handlers)
export async function getTokenAuth(
  request: NextRequest
): Promise<AccessTokenPayload | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  return validateAccessToken(token);
}
```

**Implementation Steps**:
1. Create `lib/oauth/middleware.ts`
2. Implement Bearer token extraction
3. Add scope validation
4. Create wrapper for protected routes

**Acceptance Criteria**:
- [ ] Extracts Bearer token from header
- [ ] Validates token signature and expiry
- [ ] Checks required scopes
- [ ] Returns 401 for missing/invalid tokens
- [ ] Returns 403 for insufficient scopes

---

## Phase 3: First-Party Token Auth (Week 3)

### Task 3.1: Create Portal Login Endpoint (Token-Issuing)
**Description**: New login endpoint that issues JWT tokens instead of sessions
**Size**: Medium
**Priority**: High
**Dependencies**: Phase 2 complete
**Can run parallel with**: Task 3.2

**Technical Requirements**:
Create `app/api/auth/portal-login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyClientPassword } from '@/lib/clients';
import { createTokenPair } from '@/lib/oauth/refresh';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { clientId, password } = await request.json();

  if (!clientId || !password) {
    return NextResponse.json(
      { error: 'Client ID and password required' },
      { status: 400 }
    );
  }

  const result = await verifyClientPassword(clientId, password);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Get or create user record
  const credential = await prisma.clientCredential.findUnique({
    where: { clientId },
  });

  if (!credential) {
    return NextResponse.json(
      { error: 'Credential not found' },
      { status: 500 }
    );
  }

  // Ensure user exists
  let user = await prisma.user.findUnique({
    where: { email: credential.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: credential.email,
        name: credential.displayName,
      },
    });
  }

  // Create token pair
  const tokens = await createTokenPair(
    user.id,
    'client-portal', // First-party client ID
    'read:profile'   // Default scope for portals
  );

  return NextResponse.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
  });
}
```

**Implementation Steps**:
1. Create `app/api/auth/portal-login/route.ts`
2. Verify credentials using database
3. Create/lookup user record
4. Generate token pair

**Acceptance Criteria**:
- [ ] Returns JWT access token
- [ ] Returns refresh token
- [ ] Creates user if not exists
- [ ] Returns standard OAuth token response format

---

### Task 3.2: Create Token Refresh Endpoint
**Description**: Endpoint for refreshing access tokens
**Size**: Small
**Priority**: High
**Dependencies**: Phase 2 complete
**Can run parallel with**: Task 3.1

**Technical Requirements**:
Create `app/api/auth/refresh/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { rotateRefreshToken } from '@/lib/oauth/refresh';

export async function POST(request: NextRequest) {
  const { refresh_token, client_id } = await request.json();

  if (!refresh_token) {
    return NextResponse.json(
      { error: 'refresh_token required' },
      { status: 400 }
    );
  }

  const clientId = client_id || 'client-portal'; // Default for first-party

  const result = await rotateRefreshToken(refresh_token, clientId);

  if (!result.success) {
    const statusCodes: Record<string, number> = {
      invalid: 401,
      expired: 401,
      revoked: 401,
      reuse_detected: 401,
    };

    return NextResponse.json(
      { error: result.error },
      { status: statusCodes[result.error!] || 401 }
    );
  }

  return NextResponse.json({
    access_token: result.tokens!.accessToken,
    refresh_token: result.tokens!.refreshToken,
    token_type: 'Bearer',
    expires_in: result.tokens!.expiresIn,
  });
}
```

**Implementation Steps**:
1. Create `app/api/auth/refresh/route.ts`
2. Extract refresh token from body
3. Rotate and return new pair

**Acceptance Criteria**:
- [ ] Accepts refresh_token in body
- [ ] Returns new access + refresh tokens
- [ ] Handles reuse detection properly
- [ ] Returns appropriate error codes

---

### Task 3.3: Create Unified Auth Helper
**Description**: Create helper that supports both iron-session and token auth during migration
**Size**: Medium
**Priority**: High
**Dependencies**: Task 3.1
**Can run parallel with**: Task 3.4

**Technical Requirements**:
Create `lib/auth/unified-auth.ts`:

```typescript
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SessionData, getSessionOptions } from '@/lib/session';
import { getTokenAuth, AccessTokenPayload } from '@/lib/oauth/middleware';
import { prisma } from '@/lib/prisma';

export interface AuthResult {
  authenticated: boolean;
  method: 'token' | 'session' | 'none';
  userId?: string;
  clientId?: string;
  email?: string;
  scopes?: string[];
}

// Check both token and session auth
export async function getAuth(request?: NextRequest): Promise<AuthResult> {
  // Try token auth first (if request provided)
  if (request) {
    const tokenPayload = await getTokenAuth(request);
    if (tokenPayload) {
      return {
        authenticated: true,
        method: 'token',
        userId: tokenPayload.sub,
        clientId: tokenPayload.client_id,
        scopes: tokenPayload.scope.split(' '),
      };
    }
  }

  // Fall back to iron-session
  try {
    const session = await getIronSession<SessionData>(cookies(), getSessionOptions());

    if (session.clientId) {
      // Get user from credential
      const credential = await prisma.clientCredential.findUnique({
        where: { clientId: session.clientId },
      });

      return {
        authenticated: true,
        method: 'session',
        clientId: session.clientId,
        email: credential?.email,
      };
    }

    if (session.strategistId) {
      return {
        authenticated: true,
        method: 'session',
        clientId: session.strategistId,
      };
    }
  } catch {
    // Session not available
  }

  return { authenticated: false, method: 'none' };
}

// Require authentication (throws if not authenticated)
export async function requireAuth(request?: NextRequest): Promise<AuthResult> {
  const auth = await getAuth(request);
  if (!auth.authenticated) {
    throw new Error('Authentication required');
  }
  return auth;
}
```

**Implementation Steps**:
1. Create `lib/auth/unified-auth.ts`
2. Check token auth first
3. Fall back to session auth
4. Return unified result

**Acceptance Criteria**:
- [ ] Checks token auth first
- [ ] Falls back to iron-session
- [ ] Returns consistent auth result
- [ ] Works without request (session-only)

---

### Task 3.4: Update Client Portal Auth Checks
**Description**: Update portal pages to use unified auth
**Size**: Medium
**Priority**: Medium
**Dependencies**: Task 3.3
**Can run parallel with**: None

**Technical Requirements**:
Update portal page auth checks to use unified helper:

```typescript
// In client portal pages, replace:
const session = await getIronSession<SessionData>(cookies(), getSessionOptions());
if (!session.clientId) {
  redirect('/client-portals/login');
}

// With:
import { getAuth } from '@/lib/auth/unified-auth';

// In Server Component:
const auth = await getAuth();
if (!auth.authenticated || auth.clientId !== client) {
  redirect(`/client-portals/${client}/login`);
}
```

**Implementation Steps**:
1. Update `app/client-portals/[client]/page.tsx`
2. Update `app/client-portals/[client]/project/[projectId]/page.tsx`
3. Update any other portal pages

**Acceptance Criteria**:
- [ ] Portal pages work with token auth
- [ ] Portal pages work with session auth (backward compatible)
- [ ] Correct redirects for unauthenticated users

---

## Phase 4: OAuth Authorization Server (Week 4)

### Task 4.1: Create OAuth Scopes Definition
**Description**: Define OAuth scopes and validation helpers
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 4.2

**Technical Requirements**:
Create `lib/oauth/scopes.ts`:

```typescript
export const OAUTH_SCOPES = {
  'read:profile': 'Read your Clarity Canvas profile data',
  'write:profile': 'Update your Clarity Canvas profile data',
  'read:synthesis': 'Access product-specific profile syntheses',
  'trigger:synthesis': 'Request new synthesis generation',
  'search:profile': 'Search across your profile using natural language',
  'admin:credentials': 'Manage client credentials (internal)',
  'admin:clients': 'Manage OAuth clients (internal)',
} as const;

export type OAuthScope = keyof typeof OAUTH_SCOPES;

export function validateScopes(requestedScopes: string, allowedScopes: string): boolean {
  const requested = requestedScopes.split(' ');
  const allowed = allowedScopes.split(' ');
  return requested.every(scope => allowed.includes(scope));
}

export function getScopeDescriptions(scopes: string): string[] {
  return scopes.split(' ')
    .filter(scope => scope in OAUTH_SCOPES)
    .map(scope => OAUTH_SCOPES[scope as OAuthScope]);
}
```

**Implementation Steps**:
1. Create `lib/oauth/scopes.ts`
2. Define all scopes with descriptions
3. Add validation helpers

**Acceptance Criteria**:
- [ ] All scopes defined with human-readable descriptions
- [ ] Scope validation works correctly
- [ ] Description lookup for consent screen

---

### Task 4.2: Create Authorization Endpoint
**Description**: OAuth 2.0 authorization endpoint with PKCE support
**Size**: Large
**Priority**: High
**Dependencies**: Task 4.1
**Can run parallel with**: Task 4.3

**Technical Requirements**:
Create `app/api/oauth/authorize/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { validateScopes } from '@/lib/oauth/scopes';
import { getAuth } from '@/lib/auth/unified-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const scope = searchParams.get('scope') || 'read:profile';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  // Validate required params
  if (!clientId || !redirectUri || responseType !== 'code' || !state) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Validate client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client || !client.isActive) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client not found' },
      { status: 400 }
    );
  }

  // Validate redirect URI
  if (!client.redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid redirect_uri' },
      { status: 400 }
    );
  }

  // Validate scopes
  if (!validateScopes(scope, client.scope)) {
    return NextResponse.json(
      { error: 'invalid_scope', error_description: 'Requested scope exceeds allowed scopes' },
      { status: 400 }
    );
  }

  // PKCE required for public clients (no secret)
  if (!client.clientSecret && !codeChallenge) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'PKCE required for public clients' },
      { status: 400 }
    );
  }

  // Check if user is authenticated
  const auth = await getAuth(request);

  if (!auth.authenticated) {
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // For first-party apps, skip consent and issue code directly
  if (client.isFirstParty) {
    const code = nanoid(32);

    await prisma.oAuthAuthorizationCode.create({
      data: {
        code,
        clientId,
        userId: auth.userId!,
        redirectUri,
        scope,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        codeChallenge,
        codeChallengeMethod,
      },
    });

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('state', state);

    return NextResponse.redirect(callbackUrl);
  }

  // For third-party apps, check existing consent or show consent screen
  const existingConsent = await prisma.oAuthUserConsent.findUnique({
    where: {
      userId_clientId: {
        userId: auth.userId!,
        clientId,
      },
    },
  });

  if (existingConsent && validateScopes(scope, existingConsent.scope)) {
    // Has valid consent, issue code
    const code = nanoid(32);

    await prisma.oAuthAuthorizationCode.create({
      data: {
        code,
        clientId,
        userId: auth.userId!,
        redirectUri,
        scope,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        codeChallenge,
        codeChallengeMethod,
      },
    });

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('state', state);

    return NextResponse.redirect(callbackUrl);
  }

  // Redirect to consent screen
  const consentUrl = new URL('/oauth/consent', request.url);
  consentUrl.searchParams.set('client_id', clientId);
  consentUrl.searchParams.set('scope', scope);
  consentUrl.searchParams.set('redirect_uri', redirectUri);
  consentUrl.searchParams.set('state', state);
  if (codeChallenge) {
    consentUrl.searchParams.set('code_challenge', codeChallenge);
    consentUrl.searchParams.set('code_challenge_method', codeChallengeMethod || 'S256');
  }

  return NextResponse.redirect(consentUrl);
}
```

**Implementation Steps**:
1. Create authorization endpoint
2. Validate all OAuth parameters
3. Handle first-party vs third-party flow
4. Implement PKCE validation

**Acceptance Criteria**:
- [ ] Validates client_id, redirect_uri, scope
- [ ] PKCE required for public clients
- [ ] First-party apps skip consent
- [ ] Third-party apps redirect to consent
- [ ] State parameter preserved

---

### Task 4.3: Create Token Exchange Endpoint
**Description**: OAuth 2.0 token endpoint for code exchange and refresh
**Size**: Large
**Priority**: High
**Dependencies**: Task 4.2
**Can run parallel with**: Task 4.4

**Technical Requirements**:
Create `app/api/oauth/token/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTokenPair, rotateRefreshToken } from '@/lib/oauth/refresh';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const grantType = formData.get('grant_type') as string;

  if (grantType === 'authorization_code') {
    return handleAuthorizationCode(formData);
  }

  if (grantType === 'refresh_token') {
    return handleRefreshToken(formData);
  }

  return NextResponse.json(
    { error: 'unsupported_grant_type' },
    { status: 400 }
  );
}

async function handleAuthorizationCode(formData: FormData) {
  const code = formData.get('code') as string;
  const clientId = formData.get('client_id') as string;
  const clientSecret = formData.get('client_secret') as string;
  const redirectUri = formData.get('redirect_uri') as string;
  const codeVerifier = formData.get('code_verifier') as string;

  if (!code || !clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Find authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
    include: { client: true },
  });

  if (!authCode) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid authorization code' },
      { status: 400 }
    );
  }

  // Check expiry
  if (authCode.expiresAt < new Date()) {
    await prisma.oAuthAuthorizationCode.delete({ where: { code } });
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code expired' },
      { status: 400 }
    );
  }

  // Validate client
  if (authCode.clientId !== clientId) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Client mismatch' },
      { status: 400 }
    );
  }

  // Validate redirect URI
  if (authCode.redirectUri !== redirectUri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
      { status: 400 }
    );
  }

  // Validate client secret (if confidential client)
  if (authCode.client.clientSecret) {
    if (!clientSecret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client secret required' },
        { status: 401 }
      );
    }

    const secretValid = await bcrypt.compare(clientSecret, authCode.client.clientSecret);
    if (!secretValid) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client secret' },
        { status: 401 }
      );
    }
  }

  // Validate PKCE
  if (authCode.codeChallenge) {
    if (!codeVerifier) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Code verifier required' },
        { status: 400 }
      );
    }

    const expectedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    if (expectedChallenge !== authCode.codeChallenge) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid code verifier' },
        { status: 400 }
      );
    }
  }

  // Delete authorization code (single use)
  await prisma.oAuthAuthorizationCode.delete({ where: { code } });

  // Create token pair
  const tokens = await createTokenPair(
    authCode.userId,
    clientId,
    authCode.scope
  );

  return NextResponse.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
    scope: authCode.scope,
  });
}

async function handleRefreshToken(formData: FormData) {
  const refreshToken = formData.get('refresh_token') as string;
  const clientId = formData.get('client_id') as string;

  if (!refreshToken || !clientId) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const result = await rotateRefreshToken(refreshToken, clientId);

  if (!result.success) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    access_token: result.tokens!.accessToken,
    refresh_token: result.tokens!.refreshToken,
    token_type: 'Bearer',
    expires_in: result.tokens!.expiresIn,
  });
}
```

**Implementation Steps**:
1. Create token endpoint
2. Handle authorization_code grant
3. Handle refresh_token grant
4. Validate PKCE for code exchange

**Acceptance Criteria**:
- [ ] Exchanges auth code for tokens
- [ ] Validates client secret for confidential clients
- [ ] Validates PKCE code_verifier
- [ ] Authorization code is single-use
- [ ] Refresh token rotation works

---

### Task 4.4: Create Consent Screen UI
**Description**: OAuth consent screen for third-party apps
**Size**: Medium
**Priority**: High
**Dependencies**: Task 4.1
**Can run parallel with**: Task 4.3

**Technical Requirements**:
Create `app/oauth/consent/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth/unified-auth';
import { getScopeDescriptions } from '@/lib/oauth/scopes';
import { nanoid } from 'nanoid';

interface ConsentPageProps {
  searchParams: {
    client_id: string;
    scope: string;
    redirect_uri: string;
    state: string;
    code_challenge?: string;
    code_challenge_method?: string;
  };
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const auth = await getAuth();

  if (!auth.authenticated) {
    redirect('/auth/signin');
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: searchParams.client_id },
  });

  if (!client) {
    return <div>Invalid client</div>;
  }

  const scopeDescriptions = getScopeDescriptions(searchParams.scope);

  async function handleConsent(formData: FormData) {
    'use server';

    const approved = formData.get('approved') === 'true';

    if (!approved) {
      const callbackUrl = new URL(searchParams.redirect_uri);
      callbackUrl.searchParams.set('error', 'access_denied');
      callbackUrl.searchParams.set('state', searchParams.state);
      redirect(callbackUrl.toString());
    }

    // Store consent
    await prisma.oAuthUserConsent.upsert({
      where: {
        userId_clientId: {
          userId: auth.userId!,
          clientId: searchParams.client_id,
        },
      },
      update: { scope: searchParams.scope },
      create: {
        userId: auth.userId!,
        clientId: searchParams.client_id,
        scope: searchParams.scope,
      },
    });

    // Generate authorization code
    const code = nanoid(32);

    await prisma.oAuthAuthorizationCode.create({
      data: {
        code,
        clientId: searchParams.client_id,
        userId: auth.userId!,
        redirectUri: searchParams.redirect_uri,
        scope: searchParams.scope,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        codeChallenge: searchParams.code_challenge,
        codeChallengeMethod: searchParams.code_challenge_method,
      },
    });

    const callbackUrl = new URL(searchParams.redirect_uri);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('state', searchParams.state);
    redirect(callbackUrl.toString());
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111114] rounded-lg p-8 border border-[#222]">
        <h1 className="text-xl font-display text-[#f5f5f5] mb-2">
          Authorize {client.clientName}
        </h1>

        <p className="text-[#888] text-sm mb-6">
          {client.clientName} is requesting access to your account.
        </p>

        <div className="mb-6">
          <p className="text-[#888] text-xs font-mono uppercase tracking-wider mb-3">
            This will allow {client.clientName} to:
          </p>
          <ul className="space-y-2">
            {scopeDescriptions.map((desc, i) => (
              <li key={i} className="flex items-start gap-2 text-[#f5f5f5] text-sm">
                <span className="text-[#d4a54a]">•</span>
                {desc}
              </li>
            ))}
          </ul>
        </div>

        <form action={handleConsent} className="flex gap-3">
          <button
            type="submit"
            name="approved"
            value="false"
            className="flex-1 px-4 py-2 bg-[#222] text-[#888] rounded hover:bg-[#333] transition-colors"
          >
            Deny
          </button>
          <button
            type="submit"
            name="approved"
            value="true"
            className="flex-1 px-4 py-2 bg-[#d4a54a] text-[#0a0a0f] rounded hover:bg-[#e5b85b] transition-colors font-medium"
          >
            Allow
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Implementation Steps**:
1. Create consent page
2. Display client name and requested scopes
3. Handle approve/deny with server action
4. Store consent record
5. Redirect with code or error

**Acceptance Criteria**:
- [ ] Shows client name and scopes
- [ ] Allow button stores consent and redirects with code
- [ ] Deny button redirects with error
- [ ] Follows 33 Strategies design system

---

### Task 4.5: Create OpenID Discovery Endpoints
**Description**: Create OIDC discovery and JWKS endpoints
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 2.2
**Can run parallel with**: Task 4.4

**Technical Requirements**:
Create `app/.well-known/openid-configuration/route.ts`:

```typescript
import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://33strategies.ai';

export async function GET() {
  return NextResponse.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/api/oauth/authorize`,
    token_endpoint: `${BASE_URL}/api/oauth/token`,
    userinfo_endpoint: `${BASE_URL}/api/oauth/userinfo`,
    revocation_endpoint: `${BASE_URL}/api/oauth/revoke`,
    jwks_uri: `${BASE_URL}/.well-known/jwks.json`,
    scopes_supported: [
      'read:profile',
      'write:profile',
      'read:synthesis',
      'trigger:synthesis',
      'search:profile',
    ],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    code_challenge_methods_supported: ['S256'],
  });
}
```

Create `app/.well-known/jwks.json/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getPublicJWK } from '@/lib/oauth/keys';

export async function GET() {
  return NextResponse.json({
    keys: [getPublicJWK()],
  });
}
```

**Implementation Steps**:
1. Create discovery endpoint
2. Create JWKS endpoint
3. Export public key as JWK

**Acceptance Criteria**:
- [ ] Discovery endpoint returns correct URLs
- [ ] JWKS endpoint returns public key
- [ ] Endpoints are publicly accessible

---

## Phase 5: Admin UI & Cleanup (Week 5)

### Task 5.1: Create Admin Dashboard Page
**Description**: Admin area for credential and OAuth client management
**Size**: Medium
**Priority**: Medium
**Dependencies**: Phase 4 complete
**Can run parallel with**: Task 5.2

**Technical Requirements**:
Create `app/admin/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await auth();

  // Require team member auth
  if (!session?.user?.email?.endsWith('@33strategies.ai')) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-display text-[#f5f5f5] mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-2 gap-6">
          <Link
            href="/admin/credentials"
            className="block p-6 bg-[#111114] rounded-lg border border-[#222] hover:border-[#d4a54a] transition-colors"
          >
            <h2 className="text-lg font-display text-[#f5f5f5] mb-2">
              Client Credentials
            </h2>
            <p className="text-[#888] text-sm">
              Manage passwords for client portal access
            </p>
          </Link>

          <Link
            href="/admin/oauth-clients"
            className="block p-6 bg-[#111114] rounded-lg border border-[#222] hover:border-[#d4a54a] transition-colors"
          >
            <h2 className="text-lg font-display text-[#f5f5f5] mb-2">
              OAuth Clients
            </h2>
            <p className="text-[#888] text-sm">
              Register and manage OAuth applications
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Implementation Steps**:
1. Create admin layout with NextAuth protection
2. Create dashboard with links to sub-pages
3. Style with 33 Strategies design system

**Acceptance Criteria**:
- [ ] Requires @33strategies.ai email
- [ ] Links to credentials and OAuth clients
- [ ] Follows design system

---

### Task 5.2: Create Credentials Management Page
**Description**: UI for viewing and updating client credentials
**Size**: Large
**Priority**: Medium
**Dependencies**: Task 5.1
**Can run parallel with**: Task 5.3

**Technical Requirements**:
Create `app/admin/credentials/page.tsx` and `components/admin/CredentialForm.tsx`:

- List all credentials with status
- Edit password (generates new hash)
- Toggle active status
- View failed attempt count
- Unlock locked accounts

**Acceptance Criteria**:
- [ ] Lists all credentials
- [ ] Can update passwords
- [ ] Can toggle active status
- [ ] Can unlock locked accounts
- [ ] New passwords shown once

---

### Task 5.3: Create OAuth Client Registration Page
**Description**: UI for registering and managing OAuth clients
**Size**: Large
**Priority**: Medium
**Dependencies**: Task 5.1
**Can run parallel with**: Task 5.2

**Technical Requirements**:
Create `app/admin/oauth-clients/page.tsx` and `components/admin/OAuthClientForm.tsx`:

- List all OAuth clients
- Register new client (generates secret)
- Edit redirect URIs and scopes
- Toggle first-party status
- Revoke all tokens for client

**Acceptance Criteria**:
- [ ] Lists all OAuth clients
- [ ] Can register new clients
- [ ] Client secrets shown once at creation
- [ ] Can edit URIs and scopes
- [ ] Can revoke tokens

---

### Task 5.4: Remove Env Var Password Fallbacks
**Description**: Remove deprecated fallback to env var passwords
**Size**: Small
**Priority**: Low
**Dependencies**: Tasks 5.1-5.3 (verify working)
**Can run parallel with**: Task 5.5

**Technical Requirements**:
Update `lib/clients.ts`:

```typescript
// Remove this fallback block:
// Fallback to env var during migration period
const client = CLIENT_CONFIG[clientId as keyof typeof CLIENT_CONFIG];
if (client?.passwordEnvVar) {
  const envPassword = process.env[client.passwordEnvVar];
  if (envPassword && password === envPassword) {
    console.warn(`[DEPRECATION] Client ${clientId} authenticated via env var. Migrate to database.`);
    return { success: true };
  }
}
```

Also remove from Railway:
- `TRADEBLOCK_PASSWORD`
- `PLYA_PASSWORD`
- `WSBC_PASSWORD`
- `SCOTT_ARNETT_PASSWORD`
- `NOGGIN_GURU_PASSWORD`
- `SHERRIL_PASSWORD`

Keep:
- `LEARNING_PASSWORD`
- `CENTRAL_COMMAND_PASSWORD`

**Implementation Steps**:
1. Remove fallback code from lib/clients.ts
2. Remove env vars from Railway after verifying database auth works

**Acceptance Criteria**:
- [ ] No env var fallback in code
- [ ] Env vars removed from Railway
- [ ] LEARNING_PASSWORD and CENTRAL_COMMAND_PASSWORD remain

---

### Task 5.5: Update Documentation
**Description**: Update CLAUDE.md and create auth documentation
**Size**: Medium
**Priority**: Medium
**Dependencies**: All Phase 5 tasks
**Can run parallel with**: None

**Technical Requirements**:
- Update CLAUDE.md Authentication section
- Create `docs/developer-guides/oauth-implementation-guide.md`
- Document new API endpoints
- Document admin UI usage

**Acceptance Criteria**:
- [ ] CLAUDE.md updated
- [ ] Developer guide created
- [ ] API endpoints documented
- [ ] Admin UI usage documented

---

## Summary

| Phase | Tasks | Priority Items |
|-------|-------|----------------|
| 1 | 7 tasks | Prisma schema, credential migration, timing fixes |
| 2 | 5 tasks | Redis, RSA keys, JWT tokens, refresh rotation |
| 3 | 4 tasks | Portal login, refresh endpoint, unified auth |
| 4 | 5 tasks | Authorization, token exchange, consent UI, OIDC |
| 5 | 5 tasks | Admin UI, cleanup, documentation |

**Total: 26 tasks**

**Parallel execution opportunities:**
- Phase 1: Tasks 1.2 & 1.3, Tasks 1.4 & 1.5 & 1.6
- Phase 2: Tasks 2.1 & 2.2, Tasks 2.3 & 2.4 & 2.5
- Phase 3: Tasks 3.1 & 3.2, Task 3.3 & 3.4
- Phase 4: Tasks 4.1 & 4.2 & 4.3 & 4.4 & 4.5
- Phase 5: Tasks 5.1 || 5.2 & 5.3

---

*Generated by Claude Code - February 7, 2026*
