'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
type TaskStatus = 'done' | 'in-progress' | 'upcoming';
type ArtifactType = 'PRESENTATION' | 'PROPOSAL' | 'DELIVERABLE';

interface Task {
  label: string;
  status: TaskStatus;
}

interface TrackData {
  title: string;
  tasks: Task[];
}

interface ActionItem {
  id: number;
  label: string;
  link: string;
  neededFor: string;
}

interface ProjectData {
  name: string;
  description: string;
  status: ProjectStatus;
  currentWeek: number;
  totalWeeks: number;
  targetDelivery: string;
  startDate: string;
  thisWeek: {
    productBuild: TrackData;
    strategy: TrackData;
  };
  nextWeek: {
    productBuild: string;
    strategy: string;
  };
  actionItems: ActionItem[];
}

interface ActiveWorkItem {
  id: number;
  module: string;
  context: string;
  status: string;
  progress: string;
  link: string;
}

interface Artifact {
  id: number;
  type: ArtifactType;
  title: string;
  description: string;
  date: string;
}

interface StatusPillProps {
  status: ProjectStatus;
}

interface ProgressBarProps {
  current: number;
  total: number;
}

interface TaskStatusIconProps {
  status: TaskStatus;
}

interface TrackCardProps {
  title: string;
  subtitle: string;
  color: 'gold' | 'green';
  tasks?: Task[] | null;
  compact?: boolean;
}

interface ActionItemProps {
  item: ActionItem;
  showContext?: boolean;
}

interface ProjectTileProps {
  project: ProjectData;
  isExpanded: boolean;
  onToggle: () => void;
}

interface ActiveWorkTileProps {
  item: ActiveWorkItem;
}

interface ArtifactTileProps {
  artifact: Artifact;
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
  
  thisWeek: {
    productBuild: {
      title: 'User system & database',
      tasks: [
        { label: 'Auth flow complete', status: 'done' },
        { label: 'Database schema done', status: 'done' },
        { label: 'Profile UI in progress', status: 'in-progress' },
      ]
    },
    strategy: {
      title: 'Persona refinement',
      tasks: [
        { label: 'Interview guide created', status: 'done' },
        { label: 'Running user interviews', status: 'in-progress' },
        { label: 'Persona documentation', status: 'upcoming' },
      ]
    }
  },
  
  nextWeek: {
    productBuild: 'Content engine & calendar UI',
    strategy: 'Strategy deck draft',
  },
  
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
};

const activeWork: ActiveWorkItem[] = [
  {
    id: 1,
    module: 'Persona Sharpener',
    context: 'Competitive Athlete',
    status: 'in-progress',
    progress: 'Step 3 of 5',
    link: '#',
  },
  {
    id: 2,
    module: 'Business Model Canvas',
    context: 'PLYA v1',
    status: 'in-progress',
    progress: 'Step 1 of 4',
    link: '#',
  },
];

