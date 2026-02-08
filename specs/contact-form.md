# Specification: Contact Form

**Version:** 1.0
**Date:** 2026-01-20
**Status:** Draft
**Route:** `/contact`
**Related:** `specs/products-landing-page.md`

---

## 1. Overview

### 1.1 Purpose
Create a centralized contact form at `33strategies.ai/contact` that allows visitors to express interest in 33 Strategies products and services, with support for pre-selecting interests via URL query parameters.

### 1.2 Success Criteria
- [ ] Page renders at `/contact` route
- [ ] Form collects name, email, interests, and optional message
- [ ] Checkbox group includes all 4 products + 2 services
- [ ] Query param `?product=m33t` pre-checks the relevant checkbox
- [ ] Form submission saves to database and sends Slack notification
- [ ] Success state displays after submission
- [ ] Follows 33 Strategies design system

---

## 2. User Stories

### 2.1 Visitor from products page
**As a** visitor who clicked "Request Access" on a gated product
**I want to** land on a contact form with that product pre-selected
**So that** I can quickly submit my interest without re-selecting

### 2.2 General inquiry visitor
**As a** visitor wanting to learn more about 33 Strategies services
**I want to** select multiple offerings I'm interested in
**So that** I can express broad interest in one submission

---

## 3. Technical Architecture

### 3.1 File Structure
```
app/
  contact/
    page.tsx                    # Route handler with metadata
    ContactPageClient.tsx       # Main client component ('use client')
    actions.ts                  # Server action for form submission

lib/
  contact-interests.ts          # Interest options data
```

### 3.2 Dependencies
- `framer-motion` — Animations (optional, keep minimal)
- `next/navigation` — useSearchParams for query param reading
- `@prisma/client` — Database operations (existing)
- `fetch` — Slack webhook calls (native)

### 3.3 Data Model
```typescript
// lib/contact-interests.ts

export interface ContactInterest {
  id: string;
  label: string;
  description?: string;  // Optional subtext
  category: 'product' | 'service';
}

export const CONTACT_INTERESTS: ContactInterest[] = [
  // Products
  { id: 'talking-docs', label: 'TalkingDocs.ai', category: 'product' },
  { id: 'better-contacts', label: 'Better Contacts', category: 'product' },
  { id: 'm33t', label: 'M33T', category: 'product' },
  { id: 'marketing-automation', label: 'Marketing Automation', category: 'product' },

  // Services
  {
    id: 'hard-reset',
    label: 'Hard Reset: 33-Day AI Transformation',
    description: 'We leave clients with: 1) extensive business context; 2) core data connections and automation; 3) an educated team thinking about what\'s possible in a whole new way',
    category: 'service',
  },
  {
    id: 'ai-development',
    label: 'AI-driven Development Services',
    description: 'We help you build things like a traditional dev firm would... just better, faster, and cheaper.',
    category: 'service',
  },
];
```

---

## 4. Component Specifications

### 4.1 ContactPageClient.tsx
**Purpose:** Main page component with form

**Structure:**
```tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CONTACT_INTERESTS } from '@/lib/contact-interests';

export default function ContactPageClient() {
  const searchParams = useSearchParams();
  const preSelectedProduct = searchParams.get('product');

  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Initialize checked interests from query param
  const [checkedInterests, setCheckedInterests] = useState<string[]>(
    preSelectedProduct ? [preSelectedProduct] : []
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6 py-16">
      {/* Logo/back link */}

      {formState === 'success' ? (
        <SuccessMessage />
      ) : (
        <ContactForm
          checkedInterests={checkedInterests}
          onCheckedChange={setCheckedInterests}
          onSubmit={handleSubmit}
          isSubmitting={formState === 'submitting'}
        />
      )}
    </div>
  );
}
```

### 4.2 Form Layout
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ← Back to Products                     │
│                                                     │
│                    [33]                             │
│                                                     │
│              Get in Touch                           │
│     Tell us what you're interested in.              │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Name *                                      │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │                                     │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  │                                              │   │
│  │  Email *                                     │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │                                     │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  │                                              │   │
│  │  I'm interested in:                          │   │
│  │                                              │   │
│  │  PRODUCTS                                    │   │
│  │  ☑ TalkingDocs.ai                           │   │
│  │  ☐ Better Contacts                          │   │
│  │  ☑ M33T                                     │   │
│  │  ☐ Marketing Automation                     │   │
│  │                                              │   │
│  │  SERVICES                                    │   │
│  │  ☐ Hard Reset: 33-Day AI Transformation     │   │
│  │      (description text below)               │   │
│  │  ☐ AI-driven Development Services           │   │
│  │      (description text below)               │   │
│  │                                              │   │
│  │  Message (optional)                          │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │                                     │    │   │
│  │  │                                     │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  │                                              │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │         Send Message                │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.3 Form Fields

