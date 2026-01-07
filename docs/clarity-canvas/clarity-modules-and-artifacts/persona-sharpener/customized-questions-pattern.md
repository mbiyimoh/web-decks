# Persona Sharpener: Customized Questions Pattern

## Overview

The Persona Sharpener module uses a **two-tier question system** to deliver thoughtful, contextualized questions tailored to each persona:

1. **Base Questions** (`questionSequence`) - Static question templates with generic text
2. **Customized Questions** (`QuestionForUI`) - AI-generated contextual versions with skip logic

This guide documents the data flow, critical gotchas, and common mistakes when working with this system.

**When this applies:** Any time you're working with the questionnaire UI, questions API, or brain dump processing in the Persona Sharpener module.

---

## The Two-Tier Question System

### 1. Base Questions (`questionSequence`)

**Location:** `lib/clarity-canvas/modules/persona-sharpener/questions.ts`

**Purpose:** Static question templates that define:
- Question IDs (e.g., `age-range`, `lifestyle`)
- Generic question text
- Field paths (e.g., `demographics.ageRange`)
- Input types (ranking, freetext, multiselect, scale)
- Options/items for multi-choice questions

**Example:**
```typescript
{
  id: 'age-range',
  question: 'What age range does this customer fall into?',
  field: 'demographics.ageRange',
  type: 'ranking',
  options: [
    { label: '18-24', value: '18-24' },
    { label: '25-34', value: '25-34' },
    // ...
  ]
}
```

**Data Type:** `Question` from `questions.ts`

**Key Property:** `.question` (generic text)

### 2. Customized Questions (`QuestionForUI`)

**Location:** `lib/clarity-canvas/modules/persona-sharpener/customized-question-schema.ts`

**Purpose:** AI-generated contextual versions that provide:
- Personalized question text referencing brain dump context
- Skip logic (if high-confidence answer exists from brain dump)
- Confirmation prompts for skipped questions
- Priority ordering based on confidence gaps

**Example:**
```typescript
{
  questionId: 'age-range',
  text: 'Based on your mention of "college students," are you targeting the 18-24 age range?',  // ← Contextualized!
  type: 'ranking',
  field: 'demographics.ageRange',
  isSkipped: false,
  options: ['18-24', '25-34', '35-44', '45-54', '55+'],
  confirmationPrompt: null
}
```

**Data Type:** `QuestionForUI` from `customized-question-schema.ts`

**Key Property:** `.text` (contextualized text)

---

## Data Flow: Brain Dump → Customized Questions

### Step 1: Brain Dump Processing

**File:** `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts`

1. User submits brain dump transcript
2. OpenAI extracts 1-3 personas with structured data
3. For each persona, OpenAI generates customized questions:
   - Contextualizes question text based on what user mentioned
   - Determines if question should be skipped (high-confidence answer exists)
   - Adds confirmation prompts for skipped questions
   - Assigns priority order

**Output:** Stored in `PersonaBrainDump.customizedQuestions` as JSON:

```typescript
{
  [personaId]: {
    personaId: string,
    questions: CustomizedQuestion[],  // AI-generated contextual versions
    totalQuestions: number,
    skippedCount: number,
    estimatedMinutes: number
  }
}
```

### Step 2: Questions API

**File:** `app/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/questions/route.ts`

When UI requests questions for a persona:

1. Load persona with `brainDump` relation
2. Extract `customizedQuestions[personaId]` from brain dump JSON
3. Map `questionSequence` to `QuestionForUI[]`:
   - Use `customized.contextualizedText` for `.text` property
   - Fall back to `baseQuestion.question` if no customization
   - Copy skip logic, confirmation prompts, etc.
4. Sort by priority if customized questions available
5. Return to UI as `QuestionForUI[]`

