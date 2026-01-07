# Task Breakdown: Clarity Canvas Core Builder Experience

**Generated:** 2025-01-04
**Source:** specs/feat-clarity-canvas-core-builder.md
**Total Estimated Hours:** 40-60 hours

---

## Overview

Clarity Canvas is a multi-modal context extraction system that builds rich user profiles through voice/text brain dumps and interactive questionnaires. This task breakdown covers Release 1: Core Builder Experience.

**User Flow:**
1. Welcome Screen → Brain Dump → Recording → Processing
2. Initial Profile (orbital/list views with low scores)
3. Interview (8 questions with confidence tracking)
4. Enriched Profile (animated score improvements)

---

## Phase 1: Foundation Infrastructure

### Task 1.1: Install Dependencies and Configure Prisma

**Description:** Set up Prisma ORM with Neon PostgreSQL and install all required packages
**Size:** Medium
**Priority:** Critical (blocks everything)
**Dependencies:** None
**Can run parallel with:** None

**Technical Requirements:**

Install new dependencies:
```bash
npm install @prisma/client ai zod openai react-speech-recognition
npm install -D prisma @types/react-speech-recognition
```

Initialize Prisma:
```bash
npx prisma init
```

Configure `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Create Prisma client singleton for Next.js:
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

Add to `.env.example`:
```env
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
OPENAI_API_KEY="sk-..."
```

**Acceptance Criteria:**
- [ ] All packages installed without errors
- [ ] Prisma initialized with PostgreSQL provider
- [ ] Prisma client singleton created at `lib/prisma.ts`
- [ ] Environment variables documented in `.env.example`
- [ ] `npx prisma generate` runs successfully

---

### Task 1.2: Create Clarity Canvas Database Schema

**Description:** Define complete Prisma schema with all 5 models for profile hierarchy
**Size:** Large
**Priority:** Critical
**Dependencies:** Task 1.1
**Can run parallel with:** None

**Technical Requirements:**

Add to `prisma/schema.prisma`:
```prisma
// ============================================================================
// CLARITY CANVAS MODELS
// ============================================================================

model ClarityProfile {
  id        String   @id @default(cuid())
  userId    String   @unique  // NextAuth user.id - enforces 1:1 ownership
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sections  ProfileSection[]

  @@index([userId])
}

model ProfileSection {
  id         String   @id @default(cuid())
  profileId  String
  key        String   // "individual", "role", "organization", "goals", "network", "projects"
  name       String   // Display name
  icon       String   // Emoji icon
  order      Int      // Display order (1-6)
  score      Int      @default(0)  // 0-100 calculated score
  summary    String?  // AI-generated summary

  subsections ProfileSubsection[]
  profile     ClarityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, key])
  @@index([profileId])
}

model ProfileSubsection {
  id        String   @id @default(cuid())
  sectionId String
  key       String   // e.g., "background", "thinking_style"
  name      String   // Display name
  order     Int      // Display order within section
  score     Int      @default(0)  // 0-100 calculated score
  summary   String?  // AI-generated summary

  fields    ProfileField[]
  section   ProfileSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@unique([sectionId, key])
  @@index([sectionId])
}

model ProfileField {
  id                   String   @id @default(cuid())
  subsectionId         String
  key                  String   // e.g., "career", "decision_making"
  name                 String   // Display name

  // Content
  summary              String?  // Short display version (max ~100 chars)
  fullContext          String?  @db.Text  // Complete captured context

  // Scoring
  score                Int      @default(0)  // 0-100 completeness
  confidence           Float    @default(1.0)  // 0-1 user-stated confidence
  flaggedForValidation Boolean  @default(false)  // User marked "not sure"

  // Temporal
  lastUpdated          DateTime @default(now()) @updatedAt

  sources              FieldSource[]
  subsection           ProfileSubsection @relation(fields: [subsectionId], references: [id], onDelete: Cascade)

  @@unique([subsectionId, key])
  @@index([subsectionId])
}

model FieldSource {
  id             String     @id @default(cuid())
  fieldId        String
  type           SourceType
  rawContent     String     @db.Text  // Original input verbatim
  extractedAt    DateTime   @default(now())
  questionId     String?    // If from interview question
  userConfidence Float      @default(1.0)  // 0-1 user-stated at capture time

  field          ProfileField @relation(fields: [fieldId], references: [id], onDelete: Cascade)

  @@index([fieldId])
}

enum SourceType {
  VOICE
  TEXT
  QUESTION
}
```

Run migration:
```bash
npx prisma migrate dev --name init-clarity-canvas
npx prisma generate
```

**Acceptance Criteria:**
- [ ] All 5 models defined with correct relations
- [ ] Cascade deletes configured for all child relations
- [ ] Indexes on foreign keys for query performance
- [ ] Unique constraints prevent duplicate sections/fields per parent
- [ ] Migration runs successfully against Neon database
- [ ] `npx prisma studio` shows correct schema structure

---

### Task 1.3: Create Profile Structure Definition and Seed Script

**Description:** Define the fixed 6-section profile hierarchy and create database seeding logic
**Size:** Medium
**Priority:** Critical
**Dependencies:** Task 1.2
**Can run parallel with:** None

**Technical Requirements:**

Create `lib/clarity-canvas/profile-structure.ts`:
```typescript
export const PROFILE_STRUCTURE = {
  individual: {
    name: 'Individual',
    icon: '👤',
    order: 1,
    subsections: {
      background: {
        name: 'Background & Identity',
        order: 1,
        fields: ['career', 'education', 'expertise', 'experience_years', 'industry']
      },
      thinking: {
        name: 'Thinking Style',
        order: 2,
        fields: ['decision_making', 'problem_solving', 'risk_tolerance', 'learning_style']
      },
      working: {
        name: 'Working Style',
        order: 3,
        fields: ['collaboration_preference', 'communication_style', 'work_pace', 'autonomy_level']
      },
      values: {
        name: 'Values & Motivations',
        order: 4,
        fields: ['core_values', 'motivations', 'mission', 'passions']
      }
    }
  },
  role: {
    name: 'Role',
    icon: '💼',
    order: 2,
    subsections: {
      responsibilities: {
        name: 'Core Responsibilities',
        order: 1,
        fields: ['title', 'primary_duties', 'key_metrics', 'team_size']
      },
      scope: {
        name: 'Scope & Authority',
        order: 2,
        fields: ['decision_authority', 'budget_control', 'strategic_input', 'execution_focus']
      },
      constraints: {
        name: 'Constraints & Challenges',
        order: 3,
        fields: ['time_constraints', 'resource_constraints', 'organizational_constraints', 'skill_gaps']
      }
    }
  },
  organization: {
    name: 'Organization',
    icon: '🏢',
    order: 3,
    subsections: {
      fundamentals: {
        name: 'Company Fundamentals',
        order: 1,
        fields: ['company_name', 'industry', 'stage', 'size', 'founded', 'location']
      },
      product: {
        name: 'Product & Strategy',
        order: 2,
        fields: ['core_product', 'value_proposition', 'business_model', 'competitive_advantage']
      },
      market: {
        name: 'Market Position',
        order: 3,
        fields: ['target_market', 'customer_segments', 'market_size', 'competitive_landscape']
      },
      financials: {
        name: 'Financial Context',
        order: 4,
        fields: ['funding_status', 'runway', 'revenue_stage', 'burn_rate']
      }
    }
  },
  goals: {
    name: 'Goals',
    icon: '🎯',
    order: 4,
    subsections: {
      immediate: {
        name: 'Immediate Objectives',
        order: 1,
        fields: ['current_focus', 'this_week', 'this_month', 'blockers']
      },
      medium: {
        name: 'Medium-term Aspirations',
        order: 2,
        fields: ['quarterly_goals', 'annual_goals', 'milestones']
      },
      metrics: {
        name: 'Success Metrics',
        order: 3,
        fields: ['north_star', 'kpis', 'success_definition', 'validation_level']
      },
      strategy: {
        name: 'Strategic Direction',
        order: 4,
        fields: ['growth_strategy', 'profitability_priority', 'exit_vision']
      }
    }
  },
  network: {
    name: 'Network',
    icon: '🔗',
    order: 5,
    subsections: {
      stakeholders: {
        name: 'Key Stakeholders',
        order: 1,
        fields: ['investors', 'board', 'key_customers', 'key_partners']
      },
      team: {
        name: 'Team & Reports',
        order: 2,
        fields: ['direct_reports', 'key_collaborators', 'cross_functional']
      },
      support: {
        name: 'Support Network',
        order: 3,
        fields: ['advisors', 'mentors', 'peer_network', 'help_needed']
      }
    }
  },
  projects: {
    name: 'Projects',
    icon: '📁',
    order: 6,
    subsections: {
      active: {
        name: 'Active Initiatives',
        order: 1,
        fields: ['current_projects', 'project_priorities', 'resource_allocation']
      },
      upcoming: {
        name: 'Upcoming Priorities',
        order: 2,
        fields: ['planned_projects', 'next_quarter', 'backlog']
      },
      completed: {
        name: 'Recent Completions',
        order: 3,
        fields: ['recent_wins', 'lessons_learned', 'portfolio']
      }
    }
  }
} as const;

export type SectionKey = keyof typeof PROFILE_STRUCTURE;
export type ProfileStructure = typeof PROFILE_STRUCTURE;

