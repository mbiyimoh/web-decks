# Persona Sharpener Validation Sharing System

**Slug:** persona-sharpener-validation-sharing
**Author:** Claude Code
**Date:** 2026-01-09
**Branch:** preflight/persona-sharpener-validation-sharing
**Related:**
- `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-handoff.md`
- Cross-project reference: Document sharing system architecture summary provided by user

---

## 1) Intent & Assumptions

**Task Brief:**
Enable founders to share validation links with real potential customers who can complete the persona sharpener questionnaire without needing accounts. Their responses are tagged as "validations" and compared against the founder's original "assumptions" to calculate per-field alignment scores, helping founders see where their mental model matches reality and where it needs adjustment.

**Assumptions:**
- Founders have already completed Mode 1 (Sharpen) and have assumption-tagged responses
- Validators do not need 33 Strategies accounts to complete the questionnaire
- The existing 19-question bank has dual framing (`question` for founders, `validationQuestion` for validators)
- Questions with `validationQuestion: null` (e.g., "not-customer") are skipped in validation mode
- Multiple validators can respond to the same link
- Alignment scoring compares founder assumptions against validator consensus

**Out of Scope:**
- Incentive/reward systems for validators
- Automated follow-up email sequences
- Real-time notifications when validators complete
- Voice input for validation mode (text only for MVP)
- Custom branding of validation pages per founder
- Integration with external survey tools
- A/B testing different question framings

---

## 2) Pre-reading Log

| File | Takeaway |
|------|----------|
| `docs/clarity-canvas/.../persona-sharpener-handoff.md` | Comprehensive spec for three-mode system (Sharpen→Validate→Reconcile). Defines `ValidationLink` schema, Response tagging, alignment calculation algorithm, and API endpoints. Implementation Phases 1-4 outlined. |
| `prisma/schema.prisma` | Current models: `Persona`, `Response`, `SharpenerSession`. Response has `responseType` and `respondentRole` fields ready for validation tagging. No `ValidationLink` model yet. |
| `lib/.../persona-sharpener/types.ts` | `Question` interface includes `validationQuestion: string \| null`. `ResponseInput` includes all needed fields. Need to add validation-specific types. |
| `lib/.../persona-sharpener/questions.ts` | All 19 questions have dual framing. `not-customer` has `validationQuestion: null`. Questions export both bank and sequence. |
| `lib/.../persona-sharpener/scoring.ts` | Clarity calculation exists. Need to add alignment calculation for assumption vs validation comparison. |
| `docs/developer-guides/openai-structured-outputs-gotchas.md` | Important: If using OpenAI for any analysis of validation data, use `.nullable()` not `.optional()` in Zod schemas. |
| `CLAUDE.md` | Auth pattern uses iron-session for client portals, NextAuth for team. Validation pages need new auth pattern (anonymous/email-only). |
| Cross-project summary (user-provided) | Comprehensive architecture from document sharing system: `ShareLink` model, `Conversation/AccessLog` patterns, slug generation, verify-then-create flow, atomic counters. |

---

## 3) Codebase Map

### Primary Components/Modules

| Path | Role |
|------|------|
| `app/clarity-canvas/modules/persona-sharpener/` | Main module directory - page, session, client components |
| `app/clarity-canvas/modules/persona-sharpener/PersonaSharpenerSession.tsx` | Questionnaire engine - will need validation-mode variant |
| `app/api/clarity-canvas/modules/persona-sharpener/` | API routes for personas, responses, sessions |
| `lib/clarity-canvas/modules/persona-sharpener/questions.ts` | Question bank with dual framing |
| `lib/clarity-canvas/modules/persona-sharpener/scoring.ts` | Scoring utilities - needs alignment calculation |
| `lib/clarity-canvas/modules/persona-sharpener/types.ts` | Type definitions - needs validation types |
| `prisma/schema.prisma` | Database schema - needs ValidationLink model |

