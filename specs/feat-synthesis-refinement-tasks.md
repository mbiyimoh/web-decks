# Task Breakdown: Synthesis Section Refinement via LLM Prompt

Generated: 2026-02-05
Source: specs/feat-synthesis-refinement.md

## Overview

Add prompt-based LLM refinement to the 6 Client Intelligence synthesis sections. Two modes: global (multi-section via typed/voice prompt) and targeted (per-section inline prompt). Includes manual edit, per-section version history, and per-section accept/reject for global mode.

## Phase 1: Foundation (Data + Schemas + Types)

### Task SR-1: Prisma migration + types + schemas
**Description**: Add enrichmentFindingsVersions field, SynthesisVersions type, refinement schemas, and update updateProspectSchema
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: SR-2, SR-3

**Implementation Steps**:

1. Add to `prisma/schema.prisma` in PipelineClient model (after enrichmentFindings):
```prisma
enrichmentFindingsVersions Json?
```

2. Run `npx prisma migrate dev --name add-enrichment-findings-versions`

3. Add to `lib/central-command/types.ts`:
```typescript
import type { Version } from './utils';

export type SynthesisVersions = {
  [K in keyof Omit<EnrichmentFindings, 'scoreAssessments'>]?: Version[];
};
```

4. Add to `lib/central-command/schemas.ts`:
```typescript
export const refineSynthesisRequestSchema = z.object({
  currentSynthesis: z.object({
    companyOverview: z.string().optional(),
    goalsAndVision: z.string().optional(),
    painAndBlockers: z.string().optional(),
    decisionDynamics: z.string().optional(),
    strategicAssessment: z.string().optional(),
    recommendedApproach: z.string().optional(),
  }),
  prompt: z.string().min(1).max(5000),
});

export const refineSynthesisResponseSchema = z.object({
  updatedSections: z.record(
    z.object({
      refinedContent: z.string(),
      changeSummary: z.string(),
    })
  ),
});

export type RefineSynthesisRequest = z.infer<typeof refineSynthesisRequestSchema>;
export type RefineSynthesisResponse = z.infer<typeof refineSynthesisResponseSchema>;
```

5. Add to `updateProspectSchema` in schemas.ts:
```typescript
enrichmentFindings: z.any().optional(),
enrichmentFindingsVersions: z.any().optional(),
```

6. Add `buildSynthesisVersionUpdate` to `lib/central-command/utils.ts`:
```typescript
import type { SynthesisVersions } from './types';

export function buildSynthesisVersionUpdate(
  existingVersions: SynthesisVersions | null,
  sectionKey: string,
  content: string,
  source: Version['source']
): SynthesisVersions {
  const versions = existingVersions || {};
  return {
    ...versions,
    [sectionKey]: addVersion(
      (versions as Record<string, Version[]>)[sectionKey] || null,
      content,
      source
    ),
  };
}
```

**Acceptance Criteria**:
- [ ] Migration runs successfully
- [ ] `npx prisma generate` completes
- [ ] SynthesisVersions type compiles
- [ ] New schemas compile with no TS errors
- [ ] updateProspectSchema includes enrichmentFindings + enrichmentFindingsVersions
- [ ] buildSynthesisVersionUpdate utility works correctly

---

### Task SR-2: PATCH handler — enrichmentFindings versioning
**Description**: Extend PATCH /api/central-command/prospects/[id] to handle enrichmentFindings merge and enrichmentFindingsVersions storage
**Size**: Small
**Priority**: High
**Dependencies**: SR-1
**Can run parallel with**: SR-3

**Implementation Steps**:

Add to `app/api/central-command/prospects/[id]/route.ts` in the PATCH handler, after the existing client field updates and before the transaction:

