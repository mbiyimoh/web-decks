'use client';

import React from 'react';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const GOLD = '#D4A84B';
const GOLD_DIM = 'rgba(212, 168, 75, 0.15)';
const GREEN = '#4ade80';
const GREEN_DIM = 'rgba(74, 222, 128, 0.15)';
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';
const BG_ELEVATED = '#1a1a1a';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ProjectStatus = 'on-track' | 'ahead' | 'attention';
type TimelineBlockStatus = 'done' | 'current' | 'upcoming';
type DeliverableType = 'completed' | 'inProgress' | 'upcoming';

interface ActionItem {
  id: number;
  label: string;
  link: string;
  neededFor: string;
}

interface TimelineBlock {
  weeks: string;
  phase: string;
  status: TimelineBlockStatus;
  items: string[];
}

interface CompletedDeliverable {
  name: string;
  date: string;
  link: string;
}

interface InProgressDeliverable {
  name: string;
  estimate: string;
  progress?: string;
}

interface UpcomingDeliverable {
  name: string;
  week: string;
}

interface ProjectData {
  name: string;
  description: string;
  status: ProjectStatus;
  currentWeek: number;
  totalWeeks: number;
  targetDelivery: string;
  startDate: string;
  actionItems: ActionItem[];
  timeline: {
    productBuild: TimelineBlock[];
    strategy: TimelineBlock[];
  };
  deliverables: {
    completed: CompletedDeliverable[];
    inProgress: InProgressDeliverable[];
    upcoming: UpcomingDeliverable[];
  };
}

interface StatusPillProps {
  status: ProjectStatus;
}

interface ProgressBarProps {
  current: number;
  total: number;
}

interface ActionItemComponentProps {
  item: ActionItem;
}

interface TimelineBlockComponentProps {
  data: TimelineBlock;
  color: 'gold' | 'green';
  isCurrent: boolean;
}

interface DeliverableRowProps {
  item: CompletedDeliverable | InProgressDeliverable | UpcomingDeliverable;
  type: DeliverableType;
}

// ============================================================================
// PROJECT DATA (Replace with props/API data in production)
// ============================================================================

