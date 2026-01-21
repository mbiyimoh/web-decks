'use client';

import { ProductStatus } from '@/lib/products';
import { GREEN, GREEN_DIM, BLUE, BLUE_DIM, GOLD, GOLD_DIM } from '@/lib/design-tokens';

const PRODUCT_STATUS_CONFIG = {
  available: {
    color: GREEN,
    bg: GREEN_DIM,
    label: 'AVAILABLE',
  },
  'by-request': {
    color: BLUE,
    bg: BLUE_DIM,
    label: 'BY REQUEST',
  },
  beta: {
    color: GOLD,
    bg: GOLD_DIM,
    label: 'BETA',
  },
} as const;

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const config = PRODUCT_STATUS_CONFIG[status];

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
      style={{ background: config.bg }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
      <span
        className="text-[11px] font-mono font-semibold tracking-wide"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  );
}
