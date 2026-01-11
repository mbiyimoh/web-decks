# Persona Sharpener Validation Sharing System

**Status:** Draft
**Authors:** Claude Code
**Date:** 2026-01-09
**Related:**
- Ideation: `docs/ideation/persona-sharpener-validation-sharing.md`
- Handoff: `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-handoff.md`

---

## Overview

Enable founders to share a validation link for each persona with real potential customers who can complete the persona questionnaire without requiring an account. Validators answer questions using the `validationQuestion` text framing (e.g., "Which age range best describes you?" instead of "Your ideal customer is more likely to be..."), and their responses are tagged as validations vs. the founder's assumptions.

**Core Flow:**
1. Founder completes persona sharpening (Mode 1: Sharpen) → responses tagged as `assumption`
2. Founder clicks "Share for Validation" → auto-generates one permanent link per persona
3. Validators access `/validate/:slug` → complete questionnaire → responses tagged as `validation`
4. Founder views validation responses organized by question or by individual session

---

## Background/Problem Statement

Founders build customer personas based on their assumptions, but these assumptions may not match reality. Without validation from real potential customers, founders risk building products for imaginary personas.

The Persona Sharpener already captures founder assumptions with confidence levels. This feature closes the loop by enabling validation from real users, allowing founders to see where their mental model aligns with reality and where it needs adjustment.

**Key insight from the handoff doc:** The question bank already has dual framing - `question` for founders (assumption mode) and `validationQuestion` for validators - making this a natural extension of the existing system.

---

## Goals

- Enable founders to generate a shareable validation link for each persona
- Allow validators to complete the questionnaire without creating accounts
- Store validator responses tagged as `validation` with `respondentRole: 'real-user'`
- Support localStorage-based progress saving for validators (no server storage until submission)
- Provide founders with two views: per-question aggregated and individual session drill-down
- Create a thoughtful thank-you experience with optional email collection for beta tester recruitment

---

## Non-Goals

- **Reconciliation analysis UI** - Deferred to future spec; this spec only covers raw response viewing
- **Alignment score calculations** - Scaffolded in schema but not implemented in UI
- **Multiple links per persona** - One auto-generated link per persona for MVP
- **Notifications** - No email alerts when validators complete
- **Voice input in validation mode** - Text-only for MVP
- **Custom branding** - All validation pages use standard 33 Strategies branding
- **Incentive systems** - No rewards for validators
- **Automated follow-up emails** - Out of scope

---

## Technical Dependencies

| Dependency | Version | Usage |
|------------|---------|-------|
| Next.js | 14.x | App Router for `/validate/[slug]` route |
| Prisma | 5.x | Database models for ValidationLink, ValidationSession |
| React | 18.x | Validation questionnaire components |
| Framer Motion | 10.x | Animations (reuse from existing questionnaire) |
| crypto | Node.js built-in | Secure slug generation |

---

## Detailed Design

### 1. Database Schema Changes

Add new models to `prisma/schema.prisma`:

```prisma
// ============================================================================
// VALIDATION SHARING - For real-user validation of founder assumptions
// ============================================================================

model ValidationLink {
  id              String    @id @default(cuid())

  // Relationship - ONE link per persona
  personaId       String    @unique  // Ensures one link per persona
  persona         Persona   @relation(fields: [personaId], references: [id], onDelete: Cascade)

  // Creator
  createdBy       String    // User ID of founder

  // Link identifier
  slug            String    @unique  // 16 hex chars, auto-generated

  // Lifecycle (optional settings, not exposed in MVP)
  isActive        Boolean   @default(true)
  expiresAt       DateTime?
  maxResponses    Int?

  // Tracking
  totalResponses  Int       @default(0)

  // Sessions
  sessions        ValidationSession[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([slug])
}

model ValidationSession {
  id                String    @id @default(cuid())

  // Relationships
  validationLinkId  String
  validationLink    ValidationLink @relation(fields: [validationLinkId], references: [id], onDelete: Cascade)
  personaId         String    // Denormalized for query convenience

  // Respondent info (optional - collected at end)
  respondentEmail   String?
  respondentName    String?

  // Progress
  status            String    @default("in_progress")  // in_progress | completed | abandoned
  questionsAnswered Int       @default(0)

  // Timestamps
  startedAt         DateTime  @default(now())
  completedAt       DateTime?

  createdAt         DateTime  @default(now())

  @@index([validationLinkId])
  @@index([personaId])
  @@index([status])
}
```

