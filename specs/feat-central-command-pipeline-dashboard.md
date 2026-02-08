# Central Command Pipeline Dashboard

**Status:** Draft
**Authors:** Claude Code
**Date:** 2026-02-01
**Related:**
- Ideation: `docs/ideation/mission-control-pipeline-dashboard.md`
- Handoff: `docs/reference/mission-control-pipeline-dashboard-handoff/`
- Pattern: `docs/clarity-canvas/braindump-to-rcommendations.md`
- Pattern: `docs/clarity-canvas/prompt-based-text-iteration.md`

---

## Overview

Central Command is a fully functional internal admin dashboard at `/central-command` on 33strategies.ai. It gives the 33 Strategies team (Emily & Beems) real-time visibility into the sales pipeline, AI-powered prospect intake from text dumps, prompt-based field editing with version history, and team capacity management. All data is persisted in PostgreSQL via Prisma, with AI extraction powered by the Vercel AI SDK.

---

## Background / Problem Statement

33 Strategies currently lacks a centralized view of its sales pipeline. Prospect information lives across scattered notes, Slack messages, and meeting transcripts. There is no structured way to:

1. Track prospects through the 8-stage sales funnel (Lead → Kickoff)
2. Extract structured client data from unstructured text (call notes, meeting transcripts)
3. Edit and refine prospect records with AI assistance
4. Visualize team capacity and allocation
5. Track closed/lost deals with lessons learned

The handoff package at `docs/reference/mission-control-pipeline-dashboard-handoff/` provides the UI/UX design and data model. This spec defines the full implementation with real database persistence, AI extraction, and inline editing.

---

## Goals

- Password-protected internal dashboard at `/central-command` using iron-session
- 3 new Prisma models for pipeline data (PipelineClient with enrichment fields, PipelineRecord with stage history JSON, TeamCapacity)
- Text dump intake (up to 20k chars) → AI extraction → structured recommendation review → commit to database
- Every record field editable via direct edit or prompt-based refinement with version history
- 5 dashboard sections: New Client Intake, Intent → Money Pipeline, Top of Funnel, Closed/Lost Deals, Team Capacity
- 8 API routes for auth, extraction, refinement, and full CRUD
- ~11 decomposed UI components using canonical design tokens from `components/portal/design-tokens.ts`

---

## Non-Goals

- External integrations (Granola, Slack, email, Clarity Canvas import)
- Real-time Supabase subscriptions / WebSocket updates
- Mobile-optimized layout (desktop-first internal tool)
- Role-based access control (single shared password, 2 users)
- Voice input for text dumps
- Subdomain deployment (stays on main app as `/central-command`)

---

## Technical Dependencies

| Dependency | Version | Purpose | Status |
|-----------|---------|---------|--------|
| `next` | ^14.2.35 | App Router, Server Components, API routes | Existing |
| `react` | ^18.2.0 | UI components | Existing |
| `ai` | ^6.0.6 | Vercel AI SDK — `generateObject` for structured extraction | Existing |
| `@ai-sdk/openai` | ^3.0.2 | OpenAI provider for AI SDK | Existing |
| `iron-session` | ^8.0.0 | Password-based auth via encrypted cookies | Existing |
| `@prisma/client` | ^6.19.1 | Database ORM | Existing |
| `prisma` | ^6.19.1 | Schema management, migrations | Existing |
| `zod` | ^4.3.5 | Schema validation for AI extraction + API input | Existing |
| `framer-motion` | ^11.0.0 | Animation for recommendations, modals | Existing |

No new dependencies required.

---

## Detailed Design

### 1. File Structure

```
app/
├── central-command/
│   ├── page.tsx                          # Server Component: auth + data fetch
│   ├── CentralCommandClient.tsx          # Main client component
│   └── components/
│       ├── DashboardHeader.tsx           # Logo, pipeline value, user
│       ├── IntakeModal.tsx               # Text dump → extract → review → create
│       ├── PipelineTable.tsx             # Intent → Money pipeline
│       ├── FunnelTable.tsx               # Top of Funnel prospects
│       ├── ClosedDeals.tsx               # Expandable closed/lost section
│       ├── TeamCapacity.tsx              # Team capacity grid
│       ├── ClientDetailModal.tsx         # Prospect detail with inline editing
│       ├── RecommendationReview.tsx      # Approve/reject/refine extracted recommendations
│       ├── EditableField.tsx             # Reusable: inline edit + prompt refine + versions
│       └── StageDots.tsx                 # 8-stage visual progression
│       # Note: ConfidenceBadge, Stoplight, ProgressBar, CapacityCard are inlined
│       # into their parent components (FunnelTable, TeamCapacity) as they are trivial
│
├── api/central-command/
│   ├── auth/route.ts                     # POST: password auth
│   ├── extract/route.ts                  # POST: AI extraction from text dump
│   ├── refine/route.ts                   # POST: prompt-based field refinement
│   ├── prospects/route.ts                # GET: list all (+ team), POST: create new
│   ├── prospects/[id]/route.ts           # GET: detail, PATCH: update fields + stage + close
│   ├── team/route.ts                     # GET: list team capacity
│   └── team/[id]/route.ts               # PATCH: update allocations
│
lib/
├── central-command/
│   ├── types.ts                          # TypeScript interfaces (adapted from handoff)
│   ├── schemas.ts                        # Zod schemas for extraction + API validation
│   ├── prompts.ts                        # System prompts for extraction + refinement
│   ├── queries.ts                        # Prisma query functions
│   └── utils.ts                          # Priority calculation, formatting helpers
```

