'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProjectData, ActiveWorkItem, Artifact } from './types';
import { ProjectTile } from './ProjectTile';
import { ActiveWorkTile } from './ActiveWorkTile';
import { GOLD, BG_PRIMARY, BG_SURFACE } from './design-tokens';

// Serializable content item (from existing ContentIndex)
interface ContentItemData {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  addedOn?: string;
  lastUpdated?: string;
  tagOverride?: string;
}

interface ClientData {
  id: string;
  name: string;
  content: ContentItemData[];
}

interface EnhancedPortalProps {
  client: ClientData;
  project: ProjectData | null;
  activeWork: ActiveWorkItem[];
  portalType?: 'client' | 'strategist';
}

// Format date string (YYYY-MM-DD) to readable format (Dec 24, 2024)
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const typeLabels: Record<ContentItemData['type'], string> = {
  deck: 'Presentation',
  proposal: 'Proposal',
  document: 'Document',
};

// Artifact tile component (adapted from ContentTile)
function ArtifactTile({
  item,
  clientId,
  index,
  isNewest,
  portalType = 'client',
}: {
  item: ContentItemData;
  clientId: string;
  index: number;
  isNewest: boolean;
  portalType?: 'client' | 'strategist';
}) {
  const GOLD_GLOW = 'rgba(212, 165, 74, 0.25)';
  const basePath = portalType === 'strategist' ? 'strategist-portals' : 'client-portals';

  return (
    <motion.div
      key={item.slug}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        href={`/${basePath}/${clientId}/${item.slug}`}
        className="block rounded-xl p-6 transition-all duration-300 group relative"
        style={{
          background: isNewest
            ? 'linear-gradient(135deg, rgba(212, 165, 74, 0.08) 0%, rgba(212, 165, 74, 0.02) 100%)'
            : 'rgba(255, 255, 255, 0.03)',
          border: isNewest ? `1px solid ${GOLD}` : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isNewest
            ? `0 0 40px ${GOLD_GLOW}, 0 0 80px rgba(212, 165, 74, 0.1)`
            : 'none',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Type badge */}
            <span
              className="inline-block px-2 py-0.5 text-xs font-mono font-medium tracking-wider uppercase rounded mb-3"
              style={{
                background: isNewest ? 'rgba(212, 165, 74, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: isNewest ? GOLD : '#888',
                border: isNewest
                  ? `1px solid rgba(212, 165, 74, 0.3)`
                  : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {item.tagOverride || typeLabels[item.type]}
            </span>

            {/* Title */}
            <h2
              className="text-xl font-display transition-colors"
              style={{ color: isNewest ? '#fff' : '#f5f5f5' }}
            >
              {item.title}
            </h2>

            {/* Description */}
            {item.description && (
              <p
                className="text-sm mt-2 font-body"
                style={{ color: isNewest ? '#a3a3a3' : '#888' }}
              >
                {item.description}
              </p>
            )}

            {/* Dates */}
            {(item.addedOn || item.lastUpdated) && (
              <p className="text-xs mt-3 font-mono" style={{ color: '#525252' }}>
                {item.lastUpdated ? (
                  <>Updated {formatDate(item.lastUpdated)}</>
                ) : item.addedOn ? (
                  <>Added {formatDate(item.addedOn)}</>
                ) : null}
              </p>
            )}
          </div>

          {/* Arrow icon */}
          <div
            className="transition-all duration-300 ml-4 group-hover:translate-x-1"
            style={{ color: isNewest ? GOLD : '#555' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EnhancedPortal({
  client,
  project,
  activeWork,
  portalType = 'client',
}: EnhancedPortalProps) {
  const [projectExpanded, setProjectExpanded] = useState(false);

  // Sort content by addedOn date, newest first
  const sortedContent = [...client.content].sort((a, b) => {
    if (!a.addedOn && !b.addedOn) return 0;
    if (!a.addedOn) return 1;
    if (!b.addedOn) return -1;
    return b.addedOn.localeCompare(a.addedOn);
  });

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: BG_PRIMARY }}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-12">
            <p
              className="uppercase tracking-[0.2em] text-xs mb-3 font-mono"
              style={{ color: GOLD }}
            >
              {portalType === 'strategist' ? 'Strategist Portal' : 'Client Portal'}
            </p>
            <h1 className="text-4xl md:text-5xl font-display text-white">{client.name}</h1>
          </div>

          {/* Active Projects Section */}
          {project && (
            <section className="mb-12">
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#525252',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                Active Projects
              </h2>

              <ProjectTile
                project={project}
                clientId={client.id}
                isExpanded={projectExpanded}
                onToggle={() => setProjectExpanded(!projectExpanded)}
              />
            </section>
          )}

          {/* Active Work Section */}
          {activeWork.length > 0 && (
            <section className="mb-12">
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#525252',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                Active Work
              </h2>

              <div className="flex flex-col gap-3">
                {activeWork.map((item) => (
                  <ActiveWorkTile key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Divider - only if there's project or active work content above */}
          {(project || activeWork.length > 0) && (
            <div
              style={{
                height: 1,
                background: '#1a1a1a',
                marginBottom: 48,
              }}
            />
          )}

          {/* Artifacts Section */}
          <section className="mb-12">
            <h2
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#525252',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              Artifacts
            </h2>

            <div className="space-y-4">
              {sortedContent.map((item, index) => (
                <ArtifactTile
                  key={item.slug}
                  item={item}
                  clientId={client.id}
                  index={index}
                  isNewest={index === 0}
                  portalType={portalType}
                />
              ))}
            </div>
          </section>

          {/* Footer */}
          <div
            className="mt-12 pt-8 border-t"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <p className="text-sm text-center font-body" style={{ color: '#555' }}>
              <span className="font-display" style={{ color: GOLD }}>
                33
              </span>{' '}
              Strategies
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export { EnhancedPortal };
