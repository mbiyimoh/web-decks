import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Animated section wrapper
const Section = ({ children, className = '', id }) => {
  const ref = useRef(null);
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

// Animated text reveal
const RevealText = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
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

// Video/Demo placeholder
const DemoPlaceholder = ({ title, duration, description }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 overflow-hidden"
    >
      <div className="aspect-video flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <p className="text-zinc-400 text-sm uppercase tracking-wider mb-1">{duration}</p>
        <p className="text-white font-medium text-lg mb-2">{title}</p>
        <p className="text-zinc-500 text-sm text-center max-w-md">{description}</p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </motion.div>
  );
};

// Progress indicator
const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
      style={{ scaleX }}
    />
  );
};

// Navigation dots
const NavDots = ({ sections, activeSection }) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {sections.map((section, i) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`group flex items-center gap-3 ${
            activeSection === section.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'
          } transition-opacity`}
          title={section.label}
        >
          <span className={`text-xs text-right w-32 hidden group-hover:block text-zinc-400 transition-all`}>
            {section.label}
          </span>
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
            activeSection === section.id 
              ? 'bg-amber-500 scale-125' 
              : 'bg-zinc-600 group-hover:bg-zinc-400'
          }`} />
        </a>
      ))}
    </div>
  );
};

// Phase status badge
const PhaseStatus = ({ status }) => {
  const config = {
    completed: { icon: '✓', text: 'Completed', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', color: 'text-emerald-400' },
    'rolling-out': { icon: '◐', text: 'Rolling Out', bg: 'bg-amber-500/20', border: 'border-amber-500/50', color: 'text-amber-400' },
    beta: { icon: '○', text: 'In Beta', bg: 'bg-blue-500/20', border: 'border-blue-500/50', color: 'text-blue-400' },
    live: { icon: '●', text: 'Live Now', bg: 'bg-purple-500/20', border: 'border-purple-500/50', color: 'text-purple-400' },
  };
  
  const { icon, text, bg, border, color } = config[status];
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${bg} ${border} ${color} border`}>
      <span>{icon}</span>
      <span>{text}</span>
    </span>
  );
};

