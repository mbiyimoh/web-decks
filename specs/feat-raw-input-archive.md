# Raw Input Archive for Clarity Canvas and Central Command

## Status
**Draft** | Author: Claude Code | Date: 2026-02-08

## Overview

Create a unified "Raw Input Archive" system that surfaces all raw user inputs (voice transcripts, text brain dumps, uploaded files) across Clarity Canvas and Central Command. Users should have peace of mind that their original content is always preserved and accessible, even as the system synthesizes it into polished artifacts.

This feature provides **two-tier visibility**:
1. **Session-level archive** — Complete original inputs grouped by submission session
2. **Field-level citations** — Individual fields link back to their source content

## Background / Problem Statement

### Current State

**Clarity Canvas:**
- `FieldSource.rawContent` already stores verbatim input per field
- Source count badges ("2 sources") are displayed but content is hidden
- No session-level grouping of inputs
- No "View Sources" UI exists

**Central Command:**
- `PipelineClient.rawInputText` already stores full original text dump
- `enrichmentFindings` stores structured synthesis
- `scoreAssessments.evidence[]` stores supporting quotes
- Raw input text is never displayed in the detail modal
- No archive or "view original" UI exists

### The Gap

Both systems already preserve raw inputs at the database level. The gap is entirely in the **UI layer** — we need to surface what's already stored and add session-level tracking to group related inputs together.

### User Need

Users need confidence that:
1. Their original words are never lost
2. They can revisit what they said at any time
3. They can trace any synthesized content back to its source
4. They can add more context over time (multiple sessions)

## Goals

- Create `InputSession` model to track complete raw inputs as cohesive sessions
- Link existing `FieldSource` records to their parent input session
- Build archive UI for Clarity Canvas at `/clarity-canvas/archive`
- Add "Raw Input" tab to Central Command's `ClientDetailModal`
- Display contextual source indicators on pillar pages and synthesis sections
- Implement trust messaging (onboarding, auto-save indicator, settings)
- Support multiple input sessions per profile/prospect over time

## Non-Goals

- **Persona Sharpener module** — Out of scope; patterns will be applied later
- **Audio file storage** — Transcripts only, no R2/S3 blob storage
- **File organization** — No folders, tags, or complex hierarchy
- **Collaborative access** — No sharing raw inputs between team members
- **File versioning** — No tracking changes to raw inputs over time
- **Full-text search** — Phase 2; initial version uses filters only
- **Export functionality** — Phase 2 feature for data portability

## Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Prisma | 5.x | ORM for InputSession model |
| Next.js | 14.x | App Router for new pages/routes |
| React | 18.x | UI components |
| iron-session | 8.x | Session management |
| Tailwind CSS | 3.x | Styling |

No new external libraries required.

## Detailed Design

### 1. Database Schema Changes

#### New Model: InputSession

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
  inputType       InputType        // VOICE_TRANSCRIPT, TEXT_INPUT, FILE_UPLOAD
  title           String           // Auto-generated or user-provided
  rawContent      String  @db.Text // Complete original input

  // Source metadata
  sourceModule    String           // "clarity-canvas", "central-command"
  sourceContext   String?          // e.g., "individual-pillar", "prospect-intake"

  // Voice-specific
  durationSeconds Int?

  // File-specific
  originalFileName String?

  // Processing results
  fieldsPopulated Int      @default(0)  // Count of fields this session contributed to
  extractionSummary String? @db.Text    // AI-generated summary of what was extracted

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

#### Schema Modifications to Existing Models

```prisma
// Add InputSession relation to FieldSource
model FieldSource {
  id             String     @id @default(cuid())
  fieldId        String
  type           SourceType
  rawContent     String     @db.Text
  extractedAt    DateTime   @default(now())
  questionId     String?
  userConfidence Float      @default(1.0)

  // NEW: Link to parent input session
  inputSessionId  String?
  inputSession    InputSession? @relation(fields: [inputSessionId], references: [id], onDelete: SetNull)

  field ProfileField @relation(fields: [fieldId], references: [id], onDelete: Cascade)

  @@index([fieldId])
  @@index([inputSessionId])
}

// Add InputSession relation to ClarityProfile
model ClarityProfile {
  // ... existing fields ...
  inputSessions   InputSession[]
}

// Add InputSession relation to PipelineClient
model PipelineClient {
  // ... existing fields ...
  inputSessions   InputSession[]
}
```

