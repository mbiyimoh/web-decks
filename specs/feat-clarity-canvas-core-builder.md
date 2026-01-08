# Clarity Canvas: Core Builder Experience

## Status
**Draft** — Ready for validation

## Authors
- Claude Code
- Date: 2025-01-04

## Overview

Clarity Canvas is a multi-modal context extraction system that builds rich user profiles through voice/text brain dumps and interactive questionnaires. This specification covers **Release 1: Core Builder Experience** — the foundational profile-building flow that captures who users are, what they do, and what they're trying to accomplish.

The system enables users to:
1. Record a voice "brain dump" (or type equivalent) sharing their context
2. See an initial profile visualization with completeness scores
3. Complete 8 interactive questions to sharpen their profile
4. View an enriched profile with animated score improvements

This profile becomes the foundational "context artifact" for 33 Strategies, designed to eventually follow users across all products and services.

## Background/Problem Statement

### The Core Problem
AI tools provide generic output because they lack rich context about the user. Every AI interaction starts from zero — users must repeatedly explain who they are, what they do, and what they're trying to accomplish.

### Why This Matters
- **Poor AI output quality**: Generic responses that don't account for user's role, constraints, or goals
- **Repetitive context-setting**: Users waste time re-explaining themselves in every interaction
- **Lost institutional knowledge**: Valuable context shared in one session isn't available in others
- **No progressive learning**: AI doesn't get "smarter" about a user over time

### The Solution
Clarity Canvas systematically captures user context through multiple modalities (voice, structured questions, research) and stores it in a rich profile that:
- Persists across sessions
- Tracks confidence levels
- Maintains source attribution
- Can be shared across 33 Strategies products (future)

### Core Insight
**The quality of AI output depends on the quality of context input.** Clarity Canvas solves the context input problem.

## Goals

### Release 1 Goals
- [ ] Enable voice-first context capture with text fallback
- [ ] Extract structured profile data from unstructured brain dumps
- [ ] Display profile with dual visualization modes (orbital/list)
- [ ] Complete 8-question interview flow with confidence tracking
- [ ] Show animated score improvements after interview
- [ ] Persist profiles to database tied to authenticated users
- [ ] Support team members, clients, and allowlisted potential clients

### Success Metrics
- Users can complete the full flow in under 5 minutes
- Profile scores increase meaningfully after interview (target: +25-35%)
- Voice input captures significantly more context than text (qualitative)
- Profiles persist and are retrievable across sessions

## Non-Goals

### Explicitly Out of Scope for Release 1
- Research Accelerant (web research auto-enrichment) — Release 2
- Deep Exploration (4-level drill-down interface) — Release 3
- Cross-product integration (Better Contacts, DocShare) — Future
- Real-time collaboration on profiles
- Profile versioning/history beyond basic timestamps
- Export to PDF/external formats
- Mobile native apps (responsive web only)
- Public API for external integrations

## Technical Dependencies

### New Dependencies (to install)

| Package | Version | Purpose |
|---------|---------|---------|
| `@prisma/client` | ^5.x | Database ORM |
| `prisma` | ^5.x (dev) | Schema management, migrations |
| `ai` | ^3.x | Vercel AI SDK for structured outputs |
| `zod` | ^3.x | Schema validation for AI extraction |
| `openai` | ^4.x | OpenAI API client (Whisper + GPT) |
| `react-speech-recognition` | ^3.x | Browser speech capture |

### Existing Dependencies (already in use)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^14.2.35 | Framework |
| `next-auth` | ^5.0.0-beta.30 | Authentication |
| `framer-motion` | ^11.0.0 | Animations |
| `react` | ^18.2.0 | UI framework |
| `tailwindcss` | ^3.4.0 | Styling |

### External Services

| Service | Purpose | Environment Variable |
|---------|---------|---------------------|
| Supabase PostgreSQL | Database | `DATABASE_URL` |
| OpenAI API | Whisper transcription + GPT extraction | `OPENAI_API_KEY` |

### Documentation Links
- [Vercel AI SDK - generateObject](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data)
- [Prisma with Next.js](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition)

