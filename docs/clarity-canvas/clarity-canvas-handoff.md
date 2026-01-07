# Clarity Canvas: Complete Handoff Package

> Technical specification and implementation guide for the Clarity Canvas progressive profile-building system.

**Package Version:** 2.1 (January 2025)
**Status:** Frontend prototypes complete, backend integration analysis complete

---

## Executive Summary

Clarity Canvas is a **multi-modal context extraction system** that builds rich client profiles through:

1. **Voice/text brain dumps** → Unstructured input parsed into structured fields
2. **Interactive questionnaires** → Clickable formats with confidence signals  
3. **Web research enrichment** → Auto-discovered information requiring approval
4. **Ongoing refinement** → Iterative deepening through conversation

**Core Insight:** The quality of AI output depends on the quality of context input. Clarity Canvas systematically captures that context with confidence tracking, source attribution, and progressive disclosure.

### Integration Summary

| Requirement | Existing Coverage | Gap Size | Effort |
|-------------|-------------------|----------|--------|
| Voice/Text Ingestion | 90% | Small | 2-4 hrs |
| Multi-Field Extraction | 70% | Medium | 4-6 hrs |
| Structured Question Responses | 10% | Large | 8-12 hrs |
| Profile Schema | 40% | Medium | 4-8 hrs |
| Additive Merging | 75% | Small | 2-4 hrs |
| Confidence Tracking | 0% | Large | 4-6 hrs |
| Score Calculation | 80% | Small | 2-4 hrs |
| Source Attribution | 30% | Medium | 2-4 hrs |

**Total Estimate:** 42-70 hours (60% reuse from Better Connections infrastructure)

---

## Table of Contents

