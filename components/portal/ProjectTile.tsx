'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ProjectData, WeekMindset } from './types';
import { StatusPill } from './StatusPill';
import { ProgressBar } from './ProgressBar';
import { TrackCard } from './TrackCard';
import { ActionItemCard } from './ActionItemCard';
import { GOLD, BG_PRIMARY, BG_SURFACE, GREEN } from './design-tokens';

interface ProjectTileProps {
  project: ProjectData;
  clientId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Find the current week's mindset based on week ranges like "1-2", "3-4", etc.
 */
function getCurrentMindset(
  currentWeek: number,
  weekMindset?: Record<string, WeekMindset>
): { range: string; mindset: WeekMindset } | null {
  if (!weekMindset) return null;

  for (const [range, mindset] of Object.entries(weekMindset)) {
    const [start, end] = range.split('-').map(Number);
    if (currentWeek >= start && currentWeek <= end) {
      return { range, mindset };
    }
  }
  return null;
}

export const ProjectTile: React.FC<ProjectTileProps> = ({
  project,
  clientId,
  isExpanded,
  onToggle,
}) => {
  const currentMindset = useMemo(
    () => getCurrentMindset(project.currentWeek, project.weekMindset),
    [project.currentWeek, project.weekMindset]
  );

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
      {/* Week Mindset Banner - Prominent positioning for founder focus */}
      {currentMindset && (
        <div
          style={{
            padding: '16px 24px',
            background: `linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, rgba(74, 222, 128, 0.03) 100%)`,
            borderBottom: `1px solid ${GREEN}33`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: GREEN,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Week {currentMindset.range} Mindset
            </span>
          </div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              margin: '0 0 6px 0',
              fontFamily: "'Instrument Serif', Georgia, serif",
            }}
          >
            {currentMindset.mindset.title}
          </p>
          <p
            style={{
              fontSize: 14,
              color: '#a3a3a3',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {currentMindset.mindset.message}
          </p>
        </div>
      )}

      {/* Header - Always visible */}
      <div style={{ padding: '20px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusPill status={project.status} size="sm" />
            <span
              style={{
                fontSize: 13,
                color: '#737373',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Week {project.currentWeek} of {project.totalWeeks}
            </span>
          </div>
          {/* View Full Project button - Always visible in header */}
          <Link
            href={`/client-portals/${clientId}/project/${project.id}`}
            style={{
              padding: '8px 16px',
              background: GOLD,
              color: BG_PRIMARY,
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.2s ease',
            }}
          >
            View Full Project
          </Link>
        </div>

        <div style={{ marginBottom: 20 }}>
          <ProgressBar current={project.currentWeek} total={project.totalWeeks} variant="continuous" />
        </div>

        <div style={{ marginBottom: isExpanded ? 8 : 0 }}>
          <h2
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 24,
              fontWeight: 500,
              color: '#fff',
              marginBottom: 4,
            }}
          >
            {project.name}
          </h2>
          <p style={{ fontSize: 14, color: '#737373', margin: 0 }}>{project.description}</p>

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
      <div
        style={{
          padding: '0 24px 20px',
          borderTop: '1px solid #1a1a1a',
          paddingTop: 20,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#525252',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
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
      <div
        style={{
          padding: '0 24px 20px',
          borderTop: '1px solid #1a1a1a',
          paddingTop: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span style={{ color: GOLD, fontSize: 14 }}>⚡</span>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: GOLD,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Your Priorities
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {project.actionItems.map((item) => (
            <ActionItemCard key={item.id} item={item} showContext={false} />
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
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#525252',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Coming Up Next
            </p>
            <p style={{ fontSize: 14, color: '#a3a3a3', margin: 0 }}>
              <span style={{ color: GOLD }}>Week {project.currentWeek + 1}:</span>{' '}
              {project.nextWeek.productBuild} • {project.nextWeek.strategy}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer with expand/collapse toggle */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
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
          <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>
            ∨
          </span>
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
    </motion.div>
  );
};

export default ProjectTile;
