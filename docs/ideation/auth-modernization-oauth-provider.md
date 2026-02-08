# Authentication Modernization & OAuth 2.0 Provider

**Slug:** auth-modernization-oauth-provider
**Author:** Claude Code
**Date:** February 6, 2026
**Branch:** preflight/auth-modernization-oauth-provider
**Related:**
- `docs/ideation/clarity-companion-api-layer.md` (dependent feature)
- `docs/reference/clarity-companion-API-layer.md` (original spec)

---

## 1) Intent & Assumptions

**Task brief:**
Audit and modernize the fragmented authentication landscape across 33strategies.ai. Currently the platform uses: (1) client portal passwords stored in environment variables, (2) NextAuth for learning platform OAuth, (3) iron-session for Central Command admin access, and (4) a unified session bridge for Clarity Canvas. The goal is to consolidate these into a unified system that can also serve as an OAuth 2.0 authorization server, enabling external products like Better Contacts to access Clarity Canvas data via the Clarity Companion API.

**Assumptions:**
- All existing sessions should continue working during migration (no forced re-auth)
- Client passwords in env vars are the highest priority to eliminate
- OAuth 2.0 is the right long-term pattern for cross-product authentication
- Better Contacts will be the first external product to integrate
- Railway deployment (not Vercel serverless) allows for always-on OAuth server
- NextAuth will remain for team member Google OAuth (works well)

**Out of scope:**
- Implementing the actual Clarity Companion API (separate spec)
- Two-factor authentication (future enhancement)
- Password-less magic link auth (future enhancement)
- SAML/enterprise SSO (not needed for current clients)

---

## 2) Pre-reading Log

### Core Auth Files
- `lib/session.ts`: iron-session config for portal/strategist/Central Command/share links. Uses `33strategies-session` cookie, 7-day expiry, `isLoggedIn` + `clientId`/`strategistId`/`isCentralCommand` flags.
- `lib/auth.ts`: NextAuth v5 with Google OAuth + Credentials provider. Email allowlist via `isEmailAllowed()`. JWT callbacks persist user ID.
- `lib/auth-utils.ts`: `secureCompare()` for timing-safe password comparison, `validateReturnTo()` for open redirect prevention.
- `lib/client-session-bridge.ts`: `getUnifiedSession()` bridges NextAuth + iron-session for routes supporting both.
- `lib/clients.ts`: Client registry with `passwordEnvVar` and `emailEnvVar` properties pointing to `TRADEBLOCK_PASSWORD`, `PLYA_PASSWORD`, etc.

### Auth API Routes
- `app/api/client-auth/route.ts`: Email+password login, reads password from env, creates User record, sets iron-session.
- `app/api/strategist-auth/[strategist]/route.ts`: Password-only login per strategist.
- `app/api/central-command/auth/route.ts`: Password login for admin dashboard (NOT using timing-safe compare - security gap).
- `app/api/share/auth/route.ts`: Brute-force protected bcrypt password verification for artifact share links.

### Database
- `prisma/schema.prisma`: User model with `authId` (unique), `email`, `userType` (TEAM_MEMBER/CLIENT/POTENTIAL_CLIENT), `clientPortalId`. No OAuth tables currently.

### Environment Variables (Password-Related)
```
TRADEBLOCK_PASSWORD, TRADEBLOCK_EMAIL
PLYA_PASSWORD, PLYA_EMAIL
WSBC_PASSWORD, WSBC_EMAIL
SCOTT_ARNETT_PASSWORD, SCOTT_ARNETT_EMAIL
NOGGIN_GURU_PASSWORD, NOGGIN_GURU_EMAIL
SHERRIL_PASSWORD (strategist)
CENTRAL_COMMAND_PASSWORD
LEARNING_PASSWORD
```

---

## 3) Codebase Map

### Primary components/modules

| Path | Role | Impact |
|------|------|--------|
| `lib/session.ts` | iron-session configuration | Needs extension for OAuth tokens |
| `lib/auth.ts` | NextAuth configuration | Keep for team member OAuth |
| `lib/clients.ts` | Client registry + password getters | Replace with database lookup |
| `lib/client-session-bridge.ts` | Unified session bridge | Extend for OAuth tokens |
| `app/api/client-auth/route.ts` | Client portal login | Migrate to OAuth |
| `app/api/central-command/auth/route.ts` | Admin login | Migrate to OAuth |
| `app/auth/signin/UnifiedAuthGate.tsx` | Login UI | Add OAuth consent flow |
| `prisma/schema.prisma` | Database schema | Add OAuth tables |