### 2. Database Schema (Prisma)

Add to `prisma/schema.prisma`:

```prisma
// ============================================================================
// CENTRAL COMMAND — Pipeline Management
// ============================================================================

model PipelineClient {
  id       String @id @default(cuid())

  // Company info
  name     String
  industry String?
  color    String  @default("#D4A84B")
  website  String?

  // Primary contact
  contactName     String?
  contactRole     String?
  contactEmail    String?
  contactPhone    String?
  contactLinkedin String?

  // Additional contacts (JSON array)
  additionalContacts Json? // [{ name, role, email, phone, linkedin }]

  // Notes with version history
  notes            String? @db.Text
  notesVersions    Json?   // [{ version, content, source, createdAt }]
  notesSource      String? // 'generated' | 'manual' | 'refined'

  // AI Enrichment (merged — always fetched with client)
  enrichmentStatus   String   @default("pending") // 'pending' | 'running' | 'complete' | 'failed'
  enrichmentLastRun  DateTime?
  enrichmentConfidence Json?  // { overall, companyInfo: {score, status, notes}, contactInfo, problemFit, budget, timeline }
  enrichmentFindings   Json?  // Structured findings object
  enrichmentSuggestedActions String[] // AI-suggested next steps
  rawInputText       String?  @db.Text // Original text dump for reference

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  pipelineRecord PipelineRecord?
}

model PipelineRecord {
  id       String @id @default(cuid())
  clientId String @unique
  client   PipelineClient @relation(fields: [clientId], references: [id], onDelete: Cascade)

  // Pipeline status
  status   String @default("funnel") // 'intent' | 'funnel' | 'closed'

  // Decision tracking (funnel)
  decision       String @default("pending") // 'yes' | 'no' | 'pending'
  decisionReason String?

  // Stage tracking
  currentStage  String  @default("lead") // StageId enum values
  stageIndex    Int     @default(0)      // 0-7
  stageEnteredAt DateTime @default(now())

  // Stage history as JSON array (avoids separate table for <100 prospects)
  stageHistory Json? // [{ stage, completed, date, notes, duration, metadata: { proposalLink, documents[], signedDate, paymentMethod } }]

  // Financial
  value          Int? // Confirmed contract value (intent clients)
  potentialValue Int? // Estimated value (funnel clients)

  // Priority scores (1-10 each)
  scoreStrategic  Int @default(5)
  scoreValue      Int @default(5)
  scoreReadiness  Int @default(5)
  scoreTimeline   Int @default(5)
  scoreBandwidth  Int @default(5)

  // Funnel tracking
  discoveryComplete  Boolean @default(false)
  assessmentComplete Boolean @default(false)
  readinessPercent   Int     @default(0)  // 0-100

  // Next action with version history
  nextAction         String?
  nextActionVersions Json?
  nextActionSource   String?
  nextActionDate     DateTime?

  // Prospect metadata
  isNew        Boolean  @default(true)
  productFocus String?  // Which 33S product is best fit

  // Closed deal fields
  closedAt          DateTime?
  closedReason      String?
  closedReasonDetail String?
  lessonsLearned     String?  @db.Text
  lessonsVersions    Json?
  lessonsSource      String?
  reengageDate       DateTime?
  reengageNotes      String?  @db.Text
  reengageVersions   Json?
  reengageSource     String?

  // Intake metadata
  intakeMethod String? // 'text_dump' | 'manual'
  intakeDate   DateTime?
  portalLink   String?

  // Client status
  clientStatus String @default("active") // 'active' | 'paused' | 'at-risk'

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([currentStage])
}

model TeamCapacity {
  id          String @id @default(cuid())
  name        String
  role        String?
  color       String  @default("#3b82f6")
  utilization Int     @default(0) // 0-100 percent

  // Allocations as JSON array [{ client: string, percent: number }]
  allocations Json @default("[]")

  updatedAt DateTime @updatedAt
}
```

**Key decisions:**
- `cuid()` IDs match existing schema pattern
- `Json` for flexible nested data (contacts, allocations, confidence, metadata, stage history)
- AI enrichment fields merged into PipelineClient (always fetched together, saves a join)
- Stage history stored as JSON array on PipelineRecord (avoids separate table for <100 prospects)
- Version history fields (`*Versions`, `*Source`) on editable text fields (notes, nextAction, lessonsLearned, reengageNotes)
- `@db.Text` for long text fields (notes, lessons, raw input)
- One-to-one relationship between PipelineClient and PipelineRecord

### 3. Authentication

