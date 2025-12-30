# Spec: Claude Code Workflow Module — Curriculum Improvements

## Overview

Apply pedagogical improvements to the Claude Code Workflow learning module based on stakeholder feedback. Changes improve flow, add missing content, and enhance the document viewer for richer examples.

**Target file:** `app/learning/ai-workflow/claude-code-workflow/ClaudeCodeWorkflowDeck.tsx`

---

## Changes Summary

### Original Feedback Items (P1-P2)

| Change | Type | Priority |
|--------|------|----------|
| Fix equation consistency | Edit | P1 |
| Add "Specificity Problem" section | New section | P1 |
| Add `/spec:create` section | New section | P1 |
| Move "Three Commandments" to end | Restructure | P1 |
| Add "Theory → Practice" headers | Visual pattern | P2 |
| Multi-example document viewer | Component enhancement | P2 |

### Learning Content Guide Audit Items (P2-P3)

| Change | Type | Priority |
|--------|------|----------|
| Add callback references throughout | Content | P2 |
| Add "We Are Here" pipeline indicators | Visual pattern | P2 |
| Rephrase Summary section | Content | P2 |
| Add core insight to Real Scenarios | Content | P3 |
| Add decision framework to Debugging | Content | P3 |
| Add stakes to Hooks & Subagents | Content | P3 |
| Expand Theory → Practice instances | Visual pattern | P3 |

### Video Commentary System (P2)

| Change | Type | Priority |
|--------|------|----------|
| VideoCommentary component | New component | P2 |
| Video placeholders in deck | Content integration | P2 |
| Bunny.net Stream integration | Infrastructure | P2 (when ready to record) |

---

## 1. Fix Equation Consistency

**Location:** Philosophy section, line ~817

**Current:**
```tsx
<p className="text-red-400 font-semibold">= Faithful Execution of Bad Ideas ✗</p>
```

**Change to:**
```tsx
<p className="text-red-400 font-semibold">= Shitty Output ✗</p>
```

**Rationale:** Parallelism with "= Great Output ✓" improves memorability.

---

## 2. Add "Specificity Problem" Section

**Insert after:** Philosophy section (id="philosophy")
**Insert before:** Input Quality section (id="input-quality")

**New section structure:**
- Section ID: `specificity-problem`
- Section label: "THE SPECIFICITY PROBLEM"
- Headline: "The AI doesn't know what you didn't tell it."

**Content:**
1. Two comparison cards showing common frustrations:
   - "Why did it hardcode this?" → "You never told it you wanted to extend that functionality"
   - "Why create a new function when one exists?" → "You never pointed it at existing patterns"

2. Callout card with reframe:
   > "The spec-based workflow is designed to solve this by doing all the groundwork to make everything explicit ahead of time, presenting the plan to you at each step so nothing gets left to chance."

**Navigation update:** Add `{ id: 'specificity-problem', label: 'Specificity Problem' }` to sections array.

---

## 3. Add `/spec:create` Section

**Insert after:** Ideate section (id="ideate")
**Insert before:** Validate section (id="validate")

