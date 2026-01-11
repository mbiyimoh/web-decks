'use client';

import React from 'react';
import { Task, TaskStatus } from './types';
import { GOLD, GREEN, BG_ELEVATED } from './design-tokens';

interface TrackCardProps {
  title: string;
  subtitle: string;
  color: 'gold' | 'green';
  tasks?: Task[] | null;
  compact?: boolean;
}

const TaskStatusIcon: React.FC<{ status: TaskStatus }> = ({ status }) => {
  if (status === 'done') {
    return <span style={{ color: GREEN, fontSize: 14 }}>✓</span>;
  }
  if (status === 'in-progress') {
    return <span style={{ color: GOLD, fontSize: 10 }}>●</span>;
  }
  return <span style={{ color: '#525252', fontSize: 10 }}>○</span>;
};

export const TrackCard: React.FC<TrackCardProps> = ({
  title,
  subtitle,
  color,
  tasks,
  compact = false,
}) => {
  const borderColor = color === 'gold' ? GOLD : GREEN;

  return (
    <div
      style={{
        flex: 1,
        padding: compact ? 12 : 16,
        background: BG_ELEVATED,
        borderRadius: 10,
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: borderColor,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 14,
          color: '#e5e5e5',
          fontWeight: 500,
          margin: 0,
        }}
      >
        {subtitle}
      </p>

      {tasks && tasks.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasks.map((task, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TaskStatusIcon status={task.status} />
              <span
                style={{
                  fontSize: 13,
                  color: task.status === 'done' ? '#737373' : '#a3a3a3',
                }}
              >
                {task.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackCard;
