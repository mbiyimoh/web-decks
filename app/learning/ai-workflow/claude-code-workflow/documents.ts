// ============================================================================
// DOCUMENT VIEWER DATA
// Extracted from ClaudeCodeWorkflowDeck for maintainability
// ============================================================================

export type DocumentId =
  | 'claude-md-example'
  | 'what-were-building'
  | 'how-we-do-shit'
  | 'spec-ideate-output'
  | 'spec-ideate-output-validation'
  | 'spec-full-example'
  | 'spec-full-example-validation'
  | 'spec-decomposed'
  | 'spec-decomposed-validation'
  | 'hook-config';

export interface DocumentMeta {
  id: DocumentId;
  title: string;
  path: string;
  content: string;
}

// ============================================================================
// DOCUMENT CONTENT
// ============================================================================

export const DOCUMENTS: Record<DocumentId, DocumentMeta> = {
  'claude-md-example': {
    id: 'claude-md-example',
    title: 'CLAUDE.md',
    path: 'CLAUDE.md',
    content: `# CLAUDE.md

## Who You Are

You are an expert TypeScript/React developer working on TradeBlock. You have deep knowledge of Next.js 14, TypeScript strict mode, Prisma ORM, and Tailwind CSS.

## Communication Style

- Be direct and concise
- Skip unnecessary preamble
- When I ask you to build something, start building
- Use voice-friendly responses

## Critical Patterns

### File Organization
- app/ — Next.js app router pages
- components/ — React components (ui/ and features/)
- lib/ — Utilities and helpers
- hooks/ — Custom React hooks

### Database Conventions
- Tables use snake_case
- Primary keys are id (UUID)
- Timestamps: created_at, updated_at

## Operational Commands

| Command | Purpose |
|---------|---------|
| /spec:ideate | Research before building |
| /spec:create | Generate detailed spec |
| /spec:validate | Check spec quality |
| /spec:decompose | Break into tasks |
| /spec:execute | Build from spec |

## Reference Documents

- docs/what-were-building.md — Current project context
- docs/how-we-do-shit.md — Team conventions
- docs/api-patterns.md — API design standards`
  },
  'what-were-building': {
    id: 'what-were-building',
    title: 'what-were-building.md',
    path: 'docs/what-were-building.md',
    content: `# What We're Building

## Current Sprint: Authentication Overhaul

We're rebuilding the authentication system to support:
1. Magic link login (primary)
2. OAuth providers (Google, Apple)
3. Session management with refresh tokens

### Why This Matters

Current auth is username/password only, which has high friction. Users forget passwords and we need password reset flows.

### Success Criteria

- User can sign up/in with email magic link
- Session persists for 30 days with refresh
- OAuth buttons work for Google and Apple
- Existing users migrated seamlessly

### Technical Approach

Using next-auth v5 (Auth.js) with Prisma adapter for session storage, custom magic link provider, and JWT strategy for API routes.`
  },
  'how-we-do-shit': {
    id: 'how-we-do-shit',
    title: 'how-we-do-shit.md',
    path: 'docs/how-we-do-shit.md',
    content: `# How We Do Shit

## Code Style

### TypeScript
- Strict mode always
- Explicit return types on exported functions
- interface for objects, type for unions
- No any — use unknown and narrow

### React
- Functional components only
- Custom hooks for shared logic
- Colocation: keep related files together

### Naming
- Components: PascalCase
- Hooks: useCamelCase
- Utils: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Files: kebab-case.ts

## Git Workflow

### Branches
- main — production
- develop — staging
- feature/ticket-description — feature work
- fix/ticket-description — bug fixes

### Commits
Use conventional commits: feat:, fix:, refactor:, docs:, test:

## Testing Strategy

- Unit Tests (Vitest) — Test business logic in isolation
- E2E Tests (Playwright) — Cover critical user flows
- Aim for 80% coverage on lib/`
  },
  'spec-ideate-output': {
    id: 'spec-ideate-output',
    title: 'Ideation: Smart Capture SDK',
    path: 'docs/ideation/sneaker-angle-capture-system.md',
    content: `# Smart Capture SDK: Object-Agnostic Angle Capture System

**Status:** DECISIONS LOCKED - Ready for Spec

---

## 1) Intent & Assumptions

**Task brief:** Build a reusable, object-agnostic smart capture system that guides users through capturing objects from predefined angles using real-time ML-powered recognition.

**Assumptions:**
- Extensibility is paramount - architecture must support adding new object types
- Target: Web prototype first → Mobile-first micro-app MVP
- Object profiles define: target angles, ML model, overlay guides, confidence thresholds
- Sneakers are the first object profile; figurines, watches will follow

**Out of scope:**
- Native app integration work (designed for, but not implemented)
- Cloud-based ML processing
- Building object profiles beyond sneakers

---

## 2) Pre-reading Log

This is a greenfield project with no existing codebase.

**Key Implication:** Full architecture decisions need to be made from scratch.

---

## 3) Codebase Map

### Recommended Architecture

\`\`\`
src/
├── core/                    # Reusable SDK engine
│   ├── camera/              # Camera abstraction layer
│   ├── ml/                  # ML inference engine
│   ├── capture/             # Capture orchestration
│   └── ui/                  # Reusable UI components
│
├── profiles/                # Object profile configurations
│   ├── types.ts             # ObjectProfile interface
│   ├── sneakers/            # Sneaker-specific implementation
│   └── _template/           # Template for new profiles
│
└── app/                     # Application layer
\`\`\`

---

## 5) Research Findings

### Registry Pattern for ML Models
**Industry Standard:** Used by MMDetection, Ultralytics YOLO

Enables:
- Lazy loading: Models load only when needed
- Hot-swapping: Switch profiles without app restart
- Memory management: Unload unused models

### Classification-Based ML Approach
- **8 Classes:** top-down, sole, heel, toe, side-left, side-right, size-tag, box
- **Architecture:** MobileNetV3-Small backbone (~4MB)
- **Target Accuracy:** >90% top-1 per angle

---

## 6) Decisions (LOCKED)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Profile Format | TypeScript modules | Type-safe, IDE support |
| ML Approach | Classification | Simpler than pose estimation |
| Platform | Web-first | Fastest iteration |
| Performance | <200ms latency | Good UX baseline |

---

## 7) Next Steps

1. Create implementation spec
2. Train angle detection model
3. Begin implementation`
  },
  'spec-full-example': {
    id: 'spec-full-example',
    title: 'Spec: Smart Capture SDK Web Prototype',
    path: 'specs/smart-capture-sdk-web-prototype.md',
    content: `# Smart Capture SDK - Web Prototype Specification

**Version:** 1.1 | **Status:** Phase 2 Complete (Real Model Trained)

---

## 1. Overview

### 1.1 Purpose
Build a web-based prototype of the Smart Capture SDK that demonstrates ML-powered angle capture for sneakers. Mobile-first to validate UX before React Native.

### 1.2 Goals
1. Deliver Apple Face ID-inspired capture experience
2. Validate ML angle detection with real training data
3. Build extensibility for future object profiles
4. Deploy to Railway for mobile testing

### 1.3 Non-Goals (This Phase)
- React Native implementation
- Multiple object profiles (only sneakers)
- Native app embedding API

---

## 2. User Experience

### 2.1 User Flow

Landing → Onboarding → Capture Screen → Review → Success

### 2.2 Capture Screen (Core Experience)

**Elements:**
1. **Progress Indicator:** "1 of 7" with completion status
2. **Camera Feed:** Full-screen video from device
3. **Silhouette Overlay:** SVG outline for target angle
4. **Confidence Ring:** Color gradient blue → yellow → green
5. **Manual Capture:** Appears after 5 seconds

**Auto-Capture Flow:**
1. Freeze frame briefly (100ms)
2. Play success animation
3. Trigger haptic feedback
4. Save captured image
5. Transition to next angle

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Camera | react-webcam |
| ML Inference | TensorFlow.js |
| Deployment | Railway |

### 3.2 ML Model

| Property | Value |
|----------|-------|
| Architecture | MobileNetV3-Small |
| Input Size | 224 x 224 x 3 |
| Output | 8 classes (softmax) |
| Format | TensorFlow.js |
| Size | < 10MB |

**Class Labels:**
top-down, sole, heel, toe, side-left, side-right, size-tag, box

---

## 4. Implementation Phases

### Phase 1: Foundation ✅
Full UX flow with placeholder model

### Phase 2: Model Training ✅
- Accuracy: 72% overall
- Size: 4.44 MB
- Confidence threshold: 0.55

### Phase 3: Polish
Performance optimization, error handling, accessibility

---

## 5. Success Criteria

### Functional
- [ ] Complete 7-angle capture session
- [ ] Auto-capture triggers correctly
- [ ] Works on iPhone Safari + Android Chrome

### Technical
- [ ] Model accuracy > 70% ✅ (72%)
- [ ] Page loads < 3 seconds
- [ ] Model loads < 2 seconds`
  },
  'spec-decomposed': {
    id: 'spec-decomposed',
    title: 'Decomposed Tasks: Smart Capture SDK',
    path: 'specs/smart-capture-sdk-decomposed-tasks.md',
    content: `# Smart Capture SDK - Task Decomposition

**Spec:** smart-capture-sdk-web-prototype.md
**Status:** Ready for Execution

---

## Phase 1: Foundation (Core + Placeholder Model)

### 1.1 Project Setup
| ID | Task | Priority | Complexity |
|----|------|----------|------------|
| P1-01 | Initialize Next.js 14 with Tailwind, TypeScript | HIGH | LOW |
| P1-02 | Configure project structure (core/, profiles/, app/) | HIGH | LOW |
| P1-03 | Install deps (framer-motion, react-webcam, tfjs) | HIGH | LOW |

### 1.2 Core Types & Interfaces
| ID | Task | Priority | Complexity |
|----|------|----------|------------|
| P1-06 | Create profiles/types.ts (ObjectProfile, AngleDefinition) | HIGH | LOW |
| P1-07 | Create core/capture/types.ts (CaptureState, SessionState) | HIGH | LOW |
| P1-08 | Create core/ml/types.ts (InferenceResult) | HIGH | LOW |

### 1.3 Camera Module
| ID | Task | Priority | Complexity |
|----|------|----------|------------|
| P1-13 | Implement CameraProvider.tsx with react-webcam | HIGH | MEDIUM |
| P1-14 | Implement useCamera.ts hook | HIGH | MEDIUM |

### 1.4 ML Module (Placeholder)
| ID | Task | Priority | Complexity |
|----|------|----------|------------|
| P1-16 | Implement TFJSAdapter.ts with placeholder | HIGH | MEDIUM |
| P1-17 | Implement useInference.ts hook | HIGH | MEDIUM |

### 1.5 Capture Session Logic
| ID | Task | Priority | Complexity |
|----|------|----------|------------|
| P1-19 | Implement CaptureSession.ts state machine | HIGH | HIGH |
| P1-20 | Implement useCaptureSession.ts hook | HIGH | HIGH |

### 1.6 UI Components
| ID | Task | Priority | Complexity |
|----|------|----------|------------|
| P1-22 | ConfidenceRing.tsx with gradient animation | HIGH | MEDIUM |
| P1-23 | GuideOverlay.tsx for silhouettes | HIGH | MEDIUM |
| P1-11 | Create 8 silhouette SVGs | HIGH | MEDIUM |

### 1.7 App Screens
| ID | Task | Priority | Complexity |
|----|------|----------|------------|
| P1-29 | Landing Screen with permission request | HIGH | MEDIUM |
| P1-30 | Capture Screen with full flow | HIGH | HIGH |
| P1-31 | Review Screen with retake | HIGH | MEDIUM |
| P1-32 | Success Screen with celebration | MEDIUM | LOW |

---

## Critical Path

P1-01 → P1-02 → P1-03 (Setup)
  ↓
P1-06, P1-07, P1-08 (Types)
  ↓
P1-13 → P1-14 (Camera)  |  P1-16 → P1-17 (ML)
  ↓
P1-19 → P1-20 (Session)
  ↓
P1-29 → P1-30 → P1-31 → P1-32 (Screens)

---

## Summary

| Phase | Tasks | HIGH | MEDIUM | Status |
|-------|-------|------|--------|--------|
| Phase 1 | 38 | 22 | 12 | ✅ Complete |
| Phase 2 | 12 | 9 | 3 | ✅ Complete |
| Phase 3 | 12 | 4 | 5 | 🚀 In Progress |`
  },
  'hook-config': {
    id: 'hook-config',
    title: '.claude/settings.json',
    path: '.claude/settings.json',
    content: `{
  "hooks": {
    "stop": [
      {
        "name": "typecheck-project",
        "command": "npm run typecheck",
        "enabled": true
      },
      {
        "name": "lint-project",
        "command": "npm run lint",
        "enabled": true
      },
      {
        "name": "self-review",
        "command": "claude-review --integration",
        "enabled": true
      }
    ]
  },
  "subagents": {
    "specialists": [
      {
        "name": "react-expert",
        "prompt": "Focus on React components and hooks."
      },
      {
        "name": "typescript-expert",
        "prompt": "Focus on type safety and patterns."
      },
      {
        "name": "playwright-expert",
        "prompt": "Write robust E2E tests."
      }
    ],
    "testing": {
      "quickcheck": {
        "prompt": "Quick verification with browser.",
        "cleanup": true
      },
      "e2e": {
        "prompt": "Comprehensive Playwright tests.",
        "output": "e2e/"
      }
    }
  }
}`
  },
  'spec-ideate-output-validation': {
    id: 'spec-ideate-output-validation',
    title: 'Ideation: Persona Validation Sharing',
    path: 'docs/ideation/persona-sharpener-validation-sharing.md',
    content: `# Persona Sharpener Validation Sharing System

**Status:** DECISIONS LOCKED - Ready for Spec

---

## 1) Intent & Assumptions

**Task Brief:**
Enable founders to share validation links with real potential customers who can complete the persona sharpener questionnaire without needing accounts. Their responses are tagged as "validations" and compared against founder "assumptions" to calculate alignment scores.

**Assumptions:**
- Founders have already completed Mode 1 (Sharpen) and have assumption-tagged responses
- Validators do not need 33 Strategies accounts to complete the questionnaire
- The existing 19-question bank has dual framing (question for founders, validationQuestion for validators)
- Multiple validators can respond to the same link
- Alignment scoring compares founder assumptions against validator consensus

**Out of Scope:**
- Incentive/reward systems for validators
- Real-time notifications when validators complete
- Voice input for validation mode (text only for MVP)
- Custom branding of validation pages per founder

---

## 2) Pre-reading Log

| File | Takeaway |
|------|----------|
| persona-sharpener-handoff.md | Comprehensive spec for three-mode system. Defines ValidationLink schema, Response tagging, alignment algorithm. |
| prisma/schema.prisma | Current models: Persona, Response, SharpenerSession. Response has responseType and respondentRole fields ready. No ValidationLink model yet. |
| lib/.../questions.ts | All 19 questions have dual framing. not-customer has validationQuestion: null. |
| Cross-project summary | Architecture from document sharing: ShareLink model, slug generation, verify-then-create flow. |

---

## 3) Codebase Map

### Primary Components

| Path | Role |
|------|------|
| app/clarity-canvas/modules/persona-sharpener/ | Main module directory |
| PersonaSharpenerSession.tsx | Questionnaire engine - needs validation-mode variant |
| lib/.../questions.ts | Question bank with dual framing |
| lib/.../scoring.ts | Needs alignment calculation |
| prisma/schema.prisma | Needs ValidationLink model |

### Data Flow

\`\`\`
Founder creates link → ValidationLink record
                            ↓
                    /validate/:slug URL
                            ↓
Validator accesses → Fetch metadata → Create ValidationSession
                            ↓
                    Answer questions (validationQuestion text)
                            ↓
                    Submit responses (tagged 'validation')
                            ↓
Founder views Reconcile UI → Calculate alignment scores
\`\`\`

---

## 5) Research

### Solution 1: Minimal In-App Validation (Recommended)

Build validation directly into existing persona sharpener, adding ValidationLink model and public validation page.

**Pros:**
- Reuses existing question rendering components
- Consistent UX between founder and validator
- Simpler to maintain
- Faster implementation (~2-3 weeks)

### Implementation Architecture

**Database Models:**
\`\`\`prisma
model ValidationLink {
  id              String    @id @default(cuid())
  personaId       String    @unique  // ONE link per persona
  slug            String    @unique  // 16 hex chars
  isActive        Boolean   @default(true)
  expiresAt       DateTime?
  maxResponses    Int?
  totalResponses  Int       @default(0)
  sessions        ValidationSession[]
}

model ValidationSession {
  id                String    @id @default(cuid())
  validationLinkId  String
  respondentEmail   String?
  status            String    @default("in_progress")
  questionsAnswered Int       @default(0)
}
\`\`\`

---

## 6) Clarifications (Answered)

1. **Access Control** → Default OPEN for maximum conversion
2. **Email Collection** → Optional at end with beta tester framing
3. **Link Expiration** → No default, suggest 7/14/30 days when set
4. **Progress Saving** → localStorage only, no auth required
5. **Multiple Links** → One per persona for MVP

---

## 7) Proposed Implementation Phases

### Phase 1: Database & API Foundation
- Add ValidationLink, ValidationSession models
- Implement API routes for link management
- Add slug generation utility

### Phase 2: Public Validation Page
- Create /validate/[slug] route
- Implement access verification flow
- Create ValidationQuestionnaire component
- Add middleware exception for public access

### Phase 3: Founder Link Management UI
- Add "Share for Validation" button
- Create ValidationLinkModal
- Display link analytics

### Phase 4: Alignment Scoring (Future)
- Implement calculateAlignment() per question type
- Create ReconciliationView component`
  },
  'spec-full-example-validation': {
    id: 'spec-full-example-validation',
    title: 'Spec: Persona Validation Mode',
    path: 'specs/feat-persona-sharpener-validation-mode.md',
    content: `# Persona Sharpener: Validation Mode

**Status:** Proto-Spec (Implement after V1 core tested)
**Depends On:** feat-persona-sharpener-module.md (V1)

---

## Overview

Validation and reconciliation features allowing founders to share validation links with real users, compare assumptions against validations, and reconcile differences.

---

## Scope

### In Scope
- Validation link generation and management
- Public validation page (no auth required)
- Real user response collection
- Assumption vs. validation comparison
- Alignment scoring

### Out of Scope (Future)
- Multiple validation cohorts
- A/B testing different hypotheses
- Statistical significance calculations
- Automated persona refinement suggestions

---

## Database Additions

### New Model: ValidationLink

\`\`\`prisma
model ValidationLink {
  id          String   @id @default(cuid())
  personaId   String   @unique
  persona     Persona  @relation(...)
  slug        String   @unique  // Short URL-safe identifier

  createdById String   // Founder's user ID
  expiresAt    DateTime?
  maxResponses Int?

  totalClicks      Int @default(0)
  totalCompletions Int @default(0)
  isActive    Boolean  @default(true)

  @@index([personaId])
  @@index([slug])
}
\`\`\`

### Updated Models

**Persona:** Add totalValidations counter and validationLink relation
**Response:** Add respondentEmail field for optional follow-up

---

## Route Structure

\`\`\`
app/
├── clarity-canvas/modules/persona-sharpener/
│   └── [personaId]/
│       ├── validate/page.tsx    # Link management
│       └── reconcile/page.tsx   # Comparison view
│
└── validate/[slug]/page.tsx     # PUBLIC - No auth
\`\`\`

---

## User Stories

### Generating a Validation Link

**Acceptance Criteria:**
- [ ] "Generate Validation Link" button on completion
- [ ] Unique slug generation (validate/abc123)
- [ ] Optional: Set expiration date
- [ ] Optional: Set max responses
- [ ] Copy to clipboard
- [ ] Show link analytics

### Validation Experience (Public)

**Acceptance Criteria:**
- [ ] No authentication required
- [ ] Welcome screen explains purpose
- [ ] Questions use validationQuestion field
- [ ] Optional email for follow-up
- [ ] Thank you screen on completion
- [ ] Graceful expired/maxed link handling

### Reconciliation View

**Acceptance Criteria:**
- [ ] Side-by-side: Assumption vs. Validations
- [ ] Alignment % per field
- [ ] Highlight fields < 70% alignment
- [ ] Drill-down to individual responses
- [ ] "Accept validation consensus" action

---

## Alignment Scoring Algorithm

\`\`\`typescript
interface AlignmentResult {
  overall: number;          // 0-100%
  byField: Record<string, {
    assumedValue: unknown;
    validationValues: unknown[];
    alignmentPercent: number;
    needsReview: boolean;   // true if < 70%
  }>;
}

function calculateAlignment(
  assumptions: Response[],
  validations: Response[]
): AlignmentResult {
  // Group validations by questionId
  // Calculate match percentage per field
  // Overall = average of fields with data
}
\`\`\`

---

## Implementation Notes

### Public Page Security
- No authentication required
- Rate limit by IP: 10 responses/hour
- Unguessable slug (nanoid, 10 chars)
- Validate link active before showing questions

### Question Rewording
- question: Founder-facing
- validationQuestion: User-facing
- Skip if validationQuestion is null

### Response Tagging
\`\`\`typescript
{
  responseType: 'validation',
  respondentRole: 'real-user',
  respondentEmail: userProvidedEmail || null,
}
\`\`\``
  },
  'spec-decomposed-validation': {
    id: 'spec-decomposed-validation',
    title: 'Decomposed Tasks: Validation Sharing',
    path: 'stm-tasks/validation-sharing-tasks.md',
    content: `# Validation Sharing - Task Decomposition

**Spec:** feat-persona-sharpener-validation-mode.md
**Task Management:** Simple Task Master (STM)
**Status:** Phase 1-4 In Progress

---

## Phase 1: Database & Foundation

### P1.1 Add Prisma Models
| ID | Task | Priority | Status |
|----|------|----------|--------|
| 158 | Add ValidationLink, ValidationSession models | HIGH | ✅ Done |
| - | Extend Response with validationSessionId | HIGH | ✅ Done |
| - | Add Persona.validationLink relation | HIGH | ✅ Done |

### P1.2 Create Utility Functions
| ID | Task | Priority | Status |
|----|------|----------|--------|
| 159 | generateValidationSlug() - 16 hex chars | HIGH | ✅ Done |
| 159 | getValidationUrl() helper | MEDIUM | ✅ Done |
| 159 | isLinkAccessible() check | MEDIUM | ✅ Done |

### P1.3 TypeScript Types
| ID | Task | Priority | Status |
|----|------|----------|--------|
| 160 | ValidationLinkInfo interface | HIGH | ✅ Done |
| 160 | ValidationProgress (localStorage) | HIGH | ✅ Done |
| 160 | SubmitResponsePayload | HIGH | ✅ Done |

### P1.4 Question Filtering
| ID | Task | Priority | Status |
|----|------|----------|--------|
| 161 | getValidationQuestions() filter | HIGH | ✅ Done |
| 161 | Skip questions with null validationQuestion | HIGH | ✅ Done |

---

## Phase 2: Public API Routes

### P2.1-P2.4 Validation Endpoints
| ID | Task | Priority | Status |
|----|------|----------|--------|
| 162 | GET /api/validate/[slug] - metadata | HIGH | ✅ Done |
| 163 | POST /api/validate/[slug]/start | HIGH | ✅ Done |
| 164 | POST /api/validate/[slug]/responses | HIGH | ✅ Done |
| 165 | POST /api/validate/[slug]/complete | HIGH | ✅ Done |

---

## Phase 3: Founder API Routes

| ID | Task | Priority | Status |
|----|------|----------|--------|
| 166 | GET/PATCH /personas/[id]/validation-link | HIGH | ✅ Done |
| 167 | GET /personas/[id]/validation-responses | HIGH | ✅ Done |
| 168 | Validation sessions API | MEDIUM | ✅ Done |

---

## Phase 4: UI Components

### P4.1-P4.4 Validation Page
| ID | Task | Priority | Status |
|----|------|----------|--------|
| 169 | Create validation page server component | HIGH | ✅ Done |
| 170 | useValidationProgress hook (localStorage) | HIGH | ✅ Done |
| 171 | ValidationPage client component | HIGH | ✅ Done |
| 172 | ValidationComplete component | MEDIUM | ✅ Done |

### P5.1-P5.4 Founder Dashboard
| ID | Task | Priority | Status |
|----|------|----------|--------|
| 173 | ValidationShareButton + modal | HIGH | ✅ Done |
| 174 | ByQuestionView component | HIGH | 🚀 In Progress |
| 175 | BySessionView component | HIGH | 🚀 In Progress |
| 176 | Founder validation dashboard page | HIGH | ✅ Done |

---

## Phase 6: Integration

| ID | Task | Priority | Status |
|----|------|----------|--------|
| 177 | Add share button to PersonaCard | HIGH | ✅ Done |
| 178 | Add navigation to dashboard | MEDIUM | ✅ Done |
| 179 | Edge cases & error states | MEDIUM | 🚀 In Progress |
| 180 | Mobile responsive validation | LOW | Pending |

---

## Critical Path

\`\`\`
P1.1 (Models) → P1.2-P1.4 (Utils/Types)
       ↓
P2.1-P2.4 (Public API)
       ↓
P4.1-P4.4 (Validation UI)
       ↓
P3.1-P3.3 (Founder API)
       ↓
P5.1-P5.4 (Dashboard)
       ↓
P6.1-P6.4 (Integration)
\`\`\`

---

## Summary

| Phase | Tasks | HIGH | Status |
|-------|-------|------|--------|
| Phase 1: Foundation | 8 | 6 | ✅ Complete |
| Phase 2: Public API | 4 | 4 | ✅ Complete |
| Phase 3: Founder API | 3 | 2 | ✅ Complete |
| Phase 4: Validation UI | 4 | 3 | ✅ Complete |
| Phase 5: Dashboard | 4 | 3 | 🚀 In Progress |
| Phase 6: Integration | 4 | 2 | 🚀 In Progress |
| **Total** | **27** | **20** | |`
  }
};

