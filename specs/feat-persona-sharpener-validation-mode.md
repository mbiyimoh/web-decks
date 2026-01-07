# Persona Sharpener: Validation Mode (Post-V1)

> **Status:** Proto-Spec (Implement after V1 core is tested)
> **Depends On:** `feat-persona-sharpener-module.md` (V1)
> **Author:** Claude (AI Assistant)
> **Created:** 2025-01-04

---

## Overview

This proto-spec covers the validation and reconciliation features deferred from the V1 Persona Sharpener implementation. These features allow founders to share validation links with real users, compare assumptions against validations, and reconcile differences.

**Implement this immediately after V1 core experience is tested and working.**

---

## Scope

### In Scope
- Validation link generation and management
- Public validation page (no auth required)
- Real user response collection
- Assumption vs. validation comparison (reconciliation view)
- Alignment scoring between founder assumptions and user validations
- Additional database fields for validation tracking

### Out of Scope (Future)
- Multiple validation cohorts/segments
- A/B testing different persona hypotheses
- Statistical significance calculations
- Automated persona refinement suggestions

---

## Database Additions

### New Model: ValidationLink

```prisma
model ValidationLink {
  id          String   @id @default(cuid())
  personaId   String
  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  slug        String   @unique // Short URL-safe identifier (e.g., "abc123")

  // Creator
  createdById String   // Founder's user ID

  // Link settings
  expiresAt    DateTime?
  maxResponses Int?     // Optional cap on responses

  // Analytics
  totalClicks      Int @default(0)
  totalCompletions Int @default(0)

  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())

  @@index([personaId])
  @@index([slug])
}
```

### Updated Model: Persona

Add to existing Persona model:

```prisma
model Persona {
  // ... existing fields ...

  // Add validation tracking
  totalValidations   Int @default(0)  // Count of validation responses

  // Add relation
  validationLinks ValidationLink[]
}
```

### Updated Model: Response

Add to existing Response model:

```prisma
model Response {
  // ... existing fields ...

  // Add for validation mode
  respondentEmail String?  // Optional email for follow-up (validation only)
}
```

---

## Route Structure

```
app/
├── clarity-canvas/
│   └── modules/
│       └── persona-sharpener/
│           └── [personaId]/
│               ├── validate/
│               │   └── page.tsx          # Validation link management
│               └── reconcile/
│                   └── page.tsx          # Assumption vs validation comparison
│
└── validate/
    └── [slug]/
        └── page.tsx                      # PUBLIC - No auth required
```

---

## API Routes

```
app/api/clarity-canvas/modules/persona-sharpener/
├── personas/[personaId]/
│   ├── validation-links/
│   │   └── route.ts                     # GET/POST - Manage validation links
│   └── reconcile/
│       └── route.ts                     # GET - Alignment analysis
│
└── validate/[slug]/
    ├── route.ts                         # GET - Get validation questions
    └── responses/
        └── route.ts                     # POST - Submit validation (no auth)
```

---

## User Stories

### Generating a Validation Link

```
As a founder who has completed persona sharpening,
I want to generate a shareable link for real users,
So that I can validate my assumptions with actual customer feedback.
```

**Acceptance Criteria:**
- [ ] "Generate Validation Link" button on completion screen (now enabled)
- [ ] Link generation creates unique slug (e.g., `validate/abc123`)
- [ ] Optional: Set expiration date
- [ ] Optional: Set max responses
- [ ] Copy link to clipboard functionality
- [ ] Show link analytics (clicks, completions)

### Validation Experience (Public)

```
As a real user receiving a validation link,
I want to answer questions about myself without creating an account,
So that I can help validate the founder's customer assumptions.
```

**Acceptance Criteria:**
- [ ] No authentication required
- [ ] Welcome screen explains purpose ("Help [Company] understand their customers")
- [ ] Questions reworded for user perspective (uses `validationQuestion` field)
- [ ] Confidence slider available but not required
- [ ] Optional email field for follow-up
- [ ] Thank you screen on completion
- [ ] Graceful handling of expired/maxed links

### Reconciliation View

```
As a founder with both assumptions and validations,
I want to compare my assumptions against real user responses,
So that I can identify where my customer understanding is accurate vs. wrong.
```

**Acceptance Criteria:**
- [ ] Side-by-side view: Assumption vs. Validations
- [ ] Alignment percentage per field (what % of validations match assumption)
- [ ] Overall alignment score
- [ ] Highlight fields with low alignment (< 70%)
- [ ] Drill-down to see individual validation responses
- [ ] Flag fields where assumption should be updated

---

## Alignment Scoring Algorithm

