# Synthesis Refinement Guide

**Feature:** Prompt-based LLM refinement for Central Command synthesis sections
**Implementation Date:** February 2026
**Related Docs:** `docs/clarity-canvas/prompt-based-text-iteration.md`, `specs/feat-synthesis-refinement.md`

---

## Overview

The synthesis refinement feature allows users to iteratively improve the 6 Client Intelligence synthesis sections (companyOverview, goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach) using AI-powered refinement. It supports two modes:

1. **Global Refinement** — Single typed or voice prompt that can update multiple sections simultaneously
2. **Targeted Refinement** — Inline prompt scoped to a single section

Both modes include manual textarea editing, per-section version history (up to 10 versions), and accept/reject previews.

### Why This Exists

After AI extracts a client synthesis from raw text during prospect intake, the synthesis is initially read-only. This feature enables users to:
- Add context as they learn more about a prospect
- Correct inaccuracies discovered during discovery calls
- Evolve the synthesis over time without re-running full extraction
- Use voice for quick updates (e.g., "They just closed Series B fundraise")

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Global Refinement                        │
│  User types/speaks → SynthesisGlobalRefine                  │
│    → /api/central-command/transcribe (if voice)             │
│    → /api/central-command/refine-synthesis                  │
│    → Returns { updatedSections: Record<string, {...}> }     │
│    → Sets pendingRefinements state                          │
│    → Each EditableSynthesisBlock shows preview              │
│    → User accepts/rejects per section                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Targeted Refinement                       │
│  User types in section input → EditableSynthesisBlock       │
│    → /api/central-command/refine (existing endpoint)        │
│    → Returns { refinedContent, changeSummary }              │
│    → Shows preview with Accept/Reject                       │
│    → On accept: PATCH with content + version                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Manual Edit                             │
│  User clicks pencil → textarea → Save                       │
│    → PATCH with content + version (source: 'manual')        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Version History                           │
│  Click version pill → Shows content in italic               │
│    → Click Restore → Saves as new 'manual' version          │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

**Database (Prisma):**
```prisma
model PipelineClient {
  // ... other fields
  enrichmentFindings        Json?  // { companyOverview: string, goalsAndVision: string, ... }
  enrichmentFindingsVersions Json?  // { companyOverview: Version[], goalsAndVision: Version[], ... }
}
```

**TypeScript Types:**
```typescript
// lib/central-command/types.ts
export type SynthesisVersions = {
  [K in keyof Omit<EnrichmentFindings, 'scoreAssessments'>]?: Version[];
};

// lib/central-command/utils.ts
export interface Version {
  version: number;
  content: string;
  source: 'generated' | 'manual' | 'refined';
  createdAt: string; // ISO date
}
```

