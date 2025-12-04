# Web Decks

Password-protected investor presentation decks built with Next.js 14.

**Live:** https://web-decks-production.up.railway.app

## Features

- Full-screen scrollable presentations with smooth Framer Motion animations
- Password protection using iron-session (7-day sessions)
- Responsive design with Tailwind CSS
- Deployed on Railway with health checks

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
   DECK_PASSWORD=your_password
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
   - `DECK_PASSWORD` - Password for deck access
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
│   │   ├── auth/       # Login/logout/session API
│   │   └── health/     # Railway health check
│   ├── login/          # Login page
│   ├── layout.tsx      # Root layout with fonts
│   └── page.tsx        # Main deck (requires auth)
├── components/
│   └── TradeblockDeck.tsx  # Full presentation component
├── lib/
│   └── session.ts      # iron-session configuration
├── styles/
│   └── globals.css     # Tailwind + global styles
├── middleware.ts       # Auth check (Edge-compatible)
└── railway.toml        # Railway deployment config
```

## Key Files

| File | Purpose |
|------|---------|
| `railway.toml` | Railway deployment configuration |
| `middleware.ts` | Redirects unauthenticated users (Edge Runtime compatible) |
| `lib/session.ts` | Session options with env validation |
| `app/api/health/route.ts` | Health check for Railway |
