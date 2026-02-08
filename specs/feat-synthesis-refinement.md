# Synthesis Section Refinement via LLM Prompt

**Status:** Draft
**Author:** Claude Code
**Date:** 2026-02-05
**Ideation:** `docs/ideation/synthesis-refinement-via-prompt.md`

---

## Overview

Add prompt-based LLM refinement to the 6 Client Intelligence synthesis sections in Central Command's ClientDetailModal. Two modes: **global refinement** (typed or voice prompt affecting multiple sections) and **targeted refinement** (inline prompt scoped to a single section). Both include manual textarea editing and per-section version history.

## Problem Statement

After AI extracts a client synthesis from raw text, the resulting sections (companyOverview, goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach) are currently read-only. Users can't iteratively refine them as they learn more about a prospect. They need to be able to add context, correct inaccuracies, and evolve the synthesis over time — both surgically (one section) and broadly (voice dump covering multiple topics).

## Goals

- Enable per-section refinement via inline prompt input (targeted mode)
- Enable multi-section refinement via a global prompt bar with mic support (global mode)
- Include manual textarea edit as fallback for both modes
- Track per-section version history (with version pills and restore)
- Per-section accept/reject when global refinement updates multiple sections

## Non-Goals

- Re-running the full extraction from scratch (separate feature)
- Editing score assessments via prompt
- Real-time collaborative editing
- Mobile-optimized voice recording UX
- Streaming/partial responses during refinement

---

## Technical Approach

### Files That Change

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `enrichmentFindingsVersions Json?` to PipelineClient |
| `lib/central-command/schemas.ts` | Add `refineSynthesisRequestSchema`, `refineSynthesisResponseSchema`, update `updateProspectSchema` |
| `lib/central-command/prompts.ts` | Add `SYNTHESIS_REFINEMENT_SYSTEM_PROMPT` for global mode |
| `lib/central-command/types.ts` | Add `SynthesisVersions` type |
| `app/api/central-command/refine-synthesis/route.ts` | New endpoint: global multi-section refinement |
| `app/api/central-command/transcribe/route.ts` | New endpoint: Whisper transcription with CC auth |
| `app/central-command/components/EditableSynthesisBlock.tsx` | New component: replaces SynthesisBlock with edit/refine/history |
| `app/central-command/components/SynthesisGlobalRefine.tsx` | New component: global prompt bar + mic + per-section diff preview |
| `app/central-command/components/ClientDetailModal.tsx` | Wire up new components, handle enrichmentFindings updates |
| `app/api/central-command/prospects/[id]/route.ts` | Handle `enrichmentFindings` + `enrichmentFindingsVersions` updates in PATCH |

### Integration Points

- Existing `/api/central-command/refine` endpoint — used as-is for targeted single-section refinement
- Existing `VoiceRecorder` component from Clarity Canvas — reused for mic input in global mode
- Existing `addVersion()` utility — reused for per-section version tracking
- Existing PATCH handler pattern — extended for enrichmentFindings versioning

---

## Implementation Details

### 1. Data Layer — Prisma Migration

Add one field to `PipelineClient`:

```prisma
enrichmentFindingsVersions Json?  // { companyOverview: Version[], goalsAndVision: Version[], ... }
```

TypeScript type:

```typescript
// lib/central-command/types.ts
export type SynthesisVersions = {
  [K in keyof Omit<EnrichmentFindings, 'scoreAssessments'>]?: Version[];
};
```

### 2. API — Global Refinement Endpoint

**`POST /api/central-command/refine-synthesis`**

New endpoint for global mode. Receives the full current synthesis + prompt, returns only the sections that changed.