**Version Building (Client-Side):**
```typescript
// lib/central-command/utils.ts
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

function addVersion(existing: Version[] | null, content: string, source: Version['source']): Version[] {
  const versions = existing || [];
  return [...versions, { version: versions.length + 1, content, source, createdAt: new Date().toISOString() }].slice(-10); // Cap at 10
}
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| **Data Layer** |
| `prisma/schema.prisma` | Added `enrichmentFindingsVersions Json?` to PipelineClient |
| `lib/central-command/types.ts` | `SynthesisVersions` type definition |
| `lib/central-command/schemas.ts` | `refineSynthesisRequestSchema`, `refineSynthesisResponseSchema` |
| `lib/central-command/utils.ts` | `buildSynthesisVersionUpdate()` client-side utility |
| **API Routes** |
| `app/api/central-command/refine-synthesis/route.ts` | Global multi-section refinement endpoint |
| `app/api/central-command/transcribe/route.ts` | Voice transcription with CC auth |
| `app/api/central-command/refine/route.ts` | Existing single-field refinement (reused for targeted mode) |
| `app/api/central-command/prospects/[id]/route.ts` | PATCH handler with enrichmentFindings/enrichmentFindingsVersions merge |
| **Components** |
| `app/central-command/components/EditableSynthesisBlock.tsx` | Per-section editing with VIEW/EDIT/REFINING/HISTORY states |
| `app/central-command/components/SynthesisGlobalRefine.tsx` | Global prompt bar + mic button |
| `app/central-command/components/ClientDetailModal.tsx` | Wiring + state management |
| **Prompts** |
| `lib/central-command/prompts.ts` | `SYNTHESIS_REFINEMENT_SYSTEM_PROMPT` for global mode |

---

## Step-by-Step Tutorials

### Adding a New Synthesis Section

If you need to add a 7th section to the synthesis (e.g., "competitiveContext"):

**1. Update the Schema**

```typescript
// lib/central-command/schemas.ts - clientSynthesisSchema
export const clientSynthesisSchema = z.object({
  // ... existing sections
  competitiveContext: z.string().describe('Competitors they mentioned, alternatives considered, differentiation needs'),
});
```

**2. Update the Type**

```typescript
// lib/central-command/types.ts
export interface EnrichmentFindings {
  // ... existing sections
  competitiveContext?: string;
}
```

**3. Add to ClientDetailModal**

```tsx
// app/central-command/components/ClientDetailModal.tsx
<EditableSynthesisBlock
  label="Competitive Context"
  sectionKey="competitiveContext"
  content={enrichmentFindings.competitiveContext || ''}
  versions={parseVersions(synthesisVersions?.competitiveContext)}
  onSave={(content, source) => handleSynthesisSave('competitiveContext', content, source)}
  pendingRefinement={pendingRefinements?.competitiveContext}
  onAcceptRefinement={() => handleAcceptSection('competitiveContext')}
  onRejectRefinement={() => handleRejectSection('competitiveContext')}
/>
```

**4. Update the Global Refinement Prompt**

```typescript
// lib/central-command/prompts.ts - SYNTHESIS_REFINEMENT_SYSTEM_PROMPT
- **competitiveContext**: Competitors mentioned, alternatives considered, differentiation
```

That's it! The section is now fully integrated with refinement, versioning, and accept/reject.

### Customizing Refinement Behavior

To change how the AI refines sections, update the system prompt:

```typescript
// lib/central-command/prompts.ts
export const SYNTHESIS_REFINEMENT_SYSTEM_PROMPT = `You are refining a client intelligence synthesis for 33 Strategies...

## Rules

1. ONLY include sections in your response that you actually changed
2. If the prompt only relates to one section, only return that one section
3. Preserve all existing information — add to it, don't replace (unless user explicitly asks)
4. Maintain professional, analytical tone
5. When adding new info, integrate it naturally
6. Keep sections focused — don't mix concerns
7. [ADD YOUR CUSTOM RULE HERE]
`;
```

The AI response schema is defined in `schemas.ts`:

```typescript
export const refineSynthesisResponseSchema = z.object({
  updatedSections: z.record(
    z.string(), // section key (e.g., "companyOverview")
    z.object({
      refinedContent: z.string(),
      changeSummary: z.string(), // Shown in badge: "Added Series B context"
    })
  ),
});
```

### Adding Voice Recording to Other Features

The inline voice recording pattern in `SynthesisGlobalRefine` can be extracted for reuse:

**Pattern:**
1. MediaRecorder with opus codec
2. State management: `'idle' | 'recording' | 'transcribing' | 'refining'`
3. Upload to `/api/central-command/transcribe` (or create similar endpoint with appropriate auth)
4. Auto-submit transcript to your refinement endpoint

**Key Code:**

```typescript
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
  });

  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) audioChunksRef.current.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    stream.getTracks().forEach((track) => track.stop());
    handleRecordingComplete(audioBlob);
  };

  mediaRecorder.start(100);
  mediaRecorderRef.current = mediaRecorder;
}

