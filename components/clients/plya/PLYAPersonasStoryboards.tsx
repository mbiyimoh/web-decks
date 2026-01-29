'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GOLD,
  GOLD_DIM,
  BG_PRIMARY,
  BG_ELEVATED,
  GREEN,
  BLUE,
  RED,
} from '@/components/portal/design-tokens';
import { personaIcons, quickFactIcons } from './persona-icons';

// Component-specific tokens not in shared design-tokens
const GOLD_GLOW = 'rgba(212, 165, 74, 0.3)';
const BG_CARD = 'rgba(255, 255, 255, 0.03)';
const BG_TERTIARY = '#18181f';
const TEXT_PRIMARY = '#f5f5f5';
const TEXT_MUTED = '#888888';
const TEXT_DIM = '#555555';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const PURPLE = '#a78bfa';
const AMBER = '#fbbf24';

// ============================================
// PERSONA DATA
// ============================================

interface QuickFact {
  icon: string;
  label: string;
  value: string;
}

interface Differentiator {
  text: string;
}

interface StoryFrame {
  title: string;
  sceneIcon: React.ReactNode;
  description: string;
  thought: string;
  emotion: string;
  emotionColor: string;
}

interface PersonaData {
  id: string;
  name: string;
  title: string;
  quote: string;
  gradient: string;
  avatarIcon: React.ReactNode;
  quickFacts: QuickFact[];
  jobsToBeDone: string[];
  painPoints: string[];
  emotionalNeeds: string[];
  sensitivities: string[];
  differentiators: Differentiator[];
  opportunity: string;
  asIs: StoryFrame[];
  toBe: StoryFrame[];
}

