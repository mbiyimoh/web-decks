# Task Breakdown: Contact Form

**Generated:** 2026-01-20
**Source:** specs/contact-form.md

## Overview

Create a centralized contact form at `/contact` with database storage and Slack notifications. The form collects name, email, interests (products + services), and optional message. Supports pre-selecting interests via URL query parameters for integration with the products page.

---

## Phase 1: Database Foundation

### Task 1.1: Add ContactSubmission Prisma Model
**Description:** Add the ContactSubmission model and ContactStatus enum to the Prisma schema
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** None (must complete first)

**Technical Requirements:**
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

**Implementation Steps:**
1. Open `prisma/schema.prisma`
2. Add the ContactSubmission model and ContactStatus enum at the end
3. Run `npx prisma migrate dev --name add-contact-submissions`
4. Verify migration succeeded with `npx prisma studio`

**Acceptance Criteria:**
- [ ] ContactSubmission model exists in schema
- [ ] ContactStatus enum has 4 values: NEW, CONTACTED, IN_PROGRESS, CLOSED
- [ ] Migration runs without errors
- [ ] Model visible in Prisma Studio

---

## Phase 2: Data Layer

### Task 2.1: Create Contact Interests Data File
**Description:** Create lib/contact-interests.ts with all product and service options
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1

**Technical Requirements:**
Create `lib/contact-interests.ts`:

```typescript
export interface ContactInterest {
  id: string;
  label: string;
  description?: string;
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

// Helper to get interests by category
export const getInterestsByCategory = (category: 'product' | 'service') =>
  CONTACT_INTERESTS.filter((i) => i.category === category);

// Helper to get interest by ID
export const getInterestById = (id: string) =>
  CONTACT_INTERESTS.find((i) => i.id === id);
```

**Acceptance Criteria:**
- [ ] File exports ContactInterest interface
- [ ] File exports CONTACT_INTERESTS array with 6 items (4 products, 2 services)
- [ ] Services have descriptions, products don't
- [ ] Helper functions work correctly

---

## Phase 3: Server Action

### Task 3.1: Create Contact Form Server Action with Slack Integration
**Description:** Create app/contact/actions.ts with form submission handler and Slack webhook
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1, Task 2.1
**Can run parallel with:** Task 4.1

**Technical Requirements:**
Create `app/contact/actions.ts`:

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { CONTACT_INTERESTS } from '@/lib/contact-interests';

interface ContactFormData {
  name: string;
  email: string;
  interests: string[];
  message?: string;
  source?: string;
}

