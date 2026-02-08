import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// 33 STRATEGIES HOMEPAGE — V4 PROTOTYPE
// "The advantage is now in who asks better questions."
// ═══════════════════════════════════════════════════════════════

// ── Brand Tokens ──
const GOLD = '#D4A84B';
const GOLD_LIGHT = '#E4C06B';
const GOLD_DIM = '#B8923F';
const BG = '#0a0a0a';
const SURFACE = '#111111';
const ELEVATED = '#1a1a1a';

// ── Spring Presets ──
const springSmooth = { type: 'spring', stiffness: 300, damping: 24 };
const springSnappy = { type: 'spring', stiffness: 400, damping: 20 };

// ═══════════════════════════════════════════════════════════════
// REUSABLE ANIMATION COMPONENTS
// ═══════════════════════════════════════════════════════════════

const RevealText = ({ children, delay = 0, className = '', y = 40 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerContainer = ({ children, className = '', stagger = 0.1, delayStart = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: stagger, delayChildren: delayStart },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ── Gold text helper ──
const G = ({ children }) => (
  <span style={{ color: GOLD, fontWeight: 500 }}>{children}</span>
);

// ═══════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
      style={{ scaleX: scrollYProgress, backgroundColor: GOLD }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

const Nav = () => {
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 100 && y > lastScroll.current);
      lastScroll.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: `${BG}ee`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xl font-medium" style={{ fontFamily: 'Georgia, serif' }}>
            <span style={{ color: GOLD }}>33</span>
            <span className="text-white ml-1">Strategies</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-zinc-500 hidden md:inline cursor-pointer hover:text-zinc-300 transition-colors">Products</span>
          <span className="text-sm text-zinc-500 hidden md:inline cursor-pointer hover:text-zinc-300 transition-colors">About</span>
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ border: `1px solid ${GOLD}60`, color: GOLD }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${GOLD}15`; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Start a Conversation
          </button>
        </div>
      </div>
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)` }} />
    </motion.nav>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 1: HERO
// ═══════════════════════════════════════════════════════════════

const Hero = () => {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 60]);

  return (
    <motion.section
      className="min-h-screen flex flex-col justify-center items-center px-6 md:px-16 relative overflow-hidden"
      style={{ opacity: heroOpacity, y: heroY }}
    >
      {/* Gold glow orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 400,
          background: `radial-gradient(ellipse, ${GOLD}0d 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'breathe 5s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 max-w-3xl text-center">
        <RevealText delay={0.1}>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] mb-8"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            AI gave everyone access to great answers.
            <br />
            <span className="text-zinc-500">The advantage is now in</span>
            <br />
            who asks better questions.
          </h1>
        </RevealText>

        <RevealText delay={0.5}>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Every competitor can prompt the same tools. The technology is commoditized.
            What hasn't been commoditized is <G>your</G> unique context — the way <G>you</G> think
            about <G>your</G> market, <G>your</G> customers, <G>your</G> strategy.
            That's the input that makes AI dangerous.
          </p>
        </RevealText>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
          <rect x="1" y="1" width="18" height="26" rx="9" stroke="#525252" strokeWidth="1.5" />
          <motion.circle
            cx="10" cy="8" r="2" fill="#525252"
            animate={{ cy: [8, 16, 8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>
    </motion.section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: THREE PILLARS
// ═══════════════════════════════════════════════════════════════

const pillars = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        <path d="M8 12a4 4 0 0 1 8 0"/>
      </svg>
    ),
    title: 'AI Consulting & Operator Upskilling',
    desc: 'Engagements that ship real outcomes AND teach your team to think and build AI-first — so you\'re more capable when we leave than when we arrived.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    title: 'Dev Firm + Co-Founder as a Service',
    desc: 'For founders with strong vision but limited build capacity. We\'re your technical co-founder from zero to one — strategy, design, development, and AI integration.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Products That Work For You',
    desc: 'Tools born from our own workflows that kill drudgery and extend your best thinking — included with every consulting or build engagement.',
    badge: 'Included with every engagement',
  },
];

const ThreePillars = () => (
  <section className="py-24 md:py-32 px-6 md:px-16">
    <div className="max-w-5xl mx-auto">
      <RevealText>
        <p className="text-sm font-medium tracking-[0.2em] uppercase mb-6" style={{ color: GOLD }}>
          01 — What We Do
        </p>
      </RevealText>

      <RevealText delay={0.1}>
        <h2
          className="text-2xl md:text-3xl lg:text-4xl font-medium leading-snug mb-4 max-w-3xl"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          We capture <G>your</G> unique context and unleash it on <G>your</G> business —
          while eliminating the intellectual drudgery that limits the time and headspace <G>you</G> have
          for the work that matters.
        </h2>
      </RevealText>

      <RevealText delay={0.2}>
        <p className="text-zinc-500 text-lg mb-12">Three ways in:</p>
      </RevealText>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5" stagger={0.12} delayStart={0.1}>
        {pillars.map((p, i) => (
          <StaggerItem key={i}>
            <motion.div
              className="rounded-2xl p-7 h-full flex flex-col relative group cursor-pointer"
              style={{
                backgroundColor: SURFACE,
                border: '1px solid #27272a',
              }}
              whileHover={{
                y: -4,
                borderColor: `${GOLD}50`,
                boxShadow: `0 0 40px ${GOLD}0a`,
                transition: { duration: 0.3 },
              }}
            >
              {p.badge && (
                <div
                  className="absolute top-4 right-4 text-[10px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${GOLD}12`, color: GOLD_DIM, border: `1px solid ${GOLD}20` }}
                >
                  {p.badge}
                </div>
              )}
              <div className="mb-5 opacity-80">{p.icon}</div>
              <h3
                className="text-lg font-medium text-white mb-3 leading-snug"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {p.title}
              </h3>
              <div className="w-8 h-px mb-3" style={{ backgroundColor: `${GOLD}40` }} />
              <p className="text-sm text-zinc-400 leading-relaxed flex-1">{p.desc}</p>
              <div className="mt-5 flex items-center gap-1.5 text-sm group-hover:gap-2.5 transition-all" style={{ color: GOLD }}>
                <span>Learn more</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// SECTION 3: DRUDGERY CAROUSEL
// ═══════════════════════════════════════════════════════════════

const drudgeryItems = [
  "Reviewing meeting notes hours later trying to remember what was actually said on your morning call, let alone evaluate the deal that was discussed",
  "Manually logging to-dos and status updates in your project management tools one by one — when you remember to, that is",
  "Posting a single tweet for your product launch because that's all your team has bandwidth for, even though you know a multi-channel campaign would be ten times more effective",
  "Digging through contacts and old emails trying to figure out who you've connected with in the past who could actually help with what you're working on right now",
  "Re-explaining your brand voice and positioning every time you hand off a brief to a contractor or team member",
  "Copy-pasting the same company context into yet another AI prompt because the tool has no memory of who you are",
  "Scanning your calendar at 6pm trying to reconstruct what you actually accomplished today",
  "Rebuilding the same spreadsheet analysis you've already done three times, just with slightly different inputs",
  "Writing a follow-up email to someone you met at a conference last week and spending 10 minutes trying to remember what you even talked about",
  "Drafting a proposal from scratch when 80% of it is the same strategic framing you've already articulated a dozen times",
  "Translating a conversation with your co-founder into an actual project plan with owners and deadlines — by hand, after the fact",
  "Staring at a blank content calendar knowing exactly what you want to say but lacking the time to produce it across every channel it should live on",
];

const DrudgeryCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const visibleCount = 3;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % drudgeryItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const getVisibleItems = () => {
    const items = [];
    for (let i = 0; i < visibleCount; i++) {
      items.push(drudgeryItems[(activeIndex + i) % drudgeryItems.length]);
    }
    return items;
  };

  return (
    <section className="py-24 md:py-32 px-6 md:px-16">
      <div className="max-w-3xl mx-auto">
        <RevealText>
          <p className="text-sm font-medium tracking-[0.2em] uppercase mb-6" style={{ color: GOLD }}>
            02 — The Problem
          </p>
        </RevealText>

        <RevealText delay={0.1}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.15] mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <G>You</G>'ve already done the hard thinking.
            <br />
            <span className="text-zinc-500"><G>You</G> just keep having to redo it.</span>
          </h2>
        </RevealText>

        <RevealText delay={0.2}>
          <p className="text-lg text-zinc-400 leading-relaxed mb-12 max-w-2xl">
            <G>You</G>'ve built frameworks that work. <G>You</G> know <G>your</G> customers.
            But somehow most of <G>your</G> day is still spent on the intellectual drudgery
            between the idea and the thing:
          </p>
        </RevealText>

        <RevealText delay={0.3}>
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ backgroundColor: SURFACE, border: '1px solid #1e1e1e' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Top fade */}
            <div
              className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none"
              style={{ background: `linear-gradient(${SURFACE}, transparent)` }}
            />
            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none"
              style={{ background: `linear-gradient(transparent, ${SURFACE})` }}
            />

            <div className="py-8 px-6 md:px-10 space-y-0">
              <AnimatePresence mode="popLayout">
                {getVisibleItems().map((item, i) => (
                  <motion.div
                    key={`${activeIndex}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: i === 1 ? 1 : 0.5, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                    className="py-4"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: GOLD }}
                      />
                      <p
                        className="text-base leading-relaxed"
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontStyle: 'italic',
                          color: i === 1 ? '#a1a1aa' : '#52525b',
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pause indicator */}
            {isPaused && (
              <div className="absolute bottom-3 right-4 text-[10px] text-zinc-600 uppercase tracking-wider">
                Paused
              </div>
            )}
          </div>
        </RevealText>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 4: THE TWO THINGS
// ═══════════════════════════════════════════════════════════════

const TwoThings = () => (
  <section className="py-24 md:py-36 px-6 md:px-16">
    <div className="max-w-3xl mx-auto">
      <RevealText>
        <p className="text-sm font-medium tracking-[0.2em] uppercase mb-12 text-center" style={{ color: GOLD }}>
          03 — The Promise
        </p>
      </RevealText>

      <RevealText delay={0.1}>
        <p
          className="text-xl md:text-2xl text-zinc-400 text-center mb-16"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          We build AI systems that do two things simultaneously.
        </p>
      </RevealText>

      {/* Thing 1 */}
      <RevealText delay={0.2}>
        <div className="mb-16 md:mb-20 text-center">
          <h3
            className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Kill the drudgery.
          </h3>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            The reformatting, the re-explaining, the context-reloading,
            the manual labor between <G>your</G> thinking and its execution —
            automated out of existence. What remains is the rich, creative,
            decision-making work <G>you</G>'re actually here to do.
          </p>
        </div>
      </RevealText>

      {/* Divider */}
      <RevealText delay={0.3}>
        <div className="flex justify-center mb-16 md:mb-20">
          <div className="w-12 h-px" style={{ backgroundColor: `${GOLD}40` }} />
        </div>
      </RevealText>

      {/* Thing 2 */}
      <RevealText delay={0.35}>
        <div className="mb-16 md:mb-20 text-center">
          <h3
            className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Make <G>your</G> best thinking
            <br />show up everywhere.
          </h3>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            <G>Your</G> voice. <G>Your</G> strategy.{' '}
            <G>Your</G> decision-making frameworks.
            Injected into every workflow, every draft, every analysis.
            Automatically. Without <G>you</G> having to bring it each time.
          </p>
        </div>
      </RevealText>

      {/* Closing line */}
      <RevealText delay={0.4}>
        <p
          className="text-xl md:text-2xl text-zinc-300 text-center leading-relaxed max-w-2xl mx-auto"
        >
          The result: AI that doesn't just execute tasks faster.{' '}
          AI that executes them{' '}
          <em style={{ color: GOLD, fontStyle: 'italic' }}>
            the way <G>you</G> would
          </em>{' '}
          — if <G>you</G> had unlimited time and perfect memory.
        </p>
      </RevealText>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// SECTION 5: 3-LAYER STACK
// ═══════════════════════════════════════════════════════════════

const layers = [
  {
    num: '01',
    name: 'Business Context Layer',
    desc: 'We capture how you think, how you operate, who your customers are, what your voice sounds like, how you make decisions. A living foundation that gets richer with every interaction.',
    accent: true,
  },
  {
    num: '02',
    name: 'Data Connections Layer',
    desc: 'Clean integrations to the systems that run your business. One source of truth, not twelve tabs. Your data talks to your context, and your context talks to your tools.',
    accent: false,
  },
  {
    num: '03',
    name: 'AI Apps Layer',
    desc: 'Applications that don\'t just execute tasks — they execute them your way, drawing on everything below. And because the foundation is there, your team builds the next ones themselves.',
    accent: false,
  },
];

const ThreeLayerStack = () => (
  <section className="py-24 md:py-32 px-6 md:px-16">
    <div className="max-w-3xl mx-auto">
      <RevealText>
        <p className="text-sm font-medium tracking-[0.2em] uppercase mb-6" style={{ color: GOLD }}>
          04 — How It Works
        </p>
      </RevealText>

      <RevealText delay={0.1}>
        <h2
          className="text-3xl md:text-4xl font-medium mb-14"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Every system we build sits on three layers.
        </h2>
      </RevealText>

      <div className="space-y-4">
        {/* Render bottom-up visually but top-down in DOM — reversed in display */}
        {[...layers].reverse().map((layer, i) => (
          <RevealText key={layer.num} delay={0.2 + i * 0.15}>
            <div
              className="rounded-xl p-6 md:p-8 relative"
              style={{
                backgroundColor: SURFACE,
                border: layer.accent
                  ? `1px solid ${GOLD}40`
                  : '1px solid #27272a',
                boxShadow: layer.accent ? `0 0 60px ${GOLD}08` : 'none',
              }}
            >
              <div className="flex items-start gap-5">
                <span
                  className="text-xs font-mono mt-1 shrink-0"
                  style={{ color: layer.accent ? GOLD : '#525252' }}
                >
                  {layer.num}
                </span>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {layer.name}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{layer.desc}</p>
                </div>
              </div>
              {/* Connector line below (except last) */}
              {i < layers.length - 1 && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-px h-4" style={{ backgroundColor: '#27272a' }} />
              )}
            </div>
          </RevealText>
        ))}
      </div>

      <RevealText delay={0.7}>
        <p className="text-lg text-zinc-400 mt-12 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          And because the foundation is there,{' '}
          <G>your</G> team builds the next ones themselves.
        </p>
      </RevealText>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// SECTION 6: THE LONG VIEW
// ═══════════════════════════════════════════════════════════════

const LongView = () => {
  const lineRef = useRef(null);
  const lineInView = useInView(lineRef, { once: true, margin: '-40px' });

  return (
    <section
      className="py-28 md:py-40 px-6 md:px-16"
      style={{ background: `linear-gradient(180deg, ${BG} 0%, #080808 50%, ${BG} 100%)` }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <RevealText>
          <p className="text-sm font-medium tracking-[0.2em] uppercase mb-10" style={{ color: GOLD }}>
            05 — The Long View
          </p>
        </RevealText>

        <RevealText delay={0.1}>
          <h2
            className="text-3xl md:text-4xl font-medium leading-snug mb-10"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            The longer <G>you</G> work with our tools,
            the more they feel like an extension
            of <G>your</G> own thinking.
          </h2>
        </RevealText>

        <RevealText delay={0.2}>
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            Most AI tools reset every time you open them. They don't know you.
            Every session starts from zero.
          </p>
        </RevealText>

        <RevealText delay={0.3}>
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            Ours are different. The business context layer accumulates — <G>your</G> strategy
            sharpens, <G>your</G> voice clarifies, <G>your</G> decision-making frameworks
            get more precise. And none of this requires special effort.{' '}
            <G>You</G>'re just doing <G>your</G> work. The system learns from that.
          </p>
        </RevealText>

        <RevealText delay={0.4}>
          <p className="text-lg text-zinc-300 leading-relaxed mb-14">
            Over time, the tools stop feeling like tools. They feel like working
            with someone who already knows everything about <G>your</G> business —
            because they do.
          </p>
        </RevealText>

        <RevealText delay={0.5}>
          <div>
            <p
              className="text-2xl md:text-3xl font-medium"
              style={{ fontFamily: 'Georgia, serif', color: GOLD }}
            >
              That's not our moat. That's <span className="text-white">yours</span>.
            </p>
            {/* Gold underline that draws from center */}
            <div className="flex justify-center mt-4" ref={lineRef}>
              <motion.div
                className="h-px rounded-full"
                style={{ backgroundColor: GOLD }}
                initial={{ width: 0 }}
                animate={lineInView ? { width: 80 } : { width: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              />
            </div>
          </div>
        </RevealText>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 7: CTA
// ═══════════════════════════════════════════════════════════════

const CTA = () => (
  <section className="py-24 md:py-32 px-6 md:px-16 relative overflow-hidden">
    {/* Gold glow */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 500, height: 300,
        background: `radial-gradient(ellipse, ${GOLD}10 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }}
    />

    <div className="max-w-xl mx-auto text-center relative z-10">
      <RevealText>
        <h2
          className="text-3xl md:text-4xl font-medium mb-6"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Start capturing <G>your</G> unique context.
        </h2>
      </RevealText>

      <RevealText delay={0.1}>
        <p className="text-lg text-zinc-400 leading-relaxed mb-4">
          Tell us who you are, how you think, what you do, and what you're
          trying to accomplish right now. Our Clarity Canvas walks you through
          it — and it means that when we have our first conversation,
          we're already fully caught up.
        </p>
      </RevealText>

      <RevealText delay={0.15}>
        <p className="text-base text-zinc-500 mb-10">
          No pitch. No pressure. Just a head start.
        </p>
      </RevealText>

      <RevealText delay={0.2}>
        <div className="flex flex-col items-center gap-4">
          {/* Primary CTA */}
          <motion.button
            className="px-8 py-4 rounded-xl text-base font-semibold transition-colors"
            style={{ backgroundColor: GOLD, color: '#000' }}
            whileHover={{ scale: 1.02, backgroundColor: GOLD_LIGHT }}
            whileTap={{ scale: 0.98 }}
            transition={springSnappy}
          >
            Open the Clarity Canvas →
          </motion.button>

          {/* Secondary CTA */}
          <motion.button
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: '#a3a3a3', border: '1px solid #27272a' }}
            whileHover={{
              color: '#d4d4d8',
              borderColor: '#3f3f46',
              backgroundColor: `${ELEVATED}80`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            Wanna chat with us first? Schedule a call
          </motion.button>
        </div>
      </RevealText>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════

const Footer = () => (
  <footer style={{ borderTop: '1px solid #18181b' }}>
    <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}20, transparent)` }} />
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="text-base font-medium" style={{ fontFamily: 'Georgia, serif' }}>
            <span style={{ color: GOLD }}>33</span>
            <span className="text-zinc-600 ml-1">Strategies</span>
          </span>
          <p className="text-xs text-zinc-700 mt-1">Austin, TX</p>
        </div>
        <div className="flex items-center gap-8 text-sm text-zinc-600">
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">Products</span>
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">Consulting</span>
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">About</span>
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">Contact</span>
        </div>
      </div>
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid #18181b' }}>
        <p className="text-xs text-zinc-800 text-center">
          © 2025 33 Strategies. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════

export default function ThirtyThreeStrategiesHomepage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        * {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }

        ::selection {
          background: ${GOLD}30;
          color: white;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <ProgressBar />
      <Nav />
      <Hero />
      <ThreePillars />
      <DrudgeryCarousel />
      <TwoThings />
      <ThreeLayerStack />
      <LongView />
      <CTA />
      <Footer />
    </div>
  );
}
