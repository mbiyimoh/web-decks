'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';
import { getScoreColor } from '@/lib/clarity-canvas/types';

interface OrbitalViewProps {
  profile: ProfileWithSections;
  scores: ProfileScores;
}

const GOLD = '#D4A84B';
const VIEW_SIZE = 400;
const CENTER = VIEW_SIZE / 2;
const ORBIT_RADIUS_MIN = 80;
const ORBIT_RADIUS_MAX = 160;
const NODE_SIZE_MIN = 32;
const NODE_SIZE_MAX = 56;

export function OrbitalView({ profile, scores }: OrbitalViewProps) {
  const router = useRouter();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Defensive check for empty profile
  if (!profile?.sections || profile.sections.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px] text-zinc-400">
        <p>No profile sections available</p>
      </div>
    );
  }

  // Sort sections by order for consistent positioning
  const sortedSections = [...profile.sections].sort((a, b) => a.order - b.order);

  // Calculate node positions around the center
  const getNodePosition = (index: number, score: number) => {
    const sectionCount = sortedSections.length || 1; // Avoid division by zero
    const angle = (index * (360 / sectionCount) - 90) * (Math.PI / 180); // Start from top, space evenly
    // Distance inversely proportional to score (lower scores closer to center - needs attention)
    const normalizedScore = score / 100;
    const distance =
      ORBIT_RADIUS_MAX - normalizedScore * (ORBIT_RADIUS_MAX - ORBIT_RADIUS_MIN);
    const x = CENTER + Math.cos(angle) * distance;
    const y = CENTER + Math.sin(angle) * distance;
    return { x, y, distance };
  };

  // Calculate node size based on score
  const getNodeSize = (score: number) => {
    const normalized = score / 100;
    return NODE_SIZE_MIN + normalized * (NODE_SIZE_MAX - NODE_SIZE_MIN);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex justify-center"
    >
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="w-full max-w-[400px] h-auto"
      >
        {/* Orbit rings (decorative) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_RADIUS_MIN}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={(ORBIT_RADIUS_MIN + ORBIT_RADIUS_MAX) / 2}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_RADIUS_MAX}
          fill="none"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Connection lines from center to nodes */}
        {sortedSections.map((section, index) => {
          const sectionScore = scores.sections[section.key] ?? 0;
          const { x, y } = getNodePosition(index, sectionScore);
          const isHovered = hoveredSection === section.key;

          return (
            <motion.line
              key={`line-${section.id}`}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={isHovered ? GOLD : 'rgba(255,255,255,0.1)'}
              strokeWidth={isHovered ? 2 : 1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            />
          );
        })}

        {/* Center nucleus - overall score */}
        <defs>
          <radialGradient id="nucleusGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.3" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0.1" />
          </radialGradient>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nucleus glow */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={50}
          fill="url(#nucleusGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Nucleus circle */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={40}
          fill="#0a0a0f"
          stroke={GOLD}
          strokeWidth="2"
          filter="url(#goldGlow)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        />

        {/* Overall score text */}
        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          fill={GOLD}
          fontSize="24"
          fontWeight="bold"
          fontFamily="var(--font-display)"
        >
          {scores.overall}%
        </text>
        <text
          x={CENTER}
          y={CENTER + 14}
          textAnchor="middle"
          fill="#888"
          fontSize="10"
          fontFamily="var(--font-body)"
        >
          OVERALL
        </text>

        {/* Section nodes */}
        {sortedSections.map((section, index) => {
          const sectionScore = scores.sections[section.key] ?? 0;
          const { x, y } = getNodePosition(index, sectionScore);
          const nodeSize = getNodeSize(sectionScore);
          const scoreColor = getScoreColor(sectionScore);
          const isHovered = hoveredSection === section.key;

          return (
            <g
              key={section.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSection(section.key)}
              onMouseLeave={() => setHoveredSection(null)}
              onClick={() => router.push(`/clarity-canvas/${section.key}`)}
            >
              {/* Node breathing animation circle */}
              <motion.circle
                cx={x}
                cy={y}
                r={nodeSize / 2 + 4}
                fill="none"
                stroke={scoreColor}
                strokeWidth="1"
                strokeOpacity={0.3}
                initial={{ scale: 0 }}
                animate={{
                  scale: isHovered ? 1.2 : [1, 1.1, 1],
                }}
                transition={{
                  scale: isHovered
                    ? { duration: 0.2 }
                    : { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                }}
              />

              {/* Node circle */}
              <motion.circle
                cx={x}
                cy={y}
                r={nodeSize / 2}
                fill="#0a0a0f"
                stroke={scoreColor}
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{
                  delay: 0.4 + index * 0.1,
                  type: 'spring',
                  stiffness: 200,
                }}
              />

              {/* Section icon */}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize="16"
                style={{ pointerEvents: 'none' }}
              >
                {section.icon}
              </text>

              {/* Label below node */}
              <text
                x={x}
                y={y + nodeSize / 2 + 14}
                textAnchor="middle"
                fill={isHovered ? '#fff' : '#888'}
                fontSize="10"
                fontFamily="var(--font-body)"
                style={{ pointerEvents: 'none' }}
              >
                {section.name}
              </text>

              {/* Score below label */}
              <text
                x={x}
                y={y + nodeSize / 2 + 26}
                textAnchor="middle"
                fill={scoreColor}
                fontSize="11"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
                style={{ pointerEvents: 'none' }}
              >
                {sectionScore}%
              </text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}
