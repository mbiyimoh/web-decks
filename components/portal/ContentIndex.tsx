'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// Brand constants
const GOLD = '#d4a54a';
const GOLD_GLOW = 'rgba(212, 165, 74, 0.25)';
const BG_PRIMARY = '#0a0a0f';

// Serializable content item (no component reference)
interface ContentItemData {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  addedOn?: string;
  lastUpdated?: string;
  tagOverride?: string;
}

// Format date string (YYYY-MM-DD) to readable format (Dec 24, 2024)
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Serializable client data (can be passed from Server to Client component)
interface ClientData {
  id: string;
  name: string;
  content: ContentItemData[];
}

interface ContentIndexProps {
  client: ClientData;
  portalType?: 'client' | 'strategist';
}

const typeLabels: Record<ContentItemData['type'], string> = {
  deck: 'Presentation',
  proposal: 'Proposal',
  document: 'Document',
};

// Content tile component with special styling for the most recent item
function ContentTile({
  item,
  clientId,
  index,
  isNewest,
  portalType = 'client'
}: {
  item: ContentItemData;
  clientId: string;
  index: number;
  isNewest: boolean;
  portalType?: 'client' | 'strategist';
}) {
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
          border: isNewest
            ? `1px solid ${GOLD}`
            : '1px solid rgba(255, 255, 255, 0.08)',
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
                border: isNewest ? `1px solid rgba(212, 165, 74, 0.3)` : '1px solid rgba(255, 255, 255, 0.1)',
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
              <p
                className="text-xs mt-3 font-mono"
                style={{ color: '#525252' }}
              >
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ContentIndex({ client, portalType = 'client' }: ContentIndexProps) {
  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: BG_PRIMARY }}
    >
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-4xl md:text-5xl font-display text-white">
              {client.name}
            </h1>
          </div>

          {/* Content tiles - sorted by addedOn date, newest first */}
          <div className="space-y-4">
            {[...client.content]
              .sort((a, b) => {
                // Sort by addedOn date descending (newest first)
                // Items without dates go to the end
                if (!a.addedOn && !b.addedOn) return 0;
                if (!a.addedOn) return 1;
                if (!b.addedOn) return -1;
                return b.addedOn.localeCompare(a.addedOn);
              })
              .map((item, index) => (
                <ContentTile
                  key={item.slug}
                  item={item}
                  clientId={client.id}
                  index={index}
                  isNewest={index === 0}
                  portalType={portalType}
                />
              ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <p className="text-sm text-center font-body" style={{ color: '#555' }}>
              <span className="font-display" style={{ color: GOLD }}>33</span> Strategies
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
