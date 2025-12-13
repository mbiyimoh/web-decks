'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ClientEntry, ContentItem } from '@/lib/clients';

interface ContentIndexProps {
  client: ClientEntry;
}

const typeLabels: Record<ContentItem['type'], string> = {
  deck: 'Presentation',
  proposal: 'Proposal',
  document: 'Document',
};

const typeColors: Record<ContentItem['type'], string> = {
  deck: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  proposal: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  document: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
};

export default function ContentIndex({ client }: ContentIndexProps) {
  return (
    <div className="min-h-screen bg-black px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12">
            <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs mb-2">
              Client Portal
            </p>
            <h1 className="text-4xl font-bold text-white font-display">
              {client.name}
            </h1>
          </div>

          <div className="space-y-4">
            {client.content.map((item, index) => (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link
                  href={`/client-portals/${client.id}/${item.slug}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded border mb-3 ${typeColors[item.type]}`}
                      >
                        {typeLabels[item.type]}
                      </span>
                      <h2 className="text-xl font-semibold text-white group-hover:text-zinc-200 transition-colors">
                        {item.title}
                      </h2>
                      {item.description && (
                        <p className="text-zinc-500 text-sm mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors ml-4">
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
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800">
            <p className="text-zinc-600 text-sm text-center">
              33 Strategies
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
