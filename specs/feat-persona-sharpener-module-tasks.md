# Task Breakdown: Persona Sharpener Module (V1)

Generated: 2025-01-04
Source: specs/feat-persona-sharpener-module.md

## Overview

Build the Persona Sharpener as the first enrichment module within the Clarity Canvas ecosystem. This module provides a structured interview experience (19 questions across 7 categories) that helps founders build detailed customer personas with confidence tracking and "I'm not sure" flagging for later validation.

**Total Tasks:** 15
**Phases:** 5
**Estimated Total Effort:** 20-26 hours

---

## Phase 1: Foundation (Database + Types)

### Task 1.1: Add Prisma Schema Models
**Description**: Add ClarityModule, Persona, Response, and SharpenerSession models to Prisma schema
**Size**: Medium
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (blocking for all other tasks)

**Technical Requirements**:
Add the following models to `prisma/schema.prisma`:

```prisma
// ============================================================================
// CLARITY MODULES - Generic module infrastructure
// ============================================================================

model ClarityModule {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  icon        String   // Emoji or icon identifier
  estimatedMinutes Int
  enrichesSections String[] // Which profile sections this module enriches
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================================================
// PERSONA SHARPENER - Module-specific models
// ============================================================================

model Persona {
  id          String   @id @default(cuid())
  profileId   String   // Links to ClarityProfile
  profile     ClarityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  name        String?  // Auto-generated archetype name
  isPrimary   Boolean  @default(true)

  // Structured fields (JSON for flexibility)
  demographics Json?   // { ageRange, lifestyle, techSavviness }
  jobs        Json?    // { functional, emotional, social }
  goals       Json?    // { priorities, successDefinition }
  frustrations Json?   // { pastFailures, dealbreakers, currentWorkaround }
  behaviors   Json?    // { decisionStyle, usageTime, timeAvailable, discoveryChannels, influences }
  antiPatterns String[]
  quote       String?

  // Computed scores (updated after each response)
  clarityOverall     Int @default(0)
  clarityIdentity    Int @default(0)
  clarityGoals       Int @default(0)
  clarityFrustrations Int @default(0)
  clarityEmotional   Int @default(0)
  clarityBehaviors   Int @default(0)

  // Tracking
  totalAssumptions   Int @default(0)
  avgConfidence      Int @default(0)

  responses   Response[]
  sessions    SharpenerSession[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([profileId])
}

model Response {
  id          String   @id @default(cuid())
  personaId   String
  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  sessionId   String
  session     SharpenerSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  questionId  String   // e.g., 'age-range', 'lifestyle'
  field       String   // e.g., 'demographics.ageRange'

  // The answer
  value       Json     // Flexible: string, number, string[], object

  // Metadata
  isUnsure    Boolean  @default(false)
  confidence  Int      @default(50) // 0-100
  additionalContext String?
  contextSource String? // 'text' | null (voice deferred)

  // Tagging
  responseType String  // 'assumption'
  respondentId String  // User ID
  respondentRole String // 'founder'
  respondentName String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([personaId])
  @@index([sessionId])
  @@index([questionId])
}

model SharpenerSession {
  id          String   @id @default(cuid())
  personaId   String
  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)

  sessionType String   // 'sharpen'
  status      String   @default("in_progress") // 'in_progress' | 'completed' | 'abandoned'

  // Progress tracking
  lastQuestionIndex Int @default(0)
  questionsAnswered Int @default(0)
  questionsSkipped  Int @default(0)
  questionsUnsure   Int @default(0)

  startedAt   DateTime @default(now())
  completedAt DateTime?

  responses   Response[]

  @@index([personaId])
}
```

Also update ClarityProfile model to add:
```prisma
model ClarityProfile {
  // ... existing fields ...
  personas Persona[]
}
```

**Implementation Steps**:
1. Open `prisma/schema.prisma`
2. Add ClarityModule model after existing models
3. Add Persona model with relation to ClarityProfile
4. Add Response model with relations to Persona and SharpenerSession
5. Add SharpenerSession model with relation to Persona
6. Add `personas Persona[]` to ClarityProfile model
7. Run `npx prisma migrate dev --name add_persona_sharpener_models`
8. Verify migration succeeded

**Acceptance Criteria**:
- [ ] All 4 models added to schema
- [ ] ClarityProfile has personas relation
- [ ] Migration runs successfully
- [ ] `npx prisma generate` completes without errors
- [ ] Cascade deletes configured (deleting profile deletes personas)

---

### Task 1.2: Create TypeScript Type Definitions
**Description**: Create type definitions for Persona Sharpener module
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1 (need Prisma types)
**Can run parallel with**: None

**Technical Requirements**:
Create `lib/clarity-canvas/modules/persona-sharpener/types.ts`:

