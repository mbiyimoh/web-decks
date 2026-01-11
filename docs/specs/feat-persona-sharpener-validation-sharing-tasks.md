# Task Breakdown: Persona Sharpener Validation Sharing System
Generated: 2026-01-09
Source: docs/specs/feat-persona-sharpener-validation-sharing.md

## Overview

Enable founders to share validation links with real potential customers who can complete the persona questionnaire without accounts. Validator responses are tagged as validations (vs founder assumptions) and founders can view responses organized by question or session.

---

## Phase 1: Database & Core Infrastructure

### Task 1.1: Add Prisma Models for Validation Sharing
**Description**: Add ValidationLink and ValidationSession models, extend Response model
**Size**: Medium
**Priority**: High (Foundation)
**Dependencies**: None
**Can run parallel with**: None (must complete first)

**Technical Requirements**:
- Add ValidationLink model with unique personaId constraint (one link per persona)
- Add ValidationSession model for tracking validator progress
- Extend Response model to make sessionId nullable and add validationSessionId
- Add relation from Persona to ValidationLink

**Implementation**:
Add to `prisma/schema.prisma`:

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

Update Persona model:
```prisma
model Persona {
  // ... existing fields ...
  validationLink ValidationLink?
}
```

Update Response model (make sessionId nullable, add validationSessionId):
```prisma
model Response {
  // Session linkage - EITHER sharpener session OR validation session (mutually exclusive)
  sessionId           String?           // For founder assumption responses
  session             SharpenerSession? @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  validationSessionId String?           // For validator responses

  // ... rest stays same ...

  @@index([validationSessionId])
}
```

**Acceptance Criteria**:
- [ ] ValidationLink model added with @unique on personaId
- [ ] ValidationSession model added with indexes
- [ ] Response.sessionId is nullable (existing data has values, safe)
- [ ] Response.validationSessionId added
- [ ] Persona.validationLink relation added
- [ ] Migration runs successfully: `npx prisma migrate dev --name add-validation-sharing`
- [ ] Prisma client regenerated: `npx prisma generate`

---

### Task 1.2: Create Validation Utility Functions
**Description**: Implement slug generation and validation question filtering utilities
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 1.3

**Technical Requirements**:
- Secure 16-character hex slug generation with collision checking
- Function to get full validation URL
- Function to filter questions for validation mode (exclude null validationQuestion)

**Implementation**:
Create `lib/clarity-canvas/modules/persona-sharpener/validation-utils.ts`:

```typescript
import crypto from 'crypto';
import prisma from '@/lib/prisma';

/**
 * Generate a unique 16-character hex slug for validation links.
 * Uses crypto.randomBytes for security (64 bits of entropy).
 * Retries up to 10 times on collision.
 */
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

/**
 * Get the full validation URL for a given slug.
 */
export function getValidationUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clarity.33strategies.ai';
  return `${baseUrl}/validate/${slug}`;
}

/**
 * Check if a validation link is accessible (active, not expired, not at max).
 */
export function isLinkAccessible(link: {
  isActive: boolean;
  expiresAt: Date | null;
  maxResponses: number | null;
  totalResponses: number;
}): { accessible: boolean; reason?: string } {
  if (!link.isActive) {
    return { accessible: false, reason: 'Link is inactive' };
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    return { accessible: false, reason: 'Link has expired' };
  }

  if (link.maxResponses && link.totalResponses >= link.maxResponses) {
    return { accessible: false, reason: 'Maximum responses reached' };
  }

  return { accessible: true };
}
```

Create `lib/clarity-canvas/modules/persona-sharpener/validation-questions.ts`:

```typescript
import { questionSequence } from './questions';
import type { Question } from './types';

/**
 * Get questions filtered for validation mode.
 * Excludes questions with null validationQuestion (e.g., 'not-customer').
 */
export function getValidationQuestions(): Question[] {
  return questionSequence.filter(q => q.validationQuestion !== null);
}

/**
 * Get the count of validation questions.
 * Currently: 18 (19 total minus 'not-customer')
 */
export function getValidationQuestionCount(): number {
  return getValidationQuestions().length;
}

/**
 * Get question text for validation mode.
 * Returns validationQuestion if available, falls back to question.
 */
export function getValidationQuestionText(question: Question): string {
  return question.validationQuestion ?? question.question;
}
```

