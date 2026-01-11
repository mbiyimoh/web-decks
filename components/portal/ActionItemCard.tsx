'use client';

import React from 'react';
import { ActionItem } from './types';
import { GOLD } from './design-tokens';

interface ActionItemCardProps {
  item: ActionItem;
  showContext?: boolean;
}

export const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, showContext = false }) => {
  const hasLink = item.link && item.link !== '#';

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: showContext ? '16px 20px' : '12px 16px',
    background: 'rgba(212, 168, 75, 0.08)',
    borderRadius: showContext ? 10 : 8,
    border: '1px solid rgba(212, 168, 75, 0.2)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: hasLink ? 'pointer' : 'default',
  };

  const content = (
    <>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: showContext ? 10 : 8 }}>
          <span style={{ color: '#525252', fontSize: showContext ? 14 : 12 }}>○</span>
          <span style={{ fontSize: showContext ? 15 : 14, color: '#e5e5e5', lineHeight: 1.4 }}>
            {item.label}
          </span>
        </div>
        {showContext && item.neededFor && (
          <p
            style={{
              fontSize: 13,
              color: '#737373',
              marginTop: 6,
              marginLeft: 24,
              margin: '6px 0 0 24px',
            }}
          >
            Needed for: <span style={{ color: '#a3a3a3' }}>{item.neededFor}</span>
          </p>
        )}
      </div>
      {hasLink && (
        <span style={{ color: GOLD, fontSize: showContext ? 18 : 16, flexShrink: 0 }}>→</span>
      )}
    </>
  );

  if (hasLink) {
    return (
      <a
        href={item.link}
        style={baseStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212, 168, 75, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(212, 168, 75, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(212, 168, 75, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(212, 168, 75, 0.2)';
        }}
      >
        {content}
      </a>
    );
  }

  return <div style={baseStyles}>{content}</div>;
};

export default ActionItemCard;
