# Task Breakdown: Central Command Pipeline Dashboard
Generated: 2026-02-01
Source: specs/feat-central-command-pipeline-dashboard.md

## Overview

Implement Central Command — a fully functional internal admin dashboard at `/central-command` for 33 Strategies sales pipeline management. Features: 3 Prisma models, password auth, AI extraction from text dumps, prompt-based field editing with version history, and 5 dashboard sections with ~11 UI components.

## Phase 1: Foundation (Database + Auth + Data Layer)

### Task CC-1.1: Add Prisma Models and Run Migration
**Description**: Add 3 new Prisma models (PipelineClient, PipelineRecord, TeamCapacity) and run migration
**Size**: Medium
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (must complete first)

**Implementation**:
Append to `prisma/schema.prisma`:

```prisma
// ============================================================================
// CENTRAL COMMAND — Pipeline Management
// ============================================================================

model PipelineClient {
  id       String @id @default(cuid())
  name     String
  industry String?
  color    String  @default("#D4A84B")
  website  String?
  contactName     String?
  contactRole     String?
  contactEmail    String?
  contactPhone    String?
  contactLinkedin String?
  additionalContacts Json?
  notes            String? @db.Text
  notesVersions    Json?
  notesSource      String?
  enrichmentStatus   String   @default("pending")
  enrichmentLastRun  DateTime?
  enrichmentConfidence Json?
  enrichmentFindings   Json?
  enrichmentSuggestedActions String[]
  rawInputText       String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  pipelineRecord PipelineRecord?
}

model PipelineRecord {
  id       String @id @default(cuid())
  clientId String @unique
  client   PipelineClient @relation(fields: [clientId], references: [id], onDelete: Cascade)
  status   String @default("funnel")
  decision       String @default("pending")
  decisionReason String?
  currentStage  String  @default("lead")
  stageIndex    Int     @default(0)
  stageEnteredAt DateTime @default(now())
  stageHistory Json?
  value          Int?
  potentialValue Int?
  scoreStrategic  Int @default(5)
  scoreValue      Int @default(5)
  scoreReadiness  Int @default(5)
  scoreTimeline   Int @default(5)
  scoreBandwidth  Int @default(5)
  discoveryComplete  Boolean @default(false)
  assessmentComplete Boolean @default(false)
  readinessPercent   Int     @default(0)
  nextAction         String?
  nextActionVersions Json?
  nextActionSource   String?
  nextActionDate     DateTime?
  isNew        Boolean  @default(true)
  productFocus String?
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
  intakeMethod String?
  intakeDate   DateTime?
  portalLink   String?
  clientStatus String @default("active")
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
  utilization Int     @default(0)
  allocations Json @default("[]")
  updatedAt DateTime @updatedAt
}
```

Run: `npx prisma migrate dev --name add-central-command`
Then: `npx prisma generate`

**Acceptance Criteria**:
- [ ] 3 models added to schema.prisma
- [ ] Migration runs without errors
- [ ] `npx prisma generate` succeeds
- [ ] No changes to existing models

### Task CC-1.2: Extend Session and Auth
**Description**: Add `isCentralCommand` to SessionData, create validation helper, create auth API route, extend PasswordGate
**Size**: Medium
**Priority**: High
**Dependencies**: None
**Can run parallel with**: CC-1.1

**Implementation**:

1. **Extend `lib/session.ts`** — Add to SessionData interface:
```typescript
isCentralCommand?: boolean; // Central Command admin dashboard
```

Add validation helper:
```typescript
export function isSessionValidForCentralCommand(session: SessionData): boolean {
  return session.isLoggedIn === true && session.isCentralCommand === true;
}
```

