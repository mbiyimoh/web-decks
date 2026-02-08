# Central Command — Pipeline Dashboard (v2: Full Implementation)

**Slug:** mission-control-pipeline-dashboard
**Author:** Claude Code
**Date:** 2026-02-01
**Related:** `docs/reference/mission-control-pipeline-dashboard-handoff/`

---

## 1) Intent & Assumptions

**Task brief:** Implement Central Command as a fully functional internal admin dashboard at `/central-command` on 33strategies.ai. This is the nerve center for the 33 Strategies sales pipeline — real prospect/client records stored in the database, AI-powered extraction from text dumps to populate record fields, prompt-based editing of any field, and full pipeline visibility (8-stage funnel, team capacity, closed deals).

This is **not** a static MVP — it ships with real data persistence, real AI extraction, and real inline editing from day one.

**Assumptions:**
- Internal tool — only Emily and Beems need access
- Handoff package (`docs/reference/mission-control-pipeline-dashboard-handoff/`) is the UI/UX source of truth
- Canonical design tokens (`components/portal/design-tokens.ts`) override the handoff's inline colors
- iron-session auth with `CENTRAL_COMMAND_PASSWORD` env var (already in `.env`)
- Intake flow is text-dump only (up to 20k chars) — no Granola/Canvas integrations yet
- All record fields are editable via direct edit or prompt-based refinement
- Reuse existing patterns: braindump-to-recommendations extraction, prompt-based text iteration
- Vercel AI SDK `generateObject` with OpenAI for structured extraction (same as Clarity Canvas)

**Out of scope:**
- External integrations (Granola, Slack, email import)
- Real-time Supabase subscriptions (future enhancement)
- Mobile-optimized layout (desktop-first)
- Role-based access control (only 2 users)
- Voice input for text dumps (text-only for now)

---

## 2) Pre-reading Log

| File | Takeaway |
|------|----------|
| **Handoff Package** | |
| `docs/reference/.../AdminDashboard.jsx` | 568-line single-file component — 5 sections, inline styles, modals for client detail + intake |
| `docs/reference/.../types.ts` | 242 lines — IntentClient, FunnelClient, ClosedDeal, TeamMember interfaces match DB schema |
| `docs/reference/.../data.ts` | 530 lines mock data — 2 intent, 7 funnel, 1 closed, 4 team members |
| `docs/reference/.../api/schema.md` | 5 tables (clients, pipeline, stage_history, ai_enrichment, team_capacity) + 2 views |
| **Extraction Patterns** | |
| `docs/clarity-canvas/braindump-to-rcommendations.md` | 12 patterns for text→structured recommendations: Zod schemas, system prompts, context injection, confidence scoring, conflict detection, bubble visualization, field accumulation, notes merging |
| `docs/clarity-canvas/prompt-based-text-iteration.md` | 3-layer architecture: DB fields (content + versions + source), 2 endpoints (generate + refine), UI state machine (EMPTY→PREVIEW→EDIT/REFINE→HISTORY) |
| **Existing Extraction Code** | |
| `app/api/clarity-canvas/extract/route.ts` | Uses `generateObject` with `openai('gpt-4o')` + Zod schema, returns `ExtractOnlyResponse` |
| `lib/clarity-canvas/extraction-schema.ts` | `extractionChunkSchema` with content, targetSection, targetField, summary, confidence, insights |
| `app/clarity-canvas/components/RecommendationReview.tsx` | Review-before-commit pattern: approve/reject/refine per recommendation |
| **Auth & Session** | |
| `lib/session.ts` | `SessionData` interface with `isLoggedIn`, `clientId`, `strategistId`, `isAdmin` extension needed |
| `components/portal/PasswordGate.tsx` | Reusable auth gate with `portalType` prop |
| **Database** | |
| `prisma/schema.prisma` | 14 existing models — need to add 5 new Central Command models |

---

## 3) Codebase Map

### Primary Components/Modules

| Path | Role |
|------|------|
| `app/central-command/page.tsx` | **NEW** — Server Component: auth check + data fetch |
| `app/central-command/CentralCommandClient.tsx` | **NEW** — Main client component: dashboard layout |
| `app/central-command/components/` | **NEW** — Decomposed sub-components (~10 files) |
| `lib/central-command/` | **NEW** — Data layer: queries, schemas, prompts, types |
| `app/api/central-command/` | **NEW** — API routes: auth, extract, refine, CRUD |
| `components/portal/design-tokens.ts` | Existing — color/style constants |
| `components/portal/PasswordGate.tsx` | Existing — auth gate (extend with `portalType: 'central-command'`) |
| `lib/session.ts` | Existing — extend `SessionData` with `isCentralCommand` |