### Data flow (current)

```
Client Portal Login:
  User enters email + password
    ↓
  POST /api/client-auth
    ↓
  Compare against process.env.{CLIENT}_PASSWORD
    ↓
  Create iron-session cookie with clientId
    ↓
  Redirect to portal

Team Member Login:
  User clicks "Sign in with Google"
    ↓
  NextAuth Google OAuth flow
    ↓
  Validate @33strategies.ai or allowlist
    ↓
  Store JWT in cookie
    ↓
  Redirect to learning/clarity canvas
```

### Potential blast radius

| Change | Impact | Risk |
|--------|--------|------|
| Add OAuth tables | Low | New tables, no existing data |
| Move passwords to database | Medium | Must migrate 5 clients + 1 strategist |
| Add OAuth endpoints | Medium | New routes, no conflicts |
| Update login UI | Medium | Users see different flow |
| Deprecate env passwords | High | Must coordinate with Railway vars |

---

## 4) Root Cause Analysis

*Not applicable - this is new feature/modernization, not a bug fix.*

---

## 5) Research Findings

### Key Finding 1: NextAuth Cannot Be an OAuth Provider

**Issue:** NextAuth v5 is exclusively an OAuth **client** library. It cannot issue tokens or act as an authorization server.

**Solution:** Use **node-oidc-provider** alongside NextAuth:
- NextAuth continues handling team member Google OAuth (works well)
- node-oidc-provider handles OAuth 2.0 authorization server duties
- Both share the same User table

### Key Finding 2: Railway Supports Always-On OAuth Server

**Issue:** OAuth authorization servers need persistent state and can't run in serverless mode.

**Solution:** Railway supports always-on deployments:
```toml
[deploy]
startCommand = "node server.js"
restartPolicyType = "ALWAYS"  # Never sleep
```

Plus Redis for session/token storage (Railway plugin available).

### Key Finding 3: Gradual Migration Pattern

**Best practice:** Run OAuth and iron-session in parallel, migrate clients one at a time.

```typescript
// Dual-mode authentication
export async function authenticateRequest(req: NextRequest) {
  // Try OAuth token first (new clients)
  const bearer = req.headers.get('Authorization');
  if (bearer?.startsWith('Bearer ')) {
    return validateOAuthToken(bearer.substring(7));
  }

  // Fall back to iron-session (legacy clients)
  const session = await getIronSession(req, sessionOptions);
  if (session.isLoggedIn) {
    return { userId: session.userId, authMethod: 'legacy' };
  }

  return null;
}
```

### Key Finding 4: Database-Backed Client Credentials

**Current problem:** Passwords in env vars require Railway deploy to change.

**Solution:** Store hashed credentials in database:
```prisma
model ClientCredential {
  id             String   @id @default(cuid())
  clientId       String   @unique  // e.g., "tradeblock"
  hashedPassword String   // bcrypt
  email          String   // For user creation
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

Benefits:
- Change passwords without deploy
- Audit trail of credential changes
- Admin UI for credential management
- Rotate credentials without downtime

### Key Finding 5: OAuth 2.0 Database Schema

Required tables for OAuth provider:

```prisma
model OAuthClient {
  id            String   @id @default(cuid())
  clientId      String   @unique  // "better-contacts"
  clientSecret  String   // bcrypt hashed
  clientName    String   // "Better Contacts"
  redirectUris  String[] // Allowed callback URLs
  grantTypes    String[] // ["authorization_code", "refresh_token"]
  scope         String   // "read:profile read:synthesis"
  isFirstParty  Boolean  @default(false)  // Skip consent for internal apps
  createdAt     DateTime @default(now())

  authCodes     OAuthAuthorizationCode[]
  accessTokens  OAuthAccessToken[]
  refreshTokens OAuthRefreshToken[]
  consents      OAuthUserConsent[]
}

model OAuthAuthorizationCode {
  code        String   @id
  clientId    String
  userId      String
  redirectUri String
  scope       String
  expiresAt   DateTime
  codeChallenge       String?  // PKCE
  codeChallengeMethod String?  // "S256"
  createdAt   DateTime @default(now())

  client      OAuthClient @relation(fields: [clientId], references: [clientId])
}