Update existing `Persona` model:

```prisma
model Persona {
  // ... existing fields ...

  // Add relation to validation link
  validationLink ValidationLink?
}
```

Update existing `Response` model - extend for validation responses:

```prisma
model Response {
  id        String  @id @default(cuid())
  personaId String
  persona   Persona @relation(fields: [personaId], references: [id], onDelete: Cascade)

  // Session linkage - EITHER sharpener session OR validation session (mutually exclusive)
  sessionId           String?           // For founder assumption responses
  session             SharpenerSession? @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  validationSessionId String?           // For validator responses

  questionId String
  field      String
  value      Json

  // Metadata
  isUnsure          Boolean @default(false)
  confidence        Int     @default(50)
  additionalContext String?
  contextSource     String?

  // Tagging - determines which session field is populated
  responseType   String // 'assumption' | 'validation'
  respondentId   String // User ID for founders, ValidationSession ID for validators
  respondentRole String // 'founder' | 'real-user'
  respondentName String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([personaId])
  @@index([sessionId])
  @@index([validationSessionId])
  @@index([questionId])
}
```

**Important:** `sessionId` and `validationSessionId` are mutually exclusive:
- Founder responses: `sessionId` populated, `validationSessionId` null, `responseType: 'assumption'`
- Validator responses: `sessionId` null, `validationSessionId` populated, `responseType: 'validation'`

This requires making `sessionId` nullable in the migration, which is safe since all existing responses have valid session IDs.

### 2. API Routes

#### Public Routes (No Auth)

```
GET  /api/validate/[slug]
```
- Fetch validation link metadata and persona context
- Returns: persona name, question count, link status
- Validates: link exists, is active, not expired, not at max responses

```
POST /api/validate/[slug]/start
```
- Creates a new ValidationSession
- Returns: sessionId (used as auth token for subsequent requests)
- Updates: link view count (optional analytics)

```
POST /api/validate/[slug]/responses
```
- Submit a single response
- Body: `{ sessionId, questionId, value, confidence, additionalContext? }`
- Creates Response record with `responseType: 'validation'`, `respondentRole: 'real-user'`
- Updates: session.questionsAnswered

```
POST /api/validate/[slug]/complete
```
- Mark session as completed
- Body: `{ sessionId, respondentEmail?, respondentName? }`
- Updates: session.status = 'completed', session.completedAt
- Updates: link.totalResponses (atomic increment)

#### Authenticated Routes (Founder Only)

```
GET  /api/personas/[personaId]/validation-link
```
- Get or auto-create the validation link for this persona
- If no link exists: generate slug, create link, return it
- If link exists: return it
- Returns: { slug, url, totalResponses, isActive, createdAt }

```
PATCH /api/personas/[personaId]/validation-link
```
- Update link settings (isActive, expiresAt, maxResponses)
- For MVP: Only expose isActive toggle

```
GET  /api/personas/[personaId]/validation-responses
```
- Fetch all validation responses for this persona
- Query params: `?view=by-question` (default) or `?view=by-session`
- Returns structured data for UI rendering

```
GET  /api/personas/[personaId]/validation-sessions
```
- List all completed validation sessions
- Returns: session list with respondent info, completion date, question count

```
GET  /api/personas/[personaId]/validation-sessions/[sessionId]
```
- Get full responses for a specific validation session
- For individual session drill-down view

### 3. File Organization

