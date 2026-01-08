# Clarity Canvas Integration: Core Builder Experience

**Slug:** clarity-canvas-integration
**Author:** Claude Code
**Date:** 2025-01-04
**Branch:** feature/clarity-canvas
**Related:** docs/clarity-canvas/clarity-canvas-handoff.md, docs/clarity-canvas/research-to-recommendations.md

---

## 1) Intent & Assumptions

### Task Brief
Implement the core Clarity Canvas experience as part of the 33 Strategies website. This is a multi-modal context extraction system that builds rich user profiles through voice/text brain dumps, interactive questionnaires, web research enrichment, and ongoing refinement. The Clarity Canvas will serve as the foundational "artifact" that encapsulates a user's personal and business context, ultimately following them across all 33 Strategies products and services.

### Assumptions
- The initial implementation focuses on the **core builder experience** (Phases 1-4 from the handoff): Welcome → Brain Dump → Initial Profile → Interview → Enriched Profile
- Research Accelerant (Phase 5) and Deep Exploration (Phase 6) are **future enhancements**, not MVP scope
- The cross-product integration vision (Better Contacts, document sharing tools) is **future scope** - we're building the foundational profile system that will later integrate
- Users will access Clarity Canvas via the learning platform authentication (NextAuth with Google OAuth for @33strategies.ai domain users initially)
- Voice input will require modern browser support (Chrome, Edge, Safari - no IE11)
- PostgreSQL database (via Supabase) will be the persistence layer
- This builds on the existing design system (33 Strategies gold accent, dark editorial aesthetic)

### Out of Scope (for initial implementation)
- Research Accelerant web scraping/auto-fill functionality
- Deep exploration 4-level drill-down interface
- Cross-product profile sharing/sync
- Public API for external integrations
- Mobile native apps (web responsive only)
- Real-time collaboration on profiles
- Profile versioning/history beyond basic timestamps
- Export to PDF/external formats

---

## 2) Pre-reading Log

| File | Key Takeaway |
|------|--------------|
| `docs/clarity-canvas/clarity-canvas-handoff.md` | Complete technical specification with 6 phases, Prisma schemas, API endpoints, component specs, and 42-70 hour estimate. 60% infrastructure reuse potential from a "Better Connections" codebase (not in this repo). |
| `docs/clarity-canvas/clarity-canvas-complete.jsx` | Full frontend prototype (988 lines) covering Welcome → Brain Dump → Recording → Processing → Initial Profile → Interview (8 questions) → Enriched Profile. Uses inline styles matching 33S design system. |
| `docs/clarity-canvas/living-profile-canvas.jsx` | Deep exploration prototype (427 lines) showing 4-level drill-down: sections → subsections → fields → expanded field detail with source attribution. |
| `docs/clarity-canvas/research-accelerant.jsx` | Research findings approval flow prototype (932 lines) with intro screen, running animation, finding cards (approve/skip), and completion celebration. |
| `docs/clarity-canvas/research-to-recommendations.md` | Technical reference for research → recommendations → apply workflow. Details Inngest background jobs, Tavily API integration, GPT-4o structured outputs, polling patterns, and error handling. |
| `lib/auth.ts` | NextAuth v5 configuration with Google OAuth + credentials providers. Domain restriction via `isEmailAllowed()`. JWT + session callbacks for user.id persistence. |
| `lib/progress.ts` | localStorage-based progress tracking pattern. Simple `{ completed: [] }` structure. Client-side only - not sufficient for profile persistence. |
| `lib/courses.ts` | Hierarchical data structure pattern (courses → modules). Good model for profile sections → subsections → fields. |
| `components/deck/` | Shared deck components: Section, RevealText, SectionLabel, Card, CodeBlock, ProgressBar, NavDots. Animation patterns via Framer Motion. |
| `docs/developer-guides/learning-module-components.md` | Component API reference, design tokens, responsive typography scaling. Informs Clarity Canvas UI implementation. |

---

## 3) Codebase Map

### Primary Components/Modules