**Acceptance Criteria**:
- [ ] generateValidationSlug() produces 16 hex character strings
- [ ] generateValidationSlug() retries on collision
- [ ] getValidationUrl() builds correct full URL
- [ ] isLinkAccessible() correctly evaluates all conditions
- [ ] getValidationQuestions() filters out 'not-customer' question
- [ ] getValidationQuestionCount() returns 18

---

### Task 1.3: Create Validation TypeScript Types
**Description**: Define TypeScript interfaces for validation system
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 1.2

**Implementation**:
Create `lib/clarity-canvas/modules/persona-sharpener/validation-types.ts`:

```typescript
import type { ValidationLink, ValidationSession, Response, Persona } from '@prisma/client';

// API response types
export interface ValidationLinkInfo {
  slug: string;
  url: string;
  totalResponses: number;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  maxResponses: number | null;
}

export interface ValidationLinkMetadata {
  personaName: string;
  questionCount: number;
  isActive: boolean;
  status: 'active' | 'inactive' | 'expired' | 'maxed';
}

export interface StartSessionResponse {
  sessionId: string;
}

export interface SubmitResponsePayload {
  sessionId: string;
  questionId: string;
  value: unknown;
  confidence: number;
  additionalContext?: string;
}

export interface CompleteSessionPayload {
  sessionId: string;
  respondentEmail?: string;
  respondentName?: string;
}

// localStorage progress type
export interface ValidationProgress {
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

// Founder view types
export interface ValidationSessionSummary {
  id: string;
  respondentName: string | null;
  respondentEmail: string | null;
  questionsAnswered: number;
  completedAt: Date | null;
  startedAt: Date;
}

export interface ValidationResponseWithSession extends Response {
  validationSession?: ValidationSession;
}

// View modes for founder dashboard
export type ValidationViewMode = 'by-question' | 'by-session';
```

**Acceptance Criteria**:
- [ ] All API payload types defined
- [ ] localStorage progress type matches hook implementation
- [ ] Founder view types support both view modes
- [ ] Types exported and importable

---

## Phase 2: Public API Routes

### Task 2.1: Implement GET /api/validate/[slug] Route
**Description**: Public endpoint to fetch validation link metadata
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2
**Can run parallel with**: Tasks 2.2, 2.3, 2.4

**Technical Requirements**:
- No authentication required
- Return persona name, question count, link status
- Validate link exists, is active, not expired, not at max

