# Feature: Strategist Portals

**Status:** Ready for Implementation
**Date:** 2025-01-07

---

## Overview

Internal team portals for 33 Strategies employees at `/strategist-portals/[strategist]`. Architecturally identical to client portals—password-protected, supporting embedded React components (decks, proposals, interactive content). The only difference is these are for internal team members, with email stored as metadata.

---

## Solution

Reuse the client portal architecture exactly:
- Password-based authentication (same as client portals)
- `ContentItem` with embedded React components
- Existing `PasswordGate` and `ContentIndex` components
- New registry in `lib/strategists.ts`

---

## Goals

- `/strategist-portals/[strategist]` route with password auth
- Support same `ContentItem` structure as client portals (decks, proposals, documents)
- Reuse existing portal components (`PasswordGate`, `ContentIndex`)
- Email stored as metadata (for reference, not auth)

---

## Non-Goals

- Email-based authentication (using passwords like client portals)
- Different component structure than client portals
- Links-only content model

---

## Technical Approach

### Data Model

**`lib/strategists.ts`**
```typescript
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Reuse ContentItem from clients.ts
export interface ContentItem {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  addedOn?: string;
  lastUpdated?: string;
  tagOverride?: string;
  component: ComponentType;
}

export interface StrategistEntry {
  id: string;                    // URL slug: "sherril"
  name: string;                  // Display name: "Sherril"
  email: string;                 // Reference: "sherril@33strategies.ai"
  passwordEnvVar: string;        // e.g., "SHERRIL_PASSWORD"
  content: ContentItem[];
}

export const strategists: Record<string, StrategistEntry> = {
  'sherril': {
    id: 'sherril',
    name: 'Sherril',
    email: 'sherril@33strategies.ai',
    passwordEnvVar: 'SHERRIL_PASSWORD',
    content: [
      {
        slug: 'role-proposal',
        type: 'proposal',
        title: 'The Opportunity',
        description: 'Build the future of both companies',
        addedOn: '2025-01-07',
        component: SherrilRoleProposal,
      },
    ],
  },
};
```

### File Structure

```
app/
└── strategist-portals/
    ├── page.tsx                    # Redirect to /
    └── [strategist]/
        ├── page.tsx                # Portal page (auth + content index)
        └── [slug]/
            └── page.tsx            # Content renderer

app/api/
└── strategist-auth/
    └── [strategist]/
        └── route.ts                # POST/DELETE auth (same pattern as client-auth)

lib/
├── strategists.ts                  # Strategist registry
└── session.ts                      # Add strategistId to SessionData

components/strategists/
└── sherril/
    └── SherrilRoleProposal.tsx     # Converted from JSX reference file
```

### Session Updates

```typescript
// lib/session.ts - extend existing SessionData
export interface SessionData {
  isLoggedIn: boolean;
  clientId?: string;       // For client portals
  strategistId?: string;   // For strategist portals
}

export function isSessionValidForStrategist(
  session: SessionData,
  strategistId: string
): boolean {
  return session.isLoggedIn === true &&
         session.strategistId === strategistId.toLowerCase();
}
```

---

## Environment Variables

```bash
SHERRIL_PASSWORD=OhWeBack?!2026
```

---

## Implementation Phases

### Phase 1: Infrastructure
1. Create `lib/strategists.ts` registry
2. Update `lib/session.ts` with strategistId support
3. Create `/api/strategist-auth/[strategist]/route.ts`
4. Create `/strategist-portals/[strategist]/page.tsx`
5. Create `/strategist-portals/[strategist]/[slug]/page.tsx`

### Phase 2: First Content
1. Convert `sherril-basta-role-proposal.jsx` to proper TSX component
2. Apply 33 Strategies design system (Instrument Serif, proper colors, etc.)
3. Register in strategists registry

### Phase 3: Deploy
1. Add `SHERRIL_PASSWORD` to Railway
2. Test end-to-end flow

---

## First Strategist: Sherril

- **ID:** `sherril`
- **Email:** `sherril@33strategies.ai`
- **Password:** `OhWeBack?!2026` (env var: `SHERRIL_PASSWORD`)
- **Content:** Role proposal deck (converted from `docs/reference/sherril-basta-role-proposal.jsx`)
