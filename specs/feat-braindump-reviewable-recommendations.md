# Spec: Brain Dump to Reviewable Recommendations

**Slug:** feat-braindump-reviewable-recommendations
**Author:** Claude Code
**Date:** 2026-02-01
**Ideation:** `docs/ideation/braindump-reviewable-recommendations.md`

---

## 1. Overview

Transform the Clarity Canvas brain dump flow from "auto-save everything AI extracts" to a **human-in-the-loop review experience**. After AI extraction, present:

1. An **executive summary** of key themes identified
2. **Per-field recommendation cards** the user can approve, reject, or refine via prompt-based editing
3. Only approved/refined items get committed to the profile

### UX Pattern: Contextual Cherry-Picking

A scrollable list of recommendation cards grouped by profile section, each with approve/reject/refine controls. Executive summary at top. Bulk actions for efficiency. Gaps section at bottom.

---

## 2. Success Criteria

- [ ] Brain dump extraction does NOT write to the database — extraction is purely analytical
- [ ] User sees an executive summary with overall themes after extraction completes
- [ ] Each extraction chunk appears as an individual recommendation card grouped by section
- [ ] Users can approve, reject, or refine each recommendation individually
- [ ] "Approve All" warns if any items have confidence < 0.7
- [ ] Refine action uses gpt-4o-mini to rewrite recommendation based on user prompt
- [ ] Confirmation dialog shown before committing approved items to the database
- [ ] Only approved/refined recommendations get persisted to the profile
- [ ] Main extraction uses gpt-4o (not gpt-4o-mini)
- [ ] Existing flow states (welcome, brain-dump, recording, processing, profile) remain intact; new `review` step inserted between `processing` and `profile`

---

## 3. Detailed Design

### 3.1 Flow Step Changes

**Current flow:** `welcome` -> `brain-dump` -> `recording` -> `processing` -> `profile`

**New flow:** `welcome` -> `brain-dump` -> `recording` -> `processing` -> **`review`** -> `profile`

Update `FlowStep` type in `ClarityCanvasClient.tsx`:

```typescript
type FlowStep = 'welcome' | 'brain-dump' | 'recording' | 'processing' | 'review' | 'profile';
```

After the `/api/clarity-canvas/extract` call succeeds, transition to `review` instead of `profile`. Store extraction results (chunks, themes, follow-ups) in component state for the review screen.

### 3.2 New Types (`lib/clarity-canvas/types.ts`)

```typescript
// Recommendation state for review screen
export type RecommendationStatus = 'pending' | 'approved' | 'rejected' | 'refined';

export interface Recommendation {
  id: string;                    // Generated client-side via crypto.randomUUID()
  chunk: ExtractionChunk;        // Original extraction chunk
  status: RecommendationStatus;  // Current review state
  refinedContent?: string;       // Refined content (if refined)
  refinedSummary?: string;       // Refined summary (if refined)
}

// Derived display values — compute on render, not stored in state:
//   displayContent = rec.refinedContent ?? rec.chunk.content
//   displaySummary = rec.refinedSummary ?? rec.chunk.summary

// Extract API response (new shape — no DB writes, no updatedProfile)
export interface ExtractOnlyResponse {
  extractedChunks: ExtractionChunk[];
  overallThemes: string[];
  suggestedFollowUps: string[];
}

// Commit API request
export interface CommitRecommendationsRequest {
  recommendations: {
    targetSection: string;
    targetSubsection: string;
    targetField: string;
    content: string;
    summary: string;
    confidence: number;
    sourceType: 'VOICE' | 'TEXT';
  }[];
}

// Commit API response
export interface CommitRecommendationsResponse {
  updatedProfile: ProfileWithSections;
  scores: ProfileScores;
  savedCount: number;
  droppedCount: number;
}

// Refine API request
export interface RefineRecommendationRequest {
  currentContent: string;
  currentSummary: string;
  prompt: string;
  fieldKey: string;
}

// Refine API response
export interface RefineRecommendationResponse {
  refinedContent: string;
  refinedSummary: string;
}
```

### 3.3 API Changes

#### 3.3.1 Modify: `POST /api/clarity-canvas/extract` (extract-only mode)

**File:** `app/api/clarity-canvas/extract/route.ts`

**Changes:**
1. Switch model from `gpt-4o-mini` to `gpt-4o` for better extraction quality
2. Remove all DB write logic (no `prisma.fieldSource.create`, no `prisma.profileField.update`)
3. Remove the "fetch updated profile" query
4. Return `ExtractOnlyResponse` instead of `BrainDumpResponse`:

```typescript
return NextResponse.json({
  extractedChunks: extraction.chunks,
  overallThemes: extraction.overallThemes,
  suggestedFollowUps: extraction.suggestedFollowUps,
});
```

5. Keep the fuzzy key matching logic to **validate** chunks server-side. Invalid chunks (unresolvable section/subsection/field keys) are dropped with console logging. Only valid chunks are returned in the response. The matched keys are NOT added to the chunk schema — the client receives the original `targetSection`/`targetSubsection`/`targetField` values for valid chunks only.

The response type changes from `BrainDumpResponse` to `ExtractOnlyResponse`.

**Error responses:**
- `401 { error: string }` — Unauthorized
- `400 { error: string }` — No transcript provided
- `404 { error: string }` — Profile not found
- `500 { error: string }` — Extraction failed

#### 3.3.2 New: `POST /api/clarity-canvas/commit`

**File:** `app/api/clarity-canvas/commit/route.ts`

**Purpose:** Persist approved recommendations to the database.

**Request body:** `CommitRecommendationsRequest`

**Logic:**
1. Authenticate user via `ensureUserFromUnifiedSession`
2. Fetch user's profile with full nested includes:
```typescript
include: {
  sections: {
    orderBy: { order: 'asc' },
    include: {
      subsections: {
        orderBy: { order: 'asc' },
        include: { fields: { include: { sources: true } } },
      },
    },
  },
}
```
3. For each recommendation (use `Promise.all` — non-transactional, same pattern as current extract route; PgBouncer transaction mode makes `$transaction` unreliable):
   - Use fuzzy key matching to find the target field (reuse `buildKeyLookups` and `fuzzyMatchKey` — extract these to a shared utility in `lib/clarity-canvas/key-matching.ts`)
   - Create `FieldSource` record: `{ fieldId, type: SourceType.VOICE | SourceType.TEXT, rawContent: rec.content, userConfidence: rec.confidence }`
   - Update `ProfileField`: `{ summary: rec.summary, fullContext: appendContext(existing, rec.content), confidence: rec.confidence }`
   - **fullContext append pattern** (use shared constant `CONTEXT_DELIMITER = '\n\n---\n\n'`):
     ```typescript
     const newContext = existing ? `${existing}${CONTEXT_DELIMITER}${content}` : content;
     ```
   - Track saved/dropped counts with reasons
4. Re-fetch the full profile (same include as step 2) to get clean data
5. Recalculate scores via `calculateAllScores`
6. Return `CommitRecommendationsResponse`

**Error responses:**
- `401 { error: string }` — Unauthorized
- `404 { error: string }` — Profile not found
- `500 { error: string }` — Internal error

**Partial success:** Some items may fail fuzzy key matching. Return `savedCount` and `droppedCount` so the client can inform the user. This is not an error — the commit still succeeds for matched items.

#### 3.3.3 New: `POST /api/clarity-canvas/refine`

**File:** `app/api/clarity-canvas/refine/route.ts`

**Purpose:** Refine a single recommendation's content using an LLM based on user instructions.

**Request body:** `RefineRecommendationRequest`

**Logic:**
1. Authenticate user
2. Call `generateObject` with `gpt-4o-mini` (sufficient for simple rewrites):

```typescript
const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    refinedContent: z.string().describe('The refined content'),
    refinedSummary: z.string().max(150).describe('Updated summary (max 150 chars)'),
  }),
  system: `You are an expert at refining profile recommendations.
Maintain the core meaning while applying the user's requested changes.
Keep content concise and professional. The summary must be under 150 characters.`,
  prompt: `Current content:\n${currentContent}\n\nCurrent summary:\n${currentSummary}\n\nField: ${fieldKey}\n\nRefinement request: ${prompt}`,
});
```

3. Return `RefineRecommendationResponse`

**Error responses:**
- `401 { error: string }` — Unauthorized
- `400 { error: string }` — Missing required fields
- `500 { error: string }` — Refinement failed

### 3.4 Shared Utility: Key Matching

**File:** `lib/clarity-canvas/key-matching.ts`

Extract `buildKeyLookups()` and `fuzzyMatchKey()` from `extract/route.ts` into this shared module. Both `extract/route.ts` and `commit/route.ts` will import from here. Also export the `CONTEXT_DELIMITER` constant.

