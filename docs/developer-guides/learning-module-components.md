# Learning Module Component System

This guide documents the shared component library for building learning modules in the 33 Strategies AI Workflow course.

## Overview

Learning modules are interactive scrollytelling decks that teach specific concepts. Each module uses a shared component library located in `components/deck/` that provides consistent styling, animations, and behavior.

## Design Tokens

### Colors

```typescript
// Backgrounds
const BG_PRIMARY = '#0a0a0f';      // Main page background
const BG_SURFACE = '#111114';       // Section backgrounds
const BG_ELEVATED = '#0d0d14';      // Card backgrounds
const BG_CARD = 'rgba(255,255,255,0.03)';

// Text
const TEXT_PRIMARY = '#f5f5f5';     // Headlines, important text
const TEXT_MUTED = '#888888';       // Body text
const TEXT_DIM = '#555555';         // Tertiary, placeholder text

// Primary Accent
const GOLD = '#d4a54a';             // Key highlights, CTAs
const GOLD_GLOW = 'rgba(212,165,74,0.3)';  // Glow effects

// Borders
const BORDER = 'rgba(255,255,255,0.08)';
```

### Typography

| Role | Font | Class |
|------|------|-------|
| Headlines | Instrument Serif | `font-display` |
| Body | DM Sans | `font-body` |
| Labels/Code | JetBrains Mono | `font-mono` |

**Label pattern:**
```tsx
<p className="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase">
  SECTION LABEL
</p>
```

---

## Components

### Section

Full-viewport scroll section with fade-in animation.

```tsx
import { Section } from '@/components/deck';

<Section id="intro" className="relative">
  {/* Content */}
</Section>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | required | Unique section identifier |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | required | Section content |

**Usage Notes:**
- Every section needs a unique `id` for navigation
- Use `className="relative"` when adding positioned children
- Content should be centered with `max-w-4xl mx-auto`

---

### RevealText

Animated text container that fades in and slides up when scrolled into view.

```tsx
import { RevealText } from '@/components/deck';

<RevealText delay={0.1}>
  <h2 className="text-3xl font-display">Headline</h2>
</RevealText>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `delay` | `number` | `0` | Animation delay in seconds |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | required | Content to animate |

**Animation Timing:**
- Stagger elements by 0.05-0.1 seconds
- First element: `delay={0}`
- Second element: `delay={0.1}`
- Third element: `delay={0.2}`
- Max delay: 0.4-0.5 seconds

---

### SectionLabel

Styled label for section headings. Gold text, uppercase, tracked.

```tsx
import { SectionLabel } from '@/components/deck';

<SectionLabel>THE CONCEPT</SectionLabel>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | required | Label text |

**Output:**
```html
<p class="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase mb-6">
  THE CONCEPT
</p>
```

---

### Card

Container with background, border, and optional glow effect.

```tsx
import { Card } from '@/components/deck';

<Card className="text-center">
  <h3 className="font-semibold mb-2">Card Title</h3>
  <p className="text-zinc-500 text-sm">Description</p>
</Card>

<Card glow>
  <p className="text-[#d4a54a]">Highlighted content</p>
</Card>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `glow` | `boolean` | `false` | Add gold glow effect |
| `children` | `ReactNode` | required | Card content |

---

### CodeBlock

Styled code display with copy button.

```tsx
import { CodeBlock } from '@/components/deck';

<CodeBlock language="typescript">
{`const greeting = "Hello, world!";
console.log(greeting);`}
</CodeBlock>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string` | required | Code content |
| `language` | `string` | `'typescript'` | Language hint |
| `className` | `string` | `''` | Additional CSS classes |
| `showCopy` | `boolean` | `true` | Show copy button |

---

### ProgressBar

Fixed scroll progress indicator at top of viewport.

```tsx
import { ProgressBar } from '@/components/deck';

<ProgressBar color="#d4a54a" />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | `'#d4a54a'` | Progress bar color |

---

### NavDots

Fixed right-side navigation dots. Desktop only (hidden below 1024px).

```tsx
import { NavDots } from '@/components/deck';

const sections = [
  { id: 'intro', label: 'Introduction' },
  { id: 'concept', label: 'The Concept' },
  { id: 'practice', label: 'Practice' },
  { id: 'summary', label: 'Summary' },
];

<NavDots sections={sections} activeSection={activeSection} />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sections` | `{ id: string; label: string }[]` | required | Section definitions |
| `activeSection` | `string` | required | Currently visible section ID |

---

### ModuleCompleteButton

Mark module as complete with progress tracking.

```tsx
import { ModuleCompleteButton } from '../../components/ModuleCompleteButton';