**Name (required)**
- Type: text input
- Placeholder: "Your name"
- Validation: Required, min 2 characters

**Email (required)**
- Type: email input
- Placeholder: "you@company.com"
- Validation: Required, valid email format

**Interests (checkbox group)**
- Grouped by category (Products / Services)
- Category labels: Gold uppercase tracked text
- Checkbox + label
- Services include description subtext (muted, smaller)

**Message (optional)**
- Type: textarea
- Placeholder: "Tell us more about what you're looking for..."
- Rows: 4

### 4.4 Success State
```tsx
function SuccessMessage() {
  return (
    <div className="text-center max-w-md">
      <div className="text-5xl mb-6">✓</div>
      <h2 className="text-3xl font-display text-white mb-4">
        Message Sent
      </h2>
      <p className="text-[#888888] mb-8">
        Thanks for reaching out! We'll get back to you soon.
      </p>
      <Link href="/products" className="text-[#d4a54a] hover:underline">
        ← Back to Products
      </Link>
    </div>
  );
}
```

---

## 5. Styling Specifications

### 5.1 Colors
```typescript
BG_PRIMARY = '#0a0a0f'
BG_SURFACE = '#111114'
GOLD = '#d4a54a'
TEXT_PRIMARY = '#f5f5f5'
TEXT_MUTED = '#888888'
TEXT_DIM = '#555555'
```

### 5.2 Form Elements
**Input/Textarea:**
- Background: `#111114`
- Border: `1px solid rgba(255,255,255,0.1)`
- Border radius: 8px
- Padding: 12px 16px
- Focus: Border color `#d4a54a`

**Checkbox:**
- Custom styled (hidden native + visual div)
- Unchecked: Border `rgba(255,255,255,0.2)`, bg transparent
- Checked: Border `#d4a54a`, bg `#d4a54a`, checkmark white

**Submit Button:**
- Background: `#d4a54a`
- Text: `#0a0a0f`
- Padding: 16px 32px
- Border radius: 8px
- Hover: Slightly lighter gold
- Disabled: Opacity 0.5

### 5.3 Typography
| Element | Font | Size | Color |
|---------|------|------|-------|
| Page title | Instrument Serif | 36px | white |
| Subtitle | DM Sans | 16px | #888888 |
| Labels | DM Sans | 14px | #f5f5f5 |
| Category labels | JetBrains Mono | 11px | #d4a54a |
| Description | DM Sans | 13px | #555555 |
| Button | DM Sans | 16px | #0a0a0f |

---

## 6. Form Submission

### 6.1 Database Model
Add to `prisma/schema.prisma`:

```prisma
// ============================================================================
// CONTACT FORM SUBMISSIONS
// ============================================================================

model ContactSubmission {
  id        String   @id @default(cuid())

  // Contact info
  name      String
  email     String

  // Interests (stored as array of IDs)
  interests String[]

  // Optional message
  message   String?  @db.Text

  // Tracking
  source    String?  // URL query param that led here (e.g., "m33t")

  // Status for manual follow-up
  status    ContactStatus @default(NEW)
  notes     String?  @db.Text  // Internal notes from team

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}

enum ContactStatus {
  NEW
  CONTACTED
  IN_PROGRESS
  CLOSED
}
```

### 6.2 Server Action
```typescript
// app/contact/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { CONTACT_INTERESTS } from '@/lib/contact-interests';

interface ContactFormData {
  name: string;
  email: string;
  interests: string[];
  message?: string;
  source?: string; // From query param
}

export async function submitContactForm(data: ContactFormData) {
  // Validate
  if (!data.name || !data.email || data.interests.length === 0) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    // 1. Save to database
    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        interests: data.interests,
        message: data.message || null,
        source: data.source || null,
      },
    });

    // 2. Send Slack notification
    await sendSlackNotification(submission, data);

    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return { success: false, error: 'Failed to submit. Please try again.' };
  }
}
```

