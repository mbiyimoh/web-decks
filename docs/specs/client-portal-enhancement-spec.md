# Client Portal Enhancement Specification

**Slug:** client-portal-enhancement
**Status:** Ready for Implementation
**Date:** 2026-01-08
**Source:** `docs/ideation/client-portal-clarity-canvas-integration.md`

---

## Overview

Enhance client portals with project tracking and Clarity Canvas session integration. Three new capabilities:

1. **Active Projects Section** - Expandable tiles showing engagement status, progress, weekly work
2. **Active Work Section** - Resume links to in-progress Clarity Canvas sessions
3. **Full Project Page** - Deep-dive with timeline and deliverables

---

## Decisions (Finalized)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project Data Strategy | Config-driven (Option B) | Ship fast, migrate to database later if needed |
| Which Clients Get Projects | Only clients with data | Hide section when no project, cleaner UX |
| Action Item Linking | External links only | Action items describe tasks, Active Work handles module links |
| Project Status Calculation | Manual | Strategist sets status, simpler for MVP |
| Deliverables Linking | Selective | Some deliverables link to docs, some don't |
| Active Work Scope | Persona Sharpener only | Only module with session tracking implemented |
| Full Project Page | Required | Prototype complete, reuse UI components |

---

## Data Structures

### ProjectData (Config-Driven)

```typescript
// lib/client-projects.ts

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: 'on-track' | 'ahead' | 'attention';
  currentWeek: number;
  totalWeeks: number;
  targetDelivery: string;
  startDate: string;

  thisWeek: {
    productBuild: {
      title: string;
      tasks: Array<{ label: string; status: 'done' | 'in-progress' | 'upcoming' }>;
    };
    strategy: {
      title: string;
      tasks: Array<{ label: string; status: 'done' | 'in-progress' | 'upcoming' }>;
    };
  };

  nextWeek: {
    productBuild: string;
    strategy: string;
  };

  actionItems: Array<{
    id: number;
    label: string;
    link: string;
    neededFor: string;
  }>;

  // Full project page data
  timeline: {
    productBuild: TimelineBlock[];
    strategy: TimelineBlock[];
  };

  deliverables: {
    completed: Array<{ name: string; date: string; link?: string }>;
    inProgress: Array<{ name: string; estimate: string; progress?: string }>;
    upcoming: Array<{ name: string; week: string }>;
  };
}

export interface TimelineBlock {
  weeks: string;        // e.g., "1-2", "3-4"
  phase: string;        // e.g., "Foundation", "Frame"
  status: 'done' | 'current' | 'upcoming';
  items: string[];      // Task list for that block
}
```

### ActiveWorkItem (From Database)

```typescript
// lib/portal/active-work.ts

export interface ActiveWorkItem {
  id: string;
  module: string;       // e.g., "Persona Sharpener"
  context: string;      // e.g., "Competitive Athlete" (persona name)
  status: string;
  progress: string;     // e.g., "Question 3 of 15"
  link: string;         // Direct link to resume
}
```

---

## Components to Create

Port from `PLYAPortal.tsx` and `PLYAProjectPage.tsx`:

| Component | Source Location | Description |
|-----------|-----------------|-------------|
| `StatusPill` | PLYAPortal:225-259 | ON TRACK / AHEAD / NEEDS ATTENTION badge |
| `ProgressBar` | PLYAPortal:261-293 | Segmented week progress bar |
| `TrackCard` | PLYAPortal:305-352 | Product Build / Strategy card with tasks |
| `ActionItem` | PLYAPortal:354-397 | Priority item with link and context |
| `ProjectTile` | PLYAPortal:403-654 | Expandable project card (main component) |
| `ActiveWorkTile` | PLYAPortal:661-730 | Module session resume link |
| `TimelineBlock` | PLYAProjectPage:362-436 | Week block for timeline |
| `DeliverableRow` | PLYAProjectPage:438-506 | Deliverable list item |

---

## File Structure

### New Files

```
components/portal/
├── StatusPill.tsx
├── ProgressBar.tsx
├── TrackCard.tsx
├── ActionItem.tsx
├── ProjectTile.tsx
├── ActiveWorkTile.tsx
├── TimelineBlock.tsx
├── DeliverableRow.tsx
├── EnhancedPortal.tsx       # Main portal layout with sections
└── ProjectDetailPage.tsx    # Full project page component

lib/
├── client-projects.ts       # Project config data per client
└── portal/
    └── active-work.ts       # Database query for active sessions

app/client-portals/[client]/
└── project/
    └── [projectId]/
        └── page.tsx         # Full project page route
```

### Modified Files

- `app/client-portals/[client]/page.tsx` - Add data fetching, use EnhancedPortal
- `components/portal/ContentIndex.tsx` - Refactor to ArtifactSection

---

## Design Tokens

From existing portal aesthetic:

```typescript
// Colors
const GOLD = '#D4A84B';
const GOLD_DIM = 'rgba(212, 168, 75, 0.15)';
const GREEN = '#4ade80';
const GREEN_DIM = 'rgba(74, 222, 128, 0.15)';
const BLUE = '#60a5fa';
const BLUE_DIM = 'rgba(96, 165, 250, 0.15)';
const RED = '#f87171';
const RED_DIM = 'rgba(248, 113, 113, 0.15)';

// Backgrounds
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';
const BG_ELEVATED = '#1a1a1a';

// Track Colors
// Product Build = GOLD
// Strategy = GREEN
```

---

## Implementation Order

### Phase 1: Base Components
1. `StatusPill` - Simple, no dependencies
2. `ProgressBar` - Simple, no dependencies
3. `TrackCard` - Uses design tokens
4. `ActionItem` - Simple card with link

