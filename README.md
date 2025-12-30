# Web Decks

Password-protected client portals for investor presentations and proposals, built with Next.js 14.

**Live:** https://web-decks-production.up.railway.app

## Features

- **Client portal system** with per-client password protection
- **Learning platform** with NextAuth.js authentication (Google SSO + email/password)
- Full-screen scrollable presentations with smooth Framer Motion animations
- Session management using iron-session (client portals) and NextAuth (learning platform)
- Responsive design with Tailwind CSS
- Deployed on Railway with health checks

## Client Portal Architecture

### Client Portals (iron-session)

Each client gets their own password-protected portal:

- `/client-portals/tradeblock` - Tradeblock portal (AI Inflection deck)
- `/client-portals/plya` - PLYA portal (proposals)
- `/client-portals/wsbc` - WSBC portal (VIP Experience proposals)

### Learning Platform (NextAuth.js)

Internal training platform at `/learning`:

- Google SSO for @33strategies.ai users
- Email/password fallback authentication
- Course catalog with scrollytelling deck modules
- localStorage-based progress tracking

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` with your values:
   ```bash
   # Client portal passwords
   TRADEBLOCK_PASSWORD=your_tradeblock_password
   PLYA_PASSWORD=your_plya_password
   WSBC_PASSWORD=your_wsbc_password
   SESSION_SECRET=your_64_char_hex_secret  # openssl rand -hex 32

   # Learning platform (NextAuth.js)
   NEXTAUTH_SECRET=your_nextauth_secret    # openssl rand -hex 32
   NEXTAUTH_URL=http://localhost:3033
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   LEARNING_PASSWORD=your_learning_password
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3033](http://localhost:3033)

   **Note:** Dev server runs on port **3033** (configured in `package.json`)

## Deployment to Railway

### Initial Setup

1. Push to GitHub
2. Create new project in [Railway](https://railway.app)
3. Connect your GitHub repository
4. Set environment variables:
   ```bash
   # Client portals
   TRADEBLOCK_PASSWORD=...
   PLYA_PASSWORD=...
   WSBC_PASSWORD=...
   SESSION_SECRET=...  # openssl rand -hex 32

   # Learning platform
   NEXTAUTH_SECRET=...        # openssl rand -hex 32
   NEXTAUTH_URL=https://your-domain.railway.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   LEARNING_PASSWORD=...
   ```

### Critical Configuration

The project includes `railway.toml` with required Next.js configuration:

```toml
[deploy]
startCommand = "next start -H 0.0.0.0 -p $PORT"
healthcheckPath = "/api/health"
```

**Why this matters:**
- `-H 0.0.0.0`: Next.js must bind to all interfaces, not just localhost
- `-p $PORT`: Railway provides PORT dynamically (usually 8080)
- Without these flags, Railway returns 502 Bad Gateway

### Troubleshooting 502 Errors

If you see 502 errors but logs show "Ready":
1. Verify start command includes `-H 0.0.0.0 -p $PORT`
2. Check Service Settings → Networking → Target Port (should match PORT or be empty)
3. Verify `/api/health` endpoint returns 200

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- iron-session

## Project Structure

```
web-decks/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth API routes (learning platform)
│   │   ├── client-auth/[client]/ # Per-client auth API (portals)
│   │   └── health/               # Railway health check
│   ├── client-portals/
│   │   ├── [client]/             # Client portal pages
│   │   └── [client]/[slug]       # Content pages
│   ├── learning/                 # Learning platform
│   │   ├── ai-workflow/          # Course modules
│   │   └── components/           # Auth, course cards
│   ├── layout.tsx                # Root layout with fonts
│   └── page.tsx                  # Landing page
├── components/
│   ├── clients/                  # Client-specific content
│   │   ├── tradeblock/           # Tradeblock presentations
│   │   ├── plya/                 # PLYA proposals
│   │   └── wsbc/                 # WSBC proposals
│   ├── deck/                     # Shared deck components (Section, RevealText, etc.)
│   ├── landing/                  # Landing page components
│   └── portal/                   # Portal UI (PasswordGate, ContentIndex)
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── auth-types.ts             # NextAuth type extensions
│   ├── clients.ts                # Client portal registry
│   ├── courses.ts                # Learning platform course registry
│   ├── email-allowlist.ts        # @33strategies.ai domain validation
│   ├── progress.ts               # Learning progress tracking
│   └── session.ts                # iron-session configuration
├── docs/developer-guides/
│   └── learning-module-components.md  # Deck component library guide
├── middleware.ts                 # Security headers + auth checks
└── railway.toml                  # Railway deployment config
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/clients.ts` | Client portal registry |
| `lib/courses.ts` | Learning platform course registry |
| `lib/session.ts` | iron-session config (client portals) |
| `lib/auth.ts` | NextAuth config (learning platform) |
| `app/api/client-auth/[client]/route.ts` | Client portal authentication |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth API routes |
| `components/deck/` | Shared deck component library |
| `railway.toml` | Railway deployment configuration |

## Critical Gotchas

### API Route Conflict (IMPORTANT)
**Problem:** NextAuth requires `/api/auth/[...nextauth]` but client portals originally used `/api/auth/[client]`. The `[client]` dynamic route intercepts NextAuth requests.

**Solution:** Client portal auth moved to `/api/client-auth/[client]`. If you add new dynamic routes under `/api/auth/`, they will conflict with NextAuth.

### Port Configuration
- **Local dev:** Port 3033 (configured in `package.json`)
- **Railway:** Uses `$PORT` environment variable (usually 8080)
- Start command MUST include `-p $PORT` flag

### Environment Variable Naming
- **Client portals:** Use `SESSION_SECRET`
- **Learning platform:** Use `NEXTAUTH_SECRET` (not `AUTH_SECRET`)
- Both require 32-character hex: `openssl rand -hex 32`
