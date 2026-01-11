'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ProjectData } from './types';
import { StatusPill } from './StatusPill';
import { ProgressBar } from './ProgressBar';
import { TrackCard } from './TrackCard';
import { ActionItemCard } from './ActionItemCard';
import { GOLD, BG_PRIMARY, BG_SURFACE } from './design-tokens';

interface ProjectTileProps {
  project: ProjectData;
  clientId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ProjectTile: React.FC<ProjectTileProps> = ({
  project,
  clientId,
  isExpanded,
  onToggle,
}) => {
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
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

      {/* Footer with actions */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {isExpanded ? (
          <>
            <Link
              href={`/client-portals/${clientId}/project/${project.id}`}
              style={{
                padding: '10px 20px',
                background: GOLD,
                color: BG_PRIMARY,
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View Full Project →
            </Link>
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

export default ProjectTile;
