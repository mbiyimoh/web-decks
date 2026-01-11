# Client Portal Enhancement: Project Tracking & Clarity Canvas Integration

**Slug:** client-portal-clarity-canvas-integration
**Author:** Claude Code
**Date:** 2026-01-08
**Branch:** preflight/client-portal-clarity-canvas-integration
**Related:**
- `docs/reference/client-portal-extension-and-project-tracking/client-portal-enhancement-HANDOFF.md`
- `docs/reference/client-portal-extension-and-project-tracking/PLYAPortal.tsx`
- `docs/reference/client-portal-extension-and-project-tracking/PLYAProjectPage.tsx`
- `docs/clarity-canvas/clarity-canvas-handoff.md`

---

## 1) Intent & Assumptions

**Task brief:** Enhance client portals with three new capabilities:
1. **Active Projects Section** - Expandable project tiles showing engagement status, progress, weekly work breakdown (Product Build + Strategy tracks), and client action items
2. **Active Work Section** - Tiles linking to in-progress Clarity Canvas sessions (Persona Sharpener, etc.) so clients can easily resume
3. **Full Project Page** - Deep-dive route (`/client-portals/[client]/project/[projectId]`) with timeline visualization, deliverables tracking, and priorities

**Assumptions:**
- Client portal users are authenticated via iron-session (email+password)
- The `User` table links portal users to their `ClarityProfile` via `userRecordId`
- Existing client portal displays static content tiles (decks, proposals) - these become the "Artifacts" section
- Project data (engagements, timelines, deliverables) needs a data source - currently no database schema exists
- Action items can link to Clarity Canvas modules or external resources
- Reference prototypes in `PLYAPortal.tsx` and `PLYAProjectPage.tsx` provide complete UI implementation

**Out of scope:**
- Admin/strategist interface for managing project data
- Notification system
- Real-time updates via WebSockets
- Action item completion tracking (checkbox functionality)
- Completed sessions archive/history

---

## 2) Pre-reading Log

- `client-portal-enhancement-HANDOFF.md`: Comprehensive spec defining three new features:
  - **Active Projects**: Expandable `ProjectTile` with two-track visualization (Product Build = gold, Strategy = green), progress bar, action items
  - **Active Work**: `ActiveWorkTile` linking to in-progress Clarity Canvas modules
  - **Full Project Page**: Timeline blocks, deliverables (completed/in-progress/upcoming), "Your Priorities" section
  - Includes complete TypeScript interfaces for `ProjectData`, `ActiveWorkItem`, `TimelineBlock`, deliverables

- `PLYAPortal.tsx` (957 lines): Full prototype of enhanced portal landing page with:
  - `ProjectTile` component (expandable, shows status/progress/weekly work/action items)
  - `ActiveWorkTile` component (module + context + progress badge + link)
  - `ArtifactTile` component (existing content, renamed from ContentTile)
  - Page layout: Active Projects → Active Work → Divider → Artifacts

- `PLYAProjectPage.tsx` (867 lines): Full project deep-dive page with:
  - Hero section (status pill, dates, segmented progress bar)
  - "Your Priorities" action items with "Needed for" context
  - Two-track timeline (4-column grid, week blocks, NOW badge)
  - Deliverables section (Completed/In Progress/Upcoming rows)
  - Sticky back navigation

- `prisma/schema.prisma`: Current models include `User`, `ClarityProfile`, `Persona`, `SharpenerSession`. **No project/engagement models exist yet.**

- `components/portal/ContentIndex.tsx`: Current portal UI - only renders static content tiles from `lib/clients.ts`. Will need major refactor or replacement.

- `lib/client-session-bridge.ts`: Unified session returns `{ userId, userEmail, authSource }` - can use `userId` to look up Clarity Canvas sessions.

---

## 3) Codebase Map

### Current State

**Portal architecture:**
```
app/client-portals/
├── [client]/
│   ├── page.tsx         # Auth check + renders ContentIndex
│   └── [slug]/page.tsx  # Individual artifact/deck view
└── page.tsx             # Root redirect

components/portal/
├── ContentIndex.tsx     # Static content tiles (current)
└── PasswordGate.tsx     # Login form
```

**Data sources:**
- Static content: `lib/clients.ts` - hardcoded decks/proposals per client
- Clarity Canvas sessions: `prisma/schema.prisma` - `SharpenerSession` model with status, progress

### Proposed State