| Area | Files | Role |
|------|-------|------|
| **Authentication** | `lib/auth.ts`, `lib/auth-types.ts`, `lib/email-allowlist.ts` | NextAuth v5 config, type extensions, domain validation |
| **Session (portals)** | `lib/session.ts`, `app/api/client-auth/[client]/route.ts` | Iron-session pattern for client portal auth |
| **Deck Components** | `components/deck/*.tsx` | Shared UI primitives: Section, RevealText, Card, etc. |
| **Learning Platform** | `app/learning/**`, `lib/courses.ts`, `lib/progress.ts` | Course registry, module structure, progress tracking |
| **API Routes** | `app/api/auth/`, `app/api/client-auth/`, `app/api/health/` | Existing API patterns |

### Shared Dependencies

| Dependency | Used For |
|------------|----------|
| `framer-motion` | Animations (fadeInUp, staggerChildren, etc.) |
| `next-auth` | Google OAuth + credential auth |
| `iron-session` | Cookie-based portal sessions |
| `tailwindcss` | Utility-first styling |
| Google Fonts | Instrument Serif, DM Sans, JetBrains Mono |

### Data Flow (for Clarity Canvas)

```
Voice/Text Input
      ↓
Browser Audio API → POST /api/clarity-canvas/brain-dump
      ↓
OpenAI Whisper (transcription) → GPT-4o-mini (extraction)
      ↓
Field Router (chunk → section/subsection/field mapping)
      ↓
Prisma: ClarityProfile + ProfileSection + ProfileField
      ↓
Score Calculation → Profile Visualization (orbital/list)
      ↓
Interview Questions → POST /api/clarity-canvas/question-response
      ↓
Field Updates + Score Recalculation → Enriched Profile Display
```

### Feature Flags/Config
- None currently implemented
- Recommend: `ENABLE_CLARITY_CANVAS=true` feature flag for staged rollout

### Potential Blast Radius

| Area | Impact |
|------|--------|
| **New database requirement** | Major - requires Prisma setup, PostgreSQL provisioning |
| **New AI dependencies** | Major - OpenAI API key, Vercel AI SDK installation |
| **NextAuth integration** | Minor - extends existing session with profile data |
| **Shared components** | Minor - may add new deck components, shouldn't break existing |
| **Deployment** | Minor - new environment variables, same Railway setup |

---

## 4) Root Cause Analysis

*Not applicable - this is a new feature implementation, not a bug fix.*

---

## 5) Research Findings

### Potential Approaches

#### Approach A: Full Handoff Implementation (As-Specified)
**Description:** Implement the complete Clarity Canvas as specified in the handoff document, including all 6 phases, full Prisma schema, Inngest background jobs, and research integration.

**Pros:**
- Complete vision realized
- All features available
- Matches existing prototype fidelity

**Cons:**
- 42-70 hour estimate (5+ weeks)
- Requires Inngest setup (new infrastructure)
- Research integration adds API costs
- Complex state management

#### Approach B: Phased MVP (Recommended)
**Description:** Implement core profile builder (Phases 1-4) first, defer research accelerant and deep exploration to future releases.

**Pros:**
- Ships usable value in ~2-3 weeks
- Lower initial complexity
- Can validate core UX before building advanced features
- Avoids Inngest dependency initially

**Cons:**
- Research enrichment deferred
- Deep exploration deferred
- May need refactoring when adding deferred features

#### Approach C: Minimal Viable Profile
**Description:** Skip voice input entirely, implement text-only questionnaire with simple profile storage.

**Pros:**
- Fastest to ship (~1 week)
- No audio API complexity
- Simplest state management

**Cons:**
- Loses signature "brain dump" experience
- Less differentiated product
- May feel like generic form wizard
- Misses key UX innovation

### External Research Findings

#### Voice Input in Web Applications
- **Web Speech API** (built-in): Limited browser support, inconsistent quality
- **react-speech-recognition** (wrapper): Simplifies Web Speech API usage
- **OpenAI Whisper API**: High quality, reliable, but adds latency and cost
- **Deepgram/AssemblyAI**: Real-time transcription alternatives

**Recommendation:** Start with `react-speech-recognition` for live feedback during recording, send audio blob to OpenAI Whisper for final high-quality transcription.

#### Profile Visualization Patterns
- **Orbital/radial views**: Novel but can be overwhelming; works well for 6-8 items
- **List/card views**: More accessible, better for mobile
- **Toggle between both**: Best of both worlds (as specified in handoff)

