'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id: string;
}

const Section = ({ children, className = '', id }: SectionProps) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 py-16 ${className}`}
    >
      {children}
    </motion.section>
  );
};

interface RevealTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const RevealText = ({ children, delay = 0, className = '' }: RevealTextProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-[#D4A84B] origin-left z-50"
      style={{ scaleX }}
    />
  );
};

interface NavDotsProps {
  sections: { id: string; label: string }[];
  activeSection: string;
}

const NavDots = ({ sections, activeSection }: NavDotsProps) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`group flex items-center gap-3 ${
            activeSection === section.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'
          } transition-opacity`}
        >
          <span className="text-xs text-right w-40 hidden group-hover:block text-zinc-500">
            {section.label}
          </span>
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
            activeSection === section.id
              ? 'bg-[#D4A84B] scale-125'
              : 'bg-zinc-700 group-hover:bg-zinc-500'
          }`} />
        </a>
      ))}
    </div>
  );
};

const CodeBlock = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0d0d0d] border border-zinc-800 rounded-xl p-4 font-mono text-sm overflow-x-auto ${className}`}>
    <pre className="text-zinc-300 whitespace-pre-wrap">{children}</pre>
  </div>
);

const Card = ({ children, className = '', highlight = false }: { children: React.ReactNode; className?: string; highlight?: boolean }) => (
  <div className={`bg-[#111111] border ${highlight ? 'border-[#D4A84B]/50' : 'border-zinc-800'} rounded-2xl p-6 md:p-8 ${className}`}>
    {children}
  </div>
);

// ============================================================================
// MAIN DECK COMPONENT
// ============================================================================

