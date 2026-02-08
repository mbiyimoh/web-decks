# Specification: Authentication Modernization & OAuth 2.0 Provider

**Status:** Ready for Implementation
**Priority:** High (prerequisite for Clarity Companion API)
**Estimated Effort:** 4-5 weeks
**Author:** Claude Code
**Date:** February 7, 2026

---

## 1. Overview

### Problem Statement

The 33 Strategies platform currently has fragmented authentication:
- **5 client passwords** stored in environment variables (`TRADEBLOCK_PASSWORD`, etc.)
- **1 strategist password** in env var (`SHERRIL_PASSWORD`)
- **1 learning password** in env var (`LEARNING_PASSWORD`) — remains in env, team-only access
- **Central Command** uses non-timing-safe password comparison (security vulnerability)
- **NextAuth credentials provider** also uses non-timing-safe comparison (`lib/auth.ts`)
- **iron-session** cookies cannot cross domains (blocks external product integration)
- **No OAuth provider capability** (external products like Better Contacts cannot authenticate)

### Solution

Implement a unified authentication system with:
1. **Database-backed credentials** — Move passwords from env vars to PostgreSQL
2. **OAuth 2.0 authorization server** — Enable external products to authenticate via standard OAuth
3. **Token-based authentication** — Replace session cookies with JWT access tokens
4. **Separate admin area** — Credential management outside of Central Command

### Success Criteria

- [ ] All client/strategist passwords stored in database (bcrypt hashed)
- [ ] OAuth 2.0 authorization code flow working for external products
- [ ] Better Contacts can authenticate and receive access tokens
- [ ] Existing portal users can log in with new system (force re-login acceptable)
- [ ] Central Command timing vulnerability fixed
- [ ] Redis deployed on Railway for OAuth session storage

---

## 2. Architecture