**New portal architecture:**
```
app/client-portals/
├── [client]/
│   ├── page.tsx                    # Enhanced portal landing
│   ├── project/
│   │   └── [projectId]/page.tsx    # Full project page (NEW)
│   └── [slug]/page.tsx             # Artifact view (unchanged)

components/portal/
├── ContentIndex.tsx                # Refactored to accept sections
├── PasswordGate.tsx                # Unchanged
├── ProjectTile.tsx                 # NEW - expandable project card
├── ActiveWorkTile.tsx              # NEW - Clarity Canvas session link
├── ActiveWorkSection.tsx           # NEW - section wrapper
├── ProjectSection.tsx              # NEW - section wrapper
├── ArtifactSection.tsx             # NEW - renamed content section
├── StatusPill.tsx                  # NEW - status indicator
├── ProgressBar.tsx                 # NEW - segmented/continuous
├── TrackCard.tsx                   # NEW - Product Build/Strategy cards
├── ActionItem.tsx                  # NEW - priority item
├── TimelineBlock.tsx               # NEW - for project page
└── DeliverableRow.tsx              # NEW - for project page
```

**New data models needed:**
```
prisma/schema.prisma:
├── Project                         # Client engagement
├── ProjectWeek                     # Weekly breakdown
├── ProjectTask                     # Individual tasks per track
├── ActionItem                      # Client priorities
├── Deliverable                     # Project outputs
└── (existing) SharpenerSession     # Already exists - query for Active Work
```

### Data Flow

```
Portal Page (Server Component)
  │
  ├─→ getIronSession() → SessionData { userId, clientId }
  │
  ├─→ getActiveProjects(clientId)
  │     └─→ prisma.project.findMany({ where: { clientId, status: 'active' } })
  │
  ├─→ getActiveWork(userId)
  │     └─→ prisma.sharpenerSession.findMany({
  │           where: { persona.profile.userRecordId, status: 'in_progress' }
  │         })
  │
  └─→ getClientContent(clientId)  # Existing static content
        └─→ lib/clients.ts
  │
  ▼
EnhancedPortal (Client Component)
  ├── ProjectSection + ProjectTile(s)
  ├── ActiveWorkSection + ActiveWorkTile(s)
  └── ArtifactSection + ArtifactTile(s)
```

### Shared Dependencies

- Design tokens: `GOLD = '#D4A84B'`, `GREEN = '#4ade80'`, `BG_PRIMARY = '#0a0a0a'`
- Animation: `framer-motion` for expand/collapse, hover effects
- Database: `@prisma/client`
- Auth: `lib/session.ts` (iron-session), `lib/client-session-bridge.ts`

### Potential Blast Radius

- `app/client-portals/[client]/page.tsx` - Major refactor (add project/session queries)
- `components/portal/ContentIndex.tsx` - Refactor to section-based layout
- `prisma/schema.prisma` - Add new models (Project, etc.)
- `lib/clients.ts` - May need client → project linkage
- New route: `app/client-portals/[client]/project/[projectId]/page.tsx`

---

## 4) Root Cause Analysis

*Not applicable - this is a new feature, not a bug fix.*

---

## 5) Research

### Key Design Decision: Project Data Source

The reference prototypes show rich project data (timelines, tasks, deliverables), but **no database schema exists for projects**. This is the critical architectural decision.

#### Option A: Database-Driven Projects

**Approach:** Create full Prisma models for Project, ProjectWeek, Task, Deliverable, ActionItem. Store all engagement data in database.

**Data model:**
```prisma
model Project {
  id            String   @id @default(cuid())
  clientId      String   // Links to client portal (e.g., "plya")
  name          String
  description   String
  status        ProjectStatus @default(ON_TRACK)
  startDate     DateTime
  targetDelivery DateTime
  currentWeek   Int      @default(1)
  totalWeeks    Int

  weeks         ProjectWeek[]
  actionItems   ActionItem[]
  deliverables  Deliverable[]
}

enum ProjectStatus {
  ON_TRACK
  AHEAD
  NEEDS_ATTENTION
  COMPLETED
  PAUSED
}

model ProjectWeek {
  id           String @id @default(cuid())
  projectId    String
  weekNumber   Int

  productBuild Json   // { title, tasks: [{label, status}] }
  strategy     Json   // { title, tasks: [{label, status}] }

  project      Project @relation(...)
}

model ActionItem {
  id         String @id @default(cuid())
  projectId  String
  label      String
  link       String
  neededFor  String?
  completed  Boolean @default(false)
  order      Int     @default(0)

  project    Project @relation(...)
}

model Deliverable {
  id         String @id @default(cuid())
  projectId  String
  name       String
  status     DeliverableStatus
  date       String?   // Completed date or estimate
  week       String?   // For upcoming
  progress   String?   // e.g., "3 of 5"
  link       String?   // For completed deliverables

  project    Project @relation(...)
}

enum DeliverableStatus {
  COMPLETED
  IN_PROGRESS
  UPCOMING
}
```