const personas: Record<string, PersonaData> = {
  athlete: {
    id: 'athlete',
    name: 'Jordan',
    title: 'The Aspiring Athlete',
    quote: "I know what I want — I just need a system that actually works with my life.",
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    avatarIcon: personaIcons.athlete,
    quickFacts: [
      { icon: 'time', label: 'Time', value: '~1 hour, evenings' },
      { icon: 'discovery', label: 'Discovery', value: 'Social media, peers' },
      { icon: 'results', label: 'Results', value: '1-3 months' },
      { icon: 'trust', label: 'Trusts', value: 'Self + close peers' },
    ],
    jobsToBeDone: [
      'Find workouts that match my level & goals',
      'Build a routine without daily planning',
      'Track progress and see measurable gains',
      'Stay accountable without expensive trainer',
    ],
    painPoints: [
      'Cognitive load of picking/comparing workouts daily',
      "Apps feel repetitive and don't adapt to progress",
      'Personal training effective but unaffordable',
      'No long-term system that evolves with them',
    ],
    emotionalNeeds: ['Accomplished', 'In control', 'Cared for', 'Perceived as competent'],
    sensitivities: ['Complexity', 'Cost', 'Generic/basic solutions', 'One-size-fits-all'],
    differentiators: [
      { text: 'Identity matters — wants to be seen as competent in fitness space' },
      { text: 'Higher bar for credibility — generic solutions rejected' },
      { text: 'Actively compares what pros/experts do' },
      { text: 'Willing to work hard — blocked by planning friction, not motivation' },
    ],
    opportunity: 'Decisive, adaptive system that removes planning friction while feeling credible enough for serious training.',
    asIs: [
      {
        title: 'Discovery Overload',
        sceneIcon: personaIcons.scroll,
        description: 'Scrolling Instagram at night, 15 tabs of workout videos saved. Thousands of options, zero curation.',
        thought: '"Which one should I do tomorrow?"',
        emotion: 'Overwhelmed',
        emotionColor: RED,
      },
      {
        title: 'The Assembly Problem',
        sceneIcon: personaIcons.notes,
        description: 'Trying to piece together a routine from scattered bookmarks. No system connects them.',
        thought: '"Do these even work together?"',
        emotion: 'Uncertain',
        emotionColor: AMBER,
      },
      {
        title: 'The Skip',
        sceneIcon: personaIcons.sad,
        description: "Evening after work, tired. Looks at messy plan, doesn't know where to start.",
        thought: '"I\'ll just do it tomorrow."',
        emotion: 'Defeated',
        emotionColor: RED,
      },
      {
        title: 'The App Graveyard',
        sceneIcon: personaIcons.apps,
        description: 'Five fitness apps, all with the same generic library. None know his sport, level, or goals.',
        thought: '"None of these are for ME."',
        emotion: 'Disappointed',
        emotionColor: AMBER,
      },
      {
        title: 'The Expensive Option',
        sceneIcon: personaIcons.money,
        description: 'The only personalized option is a human trainer. $100+ per session.',
        thought: '"I can\'t afford this."',
        emotion: 'Stuck',
        emotionColor: RED,
      },
      {
        title: 'The Plateau',
        sceneIcon: personaIcons.decline,
        description: '2 months later, no visible progress. Random content never added up to a real program.',
        thought: '"Why isn\'t anything changing?"',
        emotion: 'Discouraged',
        emotionColor: RED,
      },
    ],
    toBe: [
      {
        title: 'Instant Plan',
        sceneIcon: personaIcons.clipboard,
        description: '5 questions: sport, goals, schedule, injuries. 60 seconds. PLYA builds week one from 10,000+ curated videos.',
        thought: '"Your first week is ready. 4 sessions, tailored to you."',
        emotion: 'Wow',
        emotionColor: GREEN,
      },
      {
        title: 'One Place to Search',
        sceneIcon: personaIcons.library,
        description: 'Searches "explosive plyometrics" in PLYA. Gets 8 curated results, tagged by difficulty and equipment.',
        thought: 'No more tab-hopping across platforms.',
        emotion: 'Focused',
        emotionColor: GREEN,
      },
      {
        title: 'Adaptive Intelligence',
        sceneIcon: personaIcons.robot,
        description: '"My legs are sore" \u2192 PLYA swaps to upper body from its library.',
        thought: '"Moved leg work to Thursday. Here\u2019s an upper-body session."',
        emotion: 'Cared for',
        emotionColor: BLUE,
      },
      {
        title: 'Already in PLYA',
        sceneIcon: personaIcons.checkCircle,
        description: 'Shares a video from IG. PLYA: "Already indexed \u2014 tagged for basketball agility."',
        thought: '"They already have everything."',
        emotion: 'Impressed',
        emotionColor: GOLD,
      },
      {
        title: 'Progress Visible',
        sceneIcon: personaIcons.chartUp,
        description: '6 weeks in: tracking shows real gains across curated programs.',
        thought: '"18 sessions. Explosiveness up 15%."',
        emotion: 'Validated',
        emotionColor: GREEN,
      },
      {
        title: 'The Gap Insight',
        sceneIcon: personaIcons.lightbulb,
        description: 'PLYA notices 90% physical, 10% recovery. Suggests a mobility block from its library.',
        thought: '"You\u2019re training hard. Let\u2019s balance with recovery."',
        emotion: 'Growth',
        emotionColor: PURPLE,
      },
    ],
  },
  professional: {
    id: 'professional',
    name: 'Alex',
    title: 'The Busy Professional',
    quote: "I don't need motivation — I need something that fits my actual life.",
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    avatarIcon: personaIcons.professional,
    quickFacts: [
      { icon: 'time', label: 'Time', value: '~1 hour, AM or PM' },
      { icon: 'target', label: 'Goal', value: 'Consistency > peak' },
      { icon: 'balance', label: 'Priority', value: 'Balance, not extremes' },
      { icon: 'attitude', label: 'Attitude', value: 'Tech-savvy, open' },
    ],
    jobsToBeDone: [
      'Stay consistent without managing a complex system',
      'Feel tangible results over time',
      'Reduce stress, not add to it',
      'Execute structured plans without improvising',
    ],
    painPoints: [
      'Lack of all-in-one system that respects real schedules',
      'Apps are too complex, slow, needy, or generic',
      'Decision fatigue kills motivation before workout starts',
      'Fitness becomes "another thing I\'m failing at"',
    ],
    emotionalNeeds: ['Accomplished', 'In control', 'Calm', 'Efficient'],
    sensitivities: ['Time waste', 'Complexity', 'Needy apps', 'Guilt-tripping'],
    differentiators: [
      { text: 'Time is THE constraint \u2014 everything must respect it' },
      { text: 'Non-intrusiveness matters \u2014 hates needy apps' },
      { text: 'Wants to follow, not create \u2014 prefers structure delivered' },
      { text: 'Success = consistency, not optimization' },
    ],
    opportunity: 'Calm, decisive system that removes friction, respects time, and delivers structure without requiring management.',
    asIs: [
      {
        title: 'The Intention',
        sceneIcon: personaIcons.moon,
        description: 'Night before: sets 6am alarm, opens app to plan. Has to browse its content library to find something.',
        thought: '"I\'ll figure it out in the morning."',
        emotion: 'Procrastination',
        emotionColor: AMBER,
      },
      {
        title: 'The Morning Chaos',
        sceneIcon: personaIcons.alarm,
        description: '6am, exhausted, opens app. No plan waiting \u2014 just a content catalog to browse.',
        thought: 'Meeting reminder pops up. Skips gym.',
        emotion: 'Frustrated',
        emotionColor: RED,
      },
      {
        title: 'The Overcomplication',
        sceneIcon: personaIcons.frustrated,
        description: 'New app: 10 screens of onboarding, then drops into an empty dashboard. "Now go find content."',
        thought: '"I don\'t have time for this." Deleted.',
        emotion: 'Annoyed',
        emotionColor: RED,
      },
      {
        title: 'The Generic Workout',
        sceneIcon: personaIcons.refresh,
        description: 'Following a generic app. Same cookie-cutter routine every week, no awareness of schedule or goals.',
        thought: '"Is this even doing anything?"',
        emotion: 'Doubtful',
        emotionColor: AMBER,
      },
      {
        title: 'The Guilt Spiral',
        sceneIcon: personaIcons.guiltyFace,
        description: 'End of week, only worked out once. The app sent 4 guilt-trip notifications.',
        thought: '"Another thing I\'m failing at."',
        emotion: 'Defeated',
        emotionColor: RED,
      },
      {
        title: 'The Search Continues',
        sceneIcon: personaIcons.search,
        description: 'Googling "best fitness apps" again. Each one requires starting from scratch.',
        thought: 'Downloads another. Cycle repeats.',
        emotion: 'Exhausted',
        emotionColor: RED,
      },
    ],
    toBe: [
      {
        title: '90 Seconds to a Plan',
        sceneIcon: personaIcons.clipboard,
        description: '"Crazy schedule, 30-45 min, mornings." PLYA builds a full first week from its curated library.',
        thought: '"Mon/Wed/Fri \u2014 35 min each. Here\u2019s session one."',
        emotion: 'Relief',
        emotionColor: GREEN,
      },
      {
        title: 'The Calm Morning',
        sceneIcon: personaIcons.sun,
        description: '6am, opens PLYA. Today\u2019s session is already queued \u2014 sourced, structured, timed.',
        thought: 'No browsing. No decisions. Just press play.',
        emotion: 'Clear',
        emotionColor: GREEN,
      },
      {
        title: 'Schedule Respect',
        sceneIcon: personaIcons.calendar,
        description: '"Early meeting tomorrow" \u2192 PLYA swaps to an evening express session from its library.',
        thought: '"Moved to 6pm. 25-min version ready."',
        emotion: 'Flexible',
        emotionColor: BLUE,
      },
      {
        title: 'Proactive Suggestion',
        sceneIcon: personaIcons.lightbulb,
        description: 'PLYA notices knee tightness mentioned last week. Surfaces a 12-min mobility flow.',
        thought: '"You mentioned your knee. Try this before tomorrow."',
        emotion: 'Cared for',
        emotionColor: BLUE,
      },
      {
        title: 'Tangible Results',
        sceneIcon: personaIcons.strong,
        description: '2 months in: real progress without obsessing. PLYA tracked everything quietly.',
        thought: '"28 sessions in 8 weeks. This is working."',
        emotion: 'In control',
        emotionColor: GOLD,
      },
      {
        title: 'The New Normal',
        sceneIcon: personaIcons.speaker,
        description: 'Tells coworker about the change. Never browses YouTube for workouts anymore.',
        thought: '"I don\'t plan workouts anymore. It\'s freeing."',
        emotion: 'Peace',
        emotionColor: PURPLE,
      },
    ],
  },
};

