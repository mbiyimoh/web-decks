# Task Breakdown: Raw Input Archive

**Generated:** 2026-02-08
**Source:** specs/feat-raw-input-archive.md
**Validation Recommendations Incorporated:** Yes

## Overview

Create a unified Raw Input Archive system that surfaces all raw user inputs across Clarity Canvas and Central Command. The gap is primarily UI — data is already preserved in `FieldSource.rawContent` and `PipelineClient.rawInputText`.

### Validation-Driven Simplifications Applied

Based on spec validation:
1. **Removed `extractionSummary` field** — Users have rawContent; auto-generating a summary adds complexity for minimal value
2. **Simplified filters** — Type + pillar only for MVP (removed date range)
3. **Cut settings/data-privacy section** — Onboarding card sufficient for trust
4. **Fixed critical gaps:**
   - Add `originalInput` to commit request
   - Add ownership verification to field sources route
   - Add Zod schemas for POST routes

---

## Phase 1: Database & Foundation

### Task 1.1: Add InputSession Model to Prisma Schema
**Description:** Create the InputSession model and modify FieldSource to link to it
**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** None (blocking)

**Technical Requirements:**

Add to `prisma/schema.prisma`:

```prisma
// ============================================================================
// INPUT SESSION — Tracks complete raw inputs as submitted by user
// ============================================================================

model InputSession {
  id              String   @id @default(cuid())

  // Ownership (polymorphic - either Clarity Canvas or Central Command)
  clarityProfileId String?
  clarityProfile   ClarityProfile? @relation(fields: [clarityProfileId], references: [id], onDelete: Cascade)

  pipelineClientId String?
  pipelineClient   PipelineClient? @relation(fields: [pipelineClientId], references: [id], onDelete: Cascade)

  // Input details
  inputType       InputType
  title           String
  rawContent      String  @db.Text

  // Source metadata
  sourceModule    String           // "clarity-canvas", "central-command"
  sourceContext   String?          // e.g., "individual-pillar", "prospect-intake"

  // Voice-specific
  durationSeconds Int?

  // File-specific
  originalFileName String?

  // Processing results
  fieldsPopulated Int      @default(0)

  // Timestamps
  capturedAt      DateTime @default(now())
  processedAt     DateTime?

  // Metadata (flexible for future needs)
  metadata        Json     @default("{}")

  // Relations
  fieldSources    FieldSource[]

  @@index([clarityProfileId, capturedAt])
  @@index([pipelineClientId, capturedAt])
  @@index([sourceModule, capturedAt])
}

enum InputType {
  VOICE_TRANSCRIPT
  TEXT_INPUT
  FILE_UPLOAD
}
```

Modify `FieldSource`:

```prisma
model FieldSource {
  // ... existing fields ...

  // NEW: Link to parent input session
  inputSessionId  String?
  inputSession    InputSession? @relation(fields: [inputSessionId], references: [id], onDelete: SetNull)

  @@index([inputSessionId])
}
```

Add relations to `ClarityProfile` and `PipelineClient`:

```prisma
model ClarityProfile {
  // ... existing fields ...
  inputSessions   InputSession[]
}

model PipelineClient {
  // ... existing fields ...
  inputSessions   InputSession[]
}
```

**Acceptance Criteria:**
- [ ] InputSession model added with all fields
- [ ] InputType enum created
- [ ] FieldSource has inputSessionId field
- [ ] Relations added to ClarityProfile and PipelineClient
- [ ] Indexes created for performance
- [ ] Migration runs successfully: `npx prisma migrate dev --name add-input-session`
- [ ] Prisma client regenerated: `npx prisma generate`

---

### Task 1.2: Create Input Session Types and Utilities
**Description:** Create TypeScript types and helper functions for InputSession
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 1.3

**Technical Requirements:**

Create `lib/input-session/types.ts`:

```typescript
import { InputType, InputSession, FieldSource } from '@prisma/client';

export type { InputType, InputSession };

export interface InputSessionWithSources extends InputSession {
  fieldSources: (FieldSource & {
    field: {
      key: string;
      name: string;
      subsection: {
        key: string;
        name: string;
        section: {
          key: string;
          name: string;
        };
      };
    };
  })[];
}

export interface CreateInputSessionData {
  clarityProfileId?: string;
  pipelineClientId?: string;
  inputType: InputType;
  title: string;
  rawContent: string;
  sourceModule: 'clarity-canvas' | 'central-command';
  sourceContext?: string;
  durationSeconds?: number;
  originalFileName?: string;
  fieldsPopulated?: number;
}

export interface InputSessionFilters {
  inputType?: InputType | null;
  pillar?: string | null;
}
```

Create `lib/input-session/utils.ts`:

