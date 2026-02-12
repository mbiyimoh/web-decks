# Task Breakdown: Clarity Canvas Field Synthesis and Refinement

Generated: 2026-02-11
Source: specs/feat-clarity-canvas-field-synthesis.md

## Overview

Implement multi-source field synthesis in Clarity Canvas so that when multiple FieldSources contribute to a single ProfileField, the summary and fullContext represent ALL sources. Additional features: source removal with re-synthesis, field-level refinement, and subsection-level refinement.

**4 Phases, 14 Tasks Total**

---

## Phase 1: Foundation - Field Synthesis on Commit

### Task 1.1: Add Schema Fields for Synthesis Tracking

**Description**: Add lastSynthesizedAt and synthesisVersion fields to ProfileField model
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (must complete first)

**Technical Requirements**:
- Add to prisma/schema.prisma in ProfileField model:
  - `lastSynthesizedAt DateTime?` — When synthesis last occurred
  - `synthesisVersion Int @default(0)` — Increment on each synthesis
- Run prisma migration

**Implementation**:
```prisma
model ProfileField {
  // ... existing fields ...

  // NEW: Synthesis tracking
  lastSynthesizedAt  DateTime?  // When synthesis last occurred
  synthesisVersion   Int        @default(0)  // Increment on each synthesis
}
```

**Commands**:
```bash
npx prisma migrate dev --name add-synthesis-tracking
npx prisma generate
```

**Acceptance Criteria**:
- [ ] Schema updated with both fields
- [ ] Migration applied successfully
- [ ] Prisma client regenerated
- [ ] Existing ProfileField records have synthesisVersion: 0

---

### Task 1.2: Create Synthesis Library with Prompts and Utilities

**Description**: Create lib/clarity-canvas/synthesis.ts with synthesis prompts, schemas, and helper functions
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: None

**Technical Requirements**:
- Create new file: lib/clarity-canvas/synthesis.ts
- Include fieldSynthesisSchema (Zod)
- Include FIELD_SYNTHESIS_SYSTEM_PROMPT
- Include FIELD_REFINEMENT_PROMPT
- Include SUBSECTION_REFINEMENT_PROMPT
- Include wasSynthesizedRecently() helper
- Include formatRelativeTime() helper
- Include synthesizeField() function
- Include buildFieldSynthesisPrompt() function

**Implementation**:
```typescript
// lib/clarity-canvas/synthesis.ts
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { prisma } from '@/lib/prisma';

// ============================================================================
// SCHEMAS
// ============================================================================

export const fieldSynthesisSchema = z.object({
  summary: z.string().max(150).describe('Concise summary for display (max 150 chars)'),
  fullContext: z.string().max(400).describe('Fuller context integrating all sources (max 400 chars, 2-3 sentences)'),
});

export type FieldSynthesisResult = z.infer<typeof fieldSynthesisSchema>;

// ============================================================================
// PROMPTS
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function wasSynthesizedRecently(date: Date | string | null): boolean {
  if (!date) return false;
  const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  return Date.now() - timestamp < 30_000; // 30 seconds
}

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

// ============================================================================
// SYNTHESIS FUNCTIONS
// ============================================================================

interface FieldSource {
  id: string;
  rawContent: string;
  extractedAt: Date;
}

export function buildFieldSynthesisPrompt(sources: FieldSource[]): string {
  const sourceTexts = sources
    .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime())
    .map((s, i) => `Source ${i + 1} (${new Date(s.extractedAt).toLocaleDateString()}):\n${s.rawContent}`)
    .join('\n\n');

  return `${FIELD_SYNTHESIS_SYSTEM_PROMPT}

Sources to synthesize:
${sourceTexts}`;
}

export async function synthesizeField(fieldId: string): Promise<FieldSynthesisResult> {
  const field = await prisma.profileField.findUnique({
    where: { id: fieldId },
    include: { sources: { orderBy: { extractedAt: 'desc' } } },
  });

  if (!field || field.sources.length <= 1) {
    return { summary: field?.summary || '', fullContext: field?.fullContext || '' };
  }

  try {
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
  } catch (error) {
    console.error('[synthesizeField] Error:', error);
    // Fallback: keep existing content, don't update synthesisVersion
    return { summary: field.summary || '', fullContext: field.fullContext || '' };
  }
}
```

