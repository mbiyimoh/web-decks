# Client Portals Developer Guide

This guide covers the client portal system - password-protected areas where clients access their decks, proposals, and documents.

## 0. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CLIENT PORTAL SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Browser visits /client-portals/plya                                    │
│        │                                                                │
│        ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ app/client-portals/[client]/page.tsx (Server Component)         │   │
│  │                                                                  │   │
│  │  1. getClient(clientId) ──────────────────▶ lib/clients.ts      │   │
│  │     └── Returns client config or undefined                       │   │
│  │                                                                  │   │
│  │  2. getIronSession() ─────────────────────▶ lib/session.ts      │   │
│  │     └── Reads encrypted cookie                                   │   │
│  │                                                                  │   │
│  │  3. isSessionValidForClient(session, clientId)                   │   │
│  │     └── Validates session.clientId matches                       │   │
│  │                                                                  │   │
│  │  4. Render decision:                                             │   │
│  │     ├── NOT FOUND ─────────▶ notFound() → 404 page              │   │
│  │     ├── NOT AUTH ──────────▶ <PasswordGate />                   │   │
│  │     └── AUTHENTICATED ─────▶ <ContentIndex />                   │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ AUTHENTICATION FLOW                                              │   │
│  │                                                                  │   │
│  │  PasswordGate (Client Component)                                 │   │
│  │       │                                                          │   │
│  │       │ POST /api/auth/[client]                                  │   │
│  │       │ Body: { password: "..." }                                │   │
│  │       ▼                                                          │   │
│  │  app/api/auth/[client]/route.ts                                  │   │
│  │       │                                                          │   │
│  │       ├── getClientPassword() ────▶ process.env[passwordEnvVar] │   │
│  │       ├── secureCompare(input, expected) ─▶ timing-safe check   │   │
│  │       │                                                          │   │
│  │       ├── SUCCESS: session.save() + { success: true }           │   │
│  │       └── FAILURE: { error: "Invalid password" }, 401           │   │
│  │                                                                  │   │
│  │  PasswordGate calls router.refresh() → page re-renders          │   │
│  │  Server Component now sees valid session → shows ContentIndex   │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ CONTENT VIEWING                                                  │   │
│  │                                                                  │   │
│  │  /client-portals/[client]/[slug]                                │   │
│  │       │                                                          │   │
│  │       ├── Validate session                                       │   │
│  │       │   └── If invalid: redirect to /client-portals/[client]  │   │
│  │       │                                                          │   │
│  │       ├── getClientContent(clientId, slug)                      │   │
│  │       │   └── Returns ContentItem with component reference       │   │
│  │       │                                                          │   │
│  │       └── Render: <Component />                                  │   │
│  │           └── Dynamic import from components/clients/[client]/  │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Data Sources:
  ├── lib/clients.ts (compile-time config)
  ├── Environment variables (passwords)
  └── Encrypted cookies (session state)
```

## 1. Dependencies & Key Functions

### External Dependencies

| Package | Purpose in Client Portals |
|---------|---------------------------|
| `iron-session` | Encrypted cookie-based sessions |
| `next/navigation` | `redirect()`, `notFound()` |
| `next/dynamic` | Lazy-load deck components |
| `framer-motion` | Portal UI animations |

### Internal Dependencies

```
lib/clients.ts
├── ContentItem (interface) - slug, type, title, description, component
├── ClientEntry (interface) - id, name, passwordEnvVar, content[]
├── getClient(clientId) - lookup client by ID
├── getClientContent(clientId, slug) - lookup specific content
├── getClientPassword(clientId) - get password from env
└── getAllClientIds() - list all client IDs

lib/session.ts
├── SessionData (interface) - isLoggedIn, clientId?
├── getSessionOptions() - iron-session config
└── isSessionValidForClient(session, clientId) - validate session
```

### Provided Interfaces

| Interface | Location | Description |
|-----------|----------|-------------|
| `ContentItem` | `lib/clients.ts:4-10` | Content piece with slug, type, title, component |
| `ClientEntry` | `lib/clients.ts:12-17` | Client config with ID, name, password env var, content |
| `SessionData` | `lib/session.ts:3-6` | Session shape with isLoggedIn and clientId |

### Environment Variables

| Variable | Pattern | Example |
|----------|---------|---------|
| `[CLIENT]_PASSWORD` | `PLYA_PASSWORD`, `TRADEBLOCK_PASSWORD` | Actual password string |
| `SESSION_SECRET` | 32-byte hex | `a1b2c3d4...` (64 chars) |

## 2. User Experience Flow

### Portal Discovery

There is no portal directory. Users receive direct links to their portal:
- `https://web-decks-production.up.railway.app/client-portals/plya`
- Visiting `/client-portals` redirects to home (`/`)