export async function submitContactForm(data: ContactFormData) {
  // Validate
  if (!data.name || !data.email || data.interests.length === 0) {
    return { success: false, error: 'Missing required fields' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, error: 'Invalid email address' };
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
  const interestLabels = data.interests.map((id) => {
    const interest = CONTACT_INTERESTS.find((i) => i.id === id);
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
          text: `*Interested in:*\n${interestLabels.map((l) => `• ${l}`).join('\n')}`,
        },
      },
      ...(data.message
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message:*\n${data.message}`,
              },
            },
          ]
        : []),
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

**Acceptance Criteria:**
- [ ] Server action validates required fields
- [ ] Server action validates email format
- [ ] Submission creates database record
- [ ] Slack notification sent with formatted blocks
- [ ] Graceful degradation if Slack fails (submission still succeeds)
- [ ] Source field captured from input

---

## Phase 4: UI Components

### Task 4.1: Create Contact Page Route and Client Component
**Description:** Create app/contact/page.tsx and ContactPageClient.tsx with full form UI
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.1, Task 3.1
**Can run parallel with:** None

**Technical Requirements:**

**File 1: `app/contact/page.tsx`**
```typescript
import { Suspense } from 'react';
import ContactPageClient from './ContactPageClient';

export const metadata = {
  title: 'Contact | 33 Strategies',
  description:
    'Get in touch with 33 Strategies. Tell us about your interest in our AI-powered products and services.',
};

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <ContactPageClient />
    </Suspense>
  );
}
```

**File 2: `app/contact/ContactPageClient.tsx`**
```typescript
'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CONTACT_INTERESTS, getInterestsByCategory } from '@/lib/contact-interests';
import { submitContactForm } from './actions';

// Design tokens
const GOLD = '#d4a54a';
const BG_PRIMARY = '#0a0a0f';
const BG_SURFACE = '#111114';
const TEXT_PRIMARY = '#f5f5f5';
const TEXT_MUTED = '#888888';
const TEXT_DIM = '#555555';

export default function ContactPageClient() {
  const searchParams = useSearchParams();
  const preSelectedProduct = searchParams.get('product');

  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [checkedInterests, setCheckedInterests] = useState<string[]>(
    preSelectedProduct && CONTACT_INTERESTS.some((i) => i.id === preSelectedProduct)
      ? [preSelectedProduct]
      : []
  );

  // Field errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; interests?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Please enter your name';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (checkedInterests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    startTransition(async () => {
      const result = await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        interests: checkedInterests,
        message: message.trim() || undefined,
        source: preSelectedProduct || undefined,
      });

      if (result.success) {
        setFormState('success');
      } else {
        setFormState('error');
        setErrorMessage(result.error || 'Something went wrong');
      }
    });
  };

  const toggleInterest = (id: string) => {
    setCheckedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    // Clear interests error when user selects something
    if (errors.interests) {
      setErrors((prev) => ({ ...prev, interests: undefined }));
    }
  };

  if (formState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: BG_PRIMARY }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-5xl mb-6" style={{ color: GOLD }}>✓</div>
          <h2 className="text-3xl font-display text-white mb-4">Message Sent</h2>
          <p style={{ color: TEXT_MUTED }} className="mb-8">
            Thanks for reaching out! We'll get back to you soon.
          </p>
          <Link href="/products" style={{ color: GOLD }} className="hover:underline">
            ← Back to Products
          </Link>
        </motion.div>
      </div>
    );
  }

  const products = getInterestsByCategory('product');
  const services = getInterestsByCategory('service');

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: BG_PRIMARY }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Back link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-colors"
          style={{ color: TEXT_MUTED }}
        >
          ← Back to Products
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-5xl font-display" style={{ color: GOLD }}>
              33
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-white mb-2">Get in Touch</h1>
          <p style={{ color: TEXT_MUTED }}>Tell us what you're interested in.</p>
        </div>

        {/* Error banner */}
        {formState === 'error' && (
          <div
            className="mb-6 p-4 rounded-lg text-sm"
            style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm mb-2" style={{ color: TEXT_PRIMARY }}>
              Name <span style={{ color: GOLD }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg outline-none transition-colors"
              style={{
                background: BG_SURFACE,
                border: errors.name ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
                color: TEXT_PRIMARY,
              }}
            />
            {errors.name && (
              <p className="mt-1 text-sm" style={{ color: '#f87171' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2" style={{ color: TEXT_PRIMARY }}>
              Email <span style={{ color: GOLD }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="you@company.com"
              className="w-full px-4 py-3 rounded-lg outline-none transition-colors"
              style={{
                background: BG_SURFACE,
                border: errors.email ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
                color: TEXT_PRIMARY,
              }}
            />
            {errors.email && (
              <p className="mt-1 text-sm" style={{ color: '#f87171' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm mb-4" style={{ color: TEXT_PRIMARY }}>
              I'm interested in: <span style={{ color: GOLD }}>*</span>
            </label>

            {/* Products */}
            <p
              className="text-xs font-mono tracking-widest uppercase mb-3"
              style={{ color: GOLD }}
            >
              Products
            </p>
            <div className="space-y-2 mb-6">
              {products.map((interest) => (
                <label
                  key={interest.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                    style={{
                      border: checkedInterests.includes(interest.id)
                        ? `2px solid ${GOLD}`
                        : '2px solid rgba(255,255,255,0.2)',
                      background: checkedInterests.includes(interest.id) ? GOLD : 'transparent',
                    }}
                  >
                    {checkedInterests.includes(interest.id) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={BG_PRIMARY}
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={checkedInterests.includes(interest.id)}
                    onChange={() => toggleInterest(interest.id)}
                    className="sr-only"
                  />
                  <span style={{ color: TEXT_PRIMARY }}>{interest.label}</span>
                </label>
              ))}
            </div>

            {/* Services */}
            <p
              className="text-xs font-mono tracking-widest uppercase mb-3"
              style={{ color: GOLD }}
            >
              Services
            </p>
            <div className="space-y-4">
              {services.map((interest) => (
                <label key={interest.id} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors mt-0.5"
                    style={{
                      border: checkedInterests.includes(interest.id)
                        ? `2px solid ${GOLD}`
                        : '2px solid rgba(255,255,255,0.2)',
                      background: checkedInterests.includes(interest.id) ? GOLD : 'transparent',
                    }}
                  >
                    {checkedInterests.includes(interest.id) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={BG_PRIMARY}
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={checkedInterests.includes(interest.id)}
                    onChange={() => toggleInterest(interest.id)}
                    className="sr-only"
                  />
                  <div>
                    <span style={{ color: TEXT_PRIMARY }}>{interest.label}</span>
                    {interest.description && (
                      <p className="text-sm mt-1" style={{ color: TEXT_DIM }}>
                        {interest.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {errors.interests && (
              <p className="mt-3 text-sm" style={{ color: '#f87171' }}>
                {errors.interests}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm mb-2" style={{ color: TEXT_PRIMARY }}>
              Message <span style={{ color: TEXT_DIM }}>(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more about what you're looking for..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg outline-none transition-colors resize-none"
              style={{
                background: BG_SURFACE,
                border: '1px solid rgba(255,255,255,0.1)',
                color: TEXT_PRIMARY,
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 rounded-lg font-semibold transition-opacity"
            style={{
              background: GOLD,
              color: BG_PRIMARY,
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {isPending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Page renders at /contact route
- [ ] Query param ?product=m33t pre-checks M33T checkbox
- [ ] Form validates required fields with error messages
- [ ] Products and Services are grouped with gold uppercase labels
- [ ] Services show descriptions below labels
- [ ] Custom styled checkboxes with gold checked state
- [ ] Submit button shows loading state
- [ ] Success state displays with back to products link
- [ ] Error state displays error message
- [ ] Mobile responsive layout

---

## Phase 5: Testing & Verification

### Task 5.1: End-to-End Testing
**Description:** Test the complete contact form flow
**Size:** Small
**Priority:** High
**Dependencies:** Task 4.1
**Can run parallel with:** None

**Test Scenarios:**
1. Navigate to /contact - form renders with all fields
2. Navigate to /contact?product=m33t - M33T checkbox pre-selected
3. Submit empty form - validation errors appear
4. Submit with invalid email - email error appears
5. Submit with no interests selected - interests error appears
6. Submit valid form - success state shows, database record created
7. Check Slack notification received (if webhook configured)
8. Test on mobile viewport - layout responsive

**Acceptance Criteria:**
- [ ] All test scenarios pass
- [ ] Database records queryable via Prisma Studio
- [ ] Slack notifications working (or gracefully skipped if not configured)

---

## Execution Summary

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| 1. Database | 1.1 | None |
| 2. Data Layer | 2.1 | None (parallel with 1.1) |
| 3. Server Action | 3.1 | 1.1, 2.1 |
| 4. UI Components | 4.1 | 2.1, 3.1 |
| 5. Testing | 5.1 | 4.1 |

**Critical Path:** 1.1 → 3.1 → 4.1 → 5.1
**Parallel Opportunities:** Tasks 1.1 and 2.1 can run in parallel

**Total Tasks:** 5
**Estimated Implementation Time:** ~2 hours