### Shared Dependencies

| Dependency | Usage |
|------------|-------|
| `lib/user-sync.ts` | `ensureUserFromUnifiedSession()` - founder auth for creating links |
| `lib/session.ts` | iron-session config - may need variant for validation sessions |
| `lib/prisma.ts` | Prisma client singleton |
| `components/portal/design-tokens.ts` | Design tokens for alignment score visualization |

### Data Flow

```
Founder creates validation link → ValidationLink record created
                                       ↓
                              Shareable URL: /validate/:slug
                                       ↓
Validator accesses URL → Fetch link metadata → Create ValidationSession
                                       ↓
                              Answer questions (using validationQuestion text)
                                       ↓
                              Submit responses (tagged as 'validation')
                                       ↓
                              Update link counter + session status
                                       ↓
Founder views Reconcile UI → Fetch FieldAggregates → Calculate alignment scores
                                       ↓
                              Display assumption vs validation comparison
```

### Feature Flags/Config

- None currently - may want feature flag for validation system rollout
- Environment: Public validation pages need no auth secrets

### Potential Blast Radius

| Area | Impact |
|------|--------|
| `Response` model | Add new `responseType: 'validation'` values |
| `SharpenerSession` model | Add new `sessionType: 'validate'` type |
| `Persona` model | Add `validationStats` JSON field |
| Question rendering | Need validation-mode UI that uses `validationQuestion` |
| Scoring utilities | Add alignment calculation functions |
| API routes | New routes for validation links and public responses |
| Middleware | Public routes need to bypass auth checks |

---

## 4) Root Cause Analysis

*N/A - This is a new feature, not a bug fix.*

---

## 5) Research

### Potential Solutions

#### Solution 1: Minimal In-App Validation (Recommended for MVP)

**Description:** Build validation directly into the existing persona sharpener, adding ValidationLink model and public validation page that reuses existing question components.

**Pros:**
- Reuses existing question rendering components
- Consistent UX between founder and validator experience
- Simpler to maintain - one question bank, one set of components
- Faster implementation - ~2-3 weeks

**Cons:**
- Less flexibility for custom validator experiences
- Validation page inherits any UX quirks from founder experience
- May need to fork components for mode-specific behavior

#### Solution 2: Standalone Validation Survey

**Description:** Build completely separate validation survey using generic survey components, mapping results back to persona fields.

**Pros:**
- Maximum flexibility for validator UX
- Can optimize for conversion/completion rates independently
- Easier to A/B test different approaches

**Cons:**
- Duplicate effort maintaining two question sets
- Risk of drift between founder and validator questions
- Longer implementation time (~4-5 weeks)
- More complex field mapping logic

#### Solution 3: Third-Party Survey Integration

**Description:** Use Typeform/SurveyMonkey for validation, integrate via webhooks to import responses.

**Pros:**
- Polished, proven UX for respondents
- Built-in analytics
- No need to build public validation infrastructure

**Cons:**
- Cost ($35-100/month for needed features)
- Less control over experience
- Complex data mapping
- Dependency on external service
- Privacy/data residency concerns

### Recommendation

**Solution 1 (Minimal In-App Validation)** is recommended for MVP:

1. Leverages existing investment in question components
2. Maintains consistency between founder assumptions and validator responses
3. All data stays in your database
4. Can always enhance later with more custom validator UX

### Implementation Architecture (From Cross-Project Reference)

The document sharing system provides excellent patterns to adapt:

**Database Models:**
```prisma
model ValidationLink {
  id              String    @id @default(cuid())
  personaId       String
  persona         Persona   @relation(fields: [personaId])
  createdBy       String    // Founder user ID

  slug            String    @unique  // 16 hex chars or custom 3-50 chars
  name            String?             // "Q1 Customer Validation"

  // Access Control
  accessType      AccessType @default(OPEN)  // OPEN | EMAIL_REQUIRED | PASSWORD
  passwordHash    String?                     // bcrypt if PASSWORD type

  // Lifecycle
  isActive        Boolean   @default(true)
  expiresAt       DateTime?
  maxResponses    Int?
  totalResponses  Int       @default(0)

  sessions        ValidationSession[]
  accessLogs      ValidationAccessLog[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([personaId])
}

model ValidationSession {
  id                String    @id @default(cuid())
  validationLinkId  String
  validationLink    ValidationLink @relation(fields: [validationLinkId])
  personaId         String

  respondentEmail   String?
  respondentName    String?

  status            String    @default("in_progress")  // in_progress | completed | abandoned
  questionsAnswered Int       @default(0)

  responses         Response[]

  startedAt         DateTime  @default(now())
  completedAt       DateTime?

  @@index([validationLinkId])
  @@index([personaId])
}

model ValidationAccessLog {
  id              String    @id @default(cuid())
  validationLinkId String
  validationLink  ValidationLink @relation(fields: [validationLinkId])

  viewerEmail     String?
  viewerIp        String?
  userAgent       String?
  accessGranted   Boolean
  denialReason    String?   // INACTIVE | EXPIRED | MAX_RESPONSES | INVALID_PASSWORD

  accessedAt      DateTime  @default(now())

  @@index([validationLinkId])
}

enum AccessType {
  OPEN            // Anyone with link can access
  EMAIL_REQUIRED  // Must provide email before starting
  PASSWORD        // Must know password
}
```

**API Flow:**
```
GET  /api/validate/:slug              → Fetch link metadata (public)
POST /api/validate/:slug/verify       → Verify access, create session
POST /api/validate/:slug/responses    → Submit responses with sessionId
POST /api/validate/:slug/complete     → Mark session complete

GET  /api/personas/:id/validation-links     → List links for persona (auth required)
POST /api/personas/:id/validation-links     → Create link (auth required)
PATCH /api/validation-links/:id             → Update link (auth required)
DELETE /api/validation-links/:id            → Delete link (auth required)

GET  /api/personas/:id/field-aggregates     → Alignment scores (auth required)
```

**Alignment Scoring Algorithm:**

```typescript
function calculateAlignment(field: string, responses: Response[]): AlignmentResult {
  const assumptions = responses.filter(r => r.responseType === 'assumption');
  const validations = responses.filter(r => r.responseType === 'validation');

  if (assumptions.length === 0 || validations.length === 0) {
    return { score: null, canCalculate: false, reason: 'Missing data' };
  }

  const assumedValue = assumptions[0].value;
  const question = getQuestionById(assumptions[0].questionId);

  // Different calculation based on question type
  switch (question.type) {
    case 'this-or-that':
      // Exact match percentage
      const matches = validations.filter(v => v.value === assumedValue);
      return { score: Math.round((matches.length / validations.length) * 100) };

    case 'slider':
      // Within 20 points = aligned
      const numericAssumed = Number(assumedValue);
      const alignedValidations = validations.filter(v =>
        Math.abs(Number(v.value) - numericAssumed) <= 20
      );
      return { score: Math.round((alignedValidations.length / validations.length) * 100) };

    case 'ranking':
      // Top 3 overlap with weighting (1st=3pts, 2nd=2pts, 3rd=1pt)
      return calculateRankingAlignment(assumedValue, validations.map(v => v.value));

    case 'multi-select':
      // Jaccard index (intersection / union)
      return calculateJaccardAlignment(assumedValue as string[], validations);

    case 'scenario':
    case 'fill-blank':
      // Semantic similarity (future: use embeddings)
      // MVP: Just count validations received
      return { score: null, validationCount: validations.length };
  }
}
```

---

## 6) Clarifications

### Questions for User Decision

1. **Access Control Default**
   - Should validation links be OPEN by default, or should founders be prompted to choose?
   - Recommendation: Default OPEN for maximum conversion, with easy toggle to add email requirement
   >> go with your recommendation