**Acceptance Criteria**:
- [ ] File created at lib/clarity-canvas/synthesis.ts
- [ ] All exports compile without errors
- [ ] wasSynthesizedRecently returns true for dates < 30s ago
- [ ] wasSynthesizedRecently returns false for null or older dates
- [ ] formatRelativeTime handles all time ranges
- [ ] synthesizeField handles single-source fields (no synthesis)
- [ ] synthesizeField handles multi-source fields (calls LLM)
- [ ] synthesizeField gracefully handles LLM failures

---

### Task 1.3: Modify Commit Route to Call Synthesis

**Description**: Update app/api/clarity-canvas/commit/route.ts to call synthesizeField for multi-source fields
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.2
**Can run parallel with**: None

**Technical Requirements**:
- Import synthesizeField from lib/clarity-canvas/synthesis
- After creating FieldSources, track which field IDs were updated
- After all FieldSource creation, check each field's total source count
- Call synthesizeField for any field with sources.length > 1
- Handle synthesis failures gracefully (log error, continue)

**Implementation**:

Find this section in commit/route.ts (around line 226-236):
```typescript
await prisma.profileField.update({
  where: { id: field.id },
  data: {
    summary: rec.summary,
    fullContext: newContext,
    confidence: rec.confidence,
  },
});

savedCount++;
```

Add tracking after FieldSource creation and synthesis loop after the main loop:

```typescript
import { synthesizeField } from '@/lib/clarity-canvas/synthesis';

// Inside the POST handler, add tracking set at the top of the try block:
const updatedFieldIds = new Set<string>();

// After each successful field update, add the field ID:
updatedFieldIds.add(field.id);

// After the main loop (after savedCount log), add synthesis step:
// Synthesize fields that now have multiple sources
for (const fieldId of updatedFieldIds) {
  const fieldWithSources = await prisma.profileField.findUnique({
    where: { id: fieldId },
    include: { sources: true },
  });

  if (fieldWithSources && fieldWithSources.sources.length > 1) {
    console.log(`[commit] Synthesizing field ${fieldId} with ${fieldWithSources.sources.length} sources`);
    try {
      await synthesizeField(fieldId);
    } catch (err) {
      console.error(`[commit] Synthesis failed for field ${fieldId}:`, err);
      // Continue with other fields - don't fail the entire commit
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Import added for synthesizeField
- [ ] updatedFieldIds Set tracks all updated fields
- [ ] Synthesis loop runs after main FieldSource creation
- [ ] Only fields with >1 source trigger synthesis
- [ ] Synthesis errors are logged but don't fail the commit
- [ ] Console logs show synthesis activity

---

### Task 1.4: Add Synthesized Badge to Field Row

**Description**: Add "Synthesized" badge with fade animation to field rows in PillarPageClient
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1, Task 1.2
**Can run parallel with**: Task 1.5

**Technical Requirements**:
- Import Sparkles icon from lucide-react
- Import wasSynthesizedRecently from synthesis library
- Import GOLD from design tokens
- Add badge after field name/chevron, before source count
- Badge appears when synthesisVersion > 0 AND wasSynthesizedRecently
- Badge fades after 10 seconds using Framer Motion
- Tooltip shows "Summary updated from X sources"

**Implementation**:

Add imports to PillarPageClient.tsx:
```typescript
import { Sparkles } from 'lucide-react';
import { wasSynthesizedRecently } from '@/lib/clarity-canvas/synthesis';
import { GOLD } from '@/components/portal/design-tokens';
```

In the field row JSX (around line 348-356), add badge between the chevron and FieldCitation:
```tsx
{canExpand && (
  <ChevronDown
    size={14}
    className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
  />
)}
{/* Synthesized badge */}
{field.synthesisVersion > 0 && wasSynthesizedRecently(field.lastSynthesizedAt) && (
  <motion.span
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ delay: 10, duration: 0.5 }}
    className="flex items-center gap-1 text-xs ml-2"
    style={{ color: GOLD }}
    title={`Summary updated from ${field.sources.length} sources`}
  >
    <Sparkles size={12} />
    Synthesized
  </motion.span>
)}
```

**Note**: ProfileField type needs to include lastSynthesizedAt and synthesisVersion. Check if types need updating.

**Acceptance Criteria**:
- [ ] Badge appears for recently synthesized fields
- [ ] Badge shows Sparkles icon and "Synthesized" text
- [ ] Badge is gold color matching design system
- [ ] Badge fades after 10 seconds
- [ ] Hover tooltip shows source count
- [ ] Badge does not appear for fields with synthesisVersion: 0

---

### Task 1.5: Add Synthesis Metadata to Expanded Field View

**Description**: Show synthesis info block when field is expanded (last synthesized, sources combined)
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 1.2
**Can run parallel with**: Task 1.4

**Technical Requirements**:
- Import formatRelativeTime from synthesis library
- In expanded field section, add metadata block
- Only show when synthesisVersion > 0
- Display: last synthesized time, sources combined count
- Use design tokens for styling

**Implementation**:

Add to expanded section in PillarPageClient.tsx (around line 382-388):
```tsx
{/* Expanded content */}
<AnimatePresence>
  {isExpanded && field.fullContext && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="ml-5 mt-2 pl-3 border-l-2 border-zinc-700">
        <p className="text-sm text-[#aaaaaa] whitespace-pre-wrap">
          {field.fullContext.length > 400
            ? field.fullContext.slice(0, 400) + '...'
            : field.fullContext}
        </p>

        {/* Synthesis metadata */}
        {field.synthesisVersion > 0 && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs font-mono uppercase mb-2" style={{ color: GOLD }}>
              Synthesis Info
            </p>
            <p className="text-xs" style={{ color: '#888888' }}>
              Last synthesized: {formatRelativeTime(field.lastSynthesizedAt)}
            </p>
            <p className="text-xs" style={{ color: '#888888' }}>
              Sources combined: {field.sources.length}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Acceptance Criteria**:
- [ ] Metadata block appears when expanded AND synthesisVersion > 0
- [ ] Shows "Last synthesized" with relative time
- [ ] Shows "Sources combined" with count
- [ ] Uses correct design tokens
- [ ] Does not appear for single-source fields

---

## Phase 2: Source Removal

### Task 2.1: Create DELETE Endpoint for Source Removal

**Description**: Create API route to delete a FieldSource and trigger re-synthesis
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.2
**Can run parallel with**: None

**Technical Requirements**:
- Create app/api/clarity-canvas/fields/[id]/sources/[sourceId]/route.ts
- Verify user ownership through profile chain
- Delete the FieldSource
- Handle three cases:
  - 0 remaining sources: clear field content
  - 1 remaining source: use source directly
  - 2+ remaining sources: call synthesizeField
- Return success/failure

**Implementation**:
```typescript
// app/api/clarity-canvas/fields/[id]/sources/[sourceId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { synthesizeField } from '@/lib/clarity-canvas/synthesis';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; sourceId: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership through profile chain
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

  // Verify source belongs to this field
  const sourceToDelete = field.sources.find(s => s.id === params.sourceId);
  if (!sourceToDelete) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  try {
    // Delete the source
    await prisma.fieldSource.delete({
      where: { id: params.sourceId },
    });

    // Re-synthesize based on remaining sources
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
      // Single source - use directly (no LLM call needed)
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
  } catch (error) {
    console.error('[DELETE source] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove source' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Route created at correct path
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for non-owned fields
- [ ] Returns 404 for non-existent sources
- [ ] Deletes source from database
- [ ] Clears field when last source removed
- [ ] Uses single source directly when one remains
- [ ] Calls synthesizeField when multiple remain
- [ ] Returns 500 with error message on failure

---

### Task 2.2: Create SourceRemovalDialog Component

**Description**: Create confirmation dialog for source removal
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 2.1

**Technical Requirements**:
- Create components/clarity-canvas/SourceRemovalDialog.tsx
- Use existing Dialog components (or create simple one with portal)
- Accept isOpen, onClose, onConfirm, sourceCount props
- Show warning message about re-synthesis
- Cancel and Remove buttons

**Implementation**:
```typescript
// components/clarity-canvas/SourceRemovalDialog.tsx
'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  GOLD,
} from '@/components/portal/design-tokens';

interface SourceRemovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceCount: number;
  isLoading?: boolean;
}

