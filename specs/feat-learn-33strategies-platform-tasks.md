# Task Breakdown: learn.33strategies.ai Learning Platform

**Generated:** 2025-12-29
**Source:** specs/feat-learn-33strategies-platform.md
**Status:** Validated

---

## Overview

Build an internal learning platform at `/learning` with:
- Hybrid authentication (Google SSO + email/password) restricted to `@33strategies.ai`
- Course catalog starting with "33 Strategies AI Workflow: For Builders"
- 4 learning modules migrated from `docs/learning-modules/`
- Shared deck components with design system compliance
- localStorage-based progress tracking

---

## Phase 1: Authentication Foundation

### Task 1.1: Install NextAuth.js v5 and Configure Dependencies

**Description**: Install NextAuth.js v5 and update environment configuration
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (must complete first)

**Technical Requirements**:
- Install `next-auth@5` package
- Add environment variables to `.env.example` and Railway
- Update `package.json` if needed

**Implementation Steps**:
1. Install NextAuth.js v5:
   ```bash
   npm install next-auth@5
   ```

2. Add to `.env.example`:
   ```bash
   # Learning Platform Auth
   GOOGLE_CLIENT_ID=           # Google OAuth client ID
   GOOGLE_CLIENT_SECRET=       # Google OAuth client secret
   NEXTAUTH_SECRET=            # Generate: openssl rand -hex 32
   NEXTAUTH_URL=               # Production: https://your-domain.com
   LEARNING_PASSWORD=          # Email/password auth password
   ```

3. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -hex 32
   ```

**Acceptance Criteria**:
- [ ] `next-auth@5` installed in package.json
- [ ] Environment variables documented in `.env.example`
- [ ] NEXTAUTH_SECRET generated and added to local `.env`
- [ ] No build errors after installation

---

### Task 1.2: Create NextAuth TypeScript Type Extensions

**Description**: Create TypeScript type extensions for NextAuth.js User, Session, and JWT
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: None

**Technical Requirements**:
- Extend NextAuth User interface with id
- Extend Session interface to include user.id
- Extend JWT interface with optional id

**Implementation**:

Create `lib/auth-types.ts`:
```typescript
import { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
  }

  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}
```

**Acceptance Criteria**:
- [ ] File created at `lib/auth-types.ts`
- [ ] No TypeScript errors in auth-related files
- [ ] Type extensions properly augment NextAuth modules

---

### Task 1.3: Create Email Allowlist Module

**Description**: Create email validation module with domain check and static allowlist
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 1.2

**Technical Requirements**:
- Validate `@33strategies.ai` domain
- Support static allowlist array for external users
- Case-insensitive email comparison
- Trim whitespace from emails

**Implementation**:

Create `lib/email-allowlist.ts`:
```typescript
/**
 * Email validation for learning platform access
 *
 * Access granted if:
 * 1. Email domain is @33strategies.ai, OR
 * 2. Email is in the static allowlist
 */

// Allowed email domain
const ALLOWED_DOMAIN = '33strategies.ai';

// Static allowlist for external users (clients, contractors)
// Edit this array directly to add/remove allowed emails
const EMAIL_ALLOWLIST: readonly string[] = [
  // 'contractor@example.com',
  // 'client@theircompany.com',
] as const;