```typescript
interface AlignmentResult {
  overall: number;          // 0-100%
  byField: Record<string, {
    assumedValue: unknown;
    validationValues: unknown[];
    matchCount: number;
    totalValidations: number;
    alignmentPercent: number;
    needsReview: boolean;   // true if < 70%
  }>;
}

function calculateAlignment(
  assumptions: Response[],
  validations: Response[]
): AlignmentResult {
  const byField: AlignmentResult['byField'] = {};

  // Group validations by questionId
  const validationsByQuestion = groupBy(validations, 'questionId');

  assumptions.forEach(assumption => {
    const fieldValidations = validationsByQuestion[assumption.questionId] || [];

    if (fieldValidations.length === 0) {
      byField[assumption.questionId] = {
        assumedValue: assumption.value,
        validationValues: [],
        matchCount: 0,
        totalValidations: 0,
        alignmentPercent: 0, // No data
        needsReview: false,
      };
      return;
    }

    const matches = fieldValidations.filter(v =>
      valuesMatch(assumption.value, v.value)
    );

    const alignmentPercent = Math.round(
      (matches.length / fieldValidations.length) * 100
    );

    byField[assumption.questionId] = {
      assumedValue: assumption.value,
      validationValues: fieldValidations.map(v => v.value),
      matchCount: matches.length,
      totalValidations: fieldValidations.length,
      alignmentPercent,
      needsReview: alignmentPercent < 70,
    };
  });

  // Overall is average of fields with validations
  const fieldsWithData = Object.values(byField).filter(f => f.totalValidations > 0);
  const overall = fieldsWithData.length > 0
    ? Math.round(fieldsWithData.reduce((sum, f) => sum + f.alignmentPercent, 0) / fieldsWithData.length)
    : 0;

  return { overall, byField };
}

function valuesMatch(assumed: unknown, validated: unknown): boolean {
  // Exact match for primitives
  if (assumed === validated) return true;

  // Array overlap for multi-select
  if (Array.isArray(assumed) && Array.isArray(validated)) {
    return assumed.some(a => validated.includes(a));
  }

  // Ranking: check if top 3 overlap
  if (Array.isArray(assumed) && assumed[0]?.rank !== undefined) {
    const assumedTop3 = assumed.slice(0, 3).map(i => i.id);
    const validatedTop3 = (validated as any[]).slice(0, 3).map(i => i.id);
    return assumedTop3.some(a => validatedTop3.includes(a));
  }

  return false;
}
```

---

## UI Wireframes

### Validation Link Management

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Persona    Validation Links                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Share with Real Users                                     │
│   Validate your assumptions with actual customer feedback   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  https://app.33strategies.ai/validate/abc123        │   │
│   │                                          [Copy 📋]  │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Link Settings                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Expires: Never ▼     Max Responses: Unlimited ▼    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Analytics                                                 │
│   ┌─────────────┬─────────────┬─────────────┐               │
│   │  12 Clicks  │ 8 Started   │ 5 Completed │               │
│   └─────────────┴─────────────┴─────────────┘               │
│                                                             │
│   [Deactivate Link]              [View Reconciliation →]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Reconciliation View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back    Reconciliation    Overall Alignment: 72%    5 validations        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ⚠ 3 fields need review (alignment < 70%)                                  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  AGE RANGE                                        Alignment: 40%    │   │
│   │  ─────────────────────────────────────────────────────────────────  │   │
│   │                                                                     │   │
│   │  Your Assumption          Real User Responses                       │   │
│   │  ┌─────────────────┐      ┌─────────────────────────────────────┐   │   │
│   │  │  35-50          │      │  18-35  ████████████  (3)           │   │   │
│   │  │  (75% confident)│      │  35-50  ████  (1)                   │   │   │
│   │  └─────────────────┘      │  50+    ████  (1)                   │   │   │
│   │                           └─────────────────────────────────────┘   │   │
│   │                                                                     │   │
│   │  [View Details]                              [Update Assumption]    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  LIFESTYLE                                        Alignment: 80%    │   │
│   │  ─────────────────────────────────────────────────────────────────  │   │
│   │  ✓ Matches assumption                                               │   │
│   │  Your Assumption: Busy Professional                                 │   │
│   │  4/5 validations agree                                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ...                                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### Public Validation Page Security

- No authentication required
- Rate limit by IP: 10 responses per hour
- Slug should be unguessable (use `nanoid` with 10 chars)
- Validate link is active and not expired before showing questions
- Don't expose founder name or company details unnecessarily

### Question Rewording

Each question has two versions:
- `question`: Founder-facing ("Your ideal customer is more likely to be...")
- `validationQuestion`: User-facing ("Which age range best describes you?")

If `validationQuestion` is null, skip that question in validation mode.

### Response Tagging

When saving validation responses:
```typescript
{
  responseType: 'validation',
  respondentId: generateAnonymousId(), // Or email hash if provided
  respondentRole: 'real-user',
  respondentName: null,
  respondentEmail: userProvidedEmail || null,
}
```

---

## Migration Path

After V1 is stable:

1. Add Prisma models: `ValidationLink`, update `Persona` and `Response`
2. Run migration: `npx prisma migrate dev --name add_validation_mode`
3. Implement validation link generation API
4. Implement public validation page
5. Implement reconciliation API and view
6. Enable "Generate Validation Link" button (currently placeholder)

---

## Success Metrics

- [ ] Validation links can be generated from completion screen
- [ ] Public validation page works without authentication
- [ ] Responses tagged correctly as 'validation' with 'real-user' role
- [ ] Alignment scores calculate correctly
- [ ] Reconciliation view highlights low-alignment fields
- [ ] Link analytics track clicks and completions

---

## References

- **V1 Spec:** `specs/feat-persona-sharpener-module.md`
- **UI Reference:** `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-details-page.jsx`
- **Handoff:** `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-handoff.md` (Sections on Validation Mode)
