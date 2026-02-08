# Task Breakdown: Decision Workflow + Operational Structure

**Generated:** 2026-02-07
**Source:** specs/feat-cc-decision-workflow.md

## Overview

Add a structured decision workflow with 4 buckets (Aggressive/Slow-burn/Back-burner/Explicit No), stakeholder display with role tags, and operational details section to Central Command.

---

## Phase 1: Data Layer & Configuration

### Task 1.1: Add Decision Fields to Prisma Schema + Migration
**Description:** Add decisionBucket, nextStepNotes, and decisionMadeAt fields to PipelineRecord
**Size:** Small
**Priority:** High (blocks all other tasks)
**Dependencies:** None
**Can run parallel with:** None

**Technical Requirements:**
Add to `prisma/schema.prisma` in model PipelineRecord:

```prisma
decisionBucket   String?   // 'aggressive' | 'slow_burn' | 'back_burner' | 'explicit_no'
nextStepNotes    String?   @db.Text  // User's notes on next steps (from template or manual)
decisionMadeAt   DateTime? // When the decision was made
```

**Implementation Steps:**
1. Open `prisma/schema.prisma`
2. Find `model PipelineRecord` (around line 465)
3. Add the three new fields after existing fields
4. Run `npx prisma migrate dev --name add_decision_workflow_fields`
5. Run `npx prisma generate`

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Prisma client regenerated with new fields
- [ ] TypeScript compiles without errors

---

### Task 1.2: Create Decision Templates Configuration
**Description:** Create lib/central-command/decision-templates.ts with bucket definitions and templates
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1

**Technical Requirements:**
Create new file `lib/central-command/decision-templates.ts`:

```typescript
import { GREEN, BLUE, GOLD, RED } from '@/components/portal/design-tokens';

export const DECISION_BUCKETS = {
  aggressive: {
    label: 'Aggressive Pursuit',
    description: 'High priority — pursue immediately with full attention',
    color: GREEN,
    defaultTemplate: `**Immediate Next Steps:**
1. Send intro email within 24 hours referencing [key pain point]
2. Propose discovery call for this week
3. Prepare 1-pager on how 33S addresses their [specific challenge]

**Key Talking Points:**
- Lead with [recommended approach from synthesis]
- Reference their [specific pain] and how we've solved similar problems
- Ask about [decision dynamics from synthesis]`,
  },
  slow_burn: {
    label: 'Slow Burn',
    description: 'Interested but not urgent — nurture over time',
    color: BLUE,
    defaultTemplate: `**Nurture Actions:**
1. Add to monthly value-share cadence
2. Send relevant case study that matches their [industry/challenge]
3. Re-engage in [timeframe based on timeline signals]

**Trigger Points to Watch:**
- Funding announcement
- Leadership change
- Competitive pressure mention`,
  },
  back_burner: {
    label: 'Back Burner',
    description: 'Not ready now — revisit later when circumstances change',
    color: GOLD,
    defaultTemplate: `**Back Burner Actions:**
1. Set reminder to check back in [3/6 months]
2. Note: Waiting for [specific trigger — budget cycle, decision-maker change, etc.]

**Reactivation Signals:**
- [What would make this worth revisiting]`,
  },
  explicit_no: {
    label: 'Explicit No',
    description: 'Not a fit — document why and move on',
    color: RED,
    defaultTemplate: `**Pass Reason:**
