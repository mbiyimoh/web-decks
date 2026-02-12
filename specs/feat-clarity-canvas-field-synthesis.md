# Clarity Canvas Field Synthesis and Refinement

## Status
**Ready** | Author: Claude Code | Date: 2026-02-11

## Overview

Implement multi-source field synthesis in Clarity Canvas so that when multiple FieldSources contribute to a single ProfileField, the summary and fullContext represent ALL sources (not just the latest). Additionally, add: (1) ability to remove a source from a field and trigger re-synthesis, (2) prompt-based refinement at the subsection level (e.g., "Thinking Style"), and (3) prompt-based refinement at the individual field level (e.g., "Decision Making Style").

## Background / Problem Statement

### Current State

When a user uploads multiple brain dumps that target the same field:
1. Each brain dump creates a `FieldSource` record (correct)
2. The `fullContext` is appended with a delimiter (correct)
3. The `summary` is **overwritten** with only the latest source's summary (broken)

**Evidence from commit route (lines 226-232):**
```typescript
await prisma.profileField.update({
  data: {
    summary: rec.summary,        // OVERWRITES - problem!
    fullContext: newContext,     // APPENDS - correct
    confidence: rec.confidence,  // OVERWRITES
  },
});
```

### The Gap

Users expect the displayed summary to synthesize all sources into a unified representation. Currently, clicking "3 sources" shows all sources are tracked, but the summary only reflects the most recent one.

### User Need

- Field summaries should aggregate all contributing sources
- Users should be able to remove irrelevant sources and trigger re-synthesis
- Users should be able to refine field/subsection content via natural language prompts
- **Critical:** Automatic changes must be transparent — users should never feel like something changed without knowing when or why

## Goals

- Implement automatic synthesis when a field has multiple sources
- Add transparent synthesis indicators so users always know when synthesis occurred
- Add source removal capability with confirmation dialog
- Add field-level refinement with accept/reject preview
- Add subsection-level refinement with accept/reject preview
- Maintain consistency with Central Command's refinement patterns

## Non-Goals

- Bulk refinement across multiple pillars at once
- Version history for field/subsection refinements (can add later)
- Automated quality scoring of syntheses
- Voice input for refinement prompts (text-only for v1)
- Automatic subsection synthesis from fields (explicit refinement only)

## Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Field summaries incorporate all sources | After commit with 2+ sources, summary contains information from all sources |
| "Synthesized" badge appears promptly | Badge visible within 500ms of page load after synthesis |
| Source removal triggers re-synthesis | After removal, field summary updates within 2s |
| Refinement preview accuracy | Preview matches what gets saved on accept |
| User transparency | Users always know when/why content was synthesized (badge + metadata)

## Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Prisma | 5.x | ORM for schema changes |
| Next.js | 14.x | App Router for API routes |
| OpenAI | gpt-4o | LLM for synthesis/refinement |
| ai SDK | 3.x | Structured output generation |
| Framer Motion | 10.x | Badge fade animations |

No new external libraries required.

## Detailed Design

### 1. Database Schema Changes

Add fields to track synthesis metadata:

```prisma
model ProfileField {
  // ... existing fields ...

  // NEW: Synthesis tracking
  lastSynthesizedAt  DateTime?  // When synthesis last occurred
  synthesisVersion   Int        @default(0)  // Increment on each synthesis
}
```

### 2. Synthesis Transparency UX

**Core Principle:** Automatic processes should be visible but not interruptive. Users should always know *what* changed, *when*, and *why* — without being blocked from their workflow.

#### 2.1 "Synthesized" Badge on Field Row

When synthesis occurs, display a subtle badge next to the source count:

```
● Decision Making Style ▾                    ✨ Synthesized  ⓘ 3 sources
  Integrates structured frameworks with radical innovation...
```

**Badge Behavior:**
- Appears immediately after commit when field has 2+ sources
- Gold/amber color consistent with design system
- Fades after ~10 seconds OR persists until user expands the field (whichever comes first)
- On hover: tooltip shows "Summary updated from 3 sources"

**Implementation:**
```tsx
// In PillarPageClient.tsx field row
{field.synthesisVersion > 0 && wasSynthesizedRecently(field.lastSynthesizedAt) && (
  <motion.span
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ delay: 10, duration: 0.5 }}
    className="flex items-center gap-1 text-xs"
    style={{ color: GOLD }}
    title={`Summary updated from ${field.sources.length} sources`}
  >
    <Sparkles size={12} />
    Synthesized
  </motion.span>
)}
```

