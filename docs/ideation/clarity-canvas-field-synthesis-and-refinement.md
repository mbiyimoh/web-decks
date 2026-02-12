# Clarity Canvas Field Synthesis and Refinement

**Slug:** clarity-canvas-field-synthesis-and-refinement
**Author:** Claude Code
**Date:** 2026-02-11
**Branch:** preflight/clarity-canvas-field-synthesis-and-refinement
**Related:** `specs/feat-raw-input-archive.md`, `docs/developer-guides/synthesis-refinement-guide.md`

---

## 1) Intent & Assumptions

- **Task brief:** Implement multi-source field synthesis in Clarity Canvas so that when multiple FieldSources contribute to a single ProfileField, the summary and fullContext represent ALL sources (not just the latest). Additionally, add: (1) ability to remove a source from a field and trigger re-synthesis, (2) prompt-based refinement at the subsection level (e.g., "Thinking Style"), and (3) prompt-based refinement at the individual field level (e.g., "Decision Making Style").

- **Assumptions:**
  - The LLM synthesis will use gpt-4o (same as extraction)
  - Re-synthesis should happen automatically when sources are added/removed
  - Refinement prompts are user-provided free-form text
  - The existing FieldSource data model is sufficient (no new tables needed)
  - Can adapt patterns from Central Command's `synthesis-refinement-guide.md`
  - Summary should be 150 chars max, fullContext up to ~400 chars (3 sentences)

- **Out of scope:**
  - Bulk refinement across multiple pillars at once
  - Version history for field/subsection refinements (can add later)
  - Automated quality scoring of syntheses
  - Voice input for refinement prompts (text-only for v1)

---

## 2) Pre-reading Log

- `docs/developer-guides/synthesis-refinement-guide.md`: **KEY REFERENCE** — Central Command already has a comprehensive refinement pattern with global + targeted modes, version tracking, and accept/reject previews. Can reuse architecture.
- `app/api/clarity-canvas/commit/route.ts` (lines 209-233): **ROOT CAUSE** — `summary` is overwritten on each commit, `fullContext` is appended. No synthesis step when multiple sources exist.
- `components/clarity-canvas/FieldCitation.tsx`: Source popover displays all sources with "View" links. Needs "Remove" button added.
- `app/clarity-canvas/[pillar]/PillarPageClient.tsx`: Field display + expandable details. Needs refinement prompt UI.
- `prisma/schema.prisma` (lines 101-159): ProfileSubsection has `summary` field (for subsection-level synthesis). ProfileField has `summary` + `fullContext`. FieldSource has `rawContent`.
- `lib/clarity-canvas/prompts.ts`: Extraction prompts exist but no synthesis/refinement prompts yet.

---

## 3) Codebase Map

### Primary Components/Modules

| File | Role |
|------|------|
| `app/api/clarity-canvas/commit/route.ts` | Commits recommendations, creates FieldSources, updates ProfileField |
| `app/clarity-canvas/[pillar]/PillarPageClient.tsx` | Pillar page with subsection cards and field rows |
| `components/clarity-canvas/FieldCitation.tsx` | Source popover (needs Remove button) |
| `lib/clarity-canvas/prompts.ts` | Extraction prompts (needs synthesis/refinement prompts) |
| `prisma/schema.prisma` | ProfileField, FieldSource, ProfileSubsection models |

### New Files Needed

| File | Purpose |
|------|---------|
| `app/api/clarity-canvas/fields/[id]/synthesize/route.ts` | Re-synthesize field from all sources |
| `app/api/clarity-canvas/fields/[id]/refine/route.ts` | Refine field via user prompt |
| `app/api/clarity-canvas/fields/[id]/sources/[sourceId]/route.ts` | DELETE source endpoint |
| `app/api/clarity-canvas/subsections/[id]/synthesize/route.ts` | Synthesize subsection summary |
| `app/api/clarity-canvas/subsections/[id]/refine/route.ts` | Refine subsection via prompt |
| `lib/clarity-canvas/synthesis.ts` | Synthesis prompts and utilities |

### Shared Dependencies

- Design tokens: `@/components/portal/design-tokens`
- Prisma client: `@/lib/prisma`
- OpenAI: `ai` SDK with `openai` provider
- User auth: `ensureUserFromUnifiedSession()`

### Data Flow

**Current (Broken):**
```
Brain dump → Extract → Commit → FieldSource created + summary OVERWRITTEN
                                 (only latest source's summary stored)
```