model OAuthAccessToken {
  accessToken String   @id
  clientId    String
  userId      String?  // Null for client_credentials
  scope       String
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  client      OAuthClient @relation(fields: [clientId], references: [clientId])
}

model OAuthRefreshToken {
  refreshToken  String   @id
  clientId      String
  userId        String
  scope         String
  expiresAt     DateTime
  revoked       Boolean  @default(false)
  replacedBy    String?  // Token rotation tracking
  tokenFamilyId String   // Reuse detection
  createdAt     DateTime @default(now())

  client        OAuthClient @relation(fields: [clientId], references: [clientId])
}

model OAuthUserConsent {
  id        Int       @id @default(autoincrement())
  userId    String
  clientId  String
  scope     String
  grantedAt DateTime  @default(now())
  expiresAt DateTime?

  client    OAuthClient @relation(fields: [clientId], references: [clientId])

  @@unique([userId, clientId])
}
```

### Key Finding 6: Token Security Requirements (RFC 9700)

As of January 2025, refresh token rotation is **mandatory** for public clients:
- Issue new refresh token on each use
- Track token families for reuse detection
- Revoke entire family if reuse detected
- 15-minute access tokens, 14-day refresh tokens

---

## 6) Potential Solutions

### Solution 1: Minimal - Database Credentials Only

**Description:** Move passwords from env vars to database without OAuth.

**Changes:**
- Add `ClientCredential` table
- Update `getClientPassword()` to read from database
- Create admin UI for credential management
- Keep iron-session authentication

**Pros:**
- Minimal code changes
- No new authentication patterns
- Quick to implement (1-2 days)

**Cons:**
- Doesn't solve cross-product auth (Better Contacts)
- Still using session cookies (can't share across domains)
- Technical debt remains

**Verdict:** Insufficient for Clarity Companion API requirements.

---

### Solution 2: Full OAuth 2.0 Provider (Recommended)

**Description:** Implement complete OAuth 2.0 authorization server using node-oidc-provider.

**Architecture:**
```
┌────────────────────────────────────────────────────────────────┐
│                       33strategies.ai                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Authentication Layer                       ││
│  │                                                              ││
│  │  ┌──────────────────┐     ┌──────────────────────────────┐  ││
│  │  │    NextAuth      │     │    node-oidc-provider         │  ││
│  │  │                  │     │                                │  ││
│  │  │ Team Members     │     │  OAuth 2.0 Authorization      │  ││
│  │  │ (Google OAuth)   │     │  Server                        │  ││
│  │  │                  │     │                                │  ││
│  │  │ ───────────────  │     │  GET  /oauth/authorize         │  ││
│  │  │ Learning Platform│     │  POST /oauth/token             │  ││
│  │  │ Admin Areas      │     │  POST /oauth/revoke            │  ││
│  │  │                  │     │  GET  /oauth/userinfo          │  ││
│  │  └──────────────────┘     │  GET  /.well-known/openid-...  │  ││
│  │                           │                                │  ││
│  │                           │  ALL Users (Team + Clients):   │  ││
│  │                           │  - Clarity Canvas              │  ││
│  │                           │  - Client Portals              │  ││
│  │                           │  - Central Command (admin)     │  ││
│  │                           │  - Better Contacts (external)  │  ││
│  │                           │  - SP33D (future)              │  ││
│  │                           └──────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Shared User Table                          ││
│  │                                                              ││
│  │  User { id, authId, email, userType, clientPortalId }       ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
                                │
                                │ OAuth 2.0 Bearer Tokens
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                     External Products                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Better       │  │    SP33D     │  │   Talking    │          │
│  │ Contacts     │  │              │  │    Docs      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

**OAuth Flows Supported:**
1. **Authorization Code + PKCE** (for SPAs and external apps)
2. **Client Credentials** (for server-to-server, if needed)
3. **Refresh Token Rotation** (RFC 9700 compliant)

**Pros:**
- Industry standard authentication
- Works across any domain
- Granular scopes (read:profile, write:synthesis)
- User consent for third-party access
- Token revocation capability
- Future-proof for new products

**Cons:**
- Significant implementation effort (2-3 weeks)
- New infrastructure (Redis for session storage)
- Learning curve for team
- Must migrate existing clients

**Verdict:** Correct long-term solution for Clarity Companion API.

---

### Solution 3: Hybrid OAuth + Simplified First-Party Auth (Recommended Balance)

**Description:** Full OAuth for external products, simplified token-based auth for first-party portals.

