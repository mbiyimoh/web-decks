'use client';

import React from 'react';
import {
  CompletedDeliverable,
  InProgressDeliverable,
  UpcomingDeliverable,
  DeliverableType,
} from './types';
import { GOLD, GOLD_DIM, GREEN } from './design-tokens';

interface DeliverableRowProps {
  item: CompletedDeliverable | InProgressDeliverable | UpcomingDeliverable;
  type: DeliverableType;
}

// Type guards for different deliverable types
const isCompleted = (d: DeliverableRowProps['item']): d is CompletedDeliverable =>
  'date' in d && !('estimate' in d);
const isInProgress = (d: DeliverableRowProps['item']): d is InProgressDeliverable =>
  'estimate' in d;

export const DeliverableRow: React.FC<DeliverableRowProps> = ({ item, type }) => {
  const statusIcon = type === 'completed' ? '✓' : type === 'inProgress' ? '●' : '○';
  const statusColor = type === 'completed' ? GREEN : type === 'inProgress' ? GOLD : '#525252';

  const dateOrWeek = isCompleted(item)
    ? item.date
    : isInProgress(item)
      ? item.estimate
      : (item as UpcomingDeliverable).week;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: type === 'inProgress' ? 'rgba(212, 168, 75, 0.05)' : 'transparent',
        borderRadius: 8,
        borderBottom: '1px solid #1a1a1a',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <span style={{ color: statusColor, fontSize: 12 }}>{statusIcon}</span>
        <span
          style={{
            fontSize: 14,
            color: type === 'upcoming' ? '#737373' : '#e5e5e5',
          }}
        >
          {item.name}
        </span>
        {isInProgress(item) && item.progress && (
          <span
            style={{
              fontSize: 11,
              color: GOLD,
              padding: '2px 8px',
              background: GOLD_DIM,
              borderRadius: 4,
            }}
          >
            {item.progress}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          style={{
            fontSize: 12,
            color: '#525252',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {dateOrWeek}
        </span>
        {isCompleted(item) && item.link && (
          <a
            href={item.link}
            style={{
              fontSize: 12,
              color: GOLD,
              textDecoration: 'none',
            }}
          >
            View →
          </a>
        )}
      </div>
    </div>
  );
};

export default DeliverableRow;
