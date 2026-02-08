'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';
import { getScoreColor } from '@/lib/clarity-canvas/types';
import { getSectionCompletion, getSubsectionCompletion } from '@/lib/clarity-canvas/scoring';

interface ListViewProps {
  profile: ProfileWithSections;
  scores: ProfileScores;
}

export function ListView({ profile, scores }: ListViewProps) {
  // Defensive check for empty profile
  if (!profile?.sections || profile.sections.length === 0) {
    return (
      <div className="text-center text-zinc-400 py-12">
        <p>No profile sections available</p>
      </div>
    );
  }

  // Sort sections by order
  const sortedSections = [...profile.sections].sort((a, b) => a.order - b.order);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {sortedSections.map((section, index) => {
        const sectionScore = scores.sections[section.key] ?? 0;
        const completion = getSectionCompletion(section);
        const scoreColor = getScoreColor(sectionScore);

        return (
          <Link key={section.id} href={`/clarity-canvas/${section.key}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-700 transition-colors"
            >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <div>
                  <h3 className="text-white font-medium">{section.name}</h3>
                  <p className="text-zinc-500 text-sm">
                    {completion.completed}/{completion.total} fields complete
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="text-2xl font-display font-bold"
                  style={{ color: scoreColor }}
                >
                  {sectionScore}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sectionScore}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: scoreColor }}
              />
            </div>

            {/* Subsections breakdown */}
            <div className="space-y-2">
              {section.subsections
                .sort((a, b) => a.order - b.order)
                .map((subsection) => {
                  const subsectionCompletion = getSubsectionCompletion(subsection);

                  return (
                    <div
                      key={subsection.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-400">{subsection.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${subsectionCompletion.percentage}%` }}
                            transition={{
                              delay: index * 0.1 + 0.5,
                              duration: 0.4,
                            }}
                            className="h-full rounded-full bg-zinc-600"
                          />
                        </div>
                        <span className="text-zinc-500 w-16 text-right">
                          {subsectionCompletion.completed}/{subsectionCompletion.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );
}
