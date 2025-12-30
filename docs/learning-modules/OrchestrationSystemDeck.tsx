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

export default function OrchestrationSystemDeck() {
  const [activeSection, setActiveSection] = useState('title');

  const sections = [
    { id: 'title', label: 'Welcome' },
    { id: 'mindset-shift', label: 'The Mindset Shift' },
    { id: 'case-study-intro', label: 'Case Study' },
    { id: 'stage-1', label: 'Stage 1: The Struggle' },
    { id: 'stage-2', label: 'Stage 2: First Guide' },
    { id: 'stage-3', label: 'Stage 3: The Epiphany' },
    { id: 'stage-4', label: 'Stage 4: Self-Improving' },
    { id: 'layered-protocol', label: 'Layered Protocol' },
    { id: 'developer-guides', label: 'Developer Guides' },
    { id: 'compound-effect', label: 'The Compound Effect' },
    { id: 'your-system', label: 'Building Your System' },
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
              33 STRATEGIES — PART 3
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium mb-6">
              Building Your <span className="text-[#D4A84B]">Orchestration System</span>
            </h1>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              How to systematically improve your AI's understanding over time
            </p>
          </RevealText>
          <RevealText delay={0.3}>
            <p className="text-zinc-500 text-base">
              The 201 level. For when you're ready to think like an orchestrator.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* MINDSET SHIFT */}
      <Section id="mindset-shift" className="relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              01 — THE MINDSET SHIFT
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              From coder to <span className="text-purple-400">orchestrator</span>
            </h2>
          </RevealText>
          
          <div className="grid md:grid-cols-2 gap-8">
            <RevealText delay={0.2}>
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-4 text-zinc-500">Coder Mindset</h3>
                <ul className="space-y-2 text-zinc-400">
                  <li>→ "How do I build this feature?"</li>
                  <li>→ "What's the code to solve this?"</li>
                  <li>→ "Let me implement this logic"</li>
                  <li>→ Focus: individual tasks</li>
                </ul>
              </Card>
            </RevealText>
            
            <RevealText delay={0.25}>
              <Card className="h-full" highlight>
                <h3 className="text-xl font-semibold mb-4 text-[#D4A84B]">Orchestrator Mindset</h3>
                <ul className="space-y-2 text-zinc-300">
                  <li>→ "How do I improve the system?"</li>
                  <li>→ "What knowledge is missing?"</li>
                  <li>→ "What patterns should be reusable?"</li>
                  <li>→ Focus: system capability over time</li>
                </ul>
              </Card>
            </RevealText>
          </div>
          
          <RevealText delay={0.3}>
            <p className="text-zinc-500 mt-8 text-center">
              Every task is an opportunity to make the <span className="text-[#D4A84B]">next task easier</span>.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* CASE STUDY INTRO */}
      <Section id="case-study-intro" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D4A84B]/8 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              02 — CASE STUDY
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              The <span className="text-[#D4A84B]">Database Master</span> Evolution
            </h2>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              How a struggling SQL agent became a self-improving system 
              that gets smarter with every query.
            </p>
          </RevealText>
          <RevealText delay={0.3}>
            <Card>
              <p className="text-zinc-300">
                This is a real example of going from <span className="text-red-400">"it does a shitty job"</span> to 
                <span className="text-green-400"> "it suggests patterns I hadn't considered"</span> — 
                and building a system that improves itself.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* STAGE 1 */}
      <Section id="stage-1" className="relative">
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              03 — STAGE 1
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              The <span className="text-red-400">Struggle</span>
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">The Starting Point</h3>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-red-400">→</span>
                  <span>Needed an agent to write SQL queries</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">→</span>
                  <span>Started with raw GraphQL and Prisma files</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">→</span>
                  <span>Did a shitty job writing even basic queries</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">→</span>
                  <span>Lots of back-and-forth to get anything working</span>
                </li>
              </ul>
            </Card>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="bg-[#0d0d0d] border border-red-500/20 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">
                <span className="text-red-400">The problem:</span> Raw schema files don't teach the AI 
                how the data actually relates, what the common patterns are, or what queries 
                actually work in practice.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* STAGE 2 */}
      <Section id="stage-2" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              04 — STAGE 2
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              The First <span className="text-blue-400">Guide</span>
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">The First Improvement</h3>
              <p className="text-zinc-400 mb-4">
                As patterns were figured out, Claude was told to create a 
                <span className="text-blue-400"> Data Model Guide</span> — 
                developer cliff notes for understanding the schema.
              </p>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li>• How tables relate to each other</li>
                <li>• Common query patterns that work</li>
                <li>• Gotchas and edge cases discovered</li>
                <li>• Field meanings and business logic</li>
              </ul>
            </Card>
          </RevealText>
          
          <RevealText delay={0.3}>
            <Card>
              <h3 className="text-lg font-semibold mb-3 text-zinc-300">The New Problem</h3>
              <p className="text-zinc-400">
                Over time, the guide got <span className="text-blue-400">really long and rich</span>... 
                but also <span className="text-red-400">too long to be useful as a quick reference</span>.
              </p>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* STAGE 3 */}
      <Section id="stage-3" className="relative">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              05 — STAGE 3
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              The <span className="text-green-400">Epiphany</span>
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6" highlight>
              <h3 className="text-lg font-semibold mb-4 text-[#D4A84B]">The Realization</h3>
              <p className="text-zinc-300 text-lg mb-4">
                "I have 10-15 working SQL queries now. What if Claude looked at all 
                the working ones and created a new file..."
              </p>
              <p className="text-zinc-400">
                A <span className="text-green-400">SQL Building Blocks</span> file — 
                an index of patterns for specific types of data commonly requested.
              </p>
            </Card>
          </RevealText>
          
          <RevealText delay={0.3}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">The New Workflow</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0d0d0d] border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm mb-2">Before:</p>
                  <p className="text-zinc-500 text-sm">Read the whole guide every time</p>
                </div>
                <div className="bg-[#0d0d0d] border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400 text-sm mb-2">After:</p>
                  <p className="text-zinc-500 text-sm">Check the index first — it's probably been done before</p>
                </div>
              </div>
            </Card>
          </RevealText>
        </div>
      </Section>

      {/* STAGE 4 */}
      <Section id="stage-4" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              06 — STAGE 4
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              The <span className="text-[#D4A84B]">Self-Improving</span> Protocol
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6" highlight>
              <h3 className="text-lg font-semibold mb-4 text-[#D4A84B]">The Final Evolution</h3>
              <p className="text-zinc-300 mb-4">
                A circular, self-improving protocol. The system doesn't just answer queries — 
                it <span className="text-green-400">improves itself</span> with every query.
              </p>
              <p className="text-zinc-400 text-sm">
                Each query is an opportunity to add new patterns, refine existing ones, 
                or note missing data that needs mapping.
              </p>
            </Card>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-zinc-500 text-center">
              The more you use it, the <span className="text-[#D4A84B]">smarter it gets</span> at the things you do regularly.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* LAYERED PROTOCOL */}
      <Section id="layered-protocol" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#D4A84B]/8 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              07 — THE LAYERED PROTOCOL
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              How it <span className="text-[#D4A84B]">actually works</span> now
            </h2>
          </RevealText>
          
          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-[#D4A84B] text-2xl font-display font-medium">1</div>
                  <div>
                    <h3 className="font-semibold mb-2">Building Blocks (First Pass)</h3>
                    <p className="text-zinc-400 text-sm mb-2">
                      Can this be composed 100% from existing patterns?
                    </p>
                    <ul className="text-zinc-500 text-sm space-y-1">
                      <li>• Also takes a critical eye: are there better patterns we could apply?</li>
                      <li>• Notes any unmapped data we'll need to go get</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </RevealText>
            
            <RevealText delay={0.25}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-blue-400 text-2xl font-display font-medium">2</div>
                  <div>
                    <h3 className="font-semibold mb-2">The Guide (Second Pass)</h3>
                    <p className="text-zinc-400 text-sm">
                      If blocks aren't sufficient, check the comprehensive reference 
                      for deeper context and edge cases.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>
            
            <RevealText delay={0.3}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-purple-400 text-2xl font-display font-medium">3</div>
                  <div>
                    <h3 className="font-semibold mb-2">Smart Exploration (Rare Cases)</h3>
                    <p className="text-zinc-400 text-sm mb-2">
                      If still not in the guide, protocol tells it how to explore:
                    </p>
                    <CodeBlock className="text-xs">SELECT * FROM table_name LIMIT 10</CodeBlock>
                    <p className="text-zinc-500 text-sm mt-2">
                      Systematic discovery of table structures and field meanings.
                    </p>
                  </div>
                </div>
              </Card>
            </RevealText>
          </div>
        </div>
      </Section>

      {/* DEVELOPER GUIDES */}
      <Section id="developer-guides" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              08 — DEVELOPER GUIDES
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              10 minutes once, <span className="text-green-400">10 seconds forever</span>
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">Creating Your First Guide</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="text-[#D4A84B] text-lg font-display">1</div>
                  <p className="text-zinc-400">
                    "Go create a guide for the auth system. Here are some key things to know, 
                    but also read the code and show me what you built."
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-[#D4A84B] text-lg font-display">2</div>
                  <p className="text-zinc-400">
                    Review, adjust, add edge cases you know about
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-[#D4A84B] text-lg font-display">3</div>
                  <p className="text-zinc-400">
                    Done. The guide exists forever.
                  </p>
                </div>
              </div>
            </Card>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h4 className="font-semibold text-[#D4A84B] mb-2">First Time</h4>
                <p className="text-zinc-400 text-sm">10-15 minutes to create a really good guide</p>
              </Card>
              <Card>
                <h4 className="font-semibold text-green-400 mb-2">Every Time After</h4>
                <p className="text-zinc-400 text-sm">10 seconds to add missing details (increasingly rare)</p>
              </Card>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* COMPOUND EFFECT */}
      <Section id="compound-effect" className="relative">
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              09 — THE COMPOUND EFFECT
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Documentation that <span className="text-green-400">pays dividends</span>
            </h2>
          </RevealText>
          
          <div className="space-y-4">
            <RevealText delay={0.2}>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="text-zinc-600 text-sm w-24">Week 1</div>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400/50 w-1/6"></div>
                  </div>
                  <p className="text-zinc-500 text-sm">Building guides feels like overhead</p>
                </div>
              </Card>
            </RevealText>
            
            <RevealText delay={0.25}>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="text-zinc-600 text-sm w-24">Month 1</div>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400/50 w-2/6"></div>
                  </div>
                  <p className="text-zinc-500 text-sm">Starting to reuse guides, saving time</p>
                </div>
              </Card>
            </RevealText>
            
            <RevealText delay={0.3}>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="text-zinc-600 text-sm w-24">Month 3</div>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400/50 w-4/6"></div>
                  </div>
                  <p className="text-zinc-500 text-sm">Comprehensive docs, AI knows your system</p>
                </div>
              </Card>
            </RevealText>
            
            <RevealText delay={0.35}>
              <Card highlight>
                <div className="flex items-center gap-4">
                  <div className="text-[#D4A84B] text-sm w-24">Month 6</div>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4A84B] w-full"></div>
                  </div>
                  <p className="text-[#D4A84B] text-sm">New team members onboard in hours</p>
                </div>
              </Card>
            </RevealText>
          </div>
        </div>
      </Section>

      {/* YOUR SYSTEM */}
      <Section id="your-system" className="relative">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              10 — BUILDING YOUR SYSTEM
            </p>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
              Questions to ask <span className="text-[#D4A84B]">constantly</span>
            </h2>
          </RevealText>
          
          <div className="grid md:grid-cols-2 gap-6">
            <RevealText delay={0.2}>
              <Card className="h-full">
                <h3 className="text-lg font-semibold mb-4 text-[#D4A84B]">About Knowledge</h3>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>→ What does the AI keep getting wrong?</li>
                  <li>→ What context am I repeating every time?</li>
                  <li>→ What patterns work that aren't documented?</li>
                  <li>→ What would a new developer need to know?</li>
                </ul>
              </Card>
            </RevealText>
            
            <RevealText delay={0.25}>
              <Card className="h-full">
                <h3 className="text-lg font-semibold mb-4 text-green-400">About Workflow</h3>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>→ What am I doing repeatedly that could be a command?</li>
                  <li>→ What specialized work needs a dedicated agent?</li>
                  <li>→ What mistakes keep happening that a hook could catch?</li>
                  <li>→ What would make the next task easier?</li>
                </ul>
              </Card>
            </RevealText>
          </div>
          
          <RevealText delay={0.3}>
            <Card className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-300">The Orchestrator's Loop</h3>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <span className="bg-[#D4A84B]/20 text-[#D4A84B] px-3 py-1 rounded-full">Do the work</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-blue-400/20 text-blue-400 px-3 py-1 rounded-full">Notice friction</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full">Improve the system</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-purple-400/20 text-purple-400 px-3 py-1 rounded-full">Repeat</span>
              </div>
            </Card>
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
              Every task improves <span className="text-[#D4A84B]">the next task</span>
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="font-semibold mb-2">Layered Knowledge</h3>
                <p className="text-zinc-500 text-sm">Quick reference → deep guide → exploration</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="font-semibold mb-2">Self-Improving</h3>
                <p className="text-zinc-500 text-sm">Each use makes the system smarter</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-semibold mb-2">Compound Returns</h3>
                <p className="text-zinc-500 text-sm">Investment now, dividends forever</p>
              </Card>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-xl text-zinc-400">
              Think like an orchestrator. Build the system, not just the feature.
              <br />
              <span className="text-[#D4A84B]">That's how you 10x your capability.</span>
            </p>
          </RevealText>
        </div>
      </Section>

    </div>
  );
}
