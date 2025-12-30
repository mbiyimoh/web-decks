# Task Breakdown: Claude Code Workflow Curriculum Improvements

Generated: 2025-12-30
Source: specs/feat-claude-code-workflow-curriculum-improvements.md

## Overview

Apply 13 pedagogical improvements to the Claude Code Workflow learning module. Changes include structural reorganization, new sections, enhanced components, and content improvements based on stakeholder feedback and learning content guide audit.

**Target file:** `app/learning/ai-workflow/claude-code-workflow/ClaudeCodeWorkflowDeck.tsx`

## Execution Strategy

**Parallel Opportunities:**
- Phase 1 tasks are sequential (structural changes must happen in order)
- Phase 2 tasks can run in parallel (independent content additions)
- Phase 3 tasks can mostly run in parallel after Phase 2

**Critical Path:** 1.1 → 1.2 → 1.3 → 2.1 → (parallel: 2.2, 2.3, 2.4) → (parallel: 3.x)

---

## Phase 1: Structural Foundation

These tasks reorganize the deck structure. Must be done first and in order.

### Task 1.1: Fix Equation Consistency

**Description**: Change "Faithful Execution of Bad Ideas" to "Shitty Output" for parallelism with success equation
**Size**: Small
**Priority**: P1
**Dependencies**: None
**Can run parallel with**: None (do first)

**Location**: Philosophy section, approximately line 817

**Current Code**:
```tsx
<p className="text-red-400 font-semibold">= Faithful Execution of Bad Ideas ✗</p>
```

**Change To**:
```tsx
<p className="text-red-400 font-semibold">= Shitty Output ✗</p>
```

**Rationale**: Creates parallelism with "= Great Output ✓" - improves memorability through symmetric phrasing.

**Acceptance Criteria**:
- [ ] Philosophy section shows "= Shitty Output ✗"
- [ ] Parallelism with "= Great Output ✓" is clear
- [ ] No other content affected

---

### Task 1.2: Update Navigation Array for New Sections

**Description**: Add placeholder entries for new sections and reorder Three Commandments
**Size**: Small
**Priority**: P1
**Dependencies**: 1.1
**Can run parallel with**: None

**Current sections array** (approximate):
```tsx
const sections = [
  { id: 'title', label: 'Welcome' },
  { id: 'philosophy', label: 'The Philosophy' },
  { id: 'three-commandments', label: 'Three Commandments' },
  { id: 'input-quality', label: 'Input Quality' },
  { id: 'pipeline-overview', label: 'The Pipeline' },
  { id: 'ideate', label: '/spec:ideate' },
  { id: 'validate', label: '/spec:validate' },
  { id: 'decompose', label: '/spec:decompose' },
  { id: 'execute', label: '/spec:execute' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'hooks-subagents', label: 'Hooks & Subagents' },
  { id: 'real-scenarios', label: 'Real Scenarios' },
  { id: 'evolve-workflow', label: 'Evolve the Workflow' },
  { id: 'summary', label: 'Summary' },
];
```

**Change To**:
```tsx
const sections = [
  { id: 'title', label: 'Welcome' },
  { id: 'philosophy', label: 'The Philosophy' },
  { id: 'specificity-problem', label: 'Specificity Problem' },  // NEW
  { id: 'input-quality', label: 'Input Quality' },
  { id: 'pipeline-overview', label: 'The Pipeline' },
  { id: 'ideate', label: '/spec:ideate' },
  { id: 'spec-create', label: '/spec:create' },  // NEW
  { id: 'validate', label: '/spec:validate' },
  { id: 'decompose', label: '/spec:decompose' },
  { id: 'execute', label: '/spec:execute' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'hooks-subagents', label: 'Hooks & Subagents' },
  { id: 'real-scenarios', label: 'Real Scenarios' },
  { id: 'evolve-workflow', label: 'Evolve the Workflow' },
  { id: 'three-commandments', label: 'PS: Commandments' },  // MOVED & RENAMED
  { id: 'summary', label: 'Summary' },
];
```