export function SourceRemovalDialog({
  isOpen,
  onClose,
  onConfirm,
  sourceCount,
  isLoading = false,
}: SourceRemovalDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isLoading]);

  if (!isOpen) return null;

  const remainingCount = sourceCount - 1;
  const remainingText = remainingCount === 0
    ? 'This will clear the field content.'
    : `This will re-synthesize the summary from the remaining ${remainingCount} source${remainingCount > 1 ? 's' : ''}.`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ background: BG_ELEVATED }}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-display" style={{ color: TEXT_PRIMARY }}>
            Remove source?
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-500 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-6" style={{ color: TEXT_MUTED }}>
          {remainingText} This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: TEXT_MUTED,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            style={{
              background: 'rgba(248, 113, 113, 0.2)',
              color: '#f87171',
            }}
          >
            {isLoading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Acceptance Criteria**:
- [ ] Component renders as modal overlay
- [ ] Shows appropriate message based on remaining sources
- [ ] Cancel button closes dialog
- [ ] Remove button triggers onConfirm
- [ ] Escape key closes dialog
- [ ] Click outside closes dialog
- [ ] Loading state disables buttons and shows "Removing..."

---

### Task 2.3: Add Remove Button to FieldCitation Popover

**Description**: Modify FieldCitation to include Remove button and wire up removal flow
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1, Task 2.2
**Can run parallel with**: None

**Technical Requirements**:
- Import SourceRemovalDialog
- Add onSourceRemoved callback prop
- Add Remove button next to View link
- Manage dialog state (isOpen, sourceToRemove)
- Call DELETE endpoint on confirm
- Call onSourceRemoved callback on success
- Handle loading and error states

**Implementation**:

Update FieldCitationProps and add state:
```typescript
interface FieldCitationProps {
  fieldId: string;
  sourceCount: number;
  onSourceRemoved?: () => void; // NEW
}

// Inside component:
const [sourceToRemove, setSourceToRemove] = useState<string | null>(null);
const [isRemoving, setIsRemoving] = useState(false);

async function handleRemoveSource() {
  if (!sourceToRemove) return;

  setIsRemoving(true);
  try {
    const res = await fetch(`/api/clarity-canvas/fields/${fieldId}/sources/${sourceToRemove}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to remove source');
    }

    // Clear from local state
    setSources(prev => prev?.filter(s => s.id !== sourceToRemove) || null);
    setSourceToRemove(null);
    onSourceRemoved?.();
  } catch (err) {
    console.error('Failed to remove source:', err);
    setError('Failed to remove source');
  } finally {
    setIsRemoving(false);
  }
}
```

Update source row JSX to add Remove button:
```tsx
<div className="flex gap-2 text-xs flex-shrink-0">
  {source.inputSession && (
    <button
      onClick={() => handleViewInArchive(source)}
      className="hover:opacity-80 transition-opacity"
      style={{ color: GOLD }}
    >
      View
    </button>
  )}
  <button
    onClick={() => setSourceToRemove(source.id)}
    className="hover:opacity-80 transition-opacity"
    style={{ color: '#f87171' }}
  >
    Remove
  </button>