### Login Flow

1. User visits `/client-portals/plya`
2. Sees password gate with:
   - "Client Portal" label (gold)
   - "PLYA" heading (white)
   - Password input (autofocused)
   - "Access Portal" button (gold)
3. Enters password, clicks button
4. **On error**: Red error message appears, can retry
5. **On success**: Page refreshes, shows content index

### Content Index

After login, user sees:
- "Client Portal" label (gold)
- Client name as h1 (e.g., "PLYA")
- List of content tiles **sorted by `addedOn` date (newest first)**:
  - **Most recent item**: Gold border, glow effect, prominent styling
  - **All other items**: Subtle white border
- Each tile shows: type badge, title, description, date added, arrow

### Viewing Content

1. User clicks content tile
2. Navigates to `/client-portals/plya/project-proposal`
3. Full-screen deck/proposal renders
4. Scroll through presentation
5. Can navigate back to portal index

### Session Lifecycle

| Event | What Happens |
|-------|--------------|
| Login success | Cookie created, 7-day expiry |
| Return visit (within 7 days) | Cookie valid, skip password gate |
| Cookie expires | Password gate shown again |
| Logout (DELETE /api/auth/[client]) | Cookie destroyed |
| Visit different client portal | Separate validation (must log in) |

## 3. File & Code Mapping

### Critical Files

| File | Responsibility |
|------|----------------|
| `lib/clients.ts` | **Master config** - all clients and content defined here |
| `lib/session.ts` | Session options and validation helpers |
| `app/client-portals/[client]/page.tsx` | Portal entry point (auth gate logic) |
| `app/client-portals/[client]/[slug]/page.tsx` | Content renderer |
| `app/api/auth/[client]/route.ts` | Login/logout API endpoints |
| `components/portal/PasswordGate.tsx` | Login form UI |
| `components/portal/ContentIndex.tsx` | Content listing UI |
| `app/client-portals/[client]/opengraph-image.tsx` | Dynamic OG images |

### Directory Structure

```
app/client-portals/
├── page.tsx                    # Redirect to home
├── [client]/
│   ├── page.tsx                # Portal index (PasswordGate or ContentIndex)
│   ├── opengraph-image.tsx     # Dynamic OG image per client
│   └── [slug]/
│       └── page.tsx            # Content renderer

components/portal/
├── PasswordGate.tsx            # Login form (client component)
└── ContentIndex.tsx            # Content tiles (client component)

components/clients/
├── plya/
│   ├── PLYAProposal.tsx        # PLYA proposal deck
│   └── IPFrameworkDeck.tsx     # IP framework deck
└── tradeblock/
    └── TradeblockAIInflection.tsx
```

### UX-to-Code Mapping

| User Action | Files Involved |
|-------------|----------------|
| Visit portal URL | `[client]/page.tsx` → `lib/clients.ts` → `lib/session.ts` |
| See password gate | `[client]/page.tsx` → `PasswordGate.tsx` |
| Submit password | `PasswordGate.tsx` → `/api/auth/[client]/route.ts` |
| See content list | `[client]/page.tsx` → `ContentIndex.tsx` |
| Click content tile | `ContentIndex.tsx` → `[client]/[slug]/page.tsx` |
| View deck | `[slug]/page.tsx` → `components/clients/[client]/[Deck].tsx` |

## 4. Connections to Other Parts

### Data Flow

```
lib/clients.ts
    │
    ├──▶ app/client-portals/[client]/page.tsx (reads client config)
    ├──▶ app/client-portals/[client]/[slug]/page.tsx (reads content)
    ├──▶ app/api/auth/[client]/route.ts (reads password env var)
    └──▶ app/client-portals/[client]/opengraph-image.tsx (reads client name)

lib/session.ts
    │
    ├──▶ app/client-portals/[client]/page.tsx (validates session)
    ├──▶ app/client-portals/[client]/[slug]/page.tsx (validates session)
    └──▶ app/api/auth/[client]/route.ts (creates/destroys session)

Environment Variables
    │
    └──▶ lib/clients.ts:getClientPassword() → process.env[passwordEnvVar]
```

### Shared Resources

| Resource | Location | Consumers |
|----------|----------|-----------|
| Brand colors (GOLD, BG_PRIMARY) | Defined in each component | PasswordGate, ContentIndex, OG image |
| Session cookie | Browser | All portal pages |
| Font families | `app/layout.tsx` | All components |

### Side Effects

| Action | Side Effect |
|--------|-------------|
| Successful login | Cookie written to browser |
| Logout | Cookie destroyed |
| Invalid client ID | 404 page rendered |
| No other external effects | No database, no file writes |

## 5. Critical Notes & Pitfalls

### Security