**Acceptance Criteria**:
- [ ] `specificity-problem` added after `philosophy`
- [ ] `spec-create` added after `ideate`
- [ ] `three-commandments` moved to after `evolve-workflow`, before `summary`
- [ ] Label changed from "Three Commandments" to "PS: Commandments"

---

### Task 1.3: Move Three Commandments Section in JSX

**Description**: Physically relocate the Three Commandments section from after Input Quality to after Evolve the Workflow
**Size**: Medium
**Priority**: P1
**Dependencies**: 1.2
**Can run parallel with**: None

**Implementation Steps**:

1. Find the Three Commandments section (search for `id="three-commandments"`)
2. Cut the entire `<Section id="three-commandments">...</Section>` block
3. Paste it after the Evolve the Workflow section, before Summary

**Section Modifications** (apply when moving):

Update section label:
```tsx
// Old
<SectionLabel>THE THREE COMMANDMENTS</SectionLabel>

// New
<SectionLabel>PS — A PARTING PHILOSOPHY</SectionLabel>
```

Reduce headline size:
```tsx
// Old
<h2 className="font-display text-4xl md:text-5xl ...">

// New
<h2 className="font-display text-3xl md:text-4xl ...">
```

**Acceptance Criteria**:
- [ ] Section appears after Evolve the Workflow, before Summary
- [ ] Section label reads "PS — A PARTING PHILOSOPHY"
- [ ] Headline size is text-3xl md:text-4xl
- [ ] Three commandment cards remain unchanged
- [ ] NavDots correctly highlight this section when scrolled to

---

## Phase 2: New Sections and Components

These tasks add new content. Can run in parallel after Phase 1.

### Task 2.1: Add Specificity Problem Section

**Description**: Create new section explaining why AI fails without explicit context
**Size**: Large
**Priority**: P1
**Dependencies**: 1.3
**Can run parallel with**: None (creates structure for 2.2, 2.3)

**Insert Location**: After Philosophy section, before Input Quality section

**Full Section Implementation**:
```tsx
{/* ============================================ */}
{/* SPECIFICITY PROBLEM */}
{/* ============================================ */}
<Section id="specificity-problem">
  <div className="max-w-5xl mx-auto px-6 py-24 md:py-32">
    <RevealText>
      <SectionLabel>THE SPECIFICITY PROBLEM</SectionLabel>
    </RevealText>

    <RevealText delay={0.1}>
      <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-6">
        The AI doesn't know what you <span className="text-[#d4a54a]">didn't tell it</span>.
      </h2>
    </RevealText>

    <RevealText delay={0.15}>
      <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
        Every frustrating AI output traces back to missing context. Not model limitations — information gaps.
      </p>
    </RevealText>

    {/* Comparison Cards */}
    <RevealText delay={0.2}>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Frustration 1 */}
        <Card>
          <div className="space-y-4">
            <p className="text-red-400 font-medium">"Why did it hardcode this value?"</p>
            <div className="h-px bg-zinc-800" />
            <p className="text-zinc-400 text-sm">
              <span className="text-zinc-300">Because you never told it</span> you wanted that to be configurable, or pointed it at your config patterns.
            </p>
          </div>
        </Card>

        {/* Frustration 2 */}
        <Card>
          <div className="space-y-4">
            <p className="text-red-400 font-medium">"Why create a new function when one exists?"</p>
            <div className="h-px bg-zinc-800" />
            <p className="text-zinc-400 text-sm">
              <span className="text-zinc-300">Because you never pointed it</span> at your existing utility functions or established patterns.
            </p>
          </div>
        </Card>
      </div>
    </RevealText>

    {/* Reframe Callout */}
    <RevealText delay={0.25}>
      <Card highlight>
        <p className="text-zinc-300 text-center">
          <span className="text-[#d4a54a]">The spec-based workflow solves this</span> by doing all the groundwork to make everything explicit ahead of time — presenting the plan at each step so nothing gets left to chance.
        </p>
      </Card>
    </RevealText>
  </div>
</Section>
```

