'use client';

import React, { useState, useRef, ReactNode, CSSProperties, ChangeEvent } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// ============================================================================
// CONSTANTS
// ============================================================================

const GOLD = '#D4A84B';
const GOLD_DIM = 'rgba(212, 168, 75, 0.15)';
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';
const BG_ELEVATED = '#1a1a1a';

const FULL_ENGAGEMENT = 33000;
const MAX_EQUITY_PERCENT = 3.3;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ViewMode = 'intro' | 'proposal' | 'letsBeGreat';

interface Phase {
  id: string;
  number: number;
  title: string;
  tagline: string;
  traditionalLow: number;
  traditionalHigh: number;
  price: number;
  deliverables: string[];
  walkAway: ReactNode;
}

interface TrackB {
  id: string;
  title: string;
  tagline: string;
  traditionalLow: number;
  traditionalHigh: number;
  price: number;
  deliverables: string[];
}

interface BuildingIconProps {
  phase: number;
  size?: number;
}

interface SectionProps {
  children: ReactNode;
  id: string;
}

interface RevealTextProps {
  children: ReactNode;
  delay?: number;
}

interface ChildrenOnlyProps {
  children: ReactNode;
}

interface BodyTextProps {
  children: ReactNode;
  style?: CSSProperties;
}

interface IntroSlideshowProps {
  onComplete: () => void;
}

interface PhaseCardProps {
  phase: Phase;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: (phaseId: string, selecting: boolean) => void;
}

interface TrackBCardProps {
  isSelected: boolean;
  onToggle: () => void;
}

interface ProposalBuilderProps {
  selectedPhases: string[];
  setSelectedPhases: React.Dispatch<React.SetStateAction<string[]>>;
  includeTrackB: boolean;
  setIncludeTrackB: React.Dispatch<React.SetStateAction<boolean>>;
  equitySlider: number;
  setEquitySlider: React.Dispatch<React.SetStateAction<number>>;
  onNext: () => void;
}

interface WeNeedItem {
  text: string;
  detail: string;
}

interface PlyaCommitment {
  number: number;
  title: string;
  detail: ReactNode;
}

// ============================================================================
// DATA
// ============================================================================

const phases: Phase[] = [
  {
    id: 'foundation',
    number: 1,
    title: 'Foundation',
    tagline: 'Design assets + prototype you own',
    traditionalLow: 13000,
    traditionalHigh: 31000,
    price: 5000,
    deliverables: [
      'Product requirements document (PRD)',
      'User stories & feature specs',
      'User journey mapping',
      'Wireframes',
      'Visual design system',
      'High-fidelity screen designs',
      'Clickable prototype (handoff-ready)'
    ],
    walkAway: <>You have <strong style={{ color: '#fff', fontWeight: 600 }}>a complete design package you own outright</strong> — ready to hand to any developer or use to get accurate build quotes.</>,
  },
  {
    id: 'frame',
    number: 2,
    title: 'Frame',
    tagline: 'Working web app with core functionality',
    traditionalLow: 18000,
    traditionalHigh: 43000,
    price: 12000,
    deliverables: [
      'User system (auth, profiles, database)',
      'Content engine (import, storage, basic tagging)',
      'Calendar/planning (manual plan building, daily view)',
      'Frontend build (mobile-first web app)',
      'QA, deployment, hosting setup'
    ],
    walkAway: <>You have <strong style={{ color: '#fff', fontWeight: 600 }}>a live app real users can sign up for</strong> — ready to start generating feedback and behavioral data.</>,
  },
  {
    id: 'finish',
    number: 3,
    title: 'Finish',
    tagline: 'The AI layer that makes it magic',
    traditionalLow: 12000,
    traditionalHigh: 28000,
    price: 10000,
    deliverables: [
      'AI content tagging (muscle groups, intensity, duration, equipment)',
      'AI coach chat (contextual responses, understands user profile)',
      'Smart plan generation (AI builds plans based on goals)',
      'Plan modification via chat'
    ],
    walkAway: <>You have <strong style={{ color: '#fff', fontWeight: 600 }}>the full PLYA vision realized</strong> — an AI-powered fitness experience that stands apart from everything else.</>,
  }
];