// ============================================
// COMPONENTS
// ============================================

const AnimatedAvatar = ({ icon, gradient }: { icon: React.ReactNode; gradient: string }) => (
  <div
    style={{
      width: 88,
      height: 88,
      borderRadius: '50%',
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      flexShrink: 0,
    }}
  >
    {icon}
    <div
      style={{
        position: 'absolute',
        inset: -4,
        borderRadius: '50%',
        border: `1.5px solid ${GOLD}40`,
      }}
    />
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontSize: 11,
      fontWeight: 500,
      color: GOLD,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      marginBottom: 12,
      fontFamily: '"JetBrains Mono", monospace',
    }}
  >
    {children}
  </p>
);

const GlassCard = ({
  children,
  style = {},
  glow = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  glow?: boolean;
}) => (
  <div
    style={{
      background: BG_CARD,
      border: `1px solid ${glow ? GOLD + '40' : BORDER}`,
      borderRadius: 12,
      padding: 20,
      backdropFilter: 'blur(8px)',
      boxShadow: glow ? `0 0 40px ${GOLD_GLOW}` : 'none',
      ...style,
    }}
  >
    {children}
  </div>
);

const QuickFactsGrid = ({ facts }: { facts: QuickFact[] }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
    {facts.map((fact, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: BG_TERTIARY,
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
        }}
      >
        <span style={{ color: GOLD, display: 'flex', flexShrink: 0 }}>
          {quickFactIcons[fact.icon]}
        </span>
        <div>
          <div
            style={{
              fontSize: 10,
              color: TEXT_DIM,
              marginBottom: 2,
              fontFamily: '"JetBrains Mono", monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {fact.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, fontFamily: '"DM Sans", sans-serif' }}>
            {fact.value}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ListItem = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'pain';
}) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
    <span
      style={{
        color: variant === 'pain' ? RED : GOLD,
        fontSize: 12,
        lineHeight: '22px',
        flexShrink: 0,
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {variant === 'pain' ? '\u2715' : '\u25CB'}
    </span>
    <span style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: '22px', fontFamily: '"DM Sans", sans-serif' }}>
      {children}
    </span>
  </div>
);

const TagList = ({
  items,
  variant = 'default',
}: {
  items: string[];
  variant?: 'default' | 'warning';
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {items.map((item, i) => (
      <span
        key={i}
        style={{
          padding: '6px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: '"DM Sans", sans-serif',
          background: variant === 'warning' ? 'rgba(248, 113, 113, 0.12)' : GOLD_DIM,
          color: variant === 'warning' ? RED : GOLD,
          border: `1px solid ${variant === 'warning' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(212, 165, 74, 0.25)'}`,
        }}
      >
        {item}
      </span>
    ))}
  </div>
);

const DifferentiatorItem = ({ text, index }: { text: string; index: number }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '14px 16px',
      background: BG_TERTIARY,
      borderRadius: 8,
      border: `1px solid ${BORDER}`,
    }}
  >
    <span
      style={{
        fontSize: 14,
        color: GOLD,
        fontFamily: '"Instrument Serif", Georgia, serif',
        flexShrink: 0,
        minWidth: 20,
      }}
    >
      {String(index + 1).padStart(2, '0')}
    </span>
    <span style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, fontFamily: '"DM Sans", sans-serif' }}>
      {text}
    </span>
  </div>
);

