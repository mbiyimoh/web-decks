# Task Breakdown: Deploy Tradeblock Deck to Railway

**Generated:** 2024-12-03
**Source:** specs/feat-deploy-tradeblock-deck-railway.md

## Overview

Deploy the Tradeblock AI Inflection 2025 investor pitch deck as a password-protected Next.js application to Railway. This involves 4 phases: project setup, deck migration, password protection, and deployment.

---

## Phase 1: Project Setup

### Task 1.1: Initialize Next.js 14 Project with TypeScript

**Description:** Create a new Next.js 14 project with App Router, TypeScript, and Tailwind CSS
**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** None (foundation task)

**Technical Requirements:**
- Next.js 14.2+ with App Router
- TypeScript 5.0+
- Tailwind CSS 3.4+
- Project name: web-decks

**Implementation Steps:**

1. Initialize Next.js project:
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

2. Verify package.json has correct dependencies:
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

3. Install additional dependencies:
```bash
npm install framer-motion@^11.0.0 iron-session@^8.0.0
```

4. Create directory structure:
```bash
mkdir -p app/login app/api/auth components lib styles public
```

**Acceptance Criteria:**
- [ ] `npm run dev` starts development server on port 3000
- [ ] TypeScript compiles without errors
- [ ] Tailwind CSS is working (test with a colored div)
- [ ] All dependencies installed at correct versions

---

### Task 1.2: Configure Tailwind and Global Styles

**Description:** Set up Tailwind CSS with custom fonts (Space Grotesk, Inter) and global styles
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 1.3

**Technical Requirements:**
- Space Grotesk font for headings (--font-display)
- Inter font for body text (--font-body)
- Black background default
- White text default

**Implementation - tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Implementation - styles/globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-black text-white antialiased;
}
```

**Acceptance Criteria:**
- [ ] Tailwind config includes custom font families
- [ ] globals.css has Tailwind directives and base styles
- [ ] Fonts render correctly when used in components

---

### Task 1.3: Create Environment Configuration

**Description:** Set up environment variables template and gitignore
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 1.2

**Implementation - .env.example:**
```bash
# Password for deck access
DECK_PASSWORD=your_password_here

# Session encryption (generate with: openssl rand -hex 32)
SESSION_SECRET=your_32_character_secret_here
```

**Implementation - .env.local (for development):**
```bash
DECK_PASSWORD=testpassword
SESSION_SECRET=this_is_a_32_character_secret_key_for_dev
```

**Implementation - .gitignore additions:**
```
# Environment files
.env
.env.local
.env*.local

# Dependencies
node_modules/

# Next.js
.next/
out/

# Misc
.DS_Store
*.log
```

**Acceptance Criteria:**
- [ ] .env.example exists with placeholder values
- [ ] .env.local exists with development values (not committed)
- [ ] .gitignore excludes sensitive files and build artifacts

---

## Phase 2: Deck Migration

### Task 2.1: Migrate Deck Component to TypeScript

**Description:** Convert tradeblock-deck-v4.jsx to TypeScript with proper type definitions
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.1, Task 1.2
**Can run parallel with:** None

**Technical Requirements:**
- Add 'use client' directive (required for Framer Motion hooks)
- Define TypeScript interfaces for all component props
- Keep all inline component definitions
- No changes to animation logic or content

**TypeScript Interfaces to add:**
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

interface NavDotsProps {
  sections: { id: string; label: string }[];
  activeSection: string;
}

interface PhaseStatusProps {
  status: 'completed' | 'rolling-out' | 'beta' | 'live';
}

interface RoadmapProps {
  activePhase?: number | null;
}

interface CompanyCardProps {
  name: string;
  description: string;
  delay?: number;
}

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle: string;
  color?: 'zinc' | 'green' | 'yellow' | 'red' | 'purple';
  delay?: number;
}
```

**Implementation Steps:**
1. Copy tradeblock-deck-v4.jsx to components/TradeblockDeck.tsx
2. Add 'use client' at the top
3. Add all interface definitions
4. Apply types to each component's props
5. Ensure default export is named TradeblockDeck

