# Website Architecture Guide

This guide covers the overall architecture of the web-decks system - a Next.js 14 application for hosting premium client portals with password-protected scrollytelling presentations.

## 0. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS APP ROUTER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Browser Request                                                       │
│        │                                                                │
│        ▼                                                                │
│   ┌──────────────────┐                                                  │
│   │   middleware.ts   │  ─── Adds security headers (X-Frame-Options,   │
│   └────────┬─────────┘       X-Content-Type-Options, Referrer-Policy)  │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                        ROUTES                                 │     │
│   ├──────────────────────────────────────────────────────────────┤     │
│   │                                                               │     │
│   │  /                           → LandingPage (public)           │     │
│   │                                                               │     │
│   │  /client-portals/[client]    → PasswordGate OR ContentIndex   │     │
│   │       │                        (session-based auth)           │     │
│   │       │                                                       │     │
│   │       └─ /[slug]             → Dynamic Deck Component         │     │
│   │                                                               │     │
│   │  /api/auth/[client]          → POST: Login / DELETE: Logout   │     │
│   │  /api/health                 → Health check for Railway       │     │
│   │                                                               │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                    DATA FLOW                                   │    │
│   ├───────────────────────────────────────────────────────────────┤    │
│   │                                                                │    │
│   │  lib/clients.ts   ─────────────────────────────────────────▶  │    │
│   │  (Client config)      ↓                                       │    │
│   │                   getClient()                                  │    │
│   │                   getClientContent()                           │    │
│   │                   getClientPassword()                          │    │
│   │                                                                │    │
│   │  lib/session.ts   ─────────────────────────────────────────▶  │    │
│   │  (iron-session)       ↓                                       │    │
│   │                   getSessionOptions()                          │    │
│   │                   isSessionValidForClient()                    │    │
│   │                                                                │    │
│   │  Environment Variables ────────────────────────────────────▶  │    │
│   │  (.env / Railway)     ↓                                       │    │
│   │                   SESSION_SECRET                               │    │
│   │                   TRADEBLOCK_PASSWORD                          │    │
│   │                   PLYA_PASSWORD                                │    │
│   │                                                                │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

External Dependencies:
  ├── Railway (hosting, auto-deploy from GitHub)
  ├── iron-session (encrypted cookie-based sessions)
  └── Framer Motion (animations)
```

## 1. Dependencies & Key Functions

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^14.2.0 | App Router, SSR, API routes |
| `react` / `react-dom` | ^18.2.0 | UI framework |
| `framer-motion` | ^11.0.0 | Scroll animations, transitions |
| `iron-session` | ^8.0.0 | Encrypted cookie sessions |
| `tailwindcss` | ^3.4.0 | Utility CSS |

### Internal Module Dependencies

```
lib/clients.ts
  └── Provides: getClient(), getClientContent(), getClientPassword()
  └── Used by: app/client-portals/[client]/page.tsx
               app/client-portals/[client]/[slug]/page.tsx
               app/api/auth/[client]/route.ts

lib/session.ts
  └── Provides: getSessionOptions(), isSessionValidForClient(), SessionData
  └── Used by: app/client-portals/[client]/page.tsx
               app/client-portals/[client]/[slug]/page.tsx
               app/api/auth/[client]/route.ts