**Pros:**
- Full CRUD capability for strategists
- Scalable to multiple projects per client
- Real-time updates possible
- Data integrity via relations

**Cons:**
- Significant backend work (API routes, admin interface)
- Need to seed data for existing engagements
- More complex deployment

#### Option B: Hardcoded/Config-Driven Projects

**Approach:** Define project data in TypeScript config files (like current `lib/clients.ts`). Each client has a `projectData` object.

```typescript
// lib/client-projects.ts
export const clientProjects: Record<string, ProjectData> = {
  'plya': {
    id: 'plya-fitness-app',
    name: 'PLYA Fitness App',
    // ... full ProjectData object
  },
  'wsbc': null, // No active project
};
```

**Pros:**
- Fastest to implement
- No database migration needed
- Works for current MVP scope

**Cons:**
- Requires code deployment to update project status
- Not scalable to multiple projects
- No audit trail of changes
- Strategists can't self-serve updates

#### Option C: Hybrid - Database for Dynamic, Config for Static

**Approach:** Store dynamic data (action items, deliverables, weekly status) in database. Keep static structure (timeline phases, week count) in config.

**Pros:**
- Balance of flexibility and simplicity
- Action items can update without deploys
- Phased migration path

**Cons:**
- Split data sources adds complexity
- Still need some database work

### Recommendation

**Start with Option B (Config-Driven)** for initial implementation, with clear migration path to Option A:

1. **Phase 1**: Implement UI components using config-driven data
   - Validates UX with real clients
   - Fast to ship
   - No database migration risk

2. **Phase 2**: Add database models and admin interface
   - Migrate config data to database
   - Enable strategist self-serve updates
   - Only invest if Phase 1 proves valuable

### Active Work Data Source

For Clarity Canvas sessions, the data source already exists:

```typescript
// Query active sessions for portal user
const activeSessions = await prisma.sharpenerSession.findMany({
  where: {
    status: 'in_progress',
    persona: {
      profile: {
        userRecordId: userId  // From unified session
      }
    }
  },
  include: {
    persona: {
      select: {
        name: true,
        profile: { select: { name: true } }
      }
    }
  },
  orderBy: { startedAt: 'desc' }
});

// Transform to ActiveWorkItem[]
const activeWork = activeSessions.map(session => ({
  id: session.id,
  module: 'Persona Sharpener',
  context: session.persona.name ?? 'Persona',
  status: 'in-progress',
  progress: `Question ${session.lastQuestionIndex + 1} of 15`,
  link: `/clarity-canvas/modules/persona-sharpener/${session.id}`
}));
```

---

## 6) Clarification

### Critical Decisions

#### 1. Project Data Strategy

**Question:** Should we implement database-driven projects (Option A) or config-driven (Option B)?

**Recommendation:** Option B (config-driven) for MVP, with migration path

**Trade-offs:**
- Option A: More work upfront, but fully dynamic
- Option B: Ship fast, but requires code deploys for updates

#### 2. Which Clients Get Projects?

**Question:** Do all clients get the Active Projects section, or only those with active engagements?

**Options:**
- **A) All clients** - Empty state: "No active projects"
- **B) Only clients with project data** - Section hidden otherwise

**Recommendation:** Option B - cleaner UX, avoids confusion

#### 3. Action Item Linking

**Question:** How do action items link to Clarity Canvas modules?

**Example from prototype:**
```typescript
{
  label: 'Complete persona sharpener for "Competitive Athlete"',
  link: '#',  // What should this be?
  neededFor: 'AI coach personality tuning'
}
```

**Options:**
- **A) Link to specific session** - `/clarity-canvas/modules/persona-sharpener/[sessionId]`
- **B) Link to module start** - `/clarity-canvas/modules/persona-sharpener`
- **C) External links only** - Action items are just descriptions, Active Work handles module links

**Recommendation:** Option C - keeps action items simple, Active Work tiles handle session resumption

#### 4. Project Status Calculation

**Question:** Is project status (ON TRACK / AHEAD / NEEDS ATTENTION) manual or calculated?

**Options:**
- **A) Manual** - Strategist sets status
- **B) Calculated** - Based on week vs timeline, deliverable completion rate
- **C) Hybrid** - Calculated with manual override

**Recommendation:** Option A for MVP - simpler, allows strategist judgment

#### 5. Deliverables Linking

**Question:** Should completed deliverables link to files/URLs?

