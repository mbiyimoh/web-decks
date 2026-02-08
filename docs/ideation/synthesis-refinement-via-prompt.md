# Prompt-Based LLM Refinement for Synthesis Sections

**Slug:** synthesis-refinement-via-prompt
**Author:** Claude Code
**Date:** 2026-02-04
**Related:** `docs/clarity-canvas/prompt-based-text-iteration.md` (portable pattern)

---

## 1) Intent & Assumptions

**Task brief:** Add prompt-based LLM refinement to the Client Intelligence synthesis sections in Central Command's ClientDetailModal. Two modes: (1) **global refinement** — a single prompt (typed or via mic) that can update multiple synthesis sections at once, and (2) **targeted refinement** — an inline prompt scoped to one specific section. Both follow the existing prompt-based text iteration pattern with version history.

**Assumptions:**
- Synthesis sections are persisted as a single `enrichmentFindings` JSON blob on `PipelineClient`
- We can add version tracking to the JSON structure without a DB migration (versions stored inside the JSON itself, or in a new `enrichmentFindingsVersions` JSON field)
- The existing `/api/central-command/refine` endpoint can be extended for both modes (or a parallel `/api/central-command/refine-synthesis` endpoint created)
- The existing `VoiceRecorder` component and `/api/clarity-canvas/transcribe` endpoint are reusable for the mic input
- `EditableField` is the right base pattern for per-section targeted refinement
- Score assessments within enrichmentFindings are NOT editable via this feature (only the 6 text sections)