#### 2.2 Synthesis Metadata in Expanded State

When the user expands a field, show a metadata block:

```
┌─────────────────────────────────────────────────────────────────┐
│ ● Decision Making Style ▾                    ✨ Synthesized  ⓘ 3 │
│   Integrates structured frameworks with radical innovation...    │
│                                                                 │
│   [Expanded content]                                            │
│   Beems challenges constraints and shows new possibilities,     │
│   encouraging radical innovation. He utilizes structured        │
│   frameworks with flexible execution...                         │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ 📊 SYNTHESIS INFO                                        │  │
│   │ Last synthesized: Just now (Feb 11, 2026, 5:45 PM)       │  │
│   │ Sources combined: 3                                      │  │
│   │ ────────────────────────────────────────────────────────│  │
│   │ [✏️ Refine with prompt...]                               │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**This follows progressive disclosure:** The summary is clean by default, but transparency is available on demand.

### 3. API Endpoints

#### 3.1 Field Synthesis (called from commit route)

**Internal function in commit route:**
```typescript
// lib/clarity-canvas/synthesis.ts
export async function synthesizeField(fieldId: string): Promise<{
  summary: string;
  fullContext: string;
}> {
  const field = await prisma.profileField.findUnique({
    where: { id: fieldId },
    include: { sources: { orderBy: { extractedAt: 'desc' } } },
  });

  if (!field || field.sources.length <= 1) {
    // No synthesis needed
    return { summary: field?.summary || '', fullContext: field?.fullContext || '' };
  }

  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: fieldSynthesisSchema,
    prompt: buildFieldSynthesisPrompt(field.sources),
  });

  await prisma.profileField.update({
    where: { id: fieldId },
    data: {
      summary: result.object.summary,
      fullContext: result.object.fullContext,
      lastSynthesizedAt: new Date(),
      synthesisVersion: { increment: 1 },
    },
  });

  return result.object;
}
```

#### 3.2 DELETE `/api/clarity-canvas/fields/[id]/sources/[sourceId]`

Remove a source and trigger re-synthesis.

```typescript
// app/api/clarity-canvas/fields/[id]/sources/[sourceId]/route.ts
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; sourceId: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const field = await prisma.profileField.findUnique({
    where: { id: params.id },
    include: {
      subsection: {
        include: {
          section: {
            include: { profile: true }
          }
        }
      },
      sources: true,
    },
  });

  if (!field || field.subsection.section.profile.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete the source
  await prisma.fieldSource.delete({
    where: { id: params.sourceId },
  });

  // Re-synthesize if still has sources
  const remainingSources = field.sources.filter(s => s.id !== params.sourceId);

  if (remainingSources.length === 0) {
    // Clear field content
    await prisma.profileField.update({
      where: { id: params.id },
      data: {
        summary: null,
        fullContext: null,
        lastSynthesizedAt: null,
        synthesisVersion: 0,
      },
    });
  } else if (remainingSources.length === 1) {
    // Single source - use directly
    await prisma.profileField.update({
      where: { id: params.id },
      data: {
        summary: remainingSources[0].rawContent.slice(0, 150),
        fullContext: remainingSources[0].rawContent,
        lastSynthesizedAt: new Date(),
        synthesisVersion: { increment: 1 },
      },
    });
  } else {
    // Multiple sources - re-synthesize
    await synthesizeField(params.id);
  }

  return NextResponse.json({ success: true });
}
```

#### 3.3 POST `/api/clarity-canvas/fields/[id]/refine`

Refine a field via user prompt. Returns preview for accept/reject.

```typescript
// app/api/clarity-canvas/fields/[id]/refine/route.ts
const refinementRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

