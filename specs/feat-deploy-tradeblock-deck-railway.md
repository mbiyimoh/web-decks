# Deploy Tradeblock AI Inflection 2025 Deck to Railway with Password Protection

**Status:** Draft
**Author:** Claude Code
**Date:** 2024-12-03
**Ideation Source:** `docs/ideation/deploy-tradeblock-deck-railway-password-protection.md`

---

## Overview

Deploy the Tradeblock AI Inflection 2025 investor pitch deck as a password-protected web application to Railway. This involves initializing a Next.js 14 project, migrating the existing React component to TypeScript, implementing iron-session for password protection, and configuring Railway deployment from GitHub.

---

## Background/Problem Statement

Tradeblock needs to share their AI transformation investor pitch deck with potential investors via a shareable URL. The deck must be:

1. **Accessible** - Available at a public URL that can be shared via email/message
2. **Protected** - Only viewable by people who have been given the password
3. **Professional** - Branded login experience, smooth animations, mobile-friendly
4. **Maintainable** - Easy to update and redeploy

The existing `tradeblock-deck-v4.jsx` is a self-contained React component that needs to be wrapped in a deployable Next.js application with authentication.

---

## Goals

- Initialize a production-ready Next.js 14 project with TypeScript and Tailwind CSS
- Migrate the existing deck component to TypeScript without breaking animations
- Implement simple password protection using iron-session encrypted cookies
- Create a branded login page matching the deck's dark aesthetic
- Deploy to Railway with automatic GitHub integration
- Achieve a shareable, password-protected URL for investor distribution

---

## Non-Goals

- **Multi-deck routing** - Only this single deck for now
- **User accounts/registration** - Single shared password is sufficient
- **Custom domain** - Will use Railway's default `*.up.railway.app` domain initially
- **Rate limiting** - Simple retry on wrong password, no lockout
- **Video integration** - Demo placeholders remain as-is
- **Analytics** - No tracking of who views the deck
- **Shared component extraction** - Components stay inline in deck file

---

## Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| next | ^14.2.0 | React framework with App Router |
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | React DOM rendering |
| framer-motion | ^11.0.0 | Scroll animations |
| iron-session | ^8.0.0 | Encrypted session cookies |
| tailwindcss | ^3.4.0 | Utility-first CSS |
| typescript | ^5.0.0 | Type safety |
| @types/react | ^18.2.0 | React type definitions |
| @types/node | ^20.0.0 | Node.js type definitions |

**External Services:**
- GitHub repository: `git@github.com:mbiyimoh/web-decks.git`
- Railway hosting platform

---

## Detailed Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Railway                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Next.js 14 App                        │ │
│  │                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐                  │ │
│  │  │  middleware   │───▶│  /login      │                  │ │
│  │  │  (auth check) │    │  (password)  │                  │ │
│  │  └──────┬───────┘    └──────┬───────┘                  │ │
│  │         │                    │                          │ │
│  │         │ authenticated      │ POST /api/auth           │ │
│  │         ▼                    ▼                          │ │
│  │  ┌──────────────┐    ┌──────────────┐                  │ │
│  │  │  / (deck)    │    │  iron-session │                  │ │
│  │  │  protected   │◀───│  cookie set   │                  │ │
│  │  └──────────────┘    └──────────────┘                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Environment Variables:                                       │
│  - DECK_PASSWORD (shared password)                           │
│  - SESSION_SECRET (32+ char encryption key)                  │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
web-decks/
├── app/
│   ├── layout.tsx              # Root layout with fonts, metadata
│   ├── page.tsx                # Main deck page (protected)
│   ├── login/
│   │   └── page.tsx            # Password entry form
│   └── api/
│       └── auth/
│           └── route.ts        # POST: validate password, set session
├── components/
│   └── TradeblockDeck.tsx      # Migrated deck component
├── lib/
│   └── session.ts              # iron-session configuration
├── middleware.ts               # Route protection logic
├── styles/
│   └── globals.css             # Tailwind base + font imports
├── public/
│   └── (empty for now)
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local                  # Local dev secrets
├── .env.example                # Template for required env vars
└── .gitignore
```

### Implementation Details

#### 1. Session Configuration (`lib/session.ts`)

```typescript
import { SessionOptions } from 'iron-session';

export interface SessionData {
  isAuthenticated: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'tradeblock-deck-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  },
};

