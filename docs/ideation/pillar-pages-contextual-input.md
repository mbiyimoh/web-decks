# Pillar-Level Canvas Pages & Contextual Input

**Slug:** pillar-pages-contextual-input
**Author:** Claude Code
**Date:** 2026-02-04
**Branch:** preflight/pillar-pages-contextual-input
**Related:** `docs/ideation/braindump-reviewable-recommendations.md`, `docs/clarity-canvas/prompt-based-text-iteration.md`

---

## 1) Intent & Assumptions

- **Task brief:** Transform the Clarity Canvas section/pillar experience from modal overlays (`SectionDetail.tsx`) to dedicated routed pages (`/clarity-canvas/[pillar]`), and add the ability to contribute context via type, speak, or file upload (.md/.pdf/.txt) at two scopes: pillar-global (all subsections) and sub-section-specific.

- **Assumptions:**
  - The existing reviewable recommendations flow (extract-only -> review cards -> approve/reject/refine -> commit) is reused as-is for the review experience within pillar pages
  - The existing VoiceRecorder component is reused for voice input
  - The extract API will be extended with a `scope` parameter to constrain extraction to a specific section or subsection
  - The commit API works as-is (it already accepts arbitrary field targets)
  - File upload (.md, .pdf, .txt) is new functionality that extracts text and feeds it into the same extraction pipeline
  - No database schema changes needed — file content becomes text that enters the existing extraction flow
  - The main canvas overview (`/clarity-canvas`) continues to show the orbital/list visualization with profile scores

- **Out of scope:**
  - Changing the extraction model or prompts (already tuned separately)
  - OCR for scanned PDFs (text-based PDFs only for v1)
  - Drag-and-drop file upload (click-to-upload is sufficient for v1)
  - Real-time collaboration or multi-user editing
  - Version history for individual field values (future enhancement)
  - Changes to the scoring system or profile visualization
  - The main brain dump flow on `/clarity-canvas` (stays as-is)

---

## 2) Pre-reading Log

- `docs/ideation/braindump-reviewable-recommendations.md`: The reviewable recommendations pattern — extract-only AI pipeline, client-side review cards with approve/reject/refine, commit to DB. This is the exact pattern we reuse for pillar-level and subsection-level context input. Key building blocks: `RecommendationReview`, `RecommendationCard`, extract API, commit API, refine API.

- `docs/clarity-canvas/prompt-based-text-iteration.md`: Prompt-based text editing via LLM refinement. The refine endpoint pattern (current text + user instruction -> LLM -> refined text) is already implemented in `/api/clarity-canvas/refine`. Reusable as-is within pillar pages.

- `app/clarity-canvas/ClarityCanvasClient.tsx`: Main flow orchestrator with state machine (`welcome -> brain-dump -> recording -> processing -> review -> profile`). Currently handles section clicks by setting `selectedSectionKey` state, which renders `SectionDetail` modal. This is the component that needs to change from modal-open to route-navigation.

- `app/clarity-canvas/components/SectionDetail.tsx`: Current modal implementation. Fixed fullscreen overlay (z-50) showing section header, subsection list, field details with completion dots. This component's content (subsection cards, field display) will be migrated to the new pillar page component.

- `app/clarity-canvas/components/ProfileVisualization.tsx`: Wrapper that renders either `ListView` or `OrbitalView`. Both accept `onSectionClick` callback. Currently calls `setSelectedSectionKey` — will change to `router.push()` or `<Link>`.

- `app/clarity-canvas/components/ListView.tsx`: List of section cards with progress bars and subsection previews. Each card has `onClick={() => onSectionClick?.(section.key)}`.

- `app/clarity-canvas/components/OrbitalView.tsx`: Circular SVG visualization. Section nodes call `onSectionClick?.(section.key)` on click.

- `app/api/clarity-canvas/extract/route.ts`: Extraction API. Currently accepts `{ transcript, sourceType }` with NO scope filtering — always extracts across all 6 sections. Needs `scope` parameter to constrain to a specific section/subsection.

- `app/api/clarity-canvas/transcribe/route.ts`: Voice transcription via OpenAI Whisper. Accepts FormData with audio blob, returns transcript string. Fully reusable.