**Timing-safe password comparison** (`app/api/auth/[client]/route.ts:9-22`):
```typescript
function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      timingSafeEqual(bufA, bufA); // Constant time even for length mismatch
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
```

**Per-client session isolation**: Session stores `clientId` - logging into PLYA doesn't grant Tradeblock access.

**Missing password env var**: Returns 500 error with server-side log (doesn't expose env var name to client).

### Data Integrity

**Case normalization**: Client IDs normalized to lowercase in:
- `getClient()`: `clients[clientId.toLowerCase()]`
- Session storage: `session.clientId = clientId.toLowerCase()`
- Session validation: `session.clientId === clientId.toLowerCase()`

**Slug uniqueness**: Within a client, slugs must be unique. First match wins in `content.find()`.

### Error Handling

| Error | Handling | User Experience |
|-------|----------|-----------------|
| Unknown client ID | `notFound()` | 404 page |
| Unknown slug | `notFound()` | 404 page |
| Wrong password | 401 response | Error message in form |
| Missing password env var | 500 response | Generic error |
| Session expired | Redirect to portal | Password gate shown |

### Known Gotchas

1. **Components must use dynamic import**: Direct imports break code splitting
   ```typescript
   // WRONG
   import PLYAProposal from '@/components/clients/plya/PLYAProposal';

   // CORRECT
   const PLYAProposal = dynamic(
     () => import('@/components/clients/plya/PLYAProposal'),
     { ssr: true }
   );
   ```

2. **Can't pass component to Client Component**: ContentIndex receives serialized data, not component references
   ```typescript
   // In page.tsx (Server Component)
   const clientData = {
     id: client.id,
     name: client.name,
     content: client.content.map(item => ({
       slug: item.slug,
       type: item.type,
       title: item.title,
       description: item.description,
       // NO component here - can't serialize functions
     })),
   };
   ```

3. **Most recent item gets highlighted**: The item with the most recent `addedOn` date gets gold border/glow in ContentIndex, regardless of content type. Items are sorted newest-first.

## 6. Common Development Scenarios

### Scenario 1: Adding a New Client Portal

**Steps:**

1. **Create password env var** in `.env` and Railway:
   ```bash
   NEWCLIENT_PASSWORD=secure_password_here
   ```

2. **Add client config** in `lib/clients.ts`:
   ```typescript
   export const clients: Record<string, ClientEntry> = {
     // ... existing clients
     'newclient': {
       id: 'newclient',
       name: 'New Client',
       passwordEnvVar: 'NEWCLIENT_PASSWORD',
       content: [],  // Empty initially
     },
   };
   ```

3. **Deploy** - portal is immediately accessible at `/client-portals/newclient`

**Common mistakes:**
- Forgetting to add env var to Railway (works locally, 500 in prod)
- Using spaces in client ID (use kebab-case)
- Mismatching `id` and object key

**Verification:**
- `npm run build` succeeds
- Visit `/client-portals/newclient` locally
- Password gate appears
- Correct password grants access to empty content list

### Scenario 2: Adding Content to Existing Client

**Steps:**

1. **Create component** at `components/clients/[client]/NewDeck.tsx`:
   ```typescript
   'use client';

   export default function NewDeck() {
     return (
       <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
         {/* Deck content */}
       </div>
     );
   }
   ```

2. **Add dynamic import** in `lib/clients.ts`:
   ```typescript
   const NewDeck = dynamic(
     () => import('@/components/clients/[client]/NewDeck'),
     { ssr: true }
   );
   ```

3. **Add to content array** in `lib/clients.ts`:
   ```typescript
   content: [
     // ... existing content
     {
       slug: 'new-deck',
       type: 'deck',  // or 'proposal' or 'document'
       title: 'New Deck Title',
       description: 'Optional description',
       component: NewDeck,
     },
   ],
   ```

**Common mistakes:**
- Forgetting `'use client'` directive (if using hooks)
- Importing component directly instead of dynamic import
- Duplicate slug with existing content
- Wrong import path

**Verification:**
- `npm run build` succeeds
- New tile appears in content index
- Clicking tile navigates to `/client-portals/[client]/new-deck`
- Component renders correctly

### Scenario 3: Changing a Client Password

**Steps:**

1. **Update env var** in `.env` (local) and Railway:
   ```bash
   railway variables --set "PLYA_PASSWORD=new_password_here"
   ```

2. **Redeploy** (Railway auto-deploys, or run `railway redeploy`)

**Common mistakes:**
- Only updating local `.env` (password still old in production)
- Forgetting to notify client of new password

**Verification:**
- Old password no longer works (401 error)
- New password grants access

### Scenario 4: Debugging "Can't Access Portal"

**Symptoms:** User reports they can't log in

**Troubleshooting steps:**

1. **Check client exists** in `lib/clients.ts`:
   ```bash
   grep -n "clientname" lib/clients.ts
   ```

2. **Check env var is set**:
   ```bash
   # Local
   grep CLIENTNAME_PASSWORD .env

   # Railway
   railway variables | grep CLIENTNAME
   ```

3. **Check password value** (if safe to compare):
   ```bash
   railway run -- printenv CLIENTNAME_PASSWORD
   ```

4. **Check session secret** is valid:
   ```bash
   railway variables | grep SESSION_SECRET
   # Should be 64 hex characters
   ```

5. **Check browser cookies** in DevTools:
   - Cookie name: `33strategies-session`
   - Should be present after successful login

**Files involved:** `lib/clients.ts`, `lib/session.ts`, `app/api/auth/[client]/route.ts`

## 7. Testing Strategy

### Manual Testing Checklist

- [ ] Unknown client ID → 404 page
- [ ] Valid client ID, no session → Password gate
- [ ] Wrong password → Error message, can retry
- [ ] Correct password → Content index
- [ ] Unknown slug → 404 page
- [ ] Valid slug → Deck renders
- [ ] Refresh page after login → Still logged in
- [ ] Wait 7+ days → Session expires, password gate shown
- [ ] Different client portal → Separate login required
- [ ] OG image generates for each client

### Smoke Tests

```bash
# Build succeeds
npm run build

# Client config valid
node -e "console.log(require('./lib/clients').getAllClientIds())"

# Auth endpoint responds
curl -X POST http://localhost:3000/api/auth/plya \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}' \
  -w "\nStatus: %{http_code}\n"
# Expected: {"error":"Invalid password"} Status: 401
```

### Automated Testing Opportunities

| Test | Type | What to Assert |
|------|------|----------------|
| `getClient()` with valid ID | Unit | Returns ClientEntry |
| `getClient()` with invalid ID | Unit | Returns undefined |
| `getClient()` case insensitivity | Unit | 'PLYA' returns same as 'plya' |
| `getClientContent()` lookup | Unit | Returns correct ContentItem |
| `secureCompare()` timing | Unit | Equal time for match/mismatch |
| Auth API success flow | Integration | Sets cookie, returns 200 |
| Auth API failure flow | Integration | No cookie, returns 401 |
| Protected route redirect | Integration | Unauthenticated → redirect |

### Debugging Tips

| Issue | Check |
|-------|-------|
| 500 on login | Password env var missing |
| 404 on portal | Client ID not in `lib/clients.ts` |
| 404 on content | Slug not in client's content array |
| Session not persisting | SESSION_SECRET env var |
| Works locally, fails in prod | Env vars in Railway |

## 8. Quick Reference

### Key Routes

| Route | Method | Auth Required | Purpose |
|-------|--------|---------------|---------|
| `/client-portals/[client]` | GET | No (shows gate) | Portal index |
| `/client-portals/[client]/[slug]` | GET | Yes | View content |
| `/api/auth/[client]` | POST | No | Login |
| `/api/auth/[client]` | DELETE | No | Logout |

### Configuration Summary

**Adding a client:**
```typescript
// lib/clients.ts
'newclient': {
  id: 'newclient',
  name: 'Display Name',
  passwordEnvVar: 'NEWCLIENT_PASSWORD',
  content: [],
}
```

**Adding content:**
```typescript
// lib/clients.ts
{
  slug: 'url-slug',
  type: 'deck' | 'proposal' | 'document',
  title: 'Title',
  description: 'Optional description',
  component: DynamicComponent,
}
```

### Critical Files Checklist

1. `lib/clients.ts` - All client and content configuration
2. `lib/session.ts` - Session management
3. `app/client-portals/[client]/page.tsx` - Portal entry point
4. `app/client-portals/[client]/[slug]/page.tsx` - Content renderer
5. `app/api/auth/[client]/route.ts` - Authentication API
6. `components/portal/PasswordGate.tsx` - Login UI
7. `components/portal/ContentIndex.tsx` - Content listing UI

### Content Display Order & Styling

Content items are **sorted by `addedOn` date (newest first)**. The most recent item receives prominent gold styling regardless of content type.

| Position | ContentIndex Styling |
|----------|---------------------|
| First (newest) | Gold border, gold glow, prominent appearance |
| All others | White border, subtle appearance |

**Note:** Items without an `addedOn` date are sorted to the end of the list.

### Session Constants

| Constant | Value | Location |
|----------|-------|----------|
| Cookie name | `33strategies-session` | `lib/session.ts:24` |
| Session expiry | 7 days | `lib/session.ts:29` |
| Secure cookies | `true` in production | `lib/session.ts:26` |