**Critical Code (line 89):**
```typescript
const uiQuestion: QuestionForUI = {
  questionId: baseQuestion.id,
  text: customized?.contextualizedText || baseQuestion.question,  // ← Use customized text!
  type: baseQuestion.type as 'ranking' | 'freetext' | 'multiselect' | 'scale',
  field: baseQuestion.field,
  isSkipped: customized?.shouldSkip || false,
  skippedValue: customized?.skipReason || undefined,
  confirmationPrompt: customized?.confirmationPrompt || undefined,
};
```

### Step 3: UI Rendering

**File:** `app/clarity-canvas/modules/persona-sharpener/[sessionId]/PersonaSharpenerSession.tsx`

**State Management:**
```typescript
// Holds QuestionForUI[] with .text property
const [customizedQuestions, setCustomizedQuestions] = useState<QuestionForUI[]>([]);

// Compute active questions (non-skipped)
const activeQuestions = customizedQuestions.filter((q) => !q.isSkipped);

// Get current question from active list
const currentCustomizedQuestion = activeQuestions[currentQuestionIndex];

// Also get base question for fallback/reference
const currentQuestion = questionSequence.find(
  (q) => q.id === currentCustomizedQuestion?.questionId
);
```

**Rendering (line 734):**
```tsx
{/* Use contextualized text from customized questions if available */}
{currentCustomizedQuestion?.text || currentQuestion.question}
```

---

## Critical Gotcha: Rendering Question Text

### ❌ WRONG: Rendering Generic Text

```tsx
// This renders the generic base question, NOT the customized version!
{currentQuestion.question}
```

**Why this is wrong:**
- `currentQuestion` comes from `questionSequence` (static base questions)
- `.question` property contains generic text like "What age range does this customer fall into?"
- Ignores all the AI customization that references brain dump context

**Result:** Users see all 18 generic questions instead of thoughtful, personalized questions.

### ✅ CORRECT: Rendering Customized Text

```tsx
// Prefer customized text, fall back to generic if not available
{currentCustomizedQuestion?.text || currentQuestion.question}
```

**Why this is correct:**
- `currentCustomizedQuestion` comes from API response (`QuestionForUI[]`)
- `.text` property contains contextualized text like "Based on your mention of 'college students,' are you targeting the 18-24 age range?"
- Falls back gracefully to generic text for edge cases (manual personas, etc.)

**Result:** Users see AI-customized questions that reference their brain dump.

---

## Common Mistakes & How to Avoid Them

### Mistake 1: Using `currentQuestion.question` Instead of `currentCustomizedQuestion?.text`

**Symptom:** All 18 questions are generic, not personalized.

**Root Cause:** Rendering base question text instead of customized text.

**Fix:** Always check what data source you're rendering from:
- `Question.question` → Generic base text
- `QuestionForUI.text` → Contextualized text

### Mistake 2: Assuming `customizedQuestions` is Always Available

**Symptom:** App crashes or shows blank questions for legacy/manual personas.

**Root Cause:** Manual personas (not from brain dump) won't have customized questions.

**Fix:** Always provide fallback logic:
```typescript
const uiQuestion: QuestionForUI = {
  text: customized?.contextualizedText || baseQuestion.question,
  // ...
};
```

### Mistake 3: Incorrect State Lookups

**Symptom:** Question text doesn't match answer options, or skip logic breaks.

**Root Cause:** Looking up `currentQuestion` from `questionSequence` using wrong index.

**Fix:** Use `questionId` for lookups, not array index:
```typescript
// ❌ WRONG
const currentQuestion = questionSequence[currentQuestionIndex];

// ✅ CORRECT
const currentQuestion = questionSequence.find(
  (q) => q.id === currentCustomizedQuestion?.questionId
);
```

### Mistake 4: Not Handling Missing Brain Dump Relations

**Symptom:** Dev console warnings like "customizedQuestions exists but no entry for personaId".

**Root Cause:** Prisma relation didn't load, or data structure mismatch.