### 6.3 Slack Notification
```typescript
// app/contact/actions.ts (continued)

async function sendSlackNotification(
  submission: { id: string; createdAt: Date },
  data: ContactFormData
) {
  const webhookUrl = process.env.SLACK_CONTACT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('SLACK_CONTACT_WEBHOOK_URL not configured, skipping notification');
    return;
  }

  // Map interest IDs to labels
  const interestLabels = data.interests.map(id => {
    const interest = CONTACT_INTERESTS.find(i => i.id === id);
    return interest?.label || id;
  });

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📬 New Contact Form Submission',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${data.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${data.email}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Interested in:*\n${interestLabels.map(l => `• ${l}`).join('\n')}`,
        },
      },
      ...(data.message ? [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${data.message}`,
        },
      }] : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Source: ${data.source || 'direct'} | ID: ${submission.id}`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.status);
    }
  } catch (error) {
    // Don't fail the submission if Slack fails
    console.error('Slack notification error:', error);
  }
}
```

### 6.4 Environment Variable
Add to `.env`:
```bash
# Slack webhook for contact form notifications
SLACK_CONTACT_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
```

**Setup instructions:**
1. Go to https://api.slack.com/apps
2. Create new app → "From scratch"
3. Add "Incoming Webhooks" feature
4. Activate and create webhook for desired channel
5. Copy webhook URL to environment variable

---

## 7. Query Parameter Handling

### 7.1 Supported Parameters
| Param | Value | Effect |
|-------|-------|--------|
| `product` | `talking-docs` | Pre-check TalkingDocs.ai |
| `product` | `better-contacts` | Pre-check Better Contacts |
| `product` | `m33t` | Pre-check M33T |
| `product` | `marketing-automation` | Pre-check Marketing Automation |

### 7.2 Implementation
```tsx
const searchParams = useSearchParams();
const preSelected = searchParams.get('product');

// Initialize state with pre-selected value
const [checked, setChecked] = useState<string[]>(
  preSelected && CONTACT_INTERESTS.some(i => i.id === preSelected)
    ? [preSelected]
    : []
);
```

---

## 8. Responsive Behavior

### 8.1 Desktop (768px+)
- Form card: max-width 500px, centered
- Comfortable padding

### 8.2 Mobile (< 768px)
- Full width with padding
- Same layout, slightly tighter spacing

---

## 9. Validation & Error Handling

### 9.1 Client-side Validation
- Name: Required, show error below field
- Email: Required, valid format
- Interests: At least one checkbox required

### 9.2 Error States
- Field-level: Red border + error message below
- Form-level: Error banner at top if submission fails

### 9.3 Error Messages
```typescript
const ERRORS = {
  name: 'Please enter your name',
  email: 'Please enter a valid email address',
  interests: 'Please select at least one interest',
  submission: 'Something went wrong. Please try again or email us directly.',
};
```

---

## 10. Accessibility

- [ ] All form fields have associated labels
- [ ] Error messages linked via aria-describedby
- [ ] Focus management after submission
- [ ] Keyboard navigation works for checkboxes
- [ ] Color contrast meets WCAG AA

---

## 11. Testing Checklist

### 11.1 UI/UX
- [ ] Form renders with all fields
- [ ] Query param pre-selects correct checkbox
- [ ] Validation prevents empty submission
- [ ] Email validation works
- [ ] At least one interest required
- [ ] Success state displays after submission
- [ ] Back to products link works
- [ ] Mobile layout renders correctly

### 11.2 Submission Flow
- [ ] Form submission creates database record
- [ ] All fields correctly stored in database
- [ ] Slack notification fires on submission
- [ ] Slack message contains correct name, email, interests
- [ ] Submission succeeds even if Slack webhook fails (graceful degradation)
- [ ] Source field populated from query param

### 11.3 Database
- [ ] ContactSubmission model exists after migration
- [ ] Records queryable via Prisma Studio
- [ ] Status field defaults to NEW
- [ ] Indexes work correctly

---

## 12. Implementation Order

1. **Add Prisma model:** Update `prisma/schema.prisma` with `ContactSubmission`
2. **Run migration:** `npx prisma migrate dev --name add-contact-submissions`
3. **Create data file:** `lib/contact-interests.ts`
4. **Create page:** `app/contact/page.tsx` with metadata
5. **Create client component:** `ContactPageClient.tsx`
6. **Implement form UI** (no submission yet)
7. **Add server action:** `actions.ts` with database + Slack
8. **Configure Slack webhook** in environment variables
9. **Test query param handling**
10. **Test end-to-end submission flow**

---

## 13. Out of Scope

- CAPTCHA / bot protection (add later if spam occurs)
- Email confirmation to submitter
- CRM integration
- Analytics tracking

---

## 14. Page Metadata

```tsx
// app/contact/page.tsx
export const metadata = {
  title: 'Contact | 33 Strategies',
  description: 'Get in touch with 33 Strategies. Tell us about your interest in our AI-powered products and services.',
};
```

---

*Spec ready for implementation.*