**Acceptance Criteria**:
- [ ] Section appears between Philosophy and Input Quality
- [ ] Section ID is "specificity-problem"
- [ ] Two comparison cards with frustration → explanation format
- [ ] Highlighted callout with reframe message
- [ ] NavDots include "Specificity Problem" entry

---

### Task 2.2: Add /spec:create Section

**Description**: Create new section for the spec creation phase between Ideate and Validate
**Size**: Large
**Priority**: P1
**Dependencies**: 2.1
**Can run parallel with**: 2.3, 2.4

**Insert Location**: After Ideate section, before Validate section

**Full Section Implementation**:
```tsx
{/* ============================================ */}
{/* SPEC CREATE */}
{/* ============================================ */}
<Section id="spec-create">
  <div className="max-w-5xl mx-auto px-6 py-24 md:py-32">
    <RevealText>
      <SectionLabel className="text-[#d4a54a]">/SPEC:CREATE</SectionLabel>
    </RevealText>

    {/* Pipeline Progress Indicator - added in Task 3.2 */}

    <RevealText delay={0.1}>
      <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-6">
        From research to <span className="text-[#d4a54a]">explicit decisions</span>
      </h2>
    </RevealText>

    <RevealText delay={0.15}>
      <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
        The ideation gave you options. Now you commit to a path and document every decision.
      </p>
    </RevealText>

    {/* Two Cards Side by Side */}
    <RevealText delay={0.2}>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Decisions Made Explicit */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-[#d4a54a]">Decisions Made Explicit</h3>
          <ul className="space-y-2 text-zinc-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#d4a54a] mt-1">•</span>
              <span>User stories with acceptance criteria</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#d4a54a] mt-1">•</span>
              <span>Technical approach with rationale</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#d4a54a] mt-1">•</span>
              <span>Security considerations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#d4a54a] mt-1">•</span>
              <span>Rollout and migration plan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#d4a54a] mt-1">•</span>
              <span>Edge cases and error handling</span>
            </li>
          </ul>
        </Card>

        {/* Why It Matters */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-white">Why It Matters</h3>
          <ul className="space-y-2 text-zinc-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Forces edge case thinking before code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Creates reviewable artifact for feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Gives AI everything needed for implementation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Documents decisions for future you</span>
            </li>
          </ul>
        </Card>
      </div>
    </RevealText>

    {/* Callback to Specificity Problem */}
    <RevealText delay={0.25}>
      <Card highlight>
        <p className="text-zinc-300 text-center">
          <span className="text-[#d4a54a]">This is the antidote to the specificity problem.</span>
          {" "}Every decision you'd have to make during implementation? Make it now, in the spec.
        </p>
      </Card>
    </RevealText>

    {/* Document Viewer CTA */}
    <RevealText delay={0.3}>
      <div className="mt-8 flex justify-center">
        <ViewExampleCTA documentId="spec-full-example" label="See a complete spec →" />
      </div>
    </RevealText>
  </div>
</Section>
```

