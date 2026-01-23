'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// ============================================
// SHARED COMPONENTS (same as AI Inflection deck)
// ============================================

const Section = ({ children, className = '', id, style = {} }: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) => {
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
      style={style}
    >
      {children}
    </motion.section>
  );
};

const RevealText = ({ children, delay = 0, className = '' }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
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

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 origin-left z-50"
      style={{ scaleX, background: '#f59e0b' }}
    />
  );
};

const NavDots = ({ sections, activeSection }: {
  sections: Array<{ id: string; label: string }>;
  activeSection: string;
}) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-3">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="group flex items-center gap-3"
        >
          <span className={`text-xs whitespace-nowrap transition-opacity ${
            activeSection === section.id ? 'opacity-100 text-amber-400' : 'opacity-0 group-hover:opacity-100 text-zinc-500'
          }`}>
            {section.label}
          </span>
          <div
            className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
              activeSection === section.id
                ? 'bg-amber-400 scale-125'
                : 'bg-zinc-700 hover:bg-zinc-500'
            }`}
          />
        </a>
      ))}
    </div>
  );
};

const StatCard = ({ value, label, sublabel, delay = 0 }: {
  value: string;
  label: string;
  sublabel?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl p-5 border border-zinc-800"
      style={{ background: 'rgba(24, 24, 27, 0.5)' }}
    >
      <p className="text-3xl font-bold mb-1" style={{ color: '#f59e0b' }}>{value}</p>
      <p className="text-zinc-300 text-sm font-medium">{label}</p>
      {sublabel && <p className="text-zinc-500 text-xs mt-1">{sublabel}</p>}
    </motion.div>
  );
};

// ============================================
// NEW COMPONENTS FOR THIS DECK
// ============================================

const MissionCard = ({ number, title, description, status, delay = 0 }: {
  number: string;
  title: string;
  description: string;
  status: 'in-progress' | 'preparing' | 'development';
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  const statusColors = {
    'in-progress': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    'preparing': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    'development': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  };

  const colors = statusColors[status] || statusColors['in-progress'];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-colors"
      style={{ background: 'rgba(24, 24, 27, 0.5)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <span className="text-amber-400 font-bold">{number}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
          {status === 'in-progress' && 'In Progress'}
          {status === 'preparing' && 'Preparing'}
          {status === 'development' && 'In Development'}
        </span>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

const ChannelBadge = ({ icon, name, frequency }: {
  icon: string;
  name: string;
  frequency: string;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
    <span className="text-xl">{icon}</span>
    <div>
      <p className="text-white text-sm font-medium">{name}</p>
      <p className="text-zinc-500 text-xs">{frequency}</p>
    </div>
  </div>
);

const IntentTier = ({ number, title, description }: {
  number: string;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-amber-400 text-xs font-bold">{number}</span>
    </div>
    <div>
      <p className="text-white font-medium text-sm">{title}</p>
      <p className="text-zinc-500 text-xs">{description}</p>
    </div>
  </div>
);

const CorrelationChart = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  // Weekly transaction data (approximate from the chart: Oct 26 - Jan 18)
  const weeklyData = [
    { week: 'Oct 26', transactions: 195, push: 0, email: 0, phase: 'baseline' },
    { week: 'Nov 2', transactions: 188, push: 0, email: 0, phase: 'baseline' },
    { week: 'Nov 9', transactions: 175, push: 0, email: 0, phase: 'baseline' },
    { week: 'Nov 16', transactions: 182, push: 0, email: 0, phase: 'baseline' },
    { week: 'Nov 23', transactions: 198, push: 2, email: 0, phase: 'baseline' },
    { week: 'Nov 30', transactions: 215, push: 4, email: 0, phase: 'ramp' },
    { week: 'Dec 7', transactions: 238, push: 8, email: 0, phase: 'ramp' },
    { week: 'Dec 14', transactions: 252, push: 15, email: 0, phase: 'ramp' },
    { week: 'Dec 21', transactions: 245, push: 18, email: 0, phase: 'active' },
    { week: 'Dec 28', transactions: 225, push: 12, email: 0, phase: 'active' },
    { week: 'Jan 4', transactions: 285, push: 22, email: 8, phase: 'active' },
    { week: 'Jan 11', transactions: 320, push: 28, email: 12, phase: 'active' },
    { week: 'Jan 18', transactions: 295, push: 24, email: 10, phase: 'active' },
  ];

  const maxTransactions = 340;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6 }}
      className="rounded-xl border border-zinc-800 p-6"
      style={{ background: 'rgba(24, 24, 27, 0.5)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-white font-medium">90-Day View: Comms Ramp → Transaction Lift</p>
          <p className="text-zinc-500 text-xs">Weekly transactions with campaign activity timeline</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-blue-400" />
          <span className="text-zinc-400">Transactions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-zinc-400">Push campaigns</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-400">Email campaigns</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 w-8 flex flex-col justify-between text-xs text-zinc-600">
          <span>340</span>
          <span>255</span>
          <span>170</span>
          <span>85</span>
          <span>0</span>
        </div>

        {/* Transaction bars area */}
        <div className="ml-10 h-64 flex items-end gap-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-t border-zinc-800/50 w-full" />
            ))}
          </div>

          {/* Bars */}
          {weeklyData.map((d, i) => {
            const barHeight = (d.transactions / maxTransactions) * 100;

            return (
              <div key={i} className="flex-1 flex flex-col items-center relative z-10 h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={isInView ? { height: `${barHeight}%` } : { height: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className={`w-full rounded-t ${
                    d.phase === 'baseline'
                      ? 'bg-gradient-to-t from-blue-700/50 to-blue-500/50'
                      : d.phase === 'ramp'
                      ? 'bg-gradient-to-t from-blue-600/80 to-blue-400/80'
                      : 'bg-gradient-to-t from-blue-500 to-cyan-400'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Comms activity section - below the bars */}
        <div className="ml-10 mt-3 border-t border-zinc-800 pt-3">
          {/* Push row */}
          <div className="flex items-center gap-1 mb-2">
            <div className="w-0 flex-shrink-0" />
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex justify-center">
                {d.push > 0 ? (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 + 0.5 }}
                    className="rounded-full bg-amber-500"
                    style={{
                      width: `${Math.max(6, Math.min(14, d.push / 2))}px`,
                      height: `${Math.max(6, Math.min(14, d.push / 2))}px`,
                    }}
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                )}
              </div>
            ))}
          </div>

          {/* Email row */}
          <div className="flex items-center gap-1">
            <div className="w-0 flex-shrink-0" />
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex justify-center">
                {d.email > 0 ? (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 + 0.6 }}
                    className="rounded-full bg-emerald-400"
                    style={{
                      width: `${Math.max(6, Math.min(14, d.email))}px`,
                      height: `${Math.max(6, Math.min(14, d.email))}px`,
                    }}
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                )}
              </div>
            ))}
          </div>

          {/* Row labels */}
          <div className="absolute left-0 mt-[-38px] text-xs text-zinc-600">
            <div className="h-5 flex items-center">Push</div>
            <div className="h-5 flex items-center">Email</div>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-10 flex justify-between text-xs text-zinc-600 mt-3 pt-2 border-t border-zinc-800">
          <span>Oct 26</span>
          <span>Nov 16</span>
          <span>Dec 7</span>
          <span>Dec 28</span>
          <span>Jan 18</span>
        </div>
      </div>

      {/* Insight callout */}
      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-zinc-500 text-xs">Oct-Nov avg</p>
            <p className="text-zinc-400 font-medium">~190/wk</p>
          </div>
          <div className="text-zinc-600">→</div>
          <div className="text-center">
            <p className="text-zinc-500 text-xs">Jan avg</p>
            <p className="text-white font-bold">~300/wk</p>
          </div>
          <div className="text-emerald-400 font-medium ml-2">+58%</div>
        </div>
        <div className="flex-1 text-right">
          <p className="text-zinc-400 text-sm italic">
            Comms volume up → transactions follow
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function TradeblockJan2026Projections() {
  const [activeSection, setActiveSection] = useState('title');

  const sections = [
    { id: 'title', label: 'Title' },
    { id: 'momentum', label: 'Momentum' },
    { id: 'correlation', label: 'Correlation' },
    { id: 'sprint', label: '120-Day Sprint' },
    { id: 'mission1', label: 'Mission 1' },
    { id: 'mission2', label: 'Mission 2' },
    { id: 'mission3', label: 'Mission 3' },
    { id: 'outcomes', label: 'Trajectory' },
    { id: 'raise', label: 'The Raise' },
    { id: 'close', label: 'Close' },
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
      `}</style>

      <ProgressBar />
      <NavDots sections={sections} activeSection={activeSection} />

      {/* ==================== SLIDE 1: Title ==================== */}
      <Section id="title" className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #18181b 0%, #000 50%, #18181b 100%)' }} />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.15)' }} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: '#f59e0b' }}>
              Investor Update &bull; January 2026
            </p>
          </RevealText>

          <RevealText delay={0.1}>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-white">THE</span>{' '}
              <span className="text-gradient">120-DAY SPRINT</span>
            </h1>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed">
              From leverage to lift-off—here&apos;s what&apos;s happening now and where it&apos;s headed.
            </p>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800 max-w-[100px]" />
              <span className="text-zinc-600 text-sm">Scroll to continue</span>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-zinc-600"
              >
                ↓
              </motion.div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 2: Momentum ==================== */}
      <Section id="momentum" className="relative">
        <div className="max-w-3xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">The Update</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              We showed you the leverage.{' '}
              <span className="text-gradient">Now it&apos;s working.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-zinc-400 text-lg mb-8">
              Transactions are climbing. Comms are driving action. The playbook we built is delivering results.
            </p>
          </RevealText>

          {/* Transaction Momentum */}
          <RevealText delay={0.25}>
            <div className="rounded-xl border border-amber-500/30 p-5 mb-6" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <p className="text-amber-400 text-xs uppercase tracking-widest mb-1">Transaction Momentum</p>
              <p className="text-zinc-500 text-xs mb-4">Validated transactions per month</p>
              <div className="flex items-center justify-center gap-4 md:gap-8">
                <div className="text-center">
                  <p className="text-zinc-500 text-xs mb-1">Nov</p>
                  <p className="text-2xl font-bold text-zinc-400">927</p>
                </div>
                <div className="text-zinc-600 text-xl">→</div>
                <div className="text-center">
                  <p className="text-zinc-500 text-xs mb-1">Dec</p>
                  <p className="text-2xl font-bold text-zinc-300">1,053</p>
                  <p className="text-emerald-400 text-xs">+14%</p>
                </div>
                <div className="text-zinc-600 text-xl">→</div>
                <div className="text-center">
                  <p className="text-zinc-500 text-xs mb-1">Jan<br /><span className="text-[10px]">(current pace)</span></p>
                  <p className="text-2xl font-bold text-white">1,090*</p>
                  <p className="text-emerald-400 text-xs">+4%</p>
                </div>
              </div>
              <p className="text-zinc-500 text-sm mt-4 text-center">
                Steady climb as comms volume increases
              </p>
              <p className="text-zinc-600 text-xs mt-2 text-center">
                *Despite 5-day full app outage. This figure would be ~1,250 if daily averages were applied to those days.
              </p>
            </div>
          </RevealText>

          {/* Email Results */}
          <RevealText delay={0.3}>
            <div className="rounded-xl border border-emerald-500/30 p-5 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-emerald-400 font-medium">Email Results</p>
                <span className="text-zinc-500 text-xs">20 campaigns &bull; Jan 8-22</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">83%</p>
                  <p className="text-zinc-500 text-xs">of product emails drove trade lift</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">~14+</p>
                  <p className="text-zinc-500 text-xs">incremental trades from 5 campaigns</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">+41%</p>
                  <p className="text-zinc-500 text-xs">avg offer uplift</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-zinc-500 text-xs mb-2">Standout campaigns:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">Kobe 5 CC: +690% trades</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">Gamma Blue: +429% trades</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">Travis Scott: +67% trades</span>
                </div>
              </div>
            </div>
          </RevealText>

          {/* Push Results */}
          <RevealText delay={0.4}>
            <div className="rounded-xl border border-blue-500/30 p-5 mb-6" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-blue-400 font-medium">Push Results</p>
                <span className="text-zinc-500 text-xs">61 targeted campaigns &bull; Dec-Jan</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">84%</p>
                  <p className="text-zinc-500 text-xs">positive offer lift</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">+270%</p>
                  <p className="text-zinc-500 text-xs">best trade lift (p&lt;0.0001)</p>
                </div>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.5}>
            <div className="pl-4 py-3 border-l-2 border-emerald-500" style={{ background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)' }}>
              <p className="text-zinc-300">
                This isn&apos;t cherry-picked results—<span className="text-white font-medium">it&apos;s the pattern.</span> Signal-first,
                behavior-triggered comms consistently drive action.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 3: Correlation Chart ==================== */}
      <Section id="correlation" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">The Data</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              The correlation is clear:{' '}
              <span className="text-gradient">more comms = more trades.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <CorrelationChart />
          </RevealText>

          <RevealText delay={0.3}>
            <div className="mt-6 pl-4 py-3 border-l-2 border-emerald-500" style={{ background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)' }}>
              <p className="text-zinc-300">
                Now we have the infrastructure to do this at scale—
                <span className="text-white font-medium"> without adding headcount.</span>
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 4: 120-Day Sprint Overview ==================== */}
      <Section id="sprint" className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.1)' }} />
        </div>

        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">The Plan</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              We&apos;re now in Day 20 of a{' '}
              <span className="text-gradient">120-day sprint.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.15}>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '17%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
                />
              </div>
              <span className="text-zinc-500 text-sm">Day 20/120</span>
            </div>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-xl text-zinc-300 mb-8">
              Three missions. One goal: <span className="text-white font-semibold">accelerate past break-even.</span>
            </p>
          </RevealText>

          <div className="grid md:grid-cols-3 gap-4">
            <MissionCard
              number="1"
              title="Channel Activation"
              description="Light up marketing & engagement channels at full capacity. Increase engagement from existing customers."
              status="in-progress"
              delay={0.3}
            />
            <MissionCard
              number="2"
              title="Signal-First Trading"
              description="Redesign the core trading flow around intent signals. Help users find the right people, not just create offers."
              status="development"
              delay={0.4}
            />
            <MissionCard
              number="3"
              title="Ads Revamp"
              description="Reignite paid growth with economics that actually work. Target: 60-day payback period."
              status="preparing"
              delay={0.5}
            />
          </div>

          <RevealText delay={0.6}>
            <p className="text-zinc-400 text-center mt-8">
              All three leverage the AI infrastructure we built. All-in customer acquisition costs
              are <span className="text-white">dramatically lower</span> than the last time we ran paid growth.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 7: Mission 1 Deep Dive ==================== */}
      <Section id="mission1" className="relative">
        <div className="max-w-3xl">
          <RevealText>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">1</span>
              </div>
              <p className="text-amber-400 text-sm uppercase tracking-widest">Mission 1</p>
            </div>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Orchestrated, behavior-triggered engagement.
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="rounded-xl border border-zinc-800 p-5 mb-6" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-3">The Hypothesis</p>
              <p className="text-white text-lg">
                More comms = more activity = more transactions.
              </p>
              <p className="text-zinc-400 mt-2">
                But the key is <span className="text-amber-400">relevance</span>—reacting to user behavior and intent,
                not blasting broad-based messages (which annoyed people).
              </p>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="rounded-xl border border-zinc-800 p-5 mb-6" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-4">What&apos;s Live Now</p>
              <div className="grid grid-cols-2 gap-3">
                <ChannelBadge icon="📱" name="Push" frequency="Daily, action-based" />
                <ChannelBadge icon="✉️" name="Email" frequency="3-4x per week, targeted" />
                <ChannelBadge icon="🐦" name="Twitter" frequency="3-4 tweets per day" />
                <ChannelBadge icon="📸" name="Instagram" frequency="1 post + 2 stories daily" />
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  All run by <span className="text-white">one person</span> + the automation system.
                </p>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.4}>
            <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-zinc-500 text-xs uppercase">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-white font-medium">In Progress</p>
                  </div>
                </div>
                <p className="text-zinc-500 text-sm">Ramping volume</p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 8: Mission 2 Deep Dive ==================== */}
      <Section id="mission2" className="relative">
        <div className="max-w-3xl">
          <RevealText>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <span className="text-purple-400 font-bold text-sm">2</span>
              </div>
              <p className="text-purple-400 text-sm uppercase tracking-widest">Mission 2</p>
            </div>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Stop helping users create offers.{' '}
              <span className="text-gradient">Start helping them find the right people.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl p-5 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Old Flow</p>
                <p className="text-zinc-400">
                  &quot;What shoe do you want? Create an offer. <span className="text-zinc-600">Hope someone bites.&quot;</span>
                </p>
              </div>
              <div className="rounded-xl p-5 border border-emerald-500/30" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <p className="text-emerald-400 text-xs uppercase tracking-widest mb-3">New Flow</p>
                <p className="text-white">
                  &quot;What shoe do you want? Here are the people most likely to give it to you—
                  <span className="text-emerald-400"> ranked by intent signals.&quot;</span>
                </p>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="rounded-xl border border-zinc-800 p-5 mb-6" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-4">The Intent Hierarchy</p>
              <div className="space-y-4">
                <IntentTier
                  number="1"
                  title="Currently offering this shoe in other trades"
                  description="Highest signal—they're actively trying to move it"
                />
                <IntentTier
                  number="2"
                  title='Marked as "looking to move"'
                  description="Explicit intent to trade"
                />
                <IntentTier
                  number="3"
                  title="Strong trading history + complementary wishlist"
                  description="Track record + mutual interest"
                />
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.4}>
            <div className="rounded-xl border border-emerald-500/30 p-5 mb-6" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
              <p className="text-emerald-400 font-medium mb-3">We&apos;ve Already Proven This Works</p>
              <p className="text-zinc-400 text-sm mb-4">
                Signal-first targeting in email/push consistently drives trades—across categories, across framings:
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                  <p className="text-2xl font-bold text-white">83%</p>
                  <p className="text-zinc-500 text-xs">of product emails drove trade lift</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                  <p className="text-2xl font-bold text-white">5</p>
                  <p className="text-zinc-500 text-xs">categories tested (Jordans, Kobes, Travis)</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                  <p className="text-2xl font-bold text-emerald-400">+270%</p>
                  <p className="text-zinc-500 text-xs">best push trade lift</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Kobe 5 CC: +690%</span>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Gamma Blue: +429%</span>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Black Cat: +77%</span>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Travis Scott: +67%</span>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.5}>
            <div className="pl-4 py-3 border-l-2 border-purple-500" style={{ background: 'linear-gradient(to right, rgba(168, 85, 247, 0.1), transparent)' }}>
              <p className="text-zinc-300">
                This is currently only in email/push.{' '}
                <span className="text-white font-medium">Now we&apos;re embedding it in the core product.</span>
              </p>
              <p className="text-zinc-500 text-sm mt-2">Expected impact: +15-21% CVR improvement</p>
            </div>
          </RevealText>

          <RevealText delay={0.6}>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                <p className="text-zinc-500 text-xs uppercase mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <p className="text-white font-medium">In Development</p>
                </div>
              </div>
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                <p className="text-zinc-500 text-xs uppercase mb-2">Target Launch</p>
                <p className="text-white font-medium">March 1</p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 9: Mission 3 Deep Dive ==================== */}
      <Section id="mission3" className="relative">
        <div className="max-w-3xl">
          <RevealText>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-blue-400 font-bold text-sm">3</span>
              </div>
              <p className="text-blue-400 text-sm uppercase tracking-widest">Mission 3</p>
            </div>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Make paid growth{' '}
              <span className="text-gradient">economically viable</span> again.
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="rounded-xl border border-red-500/30 p-5 mb-6" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
              <p className="text-red-400 text-xs uppercase tracking-widest mb-3">The Problem Last Time</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-zinc-400">$2-3</p>
                  <p className="text-zinc-600 text-xs">CAC on paper</p>
                </div>
                <div className="text-zinc-600">+</div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-zinc-400">Team</p>
                  <p className="text-zinc-600 text-xs">Overhead</p>
                </div>
                <div className="text-zinc-600">=</div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">$6+</p>
                  <p className="text-zinc-600 text-xs">All-in cost</p>
                </div>
              </div>
              <p className="text-zinc-500 text-sm mt-4 text-center">The math didn&apos;t work.</p>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="rounded-xl border border-emerald-500/30 p-5 mb-6" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
              <p className="text-emerald-400 text-xs uppercase tracking-widest mb-3">What&apos;s Different Now</p>
              <p className="text-white text-lg mb-2">
                AI-enabled, founder-managed → <span className="text-emerald-400">Labor cost = $0</span>
              </p>
              <p className="text-zinc-400">Even flat ad performance = economics work again.</p>
            </div>
          </RevealText>

          <RevealText delay={0.4}>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-5 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Tactical Shift #1</p>
                <p className="text-white font-medium mb-2">Landing Page Funnel</p>
                <p className="text-zinc-400 text-sm">
                  Not direct app store. Cheaper clicks. Warmer users who understand trading first.
                </p>
              </div>
              <div className="rounded-xl p-5 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Tactical Shift #2</p>
                <p className="text-white font-medium mb-2">Video Creative</p>
                <p className="text-zinc-400 text-sm">
                  Not static images. Better demonstrates the product. Speaks to the audience.
                </p>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.5}>
            <div className="rounded-xl border border-amber-500/30 p-6" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <p className="text-amber-400 text-xs uppercase tracking-widest mb-4 text-center">The Payback Math</p>

              <div className="overflow-hidden rounded-lg border border-zinc-800 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                      <th className="text-left p-3 text-zinc-500 font-medium">Scenario</th>
                      <th className="text-center p-3 text-zinc-500 font-medium">CAC</th>
                      <th className="text-center p-3 text-zinc-500 font-medium">60-day Conv</th>
                      <th className="text-center p-3 text-zinc-500 font-medium">Payback</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800">
                      <td className="p-3 text-zinc-400">Historical (with team)</td>
                      <td className="p-3 text-center text-red-400">$6+</td>
                      <td className="p-3 text-center text-zinc-400">8%</td>
                      <td className="p-3 text-center text-red-400">Never worked</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white font-medium">AI-enabled, founder-managed</td>
                      <td className="p-3 text-center text-emerald-400">$1.50-2.00</td>
                      <td className="p-3 text-center text-white">10%</td>
                      <td className="p-3 text-center text-emerald-400 font-medium">55-80 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-center">
                <p className="text-zinc-300">Hit that → <span className="text-white font-medium">Paid growth is self-sustaining</span></p>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.6}>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                <p className="text-zinc-500 text-xs uppercase mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <p className="text-white font-medium">Preparing</p>
                </div>
                <p className="text-zinc-500 text-xs mt-1">Testing creative</p>
              </div>
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                <p className="text-zinc-500 text-xs uppercase mb-2">Target Launch</p>
                <p className="text-white font-medium">March 1</p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 8: Projected Trajectory ==================== */}
      <Section id="outcomes" className="relative">
        <div className="max-w-5xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">Projected Trajectory</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">
              Three missions.{' '}
              <span className="text-gradient">Three levers.</span>
            </h2>
          </RevealText>

          {/* Driver Metrics Impact Summary */}
          <RevealText delay={0.2}>
            <div className="rounded-xl border border-zinc-800 p-6 mb-8" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Driver Metrics Trajectory</p>
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700" style={{ background: 'rgba(24, 24, 27, 0.7)' }}>
                      <th className="text-left p-3 text-zinc-400 font-medium">Metric</th>
                      <th className="text-center p-3 text-zinc-400 font-medium">Jan</th>
                      <th className="text-center p-3 text-zinc-400 font-medium">Apr</th>
                      <th className="text-center p-3 text-zinc-400 font-medium">Aug</th>
                      <th className="text-center p-3 text-zinc-400 font-medium">Dec</th>
                      <th className="text-center p-3 text-zinc-400 font-medium">Total Lift</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800/50">
                      <td className="p-3 text-white font-medium">MAU</td>
                      <td className="p-3 text-center text-zinc-400">20,275</td>
                      <td className="p-3 text-center text-zinc-300">24,000</td>
                      <td className="p-3 text-center text-zinc-300">30,700</td>
                      <td className="p-3 text-center text-white font-medium">37,000</td>
                      <td className="p-3 text-center text-emerald-400 font-medium">+85%</td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="p-3 text-white font-medium">Offers/User</td>
                      <td className="p-3 text-center text-zinc-400">1.48</td>
                      <td className="p-3 text-center text-zinc-300">1.62</td>
                      <td className="p-3 text-center text-zinc-300">1.75</td>
                      <td className="p-3 text-center text-white font-medium">1.76</td>
                      <td className="p-3 text-center text-emerald-400 font-medium">+24%</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white font-medium">CVR</td>
                      <td className="p-3 text-center text-zinc-400">3.43%</td>
                      <td className="p-3 text-center text-zinc-300">3.85%</td>
                      <td className="p-3 text-center text-zinc-300">4.27%</td>
                      <td className="p-3 text-center text-white font-medium">4.27%</td>
                      <td className="p-3 text-center text-emerald-400 font-medium">+27%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-zinc-400 text-sm mt-4 text-center">
                M1 (Channels) + M3 (Ads) drive MAU. M1 + M2 (Signal-First) drive Offers/User and CVR.
              </p>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <h3 className="font-display text-xl font-bold mb-4 text-zinc-300">
              What that means for outcomes:
            </h3>
          </RevealText>

          {/* Outcomes Table */}
          <RevealText delay={0.4}>
            <div className="overflow-hidden rounded-xl border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700" style={{ background: 'rgba(24, 24, 27, 0.7)' }}>
                    <th className="text-left p-4 text-zinc-400 font-medium">Metric</th>
                    <th className="text-center p-4 text-zinc-400 font-medium">Jan</th>
                    <th className="text-center p-4 text-zinc-400 font-medium">Apr</th>
                    <th className="text-center p-4 text-zinc-400 font-medium">Jun</th>
                    <th className="text-center p-4 text-zinc-400 font-medium">Aug</th>
                    <th className="text-center p-4 text-zinc-400 font-medium">Dec</th>
                    <th className="text-center p-4 text-zinc-400 font-medium">Total Lift</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Driver Metrics Section */}
                  <tr className="border-b border-zinc-800/50">
                    <td className="p-4 text-zinc-500 text-xs uppercase tracking-wider" colSpan={7} style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
                      Driver Metrics
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="p-4 text-white font-medium">MAU</td>
                    <td className="p-4 text-center text-zinc-400">20,275</td>
                    <td className="p-4 text-center text-zinc-300">24,000</td>
                    <td className="p-4 text-center text-zinc-300">30,700</td>
                    <td className="p-4 text-center text-zinc-300">30,700</td>
                    <td className="p-4 text-center text-white font-medium">37,000</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">+85%</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="p-4 text-white font-medium">Offers/User</td>
                    <td className="p-4 text-center text-zinc-400">1.48</td>
                    <td className="p-4 text-center text-zinc-300">1.62</td>
                    <td className="p-4 text-center text-zinc-300">1.75</td>
                    <td className="p-4 text-center text-zinc-300">1.75</td>
                    <td className="p-4 text-center text-white font-medium">1.76</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">+24%</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="p-4 text-white font-medium">CVR</td>
                    <td className="p-4 text-center text-zinc-400">3.43%</td>
                    <td className="p-4 text-center text-zinc-300">3.85%</td>
                    <td className="p-4 text-center text-zinc-300">4.27%</td>
                    <td className="p-4 text-center text-zinc-300">4.27%</td>
                    <td className="p-4 text-center text-white font-medium">4.27%</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">+27%</td>
                  </tr>

                  {/* Outcomes Section */}
                  <tr className="border-b border-zinc-800/50">
                    <td className="p-4 text-zinc-500 text-xs uppercase tracking-wider" colSpan={7} style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                      Outcomes
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="p-4 text-white font-medium">Transactions</td>
                    <td className="p-4 text-center text-zinc-400">1,030</td>
                    <td className="p-4 text-center text-zinc-300">1,500</td>
                    <td className="p-4 text-center text-zinc-300">1,936</td>
                    <td className="p-4 text-center text-zinc-300">2,290</td>
                    <td className="p-4 text-center text-white font-medium">2,780</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">+170%</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="p-4 text-white font-medium">Gross Margin</td>
                    <td className="p-4 text-center text-zinc-400">$18.2K</td>
                    <td className="p-4 text-center text-zinc-300">$29.8K</td>
                    <td className="p-4 text-center text-zinc-300">$40.9K</td>
                    <td className="p-4 text-center text-zinc-300">$51.0K</td>
                    <td className="p-4 text-center text-white font-medium">$65.6K</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">+260%</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-white font-medium">Net Income</td>
                    <td className="p-4 text-center text-red-400">-$13.8K</td>
                    <td className="p-4 text-center text-red-400/70">-$9.2K</td>
                    <td className="p-4 text-center text-emerald-400">+$1.9K</td>
                    <td className="p-4 text-center text-emerald-400">+$12.0K</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">+$26.6K</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </RevealText>

          {/* Breakeven Callout */}
          <RevealText delay={0.5}>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-500/30 p-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs uppercase">Operational Breakeven</p>
                    <p className="text-white font-bold text-lg">June 2026</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 p-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs uppercase">Overall Breakeven (with debt)</p>
                    <p className="text-white font-bold text-lg">September 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 12: The Raise (Modified) ==================== */}
      <Section id="raise" className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.15)' }} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">The Opportunity</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">
              <span className="text-gradient">$500K</span> internal round.{' '}
              <span className="text-white">Now open.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="rounded-xl border border-amber-500/30 p-6" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-4 text-center">The Path to Break-Even</p>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-zinc-500 text-xs mb-1">Operational break-even</p>
                  <p className="text-xl font-bold text-white">June 2026</p>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 text-xs mb-1">Overall break-even (with debt)</p>
                  <p className="text-xl font-bold text-white">Sept 2026</p>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 text-xs mb-1">Cash to get there</p>
                  <p className="text-xl font-bold text-zinc-400">~$128K</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 text-center">
                <p className="text-white">
                  We&apos;re raising <span className="text-gradient font-bold">$500K</span> to{' '}
                  <span className="text-amber-400 font-semibold">invest</span>, not just survive.
                </p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 13: Close (Modified) ==================== */}
      <Section id="close" className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #18181b 0%, #000 50%, #18181b 100%)' }} />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-48 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.2)' }} />
        </div>

        <div className="relative z-10 max-w-2xl text-center mx-auto">
          <RevealText>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              We built the weapon.{' '}
              <span className="text-gradient">We&apos;re using it.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.1}>
            <p className="text-xl text-zinc-300 mb-8">
              Now we&apos;re ready to scale.
            </p>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="mt-12 opacity-50">
              <p className="text-zinc-600 text-sm uppercase tracking-widest">Tradeblock</p>
            </div>
          </RevealText>
        </div>
      </Section>
    </div>
  );
}
