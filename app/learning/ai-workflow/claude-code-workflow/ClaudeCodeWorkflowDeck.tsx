'use client';

import React, { useRef, useEffect, useState, createContext, useContext, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { Section, RevealText, SectionLabel, Card, CodeBlock, ProgressBar, NavDots, VideoCommentaryCompact } from '@/components/deck';
import { ModuleCompleteButton } from '../../components/ModuleCompleteButton';

// ============================================================================
// DOCUMENT VIEWER SYSTEM
// ============================================================================

type DocumentId =
  | 'claude-md-example'
  | 'what-were-building'
  | 'how-we-do-shit'
  | 'spec-ideate-output'
  | 'spec-full-example'
  | 'spec-decomposed'
  | 'hook-config';

interface DocumentMeta {
  id: DocumentId;
  title: string;
  path: string;
  content: string;
}

// Example documents - these would be fetched or imported in production
const DOCUMENTS: Record<DocumentId, DocumentMeta> = {
  'claude-md-example': {
    id: 'claude-md-example',
    title: 'CLAUDE.md',
    path: 'CLAUDE.md',
    content: `# CLAUDE.md

## Who You Are

You are an expert TypeScript/React developer working on TradeBlock. You have deep knowledge of Next.js 14, TypeScript strict mode, Prisma ORM, and Tailwind CSS.

## Communication Style

- Be direct and concise
- Skip unnecessary preamble
- When I ask you to build something, start building
- Use voice-friendly responses

## Critical Patterns

### File Organization
- app/ — Next.js app router pages
- components/ — React components (ui/ and features/)
- lib/ — Utilities and helpers
- hooks/ — Custom React hooks

### Database Conventions
- Tables use snake_case
- Primary keys are id (UUID)
- Timestamps: created_at, updated_at

## Operational Commands

| Command | Purpose |
|---------|---------|
| /spec:ideate | Research before building |
| /spec:create | Generate detailed spec |
| /spec:validate | Check spec quality |
| /spec:decompose | Break into tasks |
| /spec:execute | Build from spec |

## Reference Documents

- docs/what-were-building.md — Current project context
- docs/how-we-do-shit.md — Team conventions
- docs/api-patterns.md — API design standards`
  },
  'what-were-building': {
    id: 'what-were-building',
    title: 'what-were-building.md',
    path: 'docs/what-were-building.md',
    content: `# What We're Building

## Current Sprint: Authentication Overhaul

We're rebuilding the authentication system to support:
1. Magic link login (primary)
2. OAuth providers (Google, Apple)
3. Session management with refresh tokens

### Why This Matters

Current auth is username/password only, which has high friction. Users forget passwords and we need password reset flows.

### Success Criteria

- User can sign up/in with email magic link
- Session persists for 30 days with refresh
- OAuth buttons work for Google and Apple
- Existing users migrated seamlessly

### Technical Approach

Using next-auth v5 (Auth.js) with Prisma adapter for session storage, custom magic link provider, and JWT strategy for API routes.`
  },
  'how-we-do-shit': {
    id: 'how-we-do-shit',
    title: 'how-we-do-shit.md',
    path: 'docs/how-we-do-shit.md',
    content: `# How We Do Shit

## Code Style

### TypeScript
- Strict mode always
- Explicit return types on exported functions
- interface for objects, type for unions
- No any — use unknown and narrow

### React
- Functional components only
- Custom hooks for shared logic
- Colocation: keep related files together

### Naming
- Components: PascalCase
- Hooks: useCamelCase
- Utils: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Files: kebab-case.ts

## Git Workflow

### Branches
- main — production
- develop — staging
- feature/ticket-description — feature work
- fix/ticket-description — bug fixes

### Commits
Use conventional commits: feat:, fix:, refactor:, docs:, test:

## Testing Strategy

- Unit Tests (Vitest) — Test business logic in isolation
- E2E Tests (Playwright) — Cover critical user flows
- Aim for 80% coverage on lib/`
  },
  'spec-ideate-output': {
    id: 'spec-ideate-output',
    title: 'Ideation Output: Auth Magic Link',
    path: 'specs/ideate/auth-magic-link.md',
    content: `# Ideation: Magic Link Authentication

## Codebase Analysis

### Existing Auth Patterns Found
- src/lib/auth.ts — Current NextAuth v4 config (needs upgrade)
- src/middleware.ts — Route protection logic
- src/hooks/use-auth.ts — Client-side auth hook
- prisma/schema.prisma — User, Session, Account models exist

### Related Components
- src/components/auth/login-form.tsx — Current login UI
- src/components/auth/signup-form.tsx — Current signup UI
- src/app/(auth)/layout.tsx — Auth page layout

## External Research

### Auth.js v5 Migration
- Breaking changes: new auth() function replaces getServerSession
- Config moves from API route to auth.ts file
- Adapters API unchanged

### Magic Link Best Practices
- Token expiry: 10-15 minutes recommended
- One-time use: invalidate after click
- Rate limiting: max 3 requests per email per hour

## Recommended Approach

1. Set up Resend for email delivery
2. Migrate NextAuth v4 → v5 first (separate PR)
3. Add Email provider with custom template
4. Add rate limiting with upstash/redis
5. Implement graceful session migration`
  },
  'spec-full-example': {
    id: 'spec-full-example',
    title: 'Full Spec: Auth Magic Link',
    path: 'specs/auth-magic-link.spec.md',
    content: `# Spec: Magic Link Authentication

## Overview
Implement passwordless authentication via email magic links as the primary login method for TradeBlock.

## User Stories

### US-1: New User Signup
As a new user, I want to sign up with just my email so I don't have to create a password.

**Acceptance Criteria:**
- Enter email on signup page
- Receive magic link email within 30 seconds
- Click link to complete signup
- Redirected to onboarding flow

### US-2: Existing User Login
As an existing user, I want to log in with a magic link.

**Acceptance Criteria:**
- Enter email on login page
- Receive magic link if account exists
- Click link to authenticate
- Redirected to dashboard

## Security Considerations

1. **Token Expiry**: 10 minutes
2. **One-Time Use**: Token invalidated after click
3. **Rate Limiting**: 3 requests per email per hour
4. **HTTPS Only**: Magic link URLs use HTTPS

## Rollout Plan

1. Phase 1: Add magic link as secondary option
2. Phase 2: Make magic link the default
3. Phase 3: Deprecate password login (optional)`
  },
  'spec-decomposed': {
    id: 'spec-decomposed',
    title: 'Decomposed Tasks: Auth Magic Link',
    path: 'specs/auth-magic-link.tasks.md',
    content: `# Task Breakdown: Magic Link Authentication

## Phase 1: Foundation (Parallel)

### Task 1.1: Install Dependencies
npm install resend @react-email/components next-auth@beta @auth/prisma-adapter

**Files:** package.json
**Estimate:** 5 min

### Task 1.2: Database Schema Update
Add VerificationToken model to Prisma schema.

**Files:** prisma/schema.prisma, prisma/migrations/
**Estimate:** 10 min

### Task 1.3: Email Template Component
Create React Email template for magic links.

**Files:** src/emails/magic-link.tsx
**Estimate:** 15 min

## Phase 2: Core Auth

### Task 2.1: Auth.js v5 Configuration
Set up new auth config with Email provider.

**Files:** src/lib/auth.ts, src/lib/auth.config.ts
**Estimate:** 30 min

### Task 2.2: API Route Handler
Create NextAuth API route.

**Files:** src/app/api/auth/[...nextauth]/route.ts
**Estimate:** 10 min

## Summary

| Phase | Tasks | Total Estimate |
|-------|-------|----------------|
| 1. Foundation | 3 | 30 min |
| 2. Core Auth | 2 | 40 min |
| 3. UI | 3 | 55 min |
| 4. Testing | 2 | 75 min |

**Total Estimate:** ~3.5 hours`
  },
  'hook-config': {
    id: 'hook-config',
    title: '.claude/settings.json',
    path: '.claude/settings.json',
    content: `{
  "hooks": {
    "stop": [
      {
        "name": "typecheck-project",
        "command": "npm run typecheck",
        "enabled": true
      },
      {
        "name": "lint-project",
        "command": "npm run lint",
        "enabled": true
      },
      {
        "name": "self-review",
        "command": "claude-review --integration",
        "enabled": true
      }
    ]
  },
  "subagents": {
    "specialists": [
      {
        "name": "react-expert",
        "prompt": "Focus on React components and hooks."
      },
      {
        "name": "typescript-expert",
        "prompt": "Focus on type safety and patterns."
      },
      {
        "name": "playwright-expert",
        "prompt": "Write robust E2E tests."
      }
    ],
    "testing": {
      "quickcheck": {
        "prompt": "Quick verification with browser.",
        "cleanup": true
      },
      "e2e": {
        "prompt": "Comprehensive Playwright tests.",
        "output": "e2e/"
      }
    }
  }
}`
  }
};

// Document Viewer Context
interface DocumentViewerContextType {
  isOpen: boolean;
  documentId: DocumentId | null;
  highlightSectionId: string | null;
  openDocument: (docId: DocumentId, sectionId?: string) => void;
  closeViewer: () => void;
}

const DocumentViewerContext = createContext<DocumentViewerContextType | null>(null);

const useDocumentViewer = () => {
  const context = useContext(DocumentViewerContext);
  if (!context) {
    throw new Error('useDocumentViewer must be used within DocumentViewerProvider');
  }
  return context;
};

// Document Viewer Provider
const DocumentViewerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documentId, setDocumentId] = useState<DocumentId | null>(null);
  const [highlightSectionId, setHighlightSectionId] = useState<string | null>(null);

  const openDocument = useCallback((docId: DocumentId, sectionId?: string) => {
    setDocumentId(docId);
    setHighlightSectionId(sectionId || null);
    setIsOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
    // Delay clearing document to allow exit animation
    setTimeout(() => {
      setDocumentId(null);
      setHighlightSectionId(null);
    }, 300);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeViewer();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeViewer]);

  return (
    <DocumentViewerContext.Provider value={{ isOpen, documentId, highlightSectionId, openDocument, closeViewer }}>
      {children}
    </DocumentViewerContext.Provider>
  );
};