```typescript
// Handle enrichmentFindings merge
if (data.enrichmentFindings !== undefined) {
  const existingFindings = (existing.enrichmentFindings as Record<string, unknown>) || {};
  const updated = { ...existingFindings, ...data.enrichmentFindings };
  clientUpdates.enrichmentFindings = updated as unknown as Prisma.InputJsonValue;
}

// Handle enrichmentFindingsVersions (client sends complete structure)
if (data.enrichmentFindingsVersions !== undefined) {
  clientUpdates.enrichmentFindingsVersions = data.enrichmentFindingsVersions as unknown as Prisma.InputJsonValue;
}
```

**Acceptance Criteria**:
- [ ] PATCH with `{ enrichmentFindings: { companyOverview: "new text" } }` merges into existing blob without overwriting other sections
- [ ] PATCH with `{ enrichmentFindingsVersions: {...} }` stores correctly
- [ ] Existing PATCH functionality unchanged

---

### Task SR-3: Synthesis refinement system prompt + refine-synthesis API
**Description**: Add SYNTHESIS_REFINEMENT_SYSTEM_PROMPT and create POST /api/central-command/refine-synthesis endpoint
**Size**: Medium
**Priority**: High
**Dependencies**: SR-1
**Can run parallel with**: SR-2

**Implementation Steps**:

1. Add to `lib/central-command/prompts.ts`:
```typescript
export const SYNTHESIS_REFINEMENT_SYSTEM_PROMPT = `You are refining a client intelligence synthesis for 33 Strategies, a strategy consulting firm. The synthesis has 6 sections that together describe who a prospect is and how to approach them.

## Sections and Their Purposes

- **companyOverview**: Who they are, what they do, market position, stage, scale
- **goalsAndVision**: What they're trying to accomplish, success metrics, vision
- **painAndBlockers**: What's getting in their way, failed attempts, frustrations
- **decisionDynamics**: Who decides, what matters, alternatives, buying signals
- **strategicAssessment**: Should 33S pursue? What's interesting or risky? Fit analysis
- **recommendedApproach**: How to pitch — what to lead with, what angle, what to avoid

## Your Task

Apply the user's refinement request to the relevant sections. You may update 1 or more sections depending on what the prompt addresses.

## Rules

1. ONLY include sections in your response that you actually changed
2. If the prompt only relates to one section, only return that one section
3. Preserve all existing information in each section — add to it, don't replace it (unless the user explicitly asks to remove or replace something)
4. Maintain professional, analytical tone consistent with existing content
5. When adding new information from the prompt, integrate it naturally into the existing text
6. Keep each section focused on its specific purpose — don't mix concerns across sections
7. If the prompt contains information relevant to multiple sections, update each relevant section appropriately`;
```