**Key insight:** Client portals (Tradeblock, PLYA, etc.) don't need full OAuth consent flow. They're first-party applications where users expect seamless access.

**Two authentication paths:**

**Path A: First-Party Portals (simplified)**
```
User logs in to Tradeblock portal
    ↓
Email + password verified against ClientCredential table
    ↓
Issue JWT access token (no consent screen needed)
    ↓
Store refresh token in database
    ↓
Token used for Clarity Canvas, Companion API, etc.
```

**Path B: Third-Party Apps (full OAuth)**
```
User clicks "Connect to Better Contacts"
    ↓
Redirect to /oauth/authorize?client_id=better-contacts&...
    ↓
User sees consent: "Better Contacts wants to access your profile"
    ↓
User clicks "Allow"
    ↓
Redirect back with authorization code
    ↓
Better Contacts exchanges code for tokens
```

**Implementation:**
- Mark OAuth clients as `isFirstParty: true/false`
- First-party clients skip consent screen
- Both paths issue same token format
- Same validation for Companion API

**Pros:**
- Best UX for internal products (no consent screen)
- Full security for external products
- Unified token format everywhere
- Gradual migration path

**Cons:**
- Slightly more complexity than pure OAuth
- Must correctly categorize first-party vs third-party

**Verdict:** Best balance of security and UX.

---

## 7) Recommendation

**Recommended approach: Solution 3 (Hybrid OAuth + Simplified First-Party Auth)**

### Implementation Phases

**Phase 1: Database Foundation (Week 1)**
- Add `ClientCredential` table for portal passwords
- Add OAuth tables (OAuthClient, etc.)
- Migrate existing env-var passwords to database
- Create admin UI for credential management

**Phase 2: Token Infrastructure (Week 2)**
- Set up node-oidc-provider with Prisma adapter
- Implement JWT access tokens (RS256)
- Implement refresh token rotation
- Add Redis for session storage

**Phase 3: First-Party Migration (Week 3-4)**
- Update client portal login to issue tokens
- Update Clarity Canvas to accept tokens
- Update Central Command to use tokens
- Run parallel auth (iron-session + tokens)

**Phase 4: Third-Party OAuth (Week 5-6)**
- Implement full authorization code flow
- Build consent screen UI
- Register Better Contacts as OAuth client
- Test end-to-end OAuth flow

**Phase 5: Companion API Integration (Week 7-8)**
- Enable Companion API to validate OAuth tokens
- Implement scope-based access control
- Test Better Contacts integration
- Deprecate iron-session for migrated routes

**Phase 6: Cleanup (Week 9-10)**
- Remove env-var password checks
- Remove deprecated auth routes
- Update documentation
- Archive old auth code

---

## 8) Clarifications Needed

1. **Redis requirement:** Are you okay adding Redis to the Railway stack? (Needed for OAuth session storage)
   > **Impact:** $5-10/month additional cost, but required for production OAuth
   >> yes, not a problem

2. **Admin UI scope:** Should credential management be part of Central Command or a separate admin area?
   > **Recommendation:** Add to Central Command (already admin-only)
   >> separate admin area. central command is a specific workflow for processing client funnel

3. **Existing session handling:** When we migrate a client to OAuth, should we:
   - Force re-login (cleaner, but disruptive)
   - Silently upgrade session to token (complex, but seamless)
   > **Recommendation:** Force re-login with clear messaging
   >> force re-login is fine

4. **Scope granularity:** What scopes should we define?
   - `read:profile` / `write:profile`
   - `read:synthesis` / `write:synthesis`
   - `read:personas` / `write:personas`
   - `admin:*` (for Central Command)
   > **Recommendation:** Start minimal, add as needed
   >> we don't need personas for now. as described earlier: each external product, like better contacts, needs to be able to access the full clarity canvas profile in all detail, even though the idea is that each external product would have its own purpose – designed synthesis of the clarity canvas focused on the parts of that canvas that are relevant to the tool being used (eg. the synthesis for our marketing automation tool would wanna focus heavily on things like go to market or target customers and messaging if that stuff was available in the clarity canvas). One question I'd like to get your thoughts and recommendations on: for that synthesis, should the external product created? Or should the clarity canvas created? Again, the ultimate vision is that you have a synthesis which is treated almost as a system prompt in that external product, but if, in the process of using that product for some specific purpose, it becomes clear that it would be useful to go pull more details from the clarity, canvas, or maybe pull information from a part of the clarity canvas that is not typically included in the synthesis for whichever product is being used, the API also gives the system the ability to do that. We don't need to design how it does that in the spec, we just need to make sure we design our API to be able to handle that when I'm ready to implement more smart referencing in the future. And version one, it will be something that the user just has to manually trigger by saying something like, "go look for xyz in my clarity canvas and pull it into this conversation / workflow as context" 