// Document Viewer Panel Component
const DocumentViewerPanel = () => {
  const { isOpen, documentId, closeViewer } = useDocumentViewer();
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const document = documentId ? DOCUMENTS[documentId] : null;

  // Reset expanded state when closing
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen]);

  // Calculate panel width
  const panelWidth = isExpanded ? '75%' : '40%';

  return (
    <AnimatePresence>
      {isOpen && document && (
        <>
          {/* Backdrop - only visible when expanded */}
          {isExpanded && (
            <motion.div
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
            />
          )}

          {/* Panel - 40% width by default, 75% when expanded */}
          <motion.div
            className="fixed right-0 top-0 h-full z-50 flex flex-col shadow-2xl border-l border-zinc-800"
            style={{
              width: panelWidth,
              minWidth: '360px',
              backgroundColor: '#0a0a0f'
            }}
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{
              x: 0,
              opacity: 1,
              width: panelWidth,
              transition: {
                x: { type: 'spring', damping: 30, stiffness: 300 },
                width: { duration: 0.2 }
              }
            }}
            exit={{ x: '100%', opacity: 0.8 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-zinc-800"
              style={{ backgroundColor: '#0d0d0d' }}
            >
              <div className="flex items-center gap-4">
                {/* Expand/Collapse toggle */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                  title={isExpanded ? "Collapse panel" : "Expand panel"}
                >
                  {isExpanded ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
                    </svg>
                  )}
                </button>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Example Document</p>
                  <h3 className="text-white font-semibold">{document.title}</h3>
                </div>
              </div>
              <button
                onClick={closeViewer}
                className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                title="Close panel"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - solid background for readability */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-6"
              style={{ backgroundColor: '#0a0a0f' }}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <DocumentMarkdown content={document.content} />
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 border-t border-zinc-800"
              style={{ backgroundColor: '#0d0d0d' }}
            >
              <p className="text-zinc-600 text-xs flex items-center gap-2">
                <span>📄</span>
                <span className="font-mono">{document.path}</span>
                <span className="text-zinc-700">•</span>
                <span>{document.content.split('\n').length} lines</span>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Simple markdown renderer (basic implementation)
const DocumentMarkdown = ({ content }: { content: string }) => {
  // Very basic markdown parsing for demo - in production use react-markdown
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  lines.forEach((line, i) => {
    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} className="bg-[#0d0d0d] border border-zinc-800 rounded-xl p-4 overflow-x-auto my-4">
            <code className="text-zinc-300 text-xs font-mono whitespace-pre">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-display text-white border-b border-zinc-800 pb-3 mb-6 mt-8 first:mt-0">
          {line.slice(2)}
        </h1>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-semibold text-zinc-200 mt-8 mb-4">
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-zinc-300 mt-6 mb-3">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    // Horizontal rule
    if (line === '---') {
      elements.push(<hr key={i} className="border-zinc-800 my-6" />);
      return;
    }

    // List items
    if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="text-zinc-400 ml-4 list-disc">
          {renderInlineMarkdown(line.slice(2))}
        </li>
      );
      return;
    }

    // Checkbox items
    if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      const checked = line.startsWith('- [x] ');
      elements.push(
        <li key={i} className="text-zinc-400 ml-4 list-none flex items-center gap-2">
          <span className={checked ? 'text-green-400' : 'text-zinc-600'}>{checked ? '☑' : '☐'}</span>
          {renderInlineMarkdown(line.slice(6))}
        </li>
      );
      return;
    }

    // Numbered items
    const numberedMatch = line.match(/^(\d+)\. /);
    if (numberedMatch) {
      elements.push(
        <li key={i} className="text-zinc-400 ml-4 list-decimal">
          {renderInlineMarkdown(line.slice(numberedMatch[0].length))}
        </li>
      );
      return;
    }

    // Table handling (basic)
    if (line.startsWith('|')) {
      if (line.includes('---')) {
        // Skip separator row
        return;
      }
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      elements.push(
        <div key={i} className="grid gap-4 text-sm text-zinc-400 py-2 border-b border-zinc-800/50"
             style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((cell, j) => (
            <div key={j} className="font-mono text-xs">{renderInlineMarkdown(cell)}</div>
          ))}
        </div>
      );
      return;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    // Regular paragraphs
    elements.push(
      <p key={i} className="text-zinc-400 leading-relaxed mb-3">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  return <>{elements}</>;
};

// Render inline markdown (bold, code, links)
const renderInlineMarkdown = (text: string): React.ReactNode => {
  // Process inline code
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-zinc-800 px-1.5 py-0.5 rounded text-[#d4a54a] text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Process bold
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return <strong key={`${i}-${j}`} className="text-zinc-200 font-semibold">{bp.slice(2, -2)}</strong>;
      }
      return bp;
    });
  });
};