**Extend `lib/session.ts`:**

Add `isCentralCommand?: boolean` to `SessionData`:

```typescript
export interface SessionData {
  isLoggedIn: boolean;
  clientId?: string;
  strategistId?: string;
  userId?: string;
  userEmail?: string;
  isCentralCommand?: boolean; // NEW
}
```

**New validation helper** in `lib/session.ts`:

```typescript
export function isSessionValidForCentralCommand(session: SessionData): boolean {
  return session.isLoggedIn === true && session.isCentralCommand === true;
}
```

**Auth API** — `app/api/central-command/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions } from '@/lib/session';
import { secureCompare } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expectedPassword = process.env.CENTRAL_COMMAND_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { error: 'Central Command not configured' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!password || !secureCompare(password, expectedPassword)) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );
  session.isLoggedIn = true;
  session.isCentralCommand = true;
  await session.save();

  return NextResponse.json(
    { success: true },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
```

**Server Component auth check** — `app/central-command/page.tsx`:

```typescript
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { PasswordGate } from '@/components/portal/PasswordGate';
import CentralCommandClient from './CentralCommandClient';
import { getProspects, getTeamCapacity } from '@/lib/central-command/queries';

export default async function CentralCommandPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (!isSessionValidForCentralCommand(session)) {
    return (
      <PasswordGate
        clientId="central-command"
        clientName="Central Command"
        portalType="central-command"
      />
    );
  }

  const [prospects, team] = await Promise.all([
    getProspects(),
    getTeamCapacity(),
  ]);

  return <CentralCommandClient prospects={prospects} team={team} />;
}
```

**Extend PasswordGate** — add `'central-command'` to `portalType`:

The existing `PasswordGate` component at `components/portal/PasswordGate.tsx` needs its `portalType` union extended:

```typescript
interface PasswordGateProps {
  clientId: string;
  clientName: string;
  returnTo?: string;
  portalType?: 'client' | 'strategist' | 'central-command'; // ADD 'central-command'
}
```

And the auth endpoint routing:

```typescript
const authPath = portalType === 'strategist'
  ? 'strategist-auth'
  : portalType === 'central-command'
    ? 'central-command/auth'
    : 'client-auth';
```

Central Command auth is password-only (no email field). The PasswordGate component should conditionally hide the email field when `portalType === 'central-command'`.

### 4. AI Extraction Pipeline

**Extraction Schema** — `lib/central-command/schemas.ts`:

```typescript
import { z } from 'zod';

// Categories for pipeline extraction
const EXTRACTION_CATEGORIES = [
  'company_info',     // Company name, industry, website, size
  'contact_info',     // Names, roles, emails, phones, linkedin
  'problem_fit',      // Pain points, needs, alignment with 33S offerings
  'budget_signal',    // Budget mentions, deal value indicators
  'timeline_signal',  // Urgency, deadlines, timing context
  'strategic_fit',    // Strategic value, alignment with 33S direction
  'next_action',      // Action items, follow-ups, commitments
  'general_notes',    // Context that doesn't fit other categories
] as const;

// Single extracted recommendation
export const pipelineRecommendationSchema = z.object({
  capturedText: z.string().describe('Key phrase extracted — concise, 3-15 words'),
  category: z.enum(EXTRACTION_CATEGORIES).describe('Category this extraction belongs to'),
  targetField: z.string().describe('Specific field to populate (e.g., "contactName", "industry", "notes")'),
  suggestedValue: z.string().describe('Formatted value to insert into the target field'),
  confidence: z.number().min(0).max(1).describe('Confidence in this extraction (0-1)'),
  sourceSnippet: z.string().nullable().optional().describe('Original text that triggered this extraction'),
});

// Full extraction response
export const pipelineExtractionSchema = z.object({
  recommendations: z.array(pipelineRecommendationSchema),
  suggestedCompanyName: z.string().nullable().optional().describe('Best guess for company name'),
  suggestedIndustry: z.string().nullable().optional().describe('Best guess for industry'),
  overallSummary: z.string().describe('1-2 sentence summary of what was extracted'),
});

// Refinement response
export const refinementResponseSchema = z.object({
  refinedContent: z.string().describe('The refined text'),
  changeSummary: z.string().describe('1-sentence summary of what changed'),
});

// API request schemas
export const extractRequestSchema = z.object({
  inputText: z.string().min(1).max(20000),
  context: z.object({
    existingClientId: z.string().optional(),
    existingClientName: z.string().optional(),
  }).optional(),
});

export const refineRequestSchema = z.object({
  currentContent: z.string(),
  prompt: z.string().min(1).max(1000),
  fieldName: z.string(),
});

export const createProspectSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  color: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactLinkedin: z.string().optional(),
  notes: z.string().optional(),
  potentialValue: z.number().optional(),
  productFocus: z.string().optional(),
  rawInputText: z.string().optional(), // Original text dump
});

export const updateProspectSchema = z.object({
  // Client fields
  name: z.string().optional(),
  industry: z.string().optional(),
  color: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactLinkedin: z.string().optional(),
  notes: z.string().optional(),
  notesSource: z.string().optional(),

  // Pipeline fields
  status: z.enum(['intent', 'funnel', 'closed']).optional(),
  decision: z.enum(['yes', 'no', 'pending']).optional(),
  decisionReason: z.string().optional(),
  value: z.number().optional(),
  potentialValue: z.number().optional(),
  scoreStrategic: z.number().min(1).max(10).optional(),
  scoreValue: z.number().min(1).max(10).optional(),
  scoreReadiness: z.number().min(1).max(10).optional(),
  scoreTimeline: z.number().min(1).max(10).optional(),
  scoreBandwidth: z.number().min(1).max(10).optional(),
  discoveryComplete: z.boolean().optional(),
  assessmentComplete: z.boolean().optional(),
  readinessPercent: z.number().min(0).max(100).optional(),
  nextAction: z.string().optional(),
  nextActionSource: z.string().optional(),
  nextActionDate: z.string().optional(), // ISO date
  isNew: z.boolean().optional(),
  productFocus: z.string().optional(),
  clientStatus: z.enum(['active', 'paused', 'at-risk']).optional(),
});

// Types
export type PipelineRecommendation = z.infer<typeof pipelineRecommendationSchema>;
export type PipelineExtraction = z.infer<typeof pipelineExtractionSchema>;
export type RefinementResponse = z.infer<typeof refinementResponseSchema>;
```