**Recommendation:** Implement both views with toggle, default to list view on mobile.

#### Structured Output with LLMs
- **Vercel AI SDK `generateObject()`**: Clean Zod integration, streaming support
- **OpenAI function calling**: Direct but more verbose
- **Instructor pattern**: Python-popular, less common in TS

**Recommendation:** Use Vercel AI SDK with Zod schemas for type-safe extraction.

### Technology Recommendations

| Component | Recommendation | Rationale |
|-----------|----------------|-----------|
| **Database** | Supabase PostgreSQL + Prisma | Serverless, Railway compatible, excellent DX |
| **AI Extraction** | GPT-4o-mini via Vercel AI SDK | Cost-effective, fast, structured output support |
| **Voice Capture** | MediaRecorder API + react-speech-recognition | Browser-native, good UX |
| **Transcription** | OpenAI Whisper API | Highest quality, reasonable cost |
| **Background Jobs** | None initially (sync API calls) | Defer Inngest until research phase |
| **State Management** | React useState + Server Components | Keep simple, avoid unnecessary complexity |
| **Animations** | Framer Motion (existing) | Already in use, matches design system |

### Ultimate Recommendation

**Implement Approach B: Phased MVP**

Start with Phases 1-4 (core builder experience):
1. Welcome → Brain Dump → Recording → Processing
2. Initial Profile visualization (orbital + list views)
3. 8-question interview flow with confidence tracking
4. Enriched profile display with score animation

Defer to Phase 2:
- Research Accelerant (requires Tavily, Inngest)
- Deep Exploration (nice-to-have)
- Cross-product integration

This delivers the signature "Clarity Canvas" experience users will remember (voice brain dump → visual profile → interactive sharpening) while keeping scope manageable.

---

## 6) Clarifications — RESOLVED

### 1. User Access Model
**Decision:** All user types from day one — team members, clients, and potential clients. Use the email allowlist for potential clients, converting them to official clients upon contract signing. The client portal already serves "potential clients" so there's no hard delineation in the existing architecture.

**Implementation:** Extend the existing `lib/email-allowlist.ts` to support Clarity Canvas access. Anyone on the allowlist OR with @33strategies.ai domain can access.

### 2. Profile Ownership
**Decision:** Option A — 1:1 with NextAuth user. Must be authenticated to access the experience.

**Implementation:** `ClarityProfile.userId` is unique, foreign key to NextAuth user.id.

### 3. Voice Input Approach
**Decision:** Offer both voice and text, but **lean into voice** with an explicit explanation for users: *"People tend to share way more information and context when braindumping out loud vs. trying to write things."*

**Implementation:** Voice is the primary/recommended path, text is available but secondary. Include UX copy explaining why voice is recommended.

### 4. Data Retention
**Decision:** Indefinite retention. The profile is meant to be continuously refined over time, becoming more valuable and data-rich.

**Implementation:** No auto-deletion. Profile persists until user explicitly requests deletion (future GDPR compliance feature if needed).

### 5. Integration Priority
**Decision:** Research Accelerant is the only integration that belongs directly in the Clarity Canvas experience. Better Contacts and DocShare integrations will be tackled separately in those products' own codebases.

**Implementation:** Build Research Accelerant as Phase 2 of this project. Cross-product integration is out of scope for this codebase.

### 6. Score Visibility
**Decision:** Option A — Prominent gamification. Constantly nudge users to improve scores in their weakest/shallowest profile areas.

**Implementation:** Foundation Score prominently displayed. Section scores visible with color coding. UI calls out lowest-scoring sections as improvement opportunities.

---

## 7) Implementation Phases

### RELEASE 1: Core Builder Experience

#### Phase 1.1: Foundation Infrastructure (Est. 8-12 hours)
- [ ] Set up Prisma with Supabase PostgreSQL
- [ ] Create database schema (ClarityProfile, ProfileSection, ProfileSubsection, ProfileField, FieldSource)
- [ ] Seed initial profile structure (6 sections, subsections, field definitions)
- [ ] Create basic API routes skeleton
- [ ] Wire NextAuth user.id to profile ownership
- [ ] Extend email allowlist to support clients/potential clients access