// Roadmap component for Slide 2
const Roadmap = ({ activePhase = null }) => {
  const phases = [
    { num: 1, title: 'Operator Essentials', desc: 'Back-office AI foundation', status: 'completed' },
    { num: 2, title: 'Marketing & Comms', desc: 'Multi-channel automation', status: 'rolling-out' },
    { num: 3, title: 'TradeblockGPT', desc: 'Product intelligence', status: 'beta' },
  ];
  
  const statusColors = {
    completed: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
    'rolling-out': { bg: 'bg-amber-500', ring: 'ring-amber-500/30' },
    beta: { bg: 'bg-blue-500', ring: 'ring-blue-500/30' },
  };
  
  const statusIcons = {
    completed: '✓',
    'rolling-out': '◐',
    beta: '○',
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-0 md:items-center">
      {phases.map((phase, i) => (
        <React.Fragment key={phase.num}>
          <div className={`flex-1 bg-zinc-900/50 border rounded-xl p-5 transition-all ${
            activePhase === phase.num 
              ? 'border-amber-500/50 scale-105' 
              : 'border-zinc-800'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${statusColors[phase.status].bg} ring-4 ${statusColors[phase.status].ring}`}>
                {statusIcons[phase.status]}
              </div>
              <span className="text-zinc-500 text-sm">Phase {phase.num}</span>
            </div>
            <p className="text-white font-medium mb-1">{phase.title}</p>
            <p className="text-zinc-500 text-sm">{phase.desc}</p>
          </div>
          {i < phases.length - 1 && (
            <div className="hidden md:block w-8 h-0.5 bg-zinc-700 mx-2" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Company card for B2B section
const CompanyCard = ({ name, description, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
    >
      <p className="text-2xl font-bold text-white mb-2">{name}</p>
      <p className="text-zinc-500 text-sm">{description}</p>
    </motion.div>
  );
};

// Analytics metric card for new slide
const AnalyticsCard = ({ title, value, subtitle, color = 'zinc', delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  
  const colorMap = {
    zinc: 'border-zinc-700/50 bg-zinc-900/50',
    green: 'border-emerald-500/30 bg-emerald-500/5',
    yellow: 'border-amber-500/30 bg-amber-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-xl p-4 border ${colorMap[color]}`}
    >
      <p className="text-zinc-400 text-xs mb-1">{title}</p>
      <p className="text-white text-xl font-bold mb-1">{value}</p>
      <p className="text-zinc-500 text-xs">{subtitle}</p>
    </motion.div>
  );
};

// Main component
export default function TradeblockDeckV4() {
  const [activeSection, setActiveSection] = useState('title');
  
  const sections = [
    { id: 'title', label: 'Title' },
    { id: 'question', label: 'The Question' },
    { id: 'phase1', label: 'Phase 1: Operator' },
    { id: 'phase2', label: 'Phase 2: Marketing' },
    { id: 'phase2-results', label: 'Phase 2: Results' },
    { id: 'phase3', label: 'Phase 3: GPT' },
    { id: 'analytics', label: 'Advanced Analytics' },
    { id: 'b2b', label: 'B2B Demand' },
    { id: 'strategic', label: 'Strategic Interest' },
    { id: 'optionality', label: 'Optionality' },
    { id: 'opportunity', label: 'Opportunity' },
    { id: 'ask', label: 'The Ask' },
    { id: 'demo', label: 'Live Demo' },
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
    <div className="bg-black text-white min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        html {
          scroll-behavior: smooth;
        }
        
        .font-display {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glow {
          box-shadow: 0 0 60px rgba(245, 158, 11, 0.15);
        }
        
        .glow-strong {
          box-shadow: 0 0 80px rgba(245, 158, 11, 0.25);
        }
        
        .glow-purple {
          box-shadow: 0 0 60px rgba(168, 85, 247, 0.15);
        }
      `}</style>
      
      <ProgressBar />
      <NavDots sections={sections} activeSection={activeSection} />

      {/* ========== SLIDE 1: Title ========== */}
      <Section id="title" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-[0.3em] text-sm mb-6">Investor Update • November 2025</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.9]">
              <span className="text-white">TRADEBLOCK:</span>
              <br />
              <span className="text-gradient">THE AI INFLECTION</span>
            </h1>
          </RevealText>
          
          <RevealText delay={0.2}>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl leading-relaxed">
              How constraints created a weapon—and what it means for the next 12 months.
            </p>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="mt-12 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold">
                MG
              </div>
              <div>
                <p className="text-white font-medium">Mbiyimoh Ghogomu</p>
                <p className="text-zinc-500 text-sm">Founder & CEO</p>
              </div>
            </div>
          </RevealText>
        </div>
        
        <RevealText delay={0.4} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center text-zinc-500">
            <p className="text-xs uppercase tracking-wider mb-2">Scroll to explore</p>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </div>
        </RevealText>
      </Section>

      {/* ========== SLIDE 2: The Question + Roadmap ========== */}
      <Section id="question" className="bg-zinc-950">
        <div className="max-w-5xl">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-8">01 — The Question</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <p className="text-xl text-zinc-400 mb-6 leading-relaxed max-w-3xl">
              When we cut headcount to the bone, I lost all the people who used to help me fetch data, generate reports, build dashboards, run campaigns, and understand the business.
            </p>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-3xl">
              I was left with a strategic question:
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-12 glow">
              <p className="text-2xl md:text-3xl text-white font-display font-bold leading-relaxed">
                "How do we use AI to go from a skeleton crew to operating like a 25-person team—<span className="text-amber-500">without all that headcount spend?</span>"
              </p>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-lg text-zinc-400 mb-8">
              After months of consideration and experimentation, I arrived at a three-phase AI roadmap:
            </p>
          </RevealText>
          
          <RevealText delay={0.4}>
            <Roadmap />
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 3: Phase 1 — Operator Essentials ========== */}
      <Section id="phase1" className="bg-black">
        <div className="max-w-5xl">
          <RevealText>
            <div className="flex items-center gap-4 mb-8">
              <p className="text-amber-500 uppercase tracking-widest text-sm">02 — Phase 1</p>
              <PhaseStatus status="completed" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Operator Essentials
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
              I rebuilt the back office with AI. When we cut headcount, we lost the people who helped me understand the business. So I taught agents to do it instead.
            </p>
          </RevealText>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <RevealText delay={0.2}>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">SQL Intelligence Agent</h3>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Our data model is weird—barter-centric, trade-focused, not like a normal e-commerce company. I taught an agent to understand it deeply, so I can ask questions in plain English and get SQL queries that actually work. <span className="text-zinc-300">No more waiting on analysts.</span>
                </p>
              </div>
            </RevealText>
            
            <RevealText delay={0.25}>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Virtual CFO</h3>
                </div>
                <p className="text-zinc-400 leading-relaxed mb-4">
                  An agent that understands our trade-focused business model and unit economics inside and out. It now handles:
                </p>
                <ul className="space-y-2 text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Transaction classification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Month-end close reports
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Dynamic projection models
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Scenario exploration—conversationally
                  </li>
                </ul>
              </div>
            </RevealText>
          </div>
          
          <RevealText delay={0.3}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Data Connection Agents</h3>
              </div>
              <p className="text-zinc-400 mb-6">
                I built connectors for every key data source—accessible through a unified <span className="text-white font-medium">"command system"</span> that both I and my agents can leverage:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'Core SQL', desc: 'User, trade, inventory' },
                  { name: 'Stripe', desc: 'Transactions & revenue' },
                  { name: 'UPS & Shippo', desc: 'Shipping costs' },
                  { name: 'Mailjet', desc: 'Email campaigns' },
                  { name: 'Posthog', desc: 'Product analytics' },
                  { name: 'Firebase', desc: 'Push notifications' },
                ].map((source) => (
                  <div key={source.name} className="bg-zinc-800/50 rounded-lg px-4 py-3">
                    <p className="text-white font-medium text-sm">{source.name}</p>
                    <p className="text-zinc-500 text-xs">{source.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.4}>
            <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500 pl-6 py-4">
              <p className="text-xl text-zinc-300">
                <span className="text-white font-medium">The punchline:</span> Everything we used to pay analysts, finance people, and ops specialists for—automated. This is the foundation that makes everything else possible.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 4: Phase 2 — Marketing & Comms ========== */}
      <Section id="phase2" className="bg-zinc-950">
        <div className="max-w-5xl">
          <RevealText>
            <div className="flex items-center gap-4 mb-8">
              <p className="text-amber-500 uppercase tracking-widest text-sm">03 — Phase 2</p>
              <PhaseStatus status="rolling-out" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Marketing, Comms & Engagement
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
              With the operator foundation in place, I turned to the question: how do we 10x our marketing output without hiring a marketing team?
            </p>
          </RevealText>
          
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <RevealText delay={0.2}>
              <div className="space-y-8">
                <p className="text-amber-500 font-medium text-lg">The AI Campaign Engine</p>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-amber-500 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg mb-2">Define a "recipe" once</p>
                    <p className="text-zinc-500">Sneaker release, giveaway, product update—whatever the moment calls for.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-amber-500 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg mb-2">System generates all assets</p>
                    <p className="text-zinc-500">Email copy, push notifications, social posts, blog content—calibrated to our voice, personas, and platform-specific objectives.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-amber-500 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg mb-2">One operator reviews & deploys</p>
                    <p className="text-zinc-500">More time thinking about what great looks like, less time grinding on execution.</p>
                  </div>
                </div>
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <DemoPlaceholder 
                title="Campaign Engine Demo"
                duration="15-20 sec"
                description="Recipe definition → AI content generation → Review interface → Multi-channel deployment"
              />
            </RevealText>
          </div>
          
          <RevealText delay={0.35}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-8">
              <p className="text-2xl md:text-3xl text-white font-display font-bold mb-4">
                8 hours → 45 minutes.
              </p>
              <p className="text-xl text-zinc-400 mb-6">
                And the output is <span className="text-white">better</span>, not just faster. When you're not grinding on execution, you spend more time thinking about what great actually looks like.
              </p>
              
              <p className="text-amber-500 font-medium mb-3">What makes it real, not slop:</p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  Trained on our strategic docs, personas, and voice
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  Knows what resonates with collectors vs. resellers
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  Understands that IG ≠ email ≠ push
                </li>
              </ul>
              <p className="text-white mt-4 font-medium">
                This isn't ChatGPT wrappers. It's a system that understands the business.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 5: Phase 2 Results ========== */}
      <Section id="phase2-results" className="bg-black">
        <div className="max-w-5xl">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-8">04 — Phase 2 Results</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-tight">
              Every dormant channel is now active—and high-quality.
            </h2>
          </RevealText>
          
          <div className="space-y-4 mb-12">
            {[
              { channel: 'Email', before: 'Sporadic, reactive', after: '3x volume, consistent 2-9% click-to-trade conversion' },
              { channel: 'Push', before: 'Basic alerts only', after: '3-layer system: platform moments, trend triggers, behavior response' },
              { channel: 'Blog', before: 'Dead', after: 'Weekly content, SEO-optimized, zero incremental effort' },
              { channel: 'Social', before: 'Inconsistent posting', after: 'Daily cadence, culturally native, on-brand' },
            ].map((item, i) => (
              <RevealText key={item.channel} delay={0.15 + i * 0.1}>
                <div className="grid grid-cols-12 gap-4 items-center bg-zinc-900/30 rounded-xl p-5 border border-zinc-800/50">
                  <p className="col-span-2 text-white font-medium text-lg">{item.channel}</p>
                  <p className="col-span-4 text-zinc-500 line-through">{item.before}</p>
                  <p className="col-span-6 text-amber-500 font-medium">{item.after}</p>
                </div>
              </RevealText>
            ))}
          </div>
          
          <RevealText delay={0.5}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center glow">
              <p className="text-2xl md:text-3xl text-white font-display font-bold mb-4">
                The punchline:
              </p>
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                A single sneaker culture SME—<span className="text-amber-500">not a marketer, not a designer</span>—now runs our entire comms operation across every platform.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 5: Phase 3 — TradeblockGPT ========== */}
      <Section id="phase3" className="bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-5xl relative z-10">
          <RevealText>
            <div className="flex items-center gap-4 mb-8">
              <p className="text-amber-500 uppercase tracking-widest text-sm">05 — Phase 3</p>
              <PhaseStatus status="beta" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              TradeblockGPT
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
              This is where AI stops being back-office and becomes the product itself. A conversational trading intelligence that learns your style, your closet, your wishlist—then makes you better at trading.
            </p>
          </RevealText>
          
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <RevealText delay={0.2}>
              <div className="space-y-6">
                <p className="text-amber-500 font-medium">What it actually does:</p>
                
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">→ Onboards you</p>
                    <p className="text-white italic text-lg">"Hey, I'm TradeblockGPT. Let's dial in what you're looking for."</p>
                  </div>
                  
                  <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">→ Surfaces opportunities you'd miss</p>
                    <p className="text-white italic text-lg">"There's a Travis Scott Olive you've been sleeping on—the owner wants something you already have."</p>
                  </div>
                  
                  <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">→ Suggests trades that fit</p>
                    <p className="text-white italic text-lg">Not just generic matches—trades that fit your taste, your goals, your vibe.</p>
                  </div>
                </div>
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <DemoPlaceholder 
                title="TradeblockGPT Demo"
                duration="20-30 sec"
                description="User asks for trade ideas → GPT responds with specific recommendation → Shows personality and intelligence"
              />
            </RevealText>
          </div>
          
          <RevealText delay={0.4}>
            <p className="text-amber-500 font-medium mb-4">Why this is a moat:</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-blue-500/30 rounded-xl p-5">
                <p className="text-blue-400 font-bold text-lg mb-2">Retention Engine</p>
                <p className="text-zinc-400 text-sm">Users come back to see what GPT found for them</p>
              </div>
              <div className="bg-zinc-900/50 border border-blue-500/30 rounded-xl p-5">
                <p className="text-blue-400 font-bold text-lg mb-2">Differentiation</p>
                <p className="text-zinc-400 text-sm">Nobody else in sneakers has this</p>
              </div>
              <div className="bg-zinc-900/50 border border-blue-500/30 rounded-xl p-5">
                <p className="text-blue-400 font-bold text-lg mb-2">Data Moat</p>
                <p className="text-zinc-400 text-sm">Trained on proprietary data competitors can't access</p>
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.5}>
            <p className="text-xl text-white mt-8 font-medium">
              This is the feature that makes Tradeblock feel like magic.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 6: Advanced Analytics — The Byproduct ========== */}
      <Section id="analytics" className="bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-5xl relative z-10">
          <RevealText>
            <div className="flex items-center gap-4 mb-8">
              <p className="text-amber-500 uppercase tracking-widest text-sm">06 — The Byproduct</p>
              <PhaseStatus status="live" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Oh, and we already have a product to sell.
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12 max-w-3xl">
              Building TradeblockGPT gave us something we didn't expect: <span className="text-white">Advanced Analytics</span>—a subscription product we can monetize right now, at near-zero marginal cost.
            </p>
          </RevealText>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <RevealText delay={0.2}>
              <div className="bg-zinc-900/70 border border-purple-500/20 rounded-2xl p-6 glow-purple">
                <p className="text-purple-400 font-medium mb-4">Per-Shoe Intelligence</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <AnalyticsCard 
                    title="Desirability Ratio" 
                    value="2.3x" 
                    subtitle="High demand signal"
                    color="green"
                    delay={0.25}
                  />
                  <AnalyticsCard 
                    title="Offer Success Rate" 
                    value="46.3%" 
                    subtitle="73% for 1:1 trades"
                    color="green"
                    delay={0.3}
                  />
                  <AnalyticsCard 
                    title="Tradeability Score" 
                    value="62/100" 
                    subtitle="Good demand"
                    color="yellow"
                    delay={0.35}
                  />
                  <AnalyticsCard 
                    title="Momentum" 
                    value="+6.9%" 
                    subtitle="Growing interest"
                    color="green"
                    delay={0.4}
                  />
                </div>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-3">
                  <p className="text-zinc-400 text-xs mb-2">Optimal Trade Partners</p>
                  <div className="flex flex-wrap gap-2">
                    {['thefaculty', 'clc', 'SpaceWizard', 'SIGSAUER31'].map((name) => (
                      <span key={name} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2 py-1 rounded-full">
                        {name} • 90%
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-xs mb-1">Fair Value Benchmark</p>
                  <p className="text-white font-bold">Based on successful offer patterns</p>
                </div>
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <p className="text-white font-medium text-lg mb-4">What subscribers unlock:</p>
                  <ul className="space-y-3 text-zinc-400">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                      <span><span className="text-white">Per-shoe market intelligence</span> — demand signals, success rates, momentum</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                      <span><span className="text-white">Optimal trade partners</span> — who's actively looking for what you have</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                      <span><span className="text-white">Fair value benchmarks</span> — what's actually getting accepted</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                      <span><span className="text-white">Friction analysis</span> — why offers fail, how to fix it</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                      <span><span className="text-white">Trust pairing insights</span> — success rates by trader reputation</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500/10 to-transparent border-l-2 border-purple-500 pl-6 py-4">
                  <p className="text-zinc-300">
                    <span className="text-white font-medium">The economics:</span> Subscription revenue, near-zero marginal cost. The data infrastructure is already built—this is just a new interface on top of it.
                  </p>
                </div>
              </div>
            </RevealText>
          </div>
          
          <RevealText delay={0.5}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
                The GPT work gave us a monetizable product <span className="text-purple-400 font-medium">as a byproduct</span>—before the main feature even launches.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 8: B2B Demand ========== */}
      <Section id="b2b" className="bg-zinc-950">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-8">07 — The Surprise</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Other companies want to pay for this.
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-2xl text-zinc-400 mb-12">
              We didn't plan that.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              As we've shown founders and marketing leaders what we built for ourselves, the response has been consistent:
            </p>
          </RevealText>
          
          <RevealText delay={0.25}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-12 glow">
              <p className="text-2xl text-zinc-200 italic leading-relaxed">
                "Let me be one of the first customers the moment this is production-ready. I will pay for it."
              </p>
              <p className="text-zinc-500 mt-4">— Multiple unprompted conversations, last 60 days</p>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-6">Who's already asking:</p>
          </RevealText>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <CompanyCard 
              name="PremiumGoods" 
              description="Sneaker retail institution, Houston" 
              delay={0.35} 
            />
            <CompanyCard 
              name="Copyt" 
              description="Sneaker reseller management platform" 
              delay={0.4} 
            />
            <CompanyCard 
              name="SLAM Magazine" 
              description="One of the most iconic brands in basketball culture" 
              delay={0.45} 
            />
          </div>
          
          <RevealText delay={0.5}>
            <p className="text-xl text-zinc-300 mb-6">
              Three very different companies. <span className="text-amber-500 font-medium">Same reaction. All unprompted.</span>
            </p>
          </RevealText>
          
          <RevealText delay={0.55}>
            <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 pl-6 py-4">
              <p className="text-zinc-300 text-lg">
                <span className="text-white font-medium">What this validates:</span> Our AI OS isn't just internal leverage—it's sellable IP with real demand before we've even tried to sell it.
              </p>
              <p className="text-zinc-400 mt-3">
                We're now considering a part-time BD resource to structure this properly.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 9: Strategic Interest ========== */}
      <Section id="strategic" className="bg-black">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-8">08 — The Shift</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-tight">
              Acquirers and strategic partners are seeing a different company now.
            </h2>
          </RevealText>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <RevealText delay={0.2}>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 h-full">
                <p className="text-zinc-500 uppercase tracking-widest text-xs mb-4">The old perception</p>
                <p className="text-xl text-zinc-500 line-through decoration-zinc-700">
                  "Tradeblock is a niche sneaker marketplace trying to survive a tough market."
                </p>
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 h-full glow">
                <p className="text-amber-500 uppercase tracking-widest text-xs mb-4">The new perception</p>
                <p className="text-xl text-white">
                  "Tradeblock is a capital-efficient, AI-native <span className="text-amber-500">operating system for alternative asset marketplaces</span>—category-agnostic, with defensible IP that other companies already want to license."
                </p>
              </div>
            </RevealText>
          </div>
          
          <RevealText delay={0.35}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
              <p className="text-zinc-400 text-sm mb-3">The infrastructure we've built works for any alternative asset class:</p>
              <div className="flex flex-wrap gap-2">
                {['Sneakers', 'Trading Cards', 'Watches', 'Wine', 'Collectibles', 'Luxury Goods', 'Art'].map((item) => (
                  <span key={item} className="bg-zinc-800/50 text-zinc-300 text-sm px-3 py-1 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.4}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-8">
              <p className="text-amber-500 font-medium mb-4">What's driving the shift:</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-zinc-300">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  The operator foundation—real infrastructure, not wrappers
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  The content and orchestration engine
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  Advanced Analytics already generating subscription revenue
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  TradeblockGPT as product-level differentiation
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  The fact that other companies want to license this—across categories
                </li>
              </ul>
              
              <p className="text-amber-500 font-medium mb-4">What this opens up:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center">
                  <p className="text-zinc-300 text-sm">Strategic investment</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center">
                  <p className="text-zinc-300 text-sm">Partnerships / JVs</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center">
                  <p className="text-zinc-300 text-sm">Acqui-hire interest</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center">
                  <p className="text-zinc-300 text-sm">Full acquisition</p>
                </div>
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.5}>
            <p className="text-2xl text-white font-display font-bold">
              These conversations are warmer than they've been in 18 months.
            </p>
            <p className="text-xl text-zinc-400 mt-4">
              We're not just more interesting. We're more valuable.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 10: Optionality ========== */}
      <Section id="optionality" className="bg-zinc-950">
        <div className="max-w-5xl">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-8">09 — The Math</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              This roadmap created multiple paths to outcome.
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12">
              We now have real optionality that didn't exist 12 months ago:
            </p>
          </RevealText>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <RevealText delay={0.2}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6">
                  <span className="text-amber-500 font-bold text-xl">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Profitability</h3>
                <p className="text-zinc-400">Break-even by April 2026. Clear line of sight, ~$120K net burn to get there.</p>
              </div>
            </RevealText>
            
            <RevealText delay={0.25}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6">
                  <span className="text-amber-500 font-bold text-xl">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">B2B Revenue</h3>
                <p className="text-zinc-400">License the AI OS to other companies. Demand already exists. New revenue line we hadn't modeled.</p>
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6">
                  <span className="text-amber-500 font-bold text-xl">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Strategic Exit</h3>
                <p className="text-zinc-400">Acquisition interest is warming. We're now "AI-native OS for alternative assets," not "struggling marketplace."</p>
              </div>
            </RevealText>
            
            <RevealText delay={0.35}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6">
                  <span className="text-amber-500 font-bold text-xl">4</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Accelerated Growth</h3>
                <p className="text-zinc-400">With leverage in place, incremental investment goes further than it ever has.</p>
              </div>
            </RevealText>
          </div>
          
          <RevealText delay={0.4}>
            <p className="text-2xl text-zinc-300 text-center">
              Each path increases expected value. <span className="text-amber-500 font-medium">Investors love optionality—we now have it in spades.</span>
            </p>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 11: Opportunity ========== */}
      <Section id="opportunity" className="bg-black">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-8">10 — The Opportunity</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              $500K to lean into what's working.
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-xl text-zinc-400 mb-12">
              Break-even requires ~$120K. We're raising $500K because this is the moment to <span className="text-white">invest</span>, not just survive.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-8">
              <p className="text-amber-500 uppercase tracking-widest text-sm mb-6">Where the capital goes</p>
              
              <div className="space-y-6">
                <div className="pb-6 border-b border-zinc-800">
                  <p className="text-white font-medium text-lg mb-2">TradeblockGPT rollout</p>
                  <p className="text-zinc-400">Accelerate the product that creates retention and differentiation</p>
                </div>
                
                <div className="pb-6 border-b border-zinc-800">
                  <p className="text-white font-medium text-lg mb-2">B2B structuring</p>
                  <p className="text-zinc-400">Lightweight BD resource to convert inbound interest into revenue</p>
                </div>
                
                <div className="pb-6 border-b border-zinc-800">
                  <p className="text-white font-medium text-lg mb-2">Engineering leverage</p>
                  <p className="text-zinc-400">Add low-cost talent we can level up fast. Our agentic coding workflow means junior devs execute against specs with AI-assisted guardrails. Engineering hiring is now a leverage play, not a risk.</p>
                </div>
                
                <div>
                  <p className="text-white font-medium text-lg mb-2">Runway + flexibility</p>
                  <p className="text-zinc-400">Capital to move aggressively when opportunities emerge—not just survive to break-even</p>
                </div>
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 pl-6 py-4">
              <p className="text-xl text-zinc-300">
                <span className="text-white font-medium">Why the math works:</span> We've cut monthly burn by 83% (from $140K to $24K) while <em>increasing</em> capabilities. Every dollar now goes further than it ever has.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 12: The Ask ========== */}
      <Section id="ask" className="bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-3xl text-center mx-auto relative z-10">
          <RevealText>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
              You've already bet on us.
            </h2>
          </RevealText>
          
          <RevealText delay={0.1}>
            <p className="text-xl md:text-2xl text-zinc-400 mb-12">
              This is the moment to double down.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="inline-block bg-zinc-900 border border-amber-500/50 rounded-2xl px-12 py-8 glow-strong mb-12">
              <p className="text-amber-500 uppercase tracking-widest text-sm mb-2">Internal Round</p>
              <p className="text-5xl md:text-6xl font-display font-bold text-white">$500K</p>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="space-y-4 text-xl text-zinc-400 mb-12">
              <p>The leverage is built.</p>
              <p>The optionality is real.</p>
              <p className="text-white font-medium">The check size is small relative to the upside.</p>
            </div>
          </RevealText>
          
          <RevealText delay={0.4}>
            <p className="text-2xl md:text-3xl text-white font-display font-bold">
              We turned constraints into a weapon.<br />
              <span className="text-amber-500">Now we're ready to use it.</span>
            </p>
          </RevealText>
          
          <RevealText delay={0.5}>
            <div className="mt-16 pt-8 border-t border-zinc-800">
              <p className="text-zinc-400 mb-2">
                Mbiyimoh Ghogomu
              </p>
              <p className="text-zinc-500 text-sm">
                beems@tradeblock.us
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ========== SLIDE 13: PS — Live Demo CTA ========== */}
      <Section id="demo" className="bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-2xl text-center mx-auto relative z-10">
          <RevealText>
            <p className="text-amber-500 uppercase tracking-widest text-sm mb-8">P.S.</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Want to see it live?
            </h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <p className="text-xl text-zinc-400 mb-4">
              Join me for a live demo and conversation.
            </p>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 mb-8 inline-block">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white font-display text-2xl font-bold">Friday, December 5th</p>
              </div>
              <p className="text-zinc-400 mb-6">I'll walk through the AI engine, show TradeblockGPT in action, and answer any questions.</p>
              
              <a
                href="REPLACE_WITH_CALENDAR_LINK"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                </svg>
                Add to Calendar
              </a>
            </div>
          </RevealText>
          
          <RevealText delay={0.4}>
            <p className="text-zinc-500 text-sm">
              Can't make it? Reply to this and we'll find a time.
            </p>
          </RevealText>
        </div>
      </Section>
    </div>
  );
}