const refinementResponseSchema = z.object({
  refinedSummary: z.string().max(150),
  refinedFullContext: z.string().max(400),
  changeSummary: z.string().max(200),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { prompt } = refinementRequestSchema.parse(body);

  // Verify ownership
  const field = await prisma.profileField.findUnique({
    where: { id: params.id },
    include: {
      sources: true,
      subsection: {
        include: {
          section: {
            include: { profile: true }
          }
        }
      }
    },
  });

  if (!field || field.subsection.section.profile.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: refinementResponseSchema,
    prompt: buildFieldRefinementPrompt({
      summary: field.summary,
      fullContext: field.fullContext,
      sources: field.sources,
      userPrompt: prompt,
    }),
  });

  // Return preview (not committed yet)
  return NextResponse.json({
    preview: {
      refinedSummary: result.object.refinedSummary,
      refinedFullContext: result.object.refinedFullContext,
      changeSummary: result.object.changeSummary,
    },
    fieldId: params.id,
  });
}
```

#### 3.4 PATCH `/api/clarity-canvas/fields/[id]`

Commit a refinement after user accepts.

```typescript
// app/api/clarity-canvas/fields/[id]/route.ts
const updateSchema = z.object({
  summary: z.string().max(150).optional(),
  fullContext: z.string().max(400).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const existingField = await prisma.profileField.findUnique({
    where: { id: params.id },
    include: {
      subsection: {
        include: {
          section: {
            include: { profile: true }
          }
        }
      }
    },
  });

  if (!existingField || existingField.subsection.section.profile.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const updates = updateSchema.parse(body);

  const field = await prisma.profileField.update({
    where: { id: params.id },
    data: {
      ...updates,
      lastSynthesizedAt: new Date(),
      synthesisVersion: { increment: 1 },
    },
  });

  return NextResponse.json({ field });
}
```

#### 3.5 POST `/api/clarity-canvas/subsections/[id]/refine`

Refine a subsection summary via user prompt.

```typescript
// app/api/clarity-canvas/subsections/[id]/refine/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { prompt } = refinementRequestSchema.parse(body);

  const subsection = await prisma.profileSubsection.findUnique({
    where: { id: params.id },
    include: { fields: true },
  });

  if (!subsection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      refinedSummary: z.string().max(300),
      changeSummary: z.string().max(200),
    }),
    prompt: buildSubsectionRefinementPrompt({
      subsectionName: subsection.name,
      currentSummary: subsection.summary,
      fields: subsection.fields,
      userPrompt: prompt,
    }),
  });

  return NextResponse.json({
    preview: {
      refinedSummary: result.object.refinedSummary,
      changeSummary: result.object.changeSummary,
    },
    subsectionId: params.id,
  });
}
```

### 4. Synthesis Prompts

```typescript
// lib/clarity-canvas/synthesis.ts

export const FIELD_SYNTHESIS_SYSTEM_PROMPT = `You are synthesizing multiple pieces of information about a person into a unified field summary.

Given multiple source texts that all relate to the same profile field, create:
1. A concise summary (max 150 characters) for display
2. A fuller context (max 400 characters, 2-3 sentences) that integrates all sources

Rules:
- Preserve key facts and specifics from ALL sources
- Resolve any contradictions by favoring more specific/recent information
- Maintain professional, analytical tone
- Don't just concatenate — synthesize into a coherent narrative
- If sources provide complementary perspectives, integrate them
`;

export const FIELD_REFINEMENT_PROMPT = `You are refining a profile field based on user feedback.

Current field:
- Summary: {summary}
- Full context: {fullContext}
- Sources: {sources}

User's refinement request: {prompt}

Generate:
1. refinedSummary (max 150 chars)
2. refinedFullContext (max 400 chars)
3. changeSummary (what you changed, for UI display)

Rules:
- Honor the user's request while preserving accurate information
- Don't remove information unless explicitly asked
- Maintain consistency with the source material
`;

export const SUBSECTION_REFINEMENT_PROMPT = `You are refining a subsection summary for a clarity profile.

Subsection: {subsectionName}
Current summary: {currentSummary}
Fields in this subsection: {fields}

User's refinement request: {prompt}

Generate a refined summary (max 300 chars) that:
- Addresses the user's feedback
- Accurately reflects the underlying field data
- Provides a cohesive overview of this aspect of the person
`;
```

### 5. UI Components

#### 5.1 FieldCitation with Remove Button

```typescript
// components/clarity-canvas/FieldCitation.tsx
// Add "Remove" button to each source in popover