- `lib/clarity-canvas/profile-structure.ts`: Complete PROFILE_STRUCTURE with 6 sections, 21 subsections, 81 fields. Each section has name, icon, order, and nested subsection/field definitions. `FIELD_DISPLAY_NAMES` maps all 81 field keys to display names.

- `lib/clarity-canvas/types.ts`: Type definitions including `ExtractionChunk`, `ExtractOnlyResponse`, `CommitRecommendationsRequest/Response`, `Recommendation`, `ProfileWithSections`, `ProfileScores`.

- `lib/clarity-canvas/prompts.ts`: Extraction prompts. The `BRAIN_DUMP_EXTRACTION_PROMPT` lists all sections/subsections/fields. A scoped extraction would need a modified prompt that only lists the target section's fields.

- `app/clarity-canvas/components/VoiceRecorder.tsx`: Reusable voice recording component with waveform visualization, min/max duration, returns Blob + duration. Props: `onRecordingComplete`, `minDuration`, `maxDuration`.

---

## 3) Codebase Map

- **Primary components/modules:**
  - `app/clarity-canvas/ClarityCanvasClient.tsx` — Flow orchestrator, needs to change section click from modal to navigation
  - `app/clarity-canvas/components/SectionDetail.tsx` — Current modal, content migrates to pillar page
  - `app/clarity-canvas/components/ProfileVisualization.tsx` — Wrapper, `onSectionClick` behavior changes
  - `app/clarity-canvas/components/ListView.tsx` — Section cards, click behavior changes to Link
  - `app/clarity-canvas/components/OrbitalView.tsx` — SVG viz, click behavior changes to Link
  - `app/clarity-canvas/components/RecommendationReview.tsx` — Reusable review screen (scoped version needed)
  - `app/clarity-canvas/components/RecommendationCard.tsx` — Reusable recommendation card (no changes)
  - `app/clarity-canvas/components/VoiceRecorder.tsx` — Reusable voice input (no changes)
  - NEW: `app/clarity-canvas/[pillar]/page.tsx` — Server component for pillar page
  - NEW: `app/clarity-canvas/[pillar]/PillarPageClient.tsx` — Client component for pillar page
  - NEW: `app/clarity-canvas/components/ContextInput.tsx` — Shared type/speak/upload input component
  - NEW: `app/api/clarity-canvas/upload/route.ts` — File upload + text extraction endpoint

- **Shared dependencies:**
  - `lib/clarity-canvas/profile-structure.ts` — Section/field metadata, used for scoping
  - `lib/clarity-canvas/types.ts` — Type definitions (extend for scope)
  - `lib/clarity-canvas/prompts.ts` — Extraction prompts (extend for scoped extraction)
  - `lib/clarity-canvas/key-matching.ts` — Fuzzy key matching (used by extract/commit)
  - `lib/clarity-canvas/scoring.ts` — Score calculation (used after commit)
  - `framer-motion` — Page transition animations
  - `ai` / `@ai-sdk/openai` — AI SDK for extraction/refinement
  - NEW: `unpdf` or `pdf-parse` — PDF text extraction
  - NEW: `remove-markdown` — Markdown to plain text

- **Data flow:**
  ```
  Pillar Page (/clarity-canvas/[pillar])
    -> User chooses input method (type / speak / upload file)
    -> User chooses scope (pillar-global or specific subsection)
    -> Text extraction (voice: transcribe API, file: upload API, type: direct)
    -> POST /api/clarity-canvas/extract with scope={ section, subsection? }
    -> AI extracts chunks constrained to scoped fields only
    -> RecommendationReview (scoped — only shows relevant subsections)
    -> Approve/Reject/Refine
    -> POST /api/clarity-canvas/commit
    -> Profile updated, scores recalculated
    -> Pillar page re-renders with updated data
  ```

- **Potential blast radius:**
  - `ClarityCanvasClient.tsx` — Remove modal rendering, change section click to navigation
  - `ProfileVisualization.tsx` / `ListView.tsx` / `OrbitalView.tsx` — Change `onSectionClick` to Link-based navigation
  - `extract/route.ts` — Add scope parameter to constrain extraction
  - `prompts.ts` — Add scoped extraction prompt variant
  - `types.ts` — Extend request types with scope
  - `SectionDetail.tsx` — Deprecated (content migrates to pillar page)
  - 1 new page route, 1 new client component, 1 new shared component, 1 new API route