**Proposed (Fixed):**
```
Brain dump → Extract → Commit → FieldSource created → Synthesize ALL sources
                                                      ↓
                                              summary = aggregated
                                              fullContext = synthesized 3 sentences
```

**Source Removal:**
```
User clicks "Remove" in FieldCitation popover
  → DELETE /api/clarity-canvas/fields/{id}/sources/{sourceId}
  → Auto-triggers re-synthesis of remaining sources
  → Returns updated field data
  → UI refreshes
```

**Field Refinement:**
```
User types prompt in field row → POST /api/clarity-canvas/fields/{id}/refine
  → LLM generates refined summary + fullContext
  → Shows preview (accept/reject)
  → On accept: Updates ProfileField
```

**Subsection Refinement:**
```
User types prompt in subsection header → POST /api/clarity-canvas/subsections/{id}/refine
  → LLM generates refined subsection summary
  → Shows preview (accept/reject)
  → On accept: Updates ProfileSubsection.summary
```

### Potential Blast Radius

- `PillarPageClient.tsx` — Needs refinement UI + source removal callbacks
- `FieldCitation.tsx` — Needs Remove button per source
- Commit route — Needs to call synthesis after creating FieldSources
- 5 new API routes
- 1 new lib file for synthesis prompts

---

## 4) Root Cause Analysis

- **Repro steps:**
  1. Upload brain dump with content about "Problem Solving Approach"
  2. Content extracts and shows in field
  3. Upload second brain dump with different content about same field
  4. Second source creates FieldSource, but summary only shows source #2
  5. Click "3 sources" — all sources visible, but summary doesn't reflect all

- **Observed vs Expected:**
  - **Observed:** Summary shows only the latest source's content
  - **Expected:** Summary synthesizes ALL sources into a unified representation

- **Evidence:**
  ```typescript
  // commit/route.ts lines 226-232
  await prisma.profileField.update({
    data: {
      summary: rec.summary,        // OVERWRITES - problem!
      fullContext: newContext,     // APPENDS - correct
      confidence: rec.confidence,  // OVERWRITES
    },
  });
  ```

- **Root-cause hypotheses:**
  1. **No synthesis step** — Commit route just overwrites summary (HIGH confidence - verified)
  2. Extraction doesn't consider existing content (MEDIUM - confirmed, each extraction is independent)

- **Decision:** The commit route needs a post-processing synthesis step when a field has multiple sources.

---

## 5) Research

### Potential Solutions

**1. Inline Synthesis in Commit Route**
- After all FieldSources created, check which fields have >1 source
- Call LLM to synthesize summary + fullContext for those fields
- **Pros:** Simple, all in one transaction
- **Cons:** Adds latency to commit (1-2s per field), blocks UI during synthesis

**2. Async Synthesis Job**
- Commit creates FieldSources and marks fields as "needs_synthesis"
- Background job processes synthesis queue
- **Pros:** Fast commit, non-blocking
- **Cons:** Complexity of job queue, stale data until processed

**3. On-Demand Synthesis (Lazy)**
- Store all source rawContent, synthesize on first read if dirty
- Cache synthesized result
- **Pros:** No commit latency, always fresh
- **Cons:** First-read latency, complex cache invalidation

**4. Hybrid: Commit + Debounced Synthesis**
- Commit immediately with latest source's summary (current behavior)
- Trigger debounced synthesis after 2-3 seconds
- Update field in place when synthesis completes
- **Pros:** Fast commit, eventually consistent, good UX
- **Cons:** Temporary stale state, complexity

### Recommendation

**Option 1 (Inline Synthesis)** for v1 — simplest to implement, latency is acceptable for brain dump flow (users expect processing time). Can optimize to Option 4 later if UX feedback indicates latency is a problem.

**Key insight from Central Command pattern:** The `refine-synthesis` endpoint shows how to call LLM and return structured response with `changeSummary`. Can reuse this pattern.

---

## 6) Clarification

1. **Synthesis trigger:** Should synthesis happen:
   - (a) Automatically on every commit when field has multiple sources
   - (b) Only when user explicitly requests "Re-synthesize"
   - **Recommendation:** (a) automatic — users expect the summary to reflect all sources
   >> automatic, but anytime we do something automatic, we need to do it in a way that is transparent to the user so that it never feels like things changed without them, realizing it or knowing when or why it happened

2. **Refinement preview:** Should refinement show accept/reject preview like Central Command?
   - (a) Yes — user reviews before saving
   - (b) No — apply immediately
   - **Recommendation:** (a) with preview — consistent with CC pattern, safer UX
   >> yes, your recommendation is good