{sources.map((source) => (
  <div key={source.id} className="flex items-start justify-between gap-2">
    <div>
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
        {truncate(source.rawContent, 100)}
      </p>
    </div>
    <div className="flex gap-2 text-xs flex-shrink-0">
      <Link
        href={`/clarity-canvas/archive?session=${source.inputSessionId}&chunk=${source.id}`}
        style={{ color: GOLD }}
      >
        View
      </Link>
      <button
        onClick={() => handleRemoveSource(source.id)}
        className="hover:opacity-80"
        style={{ color: RED }}
      >
        Remove
      </button>
    </div>
  </div>
))}
```

#### 5.2 Source Removal Confirmation Dialog

```typescript
// components/clarity-canvas/SourceRemovalDialog.tsx
export function SourceRemovalDialog({
  isOpen,
  onClose,
  onConfirm,
  sourceCount,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove source?</DialogTitle>
          <DialogDescription>
            This will remove this source from the field and re-synthesize the
            summary from the remaining {sourceCount - 1} source{sourceCount > 2 ? 's' : ''}.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Remove</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 5.3 Field Refinement UI (Expandable Inline)

```typescript
// In PillarPageClient.tsx expanded field section

{isExpanded && (
  <motion.div ...>
    {/* Existing fullContext display */}
    <p className="text-sm text-[#aaaaaa] whitespace-pre-wrap">
      {field.fullContext}
    </p>

    {/* Synthesis metadata */}
    {field.synthesisVersion > 0 && (
      <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-xs font-mono uppercase mb-2" style={{ color: GOLD }}>
          Synthesis Info
        </p>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>
          Last synthesized: {formatRelativeTime(field.lastSynthesizedAt)}
        </p>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>
          Sources combined: {field.sources.length}
        </p>
      </div>
    )}

    {/* Refinement input (expandable) */}
    <FieldRefinementInput
      fieldId={field.id}
      onRefined={(updatedField) => handleFieldUpdated(updatedField)}
    />
  </motion.div>
)}
```

#### 5.4 FieldRefinementInput Component

```typescript
// components/clarity-canvas/FieldRefinementInput.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import { GOLD, TEXT_MUTED, GREEN, RED } from '@/components/portal/design-tokens';

interface Props {
  fieldId: string;
  onRefined: (field: ProfileField) => void;
}

export function FieldRefinementInput({ fieldId, onRefined }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RefinementPreview | null>(null);

  async function handleSubmit() {
    setLoading(true);
    const res = await fetch(`/api/clarity-canvas/fields/${fieldId}/refine`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setPreview(data.preview);
    setLoading(false);
  }

  async function handleAccept() {
    const res = await fetch(`/api/clarity-canvas/fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        summary: preview.refinedSummary,
        fullContext: preview.refinedFullContext,
      }),
    });
    const data = await res.json();
    onRefined(data.field);
    setPreview(null);
    setPrompt('');
    setExpanded(false);
  }

  function handleReject() {
    setPreview(null);
  }

  if (preview) {
    return (
      <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: GOLD }}>
        <p className="text-xs font-mono uppercase mb-2" style={{ color: GOLD }}>
          Preview Changes
        </p>
        <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
          {preview.changeSummary}
        </p>
        <div className="p-2 rounded mb-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
            {preview.refinedSummary}
          </p>
          <p className="text-sm mt-2" style={{ color: TEXT_MUTED }}>
            {preview.refinedFullContext}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs"
            style={{ background: GREEN, color: 'black' }}
          >
            <Check size={14} /> Accept
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs"
            style={{ background: 'rgba(248,113,113,0.2)', color: RED }}
          >
            <X size={14} /> Reject
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs hover:opacity-80"
        style={{ color: GOLD }}
      >
        <Pencil size={12} />
        Refine with prompt...
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="mt-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Make it more concise' or 'Emphasize the strategic thinking aspect'"
            className="w-full p-2 rounded text-sm resize-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: TEXT_PRIMARY,
            }}
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            className="mt-2 px-3 py-1.5 rounded text-xs disabled:opacity-50"
            style={{ background: GOLD, color: 'black' }}
          >
            {loading ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6. Modifications to Commit Route

```typescript
// app/api/clarity-canvas/commit/route.ts

// After creating all FieldSources, synthesize fields with multiple sources
const fieldsWithMultipleSources = new Set<string>();

for (const rec of recommendations) {
  // ... existing FieldSource creation ...
  fieldsWithMultipleSources.add(field.id);
}

// Synthesize each field that now has multiple sources
for (const fieldId of fieldsWithMultipleSources) {
  const field = await tx.profileField.findUnique({
    where: { id: fieldId },
    include: { sources: true },
  });

  if (field && field.sources.length > 1) {
    await synthesizeField(fieldId);
  }
}
```

### 7. File Structure

```
app/
├── api/
│   └── clarity-canvas/
│       ├── fields/
│       │   └── [id]/
│       │       ├── route.ts                 # PATCH: update field
│       │       ├── refine/
│       │       │   └── route.ts             # POST: refine preview
│       │       └── sources/
│       │           └── [sourceId]/
│       │               └── route.ts         # DELETE: remove source
│       └── subsections/
│           └── [id]/
│               └── refine/
│                   └── route.ts             # POST: refine subsection

components/
└── clarity-canvas/
    ├── FieldCitation.tsx                    # Modified: add Remove button
    ├── FieldRefinementInput.tsx             # NEW: refinement UI
    ├── SubsectionRefinementInput.tsx        # NEW: subsection refinement
    └── SourceRemovalDialog.tsx              # NEW: confirmation dialog

lib/
└── clarity-canvas/
    └── synthesis.ts                         # NEW: synthesis prompts & utils
```

## User Experience

### Field with Multiple Sources

1. User uploads brain dump → Field gets new FieldSource
2. If field now has 2+ sources → Automatic synthesis runs
3. "✨ Synthesized" badge appears next to source count
4. Badge fades after 10 seconds
5. User expands field → Sees synthesis metadata + refinement option

### Source Removal

1. User clicks source count → Popover shows all sources
2. User clicks "Remove" on a source → Confirmation dialog appears
3. User confirms → Source deleted, field re-synthesized
4. "✨ Synthesized" badge appears
5. User sees updated summary reflecting remaining sources

### Field Refinement

1. User expands field → Clicks "Refine with prompt..."
2. Input expands → User types refinement request
3. Clicks "Generate Preview" → API returns preview
4. User sees before/after with change summary
5. User clicks "Accept" → Field updated, input closes
6. User clicks "Reject" → Preview dismissed, can try again

### Subsection Refinement

Same flow as field refinement, but in subsection header.

## Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/clarity-canvas/synthesis.test.ts
describe('synthesizeField', () => {
  it('returns original content for single source', async () => {
    const field = await createFieldWithSources(1);
    const result = await synthesizeField(field.id);
    expect(result.summary).toBe(field.sources[0].rawContent.slice(0, 150));
  });

  it('synthesizes multiple sources into unified summary', async () => {
    const field = await createFieldWithSources(3);
    const result = await synthesizeField(field.id);
    expect(result.summary.length).toBeLessThanOrEqual(150);
    expect(result.fullContext.length).toBeLessThanOrEqual(400);
  });

  it('increments synthesisVersion', async () => {
    const field = await createFieldWithSources(2);
    const before = field.synthesisVersion;
    await synthesizeField(field.id);
    const after = await prisma.profileField.findUnique({ where: { id: field.id } });
    expect(after.synthesisVersion).toBe(before + 1);
  });
});
```

### Integration Tests

```typescript
// __tests__/api/clarity-canvas/fields/[id]/sources/[sourceId].test.ts
describe('DELETE /api/clarity-canvas/fields/[id]/sources/[sourceId]', () => {
  it('removes source and re-synthesizes', async () => {
    const field = await createFieldWithSources(3);
    const sourceToRemove = field.sources[0];

    const res = await DELETE(mockRequest(), {
      params: { id: field.id, sourceId: sourceToRemove.id },
    });

    expect(res.status).toBe(200);

    const updated = await prisma.profileField.findUnique({
      where: { id: field.id },
      include: { sources: true },
    });
    expect(updated.sources.length).toBe(2);
    expect(updated.synthesisVersion).toBe(field.synthesisVersion + 1);
  });

  it('clears field when last source removed', async () => {
    const field = await createFieldWithSources(1);

    await DELETE(mockRequest(), {
      params: { id: field.id, sourceId: field.sources[0].id },
    });

    const updated = await prisma.profileField.findUnique({
      where: { id: field.id },
    });
    expect(updated.summary).toBeNull();
    expect(updated.fullContext).toBeNull();
  });
});
```

### E2E Tests

```typescript
// e2e/clarity-canvas-synthesis.spec.ts
test.describe('Field Synthesis', () => {
  test('shows synthesized badge after multi-source commit', async ({ page }) => {
    // Create first source
    await addBrainDump(page, 'First insight about problem solving');

    // Create second source for same field
    await addBrainDump(page, 'Second insight about problem solving');

    // Verify badge appears
    await expect(page.getByText('Synthesized')).toBeVisible();

    // Badge fades after 10s
    await page.waitForTimeout(11000);
    await expect(page.getByText('Synthesized')).not.toBeVisible();
  });

  test('source removal triggers re-synthesis', async ({ page }) => {
    await addBrainDump(page, 'First insight');
    await addBrainDump(page, 'Second insight');

    // Click sources
    await page.getByText('2 sources').click();

    // Remove one
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();

    // Verify re-synthesis
    await expect(page.getByText('1 source')).toBeVisible();
  });
});
```

## Performance Considerations

- Synthesis adds 1-2s latency to commit (acceptable for brain dump flow)
- Can optimize to async synthesis later if UX feedback indicates need
- Badge animation uses CSS/Framer Motion (no JS timers for fade)
- Refinement preview is non-blocking (user can cancel anytime)

## Security Considerations

- All endpoints verify user ownership via unified session
- Source removal is soft-delete aware (cascades properly)
- Refinement prompts are sanitized (max 500 chars)
- No cross-user data access possible

## Error Handling

### Synthesis Failure During Commit
- If synthesis LLM call fails, field keeps latest source's summary (current behavior fallback)
- Log error to console but don't fail the entire commit
- Show toast to user: "Synthesis failed, using latest source"
- Field will have `synthesisVersion: 0` indicating no synthesis occurred

### Source Removal Failure
- Transaction ensures atomicity — either both delete and re-synthesis succeed, or neither
- Return 500 with descriptive error message
- UI shows error toast and does not close confirmation dialog

### Refinement Failure
- If LLM call fails, return 500 with error message
- UI shows error state in refinement input
- User can retry or cancel

### Rate Limits
- Synthesis uses same gpt-4o pool as extraction
- No special handling needed — users rarely hit >1 synthesis per commit
- If rate limited, falls back to latest source behavior

## Helper Functions

### `wasSynthesizedRecently`
Determines if a field was synthesized within the display threshold (30 seconds):

```typescript
// lib/clarity-canvas/synthesis.ts
export function wasSynthesizedRecently(date: Date | string | null): boolean {
  if (!date) return false;
  const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  return Date.now() - timestamp < 30_000; // 30 seconds
}
```

### `fieldSynthesisSchema`
Zod schema for LLM synthesis output:

```typescript
// lib/clarity-canvas/synthesis.ts
import { z } from 'zod';

export const fieldSynthesisSchema = z.object({
  summary: z.string().max(150).describe('Concise summary for display (max 150 chars)'),
  fullContext: z.string().max(400).describe('Fuller context integrating all sources (max 400 chars, 2-3 sentences)'),
});
```

### `formatRelativeTime`
Formats timestamps as relative time (e.g., "Just now", "2 minutes ago"):

```typescript
// lib/clarity-canvas/synthesis.ts
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never';
  const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${seconds >= 120 ? 's' : ''} ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${seconds >= 7200 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
}

## Implementation Phases

### Phase 1: Field Synthesis on Commit
1. Add schema fields (lastSynthesizedAt, synthesisVersion)
2. Create `lib/clarity-canvas/synthesis.ts` with prompts
3. Modify commit route to call synthesis for multi-source fields
4. Add "Synthesized" badge to field row
5. Add synthesis metadata to expanded field view

### Phase 2: Source Removal
1. Create DELETE endpoint for sources
2. Add "Remove" button to FieldCitation popover
3. Create SourceRemovalDialog component
4. Wire up re-synthesis after removal
5. Add callback to refresh field data in PillarPageClient

### Phase 3: Field-Level Refinement
1. Create POST /api/clarity-canvas/fields/[id]/refine
2. Create PATCH /api/clarity-canvas/fields/[id]
3. Create FieldRefinementInput component
4. Add refinement UI to expanded field section
5. Implement accept/reject flow

### Phase 4: Subsection-Level Refinement
1. Create POST /api/clarity-canvas/subsections/[id]/refine
2. Create SubsectionRefinementInput component
3. Add refinement UI to subsection header
4. Implement accept/reject flow

## Open Questions

None — all clarifications resolved:
- ✅ Automatic synthesis on commit (with transparent indicators)
- ✅ Accept/reject preview for refinement
- ✅ Expandable inline refinement input
- ✅ Confirmation dialog for source removal
- ✅ No automatic subsection synthesis (explicit refinement only)

## References

- [Ideation Document](/docs/ideation/clarity-canvas-field-synthesis-and-refinement.md)
- [Central Command Synthesis Pattern](/docs/developer-guides/synthesis-refinement-guide.md)
- [Raw Input Archive Spec](/specs/feat-raw-input-archive.md)
- [NN/Group - Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [LogRocket - Toast Notifications](https://blog.logrocket.com/ux-design/toast-notifications/)
- [GetStream - Activity Feed Design](https://getstream.io/blog/activity-feed-design/)