```typescript
export function buildKeyLookups(): {
  sectionKeys: Set<string>;
  subsectionKeys: Map<string, Set<string>>;
  fieldKeys: Map<string, Set<string>>;
}

export function fuzzyMatchKey(target: string, validKeys: Set<string>): string | null

export const CONTEXT_DELIMITER = '\n\n---\n\n';
```

### 3.5 New Components

#### 3.5.1 `RecommendationReview.tsx`

**File:** `app/clarity-canvas/components/RecommendationReview.tsx`

**Props:**
```typescript
interface RecommendationReviewProps {
  extractedChunks: ExtractionChunk[];
  overallThemes: string[];
  suggestedFollowUps: string[];
  sourceType: 'VOICE' | 'TEXT';
  onCommit: (profile: ProfileWithSections, scores: ProfileScores) => void;
  onBack: () => void; // Return to brain dump step
}
```

**Internal state:**
```typescript
// Initialize recommendations from chunks — all start as 'pending'
const [recommendations, setRecommendations] = useState<Recommendation[]>(() =>
  extractedChunks.map((chunk) => ({
    id: crypto.randomUUID(),
    chunk,
    status: 'pending' as RecommendationStatus,
  }))
);
const [isCommitting, setIsCommitting] = useState(false);
const [showConfirmation, setShowConfirmation] = useState(false);
const [commitError, setCommitError] = useState<string | null>(null);

// Group recommendations by section using PROFILE_STRUCTURE for display metadata
const groupedBySection = useMemo(() => {
  const groups: Record<string, { name: string; icon: string; recommendations: Recommendation[] }> = {};
  for (const rec of recommendations) {
    const key = rec.chunk.targetSection;
    if (!groups[key]) {
      const sectionMeta = PROFILE_STRUCTURE[key];
      groups[key] = {
        name: sectionMeta?.name ?? key,
        icon: sectionMeta?.icon ?? '',
        recommendations: [],
      };
    }
    groups[key].recommendations.push(rec);
  }
  return groups;
}, [recommendations]);
```

**Layout (top to bottom):**

1. **Header** — "Review Recommendations" title + back button
2. **Executive Summary** — Card showing:
   - Count: "We identified {N} insights across {M} areas of your profile"
   - Theme chips from `overallThemes` (gold-accented pills)
   - "Approve All ({N})" button (single action, no "Review Individually" — cards are visible on same page)
3. **Section Groups** — For each key in `groupedBySection`:
   - Section header with icon, name, recommendation count, "Approve All in Section" button
   - List of `RecommendationCard` components
   - Only show sections that have at least 1 recommendation
4. **Gaps Section** — If `suggestedFollowUps` is non-empty:
   - "Areas to Explore" header
   - List of follow-up suggestions as subtle text items
5. **Commit Footer** — Sticky bottom bar:
   - Count of approved items: "Commit {X} approved items to profile"
   - Disabled if 0 approved items
   - On click: show confirmation dialog

**Approve All behavior:**
- If any recommendations have `confidence < 0.7`, show a warning: "X items have low confidence. Review these first?" with "Review Low-Confidence" (scrolls to first low-confidence card) and "Approve All Anyway" buttons
- If all items >= 0.7 confidence, approve all immediately

**Confirmation dialog** (follows `SectionDetail.tsx` modal pattern):
- Fixed overlay with `bg-black/70 backdrop-blur-sm` + centered panel with `bg-[#111114] border-zinc-800 rounded-2xl`
- Backdrop click dismisses (same as Cancel)
- Content: "About to update {X} fields across {Y} sections. This will add the approved recommendations to your profile."
- Two buttons: "Confirm" (gold accent) and "Cancel" (zinc)
- On confirm: `setIsCommitting(true)`, POST to `/api/clarity-canvas/commit`
  - **Success:** call `onCommit(data.updatedProfile, data.scores)`. If `droppedCount > 0`, show brief inline warning before transitioning.
  - **Network/server error:** `setCommitError('Failed to save recommendations. Please try again.')`, keep dialog open with retry button, `setIsCommitting(false)`

#### 3.5.2 `RecommendationCard.tsx`

**File:** `app/clarity-canvas/components/RecommendationCard.tsx`

**Props:**
```typescript
interface RecommendationCardProps {
  recommendation: Recommendation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefine: (id: string, refinedContent: string, refinedSummary: string) => void;
}
```

