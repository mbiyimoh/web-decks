# Feature: learn.33strategies.ai Internal Learning Platform

**Status:** Validated
**Authors:** Claude Code
**Date:** 2025-12-29
**Related:** [Ideation Document](../docs/ideation/learn-33strategies-ai-platform.md), [Design System](./../.claude/skills/33-strategies-frontend-design.md)

---

## Overview

Build an internal learning platform at `/learning` for 33 Strategies team members and contractors. The platform features hybrid authentication (Google SSO + email/password) restricted to `@33strategies.ai` emails plus an allowlist, a course catalog starting with "33 Strategies AI Workflow: For Builders", and standardized scrollytelling learning modules.

---

## Background / Problem Statement

33 Strategies needs to train people on AI-assisted development workflows. The training content exists as scrollytelling decks in `docs/learning-modules/`, but:

**Current Problems:**
1. No authentication - content isn't protected
2. No central access point - modules are isolated files
3. Inconsistent design - each deck duplicates components with slight variations
4. Typography mismatch - decks use Playfair Display instead of Instrument Serif
5. No progress tracking - users can't see what they've completed
6. No shared component library - ~1600 lines of duplicated code across 4 decks

**Learning platform solves these by:**
- Restricting access to `@33strategies.ai` domain + allowlist
- Providing a unified dashboard with course catalog
- Standardizing all modules to the 33 Strategies design system
- Creating a shared component library for learning content
- Adding progress persistence (localStorage initially, database later)

---

## Goals

### Authentication
- Implement hybrid auth: Google SSO + email/password
- Restrict access to `@33strategies.ai` email domain
- Support email allowlist for external users (clients, contractors)
- Integrate with existing iron-session pattern

### Learning Dashboard
- Create `/learning` route as platform entry point
- Display course catalog as grid of tiles
- Show course metadata (title, description, module count, estimated time)
- Display user progress per course (if logged in)

### Course Structure
- Create `/learning/ai-workflow` for first course
- Display module list with descriptions and estimated times
- Support flexible access (any order, no enforced progression)
- Track completion status per module

### Module Standardization
- Move learning modules from `docs/learning-modules/` to `app/learning/`
- Extract shared components to `components/deck/`
- Migrate typography from Playfair Display to Instrument Serif
- Standardize colors to design system (`#d4a54a` gold, `#0a0a0f` background)
- Apply consistent section label format (`01 — SECTION NAME`)

### Component System
- Create reusable deck components: Section, RevealText, Card, CodeBlock, etc.
- Create component system guide documentation
- *(Deferred to Phase 2: DocumentViewer tabs, syntax highlighting)*

### Progress Persistence
- Track module completion in localStorage (MVP)
- Display progress indicators on course and module levels
- *(Deferred to Phase 2: "Continue where you left off" feature)*

---

## Non-Goals

- Payment/subscription system
- Video content or live sessions
- Comments or discussion features
- Mobile-first optimization (desktop-first)
- Public-facing content or marketing
- Multi-tenant support (other organizations)
- Enforced linear progression (flexible access for now)
- Real-time collaboration features

---

## Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | ^14.2.0 | App Router, dynamic routes, Server Components |
| NextAuth.js | ^5.0.0 | Google OAuth, session management |
| React | ^18.2.0 | UI components |
| Framer Motion | ^11.0.0 | Scroll animations |
| Tailwind CSS | ^3.4.0 | Styling |
| TypeScript | ^5.0.0 | Type safety |

