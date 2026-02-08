'use client';

import { GOLD } from '@/lib/design-tokens';

interface GoldHighlightProps {
  children: React.ReactNode;
}

/**
 * GoldHighlight - Gold text wrapper for "you/your" emphasis
 * Applies gold color and medium font weight.
 */
export function GoldHighlight({ children }: GoldHighlightProps) {
  return (
    <span style={{ color: GOLD, fontWeight: 500 }}>{children}</span>
  );
}

// Shorthand alias for inline use
export const G = GoldHighlight;
