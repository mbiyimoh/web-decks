# Task Breakdown: Pillar Pages & Contextual Input

**Generated:** 2026-02-05
**Source:** specs/pillar-pages-contextual-input.md

---

## Overview

Transform Clarity Canvas pillar experience from modal overlays to dedicated routed pages (`/clarity-canvas/[pillar]`), add contextual input (type/speak/upload) at pillar and subsection levels, and show gamified score celebrations after commits.

---

## Phase 1: Foundation (Infrastructure & Types)

### Task PP-1.1: Install Dependencies and Add Types
**Description:** Install npm packages for file parsing and add new TypeScript types
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** None (foundation task)

**Technical Requirements:**
- Install `pdf-parse`, `remove-markdown`, `mammoth` packages
- Add new types to `lib/clarity-canvas/types.ts`

**Implementation:**
```bash
npm install pdf-parse remove-markdown mammoth
npm install -D @types/pdf-parse @types/remove-markdown
```

```typescript
// lib/clarity-canvas/types.ts — ADD these types

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

Also extend `CommitRecommendationsResponse`:
```typescript
export interface CommitRecommendationsResponse {
  updatedProfile: ProfileWithSections;
  scores: ProfileScores;
  previousScores: ProfileScores;  // NEW
  savedCount: number;
  droppedCount: number;
}
```

**Acceptance Criteria:**
- [ ] All three npm packages installed successfully
- [ ] `ScopedExtractRequest`, `FileUploadResponse`, `CelebrationData` types added
- [ ] `CommitRecommendationsResponse` extended with `previousScores`
- [ ] TypeScript compiles without errors

---

### Task PP-1.2: Create Scoped Extraction Schema Builder
**Description:** Add dynamic Zod schema builder for scoped extraction
**Size:** Small
**Priority:** High
**Dependencies:** PP-1.1
**Can run parallel with:** PP-1.3

**Implementation:**
Create or extend `lib/clarity-canvas/extraction-schema.ts`:

```typescript
import { z } from 'zod';

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

**Acceptance Criteria:**
- [ ] `buildScopedExtractionSchema()` function exists
- [ ] Returns Zod schema with `z.literal(sectionKey)` for targetSection
- [ ] Schema structure matches existing brainDumpExtractionSchema

---

### Task PP-1.3: Create Scoped Extraction Prompt Builder
**Description:** Add function to build scoped extraction prompts
**Size:** Medium
**Priority:** High
**Dependencies:** PP-1.1
**Can run parallel with:** PP-1.2

**Implementation:**
Add to `lib/clarity-canvas/prompts.ts`:

```typescript
import { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES } from './profile-structure';

export function buildScopedExtractionPrompt(
  sectionKey: string,
  subsectionKey?: string
): string {
  const section = PROFILE_STRUCTURE[sectionKey];
  if (!section) {
    throw new Error(`Unknown section: ${sectionKey}`);
  }

  let prompt = `You are an expert at extracting structured profile information from unstructured text.

Given text about someone, extract relevant information into the following profile fields:

SECTION: ${section.name}
`;

  const subsectionsToInclude = subsectionKey
    ? { [subsectionKey]: section.subsections[subsectionKey] }
    : section.subsections;

  for (const [subKey, subsection] of Object.entries(subsectionsToInclude)) {
    prompt += `\nSUBSECTION: ${subsection.name}\nFields:\n`;
    for (const [fieldKey, field] of Object.entries(subsection.fields)) {
      const displayName = FIELD_DISPLAY_NAMES[fieldKey] || fieldKey;
      prompt += `- ${fieldKey}: ${displayName}\n`;
    }
  }

  prompt += `
EXTRACTION RULES:
1. Extract content verbatim when possible - preserve the user's original wording
2. Map each piece of information to the MOST SPECIFIC field that fits
3. Generate a concise summary (max 150 characters) for display
4. Rate your confidence (0-1) based on how clearly the information was stated:
   - 0.8-1.0: Explicitly stated facts
   - 0.5-0.7: Reasonable inferences from stated facts
   - Below 0.5: Do not include
5. Note any key insights or implications of the information
6. DO NOT fabricate information — but DO extract reasonable inferences from stated facts
7. If information is relevant to multiple fields, create a SEPARATE chunk for EACH field
8. For role-based inferences, extract what is strongly implied
9. Capture quantity words, numbers, and specific details when mentioned

OUTPUT FORMAT:
Return a JSON object with chunks, overallThemes, and suggestedFollowUps.`;

  return prompt;
}
```

**Acceptance Criteria:**
- [ ] Function builds prompt scoped to single section
- [ ] If `subsectionKey` provided, only includes that subsection's fields
- [ ] Uses FIELD_DISPLAY_NAMES for readable field names
- [ ] Includes all extraction rules from main prompt

---

## Phase 2: API Layer

### Task PP-2.1: Create File Upload API Route
**Description:** Build POST /api/clarity-canvas/upload for file text extraction
**Size:** Large
**Priority:** High
**Dependencies:** PP-1.1
**Can run parallel with:** PP-2.2