</div>
```

Add dialog at end of component:
```tsx
<SourceRemovalDialog
  isOpen={sourceToRemove !== null}
  onClose={() => setSourceToRemove(null)}
  onConfirm={handleRemoveSource}
  sourceCount={sources?.length || 0}
  isLoading={isRemoving}
/>
```

**Acceptance Criteria**:
- [ ] Remove button appears next to each source
- [ ] Clicking Remove opens confirmation dialog
- [ ] Confirming deletion calls API
- [ ] Success updates local source list
- [ ] Success calls onSourceRemoved callback
- [ ] Error shows error message
- [ ] Loading state shown during removal

---

### Task 2.4: Wire Source Removal to PillarPageClient

**Description**: Add callback to refresh field data after source removal
**Size**: Small
**Priority**: High
**Dependencies**: Task 2.3
**Can run parallel with**: None

**Technical Requirements**:
- Pass onSourceRemoved callback to FieldCitation
- Callback refreshes the page data (router.refresh())
- Alternative: Refetch profile data directly

**Implementation**:

Update FieldCitation usage in PillarPageClient.tsx:
```tsx
{hasData && field.sources.length > 0 && (
  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
    <FieldCitation
      fieldId={field.id}
      sourceCount={field.sources.length}
      onSourceRemoved={() => {
        router.refresh();
      }}
    />
  </div>
)}
```

**Acceptance Criteria**:
- [ ] onSourceRemoved callback passed to FieldCitation
- [ ] Page data refreshes after source removal
- [ ] Field shows updated source count
- [ ] Field shows re-synthesized summary

---

## Phase 3: Field-Level Refinement

### Task 3.1: Create Field Refine POST Endpoint

**Description**: Create API endpoint for field refinement preview
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.2
**Can run parallel with**: Task 3.2

**Technical Requirements**:
- Create app/api/clarity-canvas/fields/[id]/refine/route.ts
- Verify user ownership
- Parse prompt from request body
- Call LLM with refinement prompt
- Return preview (not saved yet)

**Implementation**:
```typescript
// app/api/clarity-canvas/fields/[id]/refine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { FIELD_REFINEMENT_PROMPT } from '@/lib/clarity-canvas/synthesis';

const refinementRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

const refinementResponseSchema = z.object({
  refinedSummary: z.string().max(150),
  refinedFullContext: z.string().max(400),
  changeSummary: z.string().max(200),
});