export default function GettingStartedDeck() {
  const [activeSection, setActiveSection] = useState('title');

  const sections = [
    { id: 'title', label: 'Welcome' },
    { id: 'fear', label: 'The Fear' },
    { id: 'reframe', label: 'The Reframe' },
    { id: 'context-framework', label: 'Context Framework' },
    { id: 'blast-radius', label: 'Blast Radius' },
    { id: 'claude-md', label: 'CLAUDE.md' },
    { id: 'brain-dump', label: 'Brain Dump Workflow' },
    { id: 'first-project', label: 'Your First Project' },
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
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans">
      <style>{`
        html, body { background-color: #0a0a0a; }
        .text-gold { color: #D4A84B; }
        .bg-gold { background-color: #D4A84B; }
        .border-gold { border-color: #D4A84B; }
        .glow-gold { box-shadow: 0 0 80px rgba(212, 168, 75, 0.15); }
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      <ProgressBar />
      <NavDots sections={sections} activeSection={activeSection} />

      {/* TITLE */}
      <Section id="title" className="relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D4A84B]/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-6">
              33 STRATEGIES — PART 2
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium mb-6">
              Getting <span className="text-[#D4A84B]">Started</span>
            </h1>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Loading your AI collaborator with the context it needs to succeed
            </p>
          </RevealText>
          <RevealText delay={0.3}>
            <p className="text-zinc-500 text-base">
              The prep work before you touch any workflow commands.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* THE FEAR */}
      <Section id="fear" className="relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              01 — THE DEVELOPER'S FEAR
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-12">
              "It doesn't know <span className="text-red-400">our system</span>"
            </h2>
          </RevealText>
          
          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <p className="text-zinc-400 text-lg">"It'll break something important"</p>
              </Card>
            </RevealText>
            <RevealText delay={0.25}>
              <Card>
                <p className="text-zinc-400 text-lg">"I'd have to explain everything"</p>
              </Card>
            </RevealText>
            <RevealText delay={0.3}>
              <Card>
                <p className="text-zinc-400 text-lg">"It doesn't understand our patterns"</p>
              </Card>
            </RevealText>
            <RevealText delay={0.35}>
              <Card>
                <p className="text-zinc-400 text-lg">"What about all the edge cases I know about?"</p>
              </Card>
            </RevealText>
          </div>
          
          <RevealText delay={0.4}>
            <p className="text-zinc-500 mt-8 text-center">
              These fears are valid. But they're also solvable.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* THE REFRAME */}
      <Section id="reframe" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-green-500/8 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              02 — THE REFRAME
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              You can <span className="text-green-400">teach it</span>
            </h2>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl">
              Everything you would think about as a good developer building a feature — 
              you can feed that to the AI upfront.
            </p>
          </RevealText>
          
          <RevealText delay={0.3}>
            <Card highlight>
              <p className="text-zinc-300 text-lg mb-4">
                What databases will this touch? <span className="text-green-400">Tell it.</span>
              </p>
              <p className="text-zinc-300 text-lg mb-4">
                What existing features need to stay compatible? <span className="text-green-400">Tell it.</span>
              </p>
              <p className="text-zinc-300 text-lg mb-4">
                What patterns do we use here? <span className="text-green-400">Tell it.</span>
              </p>
              <p className="text-zinc-300 text-lg">
                What would break if we don't consider X? <span className="text-green-400">Tell it.</span>
              </p>
            </Card>
          </RevealText>
          
          <RevealText delay={0.4}>
            <p className="text-zinc-500 mt-8 text-center">
              The AI can only know what you tell it. So <span className="text-[#D4A84B]">tell it everything</span>.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* CONTEXT FRAMEWORK */}
      <Section id="context-framework" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              03 — THE CONTEXT LOADING FRAMEWORK
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-12">
              Four types of <span className="text-[#D4A84B]">starting context</span>
            </h2>
          </RevealText>
          
          <div className="grid md:grid-cols-2 gap-6">
            <RevealText delay={0.2}>
              <Card className="h-full">
                <div className="text-[#D4A84B] text-3xl font-display font-medium mb-3">01</div>
                <h3 className="text-xl font-semibold mb-2">System Knowledge</h3>
                <p className="text-zinc-400 text-sm">
                  What exists in the codebase. How things are structured. 
                  Where the bodies are buried.
                </p>
              </Card>
            </RevealText>
            
            <RevealText delay={0.25}>
              <Card className="h-full">
                <div className="text-[#D4A84B] text-3xl font-display font-medium mb-3">02</div>
                <h3 className="text-xl font-semibold mb-2">Integration Points</h3>
                <p className="text-zinc-400 text-sm">
                  What this new thing needs to touch. Dependencies, APIs, 
                  services that need to stay compatible.
                </p>
              </Card>
            </RevealText>
            
            <RevealText delay={0.3}>
              <Card className="h-full">
                <div className="text-[#D4A84B] text-3xl font-display font-medium mb-3">03</div>
                <h3 className="text-xl font-semibold mb-2">Patterns & Conventions</h3>
                <p className="text-zinc-400 text-sm">
                  How we do things here. Naming conventions, architectural patterns, 
                  coding standards.
                </p>
              </Card>
            </RevealText>
            
            <RevealText delay={0.35}>
              <Card className="h-full">
                <div className="text-[#D4A84B] text-3xl font-display font-medium mb-3">04</div>
                <h3 className="text-xl font-semibold mb-2">Vision & Constraints</h3>
                <p className="text-zinc-400 text-sm">
                  What success looks like. What we're optimizing for. 
                  Constraints that aren't negotiable.
                </p>
              </Card>
            </RevealText>
          </div>
        </div>
      </Section>

      {/* BLAST RADIUS */}
      <Section id="blast-radius" className="relative">
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4A84B]/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              04 — THE BLAST RADIUS MAP
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              What would you <span className="text-[#D4A84B]">think about</span>?
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl">
              If you were building this feature manually, what would you check? 
              What could break? What systems would you need to understand?
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">The Integration Thinking Checklist</h3>
              <div className="space-y-3 text-zinc-400">
                <div className="flex items-start gap-3">
                  <span className="text-[#D4A84B]">→</span>
                  <span>What databases, APIs, or services will this touch?</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D4A84B]">→</span>
                  <span>What existing features need to stay compatible?</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D4A84B]">→</span>
                  <span>What would break if I don't consider X?</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D4A84B]">→</span>
                  <span>What patterns from other projects should apply here?</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D4A84B]">→</span>
                  <span>What constraints am I forgetting to mention?</span>
                </div>
              </div>
            </Card>
          </RevealText>
          
          <RevealText delay={0.25}>
            <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">
                <span className="text-[#D4A84B]">Example:</span> "This notification feature needs to integrate with 
                user preferences, the push notification service, and email templates. 
                It also needs to respect the rate limiting we have on notifications."
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* CLAUDE.MD */}
      <Section id="claude-md" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              05 — CLAUDE.MD
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
              Your persistent <span className="text-[#D4A84B]">brain</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl">
              The instruction file that loads every time Claude Code starts. 
              Your chance to front-load everything it needs to know.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">What Goes in CLAUDE.md</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-[#D4A84B] mb-2">About You & The Project</h4>
                  <ul className="space-y-1 text-zinc-400 text-sm">
                    <li>• Your communication style preferences</li>
                    <li>• What kind of developer you are</li>
                    <li>• What the project does and who it's for</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#D4A84B] mb-2">How We Work</h4>
                  <ul className="space-y-1 text-zinc-400 text-sm">
                    <li>• Critical patterns and conventions</li>
                    <li>• Gotchas and pitfalls to avoid</li>
                    <li>• Operational commands (dev, deploy, test)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </RevealText>
          
          <RevealText delay={0.25}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">Reference Docs Pattern</h3>
              <CodeBlock>{`CLAUDE.md (the hub)
├── References what-were-building.md
├── References how-we-do-shit.md
└── References developer-guides/
    ├── auth-system-guide.md
    └── database-patterns.md`}</CodeBlock>
              <p className="text-zinc-500 text-sm mt-4">
                Keep CLAUDE.md focused. Point to other docs for deep dives.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* BRAIN DUMP WORKFLOW */}
      <Section id="brain-dump" className="relative">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              06 — THE BRAIN DUMP WORKFLOW
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Start <span className="text-purple-400">messy</span>
            </h2>
          </RevealText>
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl">
              Your initial context doesn't need to be perfectly structured. 
              Just get everything out of your head.
            </p>
          </RevealText>
          
          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#D4A84B] text-2xl font-display font-medium">1</div>
                  <div>
                    <h3 className="font-semibold mb-1">Voice Record Everything</h3>
                    <p className="text-zinc-400 text-sm">
                      Turn on a mic and brain dump. Talk through what you're building, 
                      what you're worried about, what patterns should apply.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>
            
            <RevealText delay={0.25}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#D4A84B] text-2xl font-display font-medium">2</div>
                  <div>
                    <h3 className="font-semibold mb-1">Attach Relevant Files</h3>
                    <p className="text-zinc-400 text-sm">
                      Code snippets from other projects, vision docs, rough sketches, 
                      example patterns you want to follow.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>
            
            <RevealText delay={0.3}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#D4A84B] text-2xl font-display font-medium">3</div>
                  <div>
                    <h3 className="font-semibold mb-1">Let AI Organize</h3>
                    <p className="text-zinc-400 text-sm">
                      Feed the mess to Claude. Ask it to organize into coherent context. 
                      Review and refine.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>
          </div>
          
          <RevealText delay={0.35}>
            <div className="bg-[#0d0d0d] border border-zinc-800/50 rounded-xl p-4 mt-8">
              <p className="text-zinc-500 text-sm">
                <span className="text-purple-400">The key:</span> Don't optimize for structure upfront. 
                Optimize for <span className="text-white">completeness</span>. Get everything out. Organize later.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* FIRST PROJECT */}
      <Section id="first-project" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              07 — YOUR FIRST PROJECT
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              The <span className="text-[#D4A84B]">context loading</span> checklist
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border border-[#D4A84B] flex items-center justify-center text-[#D4A84B] text-sm flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold mb-1">Brain dump your vision</h4>
                    <p className="text-zinc-400 text-sm">Voice + files. Get everything out of your head.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border border-[#D4A84B] flex items-center justify-center text-[#D4A84B] text-sm flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold mb-1">Identify integration points</h4>
                    <p className="text-zinc-400 text-sm">What systems does this touch? What needs to stay compatible?</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border border-[#D4A84B] flex items-center justify-center text-[#D4A84B] text-sm flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold mb-1">Set up CLAUDE.md</h4>
                    <p className="text-zinc-400 text-sm">Start simple. Add who you are, what you're building, key patterns.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border border-[#D4A84B] flex items-center justify-center text-[#D4A84B] text-sm flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-semibold mb-1">Create initial reference docs</h4>
                    <p className="text-zinc-400 text-sm">Developer guides for key systems you'll be touching.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border border-[#D4A84B] flex items-center justify-center text-[#D4A84B] text-sm flex-shrink-0">5</div>
                  <div>
                    <h4 className="font-semibold mb-1">Test with a small ask</h4>
                    <p className="text-zinc-400 text-sm">Verify it understands the context before diving into big work.</p>
                  </div>
                </div>
              </div>
            </Card>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h4 className="font-semibold mb-2 text-green-400">New Project</h4>
                <p className="text-zinc-400 text-sm">
                  Focus on vision, patterns from other projects, constraints. 
                  What does "done well" look like?
                </p>
              </Card>
              <Card>
                <h4 className="font-semibold mb-2 text-blue-400">Existing Codebase</h4>
                <p className="text-zinc-400 text-sm">
                  Focus on integration points, blast radius, established conventions. 
                  What could break?
                </p>
              </Card>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SUMMARY */}
      <Section id="summary" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D4A84B]/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-6">
              THE TAKEAWAY
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
              The AI can only know <span className="text-[#D4A84B]">what you tell it</span>
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <div className="text-3xl mb-3">🧠</div>
                <h3 className="font-semibold mb-2">Brain Dump First</h3>
                <p className="text-zinc-500 text-sm">Complete over structured</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl mb-3">🗺️</div>
                <h3 className="font-semibold mb-2">Map the Blast Radius</h3>
                <p className="text-zinc-500 text-sm">What could break?</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl mb-3">📄</div>
                <h3 className="font-semibold mb-2">Make It Persistent</h3>
                <p className="text-zinc-500 text-sm">CLAUDE.md + reference docs</p>
              </Card>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-xl text-zinc-400">
              Front-load the context. Everything else gets easier.
              <br />
              <span className="text-[#D4A84B]">Now you're ready for the workflow.</span>
            </p>
          </RevealText>
        </div>
      </Section>

    </div>
  );
}