```typescript
// lib/clarity-canvas/modules/persona-sharpener/types.ts

export type QuestionType =
  | 'this-or-that'
  | 'slider'
  | 'ranking'
  | 'multi-select'
  | 'fill-blank'
  | 'scenario';

export type QuestionCategory =
  | 'identity'
  | 'goals'
  | 'frustrations'
  | 'emotional'
  | 'social'
  | 'behaviors'
  | 'antiPatterns';

export interface QuestionOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface RankedItem {
  id: string;
  label: string;
  rank?: number;
}

export interface BlankConfig {
  id: string;
  placeholder: string;
  suggestions?: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  field: string;
  question: string;
  validationQuestion: string | null;
  options?: QuestionOption[];
  items?: RankedItem[];
  blanks?: BlankConfig[];
  template?: string;
  min?: string;
  max?: string;
  defaultValue?: number;
  maxSelections?: number;
  placeholder?: string;
  helperText?: string;
  instruction?: string;
}

export interface ResponseInput {
  questionId: string;
  value: unknown;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  contextSource?: 'text' | null;
}

export interface PersonaClarity {
  overall: number;
  identity: number;
  goals: number;
  frustrations: number;
  emotional: number;
  behaviors: number;
}

export interface PersonaDemographics {
  ageRange?: string;
  lifestyle?: string;
  techSavviness?: number;
}

export interface PersonaJobs {
  functional?: string;
  emotional?: string;
  social?: string;
}

export interface PersonaGoals {
  priorities?: RankedItem[];
  successDefinition?: Record<string, string>;
}

export interface PersonaFrustrations {
  pastFailures?: string;
  dealbreakers?: string[];
  currentWorkaround?: Record<string, string>;
}

export interface PersonaBehaviors {
  decisionStyle?: string;
  usageTime?: string;
  timeAvailable?: number;
  discoveryChannels?: RankedItem[];
  influences?: string[];
}

export interface PersonaDisplay {
  id: string;
  name: string | null;
  archetype: string;
  summary: string;
  quote: string | null;
  demographics: PersonaDemographics;
  jobs: PersonaJobs;
  goals: PersonaGoals;
  frustrations: PersonaFrustrations;
  behaviors: PersonaBehaviors;
  antiPatterns: string[];
  clarity: PersonaClarity;
  avgConfidence: number;
  unsureCount: number;
}

export interface SharpenerState {
  persona: PersonaDisplay;
  responses: Record<string, ResponseInput>;
  currentQuestionIndex: number;
  sessionId: string;
  isComplete: boolean;
}

// API response types
export interface CreatePersonaResponse {
  persona: PersonaDisplay;
  sessionId: string;
}

export interface SubmitResponsePayload {
  sessionId: string;
  questionId: string;
  value: unknown;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  contextSource?: 'text' | null;
}

export interface SubmitResponseResponse {
  response: {
    id: string;
    questionId: string;
    value: unknown;
  };
  persona: PersonaDisplay;
  clarity: PersonaClarity;
}
```

Also create barrel export `lib/clarity-canvas/modules/persona-sharpener/index.ts`:

```typescript
export * from './types';
export * from './questions';
export * from './scoring';
```

**Acceptance Criteria**:
- [ ] Types file created at correct path
- [ ] All types from spec included
- [ ] Barrel export created
- [ ] No TypeScript errors when importing types

---

### Task 1.3: Create Question Bank
**Description**: Create the 19-question bank with all metadata
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.2 (need Question type)
**Can run parallel with**: None

**Technical Requirements**:
Create `lib/clarity-canvas/modules/persona-sharpener/questions.ts`:

```typescript
import type { Question } from './types';

export const questionBank: Record<string, Question[]> = {
  identity: [
    {
      id: 'age-range',
      type: 'this-or-that',
      category: 'identity',
      field: 'demographics.ageRange',
      question: "Your ideal customer is more likely to be...",
      validationQuestion: "Which age range best describes you?",
      options: [
        { value: 'younger', label: '18-35', sublabel: 'Digital native, mobile-first' },
        { value: 'middle', label: '35-50', sublabel: 'Established career, time-poor' },
        { value: 'older', label: '50+', sublabel: 'More deliberate, values quality' }
      ]
    },
    {
      id: 'lifestyle',
      type: 'this-or-that',
      category: 'identity',
      field: 'demographics.lifestyle',
      question: "Which better describes their lifestyle?",
      validationQuestion: "Which better describes your lifestyle?",
      options: [
        { value: 'busy-professional', label: 'Busy Professional', sublabel: 'Career-focused, optimizes for efficiency' },
        { value: 'balanced-seeker', label: 'Balance Seeker', sublabel: 'Prioritizes work-life harmony' }
      ]
    },
    {
      id: 'tech-savvy',
      type: 'slider',
      category: 'identity',
      field: 'demographics.techSavviness',
      question: "How tech-savvy is your typical customer?",
      validationQuestion: "How tech-savvy would you say you are?",
      min: 'Prefers simplicity',
      max: 'Power user',
      defaultValue: 50
    },
    {
      id: 'decision-style',
      type: 'this-or-that',
      category: 'identity',
      field: 'behaviors.decisionStyle',
      question: "When trying something new, they typically...",
      validationQuestion: "When trying something new, you typically...",
      options: [
        { value: 'researcher', label: 'Research First', sublabel: 'Reads reviews, compares options' },
        { value: 'action-taker', label: 'Jump In', sublabel: 'Figures it out as they go' }
      ]
    }
  ],

  goals: [
    {
      id: 'primary-goal',
      type: 'ranking',
      category: 'goals',
      field: 'goals.priorities',
      question: "Rank what matters most to your customer:",
      validationQuestion: "Rank what matters most to you:",
      items: [
        { id: 'save-time', label: 'Save time' },
        { id: 'save-money', label: 'Save money' },
        { id: 'look-good', label: 'Look/feel good' },
        { id: 'be-healthy', label: 'Be healthier' },
        { id: 'reduce-stress', label: 'Reduce stress' },
        { id: 'achieve-more', label: 'Achieve more' }
      ]
    },
    {
      id: 'success-scenario',
      type: 'fill-blank',
      category: 'goals',
      field: 'goals.successDefinition',
      question: "Complete this from your customer's perspective:",
      validationQuestion: "Complete this from your perspective:",
      template: "I would consider this product a success if it helped me {blank} within {timeframe}.",
      blanks: [
        { id: 'blank', placeholder: "achieve what outcome?" },
        { id: 'timeframe', placeholder: "what timeframe?", suggestions: ['a week', 'a month', '3 months'] }
      ]
    },
    {
      id: 'functional-job',
      type: 'scenario',
      category: 'goals',
      field: 'jobs.functional',
      question: "When your customer uses your product, what's the primary task they're trying to accomplish?",
      validationQuestion: "When you use products like this, what's the primary task you're trying to accomplish?",
      placeholder: "e.g., 'Fit a workout into their lunch break' or 'Find the right gift in under 5 minutes'",
      helperText: "Focus on the functional job — what they literally need to get done"
    }
  ],

  frustrations: [
    {
      id: 'past-failures',
      type: 'scenario',
      category: 'frustrations',
      field: 'frustrations.pastFailures',
      question: "What have they tried before that didn't work? Why did it fail them?",
      validationQuestion: "What have you tried before that didn't work? Why did it fail you?",
      placeholder: "e.g., 'They tried fitness apps but hated logging every meal...'",
      helperText: "Understanding past failures reveals what NOT to do"
    },
    {
      id: 'dealbreakers',
      type: 'multi-select',
      category: 'frustrations',
      field: 'frustrations.dealbreakers',
      question: "Which of these would make them abandon a product like yours?",
      validationQuestion: "Which of these would make you abandon a product like this?",
      options: [
        { value: 'too-complex', label: 'Too complicated to set up' },
        { value: 'too-slow', label: 'Takes too long to see results' },
        { value: 'too-expensive', label: 'Costs too much' },
        { value: 'too-needy', label: 'Requires too much daily effort' },
        { value: 'too-generic', label: 'Feels generic, not personalized' },
        { value: 'bad-support', label: 'Poor customer support' },
        { value: 'privacy', label: 'Privacy/data concerns' },
        { value: 'social-required', label: 'Forces social features' }
      ],
      maxSelections: 3,
      instruction: "Select up to 3"
    },
    {
      id: 'current-workaround',
      type: 'fill-blank',
      category: 'frustrations',
      field: 'frustrations.currentWorkaround',
      question: "How do they currently solve this problem (without your product)?",
      validationQuestion: "How do you currently solve this problem?",
      template: "Right now, they {workaround}, but they hate it because {reason}.",
      blanks: [
        { id: 'workaround', placeholder: "what do they do?" },
        { id: 'reason', placeholder: "why is it frustrating?" }
      ]
    }
  ],

  emotional: [
    {
      id: 'emotional-job',
      type: 'this-or-that',
      category: 'emotional',
      field: 'jobs.emotional',
      question: "When using your product, they primarily want to feel...",
      validationQuestion: "When using products like this, you primarily want to feel...",
      options: [
        { value: 'in-control', label: 'In Control', sublabel: 'Confident, organized, on top of things' },
        { value: 'accomplished', label: 'Accomplished', sublabel: 'Proud, successful, making progress' },
        { value: 'cared-for', label: 'Cared For', sublabel: 'Supported, understood, not alone' },
        { value: 'free', label: 'Free', sublabel: 'Unburdened, relaxed, without worry' }
      ]
    },
    {
      id: 'quote-capture',
      type: 'scenario',
      category: 'emotional',
      field: 'quote',
      question: "In your customer's voice, what would they say is their biggest frustration?",
      validationQuestion: "In your own words, what's your biggest frustration in this area?",
      placeholder: "Write naturally — we're capturing authentic language",
      helperText: "This quote will appear on the persona card"
    },
    {
      id: 'recommendation-trigger',
      type: 'scenario',
      category: 'emotional',
      field: 'emotional.recommendationTrigger',
      question: "What would make them tell a friend about your product?",
      validationQuestion: "What would make you tell a friend about a product like this?",
      placeholder: "e.g., 'If they finally stuck with a routine for more than 2 weeks...'",
      helperText: "This reveals the emotional payoff they're really seeking"
    }
  ],

  social: [
    {
      id: 'social-job',
      type: 'this-or-that',
      category: 'social',
      field: 'jobs.social',
      question: "How do they want to be perceived by others?",
      validationQuestion: "How do you want to be perceived by others in this area?",
      options: [
        { value: 'competent', label: 'Competent', sublabel: 'Has their act together' },
        { value: 'aspirational', label: 'Aspirational', sublabel: 'Someone to look up to' },
        { value: 'relatable', label: 'Relatable', sublabel: 'Down to earth, authentic' },
        { value: 'innovative', label: 'Innovative', sublabel: 'Ahead of the curve' }
      ]
    },
    {
      id: 'influence-sources',
      type: 'multi-select',
      category: 'social',
      field: 'behaviors.influences',
      question: "Who influences their decisions in this area?",
      validationQuestion: "Who influences your decisions in this area?",
      options: [
        { value: 'friends', label: 'Friends & family' },
        { value: 'colleagues', label: 'Colleagues & peers' },
        { value: 'influencers', label: 'Social media influencers' },
        { value: 'experts', label: 'Industry experts' },
        { value: 'reviews', label: 'Online reviews' },
        { value: 'nobody', label: 'Research independently' }
      ],
      maxSelections: 2,
      instruction: "Select top 2"
    }
  ],

  behaviors: [
    {
      id: 'discovery-channel',
      type: 'ranking',
      category: 'behaviors',
      field: 'behaviors.discoveryChannels',
      question: "Where are they most likely to discover products like yours?",
      validationQuestion: "Where are you most likely to discover products like this?",
      items: [
        { id: 'social', label: 'Social media' },
        { id: 'search', label: 'Google search' },
        { id: 'friend', label: 'Friend recommendation' },
        { id: 'content', label: 'Blog/article/podcast' },
        { id: 'app-store', label: 'App store browsing' },
        { id: 'ads', label: 'Paid ads' }
      ]
    },
    {
      id: 'usage-time',
      type: 'this-or-that',
      category: 'behaviors',
      field: 'behaviors.usageTime',
      question: "When would they most likely use your product?",
      validationQuestion: "When would you most likely use a product like this?",
      options: [
        { value: 'morning', label: 'Morning', sublabel: 'Part of their wake-up routine' },
        { value: 'workday', label: 'During Work', sublabel: 'Micro-moments between tasks' },
        { value: 'evening', label: 'Evening', sublabel: 'Wind-down or planning time' },
        { value: 'weekend', label: 'Weekend', sublabel: 'Dedicated personal time' }
      ]
    },
    {
      id: 'time-available',
      type: 'slider',
      category: 'behaviors',
      field: 'behaviors.timeAvailable',
      question: "How much time can they realistically dedicate to this?",
      validationQuestion: "How much time can you realistically dedicate to this?",
      min: '< 5 min/day',
      max: '30+ min/day',
      defaultValue: 30
    }
  ],

  antiPatterns: [
    {
      id: 'not-customer',
      type: 'multi-select',
      category: 'antiPatterns',
      field: 'antiPatterns',
      question: "Who is explicitly NOT your customer?",
      validationQuestion: null,
      options: [
        { value: 'price-sensitive', label: 'People who only care about price' },
        { value: 'experts', label: 'People who already know everything' },
        { value: 'no-problem', label: "People who don't have this problem" },
        { value: 'no-change', label: 'People resistant to change' },
        { value: 'wrong-platform', label: 'People on wrong platforms' },
        { value: 'wrong-stage', label: 'People at wrong life stage' }
      ],
      maxSelections: 3,
      instruction: "Select up to 3"
    }
  ]
};

// Build interleaved question sequence for engagement
export const questionSequence: Question[] = [
  ...questionBank.identity.slice(0, 2),
  ...questionBank.goals.slice(0, 2),
  ...questionBank.frustrations.slice(0, 2),
  ...questionBank.emotional.slice(0, 2),
  ...questionBank.behaviors.slice(0, 2),
  ...questionBank.identity.slice(2),
  ...questionBank.goals.slice(2),
  ...questionBank.frustrations.slice(2),
  ...questionBank.social,
  ...questionBank.behaviors.slice(2),
  ...questionBank.antiPatterns
];

export function getQuestionById(id: string): Question | undefined {
  return questionSequence.find(q => q.id === id);
}

export function getQuestionsByCategory(category: string): Question[] {
  return questionBank[category] || [];
}
```