```

### Key Exported Functions

| Function | File | Purpose |
|----------|------|---------|
| `getClient(clientId)` | `lib/clients.ts` | Returns client config by ID (case-insensitive) |
| `getClientContent(clientId, slug)` | `lib/clients.ts` | Returns specific content item |
| `getClientPassword(clientId)` | `lib/clients.ts` | Returns password from env var |
| `getSessionOptions()` | `lib/session.ts` | Returns iron-session config |
| `isSessionValidForClient(session, clientId)` | `lib/session.ts` | Validates session for client |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | Yes | 32-byte hex string for session encryption |
| `TRADEBLOCK_PASSWORD` | Yes | Password for Tradeblock portal |
| `PLYA_PASSWORD` | Yes | Password for PLYA portal |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for metadata (default: Railway URL) |
| `PORT` | Auto | Set by Railway for deployment |

## 2. User Experience Flow

### Landing Page (`/`)

1. User visits root URL
2. Sees 33 Strategies brand page with animated geometric logo
3. "Coming Soon" badge displayed
4. Contact email shown

### Client Portal Login (`/client-portals/[client]`)

1. User visits `/client-portals/plya` or `/client-portals/tradeblock`
2. Server Component checks session via `getIronSession()`
3. **If not authenticated**: Shows `PasswordGate` component
   - User enters password
   - Form POSTs to `/api/auth/[client]`
   - API validates using timing-safe comparison
   - On success: Sets session cookie, refreshes page
4. **If authenticated**: Shows `ContentIndex` component
   - Lists all content items for that client
   - Each tile links to `/client-portals/[client]/[slug]`

### Viewing Content (`/client-portals/[client]/[slug]`)

1. Server Component validates session
2. **If not authenticated**: Redirects to portal page (shows password gate)
3. **If authenticated**: Renders the content component dynamically
4. Component is a full scrollytelling presentation

### Session Lifecycle

- **Created**: On successful password submission
- **Persists**: 7 days (cookie-based, encrypted)
- **Scope**: Per-client (session stores `clientId`)
- **Destroyed**: On logout (`DELETE /api/auth/[client]`) or cookie expiry

## 3. File & Code Mapping

### Critical Files

| File | Responsibility |
|------|----------------|
| `lib/clients.ts` | **Central config** - all clients and content defined here |
| `lib/session.ts` | Session configuration and validation helpers |
| `middleware.ts` | Security headers (runs on all requests) |
| `app/layout.tsx` | Root layout with fonts, global metadata |
| `app/client-portals/[client]/page.tsx` | Portal index - auth gate + content list |
| `app/client-portals/[client]/[slug]/page.tsx` | Content renderer |
| `app/api/auth/[client]/route.ts` | Login/logout API |
| `railway.toml` | Deployment configuration |

### Directory Structure

```
/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   ├── opengraph-image.tsx       # OG image generator
│   ├── client-portals/
│   │   ├── page.tsx              # Redirect to home
│   │   ├── [client]/
│   │   │   ├── page.tsx          # Portal index (auth + content list)
│   │   │   ├── opengraph-image.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Content renderer
│   └── api/
│       ├── auth/[client]/route.ts
│       └── health/route.ts
│
├── components/
│   ├── landing/
│   │   └── LandingPage.tsx       # Root landing page UI
│   ├── portal/
│   │   ├── PasswordGate.tsx      # Login form
│   │   └── ContentIndex.tsx      # Content listing
│   └── clients/
│       ├── plya/
│       │   ├── PLYAProposal.tsx  # PLYA proposal deck
│       │   └── IPFrameworkDeck.tsx # IP framework deck
│       └── tradeblock/
│           └── TradeblockAIInflection.tsx
│
├── lib/
│   ├── clients.ts                # Client configuration
│   └── session.ts                # Session management
│
├── styles/
│   └── globals.css               # Global styles + font imports
│
└── developer-guides/             # This documentation
```

### UX-to-Code Mapping

| User Action | Files Involved |
|-------------|----------------|
| Visit landing page | `app/page.tsx` → `components/landing/LandingPage.tsx` |
| Visit client portal | `app/client-portals/[client]/page.tsx` → `lib/clients.ts` → `components/portal/PasswordGate.tsx` or `ContentIndex.tsx` |
| Submit password | `components/portal/PasswordGate.tsx` → `app/api/auth/[client]/route.ts` → `lib/session.ts` |
| View deck | `app/client-portals/[client]/[slug]/page.tsx` → `lib/clients.ts` → `components/clients/[client]/[DeckComponent].tsx` |

## 4. Connections to Other Parts

### Data Sources

- **Client configuration**: Hard-coded in `lib/clients.ts` (no database)
- **Passwords**: Environment variables
- **Session data**: Encrypted cookies (no server-side storage)

### Shared Resources

| Resource | Location | Used By |
|----------|----------|---------|
| Brand colors (GOLD, BG_PRIMARY) | Each component defines locally | All UI components |
| Font families | `app/layout.tsx`, `tailwind.config.ts` | All components |
| Session cookie | Browser | Auth flow, protected routes |

### Event Flow

```
User submits password
    └── PasswordGate.tsx (client)
        └── POST /api/auth/[client]
            └── route.ts validates password
                └── Sets iron-session cookie
                    └── router.refresh() reloads page
                        └── Server component sees valid session
                            └── Shows ContentIndex instead of PasswordGate