// CTA Button Component - Visually distinct "special moment"
const ViewExampleCTA = ({
  documentId,
  sectionId,
  label = "See a real example"
}: {
  documentId: DocumentId;
  sectionId?: string;
  label?: string;
}) => {
  const { openDocument } = useDocumentViewer();

  return (
    <button
      onClick={() => openDocument(documentId, sectionId)}
      className="inline-flex items-center gap-3 px-4 py-2.5 mt-3
                 bg-[#d4a54a]/10 border border-[#d4a54a]/30 rounded-lg
                 text-[#d4a54a] hover:bg-[#d4a54a]/20 hover:border-[#d4a54a]/50
                 transition-all duration-200 group"
    >
      <span className="text-lg">📄</span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
    </button>
  );
};

// ============================================================================
// PIPELINE PROGRESS COMPONENT
// ============================================================================

type PipelineStage = 'ideate' | 'spec' | 'validate' | 'decompose' | 'execute';

const PipelineProgress = ({ current }: { current: PipelineStage }) => {
  const stages: { id: PipelineStage; name: string }[] = [
    { id: 'ideate', name: 'Ideate' },
    { id: 'spec', name: 'Spec' },
    { id: 'validate', name: 'Validate' },
    { id: 'decompose', name: 'Decompose' },
    { id: 'execute', name: 'Execute' },
  ];

  const currentIndex = stages.findIndex(s => s.id === current);

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
              currentIndex > index
                ? 'bg-zinc-500'
                : 'bg-zinc-800'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Theory → Practice divider component (used at concept-to-application transitions)
const TheoryPracticeDivider = () => (
  <div className="flex items-center gap-3 mb-6">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-400/50" />
    <span className="text-green-400 text-sm font-medium tracking-wider uppercase">
      Theory → Practice
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-400/50" />
  </div>
);

// ============================================================================
// MAIN DECK COMPONENT
// ============================================================================

export default function ClaudeCodeWorkflowDeck() {
  const [activeSection, setActiveSection] = useState('title');

  const sections = [
    { id: 'title', label: 'Welcome' },
    { id: 'philosophy', label: 'The Philosophy' },
    { id: 'specificity-problem', label: 'Specificity Problem' },
    { id: 'input-quality', label: 'Input Quality' },
    { id: 'pipeline-overview', label: 'The Pipeline' },
    { id: 'ideate', label: '/spec:ideate' },
    { id: 'spec-create', label: '/spec:create' },
    { id: 'validate', label: '/spec:validate' },
    { id: 'decompose', label: '/spec:decompose' },
    { id: 'execute', label: '/spec:execute' },
    { id: 'debugging', label: 'Debugging' },
    { id: 'hooks-subagents', label: 'Hooks & Subagents' },
    { id: 'real-scenarios', label: 'Real Scenarios' },
    { id: 'evolve-workflow', label: 'Evolve the Workflow' },
    { id: 'three-commandments', label: 'PS: Commandments' },
    { id: 'summary', label: 'Summary' },
  ];

  useEffect(() => {
    const observers = sections.map(section => {
      const element = document.getElementById(section.id);
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.id);
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      return { observer, element };
    });

    return () => {
      observers.forEach(obs => obs?.observer?.disconnect());
    };
  }, []);

  return (
    <DocumentViewerProvider>
      <div className="bg-[#0a0a0f] text-white min-h-screen font-sans">

        <ProgressBar />
        <NavDots sections={sections} activeSection={activeSection} />
        <DocumentViewerPanel />

        {/* TITLE */}
        <Section id="title" className="relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#d4a54a]/10 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <RevealText>
              <p className="text-[#d4a54a] text-sm font-medium tracking-[0.2em] uppercase mb-6">
                33 STRATEGIES — OPERATIONAL PLAYBOOK
              </p>
            </RevealText>
            <RevealText delay={0.1}>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium mb-6">
                The Claude Code <span className="text-[#d4a54a]">Workflow</span>
              </h1>
            </RevealText>
            <RevealText delay={0.2}>
              <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto">
                How we think about, plan, and execute AI-assisted development
              </p>
            </RevealText>
            <RevealText delay={0.3}>
              <p className="text-zinc-500 text-base">
              This is how I want you to work when I ask you to build things.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* PHILOSOPHY */}
      <Section id="philosophy" className="relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#d4a54a]/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={1} label="THE CORE INSIGHT" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
              A shitty LLM can execute <span className="text-[#d4a54a]">a great plan</span> brilliantly.
            </h2>
          </RevealText>
          <RevealText delay={0.2}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-12 text-zinc-500">
              A great LLM will execute <span className="text-zinc-400">a shitty plan</span> faithfully.
            </h2>
          </RevealText>

          {/* Visual comparison */}
          <RevealText delay={0.25}>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="text-center border-green-400/30">
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-zinc-500 text-sm mb-2">Shitty LLM</p>
                <p className="text-xl font-semibold text-green-400 mb-1">+ Great Plan</p>
                <div className="h-px bg-zinc-800 my-3" />
                <p className="text-green-400 font-semibold">= Great Output ✓</p>
              </Card>
              <Card className="text-center border-red-400/30">
                <div className="text-4xl mb-3">🧠</div>
                <p className="text-zinc-500 text-sm mb-2">Great LLM</p>
                <p className="text-xl font-semibold text-red-400 mb-1">+ Shitty Plan</p>
                <div className="h-px bg-zinc-800 my-3" />
                <p className="text-red-400 font-semibold">= Shitty Output ✗</p>
              </Card>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <p className="text-xl text-zinc-400 max-w-3xl mb-8">
              The quality of your output is bounded by the quality of your input.
              This entire workflow exists to maximize input quality.
            </p>
          </RevealText>
          <RevealText delay={0.35}>
            <Card highlight>
              <h3 className="text-lg font-semibold mb-3 text-[#d4a54a]">The Specificity Problem</h3>
              <p className="text-zinc-400 mb-3">
                You have specific ideas in your head about what you want to build.
                If you don't specify them (or have the LLM specify and you verify),
                it has to guess at all those details.
              </p>
              <p className="text-zinc-500 text-sm">
                The ideate pipeline solves this by doing all the groundwork to make everything explicit.
                Nothing gets left to chance.
              </p>
            </Card>
          </RevealText>

          {/* Video Commentary: Understanding the Core Insight */}
          <RevealText delay={0.4}>
            <div className="mt-8">
              <VideoCommentaryCompact
                id="philosophy-core-insight"
                title="Why Input Quality Matters More Than Model Quality"
                description="A quick walkthrough of how I think about this principle in practice — with real examples of great plans executed by 'lesser' models."
                duration="2:15"
                topic="deep-dive"
              />
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SPECIFICITY PROBLEM */}
      <Section id="specificity-problem" className="relative">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-32">
          <RevealText>
            <SectionLabel number={2} label="THE SPECIFICITY PROBLEM" />
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-6">
              The AI doesn't know what you <span className="text-[#d4a54a]">didn't tell it</span>.
            </h2>
          </RevealText>

          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-8 max-w-3xl">
              You have specific ideas in your head about what you want to build. If you don't specify them, the AI has to guess.
            </p>
          </RevealText>

          {/* Vision vs AI Guess Visualization */}
          <RevealText delay={0.2}>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Your Vision */}
              <div className="bg-[#0d0d12] border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <h4 className="text-green-400 font-semibold text-sm uppercase tracking-wider">Your Vision</h4>
                  <span className="text-zinc-600 text-xs">(in your head)</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-zinc-300 text-sm">"It'll plug into my existing auth system"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-zinc-300 text-sm">"Use the same component patterns as everywhere else"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-zinc-300 text-sm">"Handle errors like we always do in this codebase"</span>
                  </li>
                </ul>
              </div>

              {/* AI's Best Guess */}
              <div className="bg-[#0d0d12] border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <h4 className="text-red-400 font-semibold text-sm uppercase tracking-wider">AI's Best Guess</h4>
                  <span className="text-zinc-600 text-xs">(without context)</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span className="text-zinc-400 text-sm">Creates new auth from scratch using different library</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span className="text-zinc-400 text-sm">Invents new patterns that don't match your codebase</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span className="text-zinc-400 text-sm">Uses generic error handling you'll have to rewrite</span>
                  </li>
                </ul>
              </div>
            </div>
          </RevealText>

          {/* The Gap */}
          <RevealText delay={0.25}>
            <div className="text-center mb-8">
              <p className="text-zinc-500 text-sm">
                The gap between these two columns? That's <span className="text-[#d4a54a]">the specificity problem</span>.
              </p>
            </div>
          </RevealText>

          {/* Frustration Examples */}
          <RevealText delay={0.3}>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <div className="space-y-4">
                  <p className="text-red-400 font-medium">"Why did it hardcode this value?"</p>
                  <div className="h-px bg-zinc-800" />
                  <p className="text-zinc-400 text-sm">
                    <span className="text-zinc-300">Because you never told it</span> you wanted that to be configurable.
                  </p>
                </div>
              </Card>
              <Card>
                <div className="space-y-4">
                  <p className="text-red-400 font-medium">"Why create a new function when one exists?"</p>
                  <div className="h-px bg-zinc-800" />
                  <p className="text-zinc-400 text-sm">
                    <span className="text-zinc-300">Because you never pointed it</span> at your existing utilities.
                  </p>
                </div>
              </Card>
            </div>
          </RevealText>

          {/* Reframe Callout */}
          <RevealText delay={0.35}>
            <Card highlight>
              <p className="text-zinc-300 text-center">
                <span className="text-[#d4a54a]">The spec-based workflow solves this</span> by doing all the groundwork to make everything explicit ahead of time — presenting the plan at each step so nothing gets left to chance.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* INPUT QUALITY */}
      <Section id="input-quality" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={3} label="INPUT QUALITY" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-6">
              Context is <span className="text-[#d4a54a]">everything</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
              Three overlapping elements combine to form your starting context — the foundation everything else builds on.
            </p>
          </RevealText>

          {/* Context Triangle Visualization */}
          <RevealText delay={0.2}>
            <div className="relative mb-12">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="h-full border-purple-400/30">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🎭</span>
                    <span className="text-purple-400 text-sm font-medium tracking-wider uppercase">01</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">Who it is</h3>
                  <p className="text-zinc-400">
                    The role you need it to play. Its expertise, perspective, and how it should approach problems.
                  </p>
                </Card>

                <Card className="h-full border-[#d4a54a]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🎯</span>
                    <span className="text-[#d4a54a] text-sm font-medium tracking-wider uppercase">02</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#d4a54a]">Who you are</h3>
                  <p className="text-zinc-400">
                    What you are trying to accomplish. Your constraints, preferences, and success criteria.
                  </p>
                </Card>

                <Card className="h-full border-blue-400/30">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🗺️</span>
                    <span className="text-blue-400 text-sm font-medium tracking-wider uppercase">03</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">The lay of the land</h3>
                  <p className="text-zinc-400">
                    The situational context. Existing code, patterns, constraints, and what already exists.
                  </p>
                </Card>
              </div>

              {/* Convergence indicator */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-3">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-400/50" />
                  <div className="h-px w-8 bg-gradient-to-r from-purple-400/50 to-[#d4a54a]/50" />
                  <div className="bg-[#111111] border border-[#d4a54a] rounded-xl px-4 py-2">
                    <span className="text-[#d4a54a] font-semibold text-sm">Starting Context</span>
                  </div>
                  <div className="h-px w-8 bg-gradient-to-l from-blue-400/50 to-[#d4a54a]/50" />
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/50" />
                </div>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.28}>
            <TheoryPracticeDivider />
          </RevealText>

          <RevealText delay={0.3}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-green-400">Making Context Persistent</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-2 text-zinc-300">CLAUDE.md</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Your project's instruction file. Contains your communication style,
                    critical patterns, operational commands, and gotchas.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-zinc-300">Reference Docs</h4>
                  <p className="text-zinc-400 text-sm">
                    Files CLAUDE.md points to: what-were-building.md, how-we-do-shit.md,
                    developer guides for key components.
                  </p>
                </div>
              </div>

              {/* Document viewer CTAs */}
              <div className="flex flex-wrap gap-4 mb-4">
                <ViewExampleCTA documentId="claude-md-example" label="See a real CLAUDE.md →" />
                <ViewExampleCTA documentId="what-were-building" label="See what-were-building.md →" />
                <ViewExampleCTA documentId="how-we-do-shit" label="See how-we-do-shit.md →" />
              </div>

              <p className="text-zinc-500 text-sm">
                This is how you implement "who you are" and "lay of the land" in Claude Code.
                The context persists across all sessions.
              </p>
            </Card>
          </RevealText>

          {/* Video Commentary: Building Your CLAUDE.md */}
          <RevealText delay={0.35}>
            <div className="mt-8">
              <div className="space-y-3">
                <VideoCommentaryCompact
                  id="claude-md-walkthrough"
                  title="Building Your CLAUDE.md From Scratch"
                  description="Watch me set up a CLAUDE.md for a new project — what to include, what to skip, and how to iterate on it."
                  duration="3:20"
                  topic="walkthrough"
                />
                <VideoCommentaryCompact
                  id="reference-docs-tips"
                  title="Reference Docs That Actually Get Used"
                  description="Pro tips on structuring your reference docs so Claude actually reads and applies them."
                  duration="1:45"
                  topic="pro-tip"
                />
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* PIPELINE OVERVIEW */}
      <Section id="pipeline-overview" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#d4a54a]/8 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={4} label="THE SPEC PIPELINE" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-6">
              From idea to <span className="text-[#d4a54a]">execution</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
              A 5-stage workflow that enforces discipline. Each stage maximizes the quality of the next.
            </p>
          </RevealText>

          {/* Pipeline Flow Diagram */}
          <RevealText delay={0.2}>
            <Card className="mb-8 overflow-hidden">
              <div className="flex items-center justify-between gap-1 md:gap-2">
                {[
                  { name: 'Ideate', icon: '🔍', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', borderColor: 'border-cyan-400/40' },
                  { name: 'Spec', icon: '📋', color: 'text-[#d4a54a]', bgColor: 'bg-[#d4a54a]/10', borderColor: 'border-[#d4a54a]/40' },
                  { name: 'Validate', icon: '✅', color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/40' },
                  { name: 'Decompose', icon: '🧩', color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/40' },
                  { name: 'Execute', icon: '⚡', color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400/40' },
                ].map((stage, i, arr) => (
                  <React.Fragment key={stage.name}>
                    <div className={`flex-1 ${stage.bgColor} border ${stage.borderColor} rounded-xl p-3 md:p-4 text-center`}>
                      <div className="text-2xl md:text-3xl mb-1">{stage.icon}</div>
                      <div className={`${stage.color} text-xs md:text-sm font-semibold`}>{stage.name}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="text-zinc-600 text-lg md:text-xl flex-shrink-0">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Stage descriptions */}
              <div className="grid grid-cols-5 gap-1 md:gap-2 mt-4 text-center">
                <div className="text-zinc-500 text-xs">Research</div>
                <div className="text-zinc-500 text-xs">Decisions</div>
                <div className="text-zinc-500 text-xs">Quality Check</div>
                <div className="text-zinc-500 text-xs">Task Breakdown</div>
                <div className="text-zinc-500 text-xs">Parallel Build</div>
              </div>
            </Card>
          </RevealText>

          {/* Iteration indicator */}
          <RevealText delay={0.25}>
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2 bg-[#111111] border border-zinc-800 rounded-full px-4 py-2">
                <span className="text-zinc-500 text-sm">🔄</span>
                <span className="text-zinc-500 text-sm">Iterate as needed — return to earlier stages when requirements change</span>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <Card className="text-center" highlight>
              <p className="text-zinc-300">
                <span className="text-[#d4a54a]">The philosophy:</span> Understand before building.
                Decide before coding. Validate before committing.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* IDEATE */}
      <Section id="ideate" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={5} label="/SPEC:IDEATE" className="text-cyan-400" />
          </RevealText>
          <RevealText delay={0.05}>
            <PipelineProgress current="ideate" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
              Know your terrain <span className="text-cyan-400">before you build</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl">
              Comprehensive reconnaissance before any implementation begins.
            </p>
          </RevealText>

          <div className="grid md:grid-cols-2 gap-8">
            <RevealText delay={0.2}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Codebase Mapping</h3>
                <ul className="space-y-3 text-zinc-400">
                  <li>→ Scans for related patterns, components, conventions</li>
                  <li>→ Identifies dependencies, data flows, blast radius</li>
                  <li>→ Finds existing specs, developer guides, architecture docs</li>
                </ul>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">External Research</h3>
                <ul className="space-y-3 text-zinc-400">
                  <li>→ Searches web for existing libraries, patterns, prior art</li>
                  <li>→ Finds examples in open-source projects</li>
                  <li>→ Discovers best practices and common pitfalls</li>
                </ul>
              </Card>
            </RevealText>
          </div>

          <RevealText delay={0.3}>
            <Card className="mt-8" highlight>
              <p className="text-zinc-300 text-center mb-4">
                <span className="text-cyan-400">The goal is never to rebuild the wheel.</span>
                {" "}Find the wheel, understand how it works, and customize only the spokes that need changing.
              </p>
              <div className="text-center">
                <ViewExampleCTA documentId="spec-ideate-output" label="See ideation output example →" />
              </div>
            </Card>
          </RevealText>

          {/* Video Commentary: Crafting the Ideation Prompt */}
          <RevealText delay={0.35}>
            <div className="mt-8">
              <VideoCommentaryCompact
                id="ideate-prompt-tips"
                title="Crafting the Initial Ideation Prompt"
                description="What to include in your /spec:ideate prompt, what to leave out, and how to guide the research in the right direction."
                duration="2:30"
                topic="pro-tip"
              />
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SPEC CREATE */}
      <Section id="spec-create" className="relative">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#d4a54a]/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-32">
          <RevealText>
            <SectionLabel number={6} label="/SPEC:CREATE" className="text-[#d4a54a]" />
          </RevealText>
          <RevealText delay={0.05}>
            <PipelineProgress current="spec" />
          </RevealText>

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

      {/* VALIDATE */}
      <Section id="validate" className="relative">
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-green-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={7} label="/SPEC:VALIDATE" className="text-green-400" />
          </RevealText>
          <RevealText delay={0.05}>
            <PipelineProgress current="validate" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
              Catch over-engineering <span className="text-green-400">before it starts</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <Card highlight className="mb-8">
              <p className="text-zinc-300">
                <span className="text-[#d4a54a]">Remember the specificity problem?</span>
                {" "}This is where we catch it — before implementation.
              </p>
            </Card>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl">
              The quality gate that applies YAGNI aggressively.
            </p>
          </RevealText>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <RevealText delay={0.2}>
              <Card className="h-full text-center">
                <h3 className="text-lg font-semibold mb-2 text-green-400">Completeness</h3>
                <p className="text-zinc-400 text-sm">Enough detail to implement autonomously?</p>
              </Card>
            </RevealText>
            <RevealText delay={0.25}>
              <Card className="h-full text-center">
                <h3 className="text-lg font-semibold mb-2 text-green-400">Clarity</h3>
                <p className="text-zinc-400 text-sm">Ambiguous statements or assumed knowledge?</p>
              </Card>
            </RevealText>
            <RevealText delay={0.3}>
              <Card className="h-full text-center">
                <h3 className="text-lg font-semibold mb-2 text-green-400">Leanness</h3>
                <p className="text-zinc-400 text-sm">Building more than necessary?</p>
              </Card>
            </RevealText>
          </div>

          <RevealText delay={0.35}>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Patterns It Catches</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                  <span>Premature Optimization</span><span className="text-red-400">Cut it</span>
                </div>
                <div className="flex justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                  <span>Feature Creep (5 formats when only JSON needed)</span><span className="text-red-400">Cut to 1</span>
                </div>
                <div className="flex justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                  <span>Over-abstraction (plugin system for 3 validators)</span><span className="text-red-400">Implement directly</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Future-proofing (10K connections when expecting 100)</span><span className="text-red-400">Let it fail at scale</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-zinc-800 mt-4">
                <ViewExampleCTA documentId="spec-full-example" label="See a validated spec example →" />
              </div>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* DECOMPOSE */}
      <Section id="decompose" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={8} label="/SPEC:DECOMPOSE" className="text-purple-400" />
          </RevealText>
          <RevealText delay={0.05}>
            <PipelineProgress current="decompose" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
              Optimize work for <span className="text-purple-400">AI execution</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <Card highlight className="mb-8">
              <p className="text-zinc-300">
                <span className="text-[#d4a54a]">Context is everything</span>
                {" "}— and each task needs ALL of it embedded.
              </p>
            </Card>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl">
              Tasks must be self-contained with all context embedded.
            </p>
          </RevealText>

          <RevealText delay={0.25}>
            <Card className="mb-8" highlight>
              <h3 className="text-lg font-semibold mb-4 text-purple-400">The Content Preservation Principle</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-red-400 text-sm mb-2">WRONG:</p>
                  <CodeBlock className="text-xs">Create the auth service as specified in the spec</CodeBlock>
                </div>
                <div>
                  <p className="text-green-400 text-sm mb-2">CORRECT:</p>
                  <CodeBlock className="text-xs">{`Create src/services/auth.ts with:
export async function authenticateUser(
  email: string,
  password: string
) { /* full implementation */ }`}</CodeBlock>
                </div>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-6 text-purple-400">Visual Dependency Graph</h3>

              {/* Phase 1 - Foundation (Parallel) */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-cyan-400/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold">Phase 1</div>
                  <span className="text-zinc-500 text-sm">Foundation (parallel)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 ml-4">
                  <div className="bg-[#0d0d0d] border border-cyan-400/30 rounded-lg p-3 text-center">
                    <div className="text-cyan-400 text-xs mb-1">Task 1.1</div>
                    <div className="text-zinc-300 text-sm">Create user schema</div>
                  </div>
                  <div className="bg-[#0d0d0d] border border-cyan-400/30 rounded-lg p-3 text-center">
                    <div className="text-cyan-400 text-xs mb-1">Task 1.2</div>
                    <div className="text-zinc-300 text-sm">Set up bcrypt utility</div>
                  </div>
                </div>
              </div>

              {/* Arrow down */}
              <div className="flex justify-center mb-4">
                <div className="text-zinc-600 text-xl">↓</div>
              </div>

              {/* Phase 2 - Core Logic (Depends on Phase 1) */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-400/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">Phase 2</div>
                  <span className="text-zinc-500 text-sm">Core Logic (depends on Phase 1)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 ml-4">
                  <div className="bg-[#0d0d0d] border border-purple-400/30 rounded-lg p-3 text-center">
                    <div className="text-purple-400 text-xs mb-1">Task 2.1</div>
                    <div className="text-zinc-300 text-sm">Implement login</div>
                  </div>
                  <div className="bg-[#0d0d0d] border border-purple-400/30 rounded-lg p-3 text-center">
                    <div className="text-purple-400 text-xs mb-1">Task 2.2</div>
                    <div className="text-zinc-300 text-sm">Implement register</div>
                  </div>
                </div>
              </div>

              {/* Arrow down */}
              <div className="flex justify-center mb-4">
                <div className="text-zinc-600 text-xl">↓</div>
              </div>

              {/* Phase 3 - Integration */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">Phase 3</div>
                  <span className="text-zinc-500 text-sm">Integration (depends on Phase 2)</span>
                </div>
                <div className="ml-4">
                  <div className="bg-[#0d0d0d] border border-green-400/30 rounded-lg p-3 text-center max-w-xs">
                    <div className="text-green-400 text-xs mb-1">Task 3.1</div>
                    <div className="text-zinc-300 text-sm">Integration tests</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800">
                <p className="text-zinc-500 text-sm text-center">
                  Tasks within a phase can run <span className="text-purple-400">in parallel</span>.
                  Phases must complete <span className="text-purple-400">sequentially</span>.
                </p>
              </div>

              <div className="text-center pt-4 border-t border-zinc-800 mt-4">
                <ViewExampleCTA documentId="spec-decomposed" label="See a decomposed spec example →" />
              </div>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* EXECUTE */}
      <Section id="execute" className="relative">
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={9} label="/SPEC:EXECUTE" className="text-orange-400" />
          </RevealText>
          <RevealText delay={0.05}>
            <PipelineProgress current="execute" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
              Parallel agents with <span className="text-orange-400">quality gates</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
              Each task flows through a cycle of implementation, testing, and review until it passes all gates.
            </p>
          </RevealText>

          <RevealText delay={0.2}>
            <Card className="mb-8">
              <h3 className="text-lg font-semibold mb-6 text-orange-400">The Execution Cycle (Per Task)</h3>

              {/* Circular flow visualization */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 mb-6">
                <div className="bg-[#0d0d0d] border-2 border-orange-400/50 rounded-xl p-4 text-center min-w-[140px]">
                  <div className="text-2xl mb-2">🔨</div>
                  <div className="font-semibold text-orange-400">Implement</div>
                  <div className="text-zinc-500 text-xs mt-1">Specialist builds</div>
                </div>

                <div className="text-orange-400 text-2xl rotate-90 md:rotate-0">→</div>

                <div className="bg-[#0d0d0d] border-2 border-blue-400/50 rounded-xl p-4 text-center min-w-[140px]">
                  <div className="text-2xl mb-2">🧪</div>
                  <div className="font-semibold text-blue-400">Test</div>
                  <div className="text-zinc-500 text-xs mt-1">Verify behavior</div>
                </div>

                <div className="text-blue-400 text-2xl rotate-90 md:rotate-0">→</div>

                <div className="bg-[#0d0d0d] border-2 border-green-400/50 rounded-xl p-4 text-center min-w-[140px]">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-semibold text-green-400">Review</div>
                  <div className="text-zinc-500 text-xs mt-1">Quality check</div>
                </div>

                <div className="text-green-400 text-2xl rotate-90 md:rotate-0">→</div>

                <div className="bg-green-400/20 border-2 border-green-400 rounded-xl p-4 text-center min-w-[140px]">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="font-semibold text-green-400">Done</div>
                  <div className="text-zinc-500 text-xs mt-1">All gates passed</div>
                </div>
              </div>

              {/* Retry loop indicator */}
              <div className="flex justify-center">
                <div className="bg-[#0d0d0d] border border-red-400/30 rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="text-red-400">↩</span>
                  <span className="text-zinc-500 text-sm">If tests/review fail → back to Implement</span>
                </div>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-orange-400">Available Specialist Agents</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { name: 'react-expert', icon: '⚛️' },
                  { name: 'typescript-expert', icon: '📘' },
                  { name: 'playwright-expert', icon: '🎭' },
                  { name: 'code-review-expert', icon: '🔍' },
                  { name: 'database-expert', icon: '🗃️' },
                  { name: 'css-styling-expert', icon: '🎨' },
                  { name: 'devops-expert', icon: '🚀' },
                  { name: 'git-expert', icon: '📦' },
                ].map(agent => (
                  <div key={agent.name} className="bg-[#0d0d0d] border border-zinc-800 rounded-lg px-3 py-2 text-center">
                    <div className="text-lg mb-1">{agent.icon}</div>
                    <div className="text-zinc-400 text-xs">{agent.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* DEBUGGING */}
      <Section id="debugging" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={9} label="DEBUGGING" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-6">
              Two approaches for <span className="text-[#d4a54a]">different situations</span>
            </h2>
          </RevealText>

          {/* Callback */}
          <RevealText delay={0.15}>
            <Card highlight className="mb-8">
              <p className="text-zinc-300">
                <span className="text-[#d4a54a]">This is "Use AI on Itself"</span>
                {" "}applied to problem-solving.
              </p>
            </Card>
          </RevealText>

          {/* Decision Framework */}
          <RevealText delay={0.2}>
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

          <RevealText delay={0.22}>
            <TheoryPracticeDivider />
          </RevealText>

          <div className="grid md:grid-cols-2 gap-8">
            <RevealText delay={0.25}>
              <Card className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🔬</span>
                  <h3 className="text-xl font-semibold text-[#d4a54a]">/methodical-debug</h3>
                </div>
                <p className="text-zinc-500 text-sm mb-4">When the bug is in YOUR code</p>
                <div className="space-y-2 text-zinc-400 text-sm">
                  <div>1. Review intended behavior</div>
                  <div>2. Map expected flow</div>
                  <div>3. Instrument with debug logging</div>
                  <div>4. Identify WHERE and WHY it fails</div>
                  <div>5. Fix, verify, clean up</div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📚</span>
                  <h3 className="text-xl font-semibold text-blue-400">/research-driven-debug</h3>
                </div>
                <p className="text-zinc-500 text-sm mb-4">When it's environmental/infrastructure</p>
                <div className="space-y-2 text-zinc-400 text-sm">
                  <div>1. Document symptoms and logs</div>
                  <div>2. Research the system class</div>
                  <div>3. Find known causes</div>
                  <div>4. Update documentation</div>
                  <div>5. Recommend with preventive measures</div>
                </div>
              </Card>
            </RevealText>
          </div>

          {/* Video Commentary: Debugging in Practice */}
          <RevealText delay={0.3}>
            <div className="mt-8">
              <VideoCommentaryCompact
                id="debugging-in-practice"
                title="Debugging Decision Tree in Action"
                description="A real example of diagnosing an issue and choosing the right debug approach — including when I got it wrong the first time."
                duration="4:10"
                topic="behind-the-scenes"
              />
            </div>
          </RevealText>
        </div>
      </Section>

      {/* HOOKS & SUBAGENTS */}
      <Section id="hooks-subagents" className="relative">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={10} label="AUTOMATED QUALITY" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
              Hooks and <span className="text-purple-400">Subagents</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl">
              Quality enforcement without thinking about it.
            </p>
          </RevealText>

          {/* Stakes card - why automation matters */}
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

          <RevealText delay={0.23}>
            <TheoryPracticeDivider />
          </RevealText>

          <RevealText delay={0.25}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4">🛑 Stop Hooks (Run When Claude Says Done)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { name: 'typecheck-project', desc: 'Full TS compilation', icon: '📝' },
                  { name: 'lint-project', desc: 'ESLint/Biome check', icon: '🧹' },
                  { name: 'test-project', desc: 'Full test suite', icon: '🧪' },
                  { name: 'self-review', desc: 'Integration review', icon: '🔍' },
                ].map(hook => (
                  <div key={hook.name} className="bg-[#0d0d0d] border border-zinc-800 rounded-lg p-3">
                    <div className="text-lg mb-1">{hook.icon}</div>
                    <div className="text-[#d4a54a] text-xs mb-1">{hook.name}</div>
                    <div className="text-zinc-500 text-xs">{hook.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-zinc-500 text-sm mt-4">
                <span className="text-red-400">If any hook fails</span>, Claude must fix the issue before truly finishing.
              </p>
              <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4 mt-4">
                <p className="text-zinc-500 text-sm">
                  <span className="text-blue-400">Pro tip:</span> These hooks can be toggled on/off.
                  Sometimes you don't need TypeScript checks for every small edit when you're just
                  asking questions or doing light planning. Turn them on for big implementations.
                </p>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-4">🧪 Testing Experts</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0d0d0d] border border-blue-400/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⚡</span>
                    <span className="text-blue-400 font-semibold">QuickCheck Expert</span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">Fast verification with browser automation</p>
                  <ul className="text-zinc-500 text-xs space-y-1">
                    <li>• Opens browser, tests functionality</li>
                    <li>• Cleans up after itself</li>
                    <li>• Best for: "Just built this, quick sanity check"</li>
                  </ul>
                </div>
                <div className="bg-[#0d0d0d] border border-green-400/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏁</span>
                    <span className="text-green-400 font-semibold">End-to-End Expert</span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">Comprehensive Playwright test suite</p>
                  <ul className="text-zinc-500 text-xs space-y-1">
                    <li>• Writes permanent tests</li>
                    <li>• Runs in CI/CD pipeline</li>
                    <li>• Best for: "This needs ongoing protection"</li>
                  </ul>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-zinc-800 mt-4">
                <ViewExampleCTA documentId="hook-config" label="See hook configuration example →" />
              </div>
            </Card>
          </RevealText>

          {/* Video Commentary: Setting Up Hooks */}
          <RevealText delay={0.3}>
            <div className="mt-8">
              <VideoCommentaryCompact
                id="hooks-setup"
                title="Setting Up Your First Stop Hook"
                description="A quick walkthrough of configuring hooks in Claude Code — including when to enable/disable them for different workflows."
                duration="2:00"
                topic="walkthrough"
              />
            </div>
          </RevealText>
        </div>
      </Section>

      {/* REAL SCENARIOS */}
      <Section id="real-scenarios" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#d4a54a]/8 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={11} label="REAL SCENARIOS" />
          </RevealText>
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

          <RevealText delay={0.23}>
            <TheoryPracticeDivider />
          </RevealText>

          <div className="space-y-6">
            <RevealText delay={0.25}>
              <Card>
                <p className="text-white font-medium mb-2">Build a new complex feature</p>
                <p className="text-zinc-500 text-sm mb-3">Full pipeline: cross-cutting, affects multiple systems</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-[#d4a54a]/20 text-[#d4a54a] px-2 py-1 rounded">/spec:ideate</span>
                  <span className="text-zinc-600">→</span>
                  <span className="bg-[#d4a54a]/20 text-[#d4a54a] px-2 py-1 rounded">/spec:ideate-to-spec</span>
                  <span className="text-zinc-600">→</span>
                  <span className="bg-[#d4a54a]/20 text-[#d4a54a] px-2 py-1 rounded">/spec:validate</span>
                  <span className="text-zinc-600">→</span>
                  <span className="bg-[#d4a54a]/20 text-[#d4a54a] px-2 py-1 rounded">/spec:decompose</span>
                  <span className="text-zinc-600">→</span>
                  <span className="bg-[#d4a54a]/20 text-[#d4a54a] px-2 py-1 rounded">/spec:execute</span>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.3}>
              <Card>
                <p className="text-white font-medium mb-2">Add a simple toggle to existing component</p>
                <p className="text-zinc-500 text-sm mb-3">Lean spec: contained, low risk, pattern exists</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-green-400/20 text-green-400 px-2 py-1 rounded">/spec:create-lean</span>
                  <span className="text-zinc-600">→</span>
                  <span className="bg-green-400/20 text-green-400 px-2 py-1 rounded">/spec:execute</span>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.35}>
              <Card>
                <p className="text-white font-medium mb-2">Something is broken</p>
                <p className="text-zinc-500 text-sm mb-3">Choose based on location</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">In your code:</span>
                    <span className="bg-red-400/20 text-red-400 px-2 py-1 rounded">/methodical-debug</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Infrastructure:</span>
                    <span className="bg-blue-400/20 text-blue-400 px-2 py-1 rounded">/research-driven-debug</span>
                  </div>
                </div>
              </Card>
            </RevealText>
          </div>
        </div>
      </Section>

      {/* EVOLVE THE WORKFLOW */}
      <Section id="evolve-workflow" className="relative">
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={12} label="EVOLVE THE WORKFLOW" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              This system is <span className="text-green-400">alive</span>
            </h2>
          </RevealText>

          <RevealText delay={0.15}>
            <Card className="mb-8" highlight>
              <p className="text-xl text-zinc-300 mb-4">
                As you work, watch for opportunities to improve the system itself.
              </p>
              <p className="text-zinc-400">
                If you find yourself doing the same thing repeatedly, or wishing you had
                a command that doesn't exist — <span className="text-green-400">that's exactly the kind of thinking we want</span>.
              </p>
            </Card>
          </RevealText>

          {/* Continuous Improvement Loop Visualization */}
          <RevealText delay={0.2}>
            <Card className="mb-8">
              <h3 className="text-lg font-semibold mb-6 text-green-400">The Continuous Improvement Loop</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
                <div className="bg-[#0d0d0d] border border-zinc-700 rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold text-zinc-300">Work</div>
                  <div className="text-zinc-500 text-xs mt-1">Use the system</div>
                </div>

                <div className="text-zinc-600 text-2xl rotate-90 md:rotate-0">→</div>

                <div className="bg-[#0d0d0d] border border-yellow-400/30 rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-2xl mb-2">👀</div>
                  <div className="font-semibold text-yellow-400">Notice</div>
                  <div className="text-zinc-500 text-xs mt-1">Friction points</div>
                </div>

                <div className="text-zinc-600 text-2xl rotate-90 md:rotate-0">→</div>

                <div className="bg-[#0d0d0d] border border-green-400/30 rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-2xl mb-2">🔧</div>
                  <div className="font-semibold text-green-400">Improve</div>
                  <div className="text-zinc-500 text-xs mt-1">Update system</div>
                </div>

                <div className="text-zinc-600 text-2xl rotate-90 md:rotate-0">→</div>

                <div className="bg-green-400/20 border border-green-400/50 rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-semibold text-green-400">Better</div>
                  <div className="text-zinc-500 text-xs mt-1">Work faster</div>
                </div>
              </div>

              {/* Loop back indicator */}
              <div className="flex justify-center mt-4">
                <div className="bg-[#0d0d0d] border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="text-green-400">↻</span>
                  <span className="text-zinc-500 text-sm">Repeat forever</span>
                </div>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.23}>
            <TheoryPracticeDivider />
          </RevealText>

          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">Questions to ask yourself:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[#d4a54a]">📝</span>
                    <p className="text-zinc-400 text-sm">Is there a new command that would save time on this type of task?</p>
                  </div>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[#d4a54a]">🤖</span>
                    <p className="text-zinc-400 text-sm">Could a new subagent handle this specialized work better?</p>
                  </div>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[#d4a54a]">🛑</span>
                    <p className="text-zinc-400 text-sm">Should there be a hook that catches this class of mistake?</p>
                  </div>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[#d4a54a]">📚</span>
                    <p className="text-zinc-400 text-sm">Is there documentation that would have helped me avoid this?</p>
                  </div>
                </div>
              </div>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* PS — A PARTING PHILOSOPHY (Three Commandments) */}
      <Section id="three-commandments" className="relative">
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number="PS" label="A PARTING PHILOSOPHY" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-medium leading-tight mb-12">
              Principles that <span className="text-green-400">compound</span>
            </h2>
          </RevealText>

          <div className="space-y-8">
            <RevealText delay={0.2}>
              <Card>
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">🍳</span>
                    <div className="text-2xl font-display font-medium text-green-400/50">1</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2 text-green-400">Do the Prep Work</h3>
                    <p className="text-zinc-400 mb-4">Rich, detailed context is the name of the game.</p>
                    <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                      <p className="text-zinc-500 text-sm italic">
                        Nobody wants your unseasoned chicken. Prompting without context is like cooking without seasoning.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card>
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">🎙️</span>
                    <div className="text-2xl font-display font-medium text-blue-400/50">2</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2 text-blue-400">Talk, Don't Type</h3>
                    <p className="text-zinc-400 mb-4">Voice-first interaction provides richer context faster.</p>
                    <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                      <p className="text-zinc-500 text-sm italic">
                        Voice is Google Fiber to your brain. Typing is the shitty wifi at that overpriced coffee shop.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.3}>
              <Card>
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">🔄</span>
                    <div className="text-2xl font-display font-medium text-purple-400/50">3</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2 text-purple-400">Use AI on Itself</h3>
                    <p className="text-zinc-400 mb-4">Have the AI write prompts for itself.</p>
                    <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                      <p className="text-zinc-500 text-sm italic">
                        AI-ception — The spec pipeline is this principle applied systematically.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </RevealText>
          </div>
        </div>
      </Section>

      {/* SUMMARY */}
      <Section id="summary" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#d4a54a]/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <RevealText>
            <p className="text-[#d4a54a] text-sm font-medium tracking-[0.2em] uppercase mb-6">
              THE TAKEAWAY
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-4">
              The plan is <span className="text-[#d4a54a]">the product</span>
            </h2>
          </RevealText>

          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              Everything in this workflow exists for one purpose:
              <br />
              <span className="text-[#d4a54a]">Make the input so good that execution becomes trivial.</span>
            </p>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-zinc-500 mb-12">
              Remember: a shitty LLM can execute a great plan brilliantly.
              <br />
              Now you know how to make that plan.
            </p>
          </RevealText>

          <RevealText delay={0.25}>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="font-semibold mb-2">Research First</h3>
                <p className="text-zinc-500 text-sm">Understand before building</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="font-semibold mb-2">Validate Always</h3>
                <p className="text-zinc-500 text-sm">Catch problems early</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="font-semibold mb-2">Improve Continuously</h3>
                <p className="text-zinc-500 text-sm">Evolve the system itself</p>
              </Card>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <p className="text-xl text-zinc-400">
              This workflow exists to maximize input quality at every stage.
              <br />
              <span className="text-[#d4a54a]">That's the whole game.</span>
            </p>
          </RevealText>
        </div>
      </Section>

      {/* MODULE COMPLETION */}
      <ModuleCompleteButton courseId="ai-workflow" moduleId="claude-code-workflow" />

      </div>
    </DocumentViewerProvider>
  );
}