#### Phase 1.2: Voice Capture & Extraction (Est. 10-14 hours)
- [ ] Implement voice capture component (MediaRecorder + react-speech-recognition)
- [ ] Create waveform visualization with progress indicator
- [ ] Add "why voice is recommended" UX copy
- [ ] Implement text fallback input (available but secondary)
- [ ] Set up OpenAI Whisper integration for transcription
- [ ] Set up GPT-4o-mini extraction with Zod schema
- [ ] Build field router (chunks → profile mapping)
- [ ] Create POST /api/clarity-canvas/brain-dump endpoint

#### Phase 1.3: Profile Visualization (Est. 8-12 hours)
- [ ] Port orbital view from prototype to production React
- [ ] Port list view from prototype
- [ ] Implement view toggle (default to list on mobile)
- [ ] Create score calculation engine
- [ ] Build score color system (gold/green/yellow/orange/red)
- [ ] Add breathing/pulse animations
- [ ] Implement "weakest section" nudge UI

#### Phase 1.4: Interview Flow (Est. 8-12 hours)
- [ ] Build QuestionMetaWrapper component (confidence slider, "not sure" checkbox, additional context)
- [ ] Create question type components (this-or-that, slider, multi-select, scale)
- [ ] Implement question→field mapping logic
- [ ] Create POST /api/clarity-canvas/question-response endpoint
- [ ] Build score animation sequence (before/after reveal)

#### Phase 1.5: Polish & Deploy (Est. 6-10 hours)
- [ ] Mobile responsive adjustments
- [ ] Loading states and error handling
- [ ] Session integration (profile accessible across pages)
- [ ] Deploy to Railway with new environment variables
- [ ] QA and bug fixes

**Release 1 Total: 40-60 hours**

---

### RELEASE 2: Research Accelerant

#### Phase 2.1: Research Infrastructure (Est. 8-12 hours)
- [ ] Set up Tavily API integration for web search
- [ ] Create ResearchRun and Recommendation Prisma models
- [ ] Build research orchestrator (search → synthesis)
- [ ] Set up Inngest for background job processing
- [ ] Create research status polling mechanism

#### Phase 2.2: Recommendation Generation (Est. 6-10 hours)
- [ ] Build GPT-4o recommendation generator with Zod schema
- [ ] Implement recommendation→profile field targeting
- [ ] Create confidence scoring for findings
- [ ] Build recommendation filtering (minimum confidence threshold)

#### Phase 2.3: Findings Review UI (Est. 8-12 hours)
- [ ] Port research intro screen from prototype
- [ ] Build research running animation
- [ ] Create finding card component (approve/skip/edit)
- [ ] Implement live score updates on approval
- [ ] Build research completion celebration

#### Phase 2.4: Apply & Persist (Est. 4-6 hours)
- [ ] Create atomic apply recommendations endpoint
- [ ] Build source attribution (research findings tracked)
- [ ] Implement score recalculation after apply
- [ ] Add "research again" capability for ongoing enrichment

**Release 2 Total: 26-40 hours**

---

### Future Releases (Out of Scope)

#### Release 3: Deep Exploration
- 4-level drill-down (section → subsection → field → expanded)
- Field-level edit capabilities
- Source history viewing
- Insights display per field

#### Release 4+: Cross-Product Integration
- Better Contacts integration (handled in that codebase)
- DocShare integration (handled in that codebase)
- API for external products to read profile context

---

**Combined Estimate (Releases 1+2): 66-100 hours (6-8 weeks)**

---

## 8) Technical Architecture Decisions

### Database Schema (Simplified for MVP)