---

## 4) Root Cause Analysis

N/A — This is a new feature, not a bug fix.

---

## 5) Research

### Potential Solutions

**A. Routing Strategy**

**Option 1: Dynamic Route `/clarity-canvas/[pillar]`** (Recommended)
- Clean URLs: `/clarity-canvas/individual`, `/clarity-canvas/role`, etc.
- Server Component can fetch profile data server-side
- Supports SSR, deep linking, browser history
- `generateStaticParams()` can pre-generate the 6 pillar slugs
- **Pros:** Clean URLs, SEO-friendly, proper page lifecycle, browser back/forward
- **Cons:** Need to handle invalid pillar slugs (404), profile data fetching per page load

**Option 2: Query Parameter `/clarity-canvas?pillar=individual`**
- Keep everything in one page, use query params to control view
- **Pros:** Simpler implementation, single page component
- **Cons:** Less clean URLs, no server-side rendering per pillar, feels like a modal with extra steps, doesn't actually give sections "room to breathe"

**Recommendation:** Option 1. Dynamic routes give each pillar a real page identity with proper routing semantics.

---

**B. Scoped Extraction Strategy**

**Option 1: Prompt-Level Scoping** (Recommended)
- Modify the extraction prompt to only list the target section's subsections/fields
- The AI only sees (and can target) fields within scope
- Invalid chunks are impossible because the schema only allows scoped field keys
- **Pros:** Most reliable scoping, fewer wasted tokens, AI focuses attention
- **Cons:** Need a prompt builder function

**Option 2: Post-Extraction Filtering**
- Send full extraction prompt, then filter returned chunks to only keep those matching the scope
- **Pros:** Simpler implementation, no prompt changes
- **Cons:** Wastes tokens extracting information that gets thrown away, AI attention spread thin across 81 fields when only 12-18 are relevant

**Recommendation:** Option 1. Prompt-level scoping is more efficient and produces better results because the AI concentrates on fewer, more relevant fields.

---

**C. File Upload & Text Extraction**

**Option 1: Server-Side Parsing with `unpdf` + `remove-markdown`** (Recommended)
- New API route `/api/clarity-canvas/upload` accepts FormData with file
- Server parses file based on MIME type:
  - `.pdf` → `unpdf` (modern, TypeScript-native, serverless-optimized)
  - `.md` → `remove-markdown` (strips formatting to plain text)
  - `.txt` → read as UTF-8 string directly
- Returns extracted text, which the client then sends to the extract API
- **Pros:** Simple two-step flow (upload → extract), reuses existing extraction pipeline, server handles parsing
- **Cons:** Two API calls (upload then extract), but keeps concerns cleanly separated

**Option 2: Client-Side Parsing**
- Parse .txt and .md in the browser, only send .pdf to server
- **Pros:** Fewer API calls for text files
- **Cons:** Can't handle PDFs client-side, inconsistent behavior between file types, harder to enforce size limits

**Option 3: Combined Upload + Extract Endpoint**
- Single endpoint that accepts file, parses it, AND runs extraction
- **Pros:** Single API call
- **Cons:** Mixes concerns, harder to test, can't reuse for other upload needs

**Recommendation:** Option 1. Clean separation — upload endpoint returns text, client feeds text into the existing extract flow. The two-step pattern matches how voice already works (transcribe → extract).

---

**D. Pillar Page Layout**

**Option 1: Subsection Accordion with Inline Input** (Recommended)
- Page shows pillar header (icon, name, score, description)
- Pillar-global "Add Context" button at the top
- Subsection cards below, each expandable to show fields
- Each subsection card has its own "Add Context" button
- When "Add Context" is clicked (either level), an input panel slides open with type/speak/upload options
- After extraction, the review flow appears inline (same page, replaces input panel)
- **Pros:** Everything on one page, minimal navigation, context stays visible
- **Cons:** Page can get long with many subsections expanded

**Option 2: Tabbed Subsections**
- Horizontal tabs for each subsection within the pillar
- **Pros:** Clean separation of subsections
- **Cons:** Loses the overview of all subsections, harder to do pillar-global input

