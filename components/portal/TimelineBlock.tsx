'use client';

import React from 'react';
import { TimelineBlock as TimelineBlockData } from './types';
import { GOLD, GREEN, BG_PRIMARY, BG_ELEVATED } from './design-tokens';

interface TimelineBlockProps {
  data: TimelineBlockData;
  color: 'gold' | 'green';
  isCurrent: boolean;
}

export const TimelineBlock: React.FC<TimelineBlockProps> = ({ data, color, isCurrent }) => {
  const borderColor = color === 'gold' ? GOLD : GREEN;
  const bgColor = isCurrent
    ? color === 'gold'
      ? 'rgba(212, 168, 75, 0.1)'
      : 'rgba(74, 222, 128, 0.1)'
    : BG_ELEVATED;

  return (
    <div
      style={{
        flex: 1,
        padding: 16,
        background: bgColor,
        borderRadius: 10,
        borderTop: `3px solid ${data.status === 'upcoming' ? '#3f3f46' : borderColor}`,
        opacity: data.status === 'upcoming' ? 0.6 : 1,
        position: 'relative',
      }}
    >
      {isCurrent && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '2px 8px',
            background: borderColor,
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            color: BG_PRIMARY,
            letterSpacing: '0.05em',
          }}
        >
          NOW
        </div>
      )}

      <p
        style={{
          fontSize: 10,
          color: '#525252',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 4,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Week {data.weeks}
      </p>

      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: data.status === 'upcoming' ? '#a3a3a3' : '#fff',
          marginBottom: 12,
        }}
      >
        {data.phase}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                color: data.status === 'done' ? GREEN : data.status === 'current' ? GOLD : '#525252',
              }}
            >
              {data.status === 'done' ? '✓' : data.status === 'current' ? '●' : '○'}
            </span>
            <span
              style={{
                fontSize: 12,
                color: data.status === 'upcoming' ? '#525252' : '#a3a3a3',
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineBlock;