```prisma
model ClarityProfile {
  id        String   @id @default(cuid())
  userId    String   @unique  // NextAuth user.id
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sections  ProfileSection[]
}

model ProfileSection {
  id         String   @id @default(cuid())
  profileId  String
  key        String   // "individual", "role", etc.
  name       String
  icon       String
  score      Int      @default(0)
  summary    String?

  subsections ProfileSubsection[]
  profile     ClarityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, key])
}

model ProfileSubsection {
  id        String   @id @default(cuid())
  sectionId String
  key       String
  name      String
  score     Int      @default(0)
  summary   String?

  fields    ProfileField[]
  section   ProfileSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@unique([sectionId, key])
}

model ProfileField {
  id          String   @id @default(cuid())
  subsectionId String
  key         String
  name        String
  summary     String?
  fullContext String?  @db.Text
  score       Int      @default(0)
  confidence  Float    @default(1.0)
  flaggedForValidation Boolean @default(false)
  lastUpdated DateTime @default(now())

  sources     FieldSource[]
  subsection  ProfileSubsection @relation(fields: [subsectionId], references: [id], onDelete: Cascade)

  @@unique([subsectionId, key])
}

model FieldSource {
  id           String     @id @default(cuid())
  fieldId      String
  type         SourceType
  rawContent   String     @db.Text
  extractedAt  DateTime   @default(now())
  questionId   String?
  userConfidence Float    @default(1.0)

  field        ProfileField @relation(fields: [fieldId], references: [id], onDelete: Cascade)
}

enum SourceType {
  VOICE
  TEXT
  QUESTION
}
```

### API Route Structure

```
/app/api/clarity-canvas/
├── profile/
│   └── route.ts           # GET current user's profile, POST create new
├── brain-dump/
│   └── route.ts           # POST voice/text input for extraction
├── question-response/
│   └── route.ts           # POST answer to interview question
└── [profileId]/
    └── route.ts           # GET specific profile details
```

### Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Existing (already configured)
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### New Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "ai": "^3.x",
    "zod": "^3.x",
    "react-speech-recognition": "^3.x"
  },
  "devDependencies": {
    "prisma": "^5.x"
  }
}
```

---

## 9) Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Voice API browser incompatibility | Medium | Medium | Offer text fallback, test across browsers |
| OpenAI API rate limits/costs | Low | Medium | Implement rate limiting, monitor usage |
| Profile extraction quality inconsistent | Medium | High | Iterative prompt engineering, user feedback loop |
| Database migration complexity | Low | Medium | Start fresh with clean schema, no legacy data |
| User confusion with orbital visualization | Medium | Low | Default to list view, make toggle obvious |
| Scope creep to research/integration | High | High | Strict phase gates, defer to future releases |

---

## 10) Success Criteria

### Release 1 Success (Core Builder)
- [ ] User can record 30+ second voice brain dump (with text fallback)
- [ ] UX copy explains why voice is recommended
- [ ] System extracts fields into 6-section profile structure
- [ ] Profile displays with orbital and list views (list default on mobile)
- [ ] User completes 8-question interview flow with confidence tracking
- [ ] Scores animate upward after interview
- [ ] "Weakest section" nudge is visible and actionable
- [ ] Profile persists across sessions (authenticated users only)
- [ ] Works for team members, clients, and allowlisted potential clients
- [ ] Works on Chrome, Safari, Edge (desktop + mobile responsive)

### Release 2 Success (Research Accelerant)
- [ ] User can trigger web research from profile view
- [ ] Research runs in background with progress indication
- [ ] Findings display with source attribution and confidence
- [ ] User can approve/skip each finding individually
- [ ] Approved findings merge into profile with score updates
- [ ] "Research again" option available for ongoing enrichment
- [ ] Research sources are tracked in FieldSource model

### Quality Gates (Both Releases)
- [ ] No critical bugs in production
- [ ] < 3 second load time for profile view
- [ ] < 10 second processing time for brain dump extraction
- [ ] < 60 second research execution time (standard depth)
- [ ] All animations smooth (60fps)
- [ ] Accessible keyboard navigation
- [ ] Error states handled gracefully with recovery options
- [ ] API rate limits implemented (OpenAI, Tavily)

---

## Summary of Key Decisions

| Decision | Resolution |
|----------|------------|
| **User access** | All users from day one: team, clients, potential clients via allowlist |
| **Profile ownership** | 1:1 with NextAuth user, authentication required |
| **Voice vs. text** | Both available, voice recommended with explanation of why |
| **Data retention** | Indefinite - profile grows richer over time |
| **Post-core priority** | Research Accelerant (built into this experience) |
| **Score visibility** | Prominent gamification, nudge toward weakest sections |

---

*Document version: 1.1*
*Last updated: 2025-01-04*
*Status: Clarifications resolved, ready for specification*