const StoryboardFrame = ({ frame, index }: { frame: StoryFrame; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
    style={{
      background: BG_ELEVATED,
      borderRadius: 10,
      overflow: 'hidden',
      border: `1px solid ${BORDER}`,
      minWidth: 0,
    }}
  >
    {/* Frame number + emotion */}
    <div
      style={{
        padding: '6px 10px',
        background: BG_TERTIARY,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: TEXT_DIM,
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 8,
          background: `${frame.emotionColor}18`,
          color: frame.emotionColor,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: '"JetBrains Mono", monospace',
          whiteSpace: 'nowrap',
        }}
      >
        {frame.emotion}
      </span>
    </div>

    {/* Scene icon area */}
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: TEXT_DIM,
        background: `linear-gradient(180deg, ${BG_TERTIARY} 0%, ${BG_ELEVATED} 100%)`,
      }}
    >
      {frame.sceneIcon}
    </div>

    {/* Content */}
    <div style={{ padding: '10px 12px 14px' }}>
      <h4
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: TEXT_PRIMARY,
          margin: '0 0 6px 0',
          lineHeight: 1.3,
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {frame.title}
      </h4>
      <p
        style={{
          fontSize: 11,
          color: TEXT_MUTED,
          margin: '0 0 10px 0',
          lineHeight: 1.5,
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {frame.description}
      </p>
      <div
        style={{
          fontSize: 10,
          fontStyle: 'italic',
          color: TEXT_DIM,
          padding: '6px 10px',
          background: BG_TERTIARY,
          borderRadius: 4,
          borderLeft: `2px solid ${frame.emotionColor}`,
          lineHeight: 1.5,
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {frame.thought}
      </div>
    </div>
  </motion.div>
);

const StoryboardSection = ({
  title,
  frames,
  variant,
}: {
  title: string;
  frames: StoryFrame[];
  variant: 'asIs' | 'toBe';
}) => (
  <div style={{ marginTop: 32 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: '5px 14px',
          borderRadius: 16,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.05em',
          background: variant === 'asIs' ? 'rgba(248, 113, 113, 0.12)' : 'rgba(74, 222, 128, 0.12)',
          color: variant === 'asIs' ? RED : GREEN,
          border: `1px solid ${variant === 'asIs' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(74, 222, 128, 0.25)'}`,
        }}
      >
        {variant === 'asIs' ? 'AS-IS' : 'TO-BE'}
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 400,
          color: TEXT_PRIMARY,
          margin: 0,
          fontFamily: '"Instrument Serif", Georgia, serif',
        }}
      >
        {title}
      </h3>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
      }}
    >
      {frames.map((frame, i) => (
        <StoryboardFrame key={i} frame={frame} index={i} />
      ))}
    </div>
  </div>
);

