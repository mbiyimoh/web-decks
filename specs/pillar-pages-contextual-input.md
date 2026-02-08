# Spec: Pillar-Level Canvas Pages & Contextual Input

**Slug:** pillar-pages-contextual-input
**Author:** Claude Code
**Date:** 2026-02-05
**Ideation:** `docs/ideation/pillar-pages-contextual-input.md`
**Patterns:** `docs/ideation/braindump-reviewable-recommendations.md`, `docs/clarity-canvas/prompt-based-text-iteration.md`, `docs/reference/gamified-score-improvement-summary-recap.md`

---

## 1. Overview

Transform the Clarity Canvas pillar experience from modal overlays to dedicated routed pages (`/clarity-canvas/[pillar]`), and add the ability to contribute context via type, speak, or file upload (.md, .pdf, .txt, .doc, .docx) at two scopes: pillar-global (all subsections) and sub-section-specific. After committing recommendations, show a gamified score improvement celebration adapted from the portable pattern in `gamified-score-improvement-summary-recap.md`.

---

## 2. Routing

### 2.1 New Dynamic Route

Create `app/clarity-canvas/[pillar]/page.tsx` as a Server Component.

**Valid pillar slugs** (match data model keys from `PROFILE_STRUCTURE`):
- `individual`, `role`, `organization`, `goals`, `network`, `projects`

**Route validation:**
```typescript
// app/clarity-canvas/[pillar]/page.tsx
import { PROFILE_STRUCTURE } from '@/lib/clarity-canvas/profile-structure';

const validPillars = Object.keys(PROFILE_STRUCTURE);

export function generateStaticParams() {
  return validPillars.map((pillar) => ({ pillar }));
}

export default async function PillarPage({ params }: { params: Promise<{ pillar: string }> }) {
  const { pillar } = await params;
  if (!validPillars.includes(pillar)) {
    notFound();
  }
  // Fetch profile server-side, render PillarPageClient
}
```

### 2.2 Navigation Changes

**Replace modal pattern with Link-based navigation:**

In `ListView.tsx` and `OrbitalView.tsx`, change section click handlers to use Next.js `<Link>` or `useRouter().push()`:

```typescript
// ListView.tsx — change from:
onClick={() => onSectionClick?.(section.key)}

// To:
<Link href={`/clarity-canvas/${section.key}`}>
```

The `onSectionClick` prop and `selectedSectionKey` state in `ClarityCanvasClient.tsx` are removed. The `SectionDetail.tsx` modal component is deleted.

### 2.3 Animated Navigation Transition

Next.js 14 does not support the View Transitions API, and framer-motion `layoutId` cannot animate across route changes (the source component unmounts before the target mounts). Use a two-part animation instead:

1. **Exit animation (ListView/OrbitalView):** On section click, the card scales down slightly (`scale: 0.97`) and fades out (`opacity: 0`) over 200ms before `router.push()` fires
2. **Entry animation (PillarPageClient):** The pillar page header and content use framer-motion `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` with staggered delays (header 0ms, subsections 100ms each)

This produces a polished feel without requiring same-document transitions.

**OrbitalView SVG caveat:** `<Link>` cannot be nested inside SVG `<g>` elements. Use `onClick={() => router.push(`/clarity-canvas/${section.key}`)}` with `useRouter()` instead of `<Link>` for OrbitalView nodes.

---

## 3. Pillar Page Layout

### 3.1 Component: `PillarPageClient.tsx`

```
app/clarity-canvas/[pillar]/PillarPageClient.tsx
```

**Props:**
```typescript
interface PillarPageClientProps {
  pillarKey: string;                    // e.g. 'individual'
  initialProfile: ProfileWithSections;  // Server-fetched profile
  initialScores: ProfileScores;         // Server-calculated scores
}
```