5. **Token lifetimes:**
   - Access token: 15 minutes (recommended) or longer?
   - Refresh token: 14 days (recommended) or longer?
   > **Impact:** Shorter = more secure, longer = better UX
   >> I trust your recs here

---

## 9) Security Considerations

### Current Vulnerabilities to Address

| Issue | Severity | Resolution |
|-------|----------|------------|
| Central Command uses `===` not `secureCompare()` | Medium | Fix immediately or migrate to OAuth |
| No rate limiting on client-auth | Medium | Add rate limiting to OAuth token endpoint |
| Passwords in env vars (no rotation) | Low | Database-backed credentials with rotation |
| No account lockout on failed attempts | Medium | OAuth handles this with token policies |

### OAuth Security Best Practices

1. **PKCE required** for all public clients (SPAs, mobile)
2. **Refresh token rotation** with reuse detection
3. **Short access token lifetime** (15 minutes)
4. **Secure token storage** (bcrypt hashed in database)
5. **HTTPS only** (already enforced)
6. **Redirect URI validation** (exact match)

---

## 10) Connection to Clarity Companion API

This auth modernization is a **prerequisite** for the Clarity Companion API:

```
┌──────────────────────┐
│   Auth Modernization │  ← This spec
│   (OAuth 2.0 Provider)│
└──────────┬───────────┘
           │ Tokens
           ▼
┌──────────────────────┐
│  Clarity Companion   │  ← Separate spec
│  API                 │
│                      │
│  GET /companion/context
│  POST /companion/synthesize
│  GET /companion/[tool]
└──────────┬───────────┘
           │ Context
           ▼
┌──────────────────────┐
│  External Products   │
│  (Better Contacts,   │
│   SP33D, etc.)       │
└──────────────────────┘
```

**Dependency:** Companion API cannot be implemented until OAuth tokens are available for cross-product authentication.

**Recommendation:** Implement auth modernization first, then Companion API.

---

## 11) Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `lib/oauth/provider.ts` | node-oidc-provider configuration |
| `lib/oauth/adapters/prisma.ts` | Prisma adapter for OIDC |
| `lib/oauth/scopes.ts` | Scope definitions and validation |
| `lib/oauth/tokens.ts` | Token generation and validation |
| `app/api/oauth/authorize/route.ts` | Authorization endpoint |
| `app/api/oauth/token/route.ts` | Token exchange endpoint |
| `app/api/oauth/revoke/route.ts` | Token revocation |
| `app/api/oauth/userinfo/route.ts` | User info endpoint |
| `app/oauth/consent/page.tsx` | Consent screen UI |
| `app/admin/credentials/page.tsx` | Credential management UI |

### Modified Files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add OAuth + ClientCredential models |
| `lib/clients.ts` | Use database instead of env vars |
| `lib/session.ts` | Add token validation |
| `lib/client-session-bridge.ts` | Support OAuth tokens |
| `app/api/client-auth/route.ts` | Issue tokens instead of session |
| `server.js` (new) | Custom server for OAuth provider |
| `railway.toml` | Update start command |

---

## 12) Database Migration Script

```sql
-- 1. Create ClientCredential table for portal passwords
CREATE TABLE client_credentials (
  id VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Migrate existing clients (run once, manually)
-- Passwords hashed with bcrypt before insert
INSERT INTO client_credentials (id, client_id, hashed_password, email) VALUES
  (gen_random_uuid(), 'tradeblock', '$2b$10$...', 'tradeblock@email.com'),
  (gen_random_uuid(), 'plya', '$2b$10$...', 'plya@email.com'),
  (gen_random_uuid(), 'wsbc', '$2b$10$...', 'wsbc@email.com'),
  (gen_random_uuid(), 'scott-arnett', '$2b$10$...', 'scott@email.com'),
  (gen_random_uuid(), 'noggin-guru', '$2b$10$...', 'noggin@email.com');

-- 3. Add OAuth tables
-- (Full schema in section 5)
```

---

*Last Updated: February 2026*