```

### Side Effects

- **Cookies written**: On login (`session.save()`)
- **Cookies destroyed**: On logout (`session.destroy()`)
- **No file system writes**: Pure stateless app
- **No database writes**: No database used

## 5. Critical Notes & Pitfalls

### Security

- **Timing-safe password comparison**: Uses `crypto.timingSafeEqual()` to prevent timing attacks (`app/api/auth/[client]/route.ts:9-22`)
- **Session encryption**: `SESSION_SECRET` must be 32 bytes hex - generate with `openssl rand -hex 32`
- **Cookie flags**: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production
- **iron-session cannot run in middleware**: Edge Runtime incompatible - auth checks happen in Server Components

### Performance

- **Dynamic imports**: All deck components use `next/dynamic` with `ssr: true` for code splitting
- **Lazy loading**: Deck components only loaded when accessed
- **No runtime database**: All config is compile-time, zero cold-start latency

### Data Integrity

- **Case-insensitive client IDs**: `getClient()` normalizes to lowercase, session stores lowercase
- **Content items immutable**: Defined at build time, no runtime changes

### Error Handling

- **Missing client**: Returns 404 via `notFound()`
- **Missing content**: Returns 404 via `notFound()`
- **Missing password env var**: Logs error, returns 500
- **Invalid password**: Returns 401 with error message

### Known Gotchas

1. **Adding a new client requires deployment**: Clients defined in `lib/clients.ts`, not configurable at runtime
2. **Session per-client**: Logging into PLYA doesn't grant access to Tradeblock
3. **Font import in globals.css**: Instrument Serif loaded via Google Fonts URL import
4. **Railway start command**: Must use `-H 0.0.0.0 -p $PORT` or 502 errors occur

## 6. Common Development Scenarios

### Scenario 1: Adding a New Client Portal

**What needs to change:**

1. **`lib/clients.ts`**: Add client entry to `clients` object
   ```typescript
   'newclient': {
     id: 'newclient',
     name: 'New Client',
     passwordEnvVar: 'NEWCLIENT_PASSWORD',
     content: [],
   }
   ```

2. **Environment**: Add `NEWCLIENT_PASSWORD=password` to `.env` and Railway

**Common mistakes:**
- Forgetting to add password env var (causes 500 error)
- Using uppercase in client ID (works but inconsistent)

**Verification:**
- Visit `/client-portals/newclient`
- Should see password gate
- Enter password, should see empty content index

### Scenario 2: Adding a New Deck to Existing Client

**What needs to change:**

1. **Create component**: `components/clients/[client]/NewDeck.tsx`
2. **`lib/clients.ts`**: Add dynamic import and content item
   ```typescript
   const NewDeck = dynamic(
     () => import('@/components/clients/[client]/NewDeck'),
     { ssr: true }
   );

   // In content array:
   {
     slug: 'new-deck',
     type: 'deck',
     title: 'New Deck Title',
     description: 'Description shown in portal',
     component: NewDeck,
   }
   ```

**Common mistakes:**
- Forgetting `'use client'` directive (if component uses hooks/state)
- Not using dynamic import (bundle size bloat)
- Duplicate slugs (last one wins)

**Verification:**
- `npm run build` - should compile without errors
- Login to client portal, new tile should appear

### Scenario 3: Debugging Authentication Issues

**Symptoms:** User can't log in, or session doesn't persist

**Troubleshooting steps:**

1. Check env vars are set:
   ```bash
   # Local
   grep PASSWORD .env

   # Railway
   railway variables
   ```

2. Check session secret is 32 bytes hex:
   ```bash
   echo $SESSION_SECRET | wc -c  # Should be 65 (64 chars + newline)
   ```

3. Check browser cookies in DevTools:
   - Cookie name: `33strategies-session`
   - Should be HttpOnly, Secure (in prod)

4. Check API response:
   ```bash
   curl -X POST http://localhost:3000/api/auth/plya \
     -H "Content-Type: application/json" \
     -d '{"password":"test"}'
   ```

**Files involved:** `lib/session.ts`, `app/api/auth/[client]/route.ts`

## 7. Testing Strategy

### Manual Testing Checklist

- [ ] Landing page loads with animation
- [ ] `/client-portals/plya` shows password gate
- [ ] Wrong password shows error message
- [ ] Correct password redirects to content index
- [ ] Content tiles link to correct deck URLs
- [ ] Deck pages require authentication (redirect if not logged in)
- [ ] Session persists across browser refresh
- [ ] Session works after 24 hours (within 7-day expiry)

### Smoke Tests

```bash
# Build succeeds
npm run build