// Field display name mapping
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  career: 'Career Path',
  education: 'Education',
  expertise: 'Areas of Expertise',
  experience_years: 'Years of Experience',
  industry: 'Industry Background',
  decision_making: 'Decision Making Style',
  problem_solving: 'Problem Solving Approach',
  risk_tolerance: 'Risk Tolerance',
  learning_style: 'Learning Style',
  // ... add all 60+ fields
};
```

Create `lib/clarity-canvas/seed-profile.ts`:
```typescript
import { prisma } from '@/lib/prisma';
import { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES } from './profile-structure';

export async function seedProfileForUser(userId: string, userName: string) {
  // Check if profile already exists
  const existing = await prisma.clarityProfile.findUnique({
    where: { userId }
  });

  if (existing) {
    return existing;
  }

  // Create profile with full structure
  const profile = await prisma.clarityProfile.create({
    data: {
      userId,
      name: userName,
      sections: {
        create: Object.entries(PROFILE_STRUCTURE).map(([sectionKey, section]) => ({
          key: sectionKey,
          name: section.name,
          icon: section.icon,
          order: section.order,
          subsections: {
            create: Object.entries(section.subsections).map(([subsectionKey, subsection]) => ({
              key: subsectionKey,
              name: subsection.name,
              order: subsection.order,
              fields: {
                create: subsection.fields.map((fieldKey, index) => ({
                  key: fieldKey,
                  name: FIELD_DISPLAY_NAMES[fieldKey] || fieldKey.replace(/_/g, ' '),
                }))
              }
            }))
          }
        }))
      }
    },
    include: {
      sections: {
        include: {
          subsections: {
            include: {
              fields: true
            }
          }
        }
      }
    }
  });

  return profile;
}
```

**Acceptance Criteria:**
- [ ] `PROFILE_STRUCTURE` contains all 6 sections with correct subsections and fields
- [ ] Field display names map all 60+ field keys to human-readable labels
- [ ] `seedProfileForUser` creates complete profile hierarchy in single transaction
- [ ] Seeding is idempotent (returns existing profile if already created)
- [ ] Test: Create profile for test user and verify 6 sections × subsections × fields created

---

### Task 1.4: Create Profile API Routes (GET/POST)

**Description:** Implement API endpoints for profile creation and retrieval with NextAuth integration
**Size:** Medium
**Priority:** Critical
**Dependencies:** Task 1.3
**Can run parallel with:** None

**Technical Requirements:**

Create `app/api/clarity-canvas/profile/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { seedProfileForUser } from '@/lib/clarity-canvas/seed-profile';
import { calculateOverallScore, calculateSectionScore } from '@/lib/clarity-canvas/scoring';

// GET: Retrieve user's profile with all nested data
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await prisma.clarityProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                include: {
                  sources: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!profile) {
    return NextResponse.json({ profile: null, scores: null });
  }

  // Calculate scores
  const sectionScores: Record<string, number> = {};
  for (const section of profile.sections) {
    sectionScores[section.key] = calculateSectionScore(section);
  }
  const overallScore = calculateOverallScore(profile.sections);

  return NextResponse.json({
    profile,
    scores: {
      overall: overallScore,
      sections: sectionScores
    }
  });
}

// POST: Create new profile for user (or return existing)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if profile exists
  const existing = await prisma.clarityProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (existing) {
    return NextResponse.json({ profile: existing, isNew: false });
  }

  // Create new profile with full structure
  const profile = await seedProfileForUser(
    session.user.id,
    session.user.name || session.user.email || 'User'
  );

  return NextResponse.json({ profile, isNew: true });
}
```

**Acceptance Criteria:**
- [ ] GET returns 401 for unauthenticated requests
- [ ] GET returns null profile if user has no profile yet
- [ ] GET returns full profile with sections → subsections → fields → sources
- [ ] GET calculates and returns overall + section scores
- [ ] POST creates new profile with complete structure on first call
- [ ] POST returns existing profile with `isNew: false` on subsequent calls
- [ ] Test: Create profile via POST, retrieve via GET, verify structure

---

### Task 1.5: Create TypeScript Types for Clarity Canvas

**Description:** Define comprehensive TypeScript types for all Clarity Canvas data structures
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.2
**Can run parallel with:** Task 1.3, Task 1.4

**Technical Requirements:**

Create `lib/clarity-canvas/types.ts`:
```typescript
import {
  ClarityProfile,
  ProfileSection,
  ProfileSubsection,
  ProfileField,
  FieldSource,
  SourceType
} from '@prisma/client';

// Full profile with all nested relations
export type ProfileWithSections = ClarityProfile & {
  sections: (ProfileSection & {
    subsections: (ProfileSubsection & {
      fields: (ProfileField & {
        sources: FieldSource[];
      })[];
    })[];
  })[];
};

// Section with nested relations
export type SectionWithSubsections = ProfileSection & {
  subsections: (ProfileSubsection & {
    fields: ProfileField[];
  })[];
};

// Score calculation results
export interface ProfileScores {
  overall: number;
  sections: Record<string, number>;
}

// Brain dump extraction chunk
export interface ExtractionChunk {
  content: string;
  targetSection: string;
  targetSubsection: string;
  targetField: string;
  summary: string;
  confidence: number;
  insights?: string[];
}

// Brain dump API response
export interface BrainDumpResponse {
  extractedChunks: ExtractionChunk[];
  updatedProfile: ProfileWithSections;
  scores: ProfileScores;
}

// Question response structure
export interface QuestionResponse {
  value: string | string[] | number;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  contextSource?: 'voice' | 'text';
}

// Question response API payload
export interface QuestionResponsePayload {
  questionId: string;
  response: QuestionResponse;
}

// Question response API result
export interface QuestionResponseResult {
  fieldsUpdated: {
    sectionKey: string;
    fieldKey: string;
    previousScore: number;
    newScore: number;
  }[];
  scores: ProfileScores;
}

// Transcription response
export interface TranscriptionResponse {
  transcript: string;
  duration: number;
}

// Re-export Prisma types
export { SourceType };
export type { ClarityProfile, ProfileSection, ProfileSubsection, ProfileField, FieldSource };
```

**Acceptance Criteria:**
- [ ] All API request/response types defined
- [ ] Nested profile types correctly reflect Prisma relations
- [ ] Score calculation types defined
- [ ] Types exported and usable throughout codebase
- [ ] No TypeScript errors when importing types

---

### Task 1.6: Implement Score Calculation Engine

**Description:** Build the scoring algorithm that calculates field, subsection, section, and overall scores
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.5
**Can run parallel with:** Task 1.4

**Technical Requirements:**

Create `lib/clarity-canvas/scoring.ts`:
```typescript
import { ProfileField, ProfileSubsection, ProfileSection } from './types';

/**
 * Calculate score for a single field based on:
 * - Content length (0-40 points)
 * - Source diversity (0-30 points)
 * - Has summary (0-20 points)
 * - Confidence level (0-10 points)
 * - Flagged penalty (30% reduction)
 */
export function calculateFieldScore(field: ProfileField & { sources?: { id: string }[] }): number {
  if (!field.fullContext && !field.summary) return 0;

  let score = 0;

  // Content length scoring (0-40 points)
  const content = field.fullContext || '';
  if (content.length > 0) score += 10;
  if (content.length > 50) score += 10;
  if (content.length > 150) score += 10;
  if (content.length > 300) score += 10;

  // Source diversity (0-30 points)
  const sourceCount = field.sources?.length || 0;
  if (sourceCount > 0) score += 10;
  if (sourceCount > 1) score += 10;
  if (sourceCount > 2) score += 10;

  // Has summary (0-20 points)
  if (field.summary) score += 20;

  // Confidence adjustment (0-10 points)
  score += Math.round(field.confidence * 10);

  // Flagged penalty
  if (field.flaggedForValidation) score = Math.round(score * 0.7);

  return Math.min(score, 100);
}

/**
 * Calculate subsection score as average of field scores
 */
export function calculateSubsectionScore(
  subsection: ProfileSubsection & { fields: (ProfileField & { sources?: { id: string }[] })[] }
): number {
  if (subsection.fields.length === 0) return 0;

  const fieldScores = subsection.fields.map(f => calculateFieldScore(f));
  return Math.round(fieldScores.reduce((a, b) => a + b, 0) / fieldScores.length);
}

/**
 * Calculate section score as average of subsection scores
 */
export function calculateSectionScore(
  section: ProfileSection & {
    subsections: (ProfileSubsection & {
      fields: (ProfileField & { sources?: { id: string }[] })[]
    })[]
  }
): number {
  if (section.subsections.length === 0) return 0;

  const subsectionScores = section.subsections.map(s => calculateSubsectionScore(s));
  return Math.round(subsectionScores.reduce((a, b) => a + b, 0) / subsectionScores.length);
}

/**
 * Calculate overall profile score as average of section scores
 */
export function calculateOverallScore(
  sections: (ProfileSection & {
    subsections: (ProfileSubsection & {
      fields: (ProfileField & { sources?: { id: string }[] })[]
    })[]
  })[]
): number {
  if (sections.length === 0) return 0;

  const sectionScores = sections.map(s => calculateSectionScore(s));
  return Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length);
}

