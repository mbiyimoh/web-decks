# Task Breakdown: Expandable Synthesis Sections UI

Generated: 2026-02-07
Source: specs/feat-cc-expand-section-ui.md

## Overview

Add expand/collapse functionality to the 6 synthesis sections in ClientDetailModal. Collapsed sections show 2-line preview; expanded sections reveal full content with edit/refine capabilities. Includes global "Expand All"/"Collapse All" toggle and keyboard navigation.

## Phase 1: Core Collapse/Expand

### Task 1.1: Add collapse state to EditableSynthesisBlock

**Description**: Add isExpanded state and collapsed preview mode to EditableSynthesisBlock component
**Size**: Medium
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None

**Technical Requirements**:

Add new props to interface:
```typescript
interface EditableSynthesisBlockProps {
  // ... existing props (label, sectionKey, content, versions, color, onSave, pendingRefinement, onAcceptRefinement, onRejectRefinement)
  defaultExpanded?: boolean;  // Initial expanded state, defaults to true
  onExpandChange?: (expanded: boolean) => void;  // Callback for parent tracking
}
```

Add local state:
```typescript
const [isExpanded, setIsExpanded] = useState(defaultExpanded ?? true);

// Sync with defaultExpanded prop changes (for global toggle)
useEffect(() => {
  if (defaultExpanded !== undefined) {
    setIsExpanded(defaultExpanded);
  }
}, [defaultExpanded]);

// Force expanded when in EDIT/REFINING/HISTORY states or has pending refinement
const shouldForceExpand = state !== 'VIEW' || hasPending;
const isCollapsed = !isExpanded && !shouldForceExpand;
```

Collapsed preview rendering (before existing content area):
```tsx
{isCollapsed ? (
  <div
    className="cursor-pointer p-3 rounded-lg transition-colors hover:bg-white/5"
    onClick={() => {
      setIsExpanded(true);
      onExpandChange?.(true);
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        setIsExpanded(true);
        onExpandChange?.(true);
      }
    }}
    tabIndex={0}
    role="button"
    aria-expanded={false}
    aria-label={`Expand ${label} section`}
  >
    {/* Label row */}
    <div className="flex items-center justify-between mb-1">
      <p
        className="text-xs font-mono tracking-[0.2em] uppercase"
        style={{ color: color || TEXT_DIM }}
      >
        {label}
      </p>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        style={{ color: TEXT_MUTED }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    {/* Preview text or empty state */}
    <p className="text-xs italic line-clamp-2" style={{ color: TEXT_DIM }}>
      {content ? content.slice(0, 150) + (content.length > 150 ? '...' : '') : 'No content yet...'}
    </p>
  </div>
) : (
  // Existing expanded view (wrap current implementation)
  <div>
    {/* Current label row with hover actions */}
    {/* Current content area */}
    {/* Current refine input */}
    {/* Current action buttons */}
    {/* Current version pills */}

    {/* Add collapse button to expanded view header */}
  </div>
)}
```

Add collapse functionality to expanded view:
```tsx
// In the expanded view's label row, add collapse button
{state === 'VIEW' && !hasPending && (
  <button
    onClick={() => {
      setIsExpanded(false);
      onExpandChange?.(false);
    }}
    className="p-1 rounded transition-colors hover:bg-white/5"
    style={{ color: TEXT_MUTED }}
    title="Collapse section"
    aria-label="Collapse section"
  >
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  </button>
)}
```

Handle Escape key for collapse (V1 simplified - just Enter to expand):
```typescript
// Simplified keyboard: Enter to expand from collapsed state
// Escape behavior deferred to future enhancement
```

**Acceptance Criteria**:
- [ ] New props `defaultExpanded` and `onExpandChange` added to interface
- [ ] Collapsed state shows label + 2-line preview with chevron down icon
- [ ] Empty content shows "No content yet..." in collapsed preview
- [ ] Click on collapsed section expands it
- [ ] Enter key on focused collapsed section expands it
- [ ] Expanded view shows collapse chevron up icon in header
- [ ] Click collapse button collapses the section
- [ ] EDIT/REFINING/HISTORY states force section to stay expanded
- [ ] Pending refinement forces section to stay expanded
- [ ] onExpandChange callback fires on state changes

---

### Task 1.2: Add global Expand/Collapse toggle to ClientDetailModal

**Description**: Add state and toggle button to control all synthesis sections at once
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.1
**Can run parallel with**: None

**Technical Requirements**:

Add state to ClientDetailModal:
```typescript
const [allSectionsExpanded, setAllSectionsExpanded] = useState(true);

function handleToggleAllSections() {
  setAllSectionsExpanded(!allSectionsExpanded);
}
```