### Authentication Landscape (Post-Migration)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                          │
│                                                                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │     NextAuth (OAuth)     │  │   node-oidc-provider          │ │
│  │                          │  │                               │ │
│  │ Team Members             │  │ OAuth 2.0 Authorization       │ │
│  │ (Google OAuth)           │  │ Server                        │ │
│  │                          │  │                               │ │
│  │ → Learning Platform      │  │ ALL Users (Team + Clients):   │ │
│  │ → Admin Areas            │  │ → Clarity Canvas              │ │
│  │                          │  │ → Client Portals              │ │
│  │                          │  │ → Central Command (admin)     │ │
│  │                          │  │ → Better Contacts (external)  │ │
│  │                          │  │ → SP33D (future)              │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                   │
│  Shared: User table, Redis session store                         │
└─────────────────────────────────────────────────────────────────┘
```

### Two Authentication Paths

**Path A: First-Party (Simplified)**
- Client portals, Clarity Canvas, Central Command
- Email + password verified against database
- Issue JWT access token directly (no consent screen)
- Marked as `isFirstParty: true` in OAuth client config

**Path B: Third-Party (Full OAuth)**
- External products (Better Contacts, SP33D, etc.)
- Full authorization code flow with PKCE
- User sees consent screen: "Better Contacts wants to access your profile"
- Scoped tokens (`read:profile`, `read:synthesis`)

### Token Strategy

| Token Type | Lifetime | Storage | Format |
|------------|----------|---------|--------|
| Access Token | 15 minutes | Not stored (JWT) | RS256 signed JWT |
| Refresh Token | 14 days | PostgreSQL (hashed) | Opaque string |
| Authorization Code | 5 minutes | PostgreSQL | Opaque string |

---

## 3. Database Schema

### New Models

```prisma
// Client credentials (replaces env var passwords)
model ClientCredential {
  id             String   @id @default(cuid())
  clientId       String   @unique  // e.g., "tradeblock"
  hashedPassword String   // bcrypt hash
  email          String   // For user creation on login
  displayName    String   // e.g., "Tradeblock"
  isActive       Boolean  @default(true)
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

// Access tokens (for opaque token validation if needed)
model OAuthAccessToken {
  id          String   @id @default(cuid())
  tokenHash   String   @unique  // bcrypt hash of token (for revocation lookup)
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

### Migration Script

```sql
-- Migrate existing client passwords to database
-- Run ONCE after schema migration, passwords pre-hashed with bcrypt

INSERT INTO client_credentials (id, client_id, hashed_password, email, display_name) VALUES
  (gen_random_uuid()::text, 'tradeblock', '$2b$10$...', 'client@tradeblock.us', 'Tradeblock'),
  (gen_random_uuid()::text, 'plya', '$2b$10$...', 'client@plya.com', 'PLYA'),
  (gen_random_uuid()::text, 'wsbc', '$2b$10$...', 'client@wsbc.com', 'WSBC'),
  (gen_random_uuid()::text, 'scott-arnett', '$2b$10$...', 'scott@email.com', 'Scott Arnett'),
  (gen_random_uuid()::text, 'noggin-guru', '$2b$10$...', 'rob@nogginguru.com', 'Noggin Guru');

-- Register first-party OAuth clients
INSERT INTO oauth_clients (id, client_id, client_secret, client_name, redirect_uris, grant_types, scope, is_first_party) VALUES
  (gen_random_uuid()::text, 'clarity-canvas', '$2b$10$...', 'Clarity Canvas',
   ARRAY['https://33strategies.ai/clarity-canvas/callback'],
   ARRAY['authorization_code', 'refresh_token'],
   'read:profile write:profile read:synthesis', true),
  (gen_random_uuid()::text, 'client-portal', '$2b$10$...', 'Client Portal',
   ARRAY['https://33strategies.ai/client-portals/callback'],
   ARRAY['authorization_code', 'refresh_token'],
   'read:profile', true);
```

---

## 4. OAuth Scopes

```typescript
export const OAUTH_SCOPES = {
  // Profile access
  'read:profile': 'Read full Clarity Canvas profile data',
  'write:profile': 'Update Clarity Canvas profile data',

  // Synthesis access (for Companion API)
  'read:synthesis': 'Access product-specific profile syntheses',
  'trigger:synthesis': 'Request new synthesis generation',

  // Search capability
  'search:profile': 'Search across profile using natural language',

  // Admin (internal only)
  'admin:credentials': 'Manage client credentials',
  'admin:clients': 'Manage OAuth clients',
} as const;

export type OAuthScope = keyof typeof OAUTH_SCOPES;
```

---

## 5. API Endpoints

### OAuth Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/oauth/authorize` | GET | Authorization endpoint (redirects to consent or issues code) |
| `/api/oauth/token` | POST | Token exchange (code → tokens, refresh → new tokens) |
| `/api/oauth/revoke` | POST | Token revocation |
| `/api/oauth/userinfo` | GET | User info endpoint (protected by access token) |
| `/.well-known/openid-configuration` | GET | OpenID Connect discovery |
| `/.well-known/jwks.json` | GET | JSON Web Key Set for token verification |

### First-Party Login Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/portal-login` | POST | Client/strategist login (issues tokens directly) |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Revoke refresh token |

### Admin Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/credentials` | GET | List client credentials |
| `/api/admin/credentials` | POST | Create client credential |
| `/api/admin/credentials/:id` | PATCH | Update credential (password, active status) |
| `/api/admin/credentials/:id` | DELETE | Deactivate credential |
| `/api/admin/oauth-clients` | GET | List OAuth clients |
| `/api/admin/oauth-clients` | POST | Register OAuth client |
| `/api/admin/oauth-clients/:id` | PATCH | Update OAuth client |

---

## 6. Implementation Phases

### Phase 1: Database Foundation (Week 1)

**Tasks:**
1. Add Prisma models for `ClientCredential` and OAuth tables
2. Run migration
3. Create seed script to migrate existing passwords
4. Update `lib/clients.ts` to read from database instead of env vars
5. Fix Central Command timing vulnerability (use `secureCompare`)
6. Fix NextAuth credentials provider timing vulnerability (`lib/auth.ts`)

**Files to create/modify:**
- `prisma/schema.prisma` — Add new models
- `scripts/migrate-credentials.ts` — One-time migration script
- `lib/credentials.ts` — Database credential lookup
- `lib/clients.ts` — Update `getClientPassword()` to use database
- `app/api/central-command/auth/route.ts` — Fix timing vulnerability
- `lib/auth.ts` — Fix timing vulnerability in credentials provider

**Note:** `LEARNING_PASSWORD` remains in env vars (team-only, one-off password). Only timing vulnerability is fixed.

**Acceptance criteria:**
- [ ] Client portal login works with database credentials
- [ ] Env var passwords can be removed from Railway
- [ ] Central Command uses timing-safe comparison
- [ ] NextAuth credentials provider uses timing-safe comparison

### Phase 2: Redis & Token Infrastructure (Week 2)

**Tasks:**
1. Add Railway Redis plugin
2. Create JWT signing keys (RS256)
3. Implement token generation utilities
4. Implement token validation middleware
5. Create refresh token rotation logic

**Files to create:**
- `lib/oauth/keys.ts` — RSA key management
- `lib/oauth/tokens.ts` — Token generation/validation
- `lib/oauth/refresh.ts` — Refresh token rotation with reuse detection
- `lib/oauth/middleware.ts` — Token validation middleware
- `lib/redis.ts` — Redis client configuration

**Environment variables to add:**
```
REDIS_URL=redis://...
OAUTH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
OAUTH_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
```

**Acceptance criteria:**
- [ ] Redis connected and working
- [ ] JWT tokens can be generated and validated
- [ ] Refresh token rotation works with reuse detection

### Phase 3: First-Party Token Auth (Week 3)

**Tasks:**
1. Create portal login endpoint that issues tokens
2. Update client portal pages to use token auth
3. Update Clarity Canvas to use token auth
4. Implement parallel auth (support both iron-session AND tokens during migration)
5. Create token refresh endpoint

**Files to create/modify:**
- `app/api/auth/portal-login/route.ts` — Token-issuing login
- `app/api/auth/refresh/route.ts` — Token refresh
- `lib/auth/unified-auth.ts` — Support both session and token auth
- Client portal pages — Update auth checks

**Acceptance criteria:**
- [ ] Client portals can authenticate with tokens
- [ ] Clarity Canvas works with token auth
- [ ] Existing iron-session still works (parallel support)

### Phase 4: OAuth Authorization Server (Week 4)

**Tasks:**
1. Implement authorization endpoint
2. Implement token endpoint
3. Create consent screen UI
4. Implement PKCE validation
5. Create OpenID Connect discovery endpoints

**Files to create:**
- `app/api/oauth/authorize/route.ts` — Authorization endpoint
- `app/api/oauth/token/route.ts` — Token exchange
- `app/api/oauth/revoke/route.ts` — Token revocation
- `app/api/oauth/userinfo/route.ts` — User info
- `app/oauth/consent/page.tsx` — Consent screen
- `app/.well-known/openid-configuration/route.ts` — Discovery
- `app/.well-known/jwks.json/route.ts` — JWKS

**Acceptance criteria:**
- [ ] OAuth authorization code flow works end-to-end
- [ ] Consent screen displays for third-party apps
- [ ] First-party apps skip consent screen
- [ ] PKCE validation working

### Phase 5: Admin UI & Cleanup (Week 5)

**Tasks:**
1. Create admin area for credential management
2. Create OAuth client registration UI
3. Remove env var password fallbacks (except `LEARNING_PASSWORD`)
4. Update documentation
5. Deprecate iron-session for migrated routes

**Files to create:**
- `app/admin/page.tsx` — Admin dashboard
- `app/admin/credentials/page.tsx` — Credential management
- `app/admin/oauth-clients/page.tsx` — OAuth client management
- `components/admin/CredentialForm.tsx` — Create/edit credentials
- `components/admin/OAuthClientForm.tsx` — Register OAuth clients

**iron-session scope clarification:**
- **Migrate to tokens:** Client portals, Clarity Canvas, Central Command
- **Keep on iron-session:** Share link sessions (`/share/[slug]`) — these are public artifact links with per-link passwords, not OAuth-relevant

**Acceptance criteria:**
- [ ] Admin can manage credentials via UI
- [ ] Admin can register OAuth clients
- [ ] Env var passwords removed from codebase (except `LEARNING_PASSWORD`)
- [ ] Documentation updated
- [ ] Share link sessions continue working on iron-session

---

## 7. Security Requirements

### Token Security

- [ ] Access tokens signed with RS256 (asymmetric)
- [ ] Refresh tokens stored as bcrypt hashes (not plaintext)
- [ ] Refresh token rotation on every use
- [ ] Token family tracking for reuse detection
- [ ] Entire token family revoked on reuse attempt

### OAuth Security

- [ ] PKCE required for public clients
- [ ] Redirect URI exact match validation
- [ ] Authorization codes single-use
- [ ] State parameter required and validated
- [ ] HTTPS required for all redirect URIs (except localhost)

### Credential Security

- [ ] Passwords stored as bcrypt hashes (work factor 10)
- [ ] Timing-safe comparison for all password checks
- [ ] Rate limiting on login endpoints (10 attempts / 15 minutes)
- [ ] Account lockout after 5 failed attempts

**Rate limiting implementation:** Use database columns (`failedAttempts`, `lockedUntil`) on `ClientCredential` model, following the pattern established for share links in `ArtifactShareLink`. No external rate limiting middleware required.

### Admin Security

- [ ] Admin area requires team member auth (NextAuth)
- [ ] All admin actions logged
- [ ] Client secrets shown only once at creation

---

## 8. Testing Requirements

### Unit Tests

- [ ] Token generation and validation
- [ ] Refresh token rotation
- [ ] PKCE validation (S256)
- [ ] Scope validation
- [ ] Credential lookup from database

### Integration Tests

- [ ] Full OAuth authorization code flow
- [ ] First-party login flow
- [ ] Token refresh flow
- [ ] Token revocation flow
- [ ] Consent screen rendering

### E2E Tests

- [ ] Client portal login with new auth
- [ ] Clarity Canvas access with tokens
- [ ] OAuth flow from external app perspective
- [ ] Admin credential management

---

## 9. Rollback Plan

If issues arise:

1. **Phase 1-2:** Revert to env var passwords (still in Railway)
2. **Phase 3:** Enable iron-session fallback in `unified-auth.ts`
3. **Phase 4:** Disable OAuth endpoints, external products use manual tokens
4. **Phase 5:** Keep admin UI behind feature flag

**Critical:** Do not remove env var passwords from Railway until Phase 5 is stable.

---

## 10. Dependencies

### External

- **node-oidc-provider** — OAuth 2.0 / OpenID Connect server (or custom implementation)
- **jose** — JWT signing and verification
- **bcrypt** — Password hashing
- **ioredis** — Redis client

### Infrastructure

- **Railway Redis** — Session and token storage
- **RSA key pair** — For JWT signing (generate with `openssl`)

---

## 11. Out of Scope

- Two-factor authentication (future enhancement)
- Password-less magic link auth (future enhancement)
- SAML/enterprise SSO (not needed for current clients)
- Social login for clients (Google, GitHub, etc.)

---

## 12. Related Documents

- `docs/ideation/auth-modernization-oauth-provider.md` — Full ideation with research
- `docs/ideation/clarity-companion-api-layer.md` — Dependent feature
- `docs/reference/clarity-companion-API-layer.md` — Original Companion API spec

---

*Last Updated: February 2026*