**Implementation:**
Create `app/api/clarity-canvas/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const MAX_SIZE_PDF_DOC = 5 * 1024 * 1024; // 5MB
const MAX_SIZE_TEXT = 1 * 1024 * 1024; // 1MB
const MAX_TEXT_LENGTH = 50000;

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExts = ['txt', 'md', 'pdf', 'doc', 'docx'];

  if (!ext || !allowedExts.includes(ext)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  // Size validation
  const maxSize = ['pdf', 'doc', 'docx'].includes(ext) ? MAX_SIZE_PDF_DOC : MAX_SIZE_TEXT;
  if (file.size > maxSize) {
    return NextResponse.json({
      error: `File too large. Max ${maxSize / 1024 / 1024}MB for ${ext} files`
    }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;

  try {
    switch (ext) {
      case 'txt':
        text = buffer.toString('utf-8');
        break;

      case 'md':
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
  } catch (error) {
    console.error('File parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }

  // Empty text check
  if (!text || !text.trim()) {
    const message = ext === 'pdf'
      ? "This PDF doesn't contain extractable text. Try a text-based PDF."
      : 'File appears to be empty';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Truncation
  let wasTruncated = false;
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.substring(0, MAX_TEXT_LENGTH);
    wasTruncated = true;
  }

  return NextResponse.json({
    text,
    filename: file.name,
    charCount: text.length,
    fileType: file.type || `application/${ext}`,
    wasTruncated,
  });
}
```

**Acceptance Criteria:**
- [ ] POST endpoint accepts FormData with file
- [ ] Validates file extension (txt, md, pdf, doc, docx)
- [ ] Enforces size limits (5MB pdf/doc, 1MB txt/md)
- [ ] Extracts text using appropriate library per file type
- [ ] Returns FileUploadResponse with wasTruncated flag
- [ ] Handles empty files and scanned PDFs gracefully

---

### Task PP-2.2: Extend Extract API with Scope Parameter
**Description:** Add scope parameter to extract route for scoped extraction
**Size:** Medium
**Priority:** High
**Dependencies:** PP-1.2, PP-1.3
**Can run parallel with:** PP-2.1

**Implementation:**
Modify `app/api/clarity-canvas/extract/route.ts`:

```typescript
// Add import
import { buildScopedExtractionSchema } from '@/lib/clarity-canvas/extraction-schema';
import { buildScopedExtractionPrompt } from '@/lib/clarity-canvas/prompts';

// In POST handler, parse scope from body:
const { transcript, sourceType, scope } = await request.json();

// Use scoped or full schema/prompt:
const schema = scope
  ? buildScopedExtractionSchema(scope.section)
  : brainDumpExtractionSchema;

const prompt = scope
  ? buildScopedExtractionPrompt(scope.section, scope.subsection)
  : BRAIN_DUMP_EXTRACTION_PROMPT;

const { object: extraction } = await generateObject({
  model: openai('gpt-4o'),
  schema,
  system: EXTRACTION_SYSTEM_PROMPT,
  prompt: `${prompt}\n\nTRANSCRIPT:\n${transcript}`,
});
```

**Acceptance Criteria:**
- [ ] Extract route accepts optional `scope` parameter
- [ ] When scoped, uses dynamic schema with z.literal(sectionKey)
- [ ] When scoped, uses scoped prompt with only target fields
- [ ] Existing unscoped behavior unchanged

---

### Task PP-2.3: Extend Commit API to Return Previous Scores
**Description:** Capture and return pre-commit scores for celebration
**Size:** Small
**Priority:** High
**Dependencies:** PP-1.1
**Can run parallel with:** PP-2.1, PP-2.2

**Implementation:**
Modify `app/api/clarity-canvas/commit/route.ts`:

```typescript
// Before processing recommendations, capture pre-commit scores:
const preCommitScores = calculateAllScores(profile.sections);

// ... existing recommendation processing ...

// After processing, calculate post-commit scores:
const postCommitScores = calculateAllScores(updatedProfile.sections);

// Return both in response:
return NextResponse.json({
  updatedProfile: typedProfile,
  scores: postCommitScores,
  previousScores: preCommitScores,  // NEW
  savedCount,
  droppedCount,
});
```

**Acceptance Criteria:**
- [ ] Commit route captures scores before mutations
- [ ] Response includes `previousScores` field
- [ ] Type matches extended `CommitRecommendationsResponse`

---

## Phase 3: Routing & Navigation

### Task PP-3.1: Create Pillar Page Server Component
**Description:** Create dynamic route for pillar pages
**Size:** Medium
**Priority:** High
**Dependencies:** PP-1.1
**Can run parallel with:** None

