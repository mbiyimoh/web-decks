'use client';

import React from 'react';
import { GOLD, BG_PRIMARY } from './design-tokens';

interface ProgressBarProps {
  current: number;
  total: number;
  variant?: 'continuous' | 'segmented';
  showLabels?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  variant = 'continuous',
  showLabels = false,
}) => {
  if (variant === 'segmented') {
    const segments = Array.from({ length: total }, (_, i) => i + 1);

    return (
      <div>
        <div style={{ display: 'flex', gap: 4, marginBottom: showLabels ? 8 : 0 }}>
          {segments.map((week) => (
            <div
              key={week}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: week <= current ? GOLD : '#27272a',
                opacity: week <= current ? 1 : 0.5,
              }}
            />
          ))}
        </div>
        {showLabels && (
          <div style={{ display: 'flex', gap: 4, paddingTop: 4 }}>
            {segments.map((week) => (
              <span
                key={week}
                style={{
                  flex: 1,
                  fontSize: 10,
                  color: week === current ? GOLD : '#525252',
                  fontWeight: week === current ? 600 : 400,
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'center',
                }}
              >
                {week}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Continuous variant
  const progress = (current / total) * 100;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          height: 4,
          background: '#27272a',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD} 100%)`,
            borderRadius: 2,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: `${progress}%`,
          top: -4,
          transform: 'translateX(-50%)',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: GOLD,
          border: `2px solid ${BG_PRIMARY}`,
        }}
      />
    </div>
  );
};

export default ProgressBar;