Request schema:
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
  prompt: z.string().min(1).max(5000), // Higher limit for voice transcripts
});
```

Response schema:
```typescript
export const refineSynthesisResponseSchema = z.object({
  updatedSections: z.record(
    z.object({
      refinedContent: z.string(),
      changeSummary: z.string(),
    })
  ),
});
```

System prompt (`SYNTHESIS_REFINEMENT_SYSTEM_PROMPT`):
- Instructs the LLM it's refining a client intelligence synthesis for 33 Strategies
- Lists the 6 section names and their purposes
- Rules: only modify sections the prompt is relevant to, preserve unchanged sections by omitting them from response, maintain professional tone, cite evidence when adding information
- Uses `gpt-4o-mini` with `generateObject`

### 3. API — Transcription Endpoint

**`POST /api/central-command/transcribe`**

Mirrors the existing `/api/clarity-canvas/transcribe` but uses `isSessionValidForCentralCommand()` auth instead of `ensureUserFromUnifiedSession()`.

- Input: FormData with `audio` file (max 25MB)
- Output: `{ transcript: string, duration: number, processingTime: number }`
- Model: `whisper-1`, language: `en`, response_format: `verbose_json`

### 4. Component — EditableSynthesisBlock

Replaces `SynthesisBlock`. Follows the same state machine as `EditableField` (VIEW | EDIT | REFINING | HISTORY) but styled to match synthesis section aesthetics.

Props:
```typescript
interface EditableSynthesisBlockProps {
  label: string;
  sectionKey: string;       // e.g., 'companyOverview'
  content: string;
  versions?: Version[];
  color?: string;            // Label accent color
  onSave: (content: string, source: 'manual' | 'refined') => void;
  // Optional: external refinement state from global mode
  pendingRefinement?: { refinedContent: string; changeSummary: string } | null;
  onAcceptRefinement?: () => void;
  onRejectRefinement?: () => void;
}
```

States:
- **VIEW**: Shows content with hover-reveal edit/refine icons (pencil + sparkle)
- **EDIT**: Textarea for manual editing with Save/Cancel
- **REFINING**: Loading spinner while AI processes, then shows refined preview with Accept/Reject
- **HISTORY**: Version pill click shows historical content with Restore/Cancel

The `pendingRefinement` prop allows the global mode to inject refinement results into individual blocks for per-section accept/reject.

Key behaviors:
- Inline refine input appears below content (always visible in VIEW state, like EditableField)
- Version pills appear at bottom when versions exist
- Calls `/api/central-command/refine` with `{ currentContent: content, prompt, fieldName: sectionKey }`
- On save, calls `onSave(newContent, source)` — parent handles persistence

### 5. Component — SynthesisGlobalRefine

Prompt bar + mic button rendered in the CLIENT INTELLIGENCE section header.

Props:
```typescript
interface SynthesisGlobalRefineProps {
  currentSynthesis: EnrichmentFindings;
  onRefinementComplete: (updates: Record<string, { refinedContent: string; changeSummary: string }>) => void;
}
```

UI:
- Text input + mic button + submit button, inline in the section header row
- Mic button toggles VoiceRecorder (with lower min/max durations than Clarity Canvas — `minDuration: 5`, `maxDuration: 300`)
- On voice recording complete: upload to `/api/central-command/transcribe`, get transcript, auto-submit to `/api/central-command/refine-synthesis`
- On text submit: send to `/api/central-command/refine-synthesis`
- Loading state: show "Analyzing..." indicator
- On response: parent distributes `pendingRefinement` props to affected `EditableSynthesisBlock` components (per-section accept/reject)

### 6. ClientDetailModal Integration

Replace the current CLIENT INTELLIGENCE section:

```tsx
// Before
<Section title="CLIENT INTELLIGENCE">
  <div className="space-y-4">
    <SynthesisBlock label="Company Overview" content={enrichmentFindings.companyOverview} />
    {/* ... 5 more */}
  </div>
</Section>

// After
<Section
  title="CLIENT INTELLIGENCE"
  headerRight={
    <SynthesisGlobalRefine
      currentSynthesis={enrichmentFindings}
      onRefinementComplete={handleGlobalRefinement}
    />
  }
>
  <div className="space-y-4">
    <EditableSynthesisBlock
      label="Company Overview"
      sectionKey="companyOverview"
      content={enrichmentFindings.companyOverview || ''}
      versions={synthesisVersions?.companyOverview}
      onSave={(content, source) => handleSynthesisSave('companyOverview', content, source)}
      pendingRefinement={pendingRefinements?.companyOverview}
      onAcceptRefinement={() => handleAcceptSection('companyOverview')}
      onRejectRefinement={() => handleRejectSection('companyOverview')}
    />
    {/* ... 5 more */}
  </div>
</Section>
```

State management in ClientDetailModal:
- `pendingRefinements: Record<string, { refinedContent: string; changeSummary: string }> | null` — set by global refinement response
- `handleGlobalRefinement(updates)` — sets pendingRefinements state
- `handleAcceptSection(key)` — persists that section, removes from pendingRefinements
- `handleRejectSection(key)` — removes from pendingRefinements
- `handleSynthesisSave(key, content, source)` — PATCHes `enrichmentFindings` with merged section update + adds version to `enrichmentFindingsVersions`

### 7. PATCH Handler — Enrichment Versioning

Add to `updateProspectSchema`:
```typescript
enrichmentFindings: z.any().optional(),
enrichmentFindingsVersions: z.any().optional(),
```

In the PATCH handler, add enrichmentFindings update logic:
```typescript
if (data.enrichmentFindings !== undefined) {
  // Merge: take existing enrichmentFindings, overlay changed sections
  const existing = (prospect.enrichmentFindings as EnrichmentFindings) || {};
  const updated = { ...existing, ...data.enrichmentFindings };
  clientUpdates.enrichmentFindings = updated as unknown as Prisma.InputJsonValue;
}

