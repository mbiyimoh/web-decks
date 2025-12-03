import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

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
      className={`min-h-screen flex flex-col justify-center px-5 md:px-12 py-12 ${className}`}
    >
      {children}
    </motion.section>
  );
};

const RevealText = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const DemoPlaceholder = ({ title, duration, description }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6 }}
      className="rounded-xl border border-zinc-700 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)' }}
    >
      <div className="aspect-video flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
          <svg className="w-6 h-6" fill="#f59e0b" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{duration}</p>
        <p className="text-white font-medium text-sm mb-1">{title}</p>
        <p className="text-zinc-500 text-xs text-center max-w-xs">{description}</p>
      </div>
    </motion.div>
  );
};

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return <motion.div className="fixed top-0 left-0 right-0 h-1 origin-left z-50" style={{ scaleX, background: '#f59e0b' }} />;
};

const PhaseStatus = ({ status }) => {
  const config = {
    completed: { icon: '✓', text: 'Completed', bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', color: '#34d399' },
    'rolling-out': { icon: '◐', text: 'Rolling Out', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', color: '#fbbf24' },
    beta: { icon: '○', text: 'In Beta', bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.5)', color: '#60a5fa' },
    live: { icon: '●', text: 'Live Now', bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.5)', color: '#c084fc' },
  };
  const { icon, text, bg, border, color } = config[status];
  
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ background: bg, borderColor: border, color }}>
      <span>{icon}</span>
      <span>{text}</span>
    </span>
  );
};

const Roadmap = () => {
  const phases = [
    { num: 1, title: 'Operator Essentials', status: 'completed', color: '#10b981' },
    { num: 2, title: 'Marketing & Comms', status: 'rolling-out', color: '#f59e0b' },
    { num: 3, title: 'TradeblockGPT', status: 'beta', color: '#3b82f6' },
  ];
  const icons = { completed: '✓', 'rolling-out': '◐', beta: '○' };
  
  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-0 md:items-center">
      {phases.map((phase, i) => (
        <React.Fragment key={phase.num}>
          <div className="flex-1 rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: phase.color, boxShadow: `0 0 12px ${phase.color}40` }}>
                {icons[phase.status]}
              </div>
              <span className="text-zinc-500 text-xs">Phase {phase.num}</span>
            </div>
            <p className="text-white font-medium text-sm">{phase.title}</p>
          </div>
          {i < phases.length - 1 && <div className="hidden md:block w-6 h-0.5 bg-zinc-700 mx-1" />}
        </React.Fragment>
      ))}
    </div>
  );
};

const AnalyticsCard = ({ title, value, subtitle, color = 'zinc' }) => {
  const colorMap = {
    zinc: { bg: 'rgba(24, 24, 27, 0.5)', border: 'rgba(63, 63, 70, 0.5)' },
    green: { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.3)' },
    yellow: { bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.3)' },
  };
  const { bg, border } = colorMap[color];
  
  return (
    <div className="rounded-lg p-3 border" style={{ background: bg, borderColor: border }}>
      <p className="text-zinc-400 text-xs mb-0.5">{title}</p>
      <p className="text-white text-lg font-bold">{value}</p>
      <p className="text-zinc-500 text-xs">{subtitle}</p>
    </div>
  );
};