**Recommendation:** Option 1. Accordion pattern with inline review keeps the user oriented within the pillar while supporting both scoping levels naturally.

---

**E. PDF Library Choice**

| Library | Bundle Size | Maintenance | Serverless | Text Quality |
|---------|-------------|-------------|------------|--------------|
| `unpdf` | ~50KB | Active | Optimized | Good |
| `pdf-parse` | ~15KB | Unmaintained | Works | Good |
| `pdfjs-dist` | ~2MB | Mozilla | Heavy | Best |

**Recommendation:** `pdf-parse` for v1 — it's lightweight, works well for text-based PDFs, and the unmaintained status is acceptable since PDF parsing is a stable problem domain. Upgrade to `unpdf` if issues arise.

---

### Overall Architecture Recommendation

```
/clarity-canvas                    # Overview (orbital/list viz + main brain dump)
/clarity-canvas/[pillar]           # Pillar page (subsection details + scoped input)

API:
POST /api/clarity-canvas/upload    # File → text extraction (NEW)
POST /api/clarity-canvas/extract   # Text → chunks (EXTENDED with scope param)
POST /api/clarity-canvas/commit    # Chunks → DB (UNCHANGED)
POST /api/clarity-canvas/refine    # Chunk → refined chunk (UNCHANGED)
POST /api/clarity-canvas/transcribe # Audio → text (UNCHANGED)
```

The key insight is that **all input methods (type, speak, upload) converge on the same pipeline**: they produce text, which is fed to the scoped extract API, which returns chunks for the review UI. The only new API is the upload endpoint that converts files to text.

---

## 6) Clarification

1. **Pillar page URL structure:** Should pillar pages use the section key as the slug (`/clarity-canvas/individual`) or a more readable name (`/clarity-canvas/who-you-are`)? The key is simpler and matches the data model; a readable name is more user-friendly but adds a mapping layer.
>> match data structure

2. **Navigation from overview:** When clicking a section in the orbital/list view, should it navigate immediately to the pillar page, or should there be a transition animation (e.g., the section card expanding into the page)? Immediate navigation is simpler; animated transition feels more polished but adds complexity.
>> animated transition would be great

3. **File size limits:** What's the maximum file size for uploads? Recommendation: 5MB for PDFs, 1MB for .md/.txt. This keeps within OpenAI token limits and serverless constraints.
>> your recs are fine. lets also add doc/docx with whatever reasonable max size as well

4. **Multiple file upload:** Should users be able to upload multiple files at once, or one at a time? One-at-a-time is simpler and lets the user review recommendations from each file separately. Multiple files could batch-extract but makes the review screen more complex.
>> one at a time is fine for now

5. **Pillar-global vs subsection input placement:** For pillar-global "Add Context," should the input appear at the top of the page (before subsections) or as a floating action button? Top placement is more discoverable; FAB is less intrusive.
>> both: an input section that animation-collapses into the fab, which then just opens a floating version of that text input area wherever you are on the page. the fab should also double check whether you actual want this feedback to apply globally vs to a specific section, even if there's technically a separate button in each section for specifically doing that

6. **Back navigation:** When the user finishes reviewing/committing recommendations on a pillar page, should they stay on the pillar page (seeing updated field values) or return to the canvas overview? Staying on the pillar page seems natural since they're actively working on that section.
>> yes, stay on the pillar page. And we should show them a summary of all of the updates that have been made, and show them how it's improved our score of the amount of context or clarity in that section, which should animate up to whattever new score that section has been given. read 'gamified-score-improvement-summary-recap.md' and follow that pattern while obviously adapting it for use in this project

7. **SectionDetail modal fate:** Should the `SectionDetail` modal be removed entirely, or kept as a quick-peek option alongside the full pillar page? Removing it simplifies the codebase; keeping it provides a lightweight alternative for users who just want to glance at a section without navigating away.
>> remove it

8. **Minimum voice duration for scoped input:** The main brain dump requires 30 seconds minimum. For scoped pillar/subsection input (which is more focused), should the minimum be shorter? Recommendation: 10 seconds for subsection-level, 20 seconds for pillar-level.
>> those seem like reasonable minimums