export function isEmailAllowed(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();

  // Check domain
  if (normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return true;
  }

  // Check allowlist
  if (EMAIL_ALLOWLIST.includes(normalizedEmail)) {
    return true;
  }

  return false;
}
```

**Acceptance Criteria**:
- [ ] File created at `lib/email-allowlist.ts`
- [ ] `isEmailAllowed('user@33strategies.ai')` returns true
- [ ] `isEmailAllowed('user@gmail.com')` returns false
- [ ] `isEmailAllowed('USER@33STRATEGIES.AI')` returns true (case insensitive)
- [ ] `isEmailAllowed(' user@33strategies.ai ')` returns true (trimmed)

---

### Task 1.4: Create NextAuth Configuration

**Description**: Create NextAuth.js configuration with Google and Credentials providers
**Size**: Large
**Priority**: High
**Dependencies**: Task 1.1, Task 1.2, Task 1.3
**Can run parallel with**: None

**Technical Requirements**:
- Configure Google OAuth provider
- Configure Credentials provider for email/password
- Add signIn callback for email domain validation
- Add jwt callback to persist user id
- Add session callback to expose user id
- Validate NEXTAUTH_SECRET environment variable
- Set custom pages for signIn and error

**Implementation**:

Create `lib/auth.ts`:
```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { isEmailAllowed } from './email-allowlist';
import './auth-types'; // Import type extensions

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // Check password against env var
        const expectedPassword = process.env.LEARNING_PASSWORD;
        if (!expectedPassword || password !== expectedPassword) {
          return null;
        }

        return {
          id: email,
          email: email,
          name: email.split('@')[0],
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Validate email domain/allowlist for ALL providers
      if (!user.email || !isEmailAllowed(user.email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Persist user id to JWT on first sign-in
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/learning',
    error: '/learning',
  },
});
```

**Acceptance Criteria**:
- [ ] File created at `lib/auth.ts`
- [ ] Exports `handlers`, `auth`, `signIn`, `signOut`
- [ ] Google OAuth provider configured
- [ ] Credentials provider validates against LEARNING_PASSWORD
- [ ] signIn callback rejects non-allowed emails
- [ ] jwt callback persists user id
- [ ] session callback exposes user id
- [ ] Custom sign-in page set to `/learning`
- [ ] No TypeScript errors

---

### Task 1.5: Create NextAuth API Route Handler

**Description**: Create the NextAuth.js API route handler for authentication
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.4
**Can run parallel with**: None

**Technical Requirements**:
- Create catch-all route for NextAuth
- Export GET and POST handlers

**Implementation**:

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

**Acceptance Criteria**:
- [ ] File created at `app/api/auth/[...nextauth]/route.ts`
- [ ] Route responds to `/api/auth/*` requests
- [ ] Google OAuth redirect works
- [ ] Credentials login works

---

### Task 1.6: Create AuthGate Component

**Description**: Create authentication gate component with Google SSO and email/password options
**Size**: Large
**Priority**: High
**Dependencies**: Task 1.5
**Can run parallel with**: None

**Technical Requirements**:
- Google SSO button with Google icon
- Email/password form (hidden by default)
- Form validation and error handling
- Loading state during sign-in
- Design system compliance (colors, fonts)
- Framer Motion animations

**Implementation**:

Create `app/learning/components/AuthGate.tsx`:
```typescript
'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

export function AuthGate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/learning' });
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Access is restricted to @33strategies.ai emails.');
      } else {
        window.location.href = '/learning';
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <p className="text-[#d4a54a] uppercase tracking-[0.2em] text-xs font-mono mb-2">
            33 Strategies
          </p>
          <h1 className="text-3xl font-bold text-[#f5f5f5] font-display">
            Learning Platform
          </h1>
          <p className="text-[#888888] text-sm mt-2">
            Sign in with your @33strategies.ai email
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="
              w-full px-4 py-3
              bg-white text-black font-medium rounded-xl
              hover:bg-zinc-200 transition-colors
              flex items-center justify-center gap-3
            "
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0f] text-[#555555]">or</span>
            </div>
          </div>

          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="
                w-full px-4 py-3
                bg-[#111114] border border-white/[0.08] rounded-xl
                text-[#f5f5f5] font-medium
                hover:bg-[#0d0d14] hover:border-white/[0.12]
                transition-colors
              "
            >
              Sign in with Email
            </button>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="
                  w-full px-4 py-3
                  bg-[#111114] border border-white/[0.08] rounded-xl
                  text-[#f5f5f5] placeholder-[#555555]
                  focus:outline-none focus:border-white/[0.12]
                  transition-colors
                "
                disabled={loading}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="
                  w-full px-4 py-3
                  bg-[#111114] border border-white/[0.08] rounded-xl
                  text-[#f5f5f5] placeholder-[#555555]
                  focus:outline-none focus:border-white/[0.12]
                  transition-colors
                "
                disabled={loading}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#f87171] text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="
                  w-full px-4 py-3
                  bg-[#d4a54a] text-black font-medium rounded-xl
                  hover:bg-[#e4b55a] transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[#555555] text-xs mt-8">
          Access restricted to 33 Strategies team members
        </p>
      </motion.div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/components/AuthGate.tsx`
- [ ] Google SSO button triggers OAuth flow
- [ ] Email form shows on click
- [ ] Form validates input before submission
- [ ] Error messages display correctly
- [ ] Loading state disables form
- [ ] Design matches 33 Strategies system (gold, dark bg)
- [ ] Animations work correctly

---

### Task 1.7: Create LogoutButton Component

**Description**: Create a sign-out button component for the learning platform
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 1.5
**Can run parallel with**: Task 1.6

**Technical Requirements**:
- Client component using next-auth/react
- Calls signOut with redirect to /learning
- Minimal, unobtrusive styling

**Implementation**:

Create `app/learning/components/LogoutButton.tsx`:
```typescript
'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/learning' })}
      className="
        text-[#555555] hover:text-[#f5f5f5]
        text-sm transition-colors
      "
    >
      Sign out
    </button>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/components/LogoutButton.tsx`
- [ ] Click triggers sign out
- [ ] Redirects to /learning after logout
- [ ] Styling matches design system

---

## Phase 2: Learning Dashboard & Structure

### Task 2.1: Create Course Registry

**Description**: Create course data structure and registry with module definitions
**Size**: Medium
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Phase 1 tasks

**Technical Requirements**:
- Define LearningModule interface
- Define Course interface
- Create courses registry object
- Helper functions: getCourse, getModule, getAllCourses, getTotalEstimatedTime

**Implementation**:

Create `lib/courses.ts`:
```typescript
export interface LearningModule {
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  modules: LearningModule[];
}

export const courses: Record<string, Course> = {
  'ai-workflow': {
    id: 'ai-workflow',
    title: '33 Strategies AI Workflow: For Builders',
    description: 'Master the spec-based development workflow for AI-assisted coding with Claude Code',
    modules: [
      {
        slug: 'getting-started',
        title: 'Getting Started',
        description: 'Loading your AI collaborator with the context it needs to succeed',
        estimatedMinutes: 15,
        order: 1,
      },
      {
        slug: 'claude-code-workflow',
        title: 'The Claude Code Workflow',
        description: 'The 5-stage pipeline: Ideate → Spec → Validate → Decompose → Execute',
        estimatedMinutes: 25,
        order: 2,
      },
      {
        slug: 'existing-codebases',
        title: 'Working with Existing Codebases',
        description: 'Start small, scale smart — safely introducing AI to your codebase',
        estimatedMinutes: 20,
        order: 3,
      },
      {
        slug: 'orchestration-system',
        title: 'Building Your Orchestration System',
        description: 'How to systematically improve your AI\'s understanding over time',
        estimatedMinutes: 20,
        order: 4,
      },
    ],
  },
};

export function getCourse(courseId: string): Course | undefined {
  return courses[courseId];
}

export function getModule(courseId: string, moduleSlug: string): LearningModule | undefined {
  const course = courses[courseId];
  if (!course) return undefined;
  return course.modules.find((m) => m.slug === moduleSlug);
}

export function getAllCourses(): Course[] {
  return Object.values(courses);
}

export function getTotalEstimatedTime(course: Course): number {
  return course.modules.reduce((sum, m) => sum + m.estimatedMinutes, 0);
}
```

**Acceptance Criteria**:
- [ ] File created at `lib/courses.ts`
- [ ] `getCourse('ai-workflow')` returns course object
- [ ] `getModule('ai-workflow', 'getting-started')` returns module
- [ ] `getAllCourses()` returns array with one course
- [ ] `getTotalEstimatedTime(course)` returns 80 (15+25+20+20)
- [ ] Types exported correctly

---

### Task 2.2: Create Progress Tracking Module

**Description**: Create localStorage-based progress tracking with simple API
**Size**: Small
**Priority**: Medium
**Dependencies**: None
**Can run parallel with**: Task 2.1

**Technical Requirements**:
- Store progress in localStorage
- Track completed modules as "courseId/moduleSlug" keys
- Handle server-side rendering (no window)
- Silent fail for localStorage errors
- Three exported functions: markModuleCompleted, isModuleCompleted, getCompletedCount

**Implementation**:

Create `lib/progress.ts`:
```typescript
/**
 * Progress tracking for learning modules
 * Simple localStorage-based implementation
 */