**State:**
```typescript
const [profile, setProfile] = useState(initialProfile);
const [scores, setScores] = useState(initialScores);
const [activeInput, setActiveInput] = useState<{
  scope: 'pillar' | 'subsection';
  subsectionKey?: string;             // only when scope === 'subsection'
} | null>(null);
const [inputStep, setInputStep] = useState<'choose' | 'text' | 'recording' | 'processing' | 'review'>('choose');
const [extractionResult, setExtractionResult] = useState<ExtractOnlyResponse | null>(null);
const [sourceType, setSourceType] = useState<'VOICE' | 'TEXT'>('TEXT');
const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
const [error, setError] = useState<string | null>(null);
const [isUploading, setIsUploading] = useState(false);
```

### 3.2 Page Structure

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Canvas    [pillar icon] [pillar name]     │
│                                          Score: 42% │
├─────────────────────────────────────────────────────┤
│                                                     │
│ PILLAR-GLOBAL CONTEXT INPUT                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ "Add context to improve all areas of [pillar]"  │ │
│ │ [Type] [Speak] [Upload File]                    │ │
│ └─────────────────────────────────────────────────┘ │
│  ↕ (collapses into FAB when scrolled past)          │
│                                                     │
│ SUBSECTION: Background & Identity      3/5 complete │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ● Career Path: "Cofounder and CEO..."           │ │
│ │ ● Education: "Stanford MBA..."                  │ │
│ │ ○ Areas of Expertise: No data yet               │ │
│ │ ○ Years of Experience: No data yet              │ │
│ │ ● Industry Background: "Fintech..."             │ │
│ │                                                 │ │
│ │ [+ Add context for Background & Identity]       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ SUBSECTION: Thinking Style             1/4 complete │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ...fields...                                    │ │
│ │ [+ Add context for Thinking Style]              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ...more subsections...                              │
│                                                     │
└─────────────────────────────────────────────────────┘

[FAB: + Add Context] (appears when global input scrolls out of view)
```

### 3.3 Header

- Back link: `<Link href="/clarity-canvas">` with left arrow
- Pillar icon + name from `PROFILE_STRUCTURE[pillarKey]`
- Section score from `scores.sections[pillarKey]` with `getScoreColor()` styling
- Animated score display (Framer Motion spring on mount)

### 3.4 Subsection Cards

Migrate field display from `SectionDetail.tsx`:
- Subsection header: gold mono label + completion count (`getSubsectionCompletion()`)
- Fields sorted by completion (populated first via `calculateFieldScore()`)
- Each field: green/grey dot, field name, summary or "No data yet"
- Source count badge for populated fields
- "Add context for [subsection name]" button at bottom of each card

### 3.5 Pillar-Global Input Section

Positioned at the top of the page, below the header:
- Card with description: "Add context to improve all areas of [pillar name]"
- Three input method buttons: Type, Speak, Upload File
- When the user scrolls past this section, it collapses into a **floating action button (FAB)** in the bottom-right corner

### 3.6 FAB Behavior

The FAB appears when the pillar-global input section scrolls out of the viewport. Use `IntersectionObserver` via a `useRef` on the global input section, updating a boolean state that drives `AnimatePresence`:

```typescript
const globalInputRef = useRef<HTMLDivElement>(null);
const [isGlobalInputVisible, setIsGlobalInputVisible] = useState(true);