**Out of scope:**
- Re-running the full extraction (that's a separate "re-extract" feature)
- Editing score assessments via prompt
- Real-time collaborative editing
- Mobile-optimized voice recording UX

---

## 2) Pre-reading Log

- `docs/clarity-canvas/prompt-based-text-iteration.md`: Defines the portable recipe — 3 DB fields (content, versions, source), 2 endpoints (generate, refine), UI state machine (EMPTY → PREVIEW → EDIT/REFINE/HISTORY). Version utility caps at 10.
- `app/central-command/components/EditableField.tsx`: Full implementation of per-field refinement. States: VIEW | EDIT | REFINING | HISTORY. Calls `/api/central-command/refine` with `{ currentContent, prompt, fieldName }`. Returns `{ refinedContent, changeSummary }`. Already has version pills, accept/reject flow.
- `app/central-command/components/SynthesisBlock.tsx`: Read-only display component. Props: `{ label, content, color }`. No editing capability.
- `app/central-command/components/ClientDetailModal.tsx` (lines 394-418): Renders 6 SynthesisBlocks inside a "CLIENT INTELLIGENCE" Section. Each conditionally rendered based on content existence.
- `app/api/central-command/refine/route.ts`: Single-field refinement. Uses `gpt-4o-mini` with `PIPELINE_REFINEMENT_SYSTEM_PROMPT`. Response schema: `{ refinedContent, changeSummary }`.
- `lib/central-command/prompts.ts` (lines 69-78): `PIPELINE_REFINEMENT_SYSTEM_PROMPT` — generic "apply the requested change, preserve unrelated info, keep it professional."
- `lib/central-command/schemas.ts`: `refineRequestSchema` = `{ currentContent, prompt, fieldName }`. `refinementResponseSchema` = `{ refinedContent, changeSummary }`.
- `prisma/schema.prisma` (line 456): `enrichmentFindings Json?` — single JSON blob, no version tracking field yet.
- `app/api/central-command/prospects/[id]/route.ts` (lines 114-183): Versioned update pattern for notes, nextAction, lessonsLearned, reengageNotes. Uses `addVersion()` utility.
- `app/clarity-canvas/components/VoiceRecorder.tsx`: MediaRecorder with opus codec, waveform visualization, min/max duration, auto-stop. Returns `(blob, duration)`.
- `app/api/clarity-canvas/transcribe/route.ts`: Whisper transcription. Input: FormData with audio. Output: `{ transcript, duration, processingTime }`. Uses `ensureUserFromUnifiedSession()` for auth.

---

## 3) Codebase Map

**Primary components/modules:**
- `ClientDetailModal.tsx` — where synthesis sections are rendered (will host both refinement modes)
- `SynthesisBlock.tsx` — read-only display (will be replaced or enhanced)
- `EditableField.tsx` — existing per-field edit/refine/history pattern (template for targeted mode)
- `VoiceRecorder.tsx` — existing mic recording component (reusable for global mode)

**Shared dependencies:**
- `lib/central-command/utils.ts` — `addVersion()`, `Version` interface
- `lib/central-command/schemas.ts` — refine request/response schemas
- `lib/central-command/prompts.ts` — refinement system prompt
- `lib/central-command/types.ts` — `EnrichmentFindings`, `EnrichmentScoreAssessment`
- `components/portal/design-tokens` — colors, backgrounds

**Data flow:**
- User prompt → `/api/central-command/refine` (or new `/refine-synthesis`) → LLM generates updated section(s) → UI shows diff/preview → user accepts → PATCH `/api/central-command/prospects/[id]` with updated `enrichmentFindings` JSON

**Potential blast radius:**
- `ClientDetailModal.tsx` — significant UI additions
- `SynthesisBlock.tsx` — likely replaced with an enhanced component
- `/api/central-command/refine/route.ts` or new route — endpoint changes
- `schemas.ts` — new schema for multi-section refinement
- `prompts.ts` — new system prompt for global refinement
- `prisma/schema.prisma` — possibly new `enrichmentFindingsVersions` field
- PATCH route — needs to handle `enrichmentFindings` updates with versioning

---

## 4) Root Cause Analysis

N/A — this is a new feature, not a bug fix.

---

## 5) Research

### Approach A: Enhance SynthesisBlock with EditableField-like Behavior (Targeted Mode)

Replace each `SynthesisBlock` with an `EditableSynthesisBlock` that wraps or extends `EditableField` semantics, but operates on a single key within the `enrichmentFindings` JSON blob.

**Pros:**
- Reuses the proven EditableField state machine (VIEW/EDIT/REFINING/HISTORY)
- Per-section version tracking is straightforward
- Existing `/api/central-command/refine` endpoint works as-is (single field)
- Users get the familiar refine-with-AI UX per section

**Cons:**
- Need to manage version history per-section within the JSON blob (6 parallel version arrays)
- Each section edit requires reading + merging back into the full JSON blob on save
- Could make the `enrichmentFindings` JSON large if versions accumulate

### Approach B: New "Global Refinement" Endpoint with Multi-Section Response

Create a new endpoint (`/api/central-command/refine-synthesis`) that receives the entire current synthesis + a prompt, and returns an updated synthesis object with only changed sections modified.

**Pros:**
- Single prompt can intelligently update 1-6 sections
- LLM sees full context (all sections) so cross-section coherence is maintained
- Mic input naturally maps to this — user talks about multiple topics
- Can include `changeSummary` per section so UI shows exactly what changed

**Cons:**
- New endpoint and schema needed
- Larger token usage (sending all sections as context each time)
- Need a "diff preview" UI to show which sections changed before accepting

### Approach C: Combined — Both Modes in One Implementation

Use Approach A for targeted per-section refinement and Approach B for global refinement. They share:
- Version tracking infrastructure (same data structure)
- The PATCH handler for persisting updates
- The accept/reject UX pattern

The global mode adds a top-level prompt bar + mic button above the synthesis section. The targeted mode adds per-section inline refine inputs (similar to EditableField).

**Pros:**
- Complete solution covering both user needs
- Shared infrastructure keeps code DRY
- Each mode is independently useful

**Cons:**
- More UI surface area to build
- Two API patterns (single-field vs multi-field refinement)

### Recommendation: Approach C (Combined)

This is what the user explicitly asked for — both modes. The key insight is that the **data layer and persistence are shared** between modes:

1. **Version tracking**: Store per-section versions inside `enrichmentFindings` itself (e.g., `{ companyOverview: "...", _versions: { companyOverview: Version[], ... } }`) or in a sibling `enrichmentFindingsVersions` JSON field.
2. **Persistence**: Both modes ultimately PATCH the same `enrichmentFindings` blob.
3. **Two endpoints**: Existing `/refine` for targeted (single section), new `/refine-synthesis` for global (multi-section).

### Version Storage Decision: Sibling Field vs Inline

**Option 1 — Sibling field** (`enrichmentFindingsVersions Json?`):
- Clean separation of concerns
- `enrichmentFindings` stays pure (just content)
- Requires a Prisma migration
- Structure: `{ companyOverview: Version[], goalsAndVision: Version[], ... }`

**Option 2 — Inline in JSON** (add `_versions` key to enrichmentFindings):
- No migration needed
- Mixes content and metadata
- More complex to parse

**Recommendation: Option 1 (sibling field)**. It's cleaner and the migration is trivial (one nullable JSON field).

---

## 6) Clarifications

1. **Voice recording auth**: The existing `/api/clarity-canvas/transcribe` uses `ensureUserFromUnifiedSession()` which is Clarity Canvas-specific auth. Central Command uses `isSessionValidForCentralCommand()`. Should we (a) create a separate `/api/central-command/transcribe` endpoint with CC auth, or (b) make the existing transcribe endpoint accept either auth context? Option (a) is safer and more isolated.
>> option a

2. **Version history granularity**: When global refinement updates 3 sections at once, should each section get its own version entry (3 separate version bumps), or should all 3 be tagged as a single "batch" version? Per-section versions are simpler but lose the grouping context.
>> per-section versions are fine

3. **Manual edit**: Should synthesis sections also support direct textarea editing (like EditableField's EDIT mode), or is prompt-based refinement sufficient? The prompt-based-text-iteration pattern includes manual edit as a fallback — likely worth including.
>> yes, include manual edit capability

4. **Mic button placement**: Should the mic button be (a) in the CLIENT INTELLIGENCE section header (always visible), or (b) in a floating/collapsible panel? Header placement is simpler and more discoverable.
>> header

5. **Global refinement preview**: When a global prompt updates multiple sections, should the UI show (a) a single diff view highlighting all changes, (b) per-section accept/reject (granular control), or (c) all-or-nothing accept/reject? Option (b) gives the most control but is more complex. Option (c) is simpler and probably fine for v1.
>> option b for sure

---

## 7) Implementation Sketch

### Data Layer
- Add `enrichmentFindingsVersions Json?` to `PipelineClient` (Prisma migration)
- Structure: `{ companyOverview: Version[], goalsAndVision: Version[], ... }`
- Add `enrichmentFindingsVersions` to `updateProspectSchema` in schemas.ts

### API Layer
- **Targeted**: Existing `/api/central-command/refine` works as-is
- **Global**: New `/api/central-command/refine-synthesis` endpoint
  - Input: `{ currentSynthesis: EnrichmentFindings, prompt: string }`
  - Output: `{ updatedSections: Record<string, { refinedContent: string; changeSummary: string }> }`
  - Only returns sections that actually changed
  - New system prompt that understands the 6-section structure
- **Transcription**: New `/api/central-command/transcribe` route (wraps Whisper with CC auth)

### Component Layer
- **`EditableSynthesisBlock`**: Enhanced SynthesisBlock with VIEW/EDIT/REFINING/HISTORY states + inline refine input (per-section targeted refinement)
- **`SynthesisGlobalRefine`**: Top-level prompt bar + mic button above the synthesis section (global refinement). Shows which sections were updated, all-or-nothing accept/reject.
- **ClientDetailModal**: Replace `SynthesisBlock` usage with `EditableSynthesisBlock`, add `SynthesisGlobalRefine` above them

### Persistence
- On accept (either mode): PATCH `/api/central-command/prospects/[id]` with updated `enrichmentFindings` + `enrichmentFindingsVersions`
- PATCH handler merges section updates into existing JSON blob, adds versions per section