**Implementation:**
Create `app/clarity-canvas/[pillar]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { PROFILE_STRUCTURE } from '@/lib/clarity-canvas/profile-structure';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import PillarPageClient from './PillarPageClient';

const validPillars = Object.keys(PROFILE_STRUCTURE);

export function generateStaticParams() {
  return validPillars.map((pillar) => ({ pillar }));
}

export default async function PillarPage({
  params
}: {
  params: Promise<{ pillar: string }>
}) {
  const { pillar } = await params;

  if (!validPillars.includes(pillar)) {
    notFound();
  }

  const session = await getSession();
  if (!session?.user?.email) {
    notFound(); // Or redirect to auth
  }

  // Fetch profile with all nested relations
  const profile = await prisma.clarityProfile.findUnique({
    where: { userEmail: session.user.email },
    include: {
      sections: {
        include: {
          subsections: {
            include: {
              fields: {
                include: { sources: true }
              }
            }
          }
        }
      }
    }
  });

  if (!profile) {
    notFound();
  }

  const scores = calculateAllScores(profile.sections);

  return (
    <PillarPageClient
      pillarKey={pillar}
      initialProfile={profile}
      initialScores={scores}
    />
  );
}
```

**Acceptance Criteria:**
- [ ] Route validates pillar slug against PROFILE_STRUCTURE keys
- [ ] Invalid slugs return 404
- [ ] Profile fetched server-side with full relations
- [ ] Scores calculated server-side
- [ ] PillarPageClient rendered with initial data

---

### Task PP-3.2: Update ListView for Link Navigation
**Description:** Replace onClick handler with Link in ListView
**Size:** Small
**Priority:** High
**Dependencies:** PP-3.1
**Can run parallel with:** PP-3.3

**Implementation:**
Modify `app/clarity-canvas/components/ListView.tsx`:

```typescript
// Add import
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Remove onSectionClick prop from interface
// interface ListViewProps {
//   onSectionClick?: (key: string) => void;  // REMOVE
// }

// Add exit animation state:
const [exitingSection, setExitingSection] = useState<string | null>(null);
const router = useRouter();

// Replace section card wrapper:
// FROM:
// <motion.div onClick={() => onSectionClick?.(section.key)}>

// TO:
const handleSectionClick = (sectionKey: string) => {
  setExitingSection(sectionKey);
  setTimeout(() => {
    router.push(`/clarity-canvas/${sectionKey}`);
  }, 200);
};

<motion.div
  onClick={() => handleSectionClick(section.key)}
  animate={exitingSection === section.key
    ? { scale: 0.97, opacity: 0 }
    : { scale: 1, opacity: 1 }
  }
  transition={{ duration: 0.2 }}
  className="cursor-pointer"
>
```

**Acceptance Criteria:**
- [ ] `onSectionClick` prop removed from ListView
- [ ] Section cards navigate to `/clarity-canvas/[pillar]`
- [ ] Exit animation (scale 0.97, opacity 0) plays before navigation

---

### Task PP-3.3: Update OrbitalView for Router Navigation
**Description:** Replace onClick handler with router.push in OrbitalView
**Size:** Small
**Priority:** High
**Dependencies:** PP-3.1
**Can run parallel with:** PP-3.2

**Implementation:**
Modify `app/clarity-canvas/components/OrbitalView.tsx`:

```typescript
// Add import
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Remove onSectionClick prop

// Add router and exit state:
const router = useRouter();
const [exitingSection, setExitingSection] = useState<string | null>(null);

// SVG caveat: Can't use <Link> inside <g> elements
// Replace onClick handler on section nodes:
const handleSectionClick = (sectionKey: string) => {
  setExitingSection(sectionKey);
  setTimeout(() => {
    router.push(`/clarity-canvas/${sectionKey}`);
  }, 200);
};

// On the <g> or clickable element:
<g
  onClick={() => handleSectionClick(section.key)}
  style={{ cursor: 'pointer' }}
>
  <motion.circle
    animate={exitingSection === section.key
      ? { scale: 0.9, opacity: 0.5 }
      : { scale: 1, opacity: 1 }
    }
    transition={{ duration: 0.2 }}
    // ...other props
  />
</g>
```

**Acceptance Criteria:**
- [ ] `onSectionClick` prop removed from OrbitalView
- [ ] Uses `useRouter().push()` (not Link, due to SVG constraint)
- [ ] Exit animation plays on clicked section

---

### Task PP-3.4: Update ProfileVisualization and ClarityCanvasClient
**Description:** Remove modal state and onSectionClick prop chain
**Size:** Medium
**Priority:** High
**Dependencies:** PP-3.2, PP-3.3
**Can run parallel with:** None

**Implementation:**

1. **ProfileVisualization.tsx** — Remove `onSectionClick` prop:
```typescript
// Remove from interface and props destructuring
// Remove passing onSectionClick to ListView/OrbitalView
```

2. **ClarityCanvasClient.tsx** — Remove modal state:
```typescript
// REMOVE these:
// - const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null);
// - The onSectionClick prop passed to ProfileVisualization
// - The <AnimatePresence> block that renders SectionDetail
// - The import of SectionDetail
```

