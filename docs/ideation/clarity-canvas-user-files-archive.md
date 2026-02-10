# Raw Input Archive: Clarity Canvas + Central Command

**Slug:** raw-input-archive
**Author:** Claude Code
**Date:** 2026-02-08
**Branch:** preflight/raw-input-archive
**Related:** Clarity Canvas (6 Pillars), Central Command (Prospect Intake)

---

## 1) Intent & Assumptions

### Task Brief
Create a unified "Raw Input Archive" system that stores and surfaces all raw inputs across two platform areas:

1. **Clarity Canvas** — Voice transcripts, text brain dumps, and uploaded files that feed into the 6 profile pillars (Individual, Role, Organization, Goals, Network, Projects)
2. **Central Command** — Text dumps, meeting notes, and call transcripts that feed into prospect records during intake

The goal is **peace of mind**: users should know that even as the system synthesizes their input into polished artifacts, the original "raw truth" is always preserved and accessible. This includes both:
- **Field-level citations** — Each synthesized field links back to the specific source(s) that populated it
- **Session-level archive** — Users can revisit the complete original input (e.g., "On Jan 15, I shared this brain dump → it contributed to 8 fields")

### Assumptions
- Users want visibility into what was captured, not constant access (synthesis-first, raw-access-on-demand)
- Text content under ~1MB can live in PostgreSQL; no blob storage needed initially
- Transcripts are sufficient; original audio files are not required
- This is a trust/transparency feature, not a file management system
- Single-user access only (no sharing of raw inputs between team members initially)
- Persona Sharpener module is **out of scope** — patterns will be applied there later

### Out of Scope
- **Persona Sharpener module** — Leave existing brain dump flow alone for now
- **Audio file storage** — Transcripts only, no R2/S3 integration needed
- **File organization features** — No folders, tags, or complex hierarchy
- **Collaborative file access** — No sharing raw inputs with team members
- **File versioning** — No tracking changes to raw inputs over time
- **Full-text search** — Initial version uses filters only; search is Phase 2
- **Export functionality** — Phase 2 feature for data portability

---

## 2) Pre-reading Log

### Clarity Canvas
| File | Takeaway |
|------|----------|
| `prisma/schema.prisma` | `FieldSource` stores `rawContent` with source type (VOICE/TEXT/QUESTION). Already tracks provenance per-field. |
| `app/api/clarity-canvas/commit/route.ts` | Creates `FieldSource` records when recommendations are approved. Raw content stored verbatim. |
| `app/clarity-canvas/[pillar]/PillarPageClient.tsx` | Shows source count badges ("2 sources") but no way to view actual content. |
| `lib/clarity-canvas/profile-structure.ts` | Defines 6 pillars, 18 subsections, 60+ fields. |
| `lib/clarity-canvas/scoring.ts` | Rewards multiple sources (+10 points) but doesn't expose them. |

### Central Command
| File | Takeaway |
|------|----------|
| `prisma/schema.prisma` | `PipelineClient.rawInputText` stores full original text dump. Already preserved! |
| `app/central-command/components/IntakeModal.tsx` | Passes full `inputText` to prospect creation. |
| `app/api/central-command/extract/route.ts` | Two-pass extraction with gap analysis. Returns structured synthesis. |
| `app/api/central-command/prospects/route.ts` | Stores `rawInputText` on prospect creation. |
| `app/central-command/components/ClientDetailModal.tsx` | Shows synthesis sections but not raw input text. |
| `docs/developer-guides/central-command-scoring-guide.md` | Score assessments include `evidence[]` arrays with source quotes. |

---

## 3) Codebase Map

### Clarity Canvas Components
| Path | Role |
|------|------|
| `app/clarity-canvas/[pillar]/page.tsx` | Server component fetching profile with sources |
| `app/clarity-canvas/[pillar]/PillarPageClient.tsx` | Pillar detail page with subsection cards |
| `app/api/clarity-canvas/commit/route.ts` | Creates FieldSource records on approval |
| `app/api/clarity-canvas/extract/route.ts` | Brain dump → extraction chunks |
| `lib/clarity-canvas/profile-structure.ts` | Pillar/subsection/field definitions |