**New section structure:**
- Section ID: `spec-create`
- Section label: `/SPEC:CREATE`
- Color: Gold (#d4a54a) — matches pipeline visual
- Headline: "From research to explicit decisions"

**Content:**
1. Two cards side-by-side:
   - "Decisions Made Explicit" — user stories, technical approach, security, rollout plan
   - "Why It Matters" — forces edge case thinking, creates reviewable artifact, gives AI everything needed

2. Highlighted callout connecting to specificity problem:
   > "This is the antidote to the specificity problem. Every decision you'd have to make during implementation? Make it now, in the spec."

3. Document viewer CTA pointing to `spec-full-example`

**Navigation update:** Add `{ id: 'spec-create', label: '/spec:create' }` to sections array.

---

## 4. Move "Three Commandments" to End

**Current position:** After "Input Quality" (section 4)
**New position:** After "Evolve the Workflow", before "Summary"

**Changes to section:**
1. Update section label from "THE THREE COMMANDMENTS" to "PS — A PARTING PHILOSOPHY"
2. Reduce headline size slightly (text-3xl md:text-4xl instead of text-4xl md:text-5xl)
3. Keep the three commandment cards as-is

**Navigation update:** Move `{ id: 'three-commandments', label: 'Three Commandments' }` to near-end of array.

**Section number updates:** Renumber all sections after Input Quality (they shift down by one since Specificity Problem is added, then shift back since Three Commandments moves).

---

## 5. Add "Theory → Practice" Headers

**Add before "Making Context Persistent"** in Input Quality section:

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

**Additional locations to add this pattern:**
- Before "Stop Hooks" in Hooks & Subagents section
- Before "Questions to ask yourself" in Evolve the Workflow section

This establishes a reusable trope for future content.

---

## 6. Multi-Example Document Viewer

**Enhance the DocumentViewerPanel component** to support grouped documents with a tab switcher.

### New Types

```tsx
type DocumentGroup = {
  groupId: string;
  title: string;
  documents: DocumentMeta[];
};

// Update ViewExampleCTA props
interface ViewExampleCTAProps {
  documentId?: DocumentId;
  group?: DocumentGroup;
  sectionId?: string;
  label?: string;
}
```

### New DocumentViewerContext State

```tsx
// Add to context
activeDocumentIndex: number;
setActiveDocumentIndex: (index: number) => void;
documentGroup: DocumentGroup | null;
openDocumentGroup: (group: DocumentGroup) => void;
```

### Tab Switcher UI

Add to DocumentViewerPanel header when viewing a group:

```tsx
{documentGroup && documentGroup.documents.length > 1 && (
  <div className="flex gap-1 px-4 py-2 bg-[#0a0a0f] border-b border-zinc-800">
    {documentGroup.documents.map((doc, index) => (
      <button
        key={doc.id}
        onClick={() => setActiveDocumentIndex(index)}
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

### New Example Documents

Add to DOCUMENTS record:
- `customgpt-instructions` — Example CustomGPT system instructions
- `subagent-definition` — Example Claude subagent markdown file

### Update Context Section

Replace the three separate ViewExampleCTA buttons with one grouped button:

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

---

## Updated Section Order (Final)

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
  { id: 'three-commandments', label: 'PS: Commandments' },  // MOVED
  { id: 'summary', label: 'Summary' },
];
```

---

## Acceptance Criteria

1. **Equation displays "= Shitty Output ✗"** in Philosophy section
2. **Specificity Problem section exists** with two comparison cards and reframe callout
3. **`/spec:create` section exists** between Ideate and Validate with gold styling
4. **Three Commandments appears near end** with "PS" label treatment
5. **"Theory → Practice" dividers appear** before application moments (at least 3 instances)
6. **Document viewer supports grouped tabs** with ability to switch between examples
7. **Context section uses grouped viewer** with 3+ example documents
8. **Navigation dots reflect new order** and include all new sections
9. **All section numbers updated** to reflect new order

---

## Out of Scope

- Changes to other modules (getting-started, existing-codebases, orchestration-system)
- New course creation
- Authentication changes
- Mobile-specific optimizations beyond existing responsive patterns

---

# Learning Content Guide Audit Additions

The following items were identified by auditing the deck against `.claude/skills/33-strategies-learning-content.md`.

---

## 7. Add Callback References Throughout

**From guide:** "Callback references connect new concepts to earlier learning"

**Red flag detected:** Zero explicit callbacks in current deck

### Required Callbacks

| Location | Callback Text |
|----------|---------------|
| `/spec:create` section (new) | Already specified: "This is the antidote to the specificity problem." |
| `/spec:validate` section | Add: "Remember the specificity problem? This is where we catch it before implementation." |
| `/spec:decompose` section | Add: "Context is everything — and each task needs ALL of it embedded." |
| Debugging section | Add: "This is 'Use AI on Itself' applied to problem-solving." |
| Summary section | Add: Connect back to opening hook |

### Implementation Pattern

```tsx
<Card highlight>
  <p className="text-zinc-300">
    <span className="text-[#d4a54a]">Remember the specificity problem?</span>
    {" "}This is where we catch it before implementation.
  </p>
</Card>
```

---

## 8. Add "We Are Here" Pipeline Indicators

**From guide:** Pattern 4 (Deep Dive) requires showing position in larger flow

**Red flag detected:** Pipeline stage sections don't show where you are in the overall process

### Implementation

Create a reusable component:

```tsx
const PipelineProgress = ({ current }: { current: 'ideate' | 'spec' | 'validate' | 'decompose' | 'execute' }) => {
  const stages = [
    { id: 'ideate', name: 'Ideate', color: 'cyan' },
    { id: 'spec', name: 'Spec', color: 'gold' },
    { id: 'validate', name: 'Validate', color: 'green' },
    { id: 'decompose', name: 'Decompose', color: 'purple' },
    { id: 'execute', name: 'Execute', color: 'orange' },
  ];

  return (
    <div className="flex items-center gap-2 mb-8">
      {stages.map(stage => (
        <div
          key={stage.id}
          className={`px-3 py-1 rounded-full text-xs transition-all ${
            stage.id === current
              ? 'bg-white text-black font-semibold scale-110'
              : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          {stage.name}
        </div>
      ))}
    </div>
  );
};
```

### Add to Sections

- `ideate` section: `<PipelineProgress current="ideate" />`
- `spec-create` section: `<PipelineProgress current="spec" />`
- `validate` section: `<PipelineProgress current="validate" />`
- `decompose` section: `<PipelineProgress current="decompose" />`
- `execute` section: `<PipelineProgress current="execute" />`

Place after the section label, before the headline.

---

## 9. Rephrase Summary Section

**From guide:** "Summary section restates key takeaways in different words"

**Red flag detected:** Summary uses "Quality of output is bounded by quality of input" — verbatim from Philosophy section

### Current Summary Headline
```tsx
<h2>Quality of output is bounded by <span className="text-[#d4a54a]">quality of input</span></h2>
```

### Revised Summary Headline
```tsx
<h2>The plan is <span className="text-[#d4a54a]">the product</span></h2>
```

### Revised Supporting Text
```tsx
<p className="text-xl text-zinc-400">
  Everything in this workflow exists for one purpose:
  <br />
  <span className="text-[#d4a54a]">Make the input so good that execution becomes trivial.</span>
