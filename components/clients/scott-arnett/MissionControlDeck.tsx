'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  BG_PRIMARY,
  BG_SURFACE,
  GOLD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
  GREEN,
} from '@/lib/design-tokens';

// Phase management for intro → dashboard flow
type Phase = 'intro' | 'dashboard-with-tooltips' | 'dashboard';

// Color constants aligned with 33 Strategies design system
const colors = {
  bg: BG_PRIMARY,
  surface: BG_SURFACE,
  surfaceHover: '#18181c',
  gold: GOLD,
  goldDim: 'rgba(212, 165, 74, 0.3)',
  goldSubtle: 'rgba(212, 165, 74, 0.15)',
  goldGlow: '0 0 40px rgba(212, 165, 74, 0.15)',
  green: GREEN,
  amber: '#f59e0b',
  red: '#f87171',
  white: TEXT_PRIMARY,
  textMuted: TEXT_MUTED,
  textDim: TEXT_DIM,
  border: 'rgba(255,255,255,0.08)',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
};

// Project data for Scott's ventures
const projectsData = [
  {
    id: 'deep_dive_pools',
    name: 'Deep Dive Pools + ASR',
    category: 'Venture / Infrastructure',
    tier: 1,
    summary: 'Partnering with ASR to build 45m deep dive pools inside multi-attraction adventure resorts.',
    why: 'Creates physical infrastructure and recurring revenue. Uniquely positioned through relationships and domain expertise.',
    momentum: 'active' as const,
    passionScore: 9,
    roiScore: 9,
    delegatabilityScore: 3,
    timeThisWeek: { budgeted: 8, actual: 6 },
    currentBlocker: null,
    oneThingThisWeek: 'Follow up with ASR on Riverside site timeline',
    primaryObjectives: [
      { label: 'Finalize Riverside LOI', timeframe: '60 days', description: 'Get letter of intent signed for first location' },
      { label: 'Utah site feasibility', timeframe: '90 days', description: 'Complete feasibility study for St. George location' }
    ],
    keyNextActions: [
      'Follow up with ASR on Riverside site timeline',
      'Review updated pro forma from finance team',
      'Schedule call with Utah land developer'
    ],
    decisionLog: [
      { date: '2025-01-20', note: 'Decided to prioritize Riverside over Texas due to faster permitting' },
      { date: '2025-01-10', note: 'Confirmed mermaid program partnership structure with training team' }
    ],
    notes: 'Multiple locations in discussion: Riverside CA, Utah/St. George, Texas, NorCal.'
  },
  {
    id: 'med_device_startup',
    name: 'Med Device Startup',
    category: 'Venture / High Upside',
    tier: 1,
    summary: 'New medical device company targeting FDA clearance and rapid commercialization.',
    why: 'High-upside venture aligned with med device expertise. Time-sensitive FDA timelines.',
    momentum: 'stuck' as const,
    passionScore: 8,
    roiScore: 9,
    delegatabilityScore: 4,
    timeThisWeek: { budgeted: 6, actual: 2 },
    currentBlocker: {
      description: 'Waiting on FDA pre-submission feedback',
      stuckSince: '2025-01-10',
      daysStuck: 16
    },
    oneThingThisWeek: 'Prep contingency plan if FDA feedback delayed',
    primaryObjectives: [
      { label: 'FDA pre-sub response', timeframe: '30 days', description: 'Receive and analyze FDA pre-submission feedback' },
      { label: 'Manufacturing partner LOI', timeframe: '60 days', description: 'Secure letter of intent from contract manufacturer' }
    ],
    keyNextActions: [
      'Prep contingency plan if FDA feedback delayed',
      'Review manufacturing partner shortlist',
      'Update investor deck with timeline scenarios'
    ],
    decisionLog: [
      { date: '2025-01-15', note: 'Decided to pause GPO outreach until FDA feedback arrives' },
      { date: '2025-01-05', note: 'Submitted pre-submission package to FDA' }
    ],
    notes: 'Corporate entity + B2C site + GPO relationships being built.'
  },
  {
    id: 'throw_flasher',
    name: 'Throw Flasher',
    category: 'Product / Commerce',
    tier: 1,
    summary: 'Hardware flasher device for spearfishing with proven distribution traction.',
    why: 'Already has 5,000-unit order. Clear path to scale with established distribution.',
    momentum: 'active' as const,
    passionScore: 7,
    roiScore: 8,
    delegatabilityScore: 6,
    timeThisWeek: { budgeted: 4, actual: 5 },
    currentBlocker: null,
    oneThingThisWeek: 'Finalize packaging design for production run',
    primaryObjectives: [
      { label: 'Ship 5K unit order', timeframe: '45 days', description: 'Complete and ship American Dive Co order' },
      { label: 'Second distribution deal', timeframe: '90 days', description: 'Close deal with one additional major retailer' }
    ],
    keyNextActions: [
      'Finalize packaging design for production run',
      'Confirm production timeline with manufacturer',
      'Draft outreach list for second distribution partner'
    ],
    decisionLog: [
      { date: '2025-01-18', note: 'Confirmed 5,000-unit order with American Dive Co' }
    ],
    notes: 'Hardware device that attracts fish by spinning and reflecting as it descends.'
  },
  {
    id: 'versus_dive_shop',
    name: 'Verso-Sphere Dive Shop',
    category: 'Sports / Passion',
    tier: 2,
    summary: 'Free diving & spearfishing dive shop, instruction, and elite athlete sponsorships.',
    why: 'High passion project. Platform for athletes and sport visibility.',
    momentum: 'active' as const,
    passionScore: 9,
    roiScore: 6,
    delegatabilityScore: 7,
    timeThisWeek: { budgeted: 4, actual: 4 },
    currentBlocker: null,
    oneThingThisWeek: 'Review Q1 athlete sponsorship renewals',
    primaryObjectives: [
      { label: 'Athlete World Champs prep', timeframe: '90 days', description: 'Support squad preparation for New Zealand championships' }
    ],
    keyNextActions: [
      'Review Q1 athlete sponsorship renewals',
      'Schedule training camp logistics'
    ],
    decisionLog: [
      { date: '2025-01-12', note: 'Confirmed New Zealand World Championships squad roster' }
    ],
    notes: 'Elite athletes including national record holder.'
  },
  {
    id: 'fish_fertilizer',
    name: 'Fish Fertilizer Venture',
    category: 'Adjacent Venture',
    tier: 2,
    summary: 'New fish-based fertilizer opportunity leveraging strong distribution relationships.',
    why: 'Good ROI potential. Medium personal passion—structure and delegate.',
    momentum: 'paused' as const,
    passionScore: 4,
    roiScore: 7,
    delegatabilityScore: 8,
    timeThisWeek: { budgeted: 2, actual: 0 },
    currentBlocker: {
      description: 'Need to decide on go/no-go and partnership structure',
      stuckSince: '2025-01-15',
      daysStuck: 11
    },
    oneThingThisWeek: 'Make go/no-go decision on fertilizer venture',
    primaryObjectives: [
      { label: 'Go/no-go decision', timeframe: '30 days', description: 'Decide whether to pursue' }
    ],
    keyNextActions: [
      'Make go/no-go decision on fertilizer venture',
      'If go: identify operator to run day-to-day'
    ],
    decisionLog: [],
    notes: 'Distribution access: sod farms, nurseries, Sun Pro.'
  },
  {
    id: 'family_office',
    name: 'Family Office',
    category: 'Capital / Impact',
    tier: 2,
    summary: 'Personal investment arm for family health solutions and impact ventures.',
    why: 'Long-term wealth and impact vehicle. Episodic attention.',
    momentum: 'active' as const,
    passionScore: 8,
    roiScore: 7,
    delegatabilityScore: 5,
    timeThisWeek: { budgeted: 2, actual: 1 },
    currentBlocker: null,
    oneThingThisWeek: 'Review two inbound deal memos',
    primaryObjectives: [
      { label: 'Deploy Q1 capital', timeframe: '90 days', description: 'Make 1-2 investments' }
    ],
    keyNextActions: [
      'Review two inbound deal memos',
      'Follow up on biotech intro'
    ],
    decisionLog: [
      { date: '2025-01-05', note: 'Passed on Series A—too far from thesis' }
    ],
    notes: 'Mission: Fund solutions for family health problems.'
  },
  {
    id: 'med_device_day_job',
    name: 'CDMO Day Job',
    category: 'Core Income',
    tier: 3,
    summary: 'Strategic relations engineer at medical device contract manufacturer.',
    why: 'Supports cashflow and network. Not primary long-term vehicle.',
    momentum: 'active' as const,
    passionScore: 5,
    roiScore: 5,
    delegatabilityScore: 2,
    timeThisWeek: { budgeted: 40, actual: 38 },
    currentBlocker: null,
    oneThingThisWeek: 'Close pending lead from trade show',
    primaryObjectives: [
      { label: 'Hit Q1 targets', timeframe: '90 days', description: 'Meet quarterly goals' }
    ],
    keyNextActions: ['Close pending lead from trade show'],
    decisionLog: [],
    notes: 'Role: Generating leads, supporting med device development.'
  },
  {
    id: 'olympic_sport_mission',
    name: 'Olympic Sport Mission',
    category: 'Long-Term Mission',
    tier: 3,
    summary: 'Elevate freediving and spearfishing toward Olympic status.',
    why: '10-year horizon. Advances through other sports projects.',
    momentum: 'active' as const,
    passionScore: 10,
    roiScore: 4,
    delegatabilityScore: 6,
    timeThisWeek: { budgeted: 0, actual: 0 },
    currentBlocker: null,
    oneThingThisWeek: 'No direct action—advances through Verso-Sphere',
    primaryObjectives: [
      { label: 'World Champs visibility', timeframe: '6 months', description: 'Maximize media coverage' }
    ],
    keyNextActions: ['Coordinate with Verso-Sphere on athlete media strategy'],
    decisionLog: [],
    notes: 'Long-term: Olympic recognition, storytelling, events.'
  }
];