async function handleRecordingComplete(audioBlob: Blob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const res = await fetch('/api/central-command/transcribe', {
    method: 'POST',
    body: formData,
  });

  const { transcript } = await res.json();
  // Use transcript...
}
```

---

## Testing Strategies

### Manual Testing Flow

**1. Targeted Refinement:**
```
1. Open Central Command → select a prospect with enrichmentFindings
2. Hover over a synthesis section → icons appear
3. Click "Refine with AI" input
4. Type: "Add context about their Series B fundraise"
5. Press Enter → loading → preview appears in italic
6. Verify changeSummary shows: "Added Series B context"
7. Click Accept → section updates, version pill shows "v2(R)"
8. Click version pill → shows previous version → click Restore
9. Verify new version "v3(M)" is created
```

**2. Global Refinement:**
```
1. Open prospect → CLIENT INTELLIGENCE section
2. Click mic button in header → speak: "They just raised Series B and are expanding to Europe"
3. Verify "REC" timer appears
4. Stop recording → "Transcribing..." → "Analyzing..."
5. Multiple sections show previews (e.g., companyOverview, goalsAndVision)
6. Accept companyOverview, reject goalsAndVision
7. Verify only accepted section persists
```

**3. Manual Edit:**
```
1. Hover → click pencil icon
2. Edit in textarea
3. Click Save → version "v2(M)" added
```

### API Testing

**Global Refinement:**
```bash
curl -X POST http://localhost:3033/api/central-command/refine-synthesis \
  -H "Content-Type: application/json" \
  -d '{
    "currentSynthesis": {
      "companyOverview": "SaaS platform for team collaboration...",
      "goalsAndVision": "IPO in 3 years..."
    },
    "prompt": "They just raised Series B"
  }'

# Expected response:
{
  "updatedSections": {
    "companyOverview": {
      "refinedContent": "SaaS platform for team collaboration. Recently raised Series B funding...",
      "changeSummary": "Added Series B fundraise context"
    }
  }
}
```

**Transcription:**
```bash
# Record audio.webm first, then:
curl -X POST http://localhost:3033/api/central-command/transcribe \
  -F "audio=@audio.webm"

# Expected:
{
  "transcript": "They just raised Series B and are expanding to Europe",
  "duration": 4.2,
  "processingTime": 1.3
}
```

---

## Common Issues & Solutions

### Issue: Version History Not Showing

**Symptom:** Version pills don't appear after saving.

**Cause:** Client is not sending `enrichmentFindingsVersions` in PATCH request.

**Solution:** Verify `handleSynthesisSave` calls `buildSynthesisVersionUpdate`:

```typescript
async function handleSynthesisSave(key: string, content: string, source: 'manual' | 'refined') {
  const newVersions = buildSynthesisVersionUpdate(synthesisVersions, key, content, source);
  await handleUpdate({
    enrichmentFindings: { [key]: content },
    enrichmentFindingsVersions: newVersions, // Must include this!
  });
}
```

### Issue: Global Refinement Overwrites All Sections

**Symptom:** When global refinement affects 2 sections, all 6 sections get overwritten.

**Cause:** PATCH handler not merging `enrichmentFindings` correctly.

**Solution:** Verify PATCH handler in `prospects/[id]/route.ts`:

```typescript
if (data.enrichmentFindings !== undefined) {
  const existingFindings = (existing.enrichmentFindings as Record<string, unknown>) || {};
  const updated = { ...existingFindings, ...data.enrichmentFindings }; // Merge!
  clientUpdates.enrichmentFindings = updated as unknown as Prisma.InputJsonValue;
}
```

### Issue: Empty Refinement Response

**Symptom:** User submits global prompt, nothing happens.

**Cause:** AI returned empty `updatedSections` (no sections needed changes).

**Solution:** Handle in `SynthesisGlobalRefine.tsx`:

```typescript
const data = await res.json();

if (!data.updatedSections || Object.keys(data.updatedSections).length === 0) {
  setState('idle');
  setError('No sections needed changes based on your input.');
  return;
}
```

### Issue: TypeScript Error on `parseVersions` Call

**Symptom:** `Type 'Version[] | undefined' is not assignable to type 'unknown'`

**Cause:** Unnecessary `as unknown` cast.

**Solution:** Remove the cast — `parseVersions` already accepts `unknown`:

```typescript
// CORRECT:
versions={parseVersions(synthesisVersions?.companyOverview)}

