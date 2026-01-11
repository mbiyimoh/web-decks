# Client Portal Enhancement Handoff

## Context

The client portals already exist. This handoff covers **new features** to add:

1. **Active Projects Section** — Expandable project tiles with status, progress, action items
2. **Active Work Section** — Links to in-progress modules (Persona Sharpener, Business Model Canvas, etc.)
3. **Full Project Page** — Deep-dive view with timeline, deliverables, and detailed tracking

---

## What's Being Added

### Portal Landing Page (Enhanced)

```
PORTAL LANDING PAGE
├── Active Projects (NEW)
│   └── ProjectTile (expandable, shows status/progress/action items)
├── Active Work (NEW)
│   └── ActiveWorkTile (links to in-progress modules)
└── Artifacts (existing, keep as-is)
```

### Full Project Page (NEW)

```
/portal/[client]/project/[projectId]
├── Hero (status, dates, progress bar)
├── Your Priorities (action items with "Needed for" context)
├── Project Timeline (two parallel tracks: Product Build + Strategy)
└── Deliverables (Completed / In Progress / Upcoming)
```

---

## Data Structures

### Project Data

```typescript
interface ProjectData {
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
  
  // For full project page only:
  timeline?: {
    productBuild: TimelineBlock[];
    strategy: TimelineBlock[];
  };
  
  deliverables?: {
    completed: Array<{ name: string; date: string; link: string }>;
    inProgress: Array<{ name: string; estimate: string; progress?: string }>;
    upcoming: Array<{ name: string; week: string }>;
  };
}

interface TimelineBlock {
  weeks: string;        // e.g. "1-2", "3-4"
  phase: string;        // e.g. "Foundation", "Frame"
  status: 'done' | 'current' | 'upcoming';
  items: string[];      // Task list for that block
}
```

### Active Work Data

```typescript
interface ActiveWorkItem {
  id: number;
  module: string;       // e.g. "Persona Sharpener", "Business Model Canvas"
  context: string;      // e.g. "Competitive Athlete", "PLYA v1"
  status: string;
  progress: string;     // e.g. "Step 3 of 5"
  link: string;         // Direct link to resume the module
}
```

---

## Design Tokens

Already using these from existing portal, but for reference:

```typescript
const GOLD = '#D4A84B';
const GOLD_DIM = 'rgba(212, 168, 75, 0.15)';
const GREEN = '#4ade80';
const GREEN_DIM = 'rgba(74, 222, 128, 0.15)';
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';
const BG_ELEVATED = '#1a1a1a';
```

**Track Colors:**
- Product Build = Gold (#D4A84B)
- Strategy = Green (#4ade80)

---

## Component Breakdown

### 1. ProjectTile

Expandable tile with two states:

**Collapsed (default):**
- Status pill (ON TRACK / AHEAD / NEEDS ATTENTION)
- Progress bar with week marker
- Project name + description
- "This Week" header with two track cards (Product Build | Strategy)
- All action items (up to 3)
- Expand button

**Expanded:**
- Everything above, plus:
- Target delivery date
- Task breakdowns under each track (✓/●/○ status icons)
- "Coming Up Next" preview
- "View Full Project →" CTA
- Collapse button

### 2. ActiveWorkTile

Simple horizontal tile:
- Module icon (placeholder)
- Module name + context
- Progress badge (e.g. "Step 3 of 5")
- Arrow link

### 3. StatusPill

```typescript
const config = {
  'on-track': { label: 'ON TRACK', color: GREEN, bg: GREEN_DIM },
  'ahead': { label: 'AHEAD', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
  'attention': { label: 'NEEDS ATTENTION', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
};
```

### 4. ProgressBar

Segmented bar (one segment per week) with current position marker.

### 5. TrackCard

Two-column cards for Product Build and Strategy:
- Gold left border for Product Build
- Green left border for Strategy
- Shows title, subtitle, and optionally task list with status icons

### 6. ActionItem

Gold-tinted card with:
- Checkbox icon (○)
- Label text
- Arrow link
- Optional "Needed for:" context line

### 7. TimelineBlock (Full Project Page)

4-column grid showing week-by-week breakdown:
- "NOW" badge on current block
- Phase name
- Task list with status icons
- Dimmed styling for upcoming blocks

### 8. DeliverableRow (Full Project Page)

List rows for deliverables:
- Status icon (✓/●/○)
- Name
- Progress badge (for in-progress items)
- Date/estimate
- "View →" link (for completed items)

---

## Integration Notes

### Portal Landing Page

Add these sections between header and existing Artifacts section:

```tsx
{/* Active Projects Section */}
<section>
  <h2>Active Projects</h2>
  <ProjectTile project={projectData} isExpanded={expanded} onToggle={toggle} />
</section>

{/* Active Work Section - only render if there's active work */}
{activeWork.length > 0 && (
  <section>
    <h2>Active Work</h2>
    {activeWork.map(item => <ActiveWorkTile key={item.id} item={item} />)}
  </section>
)}

{/* Divider */}
<hr />

{/* Existing Artifacts Section */}
```

### Full Project Page Route

New route: `/portal/[client]/project/[projectId]`

- Sticky "← Back to Portal" nav
- Fetch full project data including timeline and deliverables
- Render hero, priorities, timeline, deliverables sections

### Data Fetching

These components expect data from your existing portal data layer. The structures above should map to whatever you're storing for:
- Project metadata
- Weekly status/tasks
- Action items
- Deliverables

---

## Files Included

| File | Description |
|------|-------------|
| `PLYAPortal.tsx` | Portal landing page with ProjectTile, ActiveWorkTile, and existing Artifacts |
| `PLYAProjectPage.tsx` | Full project page with timeline and deliverables |

Both files are fully typed TypeScript with inline styles matching the existing portal aesthetic.

---

## Questions for Implementation

1. **Data source:** Where does project/action item data currently live? These components expect it as props.

2. **Module links:** Active Work tiles need links to the actual module experiences (Persona Sharpener, etc.). Are those routes defined?

3. **Deliverable storage:** Are deliverables tracked somewhere we can query? The full project page shows completed/in-progress/upcoming.

4. **Real-time updates:** Should action item completion update the tile in real-time, or is page refresh acceptable?

---

## Visual Reference

The prototypes render in Claude artifacts if you want to see them live. Key visual details:

- Expand/collapse uses Framer Motion for smooth animation
- Gold (#D4A84B) is the primary accent, used sparingly
- Status colors: green = good, blue = ahead, red = attention
- Two-track visualization is central (gold for Product Build, green for Strategy)
- Action items are prominently styled with gold tint to draw attention