### 2. API Routes

#### Clarity Canvas Routes

**GET `/api/clarity-canvas/sessions`**

List all input sessions for the authenticated user's profile.

```typescript
// app/api/clarity-canvas/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const inputType = searchParams.get('inputType') as InputType | null;
  const pillar = searchParams.get('pillar'); // Filter by sourceContext

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
}
```

**GET `/api/clarity-canvas/sessions/[id]`**

Get a single session with full details.

```typescript
// app/api/clarity-canvas/sessions/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const inputSession = await prisma.inputSession.findUnique({
    where: { id: params.id },
    include: {
      clarityProfile: {
        select: { user: { select: { email: true } } },
      },
      fieldSources: {
        include: {
          field: {
            include: {
              subsection: {
                include: { section: true },
              },
            },
          },
        },
      },
    },
  });

  if (!inputSession) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify ownership
  if (inputSession.clarityProfile?.user?.email !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ session: inputSession });
}
```

**GET `/api/clarity-canvas/fields/[id]/sources`**

Get all sources for a specific field.

```typescript
// app/api/clarity-canvas/fields/[id]/sources/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
}
```

#### Central Command Routes

**GET `/api/central-command/prospects/[id]/sessions`**

List all input sessions for a prospect.

```typescript
// app/api/central-command/prospects/[id]/sessions/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify Central Command auth via iron-session
  const sessionData = await getIronSession(cookies(), sessionOptions);
  if (!sessionData.centralCommandAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await prisma.inputSession.findMany({
    where: { pipelineClientId: params.id },
    orderBy: { capturedAt: 'desc' },
  });

  return NextResponse.json({ sessions });
}
```

**POST `/api/central-command/prospects/[id]/sessions`**

Add a new input session to an existing prospect (for follow-up context).

```typescript
// app/api/central-command/prospects/[id]/sessions/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionData = await getIronSession(cookies(), sessionOptions);
  if (!sessionData.centralCommandAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { rawContent, inputType, title, sourceContext } = body;

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

  return NextResponse.json({ session: inputSession });
}
```

### 3. Modifications to Existing Routes

#### Clarity Canvas Commit Route

Modify `/api/clarity-canvas/commit/route.ts` to create an InputSession and link FieldSource records.

```typescript
// In app/api/clarity-canvas/commit/route.ts

// At the start of the transaction, create the InputSession
const inputSession = await tx.inputSession.create({
  data: {
    clarityProfileId: profile.id,
    inputType: sourceType === 'VOICE' ? 'VOICE_TRANSCRIPT' : 'TEXT_INPUT',
    title: generateSessionTitle(recommendations),
    rawContent: originalInput, // Pass from client
    sourceModule: 'clarity-canvas',
    sourceContext: scope?.section || 'global',
    capturedAt: new Date(),
    processedAt: new Date(),
    fieldsPopulated: recommendations.length,
    extractionSummary: generateExtractionSummary(recommendations),
  },
});

// When creating FieldSource, include inputSessionId
await tx.fieldSource.create({
  data: {
    fieldId: field.id,
    type: rec.sourceType === 'VOICE' ? SourceType.VOICE : SourceType.TEXT,
    rawContent: rec.content,
    userConfidence: rec.confidence,
    inputSessionId: inputSession.id, // NEW: Link to session
  },
});

// Helper functions
function generateSessionTitle(recommendations: Recommendation[]): string {
  const sections = [...new Set(recommendations.map(r => r.targetSection))];
  if (sections.length === 1) {
    return `${capitalize(sections[0])} context`;
  }
  return `Context for ${sections.length} pillars`;
}

function generateExtractionSummary(recommendations: Recommendation[]): string {
  return `Extracted ${recommendations.length} insights across ${
    [...new Set(recommendations.map(r => r.targetSection))].length
  } pillars.`;
}
```

#### Central Command Prospects Route

Modify `/api/central-command/prospects/route.ts` to create an InputSession on prospect creation.

```typescript
// In app/api/central-command/prospects/route.ts POST handler

// After creating the PipelineClient, create the InputSession
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
      extractionSummary: data.enrichmentFindings
        ? 'AI extraction completed successfully.'
        : null,
    },
  });
}
```

### 4. UI Components