**Fix:** Check all conditions:
```typescript
if (persona.brainDump?.customizedQuestions) {
  const customizedData = persona.brainDump.customizedQuestions as Record<string, any>;

  if (customizedData[personaId]?.questions) {
    customizedQuestions = customizedData[personaId].questions;
  } else if (isDev) {
    console.warn(
      `customizedQuestions exists but no entry for personaId ${personaId}`
    );
  }
}
```

---

## Files Reference

### Core Files

| File | Purpose |
|------|---------|
| `lib/clarity-canvas/modules/persona-sharpener/questions.ts` | Base question templates (`questionSequence`) |
| `lib/clarity-canvas/modules/persona-sharpener/customized-question-schema.ts` | `QuestionForUI` type definition |
| `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts` | Brain dump processing, generates customized questions |
| `app/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/questions/route.ts` | Questions API, maps base → customized |
| `app/clarity-canvas/modules/persona-sharpener/[sessionId]/PersonaSharpenerSession.tsx` | Questionnaire UI component |

### Database Schema

**File:** `prisma/schema.prisma`

```prisma
model PersonaBrainDump {
  id                  String @id @default(cuid())
  customizedQuestions Json   // { [personaId]: CustomizedQuestionsResponse }
  personas            Persona[]
}

model Persona {
  id                   String @id @default(cuid())
  brainDumpId          String?
  brainDump            PersonaBrainDump? @relation(...)
  skippedQuestionIds   String[]  // Questions auto-populated from brain dump
}
```

---

## Debugging Checklist

When customized questions aren't showing:

- [ ] Check UI is rendering `currentCustomizedQuestion?.text` not `currentQuestion.question`
- [ ] Verify Questions API returns `text` property (not just `question`)
- [ ] Check `customizedQuestions` state is populated from API response
- [ ] Verify `PersonaBrainDump.customizedQuestions` JSON has entry for personaId
- [ ] Check Prisma includes `brainDump` relation when loading persona
- [ ] Look for dev console warnings about missing customization data
- [ ] Test with a fresh brain dump to rule out legacy data issues

---

## Testing Strategy

### Manual Testing

1. **Create a new brain dump** with specific context (e.g., "college students")
2. **Verify customization appears** in API response:
   ```bash
   curl http://localhost:3033/api/clarity-canvas/modules/persona-sharpener/personas/{personaId}/questions
   ```
3. **Check UI renders contextualized text** (should reference "college students")
4. **Test skip logic** - skipped questions should show confirmation prompts

### Automated Testing

```typescript
describe('Customized Questions', () => {
  it('should use customized text when available', () => {
    const customized = { text: 'Customized question about college students' };
    const base = { question: 'Generic question' };

    const rendered = customized?.text || base.question;
    expect(rendered).toBe('Customized question about college students');
  });

  it('should fall back to base text when no customization', () => {
    const customized = null;
    const base = { question: 'Generic question' };

    const rendered = customized?.text || base.question;
    expect(rendered).toBe('Generic question');
  });
});
```

---

## Related Documentation

- [OpenAI Structured Outputs Gotchas](../../developer-guides/openai-structured-outputs-gotchas.md) - Schema constraints for brain dump extraction
- [Persona Sharpener Handoff](./persona-sharpener-handoff.md) - Overall module architecture
- [Voice/Text Extraction Pattern](./voice-text-extraction-pattern.md) - Brain dump input processing

---

## Historical Context

**Issue Discovered:** 2025-01-07

**Problem:** Users were seeing all 18 generic questions instead of customized, thoughtful questions generated from brain dump processing.

**Root Cause:** UI component was rendering `currentQuestion.question` (generic base text) instead of `currentCustomizedQuestion?.text` (contextualized text).

**Fix Applied:** Changed render expression in `PersonaSharpenerSession.tsx:734` to prefer customized text with fallback.

**Lesson Learned:** When working with multi-tiered data systems (base + customized), always be explicit about which tier you're rendering from. The property names matter: `.question` vs `.text` indicate different data sources.