2. **Email Collection Timing**
   - Collect email at START of validation (gate access) or END (optional thank you)?
   - Recommendation: Optional at end - reduces friction, still enables follow-up
   >> go with your recommendation. And make sure that experience at the end is thoughtful in terms of asking for the email, but putting it in context of something like, "we'd love to gather more feedback from you in the future / have you as a beta tester."

3. **Link Expiration Default**
   - Should links expire by default? If so, after how many days?
   - Recommendation: No expiration by default, but show option. When set, suggest 7/14/30 days.
   >> go with your recommendation
   

4. **Max Responses Cap**
   - Should there be a maximum responses limit?
   - Recommendation: No default cap, but show option. Useful for limiting free-tier usage.
   >> go with your recommendation

5. **Validator Progress Saving**
   - Should validators be able to save progress and resume later?
   - Recommendation: No for MVP - keep it simple, design for completion in one session. Add later if completion rates are low.
   >> yes, but only with local storage so that they dont have to authenticate in any way and we don't have to store anything for them until they've actually submitted a completed questionnaire. so if they close that browser or whatever and we cant preserve the session through that, no problem

6. **Validation Thank You Experience**
   - What should validators see after completing?
   - Options:
     a) Simple thank you + close
     b) Show aggregate stats ("You're the 5th person to respond")
     c) Show how their answers compared (risk: biasing future validators)
   - Recommendation: (a) for MVP, (b) as enhancement
   option a with the additions I mentioned in #2

7. **Reconciliation Threshold**
   - What alignment percentage triggers "needs review" flag?
   - Current handoff doc suggests 70%
   - Recommendation: Keep 70%, with visual color coding (green ≥70%, yellow 50-69%, red <50%)
   rather than trying to analyze stuff ourselves, it would be better to just give the founder an experience where they see all of their assumption vs real user reality comparisons, both where the founders instincts were spot on and where they were not quite right. this experienmce may require some design though, so lets scaffold it here but not implement it — for now, lets just build the functionality that will enable people to go through the questionnaire and submit it somewhere where the founder can then go see their responses (no comparison analysis stuff implmeneted in this spec, just outlined for implementaion AFTER we get the core functionlaity in place)

8. **Multiple Links Per Persona**
   - Can founders create multiple validation links for the same persona?
   - Use case: Different cohorts, different time periods
   - Recommendation: Yes, allow multiple links with naming
   >> not for MVP. one link per persona so that all feedback is aggregated in one place for that persona

9. **Validation Notifications**
   - Should founders be notified when validators complete?
   - Recommendation: Out of scope for MVP, add email digest later
   >> out of scope for mvp

10. **Anti-Pattern Question Handling**
    - `not-customer` question has `validationQuestion: null`
    - Should it be shown at all in validation mode? Or hidden entirely?
    - Recommendation: Hide entirely in validation mode (already designed this way per handoff doc)
    >> go with your recommendation

---

## 7) Proposed Implementation Phases

### Phase 1: Database & API Foundation (Week 1)

- [ ] Add `ValidationLink`, `ValidationSession`, `ValidationAccessLog` models to Prisma
- [ ] Add `validationStats` JSON field to Persona model
- [ ] Create migration and run `prisma migrate dev`
- [ ] Implement API routes:
  - `POST /api/personas/:id/validation-links` (create link)
  - `GET /api/personas/:id/validation-links` (list links)
  - `PATCH/DELETE /api/validation-links/:id` (manage links)
- [ ] Add slug generation utility (16 hex chars + custom slug validation)

### Phase 2: Public Validation Page (Week 2)

- [ ] Create `/validate/[slug]/page.tsx` route
- [ ] Implement access verification flow (check link status, handle access types)
- [ ] Create `ValidationQuestionnaire.tsx` component:
  - Reuse existing question components
  - Use `validationQuestion` text instead of `question`
  - Filter out questions with `validationQuestion: null`
  - Remove "I'm not sure" checkbox (validators know themselves)
  - Keep confidence slider + optional context
