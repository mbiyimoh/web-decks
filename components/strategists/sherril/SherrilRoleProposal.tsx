'use client';

import React, { useState } from 'react';

// Design system colors
const COLORS = {
  bgPrimary: '#0a0a0f',
  bgSurface: '#111114',
  bgElevated: '#1a1a1f',
  gold: '#d4a54a',
  goldLight: '#e4c06b',
  green: '#4ade80',
  blue: '#3b82f6',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  textDimmed: '#525252',
  border: 'rgba(255,255,255,0.08)',
};

interface TimelineItem {
  title: string;
  subtitle: string;
  summary: string;
  details: string[];
}

interface OrgItem {
  title: string;
  description: string;
}

interface OrgData {
  title: string;
  subtitle: string;
  color: string;
  items: OrgItem[];
}

interface PriorityItem {
  level: number;
  title: string;
  timeframe: string;
  rationale: string;
  tasks: string[];
}

const SherrilRoleProposal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Executive Overview' },
    { id: 'timeline', label: '30 / 60 / 90' },
    { id: 'organization', label: 'By Organization' },
    { id: 'priorities', label: 'Prioritization' }
  ];

  const timelineData: Record<string, TimelineItem> = {
    '30': {
      title: 'Deploy & Own',
      subtitle: 'Weeks 1-4',
      summary: 'Get marketing automation live at TradeBlock, take over product ownership',
      details: [
        'Harden marketing automation code for production reliability',
        'Lead implementation with TradeBlock sneakerhead SME',
        'Establish working workflow: Claude → JSON → multi-channel content',
        'Take over product ownership for documented roadmap items',
        'Begin comprehensive codebase documentation project',
        'Quick wins: reactivate weekly emails, release campaigns, templates'
      ]
    },
    '60': {
      title: 'Optimize & Expand',
      subtitle: 'Weeks 5-8',
      summary: 'Marketing running smoothly, team transitioning to AI workflows, begin engagement features',
      details: [
        'Marketing automation running: 90-day content calendars live',
        'Every relevant sneaker release covered across all channels',
        'Weekly/monthly recurring campaigns automated',
        'TradeBlock team actively using AI development workflows',
        'Codebase documentation enabling AI-assisted development',
        'Begin building social engagement features (reply prioritization)'
      ]
    },
    '90': {
      title: 'Scale & Productize',
      subtitle: 'Weeks 9-12',
      summary: 'Full engagement suite prototyped, battle-tested product ready for 33 Strategies clients',
      details: [
        'Social engagement suite: AI-drafted replies, proactive targeting',
        'Viral detection with real-time alerts (including SMS)',
        'TradeBlock using complete marketing + engagement pipeline',
        '"Top posts to engage with now" feature operational',
        '33 Strategies has proven, demo-ready product',
        'Documented methodology for client implementations'
      ]
    }
  };

  const orgData: Record<string, OrgData> = {
    tradeblock: {
      title: 'TradeBlock',
      subtitle: 'Immediate Value',
      color: COLORS.blue,
      items: [
        {
          title: 'Marketing Automation Deployment',
          description: 'Deploy and lead implementation of existing marketing tools with SME'
        },
        {
          title: 'Product Ownership',
          description: 'Shepherd documented roadmap, keep team on task'
        },
        {
          title: 'AI Workflow Transition',
          description: 'Facilitate team adoption of AI-driven development'
        },
        {
          title: 'Codebase Documentation',
          description: 'Enable AI tools with comprehensive system context'
        }
      ]
    },
    strategies: {
      title: '33 Strategies',
      subtitle: 'Building the Future',
      color: COLORS.gold,
      items: [
        {
          title: 'Marketing Suite Development',
          description: 'Engineer expanding features using Claude Code'
        },
        {
          title: 'Social Engagement Platform',
          description: 'Reply prioritization, AI drafts, proactive targeting'
        },
        {
          title: 'Viral Detection System',
          description: 'Real-time alerts for high-engagement opportunities'
        },
        {
          title: 'Product Validation',
          description: 'Battle-test everything at TradeBlock first'
        }
      ]
    },
    overlap: {
      title: 'The Overlap',
      subtitle: 'Where Magic Happens',
      color: COLORS.green,
      items: [
        {
          title: 'Build Once, Use Twice',
          description: 'Every feature serves TradeBlock AND becomes 33 Strategies product'
        },
        {
          title: 'Prove Then Sell',
          description: 'TradeBlock success = demo-ready case study'
        },
        {
          title: 'PM + Engineer + User',
          description: "You're all three roles, which accelerates everything"
        }
      ]
    }
  };

  const priorityData: PriorityItem[] = [
    {
      level: 1,
      title: 'TradeBlock Foundation',
      timeframe: 'Weeks 1-4',
      rationale: 'TradeBlock pays the bills and proves the concept',
      tasks: [
        'Marketing automation reliability',
        'Get team actually using it successfully',
        'Product roadmap management',
        'Codebase documentation'
      ]
    },
    {
      level: 2,
      title: 'Validate & Systematize',
      timeframe: 'Weeks 4-8',
      rationale: 'Make sure it actually works before we sell it',
      tasks: [
        'TradeBlock marketing running smoothly',
        'Team using AI workflows effectively',
        'Document what works (becomes methodology)',
        'Capture pain points and user feedback'
      ]
    },
    {
      level: 3,
      title: 'Expand for Both',
      timeframe: 'Weeks 8-12',
      rationale: 'Build features that serve TradeBlock AND become products',
      tasks: [
        'Social engagement features development',
        'TradeBlock as first user/tester',
        'Battle-test everything before client-facing'
      ]
    }
  ];

  const decisionTree = [
    { question: 'Does TradeBlock need this to function?', answer: 'TradeBlock wins' },
    { question: 'Will this break TradeBlock if delayed?', answer: 'TradeBlock wins' },
    { question: 'Can we build it once and use it for both?', answer: 'Perfect alignment' },
    { question: 'Is this pure 33 Strategies feature building?', answer: 'Lower priority until TradeBlock stable' }
  ];

  return (
    <div
      className="min-h-screen font-body"
      style={{ backgroundColor: COLORS.bgPrimary, color: COLORS.textPrimary }}
    >
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
        {/* Header */}
        <div className="mb-12">
          <p
            className="text-xs font-mono font-medium tracking-[0.2em] uppercase mb-4"
            style={{ color: COLORS.gold }}
          >
            THE OPPORTUNITY
          </p>
          <h1 className="text-4xl md:text-5xl font-display mb-6">
            Build the Future of <span style={{ color: COLORS.gold }}>Both Companies</span>
          </h1>

          {/* The Hook */}
          <div
            className="rounded-2xl p-6 mb-8"
            style={{
              backgroundColor: COLORS.bgSurface,
              border: `1px solid ${COLORS.gold}`,
              boxShadow: '0 0 80px rgba(212, 165, 74, 0.15)',
            }}
          >
            <p className="text-lg leading-relaxed mb-4" style={{ color: '#e4e4e7' }}>
              I want you to take over two things that are directly connected:{' '}
              <strong style={{ color: COLORS.textPrimary }}>First</strong>, deploy our marketing
              automation at TradeBlock and own our product roadmap.{' '}
              <strong style={{ color: COLORS.textPrimary }}>Second</strong>, while you&apos;re proving
              that automation works for us, you&apos;ll also be building it into a full social
              engagement platform that becomes a core 33 Strategies offering.
            </p>
            <p className="text-base font-display italic" style={{ color: COLORS.gold }}>
              You&apos;re not just implementing existing stuff — you&apos;re building the future of both
              companies simultaneously.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b" style={{ borderColor: COLORS.border }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? COLORS.gold : 'transparent',
                color: activeTab === tab.id ? COLORS.bgPrimary : COLORS.textSecondary,
                border: activeTab === tab.id ? 'none' : `1px solid ${COLORS.border}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Executive Overview */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* The Opportunity */}
            <div
              className="rounded-2xl p-8"
              style={{
                backgroundColor: COLORS.bgSurface,
                border: `1px solid ${COLORS.gold}`,
                boxShadow: '0 0 60px rgba(212, 165, 74, 0.1)',
              }}
            >
              <p
                className="text-xs font-mono font-semibold tracking-[0.2em] uppercase mb-3"
                style={{ color: COLORS.gold }}
              >
                THE OPPORTUNITY
              </p>
              <p className="text-xl font-display leading-relaxed mb-4">
                Take over two directly connected roles:{' '}
                <strong>deploy marketing automation at TradeBlock</strong> and{' '}
                <strong>own product leadership</strong> — while simultaneously building those tools
                into a full social engagement platform for{' '}
                <span style={{ color: COLORS.gold }}>33 Strategies</span>.
              </p>
              <p className="text-base font-semibold" style={{ color: COLORS.green }}>
                You&apos;re not splitting time. You&apos;re building one system that serves both companies.
              </p>
            </div>

            {/* Two Columns: TradeBlock + 33 Strategies */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* TradeBlock Column */}
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: COLORS.bgSurface, border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS.blue }}
                  />
                  <h3 className="text-lg font-display font-semibold" style={{ color: COLORS.blue }}>
                    TradeBlock
                  </h3>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Marketing Automation</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Deploy existing tools, lead implementation with SME, activate dormant campaigns
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Product Ownership</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Shepherd roadmap, keep team on task, enforce AI-driven development
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Codebase Documentation</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Enable AI tools with comprehensive system context
                    </p>
                  </div>
                </div>
              </div>

              {/* 33 Strategies Column */}
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: COLORS.bgSurface, border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS.gold }}
                  />
                  <h3 className="text-lg font-display font-semibold" style={{ color: COLORS.gold }}>
                    33 Strategies
                  </h3>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Marketing Suite Development</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Engineer expanding features using Claude Code
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Social Engagement Platform</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Reply prioritization, AI-drafted responses, proactive targeting
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Viral Detection System</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Real-time alerts for high-engagement opportunities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Summary */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: COLORS.bgSurface, border: `1px solid ${COLORS.border}` }}
            >
              <p
                className="text-xs font-mono font-semibold tracking-[0.2em] uppercase mb-5"
                style={{ color: COLORS.textMuted }}
              >
                THE ROADMAP
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { days: '30', title: 'Deploy & Own', summary: 'Marketing automation live, product ownership established, documentation started', color: COLORS.gold },
                  { days: '60', title: 'Optimize & Expand', summary: 'Campaigns automated, team on AI workflows, engagement features building', color: COLORS.blue },
                  { days: '90', title: 'Scale & Productize', summary: 'Full engagement suite, battle-tested product ready for clients', color: COLORS.green },
                ].map((item) => (
                  <div
                    key={item.days}
                    className="rounded-xl p-5"
                    style={{
                      backgroundColor: COLORS.bgPrimary,
                      borderLeft: `3px solid ${item.color}`,
                    }}
                  >
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-display font-semibold" style={{ color: item.color }}>
                        {item.days}
                      </span>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>DAYS</span>
                    </div>
                    <p className="text-base font-display font-semibold mb-1">{item.title}</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>{item.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why This Works */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: COLORS.bgSurface, border: `1px solid ${COLORS.border}` }}
            >
              <p
                className="text-xs font-mono font-semibold tracking-[0.2em] uppercase mb-4"
                style={{ color: COLORS.textMuted }}
              >
                WHY THIS WORKS
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: '01', title: 'You Know the Systems', desc: 'Former TradeBlock product owner — no ramp-up time' },
                  { icon: '02', title: 'Technical + Product', desc: 'Engineer background means you can build AND lead' },
                  { icon: '03', title: 'PM + Engineer + User', desc: 'All three roles accelerates everything' },
                ].map((item) => (
                  <div key={item.icon} className="text-center p-4">
                    <div
                      className="text-2xl font-display font-semibold mb-3"
                      style={{ color: COLORS.gold }}
                    >
                      {item.icon}
                    </div>
                    <p className="text-sm font-semibold mb-1">{item.title}</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Principle */}
            <div
              className="rounded-2xl p-6"
              style={{
                backgroundColor: COLORS.bgElevated,
                border: `1px solid ${COLORS.gold}`,
                boxShadow: '0 0 60px rgba(212, 165, 74, 0.08)',
              }}
            >
              <p
                className="text-xs font-mono font-semibold tracking-[0.2em] uppercase mb-3"
                style={{ color: COLORS.gold }}
              >
                THE PRIORITY PRINCIPLE
              </p>
              <p className="text-base leading-relaxed mb-3" style={{ color: '#e4e4e7' }}>
                <strong style={{ color: COLORS.blue }}>TradeBlock pays the bills and proves the concept.</strong>{' '}
                Get that running first. But everything you build there becomes a{' '}
                <strong style={{ color: COLORS.gold }}>33 Strategies product</strong> — so you&apos;re
                never choosing between them, you&apos;re sequencing them.
              </p>
              <p className="text-sm" style={{ color: COLORS.green }}>
                When TradeBlock wins, 33 Strategies gets a proven product. When 33 Strategies builds
                features, TradeBlock gets first access.
              </p>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {activeTab === 'timeline' && (
          <div className="flex flex-col gap-4">
            {Object.entries(timelineData).map(([period, data]) => (
              <div
                key={period}
                onClick={() => toggleCard(`timeline-${period}`)}
                className="rounded-2xl p-6 cursor-pointer transition-all"
                style={{
                  backgroundColor: COLORS.bgSurface,
                  border: expandedCards[`timeline-${period}`]
                    ? `1px solid ${COLORS.gold}`
                    : `1px solid ${COLORS.border}`,
                  boxShadow: expandedCards[`timeline-${period}`]
                    ? '0 0 40px rgba(212, 165, 74, 0.1)'
                    : 'none',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-4xl font-display font-semibold" style={{ color: COLORS.gold }}>
                        {period}
                      </span>
                      <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.textMuted }}
                      >
                        days
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-semibold mb-1">{data.title}</h3>
                    <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>{data.subtitle}</p>
                    <p className="text-base" style={{ color: COLORS.textSecondary }}>{data.summary}</p>
                  </div>
                  <span
                    className="text-xl transition-transform"
                    style={{
                      color: COLORS.gold,
                      transform: expandedCards[`timeline-${period}`] ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                  >
                    ▼
                  </span>
                </div>

                {expandedCards[`timeline-${period}`] && (
                  <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <ul className="list-disc pl-5 space-y-2">
                      {data.details.map((detail, idx) => (
                        <li key={idx} className="text-sm" style={{ color: '#d4d4d8' }}>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Organization View */}
        {activeTab === 'organization' && (
          <div className="flex flex-col gap-6">
            {/* Two column layout for TradeBlock and 33 Strategies */}
            <div className="grid md:grid-cols-2 gap-4">
              {(['tradeblock', 'strategies'] as const).map(orgKey => {
                const org = orgData[orgKey];
                return (
                  <div
                    key={orgKey}
                    onClick={() => toggleCard(`org-${orgKey}`)}
                    className="rounded-2xl p-6 cursor-pointer transition-all"
                    style={{
                      backgroundColor: COLORS.bgSurface,
                      border: `1px solid ${expandedCards[`org-${orgKey}`] ? org.color : COLORS.border}`,
                      boxShadow: expandedCards[`org-${orgKey}`]
                        ? `0 0 40px ${org.color}20`
                        : 'none',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3
                          className="text-xl font-display font-semibold mb-1"
                          style={{ color: org.color }}
                        >
                          {org.title}
                        </h3>
                        <p className="text-sm" style={{ color: COLORS.textMuted }}>{org.subtitle}</p>
                      </div>
                      <span
                        className="text-base transition-transform"
                        style={{
                          color: org.color,
                          transform: expandedCards[`org-${orgKey}`] ? 'rotate(180deg)' : 'rotate(0)',
                        }}
                      >
                        ▼
                      </span>
                    </div>

                    {expandedCards[`org-${orgKey}`] && (
                      <div className="mt-5 flex flex-col gap-3">
                        {org.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg p-3"
                            style={{ backgroundColor: COLORS.bgPrimary }}
                          >
                            <p className="text-sm font-semibold mb-1">{item.title}</p>
                            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overlap section - full width */}
            <div
              onClick={() => toggleCard('org-overlap')}
              className="rounded-2xl p-6 cursor-pointer transition-all"
              style={{
                backgroundColor: COLORS.bgSurface,
                border: `1px solid ${expandedCards['org-overlap'] ? COLORS.green : COLORS.border}`,
                boxShadow: expandedCards['org-overlap']
                  ? '0 0 60px rgba(74, 222, 128, 0.15)'
                  : 'none',
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3
                    className="text-xl font-display font-semibold mb-1"
                    style={{ color: COLORS.green }}
                  >
                    {orgData.overlap.title}
                  </h3>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>
                    {orgData.overlap.subtitle}
                  </p>
                </div>
                <span
                  className="text-base transition-transform"
                  style={{
                    color: COLORS.green,
                    transform: expandedCards['org-overlap'] ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                >
                  ▼
                </span>
              </div>

              {expandedCards['org-overlap'] && (
                <div className="mt-5 grid md:grid-cols-3 gap-3">
                  {orgData.overlap.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-4 text-center"
                      style={{ backgroundColor: COLORS.bgPrimary }}
                    >
                      <p className="text-sm font-semibold mb-2" style={{ color: COLORS.green }}>
                        {item.title}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Priorities View */}
        {activeTab === 'priorities' && (
          <div className="flex flex-col gap-6">
            {/* Priority Levels */}
            <div className="flex flex-col gap-4">
              {priorityData.map((priority) => {
                const priorityColor =
                  priority.level === 1 ? COLORS.gold : priority.level === 2 ? COLORS.blue : COLORS.green;
                return (
                  <div
                    key={priority.level}
                    onClick={() => toggleCard(`priority-${priority.level}`)}
                    className="rounded-2xl p-6 cursor-pointer transition-all"
                    style={{
                      backgroundColor: COLORS.bgSurface,
                      border: expandedCards[`priority-${priority.level}`]
                        ? `1px solid ${COLORS.gold}`
                        : `1px solid ${COLORS.border}`,
                      boxShadow: expandedCards[`priority-${priority.level}`]
                        ? '0 0 40px rgba(212, 165, 74, 0.1)'
                        : 'none',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                          style={{ backgroundColor: priorityColor, color: COLORS.bgPrimary }}
                        >
                          {priority.level}
                        </div>
                        <div>
                          <h3 className="text-lg font-display font-semibold mb-1">{priority.title}</h3>
                          <p className="text-sm mb-1" style={{ color: COLORS.textMuted }}>
                            {priority.timeframe}
                          </p>
                          <p className="text-sm font-display italic" style={{ color: COLORS.gold }}>
                            &quot;{priority.rationale}&quot;
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-base transition-transform"
                        style={{
                          color: COLORS.gold,
                          transform: expandedCards[`priority-${priority.level}`]
                            ? 'rotate(180deg)'
                            : 'rotate(0)',
                        }}
                      >
                        ▼
                      </span>
                    </div>

                    {expandedCards[`priority-${priority.level}`] && (
                      <div
                        className="mt-5 ml-14 pt-4"
                        style={{ borderTop: `1px solid ${COLORS.border}` }}
                      >
                        <ul className="list-disc pl-5 space-y-2">
                          {priority.tasks.map((task, idx) => (
                            <li key={idx} className="text-sm" style={{ color: '#d4d4d8' }}>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Decision Tree */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: COLORS.bgSurface, border: `1px solid ${COLORS.border}` }}
            >
              <h3
                className="text-xs font-mono font-semibold tracking-[0.2em] uppercase mb-4"
                style={{ color: COLORS.gold }}
              >
                When Conflicts Arise
              </h3>
              <div className="flex flex-col gap-3">
                {decisionTree.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 rounded-lg"
                    style={{ backgroundColor: COLORS.bgPrimary }}
                  >
                    <span className="text-sm flex-1" style={{ color: COLORS.textSecondary }}>
                      {item.question}
                    </span>
                    <span className="text-sm font-semibold">→ {item.answer}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insight */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                backgroundColor: COLORS.bgElevated,
                border: `1px solid ${COLORS.gold}`,
                boxShadow: '0 0 60px rgba(212, 165, 74, 0.08)',
              }}
            >
              <p className="text-base leading-relaxed" style={{ color: '#e4e4e7' }}>
                You&apos;re not splitting time 50/50. You&apos;re building{' '}
                <strong style={{ color: COLORS.gold }}>one integrated system</strong> where TradeBlock
                success directly enables 33 Strategies success.
              </p>
              <p className="text-sm mt-3" style={{ color: COLORS.textSecondary }}>
                When TradeBlock wins, 33 Strategies gets a proven product.
                <br />
                When 33 Strategies builds features, TradeBlock gets first access.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SherrilRoleProposal;
