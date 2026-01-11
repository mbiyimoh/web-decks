'use client';

import React from 'react';
import { ProjectStatus } from './types';
import { STATUS_COLORS } from './design-tokens';

interface StatusPillProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md' }) => {
  const config = STATUS_COLORS[status] || STATUS_COLORS['on-track'];
  const { label, color, bg } = config;

  const padding = size === 'sm' ? '4px 10px' : '6px 12px';
  const fontSize = size === 'sm' ? 11 : 12;
  const dotSize = size === 'sm' ? 6 : 6;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding,
        background: bg,
        borderRadius: 20,
      }}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: color,
        }}
      />
      <span
        style={{
          fontSize,
          fontWeight: 600,
          color: color,
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default StatusPill;