2. **Create `app/api/central-command/auth/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expectedPassword = process.env.CENTRAL_COMMAND_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { error: 'Central Command not configured' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!password || password !== expectedPassword) {
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

3. **Extend `components/portal/PasswordGate.tsx`**:
- Add `'central-command'` to portalType union
- Route to `central-command/auth` when portalType is 'central-command'
- Hide email field when portalType is 'central-command' (password-only)
- Show "Central Command" label instead of portal type
- Disable submit button based on password only (not email) for central-command

**Acceptance Criteria**:
- [ ] SessionData has isCentralCommand field
- [ ] isSessionValidForCentralCommand helper works
- [ ] Auth route validates password against CENTRAL_COMMAND_PASSWORD env var
- [ ] Auth route sets isCentralCommand=true on session
- [ ] PasswordGate hides email for central-command portalType
- [ ] PasswordGate routes to correct auth endpoint

### Task CC-1.3: Create Data Layer (Types, Utils, Schemas, Prompts, Queries)
**Description**: Create all lib/central-command/ files: types, utils, schemas, prompts, queries
**Size**: Large
**Priority**: High
**Dependencies**: CC-1.1 (needs Prisma types)
**Can run parallel with**: CC-1.2

**Implementation**:

1. **`lib/central-command/types.ts`** — TypeScript interfaces adapted from handoff:
```typescript
export type StageId = 'lead' | 'discovery' | 'assessment' | 'proposal' | 'negotiation' | 'contract' | 'payment' | 'kickoff';
export type DecisionStatus = 'yes' | 'no' | 'pending';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';
export type EnrichmentStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ClientStatus = 'active' | 'paused' | 'at-risk';
export type PipelineStatus = 'intent' | 'funnel' | 'closed';

export interface PriorityScores {
  strategic: number;
  value: number;
  readiness: number;
  timeline: number;
  bandwidth: number;
}