**Implementation**:
Create `app/api/validate/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isLinkAccessible } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';
import { getValidationQuestionCount } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-questions';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const link = await prisma.validationLink.findUnique({
      where: { slug },
      include: {
        persona: {
          select: { name: true },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Validation link not found' },
        { status: 404 }
      );
    }

    const accessibility = isLinkAccessible(link);

    // Determine status
    let status: 'active' | 'inactive' | 'expired' | 'maxed' = 'active';
    if (!link.isActive) status = 'inactive';
    else if (link.expiresAt && new Date() > link.expiresAt) status = 'expired';
    else if (link.maxResponses && link.totalResponses >= link.maxResponses) status = 'maxed';

    return NextResponse.json({
      personaName: link.persona.name || 'Customer Persona',
      questionCount: getValidationQuestionCount(),
      isActive: accessibility.accessible,
      status,
    });
  } catch (error) {
    console.error('Error fetching validation link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 404 for non-existent slug
- [ ] Returns persona name and question count for valid slug
- [ ] Returns correct status (active/inactive/expired/maxed)
- [ ] No authentication required
- [ ] Error handling with 500 response

---

### Task 2.2: Implement POST /api/validate/[slug]/start Route
**Description**: Public endpoint to create a new validation session
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2
**Can run parallel with**: Tasks 2.1, 2.3, 2.4

**Implementation**:
Create `app/api/validate/[slug]/start/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isLinkAccessible } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const link = await prisma.validationLink.findUnique({
      where: { slug },
      select: {
        id: true,
        personaId: true,
        isActive: true,
        expiresAt: true,
        maxResponses: true,
        totalResponses: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Validation link not found' },
        { status: 404 }
      );
    }

    const accessibility = isLinkAccessible(link);
    if (!accessibility.accessible) {
      const statusCode = link.expiresAt && new Date() > link.expiresAt ? 410 : 403;
      return NextResponse.json(
        { error: accessibility.reason },
        { status: statusCode }
      );
    }

    // Create new validation session
    const session = await prisma.validationSession.create({
      data: {
        validationLinkId: link.id,
        personaId: link.personaId,
        status: 'in_progress',
        questionsAnswered: 0,
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error starting validation session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 404 for non-existent slug
- [ ] Returns 410 for expired link
- [ ] Returns 403 for inactive or maxed link
- [ ] Creates ValidationSession record on success
- [ ] Returns sessionId for use as auth token

---

### Task 2.3: Implement POST /api/validate/[slug]/responses Route
**Description**: Public endpoint to submit a single validation response
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2
**Can run parallel with**: Tasks 2.1, 2.2, 2.4

**Implementation**:
Create `app/api/validate/[slug]/responses/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getQuestionById } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const body = await request.json();
    const { sessionId, questionId, value, confidence, additionalContext } = body;

    if (!sessionId || !questionId || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify session exists and belongs to this link
    const link = await prisma.validationLink.findUnique({
      where: { slug },
      select: { id: true, personaId: true },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Validation link not found' },
        { status: 404 }
      );
    }

    const session = await prisma.validationSession.findFirst({
      where: {
        id: sessionId,
        validationLinkId: link.id,
        status: 'in_progress',
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get question field mapping
    const question = getQuestionById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    // Create response with validation tagging
    await prisma.response.create({
      data: {
        personaId: link.personaId,
        validationSessionId: sessionId,
        questionId,
        field: question.field,
        value,
        confidence: confidence ?? 50,
        additionalContext,
        isUnsure: false, // Validators don't have "unsure" option
        responseType: 'validation',
        respondentId: sessionId, // Use session ID as respondent identifier
        respondentRole: 'real-user',
      },
    });

    // Update session progress
    await prisma.validationSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting validation response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 400 for missing required fields
- [ ] Returns 404 for non-existent slug
- [ ] Returns 401 for invalid sessionId
- [ ] Creates Response with responseType: 'validation', respondentRole: 'real-user'
- [ ] Increments session.questionsAnswered
- [ ] Uses question.field for field mapping

---

### Task 2.4: Implement POST /api/validate/[slug]/complete Route
**Description**: Public endpoint to mark a validation session as complete
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2
**Can run parallel with**: Tasks 2.1, 2.2, 2.3

**Implementation**:
Create `app/api/validate/[slug]/complete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const body = await request.json();
    const { sessionId, respondentEmail, respondentName } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Verify session exists and belongs to this link
    const link = await prisma.validationLink.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Validation link not found' },
        { status: 404 }
      );
    }

    const session = await prisma.validationSession.findFirst({
      where: {
        id: sessionId,
        validationLinkId: link.id,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Update session as completed and increment link total (atomic transaction)
    await prisma.$transaction([
      prisma.validationSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          respondentEmail: respondentEmail || null,
          respondentName: respondentName || null,
        },
      }),
      prisma.validationLink.update({
        where: { id: link.id },
        data: {
          totalResponses: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing validation session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 400 for missing sessionId
- [ ] Returns 404 for non-existent slug
- [ ] Returns 401 for invalid session
- [ ] Updates session status to 'completed'
- [ ] Sets session.completedAt timestamp
- [ ] Atomically increments link.totalResponses
- [ ] Stores optional respondentEmail/respondentName

---

## Phase 3: Authenticated API Routes

### Task 3.1: Implement GET/PATCH /api/personas/[personaId]/validation-link
**Description**: Authenticated endpoint to get/create and update validation link
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2
**Can run parallel with**: Tasks 3.2, 3.3

**Implementation**:
Create `app/api/personas/[personaId]/validation-link/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/session-helpers';
import { generateValidationSlug, getValidationUrl } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  const { personaId } = params;

  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: user.authId },
      },
      include: { validationLink: true },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // If link exists, return it
    if (persona.validationLink) {
      return NextResponse.json({
        slug: persona.validationLink.slug,
        url: getValidationUrl(persona.validationLink.slug),
        totalResponses: persona.validationLink.totalResponses,
        isActive: persona.validationLink.isActive,
        createdAt: persona.validationLink.createdAt,
        expiresAt: persona.validationLink.expiresAt,
        maxResponses: persona.validationLink.maxResponses,
      });
    }

    // Auto-create link if none exists
    const slug = await generateValidationSlug();
    const link = await prisma.validationLink.create({
      data: {
        personaId,
        createdBy: user.authId,
        slug,
        isActive: true,
      },
    });

    return NextResponse.json({
      slug: link.slug,
      url: getValidationUrl(link.slug),
      totalResponses: 0,
      isActive: true,
      createdAt: link.createdAt,
      expiresAt: null,
      maxResponses: null,
    });
  } catch (error) {
    console.error('Error getting validation link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  const { personaId } = params;

  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body; // MVP: only expose isActive toggle

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: user.authId },
      },
      include: { validationLink: true },
    });

    if (!persona || !persona.validationLink) {
      return NextResponse.json({ error: 'Validation link not found' }, { status: 404 });
    }

    const updated = await prisma.validationLink.update({
      where: { id: persona.validationLink.id },
      data: {
        isActive: isActive ?? persona.validationLink.isActive,
      },
    });

    return NextResponse.json({
      slug: updated.slug,
      url: getValidationUrl(updated.slug),
      totalResponses: updated.totalResponses,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      expiresAt: updated.expiresAt,
      maxResponses: updated.maxResponses,
    });
  } catch (error) {
    console.error('Error updating validation link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- [ ] GET returns 401 without auth
- [ ] GET returns existing link if one exists
- [ ] GET auto-creates link if none exists
- [ ] PATCH toggles isActive status
- [ ] Both verify persona ownership

---

### Task 3.2: Implement GET /api/personas/[personaId]/validation-responses
**Description**: Authenticated endpoint to fetch validation responses
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2
**Can run parallel with**: Tasks 3.1, 3.3

**Implementation**:
Create `app/api/personas/[personaId]/validation-responses/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/session-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  const { personaId } = params;
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get('view') || 'by-question';

  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: user.authId },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Get founder's assumptions
    const founderResponses = await prisma.response.findMany({
      where: {
        personaId,
        responseType: 'assumption',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get validation responses
    const validationResponses = await prisma.response.findMany({
      where: {
        personaId,
        responseType: 'validation',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (view === 'by-session') {
      // Group by validation session
      const sessions = await prisma.validationSession.findMany({
        where: {
          personaId,
          status: 'completed',
        },
        orderBy: { completedAt: 'desc' },
      });

      return NextResponse.json({
        view: 'by-session',
        sessions,
        founderResponses,
        validationResponses,
      });
    }

    // Default: by-question view
    return NextResponse.json({
      view: 'by-question',
      founderResponses,
      validationResponses,
    });
  } catch (error) {
    console.error('Error fetching validation responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 401 without auth
- [ ] Verifies persona ownership
- [ ] Returns founder assumptions (responseType: 'assumption')
- [ ] Returns validation responses (responseType: 'validation')
- [ ] Supports ?view=by-question (default) and ?view=by-session

---

### Task 3.3: Implement Validation Sessions API Routes
**Description**: Authenticated endpoints for listing sessions and getting session details
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 1.1, 1.2
**Can run parallel with**: Tasks 3.1, 3.2

**Implementation**:
Create `app/api/personas/[personaId]/validation-sessions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/session-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  const { personaId } = params;

  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: user.authId },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    const sessions = await prisma.validationSession.findMany({
      where: {
        personaId,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        respondentName: true,
        respondentEmail: true,
        questionsAnswered: true,
        completedAt: true,
        startedAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching validation sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Create `app/api/personas/[personaId]/validation-sessions/[sessionId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/session-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { personaId: string; sessionId: string } }
) {
  const { personaId, sessionId } = params;

  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: user.authId },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    const session = await prisma.validationSession.findFirst({
      where: {
        id: sessionId,
        personaId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const responses = await prisma.response.findMany({
      where: {
        validationSessionId: sessionId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      session,
      responses,
    });
  } catch (error) {
    console.error('Error fetching validation session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- [ ] List endpoint returns completed sessions only
- [ ] List includes respondent info and question count
- [ ] Detail endpoint returns session + all responses
- [ ] Both verify persona ownership

---

## Phase 4: Validation Page UI

### Task 4.1: Create Validation Page Server Component
**Description**: Server component that validates link and renders client
**Size**: Small
**Priority**: High
**Dependencies**: Tasks 1.1, 2.1
**Can run parallel with**: Tasks 4.2, 4.3

**Implementation**:
Create `app/validate/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { isLinkAccessible } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-utils';
import { getValidationQuestions } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-questions';
import { ValidationPage } from './ValidationPage';

interface Props {
  params: { slug: string };
}

export default async function ValidatePage({ params }: Props) {
  const { slug } = params;

  const link = await prisma.validationLink.findUnique({
    where: { slug },
    include: {
      persona: {
        select: { name: true },
      },
    },
  });

  if (!link) {
    notFound();
  }

  const accessibility = isLinkAccessible(link);

  if (!accessibility.accessible) {
    // Render appropriate error state
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <span className="text-5xl mb-4 block">🔒</span>
          <h1 className="text-2xl font-display text-white mb-3">
            Link Unavailable
          </h1>
          <p className="text-zinc-400">
            {accessibility.reason}
          </p>
        </div>
      </div>
    );
  }

  const questions = getValidationQuestions();

  return (
    <ValidationPage
      slug={slug}
      personaName={link.persona.name || 'Customer Persona'}
      questions={questions}
    />
  );
}

export const metadata = {
  title: 'Customer Validation | 33 Strategies',
};
```

**Acceptance Criteria**:
- [ ] Returns 404 for non-existent slug
- [ ] Shows error UI for inactive/expired/maxed links
- [ ] Passes questions to client component
- [ ] Sets appropriate page metadata

---

### Task 4.2: Create useValidationProgress Hook
**Description**: localStorage hook for saving validator progress
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.3
**Can run parallel with**: Tasks 4.1, 4.3

**Implementation**:
Create `app/validate/[slug]/useValidationProgress.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ValidationProgress } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

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

**Acceptance Criteria**:
- [ ] Loads existing progress on mount
- [ ] Clears expired progress (> 7 days)
- [ ] saveProgress persists to localStorage
- [ ] clearProgress removes from localStorage
- [ ] isLoaded indicates when safe to render

---

### Task 4.3: Create ValidationPage Client Component
**Description**: Main questionnaire client component for validators
**Size**: Large
**Priority**: High
**Dependencies**: Tasks 4.1, 4.2, 2.2, 2.3
**Can run parallel with**: None (needs 4.1, 4.2)

**Implementation**:
Create `app/validate/[slug]/ValidationPage.tsx` (full implementation in spec section 7)

Key features:
- Renders intro screen before starting
- Uses validationQuestion text for all questions
- Reuses existing question components (ThisOrThat, Slider, etc.)
- Hides "I'm not sure" checkbox
- Shows progress bar and question counter
- Saves progress to localStorage after each answer
- Resumes from localStorage if returning
- Submits responses via API
- Shows ValidationComplete on finish

**Acceptance Criteria**:
- [ ] Shows intro with persona name and question count
- [ ] Uses validationQuestion text (not question)
- [ ] Reuses existing question components
- [ ] Hides "I'm not sure" checkbox
- [ ] Shows "Question X of 18" progress
- [ ] Saves progress to localStorage
- [ ] Resumes from localStorage on return
- [ ] Submits each response via POST /api/validate/[slug]/responses
- [ ] Shows ValidationComplete when done

---

### Task 4.4: Create ValidationComplete Component
**Description**: Thank you page with optional email collection
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.4
**Can run parallel with**: Task 4.3

**Implementation**:
Create `app/validate/[slug]/ValidationComplete.tsx` (full implementation in spec section 8)

Key features:
- Two-stage UI: email form → final thank you
- Optional name and email fields
- "Submit & Stay Connected" button (primary)
- "Skip & Finish" button (secondary)
- Calls POST /api/validate/[slug]/complete

**Acceptance Criteria**:
- [ ] Shows "You're Done!" message
- [ ] Optional name/email inputs
- [ ] Primary button submits with contact info
- [ ] Secondary button skips contact info
- [ ] Calls complete API endpoint
- [ ] Shows final "Thank You!" message
- [ ] Uses 33 Strategies design tokens

---

## Phase 5: Founder UI Components

### Task 5.1: Create ValidationShareButton and Modal
**Description**: Button and modal for founders to get/copy validation link
**Size**: Medium
**Priority**: High
**Dependencies**: Task 3.1
**Can run parallel with**: Tasks 5.2, 5.3

**Implementation**:
Create `app/clarity-canvas/modules/persona-sharpener/components/ValidationShareButton.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ValidationLinkModal } from './ValidationLinkModal';

interface Props {
  personaId: string;
  personaName: string;
}

export function ValidationShareButton({ personaId, personaName }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share for Validation
      </button>

      {isModalOpen && (
        <ValidationLinkModal
          personaId={personaId}
          personaName={personaName}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
```

Create `app/clarity-canvas/modules/persona-sharpener/components/ValidationLinkModal.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ValidationLinkInfo } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

interface Props {
  personaId: string;
  personaName: string;
  onClose: () => void;
}

export function ValidationLinkModal({ personaId, personaName, onClose }: Props) {
  const [linkInfo, setLinkInfo] = useState<ValidationLinkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/personas/${personaId}/validation-link`);
        if (!res.ok) throw new Error('Failed to get link');
        const data = await res.json();
        setLinkInfo(data);
      } catch (e) {
        setError('Failed to load validation link');
      } finally {
        setIsLoading(false);
      }
    }
    fetchLink();
  }, [personaId]);

  const handleCopy = async () => {
    if (!linkInfo) return;
    await navigator.clipboard.writeText(linkInfo.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleActive = async () => {
    if (!linkInfo) return;
    try {
      const res = await fetch(`/api/personas/${personaId}/validation-link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !linkInfo.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      setLinkInfo(data);
    } catch (e) {
      setError('Failed to update link');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-white">
            Share for Validation
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-4">
          Share this link with real potential customers to validate your assumptions about{' '}
          <span className="text-white">{personaName}</span>.
        </p>

        {isLoading ? (
          <div className="animate-pulse bg-zinc-800 h-12 rounded-lg" />
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : linkInfo ? (
          <>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={linkInfo.url}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">
                {linkInfo.totalResponses} responses collected
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-zinc-400">Active</span>
                <button
                  onClick={handleToggleActive}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    linkInfo.isActive ? 'bg-green-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      linkInfo.isActive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Button shows "Share for Validation"
- [ ] Modal fetches/creates link on open
- [ ] Copy button copies URL to clipboard
- [ ] Shows response count
- [ ] Toggle to activate/deactivate link
- [ ] Uses 33 Strategies design tokens

---

### Task 5.2: Create ByQuestionView Component
**Description**: Founder view showing responses organized by question
**Size**: Medium
**Priority**: High
**Dependencies**: Task 3.2
**Can run parallel with**: Tasks 5.1, 5.3

**Implementation**:
Create `app/clarity-canvas/modules/persona-sharpener/components/ByQuestionView.tsx` (full implementation in spec section 9)

Key features:
- Show each question with founder's assumption highlighted
- List all validation responses per question
- Group by questionId
- Show "No validation responses yet" if empty

**Acceptance Criteria**:
- [ ] Shows all questions in order
- [ ] Highlights founder's assumption in gold
- [ ] Lists validation responses in green
- [ ] Shows confidence for founder answer
- [ ] Shows additional context if provided
- [ ] Empty state when no validations

---

### Task 5.3: Create BySessionView Component
**Description**: Founder view showing individual validation sessions
**Size**: Medium
**Priority**: High
**Dependencies**: Task 3.3
**Can run parallel with**: Tasks 5.1, 5.2

**Implementation**:
Create `app/clarity-canvas/modules/persona-sharpener/components/BySessionView.tsx` (full implementation in spec section 9)

Key features:
- List completed sessions
- Show respondent name/email if provided
- Show completion date and question count
- Click to drill down into session detail

**Acceptance Criteria**:
- [ ] Lists completed sessions newest first
- [ ] Shows respondent name or email if provided
- [ ] Falls back to "Response #N" if no name
- [ ] Shows question count and completion date
- [ ] Click navigates to session detail
- [ ] Empty state when no sessions

---

### Task 5.4: Create Founder Validation Dashboard Page
**Description**: Page showing validation responses with view toggle
**Size**: Medium
**Priority**: High
**Dependencies**: Tasks 5.2, 5.3, 3.2
**Can run parallel with**: None (needs 5.2, 5.3)

**Implementation**:
Create `app/clarity-canvas/modules/persona-sharpener/[personaId]/validation/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ByQuestionView } from '../../components/ByQuestionView';
import { BySessionView } from '../../components/BySessionView';
import { getValidationQuestions } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-questions';
import type { ValidationViewMode } from '@/lib/clarity-canvas/modules/persona-sharpener/validation-types';

export default function ValidationDashboard() {
  const { personaId } = useParams<{ personaId: string }>();
  const router = useRouter();

  const [view, setView] = useState<ValidationViewMode>('by-question');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const res = await fetch(`/api/personas/${personaId}/validation-responses?view=${view}`);
      if (res.ok) {
        setData(await res.json());
      }
      setIsLoading(false);
    }
    fetchData();
  }, [personaId, view]);

  const questions = getValidationQuestions();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-sm text-zinc-500 hover:text-white mb-2 flex items-center gap-1"
            >
              ← Back to Persona
            </button>
            <h1 className="text-2xl font-display">Validation Responses</h1>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('by-question')}
              className={`px-4 py-2 rounded-lg text-sm ${
                view === 'by-question'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              By Question
            </button>
            <button
              onClick={() => setView('by-session')}
              className={`px-4 py-2 rounded-lg text-sm ${
                view === 'by-session'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              By Session
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-800 rounded-xl" />
            ))}
          </div>
        ) : view === 'by-question' ? (
          <ByQuestionView
            personaId={personaId}
            founderResponses={data?.founderResponses || []}
            validationResponses={data?.validationResponses || []}
            questions={questions}
          />
        ) : (
          <BySessionView
            sessions={data?.sessions || []}
            onSelectSession={(sessionId) => {
              router.push(`/clarity-canvas/modules/persona-sharpener/${personaId}/validation/${sessionId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows view toggle (By Question / By Session)
- [ ] Fetches responses from API on mount and view change
- [ ] Renders ByQuestionView when selected
- [ ] Renders BySessionView when selected
- [ ] Loading state while fetching
- [ ] Back button navigates to persona

---

## Phase 6: Integration & Polish

### Task 6.1: Add Validation Button to PersonaCard
**Description**: Integrate ValidationShareButton into existing PersonaCard
**Size**: Small
**Priority**: High
**Dependencies**: Task 5.1
**Can run parallel with**: Task 6.2

**Implementation**:
Update the existing PersonaCard component to include the ValidationShareButton after the persona is complete.

**Acceptance Criteria**:
- [ ] ValidationShareButton appears on PersonaCard
- [ ] Only shows for completed personas (has responses)
- [ ] Links to validation dashboard

---

### Task 6.2: Add Navigation to Validation Dashboard
**Description**: Add link/button to access validation dashboard from persona
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 5.4
**Can run parallel with**: Task 6.1

**Implementation**:
Add navigation from persona details to `/clarity-canvas/modules/persona-sharpener/[personaId]/validation`

**Acceptance Criteria**:
- [ ] Link visible from persona details
- [ ] Shows response count if > 0
- [ ] Badge/indicator for new responses

---

### Task 6.3: Handle Edge Cases and Error States
**Description**: Add error handling, loading states, empty states throughout
**Size**: Medium
**Priority**: Medium
**Dependencies**: All previous tasks
**Can run parallel with**: Task 6.4

**Implementation**:
- 404 page for invalid slugs
- 410 page for expired links
- 403 page for inactive/maxed links
- Loading skeletons
- Empty states with helpful messaging
- Error retry buttons

**Acceptance Criteria**:
- [ ] Expired link shows 410 with helpful message
- [ ] Inactive link shows 403
- [ ] Max responses shows 403
- [ ] All loading states have skeletons
- [ ] Empty states guide user action

---

### Task 6.4: Mobile Responsive Validation Page
**Description**: Ensure validation page works well on mobile
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 4.3
**Can run parallel with**: Task 6.3

**Implementation**:
- Test and fix responsive breakpoints
- Ensure touch targets are adequate
- Test on various screen sizes

**Acceptance Criteria**:
- [ ] Works on iPhone SE width (375px)
- [ ] Touch targets are 44px minimum
- [ ] No horizontal scrolling
- [ ] Progress bar visible on mobile

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Phase 1 | 3 tasks | 1.2 + 1.3 after 1.1 |
| Phase 2 | 4 tasks | All 4 can run in parallel |
| Phase 3 | 3 tasks | All 3 can run in parallel |
| Phase 4 | 4 tasks | 4.1 + 4.2 parallel, then 4.3 + 4.4 |
| Phase 5 | 4 tasks | 5.1 + 5.2 + 5.3 parallel, then 5.4 |
| Phase 6 | 4 tasks | 6.1 + 6.2, then 6.3 + 6.4 parallel |

**Total: 22 tasks**
**Critical Path**: 1.1 → 1.2 → 2.x → 4.1 → 4.3 → 5.4 → 6.x
