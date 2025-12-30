'use client';

import React, { useEffect, useState } from 'react';
import { Section, RevealText, SectionLabel, Card, CodeBlock, ProgressBar, NavDots } from '@/components/deck';
import { ModuleCompleteButton } from '../../components/ModuleCompleteButton';

// ============================================================================
// MAIN DECK COMPONENT
// ============================================================================

export default function ExistingCodebasesDeck() {
  const [activeSection, setActiveSection] = useState('title');

  const sections = [
    { id: 'title', label: 'Welcome' },
    { id: 'reality', label: "Developer's Reality" },
    { id: 'progressive', label: 'Progressive Approach' },
    { id: 'right-project', label: 'Right First Project' },
    { id: 'safe-setup', label: 'Safe Setup' },
    { id: 'testing', label: 'Testing Safety Net' },
    { id: 'documentation', label: 'Documentation Pattern' },
    { id: 'conservative', label: 'Conservative Workflow' },
    { id: 'manual-intervention', label: 'When You Step In' },
    { id: 'reading-signs', label: 'Reading the Signs' },
    { id: 'compound', label: 'Compound Effect' },
    { id: 'two-paths', label: 'Two Paths Forward' },
    { id: 'pitfalls', label: 'Avoiding Pitfalls' },
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
    <div className="bg-[#0a0a0f] text-white min-h-screen font-sans">
      <style>{`
        html, body { background-color: #0a0a0f; }
        .text-gold { color: #d4a54a; }
        .bg-gold { background-color: #d4a54a; }
        .border-gold { border-color: #d4a54a; }
        .glow-gold { box-shadow: 0 0 80px rgba(212, 165, 74, 0.15); }
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      <ProgressBar />
      <NavDots sections={sections} activeSection={activeSection} />

      {/* TITLE */}
      <Section id="title" className="relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#d4a54a]/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealText>
            <p className="text-[#d4a54a] text-sm font-medium tracking-[0.2em] uppercase mb-6">
              33 STRATEGIES — EXISTING CODEBASES
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium mb-6">
              Start Small, <span className="text-[#d4a54a]">Scale Smart</span>
            </h1>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              How to safely introduce AI-assisted development to your existing codebase
            </p>
          </RevealText>
          <RevealText delay={0.3}>
            <p className="text-zinc-500 text-base max-w-xl mx-auto">
              Whether it's one feature or eventually everything — you control the pace.
              This is about adding value safely, not migrating anything.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* DEVELOPER'S REALITY */}
      <Section id="reality" className="relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <SectionLabel number={1} label="THE DEVELOPER'S REALITY" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              These concerns are <span className="text-red-400">valid</span>
            </h2>
          </RevealText>

          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <p className="text-zinc-300 text-lg">"This codebase is too complex for AI to understand"</p>
              </Card>
            </RevealText>
            <RevealText delay={0.25}>
              <Card>
                <p className="text-zinc-300 text-lg">"What if it breaks something critical?"</p>
              </Card>
            </RevealText>
            <RevealText delay={0.3}>
              <Card>
                <p className="text-zinc-300 text-lg">"I'll spend more time fixing AI mistakes than just writing it myself"</p>
              </Card>
            </RevealText>
            <RevealText delay={0.35}>
              <Card>
                <p className="text-zinc-300 text-lg">"It doesn't know our patterns, our edge cases, our history"</p>
              </Card>
            </RevealText>
          </div>

          <RevealText delay={0.4}>
            <p className="text-zinc-500 mt-8 text-center">
              These fears are real. But they're also <span className="text-[#d4a54a]">solvable</span> —
              without betting everything on a new approach.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* PROGRESSIVE APPROACH */}
      <Section id="progressive" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-green-500/8 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <SectionLabel number={2} label="THE PROGRESSIVE APPROACH" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              You control the <span className="text-green-400">pace</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <Card className="mb-6" highlight>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-1">Small Things</h3>
                  <p className="text-zinc-500 text-sm">Learn the pattern safely</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">📈</div>
                  <h3 className="font-semibold mb-1">Build Confidence</h3>
                  <p className="text-zinc-500 text-sm">Each project makes the next easier</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">🎚️</div>
                  <h3 className="font-semibold mb-1">Expand (or Not)</h3>
                  <p className="text-zinc-500 text-sm">You decide what's next</p>
                </div>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.3}>
            <Card>
              <p className="text-zinc-400 mb-4">
                You may never "fully AI-fy" your codebase — <span className="text-green-400">and that's completely fine</span>.
              </p>
              <p className="text-zinc-500 text-sm">
                Some parts might always be manual. The goal is to add value where it makes sense,
                not to transform everything at once. Manual interventions become learning opportunities
                that make the system smarter over time.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* RIGHT FIRST PROJECT */}
      <Section id="right-project" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={3} label="CHOOSING YOUR FIRST PROJECT" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Start where <span className="text-[#d4a54a]">failure is cheap</span>
            </h2>
          </RevealText>

          <div className="grid md:grid-cols-2 gap-8">
            <RevealText delay={0.2}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-green-400">Good First Projects</h3>
                <ul className="space-y-3 text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">✓</span>
                    <span>New leaderboard or dashboard section</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">✓</span>
                    <span>Report generation feature</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">✓</span>
                    <span>Admin tools with limited scope</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">✓</span>
                    <span>New UI component with clear boundaries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">✓</span>
                    <span>Data export/import functionality</span>
                  </li>
                </ul>
                <p className="text-zinc-600 text-sm mt-4">
                  Self-contained, low blast radius, testable output
                </p>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-red-400">Avoid Starting With</h3>
                <ul className="space-y-3 text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="text-red-400">✗</span>
                    <span>Authentication or authorization</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400">✗</span>
                    <span>Payment processing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400">✗</span>
                    <span>Core business logic algorithms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400">✗</span>
                    <span>Database schema changes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400">✗</span>
                    <span>Anything touching PII/sensitive data</span>
                  </li>
                </ul>
                <p className="text-zinc-600 text-sm mt-4">
                  High stakes, complex dependencies, hard to test
                </p>
              </Card>
            </RevealText>
          </div>

          <RevealText delay={0.3}>
            <p className="text-zinc-500 mt-8 text-center">
              The question isn't "can AI do this?" — it's "what happens if it gets it wrong?"
            </p>
          </RevealText>
        </div>
      </Section>

      {/* SAFE SETUP */}
      <Section id="safe-setup" className="relative">
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4a54a]/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <SectionLabel number={4} label="THE SAFE SETUP PROTOCOL" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Before you write <span className="text-[#d4a54a]">any code</span>
            </h2>
          </RevealText>

          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#d4a54a] text-2xl font-display font-medium">1</div>
                  <div>
                    <h3 className="font-semibold mb-1">Map the Blast Radius</h3>
                    <p className="text-zinc-400 text-sm">
                      For THIS specific project: What systems does it touch? What could break?
                      What integration points matter?
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#d4a54a] text-2xl font-display font-medium">2</div>
                  <div>
                    <h3 className="font-semibold mb-1">Create Targeted Developer Guides</h3>
                    <p className="text-zinc-400 text-sm">
                      Just what you need for this project. Not the whole codebase —
                      the specific systems Claude will interact with.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.3}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#d4a54a] text-2xl font-display font-medium">3</div>
                  <div>
                    <h3 className="font-semibold mb-1">Set Up Validation Layers</h3>
                    <p className="text-zinc-400 text-sm">
                      Extra code review steps, testing protocols, rollback strategies.
                      Conservative by default.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.35}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#d4a54a] text-2xl font-display font-medium">4</div>
                  <div>
                    <h3 className="font-semibold mb-1">Define Clear Boundaries</h3>
                    <p className="text-zinc-400 text-sm">
                      Tell Claude explicitly what it should NOT touch.
                      Constrain the scope before it starts exploring.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>
          </div>
        </div>
      </Section>

      {/* TESTING SAFETY NET */}
      <Section id="testing" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={5} label="YOUR TESTING SAFETY NET" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Automated verification <span className="text-[#d4a54a]">you can trust</span>
            </h2>
          </RevealText>

          <div className="grid md:grid-cols-2 gap-8">
            <RevealText delay={0.2}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">QuickCheck Expert</h3>
                <p className="text-zinc-400 mb-4">
                  Fast verification for features you just implemented.
                </p>
                <ul className="space-y-2 text-zinc-500 text-sm">
                  <li>• Opens browser with automation</li>
                  <li>• Runs through core functionality</li>
                  <li>• Verifies everything works as expected</li>
                  <li>• Cleans up after itself</li>
                </ul>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3 mt-4">
                  <p className="text-zinc-600 text-xs">
                    Best for: "Just built this, quick sanity check before moving on"
                  </p>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-green-400">End-to-End Expert</h3>
                <p className="text-zinc-400 mb-4">
                  Comprehensive test suite for critical paths.
                </p>
                <ul className="space-y-2 text-zinc-500 text-sm">
                  <li>• Writes permanent Playwright tests</li>
                  <li>• Runs in CI/CD pipeline</li>
                  <li>• Catches regressions automatically</li>
                  <li>• Tests stay with the codebase</li>
                </ul>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3 mt-4">
                  <p className="text-zinc-600 text-xs">
                    Best for: "This is important, needs ongoing protection"
                  </p>
                </div>
              </Card>
            </RevealText>
          </div>

          <RevealText delay={0.3}>
            <Card className="mt-8" highlight>
              <p className="text-zinc-300 text-center">
                For existing codebases: <span className="text-[#d4a54a]">use both</span>.
                QuickCheck during development, End-to-End for anything that touches critical paths.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* DOCUMENTATION PATTERN */}
      <Section id="documentation" className="relative">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <SectionLabel number={6} label="THE SMALL PROJECT DOCUMENTATION PATTERN" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Over-document <span className="text-purple-400">deliberately</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <Card className="mb-6">
              <p className="text-zinc-300 mb-4">
                Your first projects should document more than you normally would.
                This isn't waste — it's <span className="text-purple-400">training</span>.
              </p>
              <p className="text-zinc-500 text-sm">
                You're using low-risk work to validate that Claude understands your system.
                If it gets something wrong here, so what? If it gets it right, you've learned
                your guides are working.
              </p>
            </Card>
          </RevealText>

          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">The Pattern</h3>
              <div className="space-y-3 text-zinc-400 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-[#d4a54a]">1.</span>
                  <span>Create developer guide for the systems this project touches</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#d4a54a]">2.</span>
                  <span>Force Claude to reference the guides explicitly</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#d4a54a]">3.</span>
                  <span>Watch for where it struggles — that's missing documentation</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#d4a54a]">4.</span>
                  <span>Improve guides based on what you learn</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#d4a54a]">5.</span>
                  <span>Next project in this area starts with better context</span>
                </div>
              </div>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* CONSERVATIVE WORKFLOW */}
      <Section id="conservative" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <SectionLabel number={7} label="CONSERVATIVE WORKFLOW ADJUSTMENTS" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Assume <span className="text-[#d4a54a]">incomplete knowledge</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">For Existing Codebases</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-[#d4a54a] mb-2">Extra Gates</h4>
                  <ul className="space-y-1 text-zinc-400 text-sm">
                    <li>• More frequent code review checkpoints</li>
                    <li>• Smaller atomic changes</li>
                    <li>• Explicit validation after each phase</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#d4a54a] mb-2">Tighter Boundaries</h4>
                  <ul className="space-y-1 text-zinc-400 text-sm">
                    <li>• Explicit "do not touch" lists</li>
                    <li>• Constrained file/folder scope</li>
                    <li>• Required patterns for certain operations</li>
                  </ul>
                </div>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-3 text-zinc-300">The Mindset</h3>
              <p className="text-zinc-400 mb-4">
                Tell Claude: "You're still learning this codebase. Check your assumptions.
                Ask before modifying anything you're unsure about."
              </p>
              <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-500 text-sm italic">
                  "I want you to operate as if you don't have the full picture — because you don't yet.
                  Be conservative. Verify before changing. When in doubt, ask."
                </p>
              </div>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* MANUAL INTERVENTION */}
      <Section id="manual-intervention" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#d4a54a]/8 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <SectionLabel number={8} label="WHEN YOU HAVE TO STEP IN" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Fix it, then ask <span className="text-[#d4a54a]">why</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">The Reality Check</h3>
              <ul className="space-y-2 text-zinc-400">
                <li>• Sometimes Claude will struggle with something straightforward</li>
                <li>• Sometimes a one-line fix takes 10 minutes of back-and-forth</li>
                <li>• <span className="text-green-400">Just fix it yourself</span> — efficiency matters</li>
              </ul>
            </Card>
          </RevealText>

          <RevealText delay={0.25}>
            <Card highlight>
              <h3 className="text-xl font-semibold mb-4 text-[#d4a54a]">But Then Ask: WHY?</h3>
              <p className="text-zinc-300 mb-4">
                Every time you manually write code, pause and ask:
                <span className="text-white"> "Why did Claude not do this?"</span>
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500">Missing context about this part of the codebase?</p>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500">Unclear patterns or conventions?</p>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500">Missing protocol for this type of check?</p>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500">Incomplete developer guide for this system?</p>
                </div>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.3}>
            <Card className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-zinc-300">The System Improvement Loop</h3>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <span className="bg-red-400/20 text-red-400 px-3 py-1 rounded-full">Manual intervention</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full">Why analysis</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-blue-400/20 text-blue-400 px-3 py-1 rounded-full">System update</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full">Future prevention</span>
              </div>
              <p className="text-zinc-500 text-sm mt-4 text-center">
                The goal isn't perfection — it's <span className="text-[#d4a54a]">fewer repeated frustrations</span>.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* READING THE SIGNS */}
      <Section id="reading-signs" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <SectionLabel number={9} label="READING THE SIGNS" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              When Claude <span className="text-green-400">"gets it"</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-green-400">Signs of Understanding</h3>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Uses your naming conventions without being reminded</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>References the right related files and patterns</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Asks smart questions about edge cases you know exist</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Suggests improvements that align with your architecture</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Manual interventions becoming rare for this area</span>
                </li>
              </ul>
            </Card>
          </RevealText>

          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-3 text-zinc-300">Expanding Boundaries Safely</h3>
              <p className="text-zinc-400 mb-4">
                When you see these signs consistently, you can start loosening constraints:
              </p>
              <ul className="space-y-2 text-zinc-500 text-sm">
                <li>→ Fewer mandatory review checkpoints</li>
                <li>→ Larger scope per task</li>
                <li>→ More trust in its integration decisions</li>
                <li>→ Adjacent systems become candidates for AI assistance</li>
              </ul>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* COMPOUND EFFECT */}
      <Section id="compound" className="relative">
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <SectionLabel number={10} label="THE COMPOUND EFFECT" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              The ratio <span className="text-green-400">inverts</span>
            </h2>
          </RevealText>

          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="text-zinc-600 text-sm w-28">First Project</div>
                  <div className="flex-1">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div className="bg-[#d4a54a]/50 w-3/5"></div>
                      <div className="bg-green-400/50 w-2/5"></div>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-sm w-40 text-right">60% setup, 40% building</p>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="text-zinc-600 text-sm w-28">Third Project</div>
                  <div className="flex-1">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div className="bg-[#d4a54a]/50 w-2/5"></div>
                      <div className="bg-green-400/50 w-3/5"></div>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-sm w-40 text-right">40% setup, 60% building</p>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.3}>
              <Card highlight>
                <div className="flex items-center gap-4">
                  <div className="text-[#d4a54a] text-sm w-28">Fifth Project</div>
                  <div className="flex-1">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div className="bg-[#d4a54a]/50 w-1/5"></div>
                      <div className="bg-green-400/50 w-4/5"></div>
                    </div>
                  </div>
                  <p className="text-[#d4a54a] text-sm w-40 text-right">20% setup, 80% building</p>
                </div>
              </Card>
            </RevealText>
          </div>

          <RevealText delay={0.35}>
            <p className="text-zinc-500 mt-8 text-center">
              Documentation you create serves both AI and human developers.
              <span className="text-[#d4a54a]"> New team members onboard faster too.</span>
            </p>
          </RevealText>
        </div>
      </Section>

      {/* TWO PATHS */}
      <Section id="two-paths" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <SectionLabel number={11} label="TWO PATHS FORWARD" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Both are <span className="text-[#d4a54a]">valid</span>
            </h2>
          </RevealText>

          <div className="grid md:grid-cols-2 gap-8">
            <RevealText delay={0.2}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Path A: Selective Use</h3>
                <p className="text-zinc-400 mb-4">
                  "I like using AI for certain types of projects"
                </p>
                <ul className="space-y-2 text-zinc-500 text-sm">
                  <li>• Keep using it for new, contained features</li>
                  <li>• Some parts stay manual — that's fine</li>
                  <li>• Document as you go, when relevant</li>
                  <li>• No pressure to expand</li>
                </ul>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3 mt-4">
                  <p className="text-zinc-600 text-xs">
                    "AI handles new features, I handle core system work"
                  </p>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-green-400">Path B: Natural Expansion</h3>
                <p className="text-zinc-400 mb-4">
                  "This is working well, I want to do more"
                </p>
                <ul className="space-y-2 text-zinc-500 text-sm">
                  <li>• Each project expands documented areas</li>
                  <li>• Eventually, most work is AI-assisted</li>
                  <li>• New projects → new documentation → repeat</li>
                  <li>• Never a "big migration" — just gradual coverage</li>
                </ul>
                <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-3 mt-4">
                  <p className="text-zinc-600 text-xs">
                    "AI handles most work now, I handle review and direction"
                  </p>
                </div>
              </Card>
            </RevealText>
          </div>

          <RevealText delay={0.3}>
            <p className="text-zinc-500 mt-8 text-center">
              Either way: when you step in manually, <span className="text-[#d4a54a]">document why</span> for future improvement.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* AVOIDING PITFALLS */}
      <Section id="pitfalls" className="relative">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <SectionLabel number={12} label="AVOIDING THE PITFALLS" />
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              What <span className="text-red-400">not</span> to do
            </h2>
          </RevealText>

          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <div className="flex items-start gap-4">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <h3 className="font-semibold mb-1">Don't try to document everything upfront</h3>
                    <p className="text-zinc-500 text-sm">
                      Document as needed. Parts of the codebase AI never touches don't need AI documentation.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.25}>
              <Card>
                <div className="flex items-start gap-4">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <h3 className="font-semibold mb-1">Don't start with critical systems</h3>
                    <p className="text-zinc-500 text-sm">
                      Auth, payments, core algorithms — save these until you have confidence in the pattern.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.3}>
              <Card>
                <div className="flex items-start gap-4">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <h3 className="font-semibold mb-1">Don't skip the validation steps</h3>
                    <p className="text-zinc-500 text-sm">
                      Extra gates are there for a reason. Loosen them gradually, not all at once.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>

            <RevealText delay={0.35}>
              <Card>
                <div className="flex items-start gap-4">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <h3 className="font-semibold mb-1">Don't assume Claude understands until proven</h3>
                    <p className="text-zinc-500 text-sm">
                      Watch for the signs. Trust is earned through consistent correct behavior.
                    </p>
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
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealText>
            <p className="text-[#d4a54a] text-sm font-medium tracking-[0.2em] uppercase mb-6">
              YOUR FIRST PROJECT
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
              Start small, <span className="text-[#d4a54a]">stay safe</span>, scale smart
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <Card className="mb-8 text-left">
              <h3 className="text-lg font-semibold mb-4 text-[#d4a54a]">First Project Checklist</h3>
              <div className="space-y-2 text-zinc-400 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-zinc-700 flex-shrink-0"></div>
                  <span>Choose a low-risk, contained feature</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-zinc-700 flex-shrink-0"></div>
                  <span>Map the blast radius before starting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-zinc-700 flex-shrink-0"></div>
                  <span>Create targeted developer guides</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-zinc-700 flex-shrink-0"></div>
                  <span>Set up testing (QuickCheck + End-to-End for critical paths)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-zinc-700 flex-shrink-0"></div>
                  <span>Use conservative workflow with extra gates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-zinc-700 flex-shrink-0"></div>
                  <span>When you step in manually, document why</span>
                </div>
              </div>
            </Card>
          </RevealText>

          <RevealText delay={0.3}>
            <p className="text-xl text-zinc-400">
              Success looks like: working feature + confidence in the process.
              <br />
              <span className="text-[#d4a54a]">What happens next is up to you.</span>
            </p>
          </RevealText>
        </div>
      </Section>

      {/* MODULE COMPLETION */}
      <ModuleCompleteButton courseId="ai-workflow" moduleId="existing-codebases" />

    </div>
  );
}
