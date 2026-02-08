'use client';

import { GOLD, TEXT_MUTED } from '@/components/portal/design-tokens';
import { STAGES } from '@/lib/central-command/utils';

interface StageDotsProps {
  currentIndex: number;
  totalStages?: number;
  showLabel?: boolean;
}

export default function StageDots({
  currentIndex,
  totalStages = 8,
  showLabel = false,
}: StageDotsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Dots row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        {Array.from({ length: totalStages }).map((_, index) => (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: index <= currentIndex ? GOLD : 'transparent',
              border:
                index <= currentIndex
                  ? 'none'
                  : `1px solid rgba(212, 165, 74, 0.3)`,
            }}
          />
        ))}
      </div>

      {/* Optional label */}
      {showLabel && (
        <p
          className="font-mono"
          style={{
            fontSize: '12px',
            color: TEXT_MUTED,
            margin: 0,
          }}
        >
          {STAGES[currentIndex]?.name || 'Unknown'}
        </p>
      )}
    </div>
  );
}
