'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';
import { getScoreColor } from '@/lib/clarity-canvas/types';
import { getWeakFields } from '@/lib/clarity-canvas/scoring';
import { ListView } from './ListView';
import { OrbitalView } from './OrbitalView';
import { ViewToggle, type ViewMode } from './ViewToggle';

interface ProfileVisualizationProps {
  profile: ProfileWithSections;
  scores: ProfileScores;
  previousScores?: ProfileScores;
  showScoreAnimation?: boolean;
  onSectionClick?: (sectionKey: string) => void;
}

export function ProfileVisualization({
  profile,
  scores,
  previousScores,
  showScoreAnimation = false,
  onSectionClick,
}: ProfileVisualizationProps) {
  // Default to list on mobile
  const [view, setView] = useState<ViewMode>('list');
  const [displayScores, setDisplayScores] = useState<ProfileScores>(
    showScoreAnimation && previousScores ? previousScores : scores
  );
  const [hasAnimated, setHasAnimated] = useState(!showScoreAnimation);

  // Detect mobile and set default view
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setView(window.innerWidth < 768 ? 'list' : 'orbital');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animate scores if showScoreAnimation is true
  useEffect(() => {
    if (showScoreAnimation && previousScores && !hasAnimated) {
      // Delay then animate to new scores
      const timer = setTimeout(() => {
        setDisplayScores(scores);
        setHasAnimated(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showScoreAnimation, previousScores, scores, hasAnimated]);

  // Calculate improvement
  const improvement =
    showScoreAnimation && previousScores
      ? scores.overall - previousScores.overall
      : 0;

  // Get weakest sections for nudge
  const weakFields = getWeakFields(profile.sections);
  const weakSections = Array.from(new Set(weakFields.slice(0, 3).map((f) => f.sectionName)));

  return (
    <div className="space-y-6">
      {/* Score improvement banner */}
      <AnimatePresence>
        {showScoreAnimation && improvement > 0 && hasAnimated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">
                Foundation score increased by +{improvement}%
              </p>
              <p className="text-zinc-400 text-sm">
                Your profile is getting sharper!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with overall score and view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-zinc-400 text-sm uppercase tracking-wide">
              Overall Score
            </p>
            <motion.p
              key={displayScores.overall}
              initial={showScoreAnimation ? { scale: 1.2 } : false}
              animate={{ scale: 1 }}
              className="text-4xl font-display font-bold"
              style={{ color: getScoreColor(displayScores.overall) }}
            >
              {displayScores.overall}%
            </motion.p>
          </div>
        </div>

        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Visualization */}
      <AnimatePresence mode="wait">
        {view === 'orbital' ? (
          <OrbitalView
            key="orbital"
            profile={profile}
            scores={displayScores}
            onSectionClick={onSectionClick}
          />
        ) : (
          <ListView
            key="list"
            profile={profile}
            scores={displayScores}
            onSectionClick={onSectionClick}
          />
        )}
      </AnimatePresence>

      {/* Weakest sections nudge */}
      {displayScores.overall < 50 && weakSections.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
        >
          <p className="text-zinc-400 text-sm">
            <span className="text-[#D4A84B]">Tip:</span> Focus on{' '}
            <span className="text-white">
              {weakSections.slice(0, 2).join(' and ')}
            </span>{' '}
            to boost your profile score fastest.
          </p>
        </motion.div>
      )}
    </div>
  );
}
