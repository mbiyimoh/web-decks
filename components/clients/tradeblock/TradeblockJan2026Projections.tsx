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

const EmailVersionCard = ({ version, title, campaign, description, metrics, isHighlighted }: {
  version: string;
  title: string;
  campaign?: string;
  description: string;
  metrics?: {
    audience: string;
    openRate: string;
    ctr: string;
    tradeLift: string;
  };
  isHighlighted?: boolean;
}) => (
  <div className={`rounded-xl p-5 border ${isHighlighted ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isHighlighted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
        {version}
      </div>
      <div>
        <p className={`font-medium ${isHighlighted ? 'text-emerald-400' : 'text-white'}`}>{title}</p>
      </div>
    </div>
    {campaign && <p className="text-zinc-500 text-xs mb-2 italic">&quot;{campaign}&quot;</p>}
    <p className="text-zinc-400 text-sm mb-4">{description}</p>
    {metrics && (
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-800">
        <div className="text-center">
          <p className={`text-sm font-bold ${isHighlighted ? 'text-emerald-400' : 'text-white'}`}>{metrics.audience}</p>
          <p className="text-zinc-500 text-xs">Audience</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold ${isHighlighted ? 'text-emerald-400' : 'text-white'}`}>{metrics.openRate}</p>
          <p className="text-zinc-500 text-xs">Open rate</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold ${isHighlighted ? 'text-emerald-400' : 'text-white'}`}>{metrics.ctr}</p>
          <p className="text-zinc-500 text-xs">CTR</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold ${isHighlighted ? 'text-emerald-400' : 'text-white'}`}>{metrics.tradeLift}</p>
          <p className="text-zinc-500 text-xs">Trade lift</p>
        </div>
      </div>
    )}
  </div>
);

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

  // Weekly transaction data (Oct 26 - Jan 18, 13 weeks)
  const weeklyData = [
    { week: 'Oct 26', transactions: 195, push: 0, email: 0, phase: 'baseline' },
    { week: 'Nov 2', transactions: 188, push: 0, email: 0, phase: 'baseline' },
    { week: 'Nov 9', transactions: 210, push: 0, email: 0, phase: 'baseline' },
    { week: 'Nov 16', transactions: 205, push: 4, email: 0, phase: 'baseline' },
    { week: 'Nov 23', transactions: 195, push: 4, email: 0, phase: 'baseline' },
    { week: 'Nov 30', transactions: 220, push: 12, email: 0, phase: 'ramp' },
    { week: 'Dec 7', transactions: 235, push: 15, email: 0, phase: 'ramp' },
    { week: 'Dec 14', transactions: 248, push: 18, email: 0, phase: 'ramp' },
    { week: 'Dec 21', transactions: 265, push: 20, email: 5, phase: 'active' },
    { week: 'Dec 28', transactions: 278, push: 22, email: 8, phase: 'active' },
    { week: 'Jan 4', transactions: 295, push: 20, email: 10, phase: 'active' },
    { week: 'Jan 11', transactions: 310, push: 25, email: 12, phase: 'active' },
    { week: 'Jan 18', transactions: 320, push: 20, email: 6, phase: 'active' },
  ];

  const maxTransactions = 350;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6 }}
      className="rounded-xl border border-zinc-800 p-6"
      style={{ background: 'rgba(24, 24, 27, 0.5)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-white font-medium">Weekly Transaction Volume</p>
          <p className="text-zinc-500 text-xs">With campaign activity timeline</p>
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
          <span>350</span>
          <span>280</span>
          <span>210</span>
          <span>140</span>
          <span>70</span>
          <span>0</span>
        </div>

        {/* Transaction bars area */}
        <div className="ml-10 h-64 flex items-end gap-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(6)].map((_, i) => (
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
    { id: 'channels', label: 'Channels' },
    { id: 'signal-testing', label: 'Signal Testing' },
    { id: 'signal-product', label: 'Signal → Product' },
    { id: 'sprint', label: 'The Sprint' },
    { id: 'growth', label: 'Growing Userbase' },
    { id: 'trajectory', label: 'Trajectory' },
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
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.15)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.1)' }} />
        </div>

        <div className="relative z-10 max-w-4xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-4">Q1 2025 Update</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The{' '}
              <span className="text-gradient">120-Day</span>{' '}
              Sprint
            </h1>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed">
              Transaction momentum is building. Here&apos;s what&apos;s driving it—and the plan to accelerate.
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

      {/* ==================== SLIDE 2: Transaction Momentum ==================== */}
      <Section id="momentum" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">The Numbers</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Transaction volume is climbing.
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="rounded-xl border border-amber-500/30 p-6 mb-6" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <p className="text-amber-400 text-xs uppercase tracking-widest mb-6">Pairs of Shoes Traded Per Month</p>
              <div className="flex items-end justify-center gap-6 md:gap-12">
                <div className="text-center">
                  <p className="text-zinc-500 text-sm mb-2">Nov</p>
                  <p className="text-4xl md:text-5xl font-bold text-zinc-400">1,369</p>
                </div>
                <div className="text-zinc-600 text-2xl pb-4">→</div>
                <div className="text-center">
                  <p className="text-zinc-500 text-sm mb-2">Dec</p>
                  <p className="text-4xl md:text-5xl font-bold text-zinc-300">1,523</p>
                  <p className="text-emerald-400 text-sm mt-1">+11%</p>
                </div>
                <div className="text-zinc-600 text-2xl pb-4">→</div>
                <div className="text-center">
                  <p className="text-zinc-500 text-sm mb-2">Jan (proj)</p>
                  <p className="text-4xl md:text-5xl font-bold text-white">1,812</p>
                  <p className="text-emerald-400 text-sm mt-1">+19%</p>
                </div>
              </div>
              <p className="text-zinc-500 text-xs mt-6 text-center">
                * Dec pro forma excluding 5-day domain/infrastructure outage
              </p>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-3xl font-bold text-emerald-400 mb-1">+32%</p>
                <p className="text-zinc-300 text-sm font-medium">Nov → Jan growth</p>
                <p className="text-zinc-500 text-xs mt-1">Consistent month-over-month acceleration</p>
              </div>
              <div className="rounded-xl p-5 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-3xl font-bold text-amber-400 mb-1">+19%</p>
                <p className="text-zinc-300 text-sm font-medium">Dec → Jan lift</p>
                <p className="text-zinc-500 text-xs mt-1">MoM growth accelerating</p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 3: Where Is Momentum Coming From? ==================== */}
      <Section id="channels" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">The Why</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">
              Where is momentum coming from?
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <CorrelationChart />
          </RevealText>

          <RevealText delay={0.3}>
            <div className="mt-8 rounded-xl border border-zinc-800 p-6" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Channel Results • Dec–Jan</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-emerald-500/20" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-emerald-400 font-medium">📧 Email</p>
                    <span className="text-zinc-500 text-xs">20 campaigns</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-white">83%</p>
                      <p className="text-zinc-500 text-xs">drove trade lift</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">+41%</p>
                      <p className="text-zinc-500 text-xs">avg offer uplift</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-blue-500/20" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-blue-400 font-medium">🔔 Push</p>
                    <span className="text-zinc-500 text-xs">61 campaigns</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-white">84%</p>
                      <p className="text-zinc-500 text-xs">positive offer lift</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">+270%</p>
                      <p className="text-zinc-500 text-xs">best trade lift</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  <span className="text-white font-medium">81 targeted campaigns</span> in two weeks →
                  consistent, measurable trade lift. This isn&apos;t cherry-picked—it&apos;s the pattern.
                </p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 4: Signal-Testing System ==================== */}
      <Section id="signal-testing" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">Zooming Out: The System</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              A rapid signal-testing engine{' '}
              <span className="text-gradient">inside our existing base.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.15}>
            <p className="text-zinc-400 text-lg mb-8">
              We&apos;ve evolved from generic broadcasts to signal-first targeting. Here&apos;s the progression:
            </p>
          </RevealText>

          <div className="space-y-4">
            <RevealText delay={0.2}>
              <EmailVersionCard
                version="v1"
                title="Generic launch email"
                campaign="Throwback Thursday - White Cement 3"
                description="Broad announcement to entire base. Impressive-looking aggregate stats, but users have the same question: What about in MY size? What's relevant to ME?"
                metrics={{ audience: '50,094', openRate: '39.6%', ctr: '0.22%', tradeLift: 'Nominal' }}
              />
            </RevealText>

            <RevealText delay={0.3}>
              <div className="flex justify-center py-2">
                <div className="text-zinc-600 text-xl">↓</div>
              </div>
            </RevealText>

            <RevealText delay={0.35}>
              <EmailVersionCard
                version="v2"
                title="Size-personalized"
                campaign="Who's hunting kicks in YOUR size?"
                description="Personalized to show who's most active in your size. Better, but still doesn't account for whether their activity is actually relevant to what you want."
                metrics={{ audience: '14,782', openRate: '49.7%', ctr: '2.24%', tradeLift: '+22%' }}
              />
            </RevealText>

            <RevealText delay={0.45}>
              <div className="flex justify-center py-2">
                <div className="text-zinc-600 text-xl">↓</div>
              </div>
            </RevealText>

            <RevealText delay={0.5}>
              <EmailVersionCard
                version="v3"
                title="Signal-first, partner-focused"
                campaign="Jordan 4 Brick by Brick? Fresh supply on the block."
                description="Only sent to users showing recent intent signal. Points directly to BEST trade partners—ranked by trade count and reputation. One-click to act."
                metrics={{ audience: '2,971', openRate: '54.3%', ctr: '4.01%', tradeLift: '+167%' }}
                isHighlighted={true}
              />
            </RevealText>
          </div>

          <RevealText delay={0.6}>
            <div className="mt-8 pl-4 py-3 border-l-2 border-emerald-500" style={{ background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)' }}>
              <p className="text-zinc-300">
                <span className="text-white font-medium">The insight:</span> Don&apos;t just show users data about a shoe.
                Show them <span className="text-emerald-400 font-medium">who to trade with</span> and make it effortless to act.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 5: Kicker - Signal-First in Product ==================== */}
      <Section id="signal-product" className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(16, 185, 129, 0.2)' }} />
        </div>

        <div className="relative z-10 max-w-5xl">
          <RevealText>
            <p className="text-emerald-400 text-sm uppercase tracking-widest mb-3">The Kicker</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              This pattern belongs in the{' '}
              <span className="text-gradient">core product.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-zinc-400 text-lg mb-8">
              If signal-first targeting works this well in email,
              it should be even more powerful where the most users and activity already are—the app itself.
            </p>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Left: Description */}
              <div className="rounded-xl border border-zinc-800 p-6" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="text-center p-4 rounded-lg border border-zinc-700" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                    <p className="text-2xl mb-2">📧</p>
                    <p className="text-zinc-400 text-sm">Email learnings</p>
                    <p className="text-emerald-400 text-xs">Signal-first works</p>
                  </div>
                  <div className="text-amber-400 text-3xl">→</div>
                  <div className="text-center p-4 rounded-lg border border-emerald-500/30" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <p className="text-2xl mb-2">📱</p>
                    <p className="text-white text-sm font-medium">Core product</p>
                    <p className="text-emerald-400 text-xs">Widest surface area</p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-6">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">What this looks like in-app:</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-xs">1</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Best trading partners view</p>
                        <p className="text-zinc-500 text-xs">Replace generic &quot;Available offers&quot; with signal-ranked recommendations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-xs">2</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Ranked by recent activity + reputation</p>
                        <p className="text-zinc-500 text-xs">Surface users who traded this shoe TODAY, sorted by trade count</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-xs">3</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">One-click multi-offer + DM</p>
                        <p className="text-zinc-500 text-xs">Send offers to multiple best partners simultaneously</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Phone mockup placeholder */}
              <div className="rounded-xl border border-dashed border-zinc-700 p-6 flex flex-col items-center justify-center min-h-[400px]" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                <div className="w-48 h-80 rounded-3xl border-2 border-zinc-700 bg-zinc-900/50 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-zinc-600 text-4xl mb-3">📱</p>
                    <p className="text-zinc-500 text-sm">Phone mockup</p>
                    <p className="text-zinc-600 text-xs">placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.4}>
            <div className="mt-8 pl-4 py-3 border-l-2 border-amber-500" style={{ background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)' }}>
              <p className="text-zinc-300">
                <span className="text-white font-medium">Same pattern that worked in email.</span>{' '}
                Now applied where it touches the most users and activity.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 6: 120-Day Sprint Overview ==================== */}
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
              The{' '}
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
              Three initiatives. Two customer types. One goal: <span className="text-white font-semibold">accelerate past break-even.</span>
            </p>
          </RevealText>

          <RevealText delay={0.25}>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl border border-zinc-800 p-5" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-amber-400 text-xs uppercase tracking-widest mb-2">Inside the Container</p>
                <p className="text-white font-medium text-lg mb-2">Existing & Past Customers</p>
                <p className="text-zinc-400 text-sm mb-4">Reactivate the base. Increase engagement. Convert more offers to trades.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Channels</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Product</span>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 p-5" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-blue-400 text-xs uppercase tracking-widest mb-2">Outside the Container</p>
                <p className="text-white font-medium text-lg mb-2">Net New Customers</p>
                <p className="text-zinc-400 text-sm mb-4">Feed and enlarge the container. Sustainable top-of-funnel growth.</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Ads</span>
                </div>
              </div>
            </div>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="grid md:grid-cols-3 gap-4">
              <MissionCard
                number="1"
                title="Channel Activation"
                description="Scale email + push to 3x volume. Already proving trade lift."
                status="in-progress"
                delay={0}
              />
              <MissionCard
                number="2"
                title="Signal-First Product"
                description="Best trading partners. One-click multi-offer. The email pattern, in-app."
                status="development"
                delay={0.1}
              />
              <MissionCard
                number="3"
                title="Net New Growth"
                description="Revive paid with AI-enabled economics. Landing page funnel."
                status="preparing"
                delay={0.2}
              />
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ==================== SLIDE 7: Growing the Userbase ==================== */}
      <Section id="growth" className="relative">
        <div className="max-w-4xl">
          <RevealText>
            <p className="text-blue-400 text-sm uppercase tracking-widest mb-3">Growing the Userbase</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Net new growth:{' '}
              <span className="text-gradient">Feed the container</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-zinc-400 text-lg mb-8">
              Revive paid acquisition with fundamentally better economics. AI-enabled, founder-managed.
            </p>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="rounded-xl border border-zinc-800 p-6 mb-6" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">The New Funnel</p>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1 text-center p-3 rounded-lg border border-zinc-700">
                  <p className="text-xl mb-1">🎬</p>
                  <p className="text-white text-sm font-medium">Video ads</p>
                  <p className="text-zinc-500 text-xs">Show the trading experience</p>
                </div>
                <div className="text-zinc-600">→</div>
                <div className="flex-1 text-center p-3 rounded-lg border border-zinc-700">
                  <p className="text-xl mb-1">🌐</p>
                  <p className="text-white text-sm font-medium">Landing page</p>
                  <p className="text-zinc-500 text-xs">Not app store (cheaper)</p>
                </div>
                <div className="text-zinc-600">→</div>
                <div className="flex-1 text-center p-3 rounded-lg border border-zinc-700">
                  <p className="text-xl mb-1">👟</p>
                  <p className="text-white text-sm font-medium">Pick a shoe</p>
                  <p className="text-zinc-500 text-xs">See real signal data</p>
                </div>
                <div className="text-zinc-600">→</div>
                <div className="flex-1 text-center p-3 rounded-lg border border-emerald-500/30" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <p className="text-xl mb-1">📱</p>
                  <p className="text-emerald-400 text-sm font-medium">Download</p>
                  <p className="text-zinc-500 text-xs">Educated user</p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm">
                Users arrive understanding what trading is and already interested in a specific shoe. Better conversion, better retention.
              </p>
            </div>
          </RevealText>

          <RevealText delay={0.4}>
            <div className="rounded-xl border border-amber-500/30 p-6 mb-6" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <p className="text-amber-400 text-xs uppercase tracking-widest mb-4">The Economics</p>
              <div className="overflow-hidden rounded-lg border border-zinc-800">
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
              <p className="text-zinc-400 text-sm mt-4 text-center">
                50-60% cost reduction by removing people-cost. <span className="text-white font-medium">Hit that → paid growth is self-sustaining.</span>
              </p>
            </div>
          </RevealText>

          <RevealText delay={0.5}>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4 border border-zinc-800" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
                <p className="text-zinc-500 text-xs uppercase mb-2">Status</p>
                <p className="text-white font-medium">Testing creative</p>
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
      <Section id="trajectory" className="relative">
        <div className="max-w-5xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">Projected Trajectory</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Three missions.{' '}
              <span className="text-gradient">Three levers.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.15}>
            <p className="text-zinc-400 text-lg mb-8">
              Lighting up all our channels, moving to signal-first patterns in both comms and product, and revitalizing our growth engine will have a meaningful impact on the three core levers of our business: active users, the offers each of them creates, and the conversion rate of those offers.
            </p>
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
            <div className="overflow-hidden rounded-xl border border-zinc-800 mb-6" style={{ background: 'rgba(24, 24, 27, 0.3)' }}>
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
                    <td className="p-4 text-white font-medium">Net Sales</td>
                    <td className="p-4 text-center text-zinc-400">$48K</td>
                    <td className="p-4 text-center text-zinc-300">$70K</td>
                    <td className="p-4 text-center text-zinc-300">$91K</td>
                    <td className="p-4 text-center text-zinc-300">$108K</td>
                    <td className="p-4 text-center text-white font-medium">$136K</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">+183%</td>
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

          {/* Historical Context + Breakeven - Side by Side */}
          <RevealText delay={0.5}>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* MAU Context */}
              <div className="rounded-xl border border-zinc-800 p-5" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">MAU Context</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm">Historical Peak</p>
                    <p className="text-white font-bold text-2xl">60-70K</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Current</p>
                    <p className="text-amber-400 font-bold text-2xl">~20K</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Dec Target</p>
                    <p className="text-emerald-400 font-bold text-2xl">37K</p>
                    <p className="text-zinc-500 text-xs">~55% of peak</p>
                  </div>
                </div>
              </div>

              {/* Revenue Context */}
              <div className="rounded-xl border border-zinc-800 p-5" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Revenue Context</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm">Historical Peak</p>
                    <p className="text-white font-bold text-2xl">$300K+</p>
                    <p className="text-zinc-500 text-xs">/month</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Current</p>
                    <p className="text-amber-400 font-bold text-2xl">~$48K</p>
                    <p className="text-zinc-500 text-xs">/month</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Dec Target</p>
                    <p className="text-emerald-400 font-bold text-2xl">$136K</p>
                    <p className="text-zinc-500 text-xs">~45% of peak</p>
                  </div>
                </div>
              </div>
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

      {/* ==================== SLIDE 9: The Raise (hidden for ops update version) ====================
      <Section id="raise" className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(245, 158, 11, 0.15)' }} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <RevealText>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-3">The Opportunity</p>
          </RevealText>

          <RevealText delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              <span className="text-gradient">$500K</span> internal round.{' '}
              <span className="text-white">Now open.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <p className="text-zinc-400 text-lg mb-8">
              Bridge to profitability. Fuel the sprint. Capture the opportunity.
            </p>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4 border border-zinc-800 text-center" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-2xl font-bold text-amber-400">$500K</p>
                <p className="text-zinc-400 text-sm">Round size</p>
              </div>
              <div className="rounded-xl p-4 border border-zinc-800 text-center" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-2xl font-bold text-white">~$128K</p>
                <p className="text-zinc-400 text-sm">Cash to breakeven</p>
              </div>
              <div className="rounded-xl p-4 border border-zinc-800 text-center" style={{ background: 'rgba(24, 24, 27, 0.5)' }}>
                <p className="text-2xl font-bold text-emerald-400">Sept &apos;26</p>
                <p className="text-zinc-400 text-sm">Overall breakeven</p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>
      */}

      {/* ==================== SLIDE 10: Close ==================== */}
      <Section id="close" className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <RevealText>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Momentum is building.{' '}
              <span className="text-gradient">The plan is working.</span>
            </h2>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="space-y-4 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-300">Transaction volume climbing: +32% Nov → Jan</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-300">Signal-first pattern proven in channels</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-300">Three-part sprint: Channels → Product → Growth</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-300">Clear path to breakeven by September 2026</p>
              </div>
            </div>
          </RevealText>

          {/* CTA removed for ops update version
          <RevealText delay={0.3}>
            <div className="pt-8 border-t border-zinc-800">
              <p className="text-zinc-400 mb-4">Questions? Let&apos;s talk.</p>
              <p className="text-white font-medium">beems@tradeblock.us</p>
            </div>
          </RevealText>
          */}
        </div>
      </Section>
    </div>
  );
}