### Central Command Components
| Path | Role |
|------|------|
| `app/central-command/components/IntakeModal.tsx` | "+ New Prospect" intake flow |
| `app/central-command/components/ClientDetailModal.tsx` | Prospect detail view |
| `app/api/central-command/extract/route.ts` | Text → synthesis extraction |
| `app/api/central-command/prospects/route.ts` | Prospect CRUD |
| `lib/central-command/schemas.ts` | Zod schemas for extraction |

### Data Flow: Clarity Canvas
```
User Input (Voice/Text/File)
    ↓
/api/clarity-canvas/extract (GPT extraction → chunks)
    ↓
User Reviews Recommendations
    ↓
/api/clarity-canvas/commit
    ↓
Creates FieldSource records (rawContent preserved)
    ↓
Updates ProfileField (summary + fullContext)
```

### Data Flow: Central Command
```
User Pastes Text (meeting notes, call transcript)
    ↓
/api/central-command/extract (GPT → synthesis + recommendations)
    ↓
User Reviews & Customizes
    ↓
/api/central-command/prospects (POST)
    ↓
Creates PipelineClient (rawInputText preserved)
    ↓
Populates enrichmentFindings, scores, contacts
```

### Shared Dependencies
- **Prisma client** — `lib/prisma.ts`
- **Session management** — `lib/session.ts` (iron-session)
- **Design tokens** — `components/portal/design-tokens.ts`

---

## 4) Root Cause Analysis

*Not applicable — this is a new feature, not a bug fix.*

---

## 5) Research Findings

### Current State Analysis

**Clarity Canvas:**
- `FieldSource.rawContent` already stores verbatim input per field ✓
- Source count displayed ("2 sources") but content hidden ✗
- No session-level grouping of inputs ✗
- No "View Sources" UI ✗

**Central Command:**
- `PipelineClient.rawInputText` already stores full input ✓
- `enrichmentFindings` stores structured synthesis ✓
- `scoreAssessments.evidence[]` stores supporting quotes ✓
- Raw input text not displayed in detail modal ✗
- No archive or "view original" UI ✗

### Key Insight
Both systems already preserve raw inputs at the database level. The gap is entirely in the **UI layer** — we need to surface what's already stored.

### Recommended Approach

**Two-tier visibility:**
1. **Session-level InputSession model** — Groups all raw inputs from a single brain dump/intake session
2. **Field-level FieldSource (existing)** — Links individual fields back to their source content

This enables:
- "On Jan 15, I shared a brain dump → it contributed to 8 fields" (session view)
- "This field's value came from your Jan 15 brain dump" (field citation)

---

## 6) Decisions (From User Clarifications)

| Question | Decision |
|----------|----------|
| **Archive location** | Option D: Dedicated archive page + contextual "View Sources" on pillar detail pages |
| **Visibility** | All of: Badge counts on pillars, expandable source sections, inline field citations |
| **Focus area** | Main Clarity Canvas (6 pillars) + Central Command. Leave Persona Sharpener alone. |
| **Voice storage** | Transcripts only, no audio files needed |
| **Trust messaging** | Onboarding message + persistent indicator + settings explanation |
| **File uploads** | Persist extracted text only, discard original file |
| **Session grouping** | Yes — track original input sessions that link to populated fields |
| **Multiple sessions** | Yes — both Clarity Canvas and Central Command support adding multiple input sessions over time |

---

## 7) Proposed Architecture

### New Database Models