const trackB: TrackB = {
  id: 'strategy',
  title: 'Strategy & Go-to-Market',
  tagline: 'The foundation to talk about PLYA coherently',
  traditionalLow: 9000,
  traditionalHigh: 19000,
  price: 6000,
  deliverables: [
    'Target persona refinement & documentation',
    'Business plan & strategy deck (investor/partner-ready)',
    'User feedback framework',
    'Feedback synthesis & recommendations',
    'Landing page / marketing website'
  ],
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const BuildingIcon: React.FC<BuildingIconProps> = ({ phase, size = 48 }) => {
  const color = GOLD;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="38" width="36" height="4" fill={color} rx="1" />
      {phase >= 2 && (
        <>
          <rect x="8" y="20" width="4" height="18" fill="none" stroke={color} strokeWidth={2} />
          <rect x="36" y="20" width="4" height="18" fill="none" stroke={color} strokeWidth={2} />
          <path d="M6 22 L24 8 L42 22" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {phase >= 3 && (
        <>
          <rect x="8" y="20" width="4" height="18" fill={color} />
          <rect x="36" y="20" width="4" height="18" fill={color} />
          <path d="M6 22 L24 8 L42 22 L24 14 Z" fill={color} />
          {/* Chimney */}
          <rect x="32" y="6" width="5" height="10" fill={color} />
          {/* Door with gold outline */}
          <rect x="20" y="28" width="8" height="10" fill={BG_PRIMARY} rx="1" stroke={color} strokeWidth={1.5} />
          {/* Window with gold outline and crosshairs */}
          <rect x="30" y="24" width="6" height="6" fill={BG_PRIMARY} rx="0.5" stroke={color} strokeWidth={1.5} />
          <line x1="33" y1="24" x2="33" y2="30" stroke={color} strokeWidth={1} />
          <line x1="30" y1="27" x2="36" y2="27" stroke={color} strokeWidth={1} />
        </>
      )}
    </svg>
  );
};

const ProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 3,
        background: GOLD, transformOrigin: 'left', zIndex: 100, scaleX
      }}
    />
  );
};

const Section: React.FC<SectionProps> = ({ children, id }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '64px 24px', position: 'relative',
      }}
    >
      {children}
    </motion.section>
  );
};