useEffect(() => {
  if (!globalInputRef.current) return;
  const observer = new IntersectionObserver(
    ([entry]) => setIsGlobalInputVisible(entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(globalInputRef.current);
  return () => observer.disconnect();
}, []);

// In JSX:
<div ref={globalInputRef}>{/* Pillar-global input */}</div>
<AnimatePresence>
  {!isGlobalInputVisible && activeInput === null && (
    <motion.div
      key="fab"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-6 right-6 z-30"
    >
      {/* FAB button */}
    </motion.div>
  )}
</AnimatePresence>
```

**On FAB click:**
1. Opens a floating panel (absolute positioned above the FAB)
2. Panel asks: "What scope should this context apply to?"
   - "All of [pillar name]" (pillar-global)
   - List of subsection names as options (subsection-specific)
3. After scope selection, shows the same input method chooser (Type / Speak / Upload)

---

## 4. Context Input Component

### 4.1 Shared Component: `ContextInput.tsx`

```
app/clarity-canvas/components/ContextInput.tsx
```

Reusable component for both pillar-global and subsection-level input. Wraps the input method selection, text entry, voice recording, and file upload into a single component.

**Props:**
```typescript
interface ContextInputProps {
  scope: {
    section: string;              // pillar key
    subsection?: string;          // undefined = pillar-global
  };
  onExtracted: (result: ExtractOnlyResponse) => void;
  onCancel: () => void;
  minVoiceDuration?: number;      // default: 20 for pillar, 10 for subsection
}
```

**Internal state machine:**
```
choose → text | recording | uploading → processing → done (calls onExtracted)
```

### 4.2 Text Input Mode

Same pattern as `BrainDumpScreen` in `ClarityCanvasClient.tsx`:
- Textarea with placeholder contextual to scope:
  - Pillar-global: "Share more about your [pillar name]..."
  - Subsection: "Tell us about your [subsection name]..."
- Minimum 50 characters
- Submit button

### 4.3 Voice Input Mode

Reuse `VoiceRecorder` component:
- `minDuration`: 20s for pillar-global, 10s for subsection
- `maxDuration`: 120s (same as main brain dump)
- On completion: call transcribe API, then scoped extract API

### 4.4 File Upload Mode

New input mode:
- File input with accept filter: `.md,.pdf,.txt,.doc,.docx`
- Size limits: 5MB for .pdf/.doc/.docx, 1MB for .md/.txt
- Client-side validation of file type and size before upload
- Progress indicator during upload
- On completion: POST to upload API, receive extracted text, feed to scoped extract API

**Flow:**
```
User selects file
  → Client validates type + size
  → POST /api/clarity-canvas/upload (FormData with file)
  → Server extracts text from file
  → Returns { text, filename, charCount }
  → Client sends text to POST /api/clarity-canvas/extract with scope
  → Returns ExtractOnlyResponse
  → calls onExtracted()
```

---

## 5. Scoped Extraction

### 5.1 Extract API Changes

Extend `POST /api/clarity-canvas/extract` to accept an optional `scope` parameter:

```typescript
interface ExtractRequestBody {
  transcript: string;
  sourceType: 'VOICE' | 'TEXT';
  scope?: {
    section: string;           // e.g. 'individual'
    subsection?: string;       // e.g. 'background' (optional)
  };
}
```

### 5.2 Prompt-Level Scoping

When `scope` is provided, build a **scoped extraction prompt** that only lists the target section's subsections and fields. This focuses the AI's attention and prevents out-of-scope chunks.

**New function in `prompts.ts`:**
```typescript
export function buildScopedExtractionPrompt(
  sectionKey: string,
  subsectionKey?: string
): string
```

**Logic:**
1. Look up section in `PROFILE_STRUCTURE`
2. If `subsectionKey` is provided, only include that subsection's fields
3. If only `sectionKey`, include all subsections within that section
4. Build a prompt with the same structure as `BRAIN_DUMP_EXTRACTION_PROMPT` but scoped:

```
You are an expert at extracting structured profile information from unstructured text.

Given text about someone, extract relevant information into the following profile fields:

SECTION: [section name] ([section description])

SUBSECTION: [subsection name]
Fields:
- [field_key]: [field display name]
- [field_key]: [field display name]
...

[If pillar-global, repeat for all subsections in the section]

EXTRACTION RULES:
[Same rules as main extraction prompt]
```

5. The `targetSection` in the schema enum is constrained to the single section key
6. The `targetSubsection` and `targetField` are constrained to valid values within scope

### 5.3 Schema Scoping

The extraction schema's `targetSection` field currently uses a static enum. For scoped extraction, create a **dynamic schema builder** in `extraction-schema.ts`:

```typescript
// lib/clarity-canvas/extraction-schema.ts

export function buildScopedExtractionSchema(sectionKey: string) {
  const scopedChunkSchema = z.object({
    content: z.string().describe('The extracted content verbatim from the text'),
    targetSection: z.literal(sectionKey).describe('The profile section'),
    targetSubsection: z.string().describe('The subsection key'),
    targetField: z.string().describe('The specific field key'),
    summary: z.string().max(150).describe('Brief summary for display (max 150 chars)'),
    confidence: z.number().min(0).max(1).describe('Confidence in this extraction (0-1)'),
    insights: z.array(z.string()).describe('Key insights about this information'),
  });

  return z.object({
    chunks: z.array(scopedChunkSchema).describe('Extracted information chunks'),
    overallThemes: z.array(z.string()).describe('Themes identified in the text'),
    suggestedFollowUps: z.array(z.string()).describe('Questions to fill gaps'),
  });
}
```

The Vercel AI SDK's `generateObject` accepts a schema per call, so passing a dynamically constructed Zod object is fully supported. The `z.literal(sectionKey)` constraint prevents the AI from hallucinating out-of-scope sections.

In the extract route, use the scoped schema when `scope` is provided:
```typescript
const schema = body.scope
  ? buildScopedExtractionSchema(body.scope.section)
  : brainDumpExtractionSchema;

const prompt = body.scope
  ? buildScopedExtractionPrompt(body.scope.section, body.scope.subsection)
  : BRAIN_DUMP_EXTRACTION_PROMPT;

const { object: extraction } = await generateObject({
  model: openai('gpt-4o'),
  schema,
  system: EXTRACTION_SYSTEM_PROMPT,
  prompt: `${prompt}\n\nTRANSCRIPT:\n${body.transcript}`,
});
```

### 5.4 Post-Extraction Validation

The existing fuzzy key matching validation in the extract route already handles this — chunks targeting invalid sections/subsections/fields are dropped. The prompt-level scoping is the primary gate; validation is the safety net.

---

## 6. File Upload API

### 6.1 New Endpoint: `POST /api/clarity-canvas/upload`

```
app/api/clarity-canvas/upload/route.ts
```

**Runtime:** Must export `export const runtime = 'nodejs';` — `pdf-parse` and `mammoth` use Node.js APIs (Buffer, fs) incompatible with Edge Runtime.

**Request:** FormData with `file` field

**Response:**
```typescript
interface FileUploadResponse {
  text: string;          // Extracted plain text
  filename: string;      // Original filename
  charCount: number;     // Character count of extracted text
  fileType: string;      // Detected MIME type
  wasTruncated: boolean; // True if text was truncated to 50k chars
}
```

### 6.2 File Processing Logic

```typescript
const file = formData.get('file') as File;
const buffer = Buffer.from(await file.arrayBuffer());

// Route by file extension
const ext = file.name.split('.').pop()?.toLowerCase();

let text: string;

switch (ext) {
  case 'txt':
    text = buffer.toString('utf-8');
    break;

  case 'md':
    // Strip markdown formatting to plain text
    const removeMd = (await import('remove-markdown')).default;
    text = removeMd(buffer.toString('utf-8'));
    break;

  case 'pdf':
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(buffer);
    text = pdfData.text;
    break;

  case 'doc':
  case 'docx':
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
    break;

  default:
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
}
```

### 6.3 Validation

- Auth: require unified session
- File size: reject if > 5MB (pdf/doc/docx) or > 1MB (md/txt)
- File type: validate extension against allowlist AND check MIME type
- Empty text: reject if extracted text is empty or whitespace-only
- Text length: warn (don't reject) if extracted text exceeds 50,000 characters

### 6.4 Dependencies

New npm packages:
- `pdf-parse` — PDF text extraction (~15KB, stable). **Note:** `pdf-parse` has a native `test` directory dependency that can cause issues on some platforms. If Railway deployment fails, switch to `unpdf` or pin a specific version that excludes test files.
- `remove-markdown` — Markdown to plain text (~5KB)
- `mammoth` — .doc/.docx text extraction (~200KB)

---

## 7. Review Flow (Scoped)

After extraction (regardless of input method), the pillar page transitions to a review experience. This reuses the existing `RecommendationReview` and `RecommendationCard` components.

### 7.1 Inline Review

The review UI replaces the subsection cards area on the pillar page (not a separate route). The header stays visible with the pillar name and back navigation.

**Layout note:** `RecommendationReview` was designed for full-page use (`min-h-screen`, sticky header). When rendering inline within `PillarPageClient`, wrap it in a container and override layout-level styles (remove `min-h-screen`, ensure the sticky header doesn't conflict with the pillar page's own header). Alternatively, extract the review cards list and commit footer into a sub-component that `PillarPageClient` renders directly.

**Rendering:**
```tsx
{inputStep === 'review' && extractionResult && (
  <RecommendationReview
    extractedChunks={extractionResult.extractedChunks}
    overallThemes={extractionResult.overallThemes}
    suggestedFollowUps={extractionResult.suggestedFollowUps}
    sourceType={sourceType}
    onCommit={handleCommit}
    onBack={handleCancelReview}
  />
)}
```

### 7.2 Commit Handler

The `handleCommit` callback receives the updated profile and scores from the commit API. It then triggers the celebration flow:

```typescript
const handleCommit = (
  updatedProfile: ProfileWithSections,
  newScores: ProfileScores,
  previousScores: ProfileScores,
  savedCount: number
) => {
  const previousSectionScore = previousScores.sections[pillarKey] ?? 0;
  const newSectionScore = newScores.sections[pillarKey] ?? 0;

  const fieldsUpdated = savedCount;

  setCelebrationData({
    previousScore: previousSectionScore,
    newScore: newSectionScore,
    fieldsUpdated,
    pillarName: PROFILE_STRUCTURE[pillarKey].name,
    pillarIcon: PROFILE_STRUCTURE[pillarKey].icon,
  });

  setProfile(updatedProfile);
  setScores(newScores);
  setExtractionResult(null);
  setActiveInput(null);
  setInputStep('choose');
};
```

---

## 8. Score Celebration

Adapted from `gamified-score-improvement-summary-recap.md` for use within the pillar page context. This is a simpler variant (no ranking/leaderboard — just score delta + update summary).

### 8.1 Component: `PillarCelebration.tsx`

```
app/clarity-canvas/components/PillarCelebration.tsx
```

**Props:**
```typescript
interface CelebrationData {
  previousScore: number;
  newScore: number;
  fieldsUpdated: number;
  pillarName: string;
  pillarIcon: string;
}

interface PillarCelebrationProps {
  data: CelebrationData;
  onDismiss: () => void;
}
```

### 8.2 Animation Phase State Machine

Following the portable pattern but simplified (no ranking tier):

```typescript
type CelebrationPhase = 'initial' | 'score-animating' | 'score-complete' | 'summary' | 'complete';

// Derived visibility
const showScoreBar = phase !== 'initial';
const showDelta = ['score-complete', 'summary', 'complete'].includes(phase);
const showSummary = ['summary', 'complete'].includes(phase);
const showCTA = phase === 'complete';
```

**Timeline:**
```typescript
useEffect(() => {
  const timers: NodeJS.Timeout[] = [];
  timers.push(setTimeout(() => setPhase('score-animating'), 300));
  timers.push(setTimeout(() => {
    setPhase('score-complete');
    playScoreComplete();  // C major chime
  }, 1800));
  timers.push(setTimeout(() => setPhase('summary'), 2100));
  timers.push(setTimeout(() => setPhase('complete'), 2600));
  return () => timers.forEach(clearTimeout);
}, []);
```

### 8.3 Score Bar

Framer Motion spring physics for the progress bar fill:

```typescript
const springValue = useSpring(data.previousScore, { stiffness: 50, damping: 20 });
const width = useTransform(springValue, [0, 100], ['0%', '100%']);

useEffect(() => {
  if (phase !== 'initial') springValue.set(data.newScore);
}, [phase, data.newScore, springValue]);
```

Multi-zone color gradient (red 0-25 → orange 25-50 → amber 50-75 → green 75-100).

**Number ticker:** RAF-based counter with ease-out quadratic, 1500ms duration. Shows the score animating from previous to new value.

**Delta badge:** After score-complete phase, fade in `+N` badge.

### 8.4 Update Summary

After score animation completes, reveal:
- "{fieldsUpdated} fields updated in {pillarName}"
- Delta: "{previousScore}% → {newScore}%" with color transition

### 8.5 Sound

Web Audio API sine oscillator chimes (no audio files):
- Score complete: C major chord (523.25, 659.25, 783.99 Hz), 1.0s decay
- 80ms arpeggio spacing, 0.15 max gain, exponential decay
- Lazy AudioContext initialization (browser autoplay policy)

### 8.6 Dismissal

Manual dismiss only (no auto-dismiss). On dismiss:
```typescript
const handleDismiss = () => {
  setCelebrationData(null);
  router.refresh(); // Re-fetch server components to sync any server-rendered score displays
};
```

The `router.refresh()` ensures that if the pillar page's Server Component displays any score data (e.g. in metadata or layout), it rehydrates with the new values. The client state (`profile`, `scores`) is already updated — `router.refresh()` is for server data consistency.

### 8.7 Visual Layout

Full-screen overlay (same z-index pattern as confirmation dialog):
```
┌─────────────────────────────────────────┐
│                                         │
│         [pillar icon]                   │
│     [pillar name] Clarity               │
│                                         │
│     ████████████░░░░░  67%  (+14)       │
│     [score bar with spring fill]        │
│                                         │
│     5 fields updated in Individual      │
│     42% → 67%                           │
│                                         │
│     [Continue Exploring]                │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Commit API Enhancement

The existing `/api/clarity-canvas/commit` route needs to return the previous section score so the celebration can show accurate deltas.

### 9.1 Response Extension

Add `previousScores` to the commit response:

```typescript
export interface CommitRecommendationsResponse {
  updatedProfile: ProfileWithSections;
  scores: ProfileScores;
  previousScores: ProfileScores;  // NEW — captured before mutations
  savedCount: number;
  droppedCount: number;
}
```

### 9.2 Implementation Change

In `commit/route.ts`, capture scores before applying mutations:

```typescript
// Before processing recommendations:
const preCommitScores = calculateAllScores(profile.sections);

// ... process recommendations ...

// After:
const postCommitScores = calculateAllScores(updatedProfile.sections);

return NextResponse.json({
  updatedProfile: typedProfile,
  scores: postCommitScores,
  previousScores: preCommitScores,
  savedCount,
  droppedCount,
});
```

---

## 10. Component Deletions

### 10.1 Remove `SectionDetail.tsx`

Delete `app/clarity-canvas/components/SectionDetail.tsx`. Its content (subsection cards, field display) is migrated to `PillarPageClient.tsx`.

### 10.2 Remove Modal Rendering in `ClarityCanvasClient.tsx`

Remove:
- `selectedSectionKey` state
- `setSelectedSectionKey` in ProfileScreen's `onSectionClick`
- The `<AnimatePresence>` block that renders `SectionDetail`
- The import of `SectionDetail`

### 10.3 Update `ProfileVisualization` Props

Remove `onSectionClick` callback prop from `ProfileVisualization`, `ListView`, and `OrbitalView`. Replace with Link-based navigation (the components render `<Link>` elements internally).

---

## 11. Types

### 11.1 New Types in `types.ts`

```typescript
// Scoped extraction request
export interface ScopedExtractRequest {
  transcript: string;
  sourceType: 'VOICE' | 'TEXT';
  scope?: {
    section: string;
    subsection?: string;
  };
}

// File upload response
export interface FileUploadResponse {
  text: string;
  filename: string;
  charCount: number;
  fileType: string;
  wasTruncated: boolean;
}

// Celebration data
export interface CelebrationData {
  previousScore: number;
  newScore: number;
  fieldsUpdated: number;
  pillarName: string;
  pillarIcon: string;
}
```

### 11.2 Extended CommitRecommendationsResponse

Add `previousScores: ProfileScores` field (see section 9.1).

---

## 12. File Inventory

### New Files
| File | Type | Purpose |
|------|------|---------|
| `app/clarity-canvas/[pillar]/page.tsx` | Server Component | Route entry, fetch profile, validate slug |
| `app/clarity-canvas/[pillar]/PillarPageClient.tsx` | Client Component | Pillar page UI + state management |
| `app/clarity-canvas/components/ContextInput.tsx` | Client Component | Shared type/speak/upload input |
| `app/clarity-canvas/components/PillarCelebration.tsx` | Client Component | Score improvement celebration |
| `app/api/clarity-canvas/upload/route.ts` | API Route | File upload + text extraction |

### Modified Files
| File | Changes |
|------|---------|
| `app/clarity-canvas/ClarityCanvasClient.tsx` | Remove modal state/rendering, remove SectionDetail import |
| `app/clarity-canvas/components/ListView.tsx` | Replace `onSectionClick` with `<Link>` navigation |
| `app/clarity-canvas/components/OrbitalView.tsx` | Replace `onSectionClick` with `<Link>` navigation |
| `app/clarity-canvas/components/ProfileVisualization.tsx` | Remove `onSectionClick` prop, pass through Link pattern |
| `app/api/clarity-canvas/extract/route.ts` | Add `scope` param, scoped prompt building |
| `app/clarity-canvas/components/RecommendationReview.tsx` | Extend `onCommit` callback to pass `previousScores` and `savedCount` |
| `app/api/clarity-canvas/commit/route.ts` | Return `previousScores` in response |
| `lib/clarity-canvas/prompts.ts` | Add `buildScopedExtractionPrompt()` function |
| `lib/clarity-canvas/types.ts` | Add new types, extend CommitRecommendationsResponse |
| `lib/clarity-canvas/extraction-schema.ts` | Add `buildScopedExtractionSchema()` for constrained targetSection |

### Deleted Files
| File | Reason |
|------|--------|
| `app/clarity-canvas/components/SectionDetail.tsx` | Replaced by pillar page |

### New Dependencies
| Package | Purpose | Size |
|---------|---------|------|
| `pdf-parse` | PDF text extraction | ~15KB |
| `remove-markdown` | Markdown to plain text | ~5KB |
| `mammoth` | .doc/.docx text extraction | ~200KB |

---

## 13. Edge Cases

1. **Invalid pillar slug**: `generateStaticParams()` pre-generates valid slugs; dynamic access validated with `notFound()`
2. **Empty file upload**: Reject with "File appears to be empty" error
3. **Scanned PDF (no text)**: `pdf-parse` returns empty string — show "This PDF doesn't contain extractable text. Try a text-based PDF."
4. **Very large extracted text (>50k chars)**: Truncate to first 50,000 characters, set `wasTruncated: true` in response, and show client-side warning: "File was truncated to first 50,000 characters"
5. **Zero extraction chunks after scoped extraction**: Show "No relevant information found for [section/subsection]. Try providing more specific context." with a "Try Again" button
6. **Score didn't change after commit**: Skip celebration entirely — just show "Updates saved" toast and refresh the subsection cards
7. **User navigates away during processing**: `useEffect` cleanup cancels fetch requests
8. **FAB scope selection with only one subsection visible**: Still show scope chooser for consistency
9. **Concurrent input sessions**: Only one `activeInput` at a time — starting a new input cancels the previous one

---

## 14. Design System Compliance

All new components follow the 33 Strategies design system (`.claude/skills/33-strategies-frontend-design.md`):

- **Backgrounds:** `#0a0a0f` (page), `#111114` (cards), `#0d0d14` (header)
- **Text:** `#f5f5f5` (headlines), `#888888` (body), `#555555` (tertiary)
- **Accent:** `#d4a54a` (gold) for labels, active states, FAB
- **Typography:** `font-display` for headlines, `font-body` for text, `font-mono` for labels
- **Label pattern:** `text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase`
- **Card pattern:** `bg-[#111114] border border-zinc-800 rounded-2xl`
- **Button pattern:** Gold primary (`bg-[#d4a54a]/10 text-[#d4a54a] border border-[#d4a54a]/30`), zinc secondary
- **Animations:** Framer Motion springs (stiffness: 300, damping: 30 for UI, stiffness: 50, damping: 20 for score bar)