**States and visual treatment:**

| Status | Visual | Actions |
|--------|--------|---------|
| `pending` | Default card (zinc-900 bg, white border) | Approve, Reject, Refine |
| `approved` | Green check overlay, subtle green left border | Undo (→ pending) |
| `rejected` | Compact single line, muted text, strikethrough | Undo (→ pending) |
| `refined` | Green check overlay + "Refined" badge, green left border | Undo (→ pending) |

**Card content (pending state):**
- Field name: `FIELD_DISPLAY_NAMES[recommendation.chunk.targetField] || recommendation.chunk.targetField` (import from `lib/clarity-canvas/profile-structure`)
- Confidence indicator: `Math.round(recommendation.chunk.confidence * 100)%`, colored via `getScoreColor(confidence * 100)` from `lib/clarity-canvas/types`
- Content text: `recommendation.refinedContent ?? recommendation.chunk.content`
- Summary text: `recommendation.refinedSummary ?? recommendation.chunk.summary` (smaller/muted)
- Action buttons: Approve (green), Reject (red/muted), Refine... (gold)

**Refine flow (inline):**
1. User clicks "Refine..."
2. Card expands to show a text input below the content
3. User types instruction (e.g., "Make this more specific about my role at 33 Strategies")
4. "Apply" button sends POST to `/api/clarity-canvas/refine`
5. Loading state during API call
6. Card updates with refined text, status becomes `refined` (auto-approved)
7. "Cancel" button collapses the refine input

**Animations (framer-motion):**
- Approve: brief green flash, then settle to approved state
- Reject: fade to compact state with `layout` animation
- Refine expand/collapse: `AnimatePresence` with height animation

### 3.6 ClarityCanvasClient.tsx Changes

**File:** `app/clarity-canvas/ClarityCanvasClient.tsx`

**New state variables:**
```typescript
const [extractionResult, setExtractionResult] = useState<ExtractOnlyResponse | null>(null);
const [brainDumpSourceType, setBrainDumpSourceType] = useState<'VOICE' | 'TEXT'>('TEXT');
```

**Changes to extraction handlers (`handleRecordingComplete`, `handleTextSubmit`):**
1. After extraction API returns, store result in `extractionResult` state
2. Store source type in `brainDumpSourceType`
3. Transition to `step = 'review'` instead of `step = 'profile'`
4. Do NOT call the profile refresh — no DB writes happened

**New review step rendering:**
```typescript
{step === 'review' && extractionResult && (
  <RecommendationReview
    extractedChunks={extractionResult.extractedChunks}
    overallThemes={extractionResult.overallThemes}
    suggestedFollowUps={extractionResult.suggestedFollowUps}
    sourceType={brainDumpSourceType}
    onCommit={(updatedProfile, newScores) => {
      setProfile(updatedProfile);
      setScores(newScores);
      setPreviousScores(scores);
      setShowScoreAnimation(true);
      setExtractionResult(null);
      setStep('profile');
    }}
    onBack={() => {
      setExtractionResult(null);
      setStep('brain-dump');
    }}
  />
)}
```

**Update `BrainDumpResponse` references:**
The extraction handler currently expects `BrainDumpResponse`. Change to expect `ExtractOnlyResponse`. Remove the `setProfile(data.updatedProfile)` and `setScores(data.scores)` calls from the extraction handler — these now happen in the `onCommit` callback.

---

## 4. Design System Compliance

All new components follow the 33 Strategies design system (`.claude/skills/33-strategies-frontend-design.md`):

| Element | Treatment |
|---------|-----------|
| Backgrounds | `bg-[#0a0a0f]` (page), `bg-[#111114]` (cards), `bg-zinc-900/50` (elevated) |
| Text | `text-[#f5f5f5]` (headings), `text-zinc-400` (body), `text-zinc-500` (muted) |
| Accent | `text-[#d4a54a]` / `bg-[#d4a54a]` for section labels, refine button, theme chips |
| Borders | `border-zinc-800` (cards), `border-green-500/50` (approved), `border-red-500/30` (rejected) |
| Typography | `font-display` (headings), `font-body` (content), `font-mono tracking-[0.2em] uppercase text-xs` (section labels) |
| Animations | framer-motion `AnimatePresence`, `layout` prop for smooth reflows |
| Confidence colors | Green (>= 0.8), Yellow (>= 0.6), Orange (>= 0.4), Red (< 0.4) — matches `getScoreColor` pattern |