// WRONG:
versions={parseVersions(synthesisVersions?.companyOverview as unknown)}
```

### Issue: Race Condition — Lost Version History

**Symptom:** User A edits section X, then user B edits section Y, and section X loses its version history.

**Cause:** Server replaces entire `enrichmentFindingsVersions` instead of merging.

**Solution:** Verify PATCH handler merges versions:

```typescript
if (data.enrichmentFindingsVersions !== undefined) {
  const existingVersions = (existing.enrichmentFindingsVersions as Record<string, unknown>) || {};
  const updated = { ...existingVersions, ...data.enrichmentFindingsVersions }; // Merge!
  clientUpdates.enrichmentFindingsVersions = updated as unknown as Prisma.InputJsonValue;
}
```

---

## Future Enhancements

**Identified during review but deferred:**

1. **Bulk Accept/Reject for Global Refinements**
   - When global refinement affects 4+ sections, add "Accept All" button
   - Reduces clicking fatigue

2. **Keyboard Shortcuts**
   - `⌘E` to edit a section
   - `⌘R` to focus refine input
   - `⌘⏎` to submit refinement

3. **Diff View for Version Comparison**
   - Use `diff` library to highlight what changed between versions
   - Show additions in green, deletions in red

4. **Streaming Refinement Responses**
   - Show refined text appearing word-by-word (Vercel AI SDK supports this)
   - Better UX for longer synthesis sections

5. **Batch Version Grouping**
   - Tag all versions from a single global refinement as a "batch"
   - Allow reviewing/restoring batch as a unit

6. **Re-extraction from Additional Text**
   - Append new text dump and re-run extraction to update synthesis
   - Different from refinement (which modifies existing text)

7. **Score Assessment Refinement**
   - Allow prompts to also update the 5 scoring dimensions
   - Currently only text sections are refinable

**Potential Optimizations:**

- Extract shared `useEditableContent` hook from `EditableSynthesisBlock` and `EditableField`
  - **Current decision:** Components have different needs (pendingRefinement concept), duplication is maintainable at current scale

- Extract `useVoiceRecording` hook from `SynthesisGlobalRefine`
  - **Current decision:** Inline implementation is simpler and purpose-built for compact header context

---

## Related Patterns

### Prompt-Based Text Iteration

This feature implements the portable pattern documented in `docs/clarity-canvas/prompt-based-text-iteration.md`:

**3 DB Fields:**
1. `content` — Current text
2. `versions` — Version history (JSON array)
3. `source` — Origin of current version ('generated' | 'manual' | 'refined')

**2 Endpoints:**
1. Generate — Initial AI generation
2. Refine — Iterative improvement via prompt

**UI State Machine:**
- EMPTY → PREVIEW → REFINING → HISTORY → EDIT

**This implementation extends the pattern:**
- Adds global multi-section refinement mode
- Adds voice input option
- Stores versions per-section in nested structure

### Other Applications

The same pattern is used in:
- `EditableField` for single-field refinement (notes, nextAction)
- Clarity Canvas recommendation refinement (coming soon)

---

## Security Considerations

- **Authentication:** All refinement endpoints use `isSessionValidForCentralCommand()` check
- **Input Validation:** Prompts limited to 5000 chars (global) or 1000 chars (targeted)
- **Audio Upload:** Max 25MB file size, validated server-side
- **Version Cap:** 10 versions max to prevent unbounded JSON growth

---

## Performance Notes

- **Version Storage:** Each section can store up to 10 versions × ~500 chars average = ~5KB per section
- **6 sections × 5KB = ~30KB** total for full version history — negligible
- **Refinement Latency:**
  - Targeted: ~500-1000ms (single field, gpt-4o-mini)
  - Global: ~1500-2500ms (6 sections context, gpt-4o-mini)
  - Transcription: ~1000-2000ms (Whisper-1, 30s audio)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-05 | Initial implementation with global + targeted refinement |
| 2026-02-05 | Fixed: Removed unnecessary `as unknown` casts |
| 2026-02-05 | Fixed: Added server-side merge for `enrichmentFindingsVersions` to prevent race conditions |
| 2026-02-05 | Fixed: Added empty response handling in `SynthesisGlobalRefine` |