const RevealText: React.FC<RevealTextProps> = ({ children, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
};

const SectionLabel: React.FC<ChildrenOnlyProps> = ({ children }) => (
  <p style={{ color: GOLD, fontSize: 12, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
    {children}
  </p>
);

const Headline: React.FC<ChildrenOnlyProps> = ({ children }) => (
  <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 500, lineHeight: 1.15, color: '#fff', marginBottom: 24 }}>
    {children}
  </h2>
);

const BodyText: React.FC<BodyTextProps> = ({ children, style = {} }) => (
  <p style={{ fontSize: 18, lineHeight: 1.7, color: '#a3a3a3', maxWidth: 600, ...style }}>{children}</p>
);

// ============================================================================
// INTRO SLIDESHOW
// ============================================================================

const IntroSlideshow: React.FC<IntroSlideshowProps> = ({ onComplete }) => {
  return (
    <div style={{ background: BG_PRIMARY, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <ProgressBar />

      <Section id="where-you-are">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <RevealText><SectionLabel>Where You Are</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>We've started to build the <span style={{ color: GOLD }}>foundations</span>.</Headline>
          </RevealText>
          <RevealText delay={0.2}>
            <BodyText>Together, we've worked through the product vision, mapped out user journeys, and built some initial prototypes that bring the PLYA concept to life.</BodyText>
          </RevealText>
          <RevealText delay={0.3}>
            <div style={{ marginTop: 32, padding: 24, background: BG_SURFACE, borderRadius: 16, border: '1px solid rgba(212, 168, 75, 0.2)' }}>
              <p style={{ fontSize: 14, color: '#737373', marginBottom: 8 }}>What this type of work typically costs:</p>
              <p style={{ fontSize: 28, fontWeight: 600, color: GOLD }}>$15K – $30K</p>
              <p style={{ fontSize: 14, color: '#737373', marginTop: 8 }}>4-6 weeks at agencies and design firms</p>
            </div>
          </RevealText>
        </div>
      </Section>

      <Section id="zero-to-one">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <RevealText><SectionLabel>Getting from Zero to One</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>You need a <span style={{ color: GOLD }}>real app</span> that real people can use.</Headline>
          </RevealText>
          <RevealText delay={0.2}>
            <BodyText>The goal isn't perfection — it's learning. You need something in people's hands so you can start gathering feedback on what they love and what they don't, and collect data on how they're actually using it.</BodyText>
          </RevealText>
          <RevealText delay={0.3}>
            <BodyText style={{ marginTop: 20 }}>That's how you rapidly iterate and improve. Not by guessing, but by learning from real behavior.</BodyText>
          </RevealText>
          <RevealText delay={0.4}>
            <div style={{ marginTop: 40, padding: 24, background: BG_SURFACE, borderRadius: 16, border: '1px solid #27272a' }}>
              <p style={{ fontSize: 16, color: '#fff', marginBottom: 12 }}>The good news:</p>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: '#a3a3a3' }}>You don't need a full native mobile application for that. A <span style={{ color: GOLD }}>mobile-first web app</span> that looks and feels native — but runs in the browser — is more than sufficient.</p>
              <p style={{ fontSize: 15, color: '#737373', marginTop: 16 }}>And it can be built much faster and cheaper.</p>
            </div>
          </RevealText>
        </div>
      </Section>

      <Section id="scope">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <RevealText><SectionLabel>The Scope</SectionLabel></RevealText>
          <RevealText delay={0.1}><Headline>Here's what we're <span style={{ color: GOLD }}>building</span>.</Headline></RevealText>
          <RevealText delay={0.15}><BodyText style={{ marginBottom: 40 }}>Just so we're being explicit about it — these are the key features and components of the product:</BodyText></RevealText>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {[
              { icon: '👤', title: 'User System', desc: 'Accounts, profiles, secure login, personal settings' },
              { icon: '📚', title: 'Content Engine', desc: 'Import URLs, store workouts, organize your library' },
              { icon: '📅', title: 'Daily Planning', desc: 'Build workout plans, calendar view, track completion' },
              { icon: '🤖', title: 'AI Coach', desc: 'Smart tagging, personalized plans, natural chat interface' },
              { icon: '📱', title: 'Mobile-First App', desc: 'Looks and feels native, runs in any browser' },
            ].map((item, i) => (
              <RevealText key={i} delay={0.2 + i * 0.08}>
                <div style={{ padding: 24, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </Section>

      <Section id="work-required">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <RevealText><SectionLabel>The Work</SectionLabel></RevealText>
          <RevealText delay={0.1}><Headline>What it takes to <span style={{ color: GOLD }}>get there</span>.</Headline></RevealText>
          <RevealText delay={0.15}><BodyText style={{ marginBottom: 40 }}>Here's an outline of the work that has to be done to turn prototypes into a real product:</BodyText></RevealText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { phase: 'Foundation', items: 'PRD, user stories, wireframes, design system, high-fidelity screens, clickable prototype' },
              { phase: 'Core Build', items: 'User auth, database setup, content storage, basic frontend architecture' },
              { phase: 'Feature Development', items: 'Content import/tagging, calendar/planning UI, daily workout views, progress tracking' },
              { phase: 'AI Integration', items: 'Smart tagging, plan generation, chat interface, contextual adjustments' },
              { phase: 'Launch Prep', items: 'QA testing, deployment, hosting, bug fixes, polish' },
            ].map((item, i) => (
              <RevealText key={i} delay={0.2 + i * 0.08}>
                <div style={{ display: 'flex', gap: 20, padding: 20, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: GOLD, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{item.phase}</h3>
                    <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.5 }}>{item.items}</p>
                  </div>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </Section>

      <Section id="traditional">
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <RevealText><SectionLabel>The Traditional Path</SectionLabel></RevealText>
          <RevealText delay={0.1}><Headline>What this <span style={{ color: GOLD }}>usually</span> costs.</Headline></RevealText>
          <RevealText delay={0.2}>
            <div style={{ marginTop: 40, padding: 48, background: BG_SURFACE, borderRadius: 24, border: '1px solid #27272a' }}>
              <p style={{ fontSize: 64, fontWeight: 700, color: '#fff', marginBottom: 8 }}>$40K – $100K</p>
              <p style={{ fontSize: 24, color: '#737373' }}>4 – 6 months</p>
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #27272a' }}>
                <p style={{ fontSize: 16, color: '#a3a3a3', lineHeight: 1.7 }}>That's what agencies and freelance teams typically charge to go from prototype to working web app — and that timeline assumes no major hiccups along the way.</p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      <Section id="our-path">
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <RevealText><SectionLabel>Our Path</SectionLabel></RevealText>
          <RevealText delay={0.1}><Headline>A <span style={{ color: GOLD }}>different</span> equation.</Headline></RevealText>
          <RevealText delay={0.2}>
            <div style={{ marginTop: 40, padding: 48, background: BG_SURFACE, borderRadius: 24, border: `2px solid ${GOLD}`, boxShadow: `0 0 60px ${GOLD_DIM}` }}>
              <p style={{ fontSize: 64, fontWeight: 700, color: GOLD, marginBottom: 8 }}>$27K</p>
              <p style={{ fontSize: 24, color: '#a3a3a3' }}>~8 weeks</p>
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(212, 168, 75, 0.3)' }}>
                <p style={{ fontSize: 16, color: '#a3a3a3', lineHeight: 1.7 }}>For the complete product build — Foundation, Frame, and Finish — with a mobile-first web app that's ready for real users.</p>
                <p style={{ fontSize: 14, color: '#737373', marginTop: 16 }}>(You can also start smaller and build in stages)</p>
              </div>
            </div>
          </RevealText>
          <RevealText delay={0.4}>
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ padding: '12px 20px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: 8, border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                <span style={{ color: '#4ade80', fontSize: 14, fontWeight: 500 }}>Save $13K – $73K</span>
              </div>
              <div style={{ padding: '12px 20px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: 8, border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                <span style={{ color: '#4ade80', fontSize: 14, fontWeight: 500 }}>2-4 months faster</span>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      <Section id="strategy">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <RevealText><SectionLabel>Beyond the Build</SectionLabel></RevealText>
          <RevealText delay={0.1}><Headline>Strategy & <span style={{ color: GOLD }}>Go-to-Market</span></Headline></RevealText>
          <RevealText delay={0.2}><BodyText style={{ marginBottom: 32 }}>Building the product is one thing. Knowing how to talk about it, who to target, and how to learn from early users is another. We can help with that too.</BodyText></RevealText>
          <RevealText delay={0.3}>
            <div style={{ padding: 32, background: BG_SURFACE, borderRadius: 16, border: '1px solid #27272a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
                {['Target persona refinement', 'Business plan & strategy deck', 'User feedback framework', 'Landing page / website'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
                    <span style={{ fontSize: 15, color: '#a3a3a3' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 24, borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 14, color: '#737373' }}>Traditional cost:</p>
                  <p style={{ fontSize: 16, color: '#a3a3a3', textDecoration: 'line-through' }}>$9K – $19K</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 14, color: '#737373' }}>Add to your engagement:</p>
                  <p style={{ fontSize: 28, fontWeight: 600, color: GOLD }}>$6,000</p>
                </div>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      <Section id="timeline">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <RevealText><SectionLabel>How It Unfolds</SectionLabel></RevealText>
          <RevealText delay={0.1}><Headline>Two tracks, <span style={{ color: GOLD }}>working in parallel</span>.</Headline></RevealText>
          <RevealText delay={0.2}>
            <div style={{ marginTop: 40, padding: 32, background: BG_SURFACE, borderRadius: 16, border: '1px solid #27272a', overflowX: 'auto' }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Track A — Product Build</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, minWidth: 600 }}>
                  {[
                    { week: 'Week 1-2', phase: 'Foundation', detail: 'PRD, Design, Prototype' },
                    { week: 'Week 3-4', phase: 'Frame', detail: 'Auth, Database, Frontend' },
                    { week: 'Week 5-6', phase: 'Frame', detail: 'Content, Calendar, QA' },
                    { week: 'Week 7-8', phase: 'Finish', detail: 'AI Layer, Polish, Deploy' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 16, background: BG_ELEVATED, borderRadius: 8, borderTop: `3px solid ${GOLD}` }}>
                      <p style={{ fontSize: 11, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.week}</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 8 }}>{item.phase}</p>
                      <p style={{ fontSize: 13, color: '#a3a3a3', marginTop: 4 }}>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Track B — Strategy & Go-to-Market</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, minWidth: 600 }}>
                  {[
                    { week: 'Week 1-2', item: 'Personas' },
                    { week: 'Week 3-4', item: 'Strategy Deck' },
                    { week: 'Week 5-6', item: 'Landing Page' },
                    { week: 'Week 7-8', item: 'Feedback System' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 16, background: BG_ELEVATED, borderRadius: 8, borderTop: '3px solid #4ade80' }}>
                      <p style={{ fontSize: 11, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.week}</p>
                      <p style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginTop: 8 }}>{item.item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      <Section id="proposal-intro">
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <RevealText><SectionLabel>Your Proposal</SectionLabel></RevealText>
          <RevealText delay={0.1}><Headline>You decide how far we go <span style={{ color: GOLD }}>together</span>.</Headline></RevealText>
          <RevealText delay={0.2}><BodyText style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>The next section lets you build your engagement — choose the stages that make sense for where you are and where you want to go.</BodyText></RevealText>
          <RevealText delay={0.3}>
            <motion.button onClick={onComplete} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ marginTop: 48, padding: '20px 48px', fontSize: 18, fontWeight: 600, background: GOLD, color: BG_PRIMARY, border: 'none', borderRadius: 12, cursor: 'pointer' }}>
              Build Your Proposal →
            </motion.button>
          </RevealText>
        </div>
      </Section>
    </div>
  );
};

// ============================================================================
// PHASE & TRACK CARDS
// ============================================================================

const PhaseCard: React.FC<PhaseCardProps> = ({ phase, isSelected, isLocked, onSelect }) => {
  const handleClick = (): void => {
    if (isLocked) return;
    onSelect(phase.id, !isSelected);
  };

  return (
    <motion.div onClick={handleClick} whileHover={!isLocked ? { scale: 1.01 } : {}}
      style={{ padding: 24, background: isSelected ? BG_ELEVATED : BG_SURFACE, borderRadius: 16, border: `2px solid ${isSelected ? GOLD : '#27272a'}`, cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1, transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <BuildingIcon phase={phase.number} size={48} />
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{phase.title}</h3>
            <p style={{ fontSize: 14, color: '#737373' }}>{phase.tagline}</p>
          </div>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${isSelected ? GOLD : '#525252'}`, background: isSelected ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isSelected && <span style={{ color: BG_PRIMARY, fontSize: 14 }}>✓</span>}
        </div>
      </div>
      
      <div style={{ marginBottom: 24, flex: 1 }}>
        <p style={{ fontSize: 13, color: '#525252', marginBottom: 8 }}>Deliverables:</p>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: '#a3a3a3', lineHeight: 1.8 }}>
          {phase.deliverables.slice(0, 4).map((d, i) => <li key={i}>{d}</li>)}
          {phase.deliverables.length > 4 && <li style={{ color: '#737373' }}>+{phase.deliverables.length - 4} more</li>}
        </ul>
      </div>

      {/* The Outcome — what this phase delivers */}
      <div style={{ 
        marginBottom: 24,
        padding: 16,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        borderLeft: `3px solid ${GOLD}`,
      }}>
        <p style={{ fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 500 }}>After this phase</p>
        <p style={{ 
          fontSize: 15, 
          color: '#e5e5e5',
          lineHeight: 1.55, 
          margin: 0,
        }}>
          {phase.walkAway}
        </p>
      </div>

      <div style={{ paddingTop: 16, borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 12, color: '#525252' }}>Traditional:</p>
          <p style={{ fontSize: 14, color: '#737373', textDecoration: 'line-through' }}>${phase.traditionalLow.toLocaleString()} – ${phase.traditionalHigh.toLocaleString()}</p>
        </div>
        <p style={{ fontSize: 28, fontWeight: 700, color: GOLD }}>${phase.price.toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

const TrackBCard: React.FC<TrackBCardProps> = ({ isSelected, onToggle }) => (
  <motion.div onClick={onToggle} whileHover={{ scale: 1.01 }}
    style={{ padding: 24, background: isSelected ? BG_ELEVATED : BG_SURFACE, borderRadius: 16, border: `2px solid ${isSelected ? '#4ade80' : '#27272a'}`, cursor: 'pointer', transition: 'all 0.2s ease' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(74, 222, 128, 0.15)', borderRadius: 20, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>Track B</span>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{trackB.title}</h3>
        <p style={{ fontSize: 14, color: '#737373' }}>{trackB.tagline}</p>
      </div>
      <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${isSelected ? '#4ade80' : '#525252'}`, background: isSelected ? '#4ade80' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isSelected && <span style={{ color: BG_PRIMARY, fontSize: 14 }}>✓</span>}
      </div>
    </div>
    <div style={{ marginBottom: 20 }}>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: '#a3a3a3', lineHeight: 1.8 }}>
        {trackB.deliverables.map((d, i) => <li key={i}>{d}</li>)}
      </ul>
    </div>
    <div style={{ paddingTop: 16, borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <p style={{ fontSize: 12, color: '#525252' }}>Traditional:</p>
        <p style={{ fontSize: 14, color: '#737373', textDecoration: 'line-through' }}>${trackB.traditionalLow.toLocaleString()} – ${trackB.traditionalHigh.toLocaleString()}</p>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#4ade80' }}>${trackB.price.toLocaleString()}</p>
    </div>
  </motion.div>
);

// ============================================================================
// EQUITY EXPLAINER
// ============================================================================

const EquityExplainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div style={{ marginTop: 24, padding: 20, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', fontSize: 14 }}>
        <span>How do we determine the equity amount?</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {isOpen && (
        <div style={{ marginTop: 16, fontSize: 14, color: '#737373', lineHeight: 1.7 }}>
          <p style={{ marginBottom: 12 }}>We use a framework that values contributions across six phases of company-building: Legacy (prior patterns and systems we bring), Discovery, Creation, Validation, Growth, and Operations.</p>
          <p style={{ marginBottom: 12 }}>For PLYA, our work falls primarily in Legacy and Creation — roughly 20-25% of zero-to-one value.</p>
          <p style={{ marginBottom: 12 }}>We discount that significantly (~85%) because we're getting paid, the harder work of validation and growth is ahead of you, and our philosophy prioritizes your success.</p>
          <p>The result: up to 3.3% equity at maximum conversion. Enough to align our interests in your success, but not so much that it undervalues everything you'll do after v1 ships.</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PROPOSAL BUILDER
// ============================================================================

const ProposalBuilder: React.FC<ProposalBuilderProps> = ({ 
  selectedPhases, 
  setSelectedPhases, 
  includeTrackB, 
  setIncludeTrackB, 
  equitySlider, 
  setEquitySlider, 
  onNext 
}) => {
  const phaseTotal = selectedPhases.reduce((sum, id) => {
    const phase = phases.find(p => p.id === id);
    return sum + (phase?.price || 0);
  }, 0);
  const trackBTotal = includeTrackB ? trackB.price : 0;
  const totalPrice = phaseTotal + trackBTotal;

  const traditionalLow = selectedPhases.reduce((sum, id) => {
    const phase = phases.find(p => p.id === id);
    return sum + (phase?.traditionalLow || 0);
  }, 0) + (includeTrackB ? trackB.traditionalLow : 0);

  const traditionalHigh = selectedPhases.reduce((sum, id) => {
    const phase = phases.find(p => p.id === id);
    return sum + (phase?.traditionalHigh || 0);
  }, 0) + (includeTrackB ? trackB.traditionalHigh : 0);

  const maxEquity = (totalPrice / FULL_ENGAGEMENT) * MAX_EQUITY_PERCENT;
  const equityPercent = (equitySlider / 33) * maxEquity;
  const cashDiscount = (equitySlider / 100) * totalPrice;
  const cashDue = totalPrice - cashDiscount;

  const handlePhaseSelect = (phaseId: string, selecting: boolean): void => {
    if (selecting) {
      const phaseIndex = phases.findIndex(p => p.id === phaseId);
      const prerequisitePhases = phases.slice(0, phaseIndex + 1).map(p => p.id);
      setSelectedPhases(prerequisitePhases);
    } else {
      const phaseIndex = phases.findIndex(p => p.id === phaseId);
      const remainingPhases = phases.slice(0, phaseIndex).map(p => p.id);
      setSelectedPhases(remainingPhases);
    }
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEquitySlider(parseInt(e.target.value));
  };

  return (
    <div style={{ minHeight: '100vh', background: BG_PRIMARY, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", padding: '64px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: GOLD, fontSize: 12, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Build Your Engagement</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500, marginBottom: 16 }}>PLYA <span style={{ color: GOLD }}>×</span> 33 Strategies</h1>
        </div>

        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>Track A — Product Build</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {phases.map((phase) => {
              const isSelected = selectedPhases.includes(phase.id);
              return <PhaseCard key={phase.id} phase={phase} isSelected={isSelected} isLocked={false} onSelect={handlePhaseSelect} />;
            })}
          </div>
        </div>

        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>Track B — Strategy & Go-to-Market</h2>
          <TrackBCard isSelected={includeTrackB} onToggle={() => setIncludeTrackB(!includeTrackB)} />
        </div>

        {totalPrice > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 32, background: BG_SURFACE, borderRadius: 20, border: `1px solid ${GOLD}` }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Your Selection</h3>
            <div style={{ marginBottom: 24 }}>
              {selectedPhases.map(id => {
                const phase = phases.find(p => p.id === id);
                return phase ? (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #27272a' }}>
                    <span style={{ color: '#a3a3a3' }}>{phase.title}</span>
                    <span style={{ color: '#fff', fontWeight: 500 }}>${phase.price.toLocaleString()}</span>
                  </div>
                ) : null;
              })}
              {includeTrackB && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #27272a' }}>
                  <span style={{ color: '#a3a3a3' }}>Strategy & Go-to-Market</span>
                  <span style={{ color: '#fff', fontWeight: 500 }}>${trackB.price.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #27272a' }}>
              <div>
                <p style={{ fontSize: 13, color: '#525252', marginBottom: 4 }}>Traditional cost:</p>
                <p style={{ fontSize: 18, color: '#737373', textDecoration: 'line-through' }}>${traditionalLow.toLocaleString()} – ${traditionalHigh.toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, color: '#525252', marginBottom: 4 }}>Your investment:</p>
                <p style={{ fontSize: 32, fontWeight: 700, color: GOLD }}>${totalPrice.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Payment Structure</h4>
              <div style={{ marginBottom: 16 }}>
                <input 
                  type="range" 
                  min="0" 
                  max="33" 
                  value={equitySlider} 
                  onChange={handleSliderChange}
                  style={{ width: '100%', height: 8, borderRadius: 4, background: `linear-gradient(to right, ${GOLD} ${equitySlider * 3}%, #27272a ${equitySlider * 3}%)`, cursor: 'pointer', WebkitAppearance: 'none' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#525252', marginTop: 8 }}>
                  <span>100% Cash</span>
                  <span>67% Cash / {MAX_EQUITY_PERCENT.toFixed(1)}% Equity</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, padding: 20, background: BG_ELEVATED, borderRadius: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Cash due</p>
                  <p style={{ fontSize: 24, fontWeight: 600, color: '#fff' }}>${Math.round(cashDue).toLocaleString()}</p>
                </div>
                {equitySlider > 0 && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Equity</p>
                    <p style={{ fontSize: 24, fontWeight: 600, color: GOLD }}>{equityPercent.toFixed(2)}%</p>
                  </div>
                )}
              </div>
              <EquityExplainer />
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        {totalPrice > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
            style={{ marginTop: 48, textAlign: 'center' }}
          >
            <motion.button
              onClick={onNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '20px 48px',
                fontSize: 18,
                fontWeight: 600,
                background: GOLD,
                color: BG_PRIMARY,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              I'm in. What's next?
            </motion.button>
            <p style={{ fontSize: 14, color: '#525252', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
              Don't worry — you're not committing to anything yet. We'll send the real paperwork later if you decide to move forward.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// LET'S BE GREAT PAGE
// ============================================================================

const LetsBeGreat: React.FC = () => {
  const weBring: string[] = [
    'Deep expertise in AI product development',
    'Hands-on guidance through every critical decision',
    'Technical execution and implementation support',
    'Frameworks from successful 0→1 journeys',
    'Candid feedback when needed',
  ];

  const weNeed: WeNeedItem[] = [
    { text: 'Weekly commitment', detail: '10-15 hours minimum' },
    { text: 'Ownership', detail: 'Drive your vision — we guide, you decide' },
    { text: 'Responsiveness', detail: '24-48 hour turnaround on decisions' },
    { text: 'User access', detail: 'Direct line to early users' },
    { text: 'Transparency', detail: 'Open communication about constraints' },
  ];

  const plyaCommitments: PlyaCommitment[] = [
    { number: 1, title: 'Athlete Network', detail: <>Identify <strong style={{ color: '#fff' }}>25 athletes</strong> with 1,000+ followers who will test PLYA</> },
    { number: 2, title: 'User Feedback', detail: <>Conduct weekly user interviews — <strong style={{ color: '#fff' }}>minimum 5 per week</strong>, starting in week four</> },
    { number: 3, title: 'Responsiveness', detail: <>Respond within <strong style={{ color: '#fff' }}>a few hours</strong> (even just an acknowledgment) unless something wild is happening</> },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: BG_PRIMARY, 
      color: '#fff', 
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '80px 24px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ 
            color: GOLD, 
            fontSize: 12, 
            fontWeight: 500, 
            letterSpacing: '0.2em', 
            textTransform: 'uppercase', 
            marginBottom: 16 
          }}>
            The Partnership
          </p>
          <h1 style={{ 
            fontFamily: "'Playfair Display', Georgia, serif", 
            fontSize: 'clamp(40px, 6vw, 64px)', 
            fontWeight: 500, 
            marginBottom: 24,
            color: '#fff',
          }}>
            Let's Be <span style={{ color: GOLD }}>Great</span>
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: '#a3a3a3', 
            maxWidth: 600, 
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            You're hiring us because you want to build something exceptional. Our job isn't just to execute — it's to push you, challenge you, and hold you accountable so we achieve something great together.
          </p>
        </div>

        {/* Two Columns: What We Bring / What We Need */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 24,
          marginBottom: 48,
        }}>
          {/* What We Bring */}
          <div style={{ 
            padding: 32, 
            background: BG_SURFACE, 
            borderRadius: 16, 
            border: '1px solid #27272a',
          }}>
            <h2 style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: '#4ade80', 
              letterSpacing: '0.1em', 
              textTransform: 'uppercase', 
              marginBottom: 24,
            }}>
              What We Bring
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {weBring.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: '#4ade80', fontSize: 16, marginTop: 2 }}>✓</span>
                  <span style={{ fontSize: 15, color: '#d4d4d4', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What We Need */}
          <div style={{ 
            padding: 32, 
            background: BG_SURFACE, 
            borderRadius: 16, 
            border: '1px solid #27272a',
          }}>
            <h2 style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: GOLD, 
              letterSpacing: '0.1em', 
              textTransform: 'uppercase', 
              marginBottom: 24,
            }}>
              What We Need From You
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {weNeed.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: GOLD, fontSize: 14, marginTop: 3 }}>→</span>
                  <div>
                    <span style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>{item.text}</span>
                    <span style={{ fontSize: 15, color: '#737373' }}> — {item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PLYA Specific Commitments */}
        <div style={{ 
          padding: 32, 
          background: BG_SURFACE, 
          borderRadius: 20, 
          border: `2px solid ${GOLD}`,
          marginBottom: 64,
        }}>
          <h2 style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: GOLD, 
            letterSpacing: '0.1em', 
            textTransform: 'uppercase', 
            marginBottom: 8,
          }}>
            Your Commitments
          </h2>
          <p style={{ 
            fontSize: 24, 
            fontWeight: 500, 
            color: '#fff', 
            marginBottom: 12,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            For PLYA
          </p>
          <p style={{ 
            fontSize: 15, 
            color: '#737373', 
            marginBottom: 32,
            lineHeight: 1.6,
          }}>
            Over the course of our 8-week engagement, here's what we need from you:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {plyaCommitments.map((item) => (
              <div key={item.number} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 16,
                padding: 20,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
              }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: GOLD_DIM, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: GOLD,
                  flexShrink: 0,
                }}>
                  {item.number}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: 15, color: '#a3a3a3', lineHeight: 1.5, margin: 0 }}>
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div style={{ 
          textAlign: 'center',
          padding: 48,
          background: BG_SURFACE,
          borderRadius: 16,
          border: '1px solid #27272a',
        }}>
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 500, 
            color: '#fff', 
            marginBottom: 16,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            What Happens Next
          </h3>
          <p style={{ fontSize: 16, color: '#a3a3a3', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 24px' }}>
            We're scheduled to talk <strong style={{ color: '#fff' }}>Thursday at 2pm CT</strong>. After we finalize everything on that call, we'll send over the official <em>Let's Be Great</em> commitment along with the contract paperwork via our eSign platform.
          </p>
          <p style={{ fontSize: 14, color: '#525252' }}>
            Looking forward to building something brilliant together.
          </p>
        </div>

        {/* 33 Strategies Wordmark */}
        <div style={{ 
          marginTop: 64, 
          paddingTop: 32, 
          borderTop: '1px solid #1a1a1a',
          textAlign: 'center',
        }}>
          <p style={{ 
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 24,
            fontWeight: 500,
            color: '#525252',
            margin: 0,
          }}>
            <span style={{ color: GOLD }}>33</span> Strategies
          </p>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PLYAProposal(): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [includeTrackB, setIncludeTrackB] = useState<boolean>(false);
  const [equitySlider, setEquitySlider] = useState<number>(0);

  if (viewMode === 'intro') {
    return <IntroSlideshow onComplete={() => setViewMode('proposal')} />;
  }

  if (viewMode === 'proposal') {
    return (
      <ProposalBuilder
        selectedPhases={selectedPhases}
        setSelectedPhases={setSelectedPhases}
        includeTrackB={includeTrackB}
        setIncludeTrackB={setIncludeTrackB}
        equitySlider={equitySlider}
        setEquitySlider={setEquitySlider}
        onNext={() => setViewMode('letsBeGreat')}
      />
    );
  }

  return <LetsBeGreat />;
}