export interface Contact {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface StageHistoryEntry {
  stage: StageId;
  completed: boolean;
  date: string;
  notes?: string;
  duration?: string;
  metadata?: {
    proposalLink?: string;
    documents?: string[];
    signedDate?: string;
    paymentMethod?: string;
  };
}

export interface TeamAllocation {
  client: string;
  percent: number;
}

// Prisma-returned types with include
export type ProspectWithRecord = PipelineClient & {
  pipelineRecord: PipelineRecord | null;
};
```

2. **`lib/central-command/utils.ts`** — Priority calc, currency formatting, version history, stage constants:
```typescript
export interface Version {
  version: number;
  content: string;
  source: 'generated' | 'manual' | 'refined';
  createdAt: string;
}

export function addVersion(existing: Version[] | null, content: string, source: Version['source']): Version[] {
  const versions = existing || [];
  return [...versions, { version: versions.length + 1, content, source, createdAt: new Date().toISOString() }].slice(-10);
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'K';
  return '$' + amount;
}

export function calculatePriority(record: { scoreStrategic: number; scoreValue: number; scoreReadiness: number; scoreTimeline: number; scoreBandwidth: number }): number {
  return (record.scoreStrategic + record.scoreValue + record.scoreReadiness + record.scoreTimeline + record.scoreBandwidth) * 0.2;
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

3. **`lib/central-command/schemas.ts`** — Full Zod schemas (extraction, refinement, CRUD) as specified in spec section 4.

4. **`lib/central-command/prompts.ts`** — PIPELINE_EXTRACTION_SYSTEM_PROMPT and PIPELINE_REFINEMENT_SYSTEM_PROMPT as specified in spec section 4.

5. **`lib/central-command/queries.ts`** — getProspects(), getProspectDetail(), getTeamCapacity(), calculatePriority() as specified in spec section 6.

**Acceptance Criteria**:
- [ ] All 5 files created in lib/central-command/
- [ ] Types match handoff interfaces adapted for Prisma
- [ ] Zod schemas validate correctly (test with sample data)
- [ ] Queries return partitioned data (intent, funnel, closed)
- [ ] addVersion caps at 10 entries
- [ ] TypeScript compiles without errors

## Phase 2: Dashboard UI (Tables + Layout)

### Task CC-2.1: Create Page Shell and Main Client Component
**Description**: Create Server Component page.tsx with auth check and CentralCommandClient layout
**Size**: Medium
**Priority**: High
**Dependencies**: CC-1.1, CC-1.2, CC-1.3
**Can run parallel with**: None

**Implementation**:

1. **`app/central-command/page.tsx`** — Server Component:
```typescript
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import PasswordGate from '@/components/portal/PasswordGate';
import CentralCommandClient from './CentralCommandClient';
import { getProspects, getTeamCapacity } from '@/lib/central-command/queries';

export default async function CentralCommandPage() {
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
  if (!isSessionValidForCentralCommand(session)) {
    return <PasswordGate clientId="central-command" clientName="Central Command" portalType="central-command" />;
  }
  const [prospects, team] = await Promise.all([getProspects(), getTeamCapacity()]);
  return <CentralCommandClient prospects={prospects} team={team} />;
}
```

2. **`app/central-command/CentralCommandClient.tsx`** — Client Component:
- 'use client' directive
- Props: { prospects: { intentClients, funnelClients, closedDeals, stats }, team: TeamCapacity[] }
- State: selectedClient (for detail modal), showIntake (for intake modal)
- Layout: DashboardHeader → IntakeSection → PipelineTable → FunnelTable → ClosedDeals → TeamCapacity
- Full-page dark background using BG_PRIMARY
- Import design tokens from @/components/portal/design-tokens

**Acceptance Criteria**:
- [ ] Page shows PasswordGate when not authenticated
- [ ] Page fetches data server-side and passes to client component
- [ ] CentralCommandClient renders 5 sections in order
- [ ] Click row → sets selectedClient state
- [ ] TypeScript compiles

### Task CC-2.2: Create Dashboard Header and StageDots
**Description**: Build DashboardHeader with pipeline stats and StageDots component for 8-stage visualization
**Size**: Small
**Priority**: High
**Dependencies**: CC-1.3 (utils for formatCurrency)
**Can run parallel with**: CC-2.1

**Implementation**:

1. **`app/central-command/components/DashboardHeader.tsx`**:
- Shows "CENTRAL COMMAND" title (font-display)
- Total pipeline value from stats
- Section: "33 Strategies" branding element
- Gold accent styling per design tokens
- [+ New] button that calls onNewProspect callback

2. **`app/central-command/components/StageDots.tsx`**:
- Props: { currentIndex: number, totalStages?: number (default 8) }
- Renders 8 dots: filled (GOLD) for completed, hollow for remaining
- Shows current stage name below dots
- Compact inline layout for table cells

**Acceptance Criteria**:
- [ ] Header shows pipeline value using formatCurrency
- [ ] StageDots renders correct number of filled/empty dots
- [ ] Uses design tokens (GOLD, BG_SURFACE, etc.)

### Task CC-2.3: Create PipelineTable (Intent → Money)
**Description**: Build Intent pipeline table with stage dots, priority scores, and row click handler
**Size**: Large
**Priority**: High
**Dependencies**: CC-2.2 (StageDots), CC-1.3 (types, utils)
**Can run parallel with**: CC-2.4

**Implementation**:

`app/central-command/components/PipelineTable.tsx`:
- Props: { clients: ProspectWithRecord[], onSelectClient: (id: string) => void }
- Table columns: Client (name + color dot), Stage (StageDots), Value, Priority Score, Days in Stage, Next Action, Status
- Sort by priority score (highest first)
- Row click → onSelectClient(id)
- Status badges: 'active' (green), 'paused' (yellow/gold), 'at-risk' (red)
- Days in stage: calculated from stageEnteredAt
- Priority score: calculated from 5 scores × 0.2 each
- Uses design tokens for all colors
- Table layout from handoff wireframe (see spec section 9)
- Responsive: horizontal scroll on narrow screens

**Acceptance Criteria**:
- [ ] Renders all intent clients sorted by priority
- [ ] Stage dots show correct progression
- [ ] Priority score calculated correctly
- [ ] Days in stage calculated from stageEnteredAt
- [ ] Row click triggers onSelectClient
- [ ] Status badges use semantic colors

### Task CC-2.4: Create FunnelTable (Top of Funnel)
**Description**: Build Top of Funnel table with discovery/assessment checkmarks, readiness bar, decision stoplight, confidence badge
**Size**: Large
**Priority**: High
**Dependencies**: CC-1.3 (types, utils)
**Can run parallel with**: CC-2.3

**Implementation**:

`app/central-command/components/FunnelTable.tsx`:
- Props: { clients: ProspectWithRecord[], onSelectClient: (id: string) => void }
- Table columns: Client (with NEW badge if isNew), Discovery (checkmark), Assessment (checkmark), Readiness % (inline progress bar), Decision (stoplight: green/red/gold), Confidence (badge from enrichmentConfidence), Value
- New prospects (isNew=true) shown first with star/NEW badge
- Sort: new first, then by priority
- Inline components (not separate files):
  - ProgressBar: readinessPercent as colored bar (0-100)
  - Stoplight: decision status as colored dot (yes=green, no=red, pending=gold)
  - ConfidenceBadge: enrichmentConfidence.overall as text badge (High/Med/Low)
- Row click → onSelectClient(id)

**Acceptance Criteria**:
- [ ] New prospects shown first with visual indicator
- [ ] Discovery/Assessment show checkmarks when complete
- [ ] Progress bar fills proportionally to readinessPercent
- [ ] Decision stoplight shows correct color
- [ ] Confidence badge renders from enrichment data
- [ ] Row click triggers onSelectClient

### Task CC-2.5: Create ClosedDeals and TeamCapacity
**Description**: Build Closed/Lost deals section (expandable) and Team Capacity grid with inlined capacity cards
**Size**: Medium
**Priority**: High
**Dependencies**: CC-1.3 (types, utils)
**Can run parallel with**: CC-2.3, CC-2.4

**Implementation**:

1. **`app/central-command/components/ClosedDeals.tsx`**:
- Props: { deals: ProspectWithRecord[] }
- Collapsible section (collapsed by default)
- [Show Details ▼] toggle button
- Each deal shows: name, value, stage reached, close reason, lessons learned
- Click to expand individual deal details

2. **`app/central-command/components/TeamCapacity.tsx`**:
- Props: { members: TeamCapacity[], onEditMember: (id: string) => void }
- Grid layout of capacity cards (1 per team member)
- Each card (inlined, not separate component):
  - Name, role, color accent
  - Utilization bar (0-100%, colored by threshold: <50% green, 50-80% gold, >80% red)
  - Allocation breakdown (list of client: percent)
- Card click → onEditMember(id)

**Acceptance Criteria**:
- [ ] Closed deals section toggles expand/collapse
- [ ] Team capacity cards show utilization bars
- [ ] Utilization colors match thresholds
- [ ] Allocation breakdowns render from JSON

## Phase 3: API Routes + CRUD

### Task CC-3.1: Create Prospects API Routes
**Description**: Implement GET/POST for /api/central-command/prospects and GET/PATCH for /api/central-command/prospects/[id]
**Size**: Large
**Priority**: High
**Dependencies**: CC-1.1, CC-1.2, CC-1.3
**Can run parallel with**: CC-3.2

**Implementation**:

1. **`app/api/central-command/prospects/route.ts`**:

GET handler:
- Auth check with isSessionValidForCentralCommand
- Call getProspects() + getTeamCapacity()
- Return { intentClients, funnelClients, closedDeals, stats, team }
- Cache-Control: no-store

POST handler:
- Auth check
- Validate body with createProspectSchema
- Create PipelineClient (with rawInputText and enrichment fields if provided)
- Create PipelineRecord (default status: 'funnel', default stage: 'lead')
- Return { client, record }

2. **`app/api/central-command/prospects/[id]/route.ts`**:

GET handler:
- Auth check
- Call getProspectDetail(id) — params.id from route
- Return 404 if not found
- Return { client, record }

PATCH handler:
- Auth check
- Validate body with updateProspectSchema
- Separate client fields from record fields
- Handle version history: for versioned fields (notes, nextAction, lessonsLearned, reengageNotes), if value changed, call addVersion() and update both content and versions fields
- Handle stage change: if currentStage changed, append to stageHistory JSON, update stageEnteredAt
- Handle deal close: if status='closed', set closedAt=now()
- Update PipelineClient and PipelineRecord in transaction
- Return updated { client, record }

**Acceptance Criteria**:
- [ ] All routes check auth
- [ ] GET returns partitioned prospects + team
- [ ] POST creates client + record pair
- [ ] PATCH updates client and/or record fields
- [ ] PATCH handles version history for text fields
- [ ] PATCH handles stage advancement (updates stageHistory JSON)
- [ ] PATCH handles deal closure
- [ ] All responses have Cache-Control: no-store

### Task CC-3.2: Create Team API Routes
**Description**: Implement GET /api/central-command/team and PATCH /api/central-command/team/[id]
**Size**: Small
**Priority**: Medium
**Dependencies**: CC-1.1, CC-1.2
**Can run parallel with**: CC-3.1

**Implementation**:

1. **`app/api/central-command/team/route.ts`** — GET: auth check, return all team members
2. **`app/api/central-command/team/[id]/route.ts`** — PATCH: auth check, update utilization/allocations/role/color

**Acceptance Criteria**:
- [ ] GET returns all team members
- [ ] PATCH updates team member fields
- [ ] Auth check on both routes

## Phase 4: AI Extraction + Intake Flow

### Task CC-4.1: Create AI Extraction API
**Description**: Implement POST /api/central-command/extract using generateObject with gpt-4o
**Size**: Medium
**Priority**: High
**Dependencies**: CC-1.2 (auth), CC-1.3 (schemas, prompts)
**Can run parallel with**: CC-4.2

**Implementation**:

`app/api/central-command/extract/route.ts`:
- Auth check
- Validate with extractRequestSchema
- Short-circuit on trivial input (<10 chars)
- Build prompt with optional existing client context
- Call generateObject(openai('gpt-4o'), pipelineExtractionSchema, PIPELINE_EXTRACTION_SYSTEM_PROMPT, userPrompt)
- Return extraction result
- Cache-Control: no-store, no-cache, must-revalidate

Full implementation in spec section 4 (Extraction API code block).

**Acceptance Criteria**:
- [ ] Auth check works
- [ ] Input validated with Zod
- [ ] Short-circuit on input <10 chars
- [ ] generateObject called with correct model, schema, prompts
- [ ] Returns structured extraction with recommendations array
- [ ] No-store cache header

### Task CC-4.2: Create IntakeModal and RecommendationReview
**Description**: Build 2-step intake flow: text input → AI extraction → recommendation review → create prospect
**Size**: Large
**Priority**: High
**Dependencies**: CC-3.1 (prospects API), CC-4.1 (extract API)
**Can run parallel with**: None

**Implementation**:

1. **`app/central-command/components/IntakeModal.tsx`**:
- Props: { isOpen, onClose, onProspectCreated }
- 2-step flow managed by step state
- Step 1: Text Input
  - Textarea with 20,000 char limit
  - Live character counter (0/20K)
  - Placeholder: "Paste meeting notes, call transcript, or any text about this prospect..."
  - [Cancel] and [Extract →] buttons
  - Extract button calls POST /api/central-command/extract
  - Loading state during extraction (2-5 second gpt-4o call)
- Step 2: Review Recommendations (renders RecommendationReview)
  - Pass extracted recommendations to review component
  - [← Back] to return to text input
  - [Approve Selected → Add] to create prospect

2. **`app/central-command/components/RecommendationReview.tsx`**:
- Props: { recommendations: PipelineRecommendation[], overallSummary: string, onApprove: (approved: PipelineRecommendation[]) => void, onBack: () => void }
- Each recommendation shows:
  - Category label (color-coded)
  - capturedText (the extracted phrase)
  - suggestedValue (what will be inserted)
  - targetField (which field it maps to)
  - confidence score (0-1 as percentage)
  - [✓ Approve] [✗ Reject] toggle per item
- All approved by default
- Overall summary at bottom
- On approve: aggregate approved recommendations into createProspectSchema, POST to /api/central-command/prospects, call onProspectCreated

**Acceptance Criteria**:
- [ ] Modal opens/closes correctly (click outside, escape, ✕ button)
- [ ] Character counter updates live
- [ ] Extract button calls API and shows loading
- [ ] Recommendations render with approve/reject toggles
- [ ] Approved recommendations aggregate into prospect data
- [ ] Creating prospect calls API and closes modal
- [ ] Error handling for failed extraction or creation

## Phase 5: Inline Editing + Refinement

### Task CC-5.1: Create Refine API Route
**Description**: Implement POST /api/central-command/refine using generateObject with gpt-4o-mini
**Size**: Small
**Priority**: High
**Dependencies**: CC-1.2 (auth), CC-1.3 (schemas, prompts)
**Can run parallel with**: CC-5.2

**Implementation**:

`app/api/central-command/refine/route.ts`:
Full implementation in spec section 4 (Refinement API code block).
- Auth check, validate with refineRequestSchema
- Call generateObject(openai('gpt-4o-mini'), refinementResponseSchema, PIPELINE_REFINEMENT_SYSTEM_PROMPT)
- Prompt format: "Field: {fieldName}\n\nCurrent content:\n{currentContent}\n\nRefinement request: {prompt}"
- Return { refinedContent, changeSummary }

**Acceptance Criteria**:
- [ ] Auth check works
- [ ] Input validated with Zod
- [ ] gpt-4o-mini model used (not gpt-4o)
- [ ] Returns refinedContent and changeSummary
- [ ] No-store cache header

### Task CC-5.2: Create EditableField Component
**Description**: Build reusable inline edit + prompt refine + version history component
**Size**: Large
**Priority**: High
**Dependencies**: CC-5.1 (refine API)
**Can run parallel with**: None

**Implementation**:

`app/central-command/components/EditableField.tsx`:
- Props: { label, value, versions, source, fieldName, onSave: (value: string, source: string) => void, multiline?: boolean }
- 4 states: VIEW, EDIT, REFINING, HISTORY
- VIEW state:
  - Display current value as text
  - [Edit] and [Refine] icon buttons in header
  - Refine input always visible below content: text field + [Apply] button
  - Version pills at bottom (v1(AI) v2(R) v3(M))
- EDIT state:
  - Textarea (or input for single-line) replacing content
  - [Save] and [Cancel] buttons
  - On save: calls onSave(newValue, 'manual')
- REFINING state:
  - Loading indicator
  - Shows refined result when complete
  - [Accept] and [Reject] buttons
  - On accept: calls onSave(refinedContent, 'refined')
- HISTORY state:
  - Horizontal version pills, click to restore
  - Current version highlighted with solid background
  - On click: restores that version's content, calls onSave(restoredContent, 'manual')
- Refine flow: type prompt → POST /api/central-command/refine → show result → accept/reject
- Uses design tokens for all styling

**Acceptance Criteria**:
- [ ] VIEW shows content with refine input
- [ ] EDIT opens textarea, saves with source='manual'
- [ ] REFINING calls API and shows loading
- [ ] Accept refined content saves with source='refined'
- [ ] Version pills render and restore on click
- [ ] Version history capped at 10
- [ ] Works for both single-line and multiline fields

### Task CC-5.3: Create ClientDetailModal
**Description**: Build full prospect detail modal with EditableField instances for all fields
**Size**: Large
**Priority**: High
**Dependencies**: CC-5.2 (EditableField), CC-3.1 (prospects API)
**Can run parallel with**: None

**Implementation**:

`app/central-command/components/ClientDetailModal.tsx`:
- Props: { clientId: string | null, onClose: () => void, onUpdate: () => void }
- Fetches prospect detail on open (GET /api/central-command/prospects/[id])
- Sections:
  - Header: Company name, industry, color badge, [×] close
  - Stage: StageDots + [Advance →] button (stage select dropdown)
  - Priority: calculated score + days in stage
  - Contact: EditableField for name, role, email, phone, linkedin
  - Scores: 5 score sliders/inputs (1-10 each)
  - Notes: EditableField (multiline) with version history
  - Next Action: EditableField with date picker
  - Enrichment: Confidence breakdown (if available)
  - Actions: [Add Text Dump] (opens IntakeModal with existing client context), [Close Deal] (sets status='closed')
- On field save: PATCH /api/central-command/prospects/[id] with updated field
- On stage advance: PATCH with new currentStage + stageIndex
- On close deal: PATCH with status='closed', closedAt, closedReason
- Modal interactions: click outside to dismiss, ✕ button, Escape key

**Acceptance Criteria**:
- [ ] Loads prospect detail on open
- [ ] All editable fields use EditableField component
- [ ] Score inputs (1-10) update via PATCH
- [ ] Stage advance updates stageHistory
- [ ] Close deal flow works
- [ ] Add Text Dump enriches existing prospect
- [ ] Modal dismisses on click outside, ✕, Escape
- [ ] Updates refresh parent data

## Phase 6: Polish + Integration

### Task CC-6.1: Wire Dashboard Data Flow and Polish
**Description**: Connect all components with real data, add pipeline stats to header, handle loading/error states
**Size**: Medium
**Priority**: High
**Dependencies**: CC-2.1 through CC-5.3
**Can run parallel with**: CC-6.2

**Implementation**:
- Wire CentralCommandClient to pass callbacks: onSelectClient, onNewProspect, onEditMember
- Add client-side data refresh after mutations (router.refresh() or revalidation)
- Loading states for all async operations
- Error boundaries for failed API calls
- Empty states for tables (no prospects yet, no team members)
- Pipeline stats in header (total value = intent + funnel values)

**Acceptance Criteria**:
- [ ] All data flows from server to components correctly
- [ ] Mutations refresh displayed data
- [ ] Loading states shown during async ops
- [ ] Empty states render gracefully
- [ ] Error handling for failed API calls

### Task CC-6.2: Seed Team Data and Update Documentation
**Description**: Create seed script for initial team members, update CLAUDE.md
**Size**: Small
**Priority**: Medium
**Dependencies**: CC-1.1 (database)
**Can run parallel with**: CC-6.1

**Implementation**:

1. Seed 4 team members via Prisma (can be a script or done in Prisma Studio):
- Emily (Founder/Strategist, color: #d4a54a)
- Beems (CTO/Engineer, color: #3b82f6)
- Sherril (Operations, color: #4ade80)
- Contractor placeholder (color: #a855f7)

2. Update CLAUDE.md:
- Add Central Command section under Application Areas
- Document route, auth model, API routes
- Add to Key Models section
- Add to API Routes Reference

**Acceptance Criteria**:
- [ ] Team members seeded in database
- [ ] CLAUDE.md updated with Central Command documentation

---

## Dependency Graph

```
CC-1.1 (Prisma) ──┐
CC-1.2 (Auth)    ──┤──→ CC-2.1 (Page Shell) ──→ CC-2.3 (Pipeline) ──┐
CC-1.3 (Data)    ──┘──→ CC-2.2 (Header/Dots)                        │
                    ├──→ CC-2.4 (Funnel)                              ├──→ CC-6.1 (Wire/Polish)
                    ├──→ CC-2.5 (Closed/Team)                         │
                    ├──→ CC-3.1 (Prospects API) ──→ CC-4.2 (Intake)   │
                    ├──→ CC-3.2 (Team API)                             │
                    ├──→ CC-4.1 (Extract API) ──→ CC-4.2 (Intake) ───┤
                    ├──→ CC-5.1 (Refine API) ──→ CC-5.2 (Editable)  │
                    └──────────────────────────→ CC-5.3 (Detail) ────┘
                                                                      ↓
                                                               CC-6.2 (Seed/Docs)
```

## Parallel Execution Opportunities

- **Phase 1**: CC-1.1 + CC-1.2 can run in parallel. CC-1.3 after CC-1.1
- **Phase 2**: CC-2.2 + CC-2.3 + CC-2.4 + CC-2.5 can all run in parallel (after CC-2.1)
- **Phase 3**: CC-3.1 + CC-3.2 can run in parallel
- **Phase 4**: CC-4.1 can run in parallel with Phase 3
- **Phase 5**: CC-5.1 can run in parallel with CC-4.2
- **Phase 6**: CC-6.1 + CC-6.2 can run in parallel

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | CC-1.1, CC-1.2, CC-1.3 | Database, auth, data layer |
| Phase 2 | CC-2.1 through CC-2.5 | Dashboard UI components |
| Phase 3 | CC-3.1, CC-3.2 | CRUD API routes |
| Phase 4 | CC-4.1, CC-4.2 | AI extraction + intake flow |
| Phase 5 | CC-5.1, CC-5.2, CC-5.3 | Inline editing + refinement |
| Phase 6 | CC-6.1, CC-6.2 | Polish + documentation |
| **Total** | **15 tasks** | |