<ModuleCompleteButton
  courseId="ai-workflow"
  moduleId="getting-started"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `courseId` | `string` | Course identifier (e.g., `'ai-workflow'`) |
| `moduleId` | `string` | Module slug (e.g., `'getting-started'`) |

---

## Common Patterns

### Basic Section Structure

```tsx
<Section id="section-name" className="relative">
  {/* Optional background effect */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#d4a54a]/10 rounded-full blur-3xl" />

  <div className="relative z-10 max-w-4xl mx-auto text-center">
    <RevealText>
      <SectionLabel>LABEL TEXT</SectionLabel>
    </RevealText>

    <RevealText delay={0.1}>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
        Main headline with <span className="text-[#d4a54a]">gold accent</span>
      </h2>
    </RevealText>

    <RevealText delay={0.2}>
      <p className="text-xl text-zinc-400 mb-12">
        Supporting paragraph text goes here.
      </p>
    </RevealText>
  </div>
</Section>
```

### Card Grid (3-column)

```tsx
<RevealText delay={0.2}>
  <div className="grid md:grid-cols-3 gap-6 mb-12">
    <Card className="text-center">
      <div className="text-3xl mb-3">Icon</div>
      <h3 className="font-semibold mb-2">Title</h3>
      <p className="text-zinc-500 text-sm">Description</p>
    </Card>
    {/* More cards... */}
  </div>
</RevealText>
```

### Active Section Tracking

```tsx
export default function ModuleDeck() {
  const [activeSection, setActiveSection] = useState('title');

  const sections = [
    { id: 'title', label: 'Welcome' },
    { id: 'concept', label: 'The Concept' },
    // ...
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px' }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen font-body">
      <ProgressBar />
      <NavDots sections={sections} activeSection={activeSection} />
      {/* Sections... */}
    </div>
  );
}
```

### Responsive Typography Scale

```tsx
// Headlines - scale down on mobile
<h1 className="font-display text-4xl md:text-5xl lg:text-6xl">
  Headline
</h1>

// Subheadings
<h2 className="font-display text-3xl md:text-4xl lg:text-5xl">
  Subheading
</h2>

// Body large
<p className="text-lg md:text-xl text-zinc-400">
  Body text
</p>

// Body regular
<p className="text-zinc-400">
  Regular body
</p>
```

---

## Module File Structure

```
app/learning/ai-workflow/
├── [module]/
│   └── page.tsx              # Dynamic route handler
├── getting-started/
│   └── GettingStartedDeck.tsx
├── claude-code-workflow/
│   └── ClaudeCodeWorkflowDeck.tsx
├── existing-codebases/
│   └── ExistingCodebasesDeck.tsx
└── orchestration-system/
    └── OrchestrationSystemDeck.tsx
```

---

## Creating a New Module

1. **Create module directory:**
   ```bash
   mkdir app/learning/ai-workflow/new-module-name
   ```

2. **Create deck component:**
   ```bash
   touch app/learning/ai-workflow/new-module-name/NewModuleNameDeck.tsx
   ```

3. **Use the template structure:**
   ```tsx
   'use client';

   import React, { useEffect, useState } from 'react';
   import { Section, RevealText, SectionLabel, Card, CodeBlock, ProgressBar, NavDots } from '@/components/deck';
   import { ModuleCompleteButton } from '../../components/ModuleCompleteButton';

   export default function NewModuleNameDeck() {
     const [activeSection, setActiveSection] = useState('title');

     const sections = [
       { id: 'title', label: 'Welcome' },
       { id: 'content', label: 'Main Content' },
       { id: 'summary', label: 'Summary' },
     ];

     useEffect(() => {
       const observer = new IntersectionObserver(
         (entries) => {
           entries.forEach((entry) => {
             if (entry.isIntersecting) {
               setActiveSection(entry.target.id);
             }
           });
         },
         { rootMargin: '-50% 0px' }
       );

       sections.forEach(({ id }) => {
         const el = document.getElementById(id);
         if (el) observer.observe(el);
       });

       return () => observer.disconnect();
     }, []);

     return (
       <div className="bg-[#0a0a0f] text-white min-h-screen font-body">
         <ProgressBar />
         <NavDots sections={sections} activeSection={activeSection} />

         {/* TITLE */}
         <Section id="title">
           <RevealText>
             <SectionLabel>MODULE X OF 4</SectionLabel>
           </RevealText>
           <RevealText delay={0.1}>
             <h1 className="font-display text-4xl md:text-5xl lg:text-6xl">
               Module Title
             </h1>
           </RevealText>
         </Section>

         {/* Add more sections... */}

         <ModuleCompleteButton courseId="ai-workflow" moduleId="new-module-name" />
       </div>
     );
   }
   ```