## Detailed Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLARITY CANVAS FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Welcome    │───▶│  Brain Dump  │───▶│  Recording   │───▶│  Processing  │
│   Screen     │    │    Screen    │    │    Screen    │    │    Screen    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Initial    │───▶│  Interview   │───▶│  Enriched    │
│   Profile    │    │  (8 Q's)     │    │   Profile    │
└──────────────┘    └──────────────┘    └──────────────┘

Backend Flow:
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  Voice/Text ──▶ Whisper ──▶ GPT-4o-mini ──▶ Field Router ──▶ Prisma DB   │
│    Input       (transcribe) (extraction)   (mapping)       (persist)     │
│                                                                           │
│  Question ──▶ Field Mapping ──▶ Score Calc ──▶ Prisma DB                 │
│  Response     (q→fields)       (rollup)       (update)                   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

### Profile Structure (Seed Data)

The profile has a fixed hierarchical structure with 6 sections:

```typescript
// lib/clarity-canvas/profile-structure.ts

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
```

### API Routes

```
app/api/clarity-canvas/
├── profile/
│   └── route.ts           # GET: fetch user's profile, POST: create profile
├── brain-dump/
│   └── route.ts           # POST: process voice/text input
├── question-response/
│   └── route.ts           # POST: save interview response
└── transcribe/
    └── route.ts           # POST: audio → text via Whisper
```

#### POST /api/clarity-canvas/profile

Creates a new profile for the authenticated user (or returns existing).

```typescript
// Request: (none - uses session user)

// Response:
{
  profile: ClarityProfile,
  isNew: boolean
}
```

#### GET /api/clarity-canvas/profile

Returns the authenticated user's profile with all sections, subsections, and fields.

```typescript
// Response:
{
  profile: ClarityProfile & {
    sections: (ProfileSection & {
      subsections: (ProfileSubsection & {
        fields: ProfileField[]
      })[]
    })[]
  },
  scores: {
    overall: number,
    sections: Record<string, number>
  }
}
```

#### POST /api/clarity-canvas/transcribe

Transcribes audio using OpenAI Whisper.

```typescript
// Request:
{
  audio: string  // base64 encoded audio blob
}

// Response:
{
  transcript: string,
  duration: number
}
```

#### POST /api/clarity-canvas/brain-dump

Processes brain dump input (transcript or text), extracts profile fields.

```typescript
// Request:
{
  inputType: 'voice' | 'text',
  content: string,  // transcript or raw text
  duration?: number  // seconds, for voice
}

// Response:
{
  extractedChunks: Array<{
    content: string,
    targetSection: string,
    targetSubsection: string,
    targetField: string,
    summary: string,
    confidence: number
  }>,
  updatedProfile: ClarityProfile,
  scores: {
    overall: number,
    sections: Record<string, number>
  }
}
```

#### POST /api/clarity-canvas/question-response

Saves an interview question response and updates profile.

```typescript
// Request:
{
  questionId: string,
  response: {
    value: string | string[] | number,
    isUnsure: boolean,
    confidence: number,
    additionalContext?: string,
    contextSource?: 'voice' | 'text'
  }
}

// Response:
{
  fieldsUpdated: Array<{
    sectionKey: string,
    fieldKey: string,
    previousScore: number,
    newScore: number
  }>,
  scores: {
    overall: number,
    sections: Record<string, number>
  }
}
```

### AI Extraction Schema

```typescript
// lib/clarity-canvas/extraction-schema.ts

import { z } from 'zod';

export const extractionChunkSchema = z.object({
  content: z.string().describe('The extracted content verbatim'),
  targetSection: z.enum(['individual', 'role', 'organization', 'goals', 'network', 'projects']),
  targetSubsection: z.string().describe('The subsection key this content belongs to'),
  targetField: z.string().describe('The specific field key this content populates'),
  summary: z.string().max(100).describe('A brief summary suitable for display'),
  confidence: z.number().min(0).max(1).describe('Extraction confidence 0-1'),
  insights: z.array(z.string()).optional().describe('Key insights extracted')
});

export const brainDumpExtractionSchema = z.object({
  chunks: z.array(extractionChunkSchema),
  overallThemes: z.array(z.string()).describe('High-level themes identified'),
  suggestedFollowUps: z.array(z.string()).optional()
});
```

### Extraction System Prompt

```typescript
// lib/clarity-canvas/prompts.ts

export const BRAIN_DUMP_EXTRACTION_PROMPT = `You are an expert at extracting structured profile information from unstructured speech transcripts.

Given a transcript from someone describing themselves, their work, and their goals, extract relevant information into the following profile structure:

SECTIONS:
- individual: Who they are (background, thinking style, working style, values)
- role: What they do (responsibilities, scope, constraints)
- organization: Where they work (company info, product, market, financials)
- goals: What they want (immediate, medium-term, success metrics, strategy)
- network: Who they work with (stakeholders, team, support network)
- projects: What they're building (active, upcoming, completed)

For each piece of information you extract:
1. Identify the most specific field it belongs to
2. Extract the content verbatim when possible
3. Generate a concise summary (max 100 chars)
4. Rate your confidence (0-1) in the extraction
5. Note any key insights

Be thorough but precise. Only extract information that is explicitly stated or strongly implied.
Do not fabricate or assume information not present in the transcript.`;
```

### Question-to-Field Mapping

```typescript
// lib/clarity-canvas/question-mapping.ts

export const QUESTION_FIELD_MAPPING: Record<string, {
  targetSection: string;
  targetFields: string[];
  mappingLogic: (response: QuestionResponse) => Record<string, string>;
}> = {
  q1: { // Success vision (retention vs growth)
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
  q2: { // Problem approach
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
  q3: { // Runway
    targetSection: 'organization',
    targetFields: ['runway', 'funding_status'],
    mappingLogic: (r) => ({
      runway: `${r.value} months of runway`,
      funding_status: r.value <= 6 ? 'Tight runway - fundraising likely needed soon'
        : r.value <= 12 ? 'Moderate runway'
        : 'Comfortable runway - 12+ months'
    })
  },
  q4: { // Constraints
    targetSection: 'role',
    targetFields: ['time_constraints', 'resource_constraints', 'organizational_constraints'],
    mappingLogic: (r) => {
      const constraints = r.value as string[];
      return {
        time_constraints: constraints.includes('time') ? 'Time is a major constraint' : '',
        resource_constraints: constraints.filter(c => ['money', 'team', 'tech'].includes(c))
          .map(c => ({ money: 'Capital', team: 'Team/talent', tech: 'Technical capabilities' }[c]))
          .join(', ') || '',
        organizational_constraints: constraints.filter(c => ['clarity', 'market'].includes(c))
          .map(c => ({ clarity: 'Strategic clarity', market: 'Market access' }[c]))
          .join(', ') || ''
      };
    }
  },
  q5: { // Role need (visionary vs operator)
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
  q6: { // Validation level
    targetSection: 'goals',
    targetFields: ['validation_level'],
    mappingLogic: (r) => ({
      validation_level: ['Pure assumption - untested hypothesis',
        'Some signals - early indicators but not conclusive',
        'Strong evidence - growing confidence from data',
        'Validated - proven with solid data'][r.value as number]
    })
  },
  q7: { // 12-month outcome
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
  q8: { // Help needed
    targetSection: 'network',
    targetFields: ['help_needed'],
    mappingLogic: (r) => ({
      help_needed: `Most valuable help areas: ${(r.value as string[]).map(v => ({
        technical: 'Technical expertise',
        fundraising: 'Fundraising intros',
        strategy: 'Strategic thinking partner',
        design: 'Design/UX help',
        hiring: 'Hiring/recruiting',
        customers: 'Customer intros'
      }[v])).join(', ')}`
    })
  }
};
```

### Score Calculation

```typescript
// lib/clarity-canvas/scoring.ts

export function calculateFieldScore(field: ProfileField): number {
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

export function calculateSubsectionScore(subsection: ProfileSubsection & { fields: ProfileField[] }): number {
  if (subsection.fields.length === 0) return 0;

  const fieldScores = subsection.fields.map(f => calculateFieldScore(f));
  return Math.round(fieldScores.reduce((a, b) => a + b, 0) / fieldScores.length);
}

export function calculateSectionScore(section: ProfileSection & {
  subsections: (ProfileSubsection & { fields: ProfileField[] })[]
}): number {
  if (section.subsections.length === 0) return 0;

  const subsectionScores = section.subsections.map(s => calculateSubsectionScore(s));
  return Math.round(subsectionScores.reduce((a, b) => a + b, 0) / subsectionScores.length);
}

export function calculateOverallScore(sections: (ProfileSection & {
  subsections: (ProfileSubsection & { fields: ProfileField[] })[]
})[]): number {
  if (sections.length === 0) return 0;

  const sectionScores = sections.map(s => calculateSectionScore(s));
  return Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length);
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#D4A84B'; // Gold
  if (score >= 75) return '#4ADE80'; // Green
  if (score >= 50) return '#FBBF24'; // Yellow
  if (score >= 25) return '#FB923C'; // Orange
  return '#EF4444'; // Red
}
```

### File Organization

```
app/
├── clarity-canvas/
│   ├── page.tsx                    # Main entry (redirects to welcome or profile)
│   ├── layout.tsx                  # Shared layout with auth check
│   ├── welcome/
│   │   └── page.tsx                # Welcome screen
│   ├── brain-dump/
│   │   └── page.tsx                # Brain dump flow (cues → recording → processing)
│   ├── profile/
│   │   └── page.tsx                # Profile visualization
│   ├── interview/
│   │   └── page.tsx                # 8-question interview flow
│   └── components/
│       ├── VoiceRecorder.tsx       # Voice capture component
│       ├── WaveformVisualization.tsx
│       ├── ProfileVisualization.tsx
│       ├── OrbitalView.tsx
│       ├── ListView.tsx
│       ├── ViewToggle.tsx
│       ├── QuestionMetaWrapper.tsx
│       ├── ThisOrThatQuestion.tsx
│       ├── SliderQuestion.tsx
│       ├── MultiSelectQuestion.tsx
│       ├── ScaleQuestion.tsx
│       ├── ConfidenceSlider.tsx
│       ├── NotSureCheckbox.tsx
│       └── AdditionalContextInput.tsx
│
├── api/clarity-canvas/
│   ├── profile/route.ts
│   ├── brain-dump/route.ts
│   ├── question-response/route.ts
│   └── transcribe/route.ts
│
lib/
├── clarity-canvas/
│   ├── profile-structure.ts        # Section/subsection/field definitions
│   ├── extraction-schema.ts        # Zod schemas for AI extraction
│   ├── question-mapping.ts         # Question → field mapping
│   ├── scoring.ts                  # Score calculation logic
│   ├── prompts.ts                  # AI system prompts
│   └── types.ts                    # TypeScript types
│
prisma/
├── schema.prisma                   # Database schema (add Clarity models)
└── seed.ts                         # Seed profile structure

components/clarity-canvas/
└── (shared UI components if needed)
```

## User Experience

### Flow Summary

1. **Welcome** (2 seconds)
   - Brand moment with "33" logo
   - "Build your AI context profile in minutes"
   - CTA: "Let's Begin"

2. **Brain Dump Setup** (10 seconds)
   - 6 cue questions displayed as prompts
   - Large mic button with pulsing animation
   - Copy: "People share way more information when braindumping out loud vs. trying to write things"
   - Secondary: "Prefer to type?" link

3. **Recording** (30-60 seconds)
   - Waveform visualization
   - Timer with 30-second minimum
   - "Done" button enables at 30s

4. **Processing** (4 seconds)
   - Three-step animation: Transcribing → Extracting → Building
   - Progress indicator

5. **Initial Profile** (review)
   - Orbital or list view (toggle)
   - Low scores (15-32% range)
   - Copy: "Nice. We have a solid foundation. Now let's sharpen your vision."
   - CTA: "Let's go deeper"

6. **Interview** (3-4 minutes)
   - 8 questions, each with:
     - Question type (this-or-that, slider, multi-select, scale)
     - "I'm not sure" checkbox
     - Confidence slider
     - Optional context input
   - Progress: "3/8 • Goals"

7. **Enriched Profile** (celebration)
   - 1.5s: Show initial profile
   - Animation: Scores increase to new values
   - Banner: "Foundation score increased by +28%"
   - Copy: "Looking sharper, [Name] ✨"
   - CTA: "Continue to Research" (disabled for Release 1)

### Mobile Considerations

- List view default on mobile (< 768px)
- Full-width question cards
- Bottom-sheet for additional context input
- Larger touch targets for controls
- Voice button prominently centered

### Accessibility

- All interactive elements keyboard navigable
- ARIA labels on visualization elements
- Reduced motion preference respected
- Screen reader announcements for score changes
- Sufficient color contrast (WCAG AA)

## Testing Strategy

### Unit Tests

```typescript
// tests/clarity-canvas/scoring.test.ts

describe('Score Calculation', () => {
  /**
   * Purpose: Verify field scores are calculated correctly based on content,
   * sources, and confidence. This ensures the gamification feedback loop
   * accurately reflects profile completeness.
   */
  describe('calculateFieldScore', () => {
    it('returns 0 for empty fields', () => {
      const field = createMockField({ summary: null, fullContext: null });
      expect(calculateFieldScore(field)).toBe(0);
    });

    it('increases score with content length', () => {
      const shortField = createMockField({ fullContext: 'Short' });
      const longField = createMockField({ fullContext: 'A'.repeat(400) });
      expect(calculateFieldScore(longField)).toBeGreaterThan(calculateFieldScore(shortField));
    });

    it('applies penalty when flaggedForValidation is true', () => {
      const normalField = createMockField({ fullContext: 'Content', flaggedForValidation: false });
      const flaggedField = createMockField({ fullContext: 'Content', flaggedForValidation: true });
      expect(calculateFieldScore(flaggedField)).toBeLessThan(calculateFieldScore(normalField));
    });

    it('factors in confidence level', () => {
      const lowConfidence = createMockField({ fullContext: 'Content', confidence: 0.2 });
      const highConfidence = createMockField({ fullContext: 'Content', confidence: 1.0 });
      expect(calculateFieldScore(highConfidence)).toBeGreaterThan(calculateFieldScore(lowConfidence));
    });
  });
});

// tests/clarity-canvas/extraction.test.ts

describe('Brain Dump Extraction', () => {
  /**
   * Purpose: Verify AI extraction correctly maps unstructured content to
   * profile fields. These tests ensure the extraction schema works and
   * the field router correctly assigns content.
   */
  describe('extraction schema validation', () => {
    it('validates correct extraction output', () => {
      const validExtraction = {
        chunks: [{
          content: 'I am a product manager',
          targetSection: 'role',
          targetSubsection: 'responsibilities',
          targetField: 'title',
          summary: 'Product manager',
          confidence: 0.9
        }],
        overallThemes: ['product management']
      };
      expect(() => brainDumpExtractionSchema.parse(validExtraction)).not.toThrow();
    });

    it('rejects invalid section targets', () => {
      const invalidExtraction = {
        chunks: [{
          content: 'test',
          targetSection: 'invalid_section', // Not in enum
          targetSubsection: 'test',
          targetField: 'test',
          summary: 'test',
          confidence: 0.5
        }],
        overallThemes: []
      };
      expect(() => brainDumpExtractionSchema.parse(invalidExtraction)).toThrow();
    });
  });
});

// tests/clarity-canvas/question-mapping.test.ts

describe('Question to Field Mapping', () => {
  /**
   * Purpose: Verify interview responses correctly map to profile fields.
   * This ensures the 8-question flow actually populates the profile.
   */
  describe('q1 mapping (success vision)', () => {
    it('maps retention choice to goals fields', () => {
      const response = { value: 'a', isUnsure: false, confidence: 0.8 };
      const mapped = QUESTION_FIELD_MAPPING.q1.mappingLogic(response);

      expect(mapped.north_star).toContain('Retention');
      expect(QUESTION_FIELD_MAPPING.q1.targetSection).toBe('goals');
    });

    it('maps growth choice to goals fields', () => {
      const response = { value: 'b', isUnsure: false, confidence: 0.8 };
      const mapped = QUESTION_FIELD_MAPPING.q1.mappingLogic(response);

      expect(mapped.north_star).toContain('Growth');
    });
  });

  describe('q4 mapping (constraints - multi-select)', () => {
    it('handles multiple constraint selections', () => {
      const response = { value: ['time', 'money', 'clarity'], isUnsure: false, confidence: 0.7 };
      const mapped = QUESTION_FIELD_MAPPING.q4.mappingLogic(response);

      expect(mapped.time_constraints).toContain('Time');
      expect(mapped.resource_constraints).toContain('Capital');
      expect(mapped.organizational_constraints).toContain('Strategic clarity');
    });

    it('handles empty selection', () => {
      const response = { value: [], isUnsure: false, confidence: 0.5 };
      const mapped = QUESTION_FIELD_MAPPING.q4.mappingLogic(response);

      expect(mapped.time_constraints).toBe('');
    });
  });
});
```

### Integration Tests

```typescript
// tests/clarity-canvas/api.test.ts

describe('Clarity Canvas API', () => {
  /**
   * Purpose: Verify API endpoints correctly handle authentication,
   * database operations, and response formatting.
   */
  describe('POST /api/clarity-canvas/profile', () => {
    it('creates new profile for authenticated user', async () => {
      const session = createMockSession({ user: { id: 'user_123' } });
      const response = await POST(createMockRequest(), session);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.profile.userId).toBe('user_123');
      expect(data.isNew).toBe(true);
    });

    it('returns 401 for unauthenticated requests', async () => {
      const response = await POST(createMockRequest(), null);
      expect(response.status).toBe(401);
    });

    it('returns existing profile if one exists', async () => {
      // Create initial profile
      await createProfile('user_123');

      const session = createMockSession({ user: { id: 'user_123' } });
      const response = await POST(createMockRequest(), session);

      const data = await response.json();
      expect(data.isNew).toBe(false);
    });
  });

  describe('POST /api/clarity-canvas/brain-dump', () => {
    it('extracts fields from transcript and updates profile', async () => {
      const session = createMockSession({ user: { id: 'user_123' } });
      await createProfile('user_123');

      const request = createMockRequest({
        inputType: 'text',
        content: 'I am a product manager at a startup called PLYA'
      });

      const response = await POST(request, session);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.extractedChunks.length).toBeGreaterThan(0);
      expect(data.scores.overall).toBeGreaterThan(0);
    });
  });
});
```

### E2E Tests

```typescript
// e2e/clarity-canvas.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Clarity Canvas Flow', () => {
  /**
   * Purpose: Verify the complete user journey from welcome to enriched profile
   * works end-to-end with actual browser interactions.
   */

  test.beforeEach(async ({ page }) => {
    // Login as test user
    await loginAsTestUser(page);
  });

  test('completes full flow with text input', async ({ page }) => {
    await page.goto('/clarity-canvas');

    // Welcome screen
    await expect(page.getByText('Clarity Canvas')).toBeVisible();
    await page.getByRole('button', { name: "Let's Begin" }).click();

    // Brain dump - use text fallback
    await page.getByText('Prefer to type?').click();
    await page.getByRole('textbox').fill(
      'I am a product manager at a startup. We are building an AI fitness app. ' +
      'My biggest challenge is finding product-market fit.'
    );
    await page.getByRole('button', { name: 'Continue' }).click();

    // Processing
    await expect(page.getByText('Building your profile')).toBeVisible();
    await page.waitForURL('**/profile');

    // Initial profile
    await expect(page.getByText('Foundation')).toBeVisible();
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
    await page.getByRole('button', { name: "Let's go deeper" }).click();

    // Interview (answer 8 questions)
    for (let i = 0; i < 8; i++) {
      await expect(page.getByText(`${i + 1}/8`)).toBeVisible();

      // Click first option for this-or-that/scale, or first checkbox for multi-select
      const firstOption = page.locator('[data-testid="question-option"]').first();
      await firstOption.click();

      await page.getByRole('button', { name: i < 7 ? 'Continue' : 'See Results' }).click();
    }

    // Enriched profile
    await expect(page.getByText('score increased')).toBeVisible({ timeout: 5000 });
  });

  test('voice recording flow works', async ({ page }) => {
    // Grant microphone permission
    await page.context().grantPermissions(['microphone']);

    await page.goto('/clarity-canvas/brain-dump');

    // Start recording
    await page.getByRole('button', { name: 'Record' }).click();
    await expect(page.getByText('Recording')).toBeVisible();

    // Wait for minimum recording time
    await page.waitForTimeout(31000);

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('Transcribing')).toBeVisible();
  });

  test('profile persists across sessions', async ({ page }) => {
    // Complete flow once
    await completeFullFlow(page);
    const initialScore = await page.locator('[data-testid="overall-score"]').textContent();

    // Logout and login again
    await page.goto('/api/auth/signout');
    await loginAsTestUser(page);

    // Check profile still exists
    await page.goto('/clarity-canvas/profile');
    const persistedScore = await page.locator('[data-testid="overall-score"]').textContent();

    expect(persistedScore).toBe(initialScore);
  });
});
```

### Mocking Strategy

```typescript
// tests/mocks/openai.ts

export const mockWhisperTranscription = {
  text: 'I am a product manager at PLYA, building an AI fitness coaching app.'
};

export const mockGPTExtraction = {
  chunks: [
    {
      content: 'I am a product manager',
      targetSection: 'role',
      targetSubsection: 'responsibilities',
      targetField: 'title',
      summary: 'Product manager',
      confidence: 0.95
    },
    {
      content: 'at PLYA',
      targetSection: 'organization',
      targetSubsection: 'fundamentals',
      targetField: 'company_name',
      summary: 'PLYA',
      confidence: 0.98
    },
    {
      content: 'building an AI fitness coaching app',
      targetSection: 'organization',
      targetSubsection: 'product',
      targetField: 'core_product',
      summary: 'AI fitness coaching app',
      confidence: 0.92
    }
  ],
  overallThemes: ['product management', 'AI', 'fitness', 'startup']
};

// Mock OpenAI client for tests
export function createMockOpenAI() {
  return {
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue(mockWhisperTranscription)
      }
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(mockGPTExtraction) } }]
        })
      }
    }
  };
}
```

## Performance Considerations

### API Response Times

| Endpoint | Target | Mitigation |
|----------|--------|------------|
| Transcription (Whisper) | < 5s | Stream audio, show progress |
| Extraction (GPT-4o-mini) | < 5s | Use streaming, show processing steps |
| Profile load | < 500ms | Database indexes, eager loading |
| Question save | < 300ms | Optimistic UI updates |

### Database Optimization

- Indexes on `userId`, `profileId`, `sectionId`, `subsectionId`
- Eager load profile with nested relations in single query
- Use `select` to limit returned fields when not needed

### Frontend Optimization

- Code split interview questions (dynamic imports)
- Preload next question while answering current
- Skeleton loaders during API calls
- Optimistic score updates before server confirmation

### Audio Handling

- Compress audio before upload (opus codec, 16kHz)
- Maximum recording length: 120 seconds
- Chunked upload for longer recordings
- Client-side validation before upload

## Security Considerations

### Authentication

- All endpoints require NextAuth session
- Profile ownership enforced: `userId` must match `session.user.id`
- No cross-user profile access

### Data Privacy

- Voice recordings not stored after transcription
- Transcripts stored only as extracted fields
- No PII exposed in API responses beyond user's own data
- HTTPS only in production

### API Security

- Rate limiting: 10 brain dumps per hour per user
- Input validation with Zod schemas
- Sanitize all AI-generated content before display
- No direct SQL queries (Prisma parameterized)

### OpenAI API

- API key stored in environment variable
- Never exposed to client
- Usage tracking for cost monitoring

## Documentation

### Required Documentation Updates

1. **CLAUDE.md** — Add Clarity Canvas section:
   - Route structure
   - Database schema overview
   - Environment variables

2. **README.md** — Add feature overview

3. **Developer Guide** — Create `docs/developer-guides/clarity-canvas.md`:
   - Architecture diagram
   - API reference
   - Component documentation
   - Testing guide

### Environment Variables

Add to `.env.example`:

```env
# Clarity Canvas Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# OpenAI API for transcription and extraction
OPENAI_API_KEY="sk-..."
```

## Implementation Phases

### Phase 1.1: Foundation Infrastructure
- Set up Prisma with Supabase PostgreSQL connection
- Create database schema (all models)
- Run migrations
- Create profile seed script
- Wire NextAuth user.id to profile ownership
- Extend email allowlist for client access
- Create GET/POST /api/clarity-canvas/profile

### Phase 1.2: Voice Capture & Extraction
- Install react-speech-recognition, openai, ai, zod
- Build VoiceRecorder component with MediaRecorder
- Create WaveformVisualization component
- Add "why voice is recommended" UX copy
- Implement text fallback input
- Create POST /api/clarity-canvas/transcribe (Whisper)
- Create extraction schema and prompt
- Build field router (chunks → profile mapping)
- Create POST /api/clarity-canvas/brain-dump
- Wire brain dump flow pages

### Phase 1.3: Profile Visualization
- Port OrbitalView from prototype
- Port ListView from prototype
- Create ViewToggle component
- Implement score calculation engine
- Build score color system
- Add breathing/pulse animations (Framer Motion)
- Create "weakest section" nudge UI
- Wire profile page with real data

### Phase 1.4: Interview Flow
- Build QuestionMetaWrapper component
- Create ThisOrThatQuestion component
- Create SliderQuestion component
- Create MultiSelectQuestion component
- Create ScaleQuestion component
- Build ConfidenceSlider component
- Build NotSureCheckbox component
- Implement question→field mapping logic
- Create POST /api/clarity-canvas/question-response
- Build score animation sequence
- Wire interview flow pages

### Phase 1.5: Polish & Deploy
- Mobile responsive adjustments
- Loading states and error handling
- Add data-testid attributes for E2E
- Session integration (profile accessible across pages)
- Add environment variables to Railway
- Deploy and verify
- QA and bug fixes

## Open Questions

### Resolved

1. **User access model** → All user types from day one via email allowlist
2. **Profile ownership** → 1:1 with NextAuth user
3. **Voice vs. text** → Both available, voice recommended with explanation
4. **Data retention** → Indefinite (profile grows over time)
5. **Score visibility** → Prominent gamification with nudges

### Unresolved

1. **Profile editing**: After initial creation, how do users edit individual fields?
   - *Recommendation: Defer to Release 3 (Deep Exploration)*

2. **Re-doing brain dump**: Can users record additional brain dumps to enrich profile?
   - *Recommendation: Yes, additive merging. Implement in 1.2 or defer.*

3. **Question skip**: Can users skip interview questions entirely?
   - *Recommendation: No skip, but "I'm not sure" checkbox serves similar purpose*

4. **Profile reset**: Can users start over completely?
   - *Recommendation: Defer, low priority. Add manual database reset for support.*

## References

### Project Documentation
- [Ideation Document](../docs/ideation/clarity-canvas-integration.md)
- [Handoff Package](../docs/clarity-canvas/clarity-canvas-handoff.md)
- [Research-to-Recommendations](../docs/clarity-canvas/research-to-recommendations.md)
- [Complete Prototype](../docs/clarity-canvas/clarity-canvas-complete.jsx)

### External Documentation
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Prisma](https://www.prisma.io/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Framer Motion](https://www.framer.com/motion/)
- [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition)

### Design Patterns
- [33 Strategies Design System](../.claude/skills/33-strategies-frontend-design.md)
- [Learning Module Components](../docs/developer-guides/learning-module-components.md)

---

*Specification Version: 1.0*
*Last Updated: 2025-01-04*
*Status: Ready for validation*