export const defaultSession: SessionData = {
  isAuthenticated: false,
};
```

#### 2. Middleware (`middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Skip middleware for login page, API routes, and static files
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return response;
  }

  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  if (!session.isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

#### 3. Auth API Route (`app/api/auth/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === process.env.DECK_PASSWORD) {
    const session = await getIronSession<SessionData>(
      cookies(),
      sessionOptions
    );
    session.isAuthenticated = true;
    await session.save();

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, error: 'Invalid password' },
    { status: 401 }
  );
}
```

#### 4. Login Page (`app/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (data.success) {
      router.push('/');
      router.refresh();
    } else {
      setError('Invalid password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Tradeblock Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            TRADEBLOCK
          </h1>
          <p className="text-zinc-500 mt-2">Enter password to view</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg
                       text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500
                       transition-colors"
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 text-black font-medium rounded-lg
                       hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'View Presentation'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### 5. Root Layout (`app/layout.tsx`)

```typescript
import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import '@/styles/globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Tradeblock: The AI Inflection',
  description: 'Investor pitch deck for Tradeblock AI transformation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-body bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
```

#### 6. Main Page (`app/page.tsx`)

```typescript
import TradeblockDeck from '@/components/TradeblockDeck';

export default function Home() {
  return <TradeblockDeck />;
}
```

#### 7. Deck Component Migration

The existing `tradeblock-deck-v4.jsx` will be converted to TypeScript as `components/TradeblockDeck.tsx`:

- Add `'use client'` directive at top (required for Framer Motion hooks)
- Add TypeScript interfaces for component props
- Keep all inline component definitions (Section, RevealText, etc.)
- No functional changes to animations or content

Key type additions:

```typescript
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id: string;
}

interface RevealTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

interface DemoPlaceholderProps {
  title: string;
  duration: string;
  description: string;
}
// ... etc
```

### Environment Variables

**Required for production (Railway):**

| Variable | Description | Example |
|----------|-------------|---------|
| `DECK_PASSWORD` | Shared password for deck access | `investor2024` |
| `SESSION_SECRET` | 32+ character encryption key | `abc123...` (32+ chars) |

**`.env.example` template:**

```
# Password for deck access
DECK_PASSWORD=your_password_here

# Session encryption (generate with: openssl rand -hex 32)
SESSION_SECRET=your_32_character_secret_here
```

### Railway Deployment Configuration

Railway will auto-detect Next.js. No `railway.json` needed unless customizing.

**Deployment steps:**
1. Connect GitHub repo to Railway project
2. Set environment variables in Railway dashboard
3. Railway auto-builds on push to main

---

## User Experience

### Authentication Flow

```
User clicks shared link
        │
        ▼
┌───────────────────┐
│   Middleware      │
│   checks session  │
└─────────┬─────────┘
          │
    authenticated?
    ┌─────┴─────┐
    │           │
   Yes          No
    │           │
    ▼           ▼
┌─────────┐  ┌─────────────┐
│  Deck   │  │ Login Page  │
│ renders │  │ (password)  │
└─────────┘  └──────┬──────┘
                    │
              enters password
                    │
                    ▼
             ┌─────────────┐
             │ POST /api/  │
             │    auth     │
             └──────┬──────┘
                    │
              correct?
              ┌─────┴─────┐
              │           │
             Yes          No
              │           │
              ▼           ▼
        ┌─────────┐  ┌─────────────┐
        │ Set     │  │ "Invalid    │
        │ cookie  │  │ password"   │
        │ → Deck  │  │ → retry     │
        └─────────┘  └─────────────┘
```

### Login Page Design

- **Background:** Solid black (`#000000`)
- **Logo:** "TRADEBLOCK" in white, Space Grotesk, centered
- **Subtitle:** "Enter password to view" in zinc-500
- **Input:** Dark zinc-900 with zinc-800 border, amber focus state
- **Button:** Amber-500 background, black text
- **Error:** Red-400 text below input

### Session Behavior

- Session cookie persists for 7 days
- User can close browser and return without re-entering password
- Cookie is HTTP-only and secure in production
- No logout functionality (not needed for this use case)

---

## Testing Strategy

### Unit Tests

**Session utilities (`lib/session.test.ts`):**
- Verify session options are correctly configured
- Verify cookie max-age is 7 days (604800 seconds)

### Integration Tests

**Auth API route:**
- POST with correct password returns `{ success: true }`
- POST with wrong password returns 401 with `{ success: false, error: 'Invalid password' }`
- POST without password returns 401

**Middleware:**
- Unauthenticated request to `/` redirects to `/login`
- Authenticated request to `/` proceeds
- Request to `/login` always proceeds
- Request to `/api/*` always proceeds

### E2E Tests (Playwright)

```typescript
// Purpose: Verify complete authentication flow works end-to-end
test('password protection flow', async ({ page }) => {
  // Unauthenticated user redirected to login
  await page.goto('/');
  await expect(page).toHaveURL('/login');

  // Wrong password shows error
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Invalid password')).toBeVisible();

  // Correct password grants access
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=TRADEBLOCK')).toBeVisible();
});

// Purpose: Verify session persists across page reloads
test('session persists after reload', async ({ page }) => {
  // Login first
  await page.goto('/login');
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');

  // Reload and verify still authenticated
  await page.reload();
  await expect(page).toHaveURL('/');
});
```

### Manual Testing Checklist

- [ ] Login page renders correctly on desktop
- [ ] Login page renders correctly on mobile
- [ ] Wrong password shows error message
- [ ] Correct password redirects to deck
- [ ] All 13 slides render
- [ ] Framer Motion animations work (scroll reveals)
- [ ] Progress bar updates on scroll
- [ ] NavDots work on desktop
- [ ] Session persists after browser restart

---

## Performance Considerations

### Bundle Size

- Next.js automatic code splitting
- Framer Motion only loaded on client
- No heavy dependencies beyond Framer Motion (~50KB gzipped)

### Initial Load

- Login page is lightweight (<50KB total)
- Deck page is ~60KB component + Framer Motion
- Fonts loaded via Next.js font optimization

### Railway Performance

- Cold starts possible on Railway hobby tier
- Session cookies reduce re-auth on subsequent visits
- No database queries (stateless auth)

---

## Security Considerations

### Password Protection

- Password never stored in client code
- Password compared server-side only
- Password transmitted over HTTPS (Railway enforces SSL)

### Session Security

- iron-session uses AES-256-GCM encryption
- Session cookie is HTTP-only (no JS access)
- Session cookie is secure in production (HTTPS only)
- SameSite=Lax prevents CSRF

### Environment Variables

- `DECK_PASSWORD` never committed to git
- `SESSION_SECRET` must be 32+ characters
- Both set only in Railway dashboard

### Known Limitations

- Single shared password (acceptable for investor sharing)
- No rate limiting (could be added later)
- No audit log of access (acceptable for MVP)

---

## Documentation

### Files to Create

1. **README.md** - Project overview and setup instructions
2. **.env.example** - Template for required environment variables

### README.md Contents

- Project description
- Local development setup
- Environment variable requirements
- Deployment instructions
- Testing instructions

---

## Implementation Phases

### Phase 1: Project Setup

1. Initialize Next.js 14 project with TypeScript
2. Configure Tailwind CSS with design tokens
3. Set up directory structure
4. Create `.env.example` and `.gitignore`
5. Verify `npm run dev` works

### Phase 2: Deck Migration

1. Copy `tradeblock-deck-v4.jsx` to `components/TradeblockDeck.tsx`
2. Add `'use client'` directive
3. Add TypeScript interfaces for all props
4. Create `app/page.tsx` to render deck
5. Verify deck renders correctly with animations

### Phase 3: Password Protection

1. Install iron-session
2. Create `lib/session.ts` configuration
3. Create `app/login/page.tsx`
4. Create `app/api/auth/route.ts`
5. Create `middleware.ts`
6. Test auth flow locally

### Phase 4: Railway Deployment

1. Push to GitHub repository
2. Create Railway project and connect repo
3. Configure environment variables in Railway
4. Verify deployment succeeds
5. Test live URL with password protection

---

## Open Questions

None - all decisions made in ideation phase.

---

## References

- **Ideation document:** `docs/ideation/deploy-tradeblock-deck-railway-password-protection.md`
- **Source component:** `tradeblock-deck-v4.jsx`
- **Project architecture:** `CLAUDE.md`
- **Deck handoff:** `web-decks-initial-handoff.md`

**External Documentation:**
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [iron-session v8](https://github.com/vvo/iron-session)
- [Railway Deployment](https://docs.railway.app/deploy/deployments)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/docs)