**Acceptance Criteria:**
- [ ] `onSectionClick` removed from ProfileVisualization props
- [ ] `selectedSectionKey` state removed from ClarityCanvasClient
- [ ] SectionDetail modal rendering removed
- [ ] SectionDetail import removed

---

### Task PP-3.5: Delete SectionDetail Component
**Description:** Remove deprecated SectionDetail modal component
**Size:** Small
**Priority:** Medium
**Dependencies:** PP-3.4
**Can run parallel with:** Phase 4 tasks

**Implementation:**
```bash
rm app/clarity-canvas/components/SectionDetail.tsx
```

Verify no remaining imports reference this file.

**Acceptance Criteria:**
- [ ] `SectionDetail.tsx` deleted
- [ ] No dangling imports in codebase
- [ ] Build passes

---

## Phase 4: Pillar Page UI

### Task PP-4.1: Create PillarPageClient Component (Shell)
**Description:** Build the main pillar page client component with layout
**Size:** Large
**Priority:** High
**Dependencies:** PP-3.1
**Can run parallel with:** PP-4.2, PP-4.3

**Implementation:**
Create `app/clarity-canvas/[pillar]/PillarPageClient.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PROFILE_STRUCTURE } from '@/lib/clarity-canvas/profile-structure';
import { getScoreColor } from '@/lib/clarity-canvas/types';
import type { ProfileWithSections, ProfileScores, ExtractOnlyResponse, CelebrationData } from '@/lib/clarity-canvas/types';

interface PillarPageClientProps {
  pillarKey: string;
  initialProfile: ProfileWithSections;
  initialScores: ProfileScores;
}

export default function PillarPageClient({
  pillarKey,
  initialProfile,
  initialScores,
}: PillarPageClientProps) {
  const router = useRouter();
  const globalInputRef = useRef<HTMLDivElement>(null);

  // State
  const [profile, setProfile] = useState(initialProfile);
  const [scores, setScores] = useState(initialScores);
  const [isGlobalInputVisible, setIsGlobalInputVisible] = useState(true);
  const [activeInput, setActiveInput] = useState<{
    scope: 'pillar' | 'subsection';
    subsectionKey?: string;
  } | null>(null);
  const [inputStep, setInputStep] = useState<'choose' | 'text' | 'recording' | 'processing' | 'review'>('choose');
  const [extractionResult, setExtractionResult] = useState<ExtractOnlyResponse | null>(null);
  const [sourceType, setSourceType] = useState<'VOICE' | 'TEXT'>('TEXT');
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Pillar metadata
  const pillar = PROFILE_STRUCTURE[pillarKey];
  const pillarScore = scores.sections[pillarKey] ?? 0;

  // IntersectionObserver for FAB
  useEffect(() => {
    if (!globalInputRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsGlobalInputVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(globalInputRef.current);
    return () => observer.disconnect();
  }, []);

  // Get section data from profile
  const section = profile.sections.find(s => s.key === pillarKey);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-[#0d0d14] border-b border-zinc-800 px-6 py-4"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/clarity-canvas"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{pillar.icon}</span>
              <h1 className="text-xl font-display text-[#f5f5f5]">{pillar.name}</h1>
            </div>
          </div>
          <div
            className="text-lg font-mono"
            style={{ color: getScoreColor(pillarScore) }}
          >
            {pillarScore}%
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Pillar-global input section */}
        <motion.div
          ref={globalInputRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* TODO: Render ContextInput or input method chooser */}
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-6">
            <p className="text-[#888888] mb-4">
              Add context to improve all areas of {pillar.name}
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-[#d4a54a]/10 text-[#d4a54a] border border-[#d4a54a]/30 rounded-lg">
                Type
              </button>
              <button className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg">
                Speak
              </button>
              <button className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg">
                Upload File
              </button>
            </div>
          </div>
        </motion.div>

        {/* Subsection cards */}
        {section?.subsections.map((subsection, index) => (
          <motion.div
            key={subsection.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 2) }}
            className="mb-6 bg-[#111114] border border-zinc-800 rounded-2xl p-6"
          >
            {/* TODO: Render subsection fields */}
            <p className="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase mb-4">
              {subsection.name}
            </p>
            {/* Fields will be rendered here */}
          </motion.div>
        ))}
      </main>

      {/* FAB */}
      <AnimatePresence>
        {!isGlobalInputVisible && activeInput === null && (
          <motion.div
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-30"
          >
            <button
              onClick={() => setActiveInput({ scope: 'pillar' })}
              className="w-14 h-14 bg-[#d4a54a] text-black rounded-full shadow-lg flex items-center justify-center"
            >
              <span className="text-2xl">+</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration overlay */}
      {celebrationData && (
        <div>TODO: PillarCelebration</div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Component renders header with back link, pillar icon/name, score
- [ ] IntersectionObserver tracks global input visibility
- [ ] FAB appears when global input scrolls out of view
- [ ] Entry animations on header and content
- [ ] Subsection cards rendered from profile data

---

### Task PP-4.2: Create ContextInput Component
**Description:** Build shared input component for type/speak/upload
**Size:** Large
**Priority:** High
**Dependencies:** PP-2.1, PP-2.2
**Can run parallel with:** PP-4.1, PP-4.3

**Implementation:**
Create `app/clarity-canvas/components/ContextInput.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Keyboard, Mic, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceRecorder from './VoiceRecorder';
import type { ExtractOnlyResponse } from '@/lib/clarity-canvas/types';