```
app/
├── validate/
│   └── [slug]/
│       ├── page.tsx                    # Server component - validates link, renders client
│       ├── ValidationPage.tsx          # Client component - main questionnaire
│       ├── ValidationQuestion.tsx      # Single question renderer (validation mode)
│       ├── ValidationProgress.tsx      # Progress bar + question counter
│       ├── ValidationComplete.tsx      # Thank you page with email collection
│       └── useValidationProgress.ts    # localStorage hook for progress saving
│
├── api/
│   └── validate/
│       └── [slug]/
│           ├── route.ts                # GET - link metadata
│           ├── start/
│           │   └── route.ts            # POST - create session
│           ├── responses/
│           │   └── route.ts            # POST - submit response
│           └── complete/
│               └── route.ts            # POST - complete session
│
├── clarity-canvas/
│   └── modules/
│       └── persona-sharpener/
│           ├── components/
│           │   ├── ValidationShareButton.tsx   # "Share for Validation" button
│           │   ├── ValidationLinkModal.tsx     # Copy link + settings
│           │   ├── ValidationResponsesView.tsx # Founder's view of responses
│           │   ├── ByQuestionView.tsx          # Per-question aggregated view
│           │   └── BySessionView.tsx           # Individual session drill-down
│           └── [personaId]/
│               └── validation/
│                   └── page.tsx        # Founder's validation dashboard

lib/
└── clarity-canvas/
    └── modules/
        └── persona-sharpener/
            ├── validation-types.ts     # TypeScript types for validation
            ├── validation-utils.ts     # Slug generation, link helpers
            └── validation-questions.ts # Filter questions for validation mode
```

### 4. Slug Generation

```typescript
// lib/clarity-canvas/modules/persona-sharpener/validation-utils.ts
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function generateValidationSlug(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    // 16 hex characters = 8 bytes = 64 bits of entropy
    const slug = crypto.randomBytes(8).toString('hex');

    const exists = await prisma.validationLink.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!exists) return slug;
  }

  throw new Error('Failed to generate unique slug after 10 attempts');
}

export function getValidationUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clarity.33strategies.ai';
  return `${baseUrl}/validate/${slug}`;
}
```

### 5. Validation Question Filtering

Questions with `validationQuestion: null` are hidden in validation mode:

```typescript
// lib/clarity-canvas/modules/persona-sharpener/validation-questions.ts
import { questionSequence } from './questions';
import type { Question } from './types';

export function getValidationQuestions(): Question[] {
  return questionSequence.filter(q => q.validationQuestion !== null);
}

export function getValidationQuestionCount(): number {
  return getValidationQuestions().length;
}

// Currently filters out: 'not-customer' (antiPatterns)
// Result: 18 questions instead of 19
```

### 6. localStorage Progress Saving

```typescript
// app/validate/[slug]/useValidationProgress.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface ValidationProgress {
  slug: string;
  sessionId: string;
  currentQuestionIndex: number;
  responses: Record<string, {
    questionId: string;
    value: unknown;
    confidence: number;
    additionalContext?: string;
  }>;
  savedAt: number;
}

const STORAGE_KEY_PREFIX = 'validation-progress-';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useValidationProgress(slug: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${slug}`;

  const [progress, setProgress] = useState<ValidationProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ValidationProgress;
        // Check if not expired
        if (Date.now() - parsed.savedAt < MAX_AGE_MS) {
          setProgress(parsed);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.error('Failed to load validation progress:', e);
    }
    setIsLoaded(true);
  }, [storageKey]);

  const saveProgress = useCallback((data: Omit<ValidationProgress, 'savedAt' | 'slug'>) => {
    const toSave: ValidationProgress = {
      ...data,
      slug,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
      setProgress(toSave);
    } catch (e) {
      console.error('Failed to save validation progress:', e);
    }
  }, [slug, storageKey]);

  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setProgress(null);
    } catch (e) {
      console.error('Failed to clear validation progress:', e);
    }
  }, [storageKey]);

  return { progress, isLoaded, saveProgress, clearProgress };
}
```

### 7. Validation Page Component

```tsx
// app/validate/[slug]/ValidationPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useValidationProgress } from './useValidationProgress';
import { ValidationComplete } from './ValidationComplete';

// Reuse existing question components
import { ThisOrThat } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/ThisOrThat';
import { Slider } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/Slider';
import { Ranking } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/Ranking';
import { MultiSelect } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/MultiSelect';
import { FillBlank } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/FillBlank';
import { Scenario } from '@/app/clarity-canvas/modules/persona-sharpener/components/questions/Scenario';