**System Prompts** — `lib/central-command/prompts.ts`:

```typescript
export const PIPELINE_EXTRACTION_SYSTEM_PROMPT = `You are a sales pipeline extraction assistant for 33 Strategies, a strategy consulting firm. Your task is to extract structured prospect and client information from unstructured text (meeting notes, call transcripts, Slack messages, emails).

## Your Role
Extract ONLY information that is explicitly stated or very strongly implied. Never guess or invent details.

## Categories
- **company_info**: Company name, industry, website, company size, stage, location
- **contact_info**: Person names, titles/roles, email addresses, phone numbers, LinkedIn URLs
- **problem_fit**: Pain points, needs they described, how 33 Strategies can help, product/service fit
- **budget_signal**: Any mention of budget, pricing, deal value, funding status, willingness to pay
- **timeline_signal**: Urgency, deadlines, "we need this by", "starting next quarter", timing context
- **strategic_fit**: Why this prospect is strategically valuable (industry expansion, marquee brand, referral potential)
- **next_action**: Follow-ups, commitments made, "we'll send the proposal by Friday", action items
- **general_notes**: Important context that doesn't fit other categories

## Field Mapping
Map extractions to these target fields:
- company_info → name, industry, website
- contact_info → contactName, contactRole, contactEmail, contactPhone, contactLinkedin
- problem_fit → notes (append)
- budget_signal → potentialValue (extract number), notes (append context)
- timeline_signal → nextActionDate (extract date), notes (append context)
- strategic_fit → notes (append), scoreStrategic suggestion
- next_action → nextAction
- general_notes → notes (append)

## Extraction Rules
1. Extract multiple recommendations if input contains multiple distinct pieces of info
2. Keep capturedText concise (3-15 words)
3. suggestedValue should be the clean, formatted value ready to insert
4. For monetary values, extract as integers (e.g., 15000 not "$15K")
5. For dates, use ISO format (YYYY-MM-DD)
6. Return empty recommendations array if no extractable information
7. Preserve specific details (names, dates, numbers, URLs)
8. Clean up verbal noise (um, uh, like, so yeah) from suggestedValues

## Confidence Scoring
- 0.9-1.0: Explicitly stated, unambiguous
- 0.6-0.89: Strongly implied, high confidence
- 0.3-0.59: Moderately implied, some ambiguity
- <0.3: Don't include (too uncertain)`;