```prisma
// ============================================================================
// INPUT SESSION — Tracks complete raw inputs as submitted by user
// ============================================================================

model InputSession {
  id              String   @id @default(cuid())

  // Ownership (polymorphic - either Clarity Canvas or Central Command)
  clarityProfileId String?
  clarityProfile   ClarityProfile? @relation(fields: [clarityProfileId], references: [id], onDelete: Cascade)

  pipelineClientId String?
  pipelineClient   PipelineClient? @relation(fields: [pipelineClientId], references: [id], onDelete: Cascade)

  // Input details
  inputType       InputType        // VOICE_TRANSCRIPT, TEXT_INPUT, FILE_UPLOAD
  title           String           // Auto-generated or user-provided
  rawContent      String  @db.Text // Complete original input

  // Source metadata
  sourceModule    String           // "clarity-canvas", "central-command"
  sourceContext   String?          // e.g., "individual-pillar", "prospect-intake"

  // Voice-specific
  durationSeconds Int?

  // File-specific
  originalFileName String?

  // Processing results
  fieldsPopulated Int      @default(0)  // Count of fields this session contributed to
  extractionSummary String? @db.Text    // AI-generated summary of what was extracted

  // Timestamps
  capturedAt      DateTime @default(now())
  processedAt     DateTime?

  // Metadata (flexible)
  metadata        Json     @default("{}")

  @@index([clarityProfileId, capturedAt])
  @@index([pipelineClientId, capturedAt])
  @@index([sourceModule, capturedAt])
}

enum InputType {
  VOICE_TRANSCRIPT
  TEXT_INPUT
  FILE_UPLOAD
}
```

### Schema Changes to Existing Models

```prisma
// Add InputSession relation to FieldSource (Clarity Canvas)
model FieldSource {
  // ... existing fields ...

  // NEW: Link to parent input session
  inputSessionId  String?
  inputSession    InputSession? @relation(fields: [inputSessionId], references: [id], onDelete: SetNull)

  @@index([inputSessionId])
}

// Add InputSession relation to PipelineClient (Central Command)
model PipelineClient {
  // ... existing fields ...

  // NEW: Link to input sessions
  inputSessions   InputSession[]
}

// Add InputSession relation to ClarityProfile
model ClarityProfile {
  // ... existing fields ...

  // NEW: Link to input sessions
  inputSessions   InputSession[]
}
```

### API Routes

#### Clarity Canvas
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/clarity-canvas/sessions` | GET | List input sessions for profile |
| `/api/clarity-canvas/sessions/[id]` | GET | Get session detail with populated fields |
| `/api/clarity-canvas/fields/[id]/sources` | GET | Get sources for a specific field |

#### Central Command
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/central-command/prospects/[id]/sessions` | GET | List input sessions for prospect |
| `/api/central-command/prospects/[id]/raw-input` | GET | Get original raw input text |

### UI Components

#### Clarity Canvas

1. **Archive Page** — `/clarity-canvas/archive`
   - List of all input sessions with dates, types, field counts
   - Filter by type (voice/text/file), date range
   - Click to expand and see full content + linked fields

2. **Pillar Header Badge** — On `/clarity-canvas/[pillar]`
   - "X raw inputs" indicator at top of pillar page
   - Links to archive filtered to that pillar

3. **Subsection Source Indicator**
   - Below each subsection summary: "Based on 2 inputs"
   - Expandable to show source previews

4. **Field Citation**
   - On each populated field: small "Source" link
   - Hover/click shows source preview with timestamp

#### Central Command

1. **Raw Input Tab** — In ClientDetailModal
   - New tab alongside existing synthesis tabs
   - Shows complete `rawInputText` with formatting
   - "Captured on [date]" header

2. **Synthesis Citations**
   - Each synthesis section shows "View source text" link
   - Highlights relevant portion of raw input

3. **Intake Confirmation**
   - After prospect creation: "Your input has been saved"
   - Link to view in Raw Input tab

### Trust Messaging Components

1. **Onboarding Card** (one-time, dismissible)
   ```
   Your inputs are always preserved

   Everything you share — voice recordings, text, uploaded files —
   is saved in its original form. Even as we synthesize your input
   into clear summaries, you can always revisit what you originally said.

   [View Archive →]  [Got it]
   ```

2. **Auto-save Indicator** (persistent, subtle)
   - Small "Saved" badge that appears after each input
   - Tooltip: "Your original input is preserved"

3. **Settings Section** — `/settings/data-privacy`
   - "Raw Input Archive" section explaining retention
   - Link to view all inputs
   - (Future) Export and delete options

---

## 8) Implementation Phases