type Momentum = 'active' | 'paused' | 'stuck';

interface Blocker {
  description: string;
  stuckSince: string;
  daysStuck: number;
}

interface Project {
  id: string;
  name: string;
  category: string;
  tier: number;
  summary: string;
  why: string;
  momentum: Momentum;
  passionScore: number;
  roiScore: number;
  delegatabilityScore: number;
  timeThisWeek: { budgeted: number; actual: number };
  currentBlocker: Blocker | null;
  oneThingThisWeek: string;
  primaryObjectives: { label: string; timeframe: string; description: string }[];
  keyNextActions: string[];
  decisionLog: { date: string; note: string }[];
  notes: string;
}

// Helper functions
const getMomentumColor = (momentum: Momentum): string => {
  switch (momentum) {
    case 'active': return colors.green;
    case 'paused': return colors.textDim;
    case 'stuck': return colors.amber;
    default: return colors.textDim;
  }
};

const getMomentumLabel = (momentum: Momentum): string => {
  switch (momentum) {
    case 'active': return 'Active';
    case 'paused': return 'Paused';
    case 'stuck': return 'Blocked';
    default: return '';
  }
};

const getBlockerStyle = (daysStuck: number) => {
  if (daysStuck >= 15) return {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#f87171'
  };
  if (daysStuck >= 8) return {
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#fbbf24'
  };
  return {
    background: colors.zinc800,
    border: `1px solid ${colors.zinc700}`,
    color: colors.textMuted
  };
};