/**
 * Get color for score display
 * Gold (90+) → Green (75+) → Yellow (50+) → Orange (25+) → Red
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#D4A84B'; // Gold
  if (score >= 75) return '#4ADE80'; // Green
  if (score >= 50) return '#FBBF24'; // Yellow
  if (score >= 25) return '#FB923C'; // Orange
  return '#EF4444'; // Red
}

/**
 * Get weakest sections (lowest scores) for nudge UI
 */
export function getWeakestSections(
  sections: (ProfileSection & {
    subsections: (ProfileSubsection & { fields: ProfileField[] })[]
  })[],
  count: number = 2
): { key: string; name: string; score: number }[] {
  return sections
    .map(s => ({
      key: s.key,
      name: s.name,
      score: calculateSectionScore(s)
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}
```

Create `tests/clarity-canvas/scoring.test.ts`:
```typescript
import {
  calculateFieldScore,
  calculateSubsectionScore,
  calculateSectionScore,
  calculateOverallScore,
  getScoreColor
} from '@/lib/clarity-canvas/scoring';

describe('Score Calculation', () => {
  describe('calculateFieldScore', () => {
    const createMockField = (overrides = {}) => ({
      id: '1',
      subsectionId: '1',
      key: 'test',
      name: 'Test Field',
      summary: null,
      fullContext: null,
      score: 0,
      confidence: 1.0,
      flaggedForValidation: false,
      lastUpdated: new Date(),
      sources: [],
      ...overrides
    });

    it('returns 0 for empty fields', () => {
      const field = createMockField({ summary: null, fullContext: null });
      expect(calculateFieldScore(field)).toBe(0);
    });

    it('increases score with content length', () => {
      const shortField = createMockField({ fullContext: 'Short' });
      const longField = createMockField({ fullContext: 'A'.repeat(400) });
      expect(calculateFieldScore(longField)).toBeGreaterThan(calculateFieldScore(shortField));
    });

    it('applies 30% penalty when flaggedForValidation is true', () => {
      const normalField = createMockField({ fullContext: 'Content', summary: 'Sum' });
      const flaggedField = createMockField({ fullContext: 'Content', summary: 'Sum', flaggedForValidation: true });
      const normalScore = calculateFieldScore(normalField);
      const flaggedScore = calculateFieldScore(flaggedField);
      expect(flaggedScore).toBe(Math.round(normalScore * 0.7));
    });

    it('factors in confidence level', () => {
      const lowConfidence = createMockField({ fullContext: 'Content', confidence: 0.2 });
      const highConfidence = createMockField({ fullContext: 'Content', confidence: 1.0 });
      expect(calculateFieldScore(highConfidence)).toBeGreaterThan(calculateFieldScore(lowConfidence));
    });

    it('caps score at 100', () => {
      const maxedField = createMockField({
        fullContext: 'A'.repeat(400),
        summary: 'Summary',
        confidence: 1.0,
        sources: [{ id: '1' }, { id: '2' }, { id: '3' }]
      });
      expect(calculateFieldScore(maxedField)).toBeLessThanOrEqual(100);
    });
  });

  describe('getScoreColor', () => {
    it('returns gold for 90+', () => {
      expect(getScoreColor(90)).toBe('#D4A84B');
      expect(getScoreColor(100)).toBe('#D4A84B');
    });

    it('returns green for 75-89', () => {
      expect(getScoreColor(75)).toBe('#4ADE80');
      expect(getScoreColor(89)).toBe('#4ADE80');
    });

    it('returns red for < 25', () => {
      expect(getScoreColor(0)).toBe('#EF4444');
      expect(getScoreColor(24)).toBe('#EF4444');
    });
  });
});
```

**Acceptance Criteria:**
- [ ] `calculateFieldScore` correctly weighs content, sources, summary, confidence
- [ ] Flagged penalty reduces score by 30%
- [ ] Score never exceeds 100
- [ ] Subsection/section/overall scores are proper averages
- [ ] Color coding matches spec thresholds
- [ ] All unit tests pass
- [ ] `getWeakestSections` returns correct lowest-scoring sections

---

## Phase 2: Voice Capture & Extraction

### Task 2.1: Build VoiceRecorder Component

**Description:** Create voice capture component using MediaRecorder API with waveform visualization
**Size:** Large
**Priority:** High
**Dependencies:** Phase 1 complete
**Can run parallel with:** Task 2.2

**Technical Requirements:**

Create `app/clarity-canvas/components/VoiceRecorder.tsx`:
```typescript
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  minDuration?: number; // seconds
  maxDuration?: number; // seconds
}

export function VoiceRecorder({
  onRecordingComplete,
  minDuration = 30,
  maxDuration = 120
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();

  const canStop = duration >= minDuration;

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      // Set up audio analysis for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, duration);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);
      setError(null);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= maxDuration) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);

      // Start audio level analysis
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.');
      console.error('Recording error:', err);
    }
  }, [maxDuration, onRecordingComplete, duration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Recording button */}
      <motion.button
        onClick={isRecording ? (canStop ? stopRecording : undefined) : startRecording}
        disabled={isRecording && !canStop}
        className={`
          w-24 h-24 rounded-full flex items-center justify-center
          transition-all duration-300
          ${isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-[#D4A84B] hover:bg-[#e0b55c]'
          }
          ${isRecording && !canStop ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {isRecording ? (
          <div className="w-8 h-8 bg-white rounded-sm" />
        ) : (
          <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        )}
      </motion.button>

      {/* Waveform visualization */}
      {isRecording && (
        <div className="flex items-center gap-1 h-16">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-[#D4A84B] rounded-full"
              animate={{
                height: `${20 + audioLevel * 40 * Math.sin((i + Date.now() / 100) * 0.5)}px`
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      )}

      {/* Timer */}
      <div className="text-center">
        <p className="text-2xl font-mono text-white">
          {formatTime(duration)} / {formatTime(minDuration)}
        </p>
        {isRecording && !canStop && (
          <p className="text-sm text-zinc-400 mt-2">
            Minimum {minDuration} seconds required
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#D4A84B]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((duration / minDuration) * 100, 100)}%` }}
        />
      </div>

      {/* Done button */}
      {isRecording && canStop && (
        <motion.button
          onClick={stopRecording}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
        >
          Done Recording
        </motion.button>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Requests microphone permission on start
- [ ] Shows error message if permission denied
- [ ] Records audio in WebM/Opus format
- [ ] Waveform visualizes audio levels in real-time
- [ ] Timer shows current duration vs minimum
- [ ] Done button disabled until minimum duration reached
- [ ] Auto-stops at maximum duration
- [ ] Passes audio blob and duration to callback on complete
- [ ] Cleans up all resources on unmount

---

### Task 2.2: Create Whisper Transcription API Route

**Description:** Implement audio transcription endpoint using OpenAI Whisper API
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 2.1

**Technical Requirements:**

Create `app/api/clarity-canvas/transcribe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file size (max 25MB for Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 });
    }

    const startTime = Date.now();

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });

    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      transcript: transcription.text,
      duration: transcription.duration || 0,
      processingTime: duration
    });

  } catch (error) {
    console.error('Transcription error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 for missing or oversized audio files
- [ ] Successfully transcribes audio via Whisper
- [ ] Returns transcript text and audio duration
- [ ] Handles OpenAI API errors gracefully
- [ ] Test: Upload test audio file and verify transcription

---

### Task 2.3: Create AI Extraction Schema and Prompt

**Description:** Define Zod schemas for AI extraction and system prompt for brain dump processing
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.5
**Can run parallel with:** Task 2.1, Task 2.2

**Technical Requirements:**

Create `lib/clarity-canvas/extraction-schema.ts`:
```typescript
import { z } from 'zod';

export const extractionChunkSchema = z.object({
  content: z.string().describe('The extracted content verbatim from the transcript'),
  targetSection: z.enum(['individual', 'role', 'organization', 'goals', 'network', 'projects'])
    .describe('The profile section this content belongs to'),
  targetSubsection: z.string().describe('The subsection key (e.g., "background", "responsibilities")'),
  targetField: z.string().describe('The specific field key (e.g., "career", "title")'),
  summary: z.string().max(100).describe('A brief summary suitable for UI display (max 100 chars)'),
  confidence: z.number().min(0).max(1).describe('Confidence in this extraction (0-1)'),
  insights: z.array(z.string()).optional().describe('Any key insights about this information')
});

export const brainDumpExtractionSchema = z.object({
  chunks: z.array(extractionChunkSchema)
    .describe('Array of extracted information chunks mapped to profile fields'),
  overallThemes: z.array(z.string())
    .describe('High-level themes identified in the transcript'),
  suggestedFollowUps: z.array(z.string()).optional()
    .describe('Questions that could help fill gaps in the profile')
});

export type ExtractionChunk = z.infer<typeof extractionChunkSchema>;
export type BrainDumpExtraction = z.infer<typeof brainDumpExtractionSchema>;
```

Create `lib/clarity-canvas/prompts.ts`:
```typescript
import { PROFILE_STRUCTURE } from './profile-structure';

// Generate field list for prompt
const generateFieldList = () => {
  const fields: string[] = [];
  for (const [sectionKey, section] of Object.entries(PROFILE_STRUCTURE)) {
    for (const [subsectionKey, subsection] of Object.entries(section.subsections)) {
      for (const fieldKey of subsection.fields) {
        fields.push(`${sectionKey}.${subsectionKey}.${fieldKey}`);
      }
    }
  }
  return fields;
};

export const BRAIN_DUMP_EXTRACTION_PROMPT = `You are an expert at extracting structured profile information from unstructured speech transcripts.

Given a transcript from someone describing themselves, their work, and their goals, extract relevant information into the following profile structure:

SECTIONS:
- individual: Who they are (background, thinking style, working style, values)
  - background: career, education, expertise, experience_years, industry
  - thinking: decision_making, problem_solving, risk_tolerance, learning_style
  - working: collaboration_preference, communication_style, work_pace, autonomy_level
  - values: core_values, motivations, mission, passions

- role: What they do (responsibilities, scope, constraints)
  - responsibilities: title, primary_duties, key_metrics, team_size
  - scope: decision_authority, budget_control, strategic_input, execution_focus
  - constraints: time_constraints, resource_constraints, organizational_constraints, skill_gaps

- organization: Where they work (company info, product, market, financials)
  - fundamentals: company_name, industry, stage, size, founded, location
  - product: core_product, value_proposition, business_model, competitive_advantage
  - market: target_market, customer_segments, market_size, competitive_landscape
  - financials: funding_status, runway, revenue_stage, burn_rate

- goals: What they want (immediate, medium-term, success metrics, strategy)
  - immediate: current_focus, this_week, this_month, blockers
  - medium: quarterly_goals, annual_goals, milestones
  - metrics: north_star, kpis, success_definition, validation_level
  - strategy: growth_strategy, profitability_priority, exit_vision

- network: Who they work with (stakeholders, team, support network)
  - stakeholders: investors, board, key_customers, key_partners
  - team: direct_reports, key_collaborators, cross_functional
  - support: advisors, mentors, peer_network, help_needed

- projects: What they're building (active, upcoming, completed)
  - active: current_projects, project_priorities, resource_allocation
  - upcoming: planned_projects, next_quarter, backlog
  - completed: recent_wins, lessons_learned, portfolio

EXTRACTION RULES:
1. Extract content verbatim when possible - preserve the user's original wording
2. Map each piece of information to the MOST SPECIFIC field that fits
3. Generate a concise summary (max 100 characters) for display
4. Rate your confidence (0-1) based on how clearly the information was stated
5. Note any key insights or implications of the information
6. DO NOT fabricate information - only extract what is explicitly stated or strongly implied
7. If information could fit multiple fields, choose the most specific one
8. Capture quantity words, numbers, and specific details when mentioned

OUTPUT FORMAT:
Return a JSON object with:
- chunks: Array of extracted information, each mapped to a specific field
- overallThemes: High-level themes identified in the transcript
- suggestedFollowUps: Questions that could help gather missing information`;

export const EXTRACTION_SYSTEM_PROMPT = `You are an AI assistant that extracts structured profile information from transcripts. Always respond with valid JSON matching the required schema. Be thorough but precise.`;
```

**Acceptance Criteria:**
- [ ] Zod schemas validate extraction output correctly
- [ ] Schema includes all 6 sections with correct field mappings
- [ ] Prompt instructs AI to preserve verbatim content
- [ ] Prompt specifies confidence rating rules
- [ ] Schema validates against test extraction outputs
- [ ] Types exported for use in API routes

---

### Task 2.4: Implement Brain Dump Extraction API

**Description:** Create API endpoint that processes brain dumps via GPT-4o-mini and updates profile
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.3, Task 1.6
**Can run parallel with:** None

**Technical Requirements:**

Create `app/api/clarity-canvas/brain-dump/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { brainDumpExtractionSchema, ExtractionChunk } from '@/lib/clarity-canvas/extraction-schema';
import { BRAIN_DUMP_EXTRACTION_PROMPT, EXTRACTION_SYSTEM_PROMPT } from '@/lib/clarity-canvas/prompts';
import { calculateOverallScore, calculateSectionScore } from '@/lib/clarity-canvas/scoring';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inputType, content, duration } = body as {
      inputType: 'voice' | 'text';
      content: string;
      duration?: number;
    };

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Rate limiting check (10 brain dumps per hour)
    const recentDumps = await prisma.fieldSource.count({
      where: {
        field: {
          subsection: {
            section: {
              profile: {
                userId: session.user.id
              }
            }
          }
        },
        type: inputType === 'voice' ? 'VOICE' : 'TEXT',
        extractedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    if (recentDumps >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before submitting another brain dump.' },
        { status: 429 }
      );
    }

    // Get or create profile
    let profile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        sections: {
          include: {
            subsections: {
              include: {
                fields: true
              }
            }
          }
        }
      }
    });

    if (!profile) {
      // Seed profile if doesn't exist
      const { seedProfileForUser } = await import('@/lib/clarity-canvas/seed-profile');
      profile = await seedProfileForUser(session.user.id, session.user.name || 'User');
    }

    // Extract structured data using AI
    const { object: extraction } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: brainDumpExtractionSchema,
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt: `${BRAIN_DUMP_EXTRACTION_PROMPT}\n\nTRANSCRIPT TO ANALYZE:\n${content}`,
    });

    // Process each extracted chunk and update profile
    const updates: ExtractionChunk[] = [];

    for (const chunk of extraction.chunks) {
      // Find the target field
      const section = profile.sections.find(s => s.key === chunk.targetSection);
      if (!section) continue;

      const subsection = section.subsections.find(s => s.key === chunk.targetSubsection);
      if (!subsection) continue;

      const field = subsection.fields.find(f => f.key === chunk.targetField);
      if (!field) continue;

      // Update field with extracted content
      await prisma.profileField.update({
        where: { id: field.id },
        data: {
          summary: chunk.summary,
          fullContext: field.fullContext
            ? `${field.fullContext}\n\n${chunk.content}`
            : chunk.content,
          confidence: Math.max(field.confidence, chunk.confidence),
          sources: {
            create: {
              type: inputType === 'voice' ? 'VOICE' : 'TEXT',
              rawContent: chunk.content,
              userConfidence: chunk.confidence
            }
          }
        }
      });

      updates.push(chunk);
    }

    // Fetch updated profile with scores
    const updatedProfile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
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

    // Calculate scores
    const sectionScores: Record<string, number> = {};
    for (const section of updatedProfile!.sections) {
      sectionScores[section.key] = calculateSectionScore(section);
    }
    const overallScore = calculateOverallScore(updatedProfile!.sections);

    return NextResponse.json({
      extractedChunks: updates,
      updatedProfile,
      scores: {
        overall: overallScore,
        sections: sectionScores
      },
      themes: extraction.overallThemes,
      suggestedFollowUps: extraction.suggestedFollowUps
    });

  } catch (error) {
    console.error('Brain dump processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process brain dump' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 for empty content
- [ ] Returns 429 when rate limit exceeded (10/hour)
- [ ] Creates profile if doesn't exist
- [ ] Extracts structured data via GPT-4o-mini
- [ ] Maps extraction chunks to correct profile fields
- [ ] Creates FieldSource records with proper type
- [ ] Merges new content with existing (additive)
- [ ] Returns updated profile with calculated scores
- [ ] Test: Submit text brain dump and verify field updates

---

### Task 2.5: Create Question-to-Field Mapping Logic

**Description:** Implement mapping from 8 interview questions to specific profile fields
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.5
**Can run parallel with:** Phase 2 tasks

**Technical Requirements:**

Create `lib/clarity-canvas/question-mapping.ts`:
```typescript
import { QuestionResponse } from './types';

export interface QuestionConfig {
  id: string;
  section: string;
  label: string;
  question: string;
  type: 'this-or-that' | 'slider' | 'multi-select' | 'scale';
  options?: { value: string; label: string; description: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const INTERVIEW_QUESTIONS: QuestionConfig[] = [
  {
    id: 'q1',
    section: 'Goals',
    label: 'Success Vision',
    question: 'When you imagine success, which feels more true?',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Users come back every day', description: 'Retention is the north star' },
      { value: 'b', label: 'Users tell their friends about it', description: 'Organic growth is the north star' }
    ]
  },
  {
    id: 'q2',
    section: 'Individual',
    label: 'Problem Approach',
    question: 'When facing a new problem, you typically:',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Research extensively first', description: 'Data-driven decision making' },
      { value: 'b', label: 'Jump in and iterate', description: 'Action generates clarity' }
    ]
  },
  {
    id: 'q3',
    section: 'Organization',
    label: 'Runway',
    question: 'How many months of runway do you have?',
    type: 'slider',
    min: 0,
    max: 24,
    step: 1,
    unit: 'months'
  },
  {
    id: 'q4',
    section: 'Role',
    label: 'Constraints',
    question: 'What are your biggest constraints right now?',
    type: 'multi-select',
    options: [
      { value: 'time', label: 'Time', description: 'Not enough hours in the day' },
      { value: 'money', label: 'Capital', description: 'Budget limitations' },
      { value: 'team', label: 'Team', description: 'Talent or headcount gaps' },
      { value: 'tech', label: 'Technical', description: 'Technical debt or capabilities' },
      { value: 'clarity', label: 'Strategic clarity', description: 'Unclear direction' },
      { value: 'market', label: 'Market access', description: 'Reaching customers' }
    ]
  },
  {
    id: 'q5',
    section: 'Role',
    label: 'Role Need',
    question: 'Right now, your company needs you to be more of a:',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Visionary', description: 'Setting direction and inspiring' },
      { value: 'b', label: 'Operator', description: 'Executing and getting things done' }
    ]
  },
  {
    id: 'q6',
    section: 'Goals',
    label: 'Validation Level',
    question: 'How validated is your core hypothesis?',
    type: 'scale',
    options: [
      { value: '0', label: 'Pure assumption', description: 'Untested hypothesis' },
      { value: '1', label: 'Some signals', description: 'Early indicators but not conclusive' },
      { value: '2', label: 'Strong evidence', description: 'Growing confidence from data' },
      { value: '3', label: 'Validated', description: 'Proven with solid data' }
    ]
  },
  {
    id: 'q7',
    section: 'Goals',
    label: '12-Month Outcome',
    question: 'In 12 months, which outcome matters more?',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Profitable and sustainable', description: 'Control your own destiny' },
      { value: 'b', label: 'Rapid growth with funding', description: 'Raise and accelerate' }
    ]
  },
  {
    id: 'q8',
    section: 'Network',
    label: 'Help Needed',
    question: 'What kind of help would be most valuable right now?',
    type: 'multi-select',
    options: [
      { value: 'technical', label: 'Technical expertise', description: 'Engineering or product help' },
      { value: 'fundraising', label: 'Fundraising intros', description: 'Investor connections' },
      { value: 'strategy', label: 'Strategic thinking partner', description: 'Thought partnership' },
      { value: 'design', label: 'Design/UX help', description: 'Visual and experience design' },
      { value: 'hiring', label: 'Hiring/recruiting', description: 'Finding talent' },
      { value: 'customers', label: 'Customer intros', description: 'Business development' }
    ]
  }
];

export const QUESTION_FIELD_MAPPING: Record<string, {
  targetSection: string;
  targetFields: string[];
  mappingLogic: (response: QuestionResponse) => Record<string, string>;
}> = {
  q1: {
    targetSection: 'goals',
    targetFields: ['north_star', 'success_definition'],
    mappingLogic: (r) => ({
      north_star: r.value === 'a'
        ? 'Retention-focused: Users returning daily is the primary success signal'
        : 'Growth-focused: Organic user referrals are the primary success signal',
      success_definition: r.value === 'a'
        ? 'Success = high retention and daily active usage'
        : 'Success = viral growth and word-of-mouth expansion'
    })
  },
  q2: {
    targetSection: 'individual',
    targetFields: ['decision_making', 'problem_solving'],
    mappingLogic: (r) => ({
      decision_making: r.value === 'a'
        ? 'Data-first: Relies on metrics and evidence before making decisions'
        : 'Intuition-led: Trusts gut instinct and iterates based on action',
      problem_solving: r.value === 'a'
        ? 'Analytical approach - deep research before action'
        : 'Experimental approach - action generates clarity'
    })
  },
  q3: {
    targetSection: 'organization',
    targetFields: ['runway', 'funding_status'],
    mappingLogic: (r) => {
      const months = r.value as number;
      return {
        runway: `${months} months of runway`,
        funding_status: months <= 6
          ? 'Tight runway - fundraising likely needed soon'
          : months <= 12
            ? 'Moderate runway'
            : 'Comfortable runway - 12+ months'
      };
    }
  },
  q4: {
    targetSection: 'role',
    targetFields: ['time_constraints', 'resource_constraints', 'organizational_constraints'],
    mappingLogic: (r) => {
      const constraints = r.value as string[];
      return {
        time_constraints: constraints.includes('time') ? 'Time is a major constraint' : '',
        resource_constraints: constraints
          .filter(c => ['money', 'team', 'tech'].includes(c))
          .map(c => ({ money: 'Capital', team: 'Team/talent', tech: 'Technical capabilities' }[c]))
          .join(', ') || '',
        organizational_constraints: constraints
          .filter(c => ['clarity', 'market'].includes(c))
          .map(c => ({ clarity: 'Strategic clarity', market: 'Market access' }[c]))
          .join(', ') || ''
      };
    }
  },
  q5: {
    targetSection: 'role',
    targetFields: ['execution_focus', 'strategic_input'],
    mappingLogic: (r) => ({
      execution_focus: r.value === 'b'
        ? 'Currently in operator mode - focused on execution and getting things done'
        : 'Currently in visionary mode - focused on setting direction',
      strategic_input: r.value === 'a'
        ? 'Primary focus on vision and inspiring others'
        : 'Primary focus on operational execution'
    })
  },
  q6: {
    targetSection: 'goals',
    targetFields: ['validation_level'],
    mappingLogic: (r) => ({
      validation_level: [
        'Pure assumption - untested hypothesis',
        'Some signals - early indicators but not conclusive',
        'Strong evidence - growing confidence from data',
        'Validated - proven with solid data'
      ][r.value as number]
    })
  },
  q7: {
    targetSection: 'goals',
    targetFields: ['growth_strategy', 'profitability_priority'],
    mappingLogic: (r) => ({
      growth_strategy: r.value === 'a'
        ? 'Prioritizing profitability and sustainable growth'
        : 'Prioritizing venture-scale growth and market capture',
      profitability_priority: r.value === 'a'
        ? 'High - control own destiny, sustainable unit economics'
        : 'Lower - raise capital and accelerate'
    })
  },
  q8: {
    targetSection: 'network',
    targetFields: ['help_needed'],
    mappingLogic: (r) => ({
      help_needed: `Most valuable help areas: ${(r.value as string[])
        .map(v => ({
          technical: 'Technical expertise',
          fundraising: 'Fundraising intros',
          strategy: 'Strategic thinking partner',
          design: 'Design/UX help',
          hiring: 'Hiring/recruiting',
          customers: 'Customer intros'
        }[v]))
        .join(', ')}`
    })
  }
};

export function getQuestionById(id: string): QuestionConfig | undefined {
  return INTERVIEW_QUESTIONS.find(q => q.id === id);
}
```

**Acceptance Criteria:**
- [ ] All 8 questions defined with correct types and options
- [ ] Mapping logic for each question produces correct field values
- [ ] Multi-select questions handle arrays correctly
- [ ] Slider questions handle numeric values correctly
- [ ] Scale questions map to descriptive strings
- [ ] Test: Verify all mappings produce expected output

---

### Task 2.6: Create Question Response API

**Description:** Implement API endpoint for saving interview responses and updating profile
**Size:** Medium
**Priority:** High
**Dependencies:** Task 2.5, Task 1.6
**Can run parallel with:** None

**Technical Requirements:**

Create `app/api/clarity-canvas/question-response/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QUESTION_FIELD_MAPPING, getQuestionById } from '@/lib/clarity-canvas/question-mapping';
import { calculateFieldScore, calculateOverallScore, calculateSectionScore } from '@/lib/clarity-canvas/scoring';
import { QuestionResponse } from '@/lib/clarity-canvas/types';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { questionId, response } = body as {
      questionId: string;
      response: QuestionResponse;
    };

    // Validate question exists
    const question = getQuestionById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    // Get mapping for this question
    const mapping = QUESTION_FIELD_MAPPING[questionId];
    if (!mapping) {
      return NextResponse.json({ error: 'No mapping found for question' }, { status: 400 });
    }

    // Get user's profile
    const profile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
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
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Apply mapping logic to get field values
    const fieldValues = mapping.mappingLogic(response);
    const fieldsUpdated: {
      sectionKey: string;
      fieldKey: string;
      previousScore: number;
      newScore: number;
    }[] = [];

    // Find target section
    const section = profile.sections.find(s => s.key === mapping.targetSection);
    if (!section) {
      return NextResponse.json({ error: 'Target section not found' }, { status: 500 });
    }

    // Update each target field
    for (const fieldKey of mapping.targetFields) {
      const fieldValue = fieldValues[fieldKey];
      if (!fieldValue) continue;

      // Find field across subsections
      let field = null;
      let subsection = null;
      for (const sub of section.subsections) {
        field = sub.fields.find(f => f.key === fieldKey);
        if (field) {
          subsection = sub;
          break;
        }
      }

      if (!field || !subsection) continue;

      const previousScore = calculateFieldScore(field);

      // Update field
      await prisma.profileField.update({
        where: { id: field.id },
        data: {
          summary: fieldValue.length > 100 ? fieldValue.substring(0, 97) + '...' : fieldValue,
          fullContext: field.fullContext
            ? `${field.fullContext}\n\n[From interview Q${questionId}]: ${fieldValue}`
            : `[From interview Q${questionId}]: ${fieldValue}`,
          confidence: response.isUnsure ? Math.min(response.confidence, 0.5) : response.confidence,
          flaggedForValidation: response.isUnsure,
          sources: {
            create: {
              type: 'QUESTION',
              rawContent: fieldValue,
              questionId: questionId,
              userConfidence: response.confidence
            }
          }
        }
      });

      // Also save additional context if provided
      if (response.additionalContext) {
        await prisma.fieldSource.create({
          data: {
            fieldId: field.id,
            type: response.contextSource === 'voice' ? 'VOICE' : 'TEXT',
            rawContent: response.additionalContext,
            questionId: questionId,
            userConfidence: response.confidence
          }
        });
      }

      // Calculate new score
      const updatedField = await prisma.profileField.findUnique({
        where: { id: field.id },
        include: { sources: true }
      });
      const newScore = calculateFieldScore(updatedField!);

      fieldsUpdated.push({
        sectionKey: section.key,
        fieldKey,
        previousScore,
        newScore
      });
    }

    // Fetch updated profile for score calculation
    const updatedProfile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
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

    // Calculate scores
    const sectionScores: Record<string, number> = {};
    for (const s of updatedProfile!.sections) {
      sectionScores[s.key] = calculateSectionScore(s);
    }
    const overallScore = calculateOverallScore(updatedProfile!.sections);

    return NextResponse.json({
      fieldsUpdated,
      scores: {
        overall: overallScore,
        sections: sectionScores
      }
    });

  } catch (error) {
    console.error('Question response error:', error);
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 for invalid question IDs
- [ ] Correctly applies mapping logic for all question types
- [ ] Creates FieldSource with type QUESTION
- [ ] Handles isUnsure flag by capping confidence at 0.5
- [ ] Handles additionalContext by creating separate source
- [ ] Returns previous and new scores for animation
- [ ] Test: Answer all 8 questions and verify field updates

---

## Phase 3: Profile Visualization

### Task 3.1: Create ListView Component

**Description:** Build list view for profile display with section cards and progress bars
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.6
**Can run parallel with:** Task 3.2

**Technical Requirements:**

Create `app/clarity-canvas/components/ListView.tsx`:
```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';
import { getScoreColor } from '@/lib/clarity-canvas/scoring';

interface ListViewProps {
  profile: ProfileWithSections;
  scores: ProfileScores;
  onSectionClick?: (sectionKey: string) => void;
}

export function ListView({ profile, scores, onSectionClick }: ListViewProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {profile.sections.map((section, index) => {
        const sectionScore = scores.sections[section.key] || 0;
        const color = getScoreColor(sectionScore);

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSectionClick?.(section.key)}
            className={`
              bg-zinc-900/50 border border-zinc-800 rounded-xl p-6
              ${onSectionClick ? 'cursor-pointer hover:border-zinc-700 transition-colors' : ''}
            `}
          >
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="text-lg font-medium text-white">{section.name}</h3>
              </div>
              <span
                className="text-2xl font-bold font-mono"
                style={{ color }}
              >
                {sectionScore}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${sectionScore}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
              />
            </div>

            {/* Subsection breakdown */}
            <div className="space-y-2">
              {section.subsections.map(subsection => {
                const filledFields = subsection.fields.filter(f => f.summary || f.fullContext).length;
                const totalFields = subsection.fields.length;

                return (
                  <div key={subsection.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{subsection.name}</span>
                    <span className="text-zinc-500 font-mono">
                      {filledFields}/{totalFields}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Displays all 6 sections as cards
- [ ] Shows section icon, name, and score
- [ ] Progress bar animates to score value
- [ ] Color coding matches score thresholds
- [ ] Subsection breakdown shows filled/total fields
- [ ] Staggered animation on mount
- [ ] Optional click handler for section expansion

---

### Task 3.2: Create OrbitalView Component

**Description:** Build orbital visualization with sections orbiting around user
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.6
**Can run parallel with:** Task 3.1

**Technical Requirements:**

Create `app/clarity-canvas/components/OrbitalView.tsx`:
```typescript
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';
import { getScoreColor } from '@/lib/clarity-canvas/scoring';

interface OrbitalViewProps {
  profile: ProfileWithSections;
  scores: ProfileScores;
  onSectionClick?: (sectionKey: string) => void;
}

export function OrbitalView({ profile, scores, onSectionClick }: OrbitalViewProps) {
  const centerX = 200;
  const centerY = 200;
  const baseRadius = 120;

  const sectionPositions = useMemo(() => {
    return profile.sections.map((section, index) => {
      const angle = (index * (360 / 6) - 90) * (Math.PI / 180);
      const score = scores.sections[section.key] || 0;

      // Lower scores = closer to center (needs attention)
      const radiusMultiplier = 0.6 + (score / 100) * 0.4;
      const radius = baseRadius * radiusMultiplier;

      return {
        section,
        score,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        // Node size based on score
        size: 40 + (score / 100) * 20,
      };
    });
  }, [profile.sections, scores]);

  return (
    <div className="relative w-[400px] h-[400px]">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {sectionPositions.map(({ section, x, y, score }) => (
          <motion.line
            key={`line-${section.id}`}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke={getScoreColor(score)}
            strokeWidth={1}
            strokeOpacity={0.3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
        ))}
      </svg>

      {/* Center nucleus (user) */}
      <motion.div
        className="absolute flex items-center justify-center"
        style={{
          left: centerX - 30,
          top: centerY - 30,
          width: 60,
          height: 60
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-black font-bold text-xl"
          style={{
            background: 'linear-gradient(135deg, #D4A84B, #e0b55c)',
            boxShadow: '0 0 30px rgba(212, 168, 75, 0.5)'
          }}
        >
          {scores.overall}%
        </div>
      </motion.div>

      {/* Section nodes */}
      {sectionPositions.map(({ section, score, x, y, size }, index) => {
        const color = getScoreColor(score);

        return (
          <motion.div
            key={section.id}
            className="absolute flex flex-col items-center cursor-pointer"
            style={{
              left: x - size / 2,
              top: y - size / 2,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{ delay: index * 0.15 + 0.3, type: 'spring' }}
            onClick={() => onSectionClick?.(section.key)}
            whileHover={{ scale: 1.1 }}
          >
            {/* Breathing glow animation */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                opacity: 0.2,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.1, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Node circle */}
            <div
              className="rounded-full flex items-center justify-center text-lg"
              style={{
                width: size,
                height: size,
                backgroundColor: '#111',
                border: `2px solid ${color}`,
                boxShadow: `0 0 15px ${color}40`
              }}
            >
              {section.icon}
            </div>

            {/* Label */}
            <span
              className="mt-2 text-xs font-medium whitespace-nowrap"
              style={{ color }}
            >
              {section.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] 6 sections positioned in orbital layout
- [ ] Center nucleus shows overall score with gold styling
- [ ] Section distance from center inversely proportional to score
- [ ] Node size scales with score
- [ ] Connection lines from center to each section
- [ ] Breathing/pulse animation on nodes
- [ ] Color coding matches score thresholds
- [ ] Hover state scales node
- [ ] Optional click handler for section expansion

---

### Task 3.3: Create ViewToggle and ProfileVisualization Wrapper

**Description:** Build toggle component and wrapper that switches between orbital and list views
**Size:** Small
**Priority:** High
**Dependencies:** Task 3.1, Task 3.2
**Can run parallel with:** None

**Technical Requirements:**

Create `app/clarity-canvas/components/ViewToggle.tsx`:
```typescript
'use client';

import React from 'react';

interface ViewToggleProps {
  view: 'orbital' | 'list';
  onChange: (view: 'orbital' | 'list') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1">
      <button
        onClick={() => onChange('orbital')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          view === 'orbital'
            ? 'bg-[#D4A84B] text-black'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        ◎ Orbital
      </button>
      <button
        onClick={() => onChange('list')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          view === 'list'
            ? 'bg-[#D4A84B] text-black'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        ☰ List
      </button>
    </div>
  );
}
```

Create `app/clarity-canvas/components/ProfileVisualization.tsx`:
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';
import { OrbitalView } from './OrbitalView';
import { ListView } from './ListView';
import { ViewToggle } from './ViewToggle';
import { getWeakestSections, getScoreColor } from '@/lib/clarity-canvas/scoring';

interface ProfileVisualizationProps {
  profile: ProfileWithSections;
  scores: ProfileScores;
  previousScores?: ProfileScores; // For animation
  showScoreAnimation?: boolean;
  onSectionClick?: (sectionKey: string) => void;
}

export function ProfileVisualization({
  profile,
  scores,
  previousScores,
  showScoreAnimation = false,
  onSectionClick
}: ProfileVisualizationProps) {
  // Default to list view on mobile
  const [view, setView] = useState<'orbital' | 'list'>('list');
  const [displayScores, setDisplayScores] = useState(previousScores || scores);

  // Set default view based on screen size
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setView(isMobile ? 'list' : 'orbital');
  }, []);

  // Animate scores if showing animation
  useEffect(() => {
    if (showScoreAnimation && previousScores) {
      // Show previous scores briefly
      setDisplayScores(previousScores);

      // Animate to new scores after delay
      const timer = setTimeout(() => {
        setDisplayScores(scores);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setDisplayScores(scores);
    }
  }, [showScoreAnimation, previousScores, scores]);

  const weakestSections = getWeakestSections(profile.sections, 2);
  const scoreImprovement = previousScores
    ? scores.overall - previousScores.overall
    : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Score improvement banner */}
      {showScoreAnimation && scoreImprovement > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-3 bg-gradient-to-r from-[#D4A84B]/20 to-transparent border-l-2 border-[#D4A84B] rounded-r-lg"
        >
          <p className="text-[#D4A84B] font-medium">
            Foundation score increased by +{scoreImprovement}%
          </p>
        </motion.div>
      )}

      {/* Overall score */}
      <motion.div
        className="text-center"
        key={displayScores.overall}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">
          Foundation Score
        </p>
        <p
          className="text-6xl font-bold font-mono"
          style={{ color: getScoreColor(displayScores.overall) }}
        >
          {displayScores.overall}%
        </p>
      </motion.div>

      {/* View toggle */}
      <ViewToggle view={view} onChange={setView} />

      {/* Visualization */}
      <AnimatePresence mode="wait">
        {view === 'orbital' ? (
          <motion.div
            key="orbital"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <OrbitalView
              profile={profile}
              scores={displayScores}
              onSectionClick={onSectionClick}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full"
          >
            <ListView
              profile={profile}
              scores={displayScores}
              onSectionClick={onSectionClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weakest sections nudge */}
      {weakestSections.length > 0 && weakestSections[0].score < 50 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-zinc-400 mt-4"
        >
          <p>💡 Your {weakestSections[0].name} section could use some attention</p>
        </motion.div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Toggle switches between orbital and list views
- [ ] Default to list view on mobile (< 768px)
- [ ] AnimatePresence provides smooth transitions
- [ ] Score improvement banner shows when appropriate
- [ ] Overall score displays with correct color
- [ ] Weakest section nudge appears when score < 50%
- [ ] Score animation delays and then animates to new values

---

## Phase 4: Interview Flow

### Task 4.1: Create Question Type Components

**Description:** Build components for this-or-that, slider, multi-select, and scale question types
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.5
**Can run parallel with:** Task 4.2

**Technical Requirements:**

Create `app/clarity-canvas/components/ThisOrThatQuestion.tsx`:
```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Option {
  value: string;
  label: string;
  description: string;
}

interface ThisOrThatQuestionProps {
  question: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
}

export function ThisOrThatQuestion({ question, options, value, onChange }: ThisOrThatQuestionProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium text-white text-center">{question}</h2>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              p-6 rounded-xl border-2 text-left transition-all
              ${value === option.value
                ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid="question-option"
          >
            <p className="text-lg font-medium text-white mb-2">{option.label}</p>
            <p className="text-sm text-zinc-400">{option.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

Create `app/clarity-canvas/components/SliderQuestion.tsx`:
```typescript
'use client';

import React from 'react';

interface SliderQuestionProps {
  question: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}

export function SliderQuestion({
  question,
  min,
  max,
  step,
  unit,
  value,
  onChange
}: SliderQuestionProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium text-white text-center">{question}</h2>

      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl font-bold text-[#D4A84B] font-mono">
          {value} <span className="text-2xl text-zinc-400">{unit}</span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full max-w-md h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#D4A84B]
            [&::-webkit-slider-thumb]:cursor-pointer"
          data-testid="question-option"
        />

        <div className="flex justify-between w-full max-w-md text-sm text-zinc-500">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
}
```

Create `app/clarity-canvas/components/MultiSelectQuestion.tsx`:
```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Option {
  value: string;
  label: string;
  description: string;
}

interface MultiSelectQuestionProps {
  question: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
}

export function MultiSelectQuestion({
  question,
  options,
  value,
  onChange,
  maxSelections = 6
}: MultiSelectQuestionProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else if (value.length < maxSelections) {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium text-white text-center">{question}</h2>
      <p className="text-sm text-zinc-400 text-center">Select all that apply</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          return (
            <motion.button
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                  : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="question-option"
            >
              <p className="font-medium text-white">{option.label}</p>
              <p className="text-xs text-zinc-400 mt-1">{option.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
```

Create `app/clarity-canvas/components/ScaleQuestion.tsx`:
```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Option {
  value: string;
  label: string;
  description: string;
}

interface ScaleQuestionProps {
  question: string;
  options: Option[];
  value: number | null;
  onChange: (value: number) => void;
}

export function ScaleQuestion({ question, options, value, onChange }: ScaleQuestionProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium text-white text-center">{question}</h2>

      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
          const isSelected = value === index;
          return (
            <motion.button
              key={option.value}
              onClick={() => onChange(index)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4
                ${isSelected
                  ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                  : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
                }
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              data-testid="question-option"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${isSelected ? 'bg-[#D4A84B] text-black' : 'bg-zinc-800 text-zinc-400'}
                `}
              >
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-white">{option.label}</p>
                <p className="text-sm text-zinc-400">{option.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] ThisOrThat: Two large clickable cards, selected state highlighted
- [ ] Slider: Range input with value display, min/max labels
- [ ] MultiSelect: Grid of toggleable options with selection limit
- [ ] Scale: Vertical list with numbered steps
- [ ] All components have data-testid for E2E tests
- [ ] All components use consistent styling/animations

---

### Task 4.2: Create QuestionMetaWrapper Component

**Description:** Build wrapper component with confidence slider, "not sure" checkbox, and additional context input
**Size:** Medium
**Priority:** High
**Dependencies:** Task 4.1
**Can run parallel with:** Task 4.1

**Technical Requirements:**

Create `app/clarity-canvas/components/ConfidenceSlider.tsx`:
```typescript
'use client';

import React from 'react';

interface ConfidenceSliderProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ConfidenceSlider({ value, onChange, disabled }: ConfidenceSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-zinc-400 w-32">How confident?</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        disabled={disabled}
        className="flex-1 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[#D4A84B]"
      />
      <span className="text-sm text-[#D4A84B] font-mono w-12 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
```

Create `app/clarity-canvas/components/NotSureCheckbox.tsx`:
```typescript
'use client';

import React from 'react';

interface NotSureCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function NotSureCheckbox({ checked, onChange }: NotSureCheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-[#D4A84B]
          focus:ring-[#D4A84B] focus:ring-offset-0 cursor-pointer"
      />
      <div>
        <span className="text-zinc-300">I'm not sure about this</span>
        <p className="text-xs text-zinc-500">That's okay — we'll flag this for validation</p>
      </div>
    </label>
  );
}
```

Create `app/clarity-canvas/components/AdditionalContextInput.tsx`:
```typescript
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdditionalContextInputProps {
  value: string;
  onChange: (value: string) => void;
  onVoiceInput?: (transcript: string) => void;
}

export function AdditionalContextInput({ value, onChange, onVoiceInput }: AdditionalContextInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-zinc-400 hover:text-[#D4A84B] transition-colors"
      >
        {isExpanded ? '− Hide additional context' : '+ Add more context (optional)'}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Share any additional context that might be helpful..."
              className="mt-3 w-full h-24 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
                text-white placeholder-zinc-500 resize-none
                focus:outline-none focus:border-[#D4A84B]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

Create `app/clarity-canvas/components/QuestionMetaWrapper.tsx`:
```typescript
'use client';

import React from 'react';
import { ConfidenceSlider } from './ConfidenceSlider';
import { NotSureCheckbox } from './NotSureCheckbox';
import { AdditionalContextInput } from './AdditionalContextInput';
import { QuestionResponse } from '@/lib/clarity-canvas/types';

interface QuestionMetaWrapperProps {
  questionNumber: number;
  totalQuestions: number;
  sectionLabel: string;
  response: QuestionResponse;
  onResponseChange: (updates: Partial<QuestionResponse>) => void;
  children: React.ReactNode;
}

export function QuestionMetaWrapper({
  questionNumber,
  totalQuestions,
  sectionLabel,
  response,
  onResponseChange,
  children
}: QuestionMetaWrapperProps) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {questionNumber}/{totalQuestions}
        </span>
        <span className="text-[#D4A84B] font-medium uppercase tracking-wider">
          {sectionLabel}
        </span>
      </div>

      {/* Question content */}
      <div className="bg-zinc-900/30 rounded-2xl p-8 border border-zinc-800">
        {children}
      </div>

      {/* Meta controls */}
      <div className="space-y-4 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <NotSureCheckbox
          checked={response.isUnsure}
          onChange={(isUnsure) => onResponseChange({ isUnsure })}
        />

        <div className="h-px bg-zinc-800 my-4" />

        <ConfidenceSlider
          value={response.confidence}
          onChange={(confidence) => onResponseChange({ confidence })}
          disabled={response.isUnsure}
        />

        <div className="h-px bg-zinc-800 my-4" />

        <AdditionalContextInput
          value={response.additionalContext || ''}
          onChange={(additionalContext) => onResponseChange({ additionalContext })}
        />
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Progress header shows question number and section label
- [ ] Question content renders in styled container
- [ ] "Not sure" checkbox flags response for validation
- [ ] Confidence slider disabled when "not sure" is checked
- [ ] Additional context expands/collapses smoothly
- [ ] All updates propagate via onResponseChange callback

---

### Task 4.3: Build Interview Flow Page

**Description:** Create interview page that renders all 8 questions with navigation and progress
**Size:** Large
**Priority:** High
**Dependencies:** Task 4.1, Task 4.2, Task 2.6
**Can run parallel with:** None

**Technical Requirements:**

Create `app/clarity-canvas/interview/page.tsx`:
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionMetaWrapper } from '../components/QuestionMetaWrapper';
import { ThisOrThatQuestion } from '../components/ThisOrThatQuestion';
import { SliderQuestion } from '../components/SliderQuestion';
import { MultiSelectQuestion } from '../components/MultiSelectQuestion';
import { ScaleQuestion } from '../components/ScaleQuestion';
import { INTERVIEW_QUESTIONS } from '@/lib/clarity-canvas/question-mapping';
import { QuestionResponse, ProfileScores } from '@/lib/clarity-canvas/types';

const initialResponse: QuestionResponse = {
  value: '',
  isUnsure: false,
  confidence: 0.75,
  additionalContext: ''
};

export default function InterviewPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState<ProfileScores | null>(null);
  const [previousScores, setPreviousScores] = useState<ProfileScores | null>(null);

  const currentQuestion = INTERVIEW_QUESTIONS[currentIndex];
  const currentResponse = responses[currentQuestion.id] || { ...initialResponse };
  const isLastQuestion = currentIndex === INTERVIEW_QUESTIONS.length - 1;

  // Load initial scores
  useEffect(() => {
    fetch('/api/clarity-canvas/profile')
      .then(res => res.json())
      .then(data => {
        if (data.scores) {
          setPreviousScores(data.scores);
        }
      });
  }, []);

  const updateResponse = (updates: Partial<QuestionResponse>) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: { ...currentResponse, ...updates }
    }));
  };

  const submitResponse = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/clarity-canvas/question-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          response: currentResponse
        })
      });

      const data = await res.json();
      if (data.scores) {
        setScores(data.scores);
      }

      if (isLastQuestion) {
        // Navigate to enriched profile with animation flag
        router.push('/clarity-canvas/profile?showAnimation=true');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canContinue = () => {
    const value = currentResponse.value;
    if (currentQuestion.type === 'multi-select') {
      return (value as string[]).length > 0;
    }
    if (currentQuestion.type === 'slider') {
      return typeof value === 'number';
    }
    return !!value;
  };

  const renderQuestion = () => {
    const question = currentQuestion;

    switch (question.type) {
      case 'this-or-that':
        return (
          <ThisOrThatQuestion
            question={question.question}
            options={question.options!}
            value={currentResponse.value as string}
            onChange={(value) => updateResponse({ value })}
          />
        );
      case 'slider':
        return (
          <SliderQuestion
            question={question.question}
            min={question.min!}
            max={question.max!}
            step={question.step!}
            unit={question.unit!}
            value={(currentResponse.value as number) || question.min!}
            onChange={(value) => updateResponse({ value })}
          />
        );
      case 'multi-select':
        return (
          <MultiSelectQuestion
            question={question.question}
            options={question.options!}
            value={(currentResponse.value as string[]) || []}
            onChange={(value) => updateResponse({ value })}
          />
        );
      case 'scale':
        return (
          <ScaleQuestion
            question={question.question}
            options={question.options!}
            value={currentResponse.value as number | null}
            onChange={(value) => updateResponse({ value })}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-800">
        <motion.div
          className="h-full bg-[#D4A84B]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / INTERVIEW_QUESTIONS.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="max-w-2xl mx-auto"
        >
          <QuestionMetaWrapper
            questionNumber={currentIndex + 1}
            totalQuestions={INTERVIEW_QUESTIONS.length}
            sectionLabel={currentQuestion.section}
            response={currentResponse}
            onResponseChange={updateResponse}
          >
            {renderQuestion()}
          </QuestionMetaWrapper>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          {currentIndex > 0 ? (
            <button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <motion.button
            onClick={submitResponse}
            disabled={!canContinue() || isSubmitting}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all
              ${canContinue() && !isSubmitting
                ? 'bg-[#D4A84B] text-black hover:bg-[#e0b55c]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }
            `}
            whileHover={canContinue() ? { scale: 1.02 } : {}}
            whileTap={canContinue() ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              'Saving...'
            ) : isLastQuestion ? (
              'See Results'
            ) : (
              'Continue →'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Renders all 8 questions in sequence
- [ ] Progress bar shows completion percentage
- [ ] Question transitions animate smoothly
- [ ] Back button navigates to previous question
- [ ] Continue button disabled until question answered
- [ ] Submits response to API on continue
- [ ] Shows "See Results" on last question
- [ ] Navigates to profile with animation flag on completion
- [ ] Test: Complete full interview flow

---

## Phase 5: Polish & Deploy

### Task 5.1: Create Welcome and Brain Dump Flow Pages

**Description:** Build the initial screens: Welcome, Brain Dump Setup, Recording, and Processing
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.1, Task 2.4
**Can run parallel with:** None

**Technical Requirements:**

Create complete flow pages for:
- `app/clarity-canvas/page.tsx` - Entry point (redirect logic)
- `app/clarity-canvas/welcome/page.tsx` - Welcome screen
- `app/clarity-canvas/brain-dump/page.tsx` - Brain dump setup and recording
- Processing state within brain-dump page

See spec for detailed UX copy and screen layouts.

**Acceptance Criteria:**
- [ ] Welcome screen shows brand moment and CTA
- [ ] Brain dump shows 6 cue questions
- [ ] "Why voice is recommended" copy displayed
- [ ] "Prefer to type?" fallback available
- [ ] Recording shows waveform and timer
- [ ] Processing shows 3-step animation
- [ ] Navigates to profile on completion

---

### Task 5.2: Create Profile Page with Data Integration

**Description:** Build profile page that displays visualization with real data and navigation CTAs
**Size:** Medium
**Priority:** High
**Dependencies:** Task 3.3, Task 1.4
**Can run parallel with:** Task 5.1

**Technical Requirements:**

Create `app/clarity-canvas/profile/page.tsx`:
- Fetch profile from API
- Display ProfileVisualization component
- Handle `showAnimation` query param for enriched view
- Show appropriate CTAs based on state

**Acceptance Criteria:**
- [ ] Fetches and displays user's profile
- [ ] Shows loading skeleton while fetching
- [ ] Displays score animation when `showAnimation=true`
- [ ] Shows "Let's go deeper" CTA if interview not complete
- [ ] Shows "Continue to Research" (disabled) if interview complete
- [ ] Handles empty profile state

---

### Task 5.3: Add Layout with Auth Check and Error Handling

**Description:** Create shared layout for Clarity Canvas routes with authentication and error boundaries
**Size:** Medium
**Priority:** High
**Dependencies:** Phase 1 complete
**Can run parallel with:** Task 5.1, Task 5.2

**Technical Requirements:**

Create `app/clarity-canvas/layout.tsx`:
```typescript
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function ClarityCanvasLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/learning?returnTo=/clarity-canvas');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  );
}
```

Add error handling components and loading states.

**Acceptance Criteria:**
- [ ] Redirects unauthenticated users to login
- [ ] Preserves return URL for post-login redirect
- [ ] Consistent dark background styling
- [ ] Error boundary catches and displays errors
- [ ] Loading states show skeleton UI

---

### Task 5.4: Mobile Responsive Adjustments

**Description:** Ensure all components work well on mobile devices
**Size:** Medium
**Priority:** Medium
**Dependencies:** All UI tasks complete
**Can run parallel with:** Task 5.5

**Technical Requirements:**
- List view default on mobile
- Full-width question cards
- Larger touch targets
- Bottom-fixed navigation
- Test on real devices

**Acceptance Criteria:**
- [ ] All screens usable on 375px width
- [ ] Touch targets minimum 44px
- [ ] No horizontal overflow
- [ ] List view auto-selected on mobile
- [ ] Voice button accessible on mobile

---

### Task 5.5: Add E2E Tests

**Description:** Create Playwright tests for the complete Clarity Canvas flow
**Size:** Medium
**Priority:** High
**Dependencies:** All features complete
**Can run parallel with:** Task 5.4

**Technical Requirements:**

Create `e2e/clarity-canvas.spec.ts` with tests for:
- Full flow with text input
- Voice recording flow (with permission grant)
- Profile persistence across sessions
- Interview completion and score animation

See spec Testing Strategy section for detailed test cases.

**Acceptance Criteria:**
- [ ] Full text flow test passes
- [ ] Voice flow test passes
- [ ] Persistence test passes
- [ ] All data-testid attributes present
- [ ] Tests run in CI pipeline

---

### Task 5.6: Deploy to Railway and Verify

**Description:** Add environment variables, deploy, and verify production functionality
**Size:** Small
**Priority:** Critical
**Dependencies:** All tasks complete
**Can run parallel with:** None

**Technical Requirements:**
- Add DATABASE_URL to Railway
- Add OPENAI_API_KEY to Railway
- Run Prisma migrations on production
- Verify health check passes
- Test full flow in production

**Acceptance Criteria:**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health check passes
- [ ] Full flow works in production
- [ ] No console errors
- [ ] Performance meets targets (< 5s transcription, < 500ms profile load)

---

## Summary

### Task Counts by Phase

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| Phase 1: Foundation | 6 | Critical | 8-12 |
| Phase 2: Voice & Extraction | 6 | High | 10-14 |
| Phase 3: Profile Visualization | 3 | High | 8-12 |
| Phase 4: Interview Flow | 3 | High | 8-12 |
| Phase 5: Polish & Deploy | 6 | High | 6-10 |
| **Total** | **24** | | **40-60** |

### Critical Path

1. Task 1.1 → 1.2 → 1.3 → 1.4 (Database foundation)
2. Task 2.3 → 2.4 (AI extraction)
3. Task 3.1/3.2 → 3.3 (Visualization)
4. Task 4.1/4.2 → 4.3 (Interview)
5. Task 5.1 → 5.2 → 5.6 (Integration & Deploy)

### Parallel Execution Opportunities

- Tasks 1.5, 1.6 can run parallel with 1.3, 1.4
- Tasks 2.1, 2.2, 2.3 can run in parallel
- Tasks 3.1, 3.2 can run in parallel
- Tasks 4.1, 4.2 can run in parallel
- Tasks 5.1, 5.2, 5.3 can run in parallel
- Tasks 5.4, 5.5 can run in parallel