export default function TradeblockDeckV4() {
  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ProgressBar />

      {/* SLIDE 1: Title */}
      <Section id="title" className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #18181b 0%, #000 50%, #18181b 100%)' }} />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.15)' }} />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: '#f59e0b' }}>Investor Update • November 2025</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className="text-white">TRADEBLOCK:</span>
              <br />
              <span style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>THE AI INFLECTION</span>
            </h1>
          </RevealText>
          
          <RevealText delay={0.2}>
            <p className="text-base md:text-lg text-zinc-400 max-w-md leading-relaxed">
              How constraints created a weapon—and what it means for the next 12 months.
            </p>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">MG</div>
              <div>
                <p className="text-white font-medium text-sm">Mbiyimoh Ghogomu</p>
                <p className="text-zinc-500 text-xs">Founder & CEO</p>
              </div>
            </div>
          </RevealText>
        </div>
        
        <RevealText delay={0.4} className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </RevealText>
      </Section>

      {/* SLIDE 2: The Question */}
      <Section id="question" style={{ background: '#09090b' }}>
        <div className="max-w-3xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: '#f59e0b' }}>01 — The Question</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              When we cut headcount to the bone, I lost all the people who helped me fetch data, generate reports, run campaigns, and understand the business.
            </p>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm text-zinc-400 mb-6">I was left with a strategic question:</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="rounded-xl p-5 mb-8 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)', boxShadow: '0 0 40px rgba(245, 158, 11, 0.1)' }}>
              <p className="text-lg md:text-xl text-white font-bold leading-relaxed">
                "How do we use AI to go from a skeleton crew to operating like a 25-person team—<span style={{ color: '#f59e0b' }}>without all that headcount spend?</span>"
              </p>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-sm text-zinc-400 mb-4">After months of experimentation, I arrived at a three-phase AI roadmap:</p>
          </RevealText>
          
          <RevealText delay={0.35}>
            <Roadmap />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 3: Phase 1 — Operator Essentials */}
      <Section id="phase1" className="bg-black">
        <div className="max-w-3xl">
          <RevealText>
            <div className="flex items-center gap-3 mb-6">
              <p className="uppercase tracking-widest text-xs" style={{ color: '#f59e0b' }}>02 — Phase 1</p>
              <PhaseStatus status="completed" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">Operator Essentials</h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm text-zinc-400 mb-6">I rebuilt the back office with AI. When we cut headcount, we lost the people who helped me understand the business. So I taught agents to do it instead.</p>
          </RevealText>
          
          <div className="space-y-4 mb-6">
            <RevealText delay={0.2}>
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-white font-medium text-sm mb-1">SQL Intelligence Agent</p>
                <p className="text-zinc-400 text-xs">Taught to understand our weird barter-centric data model. I ask questions in plain English, get SQL queries that work. No more waiting on analysts.</p>
              </div>
            </RevealText>
            
            <RevealText delay={0.25}>
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-white font-medium text-sm mb-1">Virtual CFO</p>
                <p className="text-zinc-400 text-xs">Transaction classification, month-end close, dynamic projections, scenario exploration—all conversational.</p>
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-white font-medium text-sm mb-2">Data Connection Agents</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Core SQL', 'Stripe', 'UPS/Shippo', 'Mailjet', 'Posthog', 'Firebase'].map((s) => (
                    <div key={s} className="rounded px-2 py-1 text-center" style={{ background: 'rgba(39, 39, 42, 0.5)' }}>
                      <p className="text-zinc-300 text-xs">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealText>
          </div>
          
          <RevealText delay={0.35}>
            <div className="pl-3 py-2" style={{ borderLeft: '2px solid #10b981', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)' }}>
              <p className="text-zinc-300 text-sm"><span className="text-white font-medium">Punchline:</span> Everything we paid analysts, finance, and ops for—automated. This is the foundation.</p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 4: Phase 2 — Marketing & Comms */}
      <Section id="phase2" style={{ background: '#09090b' }}>
        <div className="max-w-3xl">
          <RevealText>
            <div className="flex items-center gap-3 mb-6">
              <p className="uppercase tracking-widest text-xs" style={{ color: '#f59e0b' }}>03 — Phase 2</p>
              <PhaseStatus status="rolling-out" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">Marketing, Comms & Engagement</h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm text-zinc-400 mb-6">How do we 10x our marketing output without hiring a marketing team?</p>
          </RevealText>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <RevealText delay={0.2}>
              <div className="space-y-4">
                {[
                  { num: '1', title: 'Define a "recipe" once', desc: 'Sneaker release, giveaway, product update' },
                  { num: '2', title: 'System generates all assets', desc: 'Email, push, social, blog—calibrated to voice' },
                  { num: '3', title: 'One operator reviews & deploys', desc: 'More time on strategy, less on execution' },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
                      <span style={{ color: '#f59e0b' }} className="font-bold text-xs">{item.num}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-0.5">{item.title}</p>
                      <p className="text-zinc-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <DemoPlaceholder title="Campaign Engine Demo" duration="15-20 sec" description="Recipe → AI generation → Multi-channel deploy" />
            </RevealText>
          </div>
          
          <RevealText delay={0.35}>
            <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-lg text-white font-bold mb-1">8 hours → 45 minutes.</p>
              <p className="text-zinc-400 text-xs">And the output is better, not just faster. Not ChatGPT wrappers—a system that understands the business.</p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 5: Phase 2 Results */}
      <Section id="phase2-results" className="bg-black">
        <div className="max-w-3xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: '#f59e0b' }}>04 — Phase 2 Results</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">Every dormant channel is now active.</h2>
          </RevealText>
          
          <div className="space-y-2 mb-6">
            {[
              { channel: 'Email', before: 'Sporadic', after: '3x volume, 2-9% CTR' },
              { channel: 'Push', before: 'Basic alerts', after: '3-layer system' },
              { channel: 'Blog', before: 'Dead', after: 'Weekly, SEO-optimized' },
              { channel: 'Social', before: 'Inconsistent', after: 'Daily, culturally native' },
            ].map((item, i) => (
              <RevealText key={item.channel} delay={0.15 + i * 0.05}>
                <div className="grid grid-cols-3 gap-2 items-center rounded-lg p-3 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                  <p className="text-white font-medium text-sm">{item.channel}</p>
                  <p className="text-zinc-500 text-xs line-through">{item.before}</p>
                  <p className="text-xs font-medium" style={{ color: '#f59e0b' }}>{item.after}</p>
                </div>
              </RevealText>
            ))}
          </div>
          
          <RevealText delay={0.4}>
            <div className="rounded-xl p-5 text-center border border-zinc-800" style={{ background: '#18181b', boxShadow: '0 0 40px rgba(245, 158, 11, 0.1)' }}>
              <p className="text-base text-white font-bold mb-1">The punchline:</p>
              <p className="text-zinc-300 text-sm">One sneaker culture SME—<span style={{ color: '#f59e0b' }}>not a marketer</span>—runs our entire comms operation.</p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 6: Phase 3 — TradeblockGPT */}
      <Section id="phase3" style={{ background: '#09090b' }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(59, 130, 246, 0.3)' }} />
        </div>
        
        <div className="max-w-3xl relative z-10">
          <RevealText>
            <div className="flex items-center gap-3 mb-6">
              <p className="uppercase tracking-widest text-xs" style={{ color: '#f59e0b' }}>05 — Phase 3</p>
              <PhaseStatus status="beta" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">TradeblockGPT</h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm text-zinc-400 mb-6">AI becomes the product. A trading intelligence that learns your style, closet, wishlist—and makes you better at trading.</p>
          </RevealText>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <RevealText delay={0.2}>
              <div className="space-y-3">
                {[
                  { label: 'Onboards you', text: '"Let\'s dial in what you\'re looking for."' },
                  { label: 'Surfaces opportunities', text: '"There\'s a Travis Scott Olive you\'ve been sleeping on..."' },
                  { label: 'Suggests trades', text: 'Trades that fit your taste, goals, vibe.' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg p-3 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-white text-sm italic">{item.text}</p>
                  </div>
                ))}
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <DemoPlaceholder title="TradeblockGPT Demo" duration="20-30 sec" description="Personalized trade recommendations" />
            </RevealText>
          </div>
          
          <RevealText delay={0.35}>
            <div className="grid grid-cols-3 gap-2">
              {['Retention Engine', 'Differentiation', 'Data Moat'].map((item) => (
                <div key={item} className="rounded-lg p-3 text-center border" style={{ background: 'rgba(24, 24, 27, 0.5)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                  <p className="font-bold text-xs" style={{ color: '#60a5fa' }}>{item}</p>
                </div>
              ))}
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 7: Advanced Analytics — The Byproduct */}
      <Section id="analytics" className="bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-0 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(168, 85, 247, 0.3)' }} />
        </div>
        
        <div className="max-w-3xl relative z-10">
          <RevealText>
            <div className="flex items-center gap-3 mb-6">
              <p className="uppercase tracking-widest text-xs" style={{ color: '#f59e0b' }}>06 — The Byproduct</p>
              <PhaseStatus status="live" />
            </div>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">Oh, and we already have a product to sell.</h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm text-zinc-400 mb-6">
              Building TradeblockGPT gave us something we didn't expect: <span className="text-white">Advanced Analytics</span>—a subscription product we can monetize right now, at near-zero marginal cost.
            </p>
          </RevealText>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <RevealText delay={0.2}>
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(24, 24, 27, 0.7)', borderColor: 'rgba(168, 85, 247, 0.2)', boxShadow: '0 0 40px rgba(168, 85, 247, 0.1)' }}>
                <p className="text-xs font-medium mb-3" style={{ color: '#c084fc' }}>Per-Shoe Intelligence</p>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <AnalyticsCard title="Desirability" value="2.3x" subtitle="High demand" color="green" />
                  <AnalyticsCard title="Success Rate" value="46.3%" subtitle="73% for 1:1" color="green" />
                  <AnalyticsCard title="Tradeability" value="62/100" subtitle="Good demand" color="yellow" />
                  <AnalyticsCard title="Momentum" value="+6.9%" subtitle="Growing" color="green" />
                </div>
                
                <div className="rounded-lg p-2 mb-2" style={{ background: 'rgba(39, 39, 42, 0.5)' }}>
                  <p className="text-zinc-400 text-xs mb-1">Optimal Trade Partners</p>
                  <div className="flex flex-wrap gap-1">
                    {['thefaculty', 'clc', 'SpaceWizard'].map((name) => (
                      <span key={name} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
                        {name} • 90%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </RevealText>
            
            <RevealText delay={0.3}>
              <div className="space-y-4">
                <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                  <p className="text-white font-medium text-sm mb-2">What subscribers unlock:</p>
                  <ul className="space-y-1.5 text-zinc-400 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full mt-1.5" style={{ background: '#c084fc' }}></span>
                      Per-shoe market intelligence
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full mt-1.5" style={{ background: '#c084fc' }}></span>
                      Optimal trade partners
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full mt-1.5" style={{ background: '#c084fc' }}></span>
                      Fair value benchmarks
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full mt-1.5" style={{ background: '#c084fc' }}></span>
                      Friction analysis
                    </li>
                  </ul>
                </div>
                
                <div className="pl-3 py-2" style={{ borderLeft: '2px solid #c084fc', background: 'linear-gradient(to right, rgba(168, 85, 247, 0.1), transparent)' }}>
                  <p className="text-zinc-300 text-xs"><span className="text-white font-medium">Economics:</span> Subscription revenue, near-zero marginal cost.</p>
                </div>
              </div>
            </RevealText>
          </div>
          
          <RevealText delay={0.4}>
            <div className="rounded-lg p-4 text-center border border-zinc-800" style={{ background: '#18181b' }}>
              <p className="text-zinc-300 text-sm">The GPT work gave us a monetizable product <span className="font-medium" style={{ color: '#c084fc' }}>as a byproduct</span>.</p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 8: B2B Demand */}
      <Section id="b2b" style={{ background: '#09090b' }}>
        <div className="max-w-2xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: '#f59e0b' }}>07 — The Surprise</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">Other companies want to pay for this.</h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-base text-zinc-400 mb-6">We didn't plan that.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="rounded-xl p-5 mb-6 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)', boxShadow: '0 0 40px rgba(245, 158, 11, 0.1)' }}>
              <p className="text-base text-zinc-200 italic">"Let me be one of the first customers the moment this is production-ready."</p>
              <p className="text-zinc-500 mt-2 text-xs">— Multiple unprompted conversations</p>
            </div>
          </RevealText>
          
          <RevealText delay={0.25}>
            <p className="text-zinc-400 uppercase tracking-widest text-xs mb-3">Who's asking:</p>
          </RevealText>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { name: 'PremiumGoods', desc: 'Sneaker retail' },
              { name: 'Copyt', desc: 'Reseller platform' },
              { name: 'SLAM', desc: 'Basketball culture' },
            ].map((item, i) => (
              <RevealText key={item.name} delay={0.3 + i * 0.05}>
                <div className="rounded-lg p-3 text-center border border-zinc-800" style={{ background: '#18181b' }}>
                  <p className="text-sm font-bold text-white mb-0.5">{item.name}</p>
                  <p className="text-zinc-500 text-xs">{item.desc}</p>
                </div>
              </RevealText>
            ))}
          </div>
          
          <RevealText delay={0.45}>
            <div className="pl-3 py-2" style={{ borderLeft: '2px solid #f59e0b', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)' }}>
              <p className="text-zinc-300 text-sm">Our AI OS isn't just internal leverage—it's <span className="text-white font-medium">sellable IP</span> with real demand.</p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 9: Strategic Interest */}
      <Section id="strategic" className="bg-black">
        <div className="max-w-2xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: '#f59e0b' }}>08 — The Shift</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">Acquirers are seeing a different company.</h2>
          </RevealText>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <RevealText delay={0.2}>
              <div className="rounded-lg p-4 h-full border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                <p className="text-zinc-500 uppercase tracking-widest text-xs mb-2">Before</p>
                <p className="text-sm text-zinc-500 line-through">"Niche marketplace trying to survive"</p>
              </div>
            </RevealText>
            
            <RevealText delay={0.25}>
              <div className="rounded-lg p-4 h-full border" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <p className="uppercase tracking-widest text-xs mb-2" style={{ color: '#f59e0b' }}>Now</p>
                <p className="text-sm text-white">"AI-native <span style={{ color: '#f59e0b' }}>operating system for alternative assets</span>—category-agnostic"</p>
              </div>
            </RevealText>
          </div>
          
          <RevealText delay={0.3}>
            <div className="rounded-lg p-3 border border-zinc-800 mb-4" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-zinc-400 text-xs mb-2">Works for any alternative asset class:</p>
              <div className="flex flex-wrap gap-1">
                {['Sneakers', 'Trading Cards', 'Watches', 'Wine', 'Collectibles', 'Art'].map((item) => (
                  <span key={item} className="text-zinc-300 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(39, 39, 42, 0.5)' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.35}>
            <div className="rounded-lg p-4 border border-zinc-800 mb-4" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-xs mb-2" style={{ color: '#f59e0b' }}>This opens up:</p>
              <div className="grid grid-cols-2 gap-2">
                {['Strategic investment', 'Partnerships', 'Acqui-hire', 'Full acquisition'].map((item) => (
                  <div key={item} className="rounded px-2 py-1.5 text-center" style={{ background: 'rgba(39, 39, 42, 0.5)' }}>
                    <p className="text-zinc-300 text-xs">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.4}>
            <p className="text-base text-white font-bold">These conversations are warmer than they've been in 18 months.</p>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 10: Optionality */}
      <Section id="optionality" style={{ background: '#09090b' }}>
        <div className="max-w-3xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: '#f59e0b' }}>09 — The Math</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">Multiple paths to outcome.</h2>
          </RevealText>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { num: '1', title: 'Profitability', desc: 'Break-even by April 2026. ~$120K to get there.' },
              { num: '2', title: 'B2B Revenue', desc: 'License the AI OS. Demand exists.' },
              { num: '3', title: 'Strategic Exit', desc: 'Acquisition interest warming.' },
              { num: '4', title: 'Growth', desc: 'Every dollar goes further now.' },
            ].map((item, i) => (
              <RevealText key={item.num} delay={0.15 + i * 0.05}>
                <div className="rounded-lg p-4 h-full border border-zinc-800" style={{ background: '#18181b' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
                    <span style={{ color: '#f59e0b' }} className="font-bold text-sm">{item.num}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-zinc-400 text-xs">{item.desc}</p>
                </div>
              </RevealText>
            ))}
          </div>
          
          <RevealText delay={0.35}>
            <p className="text-sm text-zinc-300 mt-6 text-center">Each path increases expected value. <span style={{ color: '#f59e0b' }} className="font-medium">Optionality in spades.</span></p>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 11: Opportunity */}
      <Section id="opportunity" className="bg-black">
        <div className="max-w-2xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: '#f59e0b' }}>10 — The Opportunity</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">$500K to lean into what's working.</h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm text-zinc-400 mb-6">Break-even requires ~$120K. We're raising $500K to <span className="text-white">invest</span>, not just survive.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="rounded-xl p-5 mb-6 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#f59e0b' }}>Where the capital goes</p>
              
              <div className="space-y-4">
                {[
                  { title: 'TradeblockGPT rollout', desc: 'Accelerate retention & differentiation' },
                  { title: 'B2B structuring', desc: 'BD resource for inbound interest' },
                  { title: 'Engineering leverage', desc: 'Low-cost talent with AI-assisted guardrails' },
                  { title: 'Runway + flexibility', desc: 'Move aggressively on opportunities' },
                ].map((item, i) => (
                  <div key={item.title} className={i < 3 ? 'pb-4 border-b border-zinc-800' : ''}>
                    <p className="text-white font-medium text-sm mb-0.5">{item.title}</p>
                    <p className="text-zinc-400 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="pl-3 py-2" style={{ borderLeft: '2px solid #f59e0b', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)' }}>
              <p className="text-zinc-300 text-sm"><span className="text-white font-medium">83% burn reduction</span> while increasing capabilities. Every dollar goes further.</p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 12: The Ask */}
      <Section id="ask" style={{ background: '#09090b' }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-32 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.2)' }} />
        </div>
        
        <div className="max-w-xl text-center mx-auto relative z-10">
          <RevealText>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 leading-tight">You've already bet on us.</h2>
          </RevealText>
          
          <RevealText delay={0.1}>
            <p className="text-base text-zinc-400 mb-6">This is the moment to double down.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <div className="inline-block rounded-xl px-8 py-5 mb-6 border" style={{ background: '#18181b', borderColor: 'rgba(245, 158, 11, 0.5)', boxShadow: '0 0 60px rgba(245, 158, 11, 0.15)' }}>
              <p className="uppercase tracking-widest text-xs mb-1" style={{ color: '#f59e0b' }}>Internal Round</p>
              <p className="text-3xl md:text-4xl font-bold text-white">$500K</p>
            </div>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="space-y-2 text-sm text-zinc-400 mb-6">
              <p>The leverage is built.</p>
              <p>The optionality is real.</p>
              <p className="text-white font-medium">Small check. Big upside.</p>
            </div>
          </RevealText>
          
          <RevealText delay={0.4}>
            <p className="text-lg text-white font-bold">
              We turned constraints into a weapon.<br />
              <span style={{ color: '#f59e0b' }}>Now we're ready to use it.</span>
            </p>
          </RevealText>
          
          <RevealText delay={0.5}>
            <div className="mt-10 pt-6 border-t border-zinc-800">
              <p className="text-zinc-400 text-sm">Mbiyimoh Ghogomu</p>
              <p className="text-zinc-500 text-xs">beems@tradeblock.us</p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 13: PS — Live Demo */}
      <Section id="demo" className="bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.08)' }} />
        </div>
        
        <div className="max-w-lg text-center mx-auto relative z-10">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: '#f59e0b' }}>P.S.</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">Want to see it live?</h2>
          </RevealText>
          
          <RevealText delay={0.2}>
            <p className="text-base text-zinc-400 mb-6">Join me for a live demo and conversation.</p>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="rounded-xl p-6 mb-6 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.8)' }}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white font-bold text-lg">Friday, December 5th</p>
              </div>
              <p className="text-zinc-400 text-sm mb-5">I'll walk through the AI engine, show TradeblockGPT in action, and answer questions.</p>
              
              <a
                href="REPLACE_WITH_CALENDAR_LINK"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: '#f59e0b', color: '#000' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                </svg>
                Add to Calendar
              </a>
            </div>
          </RevealText>
          
          <RevealText delay={0.4}>
            <p className="text-zinc-500 text-xs">Can't make it? Reply and we'll find a time.</p>
          </RevealText>
        </div>
      </Section>
    </div>
  );
}