const getTimeBarColor = (actual: number, budgeted: number): string => {
  const ratio = actual / budgeted;
  if (ratio >= 0.9) return colors.green;
  if (ratio >= 0.5) return colors.amber;
  return colors.red;
};

// Score visualization component
const ScoreDots = ({ score, label, isGold = true }: { score: number; label: string; isGold?: boolean }) => {
  const filledColor = isGold ? colors.gold : colors.textDim;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {label && <span style={{ fontSize: '10px', color: colors.textDim, width: '72px', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>}
      <div style={{ display: 'flex', gap: '2px' }}>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: i < score ? filledColor : colors.zinc800
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Time budget bar component
const TimeBudgetBar = ({ budgeted, actual }: { budgeted: number; actual: number }) => {
  const percentage = Math.min((actual / budgeted) * 100, 100);
  const barColor = getTimeBarColor(actual, budgeted);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
        <span style={{ color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>Time</span>
        <span style={{ color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{actual}h / {budgeted}h</span>
      </div>
      <div style={{
        height: '6px',
        backgroundColor: colors.zinc800,
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: barColor,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

// Blocker badge component
const BlockerBadge = ({ blocker }: { blocker: Blocker }) => {
  const style = getBlockerStyle(blocker.daysStuck);

  return (
    <div style={{
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontFamily: "'DM Sans', sans-serif",
      ...style
    }}>
      <span style={{ fontWeight: 600 }}>{blocker.daysStuck}d stuck:</span> {blocker.description.substring(0, 35)}...
    </div>
  );
};

// Project card component
const ProjectCard = ({ project, onClick, isFocusTier, id }: { project: Project; onClick: (p: Project) => void; isFocusTier: boolean; id?: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      id={id}
      onClick={() => onClick(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? colors.surfaceHover : colors.surface,
        border: `1px solid ${isFocusTier ? (isHovered ? colors.gold : colors.goldDim) : (isHovered ? colors.zinc700 : colors.border)}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isFocusTier ? colors.goldGlow : 'none'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            fontSize: '10px',
            color: getMomentumColor(project.momentum),
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {getMomentumLabel(project.momentum)}
          </span>
          <span style={{ color: colors.textDim }}>·</span>
          <span style={{
            fontSize: '10px',
            color: colors.textDim,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {project.category}
          </span>
        </div>
        <h3 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: '18px',
          color: colors.white,
          margin: 0
        }}>
          {project.name}
        </h3>
      </div>

      {/* Blocker */}
      {project.currentBlocker && (
        <div style={{ marginBottom: '12px' }}>
          <BlockerBadge blocker={project.currentBlocker} />
        </div>
      )}

      {/* One Thing */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '10px',
          color: colors.gold,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '4px'
        }}>
          This Week
        </div>
        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
          {project.oneThingThisWeek}
        </p>
      </div>

      {/* Scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        <ScoreDots score={project.passionScore} label="Passion" />
        <ScoreDots score={project.roiScore} label="ROI" />
        <ScoreDots score={project.delegatabilityScore} label="Delegate" isGold={false} />
      </div>

      {/* Time Budget */}
      <TimeBudgetBar budgeted={project.timeThisWeek.budgeted} actual={project.timeThisWeek.actual} />
    </div>
  );
};

// Compact card for maintenance tier
const CompactProjectCard = ({ project, onClick }: { project: Project; onClick: (p: Project) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        backgroundColor: isHovered ? colors.surfaceHover : colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '10px',
          color: getMomentumColor(project.momentum),
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase'
        }}>
          {getMomentumLabel(project.momentum)}
        </span>
        <span style={{ fontSize: '14px', color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{project.name}</span>
      </div>
      <span style={{ fontSize: '11px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>{project.category}</span>
    </div>
  );
};

// Project detail view
const ProjectDetail = ({ project, onClose }: { project: Project; onClose: () => void }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const tierLabel = project.tier === 1 ? 'FOCUS ZONE' : project.tier === 2 ? 'IN MOTION' : 'MAINTENANCE';
  const tierStyle = project.tier === 1
    ? { background: colors.goldSubtle, color: colors.gold }
    : project.tier === 2
    ? { background: colors.zinc700, color: colors.textMuted }
    : { background: colors.zinc800, color: colors.textDim };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 10, 15, 0.97)',
      zIndex: 50,
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textDim,
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            ← Back to Overview
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '10px',
              color: getMomentumColor(project.momentum),
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              {getMomentumLabel(project.momentum)}
            </span>
            <span style={{
              fontSize: '10px',
              color: colors.gold,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              {project.category}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontFamily: "'JetBrains Mono', monospace",
              ...tierStyle
            }}>
              {tierLabel}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '32px',
            color: colors.white,
            margin: '0 0 8px 0'
          }}>
            {project.name}
          </h1>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}>{project.summary}</p>
        </div>

        {/* Why This Matters */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '10px',
            color: colors.gold,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '8px'
          }}>
            Why This Matters
          </div>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '14px', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
            {project.why}
          </p>
        </div>

        {/* Blocker Alert */}
        {project.currentBlocker && (
          <div style={{
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            ...getBlockerStyle(project.currentBlocker.daysStuck)
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', monospace" }}>
                Blocked
              </span>
              <span style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>
                {project.currentBlocker.daysStuck} days
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{project.currentBlocker.description}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', opacity: 0.7, fontFamily: "'JetBrains Mono', monospace" }}>
              Since {project.currentBlocker.stuckSince}
            </p>
          </div>
        )}

        {/* Objectives */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '10px',
            color: colors.gold,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '12px'
          }}>
            60-90 Day Objectives
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.primaryObjectives.map((obj, i) => (
              <div key={i} style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.goldDim}`,
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontSize: '17px',
                    color: colors.white,
                    margin: 0
                  }}>
                    {obj.label}
                  </h4>
                  <span style={{ fontSize: '11px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>{obj.timeframe}</span>
                </div>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>{obj.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '10px',
            color: colors.gold,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '12px'
          }}>
            This Week&apos;s Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {project.keyNextActions.map((action, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: i === 0 ? colors.goldSubtle : colors.surface,
                border: `1px solid ${i === 0 ? colors.goldDim : colors.border}`
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `1px solid ${i === 0 ? colors.gold : colors.textDim}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: i === 0 ? colors.gold : colors.textDim,
                  flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {i === 0 ? '1' : '○'}
                </div>
                <span style={{
                  fontSize: '13px',
                  color: i === 0 ? colors.white : colors.textMuted,
                  fontWeight: i === 0 ? 500 : 400,
                  flex: 1,
                  fontFamily: "'DM Sans', sans-serif"
                }}>
                  {action}
                </span>
                {i === 0 && (
                  <span style={{
                    fontSize: '9px',
                    color: colors.gold,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}>
                    ONE THING
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scores & Time Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '10px',
              color: colors.textDim,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px'
            }}>
              Allocation Scores
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Passion</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ScoreDots score={project.passionScore} label="" />
                  <span style={{ fontSize: '13px', color: colors.white, fontFamily: "'JetBrains Mono', monospace", width: '20px', textAlign: 'right' }}>
                    {project.passionScore}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>ROI on Time</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ScoreDots score={project.roiScore} label="" />
                  <span style={{ fontSize: '13px', color: colors.white, fontFamily: "'JetBrains Mono', monospace", width: '20px', textAlign: 'right' }}>
                    {project.roiScore}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Delegatability</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ScoreDots score={project.delegatabilityScore} label="" isGold={false} />
                  <span style={{ fontSize: '13px', color: colors.white, fontFamily: "'JetBrains Mono', monospace", width: '20px', textAlign: 'right' }}>
                    {project.delegatabilityScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '10px',
              color: colors.textDim,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px'
            }}>
              Time This Week
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '28px', color: colors.white }}>
                {project.timeThisWeek.actual}
              </span>
              <span style={{ color: colors.textDim, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
                / {project.timeThisWeek.budgeted}h budgeted
              </span>
            </div>
            <TimeBudgetBar budgeted={project.timeThisWeek.budgeted} actual={project.timeThisWeek.actual} />
          </div>
        </div>

        {/* Decision Log */}
        {project.decisionLog.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => setExpandedSection(expandedSection === 'decisions' ? null : 'decisions')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                background: 'none',
                border: 'none',
                padding: 0,
                marginBottom: '12px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '10px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Decision Log
              </span>
              <span style={{ color: colors.textDim }}>{expandedSection === 'decisions' ? '−' : '+'}</span>
            </button>
            {expandedSection === 'decisions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project.decisionLog.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    <span style={{ color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {entry.date}
                    </span>
                    <span style={{ color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{entry.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {project.notes && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'notes' ? null : 'notes')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                background: 'none',
                border: 'none',
                padding: 0,
                marginBottom: '12px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '10px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Notes & Context
              </span>
              <span style={{ color: colors.textDim }}>{expandedSection === 'notes' ? '−' : '+'}</span>
            </button>
            {expandedSection === 'notes' && (
              <p style={{
                fontSize: '13px',
                color: colors.textMuted,
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '12px',
                margin: 0,
                lineHeight: 1.5,
                fontFamily: "'DM Sans', sans-serif"
              }}>
                {project.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// INTRO SCROLLYTELLING COMPONENTS
// =============================================================================

interface IntroSectionProps {
  children: React.ReactNode;
  id: string;
}

const IntroSection = ({ children, id }: IntroSectionProps) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-20%' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {children}
    </motion.section>
  );
};

interface RevealTextProps {
  children: React.ReactNode;
  delay?: number;
}

const RevealText = ({ children, delay = 0 }: RevealTextProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-10%' });

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

// Abstract opportunity categories for the intro
const opportunityCategories = [
  { label: 'Infrastructure', description: 'Deep dive pools, resorts, physical spaces' },
  { label: 'Products', description: 'Throw Flasher, hardware that solves real problems' },
  { label: 'Sports & Athletes', description: 'World-class competitors, championship visibility' },
  { label: 'Ventures', description: 'Med device, fertilizer, strategic bets' },
  { label: 'Mission', description: 'Olympic recognition, sport legitimacy, long-term impact' },
];

// Intro scrollytelling component
const IntroExperience = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      {/* Section 1: We talked about a lot */}
      <IntroSection id="intro-1">
        <RevealText>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: colors.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '24px',
          }}>
            After Our Conversation
          </p>
        </RevealText>
        <RevealText delay={0.15}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(36px, 6vw, 56px)',
            color: colors.white,
            lineHeight: 1.15,
            margin: 0,
          }}>
            We talked about <em style={{ fontStyle: 'italic', color: colors.gold }}>a lot</em>.
          </h1>
        </RevealText>
        <RevealText delay={0.3}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px',
            color: colors.textMuted,
            lineHeight: 1.6,
            marginTop: '24px',
            maxWidth: '520px',
          }}>
            The ventures. The athletes. The deals in motion. The missions that matter most to you.
          </p>
        </RevealText>
      </IntroSection>

      {/* Section 2: Compelling opportunities */}
      <IntroSection id="intro-2">
        <RevealText>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: colors.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '24px',
          }}>
            What We Saw
          </p>
        </RevealText>
        <RevealText delay={0.15}>
          <h2 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 48px)',
            color: colors.white,
            lineHeight: 1.2,
            margin: '0 0 40px 0',
          }}>
            Compelling opportunities across <em style={{ fontStyle: 'italic', color: colors.gold }}>every</em> front.
          </h2>
        </RevealText>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {opportunityCategories.map((cat, i) => (
            <RevealText key={cat.label} delay={0.25 + i * 0.1}>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
                padding: '12px 0',
                borderBottom: `1px solid ${colors.border}`,
              }}>
                <span style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: '20px',
                  color: colors.white,
                  minWidth: '140px',
                }}>
                  {cat.label}
                </span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: colors.textDim,
                }}>
                  {cat.description}
                </span>
              </div>
            </RevealText>
          ))}
        </div>
      </IntroSection>

      {/* Section 3: The question */}
      <IntroSection id="intro-3">
        <RevealText>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: colors.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '24px',
          }}>
            But One Question Kept Coming Back
          </p>
        </RevealText>
        <RevealText delay={0.2}>
          <h2 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(28px, 4.5vw, 42px)',
            color: colors.white,
            lineHeight: 1.3,
            margin: 0,
            fontWeight: 400,
          }}>
            How do I help Scott better <em style={{ fontStyle: 'italic', color: colors.gold }}>organize</em> and{' '}
            <em style={{ fontStyle: 'italic', color: colors.gold }}>visualize</em> everything he&apos;s building—
          </h2>
        </RevealText>
        <RevealText delay={0.4}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '20px',
            color: colors.textMuted,
            lineHeight: 1.6,
            marginTop: '24px',
          }}>
            so he can be more <span style={{ color: colors.white, fontWeight: 500 }}>intentional</span> about where his time goes as an operator?
          </p>
        </RevealText>
      </IntroSection>

      {/* Section 4: What if we started here */}
      <IntroSection id="intro-4">
        <RevealText>
          <h2 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(36px, 6vw, 56px)',
            color: colors.white,
            lineHeight: 1.15,
            margin: 0,
          }}>
            What if we started <em style={{ fontStyle: 'italic', color: colors.gold }}>here</em>?
          </h2>
        </RevealText>
        <RevealText delay={0.25}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px',
            color: colors.textMuted,
            lineHeight: 1.6,
            marginTop: '24px',
            maxWidth: '480px',
          }}>
            A prototype for organizing your portfolio of ventures—built around where your next hour should actually go.
          </p>
        </RevealText>
        <RevealText delay={0.45}>
          <button
            onClick={onComplete}
            style={{
              marginTop: '48px',
              padding: '16px 32px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.gold}`,
              borderRadius: '8px',
              color: colors.gold,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.goldSubtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Enter Mission Control
            <span style={{ fontSize: '18px' }}>→</span>
          </button>
        </RevealText>
      </IntroSection>
    </div>
  );
};

// =============================================================================
// ONBOARDING TOOLTIP SYSTEM
// =============================================================================

interface TooltipConfig {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right';
  arrowOffset?: string;
}

const tooltipConfigs: TooltipConfig[] = [
  {
    id: 'priority-zones',
    title: 'Three Priority Zones',
    description: 'Focus Zone holds your top 3 priorities. In Motion tracks active-but-not-urgent work. Maintenance is everything else.',
    target: 'focus-zone-section',
    position: 'top',
  },
  {
    id: 'next-hour',
    title: 'Your Next Hour',
    description: 'A smart recommendation engine that suggests where your time should go based on urgency, ROI, and current blockers.',
    target: 'next-hour-section',
    position: 'bottom',
  },
  {
    id: 'scoring-framework',
    title: 'Passion / ROI / Delegatability',
    description: 'Rate each project—and even individual objectives—on these three dimensions to surface where your unique contribution matters most.',
    target: 'first-project-card',
    position: 'right',
  },
  {
    id: 'project-details',
    title: 'Click for Details',
    description: 'Each project expands into a full view with objectives, blockers, decision logs, and this week\'s one thing.',
    target: 'first-project-card',
    position: 'bottom',
  },
];

interface OnboardingTooltipProps {
  config: TooltipConfig;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingTooltip = ({ config, currentStep, totalSteps, onNext, onSkip }: OnboardingTooltipProps) => {
  // Position styles based on tooltip position
  const getPositionStyles = (): React.CSSProperties => {
    switch (config.id) {
      case 'priority-zones':
        return {
          position: 'fixed',
          top: '60%',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'next-hour':
        return {
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'scoring-framework':
        return {
          position: 'fixed',
          top: '50%',
          right: '10%',
          transform: 'translateY(-50%)',
        };
      case 'project-details':
        return {
          position: 'fixed',
          top: '65%',
          left: '25%',
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      style={{
        ...getPositionStyles(),
        zIndex: 100,
        maxWidth: '320px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.goldDim}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: `0 20px 40px rgba(0,0,0,0.5), ${colors.goldGlow}`,
      } as React.CSSProperties}
    >
      {/* Step indicator */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '16px',
      }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '24px',
              height: '3px',
              borderRadius: '2px',
              backgroundColor: i <= currentStep ? colors.gold : colors.zinc700,
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: '18px',
        color: colors.white,
        margin: '0 0 8px 0',
      }}>
        {config.title}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        color: colors.textMuted,
        lineHeight: 1.5,
        margin: '0 0 20px 0',
      }}>
        {config.description}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: colors.textDim,
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          Skip tour
        </button>
        <button
          onClick={onNext}
          style={{
            backgroundColor: colors.gold,
            color: colors.bg,
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
          {currentStep < totalSteps - 1 && <span>→</span>}
        </button>
      </div>
    </motion.div>
  );
};

// Overlay that dims the background during tooltip tour
const TooltipOverlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    zIndex: 99,
    pointerEvents: 'none',
  }}>
    <div style={{ pointerEvents: 'auto' }}>
      {children}
    </div>
  </div>
);

// Generate smart recommendations based on project state
const generateRecommendations = (projects: Project[]) => {
  const recommendations: { project: string; action: string; reason: string; urgency: 'high' | 'medium' | 'normal' }[] = [];

  // Priority 1: Stuck projects with high ROI that need unblocking
  const stuckHighROI = projects
    .filter(p => p.momentum === 'stuck' && p.roiScore >= 8)
    .sort((a, b) => b.roiScore - a.roiScore);

  if (stuckHighROI.length > 0) {
    const p = stuckHighROI[0];
    recommendations.push({
      project: p.name,
      action: `Unblock: ${p.currentBlocker?.description || 'Address blocker'}`,
      reason: `High-ROI project stuck for ${p.currentBlocker?.daysStuck || '?'} days`,
      urgency: 'high'
    });
  }

  // Priority 2: Focus Zone projects under time budget
  const underAllocated = projects
    .filter(p => p.tier === 1 && p.timeThisWeek.actual < p.timeThisWeek.budgeted * 0.5 && p.momentum !== 'stuck')
    .sort((a, b) => b.roiScore - a.roiScore);

  if (underAllocated.length > 0 && recommendations.length < 3) {
    const p = underAllocated[0];
    recommendations.push({
      project: p.name,
      action: p.oneThingThisWeek,
      reason: `Focus Zone project at ${Math.round((p.timeThisWeek.actual / p.timeThisWeek.budgeted) * 100)}% of budgeted time`,
      urgency: 'medium'
    });
  }

  // Priority 3: High passion + high ROI active projects
  const highValue = projects
    .filter(p => p.passionScore >= 8 && p.roiScore >= 8 && p.momentum === 'active' && !recommendations.some(r => r.project === p.name))
    .sort((a, b) => (b.passionScore + b.roiScore) - (a.passionScore + a.roiScore));

  if (highValue.length > 0 && recommendations.length < 3) {
    const p = highValue[0];
    recommendations.push({
      project: p.name,
      action: p.oneThingThisWeek,
      reason: `High passion (${p.passionScore}) + high ROI (${p.roiScore})`,
      urgency: 'normal'
    });
  }

  // Fill remaining slots with Focus Zone one-things
  const focusRemaining = projects
    .filter(p => p.tier === 1 && !recommendations.some(r => r.project === p.name))
    .slice(0, 3 - recommendations.length);

  focusRemaining.forEach(p => {
    recommendations.push({
      project: p.name,
      action: p.oneThingThisWeek,
      reason: 'Focus Zone priority',
      urgency: 'normal'
    });
  });

  return recommendations.slice(0, 3);
};

// Main Mission Control component
export default function MissionControlDeck() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [tooltipStep, setTooltipStep] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showMaintenance, setShowMaintenance] = useState(false);

  const focusZone = projectsData.filter(p => p.tier === 1);
  const inMotion = projectsData.filter(p => p.tier === 2);
  const maintenance = projectsData.filter(p => p.tier === 3);

  const totalBudgeted = projectsData.reduce((sum, p) => sum + p.timeThisWeek.budgeted, 0);
  const totalActual = projectsData.reduce((sum, p) => sum + p.timeThisWeek.actual, 0);
  const stuckCount = projectsData.filter(p => p.momentum === 'stuck').length;

  const recommendations = generateRecommendations(projectsData);

  // Handle intro completion
  const handleIntroComplete = useCallback(() => {
    setPhase('dashboard-with-tooltips');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Handle tooltip navigation
  const handleTooltipNext = useCallback(() => {
    if (tooltipStep < tooltipConfigs.length - 1) {
      setTooltipStep(prev => prev + 1);
    } else {
      setPhase('dashboard');
    }
  }, [tooltipStep]);

  const handleTooltipSkip = useCallback(() => {
    setPhase('dashboard');
  }, []);

  // Render intro experience
  if (phase === 'intro') {
    return <IntroExperience onComplete={handleIntroComplete} />;
  }

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.white,
      padding: '24px',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Tooltip overlay during onboarding */}
      <AnimatePresence>
        {phase === 'dashboard-with-tooltips' && (
          <TooltipOverlay>
            <OnboardingTooltip
              config={tooltipConfigs[tooltipStep]}
              currentStep={tooltipStep}
              totalSteps={tooltipConfigs.length}
              onNext={handleTooltipNext}
              onSkip={handleTooltipSkip}
            />
          </TooltipOverlay>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '11px',
            color: colors.gold,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>Mission Control</span>
            <span style={{
              color: colors.textDim,
              fontSize: '10px',
              fontWeight: 400,
              letterSpacing: '0.1em'
            }}>
              (PROTOTYPE)
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '36px',
            margin: '0 0 8px 0',
            fontWeight: 400
          }}>
            Scott Arnett
          </h1>
          <p style={{ color: colors.textDim, margin: 0, fontSize: '15px' }}>
            Where should your next hour go?
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Projects', value: projectsData.length, color: colors.white },
            { label: 'In Focus', value: focusZone.length, color: colors.gold },
            { label: 'Stuck', value: stuckCount, color: stuckCount > 0 ? colors.amber : colors.green },
            { label: 'Hours This Week', value: `${totalActual}`, suffix: `/${totalBudgeted}`, color: colors.white }
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '10px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '24px', color: stat.color }}>
                {stat.value}
                {stat.suffix && <span style={{ color: colors.textDim, fontSize: '16px' }}>{stat.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Your Next Hour */}
        <div id="next-hour-section" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              fontSize: '12px',
              color: colors.gold,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 500
            }}>
              Your Next Hour
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${rec.urgency === 'high' ? 'rgba(245, 158, 11, 0.4)' : colors.border}`,
                  borderLeft: `3px solid ${rec.urgency === 'high' ? colors.amber : rec.urgency === 'medium' ? colors.gold : colors.textDim}`,
                  borderRadius: '8px',
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `1px solid ${colors.textDim}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: colors.textDim,
                    flexShrink: 0,
                    marginTop: '2px',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    ○
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      color: colors.white,
                      marginBottom: '4px',
                      lineHeight: 1.4
                    }}>
                      <span style={{ fontWeight: 500 }}>{rec.project}</span>
                      <span style={{ color: colors.textMuted }}> — </span>
                      <span style={{ color: colors.textMuted }}>{rec.action}</span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: colors.textDim,
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {rec.reason}
                    </div>
                  </div>
                  {rec.urgency === 'high' && (
                    <span style={{
                      fontSize: '9px',
                      color: colors.amber,
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '2px 6px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      Urgent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Zone */}
        <div id="focus-zone-section" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: colors.gold, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Focus Zone
            </div>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.goldDim }} />
            <div style={{ fontSize: '11px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>Max 3 projects</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {focusZone.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={setSelectedProject}
                isFocusTier={true}
                id={index === 0 ? 'first-project-card' : undefined}
              />
            ))}
          </div>
        </div>

        {/* In Motion */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              In Motion
            </div>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
            <div style={{ fontSize: '11px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>Active but not priority</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {inMotion.map(project => (
              <ProjectCard key={project.id} project={project} onClick={setSelectedProject} isFocusTier={false} />
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div>
          <button
            onClick={() => setShowMaintenance(!showMaintenance)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              marginBottom: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '11px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Maintenance Mode
            </div>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
            <div style={{ fontSize: '11px', color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
              {showMaintenance ? '− Hide' : '+ Show'}
            </div>
          </button>

          {!showMaintenance ? (
            <div style={{ fontSize: '14px', color: colors.textDim }}>
              {maintenance.map(p => p.name).join(' • ')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {maintenance.map(project => (
                <CompactProjectCard key={project.id} project={project} onClick={setSelectedProject} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: `1px solid ${colors.border}`,
          textAlign: 'center'
        }}>
          <span style={{ color: colors.textDim, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: colors.gold, fontFamily: "'Instrument Serif', Georgia, serif" }}>33</span> Strategies
          </span>
        </div>
      </div>
    </div>
  );
}