### Shared Dependencies

- **Design tokens:** `components/portal/design-tokens.ts`
- **Fonts:** Instrument Serif, DM Sans, JetBrains Mono (root layout)
- **Session:** iron-session via `getIronSession<SessionData>()`
- **AI SDK:** `ai` + `@ai-sdk/openai` (already installed, used by Clarity Canvas)
- **Prisma:** `lib/prisma.ts` singleton
- **Zod:** Schema validation for extraction + API input

### Data Flow

```
1. INTAKE (New Prospect)
   User pastes text dump (up to 20k chars)
       ↓
   POST /api/central-command/extract
       ↓
   generateObject(openai('gpt-4o'), pipelineExtractionSchema, systemPrompt)
       ↓
   Returns structured recommendations (categorized, confidence-scored)
       ↓
   UI: RecommendationReview (approve / reject / refine per item)
       ↓
   POST /api/central-command/prospects (creates PipelineClient + PipelineRecord)
       ↓
   Redirects to dashboard with new prospect visible

2. FIELD EDITING (Existing Record)
   User clicks field → inline edit OR refine prompt
       ↓
   Direct edit: POST /api/central-command/prospects/[id] (PATCH)
   Prompt edit: POST /api/central-command/refine
       ↓
   Refine: generateObject(openai('gpt-4o-mini'), { refinedContent, refinedSummary })
       ↓
   UI: shows refined result, user approves → PATCH to save
       ↓
   Version history updated (content + contentVersions + contentSource)

3. PIPELINE VIEW (Dashboard)
   app/central-command/page.tsx (Server Component)
       ↓
   Prisma queries: getIntentClients(), getFunnelClients(), getClosedDeals(), getTeamCapacity()
       ↓
   CentralCommandClient.tsx (Client Component)
       ↓
   Sub-components: PipelineTable, FunnelTable, ClosedDeals, TeamCapacity
       ↓
   Click row → ClientDetailModal (view/edit all fields)
```

### Potential Blast Radius

- **`lib/session.ts`** — Add `isCentralCommand?: boolean` to `SessionData`
- **`prisma/schema.prisma`** — Add 5 new models (no changes to existing models)
- **`components/portal/PasswordGate.tsx`** — Add `'central-command'` to `portalType` union
- **Everything else** — zero impact (entirely new route + API surface)

---

## 4) Root Cause Analysis

N/A — new feature.

---

## 5) Research

### Architecture Decision: Full Implementation from Day One

Given the user's direction, this is **not** a phased static→dynamic rollout. The implementation ships with:

1. **Real Prisma models** — 5 new tables for pipeline data
2. **Real AI extraction** — text dump → structured recommendations via `generateObject`
3. **Real CRUD** — create, read, update prospects and pipeline records
4. **Real inline editing** — direct field edit + prompt-based refinement with version history
5. **Real dashboard** — all 5 sections rendering from database

### Database Schema Design