const PersonaCard = ({ persona }: { persona: PersonaData }) => (
  <div>
    {/* Header */}
    <GlassCard
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        marginBottom: 32,
        padding: 28,
      }}
    >
      <AnimatedAvatar icon={persona.avatarIcon} gradient={persona.gradient} />
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: GOLD,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 6,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {persona.title}
        </p>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: TEXT_PRIMARY,
            margin: '0 0 14px 0',
            fontFamily: '"Instrument Serif", Georgia, serif',
          }}
        >
          {persona.name}
        </h1>
        <p
          style={{
            fontSize: 15,
            fontStyle: 'italic',
            color: TEXT_MUTED,
            margin: 0,
            padding: '12px 16px',
            background: BG_TERTIARY,
            borderRadius: 8,
            borderLeft: `3px solid ${GOLD}`,
            lineHeight: 1.6,
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          &ldquo;{persona.quote}&rdquo;
        </p>
      </div>
    </GlassCard>

    {/* Quick Facts */}
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Quick Facts</SectionLabel>
      <QuickFactsGrid facts={persona.quickFacts} />
    </div>

    {/* Two column: Jobs + Pain Points */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
      <GlassCard>
        <SectionLabel>Jobs to Be Done</SectionLabel>
        {persona.jobsToBeDone.map((job, i) => (
          <ListItem key={i}>{job}</ListItem>
        ))}
      </GlassCard>
      <GlassCard>
        <SectionLabel>Pain Points</SectionLabel>
        {persona.painPoints.map((pain, i) => (
          <ListItem key={i} variant="pain">
            {pain}
          </ListItem>
        ))}
      </GlassCard>
    </div>

    {/* Two column: Emotional Needs + Sensitivities */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
      <GlassCard>
        <SectionLabel>Emotional Needs</SectionLabel>
        <TagList items={persona.emotionalNeeds} />
      </GlassCard>
      <GlassCard>
        <SectionLabel>Sensitivities</SectionLabel>
        <TagList items={persona.sensitivities} variant="warning" />
      </GlassCard>
    </div>

    {/* Differentiators */}
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>What Makes {persona.name} Different</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {persona.differentiators.map((diff, i) => (
          <DifferentiatorItem key={i} text={diff.text} index={i} />
        ))}
      </div>
    </div>

    {/* PLYA Opportunity */}
    <GlassCard glow style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: GOLD_DIM,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
          </svg>
        </div>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: GOLD,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: 8,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            PLYA Opportunity
          </p>
          <p
            style={{
              fontSize: 15,
              color: TEXT_PRIMARY,
              margin: 0,
              lineHeight: 1.7,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {persona.opportunity}
          </p>
        </div>
      </div>
    </GlassCard>

    {/* Storyboards */}
    <StoryboardSection title="The Current Struggle" frames={persona.asIs} variant="asIs" />
    <StoryboardSection title="The PLYA Experience" frames={persona.toBe} variant="toBe" />
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function PLYAPersonasStoryboards() {
  const [activePersona, setActivePersona] = useState<'athlete' | 'professional'>('athlete');
  const persona = personas[activePersona];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG_PRIMARY,
        color: TEXT_PRIMARY,
        fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Atmospheric glow */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: GOLD,
            filter: 'blur(160px)',
            opacity: 0.06,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            right: '15%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: activePersona === 'athlete' ? '#F59E0B' : '#3B82F6',
            filter: 'blur(140px)',
            opacity: 0.04,
            transition: 'background 0.6s ease',
          }}
        />
      </div>

      {/* Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${BG_PRIMARY}ee`,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${BORDER}`,
          padding: '14px 32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 1400,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GOLD}
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 400,
                margin: 0,
                color: TEXT_PRIMARY,
                fontFamily: '"Instrument Serif", Georgia, serif',
              }}
            >
              PLYA <span style={{ color: GOLD }}>Personas</span>
            </h1>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              background: BG_CARD,
              borderRadius: 10,
              border: `1px solid ${BORDER}`,
            }}
          >
            {(['athlete', 'professional'] as const).map((key) => {
              const isActive = activePersona === key;
              const p = personas[key];
              return (
                <button
                  key={key}
                  onClick={() => setActivePersona(key)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.25s ease',
                    fontFamily: '"DM Sans", sans-serif',
                    background: isActive ? p.gradient : 'transparent',
                    color: isActive ? '#fff' : TEXT_DIM,
                    letterSpacing: isActive ? '0.02em' : '0',
                  }}
                >
                  {p.name} &mdash; {key === 'athlete' ? 'Athlete' : 'Professional'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '36px 32px 80px',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activePersona}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <PersonaCard persona={persona} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