if (data.enrichmentFindingsVersions !== undefined) {
  clientUpdates.enrichmentFindingsVersions = data.enrichmentFindingsVersions as unknown as Prisma.InputJsonValue;
}
```

The client builds the complete updated version structure before sending the PATCH. Per-section versioning pattern:

```typescript
// Client-side: build updated versions for a single section change
function buildSynthesisVersionUpdate(
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

The PATCH handler stores the full `enrichmentFindingsVersions` object — it does not need to do per-section merging since the client sends the complete updated structure.

### 8. Section Component — headerRight Prop

The existing `Section` component in ClientDetailModal needs a `headerRight` prop to accommodate the global refine bar:

```typescript
function Section({ title, headerRight, children }: {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode
}) {
```

---

## User Experience

### Targeted Refinement Flow
1. User sees synthesis sections in CLIENT INTELLIGENCE
2. Each section has a subtle "Refine with AI..." input below the text (like EditableField)
3. User types "Add context about their Series B fundraise" → presses Enter
4. Section shows loading, then refined preview in italic
5. User clicks Accept or Reject
6. On accept, section updates and version pill appears (v2(R))

### Global Refinement Flow
1. User clicks mic button in section header (or types in the global prompt bar)
2. Voice recording: waveform visualization, stop when done
3. Audio transcribed → sent to refine-synthesis API
4. Response returns: e.g., companyOverview and painAndBlockers were updated
5. Those 2 sections show their refined previews with individual Accept/Reject buttons
6. Other 4 sections remain unchanged
7. User can accept one and reject the other independently

### Manual Edit Flow
1. User clicks pencil icon on a section
2. Textarea appears with current content
3. User edits directly, clicks Save
4. Version added as source: 'manual'

---

## Testing Approach

- **Targeted refinement**: Verify inline prompt → API call → preview → accept/reject → PATCH with correct enrichmentFindings merge
- **Global refinement**: Verify prompt → refine-synthesis API → per-section previews → individual accept/reject → correct sections persisted
- **Voice input**: Verify recording → transcribe → prompt auto-submission → results display
- **Version history**: Verify versions accumulate per-section, version pills render, restore works
- **Manual edit**: Verify textarea edit → save → version added
- **Edge cases**: Empty sections (no content yet — should still be editable), all sections rejected after global refine, refine on section with no prior versions

---

## Open Questions

None — all clarifications resolved in ideation.

---

## Future Improvements and Enhancements

**Out of scope for initial implementation:**

- **Streaming refinement responses** — Show refined text appearing word-by-word instead of all-at-once
- **Batch version grouping** — Tag versions from a single global refinement as a batch so they can be reviewed/restored together
- **Re-extract from additional text** — Append new text dump and re-run extraction to update synthesis (separate from refinement)
- **Score assessment refinement** — Allow prompts to also update the 5 scoring dimensions
- **Diff highlighting** — Visually highlight the specific words/sentences that changed within a section
- **Undo last refinement** — Quick undo button instead of navigating version history
- **Global refinement templates** — Preset prompts like "Update after discovery call" or "Add competitor context"
- **Section reordering** — Allow users to reorder synthesis sections by importance
- **Cross-prospect context** — When refining, optionally pull in context from other prospects in the pipeline for competitive analysis

---

## References

- **Ideation doc:** `docs/ideation/synthesis-refinement-via-prompt.md`
- **Portable pattern:** `docs/clarity-canvas/prompt-based-text-iteration.md`
- **Existing EditableField:** `app/central-command/components/EditableField.tsx`
- **Existing VoiceRecorder:** `app/clarity-canvas/components/VoiceRecorder.tsx`
- **Existing refine endpoint:** `app/api/central-command/refine/route.ts`
- **Existing transcribe endpoint:** `app/api/clarity-canvas/transcribe/route.ts`
- **Pipeline dashboard spec:** `specs/feat-central-command-pipeline-dashboard.md`