3. **Subsection synthesis:** Should subsection summary automatically synthesize from its fields?
   - (a) Yes — auto-generate from field summaries
   - (b) No — only update via explicit refinement prompt
   - **Recommendation:** (b) for v1 — keeps scope manageable, subsection refinement is the mechanism
   >> option b is fine for now

4. **Source removal confirmation:** Require confirmation dialog before removing a source?
   - (a) Yes — destructive action needs confirmation
   - (b) No — single click removes
   - **Recommendation:** (a) — data loss should require confirmation
   >> yes for sure

5. **Refinement input location:** Where should refinement prompt input appear?
   - (a) Inline in field/subsection row (always visible)
   - (b) In a modal when user clicks "Refine" button
   - (c) Expandable inline (click to show input)
   - **Recommendation:** (c) — balances discoverability with clean UI
   >> option c

---

## 7) Proposed Implementation Plan

### Phase 1: Field Synthesis on Commit
1. Create `lib/clarity-canvas/synthesis.ts` with synthesis prompts
2. Modify `commit/route.ts` to synthesize when field has >1 source
3. Test: Upload two brain dumps targeting same field, verify summary aggregates both

### Phase 2: Source Removal
1. Create `DELETE /api/clarity-canvas/fields/[id]/sources/[sourceId]/route.ts`
2. Add "Remove" button to `FieldCitation.tsx` popover
3. On remove: delete FieldSource, re-synthesize remaining sources
4. Add confirmation dialog
5. Add callback to `PillarPageClient` to refresh data after removal

### Phase 3: Field-Level Refinement
1. Create `POST /api/clarity-canvas/fields/[id]/refine/route.ts`
2. Add refinement prompt input to field row (expandable)
3. Show preview with accept/reject
4. On accept: update ProfileField, close input

### Phase 4: Subsection-Level Refinement
1. Create `POST /api/clarity-canvas/subsections/[id]/refine/route.ts`
2. Add refinement prompt input to subsection header
3. Show preview with accept/reject
4. On accept: update ProfileSubsection.summary

### API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/clarity-canvas/fields/[id]/synthesize` | Re-synthesize field from all sources |
| POST | `/api/clarity-canvas/fields/[id]/refine` | Refine field via user prompt |
| DELETE | `/api/clarity-canvas/fields/[id]/sources/[sourceId]` | Remove source, trigger re-synthesis |
| POST | `/api/clarity-canvas/subsections/[id]/refine` | Refine subsection via prompt |

---

## 8) Synthesis Prompts (Draft)

### Field Synthesis Prompt

```typescript
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
```

### Field Refinement Prompt

```typescript
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
```

### Subsection Refinement Prompt

```typescript
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

---

## 9) UI Mockups (Text)

### Field Row with Refinement

```
┌─────────────────────────────────────────────────────────────────┐
│ ● Decision Making Style ▾                         ⓘ 3 sources  │
│   Emphasizes solving personal problems; productizes solutions.  │
│                                                                 │
│   [Expanded: Click chevron to see full context]                 │
│   ├─ Beems challenges constraints and shows new possibilities,  │
│   │  encouraging radical innovation. He utilizes structured     │
│   │  frameworks with flexible execution...                      │
│   │                                                             │
│   │  [✏️ Refine with prompt...]  ← Click to expand input       │
│   └────────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────────┘
```

### Source Popover with Remove Button

```
┌──────────────────────────────────────┐
│ SOURCES                              │
├──────────────────────────────────────┤
│ TEXT  Feb 10, 2026      View | Remove│
│ Beems challenges constraints...      │
├──────────────────────────────────────┤
│ TEXT  Feb 10, 2026      View | Remove│
│ Utilizes structured frameworks...    │
├──────────────────────────────────────┤
│ TEXT  Feb 10, 2026      View | Remove│
│ Beems is a systems thinker who...    │
└──────────────────────────────────────┘
```

### Subsection Header with Refinement

```
┌─────────────────────────────────────────────────────────────────┐
│ THINKING STYLE                                    2/4 complete  │
│                                                                 │
│ [✏️ Refine subsection summary...]  ← Click to expand input     │
├─────────────────────────────────────────────────────────────────┤
│ ● Problem Solving Approach ▾                      ⓘ 3 sources  │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10) Open Questions for User

1. Should we proceed with **automatic synthesis on commit** (recommended)?
2. Should refinement show **accept/reject preview** (recommended)?
3. Any preference on **refinement input placement** (expandable inline recommended)?
4. Should source removal require **confirmation dialog** (recommended)?

Once clarified, ready to proceed with spec and implementation.