export const PIPELINE_REFINEMENT_SYSTEM_PROMPT = `You are an expert at refining sales pipeline field content for 33 Strategies, a strategy consulting firm.

Your task: Apply the user's refinement request to the current field content. Maintain any existing formatting. Be concise and professional.

Rules:
1. Apply ONLY the requested change
2. Preserve information not related to the change
3. Keep the tone professional and concise
4. Don't add information that wasn't in the original or the request
5. Return the complete refined text (not just the changed part)`;
```

**Extraction API** — `app/api/central-command/extract/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import {
  pipelineExtractionSchema,
  extractRequestSchema,
} from '@/lib/central-command/schemas';
import { PIPELINE_EXTRACTION_SYSTEM_PROMPT } from '@/lib/central-command/prompts';

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );
  if (!isSessionValidForCentralCommand(session)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Parse and validate
  const body = await request.json();
  const parseResult = extractRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { inputText, context } = parseResult.data;

  // Short-circuit trivial input
  if (inputText.trim().length < 10) {
    return NextResponse.json(
      { recommendations: [], overallSummary: 'Input too short to extract.' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Build prompt with context
  let userPrompt = `Extract pipeline information from this text:\n\n"${inputText}"`;
  if (context?.existingClientName) {
    userPrompt += `\n\nContext: This is about an existing prospect named "${context.existingClientName}". Avoid duplicating known information.`;
  }

  // Call generateObject
  const { object: extraction } = await generateObject({
    model: openai('gpt-4o'),
    schema: pipelineExtractionSchema,
    system: PIPELINE_EXTRACTION_SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  return NextResponse.json(extraction, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
```

**Refinement API** — `app/api/central-command/refine/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { refinementResponseSchema, refineRequestSchema } from '@/lib/central-command/schemas';
import { PIPELINE_REFINEMENT_SYSTEM_PROMPT } from '@/lib/central-command/prompts';

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );
  if (!isSessionValidForCentralCommand(session)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const body = await request.json();
  const parseResult = refineRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { currentContent, prompt, fieldName } = parseResult.data;

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: refinementResponseSchema,
    system: PIPELINE_REFINEMENT_SYSTEM_PROMPT,
    prompt: `Field: ${fieldName}\n\nCurrent content:\n${currentContent}\n\nRefinement request: ${prompt}`,
  });

  return NextResponse.json(object, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
```

### 5. CRUD API Routes

**List + Create** — `app/api/central-command/prospects/route.ts`:

```typescript
// GET: List all prospects with pipeline data, sorted by status then priority
// Also returns team capacity data (single fetch for dashboard)
// Returns: { intentClients, funnelClients, closedDeals, stats, team }
//
// POST: Create new prospect from approved recommendations
// Body: createProspectSchema
// Creates: PipelineClient (with enrichment fields if rawInputText provided) + PipelineRecord
// Returns: { client, record }
```

**Detail + Update** — `app/api/central-command/prospects/[id]/route.ts`:

```typescript
// GET: Single prospect with full pipeline record (includes stage history JSON, enrichment fields)
// Returns: { client (with enrichment fields), record (with stageHistory JSON) }
//
// PATCH: Update client and/or pipeline fields
// Body: updateProspectSchema — handles ALL mutations:
//   - Field updates (any client or record field)
//   - Stage advancement: { currentStage, stageIndex } — appends to stageHistory JSON
//   - Deal closure: { status: 'closed', closedAt, closedReason, ... }
// Handles version history: if field has *Versions, appends new version entry
// Returns: { client, record }
```

**Team CRUD** — `app/api/central-command/team/route.ts` + `[id]/route.ts`:

```typescript
// GET /team: List all team members with allocations
// PATCH /team/[id]: Update utilization, allocations, role, color
```

### 6. Prisma Query Functions

`lib/central-command/queries.ts`:

```typescript
import prisma from '@/lib/prisma';

export async function getProspects() {
  const clients = await prisma.pipelineClient.findMany({
    include: {
      pipelineRecord: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Partition into intent, funnel, closed
  const intentClients = clients
    .filter(c => c.pipelineRecord?.status === 'intent')
    .sort((a, b) => calculatePriority(b.pipelineRecord!) - calculatePriority(a.pipelineRecord!));

  const funnelClients = clients
    .filter(c => c.pipelineRecord?.status === 'funnel')
    .sort((a, b) => {
      // New prospects first, then by priority
      if (a.pipelineRecord?.isNew && !b.pipelineRecord?.isNew) return -1;
      if (!a.pipelineRecord?.isNew && b.pipelineRecord?.isNew) return 1;
      return calculatePriority(b.pipelineRecord!) - calculatePriority(a.pipelineRecord!);
    });

  const closedDeals = clients
    .filter(c => c.pipelineRecord?.status === 'closed');

  // Pipeline stats
  const stats = {
    intentCount: intentClients.length,
    intentValue: intentClients.reduce((sum, c) => sum + (c.pipelineRecord?.value || 0), 0),
    funnelCount: funnelClients.length,
    funnelValue: funnelClients.reduce((sum, c) => sum + (c.pipelineRecord?.potentialValue || 0), 0),
    closedCount: closedDeals.length,
  };

  return { intentClients, funnelClients, closedDeals, stats };
}

export async function getProspectDetail(id: string) {
  return prisma.pipelineClient.findUnique({
    where: { id },
    include: {
      pipelineRecord: true,
    },
  });
  // Note: stageHistory is a JSON field on PipelineRecord, not a relation
  // Enrichment fields are directly on PipelineClient
}

export async function getTeamCapacity() {
  return prisma.teamCapacity.findMany({
    orderBy: { name: 'asc' },
  });
}

function calculatePriority(record: { scoreStrategic: number; scoreValue: number; scoreReadiness: number; scoreTimeline: number; scoreBandwidth: number }) {
  return (
    record.scoreStrategic * 0.2 +
    record.scoreValue * 0.2 +
    record.scoreReadiness * 0.2 +
    record.scoreTimeline * 0.2 +
    record.scoreBandwidth * 0.2
  );
}
```

### 7. Version History Utility

`lib/central-command/utils.ts`:

```typescript
export interface Version {
  version: number;
  content: string;
  source: 'generated' | 'manual' | 'refined';
  createdAt: string;
}

export function addVersion(
  existing: Version[] | null,
  content: string,
  source: Version['source']
): Version[] {
  const versions = existing || [];
  return [
    ...versions,
    {
      version: versions.length + 1,
      content,
      source,
      createdAt: new Date().toISOString(),
    },
  ].slice(-10); // Cap at 10 versions
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K';
  }
  return '$' + amount;
}

export const STAGES = [
  { id: 'lead', name: 'Lead', short: 'LD' },
  { id: 'discovery', name: 'Discovery', short: 'DS' },
  { id: 'assessment', name: 'Assessment', short: 'AS' },
  { id: 'proposal', name: 'Proposal', short: 'PR' },
  { id: 'negotiation', name: 'Negotiation', short: 'NG' },
  { id: 'contract', name: 'Contract', short: 'CT' },
  { id: 'payment', name: 'Payment', short: 'PY' },
  { id: 'kickoff', name: 'Kickoff', short: 'KO' },
] as const;

export type StageId = (typeof STAGES)[number]['id'];
```

### 8. Key UI Components

**EditableField** — The core reusable component implementing the prompt-based text iteration pattern:

```
┌─────────────────────────────────────────────────────────┐
│ FIELD LABEL                                    [✏️] [🤖]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Current field value displayed here as text.            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Refine: [Make it more specific about B2B focus  ] [⏎]  │ ← Always visible
├─────────────────────────────────────────────────────────┤
│ v1(AI) v2(R) ●v3(M)                                    │ ← Version pills
└─────────────────────────────────────────────────────────┘
```

States:
- **VIEW** — Shows current content with refine input below
- **EDIT** — Textarea for direct manual editing
- **REFINING** — Loading state while AI processes refinement
- **HISTORY** — Shows version history pills, click to restore

**IntakeModal** — 2-step flow (simplified from handoff's 3-step):

```
Step 1: Text Input
┌─────────────────────────────────────────────────────────┐
│ NEW PROSPECT — Paste Notes                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [                                                   ]  │
│  [  Paste meeting notes, call transcript, or any     ]  │
│  [  text about this prospect here...                 ]  │
│  [                                                   ]  │
│  [                                            0/20K  ]  │
│                                                         │
│                              [Cancel]  [Extract →]      │
└─────────────────────────────────────────────────────────┘

Step 2: Review Recommendations
┌─────────────────────────────────────────────────────────┐
│ REVIEW EXTRACTION — 12 recommendations                  │
├─────────────────────────────────────────────────────────┤
│ Company: "Acme Corp" (0.95)              [✓] [✗] [🤖]  │
│ Contact: "Jane Doe, CTO" (0.90)         [✓] [✗] [🤖]  │
│ Budget: "$50K range" (0.65)             [✓] [✗] [🤖]  │
│ Problem: "Need better analytics..." (0.85) [✓] [✗] [🤖]│
│ ...                                                     │
├─────────────────────────────────────────────────────────┤
│ Overall: Meeting about analytics product interest       │
│                                                         │
│                    [← Back]  [Approve Selected → Add]   │
└─────────────────────────────────────────────────────────┘
```

**ClientDetailModal** — Full prospect view with inline editing:

```
┌─────────────────────────────────────────────────────────┐
│ ACME CORP — Technology                    [×]           │
├─────────────────────────────────────────────────────────┤
│ Stage: ● ● ● ○ ○ ○ ○ ○  (Proposal)    [Advance →]    │
│ Priority: 7.4    Days in Stage: 12                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ CONTACT                                                 │
│ ┌─ Name: Jane Doe                           [✏️] [🤖] ┐│
│ │  Role: CTO                                [✏️] [🤖] ││
│ │  Email: jane@acme.com                     [✏️] [🤖] ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ SCORES                                                  │
│ Strategic: [7] Value: [8] Ready: [6] Time: [7] BW: [8] │
│                                                         │
│ NOTES                                                   │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Met at conference, interested in analytics product.  ││
│ │ Has budget approval for Q2.                          ││
│ ├──────────────────────────────────────────────────────┤│
│ │ Refine: [                                     ] [⏎] ││
│ │ v1(AI) ●v2(R)                                       ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ENRICHMENT — Confidence: HIGH                           │
│ Company: 92%  Contact: 85%  Problem: 78%  Budget: 65%  │
│                                                         │
│ [Add Text Dump]  [Close Deal]                           │
└─────────────────────────────────────────────────────────┘
```

### 9. Dashboard Layout

The main `CentralCommandClient.tsx` renders 5 sections in order:

```
┌─────────────────────────────────────────────────────────┐
│ CENTRAL COMMAND          Total Pipeline: $285K   Emily  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 0 ─ NEW CLIENT INTAKE                        [+ New]   │
│                                                         │
│ 1 ─ INTENT → MONEY                                     │
│ ┌───────┬──────────┬───────┬──────┬─────┬──────┬──────┐│
│ │Client │ Stage    │ Value │Score │Days │Next  │Status ││
│ ├───────┼──────────┼───────┼──────┼─────┼──────┼──────┤│
│ │Trade… │●●●●○○○○  │ $50K │ 7.4 │ 12  │Send… │active ││
│ │PLYA   │●●●●●●○○  │ $35K │ 8.2 │ 3   │Sign… │active ││
│ └───────┴──────────┴───────┴──────┴─────┴──────┴──────┘│
│                                                         │
│ 2 ─ TOP OF FUNNEL                                      │
│ ┌───────┬──────┬──────┬────────┬────────┬──────┬──────┐│
│ │Client │Disc. │Asmt. │Ready % │Decision│Conf. │Value ││
│ ├───────┼──────┼──────┼────────┼────────┼──────┼──────┤│
│ │★ New… │ —    │ —    │████ 0% │pending │ Med  │ $20K ││
│ │Exist… │ ✓    │ ✓    │████ 75%│  yes   │ High │ $40K ││
│ └───────┴──────┴──────┴────────┴────────┴──────┴──────┘│
│                                                         │
│ 3 ─ CLOSED / LOST                   [Show Details ▼]   │
│                                                         │
│ 4 ─ TEAM CAPACITY                                      │
│ ┌────────────┬────────────┬────────────┬──────────────┐ │
│ │ Emily      │ Beems      │ Sherril    │ Contractor   │ │
│ │ 85% used   │ 72% used   │ 45% used  │ 30% used     │ │
│ │ ████████░░ │ ███████░░░ │ ████░░░░░ │ ███░░░░░░░  │ │
│ └────────────┴────────────┴────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 10. Design System Compliance

All components import from `components/portal/design-tokens.ts`:

```typescript
import {
  GOLD, GOLD_DIM,
  GREEN, GREEN_DIM,
  BLUE, BLUE_DIM,
  RED, RED_DIM,
  BG_PRIMARY, BG_SURFACE, BG_ELEVATED,
} from '@/components/portal/design-tokens';
```

**Color mapping from handoff → canonical:**
| Handoff | Canonical | Usage |
|---------|-----------|-------|
| `#111111` | `BG_SURFACE (#111114)` | Cards/containers |
| `#1a1a1a` | `BG_ELEVATED (#0d0d14)` | Elevated surfaces |
| `#fafafa` | `TEXT_PRIMARY (#f5f5f5)` | Headlines |
| `#D4A84B` | `GOLD (#d4a54a)` | Primary accent |
| `#4ADE80` | `GREEN (#4ade80)` | Success (exact match) |
| `#ef4444` | `RED (#f87171)` | Warnings |

Typography uses existing font classes: `font-display` (Instrument Serif), `font-body` (DM Sans), `font-mono` (JetBrains Mono).

---

## User Experience

### Entry Point
Navigate to `33strategies.ai/central-command` → password gate → dashboard.

### Core Flows

1. **Add New Prospect**: Click [+ New] → paste text dump → review AI-extracted recommendations → approve/reject/refine → prospect appears in Funnel table
2. **View Prospect Detail**: Click any row → modal with full detail → edit any field inline or via prompt
3. **Advance Stage**: In detail modal → click [Advance →] → select stage → add notes → stage history updated
4. **Close Deal**: In detail modal → click [Close Deal] → enter reason, lessons learned → moves to Closed section
5. **Edit Team Capacity**: Click team member card → edit allocations, utilization directly
6. **Refine Any Field**: Below any editable field → type refinement prompt → AI applies edit → approve → version saved

### Keyboard & Interaction Patterns
- Click outside modal to dismiss
- ✕ button in top-right of modals
- Escape key closes modals
- Tab navigation through form fields
- Enter submits refinement prompts

---

## Testing Strategy

### Unit Tests
- `lib/central-command/utils.ts` — `calculatePriority()`, `formatCurrency()`, `addVersion()`
- `lib/central-command/schemas.ts` — Zod schema validation (valid + invalid inputs)
- Version history accumulation (cap at 10, correct source tagging)

### Integration Tests
- Auth flow: password → session → protected route
- Extraction API: text input → structured output (mock OpenAI)
- Refinement API: current content + prompt → refined output (mock OpenAI)
- CRUD operations: create prospect → read → update → close
- Stage advancement: change stage → verify history entry created
- Version history: edit field → verify version appended

### E2E Tests (Playwright)
- Full intake flow: login → paste text → review recommendations → create prospect → verify in table
- Field editing: click field → type new value → save → verify displayed
- Prompt refinement: click refine → type prompt → verify refined content
- Stage advancement: click advance → select stage → verify stage dots updated
- Close deal: click close → enter reason → verify in closed section

### Mocking Strategy
- Mock `generateObject` from `ai` package for all AI-dependent tests
- Use Prisma's `$transaction` for test isolation
- Factory functions for creating test prospects with known data

---

## Performance Considerations

- **Server Component data fetching**: All prospect data loaded server-side via Prisma, passed as props — no client-side fetching on initial load
- **AI extraction**: gpt-4o calls take 2-5 seconds — show loading spinner with progress indication
- **AI refinement**: gpt-4o-mini calls take 0.5-1.5 seconds — inline loading state
- **Prisma queries**: Include relations in single query (no N+1). Use `@@index` on frequently filtered columns
- **Client-side state**: React state for modal open/close, active tab, form inputs. No global state store needed for 2 users
- **Bundle size**: All Central Command components are in a separate route — only loaded when accessing `/central-command`. No impact on other routes

---

## Security Considerations

- **Authentication**: Password-based via iron-session (encrypted, httpOnly, sameSite cookies). Same pattern as existing portals
- **Authorization**: Every API route checks `isSessionValidForCentralCommand()` before processing
- **Input validation**: All API inputs validated with Zod schemas before processing
- **AI prompt injection**: User text is passed as quoted content within structured prompts, not as system instructions. `generateObject` with schema validation prevents injection from affecting output structure
- **Password storage**: `CENTRAL_COMMAND_PASSWORD` in environment variable, compared with `secureCompare()` (constant-time) to prevent timing attacks
- **No PII exposure**: This is an internal tool behind auth. Prospect data (names, emails) is only accessible to authenticated users
- **Cache headers**: All API responses include `Cache-Control: no-store` to prevent caching of sensitive data

---

## Documentation

- Update `CLAUDE.md` — Add Central Command section with route, models, API reference
- Update `lib/session.ts` inline comments — Document `isCentralCommand` field
- No external documentation needed (internal tool, 2 users)

---

## Implementation Phases

### Phase 1: Foundation (Database + Auth + Data Layer)

1. Add 3 Prisma models (PipelineClient, PipelineRecord, TeamCapacity) to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add-central-command`
3. Extend `SessionData` in `lib/session.ts` with `isCentralCommand`
4. Add `isSessionValidForCentralCommand()` helper
5. Create `app/api/central-command/auth/route.ts`
6. Extend `PasswordGate` with `'central-command'` portal type
7. Create `lib/central-command/types.ts`, `utils.ts`, `schemas.ts`, `prompts.ts`, `queries.ts`

### Phase 2: Dashboard UI (Tables + Layout)

8. Create `app/central-command/page.tsx` (Server Component with auth)
9. Create `CentralCommandClient.tsx` with basic layout
10. Create `DashboardHeader.tsx`
11. Create `StageDots.tsx`
12. Create `PipelineTable.tsx` (Intent → Money, with inlined confidence/stoplight/progress indicators)
13. Create `FunnelTable.tsx` (Top of Funnel, with inlined confidence/stoplight/progress indicators)
14. Create `ClosedDeals.tsx`
15. Create `TeamCapacity.tsx` (with inlined CapacityCard rendering)

### Phase 3: API Routes + CRUD

16. Create `app/api/central-command/prospects/route.ts` (GET: list all + team data, POST: create)
17. Create `app/api/central-command/prospects/[id]/route.ts` (GET: detail, PATCH: update + stage + close)
18. Create `app/api/central-command/team/route.ts` (GET: list)
19. Create `app/api/central-command/team/[id]/route.ts` (PATCH: update)

### Phase 4: AI Extraction + Intake Flow

20. Create `app/api/central-command/extract/route.ts`
21. Create `IntakeModal.tsx` (text input step)
22. Create `RecommendationReview.tsx` (review/approve/reject step)
23. Wire intake flow: text → extract API → review → create prospect API

### Phase 5: Inline Editing + Refinement

24. Create `app/api/central-command/refine/route.ts`
25. Create `EditableField.tsx` (direct edit + prompt refine + version history)
26. Create `ClientDetailModal.tsx` (full prospect detail with EditableField instances)
27. Wire version history: edit → append version → persist → display pills
28. Add "Add Text Dump" button in ClientDetailModal for enriching existing prospects

### Phase 6: Polish + Integration

29. Add pipeline stats to DashboardHeader (total value, counts)
30. Seed initial team capacity records (Emily, Beems, Sherril)
31. Test full flows end-to-end
32. Update CLAUDE.md with Central Command documentation

---

## Open Questions

None — all decisions resolved in ideation document. See `docs/ideation/mission-control-pipeline-dashboard.md` for the full decision log.

---

## References

- Ideation doc: `docs/ideation/mission-control-pipeline-dashboard.md`
- Handoff UI: `docs/reference/mission-control-pipeline-dashboard-handoff/`
- Handoff types: `docs/reference/mission-control-pipeline-dashboard-handoff/components/types.ts`
- Handoff schema: `docs/reference/mission-control-pipeline-dashboard-handoff/api/schema.md`
- Extraction pattern: `docs/clarity-canvas/braindump-to-rcommendations.md`
- Text iteration pattern: `docs/clarity-canvas/prompt-based-text-iteration.md`
- Existing extraction code: `app/api/clarity-canvas/extract/route.ts`
- Design system: `.claude/skills/33-strategies-frontend-design.md`
- Design tokens: `components/portal/design-tokens.ts`
- Session config: `lib/session.ts`
- Auth utils: `lib/auth-utils.ts`