1. [Complete User Flow](#1-complete-user-flow)
2. [Data Architecture](#2-data-architecture)
3. [Backend Integration](#3-backend-integration)
4. [API Endpoints Required](#4-api-endpoints-required)
5. [Component Reference](#5-component-reference)
6. [State Management](#6-state-management)
7. [Reuse Mapping](#7-reuse-mapping)
8. [File Manifest](#8-file-manifest)

---

## 1. Complete User Flow

### Phase 1: Brain Dump (Screens 1-4)

**Screen 1: Welcome**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ✦                                  │
│                         33                                  │
│                                                             │
│              Let's build your foundation.                   │
│                                                             │
│         Take 30-60 seconds to share what's on               │
│         your mind. Think of it as a brain dump.             │
│                                                             │
│                    [ Let's Begin ]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Screen 2: Brain Dump Input**
- 6 cue questions displayed as prompts (not required to answer):
  - What's your current role?
  - What are you working on right now?
  - What's your biggest challenge?
  - What does success look like?
  - Who are you trying to reach?
  - What's on your mind?
- Large microphone button to start recording
- Option to type instead

**Screen 3: Recording**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     ⬤ Recording...                          │
│                                                             │
│              ╭─────────────────────────╮                    │
│              │                         │                    │
│              │    [Waveform bars]      │  ← Animated        │
│              │    ▁▃▅▇▅▃▁▂▄▆▅▃▂       │                    │
│              │                         │                    │
│              ╰─────────────────────────╯                    │
│                                                             │
│                       0:23 / 0:30                           │
│              ━━━━━━━━━━━━━━━━━━○━━━━━━━━                    │
│                                                             │
│               Minimum 30 seconds required                   │
│                                                             │
│                   [ Done Recording ]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
- 30 second minimum enforced (button disabled until reached)
- Visual progress indicator (circular + bar)
- Waveform animation during recording

**Screen 4: Processing**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    Building your profile...                 │
│                                                             │
│              ✓ Transcribing your input                      │
│              ◐ Extracting key themes...                     │
│              ○ Building initial profile                     │
│                                                             │
│              ━━━━━━━━━━━━━━━━━━━━━━                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
- Three-step animation sequence
- Progress bar fills as steps complete
- Simulated 3-4 second duration total

---

### Phase 2: Initial Profile Reveal (Screen 5)

**Display:** Profile dashboard with LOW scores (15-32% range)

**Two View Modes (toggle in header):**

**Orbital View (◎):**
- User as center nucleus
- 6 sections orbit around user
- Distance from center = needs attention (lower = closer)
- Node size/glow = score completeness
- Breathing animation on nodes

**List View (☰):**
- Stacked cards for each section
- Progress bar showing score
- Clean, scannable format

**Initial Scores (Post Brain-Dump):**
| Section | Score | Summary |
|---------|-------|---------|
| Individual | 28% | Basic professional context |
| Role | 32% | Current position identified |
| Organization | 22% | Company mentioned |
| Goals | 18% | Some objectives captured |
| Network | 15% | Limited relationship info |
| Projects | 20% | Active work mentioned |
| **Overall** | **24%** | Foundation established |

**Below visualization:**
```
"Nice."
"We have a solid foundation."  
"Now let's sharpen your vision with a few quick interactive questions."

                    [ Let's go deeper ]
```

---

### Phase 3: Interactive Interview (Screens 6-13)

**8 Questions total, each wrapped with QuestionMetaWrapper:**

#### Question Structure (Universal Pattern)

Every question follows this exact structure:

```
┌─────────────────────────────────────────────────────────────┐
│  1/8                                                 Goals  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  When you imagine success, which feels more true?           │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │                     │  │                     │          │
│  │  Users come back    │  │  Users tell their   │          │
│  │  every day          │  │  friends about it   │          │
│  │                     │  │                     │          │
│  │  ─────────────────  │  │  ─────────────────  │          │
│  │  Retention is the   │  │  Organic growth is  │          │
│  │  north star         │  │  the north star     │          │
│  │                     │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ☐ I'm not sure about this                                  │
│    That's okay — we'll flag this for validation             │
├─────────────────────────────────────────────────────────────┤
│  How confident are you?                              [75%]  │
│  ○━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━○                       │
│  Just guessing    Fairly confident    Have data             │
├─────────────────────────────────────────────────────────────┤
│  + Add context or reasoning                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│    [🎤 Voice]  [⌨ Text]                                     │
│    Optional: Add more context...                            │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
├─────────────────────────────────────────────────────────────┤
│                                         [ Continue ]        │
└─────────────────────────────────────────────────────────────┘
```

#### The 8 Questions

| # | Type | Category | Question |
|---|------|----------|----------|
| 1 | This-or-That | Goals | "When you imagine success, which feels more true?" (Retention vs Growth) |
| 2 | This-or-That | Individual | "How do you naturally approach problems?" (Data-first vs Gut instinct) |
| 3 | Slider | Organization | "How much runway do you currently have?" (0-24 months) |
| 4 | Multi-Select | Organization | "What are your biggest constraints right now?" (Time, Capital, Team, Tech, Market, Focus) |
| 5 | This-or-That | Role | "Right now, what do you need to be?" (Visionary vs Operator) |
| 6 | Scale | Goals | "How validated is your core product hypothesis?" (4 levels) |
| 7 | This-or-That | Goals | "In 12 months, which outcome matters more?" (Profitable vs Venture-scale) |
| 8 | Multi-Select | Network | "What kind of help would be most valuable?" (Technical, Fundraising, Strategy, Team, Operations, Partnerships) - max 3 |

#### Question Type Specifications

**This-or-That:**
```javascript
{
  type: 'this-or-that',
  options: [
    { id: 'a', label: 'Primary text', sublabel: 'Supporting context' },
    { id: 'b', label: 'Primary text', sublabel: 'Supporting context' }
  ]
}
```

**Slider:**
```javascript
{
  type: 'slider',
  min: 0,
  max: 24,
  step: 1,
  unit: 'months',
  markers: [
    { value: 0, label: 'Tight' },
    { value: 12, label: '12mo' },
    { value: 24, label: '24mo+' }
  ]
}
```

**Multi-Select:**
```javascript
{
  type: 'multi-select',
  maxSelections: null, // or specific number like 3
  options: [
    { id: 'x', icon: '⏰', label: 'Time' },
    { id: 'y', icon: '💰', label: 'Capital' },
    // ...
  ]
}
```

**Scale:**
```javascript
{
  type: 'scale',
  levels: [
    { value: 1, label: 'Just a hypothesis' },
    { value: 2, label: 'Some signals' },
    { value: 3, label: 'Growing confidence' },
    { value: 4, label: 'Validated' }
  ]
}
```

#### Response Data Structure

```javascript
{
  questionId: 'q1',
  value: 'a', // or ['x', 'y'] for multi-select, or 12 for slider
  isUnsure: false,
  confidence: 0.75, // 0-1
  additionalContext: 'User provided explanation...',
  contextSource: 'text', // or 'voice'
  timestamp: '2025-01-03T15:30:00Z'
}
```

---

### Phase 4: Animated Score Reveal (Screen 14)

**Sequence:**
1. Display initial profile (1.5s hold)
2. Trigger animation flag
3. Scores animate upward over 2.5s
4. Staggered section animations (150ms between)
5. Green celebration pulse on each updating element
6. Banner appears: "Foundation score increased by +28%"

**Enriched Scores (Post Interview):**
| Section | Before | After | Δ |
|---------|--------|-------|---|
| Individual | 28% | 58% | +30% |
| Role | 32% | 62% | +30% |
| Organization | 22% | 48% | +26% |
| Goals | 18% | 55% | +37% |
| Network | 15% | 35% | +20% |
| Projects | 20% | 45% | +25% |
| **Overall** | **24%** | **52%** | **+28%** |

**Animation Keyframes:**
```css
@keyframes scoreIncrease {
  0% { transform: scale(1); color: inherit; }
  50% { transform: scale(1.1); color: #4ADE80; }
  100% { transform: scale(1); color: inherit; }
}

@keyframes celebratePulse {
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
}
```

**CTA:** "Continue to Research" → Leads to Research Accelerant flow

---

### Phase 5: Research Accelerant (Separate Flow)

Web research findings presented for approval:
- Each finding shows: source, discovery, recommendation
- User can: Approve, Skip, or Edit each finding
- Approved findings merge into profile fields
- Score updates after each approval

See `research-accelerant.jsx` for complete implementation.

---

### Phase 6: Deep Exploration (Ongoing)

4-level progressive disclosure:
1. **Orbital overview** → All 6 sections visible
2. **Section expanded** → Subsections as cards
3. **Subsection detail** → Individual fields listed
4. **Field expanded** → Full context, insights, edit options

See `living-profile-canvas.jsx` for complete implementation.

---

## 2. Data Architecture

### Profile Schema

```typescript
interface Profile {
  user: {
    id: string;
    name: string;
    level: 1-6; // IC → Founder
    company: string;
    lastActive: string;
    totalHours: number;
    totalSessions: number;
  };
  
  overallScore: number; // 0-100
  
  sections: {
    [sectionId: string]: Section;
  };
}

interface Section {
  id: string;
  name: string;
  icon: string;
  score: number;
  summary: string;
  subsections: {
    [subsectionId: string]: Subsection;
  };
}

interface Subsection {
  id: string;
  name: string;
  score: number;
  summary: string;
  fields: {
    [fieldId: string]: Field;
  };
}

interface Field {
  id: string;
  name: string;
  
  // Content
  summary: string; // Short display version
  fullContext: string; // Complete captured context
  
  // Metadata
  score: number; // 0-100 completeness
  confidence: number; // 0-1 user confidence
  flaggedForValidation: boolean;
  
  // Provenance
  sources: Source[];
  
  // AI-generated
  insights: string[];
  
  // Temporal
  lastUpdated: string;
  updateHistory: UpdateRecord[];
}

interface Source {
  type: 'voice_input' | 'text_input' | 'questionnaire' | 'research' | 'manual';
  timestamp: string;
  sessionId?: string;
  questionId?: string;
  sourceUrl?: string;
  approved?: boolean;
}
```

### Prisma Schema (Recommended)

Based on integration analysis with Better Connections infrastructure:

```prisma
model ClarityProfile {
  id          String   @id @default(uuid())
  userId      String
  name        String
  level       Int      @default(6)  // 1-6 seniority level
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sections    ProfileSection[]
}

model ProfileSection {
  id          String   @id @default(uuid())
  profileId   String
  key         String   // e.g., "individual", "goals"
  label       String
  icon        String?
  order       Int

  subsections ProfileSubsection[]
  profile     ClarityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, key])
}

model ProfileSubsection {
  id          String   @id @default(uuid())
  sectionId   String
  key         String   // e.g., "background", "thinking_style"
  label       String
  order       Int

  fields      ProfileField[]
  section     ProfileSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@unique([sectionId, key])
}

model ProfileField {
  id                   String   @id @default(uuid())
  subsectionId         String
  key                  String   // e.g., "education", "career"
  label                String

  // Core content
  summary              String?  // Short display version
  fullContext          String?  @db.Text  // Complete captured context

  // Scoring
  score                Int      @default(0)  // 0-100 completeness
  confidence           Float    @default(0)  // 0-1 user-stated
  flaggedForValidation Boolean  @default(false)

  // AI insights
  insights             Json?    // Array of extracted key points

  // Metadata
  lastUpdated          DateTime @updatedAt

  sources              FieldSource[]
  subsection           ProfileSubsection @relation(fields: [subsectionId], references: [id], onDelete: Cascade)

  @@unique([subsectionId, key])
}

model FieldSource {
  id             String     @id @default(uuid())
  fieldId        String
  type           SourceType
  rawContent     String     @db.Text  // Original input
  extractedAt    DateTime   @default(now())
  questionId     String?
  userConfidence Float      @default(1.0)  // 0-1 user-stated

  field          ProfileField @relation(fields: [fieldId], references: [id], onDelete: Cascade)
}

enum SourceType {
  VOICE
  TEXT
  QUESTION
  IMPORT
}
```

### Section Hierarchy

```
Profile
├── Individual (who you are)
│   ├── Background & Identity (6-8 fields)
│   ├── Thinking Style (5-7 fields)
│   ├── Working Style (6-8 fields)
│   ├── Values & Motivations (5-6 fields)
│   └── Strengths & Growth (4-6 fields)
│
├── Role (what you do)
│   ├── Core Responsibilities (6-8 fields)
│   ├── Scope & Authority (5-7 fields)
│   ├── Reporting Structure (4-6 fields)
│   ├── Cross-functional Touchpoints (5-7 fields)
│   └── Constraints & Challenges (5-6 fields)
│
├── Organization (where you operate)
│   ├── Company Fundamentals (7-9 fields)
│   ├── Product & Strategy (6-8 fields)
│   ├── Team & Culture (6-7 fields)
│   ├── Market Position (5-7 fields)
│   └── Technology & Operations (5-6 fields)
│
├── Goals (what you're pursuing)
│   ├── Immediate Objectives (5-7 fields)
│   ├── Medium-term Aspirations (5-6 fields)
│   ├── Long-term Vision (4-5 fields)
│   ├── Success Metrics (5-7 fields)
│   └── Urgency & Drivers (4-6 fields)
│
├── Network (who you work with)
│   ├── Key Stakeholders (6-8 fields)
│   ├── Team & Direct Reports (5-7 fields)
│   ├── External Partners (4-6 fields)
│   ├── Mentors & Advisors (3-5 fields)
│   └── Industry Connections (4-6 fields)
│
└── Projects (what you're building)
    ├── Active Initiatives (6-8 fields)
    ├── Upcoming Priorities (4-6 fields)
    ├── Completed Work (4-6 fields)
    ├── Blocked or Paused (3-5 fields)
    └── Ideas & Exploration (4-6 fields)
```

### Seniority Levels

| Level | Name | Description | Profile Emphasis |
|-------|------|-------------|------------------|
| 1 | Individual Contributor | Executes tasks | Role, Projects |
| 2 | Team Lead | Manages small group | Role, Network |
| 3 | Mid-Level Manager | Owns function | Organization, Network |
| 4 | Senior Leader | Director/VP | Goals, Organization |
| 5 | Executive | C-suite | Goals, Organization |
| 6 | Founder/Operator | Full authority | All weighted equally |

---

## 3. API Endpoints Required

### Brain Dump Processing

```
POST /api/clarity-canvas/brain-dump
```

**Request:**
```json
{
  "userId": "user_123",
  "sessionId": "session_456",
  "inputType": "voice", // or "text"
  "content": "base64_audio_data", // or plain text
  "duration": 45 // seconds, for voice
}
```

**Response:**
```json
{
  "transcription": "Full transcription text...",
  "extractedFields": [
    {
      "sectionId": "individual",
      "subsectionId": "background",
      "fieldId": "career",
      "summary": "10 years product experience...",
      "fullContext": "Detailed extraction...",
      "confidence": 0.85,
      "score": 35
    }
    // ... more fields
  ],
  "initialProfile": { /* Full profile object with scores */ }
}
```

### Question Response Processing

```
POST /api/clarity-canvas/question-response
```

**Request:**
```json
{
  "userId": "user_123",
  "sessionId": "session_456",
  "questionId": "q1",
  "response": {
    "value": "a",
    "isUnsure": false,
    "confidence": 0.75,
    "additionalContext": "Optional explanation...",
    "contextSource": "text"
  }
}
```

**Response:**
```json
{
  "fieldsUpdated": [
    {
      "sectionId": "goals",
      "fieldId": "success_metrics",
      "previousScore": 18,
      "newScore": 42,
      "addedContent": "Retention-focused success definition..."
    }
  ],
  "profileSnapshot": { /* Updated profile */ }
}
```

### Research Execution

```
POST /api/clarity-canvas/research
```

**Request:**
```json
{
  "userId": "user_123",
  "profileSnapshot": { /* Current profile */ },
  "researchDepth": "standard" // or "deep"
}
```

**Response:**
```json
{
  "findings": [
    {
      "id": "f1",
      "priority": "high",
      "category": "professional",
      "finding": {
        "title": "Previous Role at Peloton",
        "source": "LinkedIn",
        "sourceUrl": "https://...",
        "description": "Senior PM leading content recommendation..."
      },
      "recommendation": {
        "text": "Proposed addition to profile...",
        "targetSection": "individual",
        "targetSubsection": "background",
        "targetField": "career",
        "scoreImpact": 8
      }
    }
  ]
}
```

### Finding Approval

```
POST /api/clarity-canvas/approve-finding
```

**Request:**
```json
{
  "userId": "user_123",
  "findingId": "f1",
  "action": "approve", // or "skip" or "edit"
  "editedContent": null // or modified recommendation text
}
```

### Profile Retrieval

```
GET /api/clarity-canvas/profile/{userId}
```

**Query params:**
- `depth`: "summary" | "full" | "section:{id}"
- `includeHistory`: boolean

---

## 4. Component Reference

### QuestionMetaWrapper

Wraps every question with:
1. **"I'm not sure" checkbox** → `flaggedForValidation: true`
2. **Confidence slider** → `confidence: 0-1`
3. **Additional context input** → voice/text toggle

```jsx
<QuestionMetaWrapper
  questionId="q1"
  response={response}
  onResponseChange={setResponse}
>
  <ThisOrThatQuestion 
    options={options}
    selected={response.value}
    onSelect={(v) => setResponse({...response, value: v})}
  />
</QuestionMetaWrapper>
```

### View Toggle

```jsx
<ViewToggle 
  mode={viewMode} // 'orbital' | 'list'
  onModeChange={setViewMode}
/>
```

### Profile Visualization

```jsx
<ProfileVisualization
  profile={profile}
  viewMode={viewMode}
  animateScores={shouldAnimate}
  onSectionClick={handleDrillDown}
/>
```

---

## 5. State Management

### Top-Level State

```javascript
const [state, setState] = useState({
  // Flow control
  screen: 'welcome', // welcome | braindump | recording | processing | initial-profile | interview | enriched-profile
  
  // Profile data
  initialProfile: null, // Set after brain dump processing
  enrichedProfile: null, // Set after interview complete
  
  // Interview tracking
  currentQuestionIndex: 0,
  responses: [], // Array of response objects
  
  // UI state
  viewMode: 'orbital', // orbital | list
  animateScores: false,
  
  // Recording
  isRecording: false,
  recordingDuration: 0,
  audioBlob: null
});
```

### Screen Transitions

```
welcome → braindump → recording → processing → initial-profile 
                                                      ↓
                                               interview (8 screens)
                                                      ↓
                                              enriched-profile
                                                      ↓
                                              research (optional)
                                                      ↓
                                              deep-exploration (ongoing)
```

---

## 6. Backend Integration

### Recommended Architecture

Build Clarity Canvas as a **parallel implementation** that reuses core Better Connections utilities rather than extending the Contact model.

```
src/
├── lib/
│   ├── openai.ts                    # REUSE: GPT helpers
│   ├── enrichment.ts                # REUSE: Score concepts
│   ├── schemas/
│   │   ├── enrichmentInsight.ts     # EXISTING
│   │   └── clarityProfile.ts        # NEW: Profile extraction schema
│   └── clarity/                     # NEW: Clarity-specific logic
│       ├── extraction.ts            # Profile extraction
│       ├── merge.ts                 # Field merging with provenance
│       ├── confidence.ts            # Confidence calculations
│       ├── scoring.ts               # Field/section/profile scoring
│       └── router.ts                # Chunk → field mapping
├── app/
│   ├── api/
│   │   └── clarity/                 # NEW: Clarity API routes
│   │       ├── extract/route.ts
│   │       ├── merge-field/route.ts
│   │       └── submit-answer/route.ts
│   └── (dashboard)/
│       └── clarity/                 # NEW: Clarity UI
│           ├── page.tsx             # Profile overview
│           ├── session/page.tsx     # Voice/text input
│           └── questionnaire/page.tsx
└── components/
    └── clarity/                     # NEW: Clarity components
        ├── VoiceInput.tsx           # ADAPT from enrichment
        ├── ProfileField.tsx
        ├── SourceBadge.tsx
        └── SectionProgress.tsx
```

### Core Implementation Files

#### 1. Extraction (NEW)

```typescript
// src/lib/clarity/extraction.ts

import { generateObject } from 'ai';
import { gpt4oMini } from '@/lib/openai';
import { z } from 'zod';

export const clarityExtractionSchema = z.object({
  chunks: z.array(z.object({
    content: z.string(),
    targetSection: z.string(),
    targetSubsection: z.string(),
    targetField: z.string(),
    summary: z.string().max(100),
    confidence: z.number().min(0).max(1),
    insights: z.array(z.string()),
  })),
});

export async function extractProfileChunks(
  transcript: string,
  profileSchema: ProfileSchemaDefinition,
  existingContext?: Record<string, string>
): Promise<ExtractionResult> {
  const result = await generateObject({
    model: gpt4oMini,
    system: CLARITY_EXTRACTION_PROMPT,
    prompt: buildExtractionPrompt(transcript, profileSchema, existingContext),
    schema: clarityExtractionSchema,
  });

  return result.object;
}
```

#### 2. Field Merging (ADAPT from existing)

```typescript
// src/lib/clarity/merge.ts

import { mergeNotesWithAI } from '@/lib/openai';

interface FieldMergeInput {
  existingField: ProfileField | null;
  newContent: string;
  sourceType: SourceType;
  questionId?: string;
}

export async function mergeFieldContent(
  input: FieldMergeInput
): Promise<FieldMergeResult> {
  const { existingField, newContent, sourceType, questionId } = input;

  // REUSE: Existing merge logic
  let mergedFullContext: string;
  if (existingField?.fullContext) {
    const result = await mergeNotesWithAI(
      existingField.fullContext,
      newContent
    );
    mergedFullContext = result.mergedNotes;
  } else {
    mergedFullContext = newContent;
  }

  // NEW: Generate summary
  const summary = await generateSummary(mergedFullContext);

  // NEW: Create source record
  const newSource: FieldSource = {
    id: generateId(),
    type: sourceType,
    rawContent: newContent,
    extractedAt: new Date(),
    questionId,
  };

  // NEW: Recalculate score
  const score = calculateFieldScore(mergedFullContext, existingField?.confidence);

  return {
    summary,
    fullContext: mergedFullContext,
    sources: [...(existingField?.sources || []), newSource],
    score,
  };
}
```

#### 3. Confidence Tracking (NEW)

```typescript
// src/lib/clarity/confidence.ts

const VALIDATION_THRESHOLD = 0.5;

const ConfidenceWeights = {
  VOICE: 0.7,      // Voice slightly less trusted
  TEXT: 0.8,       // Text more deliberate
  QUESTION: 1.0,   // Direct answers most trusted
  IMPORT: 0.6,     // External data least trusted
};

export function calculateFieldConfidence(
  sources: FieldSource[],
  userConfidences: Map<string, number>
): number {
  if (sources.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const source of sources) {
    const userConfidence = userConfidences.get(source.id) ?? 1.0;
    const typeWeight = ConfidenceWeights[source.type];
    const weight = typeWeight * userConfidence;

    weightedSum += weight;
    totalWeight += typeWeight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function shouldFlagForValidation(
  fieldConfidence: number,
  hasConflicts: boolean
): boolean {
  return fieldConfidence < VALIDATION_THRESHOLD || hasConflicts;
}
```

#### 4. Scoring System (EXTEND from existing)

```typescript
// src/lib/clarity/scoring.ts

export function calculateFieldCompleteness(field: ProfileField): number {
  if (!field.fullContext) return 0;

  let score = 0;

  // Length-based (up to 40 points)
  const charCount = field.fullContext.length;
  if (charCount > 0) score += 10;
  if (charCount > 50) score += 10;
  if (charCount > 150) score += 10;
  if (charCount > 300) score += 10;

  // Source diversity (up to 30 points)
  const sourceCount = field.sources?.length || 0;
  if (sourceCount > 0) score += 10;
  if (sourceCount > 1) score += 10;
  if (sourceCount > 2) score += 10;

  // Has insights (up to 20 points)
  if (field.insights && field.insights.length > 0) {
    score += Math.min(field.insights.length * 5, 20);
  }

  // Summary exists (10 points)
  if (field.summary) score += 10;

  return Math.min(score, 100);
}

export function calculateWeightedFieldScore(field: ProfileField): number {
  const completeness = calculateFieldCompleteness(field);
  const confidence = field.confidence || 1.0;
  return Math.round(completeness * confidence);
}

export function calculateSectionScore(
  fields: ProfileField[],
  weights?: Record<string, number>
): number {
  if (fields.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const field of fields) {
    const weight = weights?.[field.key] ?? 1;
    const fieldScore = calculateWeightedFieldScore(field);
    weightedSum += fieldScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

export function calculateProfileScore(profile: ClarityProfile): ProfileScore {
  const sectionScores: Record<string, number> = {};
  const flaggedFields: string[] = [];
  let totalSections = 0;
  let sectionSum = 0;

  for (const section of profile.sections) {
    const allFields = section.subsections.flatMap(s => s.fields);
    sectionScores[section.key] = calculateSectionScore(allFields);
    sectionSum += sectionScores[section.key];
    totalSections++;

    for (const field of allFields) {
      if (field.flaggedForValidation) {
        flaggedFields.push(`${section.key}.${field.key}`);
      }
    }
  }

  return {
    sectionScores,
    overallScore: totalSections > 0 ? Math.round(sectionSum / totalSections) : 0,
    flaggedFields,
  };
}
```

### Question-to-Field Mapping

```javascript
const questionFieldMapping = {
  q1: { // Success vision (retention vs growth)
    targetSection: 'goals',
    targetFields: ['success_metrics', 'north_star'],
    mappingLogic: (response) => ({
      success_metrics: response.value === 'a' 
        ? 'Retention-focused: Users come back every day is the primary success signal'
        : 'Growth-focused: Organic user referrals and word-of-mouth are the primary success signal'
    })
  },
  q2: { // Problem approach
    targetSection: 'individual',
    targetFields: ['decision_making', 'problem_solving'],
    mappingLogic: (response) => ({
      decision_making: response.value === 'a'
        ? 'Data-first approach: Relies on metrics and evidence before making decisions'
        : 'Intuition-led: Trusts gut instinct and pattern recognition for decisions'
    })
  },
  q3: { // Runway
    targetSection: 'organization',
    targetFields: ['funding_status', 'runway'],
    mappingLogic: (response) => ({
      runway: `Current runway: ${response.value} months`
    })
  },
  q4: { // Constraints
    targetSection: 'organization',
    targetFields: ['constraints', 'challenges'],
    mappingLogic: (response) => ({
      constraints: `Primary constraints: ${response.value.join(', ')}`
    })
  },
  q5: { // Role need
    targetSection: 'role',
    targetFields: ['current_focus', 'primary_mode'],
    mappingLogic: (response) => ({
      current_focus: response.value === 'a'
        ? 'Currently needs to focus on vision, strategy, and big-picture direction'
        : 'Currently needs to focus on execution, operations, and getting things done'
    })
  },
  q6: { // Product validation
    targetSection: 'goals',
    targetFields: ['product_hypothesis', 'validation_level'],
    mappingLogic: (response) => ({
      validation_level: ['Just a hypothesis', 'Some positive signals', 'Growing confidence', 'Validated with data'][response.value - 1]
    })
  },
  q7: { // 12-month outcome
    targetSection: 'goals',
    targetFields: ['growth_priority', 'business_model'],
    mappingLogic: (response) => ({
      growth_priority: response.value === 'a'
        ? 'Prioritizing profitability and sustainable unit economics in 12-month horizon'
        : 'Prioritizing venture-scale growth metrics and market capture in 12-month horizon'
    })
  },
  q8: { // Help needed
    targetSection: 'network',
    targetFields: ['support_needs', 'gaps'],
    mappingLogic: (response) => ({
      support_needs: `Most valuable help areas: ${response.value.join(', ')}`
    })
  },
};
```

---

## 7. Reuse Mapping

### Direct Reuse (100%)

| Component | Location | Notes |
|-----------|----------|-------|
| Voice capture | `react-speech-recognition` | React hook, works as-is |
| Pause detection | `enrichment/session/page.tsx:356-385` | Copy constants + effect |
| Debouncing | Same file | `PAUSE_THRESHOLD` + `DEBOUNCE_DELAY` |
| GPT structured outputs | `generateObject` from Vercel AI SDK | Pattern unchanged |
| Zod schema patterns | `lib/schemas/*.ts` | Same approach |

### Adaptation Required (70-90%)

| Component | Current | Adaptation |
|-----------|---------|------------|
| Notes merging | `lib/openai.ts:mergeNotesWithAI` | Add source tracking |
| Extraction schema | 8 CRM fields | Expand to ~60 profile fields |
| System prompt | CRM-focused | Profile-focused prompts |
| Score calculation | Binary per-field | Richness + confidence weighted |
| Bubble visualization | `EnrichmentBubbles.tsx` | Adapt to orbital view |

### New Development Required

| Component | Complexity | Hours |
|-----------|------------|-------|
| Hierarchical profile schema (Prisma) | Medium | 4-8 |
| FieldSource model + provenance | Low | 2-4 |
| Confidence tracking system | Medium | 4-6 |
| Field router (chunk → field mapping) | Medium | 4-6 |
| Structured question handler | High | 8-12 |
| Profile extraction prompt | Medium | 4-6 |
| Section/field scoring rollup | Low | 2-4 |
| Validation flag system | Low | 2-4 |

### Extraction Flow Diagram

```
                      Clarity Canvas Flow
                      ───────────────────

Voice/Text Input
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  REUSE: Pause Detection + Debouncing                         │
│  (Copy from enrichment/session/page.tsx:356-385)             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  NEW: POST /api/clarity/extract                              │
│  ├── Input: transcript + profileSchema + existingContext     │
│  ├── GPT-4o-mini with clarityExtractionSchema                │
│  └── Output: { chunks: ProfileChunk[] }                      │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  NEW: Field Router                                           │
│  ├── Map each chunk to target field                          │
│  ├── Create FieldSource record                               │
│  ├── Merge content with existing (REUSE: merge logic)        │
│  └── Update field score                                      │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ADAPT: Score Calculation                                    │
│  (Extend from lib/enrichment.ts)                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. File Manifest

### Primary Deliverables

| File | Description | Lines | Status |
|------|-------------|-------|--------|
| `clarity-canvas-complete.jsx` | **Complete flow prototype** (Phases 1-4) | ~850 | ✅ Complete |
| `research-accelerant.jsx` | Research findings approval flow | ~930 | ✅ Complete |
| `living-profile-canvas.jsx` | Deep exploration (4-level drill-down) | ~430 | ✅ Complete |

### Supporting Documentation

| File | Description |
|------|-------------|
| `clarity-canvas-architecture-summary.md` | Architecture overview |
| `living-profile-canvas-plan.md` | Complete data model specification |
| `prototype-plans.md` | Original UX specifications |

### Superseded Files (Reference Only)

| File | Superseded By |
|------|---------------|
| `foundation-profile-unified.jsx` | `clarity-canvas-complete.jsx` |
| `foundation-profile-orbital.jsx` | `clarity-canvas-complete.jsx` |
| `foundation-profile-experience.jsx` | `clarity-canvas-complete.jsx` |
| `clarity-canvas.jsx` | `clarity-canvas-complete.jsx` |

---

## Design System Reference

### Colors

```javascript
const colors = {
  bg: '#0a0a0a',
  surface: '#111111',
  surfaceDim: '#0d0d0d',
  gold: '#D4A84B',
  goldLight: '#E4C06B',
  green: '#4ADE80',
  yellow: '#FBBF24',
  orange: '#FB923C',
  red: '#EF4444',
  white: '#ffffff',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a'
};
```

### Score Color Mapping

```javascript
const getScoreColor = (score) => {
  if (score >= 90) return colors.gold;
  if (score >= 75) return colors.green;
  if (score >= 50) return colors.yellow;
  if (score >= 25) return colors.orange;
  return colors.red;
};
```

### Typography

- **Display:** System font, weights 400-700
- **Scores:** Monospace
- **Labels:** Uppercase, letter-spacing 0.1em

---

## Implementation Priority

### Phase 1: Schema & Infrastructure (Week 1)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Create Prisma models (ClarityProfile, ProfileSection, etc.) | 4-8 | None |
| Seed initial profile schema (6 sections, subsections, fields) | 2-4 | Prisma models |
| Port voice capture from enrichment session | 2-4 | None |
| Create `/api/clarity/extract` endpoint | 4-6 | Prisma models |

### Phase 2: Core Extraction (Week 2)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Build extraction prompt for profile fields | 4-6 | Schema definition |
| Implement field router (chunk → field mapping) | 4-6 | Extract endpoint |
| Adapt merge logic with source tracking | 2-4 | Field router |
| Implement field-level scoring | 2-4 | Merge logic |

### Phase 3: Question Handler (Week 3)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Create `/api/clarity/submit-answer` endpoint | 4-6 | Merge logic |
| Implement confidence tracking system | 4-6 | Submit endpoint |
| Build question-to-field mapping logic | 4-6 | Field schema |
| Add validation flag system | 2-4 | Confidence system |

### Phase 4: Frontend Integration (Week 4)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Connect prototype to real APIs | 8-12 | All endpoints |
| Implement score animation with real data | 4-6 | Scoring system |
| Add error handling and loading states | 4-6 | API integration |
| Mobile responsiveness | 4-6 | Core flow complete |

### Phase 5: Research & Polish (Week 5)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Research endpoint integration | 4-6 | Profile complete |
| Deep exploration navigation | 4-6 | Profile viewing |
| Performance optimization | 2-4 | Full integration |
| QA and bug fixes | 4-8 | All features |

**Total: 42-70 hours over 5 weeks**

---

## Integration Analysis Answers

Based on the Better Connections codebase analysis, here are the answers to the original integration questions:

### Q1: Extraction Pipeline
**Answer:** 90% reusable. The existing `react-speech-recognition` + pause detection + `generateObject` with Zod schemas can be directly reused. Only the extraction schema and system prompt need adaptation for profile fields instead of CRM fields.

### Q2: Schema Mapping  
**Answer:** 40% aligned. The Contact model is flat (~20 fields) vs. hierarchical profile (~60 fields across 6 sections). **Recommendation:** Create new Prisma models for ClarityProfile rather than extending Contact. This keeps concerns separated and allows purpose-built schema.

### Q3: Confidence Tracking
**Answer:** 0% existing. No confidence tracking infrastructure exists in Better Connections. The closest concept is `matchConfidence` on ContactMention for fuzzy matching. **Build from scratch** using the confidence system specified in this document.

### Q4: Score Calculation
**Answer:** 80% adaptable. Current `calculateEnrichmentScore` in `lib/enrichment.ts` uses binary field existence. Extend to:
- Content richness scoring (length, source diversity)
- Confidence weighting
- Hierarchical rollup (field → subsection → section → profile)

### Q5: Source Attribution
**Answer:** 30% existing. Current Contact has only a `source` enum (MANUAL, CSV, GOOGLE, etc.) at contact level. **Build FieldSource model** for per-field provenance with:
- Source type (VOICE, TEXT, QUESTION, IMPORT)
- Raw content
- User confidence
- Timestamp

### Q6: Research Integration
**Answer:** Existing enrichment patterns can be adapted. The bubble visualization and extraction flow provide patterns, but research-specific logic (web scraping, finding generation) would need to be built or integrated with external services.

---

## File Manifest Summary

| Category | Files | Status |
|----------|-------|--------|
| **Primary Prototypes** | 3 | ✅ Complete |
| **Documentation** | 4 | ✅ Complete |
| **Backend Specs** | 1 (this file) | ✅ Complete |
| **Superseded** | 4 | ⚠️ Reference only |

### Authoritative Files

```
clarity-canvas-complete.jsx     # Complete frontend flow
research-accelerant.jsx         # Research approval flow  
living-profile-canvas.jsx       # Deep exploration
clarity-canvas-handoff.md       # This integration spec
```

---

*Last Updated: January 2025*
*Package Version: 2.1*
*Integration Analysis: Complete*