**Acceptance Criteria**:
- [ ] All 19 questions defined with correct metadata
- [ ] Question sequence interleaved for engagement
- [ ] Helper functions work correctly
- [ ] Types match Question interface

---

### Task 1.4: Create Scoring Utilities
**Description**: Implement clarity and confidence scoring algorithms
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.2, Task 1.3
**Can run parallel with**: None

**Technical Requirements**:
Create `lib/clarity-canvas/modules/persona-sharpener/scoring.ts`:

```typescript
import type { PersonaClarity, PersonaDisplay, ResponseInput, RankedItem } from './types';
import { questionSequence, getQuestionById } from './questions';

const categoryQuestionCounts: Record<string, number> = {
  identity: 4,
  goals: 3,
  frustrations: 3,
  emotional: 3,
  behaviors: 3,
};

export function calculateClarity(responses: Record<string, ResponseInput>): PersonaClarity {
  const scores: PersonaClarity = {
    overall: 0,
    identity: 0,
    goals: 0,
    frustrations: 0,
    emotional: 0,
    behaviors: 0,
  };

  // Count answered (not unsure) questions per category
  Object.values(responses).forEach(response => {
    if (!response.isUnsure && response.value !== undefined) {
      const question = getQuestionById(response.questionId);
      if (!question) return;

      const category = question.category;

      // Map social to emotional, antiPatterns excluded from scoring
      const scoreCategory = category === 'social' ? 'emotional' : category;

      if (scoreCategory !== 'antiPatterns' && scores[scoreCategory as keyof PersonaClarity] !== undefined) {
        const count = categoryQuestionCounts[scoreCategory];
        if (count) {
          (scores as Record<string, number>)[scoreCategory] += (100 / count);
        }
      }
    }
  });

  // Cap at 100
  (Object.keys(scores) as Array<keyof PersonaClarity>).forEach(key => {
    if (key !== 'overall') {
      scores[key] = Math.min(100, Math.round(scores[key]));
    }
  });

  // Overall is average of 5 categories
  scores.overall = Math.round(
    (scores.identity + scores.goals + scores.frustrations +
     scores.emotional + scores.behaviors) / 5
  );

  return scores;
}

export function calculateAvgConfidence(responses: Record<string, ResponseInput>): number {
  const answeredResponses = Object.values(responses).filter(
    r => !r.isUnsure && r.value !== undefined
  );

  if (answeredResponses.length === 0) return 0;

  const totalConfidence = answeredResponses.reduce(
    (sum, r) => sum + r.confidence, 0
  );

  return Math.round(totalConfidence / answeredResponses.length);
}

export function getUnsureCount(responses: Record<string, ResponseInput>): number {
  return Object.values(responses).filter(r => r.isUnsure).length;
}

const archetypes: Record<string, string> = {
  'in-control-busy-professional': 'The Efficient Optimizer',
  'in-control-balanced-seeker': 'The Calm Commander',
  'accomplished-busy-professional': 'The Driven Achiever',
  'accomplished-balanced-seeker': 'The Mindful Achiever',
  'cared-for-busy-professional': 'The Overwhelmed Overcomer',
  'cared-for-balanced-seeker': 'The Supported Striver',
  'free-busy-professional': 'The Escaping Executive',
  'free-balanced-seeker': 'The Peace Seeker',
};

export function generateArchetype(persona: PersonaDisplay): string {
  const emotionalJob = persona.jobs?.emotional || '';
  const lifestyle = persona.demographics?.lifestyle || '';
  const key = `${emotionalJob}-${lifestyle}`;
  return archetypes[key] || 'Your Ideal Customer';
}

export function generateSummary(persona: PersonaDisplay): string {
  const parts: string[] = [];

  if (persona.demographics?.ageRange) {
    const ageDesc: Record<string, string> = {
      'younger': 'Young professional',
      'middle': 'Mid-career professional',
      'older': 'Experienced professional'
    };
    parts.push(ageDesc[persona.demographics.ageRange] || '');
  }

  if (persona.demographics?.lifestyle === 'busy-professional') {
    parts.push('juggling multiple priorities');
  } else if (persona.demographics?.lifestyle === 'balanced-seeker') {
    parts.push('seeking work-life harmony');
  }

  if (persona.jobs?.emotional) {
    const emotionalDesc: Record<string, string> = {
      'in-control': 'who wants to feel in control',
      'accomplished': 'who craves accomplishment',
      'cared-for': 'who needs to feel supported',
      'free': 'who yearns for freedom'
    };
    parts.push(emotionalDesc[persona.jobs.emotional] || '');
  }

  return parts.length > 0 ? parts.join(' ') + '.' : 'Answer questions to build their profile.';
}
```

**Acceptance Criteria**:
- [ ] calculateClarity returns correct scores per category
- [ ] calculateAvgConfidence calculates mean of non-unsure responses
- [ ] getUnsureCount returns count of unsure responses
- [ ] generateArchetype matches emotional job + lifestyle to archetype name
- [ ] generateSummary builds readable persona summary