**File header:**
```typescript
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// ... interfaces here ...

// ... component implementations unchanged ...

export default function TradeblockDeck() {
  // ... main component code unchanged ...
}
```

**Acceptance Criteria:**
- [ ] File compiles without TypeScript errors
- [ ] 'use client' directive is present
- [ ] All props have TypeScript interfaces
- [ ] Component renders identically to original JSX version
- [ ] All 13 slides render
- [ ] Framer Motion animations work (scroll reveals, progress bar)

---

### Task 2.2: Create Root Layout with Fonts

**Description:** Create app/layout.tsx with Next.js font optimization for Space Grotesk and Inter
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.2
**Can run parallel with:** Task 2.1

**Implementation - app/layout.tsx:**
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

**Acceptance Criteria:**
- [ ] Space Grotesk and Inter fonts load via Next.js optimization
- [ ] CSS variables --font-display and --font-body are set
- [ ] Metadata title and description are correct
- [ ] Body has correct default classes

---

### Task 2.3: Create Main Page Route

**Description:** Create app/page.tsx that renders the TradeblockDeck component
**Size:** Small
**Priority:** High
**Dependencies:** Task 2.1, Task 2.2
**Can run parallel with:** None

**Implementation - app/page.tsx:**
```typescript
import TradeblockDeck from '@/components/TradeblockDeck';

export default function Home() {
  return <TradeblockDeck />;
}
```

**Acceptance Criteria:**
- [ ] Home page renders TradeblockDeck component
- [ ] Deck displays all 13 slides
- [ ] Animations work correctly
- [ ] No console errors

---

## Phase 3: Password Protection

### Task 3.1: Create Session Configuration

**Description:** Set up iron-session configuration with 7-day session duration
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1, Task 1.3
**Can run parallel with:** Task 2.1

**Implementation - lib/session.ts:**
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
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds (604800)
  },
};

export const defaultSession: SessionData = {
  isAuthenticated: false,
};
```

**Acceptance Criteria:**
- [ ] SessionData interface exported
- [ ] sessionOptions exported with correct cookie settings
- [ ] Cookie maxAge is 604800 seconds (7 days)
- [ ] Secure cookie only in production

---

### Task 3.2: Create Auth API Route

**Description:** Create POST /api/auth endpoint for password validation
**Size:** Small
**Priority:** High
**Dependencies:** Task 3.1
**Can run parallel with:** Task 3.3

**Implementation - app/api/auth/route.ts:**
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

**Acceptance Criteria:**
- [ ] POST with correct password returns { success: true } and 200
- [ ] POST with wrong password returns { success: false, error: 'Invalid password' } and 401
- [ ] Session cookie is set on successful auth
- [ ] No password exposed in response

---

### Task 3.3: Create Login Page

**Description:** Create branded login page at /login with password form
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.2
**Can run parallel with:** Task 3.2

**Implementation - app/login/page.tsx:**
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

**Design specifications:**
- Background: Solid black (#000000)
- Logo: "TRADEBLOCK" in white, centered, text-3xl font-bold
- Subtitle: "Enter password to view" in zinc-500
- Input: bg-zinc-900, border-zinc-800, rounded-lg, amber focus state
- Button: bg-amber-500, text-black, hover:bg-amber-400
- Error: text-red-400, text-sm

**Acceptance Criteria:**
- [ ] Login page renders at /login
- [ ] Form has password input and submit button
- [ ] Wrong password shows "Invalid password" error
- [ ] Correct password redirects to /
- [ ] Loading state disables button
- [ ] Mobile responsive

---

### Task 3.4: Create Auth Middleware

**Description:** Create middleware.ts for route protection that redirects unauthenticated users to /login
**Size:** Medium
**Priority:** High
**Dependencies:** Task 3.1, Task 3.2
**Can run parallel with:** None

**Implementation - middleware.ts:**
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

**Acceptance Criteria:**
- [ ] Unauthenticated request to / redirects to /login
- [ ] Authenticated request to / proceeds to deck
- [ ] /login is always accessible
- [ ] /api/* routes are always accessible
- [ ] Static files (_next/*) are always accessible
- [ ] Session persists across requests

---

## Phase 4: Deployment

### Task 4.1: Create README and Documentation

**Description:** Create project README with setup and deployment instructions
**Size:** Small
**Priority:** Medium
**Dependencies:** All previous tasks
**Can run parallel with:** Task 4.2

**Implementation - README.md:**
```markdown
# Tradeblock AI Inflection 2025 Deck