interface Props {
  slug: string;
  personaName: string;
  questions: Question[];
}

export function ValidationPage({ slug, personaName, questions }: Props) {
  const { progress, isLoaded, saveProgress, clearProgress } = useValidationProgress(slug);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseData>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current question
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Resume from localStorage if available
  useEffect(() => {
    if (isLoaded && progress) {
      setSessionId(progress.sessionId);
      setCurrentIndex(progress.currentQuestionIndex);
      setResponses(progress.responses);
    }
  }, [isLoaded, progress]);

  // Start new session if needed
  useEffect(() => {
    async function startSession() {
      if (isLoaded && !sessionId && !progress?.sessionId) {
        try {
          const res = await fetch(`/api/validate/${slug}/start`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to start session');
          const data = await res.json();
          setSessionId(data.sessionId);
          saveProgress({ sessionId: data.sessionId, currentQuestionIndex: 0, responses: {} });
        } catch (e) {
          setError('Failed to start validation. Please refresh and try again.');
        }
      }
    }
    startSession();
  }, [isLoaded, sessionId, progress, slug, saveProgress]);

  const handleSubmitResponse = async () => {
    if (!sessionId || !currentQuestion) return;

    setIsLoading(true);
    setError(null);

    const responseData = responses[currentQuestion.id];

    try {
      const res = await fetch(`/api/validate/${slug}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          value: responseData.value,
          confidence: responseData.confidence,
          additionalContext: responseData.additionalContext,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit response');

      // Move to next or complete
      if (currentIndex < totalQuestions - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        saveProgress({ sessionId, currentQuestionIndex: nextIndex, responses });
      } else {
        setIsComplete(true);
      }
    } catch (e) {
      setError('Failed to save response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (email?: string, name?: string) => {
    if (!sessionId) return;

    try {
      await fetch(`/api/validate/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, respondentEmail: email, respondentName: name }),
      });

      clearProgress(); // Remove from localStorage
    } catch (e) {
      console.error('Failed to complete session:', e);
      // Don't block UI - session is effectively complete
    }
  };

  if (isComplete) {
    return <ValidationComplete personaName={personaName} onComplete={handleComplete} />;
  }

  // ... rest of questionnaire UI using validationQuestion text
}
```

### 8. Thank You Page with Email Collection

```tsx
// app/validate/[slug]/ValidationComplete.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  personaName: string;
  onComplete: (email?: string, name?: string) => Promise<void>;
}

export function ValidationComplete({ personaName, onComplete }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleSubmit = async (includeEmail: boolean) => {
    setIsSubmitting(true);
    await onComplete(includeEmail ? email : undefined, includeEmail ? name : undefined);
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <span className="text-6xl mb-6 block">🙏</span>
          <h1 className="text-3xl font-display text-white mb-4">
            Thank You!
          </h1>
          <p className="text-zinc-400">
            Your feedback helps make better products for people like you.
            You can close this window now.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">✓</span>
          <h1 className="text-3xl font-display text-white mb-3">
            You're Done!
          </h1>
          <p className="text-zinc-400">
            Thank you for sharing your perspective. Your input is invaluable.
          </p>
        </div>

        {/* Optional email collection */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-white mb-2">
            Stay Connected?
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            We'd love to gather more feedback from you in the future or have you
            as a beta tester when new features launch. Totally optional.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4A84B]"
            />
            <input
              type="email"
              placeholder="Your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4A84B]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || (!email && !name)}
            className="w-full px-6 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Stay Connected'}
          </button>

          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Skip & Finish
          </button>
        </div>
      </motion.div>
    </div>
  );
}
```

### 9. Founder's Validation Response Views

#### Per-Question View (Default)

```tsx
// app/clarity-canvas/modules/persona-sharpener/components/ByQuestionView.tsx

interface Props {
  personaId: string;
  founderResponses: Response[];  // responseType: 'assumption'
  validationResponses: Response[];  // responseType: 'validation'
  questions: Question[];
}