**Key References:**
- [NextAuth.js v5 App Router](https://authjs.dev/getting-started/installation)
- [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)

---

## Detailed Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Request Flow                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   User visits /learning                                             │
│         │                                                           │
│         ▼                                                           │
│   ┌──────────────┐                                                  │
│   │ layout.tsx   │ ─── Check session ─── Valid? ──► Show Dashboard  │
│   │ (auth check) │                                                  │
│   └──────┬───────┘                                                  │
│          │ No valid session                                         │
│          ▼                                                          │
│   ┌──────────────┐                                                  │
│   │ AuthGate     │ ─── Show login options                           │
│   │ Component    │     1. Google SSO button                         │
│   └──────┬───────┘     2. Email/password form                       │
│          │                                                          │
│          ▼                                                          │
│   ┌──────────────┐     ┌─────────────────┐                          │
│   │ Submit auth  │────►│ Validate:       │                          │
│   │              │     │ - Email domain  │                          │
│   └──────────────┘     │ - Allowlist     │                          │
│                        └────────┬────────┘                          │
│                                 │ Valid                             │
│                                 ▼                                   │
│                        ┌─────────────────┐                          │
│                        │ Create session  │──► Redirect to /learning │
│                        │ + set progress  │                          │
│                        └─────────────────┘                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
app/
├── learning/
│   ├── layout.tsx                    # Auth check wrapper
│   ├── page.tsx                      # Learning dashboard (course grid)
│   ├── ai-workflow/
│   │   ├── page.tsx                  # Course landing (module list)
│   │   ├── getting-started/
│   │   │   └── page.tsx              # Module 1
│   │   ├── claude-code-workflow/
│   │   │   └── page.tsx              # Module 2
│   │   ├── existing-codebases/
│   │   │   └── page.tsx              # Module 3
│   │   └── orchestration-system/
│   │       └── page.tsx              # Module 4
│   └── components/
│       ├── AuthGate.tsx              # Login options (Google + email)
│       ├── CourseCard.tsx            # Course tile for dashboard
│       ├── ModuleCard.tsx            # Module item for course page
│       └── LogoutButton.tsx          # Sign out button
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts              # NextAuth.js routes
│       └── [client]/                 # Existing client portal auth
│           └── route.ts

components/
├── deck/                             # Shared deck components
│   ├── Section.tsx                   # Full-viewport scroll section
│   ├── RevealText.tsx                # Animated text reveal
│   ├── ProgressBar.tsx               # Scroll progress indicator
│   ├── NavDots.tsx                   # Side navigation dots
│   ├── Card.tsx                      # Content card
│   ├── CodeBlock.tsx                 # Code display (basic styling)
│   ├── SectionLabel.tsx              # "01 — SECTION" label
│   └── index.ts                      # Barrel export
├── portal/                           # Existing portal components
│   └── ...
└── ui/                               # Generic UI components
    └── ...

lib/
├── auth.ts                           # NextAuth config + validators
├── auth-types.ts                     # NextAuth TypeScript extensions
├── email-allowlist.ts                # Email allowlist config (static)
├── courses.ts                        # Course registry
├── progress.ts                       # Progress tracking (simplified)
├── session.ts                        # Existing iron-session
└── clients.ts                        # Existing client registry

docs/
├── learning-modules/                 # Original files (reference only)
│   └── ...
├── ideation/
│   └── learn-33strategies-ai-platform.md
└── developer-guides/
    └── learning-module-components.md # Component system guide
```

### Email Validation

**lib/email-allowlist.ts**
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

### NextAuth Configuration

**lib/auth-types.ts** (TypeScript extensions)
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

**lib/auth.ts**
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

**app/api/auth/[...nextauth]/route.ts**
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

### Course Registry

**lib/courses.ts**
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

### Progress Tracking (Simplified)

**lib/progress.ts**
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

### Learning Layout (Auth Wrapper)

**app/learning/layout.tsx**
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

### Course Landing Page

**app/learning/ai-workflow/page.tsx**
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

### Module Card Component

**app/learning/components/ModuleCard.tsx**
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

### Logout Button Component

**app/learning/components/LogoutButton.tsx**
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

### Module Page Template

**app/learning/ai-workflow/[module]/page.tsx** (template pattern)
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

### Shared Deck Components

**components/deck/Section.tsx**
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

**components/deck/RevealText.tsx**
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

**components/deck/SectionLabel.tsx**
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

**components/deck/Card.tsx**
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

**components/deck/CodeBlock.tsx**
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

**components/deck/ProgressBar.tsx**
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

**components/deck/NavDots.tsx**
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

**components/deck/index.ts**
```typescript
export { Section } from './Section';
export { RevealText } from './RevealText';
export { SectionLabel } from './SectionLabel';
export { Card } from './Card';
export { CodeBlock } from './CodeBlock';
export { ProgressBar } from './ProgressBar';
export { NavDots } from './NavDots';
```

### Auth Gate Component

**app/learning/components/AuthGate.tsx**
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

### Learning Dashboard

**app/learning/page.tsx**
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

### Course Card Component

**app/learning/components/CourseCard.tsx**
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

---

## User Experience

### URL Patterns

| URL | Content | Auth |
|-----|---------|------|
| `/learning` | Dashboard (course grid) | Required |
| `/learning/ai-workflow` | Course landing (module list) | Required |
| `/learning/ai-workflow/getting-started` | Module 1 | Required |
| `/learning/ai-workflow/claude-code-workflow` | Module 2 | Required |
| `/learning/ai-workflow/existing-codebases` | Module 3 | Required |
| `/learning/ai-workflow/orchestration-system` | Module 4 | Required |

### User Flow

```
1. User visits /learning

2. First visit (no session):
   → See AuthGate with Google SSO + Email options
   → Click "Continue with Google"
   → Google validates @33strategies.ai email
   → Redirect back → See dashboard

3. Subsequent visits (valid session):
   → See dashboard immediately
   → Click course → See module list
   → Click module → View scrollytelling content
   → Scroll to end → Module marked complete
   → Return to course → See progress indicator

4. Email/password flow:
   → Click "Sign in with Email"
   → Enter email + password
   → Validate @33strategies.ai domain
   → Success → See dashboard
```

---

## Testing Strategy

### Unit Tests

**Test: Email Validation**
```typescript
describe('isEmailAllowed', () => {
  it('allows @33strategies.ai emails', () => {
    expect(isEmailAllowed('user@33strategies.ai')).toBe(true);
  });

  it('rejects other domains', () => {
    expect(isEmailAllowed('user@gmail.com')).toBe(false);
  });

  it('allows emails in allowlist', () => {
    addToAllowlist('allowed@external.com');
    expect(isEmailAllowed('allowed@external.com')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isEmailAllowed('USER@33STRATEGIES.AI')).toBe(true);
  });
});
```

**Test: Progress Tracking**
```typescript
describe('progress tracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks module as completed', () => {
    markModuleCompleted('ai-workflow', 'getting-started');
    expect(isModuleCompleted('ai-workflow', 'getting-started')).toBe(true);
  });

  it('returns false for incomplete modules', () => {
    expect(isModuleCompleted('ai-workflow', 'getting-started')).toBe(false);
  });

  it('counts completed modules per course', () => {
    markModuleCompleted('ai-workflow', 'getting-started');
    markModuleCompleted('ai-workflow', 'claude-code-workflow');
    expect(getCompletedCount('ai-workflow')).toBe(2);
  });

  it('does not double-count completions', () => {
    markModuleCompleted('ai-workflow', 'getting-started');
    markModuleCompleted('ai-workflow', 'getting-started');
    expect(getCompletedCount('ai-workflow')).toBe(1);
  });
});
```

### E2E Tests (Playwright)

**Test: Authentication Flow**
```typescript
test.describe('Learning Platform Auth', () => {
  test('shows auth gate when not logged in', async ({ page }) => {
    await page.goto('/learning');
    await expect(page.locator('text=Learning Platform')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('rejects non-33strategies emails', async ({ page }) => {
    await page.goto('/learning');
    await page.click('text=Sign in with Email');
    await page.fill('input[type="email"]', 'user@gmail.com');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Access is restricted')).toBeVisible();
  });

  test('accepts 33strategies emails', async ({ page }) => {
    // Note: Requires test env setup with valid credentials
    await page.goto('/learning');
    await page.click('text=Sign in with Email');
    await page.fill('input[type="email"]', 'test@33strategies.ai');
    await page.fill('input[type="password"]', process.env.LEARNING_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Your Courses')).toBeVisible();
  });
});
```

**Test: Module Navigation**
```typescript
test.describe('Course Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/learning');
    await page.click('text=Sign in with Email');
    await page.fill('input[type="email"]', 'test@33strategies.ai');
    await page.fill('input[type="password"]', process.env.LEARNING_PASSWORD!);
    await page.click('button[type="submit"]');
  });

  test('displays course with modules', async ({ page }) => {
    await page.click('text=33 Strategies AI Workflow');
    await expect(page.locator('text=Getting Started')).toBeVisible();
    await expect(page.locator('text=The Claude Code Workflow')).toBeVisible();
  });

  test('navigates to module and shows content', async ({ page }) => {
    await page.click('text=33 Strategies AI Workflow');
    await page.click('text=Getting Started');
    await expect(page.locator('h1')).toContainText('Getting Started');
  });
});
```

---

## Performance Considerations

### Code Splitting
- Each course module is dynamically imported
- Deck components are shared, not duplicated
- Auth components only load when needed

### Bundle Sizes

| Route | Expected Size |
|-------|---------------|
| `/learning` (dashboard) | ~15KB |
| `/learning/[course]` (course page) | ~10KB |
| Module (deck content) | ~40-60KB each |
| Shared deck components | ~8KB (shared) |

### Caching
- Static metadata for courses
- Dynamic auth check on each page
- localStorage for progress (client-side)

---

## Security Considerations

### Authentication
- Google OAuth validates actual Google account
- Email domain validated in OAuth callback
- Credentials validated against env var
- Session cookies: `httpOnly`, `secure`, `sameSite: lax`

### Authorization
- All `/learning/*` routes require auth
- Email must be @33strategies.ai OR in allowlist
- No per-module permissions (all-or-nothing access)

### Environment Variables
```bash
# New for learning platform
GOOGLE_CLIENT_ID           # OAuth client ID
GOOGLE_CLIENT_SECRET       # OAuth client secret
NEXTAUTH_SECRET            # NextAuth session secret
NEXTAUTH_URL               # OAuth callback base URL
LEARNING_PASSWORD          # Email/password auth
```

---

## Implementation Phases

### Phase 1: Authentication Foundation
1. Install NextAuth.js v5
2. Create `lib/auth-types.ts` TypeScript extensions
3. Create `lib/auth.ts` with Google + Credentials providers
4. Create `lib/email-allowlist.ts` (static allowlist)
5. Create `/api/auth/[...nextauth]/route.ts`
6. Create `AuthGate` component
7. Create `LogoutButton` component

### Phase 2: Learning Dashboard & Structure
1. Create `lib/courses.ts` course registry
2. Create `lib/progress.ts` progress tracking (simplified)
3. Create `/learning/layout.tsx` wrapper
4. Create `/learning/page.tsx` dashboard
5. Create `CourseCard` component

### Phase 3: Course Pages
1. Create `/learning/ai-workflow/page.tsx` course landing
2. Create `ModuleCard` component
3. Create `/learning/ai-workflow/[module]/page.tsx` dynamic route

### Phase 4: Shared Deck Components
1. Create `components/deck/` directory
2. Extract: Section, RevealText, Card, CodeBlock, NavDots, ProgressBar, SectionLabel
3. Create barrel export `index.ts`
4. Ensure design system compliance (Instrument Serif, #d4a54a, #0a0a0f)

### Phase 5: Module Migration
1. Migrate GettingStartedDeck → use shared components
2. Migrate ClaudeCodeWorkflowDeck → use shared components
3. Migrate ExistingCodebasesDeck → use shared components
4. Migrate OrchestrationSystemDeck → use shared components
5. Move all to `app/learning/ai-workflow/[module]/` structure

### Phase 6: Polish & Documentation
1. Add manual "Mark Complete" button to module footer
2. Test auth flows (Google + email/password)
3. Create `docs/developer-guides/learning-module-components.md`
4. Update CLAUDE.md with learning platform patterns
5. Add env vars to Railway and deploy

---

## Open Questions

None - all decisions resolved per user clarifications.

---

## References

- [Ideation Document](../docs/ideation/learn-33strategies-ai-platform.md)
- [33 Strategies Design System](../.claude/skills/33-strategies-frontend-design.md)
- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)
- [Existing Client Portal Spec](./feat-client-portal-architecture.md)