const projectData: ProjectData = {
  name: 'PLYA Fitness App',
  description: 'AI-powered workout planning for athletes',
  status: 'on-track',
  currentWeek: 3,
  totalWeeks: 8,
  targetDelivery: 'Feb 28, 2025',
  startDate: 'Jan 6, 2025',
  
  actionItems: [
    { 
      id: 1, 
      label: 'Add 10 potential beta users to the spreadsheet',
      link: '#',
      neededFor: 'Beta testing phase (Week 6)',
    },
    { 
      id: 2, 
      label: 'Complete persona sharpener for "Competitive Athlete"',
      link: '#',
      neededFor: 'AI coach personality tuning',
    },
    { 
      id: 3, 
      label: 'Review wireframes in Figma, leave comments',
      link: '#',
      neededFor: 'High-fidelity design kickoff',
    },
  ],
  
  timeline: {
    productBuild: [
      {
        weeks: '1-2',
        phase: 'Foundation',
        status: 'done',
        items: ['PRD', 'User stories', 'Journey maps', 'Wireframes', 'Design system', 'Hi-fi designs', 'Prototype'],
      },
      {
        weeks: '3-4',
        phase: 'Frame',
        status: 'current',
        items: ['User auth', 'Database schema', 'Profile system', 'Frontend architecture'],
      },
      {
        weeks: '5-6',
        phase: 'Frame',
        status: 'upcoming',
        items: ['Content engine', 'Calendar UI', 'Daily views', 'QA & testing'],
      },
      {
        weeks: '7-8',
        phase: 'Finish',
        status: 'upcoming',
        items: ['AI tagging', 'AI coach chat', 'Smart plans', 'Polish & deploy'],
      },
    ],
    strategy: [
      {
        weeks: '1-2',
        phase: 'Personas',
        status: 'done',
        items: ['Target refinement', 'Documentation', 'Interview guide'],
      },
      {
        weeks: '3-4',
        phase: 'Strategy',
        status: 'current',
        items: ['Business plan', 'Strategy deck', 'Pitch prep'],
      },
      {
        weeks: '5-6',
        phase: 'Landing Page',
        status: 'upcoming',
        items: ['Design', 'Copy', 'Build', 'Launch'],
      },
      {
        weeks: '7-8',
        phase: 'Feedback',
        status: 'upcoming',
        items: ['System setup', 'Synthesis', 'Recommendations'],
      },
    ],
  },
  
  deliverables: {
    completed: [
      { name: 'Product Requirements Document (PRD)', date: 'Jan 10', link: '#' },
      { name: 'User Stories & Feature Specs', date: 'Jan 12', link: '#' },
      { name: 'User Journey Maps', date: 'Jan 14', link: '#' },
      { name: 'Wireframes', date: 'Jan 17', link: '#' },
      { name: 'Target Persona Documentation', date: 'Jan 15', link: '#' },
    ],
    inProgress: [
      { name: 'Visual Design System', estimate: 'Jan 20' },
      { name: 'High-Fidelity Screen Designs', estimate: 'Jan 22' },
      { name: 'User Interviews', progress: '3 of 5', estimate: 'Jan 21' },
    ],
    upcoming: [
      { name: 'Clickable Prototype', week: 'Week 2' },
      { name: 'User Auth System', week: 'Week 3-4' },
      { name: 'Strategy Deck', week: 'Week 3-4' },
      { name: 'Content Engine', week: 'Week 5-6' },
      { name: 'Calendar & Planning UI', week: 'Week 5-6' },
      { name: 'Landing Page', week: 'Week 5-6' },
      { name: 'AI Content Tagging', week: 'Week 7-8' },
      { name: 'AI Coach Chat', week: 'Week 7-8' },
      { name: 'Smart Plan Generation', week: 'Week 7-8' },
    ],
  },
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const config = {
    'on-track': { label: 'ON TRACK', color: GREEN, bg: GREEN_DIM },
    'ahead': { label: 'AHEAD', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
    'attention': { label: 'NEEDS ATTENTION', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
  };
  
  const { label, color, bg } = config[status] || config['on-track'];
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      background: bg,
      borderRadius: 20,
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
      }} />
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: color,
        letterSpacing: '0.05em',
      }}>
        {label}
      </span>
    </div>
  );
};

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const segments = Array.from({ length: total }, (_, i) => i + 1);
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        gap: 4,
        marginBottom: 8,
      }}>
        {segments.map((week) => (
          <div
            key={week}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: week < current ? GOLD : week === current ? GOLD : '#27272a',
              opacity: week <= current ? 1 : 0.5,
              position: 'relative',
            }}
          >
            {week === current && (
              <div style={{
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: GOLD,
                border: `2px solid ${BG_PRIMARY}`,
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        paddingTop: 4,
      }}>
        {segments.map((week) => (
          <span 
            key={week}
            style={{
              fontSize: 10,
              color: week === current ? GOLD : '#525252',
              fontWeight: week === current ? 600 : 400,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {week}
          </span>
        ))}
      </div>
    </div>
  );
};

const ActionItemComponent: React.FC<ActionItemComponentProps> = ({ item }) => (
  <a 
    href={item.link}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      padding: '16px 20px',
      background: 'rgba(212, 168, 75, 0.08)',
      borderRadius: 10,
      border: '1px solid rgba(212, 168, 75, 0.2)',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(212, 168, 75, 0.12)';
      e.currentTarget.style.borderColor = 'rgba(212, 168, 75, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(212, 168, 75, 0.08)';
      e.currentTarget.style.borderColor = 'rgba(212, 168, 75, 0.2)';
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#525252', fontSize: 14 }}>○</span>
        <span style={{ fontSize: 15, color: '#e5e5e5', lineHeight: 1.4 }}>{item.label}</span>
      </div>
      {item.neededFor && (
        <p style={{ 
          fontSize: 13, 
          color: '#737373', 
          marginTop: 6, 
          marginLeft: 24,
          margin: '6px 0 0 24px',
        }}>
          Needed for: <span style={{ color: '#a3a3a3' }}>{item.neededFor}</span>
        </p>
      )}
    </div>
    <span style={{ color: GOLD, fontSize: 18, flexShrink: 0 }}>→</span>
  </a>
);

const TimelineBlockComponent: React.FC<TimelineBlockComponentProps> = ({ data, color, isCurrent }) => {
  const borderColor = color === 'gold' ? GOLD : GREEN;
  const bgColor = isCurrent 
    ? (color === 'gold' ? 'rgba(212, 168, 75, 0.1)' : 'rgba(74, 222, 128, 0.1)')
    : BG_ELEVATED;
  
  return (
    <div style={{
      flex: 1,
      padding: 16,
      background: bgColor,
      borderRadius: 10,
      borderTop: `3px solid ${data.status === 'upcoming' ? '#3f3f46' : borderColor}`,
      opacity: data.status === 'upcoming' ? 0.6 : 1,
      position: 'relative',
    }}>
      {isCurrent && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 8px',
          background: borderColor,
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 700,
          color: BG_PRIMARY,
          letterSpacing: '0.05em',
        }}>
          NOW
        </div>
      )}
      
      <p style={{
        fontSize: 10,
        color: '#525252',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 4,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        Week {data.weeks}
      </p>
      
      <p style={{
        fontSize: 15,
        fontWeight: 600,
        color: data.status === 'upcoming' ? '#a3a3a3' : '#fff',
        marginBottom: 12,
      }}>
        {data.phase}
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              fontSize: 10, 
              color: data.status === 'done' ? GREEN : data.status === 'current' ? GOLD : '#525252',
            }}>
              {data.status === 'done' ? '✓' : data.status === 'current' ? '●' : '○'}
            </span>
            <span style={{ 
              fontSize: 12, 
              color: data.status === 'upcoming' ? '#525252' : '#a3a3a3',
            }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DeliverableRow: React.FC<DeliverableRowProps> = ({ item, type }) => {
  const statusIcon = type === 'completed' ? '✓' : type === 'inProgress' ? '●' : '○';
  const statusColor = type === 'completed' ? GREEN : type === 'inProgress' ? GOLD : '#525252';
  
  // Type guards for different deliverable types
  const isCompleted = (d: typeof item): d is CompletedDeliverable => 'link' in d;
  const isInProgress = (d: typeof item): d is InProgressDeliverable => 'estimate' in d && !('link' in d);
  
  const dateOrWeek = isCompleted(item) 
    ? item.date 
    : isInProgress(item) 
      ? item.estimate 
      : (item as UpcomingDeliverable).week;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: type === 'inProgress' ? 'rgba(212, 168, 75, 0.05)' : 'transparent',
      borderRadius: 8,
      borderBottom: '1px solid #1a1a1a',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <span style={{ color: statusColor, fontSize: 12 }}>{statusIcon}</span>
        <span style={{ 
          fontSize: 14, 
          color: type === 'upcoming' ? '#737373' : '#e5e5e5',
        }}>
          {item.name}
        </span>
        {isInProgress(item) && item.progress && (
          <span style={{
            fontSize: 11,
            color: GOLD,
            padding: '2px 8px',
            background: GOLD_DIM,
            borderRadius: 4,
          }}>
            {item.progress}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{
          fontSize: 12,
          color: '#525252',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {dateOrWeek}
        </span>
        {isCompleted(item) && item.link && (
          <a 
            href={item.link}
            style={{
              fontSize: 12,
              color: GOLD,
              textDecoration: 'none',
            }}
          >
            View →
          </a>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PLYAProjectPage(): JSX.Element {
  return (
    <div style={{
      minHeight: '100vh',
      background: BG_PRIMARY,
      color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Back Navigation */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky',
        top: 0,
        background: BG_PRIMARY,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <a 
            href="#"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: '#737373',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#a3a3a3'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#737373'}
          >
            ← Back to Portal
          </a>
        </div>
      </div>
      
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 64px' }}>
        
        {/* Hero Section */}
        <section style={{
          padding: 32,
          background: BG_SURFACE,
          borderRadius: 20,
          border: '1px solid #27272a',
          marginBottom: 32,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 36,
                fontWeight: 500,
                color: '#fff',
                marginBottom: 8,
              }}>
                {projectData.name}
              </h1>
              <p style={{ fontSize: 16, color: '#737373', margin: 0 }}>
                {projectData.description}
              </p>
            </div>
            <StatusPill status={projectData.status} />
          </div>
          
          <div style={{
            display: 'flex',
            gap: 32,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Started</p>
              <p style={{ fontSize: 14, color: '#a3a3a3', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                {projectData.startDate}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Target Delivery</p>
              <p style={{ fontSize: 14, color: '#a3a3a3', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                {projectData.targetDelivery}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Progress</p>
              <p style={{ fontSize: 14, color: GOLD, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                Week {projectData.currentWeek} of {projectData.totalWeeks}
              </p>
            </div>
          </div>
          
          <ProgressBar current={projectData.currentWeek} total={projectData.totalWeeks} />
          
          <div style={{
            marginTop: 20,
            textAlign: 'center',
          }}>
            <span style={{
              fontSize: 11,
              color: GOLD,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              ▲ YOU ARE HERE
            </span>
          </div>
        </section>
        
        {/* Action Items Section */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            marginBottom: 20,
          }}>
            <span style={{ color: GOLD, fontSize: 18 }}>⚡</span>
            <h2 style={{
              fontSize: 14,
              fontWeight: 600,
              color: GOLD,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Your Priorities
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projectData.actionItems.map((item) => (
              <ActionItemComponent key={item.id} item={item} />
            ))}
          </div>
        </section>
        
        {/* Timeline Section */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#525252',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Project Timeline
          </h2>
          
          {/* Product Build Track */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 16,
            }}>
              <div style={{ width: 12, height: 3, background: GOLD, borderRadius: 2 }} />
              <h3 style={{
                fontSize: 13,
                fontWeight: 600,
                color: GOLD,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Product Build
              </h3>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: 12,
            }}>
              {projectData.timeline.productBuild.map((block, i) => (
                <TimelineBlockComponent 
                  key={i} 
                  data={block} 
                  color="gold"
                  isCurrent={block.status === 'current'}
                />
              ))}
            </div>
          </div>
          
          {/* Strategy Track */}
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 16,
            }}>
              <div style={{ width: 12, height: 3, background: GREEN, borderRadius: 2 }} />
              <h3 style={{
                fontSize: 13,
                fontWeight: 600,
                color: GREEN,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Strategy & Go-to-Market
              </h3>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: 12,
            }}>
              {projectData.timeline.strategy.map((block, i) => (
                <TimelineBlockComponent 
                  key={i} 
                  data={block} 
                  color="green"
                  isCurrent={block.status === 'current'}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Deliverables Section */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#525252',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Deliverables
          </h2>
          
          <div style={{
            background: BG_SURFACE,
            borderRadius: 16,
            border: '1px solid #27272a',
            overflow: 'hidden',
          }}>
            {/* Completed */}
            <div style={{ padding: '20px 20px 12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12,
              }}>
                <span style={{ color: GREEN, fontSize: 12 }}>✓</span>
                <h3 style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: GREEN,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  Completed ({projectData.deliverables.completed.length})
                </h3>
              </div>
              {projectData.deliverables.completed.map((item, i) => (
                <DeliverableRow key={i} item={item} type="completed" />
              ))}
            </div>
            
            {/* In Progress */}
            <div style={{ 
              padding: '20px 20px 12px',
              borderTop: '1px solid #1a1a1a',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12,
              }}>
                <span style={{ color: GOLD, fontSize: 12 }}>●</span>
                <h3 style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: GOLD,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  In Progress ({projectData.deliverables.inProgress.length})
                </h3>
              </div>
              {projectData.deliverables.inProgress.map((item, i) => (
                <DeliverableRow key={i} item={item} type="inProgress" />
              ))}
            </div>
            
            {/* Upcoming */}
            <div style={{ 
              padding: '20px 20px 12px',
              borderTop: '1px solid #1a1a1a',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12,
              }}>
                <span style={{ color: '#525252', fontSize: 12 }}>○</span>
                <h3 style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#737373',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  Upcoming ({projectData.deliverables.upcoming.length})
                </h3>
              </div>
              {projectData.deliverables.upcoming.map((item, i) => (
                <DeliverableRow key={i} item={item} type="upcoming" />
              ))}
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <div style={{
          paddingTop: 32,
          borderTop: '1px solid #1a1a1a',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20,
            fontWeight: 500,
            color: '#3f3f46',
            margin: 0,
          }}>
            <span style={{ color: GOLD }}>33</span> Strategies
          </p>
        </div>
        
      </div>
    </div>
  );
}