#### Archive Page (`/clarity-canvas/archive`)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Canvas                                               │
│                                                                 │
│  RAW INPUT ARCHIVE                                              │
│  Everything you've shared is preserved here                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Filter: [All Types ▼]  [All Pillars ▼]  [Date Range ▼] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎤 Voice transcript                      Feb 8, 2026    │   │
│  │ "Individual pillar context"                             │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ I've been working in fintech for about 8 years now,    │   │
│  │ mostly focused on credit risk and payments...          │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ → Contributed to 5 fields                    [Expand ▼] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📝 Text input                            Feb 5, 2026    │   │
│  │ "Organization context"                                  │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Our company is a B2B SaaS platform serving mid-market  │   │
│  │ financial institutions. We're currently Series A...    │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ → Contributed to 8 fields                    [Expand ▼] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Structure:**

```typescript
// app/clarity-canvas/archive/page.tsx
export default async function ArchivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/auth/login');

  return <ArchiveClient />;
}

// app/clarity-canvas/archive/ArchiveClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { InputSessionCard } from './InputSessionCard';
import { FilterBar } from './FilterBar';

export function ArchiveClient() {
  const [sessions, setSessions] = useState<InputSession[]>([]);
  const [filters, setFilters] = useState<Filters>({
    inputType: null,
    pillar: null,
    dateRange: null,
  });

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="mb-8">
        <Link href="/clarity-canvas" className="text-sm text-[#888] hover:text-[#d4a54a]">
          ← Back to Canvas
        </Link>
        <h1 className="text-2xl font-display text-[#f5f5f5] mt-4">
          Raw Input Archive
        </h1>
        <p className="text-[#888] mt-2">
          Everything you've shared is preserved here
        </p>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="space-y-4 mt-6">
        {sessions.map((session) => (
          <InputSessionCard key={session.id} session={session} />
        ))}
        {sessions.length === 0 && (
          <EmptyState message="No inputs yet. Start by adding context to your pillars." />
        )}
      </div>
    </div>
  );
}
```

**InputSessionCard Component:**

```typescript
// app/clarity-canvas/archive/InputSessionCard.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Mic, FileText, Upload } from 'lucide-react';
import { GOLD, TEXT_PRIMARY, TEXT_MUTED, BG_SURFACE } from '@/components/portal/design-tokens';

const INPUT_TYPE_ICONS = {
  VOICE_TRANSCRIPT: Mic,
  TEXT_INPUT: FileText,
  FILE_UPLOAD: Upload,
};

const INPUT_TYPE_LABELS = {
  VOICE_TRANSCRIPT: 'Voice transcript',
  TEXT_INPUT: 'Text input',
  FILE_UPLOAD: 'File upload',
};

export function InputSessionCard({ session }: { session: InputSession }) {
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
            <span className="text-xs font-mono uppercase" style={{ color: GOLD }}>
              {INPUT_TYPE_LABELS[session.inputType]}
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
          {expanded
            ? session.rawContent
            : truncate(session.rawContent, 200)}
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

#### Pillar Header Badge

Add to `/clarity-canvas/[pillar]/PillarPageClient.tsx`:

```typescript
// New component: PillarSourceBadge
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

// Usage in pillar page header
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-display" style={{ color: TEXT_PRIMARY }}>
    {pillar.name}
  </h1>
  <PillarSourceBadge
    pillarKey={pillar.key}
    count={inputSessionCount}
  />
</div>
```

#### Field Citation Component

```typescript
// components/clarity-canvas/FieldCitation.tsx
'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { GOLD, TEXT_MUTED, BG_ELEVATED } from '@/components/portal/design-tokens';

interface FieldCitationProps {
  fieldId: string;
  sourceCount: number;
}