Password-protected investor pitch deck for Tradeblock's AI transformation story.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with required variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DECK_PASSWORD` | Password required to view the deck |
| `SESSION_SECRET` | 32+ character secret for session encryption |

Generate a session secret:
```bash
openssl rand -hex 32
```

## Deployment to Railway

1. Push code to GitHub repository
2. Create new project in Railway dashboard
3. Connect GitHub repository
4. Add environment variables in Railway settings
5. Deploy

The deck will be available at `https://[project-name].up.railway.app`

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- iron-session
```

**Acceptance Criteria:**
- [ ] README explains local setup
- [ ] Environment variables documented
- [ ] Deployment instructions included
- [ ] Session secret generation command provided

---

### Task 4.2: Push to GitHub and Deploy to Railway

**Description:** Initialize git, push to GitHub, and deploy to Railway
**Size:** Medium
**Priority:** High
**Dependencies:** All previous tasks
**Can run parallel with:** Task 4.1

**Implementation Steps:**

1. Initialize git and make initial commit:
```bash
git init
git add .
git commit -m "Initial commit: Tradeblock AI Inflection 2025 deck"
```

2. Add remote and push:
```bash
git remote add origin git@github.com:mbiyimoh/web-decks.git
git branch -M main
git push -u origin main
```

3. Deploy to Railway:
   - Go to railway.app and create new project
   - Select "Deploy from GitHub repo"
   - Choose mbiyimoh/web-decks repository
   - Railway auto-detects Next.js

4. Configure environment variables in Railway dashboard:
   - Add `DECK_PASSWORD` with your chosen password
   - Add `SESSION_SECRET` (generate with `openssl rand -hex 32`)

5. Wait for build to complete and test the live URL

**Acceptance Criteria:**
- [ ] Code pushed to GitHub repository
- [ ] Railway project created and connected
- [ ] Environment variables set in Railway
- [ ] Build succeeds
- [ ] Live URL is accessible
- [ ] Password protection works on live site
- [ ] All 13 slides render correctly
- [ ] Animations work in production

---

## Dependency Graph

```
Phase 1: Foundation
  1.1 Initialize Next.js ─┬─> 1.2 Configure Tailwind
                          └─> 1.3 Environment Config

Phase 2: Deck Migration
  1.1, 1.2 ─> 2.1 Migrate Deck Component
  1.2 ─> 2.2 Root Layout
  2.1, 2.2 ─> 2.3 Main Page Route

Phase 3: Password Protection
  1.1, 1.3 ─> 3.1 Session Config
  3.1 ─> 3.2 Auth API Route
  1.2 ─> 3.3 Login Page
  3.1, 3.2 ─> 3.4 Auth Middleware

Phase 4: Deployment
  All ─> 4.1 README
  All ─> 4.2 Deploy to Railway
```

## Parallel Execution Opportunities

- **Phase 1:** Tasks 1.2 and 1.3 can run in parallel after 1.1
- **Phase 2:** Task 2.2 can run in parallel with 2.1
- **Phase 3:** Tasks 3.2 and 3.3 can run in parallel
- **Phase 4:** Tasks 4.1 and 4.2 can run in parallel

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Framer Motion SSR issues | Medium | 'use client' directive on deck component |
| iron-session middleware compatibility | Low | Using documented Next.js 14 patterns |
| TypeScript migration errors | Low | Keep same logic, only add types |

## Execution Strategy

**Recommended order:**
1. Complete Phase 1 first (foundation)
2. Phase 2 and Phase 3.1 can start in parallel
3. Complete Phase 3 after deck renders
4. Phase 4 last (requires all features working)

**Critical path:** 1.1 → 2.1 → 2.3 → 3.4 → 4.2