const artifacts: Artifact[] = [
  {
    id: 1,
    type: 'PRESENTATION',
    title: 'IP: Protecting Both Yours and Ours',
    description: 'How we think about intellectual property in the context of client engagements',
    date: 'Dec 24, 2024',
  },
  {
    id: 2,
    type: 'PROPOSAL',
    title: 'The Path Forward',
    description: 'Explore your personalized roadmap to launch',
    date: 'Dec 1, 2024',
  },
  {
    id: 3,
    type: 'DELIVERABLE',
    title: 'Product Requirements Document (PRD)',
    description: 'Complete specification for PLYA v1 features and functionality',
    date: 'Jan 10, 2025',
  },
];

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
      padding: '4px 10px',
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
        fontSize: 11,
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
  const progress = (current / total) * 100;
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        height: 4,
        background: '#27272a',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD} 100%)`,
          borderRadius: 2,
        }} />
      </div>
      
      <div style={{
        position: 'absolute',
        left: `${progress}%`,
        top: -4,
        transform: 'translateX(-50%)',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: GOLD,
        border: `2px solid ${BG_SURFACE}`,
      }} />
    </div>
  );
};

const TaskStatusIcon: React.FC<TaskStatusIconProps> = ({ status }) => {
  if (status === 'done') {
    return <span style={{ color: GREEN, fontSize: 14 }}>✓</span>;
  }
  if (status === 'in-progress') {
    return <span style={{ color: GOLD, fontSize: 10 }}>●</span>;
  }
  return <span style={{ color: '#525252', fontSize: 10 }}>○</span>;
};

const TrackCard: React.FC<TrackCardProps> = ({ title, subtitle, color, tasks, compact = false }) => {
  const borderColor = color === 'gold' ? GOLD : GREEN;
  
  return (
    <div style={{
      flex: 1,
      padding: compact ? 12 : 16,
      background: BG_ELEVATED,
      borderRadius: 10,
      borderLeft: `3px solid ${borderColor}`,
    }}>
      <p style={{
        fontSize: 10,
        fontWeight: 600,
        color: borderColor,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        {title}
      </p>
      <p style={{
        fontSize: 14,
        color: '#e5e5e5',
        fontWeight: 500,
        margin: 0,
      }}>
        {subtitle}
      </p>
      
      {tasks && tasks.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasks.map((task, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TaskStatusIcon status={task.status} />
              <span style={{ 
                fontSize: 13, 
                color: task.status === 'done' ? '#737373' : '#a3a3a3',
              }}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionItemComponent: React.FC<ActionItemProps> = ({ item, showContext = false }) => (
  <a 
    href={item.link}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 16px',
      background: 'rgba(212, 168, 75, 0.08)',
      borderRadius: 8,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#525252', fontSize: 12 }}>○</span>
        <span style={{ fontSize: 14, color: '#e5e5e5', lineHeight: 1.4 }}>{item.label}</span>
      </div>
      {showContext && item.neededFor && (
        <p style={{ 
          fontSize: 12, 
          color: '#737373', 
          marginTop: 4, 
          marginLeft: 20,
          margin: '4px 0 0 20px',
        }}>
          Needed for: {item.neededFor}
        </p>
      )}
    </div>
    <span style={{ color: GOLD, fontSize: 16, flexShrink: 0 }}>→</span>
  </a>
);

// ============================================================================
// PROJECT TILE COMPONENT
// ============================================================================

const ProjectTile: React.FC<ProjectTileProps> = ({ project, isExpanded, onToggle }) => {
  return (
    <motion.div
      layout
      style={{
        background: BG_SURFACE,
        borderRadius: 16,
        border: '1px solid #27272a',
        overflow: 'hidden',
      }}
    >
      {/* Header - Always visible */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <StatusPill status={project.status} />
          <span style={{ 
            fontSize: 13, 
            color: '#737373',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Week {project.currentWeek} of {project.totalWeeks}
          </span>
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <ProgressBar current={project.currentWeek} total={project.totalWeeks} />
        </div>
        
        <div style={{ marginBottom: isExpanded ? 8 : 0 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 24,
            fontWeight: 500,
            color: '#fff',
            marginBottom: 4,
          }}>
            {project.name}
          </h2>
          <p style={{ fontSize: 14, color: '#737373', margin: 0 }}>
            {project.description}
          </p>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ 
                  fontSize: 13, 
                  color: '#525252', 
                  marginTop: 8,
                  margin: '8px 0 0 0',
                }}
              >
                Target delivery: <span style={{ color: '#a3a3a3' }}>{project.targetDelivery}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* This Week Section */}
      <div style={{ 
        padding: '0 24px 20px',
        borderTop: '1px solid #1a1a1a',
        paddingTop: 20,
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#525252',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          This Week
        </p>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <TrackCard 
            title="Product Build" 
            subtitle={project.thisWeek.productBuild.title}
            color="gold"
            tasks={isExpanded ? project.thisWeek.productBuild.tasks : null}
            compact={!isExpanded}
          />
          <TrackCard 
            title="Strategy" 
            subtitle={project.thisWeek.strategy.title}
            color="green"
            tasks={isExpanded ? project.thisWeek.strategy.tasks : null}
            compact={!isExpanded}
          />
        </div>
      </div>
      
      {/* Action Items Section */}
      <div style={{
        padding: '0 24px 20px',
        borderTop: '1px solid #1a1a1a',
        paddingTop: 20,
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 12,
        }}>
          <span style={{ color: GOLD, fontSize: 14 }}>⚡</span>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: GOLD,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Your Priorities
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {project.actionItems.map((item) => (
            <ActionItemComponent key={item.id} item={item} showContext={false} />
          ))}
        </div>
      </div>
      
      {/* Coming Up Next - Expanded only */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '0 24px 20px',
              borderTop: '1px solid #1a1a1a',
              paddingTop: 20,
            }}
          >
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#525252',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Coming Up Next
            </p>
            <p style={{ fontSize: 14, color: '#a3a3a3', margin: 0 }}>
              <span style={{ color: GOLD }}>Week {project.currentWeek + 1}:</span>{' '}
              {project.nextWeek.productBuild} • {project.nextWeek.strategy}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer with actions */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {isExpanded ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 20px',
                background: GOLD,
                color: BG_PRIMARY,
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View Full Project →
            </motion.button>
            <button
              onClick={onToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                background: 'transparent',
                color: '#737373',
                border: '1px solid #27272a',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#525252';
                e.currentTarget.style.color = '#a3a3a3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#27272a';
                e.currentTarget.style.color = '#737373';
              }}
            >
              <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>∨</span>
              Collapse
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: 'transparent',
              color: '#737373',
              border: '1px solid #27272a',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              marginLeft: 'auto',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#525252';
              e.currentTarget.style.color = '#a3a3a3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.color = '#737373';
            }}
          >
            <span>∨</span>
            Expand
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// ACTIVE WORK TILE COMPONENT
// ============================================================================

const ActiveWorkTile: React.FC<ActiveWorkTileProps> = ({ item }) => (
  <motion.a
    href={item.link}
    whileHover={{ scale: 1.01, y: -2 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      background: BG_SURFACE,
      borderRadius: 12,
      border: '1px solid #27272a',
      textDecoration: 'none',
      transition: 'border-color 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = GOLD;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#27272a';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: GOLD_DIM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: GOLD, fontSize: 16 }}>●</span>
      </div>
      
      <div>
        <p style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          margin: 0,
          marginBottom: 2,
        }}>
          {item.module}
        </p>
        <p style={{
          fontSize: 13,
          color: '#737373',
          margin: 0,
        }}>
          {item.context}
        </p>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{
        fontSize: 11,
        color: GOLD,
        padding: '4px 10px',
        background: GOLD_DIM,
        borderRadius: 4,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {item.progress}
      </span>
      <span style={{ color: '#525252', fontSize: 16 }}>→</span>
    </div>
  </motion.a>
);

// ============================================================================
// ARTIFACT TILE COMPONENT
// ============================================================================

const ArtifactTile: React.FC<ArtifactTileProps> = ({ artifact }) => {
  const typeColors: Record<ArtifactType, { color: string; bg: string }> = {
    'PRESENTATION': { color: '#a3a3a3', bg: 'rgba(163, 163, 163, 0.1)' },
    'PROPOSAL': { color: GOLD, bg: GOLD_DIM },
    'DELIVERABLE': { color: GREEN, bg: GREEN_DIM },
  };
  
  const { color, bg } = typeColors[artifact.type] || typeColors['PRESENTATION'];
  
  return (
    <motion.a
      href="#"
      whileHover={{ scale: 1.01, y: -2 }}
      style={{
        display: 'block',
        padding: 24,
        background: BG_SURFACE,
        borderRadius: 12,
        border: '1px solid #27272a',
        textDecoration: 'none',
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3f3f46';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#27272a';
      }}
    >
      <div style={{
        display: 'inline-flex',
        padding: '4px 10px',
        background: bg,
        borderRadius: 4,
        marginBottom: 16,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: color,
          letterSpacing: '0.1em',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {artifact.type}
        </span>
      </div>
      
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 18,
        fontWeight: 500,
        color: '#fff',
        marginBottom: 8,
        lineHeight: 1.3,
      }}>
        {artifact.title}
      </h3>
      
      <p style={{
        fontSize: 14,
        color: '#737373',
        lineHeight: 1.5,
        marginBottom: 16,
      }}>
        {artifact.description}
      </p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTop: '1px solid #1a1a1a',
      }}>
        <span style={{
          fontSize: 12,
          color: '#525252',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Added {artifact.date}
        </span>
        <span style={{ color: '#525252', fontSize: 16 }}>→</span>
      </div>
    </motion.a>
  );
};

// ============================================================================
// MAIN PORTAL COMPONENT
// ============================================================================

export default function PLYAPortal(): JSX.Element {
  const [projectExpanded, setProjectExpanded] = useState<boolean>(false);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: BG_PRIMARY,
      color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Portal Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: GOLD,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Client Portal
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 48,
            fontWeight: 500,
            color: '#fff',
            margin: 0,
          }}>
            PLYA
          </h1>
        </div>
        
        {/* Active Projects Section */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#525252',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Active Projects
          </h2>
          
          <ProjectTile 
            project={projectData}
            isExpanded={projectExpanded}
            onToggle={() => setProjectExpanded(!projectExpanded)}
          />
        </section>
        
        {/* Active Work Section */}
        {activeWork.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#525252',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              Active Work
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeWork.map((item) => (
                <ActiveWorkTile key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
        
        {/* Divider */}
        <div style={{
          height: 1,
          background: '#1a1a1a',
          marginBottom: 48,
        }} />
        
        {/* Artifacts Section */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#525252',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Artifacts
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {artifacts.map((artifact) => (
              <ArtifactTile key={artifact.id} artifact={artifact} />
            ))}
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
