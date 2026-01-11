'use client';

import React from 'react';
import Link from 'next/link';
import { ProjectData } from './types';
import { StatusPill } from './StatusPill';
import { ProgressBar } from './ProgressBar';
import { ActionItemCard } from './ActionItemCard';
import { TimelineBlock } from './TimelineBlock';
import { DeliverableRow } from './DeliverableRow';
import { GOLD, GREEN, BG_PRIMARY, BG_SURFACE } from './design-tokens';

interface ProjectDetailPageProps {
  project: ProjectData;
  clientId: string;
}

export function ProjectDetailPage({ project, clientId }: ProjectDetailPageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG_PRIMARY,
        color: '#fff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Back Navigation */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #1a1a1a',
          position: 'sticky',
          top: 0,
          background: BG_PRIMARY,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Link
            href={`/client-portals/${clientId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: '#737373',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#a3a3a3')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
          >
            ← Back to Portal
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 64px' }}>
        {/* Hero Section */}
        <section
          style={{
            padding: 32,
            background: BG_SURFACE,
            borderRadius: 20,
            border: '1px solid #27272a',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 36,
                  fontWeight: 500,
                  color: '#fff',
                  marginBottom: 8,
                }}
              >
                {project.name}
              </h1>
              <p style={{ fontSize: 16, color: '#737373', margin: 0 }}>{project.description}</p>
            </div>
            <StatusPill status={project.status} />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 32,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Started</p>
              <p
                style={{
                  fontSize: 14,
                  color: '#a3a3a3',
                  margin: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {project.startDate}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Target Delivery</p>
              <p
                style={{
                  fontSize: 14,
                  color: '#a3a3a3',
                  margin: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {project.targetDelivery}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Progress</p>
              <p
                style={{
                  fontSize: 14,
                  color: GOLD,
                  margin: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Week {project.currentWeek} of {project.totalWeeks}
              </p>
            </div>
          </div>

          <ProgressBar
            current={project.currentWeek}
            total={project.totalWeeks}
            variant="segmented"
            showLabels
          />
        </section>

        {/* Action Items Section */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <span style={{ color: GOLD, fontSize: 18 }}>⚡</span>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: GOLD,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Your Priorities
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {project.actionItems.map((item) => (
              <ActionItemCard key={item.id} item={item} showContext />
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#525252',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Project Timeline
          </h2>

          {/* Product Build Track */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ width: 12, height: 3, background: GOLD, borderRadius: 2 }} />
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: GOLD,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                Product Build
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
              }}
            >
              {project.timeline.productBuild.map((block, i) => (
                <TimelineBlock
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ width: 12, height: 3, background: GREEN, borderRadius: 2 }} />
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: GREEN,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                Strategy & Go-to-Market
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
              }}
            >
              {project.timeline.strategy.map((block, i) => (
                <TimelineBlock
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
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#525252',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Deliverables
          </h2>

          <div
            style={{
              background: BG_SURFACE,
              borderRadius: 16,
              border: '1px solid #27272a',
              overflow: 'hidden',
            }}
          >
            {/* Completed */}
            <div style={{ padding: '20px 20px 12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ color: GREEN, fontSize: 12 }}>✓</span>
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: GREEN,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Completed ({project.deliverables.completed.length})
                </h3>
              </div>
              {project.deliverables.completed.map((item, i) => (
                <DeliverableRow key={i} item={item} type="completed" />
              ))}
            </div>

            {/* In Progress */}
            <div
              style={{
                padding: '20px 20px 12px',
                borderTop: '1px solid #1a1a1a',
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
                <span style={{ color: GOLD, fontSize: 12 }}>●</span>
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: GOLD,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  In Progress ({project.deliverables.inProgress.length})
                </h3>
              </div>
              {project.deliverables.inProgress.map((item, i) => (
                <DeliverableRow key={i} item={item} type="inProgress" />
              ))}
            </div>

            {/* Upcoming */}
            <div
              style={{
                padding: '20px 20px 12px',
                borderTop: '1px solid #1a1a1a',
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
                <span style={{ color: '#525252', fontSize: 12 }}>○</span>
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#737373',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Upcoming ({project.deliverables.upcoming.length})
                </h3>
              </div>
              {project.deliverables.upcoming.map((item, i) => (
                <DeliverableRow key={i} item={item} type="upcoming" />
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div
          style={{
            paddingTop: 32,
            borderTop: '1px solid #1a1a1a',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 20,
              fontWeight: 500,
              color: '#3f3f46',
              margin: 0,
            }}
          >
            <span style={{ color: GOLD }}>33</span> Strategies
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