Find the CLIENT INTELLIGENCE section header and add toggle button. Current pattern uses Section component:
```tsx
// Locate: <Section title="CLIENT INTELLIGENCE" ...
// Modify to include headerRight with toggle button

<Section
  title="CLIENT INTELLIGENCE"
  headerRight={
    <div className="flex items-center gap-4">
      <button
        onClick={handleToggleAllSections}
        className="text-xs font-mono uppercase tracking-wider transition-colors hover:opacity-80"
        style={{ color: TEXT_MUTED }}
      >
        {allSectionsExpanded ? 'Collapse All' : 'Expand All'}
      </button>
      {/* Existing SynthesisGlobalRefine component if present */}
      <SynthesisGlobalRefine
        currentSynthesis={enrichmentFindings}
        onRefinementComplete={handleGlobalRefinement}
      />
    </div>
  }
>
```

Update each EditableSynthesisBlock to use the global state:
```tsx
{/* For each synthesis section, add key to force re-render on toggle */}
<EditableSynthesisBlock
  key={`companyOverview-${allSectionsExpanded}`}
  label="Company Overview"
  sectionKey="companyOverview"
  content={enrichmentFindings?.companyOverview || ''}
  versions={synthesisVersions?.companyOverview}
  color={GOLD}
  onSave={(content, source) => handleSynthesisSave('companyOverview', content, source)}
  pendingRefinement={pendingRefinements?.companyOverview}
  onAcceptRefinement={() => handleAcceptSection('companyOverview')}
  onRejectRefinement={() => handleRejectSection('companyOverview')}
  defaultExpanded={allSectionsExpanded}
/>

{/* Repeat for: goalsAndVision, painAndBlockers, decisionDynamics, strategicAssessment, recommendedApproach */}
```

The key pattern `key={sectionKey}-${allSectionsExpanded}` ensures React re-mounts the component when the global toggle changes, resetting local state to match.

**Acceptance Criteria**:
- [ ] "Collapse All" / "Expand All" button appears in CLIENT INTELLIGENCE section header
- [ ] Button text toggles based on current state
- [ ] Clicking "Collapse All" collapses all 6 sections
- [ ] Clicking "Expand All" expands all 6 sections
- [ ] Individual sections can still be toggled independently after global toggle
- [ ] Global toggle doesn't interfere with pending refinements (those sections stay expanded)

---

## Phase 2: Testing & Polish

### Task 2.1: Manual testing and edge case fixes

**Description**: Test all expand/collapse scenarios and fix any edge cases
**Size**: Small
**Priority**: Medium
**Dependencies**: Task 1.1, Task 1.2
**Can run parallel with**: None

**Testing Scenarios**:

1. **Collapse all flow**:
   - Open prospect with synthesis data
   - Click "Collapse All"
   - Verify all 6 sections show 2-line previews
   - Verify button changes to "Expand All"

2. **Expand individual**:
   - With sections collapsed, click one section
   - Verify it expands to full content
   - Verify edit/refine actions are available
   - Verify other sections remain collapsed

3. **Edit from collapsed** (should not happen but test):
   - If somehow edit is triggered on collapsed section, verify it auto-expands

4. **Pending refinement**:
   - Trigger global refine that affects a section
   - Verify that section auto-expands to show pending refinement
   - Verify accept/reject buttons work
   - Verify section can be collapsed after accepting/rejecting

5. **Empty content**:
   - Test section with no content
   - Verify collapsed preview shows "No content yet..." in italic

6. **Long content**:
   - Test section with very long content (500+ chars)
   - Verify collapsed preview truncates at ~150 chars with "..."
   - Verify expand shows full content

7. **Keyboard navigation**:
   - Tab to collapsed section
   - Press Enter to expand
   - Verify focus remains on section after expand

8. **State reset on prospect change**:
   - Collapse some sections
   - Switch to different prospect
   - Return to original prospect
   - Verify all sections are expanded (no state persistence)

**Acceptance Criteria**:
- [ ] All 8 testing scenarios pass
- [ ] No console errors during expand/collapse
- [ ] Smooth user experience (no flickering, proper focus management)
- [ ] Design tokens used consistently (TEXT_DIM, TEXT_MUTED, etc.)

---

## Summary

| Phase | Tasks | Size | Priority |
|-------|-------|------|----------|
| Phase 1 | Task 1.1: Add collapse state to EditableSynthesisBlock | Medium | High |
| Phase 1 | Task 1.2: Add global toggle to ClientDetailModal | Small | High |
| Phase 2 | Task 2.1: Manual testing and edge case fixes | Small | Medium |

**Total Tasks**: 3
**Critical Path**: Task 1.1 → Task 1.2 → Task 2.1
**Parallel Opportunities**: None (linear dependency chain)

**Estimated Complexity**: Low-Medium
- Pure frontend changes
- No API or database changes
- No new dependencies
- Building on existing component patterns