interface ContextInputProps {
  scope: {
    section: string;
    subsection?: string;
  };
  onExtracted: (result: ExtractOnlyResponse, sourceType: 'VOICE' | 'TEXT') => void;
  onCancel: () => void;
  minVoiceDuration?: number;
}

type InputStep = 'choose' | 'text' | 'recording' | 'uploading' | 'processing';

export default function ContextInput({
  scope,
  onExtracted,
  onCancel,
  minVoiceDuration = scope.subsection ? 10 : 20,
}: ContextInputProps) {
  const [step, setStep] = useState<InputStep>('choose');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');

  const scopeLabel = scope.subsection || scope.section;

  // Text submission
  const handleTextSubmit = async () => {
    if (text.trim().length < 50) {
      setError('Please enter at least 50 characters');
      return;
    }
    setStep('processing');
    setProcessingMessage('Extracting insights...');
    try {
      const res = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, sourceType: 'TEXT', scope }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      const result = await res.json();
      onExtracted(result, 'TEXT');
    } catch (e) {
      setError('Failed to extract. Please try again.');
      setStep('text');
    }
  };

  // Voice recording complete
  const handleRecordingComplete = async (blob: Blob) => {
    setStep('processing');
    setProcessingMessage('Transcribing audio...');
    try {
      // Transcribe
      const formData = new FormData();
      formData.append('audio', blob);
      const transcribeRes = await fetch('/api/clarity-canvas/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!transcribeRes.ok) throw new Error('Transcription failed');
      const { transcript } = await transcribeRes.json();

      // Extract
      setProcessingMessage('Extracting insights...');
      const extractRes = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, sourceType: 'VOICE', scope }),
      });
      if (!extractRes.ok) throw new Error('Extraction failed');
      const result = await extractRes.json();
      onExtracted(result, 'VOICE');
    } catch (e) {
      setError('Failed to process. Please try again.');
      setStep('choose');
    }
  };

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('uploading');
    setError(null);

    try {
      // Upload and extract text
      setProcessingMessage('Reading file...');
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/clarity-canvas/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) {
        const { error } = await uploadRes.json();
        throw new Error(error || 'Upload failed');
      }
      const { text: fileText, wasTruncated } = await uploadRes.json();

      if (wasTruncated) {
        console.warn('File was truncated to 50,000 characters');
      }

      // Extract
      setStep('processing');
      setProcessingMessage('Extracting insights...');
      const extractRes = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fileText, sourceType: 'TEXT', scope }),
      });
      if (!extractRes.ok) throw new Error('Extraction failed');
      const result = await extractRes.json();
      onExtracted(result, 'TEXT');
    } catch (e: any) {
      setError(e.message || 'Failed to process file');
      setStep('choose');
    }
  };

  return (
    <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase">
          ADD CONTEXT
        </p>
        <button onClick={onCancel} className="text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Method chooser */}
        {step === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-[#888888] mb-4">
              How would you like to add context for {scopeLabel}?
            </p>
            <button
              onClick={() => setStep('text')}
              className="w-full flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Keyboard className="w-5 h-5 text-[#d4a54a]" />
              <span className="text-white">Type</span>
            </button>
            <button
              onClick={() => setStep('recording')}
              className="w-full flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Mic className="w-5 h-5 text-[#d4a54a]" />
              <span className="text-white">Speak</span>
            </button>
            <label className="w-full flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer">
              <Upload className="w-5 h-5 text-[#d4a54a]" />
              <span className="text-white">Upload File</span>
              <input
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </motion.div>
        )}

        {/* Text input */}
        {step === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Share more about your ${scopeLabel}...`}
              className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-[#d4a54a]"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-zinc-500">
                {text.length} characters (min 50)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setText(''); setStep('choose'); }}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={text.trim().length < 50}
                  className="px-4 py-2 bg-[#d4a54a] text-black rounded-lg disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Voice recording */}
        {step === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              minDuration={minVoiceDuration}
              maxDuration={120}
            />
            <button
              onClick={() => setStep('choose')}
              className="mt-4 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* Processing */}
        {(step === 'processing' || step === 'uploading') && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <Loader2 className="w-8 h-8 text-[#d4a54a] animate-spin mb-4" />
            <p className="text-[#888888]">{processingMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Three input methods: Type, Speak, Upload
- [ ] Text mode has 50 char minimum
- [ ] Voice mode uses VoiceRecorder with correct minDuration
- [ ] File upload validates and extracts text via upload API
- [ ] Processing state shows progress messages
- [ ] Error handling with user-friendly messages
- [ ] Calls onExtracted with result and sourceType

---

### Task PP-4.3: Create PillarCelebration Component
**Description:** Build gamified score celebration overlay
**Size:** Large
**Priority:** High
**Dependencies:** PP-1.1
**Can run parallel with:** PP-4.1, PP-4.2

**Implementation:**
Create `app/clarity-canvas/components/PillarCelebration.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import type { CelebrationData } from '@/lib/clarity-canvas/types';

interface PillarCelebrationProps {
  data: CelebrationData;
  onDismiss: () => void;
}

type CelebrationPhase = 'initial' | 'score-animating' | 'score-complete' | 'summary' | 'complete';

// Number ticker component
function NumberTicker({ from, to, duration = 1500 }: { from: number; to: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress); // ease-out quad
      const current = Math.round(from + (to - from) * eased);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return <span>{displayValue}</span>;
}

// Score bar color gradient
function getGradientStops(score: number): string {
  const stops: string[] = [];
  if (score > 0) stops.push('#ef4444 0%'); // red
  if (score > 25) stops.push('#f97316 25%'); // orange
  if (score > 50) stops.push('#eab308 50%'); // amber
  if (score > 75) stops.push('#22c55e 75%'); // green
  stops.push('#22c55e 100%');
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export default function PillarCelebration({ data, onDismiss }: PillarCelebrationProps) {
  const [phase, setPhase] = useState<CelebrationPhase>('initial');
  const audioContextRef = useRef<AudioContext | null>(null);

  // Derived visibility
  const showScoreBar = phase !== 'initial';
  const showDelta = ['score-complete', 'summary', 'complete'].includes(phase);
  const showSummary = ['summary', 'complete'].includes(phase);
  const showCTA = phase === 'complete';

  // Spring animation for score bar
  const springValue = useSpring(data.previousScore, { stiffness: 50, damping: 20 });
  const width = useTransform(springValue, [0, 100], ['0%', '100%']);

  useEffect(() => {
    if (phase !== 'initial') {
      springValue.set(data.newScore);
    }
  }, [phase, data.newScore, springValue]);

  // Sound synthesis
  const playChime = useCallback((frequencies: number[], duration = 0.8) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const delay = i * 0.08;
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    });
  }, []);

  const playScoreComplete = useCallback(() => {
    playChime([523.25, 659.25, 783.99], 1.0); // C major
  }, [playChime]);

  // Timeline
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setPhase('score-animating'), 300));
    timers.push(setTimeout(() => {
      setPhase('score-complete');
      playScoreComplete();
    }, 1800));
    timers.push(setTimeout(() => setPhase('summary'), 2100));
    timers.push(setTimeout(() => setPhase('complete'), 2600));
    return () => timers.forEach(clearTimeout);
  }, [playScoreComplete]);

  const delta = data.newScore - data.previousScore;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f]/95 flex items-center justify-center"
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Pillar icon and name */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mb-6"
        >
          <span className="text-6xl">{data.pillarIcon}</span>
        </motion.div>

        <h2 className="text-2xl font-display text-[#f5f5f5] mb-8">
          {data.pillarName} Clarity
        </h2>

        {/* Score bar */}
        <AnimatePresence>
          {showScoreBar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <motion.div
                  style={{
                    width,
                    background: getGradientStops(data.newScore),
                  }}
                  className="h-full rounded-full"
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono text-[#f5f5f5]">
                  <NumberTicker from={data.previousScore} to={data.newScore} />%
                </span>
                {showDelta && delta > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-mono"
                  >
                    +{delta}
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-[#888888]"
            >
              <p className="mb-2">
                {data.fieldsUpdated} field{data.fieldsUpdated !== 1 ? 's' : ''} updated in {data.pillarName}
              </p>
              <p className="text-sm">
                {data.previousScore}% → {data.newScore}%
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {showCTA && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onDismiss}
              className="px-6 py-3 bg-[#d4a54a] text-black rounded-xl font-medium"
            >
              Continue Exploring
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

**Acceptance Criteria:**
- [ ] Phase-based animation state machine (initial → score-animating → score-complete → summary → complete)
- [ ] Spring physics score bar fill
- [ ] RAF-based number ticker with ease-out
- [ ] Delta badge appears after score-complete
- [ ] Web Audio API chime on score-complete (C major chord)
- [ ] Manual dismiss only, calls onDismiss
- [ ] Full-screen overlay with z-50

---

## Phase 5: Integration & Wiring

### Task PP-5.1: Wire ContextInput into PillarPageClient
**Description:** Integrate ContextInput with pillar page state
**Size:** Medium
**Priority:** High
**Dependencies:** PP-4.1, PP-4.2
**Can run parallel with:** PP-5.2

**Implementation:**
Update `PillarPageClient.tsx` to:

1. Import ContextInput
2. Replace placeholder input buttons with ContextInput when activeInput is set
3. Handle onExtracted to transition to review step
4. Render subsection-level "Add context" buttons

```typescript
// Add to imports
import ContextInput from '../components/ContextInput';

// In render, replace placeholder global input:
{activeInput === null ? (
  // Input method chooser buttons
  <div className="flex gap-3">
    <button
      onClick={() => setActiveInput({ scope: 'pillar' })}
      className="..."
    >
      Add Context
    </button>
  </div>
) : activeInput.scope === 'pillar' ? (
  <ContextInput
    scope={{ section: pillarKey }}
    onExtracted={(result, srcType) => {
      setExtractionResult(result);
      setSourceType(srcType);
      setInputStep('review');
    }}
    onCancel={() => setActiveInput(null)}
    minVoiceDuration={20}
  />
) : null}

// In subsection cards, add button:
<button
  onClick={() => setActiveInput({ scope: 'subsection', subsectionKey: subsection.key })}
  className="w-full mt-4 py-2 text-[#d4a54a] text-sm border border-[#d4a54a]/30 rounded-lg hover:bg-[#d4a54a]/10"
>
  + Add context for {subsection.name}
</button>
```

**Acceptance Criteria:**
- [ ] Pillar-global input triggers ContextInput with section scope
- [ ] Subsection buttons trigger ContextInput with subsection scope
- [ ] onExtracted sets extractionResult and transitions to review
- [ ] onCancel clears activeInput

---

### Task PP-5.2: Wire RecommendationReview into PillarPageClient
**Description:** Integrate review flow with pillar page
**Size:** Medium
**Priority:** High
**Dependencies:** PP-4.1, PP-2.3
**Can run parallel with:** PP-5.1

**Implementation:**
Update `PillarPageClient.tsx`:

```typescript
// Add to imports
import RecommendationReview from '../components/RecommendationReview';

// Add handleCommit:
const handleCommit = (
  updatedProfile: ProfileWithSections,
  newScores: ProfileScores,
  previousScores: ProfileScores,
  savedCount: number
) => {
  const previousSectionScore = previousScores.sections[pillarKey] ?? 0;
  const newSectionScore = newScores.sections[pillarKey] ?? 0;
  const delta = newSectionScore - previousSectionScore;

  if (delta > 0) {
    setCelebrationData({
      previousScore: previousSectionScore,
      newScore: newSectionScore,
      fieldsUpdated: savedCount,
      pillarName: pillar.name,
      pillarIcon: pillar.icon,
    });
  } else {
    // No score change — just show toast
    // TODO: Add toast notification
  }

  setProfile(updatedProfile);
  setScores(newScores);
  setExtractionResult(null);
  setActiveInput(null);
  setInputStep('choose');
};

// In render, conditionally show review:
{inputStep === 'review' && extractionResult && (
  <div className="mb-8">
    <RecommendationReview
      extractedChunks={extractionResult.extractedChunks}
      overallThemes={extractionResult.overallThemes}
      suggestedFollowUps={extractionResult.suggestedFollowUps}
      sourceType={sourceType}
      onCommit={handleCommit}
      onBack={() => {
        setExtractionResult(null);
        setInputStep('choose');
        setActiveInput(null);
      }}
    />
  </div>
)}
```

**Acceptance Criteria:**
- [ ] RecommendationReview renders when inputStep === 'review'
- [ ] handleCommit receives all 4 params from extended callback
- [ ] Celebration triggers if delta > 0
- [ ] Profile and scores state updated after commit
- [ ] Back button clears extraction and returns to choose step

---

### Task PP-5.3: Update RecommendationReview onCommit Signature
**Description:** Extend onCommit callback to pass previousScores and savedCount
**Size:** Small
**Priority:** High
**Dependencies:** PP-2.3
**Can run parallel with:** PP-5.1, PP-5.2

**Implementation:**
Modify `app/clarity-canvas/components/RecommendationReview.tsx`:

```typescript
// Update interface:
interface RecommendationReviewProps {
  // ...existing props
  onCommit: (
    updatedProfile: ProfileWithSections,
    newScores: ProfileScores,
    previousScores: ProfileScores,  // NEW
    savedCount: number              // NEW
  ) => void;
}

// Update commit handler:
const handleCommit = async () => {
  // ...existing commit logic...
  const result = await res.json() as CommitRecommendationsResponse;

  onCommit(
    result.updatedProfile,
    result.scores,
    result.previousScores,  // NEW
    result.savedCount       // NEW
  );
};
```

Also update `ClarityCanvasClient.tsx` to use the new signature.

**Acceptance Criteria:**
- [ ] onCommit prop signature updated
- [ ] handleCommit passes all 4 values
- [ ] Both PillarPageClient and ClarityCanvasClient receive correct params

---

### Task PP-5.4: Wire PillarCelebration into PillarPageClient
**Description:** Integrate celebration overlay with dismiss handling
**Size:** Small
**Priority:** High
**Dependencies:** PP-4.3, PP-5.2
**Can run parallel with:** None

**Implementation:**
Update `PillarPageClient.tsx`:

```typescript
// Add to imports
import PillarCelebration from '../components/PillarCelebration';

// Add dismiss handler:
const handleCelebrationDismiss = () => {
  setCelebrationData(null);
  router.refresh(); // Sync server components
};

// In render, replace placeholder:
<AnimatePresence>
  {celebrationData && (
    <PillarCelebration
      data={celebrationData}
      onDismiss={handleCelebrationDismiss}
    />
  )}
</AnimatePresence>
```

**Acceptance Criteria:**
- [ ] PillarCelebration renders when celebrationData is set
- [ ] Dismiss clears celebrationData
- [ ] router.refresh() called on dismiss

---

## Phase 6: Polish & Edge Cases

### Task PP-6.1: Render Subsection Fields in PillarPageClient
**Description:** Complete field display in subsection cards
**Size:** Medium
**Priority:** Medium
**Dependencies:** PP-4.1
**Can run parallel with:** PP-6.2

**Implementation:**
In `PillarPageClient.tsx`, expand subsection card rendering:

```typescript
import { FIELD_DISPLAY_NAMES } from '@/lib/clarity-canvas/profile-structure';
import { calculateFieldScore } from '@/lib/clarity-canvas/scoring';

// In subsection card:
{subsection.fields
  .sort((a, b) => calculateFieldScore(b) - calculateFieldScore(a))
  .map((field) => {
    const hasData = field.currentValue && field.currentValue.trim().length > 0;
    const displayName = FIELD_DISPLAY_NAMES[field.key] || field.key;

    return (
      <div key={field.key} className="flex items-start gap-3 py-2">
        <span className={`w-2 h-2 mt-1.5 rounded-full ${hasData ? 'bg-green-500' : 'bg-zinc-600'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#f5f5f5]">{displayName}</p>
          <p className="text-xs text-[#888888] truncate">
            {hasData ? (field.summary || field.currentValue) : 'No data yet'}
          </p>
        </div>
        {hasData && field.sources.length > 0 && (
          <span className="text-xs text-zinc-500">
            {field.sources.length} source{field.sources.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  })}
```

**Acceptance Criteria:**
- [ ] Fields displayed with green/grey completion dots
- [ ] Fields sorted by completion (populated first)
- [ ] Display names from FIELD_DISPLAY_NAMES
- [ ] Source count badge for populated fields

---

### Task PP-6.2: Handle Edge Cases
**Description:** Implement edge case handling per spec section 13
**Size:** Medium
**Priority:** Medium
**Dependencies:** PP-5.2
**Can run parallel with:** PP-6.1

**Implementation:**

1. **Zero extraction chunks**: In ContextInput processing, check result
```typescript
if (result.extractedChunks.length === 0) {
  setError(`No relevant information found for ${scopeLabel}. Try providing more specific context.`);
  setStep('choose');
  return;
}
```

2. **Score didn't change**: In handleCommit
```typescript
if (delta === 0) {
  // Show toast instead of celebration
  // toast.success('Updates saved');
  return;
}
```

3. **User navigates away**: Add abort controller
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  return () => {
    abortControllerRef.current?.abort();
  };
}, []);

// In fetch calls:
abortControllerRef.current = new AbortController();
const res = await fetch(url, { signal: abortControllerRef.current.signal });
```

4. **FAB scope selection panel**: Add scope chooser UI when FAB clicked

**Acceptance Criteria:**
- [ ] Zero chunks shows error with "Try Again" option
- [ ] No-change commits skip celebration
- [ ] Fetch requests aborted on unmount
- [ ] FAB opens scope chooser before input

---

### Task PP-6.3: Add Toast Notifications
**Description:** Add toast for non-celebration commits
**Size:** Small
**Priority:** Low
**Dependencies:** PP-6.2
**Can run parallel with:** None

**Implementation:**
Use existing toast system or add simple toast component for "Updates saved" messages when score doesn't change.

**Acceptance Criteria:**
- [ ] Toast appears when commit succeeds but score unchanged
- [ ] Toast auto-dismisses after 3 seconds

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Foundation | PP-1.1, PP-1.2, PP-1.3 | High |
| Phase 2: API Layer | PP-2.1, PP-2.2, PP-2.3 | High |
| Phase 3: Routing | PP-3.1, PP-3.2, PP-3.3, PP-3.4, PP-3.5 | High |
| Phase 4: UI | PP-4.1, PP-4.2, PP-4.3 | High |
| Phase 5: Integration | PP-5.1, PP-5.2, PP-5.3, PP-5.4 | High |
| Phase 6: Polish | PP-6.1, PP-6.2, PP-6.3 | Medium-Low |

**Total Tasks:** 19
**Parallel Opportunities:** Tasks within same phase can often run in parallel
**Critical Path:** PP-1.1 → PP-2.x → PP-3.1 → PP-4.1 → PP-5.x