export function ByQuestionView({ personaId, founderResponses, validationResponses, questions }: Props) {
  // Group validation responses by questionId
  const validationsByQuestion = groupBy(validationResponses, 'questionId');

  return (
    <div className="space-y-8">
      {questions.map((question) => {
        const founderAnswer = founderResponses.find(r => r.questionId === question.id);
        const validations = validationsByQuestion[question.id] || [];

        return (
          <QuestionCard
            key={question.id}
            question={question}
            founderAnswer={founderAnswer}
            validations={validations}
          />
        );
      })}
    </div>
  );
}

function QuestionCard({ question, founderAnswer, validations }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-medium text-white mb-2">
        {question.question}
      </h3>

      {/* Founder's assumption */}
      <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <span className="text-xs font-mono uppercase tracking-wider text-amber-500">
          Your Assumption
        </span>
        <p className="text-white mt-1">
          {formatValue(founderAnswer?.value, question.type)}
        </p>
        <span className="text-xs text-zinc-500">
          {founderAnswer?.confidence}% confident
        </span>
      </div>

      {/* Validator responses */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-green-400">
          Real User Responses ({validations.length})
        </span>
        {validations.length === 0 ? (
          <p className="text-zinc-500 mt-2">No validation responses yet</p>
        ) : (
          <div className="mt-2 space-y-2">
            {validations.map((v, i) => (
              <div key={v.id} className="p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-white">{formatValue(v.value, question.type)}</p>
                {v.additionalContext && (
                  <p className="text-sm text-zinc-400 mt-1 italic">
                    "{v.additionalContext}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Individual Session View

```tsx
// app/clarity-canvas/modules/persona-sharpener/components/BySessionView.tsx

interface Props {
  sessions: ValidationSession[];
  onSelectSession: (sessionId: string) => void;
}

export function BySessionView({ sessions, onSelectSession }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">📭</span>
        <p className="text-zinc-400">No validation sessions yet</p>
        <p className="text-sm text-zinc-500 mt-1">
          Share your validation link to start collecting responses
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session, index) => (
        <button
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className="w-full text-left p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">
                {session.respondentName || session.respondentEmail || `Response #${sessions.length - index}`}
              </span>
              <p className="text-sm text-zinc-500">
                {session.questionsAnswered} questions • {formatDate(session.completedAt)}
              </p>
            </div>
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}
```

### 10. Middleware Update

The `/validate/*` routes are public and don't require auth. Update middleware to pass through:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Pass the current pathname to layouts for proper returnTo handling
  response.headers.set('x-pathname', request.nextUrl.pathname);

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  // Match all routes except static files, images, and public validation routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|validate).*)'],
};
```

**Note:** The `/validate/*` routes are inherently public (no auth check in the route handlers), so no middleware change is strictly required. The API routes simply don't call `ensureUserFromUnifiedSession()`.

---

## User Experience

### Validator Journey

1. **Receive link** - Founder shares `/validate/a1b2c3d4e5f6g7h8`
2. **Land on page** - See brief intro: "Help [Founder Name] understand their ideal customer"
3. **Answer questions** - 18 questions using `validationQuestion` framing ("Which describes YOU?")
4. **Progress saves automatically** - localStorage, can close and resume later (same browser)
5. **Complete** - See thank you page with optional email signup for beta testing
6. **Close** - Done, no account created

### Founder Journey

1. **Complete persona sharpening** - Mode 1 as usual
2. **See "Share for Validation" button** - On persona card or details page
3. **Click to get link** - Auto-generates if first time, shows existing link if already created
4. **Copy and share** - Send to potential customers via email, social, etc.
5. **View responses** - Navigate to validation dashboard
6. **Toggle views** - Switch between per-question and per-session views
7. **Drill down** - Click individual sessions to see full response set

### Key UX Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| "I'm not sure" checkbox | **Hidden** in validation mode | Validators know themselves; uncertainty is founder-specific |
| Confidence slider | **Kept** | Still valuable signal even for validators |
| Additional context | **Kept** | Qualitative insights are valuable |
| Question order | **Same** as founder sequence | Consistent comparison |
| Progress indicator | **Yes** | "Question 5 of 18" + progress bar |
| Skip button | **Hidden** | Validators should answer all applicable questions |

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/validation-utils.test.ts

describe('generateValidationSlug', () => {
  it('generates 16-character hex string', async () => {
    const slug = await generateValidationSlug();
    expect(slug).toMatch(/^[a-f0-9]{16}$/);
  });

  it('retries on collision and eventually throws', async () => {
    // Mock prisma to always return existing record
    // Expect error after 10 attempts
  });
});

describe('getValidationQuestions', () => {
  it('filters out questions with null validationQuestion', () => {
    const questions = getValidationQuestions();
    expect(questions.every(q => q.validationQuestion !== null)).toBe(true);
  });

  it('returns 18 questions (19 total minus 1 anti-pattern)', () => {
    expect(getValidationQuestions()).toHaveLength(18);
  });
});
```

### Integration Tests

```typescript
// __tests__/api/validate.test.ts

describe('POST /api/validate/[slug]/start', () => {
  it('creates ValidationSession and returns sessionId', async () => {
    const link = await createTestValidationLink();
    const res = await fetch(`/api/validate/${link.slug}/start`, { method: 'POST' });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessionId).toBeDefined();
  });

  it('returns 404 for non-existent slug', async () => {
    const res = await fetch('/api/validate/nonexistent/start', { method: 'POST' });
    expect(res.status).toBe(404);
  });

  it('returns 410 for expired link', async () => {
    const link = await createTestValidationLink({ expiresAt: new Date('2020-01-01') });
    const res = await fetch(`/api/validate/${link.slug}/start`, { method: 'POST' });
    expect(res.status).toBe(410);
  });
});

describe('POST /api/validate/[slug]/responses', () => {
  it('creates Response with validation tagging', async () => {
    const { link, sessionId } = await createTestSession();

    const res = await fetch(`/api/validate/${link.slug}/responses`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        questionId: 'age-range',
        value: 'younger',
        confidence: 80,
      }),
    });

    expect(res.status).toBe(200);

    const response = await prisma.response.findFirst({
      where: { questionId: 'age-range', respondentRole: 'real-user' },
    });
    expect(response?.responseType).toBe('validation');
    expect(response?.respondentRole).toBe('real-user');
  });

  it('rejects invalid sessionId', async () => {
    const link = await createTestValidationLink();
    const res = await fetch(`/api/validate/${link.slug}/responses`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'invalid-session-id',
        questionId: 'age-range',
        value: 'younger',
        confidence: 80,
      }),
    });
    expect(res.status).toBe(401);
  });
});
```

### E2E Tests

```typescript
// e2e/validation.spec.ts

test.describe('Validation Flow', () => {
  test('complete validation as anonymous user', async ({ page }) => {
    // Setup: Create persona with validation link
    const slug = await createTestValidationLink();

    await page.goto(`/validate/${slug}`);

    // Should see intro
    await expect(page.getByText('Help')).toBeVisible();

    // Answer first question
    await page.getByRole('button', { name: '18-35' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify progress updates
    await expect(page.getByText('Question 2 of 18')).toBeVisible();

    // ... complete all questions ...

    // Should see thank you page
    await expect(page.getByText("You're Done!")).toBeVisible();

    // Skip email collection
    await page.getByRole('button', { name: 'Skip & Finish' }).click();

    // Should see final thank you
    await expect(page.getByText('Thank You!')).toBeVisible();
  });

  test('resume from localStorage', async ({ page }) => {
    const slug = await createTestValidationLink();

    // Start validation
    await page.goto(`/validate/${slug}`);
    await page.getByRole('button', { name: '18-35' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate away and back
    await page.goto('/');
    await page.goto(`/validate/${slug}`);

    // Should resume at question 2
    await expect(page.getByText('Question 2 of 18')).toBeVisible();
  });
});
```

---

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| localStorage size | Store only essential data (questionId, value, confidence), not full question text |
| Response submission latency | Submit each response immediately, don't batch; show optimistic UI |
| Large number of validations | Paginate responses in founder view (10 per page) |
| Slug collision checking | Use 64-bit entropy (16 hex chars) to minimize collision probability |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Session hijacking | SessionId is random cuid(), not guessable; only valid for the specific slug |
| Rate limiting | Add rate limits to `/start` endpoint (e.g., 10 per IP per hour) |
| Spam submissions | Require completing all questions before session counts toward totalResponses |
| Data exposure | Validation responses only visible to persona owner (founder auth required) |
| Link enumeration | 16 hex chars = 2^64 possible slugs; infeasible to enumerate |

---

## Documentation

- [ ] Update `docs/clarity-canvas/.../persona-sharpener-handoff.md` with validation implementation details
- [ ] Add developer guide: `docs/developer-guides/validation-sharing-system.md`
- [ ] Update `CLAUDE.md` with validation routes and patterns

---

## Implementation Phases

### Phase 1: Database & Core API

- [ ] Add Prisma models: ValidationLink, ValidationSession
- [ ] Extend Response model with validation fields
- [ ] Run migration
- [ ] Implement slug generation utility
- [ ] Implement public API routes:
  - GET `/api/validate/[slug]`
  - POST `/api/validate/[slug]/start`
  - POST `/api/validate/[slug]/responses`
  - POST `/api/validate/[slug]/complete`
- [ ] Implement authenticated API routes:
  - GET/PATCH `/api/personas/[personaId]/validation-link`
  - GET `/api/personas/[personaId]/validation-responses`
  - GET `/api/personas/[personaId]/validation-sessions`
  - GET `/api/personas/[personaId]/validation-sessions/[sessionId]`

### Phase 2: Validation Page UI

- [ ] Create `/validate/[slug]/page.tsx` server component
- [ ] Create `ValidationPage.tsx` client component
- [ ] Implement `useValidationProgress` hook for localStorage
- [ ] Reuse existing question components with validation mode styling
- [ ] Use `validationQuestion` text for all questions
- [ ] Filter out `not-customer` question
- [ ] Hide "I'm not sure" checkbox, keep confidence slider
- [ ] Create `ValidationComplete.tsx` with email collection

### Phase 3: Founder Link Management

- [ ] Add "Share for Validation" button to PersonaCard
- [ ] Create ValidationLinkModal with copy-to-clipboard
- [ ] Show link stats (total responses, created date)
- [ ] Add isActive toggle (deactivate link without deleting)

### Phase 4: Founder Response Views

- [ ] Create validation dashboard page at `/clarity-canvas/modules/persona-sharpener/[personaId]/validation`
- [ ] Implement ByQuestionView (default)
- [ ] Implement BySessionView
- [ ] Implement session drill-down view
- [ ] Add navigation from persona card to validation dashboard

### Phase 5: Polish & Edge Cases

- [ ] Handle expired links (410 page)
- [ ] Handle inactive links (403 page)
- [ ] Handle max responses reached (403 page)
- [ ] Mobile-responsive validation page
- [ ] Loading states throughout
- [ ] Error handling with retry options
- [ ] Empty states (no validations yet)

---

## Open Questions

1. **Rate limiting strategy** - Should we use IP-based, device fingerprint, or something else?
2. **Analytics events** - What validation funnel metrics should we track?
3. **Link regeneration** - Should founders be able to reset/regenerate the slug? (Currently: no)

---

## Future Enhancements (Out of Scope)

These are scaffolded or considered but not implemented in this spec:

1. **Alignment scoring** - Calculate per-field alignment percentages
2. **Reconciliation UI** - Side-by-side assumption vs reality comparison with accept/reject actions
3. **Multiple links per persona** - For cohort-based validation
4. **Email notifications** - Notify founders when validations complete
5. **Export** - Download validation responses as CSV
6. **Custom link slugs** - Let founders choose readable slugs

---

## References

- Ideation document: `docs/ideation/persona-sharpener-validation-sharing.md`
- Handoff document: `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-handoff.md`
- Existing session component: `app/clarity-canvas/modules/persona-sharpener/[sessionId]/PersonaSharpenerSession.tsx`
- Question bank: `lib/clarity-canvas/modules/persona-sharpener/questions.ts`
- Cross-project reference: Document sharing system architecture (user-provided summary)