**Acceptance Criteria**:
- [ ] Section appears between Ideate and Validate
- [ ] Section ID is "spec-create"
- [ ] Section label uses gold color (#d4a54a)
- [ ] Two cards: "Decisions Made Explicit" and "Why It Matters"
- [ ] Callback callout references specificity problem
- [ ] Document viewer CTA links to spec-full-example
- [ ] NavDots include "/spec:create" entry

---

### Task 2.3: Create PipelineProgress Component

**Description**: Create reusable component showing current position in the pipeline
**Size**: Medium
**Priority**: P2
**Dependencies**: 1.3
**Can run parallel with**: 2.2, 2.4

**Component Implementation** (add near top of file with other local components):
```tsx
// Pipeline progress indicator showing current stage
const PipelineProgress = ({ current }: { current: 'ideate' | 'spec' | 'validate' | 'decompose' | 'execute' }) => {
  const stages = [
    { id: 'ideate', name: 'Ideate', color: 'cyan' },
    { id: 'spec', name: 'Spec', color: 'amber' },
    { id: 'validate', name: 'Validate', color: 'green' },
    { id: 'decompose', name: 'Decompose', color: 'purple' },
    { id: 'execute', name: 'Execute', color: 'orange' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              stage.id === current
                ? 'bg-white text-black scale-110 shadow-lg'
                : 'bg-zinc-800/50 text-zinc-500'
            }`}
          >
            {stage.name}
          </div>
          {index < stages.length - 1 && (
            <div className={`w-4 h-px ${
              stages.findIndex(s => s.id === current) > index
                ? 'bg-zinc-500'
                : 'bg-zinc-800'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Component renders 5 pipeline stages
- [ ] Current stage is highlighted (white bg, black text, scaled up)
- [ ] Connector lines show progress through pipeline
- [ ] Works for all 5 stage values

---

### Task 2.4: Enhance Document Viewer with Tab Groups

**Description**: Add tab-switching capability to DocumentViewerPanel for multiple related documents
**Size**: Large
**Priority**: P2
**Dependencies**: 1.3
**Can run parallel with**: 2.2, 2.3

**New Types** (add to existing type definitions):
```tsx
type DocumentGroup = {
  groupId: string;
  title: string;
  documents: DocumentMeta[];
};
```

**Update DocumentViewerContext**:
```tsx
// Add to context interface
interface DocumentViewerContextType {
  // ... existing fields
  activeDocumentIndex: number;
  setActiveDocumentIndex: (index: number) => void;
  documentGroup: DocumentGroup | null;
  openDocumentGroup: (group: DocumentGroup) => void;
}

// Add to provider state
const [activeDocumentIndex, setActiveDocumentIndex] = useState(0);
const [documentGroup, setDocumentGroup] = useState<DocumentGroup | null>(null);

const openDocumentGroup = (group: DocumentGroup) => {
  setDocumentGroup(group);
  setActiveDocumentIndex(0);
  if (group.documents.length > 0) {
    setActiveDocument(group.documents[0]);
  }
  setIsOpen(true);
};
```

**Tab Switcher UI** (add to DocumentViewerPanel header):
```tsx
{/* Tab switcher for document groups */}
{documentGroup && documentGroup.documents.length > 1 && (
  <div className="flex gap-1 px-4 py-2 bg-[#0a0a0f] border-b border-zinc-800">
    {documentGroup.documents.map((doc, index) => (
      <button
        key={doc.id}
        onClick={() => {
          setActiveDocumentIndex(index);
          setActiveDocument(doc);
        }}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          index === activeDocumentIndex
            ? 'bg-[#d4a54a]/20 text-[#d4a54a] border border-[#d4a54a]/30'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
      >
        {doc.title}
      </button>
    ))}
  </div>
)}
```

**New Documents to Add** (add to DOCUMENTS record):
```tsx
'customgpt-instructions': {
  id: 'customgpt-instructions',
  title: 'CustomGPT Instructions',
  path: 'customgpt-system-prompt.md',
  content: `# CustomGPT System Instructions

## Role Definition

You are a specialized assistant for [Product Name]. You help users with:
- Feature explanations
- Troubleshooting common issues
- Best practices and recommendations

## Communication Guidelines

- Be concise and direct
- Use bullet points for lists
- Include code examples when relevant
- Ask clarifying questions before making assumptions

## Domain Knowledge

### Product Features
- Feature A: [Description]
- Feature B: [Description]

### Common Workflows
1. Getting started: [Steps]
2. Advanced configuration: [Steps]

## Boundaries

- Do not provide medical, legal, or financial advice
- Redirect off-topic questions politely
- Escalate to human support for billing issues`
},

'subagent-definition': {
  id: 'subagent-definition',
  title: 'Claude Subagent',
  path: '.claude/agents/react-expert.md',
  content: `---
name: react-expert
description: React component patterns, hooks, and performance expert
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - MultiEdit
  - Write
delegation_paths:
  - typescript-expert: For complex TypeScript type issues
  - playwright-expert: For E2E testing
---

# React Expert Agent

## Domain Coverage

You specialize in:
- React component architecture
- Hooks implementation and composition
- Performance optimization
- State management patterns
- Testing strategies

## Problem Patterns

### Hook Errors
- Conditional hook calls
- Missing dependencies
- Stale closures

### Re-rendering Issues
- Unnecessary re-renders
- Missing memoization
- Context optimization

## Approach

1. Diagnose the specific issue category
2. Search for related patterns in codebase
3. Apply React best practices
4. Verify with examples`
},
```

**Update ViewExampleCTA** to support groups:
```tsx
interface ViewExampleCTAProps {
  documentId?: DocumentId;
  group?: DocumentGroup;
  sectionId?: string;
  label?: string;
}

function ViewExampleCTA({ documentId, group, sectionId, label = "See example →" }: ViewExampleCTAProps) {
  const { openDocument, openDocumentGroup, scrollToSection } = useDocumentViewer();

  const handleClick = () => {
    if (group) {
      openDocumentGroup(group);
    } else if (documentId) {
      openDocument(DOCUMENTS[documentId]);
    }
    if (sectionId) {
      scrollToSection(sectionId);
    }
  };

  return (
    <button onClick={handleClick} className="...existing styles...">
      {label}
    </button>
  );
}
```

**Acceptance Criteria**:
- [ ] DocumentGroup type exists
- [ ] Context supports document groups with active index
- [ ] Tab switcher appears when viewing a group with 2+ documents
- [ ] Active tab is highlighted with gold styling
- [ ] Clicking tabs switches displayed document
- [ ] New example documents added (CustomGPT, Subagent)
- [ ] ViewExampleCTA supports group prop

---

## Phase 3: Content Enhancements

These tasks add content improvements. Can run in parallel after Phase 2.

### Task 3.1: Add Callback References

**Description**: Add callback cards throughout the deck connecting to earlier concepts
**Size**: Medium
**Priority**: P2
**Dependencies**: 2.1, 2.2
**Can run parallel with**: 3.2, 3.3, 3.4, 3.5, 3.6

**Callback Pattern** (reusable):
```tsx
<Card highlight>
  <p className="text-zinc-300">
    <span className="text-[#d4a54a]">[Callback phrase]</span>
    {" "}[Connection to current content]
  </p>
</Card>
```

**Callbacks to Add**:

1. **In /spec:create section** (already in Task 2.2):
   - "This is the antidote to the specificity problem."

2. **In /spec:validate section** (add after headline):
```tsx
<RevealText delay={0.2}>
  <Card highlight className="mb-8">
    <p className="text-zinc-300">
      <span className="text-[#d4a54a]">Remember the specificity problem?</span>
      {" "}This is where we catch it — before implementation.
    </p>
  </Card>
</RevealText>
```

3. **In /spec:decompose section** (add after headline):
```tsx
<RevealText delay={0.2}>
  <Card highlight className="mb-8">
    <p className="text-zinc-300">
      <span className="text-[#d4a54a]">Context is everything</span>
      {" "}— and each task needs ALL of it embedded.
    </p>
  </Card>
</RevealText>
```

4. **In Debugging section** (add after headline):
```tsx
<RevealText delay={0.2}>
  <Card highlight className="mb-8">
    <p className="text-zinc-300">
      <span className="text-[#d4a54a]">This is "Use AI on Itself"</span>
      {" "}applied to problem-solving.
    </p>
  </Card>
</RevealText>
```

5. **In Summary section** (add after revised headline - see Task 3.3):
```tsx
<RevealText delay={0.35}>
  <p className="text-zinc-500 mt-8">
    Remember: a shitty LLM can execute a great plan brilliantly.
    <br />
    Now you know how to make that plan.
  </p>
</RevealText>
```

**Acceptance Criteria**:
- [ ] Callback in /spec:validate references specificity problem
- [ ] Callback in /spec:decompose emphasizes context
- [ ] Callback in Debugging references "Use AI on Itself"
- [ ] Summary has callback to opening philosophy
- [ ] All callbacks use consistent styling (gold highlight)

---

### Task 3.2: Add Pipeline Progress Indicators

**Description**: Add PipelineProgress component to each pipeline stage section
**Size**: Small
**Priority**: P2
**Dependencies**: 2.3
**Can run parallel with**: 3.1, 3.3, 3.4, 3.5, 3.6

**Add to these sections** (after SectionLabel, before headline):

1. **Ideate section**:
```tsx
<RevealText delay={0.05}>
  <PipelineProgress current="ideate" />
</RevealText>
```

2. **/spec:create section**:
```tsx
<RevealText delay={0.05}>
  <PipelineProgress current="spec" />
</RevealText>
```

3. **Validate section**:
```tsx
<RevealText delay={0.05}>
  <PipelineProgress current="validate" />
</RevealText>
```

4. **Decompose section**:
```tsx
<RevealText delay={0.05}>
  <PipelineProgress current="decompose" />
</RevealText>
```

5. **Execute section**:
```tsx
<RevealText delay={0.05}>
  <PipelineProgress current="execute" />
</RevealText>
```

**Acceptance Criteria**:
- [ ] All 5 pipeline sections show progress indicator
- [ ] Current stage is highlighted in each section
- [ ] Indicators appear between section label and headline
- [ ] Animation delays don't conflict with existing content

---

### Task 3.3: Rephrase Summary Section

**Description**: Update Summary to use different wording than Philosophy (avoid verbatim repetition)
**Size**: Small
**Priority**: P2
**Dependencies**: 1.3
**Can run parallel with**: 3.1, 3.2, 3.4, 3.5, 3.6

**Current Summary Headline**:
```tsx
<h2>Quality of output is bounded by <span className="text-[#d4a54a]">quality of input</span></h2>
```

**Revised Summary Headline**:
```tsx
<h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
  The plan is <span className="text-[#d4a54a]">the product</span>
</h2>
```

**Current Supporting Text**: (varies)

**Revised Supporting Text**:
```tsx
<RevealText delay={0.15}>
  <p className="text-xl text-zinc-400 mb-8 max-w-3xl">
    Everything in this workflow exists for one purpose:
    <br />
    <span className="text-[#d4a54a]">Make the input so good that execution becomes trivial.</span>
  </p>
</RevealText>
```

**Acceptance Criteria**:
- [ ] Summary headline reads "The plan is the product"
- [ ] Supporting text emphasizes input quality differently than opening
- [ ] No verbatim repetition from Philosophy section
- [ ] Callback to opening added (see Task 3.1)

---

### Task 3.4: Add Core Insight to Real Scenarios

**Description**: Add pedagogical hook before the scenario reference list
**Size**: Medium
**Priority**: P3
**Dependencies**: 1.3
**Can run parallel with**: 3.1, 3.2, 3.3, 3.5, 3.6

**Current Structure**: Just headline "When to use what" + scenario cards

**Revised Structure** (replace headline area):
```tsx
<RevealText delay={0.1}>
  <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
    Match <span className="text-[#d4a54a]">investment to risk</span>
  </h2>
</RevealText>
<RevealText delay={0.15}>
  <p className="text-xl text-zinc-400 mb-8 max-w-3xl">
    Full pipeline for high-stakes changes. Lean spec for low-risk tweaks.
    The workflow scales to the problem.
  </p>
</RevealText>
<RevealText delay={0.2}>
  <Card highlight className="mb-12">
    <p className="text-zinc-300 text-center">
      <span className="text-[#d4a54a]">The question isn't "should I use the pipeline?"</span>
      {" "}It's "how much of the pipeline does this problem deserve?"
    </p>
  </Card>
</RevealText>
```

**Acceptance Criteria**:
- [ ] Headline changed to "Match investment to risk"
- [ ] Supporting paragraph explains scaling concept
- [ ] Highlighted callout with reframing question
- [ ] Scenario cards remain below the new content

---

### Task 3.5: Add Decision Framework to Debugging

**Description**: Add decision tree for choosing between debugging approaches
**Size**: Medium
**Priority**: P3
**Dependencies**: 1.3
**Can run parallel with**: 3.1, 3.2, 3.3, 3.4, 3.6

**Insert Before**: The two debugging approach cards

**Decision Framework Card**:
```tsx
<RevealText delay={0.15}>
  <Card className="mb-8" highlight>
    <h3 className="text-lg font-semibold mb-4 text-[#d4a54a]">Which approach?</h3>
    <div className="text-zinc-400 text-sm space-y-3">
      <p>Ask yourself: <span className="text-white">"Did I write the broken code?"</span></p>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-[#0d0d0d] border border-[#d4a54a]/30 rounded-lg p-4 text-center">
          <p className="text-[#d4a54a] font-medium mb-1">Yes → Your code</p>
          <p className="text-zinc-500 text-xs font-mono">/methodical-debug</p>
        </div>
        <div className="bg-[#0d0d0d] border border-blue-400/30 rounded-lg p-4 text-center">
          <p className="text-blue-400 font-medium mb-1">No → External system</p>
          <p className="text-zinc-500 text-xs font-mono">/research-driven-debug</p>
        </div>
      </div>
    </div>
  </Card>
</RevealText>
```

**Acceptance Criteria**:
- [ ] Decision framework appears before the two approach cards
- [ ] Two-column layout with contrasting colors (gold vs blue)
- [ ] Clear decision question: "Did I write the broken code?"
- [ ] Each path leads to correct debugging approach

---

### Task 3.6: Add Stakes to Hooks & Subagents

**Description**: Add motivating content explaining why automation matters
**Size**: Small
**Priority**: P3
**Dependencies**: 1.3
**Can run parallel with**: 3.1, 3.2, 3.3, 3.4, 3.5

**Insert After**: Section headline, before existing content

**Stakes Card**:
```tsx
<RevealText delay={0.2}>
  <Card className="mb-8" highlight>
    <p className="text-zinc-300">
      <span className="text-purple-400">Without automation:</span> You'll forget to run tests.
      You'll ship broken TypeScript. You'll miss the obvious bug in your own code.
    </p>
    <p className="text-zinc-400 mt-2 text-sm">
      Hooks make quality inevitable. Subagents make expertise accessible.
    </p>
  </Card>
</RevealText>
```

**Acceptance Criteria**:
- [ ] Stakes card appears after headline
- [ ] Purple highlight for "Without automation:"
- [ ] Clear consequences listed
- [ ] Value proposition in secondary text

---

### Task 3.7: Add Theory → Practice Dividers

**Description**: Add visual dividers at transition points from concept to application
**Size**: Medium
**Priority**: P2
**Dependencies**: 1.3
**Can run parallel with**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6

**Divider Component Pattern**:
```tsx
<RevealText delay={0.25}>
  <div className="flex items-center gap-3 mb-6">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-400/50" />
    <span className="text-green-400 text-sm font-medium tracking-wider uppercase">
      Theory → Practice
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-400/50" />
  </div>
</RevealText>
```

**Locations to Add** (5 total):

1. **Input Quality section** — before "Making Context Persistent" subsection
2. **Hooks & Subagents section** — before "Stop Hooks" subsection
3. **Evolve the Workflow section** — before "Questions to ask yourself"
4. **Debugging section** — after the decision framework, before approach cards
5. **Real Scenarios section** — after the core insight, before scenario cards

**Acceptance Criteria**:
- [ ] 5 Theory → Practice dividers throughout deck
- [ ] Green color scheme consistent across all instances
- [ ] Placed at concept-to-application transitions
- [ ] Gradient lines fade from transparent to green

---

## Phase 4: Integration and Polish

### Task 4.1: Update Context Section with Grouped Documents

**Description**: Replace separate document CTAs with grouped tab interface
**Size**: Small
**Priority**: P2
**Dependencies**: 2.4
**Can run parallel with**: None

**Current Implementation**: Three separate ViewExampleCTA buttons

**Replace With**:
```tsx
<ViewExampleCTA
  group={{
    groupId: 'context-examples',
    title: 'Context Examples',
    documents: [
      DOCUMENTS['claude-md-example'],
      DOCUMENTS['customgpt-instructions'],
      DOCUMENTS['subagent-definition'],
    ]
  }}
  label="See context examples →"
/>
```

**Acceptance Criteria**:
- [ ] Single CTA button for context examples
- [ ] Opens grouped viewer with 3 tabs
- [ ] Tabs work correctly to switch documents
- [ ] All three document types accessible

---

### Task 4.2: Final Integration Testing

**Description**: Verify all changes work together and acceptance criteria are met
**Size**: Medium
**Priority**: P1
**Dependencies**: All previous tasks
**Can run parallel with**: None

**Verification Checklist**:

1. **Navigation**:
   - [ ] All 16 sections appear in NavDots
   - [ ] Scrolling highlights correct dot
   - [ ] Clicking dot scrolls to section

2. **New Sections**:
   - [ ] Specificity Problem renders correctly
   - [ ] /spec:create renders correctly
   - [ ] Three Commandments in correct position

3. **Components**:
   - [ ] PipelineProgress shows in all 5 pipeline sections
   - [ ] Document viewer tabs work for grouped documents
   - [ ] Video placeholders still visible

4. **Content**:
   - [ ] All 4 callback references present
   - [ ] Summary uses new wording
   - [ ] Stakes and decision framework visible
   - [ ] 5 Theory → Practice dividers present

5. **Build**:
   - [ ] TypeScript compiles without errors
   - [ ] Production build succeeds
   - [ ] No console errors in browser

**Acceptance Criteria**:
- [ ] All 19 acceptance criteria from spec verified
- [ ] No TypeScript errors
- [ ] Production build passes
- [ ] Manual scroll-through confirms all content

---

## Summary

| Phase | Tasks | Priority | Effort |
|-------|-------|----------|--------|
| Phase 1: Structural Foundation | 3 tasks | P1 | Small-Medium |
| Phase 2: New Sections & Components | 4 tasks | P1-P2 | Medium-Large |
| Phase 3: Content Enhancements | 7 tasks | P2-P3 | Small-Medium |
| Phase 4: Integration | 2 tasks | P1-P2 | Small-Medium |
| **Total** | **16 tasks** | | |

**Parallel Execution Opportunities**:
- After Task 2.1: Tasks 2.2, 2.3, 2.4 can run in parallel
- After Phase 2: All Phase 3 tasks can run in parallel
- Task 4.1 depends only on 2.4
- Task 4.2 must be last

**Estimated Implementation Order**:
1. 1.1 → 1.2 → 1.3 (sequential)
2. 2.1 (required before others)
3. 2.2 + 2.3 + 2.4 (parallel)
4. 3.1 through 3.7 (parallel)
5. 4.1
6. 4.2 (final verification)