---

## Phase 2: API Routes

### Task 2.1: Create Modules List API
**Description**: Create API endpoint to list available clarity modules
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 2.2, 2.3, 2.4

**Technical Requirements**:
Create `app/api/clarity-canvas/modules/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = await prisma.clarityModule.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        estimatedMinutes: true,
        enrichesSections: true,
        isActive: true,
      },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] GET returns list of active modules ordered by sortOrder
- [ ] Requires authentication
- [ ] Returns 401 if not authenticated
- [ ] Returns 500 with error on database failure

---

### Task 2.2: Create Personas CRUD API
**Description**: Create API endpoints for persona creation and retrieval
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 2.1, 2.3, 2.4

**Technical Requirements**:
Create `app/api/clarity-canvas/modules/persona-sharpener/personas/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch persona for current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        personas: {
          include: {
            sessions: {
              where: { status: 'in_progress' },
              orderBy: { startedAt: 'desc' },
              take: 1,
            },
            responses: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const primaryPersona = profile.personas.find(p => p.isPrimary) || profile.personas[0] || null;

    return NextResponse.json({
      persona: primaryPersona,
      hasIncompleteSession: primaryPersona?.sessions?.[0]?.status === 'in_progress',
    });
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}

// POST - Create new persona
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.clarityProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if persona already exists
    const existingPersona = await prisma.persona.findFirst({
      where: { profileId: profile.id, isPrimary: true },
    });

    if (existingPersona) {
      return NextResponse.json({ persona: existingPersona });
    }

    // Create new persona
    const persona = await prisma.persona.create({
      data: {
        profileId: profile.id,
        isPrimary: true,
        antiPatterns: [],
      },
    });

    return NextResponse.json({ persona }, { status: 201 });
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] GET returns primary persona with sessions and responses
- [ ] GET indicates if there's an incomplete session
- [ ] POST creates persona linked to user's profile
- [ ] POST returns existing persona if one already exists
- [ ] Both endpoints require authentication

---

### Task 2.3: Create Sessions API
**Description**: Create API endpoint for sharpener session management
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1, Task 2.2
**Can run parallel with**: Task 2.1, 2.4

**Technical Requirements**:
Create `app/api/clarity-canvas/modules/persona-sharpener/sessions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = await request.json();

    if (!personaId) {
      return NextResponse.json({ error: 'personaId required' }, { status: 400 });
    }

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: session.user.id },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Mark any existing in_progress sessions as abandoned
    await prisma.sharpenerSession.updateMany({
      where: {
        personaId,
        status: 'in_progress',
      },
      data: {
        status: 'abandoned',
      },
    });

    // Create new session
    const sharpenerSession = await prisma.sharpenerSession.create({
      data: {
        personaId,
        sessionType: 'sharpen',
        status: 'in_progress',
      },
    });

    return NextResponse.json({ session: sharpenerSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] POST creates new session for persona
- [ ] POST marks existing in_progress sessions as abandoned
- [ ] Verifies persona belongs to authenticated user
- [ ] Returns 400 if personaId missing
- [ ] Returns 404 if persona not found

---

### Task 2.4: Create Questions API
**Description**: Create API endpoint to retrieve question bank
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.3
**Can run parallel with**: Task 2.1, 2.2, 2.3

**Technical Requirements**:
Create `app/api/clarity-canvas/modules/persona-sharpener/questions/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      questions: questionSequence,
      totalQuestions: questionSequence.length,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] GET returns question sequence in correct order
- [ ] Includes totalQuestions count
- [ ] Requires authentication

---

### Task 2.5: Create Responses API
**Description**: Create API endpoint for submitting and retrieving responses
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1, Task 1.4, Task 2.2
**Can run parallel with**: None