// ============================================================================
// DOCUMENT GROUPS
// Multi-variant document system for comparing different scenarios
// ============================================================================

export type DocumentGroupId = 'ideation' | 'spec' | 'decomposed';

export interface DocumentGroup {
  id: DocumentGroupId;
  variants: {
    id: string;
    tabLabel: string;
    tabSubLabel: string;
    document: DocumentMeta;
  }[];
}

export const DOCUMENT_GROUPS: Record<DocumentGroupId, DocumentGroup> = {
  'ideation': {
    id: 'ideation',
    variants: [
      {
        id: 'greenfield',
        tabLabel: 'NEW APPLICATION FROM SCRATCH',
        tabSubLabel: 'Smart Capture SDK',
        document: DOCUMENTS['spec-ideate-output'],
      },
      {
        id: 'existing',
        tabLabel: 'NEW FEATURE, EXISTING CODEBASE',
        tabSubLabel: 'Validation Sharing System',
        document: DOCUMENTS['spec-ideate-output-validation'],
      },
    ],
  },
  'spec': {
    id: 'spec',
    variants: [
      {
        id: 'greenfield',
        tabLabel: 'NEW APPLICATION FROM SCRATCH',
        tabSubLabel: 'Smart Capture SDK',
        document: DOCUMENTS['spec-full-example'],
      },
      {
        id: 'existing',
        tabLabel: 'NEW FEATURE, EXISTING CODEBASE',
        tabSubLabel: 'Validation Mode',
        document: DOCUMENTS['spec-full-example-validation'],
      },
    ],
  },
  'decomposed': {
    id: 'decomposed',
    variants: [
      {
        id: 'greenfield',
        tabLabel: 'NEW APPLICATION FROM SCRATCH',
        tabSubLabel: 'Smart Capture SDK',
        document: DOCUMENTS['spec-decomposed'],
      },
      {
        id: 'existing',
        tabLabel: 'NEW FEATURE, EXISTING CODEBASE',
        tabSubLabel: 'Validation Sharing',
        document: DOCUMENTS['spec-decomposed-validation'],
      },
    ],
  },
};

// Map documentIds to their groups for lookup
export const DOCUMENT_TO_GROUP: Record<string, DocumentGroupId> = {
  'spec-ideate-output': 'ideation',
  'spec-ideate-output-validation': 'ideation',
  'spec-full-example': 'spec',
  'spec-full-example-validation': 'spec',
  'spec-decomposed': 'decomposed',
  'spec-decomposed-validation': 'decomposed',
};