```typescript
import { InputType } from '@prisma/client';

export function generateSessionTitle(
  recommendations: { targetSection: string }[]
): string {
  const sections = [...new Set(recommendations.map(r => r.targetSection))];
  if (sections.length === 1) {
    return `${capitalize(sections[0])} context`;
  }
  return `Context for ${sections.length} pillars`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getInputTypeLabel(type: InputType): string {
  const labels: Record<InputType, string> = {
    VOICE_TRANSCRIPT: 'Voice transcript',
    TEXT_INPUT: 'Text input',
    FILE_UPLOAD: 'File upload',
  };
  return labels[type];
}

export function mapSourceTypeToInputType(
  sourceType: 'VOICE' | 'TEXT' | 'FILE'
): InputType {
  switch (sourceType) {
    case 'VOICE':
      return 'VOICE_TRANSCRIPT';
    case 'FILE':
      return 'FILE_UPLOAD';
    default:
      return 'TEXT_INPUT';
  }
}
```

**Acceptance Criteria:**
- [ ] Types file created with all interfaces
- [ ] Utils file created with all helper functions
- [ ] generateSessionTitle handles single and multiple sections
- [ ] truncate adds ellipsis correctly
- [ ] formatDate returns readable format
- [ ] TypeScript compiles without errors

---

### Task 1.3: Create Zod Schemas for API Validation
**Description:** Add Zod schemas for input session API requests (validation gap fix)
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 1.2

**Technical Requirements:**

Create `lib/input-session/schemas.ts`:

```typescript
import { z } from 'zod';

export const InputTypeSchema = z.enum([
  'VOICE_TRANSCRIPT',
  'TEXT_INPUT',
  'FILE_UPLOAD',
]);

export const CreateSessionRequestSchema = z.object({
  rawContent: z.string().min(1, 'Content is required'),
  inputType: InputTypeSchema.optional().default('TEXT_INPUT'),
  title: z.string().optional(),
  sourceContext: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  originalFileName: z.string().optional(),
});

export const SessionFiltersSchema = z.object({
  inputType: InputTypeSchema.nullable().optional(),
  pillar: z.string().nullable().optional(),
});

// For clarity-canvas commit route modification
export const CommitRequestWithInputSchema = z.object({
  recommendations: z.array(z.object({
    targetSection: z.string(),
    targetSubsection: z.string(),
    targetField: z.string(),
    content: z.string(),
    summary: z.string(),
    confidence: z.number().min(0).max(1),
    sourceType: z.enum(['VOICE', 'TEXT', 'FILE']).optional(),
  })),
  scope: z.object({
    section: z.string().optional(),
    subsection: z.string().optional(),
  }).optional(),
  originalInput: z.string().min(1, 'Original input is required'), // CRITICAL FIX
  inputType: z.enum(['VOICE', 'TEXT', 'FILE']).optional().default('TEXT'),
  durationSeconds: z.number().int().positive().optional(),
  originalFileName: z.string().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type CommitRequestWithInput = z.infer<typeof CommitRequestWithInputSchema>;
```

**Acceptance Criteria:**
- [ ] All schemas created and exported
- [ ] CommitRequestWithInputSchema includes originalInput (critical fix)
- [ ] Types exported for use in routes
- [ ] Zod validation works correctly

---

## Phase 2: API Routes

### Task 2.1: Create Clarity Canvas Sessions API Route
**Description:** Implement GET /api/clarity-canvas/sessions with filtering
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1, 1.2, 1.3
**Can run parallel with:** Task 2.2, 2.3

**Technical Requirements:**