### Phase 1: Database & Core API (Week 1)
- [ ] Add `InputSession` model to Prisma schema
- [ ] Add `inputSessionId` to `FieldSource`
- [ ] Add relations to `ClarityProfile` and `PipelineClient`
- [ ] Run migration
- [ ] Create `/api/clarity-canvas/sessions` routes
- [ ] Create `/api/central-command/prospects/[id]/sessions` route

### Phase 2: Capture Integration (Week 2)
- [ ] Modify `/api/clarity-canvas/commit` to create InputSession
- [ ] Link FieldSource records to their InputSession
- [ ] Modify `/api/central-command/prospects` POST to create InputSession
- [ ] Add `fieldsPopulated` count tracking
- [ ] Add `extractionSummary` generation

### Phase 3: Clarity Canvas UI (Week 3)
- [ ] Create `/clarity-canvas/archive` page
- [ ] Build `InputSessionCard` component
- [ ] Add pillar header badge ("X raw inputs")
- [ ] Add subsection source indicators
- [ ] Add field-level citation links
- [ ] Build `SourcePreview` modal/popover

### Phase 4: Central Command UI (Week 4)
- [ ] Add "Raw Input" tab to `ClientDetailModal`
- [ ] Style raw input display with proper formatting
- [ ] Add synthesis section citations
- [ ] Add intake confirmation messaging

### Phase 5: Trust Messaging (Week 5)
- [ ] Build onboarding card component
- [ ] Add auto-save indicator
- [ ] Create settings/data-privacy section
- [ ] Testing and polish

### Future Phases
- **Phase 6:** Full-text search across all inputs
- **Phase 7:** Export/download functionality
- **Phase 8:** Apply patterns to Persona Sharpener module

---

## 9) Success Criteria

### Clarity Canvas
1. Users can see "X raw inputs" on each pillar page
2. Users can click any field to see its source with timestamp
3. Archive page shows complete input history with session grouping
4. New inputs automatically appear in archive after commit

### Central Command
1. "Raw Input" tab shows complete original text for any prospect
2. Each synthesis section can link back to source text
3. Intake flow confirms input preservation

### Trust & Transparency
1. Onboarding explains data preservation
2. Auto-save indicator confirms each input is stored
3. Settings page provides transparency on retention

### Performance
1. Archive page loads in <1s for up to 100 sessions
2. Field citations load without noticeable delay
3. No impact on existing commit/intake flows

---

## 10) Open Questions for Team Discussion

1. **Retention policy** — How long do we keep raw inputs? Forever, or time-limited?
2. **Deletion behavior** — If a prospect/profile is deleted, should raw inputs be preserved or deleted?
3. **Admin access** — Should 33 Strategies team have visibility into client raw inputs for support?
4. **Archive navigation** — Should archive be in main nav, or nested under profile/settings?

---

## 11) Central Command-Specific Considerations

### What Already Exists
- `rawInputText` on `PipelineClient` — **full text already stored!**
- `enrichmentFindings` — structured synthesis with 6 sections
- `scoreAssessments.evidence[]` — supporting quotes per score
- Version history for all synthesis sections

### What's Needed
1. **UI to view `rawInputText`** — Currently stored but never displayed
2. **Link synthesis to source** — Show which parts of raw input fed each section
3. **InputSession record** — Formalize the session for consistent archive experience
4. **Multiple sessions** — Support for adding more context later (follow-up calls, meeting notes, email threads)
5. **"Add Context" button** — Allow users to append new input sessions to existing prospects

### Integration with Existing Features
- **Refinement flow** — When user refines synthesis, we could show "Original input" for reference
- **Score feedback** — When adjusting scores, show evidence from raw input
- **Stakeholder extraction** — Show where each stakeholder was mentioned in original text

---

---

## 12) All Clarifications Resolved

| Question | Decision |
|----------|----------|
| Archive location | Dedicated page + contextual "View Sources" |
| Visibility | Badge counts + expandable sections + inline citations |
| Focus area | Clarity Canvas (6 pillars) + Central Command |
| Voice storage | Transcripts only |
| Trust messaging | Onboarding + auto-save indicator + settings |
| File uploads | Persist extracted text only |
| Session grouping | Yes — InputSession model |
| Multiple sessions | Yes — both systems support adding inputs over time |

---

*Ready for specification. No further clarifications needed.*