---

## 5. File Manifest

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `app/clarity-canvas/ClarityCanvasClient.tsx` | Add `review` flow step, `extractionResult` state, update extraction handlers |
| MODIFY | `app/api/clarity-canvas/extract/route.ts` | Switch to gpt-4o, remove DB writes, return `ExtractOnlyResponse` |
| MODIFY | `lib/clarity-canvas/types.ts` | Add `Recommendation`, `RecommendationStatus`, `ExtractOnlyResponse`, `CommitRecommendationsRequest/Response`, `RefineRecommendationRequest/Response` |
| CREATE | `app/api/clarity-canvas/commit/route.ts` | New endpoint to persist approved recommendations |
| CREATE | `app/api/clarity-canvas/refine/route.ts` | New endpoint to refine a recommendation via LLM |
| CREATE | `lib/clarity-canvas/key-matching.ts` | Shared fuzzy key matching utilities (extracted from extract route) |
| CREATE | `app/clarity-canvas/components/RecommendationReview.tsx` | Review screen with exec summary + recommendation cards |
| CREATE | `app/clarity-canvas/components/RecommendationCard.tsx` | Individual recommendation card with approve/reject/refine |

---

## 6. Data Flow Diagram

```
Brain Dump Text (voice or typed)
  │
  ▼
POST /api/clarity-canvas/extract
  - Model: gpt-4o
  - Input: transcript text
  - Output: { extractedChunks, overallThemes, suggestedFollowUps }
  - NO database writes
  │
  ▼
Client State (RecommendationReview)
  - Recommendations[] held in React state
  - User approves / rejects / refines each
  │
  ├──[Refine]──▶ POST /api/clarity-canvas/refine
  │               - Model: gpt-4o-mini
  │               - Input: { currentContent, currentSummary, prompt, fieldKey }
  │               - Output: { refinedContent, refinedSummary }
  │               - NO database writes
  │               ◀── Returns to client state
  │
  ▼
[User clicks "Commit"]
  │
  ▼
Confirmation Dialog
  - "About to update {X} fields across {Y} sections"
  │
  ▼
POST /api/clarity-canvas/commit
  - Input: approved recommendations array
  - Creates FieldSource records
  - Updates ProfileField records (summary, fullContext, confidence)
  - Recalculates scores
  - Output: { updatedProfile, scores, savedCount, droppedCount }
  │
  ▼
Profile View (with score animation)
```

---

## 7. Edge Cases

1. **Zero chunks extracted:** The `RecommendationReview` component renders with no section groups. The executive summary card shows "We couldn't extract specific recommendations from your brain dump." If `overallThemes` is non-empty, still show theme chips. If `suggestedFollowUps` is non-empty, show the Gaps section. Hide the commit footer entirely. Show a "Try Again" button in place of the section groups that calls `onBack`.

2. **All items rejected:** Commit button disabled. Show message: "No items approved. Go back to add more context or try a different brain dump."

3. **Refine API failure:** Show inline error on the card ("Refinement failed, please try again"). Keep card in its previous state. Don't change status.

4. **Commit API partial failure:** Show success message with warning: "Saved {X} of {Y} items. {Z} items couldn't be mapped to profile fields." Still transition to profile view with what was saved.

5. **Long extraction (>30s):** The existing ProcessingPhase UI handles this with elapsed timer and reassuring messages. No change needed.

6. **Re-extraction after commit:** When user does another brain dump from the profile screen, they go through the full flow again. The review screen shows only the new extraction's recommendations (no reference to previously committed data).

7. **Browser refresh during review:** Extraction results are lost (client state only). User returns to welcome/profile step. This is acceptable — extraction is the expensive step and the review is a quick interaction.

---

## 8. Dependencies

- `ai` (^6.0.6) — AI SDK for `generateObject` calls
- `@ai-sdk/openai` (^3.0.2) — OpenAI provider
- `zod` (^4.3.5) — Schema definitions for refine endpoint
- `framer-motion` (^11.0.0) — Card animations
- `@prisma/client` — Database operations in commit endpoint
- No new npm packages required

---

## 9. Out of Scope

- Changing the AI extraction prompt or system prompt (can be tuned separately)
- Voice-based refinement (text prompt only)
- Version history for individual field recommendations
- Batch processing / chunked extraction for very long brain dumps
- Changes to the profile visualization or scoring system
- Database schema changes (all review state is client-side)