**Technical Requirements**:
Create `app/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/responses/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getQuestionById } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';
import { calculateClarity, calculateAvgConfidence, getUnsureCount, generateArchetype, generateSummary } from '@/lib/clarity-canvas/modules/persona-sharpener/scoring';
import type { PersonaDisplay, ResponseInput } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

interface RouteParams {
  params: { personaId: string };
}

// GET - Fetch all responses for persona
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = params;

    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: session.user.id },
      },
      include: { responses: true },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    return NextResponse.json({ responses: persona.responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

// POST - Submit a response
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personaId } = params;
    const body = await request.json();
    const { sessionId, questionId, value, isUnsure, confidence, additionalContext, contextSource } = body;

    // Validate required fields
    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: 'sessionId and questionId required' },
        { status: 400 }
      );
    }

    // Get question to find field mapping
    const question = getQuestionById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        profile: { userId: session.user.id },
      },
      include: { responses: true },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Check if response already exists for this question
    const existingResponse = await prisma.response.findFirst({
      where: {
        personaId,
        sessionId,
        questionId,
      },
    });

    let response;
    if (existingResponse) {
      // Update existing response
      response = await prisma.response.update({
        where: { id: existingResponse.id },
        data: {
          value,
          isUnsure,
          confidence,
          additionalContext,
          contextSource,
        },
      });
    } else {
      // Create new response
      response = await prisma.response.create({
        data: {
          personaId,
          sessionId,
          questionId,
          field: question.field,
          value,
          isUnsure,
          confidence,
          additionalContext,
          contextSource,
          responseType: 'assumption',
          respondentId: session.user.id,
          respondentRole: 'founder',
          respondentName: session.user.name || null,
        },
      });
    }

    // Update session progress
    await prisma.sharpenerSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: {
          increment: existingResponse ? 0 : 1,
        },
        questionsUnsure: isUnsure
          ? { increment: existingResponse?.isUnsure ? 0 : 1 }
          : { decrement: existingResponse?.isUnsure ? 1 : 0 },
      },
    });

    // Fetch all responses and recalculate persona
    const allResponses = await prisma.response.findMany({
      where: { personaId },
    });

    // Convert to ResponseInput format for scoring
    const responsesMap: Record<string, ResponseInput> = {};
    allResponses.forEach(r => {
      responsesMap[r.questionId] = {
        questionId: r.questionId,
        value: r.value,
        isUnsure: r.isUnsure,
        confidence: r.confidence,
        additionalContext: r.additionalContext || undefined,
        contextSource: r.contextSource as 'text' | null,
      };
    });

    const clarity = calculateClarity(responsesMap);
    const avgConfidence = calculateAvgConfidence(responsesMap);
    const unsureCount = getUnsureCount(responsesMap);

    // Build persona display object from responses
    const personaDisplay = buildPersonaDisplay(persona, allResponses, clarity, avgConfidence, unsureCount);

    // Update persona with new clarity scores
    await prisma.persona.update({
      where: { id: personaId },
      data: {
        clarityOverall: clarity.overall,
        clarityIdentity: clarity.identity,
        clarityGoals: clarity.goals,
        clarityFrustrations: clarity.frustrations,
        clarityEmotional: clarity.emotional,
        clarityBehaviors: clarity.behaviors,
        avgConfidence,
        totalAssumptions: allResponses.filter(r => !r.isUnsure).length,
        // Update structured fields based on response
        ...buildPersonaFields(question.field, value, isUnsure),
      },
    });

    return NextResponse.json({
      response: {
        id: response.id,
        questionId: response.questionId,
        value: response.value,
      },
      persona: personaDisplay,
      clarity,
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}

function buildPersonaDisplay(
  persona: any,
  responses: any[],
  clarity: any,
  avgConfidence: number,
  unsureCount: number
): PersonaDisplay {
  const display: PersonaDisplay = {
    id: persona.id,
    name: persona.name,
    archetype: '',
    summary: '',
    quote: persona.quote,
    demographics: persona.demographics || {},
    jobs: persona.jobs || {},
    goals: persona.goals || {},
    frustrations: persona.frustrations || {},
    behaviors: persona.behaviors || {},
    antiPatterns: persona.antiPatterns || [],
    clarity,
    avgConfidence,
    unsureCount,
  };

  display.archetype = generateArchetype(display);
  display.summary = generateSummary(display);

  return display;
}

function buildPersonaFields(field: string, value: any, isUnsure: boolean): Record<string, any> {
  if (isUnsure) return {};

  const [section, key] = field.split('.');
  if (!section || !key) return {};

  // For JSON fields, we need to merge with existing data
  // This is a simplified version - in production you'd want to deep merge
  return {
    [section]: {
      [key]: value,
    },
  };
}
```

**Acceptance Criteria**:
- [ ] GET returns all responses for persona
- [ ] POST creates or updates response for question
- [ ] POST updates session progress (questionsAnswered, questionsUnsure)
- [ ] POST recalculates clarity scores after each response
- [ ] POST updates persona structured fields
- [ ] Returns updated persona display with clarity scores
- [ ] Verifies persona belongs to authenticated user

---

## Phase 3: Module Index UI

### Task 3.1: Create Modules Index Page
**Description**: Create the modules index page with module cards
**Size**: Medium
**Priority**: High
**Dependencies**: Task 2.1
**Can run parallel with**: None

**Technical Requirements**:
Create `app/clarity-canvas/modules/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ModulesIndexClient } from './ModulesIndexClient';

export default async function ModulesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?returnTo=/clarity-canvas/modules');
  }

  return <ModulesIndexClient user={session.user} />;
}
```

Create `app/clarity-canvas/modules/ModulesIndexClient.tsx`:

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  enrichesSections: string[];
  isActive: boolean;
}

interface User {
  id?: string;
  name?: string | null;
}