4. **Register in dynamic route:**
   Update `app/learning/ai-workflow/[module]/page.tsx`:
   ```tsx
   const moduleComponents: Record<string, React.ComponentType> = {
     // existing modules...
     'new-module-name': dynamic(() => import('../new-module-name/NewModuleNameDeck')),
   };
   ```

5. **Add to course registry:**
   Update `lib/courses.ts`:
   ```tsx
   modules: [
     // existing modules...
     {
       slug: 'new-module-name',
       title: 'New Module Title',
       description: 'Module description.',
       order: 5,
       estimatedTime: '15 min',
     },
   ],
   ```

---

## Document Viewer System

The Claude Code Workflow module includes a document viewer system that displays example documents (specs, ideation docs, decomposed tasks) in a slide-in panel. This allows learners to view real examples without leaving the deck.

### Architecture

Document data is stored separately from the deck component for maintainability:

```
app/learning/ai-workflow/claude-code-workflow/
├── ClaudeCodeWorkflowDeck.tsx   # Main deck component
└── documents.ts                  # Document data & grouping
```

### Key Types

```typescript
// documents.ts

// Document identifiers
type DocumentId =
  | 'claude-md-example'
  | 'spec-ideate-output'
  | 'spec-ideate-output-validation'
  | 'spec-full-example'
  // ... etc

// Document metadata
interface DocumentMeta {
  id: DocumentId;
  title: string;
  path: string;
  content: string;
}

// Document grouping for multi-variant examples
type DocumentGroupId = 'ideation' | 'spec' | 'decomposed';

interface DocumentGroup {
  id: DocumentGroupId;
  variants: {
    id: string;
    tabLabel: string;      // e.g., "NEW APPLICATION FROM SCRATCH"
    tabSubLabel: string;   // e.g., "Smart Capture SDK"
    document: DocumentMeta;
  }[];
}
```

### Multi-Variant Document System

Documents can be grouped to show multiple examples of the same artifact type (e.g., ideation for greenfield vs existing codebase):

```typescript
// documents.ts
export const DOCUMENT_GROUPS: Record<DocumentGroupId, DocumentGroup> = {
  'ideation': {
    id: 'ideation',
    variants: [
      {
        id: 'greenfield',
        tabLabel: 'NEW APPLICATION FROM SCRATCH',
        tabSubLabel: 'Smart Capture SDK',
        document: DOCUMENTS['spec-ideate-output'],
      },
      {
        id: 'existing',
        tabLabel: 'NEW FEATURE, EXISTING CODEBASE',
        tabSubLabel: 'Validation Sharing System',
        document: DOCUMENTS['spec-ideate-output-validation'],
      },
    ],
  },
  // ... 'spec' and 'decomposed' groups
};

// Map document IDs to their groups
export const DOCUMENT_TO_GROUP: Record<string, DocumentGroupId> = {
  'spec-ideate-output': 'ideation',
  'spec-ideate-output-validation': 'ideation',
  // ...
};
```

### Usage in Deck

```tsx
// Import from documents.ts
import {
  type DocumentId,
  DOCUMENTS,
  DOCUMENT_GROUPS,
  DOCUMENT_TO_GROUP,
} from './documents';

// Open a document (context provider handles state)
const { openDocument } = useDocumentViewer();
openDocument('spec-ideate-output');

// ViewExampleCTA component for consistent styling
<ViewExampleCTA
  text="See Ideation Example"
  onClick={() => openDocument('spec-ideate-output')}
/>
```

### Adding New Documents

1. Add the document ID to the `DocumentId` type in `documents.ts`
2. Add the document content to `DOCUMENTS` record
3. If part of a group, add to `DOCUMENT_GROUPS` and `DOCUMENT_TO_GROUP`

```typescript
// 1. Add to type
type DocumentId =
  | 'existing-ids'
  | 'new-document-id';

// 2. Add content
const DOCUMENTS: Record<DocumentId, DocumentMeta> = {
  // ... existing
  'new-document-id': {
    id: 'new-document-id',
    title: 'New Document Title',
    path: 'path/to/document.md',
    content: `Document content here...`,
  },
};

// 3. If grouped, add to DOCUMENT_GROUPS variant
```