2. Create `app/api/central-command/refine-synthesis/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { refineSynthesisRequestSchema, refineSynthesisResponseSchema } from '@/lib/central-command/schemas';
import { SYNTHESIS_REFINEMENT_SYSTEM_PROMPT } from '@/lib/central-command/prompts';

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
  const parseResult = refineSynthesisRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parseResult.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { currentSynthesis, prompt } = parseResult.data;

  // Build context showing current sections
  const sectionContext = Object.entries(currentSynthesis)
    .filter(([, val]) => val)
    .map(([key, val]) => `### ${key}\n${val}`)
    .join('\n\n');

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: refineSynthesisResponseSchema,
      system: SYNTHESIS_REFINEMENT_SYSTEM_PROMPT,
      prompt: `Current synthesis:\n\n${sectionContext}\n\nRefinement request: ${prompt}`,
    });

    return NextResponse.json(object, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('[central-command/refine-synthesis] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refine synthesis' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] System prompt covers all 6 sections with clear guidance
- [ ] Endpoint validates request with refineSynthesisRequestSchema
- [ ] Returns only changed sections in updatedSections record
- [ ] Uses gpt-4o-mini with generateObject
- [ ] Auth uses isSessionValidForCentralCommand
- [ ] Error handling returns 400/401/500 as appropriate

---

### Task SR-4: Transcription endpoint
**Description**: Create POST /api/central-command/transcribe with CC auth, mirroring Clarity Canvas transcribe
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: SR-1, SR-2, SR-3

**Implementation Steps**:

Create `app/api/central-command/transcribe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import OpenAI from 'openai';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 });
    }

    const startTime = Date.now();
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });

    const processingTime = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      transcript: transcription.text,
      duration: transcription.duration ?? 0,
      processingTime,
    });
  } catch (error) {
    console.error('[central-command/transcribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Accepts FormData with audio file
- [ ] Uses CC auth (isSessionValidForCentralCommand)
- [ ] Returns { transcript, duration, processingTime }
- [ ] Validates file size (max 25MB)
- [ ] Uses whisper-1 model

---

## Phase 2: Components

### Task SR-5: EditableSynthesisBlock component
**Description**: Create EditableSynthesisBlock with VIEW/EDIT/REFINING/HISTORY states, inline refine input, version pills, and pendingRefinement support
**Size**: Large
**Priority**: High
**Dependencies**: SR-1
**Can run parallel with**: SR-6

**Implementation Steps**:

Create `app/central-command/components/EditableSynthesisBlock.tsx`. Follow EditableField.tsx pattern (same state machine, refine input, version pills) but with synthesis-appropriate styling from SynthesisBlock.tsx.

Props interface:
```typescript
interface EditableSynthesisBlockProps {
  label: string;
  sectionKey: string;
  content: string;
  versions?: Version[];
  color?: string;
  onSave: (content: string, source: 'manual' | 'refined') => void;
  pendingRefinement?: { refinedContent: string; changeSummary: string } | null;
  onAcceptRefinement?: () => void;
  onRejectRefinement?: () => void;
}
```

State machine: `type BlockState = 'VIEW' | 'EDIT' | 'REFINING' | 'HISTORY';`

Key behaviors:
- VIEW state: label (text-xs font-mono tracking-[0.2em] uppercase, color from prop or TEXT_DIM), content (text-sm leading-relaxed font-body, TEXT_PRIMARY), hover-reveal pencil + sparkle icons, always-visible "Refine with AI..." input below content
- EDIT state: textarea with current content, Save/Cancel buttons
- REFINING state: loading while API processes, then shows refined preview in italic with Accept/Reject
- HISTORY state: version pill click shows historical content with Restore/Cancel
- pendingRefinement: when set (from global mode), show changeSummary badge + refined preview with Accept/Reject — overrides local state
- Refine calls `/api/central-command/refine` with `{ currentContent: content, prompt, fieldName: sectionKey }`
- Version pills at bottom (same pattern as EditableField: v1(G), v2(R), v3(M))

Design tokens to import: GOLD, GREEN, BLUE, BG_ELEVATED, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM from @/components/portal/design-tokens

**Acceptance Criteria**:
- [ ] VIEW state renders content with label styling matching SynthesisBlock
- [ ] Hover reveals edit/refine icons
- [ ] Inline refine input calls /api/central-command/refine
- [ ] Accept/reject flow works for both local and pending refinements
- [ ] Manual edit with textarea + save/cancel
- [ ] Version pills render and restore works
- [ ] pendingRefinement prop shows external refinement with changeSummary
- [ ] TypeScript compiles clean

---

### Task SR-6: SynthesisGlobalRefine component
**Description**: Create global prompt bar + mic button for CLIENT INTELLIGENCE section header
**Size**: Medium
**Priority**: High
**Dependencies**: SR-3, SR-4
**Can run parallel with**: SR-5

**Implementation Steps**:

Create `app/central-command/components/SynthesisGlobalRefine.tsx`.

Props:
```typescript
interface SynthesisGlobalRefineProps {
  currentSynthesis: EnrichmentFindings;
  onRefinementComplete: (updates: Record<string, { refinedContent: string; changeSummary: string }>) => void;
}
```

UI structure:
- Compact inline bar: text input + mic toggle button + submit button
- When mic is active, show VoiceRecorder component (import from @/app/clarity-canvas/components/VoiceRecorder) with minDuration: 5, maxDuration: 300
- Loading state: "Analyzing..." spinner

Flow:
1. Text submit: POST to /api/central-command/refine-synthesis with { currentSynthesis, prompt }
2. Voice: record → upload FormData to /api/central-command/transcribe → get transcript → auto-submit to refine-synthesis
3. On response: call onRefinementComplete(response.updatedSections)

States: 'idle' | 'recording' | 'transcribing' | 'refining'

**Acceptance Criteria**:
- [ ] Text input submits to refine-synthesis API
- [ ] Mic button toggles VoiceRecorder
- [ ] Voice recording → transcription → auto-submit flow works
- [ ] Loading states shown during transcription and refinement
- [ ] onRefinementComplete called with updatedSections
- [ ] TypeScript compiles clean

---

## Phase 3: Integration

### Task SR-7: ClientDetailModal wiring + Section headerRight
**Description**: Wire EditableSynthesisBlock and SynthesisGlobalRefine into ClientDetailModal, add headerRight to Section, add state management for pendingRefinements
**Size**: Medium
**Priority**: High
**Dependencies**: SR-2, SR-5, SR-6

**Implementation Steps**:

1. Update Section component to accept headerRight:
```typescript
function Section({ title, headerRight, children }: {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  // render headerRight next to title in the header row
}
```

2. Add state + handlers to ClientDetailModal:
```typescript
const [pendingRefinements, setPendingRefinements] = useState<
  Record<string, { refinedContent: string; changeSummary: string }> | null
>(null);

// Parse synthesis versions from prospect
const synthesisVersions = typeof prospect.enrichmentFindingsVersions === 'object' && prospect.enrichmentFindingsVersions
  ? (prospect.enrichmentFindingsVersions as SynthesisVersions)
  : null;

function handleGlobalRefinement(updates: Record<string, { refinedContent: string; changeSummary: string }>) {
  setPendingRefinements(updates);
}

async function handleAcceptSection(key: string) {
  if (!pendingRefinements?.[key]) return;
  const { refinedContent } = pendingRefinements[key];
  await handleSynthesisSave(key, refinedContent, 'refined');
  const remaining = { ...pendingRefinements };
  delete remaining[key];
  setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
}

function handleRejectSection(key: string) {
  if (!pendingRefinements) return;
  const remaining = { ...pendingRefinements };
  delete remaining[key];
  setPendingRefinements(Object.keys(remaining).length > 0 ? remaining : null);
}

async function handleSynthesisSave(key: string, content: string, source: 'manual' | 'refined') {
  const newVersions = buildSynthesisVersionUpdate(synthesisVersions, key, content, source);
  await handleUpdate({
    enrichmentFindings: { [key]: content },
    enrichmentFindingsVersions: newVersions,
  });
}
```

3. Replace SynthesisBlock usage with EditableSynthesisBlock for all 6 sections (companyOverview, goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach). Add SynthesisGlobalRefine as headerRight on the CLIENT INTELLIGENCE Section.

4. Remove SynthesisBlock import, add EditableSynthesisBlock + SynthesisGlobalRefine imports.

**Acceptance Criteria**:
- [ ] Section component supports headerRight prop
- [ ] Global refine bar appears in CLIENT INTELLIGENCE header
- [ ] All 6 sections render as EditableSynthesisBlock
- [ ] Targeted refinement (per-section) works end-to-end
- [ ] Global refinement distributes per-section accept/reject
- [ ] Manual edit on each section works
- [ ] Version history per-section works
- [ ] Accepting/rejecting individual sections from global refinement works correctly
- [ ] PATCH calls include correct enrichmentFindings merge + enrichmentFindingsVersions
- [ ] TypeScript compiles clean
- [ ] No regressions on existing ClientDetailModal functionality