export function ModulesIndexClient({ user }: { user: User }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      try {
        const response = await fetch('/api/clarity-canvas/modules');
        if (!response.ok) throw new Error('Failed to fetch modules');
        const data = await response.json();
        setModules(data.modules);
      } catch (err) {
        setError('Failed to load modules');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModules();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/clarity-canvas"
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-xl font-display text-white">Clarity Modules</h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-display text-white mb-3">
            Enrich Your Profile
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            Complete focused experiences to deepen specific aspects of your clarity profile.
            Each module helps you capture structured insights that inform your strategy.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <ModuleCard key={module.id} module={module} index={index} />
              ))}

              {/* Coming Soon Placeholder */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 opacity-50">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🎯</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-zinc-500">
                        Coming Soon: Problem Validator
                      </h3>
                    </div>
                    <p className="text-zinc-600 text-sm">
                      Validate your problem hypothesis with structured customer discovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function ModuleCard({ module, index }: { module: Module; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-[#D4A84B]/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{module.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-white">{module.name}</h3>
            <span className="text-sm text-zinc-500">~{module.estimatedMinutes} min</span>
          </div>
          <p className="text-zinc-400 text-sm mb-4">{module.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {module.enrichesSections.map((section) => (
                <span
                  key={section}
                  className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded"
                >
                  {section}
                </span>
              ))}
            </div>
            <Link
              href={`/clarity-canvas/modules/${module.slug}`}
              className="px-4 py-2 bg-[#D4A84B] text-black text-sm font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
            >
              Start →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

**Acceptance Criteria**:
- [ ] Server component checks auth and redirects if needed
- [ ] Client component fetches and displays modules
- [ ] Module cards show icon, name, description, estimated time
- [ ] Module cards show enriched sections as tags
- [ ] "Start →" button links to module page
- [ ] Coming Soon placeholder for future modules
- [ ] Loading and error states handled
- [ ] Matches 33 Strategies design system

---

### Task 3.2: Add "Explore Modules" Button to ProfileScreen
**Description**: Add button to existing ClarityCanvasClient ProfileScreen
**Size**: Small
**Priority**: High
**Dependencies**: Task 3.1
**Can run parallel with**: None

**Technical Requirements**:
Edit `app/clarity-canvas/ClarityCanvasClient.tsx` ProfileScreen component to add:

```typescript
// In ProfileScreen component, update the Actions section:

{/* Actions */}
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <motion.button
    onClick={onStartInterview}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="px-8 py-4 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
  >
    Answer Quick Questions
  </motion.button>

  <motion.button
    onClick={onAddMore}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="px-8 py-4 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
  >
    Add More Context
  </motion.button>
</div>

{/* Modules CTA - Add this after the Actions div */}
<div className="mt-8 pt-8 border-t border-zinc-800">
  <Link href="/clarity-canvas/modules">
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-[#D4A84B]/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <div>
          <p className="text-white font-medium">Explore Modules</p>
          <p className="text-sm text-zinc-500">
            Deepen specific aspects of your profile
          </p>
        </div>
      </div>
      <span className="text-[#D4A84B]">→</span>
    </motion.div>
  </Link>
</div>
```

Add import at top of file:
```typescript
import Link from 'next/link';
```

**Acceptance Criteria**:
- [ ] "Explore Modules" card appears below existing action buttons
- [ ] Card links to /clarity-canvas/modules
- [ ] Matches existing visual styling
- [ ] Shows on ProfileScreen (after brain dump complete)

---

### Task 3.3: Seed ClarityModule Table
**Description**: Create seed script and add Persona Sharpener module entry
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: Task 3.1, 3.2

**Technical Requirements**:
Create `prisma/seed-modules.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed Persona Sharpener module
  await prisma.clarityModule.upsert({
    where: { slug: 'persona-sharpener' },
    update: {},
    create: {
      slug: 'persona-sharpener',
      name: 'Persona Sharpener',
      description: 'Build a detailed, research-backed customer persona with assumption tracking and validation.',
      icon: '👤',
      estimatedMinutes: 10,
      enrichesSections: ['Individual', 'Goals', 'Network'],
      isActive: true,
      sortOrder: 1,
    },
  });

  console.log('Seeded ClarityModule table');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to package.json scripts:
```json
{
  "scripts": {
    "db:seed-modules": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed-modules.ts"
  }
}
```

**Acceptance Criteria**:
- [ ] Seed script creates Persona Sharpener module entry
- [ ] Uses upsert to be idempotent
- [ ] Can run via `npm run db:seed-modules`
- [ ] Module appears in GET /api/clarity-canvas/modules response

---

## Phase 4: Persona Sharpener UI

### Task 4.1: Create Persona Sharpener Main Page and Client
**Description**: Create the main Persona Sharpener page with multi-step flow
**Size**: Large
**Priority**: High
**Dependencies**: Phase 2 complete, Task 3.1
**Can run parallel with**: None

**Technical Requirements**:
Create `app/clarity-canvas/modules/persona-sharpener/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PersonaSharpenerClient } from './PersonaSharpenerClient';

export default async function PersonaSharpenerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?returnTo=/clarity-canvas/modules/persona-sharpener');
  }

  return <PersonaSharpenerClient user={session.user} />;
}
```

Create `app/clarity-canvas/modules/persona-sharpener/PersonaSharpenerClient.tsx` (main orchestration component with WelcomeScreen, QuestionnairePanel, PersonaCard, CompletionScreen - this is a large file that implements the full multi-step flow with state management for responses, navigation, and real-time persona updates).

This is too large to include inline - see the reference implementation in `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-v2.jsx` and port to TypeScript with Next.js patterns.

**Key implementation details**:
1. State: currentStep ('welcome' | 'questionnaire' | 'complete'), responses (Record<string, ResponseInput>), persona (PersonaDisplay), currentQuestionIndex, sessionId
2. API calls: Create persona on start, create session, submit responses on continue, update session on complete
3. Real-time updates: Recalculate clarity/archetype/summary client-side as user answers
4. Navigation: Back/Skip/Continue with proper state preservation

**Acceptance Criteria**:
- [ ] Server component checks auth
- [ ] Welcome screen with explanation and "Begin Sharpening" CTA
- [ ] Split panel layout during questionnaire (persona card left, questions right)
- [ ] Question progress indicator
- [ ] All 6 question types render correctly
- [ ] "I'm not sure" checkbox and confidence slider on each question
- [ ] Persona card updates in real-time
- [ ] Completion screen with summary
- [ ] Matches 33 Strategies design system

---

### Task 4.2: Create Question Type Components
**Description**: Create the 6 question type components
**Size**: Large
**Priority**: High
**Dependencies**: Task 1.2
**Can run parallel with**: Task 4.1

**Technical Requirements**:
Create `app/clarity-canvas/modules/persona-sharpener/components/questions/` directory with:

1. `ThisOrThat.tsx` - Radio-style selection from 2-4 options with labels and sublabels
2. `Slider.tsx` - Range slider with min/max labels
3. `Ranking.tsx` - Drag-and-drop ranking of 4-6 items
4. `MultiSelect.tsx` - Checkbox selection with max limit
5. `FillBlank.tsx` - Template with blank inputs
6. `Scenario.tsx` - Open text area with placeholder and helper text

Each component should accept:
```typescript
interface QuestionProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean; // For when "I'm not sure" is checked
}
```

Port implementations from `persona-sharpener-v2.jsx` (lines 816-1265).

**Acceptance Criteria**:
- [ ] All 6 question types implemented
- [ ] Components handle disabled state (when unsure checked)
- [ ] Styling matches 33 Strategies design system
- [ ] Ranking component has drag-and-drop functionality
- [ ] MultiSelect respects maxSelections limit

---

### Task 4.3: Create QuestionMeta Wrapper Component
**Description**: Create the wrapper that adds confidence slider and unsure checkbox
**Size**: Medium
**Priority**: High
**Dependencies**: Task 4.2
**Can run parallel with**: Task 4.1

**Technical Requirements**:
Create `app/clarity-canvas/modules/persona-sharpener/components/QuestionMeta.tsx`:

```typescript
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface QuestionMetaProps {
  children: React.ReactNode;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  onUnsureChange: (isUnsure: boolean) => void;
  onConfidenceChange: (confidence: number) => void;
  onContextChange: (context: string) => void;
}

export function QuestionMeta({
  children,
  isUnsure,
  confidence,
  additionalContext = '',
  onUnsureChange,
  onConfidenceChange,
  onContextChange,
}: QuestionMetaProps) {
  const [showContext, setShowContext] = useState(false);

  const getConfidenceColor = (value: number) => {
    if (value >= 70) return '#4ADE80'; // green
    if (value >= 40) return '#D4A84B'; // gold
    return '#FB923C'; // orange
  };

  return (
    <div className="space-y-6">
      {/* Question content */}
      <div className={isUnsure ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* I'm not sure checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={isUnsure}
          onChange={(e) => onUnsureChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-[#FB923C] focus:ring-[#FB923C] focus:ring-offset-0"
        />
        <div>
          <span className="text-white group-hover:text-[#FB923C] transition-colors">
            I'm not sure about this
          </span>
          <p className="text-sm text-zinc-500 mt-0.5">
            That's okay — we'll flag it for validation
          </p>
        </div>
      </label>

      {/* Confidence slider (only if not unsure) */}
      {!isUnsure && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Confidence</span>
            <span
              className="text-sm font-medium"
              style={{ color: getConfidenceColor(confidence) }}
            >
              {confidence}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => onConfidenceChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${getConfidenceColor(confidence)} ${confidence}%, #27272a ${confidence}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>Just guessing</span>
            <span>Have data</span>
          </div>
        </div>
      )}

      {/* Add context (collapsible) */}
      {!isUnsure && (
        <div>
          <button
            onClick={() => setShowContext(!showContext)}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <span>{showContext ? '−' : '+'}</span>
            <span>Add context (optional)</span>
          </button>
          {showContext && (
            <motion.textarea
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              value={additionalContext}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder="Any supporting details or reasoning..."
              className="mt-2 w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-[#D4A84B]"
              rows={3}
            />
          )}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] "I'm not sure" checkbox disables question content when checked
- [ ] Confidence slider with color gradient (orange → gold → green)
- [ ] Labels show "Just guessing" to "Have data"
- [ ] Collapsible "Add context" textarea
- [ ] Styling matches design system

---

### Task 4.4: Create PersonaCard Component
**Description**: Create the real-time updating persona card for left panel
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.4
**Can run parallel with**: Task 4.1, 4.2, 4.3

**Technical Requirements**:
Create `app/clarity-canvas/modules/persona-sharpener/components/PersonaCard.tsx`:

Port from `persona-sharpener-v2.jsx` (lines 545-813) with TypeScript.

Key elements:
- Archetype name (generated from emotional job + lifestyle)
- Summary paragraph
- Clarity % and Confidence % stats
- Unsure count warning badge
- Category clarity bars (Identity, Goals, Frustrations, Emotional, Behaviors)
- Quote section
- Jobs to be done section (Functional, Emotional, Social)
- Goals and Frustrations lists

**Acceptance Criteria**:
- [ ] Shows archetype name and summary
- [ ] Clarity and confidence percentages displayed
- [ ] Category bars update in real-time
- [ ] Quote section populated from voice-capture question
- [ ] Jobs to be done section shows all three job types
- [ ] "Unsure" badge shows count of uncertain answers
- [ ] Styling matches design system

---

## Phase 5: Polish & Integration

### Task 5.1: Add Framer Motion Animations
**Description**: Add consistent animations throughout the module
**Size**: Small
**Priority**: Medium
**Dependencies**: Phase 4 complete
**Can run parallel with**: Task 5.2, 5.3

**Technical Requirements**:
Apply consistent Framer Motion animations:
- Page transitions: fadeIn with y offset
- Question transitions: AnimatePresence with slide
- Card updates: layoutId for smooth morphing
- Button interactions: whileHover/whileTap scale

Match existing patterns in `ClarityCanvasClient.tsx`.

**Acceptance Criteria**:
- [ ] Smooth transitions between steps
- [ ] Question transitions feel natural
- [ ] Persona card updates smoothly
- [ ] Animations are 60fps smooth
- [ ] Consistent with existing Clarity Canvas animations

---

### Task 5.2: Implement Session Resume Flow
**Description**: Handle resuming incomplete sessions
**Size**: Small
**Priority**: Medium
**Dependencies**: Phase 4 complete
**Can run parallel with**: Task 5.1, 5.3

**Technical Requirements**:
When user starts Persona Sharpener:
1. Check if incomplete session exists (GET /personas returns hasIncompleteSession)
2. If yes, show resume dialog: "You have an incomplete session. Resume where you left off?"
3. If resume, fetch existing responses and restore state
4. If start fresh, mark old session as abandoned and create new

**Acceptance Criteria**:
- [ ] Detects incomplete sessions on load
- [ ] Shows resume dialog with options
- [ ] Resume restores question index and responses
- [ ] Start fresh abandons old session

---

### Task 5.3: Error Handling and Loading States
**Description**: Add comprehensive error handling and loading states
**Size**: Small
**Priority**: Medium
**Dependencies**: Phase 4 complete
**Can run parallel with**: Task 5.1, 5.2

**Technical Requirements**:
- Loading spinner on initial page load
- Loading indicator on response submission
- Error toast/message on API failures
- Retry option on transient errors
- Graceful degradation if scoring fails

**Acceptance Criteria**:
- [ ] Loading states for all async operations
- [ ] Error messages are user-friendly
- [ ] Retry available on failures
- [ ] Page doesn't break on errors

---

## Execution Order

**Critical Path**:
1.1 → 1.2 → 1.3 → 1.4 → 2.1-2.5 (parallel APIs) → 3.1-3.3 (parallel) → 4.1-4.4 (parallel) → 5.1-5.3 (parallel)

**Parallel Execution Opportunities**:
- Phase 2: All API routes can be built in parallel after 1.1
- Phase 3: Module index and seeding can be parallel
- Phase 4: Question components can be built in parallel with main client
- Phase 5: All polish tasks can be parallel

---

## Summary

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1: Foundation | 4 tasks | 4-5 hours |
| Phase 2: API Routes | 5 tasks | 3-4 hours |
| Phase 3: Module Index | 3 tasks | 2-3 hours |
| Phase 4: Persona Sharpener UI | 4 tasks | 8-10 hours |
| Phase 5: Polish | 3 tasks | 2-3 hours |
| **Total** | **19 tasks** | **19-25 hours** |