</p>
```

### Add Callback to Opening
```tsx
<RevealText delay={0.35}>
  <p className="text-zinc-500 mt-8">
    Remember: a shitty LLM can execute a great plan brilliantly.
    <br />
    Now you know how to make that plan.
  </p>
</RevealText>
```

---

## 10. Add Core Insight to Real Scenarios

**From guide:** "Every major section has ONE clear takeaway"

**Red flag detected:** Real Scenarios section is just a reference list with no pedagogical hook

### Current Headline
```tsx
<h2>When to use <span className="text-[#d4a54a]">what</span></h2>
```

### Revised Structure

Add a core insight before the scenario list:

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
  <Card highlight className="mb-8">
    <p className="text-zinc-300 text-center">
      <span className="text-[#d4a54a]">The question isn't "should I use the pipeline?"</span>
      {" "}It's "how much of the pipeline does this problem deserve?"
    </p>
  </Card>
</RevealText>
```

---

## 11. Add Decision Framework to Debugging

**From guide:** "Show, Don't Tell"

**Red flag detected:** Two approaches listed but no decision framework for choosing

### Add Decision Tree Before the Two Cards

```tsx
<RevealText delay={0.15}>
  <Card className="mb-8" highlight>
    <h3 className="text-lg font-semibold mb-4 text-[#d4a54a]">Which approach?</h3>
    <div className="text-zinc-400 text-sm space-y-3">
      <p>Ask: <span className="text-white">"Did I write the broken code?"</span></p>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-[#0d0d0d] border border-[#d4a54a]/30 rounded-lg p-3 text-center">
          <p className="text-[#d4a54a] mb-1">Yes → Your code</p>
          <p className="text-zinc-500 text-xs">/methodical-debug</p>
        </div>
        <div className="bg-[#0d0d0d] border border-blue-400/30 rounded-lg p-3 text-center">
          <p className="text-blue-400 mb-1">No → External system</p>
          <p className="text-zinc-500 text-xs">/research-driven-debug</p>
        </div>
      </div>
    </div>
  </Card>
</RevealText>
```

---

## 12. Add Stakes to Hooks & Subagents

**From guide:** "Missing the 'why' — learners follow steps without understanding"

**Red flag detected:** Section jumps straight into features without explaining why automation matters

### Add Stakes Card After Headline

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

---

## 13. Expand Theory → Practice Instances

**From guide:** "Use this every time content moves from concept to application"

**Original spec specifies 3 locations.** Audit found 2 more needed.

### Additional Locations

1. **Before Debugging approaches** (after the decision framework)
2. **Before Real Scenarios list** (after the core insight)

Total Theory → Practice instances: **5**

---

## Updated Acceptance Criteria

Add to existing criteria:

10. **Callback references appear** in at least 4 sections connecting to earlier concepts
11. **Pipeline stages show "We Are Here"** indicator with current stage highlighted
12. **Summary uses different wording** than Philosophy section
13. **Real Scenarios has core insight** headline before the scenario list
14. **Debugging has decision framework** for choosing between approaches
15. **Hooks & Subagents has stakes** explaining why automation matters
16. **Theory → Practice appears 5+ times** throughout the deck
17. **VideoCommentary component exists** at `components/deck/VideoCommentary.tsx`
18. **Video placeholders appear** in at least 5 locations throughout the deck
19. **All video placeholders show** "Video Coming Soon" state with recording title

---

# Video Commentary System

## 14. VideoCommentary Component

**Status:** ✅ IMPLEMENTED

**Location:** `components/deck/VideoCommentary.tsx`

A reusable component for inline video commentary throughout learning modules. Designed to supplement scrollytelling content with screen-share clips, pro tips, and behind-the-scenes context.

### Features

- **Placeholder state** — Shows "Video Coming Soon" with the recording title until video is added
- **Topic badges** — Visual categorization (Pro Tip, Deep Dive, Quick Take, Behind the Scenes, Common Mistake, Walkthrough)
- **Modal player** — Full-screen video playback with close button
- **Provider agnostic** — Supports Bunny.net Stream (recommended), Mux, and self-hosted MP4s
- **Grid layout** — `VideoCommentaryGrid` component for displaying multiple videos

### Topic Types

| Topic | Icon | Color | Use Case |
|-------|------|-------|----------|
| `pro-tip` | 💡 | Gold | Quick tips and shortcuts |
| `deep-dive` | 🔬 | Purple | Extended explanations |
| `quick-take` | ⚡ | Cyan | Brief commentary |
| `behind-the-scenes` | 🎬 | Blue | Real examples, mistakes made |
| `common-mistake` | ⚠️ | Red | What NOT to do |
| `walkthrough` | 🚶 | Green | Step-by-step demos |

### Usage Examples

```tsx
// Single video placeholder
<VideoCommentary
  id="ideate-prompt-tips"
  title="Crafting the Initial Ideation Prompt"
  description="What to include in your /spec:ideate prompt..."
  duration="2:30"
  topic="pro-tip"
/>

// Multiple videos in grid
<VideoCommentaryGrid columns={2}>
  <VideoCommentary ... />
  <VideoCommentary ... />
</VideoCommentaryGrid>

// With Bunny.net video (when ready)
<VideoCommentary
  id="ideate-prompt-tips"
  title="Crafting the Initial Ideation Prompt"
  duration="2:30"
  topic="pro-tip"
  video={{
    provider: 'bunny',
    libraryId: '12345',
    videoId: 'abc123',
  }}
/>
```

---

## 15. Video Hosting Recommendation

**Recommended:** [Bunny.net Stream](https://bunny.net/stream/)

| Criteria | Bunny.net | Mux | Vimeo |
|----------|-----------|-----|-------|
| **Cost** | $1/mo minimum | Usage-based (higher) | $20-108/mo |
| **Ownership** | You control content | You control content | Platform-dependent |
| **React Support** | Embed URLs | Excellent SDK | Iframe embeds |
| **Best For** | Budget, self-hosted feel | Enterprise apps | Marketing videos |

**Why Bunny.net:**
- $0.005/GB for traffic — most users pay ~$1/month total
- Simple embed URLs work great with React/Next.js
- You upload to your account, not a social platform
- 119+ global PoPs for fast delivery
- Can migrate to Mux later if you need advanced analytics

### Bunny.net Setup (When Ready)

1. Create account at bunny.net
2. Create a Stream Library
3. Upload videos via dashboard or API
4. Copy `libraryId` and `videoId` from each video
5. Update VideoCommentary props with video data

---

## 16. Current Video Placeholders

The following placeholders have been added to the Claude Code Workflow deck:

| Section | Video ID | Title | Duration | Topic |
|---------|----------|-------|----------|-------|
| Philosophy | `philosophy-core-insight` | Why Input Quality Matters More Than Model Quality | 2:15 | Deep Dive |
| Input Quality | `claude-md-walkthrough` | Building Your CLAUDE.md From Scratch | 3:20 | Walkthrough |
| Input Quality | `reference-docs-tips` | Reference Docs That Actually Get Used | 1:45 | Pro Tip |
| Ideate | `ideate-prompt-tips` | Crafting the Initial Ideation Prompt | 2:30 | Pro Tip |
| Debugging | `debugging-in-practice` | Debugging Decision Tree in Action | 4:10 | Behind the Scenes |
| Hooks & Subagents | `hooks-setup` | Setting Up Your First Stop Hook | 2:00 | Walkthrough |

**Total estimated recording time:** ~16 minutes