[Document why we're passing]

**Lessons Learned:**
- [What we learned from this evaluation]

**Potential Future Fit:**
- [Under what conditions might this change, or "Never"]`,
  },
} as const;

export type DecisionBucket = keyof typeof DECISION_BUCKETS;
```

**Acceptance Criteria:**
- [ ] File created at correct location
- [ ] Exports DECISION_BUCKETS and DecisionBucket type
- [ ] TypeScript compiles

---

### Task 1.3: Update Types and API Schema
**Description:** Add stakeholders to EnrichmentFindings and decision fields to updateProspectSchema
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** Task 1.2

**Technical Requirements:**

**1. Update `lib/central-command/types.ts`:**
Add stakeholders to EnrichmentFindings interface:

```typescript
export interface EnrichmentFindings {
  companyOverview?: string;
  goalsAndVision?: string;
  painAndBlockers?: string;
  decisionDynamics?: string;
  strategicAssessment?: string;
  recommendedApproach?: string;
  scoreAssessments?: Record<string, EnrichmentScoreAssessment>;
  stakeholders?: Array<{
    name: string;
    title: string | null;
    role: string;
    context: string;
    contactInfo?: { email: string | null; phone: string | null; linkedin: string | null };
    confidence: number;
  }>;
}
```

**2. Update `lib/central-command/schemas.ts`:**
Add to updateProspectSchema:

```typescript
decisionBucket: z.enum(['aggressive', 'slow_burn', 'back_burner', 'explicit_no']).optional(),
nextStepNotes: z.string().optional(),
decisionMadeAt: z.string().optional(), // ISO date string
```

**Acceptance Criteria:**
- [ ] EnrichmentFindings includes stakeholders array type
- [ ] updateProspectSchema accepts decision fields
- [ ] TypeScript compiles

---

## Phase 2: Components

### Task 2.1: Create DecisionPanel Component
**Description:** Build 4-bucket selection panel with editable template textarea
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.1, Task 1.2, Task 1.3
**Can run parallel with:** Task 2.2, Task 2.3

**Technical Requirements:**
Create `app/central-command/components/DecisionPanel.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  GOLD,
  GREEN,
  BLUE,
  RED,
  BG_ELEVATED,
  BG_PRIMARY,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import { DECISION_BUCKETS, type DecisionBucket } from '@/lib/central-command/decision-templates';
import type { EnrichmentFindings } from '@/lib/central-command/types';

interface DecisionPanelProps {
  currentBucket: DecisionBucket | null;
  currentNotes: string;
  decisionMadeAt: string | null;
  synthesis: EnrichmentFindings | null;
  onSave: (bucket: DecisionBucket, notes: string) => void;
}

export default function DecisionPanel({
  currentBucket,
  currentNotes,
  decisionMadeAt,
  synthesis,
  onSave,
}: DecisionPanelProps) {
  const [selectedBucket, setSelectedBucket] = useState<DecisionBucket | null>(currentBucket);
  const [notes, setNotes] = useState(currentNotes);
  const [hasUserEdits, setHasUserEdits] = useState(false);
  const [showConfirmChange, setShowConfirmChange] = useState(false);
  const [pendingBucket, setPendingBucket] = useState<DecisionBucket | null>(null);

  // Sync with props
  useEffect(() => {
    setSelectedBucket(currentBucket);
    setNotes(currentNotes);
    setHasUserEdits(false);
  }, [currentBucket, currentNotes]);

  function handleBucketClick(bucket: DecisionBucket) {
    if (selectedBucket === bucket) return;

    if (hasUserEdits && notes.trim()) {
      setPendingBucket(bucket);
      setShowConfirmChange(true);
    } else {
      selectBucket(bucket);
    }
  }

  function selectBucket(bucket: DecisionBucket) {
    setSelectedBucket(bucket);
    setNotes(DECISION_BUCKETS[bucket].defaultTemplate);
    setHasUserEdits(false);
    setShowConfirmChange(false);
    setPendingBucket(null);
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    setHasUserEdits(true);
  }

  function handleSave() {
    if (selectedBucket) {
      onSave(selectedBucket, notes);
    }
  }

  function handleConfirmChange() {
    if (pendingBucket) {
      selectBucket(pendingBucket);
    }
  }

  function handleCancelChange() {
    setShowConfirmChange(false);
    setPendingBucket(null);
  }

  const bucketKeys = Object.keys(DECISION_BUCKETS) as DecisionBucket[];

  return (
    <div className="space-y-4">
      {/* Bucket buttons */}
      <div className="flex flex-wrap gap-2">
        {bucketKeys.map((key) => {
          const bucket = DECISION_BUCKETS[key];
          const isSelected = selectedBucket === key;

          return (
            <button
              key={key}
              onClick={() => handleBucketClick(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isSelected ? bucket.color : 'transparent',
                color: isSelected ? BG_PRIMARY : bucket.color,
                border: `1px solid ${bucket.color}`,
                opacity: isSelected ? 1 : 0.7,
              }}
              title={bucket.description}
            >
              {bucket.label}
            </button>
          );
        })}
      </div>

      {/* Change confirmation warning */}
      {showConfirmChange && pendingBucket && (
        <div
          className="p-3 rounded-lg flex items-center justify-between"
          style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)' }}
        >
          <p className="text-sm" style={{ color: RED }}>
            Changing bucket will replace your notes with the new template.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCancelChange}
              className="px-3 py-1 rounded text-xs"
              style={{ color: TEXT_MUTED }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChange}
              className="px-3 py-1 rounded text-xs"
              style={{ background: RED, color: '#fff' }}
            >
              Change Anyway
            </button>
          </div>
        </div>
      )}

      {/* Notes textarea */}
      {selectedBucket && (
        <div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="w-full resize-none text-sm leading-relaxed focus:outline-none font-body rounded-lg p-4 border"
            style={{
              background: BG_ELEVATED,
              color: TEXT_PRIMARY,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              minHeight: '200px',
            }}
            placeholder="Add your next steps and notes..."
          />
        </div>
      )}

      {/* Decision timestamp and save */}
      <div className="flex items-center justify-between">
        <div>
          {decisionMadeAt && (
            <p className="text-xs" style={{ color: TEXT_DIM }}>
              Decision made: {new Date(decisionMadeAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!selectedBucket}
          className="px-4 py-2 rounded text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: GOLD, color: BG_PRIMARY }}
        >
          Save Decision
        </button>
      </div>
    </div>
  );
}
```

**UI Layout (ASCII):**
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ AGGRESSIVE  │ │  SLOW BURN  │ │ BACK BURNER │ │ EXPLICIT  │ │
│  │ ✓ selected  │ │             │ │             │ │    NO     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [editable textarea with template content]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Decision made: Feb 6, 2026                   [Save Decision]   │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Clicking bucket loads default template (warns if user has edits)
- User can edit template freely
- Save persists both decisionBucket and nextStepNotes
- Show timestamp of when decision was made

**Acceptance Criteria:**
- [ ] 4 bucket buttons render with correct colors
- [ ] Clicking bucket loads template
- [ ] Warning shown when changing bucket with edited notes
- [ ] Notes textarea editable
- [ ] Save button calls onSave with bucket and notes
- [ ] Timestamp displays when decision exists

---

### Task 2.2: Create StakeholdersSection Component
**Description:** Display extracted stakeholders with role tags, edit/add functionality
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.3
**Can run parallel with:** Task 2.1, Task 2.3

**Technical Requirements:**
Create `app/central-command/components/StakeholdersSection.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  GOLD,
  GREEN,
  BLUE,
  RED,
  BG_ELEVATED,
  BG_PRIMARY,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';

interface Stakeholder {
  name: string;
  title: string | null;
  role: string;
  context: string;
  contactInfo?: { email: string | null; phone: string | null; linkedin: string | null };
  confidence: number;
}

interface StakeholdersSectionProps {
  stakeholders: Stakeholder[];
  onEdit?: (index: number, updated: Stakeholder) => void;
  onAdd?: (stakeholder: Stakeholder) => void;
}

const ROLE_COLORS: Record<string, string> = {
  champion: GREEN,
  economic_buyer: GOLD,
  decision_maker: GOLD,
  technical_evaluator: BLUE,
  blocker: RED,
  unknown: TEXT_MUTED,
};

const ROLE_LABELS: Record<string, string> = {
  champion: 'Champion',
  economic_buyer: 'Economic Buyer',
  decision_maker: 'Decision Maker',
  technical_evaluator: 'Technical Evaluator',
  operations_gatekeeper: 'Operations',
  legal_compliance: 'Legal/Compliance',
  end_user: 'End User',
  influencer: 'Influencer',
  blocker: 'Blocker',
  unknown: 'Unknown',
};

export default function StakeholdersSection({
  stakeholders,
  onEdit,
  onAdd,
}: StakeholdersSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState<Stakeholder | null>(null);

  function handleCardClick(index: number) {
    if (editingIndex !== null) return;
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  function handleEditClick(index: number, stakeholder: Stakeholder) {
    setEditingIndex(index);
    setEditForm({ ...stakeholder });
  }

  function handleSaveEdit() {
    if (editingIndex !== null && editForm && onEdit) {
      onEdit(editingIndex, editForm);
      setEditingIndex(null);
      setEditForm(null);
    }
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setEditForm(null);
  }

  function handleAddNew() {
    setShowAddForm(true);
    setEditForm({
      name: '',
      title: '',
      role: 'unknown',
      context: '',
      contactInfo: { email: null, phone: null, linkedin: null },
      confidence: 0.5,
    });
  }

  function handleSaveNew() {
    if (editForm && onAdd && editForm.name.trim()) {
      onAdd(editForm);
      setShowAddForm(false);
      setEditForm(null);
    }
  }

  function handleCancelAdd() {
    setShowAddForm(false);
    setEditForm(null);
  }

  if (stakeholders.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-6">
        <p className="text-sm mb-3" style={{ color: TEXT_DIM }}>
          No stakeholders extracted yet.
        </p>
        {onAdd && (
          <button
            onClick={handleAddNew}
            className="px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: GOLD, border: `1px solid ${GOLD}` }}
          >
            + Add Stakeholder
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add button */}
      {onAdd && !showAddForm && (
        <div className="flex justify-end">
          <button
            onClick={handleAddNew}
            className="px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: GOLD }}
          >
            + Add
          </button>
        </div>
      )}

      {/* Stakeholder cards */}
      {stakeholders.map((stakeholder, index) => {
        const roleColor = ROLE_COLORS[stakeholder.role] || TEXT_MUTED;
        const roleLabel = ROLE_LABELS[stakeholder.role] || stakeholder.role;
        const isExpanded = expandedIndex === index;
        const isEditing = editingIndex === index;

        if (isEditing && editForm) {
          return (
            <StakeholderEditForm
              key={index}
              stakeholder={editForm}
              onChange={setEditForm}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          );
        }

        return (
          <div
            key={index}
            onClick={() => handleCardClick(index)}
            className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
            style={{ background: BG_ELEVATED }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                  {stakeholder.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase"
                  style={{ background: `${roleColor}20`, color: roleColor }}
                >
                  {roleLabel}
                </span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: TEXT_DIM }}>
                {Math.round(stakeholder.confidence * 100)}%
              </span>
            </div>

            {/* Title */}
            {stakeholder.title && (
              <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                {stakeholder.title}
              </p>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
                  {stakeholder.context}
                </p>

                {stakeholder.contactInfo && (
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: TEXT_DIM }}>
                    {stakeholder.contactInfo.email && (
                      <span>📧 {stakeholder.contactInfo.email}</span>
                    )}
                    {stakeholder.contactInfo.phone && (
                      <span>📱 {stakeholder.contactInfo.phone}</span>
                    )}
                    {stakeholder.contactInfo.linkedin && (
                      <span>🔗 LinkedIn</span>
                    )}
                  </div>
                )}

                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(index, stakeholder);
                    }}
                    className="mt-3 px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
                    style={{ color: TEXT_MUTED }}
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {showAddForm && editForm && (
        <StakeholderEditForm
          stakeholder={editForm}
          onChange={setEditForm}
          onSave={handleSaveNew}
          onCancel={handleCancelAdd}
          isNew
        />
      )}
    </div>
  );
}

// Edit form subcomponent
function StakeholderEditForm({
  stakeholder,
  onChange,
  onSave,
  onCancel,
  isNew = false,
}: {
  stakeholder: Stakeholder;
  onChange: (s: Stakeholder) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const roles = Object.keys(ROLE_LABELS);

  return (
    <div className="p-3 rounded-lg space-y-3" style={{ background: BG_ELEVATED, border: '1px solid rgba(212,165,74,0.3)' }}>
      <input
        type="text"
        value={stakeholder.name}
        onChange={(e) => onChange({ ...stakeholder, name: e.target.value })}
        placeholder="Name"
        className="w-full px-2 py-1 rounded text-sm"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <input
        type="text"
        value={stakeholder.title || ''}
        onChange={(e) => onChange({ ...stakeholder, title: e.target.value })}
        placeholder="Title"
        className="w-full px-2 py-1 rounded text-sm"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <select
        value={stakeholder.role}
        onChange={(e) => onChange({ ...stakeholder, role: e.target.value })}
        className="w-full px-2 py-1 rounded text-sm"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {roles.map((role) => (
          <option key={role} value={role}>{ROLE_LABELS[role]}</option>
        ))}
      </select>
      <textarea
        value={stakeholder.context}
        onChange={(e) => onChange({ ...stakeholder, context: e.target.value })}
        placeholder="Context about this stakeholder..."
        className="w-full px-2 py-1 rounded text-sm resize-none"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)', minHeight: '60px' }}
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-3 py-1 rounded text-xs" style={{ color: TEXT_MUTED }}>
          Cancel
        </button>
        <button onClick={onSave} className="px-3 py-1 rounded text-xs" style={{ background: GOLD, color: BG_PRIMARY }}>
          {isNew ? 'Add' : 'Save'}
        </button>
      </div>
    </div>
  );
}
```

**Role tag styling:**
- champion → GREEN badge
- economic_buyer → GOLD badge
- decision_maker → GOLD badge
- technical_evaluator → BLUE badge
- blocker → RED badge
- unknown → TEXT_MUTED badge

**Acceptance Criteria:**
- [ ] Stakeholder cards render with name, title, role badge
- [ ] Clicking card expands to show context and contact info
- [ ] Edit button in expanded view opens edit form
- [ ] Add button opens new stakeholder form
- [ ] Role dropdown shows all role options
- [ ] Empty state shows "No stakeholders" with add button

---

### Task 2.3: Create OperationalDetails Component
**Description:** Display operational extractions, next action, and contact info
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.3
**Can run parallel with:** Task 2.1, Task 2.2

**Technical Requirements:**
Create `app/central-command/components/OperationalDetails.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  GOLD,
  GREEN,
  BLUE,
  BG_ELEVATED,
  BG_PRIMARY,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { PipelineRecommendation } from '@/lib/central-command/schemas';

interface OperationalDetailsProps {
  recommendations: PipelineRecommendation[];
  nextAction: string | null;
  nextActionDate: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  onUpdateNextAction: (action: string, date?: Date) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  budget_signal: 'Budget',
  timeline_signal: 'Timeline',
  next_action: 'Action',
  contact_info: 'Contact',
  company_info: 'Company',
};

const CATEGORY_COLORS: Record<string, string> = {
  budget_signal: GOLD,
  timeline_signal: BLUE,
  next_action: GREEN,
};

export default function OperationalDetails({
  recommendations,
  nextAction,
  nextActionDate,
  contactName,
  contactEmail,
  contactPhone,
  onUpdateNextAction,
}: OperationalDetailsProps) {
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [editedAction, setEditedAction] = useState(nextAction || '');
  const [editedDate, setEditedDate] = useState(
    nextActionDate ? nextActionDate.toISOString().split('T')[0] : ''
  );

  // Filter to operational categories only
  const operationalRecs = recommendations.filter(
    (r) => ['budget_signal', 'timeline_signal', 'next_action'].includes(r.category)
  );

  function handleSaveAction() {
    onUpdateNextAction(editedAction, editedDate ? new Date(editedDate) : undefined);
    setIsEditingAction(false);
  }

  function handleCancelEdit() {
    setEditedAction(nextAction || '');
    setEditedDate(nextActionDate ? nextActionDate.toISOString().split('T')[0] : '');
    setIsEditingAction(false);
  }

  return (
    <div className="space-y-4">
      {/* Next Action */}
      <div>
        <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
          Next Action
        </p>
        {isEditingAction ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editedAction}
              onChange={(e) => setEditedAction(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: BG_ELEVATED, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.15)' }}
              placeholder="What's the next step?"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                className="px-2 py-1 rounded text-sm"
                style={{ background: BG_ELEVATED, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <button onClick={handleCancelEdit} className="px-2 py-1 rounded text-xs" style={{ color: TEXT_MUTED }}>
                Cancel
              </button>
              <button onClick={handleSaveAction} className="px-2 py-1 rounded text-xs" style={{ background: GOLD, color: BG_PRIMARY }}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingAction(true)}
            className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5 flex items-center justify-between"
            style={{ background: BG_ELEVATED }}
          >
            <span className="text-sm" style={{ color: nextAction ? TEXT_PRIMARY : TEXT_DIM }}>
              {nextAction || 'Click to add next action...'}
            </span>
            {nextActionDate && (
              <span className="text-xs font-mono" style={{ color: GOLD }}>
                📅 {nextActionDate.toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Extracted Signals */}
      {operationalRecs.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
            Extracted Signals
          </p>
          <div className="space-y-1">
            {operationalRecs.map((rec, idx) => {
              const color = CATEGORY_COLORS[rec.category] || TEXT_MUTED;
              const label = CATEGORY_LABELS[rec.category] || rec.category;

              return (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="font-mono" style={{ color }}>
                    {label}:
                  </span>
                  <span style={{ color: TEXT_MUTED }}>
                    "{rec.capturedText}"
                  </span>
                  {rec.suggestedValue && (
                    <span style={{ color: TEXT_DIM }}>
                      → {rec.suggestedValue}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {(contactName || contactEmail || contactPhone) && (
        <div>
          <p className="text-xs font-mono uppercase mb-2" style={{ color: TEXT_DIM }}>
            Contact Info
          </p>
          <p className="text-sm" style={{ color: TEXT_MUTED }}>
            {[contactName, contactEmail, contactPhone].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Next action displays with optional date
- [ ] Click next action opens inline edit
- [ ] Date picker functional
- [ ] Extracted signals grouped and colored by category
- [ ] Contact info aggregated when present

---

## Phase 3: Integration

### Task 3.1: Integrate Components into ClientDetailModal
**Description:** Add StakeholdersSection, DecisionPanel, and OperationalDetails to modal
**Size:** Medium
**Priority:** High
**Dependencies:** Task 2.1, Task 2.2, Task 2.3
**Can run parallel with:** None

**Technical Requirements:**
Update `app/central-command/components/ClientDetailModal.tsx`:

1. Add imports at top:
```typescript
import DecisionPanel from './DecisionPanel';
import StakeholdersSection from './StakeholdersSection';
import OperationalDetails from './OperationalDetails';
import type { DecisionBucket } from '@/lib/central-command/decision-templates';
```

2. Add handler functions after existing handlers:
```typescript
async function handleDecisionSave(bucket: DecisionBucket, notes: string) {
  await handleUpdate({
    decisionBucket: bucket,
    nextStepNotes: notes,
    decisionMadeAt: new Date().toISOString(),
  });
}

async function handleStakeholderEdit(index: number, updated: Stakeholder) {
  if (!enrichmentFindings?.stakeholders) return;
  const updatedStakeholders = [...enrichmentFindings.stakeholders];
  updatedStakeholders[index] = updated;
  await handleUpdate({
    enrichmentFindings: { ...enrichmentFindings, stakeholders: updatedStakeholders },
  });
}

async function handleStakeholderAdd(stakeholder: Stakeholder) {
  const currentStakeholders = enrichmentFindings?.stakeholders || [];
  await handleUpdate({
    enrichmentFindings: { ...enrichmentFindings, stakeholders: [...currentStakeholders, stakeholder] },
  });
}

async function handleNextActionUpdate(action: string, date?: Date) {
  await handleUpdate({
    nextAction: action,
    nextActionDate: date?.toISOString(),
  });
}
```

3. Add sections after CLIENT INTELLIGENCE (after line ~533):
```tsx
{/* Stakeholders Section */}
{enrichmentFindings && (
  <Section title="STAKEHOLDERS">
    <StakeholdersSection
      stakeholders={(enrichmentFindings as any).stakeholders || []}
      onEdit={handleStakeholderEdit}
      onAdd={handleStakeholderAdd}
    />
  </Section>
)}

{/* Decision Panel */}
<Section title="PURSUIT DECISION">
  <DecisionPanel
    currentBucket={record.decisionBucket as DecisionBucket | null}
    currentNotes={record.nextStepNotes || ''}
    decisionMadeAt={record.decisionMadeAt?.toISOString() || null}
    synthesis={enrichmentFindings}
    onSave={handleDecisionSave}
  />
</Section>

{/* Operational Details */}
<Section title="OPERATIONAL DETAILS">
  <OperationalDetails
    recommendations={[]} // TODO: Parse from enrichmentSuggestedActions if needed
    nextAction={record.nextAction}
    nextActionDate={record.nextActionDate}
    contactName={prospect.contactName}
    contactEmail={prospect.contactEmail}
    contactPhone={prospect.contactPhone}
    onUpdateNextAction={handleNextActionUpdate}
  />
</Section>
```

**Acceptance Criteria:**
- [ ] All three new sections render in modal
- [ ] Decision saves to database
- [ ] Stakeholder edits persist
- [ ] Next action updates persist
- [ ] TypeScript compiles

---

### Task 3.2: Update API Route for Decision Fields
**Description:** Ensure PATCH handler maps decision fields to PipelineRecord
**Size:** Small
**Priority:** High
**Dependencies:** Task 1.1, Task 1.3
**Can run parallel with:** Task 3.1

**Technical Requirements:**
Update `app/api/central-command/prospects/[id]/route.ts`:

In the PATCH handler, ensure the record update includes:
```typescript
// In the pipelineRecordData object
decisionBucket: data.decisionBucket,
nextStepNotes: data.nextStepNotes,
decisionMadeAt: data.decisionMadeAt ? new Date(data.decisionMadeAt) : undefined,
```

**Acceptance Criteria:**
- [ ] PATCH accepts decisionBucket, nextStepNotes, decisionMadeAt
- [ ] Fields correctly mapped to PipelineRecord update
- [ ] API returns updated data

---

## Phase 4: Testing & Polish

### Task 4.1: Manual Testing & Edge Cases
**Description:** Test all flows and fix edge cases
**Size:** Medium
**Priority:** High
**Dependencies:** Task 3.1, Task 3.2
**Can run parallel with:** None

**Test Scenarios:**
1. **Bucket selection:** Click each bucket → verify template loads
2. **Template editing:** Modify template → save → verify persisted correctly
3. **Bucket change warning:** Select different bucket after editing → verify warning shown
4. **Stakeholder display:** Load prospect with stakeholders → verify role tags render
5. **Stakeholder editing:** Click stakeholder → edit details → verify persisted
6. **Stakeholder adding:** Click Add → fill form → verify persisted
7. **Next action editing:** Click next action → edit → verify saved with date
8. **Empty states:** Test with no stakeholders, no decision, no next action

**Acceptance Criteria:**
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] UI matches design system

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1: Data Layer | 3 tasks | ~1 hour |
| Phase 2: Components | 3 tasks | ~3 hours |
| Phase 3: Integration | 2 tasks | ~1 hour |
| Phase 4: Testing | 1 task | ~30 min |
| **Total** | **9 tasks** | **~5.5 hours** |

**Parallel Execution:**
- Tasks 1.1 and 1.2 can run in parallel
- Tasks 2.1, 2.2, and 2.3 can all run in parallel after Phase 1
- Tasks 3.1 and 3.2 can run in parallel
