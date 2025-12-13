# Web Decks

Password-protected client portals for investor presentations and proposals, built with Next.js 14.

**Live:** https://web-decks-production.up.railway.app

## Features

- Client portal system with per-client password protection
- Full-screen scrollable presentations with smooth Framer Motion animations
- Session management using iron-session (7-day sessions)
- Responsive design with Tailwind CSS
- Deployed on Railway with health checks

## Client Portal Architecture

Each client gets their own password-protected portal:

- `/client-portals/tradeblock` - Tradeblock portal (AI Inflection deck)
- `/client-portals/plya` - PLYA portal (Project proposal)

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
   ```
   TRADEBLOCK_PASSWORD=your_tradeblock_password
   PLYA_PASSWORD=your_plya_password
   SESSION_SECRET=your_64_char_hex_secret
   ```

   Generate a session secret:
   ```bash
   openssl rand -hex 32
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Railway

### Initial Setup

1. Push to GitHub
2. Create new project in [Railway](https://railway.app)
3. Connect your GitHub repository
4. Set environment variables:
   - `TRADEBLOCK_PASSWORD` - Password for Tradeblock portal
   - `PLYA_PASSWORD` - Password for PLYA portal
   - `SESSION_SECRET` - 64-character hex secret

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
│   │   ├── auth/[client]/  # Per-client auth API
│   │   └── health/         # Railway health check
│   ├── client-portals/
│   │   ├── [client]/       # Client portal pages
│   │   └── [client]/[slug] # Content pages
│   ├── layout.tsx          # Root layout with fonts
│   └── page.tsx            # Landing page
├── components/
│   ├── clients/            # Client-specific content
│   │   ├── tradeblock/     # Tradeblock presentations
│   │   └── plya/           # PLYA proposals
│   ├── landing/            # Landing page components
│   └── portal/             # Portal UI (PasswordGate, ContentIndex)
├── lib/
│   ├── clients.ts          # Client registry
│   └── session.ts          # iron-session configuration
├── middleware.ts           # Security headers
└── railway.toml            # Railway deployment config
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/clients.ts` | Client registry with content definitions |
| `lib/session.ts` | Session options with per-client validation |
| `app/api/auth/[client]/route.ts` | Per-client authentication |
| `components/portal/PasswordGate.tsx` | Inline password form |
| `railway.toml` | Railway deployment configuration |