### Phase 2: Composite Components
5. `ProjectTile` - Uses StatusPill, ProgressBar, TrackCard, ActionItem
6. `ActiveWorkTile` - Simple, queries SharpenerSession

### Phase 3: Data Layer
7. `lib/client-projects.ts` - Config for PLYA project data
8. `lib/portal/active-work.ts` - Query active SharpenerSessions

### Phase 4: Integration
9. `EnhancedPortal` - Combines all sections
10. Update `app/client-portals/[client]/page.tsx`

### Phase 5: Project Page
11. `TimelineBlock` component
12. `DeliverableRow` component
13. `ProjectDetailPage` component
14. `app/client-portals/[client]/project/[projectId]/page.tsx` route

---

## Sample PLYA Project Data

```typescript
// lib/client-projects.ts

export const clientProjects: Record<string, ProjectData | null> = {
  'plya': {
    id: 'plya-fitness-app',
    name: 'PLYA Fitness App',
    description: 'AI-powered fitness companion with personalized coaching',
    status: 'on-track',
    currentWeek: 3,
    totalWeeks: 8,
    targetDelivery: 'Feb 28, 2026',
    startDate: 'Jan 6, 2026',

    thisWeek: {
      productBuild: {
        title: 'Core Architecture',
        tasks: [
          { label: 'Database schema finalized', status: 'done' },
          { label: 'Auth system implementation', status: 'in-progress' },
          { label: 'API route structure', status: 'upcoming' }
        ]
      },
      strategy: {
        title: 'Persona Refinement',
        tasks: [
          { label: 'Competitive Athlete persona', status: 'in-progress' },
          { label: 'AI coach personality brief', status: 'upcoming' }
        ]
      }
    },

    nextWeek: {
      productBuild: 'Workout logging MVP',
      strategy: 'Onboarding flow design'
    },

    actionItems: [
      {
        id: 1,
        label: 'Complete persona sharpener for "Competitive Athlete"',
        link: '#',  // Active Work tile handles this
        neededFor: 'AI coach personality tuning'
      },
      {
        id: 2,
        label: 'Review workout taxonomy spreadsheet',
        link: 'https://docs.google.com/spreadsheets/...',
        neededFor: 'Exercise database structure'
      }
    ],

    timeline: {
      productBuild: [
        { weeks: '1-2', phase: 'Foundation', status: 'done', items: ['Tech stack', 'Repo setup', 'CI/CD'] },
        { weeks: '3-4', phase: 'Core', status: 'current', items: ['Auth', 'User model', 'API layer'] },
        { weeks: '5-6', phase: 'Features', status: 'upcoming', items: ['Workouts', 'Progress', 'AI chat'] },
        { weeks: '7-8', phase: 'Polish', status: 'upcoming', items: ['Testing', 'Performance', 'Launch'] }
      ],
      strategy: [
        { weeks: '1-2', phase: 'Discovery', status: 'done', items: ['User interviews', 'Competitor analysis'] },
        { weeks: '3-4', phase: 'Definition', status: 'current', items: ['Personas', 'AI personality', 'Tone'] },
        { weeks: '5-6', phase: 'Design', status: 'upcoming', items: ['Onboarding', 'Core flows'] },
        { weeks: '7-8', phase: 'Validation', status: 'upcoming', items: ['User testing', 'Iteration'] }
      ]
    },

    deliverables: {
      completed: [
        { name: 'Tech Stack Decision', date: 'Jan 8', link: '#' },
        { name: 'Repository Setup', date: 'Jan 10' }
      ],
      inProgress: [
        { name: 'Persona Sharpener - Competitive Athlete', estimate: 'Jan 15', progress: '3 of 5' }
      ],
      upcoming: [
        { name: 'AI Personality Brief', week: 'Week 4' },
        { name: 'Onboarding Wireframes', week: 'Week 5' }
      ]
    }
  },

  'tradeblock': null,  // No active project
  'wsbc': null         // No active project
};
```

---

## Active Work Query

```typescript
// lib/portal/active-work.ts

import prisma from '@/lib/prisma';
import { ActiveWorkItem } from './types';

export async function getActiveWorkForUser(userId: string): Promise<ActiveWorkItem[]> {
  const sessions = await prisma.sharpenerSession.findMany({
    where: {
      status: 'in_progress',
      persona: {
        profile: {
          userRecordId: userId
        }
      }
    },
    include: {
      persona: {
        select: {
          name: true
        }
      }
    },
    orderBy: { startedAt: 'desc' }
  });

  return sessions.map(session => ({
    id: session.id,
    module: 'Persona Sharpener',
    context: session.persona.name ?? 'Persona',
    status: 'in-progress',
    progress: `Question ${(session.lastQuestionIndex ?? 0) + 1} of 15`,
    link: `/clarity-canvas/modules/persona-sharpener/${session.id}`
  }));
}
```

---

## Validation Criteria

- [ ] PLYA portal shows Active Projects section with expandable tile
- [ ] Project tile shows status, progress bar, this week's work, action items
- [ ] Expand reveals task details and "View Full Project" CTA
- [ ] Active Work section shows in-progress Persona Sharpener sessions
- [ ] Clicking Active Work tile navigates to resume session
- [ ] Full project page shows timeline, deliverables, priorities
- [ ] Portals without projects (tradeblock, wsbc) show only Artifacts
- [ ] All styling matches dark editorial aesthetic with gold/green accents
- [ ] Framer Motion animations for expand/collapse

---

## Out of Scope

- Admin interface for managing project data
- Database-driven projects (future migration)
- Notification system
- Real-time updates
- Action item completion tracking
- Modules beyond Persona Sharpener in Active Work