# Dev server starts
npm run dev

# Health check works
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Protected route redirects
curl -I http://localhost:3000/client-portals/plya/project-proposal
# Expected: 307 redirect to /client-portals/plya
```

### Debugging Tips

- **Session issues**: Check cookie in Application tab of DevTools
- **Component not rendering**: Check for `'use client'` directive
- **Build errors**: Check TypeScript types in `lib/clients.ts`
- **Railway 502**: Check start command includes `-H 0.0.0.0`

## 8. Quick Reference

### Start Commands

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run start    # Production server (uses PORT env var)
npm run lint     # ESLint check
```

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Landing page |
| `/client-portals/[client]` | GET | Portal index (auth required) |
| `/client-portals/[client]/[slug]` | GET | View deck (auth required) |
| `/api/auth/[client]` | POST | Login with password |
| `/api/auth/[client]` | DELETE | Logout |
| `/api/health` | GET | Health check for Railway |

### Configuration Summary

| Config | Location | Notes |
|--------|----------|-------|
| Clients | `lib/clients.ts` | Add new clients here |
| Sessions | `lib/session.ts` | 7-day expiry, cookie-based |
| Fonts | `app/layout.tsx` | DM Sans (body), JetBrains Mono (mono) |
| Fonts | `styles/globals.css` | Instrument Serif (display) |
| Colors | `tailwind.config.ts` | gold, brand.bg, brand.elevated |
| Deployment | `railway.toml` | Health check, start command |

### Critical Files Checklist

1. `lib/clients.ts` - Client/content configuration
2. `lib/session.ts` - Session management
3. `app/client-portals/[client]/page.tsx` - Portal entry point
4. `app/api/auth/[client]/route.ts` - Authentication API
5. `middleware.ts` - Security headers
6. `railway.toml` - Deployment config
7. `.env.example` - Required environment variables

### Important Constants

| Constant | Value | Location | Rationale |
|----------|-------|----------|-----------|
| Session expiry | 7 days | `lib/session.ts:29` | Balance security vs. convenience |
| Cookie name | `33strategies-session` | `lib/session.ts:24` | Unique per app |
| Health check timeout | 100s | `railway.toml:15` | Allow for cold starts |
| Max restart retries | 10 | `railway.toml:19` | Prevent infinite restart loops |