- [ ] Implement response submission API:
  - Tag as `responseType: 'validation'`, `respondentRole: 'real-user'`
  - Link to ValidationSession
- [ ] Create thank you / completion page
- [ ] Add middleware exception for `/validate/*` routes (public access)

### Phase 3: Founder Link Management UI (Week 3)

- [ ] Add "Share for Validation" button to PersonaCard
- [ ] Create `ValidationLinkModal.tsx`:
  - Generate link with one click
  - Copy link to clipboard
  - Configure: name, access type, expiration, max responses
- [ ] Create `ValidationLinksList.tsx`:
  - Show all links for persona
  - Display: name, slug, response count, status, created date
  - Actions: copy link, edit settings, deactivate, delete
- [ ] Add link management to Persona details page

### Phase 4: Alignment Scoring & Reconciliation (Week 4)

- [ ] Implement `calculateAlignment()` for each question type
- [ ] Create `getFieldAggregates()` function:
  - Group responses by field
  - Calculate alignment scores
  - Identify fields needing review (<70%)
- [ ] Add alignment API endpoint: `GET /api/personas/:id/field-aggregates`
- [ ] Create `ReconciliationView.tsx`:
  - Per-field cards showing assumption vs validation comparison
  - Color-coded alignment scores
  - Drill-down to see individual responses
  - "Accept validation consensus" action

### Phase 5: Polish & Edge Cases (Week 5)

- [ ] Handle edge cases:
  - Link accessed after expiration
  - Max responses reached
  - Validator abandons mid-session
  - No validations yet (empty reconciliation view)
- [ ] Add loading states and error handling
- [ ] Mobile-responsive validation page
- [ ] Analytics tracking (validation link views, completion rates)
- [ ] Update Persona clarity display to show validation status

---

## 8) Technical Decisions

### Slug Generation

Use crypto.randomBytes for security, with collision retry:

```typescript
import crypto from 'crypto';

async function generateSlug(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const slug = crypto.randomBytes(8).toString('hex'); // 16 chars
    const exists = await prisma.validationLink.findUnique({ where: { slug } });
    if (!exists) return slug;
  }
  throw new Error('Failed to generate unique slug after 10 attempts');
}
```

### Public Route Authentication

Validation pages (`/validate/*`) need to bypass auth. Options:

1. **Middleware exception** - Add path check in `middleware.ts`
2. **No auth on API routes** - Check for public endpoints in route handlers
3. **Separate route group** - Use Next.js route groups with different layouts

Recommendation: Option 1 (middleware exception) for simplicity.

### Session ID as Auth Token

For validation sessions, the sessionId serves as the "auth token":
- Created on first access via `/api/validate/:slug/verify`
- Passed with every response submission
- No cookies needed for validators (stateless)

### Response Tagging

Existing Response model already has:
- `responseType: String` - Currently stores 'assumption', will add 'validation'
- `respondentRole: String` - Currently stores 'founder', will add 'real-user'
- `respondentId: String` - For validation, store sessionId (not userId)

---

## 9) Open Questions for Future Consideration

1. **Semantic similarity for open-ended questions** - Use embeddings to calculate alignment?
2. **Weighted alignment** - Some questions more important than others?
3. **Validator demographics** - Should we capture more about who's validating?
4. **Cohort analysis** - Compare validation results across different link cohorts?
5. **Time-based analysis** - Do validation responses change over time?
6. **Suggested persona updates** - AI-generated suggestions based on validation data?

---

## 10) Success Metrics

- **Adoption:** % of completed personas that generate validation links
- **Completion:** % of validation sessions completed (vs. started)
- **Quality:** Average number of validations per persona
- **Insight:** % of personas with at least one field <70% alignment
- **Action:** % of founders who update personas after reconciliation