const PROGRESS_KEY = '33s-learning-progress';

interface ProgressData {
  completed: string[]; // Array of "courseId/moduleSlug" keys
}

function getProgressData(): ProgressData {
  if (typeof window === 'undefined') return { completed: [] };

  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : { completed: [] };
  } catch {
    return { completed: [] };
  }
}

function saveProgressData(data: ProgressData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    // Silent fail for localStorage errors
  }
}

export function markModuleCompleted(courseId: string, moduleSlug: string): void {
  const data = getProgressData();
  const key = `${courseId}/${moduleSlug}`;

  if (!data.completed.includes(key)) {
    data.completed.push(key);
    saveProgressData(data);
  }
}

export function isModuleCompleted(courseId: string, moduleSlug: string): boolean {
  const data = getProgressData();
  return data.completed.includes(`${courseId}/${moduleSlug}`);
}

export function getCompletedCount(courseId: string): number {
  const data = getProgressData();
  return data.completed.filter((key) => key.startsWith(`${courseId}/`)).length;
}
```

**Acceptance Criteria**:
- [ ] File created at `lib/progress.ts`
- [ ] `markModuleCompleted('ai-workflow', 'getting-started')` stores in localStorage
- [ ] `isModuleCompleted('ai-workflow', 'getting-started')` returns true after marking
- [ ] `getCompletedCount('ai-workflow')` returns correct count
- [ ] Duplicate calls don't create duplicate entries
- [ ] Works without errors during SSR

---

### Task 2.3: Create Learning Layout

**Description**: Create the layout wrapper for all /learning routes
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.4
**Can run parallel with**: Task 2.1, Task 2.2

**Technical Requirements**:
- Server component with auth check
- Provides consistent dark background
- Children rendered within layout

**Implementation**:

Create `app/learning/layout.tsx`:
```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // AuthGate is shown in page.tsx when not authenticated
  // Layout just provides consistent structure

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/layout.tsx`
- [ ] Layout renders children
- [ ] Background color is `#0a0a0f`
- [ ] No TypeScript errors

---

### Task 2.4: Create CourseCard Component

**Description**: Create course tile component for the learning dashboard
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1
**Can run parallel with**: Task 2.3

**Technical Requirements**:
- Display course title, description
- Show module count and estimated time
- Link to course page
- Hover effects with gold accent
- Framer Motion animation

**Implementation**:

Create `app/learning/components/CourseCard.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Course } from '@/lib/courses';

interface CourseCardProps {
  course: Course;
  totalMinutes: number;
}

export function CourseCard({ course, totalMinutes }: CourseCardProps) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeLabel = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes} min`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={`/learning/${course.id}`}
        className="
          block bg-[#111114] border border-white/[0.08] rounded-2xl p-8
          hover:border-[#d4a54a]/30 hover:bg-[#0d0d14]
          transition-all duration-200 group
        "
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-[#f5f5f5] font-display group-hover:text-[#d4a54a] transition-colors">
              {course.title}
            </h3>
            <p className="text-[#888888] mt-2 max-w-xl">
              {course.description}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-[#555555]">
              <span>{course.modules.length} modules</span>
              <span>•</span>
              <span>{timeLabel}</span>
            </div>
          </div>
          <div className="text-[#555555] group-hover:text-[#d4a54a] transition-colors ml-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/components/CourseCard.tsx`
- [ ] Displays course title with font-display
- [ ] Shows module count and time estimate
- [ ] Links to `/learning/{course.id}`
- [ ] Hover state shows gold accent
- [ ] Animation on mount

---

### Task 2.5: Create Learning Dashboard Page

**Description**: Create the main learning dashboard with course grid
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.4, Task 1.6, Task 2.1, Task 2.3, Task 2.4
**Can run parallel with**: None

**Technical Requirements**:
- Server component with auth check
- Show AuthGate if not authenticated
- Display user welcome message
- Grid of CourseCard components
- Metadata for SEO

**Implementation**:

Create `app/learning/page.tsx`:
```typescript
import { auth } from '@/lib/auth';
import { getAllCourses, getTotalEstimatedTime } from '@/lib/courses';
import { AuthGate } from './components/AuthGate';
import { CourseCard } from './components/CourseCard';

export default async function LearningDashboard() {
  const session = await auth();

  if (!session?.user) {
    return <AuthGate />;
  }

  const courses = getAllCourses();

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <p className="text-[#d4a54a] uppercase tracking-[0.2em] text-xs font-mono mb-2">
            33 Strategies
          </p>
          <h1 className="text-4xl font-bold text-[#f5f5f5] font-display">
            Learning Platform
          </h1>
          <p className="text-[#888888] mt-2">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold text-[#f5f5f5] mb-6">
            Your Courses
          </h2>
          <div className="grid gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                totalMinutes={getTotalEstimatedTime(course)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Learning | 33 Strategies',
  description: 'Internal training platform for 33 Strategies team members',
};
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/page.tsx`
- [ ] Shows AuthGate when not logged in
- [ ] Shows dashboard when logged in
- [ ] Displays user's name/email in welcome
- [ ] CourseCard renders for each course
- [ ] Metadata exports correctly

---

## Phase 3: Course Pages

### Task 3.1: Create ModuleCard Component

**Description**: Create module item component for course landing page
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1, Task 2.2
**Can run parallel with**: Phase 2 tasks

**Technical Requirements**:
- Display module title, description, estimated time
- Show order number or completion checkmark
- Link to module page
- Client component for progress state
- Staggered animation

**Implementation**:

Create `app/learning/components/ModuleCard.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { LearningModule } from '@/lib/courses';
import { isModuleCompleted } from '@/lib/progress';

interface ModuleCardProps {
  module: LearningModule;
  courseId: string;
  index: number;
}

export function ModuleCard({ module, courseId, index }: ModuleCardProps) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isModuleCompleted(courseId, module.slug));
  }, [courseId, module.slug]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/learning/${courseId}/${module.slug}`}
        className="
          flex items-center gap-6
          bg-[#111114] border border-white/[0.08] rounded-xl p-6
          hover:border-[#d4a54a]/30 hover:bg-[#0d0d14]
          transition-all duration-200 group
        "
      >
        {/* Order Number */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0a0a0f] border border-white/[0.08] flex items-center justify-center">
          {completed ? (
            <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-[#555555] text-sm font-mono">{module.order}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#f5f5f5] group-hover:text-[#d4a54a] transition-colors">
            {module.title}
          </h3>
          <p className="text-[#888888] text-sm mt-1 truncate">
            {module.description}
          </p>
        </div>

        {/* Duration & Arrow */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-[#555555] text-sm">{module.estimatedMinutes} min</span>
          <svg
            className="w-5 h-5 text-[#555555] group-hover:text-[#d4a54a] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/components/ModuleCard.tsx`
- [ ] Shows order number when incomplete
- [ ] Shows green checkmark when completed
- [ ] Links to `/learning/{courseId}/{moduleSlug}`
- [ ] Staggered animation based on index
- [ ] Hover state shows gold accent

---

### Task 3.2: Create Course Landing Page

**Description**: Create course landing page with module list
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.4, Task 1.7, Task 2.1, Task 3.1
**Can run parallel with**: None

**Technical Requirements**:
- Server component with auth check
- Display course title, description
- Show total time estimate
- List all modules with ModuleCard
- Back link to dashboard
- Logout button
- Metadata for SEO

**Implementation**:

Create `app/learning/ai-workflow/page.tsx`:
```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCourse, getTotalEstimatedTime } from '@/lib/courses';
import { ModuleCard } from '../components/ModuleCard';
import { LogoutButton } from '../components/LogoutButton';
import Link from 'next/link';

export default async function AIWorkflowCourse() {
  const session = await auth();

  if (!session?.user) {
    redirect('/learning');
  }

  const course = getCourse('ai-workflow');
  if (!course) {
    redirect('/learning');
  }

  const totalMinutes = getTotalEstimatedTime(course);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/learning"
            className="text-[#888888] hover:text-[#f5f5f5] text-sm transition-colors"
          >
            ← Back to courses
          </Link>
          <LogoutButton />
        </div>

        {/* Course Header */}
        <header className="mb-12">
          <p className="text-[#d4a54a] uppercase tracking-[0.2em] text-xs font-mono mb-2">
            Course
          </p>
          <h1 className="text-4xl font-bold text-[#f5f5f5] font-display mb-4">
            {course.title}
          </h1>
          <p className="text-[#888888] mb-4 max-w-2xl">
            {course.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-[#555555]">
            <span>{course.modules.length} modules</span>
            <span>•</span>
            <span>{hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`}</span>
          </div>
        </header>

        {/* Module List */}
        <section>
          <h2 className="text-xl font-semibold text-[#f5f5f5] mb-6">
            Modules
          </h2>
          <div className="space-y-4">
            {course.modules.map((module, index) => (
              <ModuleCard
                key={module.slug}
                module={module}
                courseId={course.id}
                index={index}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'AI Workflow Course | 33 Strategies Learning',
  description: 'Master the spec-based development workflow for AI-assisted coding',
};
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/ai-workflow/page.tsx`
- [ ] Redirects to /learning if not authenticated
- [ ] Redirects to /learning if course not found
- [ ] Shows course header with title/description
- [ ] Shows total time (1h 20m)
- [ ] Lists all 4 modules
- [ ] Back link works
- [ ] Logout button works
- [ ] Metadata exports correctly

---

### Task 3.3: Create Module Page Dynamic Route

**Description**: Create dynamic route for individual learning modules
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.4, Task 2.1
**Can run parallel with**: None

**Technical Requirements**:
- Server component with auth check
- Dynamic import for deck components
- Route params validation
- 404 for invalid modules
- Metadata generation

**Implementation**:

Create `app/learning/ai-workflow/[module]/page.tsx`:
```typescript
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getCourse, getModule } from '@/lib/courses';
import dynamic from 'next/dynamic';

// Dynamic imports for each module's deck component
const moduleComponents: Record<string, React.ComponentType> = {
  'getting-started': dynamic(() => import('./getting-started/GettingStartedDeck')),
  'claude-code-workflow': dynamic(() => import('./claude-code-workflow/ClaudeCodeWorkflowDeck')),
  'existing-codebases': dynamic(() => import('./existing-codebases/ExistingCodebasesDeck')),
  'orchestration-system': dynamic(() => import('./orchestration-system/OrchestrationSystemDeck')),
};

interface Props {
  params: Promise<{ module: string }>;
}

export default async function ModulePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect('/learning');
  }

  const { module: moduleSlug } = await params;
  const module = getModule('ai-workflow', moduleSlug);

  if (!module) {
    notFound();
  }

  const DeckComponent = moduleComponents[moduleSlug];
  if (!DeckComponent) {
    notFound();
  }

  return <DeckComponent />;
}

export async function generateMetadata({ params }: Props) {
  const { module: moduleSlug } = await params;
  const module = getModule('ai-workflow', moduleSlug);

  if (!module) {
    return { title: 'Module Not Found' };
  }

  return {
    title: `${module.title} | 33 Strategies Learning`,
    description: module.description,
  };
}
```

**Acceptance Criteria**:
- [ ] File created at `app/learning/ai-workflow/[module]/page.tsx`
- [ ] Auth check redirects unauthenticated users
- [ ] Invalid module slug returns 404
- [ ] Dynamic import loads correct deck component
- [ ] Metadata generates from module data

---

## Phase 4: Shared Deck Components

### Task 4.1: Create Section Component

**Description**: Create full-viewport scroll section wrapper with fade animation
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: All Phase 4 tasks

**Technical Requirements**:
- Full viewport height by default
- Fade in when scrolled into view
- IntersectionObserver via useInView
- Configurable padding and className

**Implementation**:

Create `components/deck/Section.tsx`:
```typescript
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export function Section({
  id,
  children,
  className = '',
  fullHeight = true
}: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-20%' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`
        ${fullHeight ? 'min-h-screen' : ''}
        flex flex-col justify-center
        px-6 md:px-16 lg:px-24 py-16
        ${className}
      `}
    >
      {children}
    </motion.section>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/Section.tsx`
- [ ] Full viewport height when fullHeight=true
- [ ] Fades in when scrolled into view
- [ ] Configurable className
- [ ] Proper responsive padding

---

### Task 4.2: Create RevealText Component

**Description**: Create animated text reveal component with slide-up effect
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: All Phase 4 tasks

**Technical Requirements**:
- Fade in and slide up animation
- Configurable delay for staggering
- useInView for scroll trigger
- Reset animation when scrolled out

**Implementation**:

Create `components/deck/RevealText.tsx`:
```typescript
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface RevealTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function RevealText({
  children,
  delay = 0,
  className = ''
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-10%' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/RevealText.tsx`
- [ ] Slides up 40px when revealed
- [ ] Delay prop controls stagger timing
- [ ] Animation resets when scrolled out of view
- [ ] Custom easing curve applied

---

### Task 4.3: Create SectionLabel Component

**Description**: Create section label component with "01 — SECTION" format
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: All Phase 4 tasks

**Technical Requirements**:
- Format: "01 — SECTION NAME"
- Gold color (#d4a54a)
- JetBrains Mono font (font-mono)
- Uppercase with wide letter-spacing
- Number padding (1 → 01)

**Implementation**:

Create `components/deck/SectionLabel.tsx`:
```typescript
interface SectionLabelProps {
  number: number | string;
  label: string;
  className?: string;
}

export function SectionLabel({
  number,
  label,
  className = ''
}: SectionLabelProps) {
  const formattedNumber = typeof number === 'number'
    ? String(number).padStart(2, '0')
    : number;

  return (
    <p
      className={`
        text-[#d4a54a] text-xs font-medium
        tracking-[0.2em] uppercase mb-4
        font-mono
        ${className}
      `}
    >
      {formattedNumber} — {label}
    </p>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/SectionLabel.tsx`
- [ ] Number padded to 2 digits (1 → "01")
- [ ] Gold color applied
- [ ] Monospace font used
- [ ] Wide tracking (0.2em)
- [ ] Uppercase text

---

### Task 4.4: Create Card Component

**Description**: Create content card with optional gold highlight and glow
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: All Phase 4 tasks

**Technical Requirements**:
- Dark surface background (#111114)
- Subtle border (white/8%)
- Optional gold highlight border
- Optional gold glow effect
- Rounded corners (2xl)

**Implementation**:

Create `components/deck/Card.tsx`:
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  className = '',
  highlight = false,
  glow = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-[#111114]
        border ${highlight ? 'border-[#d4a54a]/50' : 'border-white/[0.08]'}
        rounded-2xl p-6 md:p-8
        ${className}
      `}
      style={glow ? { boxShadow: '0 0 40px rgba(212,165,74,0.3)' } : undefined}
    >
      {children}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/Card.tsx`
- [ ] Default border is subtle white
- [ ] highlight=true shows gold border
- [ ] glow=true adds gold box-shadow
- [ ] Responsive padding (p-6 md:p-8)

---

### Task 4.5: Create CodeBlock Component

**Description**: Create code display component with copy-to-clipboard
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: All Phase 4 tasks

**Technical Requirements**:
- Elevated background (#0d0d14)
- Monospace font
- Copy button on hover
- Copy confirmation feedback
- Basic text styling (no syntax highlighting in MVP)

**Implementation**:

Create `components/deck/CodeBlock.tsx`:
```typescript
'use client';

import { useState } from 'react';

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
  showCopy?: boolean;
}

export function CodeBlock({
  children,
  language = 'typescript',
  className = '',
  showCopy = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl p-4 overflow-x-auto">
        <pre className="text-[#888888] font-mono text-sm whitespace-pre-wrap">
          {children}
        </pre>
      </div>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="
            absolute top-2 right-2
            px-2 py-1 text-xs
            bg-white/[0.05] hover:bg-white/[0.1]
            border border-white/[0.08] rounded
            text-[#888888] hover:text-[#f5f5f5]
            opacity-0 group-hover:opacity-100
            transition-all duration-200
          "
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/CodeBlock.tsx`
- [ ] Copy button appears on hover
- [ ] Click copies content to clipboard
- [ ] "Copied!" feedback shows for 2 seconds
- [ ] Monospace font applied
- [ ] Horizontal scroll for long lines

---

### Task 4.6: Create ProgressBar Component

**Description**: Create fixed scroll progress indicator
**Size**: Small
**Priority**: Medium
**Dependencies**: None
**Can run parallel with**: All Phase 4 tasks

**Technical Requirements**:
- Fixed at top of viewport
- Scale based on scroll progress
- Configurable color (default gold)
- z-50 for layering

**Implementation**:

Create `components/deck/ProgressBar.tsx`:
```typescript
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

interface ProgressBarProps {
  color?: string;
}

export function ProgressBar({ color = '#d4a54a' }: ProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 origin-left z-50"
      style={{ scaleX, backgroundColor: color }}
    />
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/ProgressBar.tsx`
- [ ] Fixed at top of viewport
- [ ] Width scales with scroll position
- [ ] Default color is gold
- [ ] Smooth animation

---

### Task 4.7: Create NavDots Component

**Description**: Create side navigation dots for section jumping
**Size**: Small
**Priority**: Medium
**Dependencies**: None
**Can run parallel with**: All Phase 4 tasks

**Technical Requirements**:
- Fixed right side, vertically centered
- Show section label on hover
- Active state with gold color
- Hidden on mobile (<1024px)

**Implementation**:

Create `components/deck/NavDots.tsx`:
```typescript
'use client';

interface NavDotsProps {
  sections: { id: string; label: string }[];
  activeSection: string;
}

export function NavDots({ sections, activeSection }: NavDotsProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`
            group flex items-center gap-3
            ${activeSection === section.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}
            transition-opacity
          `}
        >
          <span className="text-xs text-right w-40 hidden group-hover:block text-[#555555]">
            {section.label}
          </span>
          <span
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${activeSection === section.id
                ? 'bg-[#d4a54a] scale-125'
                : 'bg-zinc-700 group-hover:bg-zinc-500'
              }
            `}
          />
        </a>
      ))}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/NavDots.tsx`
- [ ] Fixed right side positioning
- [ ] Hidden on screens < 1024px
- [ ] Active section dot is gold and larger
- [ ] Hover shows section label

---

### Task 4.8: Create Deck Components Barrel Export

**Description**: Create index.ts barrel export for deck components
**Size**: Small
**Priority**: High
**Dependencies**: Tasks 4.1-4.7
**Can run parallel with**: None

**Technical Requirements**:
- Export all deck components from single file
- Named exports for tree-shaking

**Implementation**:

Create `components/deck/index.ts`:
```typescript
export { Section } from './Section';
export { RevealText } from './RevealText';
export { SectionLabel } from './SectionLabel';
export { Card } from './Card';
export { CodeBlock } from './CodeBlock';
export { ProgressBar } from './ProgressBar';
export { NavDots } from './NavDots';
```

**Acceptance Criteria**:
- [ ] File created at `components/deck/index.ts`
- [ ] All components exportable: `import { Section, RevealText, ... } from '@/components/deck'`
- [ ] No circular dependencies

---

## Phase 5: Module Migration

### Task 5.1: Create Module Directory Structure

**Description**: Create directory structure for module pages
**Size**: Small
**Priority**: High
**Dependencies**: Task 3.3
**Can run parallel with**: None

**Implementation Steps**:
1. Create directories:
   ```bash
   mkdir -p app/learning/ai-workflow/getting-started
   mkdir -p app/learning/ai-workflow/claude-code-workflow
   mkdir -p app/learning/ai-workflow/existing-codebases
   mkdir -p app/learning/ai-workflow/orchestration-system
   ```

**Acceptance Criteria**:
- [ ] All 4 module directories created
- [ ] Ready for deck component files

---

### Task 5.2: Migrate GettingStartedDeck

**Description**: Migrate GettingStartedDeck to use shared components
**Size**: Large
**Priority**: High
**Dependencies**: Task 4.8, Task 5.1
**Can run parallel with**: Tasks 5.3, 5.4, 5.5

**Technical Requirements**:
- Import shared components from `@/components/deck`
- Remove inline component definitions
- Update typography to Instrument Serif (font-display)
- Update colors: gold=#d4a54a, bg=#0a0a0f
- Update section labels to use SectionLabel component
- Ensure all animations work correctly

**Implementation Steps**:
1. Copy `docs/learning-modules/GettingStartedDeck.tsx` to `app/learning/ai-workflow/getting-started/GettingStartedDeck.tsx`
2. Replace inline Section, RevealText, Card, CodeBlock with imports from `@/components/deck`
3. Update all `Playfair Display` references to `font-display` class
4. Update gold color from `#D4A84B` to `#d4a54a`
5. Update background from `#0a0a0a` to `#0a0a0f`
6. Replace inline section labels with `<SectionLabel number={1} label="SECTION" />`
7. Test scroll animations and navigation

**Acceptance Criteria**:
- [ ] File created at `app/learning/ai-workflow/getting-started/GettingStartedDeck.tsx`
- [ ] Uses shared components (no inline duplicates)
- [ ] Typography uses Instrument Serif
- [ ] Colors match design system
- [ ] All sections render and animate correctly
- [ ] NavDots work for navigation

---

### Task 5.3: Migrate ClaudeCodeWorkflowDeck

**Description**: Migrate ClaudeCodeWorkflowDeck to use shared components
**Size**: Large
**Priority**: High
**Dependencies**: Task 4.8, Task 5.1
**Can run parallel with**: Tasks 5.2, 5.4, 5.5

**Technical Requirements**:
- Same as Task 5.2
- Preserve Document Viewer functionality
- This is the most complex deck (~1900 lines)

**Implementation Steps**:
1. Copy `docs/learning-modules/ClaudeCodeWorkflowDeck.tsx` to `app/learning/ai-workflow/claude-code-workflow/ClaudeCodeWorkflowDeck.tsx`
2. Replace inline Section, RevealText, Card, CodeBlock with imports
3. Keep Document Viewer component inline (unique to this deck)
4. Update typography and colors per design system
5. Update section labels to use SectionLabel
6. Test Document Viewer panel functionality

**Acceptance Criteria**:
- [ ] File created at `app/learning/ai-workflow/claude-code-workflow/ClaudeCodeWorkflowDeck.tsx`
- [ ] Uses shared components
- [ ] Document Viewer still works
- [ ] Typography and colors updated
- [ ] All sections render correctly

---

### Task 5.4: Migrate ExistingCodebasesDeck

**Description**: Migrate ExistingCodebasesDeck to use shared components
**Size**: Large
**Priority**: High
**Dependencies**: Task 4.8, Task 5.1
**Can run parallel with**: Tasks 5.2, 5.3, 5.5

**Technical Requirements**:
- Same migration pattern as Task 5.2

**Implementation Steps**:
1. Copy `docs/learning-modules/ExistingCodebasesDeck.tsx` to `app/learning/ai-workflow/existing-codebases/ExistingCodebasesDeck.tsx`
2. Replace inline components with shared imports
3. Update typography and colors
4. Update section labels

**Acceptance Criteria**:
- [ ] File created at `app/learning/ai-workflow/existing-codebases/ExistingCodebasesDeck.tsx`
- [ ] Uses shared components
- [ ] Typography and colors updated
- [ ] All sections render correctly

---

### Task 5.5: Migrate OrchestrationSystemDeck

**Description**: Migrate OrchestrationSystemDeck to use shared components
**Size**: Large
**Priority**: High
**Dependencies**: Task 4.8, Task 5.1
**Can run parallel with**: Tasks 5.2, 5.3, 5.4

**Technical Requirements**:
- Same migration pattern as Task 5.2

**Implementation Steps**:
1. Copy `docs/learning-modules/OrchestrationSystemDeck.tsx` to `app/learning/ai-workflow/orchestration-system/OrchestrationSystemDeck.tsx`
2. Replace inline components with shared imports
3. Update typography and colors
4. Update section labels

**Acceptance Criteria**:
- [ ] File created at `app/learning/ai-workflow/orchestration-system/OrchestrationSystemDeck.tsx`
- [ ] Uses shared components
- [ ] Typography and colors updated
- [ ] All sections render correctly

---

## Phase 6: Polish & Documentation

### Task 6.1: Add Module Completion Button

**Description**: Add manual "Mark Complete" button to module footer
**Size**: Medium
**Priority**: Medium
**Dependencies**: Task 2.2, Phase 5 tasks
**Can run parallel with**: Task 6.2

**Technical Requirements**:
- Button at end of each module
- Calls markModuleCompleted from progress.ts
- Shows completion state
- Links back to course page

**Implementation**:

Add to each deck component's final section:
```typescript
// Add to imports
import { markModuleCompleted, isModuleCompleted } from '@/lib/progress';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Add component or inline in final section
function ModuleCompleteButton({ courseId, moduleSlug }: { courseId: string; moduleSlug: string }) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isModuleCompleted(courseId, moduleSlug));
  }, [courseId, moduleSlug]);

  const handleComplete = () => {
    markModuleCompleted(courseId, moduleSlug);
    setCompleted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-12">
      {completed ? (
        <p className="text-[#4ade80] font-medium">✓ Module Completed</p>
      ) : (
        <button
          onClick={handleComplete}
          className="px-6 py-3 bg-[#d4a54a] text-black font-medium rounded-xl hover:bg-[#e4b55a] transition-colors"
        >
          Mark as Complete
        </button>
      )}
      <Link
        href="/learning/ai-workflow"
        className="text-[#888888] hover:text-[#f5f5f5] text-sm transition-colors"
      >
        ← Back to Course
      </Link>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Button appears at end of each module
- [ ] Clicking marks module as complete
- [ ] Shows green checkmark after completion
- [ ] Back link returns to course page

---

### Task 6.2: Create Component System Guide

**Description**: Create developer documentation for learning module components
**Size**: Medium
**Priority**: Medium
**Dependencies**: Phase 4 complete
**Can run parallel with**: Task 6.1

**Technical Requirements**:
- Document all shared deck components
- Props and usage examples
- Design tokens reference
- Common patterns

**Implementation**:

Create `docs/developer-guides/learning-module-components.md`:
```markdown
# Learning Module Components Guide

## Overview

This guide documents the shared component system for 33 Strategies learning modules (scrollytelling decks).

## Design Tokens

### Colors
- Background: `#0a0a0f` (dark with blue undertone)
- Surface: `#111114` (cards, elevated)
- Elevated: `#0d0d14` (code blocks)
- Text Primary: `#f5f5f5`
- Text Muted: `#888888`
- Text Dim: `#555555`
- Gold Accent: `#d4a54a`
- Border: `rgba(255,255,255,0.08)`

### Typography
- Display: `font-display` (Instrument Serif)
- Body: `font-body` (DM Sans)
- Mono: `font-mono` (JetBrains Mono)

## Components

### Section
Full-viewport scroll section with fade animation.

```tsx
import { Section } from '@/components/deck';

<Section id="intro" fullHeight={true}>
  <div className="max-w-5xl mx-auto">
    {/* Content */}
  </div>
</Section>
```

Props:
- `id` (required): Unique section identifier
- `className`: Additional Tailwind classes
- `fullHeight`: Default true, sets min-h-screen

### RevealText
Animated text container with slide-up reveal.

```tsx
import { RevealText } from '@/components/deck';

<RevealText delay={0}>First item</RevealText>
<RevealText delay={0.1}>Second item</RevealText>
<RevealText delay={0.2}>Third item</RevealText>
```

Props:
- `delay`: Animation delay in seconds (for staggering)
- `className`: Additional classes

### SectionLabel
Formatted section label (e.g., "01 — THE THESIS").

```tsx
import { SectionLabel } from '@/components/deck';

<SectionLabel number={1} label="THE THESIS" />
// Renders: "01 — THE THESIS"
```

Props:
- `number`: Section number (auto-padded to 2 digits)
- `label`: Section name (uppercase)

### Card
Content card with optional highlight/glow.

```tsx
import { Card } from '@/components/deck';

<Card highlight>Important content</Card>
<Card glow>Featured content</Card>
```

Props:
- `highlight`: Gold border (50% opacity)
- `glow`: Gold box-shadow
- `className`: Additional classes

### CodeBlock
Code display with copy button.

```tsx
import { CodeBlock } from '@/components/deck';

<CodeBlock language="typescript">
{`const x = 1;`}
</CodeBlock>
```

Props:
- `children`: Code string
- `language`: Language hint (no syntax highlighting in MVP)
- `showCopy`: Show copy button (default true)

### ProgressBar
Fixed scroll progress indicator.

```tsx
import { ProgressBar } from '@/components/deck';

<ProgressBar color="#d4a54a" />
```

Props:
- `color`: Bar color (default gold)

### NavDots
Side navigation dots.

```tsx
import { NavDots } from '@/components/deck';

const sections = [
  { id: 'intro', label: 'Introduction' },
  { id: 'main', label: 'Main Content' },
];

<NavDots sections={sections} activeSection={activeSection} />
```

Props:
- `sections`: Array of { id, label }
- `activeSection`: Currently active section ID

## Common Patterns

### Section Structure
```tsx
<Section id="section-name">
  <div className="max-w-5xl mx-auto">
    <RevealText delay={0}>
      <SectionLabel number={1} label="SECTION NAME" />
    </RevealText>
    <RevealText delay={0.1}>
      <h2 className="font-display text-4xl md:text-5xl">
        Headline with <span className="text-[#d4a54a]">gold accent</span>
      </h2>
    </RevealText>
    <RevealText delay={0.2}>
      <p className="text-[#888888]">Body text content</p>
    </RevealText>
  </div>
</Section>
```

### Animation Timing
Stagger content with 0.1s increments:
- Label: delay={0}
- Headline: delay={0.1}
- Body: delay={0.2}
- CTA/Card: delay={0.3}

### Responsive Typography
```tsx
className="text-4xl md:text-5xl lg:text-6xl"
```
```

**Acceptance Criteria**:
- [ ] File created at `docs/developer-guides/learning-module-components.md`
- [ ] All components documented with props
- [ ] Design tokens listed
- [ ] Common patterns explained
- [ ] Code examples included

---

### Task 6.3: Test Authentication Flows

**Description**: Manual testing of Google SSO and email/password auth
**Size**: Small
**Priority**: High
**Dependencies**: Phase 1 complete
**Can run parallel with**: Task 6.2

**Test Cases**:
1. Google SSO with @33strategies.ai email → Success
2. Google SSO with other domain → Rejected with error
3. Email/password with @33strategies.ai + correct password → Success
4. Email/password with @33strategies.ai + wrong password → Rejected
5. Email/password with other domain → Rejected
6. Logout button → Returns to login screen
7. Direct URL access when logged out → Redirects to login
8. Session persistence across page refresh

**Acceptance Criteria**:
- [ ] All 8 test cases pass
- [ ] Error messages are user-friendly
- [ ] No console errors during auth flows

---

### Task 6.4: Update CLAUDE.md

**Description**: Add learning platform patterns to CLAUDE.md
**Size**: Small
**Priority**: Low
**Dependencies**: Phase 5 complete
**Can run parallel with**: Task 6.2, 6.3

**Implementation**:

Add section to CLAUDE.md:
```markdown
## Learning Platform

### Routes
- `/learning` - Dashboard (requires auth)
- `/learning/ai-workflow` - Course landing
- `/learning/ai-workflow/[module]` - Module pages

### Components
Learning module components are in `components/deck/`:
- Section, RevealText, Card, CodeBlock, NavDots, ProgressBar, SectionLabel

### Authentication
Uses NextAuth.js v5 with:
- Google OAuth (restricted to @33strategies.ai)
- Email/password (LEARNING_PASSWORD env var)

Configuration: `lib/auth.ts`
```

**Acceptance Criteria**:
- [ ] CLAUDE.md updated with learning platform section
- [ ] Routes documented
- [ ] Component locations noted
- [ ] Auth pattern explained

---

### Task 6.5: Configure Environment Variables on Railway

**Description**: Add required environment variables to Railway deployment
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: All other Phase 6 tasks

**Implementation**:
```bash
railway variables --set "GOOGLE_CLIENT_ID=<value>"
railway variables --set "GOOGLE_CLIENT_SECRET=<value>"
railway variables --set "NEXTAUTH_SECRET=<generated-32-char-hex>"
railway variables --set "NEXTAUTH_URL=https://your-domain.railway.app"
railway variables --set "LEARNING_PASSWORD=<chosen-password>"
```

**Acceptance Criteria**:
- [ ] All 5 environment variables set in Railway
- [ ] NEXTAUTH_URL matches production domain
- [ ] Deployment works with auth enabled

---

## Dependency Graph

```
Phase 1: Authentication Foundation
┌─────────────────────────────────────────────────────────────┐
│ 1.1 Install NextAuth                                        │
│   ↓                                                         │
│ 1.2 Type Extensions ←──────────┬──────────→ 1.3 Allowlist  │
│   ↓                            │                            │
│ 1.4 Auth Config ←──────────────┘                            │
│   ↓                                                         │
│ 1.5 API Route                                               │
│   ↓                                                         │
│ 1.6 AuthGate ←─────────────────────────→ 1.7 LogoutButton  │
└─────────────────────────────────────────────────────────────┘

Phase 2: Dashboard (parallel with Phase 1 where possible)
┌─────────────────────────────────────────────────────────────┐
│ 2.1 Course Registry ←──────→ 2.2 Progress ←──→ 2.3 Layout  │
│   ↓                                                         │
│ 2.4 CourseCard                                              │
│   ↓                                                         │
│ 2.5 Dashboard Page (requires 1.4, 1.6, 2.1, 2.3, 2.4)      │
└─────────────────────────────────────────────────────────────┘

Phase 3: Course Pages
┌─────────────────────────────────────────────────────────────┐
│ 3.1 ModuleCard (requires 2.1, 2.2)                         │
│   ↓                                                         │
│ 3.2 Course Landing (requires 1.4, 1.7, 2.1, 3.1)           │
│   ↓                                                         │
│ 3.3 Module Dynamic Route (requires 1.4, 2.1)               │
└─────────────────────────────────────────────────────────────┘

Phase 4: Shared Components (ALL PARALLEL)
┌─────────────────────────────────────────────────────────────┐
│ 4.1 Section ←→ 4.2 RevealText ←→ 4.3 SectionLabel         │
│     ↕              ↕                   ↕                    │
│ 4.4 Card ←→ 4.5 CodeBlock ←→ 4.6 ProgressBar ←→ 4.7 NavDots│
│                      ↓                                      │
│                 4.8 Barrel Export (after all)               │
└─────────────────────────────────────────────────────────────┘

Phase 5: Module Migration (ALL PARALLEL after 4.8)
┌─────────────────────────────────────────────────────────────┐
│ 5.1 Directory Structure                                     │
│   ↓                                                         │
│ 5.2 GettingStarted ←→ 5.3 Workflow ←→ 5.4 Codebases ←→ 5.5 │
└─────────────────────────────────────────────────────────────┘

Phase 6: Polish (parallel where noted)
┌─────────────────────────────────────────────────────────────┐
│ 6.1 Completion Button ←→ 6.2 Component Guide ←→ 6.3 Auth Test│
│                             ↓                               │
│                   6.4 Update CLAUDE.md                      │
│                             ↓                               │
│                   6.5 Railway Env Vars                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| 1: Auth Foundation | 7 | 1.2 ∥ 1.3, 1.6 ∥ 1.7 |
| 2: Dashboard | 5 | 2.1 ∥ 2.2 ∥ 2.3 |
| 3: Course Pages | 3 | Limited |
| 4: Deck Components | 8 | 4.1-4.7 all parallel |
| 5: Module Migration | 5 | 5.2-5.5 all parallel |
| 6: Polish | 5 | 6.1 ∥ 6.2 ∥ 6.3 |
| **Total** | **33 tasks** | |

**Critical Path**: 1.1 → 1.4 → 1.5 → 1.6 → 2.5 → 3.2 → 3.3 → 4.8 → 5.2-5.5 → 6.1

**Estimated Effort**: Large (significant new feature with auth, routing, and component library)