**Prototype shows:** `{ name: 'PRD', date: 'Jan 10', link: '#' }`

**Options:**
- **A) Yes** - Links to actual documents (Google Docs, Figma, etc.)
- **B) No** - Display only, deliverables accessed through Artifacts section
- **C) Selective** - Some deliverables are linkable (external docs), some aren't

**Recommendation:** Option C - flexibility for strategist to decide per deliverable

#### 6. Active Work Scope

**Question:** Which Clarity Canvas modules should appear in Active Work?

**Current state:** Only Persona Sharpener has `SharpenerSession` model with progress tracking

**Options:**
- **A) Persona Sharpener only** - Current scope
- **B) All modules with sessions** - Future-proof, but need session models for each
- **C) Generic module sessions** - Add `ModuleSession` base model

**Recommendation:** Option A for now - only implemented module; evolve as modules are added

#### 7. Full Project Page Priority

**Question:** Is the full project page (`/client-portals/[client]/project/[projectId]`) required for MVP?

**Options:**
- **A) Yes** - "View Full Project" CTA needs a destination
- **B) No** - Hide CTA, implement later
- **C) Simplified** - Basic version without timeline visualization

**Recommendation:** Option A - the prototype is complete, UI components can be reused

---

## 7) Implementation Outline

### Phase 1: UI Components (from prototypes)

Port these components from `PLYAPortal.tsx` and `PLYAProjectPage.tsx`:

| Component | Source | Priority |
|-----------|--------|----------|
| `StatusPill` | PLYAPortal:225-259 | P0 |
| `ProgressBar` | PLYAPortal:261-293 | P0 |
| `TrackCard` | PLYAPortal:305-352 | P0 |
| `ActionItem` | PLYAPortal:354-397 | P0 |
| `ProjectTile` | PLYAPortal:403-654 | P0 |
| `ActiveWorkTile` | PLYAPortal:661-730 | P0 |
| `TimelineBlock` | PLYAProjectPage:362-436 | P1 |
| `DeliverableRow` | PLYAProjectPage:438-506 | P1 |

### Phase 2: Data Layer

```typescript
// lib/client-projects.ts - Config-driven project data
export interface ClientProject {
  project: ProjectData | null;
  activeWork: ActiveWorkItem[];  // Populated from DB at runtime
}

export function getProjectForClient(clientId: string): ProjectData | null;
```

```typescript
// lib/portal/active-work.ts - Database query
export async function getActiveWorkForUser(userId: string): Promise<ActiveWorkItem[]>;
```

### Phase 3: Page Integration

```typescript
// app/client-portals/[client]/page.tsx
export default async function ClientPortalPage({ params }) {
  const session = await getIronSession(...);
  const project = getProjectForClient(clientId);
  const activeWork = await getActiveWorkForUser(session.userId);
  const artifacts = getClientContent(clientId);

  return (
    <EnhancedPortal
      client={client}
      project={project}
      activeWork={activeWork}
      artifacts={artifacts}
    />
  );
}
```

### Phase 4: Project Page Route

```typescript
// app/client-portals/[client]/project/[projectId]/page.tsx
export default async function ProjectPage({ params }) {
  const project = getFullProjectData(params.client, params.projectId);
  return <ProjectDetailPage project={project} />;
}
```

---

## 8) Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `components/portal/StatusPill.tsx` | Status indicator badge |
| `components/portal/ProgressBar.tsx` | Segmented progress visualization |
| `components/portal/TrackCard.tsx` | Product Build / Strategy card |
| `components/portal/ActionItem.tsx` | Priority item with link |
| `components/portal/ProjectTile.tsx` | Expandable project card |
| `components/portal/ActiveWorkTile.tsx` | Module session link |
| `components/portal/TimelineBlock.tsx` | Week block for project page |
| `components/portal/DeliverableRow.tsx` | Deliverable list item |
| `lib/client-projects.ts` | Project config/data |
| `lib/portal/active-work.ts` | Active session queries |
| `app/client-portals/[client]/project/[projectId]/page.tsx` | Project detail page |

### Modified Files

| File | Changes |
|------|---------|
| `app/client-portals/[client]/page.tsx` | Add project/session data fetching, pass to new components |
| `components/portal/ContentIndex.tsx` | Refactor to section-based layout, rename content section to "Artifacts" |

---

## Next Steps

1. Get clarification on decisions in Section 6
2. Create specification with final decisions
3. Port UI components from prototypes
4. Implement data layer (config + session queries)
5. Integrate into portal pages
6. Test with PLYA client data

---

*Document created: 2026-01-08*
*Status: Awaiting clarification on 7 decisions*
