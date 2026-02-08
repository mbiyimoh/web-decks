'use client';

import {
  BG_ELEVATED,
  BG_PRIMARY,
  GOLD,
  TEXT_PRIMARY,
} from '@/components/portal/design-tokens';
import { formatCurrency } from '@/lib/central-command/utils';
import type { ProspectsData } from '@/lib/central-command/types';

interface DashboardHeaderProps {
  stats: ProspectsData['stats'];
  onNewProspect: () => void;
}

export default function DashboardHeader({
  stats,
  onNewProspect,
}: DashboardHeaderProps) {
  const totalPipeline = stats.intentValue + stats.funnelValue;

  return (
    <header
      style={{
        width: '100%',
        backgroundColor: BG_ELEVATED,
        padding: '24px 32px',
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left side: Title and label */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1
          className="font-display"
          style={{
            fontSize: '28px',
            lineHeight: '1.2',
            color: TEXT_PRIMARY,
            margin: 0,
          }}
        >
          CENTRAL COMMAND
        </h1>
        <p
          className="font-mono"
          style={{
            color: GOLD,
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          33 STRATEGIES
        </p>
      </div>

      {/* Right side: Pipeline value and button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <p
          className="font-body"
          style={{
            fontSize: '16px',
            color: TEXT_PRIMARY,
            margin: 0,
          }}
        >
          Total Pipeline: {formatCurrency(totalPipeline)}
        </p>
        <button
          onClick={onNewProspect}
          className="font-body"
          style={{
            backgroundColor: GOLD,
            color: BG_PRIMARY,
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          + New Prospect
        </button>
      </div>
    </header>
  );
}