function buildFieldRefinementPrompt(params: {
  summary: string | null;
  fullContext: string | null;
  sources: { rawContent: string }[];
  userPrompt: string;
}): string {
  const sourcesText = params.sources.map((s, i) => `Source ${i + 1}: ${s.rawContent}`).join('\n\n');

  return FIELD_REFINEMENT_PROMPT
    .replace('{summary}', params.summary || '(empty)')
    .replace('{fullContext}', params.fullContext || '(empty)')
    .replace('{sources}', sourcesText)
    .replace('{prompt}', params.userPrompt);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
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

    return NextResponse.json({
      preview: {
        refinedSummary: result.object.refinedSummary,
        refinedFullContext: result.object.refinedFullContext,
        changeSummary: result.object.changeSummary,
      },
      fieldId: params.id,
    });
  } catch (error) {
    console.error('[POST refine] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Refinement failed' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for non-owned fields
- [ ] Returns 400 for invalid prompt
- [ ] Calls LLM with correct prompt
- [ ] Returns preview object with refinedSummary, refinedFullContext, changeSummary
- [ ] Returns 500 with error on LLM failure

---

### Task 3.2: Create Field PATCH Endpoint

**Description**: Create API endpoint to save accepted refinement
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 3.1

**Technical Requirements**:
- Create app/api/clarity-canvas/fields/[id]/route.ts
- Verify user ownership
- Update summary and fullContext
- Increment synthesisVersion
- Update lastSynthesizedAt

**Implementation**:
```typescript
// app/api/clarity-canvas/fields/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';

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

  try {
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
  } catch (error) {
    console.error('[PATCH field] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for non-owned fields
- [ ] Returns 400 for invalid data
- [ ] Updates summary and fullContext
- [ ] Increments synthesisVersion
- [ ] Sets lastSynthesizedAt to now
- [ ] Returns updated field

---

### Task 3.3: Create FieldRefinementInput Component

**Description**: Create expandable refinement input UI with accept/reject preview
**Size**: Large
**Priority**: High
**Dependencies**: Task 3.1, Task 3.2
**Can run parallel with**: None

**Technical Requirements**:
- Create components/clarity-canvas/FieldRefinementInput.tsx
- Expandable input (click to show)
- Textarea for prompt entry
- "Generate Preview" button
- Preview state with accept/reject buttons
- Loading states throughout

**Implementation**:
```typescript
// components/clarity-canvas/FieldRefinementInput.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import {
  GOLD,
  TEXT_MUTED,
  TEXT_PRIMARY,
  GREEN,
} from '@/components/portal/design-tokens';

interface RefinementPreview {
  refinedSummary: string;
  refinedFullContext: string;
  changeSummary: string;
}

interface FieldRefinementInputProps {
  fieldId: string;
  onRefined: () => void;
}

export function FieldRefinementInput({ fieldId, onRefined }: FieldRefinementInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RefinementPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clarity-canvas/fields/${fieldId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate refinement');
      }

      const data = await res.json();
      setPreview(data.preview);
    } catch (err) {
      console.error('Refinement error:', err);
      setError('Failed to generate refinement. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clarity-canvas/fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: preview.refinedSummary,
          fullContext: preview.refinedFullContext,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save refinement');
      }

      setPreview(null);
      setPrompt('');
      setExpanded(false);
      onRefined();
    } catch (err) {
      console.error('Accept error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReject() {
    setPreview(null);
    setError(null);
  }

  // Preview state
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
        {error && (
          <p className="text-xs text-red-400 mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs disabled:opacity-50"
            style={{ background: GREEN, color: 'black' }}
          >
            <Check size={14} /> {loading ? 'Saving...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs disabled:opacity-50"
            style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}
          >
            <X size={14} /> Reject
          </button>
        </div>
      </div>
    );
  }

  // Normal state
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
            disabled={loading}
          />
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
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

**Acceptance Criteria**:
- [ ] Collapsed by default
- [ ] Expands on click
- [ ] Textarea accepts prompt input
- [ ] "Generate Preview" calls API
- [ ] Loading state shown during generation
- [ ] Preview displays refined content and change summary
- [ ] Accept saves and refreshes
- [ ] Reject clears preview
- [ ] Error states handled gracefully

---

### Task 3.4: Add FieldRefinementInput to PillarPageClient

**Description**: Integrate refinement input into expanded field view
**Size**: Small
**Priority**: High
**Dependencies**: Task 3.3
**Can run parallel with**: None

**Technical Requirements**:
- Import FieldRefinementInput
- Add after synthesis metadata in expanded section
- Pass fieldId and onRefined callback

**Implementation**:

Import at top of PillarPageClient.tsx:
```typescript
import { FieldRefinementInput } from '@/components/clarity-canvas/FieldRefinementInput';
```

Add in expanded section after synthesis metadata:
```tsx
{/* Refinement input */}
<FieldRefinementInput
  fieldId={field.id}
  onRefined={() => router.refresh()}
/>
```

**Acceptance Criteria**:
- [ ] Refinement input appears in expanded field view
- [ ] Appears after synthesis metadata block
- [ ] Works correctly with API endpoints
- [ ] Page refreshes after successful refinement

---

## Phase 4: Subsection-Level Refinement

### Task 4.1: Create Subsection Refine POST Endpoint

**Description**: Create API endpoint for subsection refinement preview
**Size**: Medium
**Priority**: Medium
**Dependencies**: Task 1.2
**Can run parallel with**: Task 4.2

**Technical Requirements**:
- Create app/api/clarity-canvas/subsections/[id]/refine/route.ts
- Verify user ownership
- Get subsection with its fields
- Call LLM with subsection refinement prompt
- Return preview

**Implementation**:
```typescript
// app/api/clarity-canvas/subsections/[id]/refine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { SUBSECTION_REFINEMENT_PROMPT } from '@/lib/clarity-canvas/synthesis';

const refinementRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

const subsectionRefinementResponseSchema = z.object({
  refinedSummary: z.string().max(300),
  changeSummary: z.string().max(200),
});

function buildSubsectionRefinementPrompt(params: {
  subsectionName: string;
  currentSummary: string | null;
  fields: { name: string; summary: string | null }[];
  userPrompt: string;
}): string {
  const fieldsText = params.fields
    .filter(f => f.summary)
    .map(f => `- ${f.name}: ${f.summary}`)
    .join('\n');

  return SUBSECTION_REFINEMENT_PROMPT
    .replace('{subsectionName}', params.subsectionName)
    .replace('{currentSummary}', params.currentSummary || '(no summary yet)')
    .replace('{fields}', fieldsText || '(no fields populated)')
    .replace('{prompt}', params.userPrompt);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { prompt } = refinementRequestSchema.parse(body);

    // Get subsection with fields and verify ownership
    const subsection = await prisma.profileSubsection.findUnique({
      where: { id: params.id },
      include: {
        fields: true,
        section: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!subsection || subsection.section.profile.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: subsectionRefinementResponseSchema,
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
  } catch (error) {
    console.error('[POST subsection refine] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Refinement failed' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for non-owned subsections
- [ ] Returns 400 for invalid prompt
- [ ] Includes field summaries in prompt context
- [ ] Returns preview with refinedSummary and changeSummary
- [ ] Returns 500 on LLM failure

---

### Task 4.2: Create Subsection PATCH Endpoint

**Description**: Create API endpoint to save subsection refinement
**Size**: Small
**Priority**: Medium
**Dependencies**: None
**Can run parallel with**: Task 4.1

**Technical Requirements**:
- Create app/api/clarity-canvas/subsections/[id]/route.ts
- Verify user ownership
- Update summary field

**Implementation**:
```typescript
// app/api/clarity-canvas/subsections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';

const updateSchema = z.object({
  summary: z.string().max(300).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await ensureUserFromUnifiedSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify ownership
    const existing = await prisma.profileSubsection.findUnique({
      where: { id: params.id },
      include: {
        section: {
          include: { profile: true },
        },
      },
    });

    if (!existing || existing.section.profile.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const updates = updateSchema.parse(body);

    const subsection = await prisma.profileSubsection.update({
      where: { id: params.id },
      data: updates,
    });

    return NextResponse.json({ subsection });
  } catch (error) {
    console.error('[PATCH subsection] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for non-owned subsections
- [ ] Returns 400 for invalid data
- [ ] Updates summary field
- [ ] Returns updated subsection

---

### Task 4.3: Create SubsectionRefinementInput Component

**Description**: Create refinement input for subsection headers
**Size**: Medium
**Priority**: Medium
**Dependencies**: Task 4.1, Task 4.2
**Can run parallel with**: None

**Technical Requirements**:
- Create components/clarity-canvas/SubsectionRefinementInput.tsx
- Similar to FieldRefinementInput but for subsections
- Expandable input with accept/reject preview

**Implementation**:
```typescript
// components/clarity-canvas/SubsectionRefinementInput.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import {
  GOLD,
  TEXT_MUTED,
  TEXT_PRIMARY,
  GREEN,
} from '@/components/portal/design-tokens';

interface RefinementPreview {
  refinedSummary: string;
  changeSummary: string;
}

interface SubsectionRefinementInputProps {
  subsectionId: string;
  onRefined: () => void;
}

export function SubsectionRefinementInput({ subsectionId, onRefined }: SubsectionRefinementInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RefinementPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clarity-canvas/subsections/${subsectionId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate refinement');
      }

      const data = await res.json();
      setPreview(data.preview);
    } catch (err) {
      console.error('Refinement error:', err);
      setError('Failed to generate refinement. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clarity-canvas/subsections/${subsectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: preview.refinedSummary,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save refinement');
      }

      setPreview(null);
      setPrompt('');
      setExpanded(false);
      onRefined();
    } catch (err) {
      console.error('Accept error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReject() {
    setPreview(null);
    setError(null);
  }

  if (preview) {
    return (
      <div className="mt-2 p-3 rounded-lg border" style={{ borderColor: GOLD }}>
        <p className="text-xs font-mono uppercase mb-2" style={{ color: GOLD }}>
          Preview Changes
        </p>
        <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
          {preview.changeSummary}
        </p>
        <div className="p-2 rounded mb-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-sm" style={{ color: TEXT_PRIMARY }}>
            {preview.refinedSummary}
          </p>
        </div>
        {error && (
          <p className="text-xs text-red-400 mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs disabled:opacity-50"
            style={{ background: GREEN, color: 'black' }}
          >
            <Check size={14} /> {loading ? 'Saving...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs disabled:opacity-50"
            style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}
          >
            <X size={14} /> Reject
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs hover:opacity-80"
        style={{ color: GOLD }}
      >
        <Pencil size={12} />
        Refine subsection summary...
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="mt-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Summarize the key thinking patterns' or 'Make it more concise'"
            className="w-full p-2 rounded text-sm resize-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: TEXT_PRIMARY,
            }}
            rows={2}
            disabled={loading}
          />
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
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

**Acceptance Criteria**:
- [ ] Component renders correctly
- [ ] Expandable on click
- [ ] Generates preview via API
- [ ] Accept saves via PATCH
- [ ] Reject clears preview
- [ ] Loading and error states handled

---

### Task 4.4: Add SubsectionRefinementInput to PillarPageClient

**Description**: Integrate subsection refinement into subsection headers
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 4.3
**Can run parallel with**: None

**Technical Requirements**:
- Import SubsectionRefinementInput
- Add after subsection header completion text
- Pass subsectionId and onRefined callback

**Implementation**:

Import at top:
```typescript
import { SubsectionRefinementInput } from '@/components/clarity-canvas/SubsectionRefinementInput';
```

Add in subsection header section (around line 313-320):
```tsx
{/* Subsection header */}
<div className="flex items-center justify-between mb-4">
  <p className="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase">
    {subsection.name}
  </p>
  <span className="text-xs text-zinc-500">
    {completed}/{total} complete
  </span>
</div>

{/* Subsection refinement */}
<SubsectionRefinementInput
  subsectionId={subsection.id}
  onRefined={() => router.refresh()}
/>
```

**Acceptance Criteria**:
- [ ] Refinement input appears below subsection header
- [ ] Works with subsection API endpoints
- [ ] Page refreshes after refinement

---

## Execution Summary

| Phase | Tasks | Estimated Effort | Can Parallelize |
|-------|-------|------------------|-----------------|
| Phase 1: Foundation | 5 tasks | Medium | Tasks 1.4 + 1.5 |
| Phase 2: Source Removal | 4 tasks | Medium | Tasks 2.1 + 2.2 |
| Phase 3: Field Refinement | 4 tasks | Medium | Tasks 3.1 + 3.2 |
| Phase 4: Subsection Refinement | 4 tasks | Small | Tasks 4.1 + 4.2 |

**Total: 17 Tasks**

**Critical Path**: 1.1 → 1.2 → 1.3 → (1.4 || 1.5) → 2.1 → 2.3 → 2.4 → 3.1 → 3.3 → 3.4 → 4.1 → 4.3 → 4.4

**Recommended Execution Order**:
1. Start with Task 1.1 (schema changes)
2. Complete Task 1.2 (synthesis library)
3. Tasks 1.3, 1.4, 1.5, 2.2 can proceed after 1.2
4. Continue through phases sequentially