Create `app/api/clarity-canvas/sessions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionFiltersSchema } from '@/lib/input-session/schemas';
import { InputType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const inputType = searchParams.get('inputType') as InputType | null;
    const pillar = searchParams.get('pillar');

    const profile = await prisma.clarityProfile.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!profile) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await prisma.inputSession.findMany({
      where: {
        clarityProfileId: profile.id,
        ...(inputType && { inputType }),
        ...(pillar && { sourceContext: { contains: pillar } }),
      },
      orderBy: { capturedAt: 'desc' },
      take: 50, // Pagination limit
      include: {
        fieldSources: {
          select: {
            id: true,
            type: true,
            extractedAt: true,
            field: {
              select: {
                key: true,
                name: true,
                subsection: {
                  select: {
                    key: true,
                    name: true,
                    section: {
                      select: { key: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Route returns sessions for authenticated user
- [ ] Empty array returned for users without profile
- [ ] Filtering by inputType works
- [ ] Filtering by pillar (sourceContext) works
- [ ] Sessions ordered by capturedAt desc
- [ ] Pagination limit of 50 applied
- [ ] Field sources included with full path info

---

### Task 2.2: Create Field Sources API Route with Ownership Check
**Description:** Implement GET /api/clarity-canvas/fields/[id]/sources with proper authorization (critical fix)
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 2.1, 2.3

**Technical Requirements:**

Create `app/api/clarity-canvas/fields/[id]/sources/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL FIX: Verify field ownership through chain
    // field → subsection → section → profile → user
    const field = await prisma.profileField.findUnique({
      where: { id: params.id },
      include: {
        subsection: {
          include: {
            section: {
              include: {
                profile: {
                  include: {
                    user: { select: { email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Ownership check
    if (field.subsection.section.profile.user?.email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sources = await prisma.fieldSource.findMany({
      where: { fieldId: params.id },
      orderBy: { extractedAt: 'desc' },
      include: {
        inputSession: {
          select: {
            id: true,
            title: true,
            inputType: true,
            capturedAt: true,
            rawContent: true,
          },
        },
      },
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching field sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Route requires authentication
- [ ] Ownership verification through field → subsection → section → profile → user chain
- [ ] Returns 403 if user doesn't own the field
- [ ] Returns 404 if field doesn't exist
- [ ] Sources include inputSession data
- [ ] Sources ordered by extractedAt desc

---

### Task 2.3: Create Central Command Sessions API Route
**Description:** Implement GET/POST /api/central-command/prospects/[id]/sessions
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1, 1.2, 1.3
**Can run parallel with:** Task 2.1, 2.2

**Technical Requirements:**

Create `app/api/central-command/prospects/[id]/sessions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { getSessionOptions, SessionData } from '@/lib/session';
import { CreateSessionRequestSchema } from '@/lib/input-session/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionData = await getIronSession<SessionData>(
      cookies(),
      getSessionOptions()
    );

    if (!sessionData.centralCommandAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.inputSession.findMany({
      where: { pipelineClientId: params.id },
      orderBy: { capturedAt: 'desc' },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching prospect sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionData = await getIronSession<SessionData>(
      cookies(),
      getSessionOptions()
    );

    if (!sessionData.centralCommandAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateSessionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rawContent, inputType, title, sourceContext } = parsed.data;

    // Verify prospect exists
    const prospect = await prisma.pipelineClient.findUnique({
      where: { id: params.id },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const inputSession = await prisma.inputSession.create({
      data: {
        pipelineClientId: params.id,
        inputType: inputType || 'TEXT_INPUT',
        title: title || `Follow-up context - ${new Date().toLocaleDateString()}`,
        rawContent,
        sourceModule: 'central-command',
        sourceContext: sourceContext || 'follow-up',
        capturedAt: new Date(),
      },
    });

    return NextResponse.json({ session: inputSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] GET returns all sessions for prospect
- [ ] POST creates new session with validation
- [ ] Zod schema validates request body
- [ ] Returns 404 if prospect doesn't exist
- [ ] Auth checked via iron-session centralCommandAuth
- [ ] Default title generated if not provided

---

### Task 2.4: Modify Commit Route to Create InputSession (Critical Fix)
**Description:** Update /api/clarity-canvas/commit to accept originalInput and create InputSession
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.1, 1.2, 1.3
**Can run parallel with:** None (modifies existing route)

**Technical Requirements:**

Modify `app/api/clarity-canvas/commit/route.ts`:

1. Update request parsing to use new schema:

```typescript
import { CommitRequestWithInputSchema } from '@/lib/input-session/schemas';
import { generateSessionTitle, mapSourceTypeToInputType } from '@/lib/input-session/utils';
import { InputType } from '@prisma/client';

// In POST handler:
const body = await req.json();
const parsed = CommitRequestWithInputSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: 'Invalid request', details: parsed.error.flatten() },
    { status: 400 }
  );
}

const {
  recommendations,
  scope,
  originalInput,  // NEW: Required field
  inputType,
  durationSeconds,
  originalFileName
} = parsed.data;
```

2. Create InputSession at start of transaction:

```typescript
// Inside the transaction, BEFORE creating FieldSources:
const inputSession = await tx.inputSession.create({
  data: {
    clarityProfileId: profile.id,
    inputType: mapSourceTypeToInputType(inputType || 'TEXT'),
    title: generateSessionTitle(recommendations),
    rawContent: originalInput,
    sourceModule: 'clarity-canvas',
    sourceContext: scope?.section || 'global',
    durationSeconds,
    originalFileName,
    capturedAt: new Date(),
    processedAt: new Date(),
    fieldsPopulated: recommendations.length,
  },
});
```

3. Link FieldSource to InputSession:

```typescript
// When creating FieldSource, add inputSessionId:
await tx.fieldSource.create({
  data: {
    fieldId: field.id,
    type: rec.sourceType === 'VOICE' ? SourceType.VOICE : SourceType.TEXT,
    rawContent: rec.content,
    userConfidence: rec.confidence,
    inputSessionId: inputSession.id, // NEW: Link to session
  },
});
```

**Acceptance Criteria:**
- [ ] Request requires originalInput field (returns 400 if missing)
- [ ] InputSession created at start of transaction
- [ ] All FieldSources linked to InputSession
- [ ] fieldsPopulated count is accurate
- [ ] sourceContext reflects scope.section if provided
- [ ] Existing tests still pass
- [ ] No breaking changes to successful commits

---

### Task 2.5: Modify Prospects Route to Create InputSession
**Description:** Update /api/central-command/prospects POST to create InputSession on prospect creation
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 2.4

**Technical Requirements:**

Modify `app/api/central-command/prospects/route.ts`:

In the POST handler, after creating PipelineClient, add:

```typescript
// After creating the PipelineClient in the transaction:
if (data.rawInputText) {
  await tx.inputSession.create({
    data: {
      pipelineClientId: client.id,
      inputType: 'TEXT_INPUT',
      title: `Initial intake - ${data.name}`,
      rawContent: data.rawInputText,
      sourceModule: 'central-command',
      sourceContext: 'prospect-intake',
      capturedAt: new Date(),
      processedAt: new Date(),
    },
  });
}
```

**Acceptance Criteria:**
- [ ] InputSession created when rawInputText is provided
- [ ] InputSession linked to PipelineClient
- [ ] Title includes prospect name
- [ ] sourceContext is 'prospect-intake'
- [ ] No InputSession created if rawInputText is empty/null
- [ ] Existing prospect creation still works

---

## Phase 3: Clarity Canvas UI

### Task 3.1: Create Archive Page
**Description:** Build /clarity-canvas/archive page with session list and filters
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.1
**Can run parallel with:** Task 3.2

**Technical Requirements:**

Create `app/clarity-canvas/archive/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ArchiveClient } from './ArchiveClient';

export const metadata = {
  title: 'Raw Input Archive | Clarity Canvas',
};

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  return <ArchiveClient />;
}
```

Create `app/clarity-canvas/archive/ArchiveClient.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InputSessionCard } from './InputSessionCard';
import { FilterBar } from './FilterBar';
import { InputSessionWithSources, InputSessionFilters } from '@/lib/input-session/types';
import { TEXT_PRIMARY, TEXT_MUTED, GOLD } from '@/components/portal/design-tokens';

export function ArchiveClient() {
  const [sessions, setSessions] = useState<InputSessionWithSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InputSessionFilters>({
    inputType: null,
    pillar: null,
  });

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  async function fetchSessions() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.inputType) params.set('inputType', filters.inputType);
    if (filters.pillar) params.set('pillar', filters.pillar);

    const res = await fetch(`/api/clarity-canvas/sessions?${params}`);
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="mb-8">
        <Link
          href="/clarity-canvas"
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: TEXT_MUTED }}
        >
          ← Back to Canvas
        </Link>
        <h1
          className="text-2xl font-display mt-4"
          style={{ color: TEXT_PRIMARY }}
        >
          Raw Input Archive
        </h1>
        <p className="mt-2" style={{ color: TEXT_MUTED }}>
          Everything you've shared is preserved here
        </p>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="space-y-4 mt-6">
        {loading ? (
          <div className="text-center py-8" style={{ color: TEXT_MUTED }}>
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: TEXT_MUTED }}>No inputs yet.</p>
            <Link
              href="/clarity-canvas"
              className="inline-block mt-4 text-sm hover:opacity-80"
              style={{ color: GOLD }}
            >
              Start by adding context to your pillars →
            </Link>
          </div>
        ) : (
          sessions.map((session) => (
            <InputSessionCard key={session.id} session={session} />
          ))
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Page requires authentication (redirects to login)
- [ ] Shows loading state while fetching
- [ ] Shows empty state with CTA when no sessions
- [ ] Renders session cards for each session
- [ ] Filters update URL params and refetch
- [ ] Uses design tokens consistently

---

### Task 3.2: Create InputSessionCard Component
**Description:** Build the expandable card component for displaying input sessions
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.2
**Can run parallel with:** Task 3.1

**Technical Requirements:**

Create `app/clarity-canvas/archive/InputSessionCard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Mic, FileText, Upload } from 'lucide-react';
import {
  GOLD, TEXT_PRIMARY, TEXT_MUTED, BG_SURFACE
} from '@/components/portal/design-tokens';
import { InputSessionWithSources } from '@/lib/input-session/types';
import { truncate, formatDate, getInputTypeLabel } from '@/lib/input-session/utils';
import { InputType } from '@prisma/client';

const INPUT_TYPE_ICONS: Record<InputType, typeof Mic> = {
  VOICE_TRANSCRIPT: Mic,
  TEXT_INPUT: FileText,
  FILE_UPLOAD: Upload,
};

export function InputSessionCard({ session }: { session: InputSessionWithSources }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = INPUT_TYPE_ICONS[session.inputType];

  return (
    <div
      className="rounded-lg border"
      style={{
        background: BG_SURFACE,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: GOLD }} />
            <span
              className="text-xs font-mono uppercase"
              style={{ color: GOLD }}
            >
              {getInputTypeLabel(session.inputType)}
            </span>
          </div>
          <span className="text-xs" style={{ color: TEXT_MUTED }}>
            {formatDate(session.capturedAt)}
          </span>
        </div>
        <h3 className="font-medium" style={{ color: TEXT_PRIMARY }}>
          {session.title}
        </h3>
      </div>

      {/* Content Preview */}
      <div
        className="px-4 py-3 border-t border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <p
          className="text-sm whitespace-pre-wrap"
          style={{ color: TEXT_MUTED }}
        >
          {expanded ? session.rawContent : truncate(session.rawContent, 200)}
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-xs" style={{ color: TEXT_MUTED }}>
          → Contributed to {session.fieldsPopulated} field
          {session.fieldsPopulated !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs hover:opacity-80"
          style={{ color: GOLD }}
        >
          {expanded ? 'Collapse' : 'Expand'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded: Show linked fields */}
      {expanded && session.fieldSources?.length > 0 && (
        <div
          className="px-4 pb-4 border-t"
          style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <p
            className="text-xs font-mono uppercase mt-3 mb-2"
            style={{ color: GOLD }}
          >
            Fields populated
          </p>
          <div className="space-y-1">
            {session.fieldSources.map((source) => (
              <div
                key={source.id}
                className="text-xs flex items-center gap-2"
                style={{ color: TEXT_MUTED }}
              >
                <span>•</span>
                <span>
                  {source.field.subsection.section.name} →{' '}
                  {source.field.subsection.name} →{' '}
                  {source.field.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows input type icon and label
- [ ] Shows formatted date
- [ ] Shows truncated content (200 chars) when collapsed
- [ ] Shows full content when expanded
- [ ] Shows field count in footer
- [ ] Expand/collapse toggles content and field list
- [ ] Uses design tokens consistently

---

### Task 3.3: Create FilterBar Component
**Description:** Build the filter controls for the archive page (simplified to type + pillar only)
**Size:** Small
**Priority:** Medium
**Dependencies:** Task 1.2
**Can run parallel with:** Task 3.1, 3.2

**Technical Requirements:**

Create `app/clarity-canvas/archive/FilterBar.tsx`:

```typescript
'use client';

import { InputType } from '@prisma/client';
import { InputSessionFilters } from '@/lib/input-session/types';
import { GOLD, TEXT_MUTED, BG_SURFACE } from '@/components/portal/design-tokens';

const PILLARS = [
  { key: 'individual', label: 'Individual' },
  { key: 'role', label: 'Role' },
  { key: 'organization', label: 'Organization' },
  { key: 'goals', label: 'Goals' },
  { key: 'network', label: 'Network' },
  { key: 'projects', label: 'Projects' },
];

const INPUT_TYPES: { value: InputType; label: string }[] = [
  { value: 'VOICE_TRANSCRIPT', label: 'Voice' },
  { value: 'TEXT_INPUT', label: 'Text' },
  { value: 'FILE_UPLOAD', label: 'File' },
];

interface FilterBarProps {
  filters: InputSessionFilters;
  onChange: (filters: InputSessionFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const selectStyle = {
    background: BG_SURFACE,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: TEXT_MUTED,
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono uppercase" style={{ color: GOLD }}>
        Filter:
      </span>

      <select
        value={filters.inputType || ''}
        onChange={(e) => onChange({
          ...filters,
          inputType: e.target.value as InputType || null
        })}
        className="px-3 py-1.5 rounded border text-sm"
        style={selectStyle}
      >
        <option value="">All Types</option>
        {INPUT_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      <select
        value={filters.pillar || ''}
        onChange={(e) => onChange({
          ...filters,
          pillar: e.target.value || null
        })}
        className="px-3 py-1.5 rounded border text-sm"
        style={selectStyle}
      >
        <option value="">All Pillars</option>
        {PILLARS.map((pillar) => (
          <option key={pillar.key} value={pillar.key}>
            {pillar.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Two dropdown filters: type and pillar
- [ ] "All" option for each filter
- [ ] onChange called with updated filters
- [ ] Uses design tokens consistently
- [ ] No date range filter (per simplification)

---

### Task 3.4: Add Pillar Source Badge to Pillar Pages
**Description:** Add "X raw inputs" badge to pillar page headers linking to filtered archive
**Size:** Small
**Priority:** Medium
**Dependencies:** Task 2.1
**Can run parallel with:** Task 3.5

**Technical Requirements:**

Add to `app/clarity-canvas/[pillar]/PillarPageClient.tsx`:

```typescript
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { GOLD } from '@/components/portal/design-tokens';

function PillarSourceBadge({ pillarKey, count }: { pillarKey: string; count: number }) {
  if (count === 0) return null;

  return (
    <Link
      href={`/clarity-canvas/archive?pillar=${pillarKey}`}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs hover:opacity-80 transition-opacity"
      style={{
        background: 'rgba(212, 165, 74, 0.1)',
        color: GOLD,
        border: `1px solid ${GOLD}`,
      }}
    >
      <FileText size={12} />
      <span>{count} raw input{count !== 1 ? 's' : ''}</span>
    </Link>
  );
}

// In the pillar page component, fetch session count:
const sessionCount = await prisma.inputSession.count({
  where: {
    clarityProfileId: profile.id,
    sourceContext: { contains: pillarKey },
  },
});

// In the header:
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-display" style={{ color: TEXT_PRIMARY }}>
    {pillar.name}
  </h1>
  <PillarSourceBadge pillarKey={pillarKey} count={sessionCount} />
</div>
```

**Acceptance Criteria:**
- [ ] Badge shows count of input sessions for pillar
- [ ] Badge links to archive with pillar filter
- [ ] Badge hidden when count is 0
- [ ] Correct singular/plural "input" vs "inputs"
- [ ] Uses design tokens consistently

---

### Task 3.5: Create FieldCitation Component
**Description:** Build the source citation popover for individual fields
**Size:** Medium
**Priority:** Medium
**Dependencies:** Task 2.2
**Can run parallel with:** Task 3.4

**Technical Requirements:**

Create `components/clarity-canvas/FieldCitation.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { GOLD, TEXT_MUTED, BG_ELEVATED } from '@/components/portal/design-tokens';
import { truncate, formatDate } from '@/lib/input-session/utils';

interface FieldSource {
  id: string;
  type: string;
  extractedAt: string;
  rawContent: string;
  inputSession?: {
    id: string;
    title: string;
    inputType: string;
    capturedAt: string;
  };
}

interface FieldCitationProps {
  fieldId: string;
  sourceCount: number;
}

export function FieldCitation({ fieldId, sourceCount }: FieldCitationProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [sources, setSources] = useState<FieldSource[] | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadSources() {
    if (sources || loading) return;
    setLoading(true);
    const res = await fetch(`/api/clarity-canvas/fields/${fieldId}/sources`);
    const data = await res.json();
    setSources(data.sources || []);
    setLoading(false);
  }

  if (sourceCount === 0) return null;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => {
          loadSources();
          setShowPopover(!showPopover);
        }}
        className="flex items-center gap-1 text-xs hover:opacity-80"
        style={{ color: TEXT_MUTED }}
      >
        <Info size={12} />
        <span>{sourceCount} source{sourceCount !== 1 ? 's' : ''}</span>
      </button>

      {showPopover && (
        <div
          className="absolute z-50 top-full left-0 mt-2 w-80 rounded-lg border p-4 shadow-xl"
          style={{
            background: BG_ELEVATED,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-xs font-mono uppercase mb-3" style={{ color: GOLD }}>
            Sources
          </p>
          {loading ? (
            <p className="text-sm" style={{ color: TEXT_MUTED }}>Loading...</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sources?.map((source) => (
                <div key={source.id} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: TEXT_MUTED,
                      }}
                    >
                      {source.type}
                    </span>
                    <span className="text-xs" style={{ color: TEXT_MUTED }}>
                      {formatDate(source.extractedAt)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: TEXT_MUTED }}>
                    {truncate(source.rawContent, 150)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows source count when sources exist
- [ ] Hidden when sourceCount is 0
- [ ] Lazy-loads sources on first click
- [ ] Shows loading state while fetching
- [ ] Popover shows source type, date, and truncated content
- [ ] Closes when clicking outside
- [ ] Scrollable if many sources

---

## Phase 4: Central Command UI

### Task 4.1: Add RawInputTab to ClientDetailModal
**Description:** Add a new tab showing raw input history with "Add Context" button
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.3
**Can run parallel with:** Task 4.2

**Technical Requirements:**

Add to `app/central-command/components/ClientDetailModal.tsx`:

1. Add tab to the tab list
2. Create RawInputTab component

```typescript
// Add to tabs array:
const TABS = [
  { id: 'synthesis', label: 'Client Intelligence' },
  { id: 'raw-input', label: 'Raw Input' }, // NEW
  // ... existing tabs
];

// RawInputTab component:
function RawInputTab({ prospect }: { prospect: ProspectWithRecord }) {
  const [sessions, setSessions] = useState<InputSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddContext, setShowAddContext] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [prospect.id]);

  async function fetchSessions() {
    const res = await fetch(`/api/central-command/prospects/${prospect.id}/sessions`);
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          Raw Input History
        </p>
        <button
          onClick={() => setShowAddContext(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs hover:opacity-80"
          style={{
            background: 'rgba(212, 165, 74, 0.1)',
            color: GOLD,
            border: `1px solid ${GOLD}`,
          }}
        >
          <Plus size={14} />
          Add Context
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8" style={{ color: TEXT_MUTED }}>
          Loading...
        </div>
      ) : sessions.length === 0 ? (
        <div className="space-y-4">
          <p style={{ color: TEXT_MUTED }}>No input sessions recorded.</p>
          {/* Legacy fallback for existing prospects */}
          {prospect.rawInputText && (
            <div>
              <p className="text-xs font-mono uppercase mb-2" style={{ color: GOLD }}>
                Legacy Raw Input
              </p>
              <div
                className="p-4 rounded-lg whitespace-pre-wrap text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: TEXT_MUTED,
                }}
              >
                {prospect.rawInputText}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <CCInputSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {showAddContext && (
        <AddContextModal
          prospectId={prospect.id}
          onClose={() => setShowAddContext(false)}
          onSuccess={() => {
            setShowAddContext(false);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Tab appears in ClientDetailModal navigation
- [ ] Shows loading state while fetching sessions
- [ ] Shows legacy rawInputText for existing prospects without sessions
- [ ] Sessions displayed in chronological order
- [ ] "Add Context" button opens modal
- [ ] New sessions appear after adding

---

### Task 4.2: Create AddContextModal Component
**Description:** Build modal for adding follow-up context to prospects
**Size:** Medium
**Priority:** Medium
**Dependencies:** Task 2.3
**Can run parallel with:** Task 4.1

**Technical Requirements:**

Create `app/central-command/components/AddContextModal.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  GOLD, TEXT_PRIMARY, TEXT_MUTED, BG_SURFACE, BG_ELEVATED
} from '@/components/portal/design-tokens';

interface AddContextModalProps {
  prospectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddContextModal({ prospectId, onClose, onSuccess }: AddContextModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/central-command/prospects/${prospectId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: content,
          title: title || undefined,
          inputType: 'TEXT_INPUT',
          sourceContext: 'follow-up',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save context');
      }

      onSuccess();
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-lg border p-6"
        style={{
          background: BG_SURFACE,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display" style={{ color: TEXT_PRIMARY }}>
            Add Context
          </h2>
          <button onClick={onClose} style={{ color: TEXT_MUTED }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-mono uppercase mb-2"
              style={{ color: GOLD }}
            >
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow-up call notes"
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: BG_ELEVATED,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: TEXT_PRIMARY,
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-mono uppercase mb-2"
              style={{ color: GOLD }}
            >
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste meeting notes, call transcript, or any additional context..."
              rows={8}
              className="w-full px-3 py-2 rounded border text-sm resize-none"
              style={{
                background: BG_ELEVATED,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: TEXT_PRIMARY,
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm"
              style={{ color: TEXT_MUTED }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !content.trim()}
              className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              style={{
                background: GOLD,
                color: '#0a0a0f',
              }}
            >
              {saving ? 'Saving...' : 'Save Context'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Modal opens centered with backdrop
- [ ] Optional title field
- [ ] Required content textarea
- [ ] Validation prevents empty submission
- [ ] Loading state while saving
- [ ] Error state displays
- [ ] Closes on backdrop click or cancel
- [ ] Calls onSuccess after successful save

---

## Phase 5: Trust Messaging

### Task 5.1: Create InputPreservationCard Component
**Description:** Build one-time dismissible onboarding card explaining data preservation
**Size:** Small
**Priority:** Medium
**Dependencies:** None
**Can run parallel with:** Task 5.2

**Technical Requirements:**

Create `components/clarity-canvas/InputPreservationCard.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Archive } from 'lucide-react';
import Link from 'next/link';
import { GOLD, TEXT_PRIMARY, TEXT_MUTED, BG_SURFACE } from '@/components/portal/design-tokens';

const DISMISSED_KEY = 'input-preservation-card-dismissed';

export function InputPreservationCard() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div
      className="rounded-lg border p-4 mb-6"
      style={{
        background: BG_SURFACE,
        borderColor: 'rgba(212, 165, 74, 0.2)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Archive size={20} style={{ color: GOLD }} className="mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium mb-1" style={{ color: TEXT_PRIMARY }}>
              Your inputs are always preserved
            </h3>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>
              Everything you share — voice recordings, text, uploaded files — is saved
              in its original form. Even as we synthesize your input into clear summaries,
              you can always revisit what you originally said.
            </p>
            <Link
              href="/clarity-canvas/archive"
              className="inline-block mt-3 text-sm hover:opacity-80"
              style={{ color: GOLD }}
            >
              View Archive →
            </Link>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="hover:opacity-60 flex-shrink-0"
          style={{ color: TEXT_MUTED }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
```

Add to Clarity Canvas main page after authentication.

**Acceptance Criteria:**
- [ ] Card shows on first visit
- [ ] Dismisses permanently via localStorage
- [ ] Link navigates to archive
- [ ] Uses design tokens consistently
- [ ] Accessible with proper contrast

---

### Task 5.2: Create AutoSaveIndicator Component
**Description:** Build the subtle "Saved" indicator that appears after each input commit
**Size:** Small
**Priority:** Medium
**Dependencies:** None
**Can run parallel with:** Task 5.1

**Technical Requirements:**

Create `components/clarity-canvas/AutoSaveIndicator.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { GREEN } from '@/components/portal/design-tokens';

interface AutoSaveIndicatorProps {
  show: boolean;
  onHide?: () => void;
}

export function AutoSaveIndicator({ show, onHide }: AutoSaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg z-50"
      style={{
        background: 'rgba(74, 222, 128, 0.1)',
        border: `1px solid ${GREEN}`,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <Check size={14} style={{ color: GREEN }} />
      <span className="text-sm" style={{ color: GREEN }}>
        Saved
      </span>
    </div>
  );
}
```

Wire into RecommendationReview component after successful commit.

**Acceptance Criteria:**
- [ ] Appears when show prop becomes true
- [ ] Auto-hides after 3 seconds
- [ ] Positioned fixed bottom-right
- [ ] Calls onHide callback when hiding
- [ ] Subtle fade-in animation

---

## Phase 6: Client-Side Updates & Integration

### Task 6.1: Update RecommendationReview to Pass originalInput
**Description:** Modify the commit flow to include original input in the request (critical fix)
**Size:** Medium
**Priority:** High
**Dependencies:** Task 2.4
**Can run parallel with:** None

**Technical Requirements:**

The RecommendationReview component must pass the original input to the commit API.

1. Accept originalInput as prop:

```typescript
interface RecommendationReviewProps {
  recommendations: Recommendation[];
  originalInput: string; // NEW: Required
  inputType: 'VOICE' | 'TEXT' | 'FILE';
  durationSeconds?: number;
  originalFileName?: string;
  onApprove: () => void;
  onBack: () => void;
}
```

2. Include in commit request:

```typescript
async function handleCommit() {
  const response = await fetch('/api/clarity-canvas/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recommendations: selectedRecommendations,
      scope,
      originalInput, // CRITICAL: Include original input
      inputType,
      durationSeconds,
      originalFileName,
    }),
  });
  // ... handle response
}
```

3. Update all usages of RecommendationReview to pass originalInput

**Acceptance Criteria:**
- [ ] RecommendationReview requires originalInput prop
- [ ] Commit request includes originalInput
- [ ] All usages of RecommendationReview updated
- [ ] Commit API receives and stores originalInput
- [ ] Tests updated to include originalInput

---

### Task 6.2: Wire AutoSaveIndicator into Commit Flow
**Description:** Show the auto-save indicator after successful commit
**Size:** Small
**Priority:** Low
**Dependencies:** Task 5.2, 6.1
**Can run parallel with:** None

**Technical Requirements:**

In the component that handles the commit flow:

```typescript
const [showSaved, setShowSaved] = useState(false);

async function handleCommit() {
  // ... commit logic ...
  if (response.ok) {
    setShowSaved(true);
    // ... other success handling
  }
}

return (
  <>
    {/* ... other UI ... */}
    <AutoSaveIndicator show={showSaved} onHide={() => setShowSaved(false)} />
  </>
);
```

**Acceptance Criteria:**
- [ ] Indicator appears after successful commit
- [ ] Indicator hides after 3 seconds
- [ ] State resets after hiding

---

## Summary

### Total Tasks: 18

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Database & Foundation | 3 | High |
| Phase 2: API Routes | 5 | High |
| Phase 3: Clarity Canvas UI | 5 | High/Medium |
| Phase 4: Central Command UI | 2 | High/Medium |
| Phase 5: Trust Messaging | 2 | Medium |
| Phase 6: Integration | 2 | High/Low |

### Critical Path

1. Task 1.1 (Schema) → Task 1.2, 1.3 (Types/Schemas)
2. Task 1.1 → Task 2.1-2.5 (API Routes)
3. Task 2.4 (Commit Route) → Task 6.1 (Client Update)
4. Task 2.1 → Task 3.1-3.5 (Clarity Canvas UI)
5. Task 2.3 → Task 4.1-4.2 (Central Command UI)

### Parallel Execution Opportunities

- Tasks 1.2 and 1.3 can run in parallel
- Tasks 2.1, 2.2, and 2.3 can run in parallel
- Tasks 3.1, 3.2, 3.3, 3.4, 3.5 mostly parallel
- Tasks 4.1 and 4.2 can run in parallel
- Tasks 5.1 and 5.2 can run in parallel

### Validation Fixes Incorporated

1. ✅ Added `originalInput` to CommitRequestWithInputSchema (Task 1.3)
2. ✅ Added ownership verification to field sources route (Task 2.2)
3. ✅ Added Zod schemas for all POST routes (Task 1.3, 2.3)
4. ✅ Removed `extractionSummary` field (schema simplification)
5. ✅ Simplified filters to type + pillar only (Task 3.3)
6. ✅ Removed settings/data-privacy section from scope
