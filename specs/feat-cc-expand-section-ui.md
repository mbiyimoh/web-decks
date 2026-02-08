# Expandable Synthesis Sections UI

**Status:** Draft
**Author:** Claude Code
**Date:** 2026-02-06
**Context:** Central Command enhancement to improve synthesis section readability

---

## Overview

Add expand/collapse functionality to the 6 synthesis sections in ClientDetailModal (companyOverview, goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach). Collapsed sections show a 2-line preview; expanded sections reveal full content with edit/refine capabilities.

## Problem Statement

The current CLIENT INTELLIGENCE section displays all 6 synthesis sections fully expanded, creating a long scroll and overwhelming the user. Users need a quick scannable view that lets them drill into specific sections of interest. The current layout also makes it harder to focus on one section at a time during assessment.

## Goals

- Enable collapse/expand for each synthesis section
- Show smart 2-line preview in collapsed state
- Preserve all existing edit/refine functionality in expanded state
- "Expand All" / "Collapse All" toggle in section header
- Keyboard navigation support (Enter to toggle focused section)

## Non-Goals

- Changing the synthesis section content or structure
- Adding new synthesis sections
- Modifying the extraction logic
- Mobile-specific collapsed UX
- Animating transitions (simple show/hide is sufficient)

---

## Technical Approach

### Files That Change

| File | Change |
|------|--------|
| `app/central-command/components/EditableSynthesisBlock.tsx` | Add collapse/expand state and truncated preview mode |
| `app/central-command/components/ClientDetailModal.tsx` | Add "Expand All"/"Collapse All" toggle, track global expansion state |
| `components/portal/design-tokens.ts` | No changes (use existing tokens) |

### Integration Points

- Existing `EditableSynthesisBlock` component — add collapsed state
- Existing section header pattern — add toggle button

---

## Implementation Details

### 1. EditableSynthesisBlock — Collapsed State

Add props and state for collapse/expand:

```typescript
interface EditableSynthesisBlockProps {
  // ... existing props
  defaultExpanded?: boolean;  // Initial expanded state
  onExpandChange?: (expanded: boolean) => void;  // For parent tracking
}
```

New visual states:
- **COLLAPSED**: Show section label + 2-line truncated preview + expand chevron
- **VIEW** (expanded): Current behavior — full content + hover actions
- **EDIT**, **REFINING**, **HISTORY**: Force expanded when in these states

Collapsed preview:
- Truncate content to ~100 characters or 2 lines (whichever is less)
- Show "..." at truncation point
- Subtle italic styling to indicate preview
- Click anywhere on the collapsed card to expand

```tsx
{isCollapsed ? (
  <div
    className="cursor-pointer"
    onClick={() => setIsExpanded(true)}
    onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(true)}
    tabIndex={0}
  >
    <p className="text-xs italic line-clamp-2" style={{ color: TEXT_DIM }}>
      {content.slice(0, 150)}...
    </p>
    <ChevronDownIcon className="w-4 h-4 mt-1" style={{ color: TEXT_MUTED }} />
  </div>
) : (
  // Existing expanded view with full content + edit/refine capabilities
)}
```

### 2. ClientDetailModal — Global Expand/Collapse

Add state and toggle to CLIENT INTELLIGENCE section:

```typescript
const [allExpanded, setAllExpanded] = useState(true);

function handleToggleAll() {
  setAllExpanded(!allExpanded);
}
```

Section header modification:
```tsx
<Section
  title="CLIENT INTELLIGENCE"
  headerRight={
    <div className="flex items-center gap-4">
      <button
        onClick={handleToggleAll}
        className="text-xs font-mono uppercase"
        style={{ color: TEXT_MUTED }}
      >
        {allExpanded ? 'Collapse All' : 'Expand All'}
      </button>
      <SynthesisGlobalRefine
        currentSynthesis={enrichmentFindings}
        onRefinementComplete={handleGlobalRefinement}
      />
    </div>
  }
>
```

Pass `defaultExpanded={allExpanded}` and key by section+allExpanded to each EditableSynthesisBlock to reset state when toggling all.

### 3. Keyboard Accessibility

- Tab through collapsed section cards
- Enter to expand focused section
- Escape while expanded to collapse
- When in EDIT/REFINING/HISTORY mode, Escape first exits that mode before collapsing

---

## User Experience

### Initial State
- All sections start expanded (current behavior preserved)
- "Collapse All" button visible in header

### Collapse Flow
1. User clicks "Collapse All"
2. All 6 sections shrink to 2-line previews
3. Button changes to "Expand All"
4. User can click individual sections to expand them

### Expand Individual Section
1. User clicks a collapsed section
2. That section expands to full view
3. All edit/refine/history functionality available
4. User can click the section header area to collapse it again

### Automatic Expansion
- If user triggers edit/refine on a collapsed section, it auto-expands
- Pending refinements from global mode auto-expand affected sections

---

## Testing Approach

- **Collapse all**: Click toggle → verify all sections show 2-line preview
- **Expand individual**: Click collapsed section → verify full content + actions visible
- **Edit from collapsed**: Trigger edit → verify auto-expands
- **Pending refinement**: Global refine returns updates → verify affected sections expand
- **Keyboard**: Tab through sections, Enter to expand, Escape to collapse
- **State persistence**: Collapse some sections, switch to different prospect, return → verify state doesn't persist (fresh start)

---

## Open Questions

None — scope is intentionally minimal.

---

## Future Improvements

- **Remember expansion state per prospect** — Store in localStorage or database
- **Animated transitions** — Smooth expand/collapse with Framer Motion
- **Inline expand preview** — Show full content inline without full expansion
- **Section reordering** — Drag to reorder sections by importance

---

## References

- **Existing component:** `app/central-command/components/EditableSynthesisBlock.tsx`
- **Design tokens:** `components/portal/design-tokens.ts`
- **Synthesis refinement spec:** `specs/feat-synthesis-refinement.md`