export function FieldCitation({ fieldId, sourceCount }: FieldCitationProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [sources, setSources] = useState<FieldSource[] | null>(null);

  async function loadSources() {
    if (sources) return;
    const res = await fetch(`/api/clarity-canvas/fields/${fieldId}/sources`);
    const data = await res.json();
    setSources(data.sources);
  }

  if (sourceCount === 0) return null;

  return (
    <div className="relative inline-block">
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

      {showPopover && sources && (
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
          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: TEXT_MUTED,
                  }}>
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
        </div>
      )}
    </div>
  );
}
```

#### Central Command Raw Input Tab

Add to `ClientDetailModal.tsx`:

```typescript
// New tab in ClientDetailModal
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
    setSessions(data.sessions);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Section title="Raw Input History" />
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
        <div className="text-center py-8">
          <p style={{ color: TEXT_MUTED }}>No input sessions recorded.</p>
          {prospect.rawInputText && (
            <div className="mt-4 text-left">
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
            <InputSessionCard key={session.id} session={session} />
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

#### Trust Messaging Components

**Onboarding Card:**

```typescript
// components/clarity-canvas/InputPreservationCard.tsx
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
          <Archive size={20} style={{ color: GOLD }} className="mt-0.5" />
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
          className="hover:opacity-60"
          style={{ color: TEXT_MUTED }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
```

**Auto-save Indicator:**

```typescript
// components/clarity-canvas/AutoSaveIndicator.tsx
'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { GREEN, TEXT_MUTED } from '@/components/portal/design-tokens';

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
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg animate-fade-in"
      style={{
        background: 'rgba(74, 222, 128, 0.1)',
        border: `1px solid ${GREEN}`,
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

### 5. File Structure

```
app/
├── clarity-canvas/
│   ├── archive/
│   │   ├── page.tsx                    # Server component
│   │   ├── ArchiveClient.tsx           # Client component
│   │   ├── InputSessionCard.tsx        # Session card component
│   │   └── FilterBar.tsx               # Filter controls
│   └── [pillar]/
│       └── PillarPageClient.tsx        # Modified: add source badge
│
├── api/
│   ├── clarity-canvas/
│   │   ├── sessions/
│   │   │   ├── route.ts                # GET: list sessions
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET: session detail
│   │   └── fields/
│   │       └── [id]/
│   │           └── sources/
│   │               └── route.ts        # GET: field sources
│   │
│   └── central-command/
│       └── prospects/
│           └── [id]/
│               └── sessions/
│                   └── route.ts        # GET/POST: prospect sessions

components/
├── clarity-canvas/
│   ├── FieldCitation.tsx               # Field source popover
│   ├── InputPreservationCard.tsx       # Onboarding card
│   └── AutoSaveIndicator.tsx           # Save confirmation

lib/
└── input-session/
    ├── types.ts                        # TypeScript interfaces
    └── utils.ts                        # Helper functions
```

### 6. Data Flow Diagrams

#### Clarity Canvas Input Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER PROVIDES INPUT                         │
│                    (Voice/Text/File Upload)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   /api/clarity-canvas/extract                    │
│                                                                  │
│  • Transcribe voice (if applicable)                             │
│  • Extract text from file (if applicable)                       │
│  • Run GPT extraction → chunks mapped to fields                 │
│  • Return recommendations for user review                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER REVIEWS & APPROVES                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   /api/clarity-canvas/commit                     │
│                                                                  │
│  1. Create InputSession record                                  │
│     - rawContent = original input                               │
│     - inputType = VOICE_TRANSCRIPT | TEXT_INPUT | FILE_UPLOAD   │
│     - sourceContext = pillar key                                │
│                                                                  │
│  2. For each approved recommendation:                           │
│     - Create FieldSource with inputSessionId                    │
│     - Update ProfileField summary + fullContext                 │
│                                                                  │
│  3. Update InputSession.fieldsPopulated count                   │
│                                                                  │
│  4. Show AutoSaveIndicator                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA AVAILABLE IN:                            │
│                                                                  │
│  • /clarity-canvas/archive (session list)                       │
│  • /clarity-canvas/[pillar] (source badges, field citations)    │
│  • /api/clarity-canvas/sessions (API)                           │
│  • /api/clarity-canvas/fields/[id]/sources (API)                │
└─────────────────────────────────────────────────────────────────┘
```

#### Central Command Input Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PASTES TEXT DUMP                         │
│              (Meeting notes, call transcript, etc.)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                /api/central-command/extract                      │
│                                                                  │
│  • Two-pass GPT extraction                                      │
│  • Generate synthesis sections                                  │
│  • Extract scores with evidence                                 │
│  • Return structured recommendations                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER REVIEWS & CREATES                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               /api/central-command/prospects (POST)              │
│                                                                  │
│  1. Create PipelineClient                                       │
│     - rawInputText = original text dump                         │
│     - enrichmentFindings = synthesis sections                   │
│                                                                  │
│  2. Create InputSession record                                  │
│     - rawContent = rawInputText                                 │
│     - inputType = TEXT_INPUT                                    │
│     - sourceContext = 'prospect-intake'                         │
│                                                                  │
│  3. Create PipelineRecord with scores                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER ADDS FOLLOW-UP                           │
│            (Optional: additional meeting notes, etc.)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          /api/central-command/prospects/[id]/sessions (POST)     │
│                                                                  │
│  • Create additional InputSession                               │
│  • Link to existing prospect                                    │
│  • Optional: trigger re-extraction                              │
└─────────────────────────────────────────────────────────────────┘
```

## User Experience

### Clarity Canvas

1. **After committing input:** Auto-save indicator appears briefly ("Saved")
2. **On pillar page:** Badge shows "X raw inputs" in header, linking to filtered archive
3. **On field hover/click:** Source citation popover shows original content + timestamp
4. **On archive page:** Full history with filters, expandable cards, linked field details

### Central Command

1. **After creating prospect:** Confirmation that input was saved
2. **In detail modal:** New "Raw Input" tab shows complete history
3. **Add context button:** Opens modal to paste additional meeting notes
4. **Synthesis sections:** Optional "View source" links to highlight relevant portions

### Trust Messaging

1. **First visit:** Onboarding card explains data preservation, dismissable
2. **After each save:** Subtle "Saved" indicator confirms persistence
3. **In settings:** Data & Privacy section explains retention policy

## Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/input-session/utils.test.ts

describe('generateSessionTitle', () => {
  it('returns single pillar name when one section', () => {
    const recs = [{ targetSection: 'individual' }];
    expect(generateSessionTitle(recs)).toBe('Individual context');
  });

  it('returns count when multiple sections', () => {
    const recs = [
      { targetSection: 'individual' },
      { targetSection: 'organization' },
    ];
    expect(generateSessionTitle(recs)).toBe('Context for 2 pillars');
  });
});

describe('truncate', () => {
  it('truncates long text with ellipsis', () => {
    const text = 'a'.repeat(300);
    expect(truncate(text, 200)).toBe('a'.repeat(200) + '...');
  });

  it('returns short text unchanged', () => {
    expect(truncate('short', 200)).toBe('short');
  });
});
```

### Integration Tests

```typescript
// __tests__/api/clarity-canvas/sessions.test.ts

describe('GET /api/clarity-canvas/sessions', () => {
  it('returns empty array for new user', async () => {
    const res = await GET(mockRequest());
    const data = await res.json();
    expect(data.sessions).toEqual([]);
  });

  it('returns sessions ordered by capturedAt desc', async () => {
    // Create test sessions
    await createTestSession({ capturedAt: new Date('2026-01-01') });
    await createTestSession({ capturedAt: new Date('2026-02-01') });

    const res = await GET(mockRequest());
    const data = await res.json();

    expect(data.sessions[0].capturedAt).toBe('2026-02-01');
    expect(data.sessions[1].capturedAt).toBe('2026-01-01');
  });

  it('filters by inputType when provided', async () => {
    await createTestSession({ inputType: 'VOICE_TRANSCRIPT' });
    await createTestSession({ inputType: 'TEXT_INPUT' });

    const res = await GET(mockRequest({ inputType: 'VOICE_TRANSCRIPT' }));
    const data = await res.json();

    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].inputType).toBe('VOICE_TRANSCRIPT');
  });
});
```

### E2E Tests

```typescript
// e2e/clarity-canvas-archive.spec.ts

test.describe('Clarity Canvas Archive', () => {
  test('shows empty state for new user', async ({ page }) => {
    await page.goto('/clarity-canvas/archive');
    await expect(page.getByText('No inputs yet')).toBeVisible();
  });

  test('displays input session after commit', async ({ page }) => {
    // Create input via pillar page
    await page.goto('/clarity-canvas/individual');
    await page.getByRole('button', { name: 'Add context' }).click();
    await page.fill('textarea', 'Test input content');
    await page.getByRole('button', { name: 'Extract' }).click();
    await page.getByRole('button', { name: 'Approve all' }).click();

    // Navigate to archive
    await page.goto('/clarity-canvas/archive');
    await expect(page.getByText('Test input content')).toBeVisible();
  });

  test('filters by input type', async ({ page }) => {
    await page.goto('/clarity-canvas/archive');
    await page.getByRole('combobox', { name: 'Filter by type' }).click();
    await page.getByRole('option', { name: 'Voice transcript' }).click();

    // Verify filter applied
    await expect(page.url()).toContain('inputType=VOICE_TRANSCRIPT');
  });
});
```

## Performance Considerations

### Database Indexes

The schema includes indexes on:
- `[clarityProfileId, capturedAt]` — Fast profile session queries
- `[pipelineClientId, capturedAt]` — Fast prospect session queries
- `[sourceModule, capturedAt]` — Cross-module analytics
- `[inputSessionId]` on FieldSource — Fast session→fields lookup

### Query Optimization

- Archive page uses cursor-based pagination (load 20 sessions at a time)
- Field citations lazy-load sources on click (not on page load)
- Session cards show truncated content by default

### Bundle Size

- Archive page is a separate route (code-split)
- Components use dynamic imports where appropriate
- No new external libraries added

## Security Considerations

### Authorization

- All session endpoints verify user ownership via session email
- Central Command endpoints verify iron-session auth
- FieldSource queries validate field belongs to user's profile

### Data Access

- Users can only see their own input sessions
- No cross-user data leakage possible
- Cascading deletes ensure cleanup when profile/prospect deleted

### Input Validation

- rawContent stored as-is (no XSS risk in server storage)
- Display uses React's built-in escaping
- API endpoints validate required fields with Zod

## Documentation

### Updates Required

1. **CLAUDE.md** — Add InputSession model to database section
2. **Developer guide** — Create `docs/developer-guides/raw-input-archive-guide.md`
3. **API reference** — Document new endpoints

### New Documentation

```markdown
# Raw Input Archive Developer Guide

## Overview
The Raw Input Archive tracks all user inputs across Clarity Canvas and Central Command...

## Database Models
- InputSession: Complete raw input with metadata
- FieldSource: Now links to InputSession via inputSessionId

## API Endpoints
...

## UI Components
...
```

## Implementation Phases

### Phase 1: Database & Core API
- Add InputSession model to Prisma schema
- Add inputSessionId to FieldSource
- Add relations to ClarityProfile and PipelineClient
- Run migration
- Create session API routes for both modules

### Phase 2: Capture Integration
- Modify /api/clarity-canvas/commit to create InputSession
- Link FieldSource records to their InputSession
- Modify /api/central-command/prospects POST to create InputSession
- Add fieldsPopulated count tracking
- Add extractionSummary generation

### Phase 3: Clarity Canvas UI
- Create /clarity-canvas/archive page
- Build InputSessionCard component
- Add pillar header badge
- Add subsection source indicators
- Add field-level citation links
- Build SourcePreview popover

### Phase 4: Central Command UI
- Add "Raw Input" tab to ClientDetailModal
- Style raw input display
- Add "Add Context" button and modal
- Add synthesis section citations
- Add intake confirmation messaging

### Phase 5: Trust Messaging
- Build InputPreservationCard (onboarding)
- Add AutoSaveIndicator
- Create settings/data-privacy section
- Testing and polish

### Future Phases
- **Phase 6:** Full-text search across all inputs
- **Phase 7:** Export/download functionality
- **Phase 8:** Apply patterns to Persona Sharpener module

## Open Questions

1. **Retention policy** — How long do we keep raw inputs? Forever, or time-limited?
   - *Recommendation:* Forever, with future export option for data portability

2. **Deletion behavior** — If a prospect/profile is deleted, should raw inputs be preserved?
   - *Recommendation:* Cascade delete (inputs deleted with parent)

3. **Admin access** — Should 33 Strategies team have visibility into client raw inputs?
   - *Recommendation:* No by default; add opt-in support access later

4. **Archive navigation** — Should archive be in main nav or nested?
   - *Recommendation:* Link in pillar pages + profile dropdown, not main nav

## References

- [Ideation Document](/docs/ideation/clarity-canvas-user-files-archive.md)
- [Clarity Canvas Handoff](/docs/clarity-canvas/clarity-canvas-handoff.md)
- [Central Command Scoring Guide](/docs/developer-guides/central-command-scoring-guide.md)
- [Design System](/docs/.claude/skills/33-strategies-frontend-design.md)