**5 new Prisma models** (adapted from handoff's `schema.md` to fit existing Prisma patterns):

```
PipelineClient          — Company/contact info, notes
PipelineRecord          — Sales funnel tracking (stage, scores, decision, values)
PipelineStageHistory    — Audit trail of stage progression
PipelineAIEnrichment    — AI extraction results + confidence scores
TeamCapacity            — Team member allocations
```

**Key design decisions:**
- Use `cuid()` IDs (consistent with existing schema)
- Use `Json` type for flexible nested data (contacts, allocations, journey, confidence)
- Add `contentVersions Json?` on editable fields for version history
- Store AI enrichment separately (linked to client, not embedded)
- No foreign key to existing `User` model (these are prospect records, not platform users)

### AI Extraction Pipeline

**Reuse the braindump-to-recommendations pattern:**

1. **Extraction Schema** — Define `pipelineExtractionSchema` with Zod:
   - Categories: `company_info`, `contact_info`, `problem_fit`, `budget_signal`, `timeline_signal`, `strategic_fit`, `next_action`, `team_capacity`
   - Each recommendation has: `capturedText`, `category`, `targetField`, `confidence`, `sourceSnippet`

2. **System Prompt** — Domain-specific for sales pipeline context:
   - Knows the 8-stage pipeline
   - Extracts: company details, contacts, deal signals, budget indicators, timeline mentions
   - Maps to specific record fields
   - Handles noisy text (meeting notes, call transcripts)

3. **Extraction API** — `POST /api/central-command/extract`:
   - Input: `{ inputText: string, context?: { existingClient?: PipelineClient } }`
   - Calls `generateObject(openai('gpt-4o'), pipelineExtractionSchema)`
   - Returns recommendations grouped by category with confidence scores

4. **Refinement API** — `POST /api/central-command/refine`:
   - Input: `{ currentContent: string, prompt: string, fieldName: string }`
   - Calls `generateObject(openai('gpt-4o-mini'), refinementSchema)`
   - Returns refined text + updated version entry

### Prompt-Based Text Iteration (per-field)

Every editable field on a prospect record supports:
- **Direct edit** — click to open textarea, type new value, save
- **Prompt refine** — type natural language instruction (e.g., "make it more specific about their B2B focus"), AI applies the edit
- **Version history** — each field stores `{ content, contentVersions, contentSource }` per the portable recipe

### Component Architecture

Decompose the handoff's single 568-line file into:

| Component | Responsibility |
|-----------|---------------|
| `CentralCommandClient.tsx` | Top-level layout, section routing, state management |
| `DashboardHeader.tsx` | Logo, total pipeline value, user indicator |
| `IntakeModal.tsx` | Text dump input (20k char limit) → extraction → review → create |
| `PipelineTable.tsx` | Intent → Money table with priority sorting |
| `FunnelTable.tsx` | Top of Funnel table with discovery/assessment/readiness |
| `ClosedDeals.tsx` | Expandable closed/lost deals section |
| `TeamCapacity.tsx` | Team member capacity cards with allocation bars |
| `ClientDetailModal.tsx` | Full prospect detail view with inline editing |
| `RecommendationReview.tsx` | Review extracted recommendations (approve/reject/refine) |
| `EditableField.tsx` | Reusable: inline edit + prompt refine + version history |
| `StageDots.tsx` | Visual 8-stage progression indicator |
| `ConfidenceBadge.tsx` | AI confidence level indicator (High/Med/Low) |
| `Stoplight.tsx` | Decision status (Yes/No/Pending) |
| `ProgressBar.tsx` | Readiness percentage bar |
| `CapacityCard.tsx` | Single team member capacity visualization |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/central-command/auth` | POST | Password auth (iron-session) |
| `/api/central-command/extract` | POST | AI extraction from text dump |
| `/api/central-command/refine` | POST | Prompt-based field refinement |
| `/api/central-command/prospects` | GET | List all prospects (with pipeline data) |
| `/api/central-command/prospects` | POST | Create new prospect + pipeline record |
| `/api/central-command/prospects/[id]` | GET | Single prospect detail |
| `/api/central-command/prospects/[id]` | PATCH | Update prospect fields |
| `/api/central-command/prospects/[id]/stage` | PATCH | Advance/change pipeline stage |
| `/api/central-command/prospects/[id]/close` | POST | Close/lose deal with reason |
| `/api/central-command/team` | GET | List team capacity |
| `/api/central-command/team/[id]` | PATCH | Update team member allocations |

### Recommendation

**Route:** `/central-command`
**Auth:** iron-session with `CENTRAL_COMMAND_PASSWORD`, `isCentralCommand` session flag
**Database:** 5 new Prisma models, migration required
**AI:** `generateObject` with `openai('gpt-4o')` for extraction, `gpt-4o-mini` for refinement
**Design:** Canonical design tokens, decomposed components
**Editing:** Direct edit + prompt-based refinement with version history on all fields
**Intake:** Single text input (20k chars) → AI extraction → review recommendations → create record

---

## 6) Clarification (Resolved)

| Question | Answer |
|----------|--------|
| Route name | `/central-command` |
| Auth model | Single `CENTRAL_COMMAND_PASSWORD` (already in .env) |
| Phase 1 scope | Full implementation — real DB, real AI, real editing |
| Design tokens | Use canonical tokens from `design-tokens.ts` |
| Field editing | Direct edit + prompt-based refinement (braindump-to-recommendations + prompt-based-text-iteration patterns) |
| Intake method | Text dump only (up to 20k chars), no external integrations |

---

## 7) Implementation Scope Summary

### What Ships

1. **`/central-command` route** — password-protected, iron-session auth
2. **5 new Prisma models** — PipelineClient, PipelineRecord, PipelineStageHistory, PipelineAIEnrichment, TeamCapacity
3. **AI extraction pipeline** — text dump → `generateObject` → structured recommendations → review UI → commit to DB
4. **Prompt-based field editing** — refine any field with natural language, version history tracked
5. **Full dashboard UI** — 5 sections (intake, intent pipeline, funnel, closed deals, team capacity)
6. **11 API routes** — auth, extract, refine, full CRUD for prospects + team
7. **~15 decomposed components** — all using canonical design tokens

### What Doesn't Ship (Yet)

- Granola / Clarity Canvas / Slack / email intake integrations
- Real-time subscriptions
- Mobile layout
- Voice input
- Role-based access
